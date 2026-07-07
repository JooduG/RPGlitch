import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const projectRoot = process.cwd();
const intermediateDir = path.join(projectRoot, ".understand-anything", "intermediate");
const batchesPath = path.join(intermediateDir, "batches.json");
const batchesData = JSON.parse(fs.readFileSync(batchesPath, "utf8"));
const jsconfig = JSON.parse(fs.readFileSync(path.join(projectRoot, "jsconfig.json"), "utf8"));
const aliasPaths = jsconfig.compilerOptions.paths;

const extractScript = "C:/Users/johng/.gemini/config/plugins/understand-anything/skills/understand/extract-structure.mjs";
const pluginRoot = "C:\\Users\\johng\\.gemini\\config\\plugins\\understand-anything";

console.log(`Processing ${batchesData.batches.length} batches deterministically...`);

for (const batch of batchesData.batches) {
  const batchIndex = batch.batchIndex;
  console.log(`[Batch ${batchIndex}] Extracting structure...`);

  const inputPath = path.join(intermediateDir, `extract-input-${batchIndex}.json`);
  const outputPath = path.join(intermediateDir, `extract-output-${batchIndex}.json`);

  const inputData = {
    projectRoot,
    batchFiles: batch.files,
    batchImportData: batch.batchImportData || {},
  };
  fs.writeFileSync(inputPath, JSON.stringify(inputData, null, 2));

  try {
    execSync(`node "${extractScript}" "${inputPath}" "${outputPath}"`, {
      stdio: "inherit",
      env: { ...process.env, PLUGIN_ROOT: pluginRoot },
    });

    const extraction = JSON.parse(fs.readFileSync(outputPath, "utf8"));

    const nodes = [];
    const edges = [];

    for (const res of extraction.results) {
      const fileId = `file:${res.path}`;
      // Normalize file category mapping
      let nType = "file";
      if (res.fileCategory === "config") nType = "config";
      else if (res.fileCategory === "docs" || res.fileCategory === "markup") nType = "document";
      else if (res.fileCategory === "infra") nType = "service";
      else if (res.fileCategory === "data") nType = "table";

      nodes.push({
        id: fileId,
        type: nType,
        name: path.basename(res.path),
        filePath: res.path,
        summary: `Deterministic extraction for ${res.path}`,
        tags: [res.language || "unknown"],
        complexity: "simple",
      });

      if (res.functions) {
        for (const fn of res.functions) {
          const fnId = `function:${res.path}#${fn.name}`;
          nodes.push({
            id: fnId,
            type: "function",
            name: fn.name,
            filePath: res.path,
            summary: `Function ${fn.name}`,
            tags: [],
            complexity: "simple",
          });
          edges.push({
            source: fnId,
            target: fileId,
            type: "defined_in",
          });
        }
      }
      if (res.classes) {
        for (const cls of res.classes) {
          const clsId = `class:${res.path}#${cls.name}`;
          nodes.push({
            id: clsId,
            type: "class",
            name: cls.name,
            filePath: res.path,
            summary: `Class ${cls.name}`,
            tags: [],
            complexity: "simple",
          });
          edges.push({
            source: clsId,
            target: fileId,
            type: "defined_in",
          });
        }
      }

      if (res.callGraph) {
        for (const call of res.callGraph) {
          edges.push({
            source: `function:${res.path}#${call.caller}`,
            target: `function:${res.path}#${call.callee}`,
            type: "calls",
          });
        }
      }

      const imports = inputData.batchImportData[res.path] || [];
      for (const imp of imports) {
        if (imp.resolvedPath) {
          edges.push({
            source: fileId,
            target: `file:${imp.resolvedPath}`,
            type: "imports",
          });
        }
      }

      // Fallback: Regex-based import parsing for JavaScript/Svelte files
      try {
        const content = fs.readFileSync(res.path, "utf8");
        const importRegex = /import\s+[^;]*?from\s+['"]([^'"]+)['"]/g;
        const sideEffectImportRegex = /import\s+['"]([^'"]+)['"]/g;
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

        const resolveAlias = (importPath) => {
          if (!importPath.startsWith("@")) return null;
          for (const [aliasPattern, targetPaths] of Object.entries(aliasPaths)) {
            if (aliasPattern.endsWith("/*")) {
              const baseAlias = aliasPattern.slice(0, -2);
              if (importPath.startsWith(baseAlias + "/")) {
                const remaining = importPath.slice(baseAlias.length + 1);
                return targetPaths[0].replace("*", remaining);
              }
            } else {
              if (importPath === aliasPattern) {
                return targetPaths[0];
              }
            }
          }
          return null;
        };

        let match;
        const processImport = (importPath) => {
          if (!importPath.startsWith(".") && !importPath.startsWith("@")) return;

          let resolved;
          if (importPath.startsWith("@")) {
            const aliasRes = resolveAlias(importPath);
            if (!aliasRes) return;
            let finalResolved = path.join(projectRoot, aliasRes);

            // Barrel export tracer logic
            // Check if finalResolved is an index.js file
            if (finalResolved.endsWith("index.js") && fs.existsSync(finalResolved)) {
              try {
                const barrelContent = fs.readFileSync(finalResolved, "utf8");
                // Simple heuristic: if the imported string contains pickRandom and barrel exports from engine, route to engine.
                // This is hard to do perfectly statically without a full AST parser, so we use a robust regex fallback.
                const exportRegex = /export\s+(?:\*|{[^}]+})\s+from\s+['"]([^'"]+)['"]/g;
                let bMatch;
                while ((bMatch = exportRegex.exec(barrelContent)) !== null) {
                  const subPath = bMatch[1];
                  if (subPath.startsWith("@")) {
                    const subAlias = resolveAlias(subPath);
                    if (subAlias) {
                      let subFinal = path.join(projectRoot, subAlias);
                      const exts = ["", ".js", ".svelte", ".ts", ".svelte.js", "/index.js", "/index.svelte", "/index.svelte.js"];
                      let resolvedSubFinal = null;
                      for (const ext of exts) {
                        const checkPath = subFinal + ext;
                        if (fs.existsSync(checkPath)) {
                          try {
                            if (fs.statSync(checkPath).isFile()) {
                              resolvedSubFinal = checkPath;
                              break;
                            }
                          } catch (e) {}
                        }
                      }
                      if (resolvedSubFinal) {
                        let relPath = path.relative(projectRoot, resolvedSubFinal).replace(/\\/g, "/");
                        const targetId = `file:${relPath}`;
                        if (!edges.some((e) => e.source === fileId && e.target === targetId && e.type === "imports") && fileId !== targetId) {
                          edges.push({
                            source: fileId,
                            target: targetId,
                            type: "imports",
                            direction: "forward",
                            weight: 0.5,
                          });
                        }
                      }
                    }
                  }
                }
              } catch (e) {}
            }
            resolved = finalResolved;
          } else {
            const sourceDir = path.dirname(res.path);
            resolved = path.join(sourceDir, importPath);
          }

          resolved = resolved.replace(/\\/g, "/");
          let finalPath = null;
          const exts = ["", ".js", ".svelte", ".ts", ".svelte.js", "/index.js", "/index.svelte", "/index.svelte.js"];
          for (const ext of exts) {
            const checkPath = resolved + ext;
            if (fs.existsSync(checkPath)) {
              try {
                if (fs.statSync(checkPath).isFile()) {
                  finalPath = checkPath;
                  break;
                }
              } catch (e) {}
            }
          }

          if (finalPath) {
            let relPath = path.relative(projectRoot, finalPath).replace(/\\/g, "/");
            const targetId = `file:${relPath}`;
            if (!edges.some((e) => e.source === fileId && e.target === targetId && e.type === "imports") && fileId !== targetId) {
              edges.push({
                source: fileId,
                target: targetId,
                type: "imports",
                direction: "forward",
                weight: 0.5,
              });
            }
          }
        };

        while ((match = importRegex.exec(content)) !== null) {
          processImport(match[1]);
        }
        while ((match = sideEffectImportRegex.exec(content)) !== null) {
          processImport(match[1]);
        }
        while ((match = requireRegex.exec(content)) !== null) {
          processImport(match[1]);
        }
      } catch (err) {
        // Ignore read errors
      }
    }

    const finalBatchPath = path.join(intermediateDir, `batch-${batchIndex}.json`);

    const edgeSet = new Set();
    const uniqueEdges = [];
    for (const edge of edges) {
      const edgeStr = `${edge.source}|${edge.target}|${edge.type}`;
      if (!edgeSet.has(edgeStr)) {
        uniqueEdges.push(edge);
        edgeSet.add(edgeStr);
      }
    }
    const edgeCount = uniqueEdges.length;
    fs.writeFileSync(finalBatchPath, JSON.stringify({ nodes, edges: uniqueEdges }, null, 2));

    console.log(`[Batch ${batchIndex}] Wrote ${nodes.length} nodes and ${edgeCount} edges.`);
  } catch (err) {
    console.error(`Error processing batch ${batchIndex}:`, err.message);
  }
}
console.log("Phase 2 local extraction completed.");
