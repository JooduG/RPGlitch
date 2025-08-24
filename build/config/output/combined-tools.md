<!-- markdownlint-disable MD032 MD022 MD036 MD024 -->
> **Generated file** — built by `build/scripts/sync-combine.js` at build time.  
> Edit the source docs under `docs/` and `memory-bank/docs/`, not this file.

# Combined Tools (tools/ + build/scripts/)

### Folder summary

- `build/` — 7 files
- `tools/` — 9 files

## Table of Contents

- **build/**
  - [build/scripts/background-htmlhint.js](#buildscriptsbackground-htmlhintjs)
  - [build/scripts/build-and-copy.js](#buildscriptsbuild-and-copyjs)
  - [build/scripts/build-rpglitch.js](#buildscriptsbuild-rpglitchjs)
  - [build/scripts/sync-combine.js](#buildscriptssync-combinejs)
  - [build/scripts/sync-configs.js](#buildscriptssync-configsjs)
  - [build/scripts/sync-hub.js](#buildscriptssync-hubjs)
  - [build/scripts/sync-libs.js](#buildscriptssync-libsjs)
- **tools/**
  - [tools/atomic-class-generator.js](#toolsatomic-class-generatorjs)
  - [tools/css-cleanup.js](#toolscss-cleanupjs)
  - [tools/diagnostics/automation-collect-diagnostics.js](#toolsdiagnosticsautomation-collect-diagnosticsjs)
  - [tools/diagnostics/css-cleanup-report.json](#toolsdiagnosticscss-cleanup-reportjson)
  - [tools/diagnostics/css-performance-analyzer.js](#toolsdiagnosticscss-performance-analyzerjs)
  - [tools/diagnostics/css-performance-report.json](#toolsdiagnosticscss-performance-reportjson)
  - [tools/guard-no-output-edits.js](#toolsguard-no-output-editsjs)
  - [tools/install-busybox.sh](#toolsinstall-busyboxsh)
  - [tools/mcp.json](#toolsmcpjson)

---

<a id="buildscriptsbackground-htmlhintjs"></a>
## build\scripts\background-htmlhint.js

```javascript
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

```

---

<a id="buildscriptsbuild-and-copyjs"></a>
## build\scripts\build-and-copy.js

```javascript
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
const OUTPUT_FILE = path.join(BUILD_DIR, 'output', 'RPGlitch.html');

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

    // 1) Build RPGlitch bundle (writes build/output/RPGlitch.html)
    console.log('🔨 Building RPGlitch…');
    runNode('build-rpglitch.js');

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

```

---

<a id="buildscriptsbuild-rpglitchjs"></a>
## build\scripts\build-rpglitch.js

```javascript
#!/usr/bin/env node
/* Build RPGlitch: inlines CSS/JS, respects Perchance constraints, writes build/output/RPGlitch.html */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const APP_DIR = path.join(ROOT, 'apps', 'rpglitch');
const APP_JS_DIR = path.join(APP_DIR, 'js');
const BUILD_DIR = path.join(ROOT, 'build');
const LOCAL_LIBS_DIR = path.join(BUILD_DIR, 'local_libs');
const OUTPUT_DIR = path.join(BUILD_DIR, 'output');

const OUTPUT_HTML = path.join(OUTPUT_DIR, 'RPGlitch.html');

const LOCAL_LIBS = {
  pico: { file: 'pico.min.css' },
  cash: { file: 'cash.min.js' },
  dexie: { file: 'dexie.js' },
  dompurify: { file: 'purify.min.js' },
  hyperscript: { file: '_hyperscript.min.js' },
};

// --- NEW: resolve helper looks in js/ first, then app root ---
function resolveAppFile(basename) {
  const candidateA = path.join(APP_JS_DIR, basename);
  if (fs.existsSync(candidateA)) return candidateA;
  // All JS files should now be in js/ folder
  return candidateA;
}

// App scripts (keep order: utils → entities → entity-form → profile-router → RPGlitch)
const APP_JS_FILES = [
  resolveAppFile('utils.js'),
  resolveAppFile('entities.js'),
  resolveAppFile('entity-form.js'),
  resolveAppFile('profile-router.js'),
  resolveAppFile('index.js'),   // ← this now works whether it's in js/ or app root
];

const SRC_HTML = path.join(APP_DIR, 'html', 'index.html');
const ENTRY_SCSS = path.join(APP_DIR, 'scss', 'index.scss');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readFileSafe(filePath, kind, allowEmpty = false) {
  try {
    const buf = fs.readFileSync(filePath);
    if (!allowEmpty && buf.length === 0) {
      console.warn(`⚠️  ${kind} is empty: ${filePath}`);
    }
    return buf.toString('utf8');
  } catch {
    console.warn(`⚠️  Missing ${kind}: ${filePath}`);
    return '';
  }
}

function hasAllLocalLibs() {
  let ok = true;
  for (const key of Object.keys(LOCAL_LIBS)) {
    const p = path.join(LOCAL_LIBS_DIR, LOCAL_LIBS[key].file);
    if (!fs.existsSync(p)) {
      console.warn(`⚠️  Missing ${LOCAL_LIBS[key].file} in local_libs/. Place it at: ${p}`);
      ok = false;
    }
  }
  return ok;
}

function buildScss() {
  if (!fs.existsSync(ENTRY_SCSS)) {
    console.warn(`⚠️  SCSS entry not found (optional): ${ENTRY_SCSS}`);
    return '';
  }
  let sass;
  try {
    sass = require('sass');
  } catch {
    console.warn('⚠️  "sass" module not found. Skipping SCSS compilation.');
    return '';
  }
  try {
    const result = sass.compile(ENTRY_SCSS, {
      style: 'compressed',
      loadPaths: [path.join(APP_DIR, 'scss'), APP_DIR],
    });
    return result.css || '';
  } catch (err) {
    console.error('❌ SCSS compile failed:', err.message);
    return '';
  }
}

function stripTagsForInlining(html) {
  let out = html.replace(/<link[^>]*href=["'][^"']*pico[^"']*["'][^>]*>\s*/gi, '');
  out = out.replace(
    /<script[^>]*\bsrc=(['"])(?!https?:\/\/)[^'"]+\.js\1[^>]*>\s*<\/script>\s*/gi,
    ''
  );
  out = out.replace(/<script>[\s\S]*?App\.initializeWhenReady[\s\S]*?<\/script>\s*/gi, '');
  return out;
}

function injectCss(html, css) {
  if (!css) return html;
  const styleTag = `<style id="rpglitch-inline-css">\n${css}\n</style>`;
  return html.includes('</head>') ? html.replace('</head>', `${styleTag}\n</head>`) : `${styleTag}\n${html}`;
}

function injectJs(html, js) {
  if (!js) return html;
  const wrapped = [
    '<script id="rpglitch-inline-js">',
    '(function(){',
    '  try {',
    js,
    '    if (typeof App !== "undefined" && typeof App.initializeWhenReady === "function") {',
    '      if (document.readyState === "loading") {',
    '        document.addEventListener("DOMContentLoaded", function(){ App.initializeWhenReady(); }, { once: true });',
    '      } else {',
    '        App.initializeWhenReady();',
    '      }',
    '    }',
    '  } catch (err) {',
    '    console.error("App bootstrap failed:", err);',
    '  }',
    '})();',
    '</script>',
  ].join('\n');
  return html.includes('</body>') ? html.replace('</body>', `${wrapped}\n</body>`) : `${html}\n${wrapped}`;
}

function bundleJs() {
  const libs = [
    path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.cash.file),
    path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.dexie.file),
    path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.dompurify.file),
    path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.hyperscript.file),
  ];
  const parts = [];
  for (const p of libs) {
    const code = readFileSafe(p, 'local lib JS', true);
    if (code) parts.push(`/* ${path.basename(p)} */\n${code}\n`);
  }
  for (const p of APP_JS_FILES) {
    const code = readFileSafe(p, `app script ${path.basename(p)}`, true);
    if (code) parts.push(`/* ${path.basename(p)} */\n${code}\n`);
  }
  return parts.join('\n');
}

