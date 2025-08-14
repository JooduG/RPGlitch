#!/usr/bin/env node
/**
 * Synchronize ignore lists & config helper files into build/config/.
 * Single source of truth for all ignore patterns lives *in this script*.
 *
 * Files generated/overwritten:
 * - build/config/ignore.eslint.json
 * - build/config/.stylelintignore
 * - build/config/.htmlhintignore
 * - build/config/.markdownlintignore
 *
 * You keep .gitignore in repo root (untouched by this script).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const CONFIG_DIR = path.join(ROOT, 'build', 'config');

fs.mkdirSync(CONFIG_DIR, { recursive: true });

/** ---------- MASTER LISTS (edit here) ---------- */
const SHARED_IGNORES = [
  'node_modules/',
  '.git/',
  '.vscode/',
  '.idea/',
  '.DS_Store',
  'dist/',
  'coverage/',
  'tmp/',
  'temp/',
  '.cache/',
  '**/*.min.*',
  '**/*.map',
];

const ESLINT_EXTRA_IGNORES = [
  'build/output/**',
  'build/local_libs/**',
  'build/scripts/fetch-local-libs.ps1',
  'build/scripts/*.ps1',
  'apps/**/RPGlitch.css',              // built CSS
];

const STYLELINT_EXTRA_IGNORES = [
  'apps/**/RPGlitch.css',              // built CSS
];

const HTMLHINT_EXTRA_IGNORES = [
  'build/output/**',
];

const MARKDOWNLINT_EXTRA_IGNORES = [
  'CHANGELOG.md', // example
];

/** Build each tool’s list */
const ESLINT_IGNORES = [...SHARED_IGNORES, ...ESLINT_EXTRA_IGNORES];
const STYLELINT_IGNORES = [...SHARED_IGNORES, ...STYLELINT_EXTRA_IGNORES];
const HTMLHINT_IGNORES = [...SHARED_IGNORES, ...HTMLHINT_EXTRA_IGNORES];
const MARKDOWNLINT_IGNORES = [...SHARED_IGNORES, ...MARKDOWNLINT_EXTRA_IGNORES];

/** ---------- WRITE HELPERS ---------- */
function writeText(file, content) {
  fs.writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
  console.log(`📝 wrote ${path.relative(ROOT, file)}`);
}

function writeLines(file, lines) {
  writeText(file, lines.filter(Boolean).join('\n'));
}

/** ---------- GENERATE FILES ---------- */
// ESLint: a JSON file consumed by eslint.config.mjs
writeText(
  path.join(CONFIG_DIR, 'ignore.eslint.json'),
  JSON.stringify({ ignorePatterns: ESLINT_IGNORES }, null, 2)
);

// Stylelint ignore
writeLines(path.join(CONFIG_DIR, '.stylelintignore'), STYLELINT_IGNORES);

// HTMLHint ignore (we’ll run htmlhint with cwd=build/config so this file is picked up)
writeLines(path.join(CONFIG_DIR, '.htmlhintignore'), HTMLHINT_IGNORES);

// markdownlint ignore (CLI will be pointed at this path)
writeLines(path.join(CONFIG_DIR, '.markdownlintignore'), MARKDOWNLINT_IGNORES);

console.log('✅ Ignore files synchronized to build/config/');
