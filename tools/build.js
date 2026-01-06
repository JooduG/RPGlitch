/* eslint-disable no-console */
const esbuild = require("esbuild");
const sass = require("sass");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const fs = require("fs/promises");
const path = require("path");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const CONFIG = {
  SRC_DIR: "src",
  LIBS_DIR: "libs",
  DIST_DIR: "dist",
  ENTRY: "src/js/core/bootstrap.js",
  STYLES: "src/scss/index.scss",
  HTML: "src/index.html",
  WORKER: "src/js/engine/physics/worker.js",
};

async function build() {
  console.log("🚧 Starting Build...");
  const startTime = Date.now();

  // 1. Prepare Dist
  try {
    await fs.mkdir(CONFIG.DIST_DIR, { recursive: true });
  } catch (e) {
    /* ignore */
  }

  // 2. Compile SCSS
  console.log("🎨 Compiling Styles...");
  const sassResult = sass.compile(CONFIG.STYLES, {
    style: "compressed",
    loadPaths: ["node_modules"],
  });
  const postcssResult = await postcss([autoprefixer]).process(sassResult.css, {
    from: undefined,
  });
  const cssContent = postcssResult.css;

  // 3. Bundle Main JS
  console.log("📦 Bundling Application...");
  const jsResult = await esbuild.build({
    entryPoints: [CONFIG.ENTRY],
    bundle: true,
    minify: true,
    format: "iife",
    platform: "browser",
    write: false,
    globalName: "AppBundle",
  });
  const jsContent = jsResult.outputFiles[0].text;

  // 4. Prepare Worker Source
  console.log("⚙️ Preparing Worker...");
  // Read Dexie lib for worker
  const dexieLib = await fs.readFile(
    path.join(CONFIG.LIBS_DIR, "dexie.min.js"),
    "utf8",
  );

  // Bundle Worker Code
  const workerResult = await esbuild.build({
    entryPoints: [CONFIG.WORKER],
    bundle: true,
    minify: true,
    format: "iife",
    platform: "browser",
    write: false,
  });
  const workerCode = workerResult.outputFiles[0].text;

  // Combine Dexie + Worker
  const workerSource = `${dexieLib}\n${workerCode}`;

  // 5. Read Libraries
  console.log("📚 loading Libraries...");
  const libs = [
    "cash.min.js",
    "dexie.min.js",
    "purify.min.js",
    "_hyperscript.min.js",
  ];

  const libContents = [];
  for (const lib of libs) {
    const content = await fs.readFile(path.join(CONFIG.LIBS_DIR, lib), "utf8");
    libContents.push({ name: lib, content });
  }

  // 6. Inject into HTML
  console.log("💉 Injecting Assets...");
  const htmlRaw = await fs.readFile(CONFIG.HTML, "utf8");
  const dom = new JSDOM(htmlRaw);
  const document = dom.window.document;

  // Use a predictable set of cleanup rules
  const cleanSelectors = [
    'script[src*="build/local_libs"]',
    'script[src*="node_modules"]',
    'link[rel="stylesheet"][href*="scss/index.scss"]',
  ];

  cleanSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // Inject CSS
  const styleEl = document.createElement("style");
  styleEl.textContent = cssContent;
  document.head.appendChild(styleEl);

  // Inject Worker Source (window.RPGLITCH_WORKER_SOURCE)
  // JSON.stringify prevents syntax errors from quotes/newlines in source
  const workerScriptEl = document.createElement("script");
  workerScriptEl.id = "rpglitch-worker-source";
  workerScriptEl.textContent = `window.RPGLITCH_WORKER_SOURCE = ${JSON.stringify(workerSource)};`;
  document.body.appendChild(workerScriptEl);

  // Inject Libs
  for (const lib of libContents) {
    const s = document.createElement("script");
    s.textContent = lib.content;
    document.body.appendChild(s);
  }

  // Inject App
  const appScript = document.createElement("script");
  appScript.textContent = jsContent;
  document.body.appendChild(appScript);

  // 7. Write Output
  const finalHtml = dom.serialize();
  const outputPath = path.join(CONFIG.DIST_DIR, "RPGlitch.html");
  await fs.writeFile(outputPath, finalHtml);

  console.log(`✅ Build Complete in ${Date.now() - startTime}ms`);
  console.log(`📄 Output: ${outputPath}`);
}

build().catch((err) => {
  console.error("❌ Build Failed:", err);
  process.exit(1);
});
