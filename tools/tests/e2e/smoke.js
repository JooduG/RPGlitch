#!/usr/bin/env node
/**
 * Unified Smoke Test for Build Artifacts
 * Checks both RPGlitch.html and ImageGlitch.html using JSDOM.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM, VirtualConsole } from "jsdom";
// Import fake-indexeddb to prevent DB crashes
import { indexedDB, IDBKeyRange } from "fake-indexeddb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");

/**
 * Mocks browser APIs for JSDOM
 */
function enhanceWindow(window) {
  // 1. Polyfill IndexedDB (Fixes Dexie Crash)
  window.indexedDB = indexedDB;
  window.IDBKeyRange = IDBKeyRange;

  // 2. FORCE Patch URL.createObjectURL (The Nuclear Option)
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = (blob) => "blob:mock-worker-url";
    window.URL.revokeObjectURL = (url) => {};
  }
  if (typeof global.URL.createObjectURL === "undefined") {
    global.URL.createObjectURL = (blob) => "blob:mock-worker-url";
    global.URL.revokeObjectURL = (url) => {};
  }

  // 3. MOCK WEB WORKER (The Final Boss)
  class MockWorker {
    constructor(stringUrl) {
      this.url = stringUrl;
      this.onmessage = null;
      this.onerror = null;
    }
    postMessage(msg) {}
    addEventListener(type, listener) {
      if (type === "message") this.onmessage = listener;
      if (type === "error") this.onerror = listener;
    }
    removeEventListener() {}
    terminate() {}
  }
  window.Worker = MockWorker;
  global.Worker = MockWorker;

  // 4. Mock Animation Frames
  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = (id) => clearTimeout(id);

  // 5. Mock Crypto
  if (!window.crypto) window.crypto = {};
  if (!window.crypto.randomUUID) window.crypto.randomUUID = () => "uuid-jsdom";
  if (!window.crypto.getRandomValues) {
    window.crypto.getRandomValues = (arr) => {
      for (let i = 0; i < arr.length; i++)
        arr[i] = Math.floor(Math.random() * 256);
      return arr;
    };
  }

  // 6. Mock Perchance Plugins
  window.ai = { generateStream: async function* () {} };
  window.textToImage = async () => ({ url: "data:image/png;base64,mock" });
  window.superFetch = async () => ({ ok: true, json: async () => ({}) });
  window.rememberPlugin = { get: () => null, set: () => {} };
  window.upload = () => {};

  // 7. Mock ImageGlitch specific
  window.pluginAi = async (p) => `Prompt: ${p} (Refined)`;
  window.pluginTextToImage = async () => ({
    canvas: window.document.createElement("canvas"),
    iframe: window.document.createElement("iframe"),
  });
  window.pluginRememberPlugin = window.rememberPlugin;

  // 8. CRITICAL: Mock RPG Lists (Prevents 5s Boot Delay)
  // This allows the app to skip waitForConfig() instantly
  window.rpgLists = {};
}

async function runSmoke(appName) {
  const fileName = appName === "rpglitch" ? "RPGlitch.html" : `${appName}.html`;
  const filePath = path.join(REPO_ROOT, "apps", appName, fileName);

  console.log(`\n💨 Testing ${fileName}...`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing ${fileName} at ${filePath}. Build it first!`);
    return false;
  }

  const html = fs.readFileSync(filePath, "utf8");
  const errors = [];
  const vcon = new VirtualConsole();

  // Filter out noise
  vcon.on("error", (...args) => {
    const msg = args.map(String).join(" ");
    if (msg.includes("Could not parse CSS")) return;
    errors.push(`[console.error] ${msg}`);
  });
  vcon.on("jsdomError", (e) => {
    if (!/Could not parse CSS/i.test(e.message))
      errors.push(`[jsdom] ${e.message}`);
  });

  const dom = new JSDOM(html, {
    url: `https://${appName}.test/`,
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole: vcon,
    beforeParse: enhanceWindow,
  });

  // Wait for load
  await new Promise((resolve) => {
    dom.window.addEventListener("DOMContentLoaded", () =>
      setTimeout(resolve, 500),
    );
    // Give it time to boot
    setTimeout(resolve, 3500);
  });

  // specific checks
  const { window } = dom;
  let success = true;

  if (appName === "rpglitch") {
    if (!window.App) {
      errors.push("window.App missing (App failed to boot)");
      success = false;
    }
    // Check for title OR any major UI element indicating life
    const title = window.document.getElementById("storyboard-dynamic-title");
    const layout = window.document.querySelector(".rpglitch-layout");

    if (!title && !layout) {
      errors.push("UI failed to render (Title and Layout missing)");
      success = false;
    }
  } else if (appName === "imageglitch") {
    if (!window.document.getElementById("generate-button")) {
      errors.push("Generate button missing");
      success = false;
    }
  }

  if (errors.length > 0) {
    console.error(`❌ Errors in ${appName}:`);
    errors.forEach((e) => console.error("  " + e));
    return false;
  }

  console.log(`✅ ${appName} seems healthy.`);
  return success;
}

(async () => {
  const apps = ["rpglitch", "imageglitch"];
  let fail = false;
  for (const app of apps) {
    if (!(await runSmoke(app))) fail = true;
  }
  process.exit(fail ? 1 : 0);
})();