(function main() {
  console.log('🔨 Building RPGlitch…');
  ensureDir(LOCAL_LIBS_DIR);
  ensureDir(OUTPUT_DIR);

  const htmlSrc = readFileSafe(SRC_HTML, 'source HTML');
  if (!htmlSrc) {
    console.error(`❌ Source HTML not found at ${SRC_HTML}`);
    process.exitCode = 1;
    return;
  }

  if (!hasAllLocalLibs()) {
    console.warn('⚠️  Some local libs are missing; build will continue but UI/runtime may be degraded.');
  }
  const picoCss = readFileSafe(path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.pico.file), 'pico.min.css', true);
  const compiledScss = buildScss();
  const combinedCss = [picoCss, compiledScss].filter(Boolean).join('\n\n');

  const jsBundle = bundleJs();

  let finalHtml = stripTagsForInlining(htmlSrc);
  finalHtml = injectCss(finalHtml, combinedCss);
  finalHtml = injectJs(finalHtml, jsBundle);

  fs.writeFileSync(OUTPUT_HTML, finalHtml, 'utf8');
  console.log(`✅ Built: ${path.relative(ROOT, OUTPUT_HTML)}`);
})();
```

---

<a id="buildscriptssync-combinejs"></a>
## build\scripts\sync-combine.js

```javascript
/* build/scripts/combine-views.js
 * Combine key repo areas into Markdown overviews for fast human/AI review.
 * Outputs → build/output/*.md
 *
 * This version:
 *  - **does not** create INDEX.md (delete yours once; it won’t come back)
 *  - keeps a merged hub at build/output/hub.md:
 *      quick links + Mermaid repo tree + curated overview body
 *  - treats docs/rules as OPTIONAL (no warning if missing)
 *  - prepends a generated-file banner to each output
 *
 * Env knobs:
 *   COMBINE_MAX_BYTES          (default: 250000)
 *   COMBINE_RECENT_SINCE_DAYS  (default: 7)
 *   COMBINE_RECENT_LIMIT       (default: 100)
 *   COMBINE_IGNORE_FILE        (default: config/ignore.master)
 *   COMBINE_TREE_DEPTH         (default: 2)
 *   COMBINE_TREE_MAX_NODES     (default: 200)
 *   COMBINE_DEBUG=1            (log files ignored by master ignore)
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const picomatch = require('picomatch');

// -------- config --------
const REPO_ROOT  = path.join(__dirname, '..', '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

const MAX_BYTES          = Number(process.env.COMBINE_MAX_BYTES || 250_000);
const RECENT_SINCE_DAYS  = Number(process.env.COMBINE_RECENT_SINCE_DAYS || 7);
const RECENT_LIMIT       = Number(process.env.COMBINE_RECENT_LIMIT || 100);
// const TREE_DEPTH         = Number(process.env.COMBINE_TREE_DEPTH || 2);
// const TREE_MAX_NODES     = Number(process.env.COMBINE_TREE_MAX_NODES || 200);

const TEXT_EXTS = new Set([
  '.md', '.mdx', '.mdc',
  '.js', '.mjs', '.cjs', '.ts',
  '.json', '.yml', '.yaml',
  '.html', '.css', '.scss',
  '.sh'
]);

// -------- master ignore (single source of truth for this combiner) --------
const IGNORE_FILE = process.env.COMBINE_IGNORE_FILE || path.join(REPO_ROOT, 'config', 'ignore.master');

function loadIgnorePatterns(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('#'));
  } catch {
    return [];
  }
}
const MASTER_IGNORE = loadIgnorePatterns(IGNORE_FILE);
const _toPosix = p => p.split(path.sep).join('/');
const MATCHERS = MASTER_IGNORE
  .filter(p => !p.startsWith('!'))
  .map(p => picomatch(p));
function isIgnored(relPath) {
  const posix = _toPosix(relPath);
  return MATCHERS.some(fn => fn(posix));
}
const DEBUG_IGNORE = process.env.COMBINE_DEBUG === '1';

// -------- targets to build --------
const TARGETS = [
  {
    name: 'rules',
    title: 'Combined Rules',
    // Canonical rules live in `rules/`; additionally include any *.md with YAML front matter anywhere.
    sources: ['rules'],
    excludeDirs: new Set(['node_modules']),
    output: 'combined-rules.md',
    warnOnMissing: false, // <— silence missing-source warnings for this target
    discoverRules: true
  },
  {
    name: 'memory',
    title: 'Combined Memory Bank (excluding archive/)',
    sources: ['memory-bank'],
    excludeDirs: new Set(['archive', 'node_modules']),
    output: 'combined-memory.md'
  },
  {
    name: 'tests',
    title: 'Combined Tests (tests/)',
    sources: ['tests'],
    excludeDirs: new Set(['node_modules']),
    output: 'combined-tests.md'
  },
  {
    name: 'tools',
    title: 'Combined Tools (tools/ + build/scripts/)',
    sources: ['tools', 'build/scripts'],
    excludeDirs: new Set(['node_modules', 'build/output']),
    output: 'combined-tools.md'
  },
  {
    name: 'docs',
    title: 'Combined Docs (docs/)',
    sources: ['docs'],
    output: 'combined-docs.md',
    excludeDirs: new Set(['node_modules', '.git', 'build/output'])
  },
  {
    name: 'readmes',
    title: 'All READMEs across repo',
    sources: ['.'],
    output: 'combined-readmes.md',
    excludeDirs: new Set(['node_modules', '.git', 'build/output']),
    filter: (relPath) => /(^|[\\/])README(\.(md|mdx|mdc))?$/i.test(relPath)
  },
  {
    name: 'combined-other',
    title: 'Combined Other (config files, root files, and miscellaneous)',
    sources: ['.'],
    excludeDirs: new Set([
      'node_modules', 'build/output', '.git', '.cursor',
      'apps', 'build/scripts', 'docs', 'memory-bank', 'tests', 'tools',
      'archive', 'dist', 'coverage', '.nyc_output', '.cache', '.tmp', '.temp'
    ]),
    output: 'combined-other.md',
    filter: (relPath) => {
      // Only include files not covered by other combined files
      const name = relPath.toLowerCase();
      return !relPath.startsWith('apps/') &&
             !relPath.startsWith('build/scripts/') &&
             !relPath.startsWith('docs/') &&
             !relPath.startsWith('memory-bank/') &&
             !relPath.startsWith('tests/') &&
             !relPath.startsWith('tools/') &&
             !relPath.startsWith('rules/') &&
             !name.includes('test') && 
             !name.includes('spec') &&
             !relPath.includes('combined-') &&
             !relPath.includes('hub.md');
    }
  },
  {
    name: 'hub',
    title: 'Repository Hub',
    sources: [],
    excludeDirs: new Set(),
    output: 'hub.md',
    hubOnly: true
  },
  {
    name: 'combined-everything',
    title: 'Combined Everything (entire repo except archive/ & generated dirs)',
    sources: ['.'],
    excludeDirs: new Set([
      'archive',
      'node_modules',
      'build/output',
      '.git',
      '.cursor/.trash',
      'dist',
      'coverage',
      '.nyc_output',
      '.cache',
      '.tmp',
      '.temp'
    ]),
    output: 'combined-everything.md'
  },
  {
    name: 'combined-recent-changes',
    title: `Combined Recent Changes (last ${RECENT_SINCE_DAYS} days, up to ${RECENT_LIMIT} files)`,
    sources: [
      'apps',
      'build/scripts',
      'docs',
      'memory-bank',
      'tests',
      'rules'
    ],
    excludeDirs: new Set(['node_modules', 'build/output', '.git']),
    output: 'combined-recent-changes.md',
    recent: true
  }
];

// -------- helpers --------
function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function isTextFile(file){ return TEXT_EXTS.has(path.extname(file).toLowerCase()); }

function walk(dir, excludeDirs, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(REPO_ROOT, abs);

    const ignored = isIgnored(rel);
    if (DEBUG_IGNORE && ignored) console.warn(`↪ ignored by master: ${rel}`);
    if (ignored) continue;

    if (e.isDirectory()) {
      if (excludeDirs.has(e.name)) continue;
      walk(abs, excludeDirs, out);
    } else if (e.isFile()) {
      if (isTextFile(abs)) out.push(rel);
    }
  }
  return out;
}

function stripFrontmatter(s){ return s.replace(/^---[\s\S]*?---\s*/, ''); }
function demoteHeadings(s){ return s.replace(/^(#+)/gm, '#$1'); }
function languageFromExt(rel){
  const ext = path.extname(rel).toLowerCase();
  switch (ext){
    case '.js': case '.cjs': case '.mjs': return 'javascript';
    case '.ts':  return 'typescript';
    case '.json':return 'json';
    case '.yml': case '.yaml': return 'yaml';
    case '.html':return 'html';
    case '.css': return 'css';
    case '.scss':return 'scss';
    case '.sh':  return 'bash';
    case '.md': case '.mdx': case '.mdc': return 'markdown';
    default:     return '';
  }
}
function humanKB(n){ return (n/1024).toFixed(1) + ' KB'; }

// recent helpers
function gitAvailable(){
  try { cp.execSync('git --version', { stdio: 'ignore' }); return true; }
  catch { return false; }
}
function gitRecentFiles({ sinceDays, limit, includeDirs }){
  const args = [
    '-C', REPO_ROOT,
    'log', `--since=${sinceDays} days ago`,
    '--name-only', '--pretty=format:', '--diff-filter=ACMRT'
  ].concat(includeDirs);
  const cmd = 'git ' + args.map(a => (a.includes(' ') ? `"${a}"` : a)).join(' ');
  let out = '';
  try {
    out = cp.execSync(cmd, { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] });
  } catch {
    return [];
  }
  const lines = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const seen = new Set();
  const files = [];
  for (const rel of lines){
    if (seen.has(rel)) continue;
    const abs = path.join(REPO_ROOT, rel);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile() && isTextFile(abs)){
      seen.add(rel);
      files.push(rel);
      if (files.length >= limit) break;
    }
  }
  return files;
}
function mtimeRecentFiles({ limit, includeDirs, excludeDirs }) {
  const all = [];
  for (const src of includeDirs){
    const abs = path.join(REPO_ROOT, src);
    if (!fs.existsSync(abs)) continue;
    const stack = [abs];
    while (stack.length){
      const dir = stack.pop();
      for (const e of fs.readdirSync(dir, { withFileTypes: true })){
        const a = path.join(REPO_ROOT, path.relative(REPO_ROOT, path.join(dir, e.name)));
        const r = path.relative(REPO_ROOT, a);
        if (e.isDirectory()){
          if (excludeDirs.has(e.name)) continue;
          if (isIgnored(r)) continue;
          stack.push(a);
        } else if (e.isFile() && isTextFile(a)){
          if (isIgnored(r)) continue;
          all.push({ rel: r, mtime: fs.statSync(a).mtimeMs });
        }
      }
    }
  }
  all.sort((a,b) => b.mtime - a.mtime);
  return all.slice(0, limit).map(x => x.rel);
}

// sources hygiene
function splitExistingSources(sources) {
  const existing = [];
  const missing  = [];
  for (const src of sources) {
    const abs = path.join(REPO_ROOT, src);
    if (fs.existsSync(abs)) existing.push(src);
    else missing.push(src);
  }
  return { existing, missing };
}

// markdown builder
function buildFromList({ title, files }) {
  let out =
    `<!-- markdownlint-disable MD032 MD022 MD036 MD024 -->\n` +
    `> **Generated file** — built by \`build/scripts/sync-combine.js\` at build time.  \n` +
    `> Edit the source docs under \`docs/\` and \`memory-bank/docs/\`, not this file.\n\n` +
    `# ${title}\n\n`;

  const folderCounts = {};
  for (const rel of files) {
    const top = (rel.split(path.sep)[0] || '.');
    folderCounts[top] = (folderCounts[top] || 0) + 1;
  }
  if (Object.keys(folderCounts).length > 1) {
    out += '### Folder summary\n\n';
    for (const top of Object.keys(folderCounts).sort()) {
      out += `- \`${top}/\` — ${folderCounts[top]} files\n`;
    }
    out += `\n`;
  }

  out += `## Table of Contents\n\n`;
  const groups = {};
  for (const rel of files) {
    const top = (rel.split(path.sep)[0] || '.');
    (groups[top] ??= []).push(rel);
  }
  for (const top of Object.keys(groups).sort()) {
    out += `- **${top}/**\n`;
    for (const rel of groups[top]) {
      const label = rel.replace(/\\/g, '/');
      const id = safeAnchor(rel);
      out += `  - [${label}](#${id})\n`;
    }
  }
  out += `\n---\n`;

  for (const rel of files) {
    const abs = path.join(REPO_ROOT, rel);
    const { text, size, truncated } = readPreview(abs);
    const ext = path.extname(rel).toLowerCase();
    const lang = languageFromExt(rel);

    const id = safeAnchor(rel);
    out += `\n\n<a id="${id}"></a>\n## ${rel}\n\n`;

    if (ext === '.md' || ext === '.mdx' || ext === '.mdc') {
      const processed = demoteHeadings(stripFrontmatter(text)).trim();
      out += processed + '\n';
    } else {
      out += `\n\`\`\`${lang}\n${text}\n\`\`\`\n`;
    }

    if (truncated) {
      out += `\n> ⚠️ File truncated at ${humanKB(MAX_BYTES)} (full size ${humanKB(size)}). Increase \`COMBINE_MAX_BYTES\` to include more.\n`;
    }
    out += `\n---\n`;
  }
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim() + '\n';
}

function safeAnchor(text) {
  let slug = String(text).toLowerCase().trim();
  slug = slug.replace(/[\\/]+/g, '');
  slug = slug.replace(/\./g, '');
  slug = slug.replace(/[^a-z0-9\s-]/g, '');
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug;
}
function readPreview(abs, max = MAX_BYTES){
  const stat = fs.statSync(abs);
  const truncated = stat.size > max;
  const buf = fs.readFileSync(abs, 'utf8').slice(0, max);
  return { text: buf, size: stat.size, truncated };
}

function hasFrontmatterStart(s) {
  return /^---\s*[\r\n]/.test(s);
}

function readFileFrontmatterFlag(abs) {
  try {
    const chunk = fs.readFileSync(abs, 'utf8').slice(0, 4096);
    return hasFrontmatterStart(chunk);
  } catch {
    return false;
  }
}

function discoverRuleFiles() {
  const exclude = new Set(['node_modules', '.git', 'build', '.cursor', '.amazonq', '.windsurf', 'archive']);
  const all = walk(REPO_ROOT, exclude, []);
  // Filter to markdown only
  const md = all.filter(rel => rel.toLowerCase().endsWith('.md'));
  const candidates = [];
  for (const rel of md) {
    const abs = path.join(REPO_ROOT, rel);
    if (readFileFrontmatterFlag(abs)) candidates.push(rel);
  }
  // Prefer rules/ over others for duplicate basenames
  const pick = new Map();
  for (const rel of candidates.sort()) {
    const base = path.basename(rel).toLowerCase();
    const prev = pick.get(base);
    if (!prev) {
      pick.set(base, rel);
    } else {
      const aIsRules = rel.startsWith('rules/');
      const bIsRules = prev.startsWith('rules/');
      if (aIsRules && !bIsRules) pick.set(base, rel);
    }
  }
  return Array.from(pick.values()).sort();
}

// build one target
function buildOne(target) {
  if (target.hubOnly) {
    // Hub is handled separately by writeCombinedRepoHub
    return {
      name: target.name,
      title: target.title,
      output: target.output,
      path: path.join(OUTPUT_DIR, target.output),
      filesCount: 0,
      sources: [],
      excludeDirs: [],
      recent: false
    };
  }

  const { existing, missing } = splitExistingSources(target.sources);
  const SOURCES = existing.length ? existing : [];

  // Only warn about missing sources if explicitly enabled
  const shouldWarn = target.warnOnMissing === true;
  if (shouldWarn && missing.length) {
    console.warn(`⚠ ${target.name}: missing source dirs -> ${missing.join(', ')}`);
  }

  const start = Date.now();
  let files = [];

  if (target.recent) {
    files = gitAvailable()
      ? gitRecentFiles({
          sinceDays: RECENT_SINCE_DAYS,
          limit: RECENT_LIMIT,
          includeDirs: SOURCES
        })
      : [];
    if (!files.length) {
      files = mtimeRecentFiles({
        limit: RECENT_LIMIT,
        includeDirs: SOURCES,
        excludeDirs: target.excludeDirs || new Set()
      });
    }
  } else {
    if (target.discoverRules) {
      files = discoverRuleFiles();
    } else {
      for (const src of SOURCES) {
        const abs = path.join(REPO_ROOT, src);
        files.push(...walk(abs, target.excludeDirs || new Set()));
      }
      files = Array.from(new Set(files)).sort();
      if (typeof target.filter === 'function') {
        files = files.filter(target.filter);
      }
    }
  }

  ensureDir(OUTPUT_DIR);
  const outfile = path.join(OUTPUT_DIR, target.output);
  const markdown = buildFromList({ title: target.title, files });
  fs.writeFileSync(outfile, markdown, 'utf8');

  const meta = {
    name: target.name,
    title: target.title,
    output: path.basename(outfile),
    path: outfile,
    filesCount: files.length,
    sources: SOURCES,
    excludeDirs: Array.from(target.excludeDirs || new Set()),
    recent: !!target.recent
  };

  console.log(`✔ ${target.name}: ${files.length} files → ${path.relative(REPO_ROOT, outfile)} (${Date.now()-start}ms)`);
  return meta;
}



const { writeHub } = require('./sync-hub');

function writeCombinedRepoHub(built) {
  writeHub(built);
}

// -------- main --------
(function main(){
  const only = process.argv.slice(2); // allow: node combine-views.js rules recent ...
  const selected = only.length ? TARGETS.filter(t => only.includes(t.name)) : TARGETS;
  if (!selected.length){
    console.error(`No targets matched. Use one of: ${TARGETS.map(t => t.name).join(', ')}`);
    process.exit(1);
  }
  const built = selected.map(buildOne);
  if (built.some(b => b.name === 'hub')) writeCombinedRepoHub(built);
})();

```

---

<a id="buildscriptssync-configsjs"></a>
## build\scripts\sync-configs.js

```javascript
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const CONFIG_DIR = path.join(ROOT, 'build', 'config');
const VSCODE_DIR = path.join(ROOT, '.vscode');

// Master sources
const MASTER_IGNORES_PATH = path.join(CONFIG_DIR, 'ignores.master.json');
const MASTER_RULES_DIR = path.join(ROOT, 'rules');
const MASTER_MCP_PATH = path.join(CONFIG_DIR, 'mcp.master.json');

// Ignore targets
const ESLINT_IGNORE_JSON = path.join(CONFIG_DIR, 'ignore.eslint.json');
const STYLELINT_IGNORE_FILE = path.join(CONFIG_DIR, '.stylelintignore');
const HTMLHINT_IGNORE_FILE = path.join(CONFIG_DIR, '.htmlhintignore');
const MARKDOWNLINT_IGNORE_FILE = path.join(CONFIG_DIR, '.markdownlintignore');
const GITIGNORE_FILE = path.join(ROOT, '.gitignore');
const CURSORIGNORE_FILE = path.join(ROOT, '.cursorignore');
const BASICMEMORYIGNORE_FILE = path.join(ROOT, '.basicmemoryignore');
const SETTINGS_PATH = path.join(VSCODE_DIR, 'settings.json');

// IDE config targets
const CURSOR_RULES_DIR = path.join(ROOT, '.cursor', 'rules');
const CURSOR_MCP_PATH = path.join(ROOT, '.cursor', 'mcp.json');
const WINDSURF_RULES_DIR = path.join(ROOT, '.windsurf', 'rules');
const WINDSURF_MCP_PATH = path.join(ROOT, '.windsurf', 'mcp.json');
const AMAZONQ_RULES_DIR = path.join(ROOT, '.amazonq', 'rules');

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return fallback; }
}
function writeText(p, s) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, s, 'utf8');
  console.log('📝 wrote', path.relative(ROOT, p));
}
function writeJson(p, obj) {
  writeText(p, JSON.stringify(obj, null, 2) + '\n');
}
function normalizeGlobs(globs) {
  const out = [];
  for (const g of globs) {
    if (!out.includes(g)) out.push(g);
    const star = g.startsWith('**/') ? g : `**/${g}`;
    if (!out.includes(star)) out.push(star);
  }
  return out;
}

