import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = process.cwd();
const intermediateDir = path.join(projectRoot, '.understand-anything', 'intermediate');
const batchesPath = path.join(intermediateDir, 'batches.json');
const batchesData = JSON.parse(fs.readFileSync(batchesPath, 'utf8'));

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
    batchImportData: batch.batchImportData || {}
  };
  fs.writeFileSync(inputPath, JSON.stringify(inputData, null, 2));
  
  try {
    execSync(`node "${extractScript}" "${inputPath}" "${outputPath}"`, { 
      stdio: 'inherit', 
      env: { ...process.env, PLUGIN_ROOT: pluginRoot } 
    });
    
    const extraction = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    
    const nodes = [];
    const edges = [];
    
    for (const res of extraction.results) {
      const fileId = `file:${res.path}`;
      // Normalize file category mapping
      let nType = 'file';
      if (res.fileCategory === 'config') nType = 'config';
      else if (res.fileCategory === 'docs' || res.fileCategory === 'markup') nType = 'document';
      else if (res.fileCategory === 'infra') nType = 'service';
      else if (res.fileCategory === 'data') nType = 'table';
      
      nodes.push({
        id: fileId,
        type: nType,
        name: path.basename(res.path),
        filePath: res.path,
        summary: `Deterministic extraction for ${res.path}`,
        tags: [res.language || 'unknown'],
        complexity: "simple"
      });
      
      if (res.functions) {
        for (const fn of res.functions) {
          const fnId = `function:${res.path}#${fn.name}`;
          nodes.push({
            id: fnId,
            type: 'function',
            name: fn.name,
            filePath: res.path,
            summary: `Function ${fn.name}`,
            tags: [],
            complexity: "simple"
          });
          edges.push({
            source: fnId,
            target: fileId,
            type: "defined_in"
          });
        }
      }
      if (res.classes) {
        for (const cls of res.classes) {
          const clsId = `class:${res.path}#${cls.name}`;
          nodes.push({
            id: clsId,
            type: 'class',
            name: cls.name,
            filePath: res.path,
            summary: `Class ${cls.name}`,
            tags: [],
            complexity: "simple"
          });
          edges.push({
            source: clsId,
            target: fileId,
            type: "defined_in"
          });
        }
      }
      
      if (res.callGraph) {
        for (const call of res.callGraph) {
          edges.push({
            source: `function:${res.path}#${call.caller}`,
            target: `function:${res.path}#${call.callee}`,
            type: "calls"
          });
        }
      }
      
      const imports = inputData.batchImportData[res.path] || [];
      for (const imp of imports) {
        if (imp.resolvedPath) {
          edges.push({
            source: fileId,
            target: `file:${imp.resolvedPath}`,
            type: "imports"
          });
        }
      }
      
      // Fallback: Regex-based import parsing for JavaScript/Svelte files
      try {
        const content = fs.readFileSync(res.path, 'utf8');
        const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        
        const aliases = {
          "@platform": "src/platform",
          "@intelligence": "src/intelligence",
          "@engine": "src/engine",
          "@data": "src/data",
          "@state": "src/state",
          "@media": "src/media",
          "@ui": "src/ui",
          "@atoms": "src/ui/atoms",
          "@actions": "src/ui/actions",
          "@motion": "src/ui/motion",
          "@utils": "src/ui/utils",
          "@organisms": "src/ui/organisms",
          "@molecules": "src/ui/molecules",
          "@": "src"
        };
        
        let match;
        const processImport = (importPath) => {
          if (!importPath.startsWith('.') && !importPath.startsWith('@')) return;
          
          let resolved;
          if (importPath.startsWith('@')) {
            let matchedAlias = null;
            for (const [alias, target] of Object.entries(aliases)) {
              if (importPath === alias || importPath.startsWith(alias + '/')) {
                matchedAlias = alias;
                resolved = path.join(projectRoot, target, importPath.slice(alias.length));
                break;
              }
            }
            if (!matchedAlias) return;
          } else {
            const sourceDir = path.dirname(res.path);
            resolved = path.join(sourceDir, importPath);
          }
          
          resolved = resolved.replace(/\\/g, '/');
          let finalPath = null;
          const exts = ['', '.js', '.svelte', '.ts', '.svelte.js', '/index.js', '/index.svelte', '/index.svelte.js'];
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
            let relPath = path.relative(projectRoot, finalPath).replace(/\\/g, '/');
            const targetId = `file:${relPath}`;
            if (!edges.some(e => e.source === fileId && e.target === targetId && e.type === "imports") && fileId !== targetId) {
              edges.push({
                source: fileId,
                target: targetId,
                type: "imports",
                direction: "forward",
                weight: 0.5
              });
            }
          }
        };
        
        while ((match = importRegex.exec(content)) !== null) {
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
    fs.writeFileSync(finalBatchPath, JSON.stringify({ nodes, edges }, null, 2));
    console.log(`[Batch ${batchIndex}] Wrote ${nodes.length} nodes and ${edges.length} edges.`);
    
  } catch (err) {
    console.error(`Error processing batch ${batchIndex}:`, err.message);
  }
}
console.log("Phase 2 local extraction completed.");
