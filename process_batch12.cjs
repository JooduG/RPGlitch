const fs = require('fs');
const path = require('path');

const extractOutput = JSON.parse(fs.readFileSync('jules-data/batches/extract-output-12.json', 'utf8'));
const batchesData = JSON.parse(fs.readFileSync('jules-data/batches/batches.json', 'utf8'));
const batchInput = batchesData.batches.find(b => b.batchIndex === 12);
const batchImportData = batchInput.batchImportData || {};

const nodes = [];
const edges = [];
const fileCache = {};

for (const file of batchInput.files) {
    let nType = 'file';
    if (file.fileCategory === 'config') nType = 'config';
    else if (file.fileCategory === 'docs' || file.fileCategory === 'markup') nType = 'document';
    else if (file.fileCategory === 'infra') nType = 'service';
    else if (file.fileCategory === 'data') nType = 'table';

    nodes.push({
        id: `file:${file.path}`,
        type: nType,
        name: path.basename(file.path),
        filePath: file.path,
        summary: `Deterministic extraction for ${file.path}`,
        tags: [file.language || 'unknown'],
        complexity: 'simple'
    });

    const imports = batchImportData[file.path] || [];
    for (const imp of imports) {
        edges.push({
            source: `file:${file.path}`,
            target: `file:${imp}`,
            type: "imports"
        });
    }
}

function addEdgeIfUnique(edge) {
    if (!edges.some(e => e.source === edge.source && e.target === edge.target && e.type === edge.type)) {
        edges.push(edge);
    }
}

for (const res of extractOutput.results) {
    const fileId = `file:${res.path}`;

    if (res.functions) {
        for (const fn of res.functions) {
            let fnName = fn.name;
            let targetFilepath = res.path;

            if (res.path === "src/ui/molecules/VisualWing.test.js") {
                if (fnName === "ensureModifiers") {
                    fnName = "sync_modifiers";
                    targetFilepath = "src/ui/molecules/VisualWing.svelte";
                } else if (fnName === "handleCreativeAction") {
                    fnName = "handle_creative_action";
                    targetFilepath = "src/ui/molecules/VisualWing.svelte";
                }
            }

            const fnId = `function:${targetFilepath}#${fnName}`;

            if (!nodes.some(n => n.id === fnId)) {
                nodes.push({
                    id: fnId,
                    type: 'function',
                    name: fnName,
                    filePath: targetFilepath,
                    summary: `Function ${fnName}`,
                    tags: [],
                    complexity: "simple"
                });
            }

            addEdgeIfUnique({
                source: fnId,
                target: `file:${targetFilepath}`,
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
            addEdgeIfUnique({
                source: clsId,
                target: fileId,
                type: "defined_in"
            });

            if (cls.methods) {
                for (const m of cls.methods) {
                    const mId = `function:${res.path}#${m}`;
                    if (!nodes.some(n => n.id === mId)) {
                        nodes.push({
                            id: mId,
                            type: 'function',
                            name: m,
                            filePath: res.path,
                            summary: `Method ${m}`,
                            tags: [],
                            complexity: "simple"
                        });
                        addEdgeIfUnique({
                            source: mId,
                            target: clsId,
                            type: "defined_in"
                        });
                    }
                }
            }
        }
    }

    if (res.callGraph) {
        for (const call of res.callGraph) {
            let callerName = call.caller;
            let callerPath = res.path;

            if (res.path === "src/ui/molecules/VisualWing.test.js") {
                if (callerName === "ensureModifiers") {
                    callerName = "sync_modifiers";
                    callerPath = "src/ui/molecules/VisualWing.svelte";
                } else if (callerName === "handleCreativeAction") {
                    callerName = "handle_creative_action";
                    callerPath = "src/ui/molecules/VisualWing.svelte";
                }
            }

            let callerId = `function:${callerPath}#${callerName}`;
            let callee = call.callee;

            if (callee.includes('(')) {
                callee = callee.split('(')[0].trim();
            }

            if (callee.includes('.')) {
                if (callee.startsWith('this.')) {
                    callee = callee.replace('this.', '');
                } else {
                    const baseName = callee.split('.')[0];
                    const isSystemPrefix = ['app', 'runtime', 'prompt_builder', 'llm_service', 'temporal_engine', 'db', 'busy_fields'].includes(baseName);
                    if (!isSystemPrefix) {
                        try {
                            if (!fileCache[callerPath]) {
                                fileCache[callerPath] = fs.readFileSync(callerPath, 'utf8');
                            }
                            const content = fileCache[callerPath];
                            if (!content.includes(baseName)) continue;
                        } catch (e) { 
                            continue;
                        }
                    }
                }
            }

            let targetId = `function:${callerPath}#${callee}`;

            let isLocal = false;
            // Check original res.functions and res.classes since we are still inside res.callGraph loop
            if (res.functions && res.functions.some(f => f.name === callee)) isLocal = true;
            if (res.classes && res.classes.some(c => c.methods && c.methods.includes(callee))) isLocal = true;

            if (callee === "ensureModifiers" || callee === "handleCreativeAction") isLocal = false;
            if (callee === "sync_modifiers" || callee === "handle_creative_action") {
                isLocal = true;
                targetId = `function:src/ui/molecules/VisualWing.svelte#${callee}`;
            }

            if (!isLocal && !(callee === "sync_modifiers" || callee === "handle_creative_action")) {
               try {
                   // FIX: Use callerPath instead of res.path to resolve imports correctly
                   // for functions mapped to a different file
                   if (!fileCache[callerPath]) {
                       fileCache[callerPath] = fs.readFileSync(callerPath, 'utf8');
                   }
                   const content = fileCache[callerPath];
                   const importRegex = /import\s+[^;]*?\{([^}]+)\}[^;]*?from\s+['"]([^'"]+)['"]/g;
                   let match;
                   let foundModule = null;

                   let baseName = callee.split('.')[0];

                   while ((match = importRegex.exec(content)) !== null) {
                       const importedNames = match[1].split(',').map(s => s.trim().split(' as ')[0]);
                       if (importedNames.includes(baseName)) {
                           foundModule = match[2];
                           break;
                       }
                   }
                   if (!foundModule) {
                       const defaultImportRegex = /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)[^;]*?from\s+['"]([^'"]+)['"]/g;
                       while ((match = defaultImportRegex.exec(content)) !== null) {
                           if (match[1] === baseName) {
                               foundModule = match[2];
                               break;
                           }
                       }
                   }

                   if (foundModule) {
                       if (foundModule === '@intelligence') foundModule = 'src/intelligence/index.js';
                       else if (foundModule === '@utils') foundModule = 'src/ui/utils/index.js';
                       else if (foundModule === '@engine') foundModule = 'src/engine/index.js';
                       else if (foundModule === '@data') foundModule = 'src/data/index.js';
                       else if (foundModule === '@state') foundModule = 'src/state/index.js';
                       else if (foundModule === '@platform') foundModule = 'src/platform/index.js';
                       else if (foundModule === '@media') foundModule = 'src/media/index.js';
                       else if (foundModule === '@atoms') foundModule = 'src/ui/atoms/index.js';
                       else if (foundModule === '@molecules') foundModule = 'src/ui/molecules/index.js';
                       else if (foundModule === '@organisms') foundModule = 'src/ui/organisms/index.js';
                       else if (foundModule.startsWith('.')) {
                           let resDir = path.dirname(callerPath);
                           foundModule = path.join(resDir, foundModule);
                       }

                       if (!foundModule.endsWith('.js') && !foundModule.endsWith('.svelte')) {
                           if (fs.existsSync(foundModule + '.js')) foundModule += '.js';
                           else if (fs.existsSync(foundModule + '/index.js')) foundModule += '/index.js';
                       } else if (foundModule.endsWith('.svelte') && fs.existsSync(foundModule + '.js')) {
                           foundModule += '.js';
                       }

                       foundModule = foundModule.replace(/\\/g, '/');
                       targetId = `function:${foundModule}#${callee}`;
                   } else {
                       targetId = `function:unknown#${callee}`;
                   }
               } catch (e) {
                   targetId = `function:unknown#${callee}`;
               }
            }

            addEdgeIfUnique({
                source: callerId,
                target: targetId,
                type: "calls"
            });
        }
    }
}

