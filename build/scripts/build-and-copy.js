#!/usr/bin/env node

/**
 * Wrapper that:
 *  1) builds the Perchance bundle (build-perchance.js)
 *  2) copies build/output/RPGlitch-perchance.html to the OS clipboard
 *
 * Clipboard support:
 *  - Windows: PowerShell Set-Clipboard (fallback to clip.exe)
 *  - macOS: pbcopy
 *  - Linux/WSL: wl-copy | xclip | xsel (first available)
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD_DIR = path.join(ROOT, 'build');
const OUTPUT_FILE = path.join(BUILD_DIR, 'output', 'RPGlitch-perchance.html');

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

function which(cmd) {
  const isWin = process.platform === 'win32';
  const where = isWin ? 'where' : 'which';
  const out = spawnSync(where, [cmd], { encoding: 'utf8' });
  return out.status === 0;
}

/**
 * Copy a file’s UTF-8 contents to the clipboard with platform-specific tools.
 * Returns true if it looks successful, false otherwise.
 */
function copyFileToClipboard(filePath) {
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Clipboard copy skipped: file not found: ${filePath}`);
    return false;
  }

  // WINDOWS (PowerShell Set-Clipboard → fallback to clip.exe)
  if (isWin) {
    // Prefer Set-Clipboard (PowerShell 5+)
    const psCmd = [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      // Use -LiteralPath to avoid issues with special chars; -Raw to keep the file un-split
      `Get-Content -LiteralPath '${filePath.replace(/'/g, "''")}' -Raw | Set-Clipboard`,
    ];
    const ps = spawnSync('powershell.exe', psCmd, { stdio: 'ignore' });
    if (ps.status === 0) {
      console.log('📋 Copied to clipboard (Windows PowerShell).');
      return true;
    }

    // Fallback: clip.exe (ANSI), still better than nothing
    if (which('clip.exe')) {
      const clip = spawnSync('clip.exe', [], {
        input: fs.readFileSync(filePath, 'utf8'),
        encoding: 'utf8',
        stdio: ['pipe', 'ignore', 'ignore'],
      });
      if (clip.status === 0) {
        console.log('📋 Copied to clipboard (clip.exe fallback).');
        return true;
      }
    }

    return false;
  }

  // macOS: pbcopy
  if (isMac) {
    if (which('pbcopy')) {
      const pb = spawnSync('pbcopy', [], {
        input: fs.readFileSync(filePath, 'utf8'),
        encoding: 'utf8',
        stdio: ['pipe', 'ignore', 'ignore'],
      });
      if (pb.status === 0) {
        console.log('📋 Copied to clipboard (macOS pbcopy).');
        return true;
      }
    }
    return false;
  }

  // LINUX / WSL: try wl-copy, then xclip, then xsel
  const content = fs.readFileSync(filePath, 'utf8');
  if (which('wl-copy')) {
    const wl = spawnSync('wl-copy', [], {
      input: content,
      encoding: 'utf8',
      stdio: ['pipe', 'ignore', 'ignore'],
    });
    if (wl.status === 0) {
      console.log('📋 Copied to clipboard (wl-copy).');
      return true;
    }
  }
  if (which('xclip')) {
    const xc = spawnSync('xclip', ['-selection', 'clipboard'], {
      input: content,
      encoding: 'utf8',
      stdio: ['pipe', 'ignore', 'ignore'],
    });
    if (xc.status === 0) {
      console.log('📋 Copied to clipboard (xclip).');
      return true;
    }
  }
  if (which('xsel')) {
    const xs = spawnSync('xsel', ['--clipboard', '--input'], {
      input: content,
      encoding: 'utf8',
      stdio: ['pipe', 'ignore', 'ignore'],
    });
    if (xs.status === 0) {
      console.log('📋 Copied to clipboard (xsel).');
      return true;
    }
  }

  return false;
}

(function main() {
  try {
    console.log('🔨 Building RPGlitch (wrapper)…');

    // 1) Build perchance bundle (writes build/output/RPGlitch-perchance.html)
    console.log('🔨 Building RPGlitch (perchance)…');
    runNode('build-perchance.js');

    // 2) Verify and copy to clipboard
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log(`✅ Built: ${path.relative(ROOT, OUTPUT_FILE)}`);
      const ok = copyFileToClipboard(OUTPUT_FILE);
      if (!ok) {
        console.warn('⚠️  Clipboard copy failed: no supported clipboard tool detected or command failed.');
      }
    } else {
      console.error(`❌ Build reported success but output file was not found at: ${OUTPUT_FILE}`);
      process.exitCode = 1;
      return;
    }

    console.log('✅ All done.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  }
})();