function copyRules(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return;
  
  ensureDir(targetDir);
  const files = fs.readdirSync(sourceDir, { withFileTypes: true });
  
  for (const file of files) {
    // Skip templates folder
    if (file.name === 'templates') continue;
    
    const sourcePath = path.join(sourceDir, file.name);
    const targetPath = path.join(targetDir, file.name);
    
    if (file.isDirectory()) {
      copyRules(sourcePath, targetPath);
    } else if (file.name.endsWith('.md') || file.name.endsWith('.mdc')) {
      const content = fs.readFileSync(sourcePath, 'utf8');
      writeText(targetPath, content);
    }
  }
}

function syncIgnores() {
  const master = readJson(MASTER_IGNORES_PATH, {
    gitignore: [],
    cursorignore: [],
    eslintIgnore: [],
    stylelintIgnore: [],
    htmlhintIgnore: [],
    markdownlintIgnore: [],
    basicmemoryignore: [],
  });

  const mdIgnoreSrc = master.markdownlintignore ?? master.markdownlintIgnore ?? [];

  writeJson(ESLINT_IGNORE_JSON, { ignorePatterns: master.eslintIgnore || [] });
  writeText(STYLELINT_IGNORE_FILE, (master.stylelintIgnore || []).join('\n') + '\n');
  writeText(HTMLHINT_IGNORE_FILE, (master.htmlhintIgnore || []).join('\n') + '\n');

  const mdIgnores = normalizeGlobs(mdIgnoreSrc);
  const header = '# Generated by build/scripts/sync-configs.js – do not edit.\n';
  writeText(MARKDOWNLINT_IGNORE_FILE, header + mdIgnores.join('\n') + '\n');

  ensureDir(VSCODE_DIR);
  const settings = readJson(SETTINGS_PATH, {});
  settings['markdownlint.ignore'] = mdIgnores;
  
  if (master.vscodeFilesExclude?.length) {
    settings['files.exclude'] = {};
    for (const pattern of master.vscodeFilesExclude) {
      settings['files.exclude'][pattern] = true;
    }
  }
  
  writeJson(SETTINGS_PATH, settings);
  console.log('⚙️  VS Code settings.json updated');

  if (master.gitignore?.length) writeText(GITIGNORE_FILE, master.gitignore.join('\n') + '\n');
  if (master.cursorignore?.length) writeText(CURSORIGNORE_FILE, master.cursorignore.join('\n') + '\n');
  if (master.basicmemoryignore?.length) writeText(BASICMEMORYIGNORE_FILE, master.basicmemoryignore.join('\n') + '\n');
}

