#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function loadEnvExports(filePath) {
  const env = {};
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*export\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {
    // ignore
  }
  return env;
}

function which(cmd) {
  const bin = process.platform === 'win32' ? `${cmd}.cmd` : cmd;
  const out = spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin], { encoding: 'utf8' });
  return out.status === 0 ? out.stdout.trim() : null;
}

const ROOT = process.cwd();
const DOTENV = path.join(ROOT, '.env');
const DOTENV_EXPORTS = loadEnvExports(DOTENV);

function checkEnv(name) {
  return (process.env[name] || DOTENV_EXPORTS[name]) ? 'OK' : 'MISSING';
}

const checks = [
  { name: 'node', cmd: process.platform === 'win32' ? 'where node' : 'which node' },
  { name: 'npx', exists: !!which('npx') },
  { name: 'uvx', exists: !!which('uvx') },
  { name: 'python', cmd: process.platform === 'win32' ? 'where python' : 'which python' },
  { name: 'SMITHERY_API_KEY', env: checkEnv('SMITHERY_API_KEY') },
  { name: 'SMITHERY_PROFILE', env: checkEnv('SMITHERY_PROFILE') }
];

console.log('MCP Preflight');
console.log('============');
for (const c of checks) {
  if (typeof c.exists === 'boolean') {
    console.log(`${c.name.padEnd(20)} ${c.exists ? 'OK' : 'NOT FOUND in PATH'}`);
  } else if (c.env) {
    console.log(`${c.name.padEnd(20)} ${c.env}`);
  } else if (c.cmd) {
    const res = spawnSync(c.cmd.split(' ')[0], c.cmd.split(' ').slice(1), { encoding: 'utf8' });
    console.log(`${c.name.padEnd(20)} ${res.status === 0 ? 'OK' : 'NOT FOUND'}`);
  }
}
console.log('\nTip: If uvx is missing, install uv (or switch basic-memory to python -m).\n');
