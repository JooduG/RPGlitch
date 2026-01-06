import esbuild from "esbuild";
import * as sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom";

// --- PATHS ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");
const DIST_DIR = path.join(REPO_ROOT, "dist");
const LIBS_DIR = path.join(REPO_ROOT, "libs");

// --- CONFIG ---
const ENTRY_JS = path.join(SRC_DIR, "js/core/bootstrap.js");
const ENTRY_SCSS = path.join(SRC_DIR, "scss/index.scss");
const HTML_TEMPLATE = path.join(SRC_DIR, "index.html");
const WORKER_JS = path.join(SRC_DIR, "js/engine/physics/worker.js");

// --- UTILS ---
async function compileStyles() {
  console.log("🎨 Compiling SCSS...");
  const picoPath = path.join(LIBS_DIR, "pico.min.css");
  let pico = "";
  try {
    pico = await fs.readFile(picoPath, "utf8");
  } catch (e) {
    console.warn("⚠️ Warning: pico.min.css not found in libs/. Skipping.");
  }

  const result = await sass.compileAsync(ENTRY_SCSS);
  const processed = await postcss([autoprefixer]).process(result.css, {
    from: undefined,
  });

  // Combine Pico + App CSS
  return pico + "\n" + processed.css;
}

async function bundleJs(entry) {
  console.log(`📦 Bundling ${path.basename(entry)}...`);
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    write: false,
    format: "iife",
    globalName: "AppBundle", // Helps with debugging
  });
  return result.outputFiles[0].text;
}

async function build() {
  console.log("🔥 Building RPGlitch...");
  await fs.mkdir(DIST_DIR, { recursive: true });

  // 1. Prepare Assets
  const [css, appJs, rawHtml, workerJs] = await Promise.all([
    compileStyles(),
    bundleJs(ENTRY_JS),
    fs.readFile(HTML_TEMPLATE, "utf8"),
    bundleJs(WORKER_JS),
  ]);

  // 2. Load Template
  const dom = new JSDOM(rawHtml);
  const doc = dom.window.document;

  // 3. THE PURGE: Remove ALL existing scripts and CSS links
  console.log("🧹 Purging zombie tags...");
  const scripts = doc.querySelectorAll("script");
  scripts.forEach((s) => s.remove());

  const links = doc.querySelectorAll("link[rel='stylesheet']");
  links.forEach((l) => l.remove());

  // 4. Inject CSS (Inline)
  const styleTag = doc.createElement("style");
  styleTag.textContent = css;
  doc.head.appendChild(styleTag);

  // 5. Inject Worker (Inline)
  if (workerJs) {
    const dexiePath = path.join(LIBS_DIR, "dexie.min.js");
    let dexie = "";
    try {
      dexie = await fs.readFile(dexiePath, "utf8");
    } catch (e) {
      console.warn("⚠️ Dexie not found for worker.");
    }

    const workerScript = doc.createElement("script");
    workerScript.id = "rpglitch-worker-source";
    workerScript.textContent = `window.RPGLITCH_WORKER_SOURCE = ${JSON.stringify(dexie + ";\n" + workerJs)};`;
    doc.body.appendChild(workerScript);
  }

  // 6. Inject Main JS + Libs
  // Note: We use 'purify' and 'dexie' from libs. 'cash' if available.
  const libFiles = [
    "purify.min.js",
    "dexie.min.js",
    "_hyperscript.min.js",
    "cash.min.js",
  ];
  let libContent = "";

  for (const file of libFiles) {
    try {
      const content = await fs.readFile(path.join(LIBS_DIR, file), "utf8");
      libContent += content + ";\n";
    } catch (e) {
      console.log(`ℹ️ Note: Optional lib ${file} not found.`);
    }
  }

  const mainScript = doc.createElement("script");
  mainScript.textContent = libContent + ";\n" + appJs;
  doc.body.appendChild(mainScript);

  // 7. Write Output
  const outputHtml = dom.serialize();
  await fs.writeFile(path.join(DIST_DIR, "RPGlitch.html"), outputHtml);
  console.log("✅ Build Complete: dist/RPGlitch.html");
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
