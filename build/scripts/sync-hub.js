#!/usr/bin/env node
 
/**
 * Generate a `hub.md` file for easy repo navigation.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'build', 'output');
const HUB_FILE = path.join(OUTPUT_DIR, 'hub.md');
const JEST_RESULT_FILE = path.join(OUTPUT_DIR, '.jest-result.json');
const PKG_FILE = path.join(REPO_ROOT, 'package.json');

function getRepoTree() {
  const exclude = [
    /node_modules/,
    /\.git/,
    /\.codacy/,
    /\.codex/,
    /\.cursor/,
    /\.gemini/,
    /\.github/,
    /\.vscode/,
    /\.windsurf/,
    /build\/local_libs/,
    /^\.yarn/,
    /^\.idea/,
    /memory-bank\/archive/,
    /jules-scratch/,
    /src/,
  ];
  const output = [];
  const hubFileDir = path.join(REPO_ROOT, 'build', 'output');

  function walk(dir, depth) {
    if (depth > 2) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
        .filter(entry => !exclude.some(rx => rx.test(entry.name)))
        .sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });
     
    } catch (_) { return; }

    entries.forEach(entry => {
      const prefix = '  '.repeat(depth) + '- ';
      if (entry.isDirectory()) {
        output.push(prefix + `**${entry.name}/**`);
        walk(path.join(dir, entry.name), depth + 1);
      } else if (entry.name.endsWith('.md')) {
        const fullPath = path.join(dir, entry.name);
        const linkPath = path.relative(hubFileDir, fullPath).replace(/\\/g, '/');
        output.push(prefix + `[${entry.name}](${linkPath})`);
      }
    });
  }

  output.push('## Repository Map');
  walk(REPO_ROOT, 0);
  return output.join('\n');
}

function getTestStats() {
  try {
    if (fs.existsSync(JEST_RESULT_FILE)) {
      const results = JSON.parse(fs.readFileSync(JEST_RESULT_FILE, 'utf8'));
      const { numTotalTests, numPassedTests } = results;
      const status = numTotalTests === numPassedTests ? '✅' : '❌';
      return `${status} ${numPassedTests}/${numTotalTests} passed`;
    }
   
  } catch (_) {
    console.warn('⚠️  Could not read or parse jest result file.');
  }
  return 'No test results found.';
}

function getCombinedDocsLinks() {
  if (!fs.existsSync(OUTPUT_DIR)) return [];
  return fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.startsWith('combined-') && f.endsWith('.md'))
    .map(f => `  - [${f.replace('combined-', '').replace('.md', '')}](./${f})`)
    .join('\n');
}

function getPackageScripts() {
  try {
    const pkg = JSON.parse(fs.readFileSync(PKG_FILE, 'utf8'));
    const scripts = pkg.scripts || {};
    const importantScripts = [
      'deploy',
      'test',
      'lint',
      'lint:fix',
      'build',
      'build:copy',
      'sync',
      'sync:hub',
      'clean'
    ];
    return importantScripts
      .filter(key => scripts[key])
      .map(key => `npm run ${key}
  # ${scripts[key]}`)
      .join('\n\n');
   
  } catch (_) {
    console.warn('⚠️  Could not read or parse package.json for scripts.');
    return 'Could not load scripts.';
  }
}

(function main() {
    const content = `
## 🧭 Hub: Repository Overview

Welcome to the central navigation hub for the project.

- **🧪 Tests:** ${getTestStats()}
- **Last updated:** ${new Date().toUTCString()}

---

## Repository Map

${getRepoTree()}

---

## 📚 Combined Documentation

Quick links to generated markdown overviews of the repository.

${getCombinedDocsLinks()}

---

## ⚡️ Common Commands

A selection of useful scripts from 
package.json
.

${getPackageScripts()}
`;

  fs.writeFileSync(HUB_FILE, content.trim() + '\n', 'utf8');
  console.log(`✅ Hub file generated at: ${path.relative(REPO_ROOT, HUB_FILE)}`);
})();