function syncConfigs() {
  // Sync rules to IDE directories
  if (fs.existsSync(MASTER_RULES_DIR)) {
    copyRules(MASTER_RULES_DIR, CURSOR_RULES_DIR);
    copyRules(MASTER_RULES_DIR, WINDSURF_RULES_DIR);
    copyRules(MASTER_RULES_DIR, AMAZONQ_RULES_DIR);
    console.log('📋 Rules synced to IDE directories');
  }

  // Sync MCP configuration to IDE directories
  const masterMcp = readJson(MASTER_MCP_PATH, null);
  if (masterMcp) {
    writeJson(CURSOR_MCP_PATH, masterMcp);
    writeJson(WINDSURF_MCP_PATH, masterMcp);
    console.log('🔧 MCP configuration synced to IDE directories');
  } else {
    console.log('⚠️  No master MCP configuration found at', path.relative(ROOT, MASTER_MCP_PATH));
  }

}

(function main() {
  syncIgnores();
  syncConfigs();
  console.log('✅ All configurations synchronized (ignores + rules + MCP + IDE settings)');
})();
```

---

<a id="buildscriptssync-hubjs"></a>
## build\scripts\sync-hub.js

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

function getActivityDashboard() {
  const stats = {
    tests: '?/?',
    lint: '?',
    build: '?',
    lastSync: 'Never'
  };

  try {
    // Check if Jest output exists
    const testOutput = execSync('npm test 2>&1', { cwd: REPO_ROOT, encoding: 'utf8' });
    const testMatch = testOutput.match(/(\d+) passed.*?(\d+) total/);
    if (testMatch) stats.tests = `${testMatch[1]}/${testMatch[2]}`;
  } catch { /* empty */ }

  try {
    // Check build output exists
    const buildFile = path.join(REPO_ROOT, 'build/output/RPGlitch-perchance.html');
    stats.build = fs.existsSync(buildFile) ? '✅' : '❌';
  } catch { /* empty */ }

  try {
    // Check last sync time
    const hubFile = path.join(OUTPUT_DIR, 'hub.md');
    if (fs.existsSync(hubFile)) {
      const content = fs.readFileSync(hubFile, 'utf8');
      const timeMatch = content.match(/Generated (\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/); 
      if (timeMatch) {
        const syncTime = new Date(timeMatch[1]);
        const now = new Date();
        const diffHours = Math.floor((now - syncTime) / (1000 * 60 * 60));
        stats.lastSync = diffHours < 1 ? 'Just now' : `${diffHours}h ago`;
      }
    }
  } catch { /* empty */ }

  return `🧪 Tests: ${stats.tests}  🏗️ Build: ${stats.build}  🔄 Last sync: ${stats.lastSync}`;
}

function buildSimpleRepoTree() {
  return `
\`\`\`text
rpglitch/
├── apps/
│   ├── rpglitch/          # Main Perchance app
│   └── imageglitch/       # Image generator app
├── build/
│   ├── scripts/           # Build & sync automation
│   ├── config/            # Linting & tool configs
│   └── output/            # Generated files
├── docs/                  # Project documentation
├── tests/                 # Jest test suites
├── tools/                 # Development utilities
├── memory-bank/           # AI context & knowledge
├── rules/                 # Canonical rules (synced to IDE configs)
├── .cursor/               # Cursor IDE config
├── .windsurf/             # Windsurf IDE config
└── .github/               # GitHub workflows
\`\`\`
`;
}

