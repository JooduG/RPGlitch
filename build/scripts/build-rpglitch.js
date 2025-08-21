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