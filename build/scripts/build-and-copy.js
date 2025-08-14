#!/usr/bin/env node
/**
 * Build + copy RPGlitch Perchance bundle to clipboard (Windows-first)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = __dirname;
const OUT_HTML  = path.join(BUILD_DIR, '..', 'output', 'RPGlitch-perchance.html');

function run(cmd, opts = {}) { execSync(cmd, { stdio: 'inherit', ...opts }); }

function sanityCheck(html) {
  const problems = [];
  if (!html.includes('id="bundle-css"')) problems.push('No inlined CSS tag found (bundle-css).');
  if (!html.includes('id="bundle-js-src"')) problems.push('No inlined JS tag found (bundle-js-src).');
  if (/<link[^>]*pico/i.test(html)) problems.push('Pico <link> still present (should be inlined).');
  if (/<script[^>]+src=(['"])(?!https?:|\/\/|local_libs\/)[^'"]+\.js\1/i.test(html)) {
    problems.push('Found leftover local <script src="..."> tag(s).');
  }
  return problems;
}

function copyToClipboard(filePath) {
  const tmp = path.join(BUILD_DIR, 'temp-clipboard.html');
  const html = fs.readFileSync(filePath, 'utf8');

  const issues = sanityCheck(html);
  if (issues.length) {
    console.warn('⚠️  Sanity check warnings:\n - ' + issues.join('\n - '));
  }

  fs.writeFileSync(tmp, html);
  try {
    // Most reliable path on Windows
    execSync(`Get-Content "${tmp}" | Set-Clipboard`, { shell: 'powershell' });
    console.log('✅ Copied to clipboard.');
  } finally {
    try { fs.unlinkSync(tmp); } catch { /* empty */ }
  }
}

(async function main() {
  console.log('🔨 Building RPGlitch…');
  run('node build-perchance.js', { cwd: BUILD_DIR });

  if (!fs.existsSync(OUT_HTML)) {
    console.error(`❌ Built file not found: ${OUT_HTML}`);
    process.exit(1);
  }

  const sizeKB = (fs.statSync(OUT_HTML).size/1024).toFixed(1);
  console.log(`📄 Built: ${OUT_HTML} (${sizeKB} KB)`);

  copyToClipboard(OUT_HTML);

  console.log('\n💡 Paste into Perchance → HTML editor');
})();