function buildHub(built) {
  const ts = new Date().toISOString();
  const others = built.filter(b => b.name !== 'hub');

  const navSections = {
    'Core': ['rules', 'docs', 'tests'],
    'Content': ['memory', 'tools', 'combined-other'],
    'Complete': ['combined-everything', 'combined-recent-changes', 'readmes']
  };

  const navLines = [];
  for (const [section, names] of Object.entries(navSections)) {
    const items = names.map(name => others.find(b => b.name === name)).filter(Boolean);
    if (items.length) {
      navLines.push(`**${section}**`);
      items.forEach(b => {
        navLines.push(`• [${b.title.replace('Combined ', '')}](./${b.output})`);
      });
      navLines.push('');
    }
  }

  const dashboard = getActivityDashboard();
  const quickActions = [
    '## Quick Actions',
    '',
    '```bash',
    'npm run sync          # Update all (libs + configs + docs)',
    'npm run deploy        # Full deploy pipeline',
    'npm run test          # Run test suite', 
    'npm run lint:fix      # Fix linting issues',
    'npm run build:copy    # Build & copy to clipboard',
    'npm run sync:hub      # Update this hub',
    '```',
    ''
  ].join('\n');

  const tree = buildSimpleRepoTree();

  return [
    '<!-- markdownlint-disable MD032 MD022 MD036 MD024 -->',
    '# Repository Hub',
    '',
    `> Generated ${ts} by \`build/scripts/sync-hub.js\``,
    '',
    dashboard,
    '',
    navLines.join('\n'),
    quickActions,
    '## Repository Structure',
    tree,
    '## About',
    '',
    'This repository contains RPGlitch, an AI-powered storytelling platform for Perchance.',
    'Use the links above to explore different aspects of the codebase.',
    ''
  ].join('\n');
}

function writeHub(built) {
  const hubPath = path.join(OUTPUT_DIR, 'hub.md');
  const content = buildHub(built);
  
  fs.mkdirSync(path.dirname(hubPath), { recursive: true });
  fs.writeFileSync(hubPath, content, 'utf8');
  console.log(`✔ hub created → ${path.relative(REPO_ROOT, hubPath)}`);
}

// CLI support
if (require.main === module) {
  // When run directly, generate hub from existing combined files
  const outputFiles = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.startsWith('combined-') && f.endsWith('.md'))
    .map(f => ({ 
      name: f.replace('combined-', '').replace('.md', ''), 
      title: f.replace('combined-', '').replace('.md', '').replace(/-/g, ' '),
      output: f 
    }));
  
  writeHub(outputFiles);
}

module.exports = { writeHub };

```

---

<a id="buildscriptssync-libsjs"></a>
## build\scripts\sync-libs.js

```javascript
#!/usr/bin/env node
/* Fetch/refresh local libs into build/local_libs to satisfy Perchance constraints. */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..', '..');
const LOCAL_LIBS_DIR = path.join(ROOT, 'build', 'local_libs');

const SOURCES = [
// Versions pinned intentionally (stable, widely used)
{ url: 'https://unpkg.com/@picocss/pico@2.0.6/css/pico.min.css', file: 'pico.min.css' },
{ url: 'https://unpkg.com/cash-dom@8.1.5/dist/cash.min.js', file: 'cash.min.js' },
{ url: 'https://unpkg.com/dexie@3.2.4/dist/dexie.js', file: 'dexie.js' },
{ url: 'https://unpkg.com/dompurify@3.1.6/dist/purify.min.js', file: 'purify.min.js' },
{ url: 'https://unpkg.com/hyperscript.org@0.9.12/dist/_hyperscript.min.js', file: '_hyperscript.min.js' },
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
      const tmp = `${dest}.tmp`;
      const file = fs.createWriteStream(tmp);
      https.get(url, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
              res.resume();
              return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    fs.renameSync(tmp, dest);
                    resolve();
                  });
              });
          }).on('error', (err) => {
            try { fs.unlinkSync(tmp); } catch { /* empty */ }
            reject(err);
          });
      });
  }

  (async function main() {
    console.log('⬇️  Fetching local libs into build/local_libs …');
    ensureDir(LOCAL_LIBS_DIR);
    for (const { url, file } of SOURCES) {
      const dest = path.join(LOCAL_LIBS_DIR, file);
      try {
        await download(url, dest);
        const size = fs.statSync(dest).size;
        console.log(`✅ ${file} (${size} bytes)`);
        }
        catch (err) {
          console.warn(`⚠️  Failed to fetch ${file} from ${url}: ${err.message}`);
          }
        }
        console.log('✅ Done.');
      })();

```

---

<a id="toolsatomic-class-generatorjs"></a>
## tools\atomic-class-generator.js

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class AtomicClassGenerator {
    constructor(cssFilePath) {
        this.cssFilePath = cssFilePath;
        this.cssContent = fs.readFileSync(cssFilePath, 'utf8');
        this.designTokens = this.extractDesignTokens();
    }

    /**
     * Extract design tokens from CSS variables
     * @returns {Object} Parsed design tokens
     */
    extractDesignTokens() {
        const tokens = {
            spacing: [],
            fontSize: [],
            colors: [],
            borderRadius: []
        };

        // Extract spacing tokens
        const spacingMatches = this.cssContent.match(/--([a-z-]+)-spacing:\s*([^;]+);/g) || [];
        tokens.spacing = spacingMatches.map(match => {
            const [, name, value] = match.match(/--([a-z-]+)-spacing:\s*([^;]+);/);
            return { name, value };
        });

        // Extract font size tokens
        const fontSizeMatches = this.cssContent.match(/--font-size-[a-z0-9-]+:\s*([^;]+);/g) || [];
        tokens.fontSize = fontSizeMatches.map(match => {
            const [, value] = match.match(/--font-size-([a-z0-9-]+):\s*([^;]+);/);
            return { name: `font-size-${value}`, value };
        });

        // Color token extraction
        const colorMatches = this.cssContent.match(/--([a-z-]+)-color:\s*([^;]+);/g) || [];
        tokens.colors = colorMatches.map(match => {
            const [, name, value] = match.match(/--([a-z-]+)-color:\s*([^;]+);/);
            return { name, value };
        });

        // Border radius token extraction
        const borderRadiusMatches = this.cssContent.match(/--([a-z-]+)-border-radius:\s*([^;]+);/g) || [];
        tokens.borderRadius = borderRadiusMatches.map(match => {
            const [, name, value] = match.match(/--([a-z-]+)-border-radius:\s*([^;]+);/);
            return { name, value };
        });

        return tokens;
    }

    /**
     * Generate additional atomic utility classes
     * @returns {string} Generated CSS utility classes
     */
    generateAtomicClasses() {
        let atomicClasses = '/* Dynamically Generated Atomic Utility Classes */\n\n';

        // Spacing utilities
        atomicClasses += '/* Margin Utilities */\n';
        [0, 0.25, 0.5, 1, 1.5, 2].forEach(size => {
            atomicClasses += `.m-${size.toString().replace('.', '-')} { margin: ${size}rem; }\n`;
            atomicClasses += `.mx-${size.toString().replace('.', '-')} { margin-left: ${size}rem; margin-right: ${size}rem; }\n`;
            atomicClasses += `.my-${size.toString().replace('.', '-')} { margin-top: ${size}rem; margin-bottom: ${size}rem; }\n`;
        });

        // Padding utilities
        atomicClasses += '\n/* Padding Utilities */\n';
        [0, 0.25, 0.5, 1, 1.5, 2].forEach(size => {
            atomicClasses += `.p-${size.toString().replace('.', '-')} { padding: ${size}rem; }\n`;
            atomicClasses += `.px-${size.toString().replace('.', '-')} { padding-left: ${size}rem; padding-right: ${size}rem; }\n`;
            atomicClasses += `.py-${size.toString().replace('.', '-')} { padding-top: ${size}rem; padding-bottom: ${size}rem; }\n`;
        });

        // Color utilities
        atomicClasses += '\n/* Color Utilities */\n';
        const colorVariants = ['bg', 'text'];
        this.designTokens.colors.forEach(color => {
            colorVariants.forEach(variant => {
                atomicClasses += `.${variant}-${color.name} { ${variant === 'bg' ? 'background-color' : 'color'}: var(--${color.name}); }\n`;
            });
        });

        // Border radius utilities
        atomicClasses += '\n/* Border Radius Utilities */\n';
        [0, 0.25, 0.5, 1].forEach(size => {
            atomicClasses += `.rounded-${size.toString().replace('.', '-')} { border-radius: ${size}rem; }\n`;
        });

        // Responsive visibility utilities
        atomicClasses += '\n/* Responsive Visibility Utilities */\n';
        ['sm', 'md', 'lg'].forEach(breakpoint => {
            ['hidden', 'block', 'flex', 'inline-block'].forEach(display => {
                atomicClasses += `@media (max-width: ${breakpoint === 'sm' ? 640 : breakpoint === 'md' ? 768 : 1024}px) {\n`;
                atomicClasses += `  .${breakpoint}\\:${display} { display: ${display}; }\n`;
                atomicClasses += `}\n`;
            });
        });

        return atomicClasses;
    }

    /**
     * Append generated atomic classes to CSS file
     * @param {boolean} [writeToFile=false] Whether to write changes back to file
     */
    appendAtomicClasses(writeToFile = false) {
        const generatedClasses = this.generateAtomicClasses();
        
        if (writeToFile) {
            fs.appendFileSync(this.cssFilePath, '\n' + generatedClasses);
            console.log(`Atomic classes appended to: ${this.cssFilePath}`);
        }

        return generatedClasses;
    }

    /**
     * Generate a report of generated atomic classes
     * @returns {Object} Report of generated classes
     */
    generateReport() {
        const generatedClasses = this.generateAtomicClasses();
        
        return {
            totalGeneratedClasses: (generatedClasses.match(/\./g) || []).length,
            classTypes: {
                margin: (generatedClasses.match(/\.m-/g) || []).length,
                padding: (generatedClasses.match(/\.p-/g) || []).length,
                color: (generatedClasses.match(/\.(bg|text)-/g) || []).length,
                borderRadius: (generatedClasses.match(/\.rounded-/g) || []).length,
                responsive: (generatedClasses.match(/@media/g) || []).length
            }
        };
    }

    /**
     * Output generation report
     * @param {boolean} [writeToFile=false] Whether to write report to a file
     */
    outputReport(writeToFile = false) {
        const report = this.generateReport();
        const reportString = JSON.stringify(report, null, 2);

        console.log('Atomic Class Generation Report:');
        console.log(reportString);

        if (writeToFile) {
            const outputPath = path.join(__dirname, 'atomic-class-report.json');
            fs.writeFileSync(outputPath, reportString);
            console.log(`\nReport saved to: ${outputPath}`);
        }
    }
}

// Run generator if script is called directly
if (require.main === module) {
    const cssPath = path.join(__dirname, '../RPGlitch/RPGlitch.css');
    const generator = new AtomicClassGenerator(cssPath);
    generator.appendAtomicClasses(true);
    generator.outputReport(true);
}

module.exports = AtomicClassGenerator; 
```

