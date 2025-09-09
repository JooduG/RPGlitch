#!/usr/bin/env node
/* * Build ImageGlitch: inlines CSS/JS, minifies JS, respects Perchance constraints,
 * and writes the final bundle to build/output/ImageGlitch.html.
 */

const fs = require('fs');
const path = require('path');
const sass = require('sass');
const terser = require('terser');

const ROOT = path.resolve(__dirname, '..', '..');
const APP_DIR = path.join(ROOT, 'apps', 'imageglitch');
const APP_JS_DIR = path.join(APP_DIR, 'js'); // Assuming a 'js' subdirectory for consistency, will verify
const BUILD_DIR = path.join(ROOT, 'build');
const LOCAL_LIBS_DIR = path.join(BUILD_DIR, 'local_libs');
const OUTPUT_DIR = path.join(BUILD_DIR, 'output');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'ImageGlitch.html');

const LOCAL_LIBS = {
  pico: { file: 'pico.min.css' },
  cash: { file: 'cash.min.js' },
  dexie: { file: 'dexie.js' },
  dompurify: { file: 'purify.min.js' },
  hyperscript: { file: '_hyperscript.min.js' },
};

const APP_JS_FILES = []; // No separate JS files for ImageGlitch

const SRC_HTML = path.join(APP_DIR, 'ImageGlitch.html');
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

function extractCssFromHtml(htmlContent) {
  const match = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return match ? match[1].trim() : '';
}

function stripTagsForInlining(html) {
  let out = html.replace(/<link[^>]*href=["'][^"']*pico[^"']*["'][^>]*>\s*/gi, '');
  out = out.replace(/<script[^>]*\bsrc=(['"])(?!https?:\/\/)[^'"]+\.js\1[^>]*>\s*<\/script>\s*/gi, '');
  return out;
}

function injectCss(html, css) {
  if (!css) return html;
  const styleTag = `<style id="imageglitch-inline-css">${css}</style>`;
  return html.replace('</head>', `${styleTag}</head>`);
}

function injectJs(html, js) {
  if (!js) return html;
  const scriptTag = `<script id="imageglitch-inline-js">${js}</script>`;
  return html.replace('</body>', `${scriptTag}</body>`);
}

async function bundleAndMinifyJs() {
  if (APP_JS_FILES.length === 0) {
    return ''; // No app-specific JS files to bundle
  }

  const libs = [
    LOCAL_LIBS.cash.file,
    LOCAL_LIBS.dexie.file,
    LOCAL_LIBS.dompurify.file,
    LOCAL_LIBS.hyperscript.file,
  ].map(f => path.join(LOCAL_LIBS_DIR, f));
  
  const allFiles = [...libs, ...APP_JS_FILES];
  const codeMap = {};
  for (const p of allFiles) {
    codeMap[p] = readFileSafe(p, `JS file ${path.basename(p)}`);
  }

  const result = await terser.minify(codeMap, {
    sourceMap: false,
    mangle: {
      toplevel: true,
    },
    compress: {
      toplevel: true,
    },
  });

  if (result.error) {
    console.error('❌ Terser minification failed:', result.error);
    return '';
  }
  
  return result.code;
}

(async function main() {
  try {
    console.log('🔨 Building ImageGlitch…');
    ensureDir(OUTPUT_DIR);

    const htmlSrc = readFileSafe(SRC_HTML, 'source HTML');
    if (!htmlSrc) {
      throw new Error(`Source HTML not found at ${SRC_HTML}`);
    }

    const picoCss = readFileSafe(path.join(LOCAL_LIBS_DIR, LOCAL_LIBS.pico.file), 'pico.min.css');
    const styleBlockHtml = readFileSafe(path.join(APP_DIR, 'ImageGlitch-style-block.html'), 'ImageGlitch-style-block.html');
    const customCss = extractCssFromHtml(styleBlockHtml);
    const combinedCss = [picoCss, customCss].filter(Boolean).join('');

    const jsBundle = await bundleAndMinifyJs(); // This will now return empty string if no JS files

    let finalHtml = stripTagsForInlining(htmlSrc);
    finalHtml = injectCss(finalHtml, combinedCss);
    finalHtml = injectJs(finalHtml, jsBundle);

    fs.writeFileSync(OUTPUT_HTML, finalHtml, 'utf8');
    console.log(`✅ Built: ${path.relative(ROOT, OUTPUT_HTML)}`);
  } catch(err) {
    console.error('❌ Build script failed:', err);
    process.exit(1);
  }
})();
