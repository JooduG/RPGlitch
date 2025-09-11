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
const BUILD_DIR = path.join(ROOT, 'build');

const OUTPUT_DIR = path.join(BUILD_DIR, 'output');
const OUTPUT_HTML = path.join(OUTPUT_DIR, 'ImageGlitch.html');



const SRC_HTML = path.join(APP_DIR, 'ImageGlitch.html');
const SRC_SCSS = path.join(APP_DIR, 'ImageGlitch.scss');
const SRC_JS = path.join(APP_DIR, 'ImageGlitch.js');

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

    const combinedCss = [customCss].filter(Boolean).join('');

    const jsSrc = readFileSafe(SRC_JS, 'source JS');
    const minifiedResult = await terser.minify(jsSrc);

    if (minifiedResult.error) {
      throw new Error(`Terser minification failed: ${minifiedResult.error}`);
    }

    let finalHtml = htmlSrc;
    finalHtml = injectCss(finalHtml, combinedCss);
    finalHtml = injectJs(finalHtml, minifiedResult.code);

    fs.writeFileSync(OUTPUT_HTML, finalHtml, 'utf8');
    console.log(`✅ Built: ${path.relative(ROOT, OUTPUT_HTML)}`);
  } catch(err) {
    console.error('❌ Build script failed:', err);
    process.exit(1);
  }
})();