---

<a id="toolscss-cleanupjs"></a>
## tools\css-cleanup.js

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class CSSCleaner {
    constructor(cssFilePath) {
        this.cssFilePath = cssFilePath;
        this.cssContent = fs.readFileSync(cssFilePath, 'utf8');
    }

    /**
     * Remove commented migration notes
     * @returns {string} Cleaned CSS content
     */
    removeMigrationComments() {
        // Remove lines containing "Migrated to atomic class:"
        return this.cssContent.replace(/\/\*\s*Migrated to atomic class:.*?\*\/\s*/g, '');
    }

    /**
     * Identify potentially unused CSS rules
     * @returns {Array} Potentially unused selectors
     */
    findUnusedRules() {
        const unusedRules = [];
        const selectorRegex = /([^{]+)\s*{([^}]+)}/g;
        let match;

        while ((match = selectorRegex.exec(this.cssContent)) !== null) {
            const selector = match[1].trim();
            const properties = match[2].trim();

            // Check for empty or minimal rules
            if (properties.length < 10 || 
                properties.includes('/* empty */') || 
                /^\s*$/.test(properties)) {
                unusedRules.push(selector);
            }
        }

        return unusedRules;
    }

    /**
     * Clean up CSS file
     * @param {boolean} [writeToFile=false] Whether to write changes back to file
     * @returns {string} Cleaned CSS content
     */
    cleanupCSS(writeToFile = false) {
        let cleanedContent = this.removeMigrationComments();
        
        // Additional cleanup steps
        cleanedContent = cleanedContent
            .replace(/\n{3,}/g, '\n\n')  // Reduce multiple newlines
            .replace(/\s+$/gm, '')        // Trim trailing whitespace
            .trim();

        if (writeToFile) {
            fs.writeFileSync(this.cssFilePath, cleanedContent);
            console.log(`CSS file cleaned: ${this.cssFilePath}`);
        }

        return cleanedContent;
    }

    /**
     * Generate cleanup report
     * @returns {Object} Cleanup report
     */
    generateReport() {
        const unusedRules = this.findUnusedRules();

        return {
            unusedRules,
            originalSize: this.cssContent.length,
            cleanedSize: this.cleanupCSS().length,
            sizeReduction: Math.round((1 - this.cleanupCSS().length / this.cssContent.length) * 100)
        };
    }

    /**
     * Output cleanup report
     * @param {boolean} [writeToFile=false] Whether to write report to a file
     */
    outputReport(writeToFile = false) {
        const report = this.generateReport();
        const reportString = JSON.stringify(report, null, 2);

        console.log('CSS Cleanup Report:');
        console.log(reportString);

        if (writeToFile) {
            const outputPath = path.join(__dirname, 'css-cleanup-report.json');
            fs.writeFileSync(outputPath, reportString);
            console.log(`\nReport saved to: ${outputPath}`);
        }
    }
}

// Run cleanup if script is called directly
if (require.main === module) {
    const cssPath = path.join(__dirname, '../RPGlitch/RPGlitch.css');
    const cleaner = new CSSCleaner(cssPath);
    cleaner.cleanupCSS(true);
    cleaner.outputReport(true);
}

module.exports = CSSCleaner; 
```

---

<a id="toolsdiagnosticsautomation-collect-diagnosticsjs"></a>
## tools\diagnostics\automation-collect-diagnostics.js

```javascript
#!/usr/bin/env node
/* eslint-disable */

/**
 * Automation Script: Collect Browser Diagnostics from BrowserTools MCP/Server
 *
 * - Fetches console logs, errors, network logs
 * - Runs accessibility, performance, SEO, and best practices audits
 * - Captures a screenshot
 * - Saves all results to a timestamped folder (JSON and text)
 *
 * Usage: node automation-collect-diagnostics.js
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const SERVER_URL = process.env.BROWSERTOOLS_SERVER_URL || 'http://localhost:3025';
const OUT_DIR = path.join(__dirname, 'diagnostics', new Date().toISOString().replace(/[:.]/g, '-'));

async function fetchAndSave(endpoint, name) {
  try {
    const res = await axios.get(`${SERVER_URL}${endpoint}`);
    const jsonPath = path.join(OUT_DIR, `${name}.json`);
    const txtPath = path.join(OUT_DIR, `${name}.txt`);
    fs.writeFileSync(jsonPath, JSON.stringify(res.data, null, 2));
    fs.writeFileSync(txtPath, typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2));
    console.log(`Saved ${name}`);
  } catch (err) {
    console.error(`Failed to fetch ${name}:`, err.message);
  }
}

async function fetchScreenshot() {
  try {
    const res = await axios.get(`${SERVER_URL}/screenshot`, { responseType: 'arraybuffer' });
    const imgPath = path.join(OUT_DIR, 'screenshot.png');
    fs.writeFileSync(imgPath, res.data);
    console.log('Saved screenshot');
  } catch (err) {
    console.error('Failed to fetch screenshot:', err.message);
  }
}

async function writeSummary() {
  const summary = `Diagnostics Bundle Summary\n========================\n\nCaptured in this bundle:\n- Console logs (console.log, console.warn, console.error)\n- Console errors\n- Network logs (successes and errors)\n- Selected DOM element\n- Accessibility, performance, SEO, and best practices audits\n- Screenshot\n\nNOT captured (DevTools only):\n- Chrome [Violation] warnings (e.g., non-passive event listeners)\n- [DOM] warnings (e.g., password field not in form)\n- Feature policy warnings (e.g., Unrecognized feature: 'ambient-light-sensor')\n\nTo see these, open Chrome DevTools > Console.\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'summary.txt'), summary, 'utf8');
  console.log(summary);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Saving diagnostics to', OUT_DIR);

  await fetchAndSave('/console-logs', 'console-logs');
  await fetchAndSave('/console-errors', 'console-errors');
  await fetchAndSave('/network-errors', 'network-errors');
  await fetchAndSave('/network-success', 'network-success');
  await fetchAndSave('/all-xhr', 'all-network-logs');
  await fetchAndSave('/selected-element', 'selected-element');

  await fetchAndSave('/accessibility-audit', 'accessibility-audit');
  await fetchAndSave('/performance-audit', 'performance-audit');
  await fetchAndSave('/seo-audit', 'seo-audit');
  await fetchAndSave('/best-practices-audit', 'best-practices-audit');

  await fetchScreenshot();

  await writeSummary();

  console.log('Diagnostics collection complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 
```

---

<a id="toolsdiagnosticscss-cleanup-reportjson"></a>
## tools\diagnostics\css-cleanup-report.json

```json
{
  "unusedRules": [
    ".top-0",
    ".left-0",
    ".right-0"
  ],
  "originalSize": 100628,
  "cleanedSize": 78929,
  "sizeReduction": 22
}
```

---

<a id="toolsdiagnosticscss-performance-analyzerjs"></a>
## tools\diagnostics\css-performance-analyzer.js

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * CSS Performance Analyzer for RPGlitch Project
 * 
 * Purpose:
 * - Analyze CSS file for performance bottlenecks
 * - Provide insights into selector complexity
 * - Identify potential optimization opportunities
 * 
 * Key Metrics:
 * - Total number of selectors
 * - Selector specificity
 * - Redundant or overly complex selectors
 * - Unused CSS rules
 */
