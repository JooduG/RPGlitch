#!/usr/bin/env node
/**
 * Unified Smoke Test for Build Artifacts
 * Checks both RPGlitch.html and ImageGlitch.html using JSDOM.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM, VirtualConsole } from "jsdom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");
const BUILD_OUTPUT = path.join(REPO_ROOT, "build", "output");

/**
 * Mocks browser APIs for JSDOM
 */
function enhanceWindow(window) {
  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  if (!window.crypto) window.crypto = {};
  if (!window.crypto.randomUUID) window.crypto.randomUUID = () => "uuid-jsdom";
  if (!window.crypto.getRandomValues) {
    window.crypto.getRandomValues = (arr) => {
      for (let i = 0; i < arr.length; i++)
        arr[i] = Math.floor(Math.random() * 256);
      return arr;
    };
  }

  // Mock Perchance Plugins
  window.ai = { generateStream: async function* () {} };
  window.textToImage = async () => ({ url: "data:image/png;base64,mock" });
  window.superFetch = async () => ({ ok: true, json: async () => ({}) });
  window.rememberPlugin = { get: () => null, set: () => {} };
  window.upload = () => {};

  // Mock ImageGlitch specific
  window.pluginAi = async (p) => `Prompt: ${p} (Refined)`;
  window.pluginTextToImage = async () => ({
    canvas: window.document.createElement("canvas"),
    iframe: window.document.createElement("iframe"),
  });
  window.pluginRememberPlugin = window.rememberPlugin;

  // Mock Dexie
  window.Dexie = class Dexie {
    constructor(name) {
      this.name = name;
      this.settings = { get: async () => null, put: async () => {} };
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
}

async function runSmoke(appName) {
  const fileName = appName === "rpglitch" ? "RPGlitch.html" : `${appName}.html`;
  const filePath = path.join(BUILD_OUTPUT, fileName);

  console.log(`\n💨 Testing ${fileName}...`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing ${fileName}. Build it first!`);
    return false;
  }

  const html = fs.readFileSync(filePath, "utf8");
  const errors = [];
  const vcon = new VirtualConsole();

  vcon.on("error", (...args) =>
    errors.push(`[console.error] ${args.map(String).join(" ")}`),
  );
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
    setTimeout(resolve, 3000);
  });

  // specific checks
  const { window } = dom;
  let success = true;

  if (appName === "rpglitch") {
    if (!window.App) {
      errors.push("window.App missing");
      success = false;
    }
    if (!window.document.getElementById("storyboard-dynamic-title")) {
      errors.push("Title element missing");
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
