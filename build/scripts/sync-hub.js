#!/usr/bin/env node
/**
 * Generate a `hub.md` file for easy repo navigation.
 * This version dynamically creates the repo tree and reads test
 * results from the new location in build/output.
 */

const fs = require('fs');
const path = require('path');
const tree = require('tree-node-cli');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'build', 'output');
const HUB_FILE = path.join(OUTPUT_DIR, 'hub.md');
const JEST_RESULT_FILE = path.join(OUTPUT_DIR, '.jest-result.json'); // Updated path
const PKG_FILE = path.join(REPO_ROOT, 'package.json');

function getRepoTree() {
  return tree(REPO_ROOT, {
    allFiles: false,
    maxDepth: 2,
    exclude: [
      /node_modules/,
      /\.git/,
      /build\/local_libs/,
      /^\.yarn/,
      /^\.idea/,
      /^\.vscode\/extensions\.json/,
      /^\.vscode\/launch\.json/,
    ],
  });
}

function getTestStats() {
  try {
    if (fs.existsSync(JEST_RESULT_FILE)) {
      const results = JSON.parse(fs.readFileSync(JEST_RESULT_FILE, 'utf8'));
      const { numTotalTests, numPassedTests } = results;
      const status = numTotalTests === numPassedTests ? '✅' : '❌';
      return `${status} ${numPassedTests}/${numTotalTests} passed`;
    }
  } catch (e) {
    console.warn('⚠️  Could not read or parse jest result file.');
  }
  return 'No test results found.';
}

function getCombinedDocsLinks() {
  if (!fs.existsSync(OUTPUT_DIR)) return [];
  return fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.startsWith('combined-') && f.endsWith('.md'))
    .map(f => `  - [${f.replace('combined-', '').replace('.md', '')}](/${f})`)
    .join('\n');
}

function getPackageScripts() {
  try {
    const pkg = JSON.parse(fs.readFileSync(PKG_FILE, 'utf8'));
    const scripts = pkg.scripts || {};
    // Filter for top-level, user-facing commands
    const importantScripts = [
      'deploy',
      'test',
      'lint',
      'lint:fix',
      'build',
      'build:copy',
      'sync',
      'clean'
    ];
    return importantScripts
      .filter(key => scripts[key])
      .map(key => `  - \`npm run ${key}\`: ${scripts[key]}`)
      .join('\n');
  } catch (e) {
    console.warn('⚠️  Could not read or parse package.json for scripts.');
    return 'Could not load scripts.';
  }
}

(function main() {
  const content = `
# 🧭 Hub: Repository Overview

Welcome to the central navigation hub for the project.

- **🧪 Tests:** ${getTestStats()}
- **Last updated:** ${new Date().toUTCString()}

---

## 🗺️ Repository Map

\`\`\`
${getRepoTree()}
\`\`\`

---

## 📚 Combined Documentation

Quick links to generated markdown overviews of the repository.

${getCombinedDocsLinks()}

---

## ⚡️ Common Commands

A selection of useful scripts from \`package.json\`.

${getPackageScripts()}
  `;

  fs.writeFileSync(HUB_FILE, content.trim() + '\n', 'utf8');
  console.log(`✅ Hub file generated at: ${path.relative(REPO_ROOT, HUB_FILE)}`);
})();