class CSSPerformanceAnalyzer {
    constructor(cssFilePath) {
        this.cssFilePath = cssFilePath;
        this.cssContent = fs.readFileSync(cssFilePath, 'utf8');
    }

    /**
     * Calculate selector specificity
     * @param {string} selector CSS selector to analyze
     * @returns {number} Specificity score
     */
    calculateSpecificity(selector) {
        const idMatches = (selector.match(/#/g) || []).length * 100;
        const classMatches = (selector.match(/\./g) || []).length * 10;
        const elementMatches = (selector.match(/^[a-z]+|\s[a-z]+/g) || []).length;
        return idMatches + classMatches + elementMatches;
    }

    /**
     * Analyze total number of selectors
     * @returns {Object} Selector analysis results
     */
    analyzeTotalSelectors() {
        const selectorRegex = /([^{]+)\s*{/g;
        const selectors = [];
        let match;

        while ((match = selectorRegex.exec(this.cssContent)) !== null) {
            selectors.push(match[1].trim());
        }

        return {
            total: selectors.length,
            selectors: selectors,
            specificityBreakdown: selectors.map(selector => ({
                selector,
                specificity: this.calculateSpecificity(selector)
            })).sort((a, b) => b.specificity - a.specificity)
        };
    }

    /**
     * Identify potentially redundant selectors
     * @returns {Array} Potentially redundant selectors
     */
    findRedundantSelectors() {
        const selectorCounts = {};
        const selectorRegex = /([^{]+)\s*{/g;
        let match;

        while ((match = selectorRegex.exec(this.cssContent)) !== null) {
            const selector = match[1].trim();
            selectorCounts[selector] = (selectorCounts[selector] || 0) + 1;
        }

        return Object.entries(selectorCounts)
            .filter(([_, count]) => count > 1)
            .map(([selector, count]) => ({ selector, count }));
    }

    /**
     * Generate performance report
     * @returns {Object} Comprehensive CSS performance report
     */
    generateReport() {
        const selectorAnalysis = this.analyzeTotalSelectors();
        const redundantSelectors = this.findRedundantSelectors();

        return {
            totalSelectors: selectorAnalysis.total,
            topSpecificSelectors: selectorAnalysis.specificityBreakdown.slice(0, 10),
            redundantSelectors,
            recommendations: [
                'Consider using more utility classes',
                'Reduce selector specificity where possible',
                'Remove unused CSS rules',
                'Use CSS custom properties for consistent theming'
            ]
        };
    }

    /**
     * Output report to console and optionally to a file
     * @param {boolean} [writeToFile=false] Whether to write report to a file
     */
    outputReport(writeToFile = false) {
        const report = this.generateReport();
        const reportString = JSON.stringify(report, null, 2);

        console.log('CSS Performance Analysis Report:');
        console.log(reportString);

        if (writeToFile) {
            const outputPath = path.join(__dirname, 'css-performance-report.json');
            fs.writeFileSync(outputPath, reportString);
            console.log(`\nReport saved to: ${outputPath}`);
        }
    }
}

// Run analysis if script is called directly
if (require.main === module) {
    const cssPath = path.join(__dirname, '../RPGlitch/RPGlitch.css');
    const analyzer = new CSSPerformanceAnalyzer(cssPath);
    analyzer.outputReport(true);
}

module.exports = CSSPerformanceAnalyzer; 
```

---

<a id="toolsdiagnosticscss-performance-reportjson"></a>
## tools\diagnostics\css-performance-report.json

```json
{
  "totalSelectors": 434,
  "topSpecificSelectors": [
    {
      "selector": "/* Color System - Base */\n    --background: #1e1e2e; /* Base */\n    --text-color: #cdd6f4; /* Text */\n    --subtext0-color: #a6adc8; /* Subtext0 */\n    --subtext1-color: #bac2de; /* Subtext1 */\n    --surface0-color: #313244; /* Surface0 / Box Color */\n    --surface1-color: #313244; /* Surface1 - Reduced border prominence */\n    --surface2-color: #45475a; /* Surface2 - Flattened */\n    --overlay0-color: #585b70;\n    \n    /* Color System - Actions */\n    --green-color: #a6e3a1; /* Green / Primary Action */\n    --red-color: #f38ba8;   /* Red / Danger */\n    --blue-color: #89b4fa;  /* Blue / Info */\n    --mauve-color: #cba6f7; /* Mauve */\n    --peach-color: #fab387; /* Peach */\n    --yellow-color: #f9e2af;/* Yellow */\n    \n    /* Color System - Buttons */\n    --primary-action-button-bg: var(--green-color);\n    --primary-action-button-color: var(--background);\n    --secondary-action-button-bg: var(--surface2-color);\n    --secondary-action-button-color: var(--text-color);\n    --danger-bg: var(--red-color);\n    --danger-color: var(--background);\n    --danger-bg-hover: #e67c9c; /* Slightly darker red for hover */\n    --info-bg: var(--blue-color);\n    --info-color: var(--background);\n    \n    /* Color System - UI Elements */\n    --focus-ring-color: rgba(137, 180, 250, 0.25); /* Blue alpha for focus */\n    --focus-border-color: var(--blue-color);\n    --link-color: var(--blue-color);\n    --selected-item-bg: rgba(137, 180, 250, 0.1); /* Blue alpha for selected items */\n    --selected-item-border-color: var(--blue-color);\n    --menu-panel-bg: var(--surface0-color); \n    --menu-panel-border: var(--surface1-color); \n    --menu-item-hover-bg: var(--surface1-color);\n    \n    /* Typography System */\n    --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;\n    --font-weight-normal: 400;\n    --font-weight-medium: 500;\n    --font-weight-bold: 600;\n    --font-size-xs: 0.75rem;   /* 12px */\n    --font-size-sm: 0.875rem;  /* 14px */\n    --font-size-base: 1rem;    /* 16px */\n    --font-size-lg: 1.125rem;  /* 18px */\n    --font-size-xl: 1.25rem;   /* 20px */\n    --font-size-2xl: 1.5rem;   /* 24px */\n    --font-size-3xl: 1.875rem; /* 30px */\n    --font-size-4xl: 2.25rem;  /* 36px */\n    --line-height-tight: 1.25;\n    --line-height-normal: 1.5;\n    --line-height-relaxed: 1.75;\n    \n    /* Spacing & Layout */\n    --top-bar-height: 3.5rem;\n    --border-radius: 8px; \n    --avatar-border-radius: 8px; \n    --chat-avatar-panel-border-radius: 0px; \n    --contextual-menu-width: 320px;\n    \n    /* Shadows */\n    --shadow-sm: 0 1px 1px rgba(0,0,0,0.1);\n    --shadow-md: 0 2px 4px rgba(0,0,0,0.1);\n    --shadow-lg: 0 4px 8px rgba(0,0,0,0.15);\n    \n    /* Transitions */\n    --transition-speed: 0.2s;\n    --transition-easing: ease;\n}\n\nbody, html",
      "specificity": 1706
    },
    {
      "selector": "/* Migrated to atomic class: .flex-grow */\n    /* Migrated to atomic class: .flex */\n    /* Migrated to atomic class: .flex-col */\n    min-width: 0;\n    /* Remove overflow: hidden/auto for profile screens */\n}\n\n#characterFormScreen, #worldFormScreen, \n#characterProfileScreen, #worldProfileScreen,\n#storyProfileScreen, #memoryApplicationScreen",
      "specificity": 645
    },
    {
      "selector": "/* Migrated to atomic class: .flex-shrink-0 */\n            margin: 0 0.5rem;\n            font-size: 0.75em;\n            padding: 0.3rem 0.5rem;\n            min-width: 120px; /* For timer text */\n            opacity: 0;\n            visibility: hidden;\n            transition: opacity 0.2s ease-in-out, visibility 0s linear 0.2s;\n        }\n        \n        #topBar.chat-active:hover #concludeStoryChatBtn:not(.hidden),\n        #concludeStoryChatBtn.ai-active",
      "specificity": 417
    },
    {
      "selector": "display: block;\n    font-size: 0.95em;\n    margin-bottom: 0.4rem;\n    opacity: 0.9;\n    text-align: left;\n    font-weight: 500;\n    color: var(--text-color);\n}\n\n/* Optimize global resets */\nhtml, body, #main, #columnsWrapper, #middleColumn, .middleColumnScreen",
      "specificity": 354
    },
    {
      "selector": "position: absolute;\n    top: 0;\n    left: 0;\n    right: 0;\n    bottom: 0;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    font-size: 0.9em;\n    font-weight: 500;\n    color: var(--background); \n    padding: 0 1rem;\n    text-align: center;\n    animation: notificationFadeIn 0.3s ease;\n}\n\n#topBarLeftContainer, #topBarRightContainer, #topBarDynamicTitleContainer",
      "specificity": 342
    },
    {
      "selector": "font-size: 1.8em; /* Migrated to atomic class: .font-bold */ color: var(--text-color); margin: 0; display: inline-block;\n            padding: 0.35rem 0.75rem; border-radius: var(--border-radius); \n            border: 2px solid transparent; \n            background-color: transparent; \n            min-width: 200px; transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;\n            cursor: text; max-width: 100%; /* Migrated to atomic class: .w-full */ line-height: 1.3; \n            white-space: nowrap; /* Migrated to atomic class: .overflow-hidden */ text-overflow: ellipsis; \n        }\n        #storyboardTitle[contenteditable=\"true\"]:hover,\n        #storyboardTitle:focus",
      "specificity": 336
    },
    {
      "selector": "padding: 0.75rem;\n            font-size: 0.95em;\n          }\n        }\n\n/* CONSOLIDATED PROFILE CSS RULES - START */\n\n/* Global Layout Resets for Profile Screen */\nhtml, body, #main, #columnsWrapper, #middleColumn, .middleColumnScreen",
      "specificity": 335
    },
    {
      "selector": "flex-basis: 280px; /* Migrated to atomic class: .flex-shrink-0 */ /* Migrated to atomic class: .h-full */ background-color: var(--surface0-color); border-radius: 0px; \n            padding: 0; /* Migrated to atomic class: .overflow-hidden */ /* Migrated to atomic class: .flex */ /* Migrated to atomic class: .items-center */ /* Migrated to atomic class: .justify-center */ \n            background-size: cover; background-position: center; background-repeat: no-repeat;\n            box-shadow: var(--shadow-md); border: 0; /* Migrated to atomic class: .relative */ opacity: 0; \n            transform: translateX(-20px) scale(0.95); \n            transition: opacity 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) 0.1s, transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) 0.1s;\n        }\n        #userCharacterDisplayArea",
      "specificity": 324
    },
    {
      "selector": "/* Migrated to atomic class: .w-full */ padding: 0.75rem; font-size: 1em; /* Migrated to atomic class: .flex-shrink-0 */\n            appearance: none; -webkit-appearance: none; -moz-appearance: none;\n            background-image: url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23cdd6f4'%3e%3cpath d='M8 10.75a.5.5 0 0 1-.354-.146l-3-3a.5.5 0 0 1 .708-.708L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3A.5.5 0 0 1 8 10.75Z'/%3e%3c/svg%3e\");\n            background-repeat: no-repeat;\n            background-position: right 0.75rem center;\n            background-size: 1.2em;\n            padding-right: 2.5rem; \n        }\n        .story-board-ingredient-select option[disabled]",
      "specificity": 306
    },
    {
      "selector": "appearance: none;\n    -webkit-appearance: none;\n    -moz-appearance: none;\n    background-image: url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23cdd6f4'%3e%3cpath d='M8 10.75a.5.5 0 0 1-.354-.146l-3-3a.5.5 0 0 1 .708-.708L8 9.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3A.5.5 0 0 1 8 10.75Z'/%3e%3c/svg%3e\");\n    background-repeat: no-repeat;\n    background-position: right 0.75rem center;\n    background-size: 1.2em;\n    padding-right: 2.5rem;\n}\n\n/* Remove commented migration notes and clean up */\n.storyboard-label",
      "specificity": 273
    }
  ],
  "redundantSelectors": [
    {
      "selector": "/* Migrated to atomic class: .flex */\n    /* Migrated to atomic class: .justify-center */\n    /* Migrated to atomic class: .items-center */\n    /* Migrated to atomic class: .w-full */\n    height: 300px;\n    /* Migrated to atomic class: .overflow-hidden */\n}\n\n.profile-avatar-container .profile-pic-large",
      "count": 2
    },
    {
      "selector": "opacity: 1;\n}\n\n.premade-tag",
      "count": 3
    }
  ],
  "recommendations": [
    "Consider using more utility classes",
    "Reduce selector specificity where possible",
    "Remove unused CSS rules",
    "Use CSS custom properties for consistent theming"
  ]
}
```

---

<a id="toolsguard-no-output-editsjs"></a>
## tools\guard-no-output-edits.js

```javascript
// blocks any attempt to commit or “patch” build/output files
const { execSync } = require('node:child_process');

function getChangedFiles() {
  try {
    // works both in staged and dirty states
    const diff = execSync('git ls-files -m -o --exclude-standard', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
    return diff;
  } catch {
    return [];
  }
}

const changed = getChangedFiles();
const offenders = changed.filter(p => p.startsWith('build/output/'));
if (offenders.length) {
  console.error('\n❌ You changed generated files in build/output/:');
  offenders.forEach(f => console.error(' -', f));
  console.error('\nEdit the source files instead (apps/** or build/scripts/**), then rebuild.\n');
  process.exit(1);
}
console.log('✅ No edits to build/output detected.');

```

---

<a id="toolsinstall-busyboxsh"></a>
## tools\install-busybox.sh

```bash
#!/bin/bash
# Installs busybox on Debian-based systems (e.g., Ubuntu).
set -e
sudo apt-get update
sudo apt-get install -y busybox

```

---

<a id="toolsmcpjson"></a>
## tools\mcp.json

```json
{
 "servers": {
  "github": {
   "url": "https://api.githubcopilot.com/mcp/",
   "type": "http"
  },
  "markitdown": {
   "command": "uvx",
   "args": [
    "markitdown-mcp"
   ],
   "type": "stdio"
  },
  "time": {
  "command": "python",
  "args": [
   "-m",
   "mcp_server_time"
  ],
  "autoStart": true,
  "description": "Provides tools to get the current time and date. To start, run: python -m mcp_server_time"
  },
  
  "Context7": {
  "url": "https://mcp.context7.com/mcp",
  "description": "Connects to the remote Context7 service for advanced context-aware capabilities. As a URL-based server, it does not need to be started locally."
  },

  "mcp-sequentialthinking-tools": {
  "command": "npx",
  "args": [
   "-y",
   "mcp-sequentialthinking-tools"
  ],
  "type": "stdio",
  "pollingInterval": 30000,
  "startupTimeout": 30000,
  "restartOnFailure": true,
  "autoStart": true,
  "description": "Provides advanced sequential thinking tools with persistent state. To start, run: npx -y mcp-sequentialthinking-tools"
  },

  "pollinations": {
  "command": "npx",
  "args": [
   "-y",
   "@pollinations/model-context-protocol"
  ],
  "type": "stdio",
  "pollingInterval": 30000,
  "startupTimeout": 30000,
  "restartOnFailure": true,
  "autoStart": true,
  "description": "Provides AI image generation and creative tools through Pollinations services. To start, run: npx -y @pollinations/model-context-protocol"
  },

  "filesystem": {
  "command": "npx",
  "args": [
   "-y",
   "@modelcontextprotocol/server-filesystem",
   "${input}",
   "."
  ],
  "env": {},
  "autoApprove": ["read_file","write_file","list_dir"],
  "autoStart": true,
  "description": "Portable filesystem server"
  },
 
  "playwright": {
  "command": "npx",
  "args": ["-y","@playwright/mcp"],
  "autoApprove": ["open_page","screenshot"],  
  "autoStart": true
  },

  "Toolbox": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y","@smithery/cli@latest","run","@smithery/toolbox","--key","${d7ad75eb-9a3e-4a3a-90ee-83012ed280e6}","--profile","${voluntary-hornet-y52X3F}"],
  "env": {}
  },

  "basic-memory": {
  "command": "uvx",
  "args": ["basic-memory", "mcp"],
  "env": {
   "BASIC_MEMORY_PROJECT_ROOT": "C:/Users/johng/Documents/GitHub/default/memory-bank"
  },

  "autoApprove": [
   "list_projects",
   "list_project_files",
   "memory_bank_read",
   "memory_bank_write",
   "memory_bank_update"
  ],
  "autoStart": true,
  "description": "Basic Memory MCP server for semantic knowledge management."
  } 
 }}

```

---
