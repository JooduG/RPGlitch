#!/usr/bin/env node

/**
 * Build wrapper:
 * 1) builds the Perchance bundle (build-rpglitch.js)
 * 2) copies build/output/RPGlitch.html to the OS clipboard (skipped in CI)
 *
 * This version uses the 'clipboardy' library for robust, cross-platform clipboard access.
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const clipboardy = require('clipboardy');

const ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_FILE = path.join(ROOT, 'build', 'output', 'RPGlitch.html');

function boolEnv(name) {
  const v = (process.env[name] || '').toString().trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

const IN_CI = boolEnv('CI') || boolEnv('NO_CLIPBOARD');

function runNode(scriptRelPath, args = []) {
  const scriptAbs = path.join(__dirname, scriptRelPath);
  const res = spawnSync(process.execPath, [scriptAbs, ...args], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (res.error) throw res.error;
  if (typeof res.status === 'number' && res.status !== 0) {
    throw new Error(`Command failed: node ${scriptRelPath} (exit ${res.status})`);
  }
}

(function main() {
  try {
    console.log('🔨 Building RPGlitch…');
    runNode('build-rpglitch.js');

    if (!fs.existsSync(OUTPUT_FILE)) {
      console.error(`❌ Build reported success but output file was not found at: ${OUTPUT_FILE}`);
      process.exitCode = 1;
      return;
    }

    const relativePath = path.relative(ROOT, OUTPUT_FILE);
    console.log(`✅ Built: ${relativePath}`);

    if (IN_CI) {
      console.log('CI environment detected: skipping clipboard copy.');
      console.log(`Path to artifact: ${OUTPUT_FILE}`);
      return;
    }

    console.log('📋 Copying to clipboard...');
    const fileContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
    clipboardy.writeSync(fileContent);
    console.log('✅ Copied to clipboard successfully!');

  } catch (err) {
    console.error('❌ An error occurred:', err && err.message ? err.message : err);
    if (err.message && err.message.includes('clipboardy')) {
        console.error('📋 Clipboard copy failed. Please copy the file content manually from:', OUTPUT_FILE);
    }
    process.exitCode = 1;
  }
})();
