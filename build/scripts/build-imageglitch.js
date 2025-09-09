#!/usr/bin/env node
/* * Build ImageGlitch: inlines CSS/JS, minifies JS, respects Perchance constraints,
 * and writes the final bundle to build/output/ImageGlitch.html.
 */

import fs from 'fs';
import path from 'path';
import * as sass from 'sass';
import * as terser from 'terser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');
const APP_DIR = path.join(ROOT, 'apps', 'imageglitch');
const APP_JS_DIR = path.join(APP_DIR, 'js');
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

const APP_JS_FILES = [
  'index.js',
].map(f => path.join(APP_JS_DIR, f));

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

function injectCss(html, css) {
  if (!css) return html;
  const styleTag = `<style id="imageglitch-inline-css">${css}</style>`;
  // Replace <!--INJECT:css--> with the style tag
  return html.replace('<!--INJECT:css-->', styleTag);
}

function injectJs(html, js) {
  if (!js) return html;
  const scriptTag = `<script id="imageglitch-inline-js">${js}</script>`;
  // Replace <!--INJECT:js--> with the script tag
  return html.replace('<!--INJECT:js-->', scriptTag);
}

async function bundleJs() {
  const jsPath = path.join(APP_JS_DIR, 'index.js');
  return readFileSafe(jsPath, 'JS file index.js');
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
    const compiledScss = buildScss();
    const combinedCss = [picoCss, compiledScss].filter(Boolean).join('');

    const jsBundle = await bundleJs();

    let finalHtml = htmlSrc; // Start with the new index.html
    finalHtml = injectCss(finalHtml, combinedCss);
    finalHtml = injectJs(finalHtml, jsBundle);

    fs.writeFileSync(OUTPUT_HTML, finalHtml, 'utf8');
    console.log(`✅ Built: ${path.relative(ROOT, OUTPUT_HTML)}`);
  } catch(err) {
    console.error('❌ Build script failed:', err);
    process.exit(1);
  }
})();
