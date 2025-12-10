#!/usr/bin/env node
/* Headless smoke test for build/output/imageglitch.html using jsdom.
 * Loads the bundled HTML, executes inline scripts, and reports runtime errors.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM, VirtualConsole } from "jsdom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_HTML = path.resolve(
  __dirname,
  "..",
  "build",
  "output",
  "imageglitch.html",
);

if (!fs.existsSync(OUTPUT_HTML)) {
  console.error(
    `❌ Missing ${path.relative(process.cwd(), OUTPUT_HTML)}. Run \`npm run build:imageglitch\` first.`,
  );
  process.exit(2);
}

const html = fs.readFileSync(OUTPUT_HTML, "utf8");
const vcon = new VirtualConsole();
const errors = [];

vcon.on("error", (...args) => {
  const msg = args
    .map((a) => (a && a.message ? a.message : String(a)))
    .join(" ");
  errors.push(`[console.error] ${msg}`);
});
vcon.on("jsdomError", (e) => {
  const msg = e && e.message ? e.message : String(e);
  if (/Could not parse CSS stylesheet/i.test(msg)) return; // non-fatal in jsdom
  errors.push(`[jsdom] ${msg}`);
});
vcon.on("warn", (e) => {
  // Ignore expected warnings; keep output concise
});

const dom = new JSDOM(html, {
  url: "https://imageglitch.test/",
  runScripts: "dangerously",
  resources: "usable",
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
    if (!window.crypto.getRandomValues) {
      window.crypto.getRandomValues = (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      };
    }

    // Mock Dexie to avoid IndexedDB errors in JSDOM
    window.Dexie = class Dexie {
      constructor(name) {
        this.name = name;
        this.settings = {
          get: async () => null,
          put: async () => {},
        };
      }
      version() {
        return this;
      }
      stores() {
        return this;
      }
      upgrade() {
        return this;
      }
      table() {
        return this.settings;
      }
      open() {
        return Promise.resolve();
      }
    };

    // Mock Perchance plugins as exposed by the Left Panel
    window.pluginAi = async (prompt, options) => {
      return Promise.resolve(`Prompt: ${prompt} (Refined)`);
    };

    window.pluginTextToImage = async (options) => {
      const canvas = window.document.createElement("canvas");
      return Promise.resolve({
        canvas: canvas,
        iframe: window.document.createElement("iframe"),
      });
    };

    window.pluginRememberPlugin = {
      get: async (key) => null,
      set: async (key, value) => {},
    };

    // Do NOT set __TEST__ = true, so we test the waitForPlugins logic
    // window.__TEST__ = true;
  },
});

function result(summary = {}) {
  const { window } = dom;
  const payload = {
    ok: errors.length === 0,
    errors,
    generateButton: !!window.document.getElementById("generate-button"),
    promptInput: !!window.document.getElementById("promptInput"),
    aiMagicSelect: !!window.document.getElementById("aiMagicSelect"),
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

dom.window.addEventListener("error", (e) => {
  errors.push(`[window.error] ${e.message || e.error || "unknown"}`);
});

dom.window.addEventListener("DOMContentLoaded", () => {
  // Allow async initialization to complete
  setTimeout(() => finish("DOMContentLoaded"), 500);
});

// Timeout fallback
setTimeout(() => finish("timeout"), 3000);
