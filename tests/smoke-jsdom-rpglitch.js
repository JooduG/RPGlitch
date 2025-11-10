#!/usr/bin/env node
/* Headless smoke test for build/output/RPGlitch.html using jsdom.
 * Loads the bundled HTML, executes inline scripts, and reports runtime errors.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM, VirtualConsole } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_HTML = path.resolve(__dirname, '..', '..', 'build', 'output', 'RPGlitch.html');

if (!fs.existsSync(OUTPUT_HTML)) {
  console.error(`❌ Missing ${path.relative(process.cwd(), OUTPUT_HTML)}. Run \`npm run build:rpglitch\` first.`);
  process.exit(2);
}

const html = fs.readFileSync(OUTPUT_HTML, 'utf8');
const vcon = new VirtualConsole();
const errors = [];

vcon.on('error', (e) => {
  const msg = e && e.message ? e.message : String(e);
  errors.push(`[console.error] ${msg}`);
});
vcon.on('jsdomError', (e) => {
  const msg = e && e.message ? e.message : String(e);
  if (/Could not parse CSS stylesheet/i.test(msg)) return; // non-fatal in jsdom
  errors.push(`[jsdom] ${msg}`);
});
vcon.on('warn', (e) => {
  // Ignore expected warnings; keep output concise
});

const dom = new JSDOM(html, {
  url: 'https://rpglitch.test/',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vcon,
  beforeParse(window) {
    // Minimal shims to keep app stable in jsdom
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = (id) => clearTimeout(id);
    }
    if (!window.crypto) window.crypto = {};
    if (!window.crypto.randomUUID) {
      window.crypto.randomUUID = () => 'uuid-jsdom';
    }
    // Mock the Perchance.org 'ai' plugin
    window.ai = {
      generateStream: async function*() {
        // Yield nothing; we just need the function to exist.
      },
    };
    // Mock the Perchance.org 'textToImage' plugin
    window.textToImage = async (options) => {
      return Promise.resolve({
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      });
    };
    // Mock other Perchance plugins
    window.superFetch = async (url, options) => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    window.rememberPlugin = (() => {
      const memory = {};
      return {
        get: (key) => memory[key],
        set: (key, value) => (memory[key] = value),
      };
    })();
    window.upload = () => {};
  },
});

function result(summary = {}) {
  const { window } = dom;
  const App = window.App || {};
  const ui = App.ui || {};
  const payload = {
    ok: errors.length === 0,
    errors,
    appExists: !!window.App,
    uiCollected: !!(ui.topBarLeft && ui.chinContainer),
    titleEl: !!window.document.getElementById('storyboard-dynamic-title'),
  };
  Object.assign(payload, summary);
  console.log(JSON.stringify(payload, null, 2));
}

let done = false;
const finish = (label) => {
  if (done) return;
  done = true;
  result({ event: label });
};

dom.window.addEventListener('error', (e) => {
  errors.push(`[window.error] ${e.message || e.error || 'unknown'}`);
});

dom.window.addEventListener('DOMContentLoaded', () => {
  // Allow App.initializeWhenReady work to complete
  setTimeout(() => finish('DOMContentLoaded'), 200);
});

// Timeout fallback
setTimeout(() => finish('timeout'), 3000);
