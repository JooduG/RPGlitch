#!/usr/bin/env node
/* * Build ImageGlitch: inlines CSS/JS, minifies JS, respects Perchance constraints,
 * and writes the final bundle to build/output/ImageGlitch.html.
 */

const fs = require('fs');
const path = require('path');
const sass = require('sass');
const esbuild = require('esbuild');

const ROOT = path.resolve(__dirname, '..', '..');
const APP_DIR = path.join(ROOT, 'apps', 'imageglitch');
const APP_JS_DIR = path.join(APP_DIR, 'js');
const BUILD_DIR = path.join(ROOT, 'build');
const LOCAL_LIBS_DIR = path.join(BUILD_DIR, 'local_libs');

const LOCAL_LIBS = {
  pico: { file: 'pico.min.css' },
  cash: { file: 'cash.min.js' },
  dexie: { file: 'dexie.js' },
  dompurify: { file: 'purify.min.js' },
  hyperscript: { file: '_hyperscript.min.js' },
};

const OUTPUT_DIR = path.join(BUILD_DIR, 'output');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'ImageGlitch.html');


const SRC_HTML = path.join(APP_DIR, 'html', 'index.html');
const SRC_SCSS = path.join(APP_DIR, 'scss', 'index.scss');
const SRC_JS = path.join(APP_DIR, 'js', 'index.js');

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

function injectCss(html, css) {
  if (!css) return html;
  const styleTag = `<style id="imageglitch-inline-css">${css}</style>`;
  return html.replace('<!--STYLES-->', styleTag);
}

function injectJs(html, js) {
  if (!js) return html;
  const scriptTag = `<script id="imageglitch-inline-js">${js}</script>`;
  return html.replace('<!--SCRIPTS-->', scriptTag);
}

function stripTagsForInlining(html) {
  let out = html.replace(/<link[^>]*href=["'][^"']*pico[^"']*["'][^>]*>\s*/gi, '');
  out = out.replace(/<script[^>]*\bsrc=(['"])(?!https?:\/\/)[^'"]+\.js\1[^>]*>\s*<\/script>\s*/gi, '');
  return out;
}

function injectJsLibs(html, libs) {
  if (!libs) return html;
  const scriptTag = `<script id="imageglitch-inline-libs">${libs}</script>`;
  return html.replace('</body>', `${scriptTag}</body>`);
}

(async function main() {
  try {
    console.log('🔨 Building ImageGlitch…');
    ensureDir(OUTPUT_DIR);

    const htmlSrc = readFileSafe(SRC_HTML, 'source HTML');
    if (!htmlSrc) {
      throw new Error(`Source HTML not found at ${SRC_HTML}`);
    }

    const scssResult = sass.compile(SRC_SCSS);
    const customCss = scssResult.css;

    const picoCss = readFileSafe(path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.pico.file), 'pico.min.css');
    const combinedCss = [picoCss, customCss].filter(Boolean).join('');

    const entryPoint = SRC_JS;
    if (!fs.existsSync(entryPoint)) {
      const errorMsg = `❌ Entry point not found: ${entryPoint}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const jsBundleResult = await esbuild.build({
      entryPoints: [entryPoint, path.join(APP_JS_DIR, 'perchance.js')],
      bundle: true,
      minify: true,
      write: false,
      format: 'iife',
      globalName: 'ImageGlitchApp',
    });
    const jsBundle = jsBundleResult.outputFiles[0].text;

    const [cashJs, dexieJs, dompurifyJs, hyperscriptJs] =
      ['cash', 'dexie', 'dompurify', 'hyperscript'].map(name =>
        readFileSafe(path.join(LOCAL_LIBS_DIR, LOCAL_LIBS[name].file), LOCAL_LIBS[name].file)
      );
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

