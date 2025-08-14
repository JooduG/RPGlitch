#!/usr/bin/env node
/**
 * RPGlitch single‑file builder (Perchance-ready)
 * - Compiles SCSS from apps/rpglitch/scss (+ Pico CSS from build/local_libs)
 * - Bundles & minifies JS from apps/rpglitch/js
 * - Removes local <script src> & Pico <link> tags
 * - Injects inlined <style>/<script> and writes build/output/RPGlitch-perchance.html
 *
 * Dev deps:  npm i -D sass terser clean-css html-minifier-terser
 */

const fs = require('fs');
const path = require('path');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');
const sass = require('sass');
const { minify: minifyHTML } = require('html-minifier-terser');

// ---- paths (point at apps/rpglitch) ----
const REPO_ROOT   = path.join(__dirname, '..', '..');
const BUILD_DIR   = path.join(__dirname, '..');                // build/
const OUT_DIR     = path.join(BUILD_DIR, 'output');            // build/output
const APP_DIR     = path.join(REPO_ROOT, 'apps', 'rpglitch');  // apps/rpglitch

const SRC_HTML    = path.join(APP_DIR, 'RPGlitch.html');
const OUT_HTML    = path.join(OUT_DIR, 'RPGlitch-perchance.html');

// Accept Pico CSS from either location; prefer build/local_libs
const LIB_DIRS    = [
  path.join(BUILD_DIR, 'local_libs'),
  path.join(__dirname, 'local_libs')
];

// Where SCSS may live
const SCSS_DIRS   = [
  path.join(APP_DIR, 'scss'),
  path.join(APP_DIR, 'SCSS')
];

// JS sources (order matters)
const JS_FILES = [
  path.join(APP_DIR, 'js', 'utils.js'),
  path.join(APP_DIR, 'js', 'entities.js'),
  path.join(APP_DIR, 'js', 'profile-router.js'),
  path.join(APP_DIR, 'js', 'entity-form.js'),
  path.join(APP_DIR, 'RPGlitch.js'),
].filter(fs.existsSync);

// ---------- helpers ----------
const exists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };
const read   = (p) => fs.readFileSync(p, 'utf8');
const write  = (p, s) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };

const findFirst = (candidates) => candidates.find(exists) || null;

const listScssFiles = (dir) => {
  if (!exists(dir)) return [];
  const all = fs.readdirSync(dir).filter(f => f.endsWith('.scss'));
  if (all.includes('RPGlitch.scss')) return [path.join(dir, 'RPGlitch.scss')];
  const partials = all.filter(f => f.startsWith('_')).map(f => path.join(dir, f));
  const nonParts = all.filter(f => !f.startsWith('_')).map(f => path.join(dir, f));
  return [...nonParts, ...partials];
};

// ---------- CSS (Pico + SCSS) ----------
function loadPicoCss() {
  const picoPath = findFirst(LIB_DIRS.map(d => path.join(d, 'pico.min.css')));
  if (!picoPath) {
    console.warn('⚠️  pico.min.css not found under build/local_libs or build/scripts/local_libs (continuing without Pico)');
    return '';
  }
  return read(picoPath);
}

function buildCSS() {
  const scssDirs = SCSS_DIRS.filter(exists);
  let combinedCss = '';

  // 1) Pico first, so our app styles can override
  combinedCss += loadPicoCss() || '';

  // 2) App SCSS
  if (scssDirs.length) {
    const files = scssDirs.flatMap(listScssFiles);
    if (files.length) {
      console.log(`> Compiling SCSS (${files.length} file${files.length > 1 ? 's' : ''})…`);
      for (const file of files) {
        const out = sass.compile(file, { style: 'expanded' });
        combinedCss += `\n/* --- ${path.basename(file)} --- */\n` + out.css + '\n';
      }
    } else {
      console.log('> No .scss files found under apps/rpglitch/scss — continuing with Pico only');
    }
  } else {
    console.log('> No SCSS folder present — using Pico only (if found)');
  }

  if (!combinedCss.trim()) return '';

  const min = new CleanCSS({ level: 2 }).minify(combinedCss);
  if (min.errors?.length) throw new Error('clean-css errors:\n' + min.errors.join('\n'));
  if (min.warnings?.length) console.warn('clean-css warnings:\n' + min.warnings.join('\n'));
  console.log(`> CSS size: ${(min.styles.length / 1024).toFixed(1)} KB`);
  return min.styles;
}

// ---------- JS bundle ----------
async function buildJS() {
  if (!JS_FILES.length) throw new Error('No JS sources found in apps/rpglitch/js');
  console.log('> Bundling JS:\n   - ' + JS_FILES.map(f => path.relative(REPO_ROOT, f)).join('\n   - '));
  const source = JS_FILES.map(read).join('\n;\n');
  const res = await minifyJS(source, { ecma: 2020, compress: true, mangle: true });
  if (res.error) throw res.error;
  console.log(`> JS size: ${(res.code.length / 1024).toFixed(1)} KB`);
  return res.code;
}

// ---------- HTML stitch ----------
async function buildHTML() {
  if (!exists(SRC_HTML)) throw new Error(`Source HTML not found: ${SRC_HTML}`);
  let html = read(SRC_HTML);

  // Remove Pico LINKs (we inline Pico)
  html = html.replace(/<link[^>]*href="[^"]*pico[^"]*"[^>]*>\s*/gi, '');

  // Remove any inlined init that would double‑init the app
  html = html.replace(/<script>[\s\S]*?App\.initializeWhenReady[\s\S]*?<\/script>\s*\n?/g, '');

  // Remove local script tags:
  //   - keep http(s)://, //, and local_libs/
  //   - drop everything else (relative/local .js)
  html = html.replace(
    /<script[^>]*\bsrc=(['"])(?!https?:|\/\/|local_libs\/)[^'"]+\.js\1[^>]*><\/script>/gi,
    ''
  );

  const css = buildCSS();
  const js  = await buildJS();

  // Inject CSS
  const styleTag = css ? `<style id="bundle-css">${css}</style>\n` : '';
  html = html.replace(/<\/head>/i, `${styleTag}</head>`);

  // Inject JS (+ safe init wrapper)
  const runtime = `
<script id="bundle-js">
(function () {
  var started = false;
  function start() {
    if (started) return; started = true;
    try {
      if (window.App && typeof App.initializeWhenReady === 'function') App.initializeWhenReady();
      else if (window.App && typeof App.init === 'function') App.init();
    } catch (e) { console.error('App init failed:', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
</script>`.trim();

  html = html.replace(/<\/body>/i, `<script id="bundle-js-src">${js}</script>\n${runtime}\n</body>`);

  // Minify HTML (CSS/JS already minified)
  const min = await minifyHTML(html, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: false,
    minifyJS: false
  });

  write(OUT_HTML, min);
  console.log(`\n✅ Build complete → ${OUT_HTML}\n`);
}

// ---------- run ----------
(async () => {
  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    await buildHTML();
  } catch (err) {
    console.error('❌ Build failed:', err.message);
    process.exit(1);
  }
})();
