#!/usr/bin/env node
/**
 * Run HTMLHint with cwd=build/config so that .htmlhintignore in that folder is used.
 * Passes through args to htmlhint, but rewrites the glob to be relative to repo root.
 *
 * Usage in package.json:
 *  node build/scripts/run-htmlhint.js
 */
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../../..');
const CONFIG_DIR = path.join(ROOT, 'build', 'config');

const userGlob = process.argv[2] || 'apps/**/*.html';
const args = [
  userGlob.startsWith('.') || userGlob.startsWith('..') ? userGlob : path.join('..', '..', userGlob),
  '--config',
  '.htmlhintrc',
];

const res = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['-y', 'htmlhint', ...args], {
  stdio: 'inherit',
  cwd: CONFIG_DIR,
  env: process.env,
});

process.exit(res.status ?? 0);
