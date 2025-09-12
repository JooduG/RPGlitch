#!/usr/bin/env node
/* * Build RPGlitch: inlines CSS/JS, minifies JS, respects Perchance constraints,
 * and writes the final bundle to build/output/RPGlitch.html.
 */

const fs = require('fs');
const path = require('path');
const sass = require('sass');
const esbuild = require('esbuild');

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

const SRC_HTML = path.join(APP_DIR, 'html', 'index.html');
const ENTRY_SCSS = path.join(APP_DIR, 'scss', 'index.scss');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readFileSafe(filePath, kind) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    console.warn(`⚠️  Missing ${kind}: ${filePath}`);
    return '';
  }
}

function buildScss() {
  if (!fs.existsSync(ENTRY_SCSS)) {
    console.warn(`⚠️  SCSS entry not found: ${ENTRY_SCSS}`);
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
  out = out.replace(/<script[^>]*\bsrc=(['"])(?!https?:\/\/)[^'"]+\.js\1[^>]*>\s*<\/script>\s*/gi, '');
  return out;
}

function injectCss(html, css) {
  if (!css) return html;
  const styleTag = `<style id="rpglitch-inline-css">${css}</style>`;
  return html.replace('</head>', `${styleTag}</head>`);
}

function injectJs(html, js) {
  if (!js) return html;
  const scriptTag = `<script id="rpglitch-inline-js">${js}</script>`;
  return html.replace('</body>', `${scriptTag}</body>`);
}

async function bundleAndMinifyJs() {
  const entryPoint = path.join(APP_JS_DIR, 'index.js');
  if (!fs.existsSync(entryPoint)) {
    const errorMsg = `❌ Entry point not found: ${entryPoint}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const result = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      minify: true,
      write: false, // returns the result as a string
      format: 'iife',
      globalName: 'App',
    });
    return result.outputFiles[0].text;
  } catch (err) {
    console.error('❌ esbuild bundling failed:', err);
    throw err;
  }
}

function injectJsLibs(html, libs) {
  if (!libs) return html;
  const scriptTag = `<script id="rpglitch-inline-libs">${libs}</script>`;
  return html.replace('</body>', `${scriptTag}</body>`);
}

(async function main() {
  try {
    console.log('🔨 Building RPGlitch…');
    ensureDir(OUTPUT_DIR);

    const htmlSrc = readFileSafe(SRC_HTML, 'source HTML');
    if (!htmlSrc) {
      throw new Error(`Source HTML not found at ${SRC_HTML}`);
    }

    const picoCss = readFileSafe(path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.pico.file), 'pico.min.css');
    const compiledScss = buildScss();
    const combinedCss = [picoCss, compiledScss].filter(Boolean).join('');

    const jsBundle = await bundleAndMinifyJs();

    const cashJs = readFileSafe(path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.cash.file), 'cash.min.js');
    const dexieJs = readFileSafe(path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.dexie.file), 'dexie.js');
    const dompurifyJs = readFileSafe(path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.dompurify.file), 'purify.min.js');
    const hyperscriptJs = readFileSafe(path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.hyperscript.file), '_hyperscript.min.js');
    const combinedLibs = [cashJs, dexieJs, dompurifyJs, hyperscriptJs].filter(Boolean).join(';\n');

    let finalHtml = stripTagsForInlining(htmlSrc);
    finalHtml = injectCss(finalHtml, combinedCss);
    finalHtml = injectJsLibs(finalHtml, combinedLibs);
    finalHtml = injectJs(finalHtml, jsBundle);

    fs.writeFileSync(OUTPUT_HTML, finalHtml, 'utf8');
    console.log(`✅ Built: ${path.relative(ROOT, OUTPUT_HTML)}`);
  } catch(err) {
    console.error('❌ Build script failed:', err);
    process.exit(1);
  }
})();
