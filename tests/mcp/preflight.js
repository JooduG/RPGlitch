#!/usr/bin/env node
const { spawnSync } = require('child_process');

function which(cmd) {
  const bin = process.platform === 'win32' ? `${cmd}.cmd` : cmd;
  const out = spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin], { encoding: 'utf8' });
  return out.status === 0 ? out.stdout.trim() : null;
}

function checkEnv(name) {
  return process.env[name] ? 'OK' : 'MISSING';
}

const checks = [
  { name: 'node', cmd: process.platform === 'win32' ? 'where node' : 'which node' },
  { name: 'npx', exists: !!which('npx') },
  { name: 'uvx', exists: !!which('uvx') },
  { name: 'python', cmd: process.platform === 'win32' ? 'where python' : 'which python' },
  { name: 'SMITHERY_API_KEY', env: checkEnv('SMITHERY_API_KEY') },
  { name: 'SMITHERY_PROFILE', env: checkEnv('SMITHERY_PROFILE') },
  { name: 'CONTEXT7_API_KEY', env: checkEnv('CONTEXT7_API_KEY') }
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

