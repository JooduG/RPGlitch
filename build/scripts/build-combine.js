#!/usr/bin/env node
/* eslint-disable no-unused-vars */
/**
 * Combine key repo areas into Markdown overviews for fast human/AI review.
 * This version reads ignore patterns from the centralized `ignores.master.json`
 * and includes a more robust JSON parser.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const picomatch = require('picomatch');

// --- Configuration ---
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'build', 'output');
const IGNORE_FILE_PATH = path.join(REPO_ROOT, 'build', 'config', 'ignores.master.json');
const TEXT_EXTS = new Set(['.md', '.js', '.mjs', '.json', '.yml', '.yaml', '.html', '.css', '.scss', '.sh', '.ts', '.tsx', '.jsx', '.toml', '.ps1', '.patch']);

/**
 * Reads a JSON file, stripping comments and BOMs first.
 * @param {string} filePath - Path to the JSON file.
 * @returns {object} The parsed JSON object.
 */
function readJson(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    // Strip BOM
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    // Basic comment stripping for JSON
    const jsonString = content;
    return JSON.parse(jsonString);
     
  } catch (_) {
    console.warn(`⚠️  Could not read or parse JSON from ${path.relative(REPO_ROOT, filePath)}. This may affect ignore patterns.`);
    return {}; // Return empty object on failure
  }
}

/**
 * Loads and flattens ignore patterns from the master JSON config.
 * @param {string} filePath - Path to the ignores.master.json file.
 * @returns {string[]} An array of glob patterns.
 */
function loadIgnorePatterns(filePath) {
  const ignores = readJson(filePath);
  const patterns = new Set();
  
  const addPatterns = (source) => {
    if (Array.isArray(source)) {
      source.forEach(p => patterns.add(p));
    } else if (typeof source === 'object' && source !== null) {
      Object.values(source).forEach(addPatterns);
    }
  };

  addPatterns(ignores.gitignore?.patterns);
  addPatterns(ignores.linters);
  addPatterns(ignores.memory?.patterns);
  addPatterns(ignores.ide?.patterns);
  patterns.add('**/node_modules/**'); // Always ignore node_modules

  return [...patterns];
}

const MASTER_IGNORE_PATTERNS = loadIgnorePatterns(IGNORE_FILE_PATH);
const isIgnored = picomatch(MASTER_IGNORE_PATTERNS, { dot: true });

// --- File System Walk ---

function walk(dir, allFiles = []) {
  if (!fs.existsSync(dir)) return allFiles;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(REPO_ROOT, fullPath).replace(/\\/g, '/');

    if (isIgnored(relPath)) continue;

    if (entry.isDirectory()) {
      walk(fullPath, allFiles);
    } else if (entry.isFile() && TEXT_EXTS.has(path.extname(entry.name).toLowerCase())) {
      allFiles.push(relPath);
    }
  }
  return allFiles;
}

// --- Content Aggregation ---

function getGitRecentChanges() {
  try {
    const stdout = execSync('git log --pretty=format:"%h %ad | %s" --date=short --since=\\"1 week ago\\"', {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return stdout.trim();
     
  } catch (_) {
    console.warn('⚠️  Could not get git log for recent changes.');
    return 'Could not retrieve recent changes.';
  }
}

function buildFromList(title, fileList) {
  const lines = [`# ${title}\n`];
  for (const f of fileList) {
    const fullPath = path.join(REPO_ROOT, f);
    lines.push(`

---

## /${f}

`);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const ext = path.extname(f).slice(1) || 'text';
      lines.push('```' + ext, content, '```');
     
    } catch (_) {
      lines.push('Could not read file.');
    }
  }
  return lines.join('');
}

// --- Main Execution ---

(function main() {
  console.log('🔄 Combining project files into Markdown overviews...');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allTextFiles = walk(REPO_ROOT);

  const outputs = [
    { name: 'rules', title: 'Combined Rules', paths: ['rules/'] },
    { name: 'memory', title: 'Combined Memory', paths: ['memory-bank/'] },
    { name: 'docs', title: 'Combined Docs', paths: ['docs/'] },
    { name: 'tests', title: 'Combined Tests', paths: ['tests/'] },
    { name: 'tools', title: 'Combined Tools & Scripts', paths: ['tools/', 'build/scripts/'] },
    { name: 'readmes', title: 'Combined READMEs', globs: ['**/README.md'] },
    { name: 'everything', title: 'Combined Everything', paths: ['.'] },
  ];

  for (const out of outputs) {
    const isGlob = !!out.globs;
    const matcher = isGlob ? picomatch(out.globs, { dot: true }) : null;
    
    const fileList = allTextFiles
      .filter(f => {
        if (isGlob) return matcher(f);
        return out.paths.some(p => f.startsWith(p));
      })
      .sort();

    if (fileList.length > 0) {
      const content = buildFromList(out.title, fileList);
      const outPath = path.join(OUTPUT_DIR, `combined-${out.name}.md`);
      fs.writeFileSync(outPath, content, 'utf8');
      console.log(`✅ Wrote: ${path.relative(REPO_ROOT, outPath)} (${fileList.length} files)`);
    } else {
      console.log(`- Skipping ${out.name}: No files found.`);
    }
  }

  const recentChanges = getGitRecentChanges();
  const recentPath = path.join(OUTPUT_DIR, 'combined-recent-changes.md');
  fs.writeFileSync(recentPath, `# Recent Changes (Last 7 Days)\n\n\
${recentChanges}\
\
`, 'utf8');
  console.log(`✅ Wrote: ${path.relative(REPO_ROOT, recentPath)}`);
  
  console.log('✨ Combination complete.');
})();