for (const file of batchInput.files) {
    if (file.path.endsWith('.test.js')) {
        const prodPath = file.path.replace('.test.js', '.js');
        if (batchInput.files.some(f => f.path === prodPath)) {
            addEdgeIfUnique({
                source: `file:${prodPath}`,
                target: `file:${file.path}`,
                type: "tested_by"
            });
        } else {
            const base = file.path.replace('.test.js', '');
            const possibleProds = [`${base}.js`, `${base}.svelte`, `${base}.svelte.js`];
            for (const p of possibleProds) {
                if (batchInput.files.some(f => f.path === p)) {
                    addEdgeIfUnique({
                        source: `file:${p}`,
                        target: `file:${file.path}`,
                        type: "tested_by"
                    });
                    break;
                }
            }
        }
    }
}

const nodeCount = nodes.length;
const edgeCount = edges.length;

const parts = Math.ceil(Math.max(nodeCount / 60, edgeCount / 120));

if (parts > 1) {
    const nodesPerPart = Math.ceil(nodeCount / parts);
    const edgesPerPart = Math.ceil(edgeCount / parts);

    for (let k = 1; k <= parts; k++) {
        const partNodes = nodes.slice((k - 1) * nodesPerPart, k * nodesPerPart);
        const partEdges = edges.slice((k - 1) * edgesPerPart, k * edgesPerPart);

        const partPath = `jules-data/batches/batch-12-part-${k}.json`;
        fs.writeFileSync(partPath, JSON.stringify({ nodes: partNodes, edges: partEdges }, null, 2));
    }
} else {
    fs.writeFileSync('jules-data/batches/batch-12.json', JSON.stringify({ nodes, edges }, null, 2));
}

console.log(`nodes: ${nodeCount}, edges: ${edgeCount}, parts: ${parts}`);
