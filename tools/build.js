import esbuild from "esbuild";
import * as sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM, VirtualConsole } from "jsdom";

// --- PATHS ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(REPO_ROOT, "src");
const DIST_DIR = path.join(REPO_ROOT, "dist");
const LIBS_DIR = path.join(REPO_ROOT, "libs");

// --- CONFIG ---
const ENTRY_JS = path.join(SRC_DIR, "js/gamemaster/bootstrap.js");
const ENTRY_SCSS = path.join(SRC_DIR, "scss/index.scss");
const HTML_TEMPLATE = path.join(SRC_DIR, "index.html");

// --- PERCHANCE BRIDGE ---
// This injects the Left Panel lists into the Right Panel JS scope.
const PERCHANCE_BRIDGE = `
<script>
  /* 🔌 PERCHANCE PLUGIN BRIDGE */
  if (typeof ai !== "undefined") {
    window.ai = ai;
    window.pluginAi = ai;
  }
  if (typeof textToImage !== "undefined") {
    window.textToImage = textToImage;
    window.pluginTextToImage = textToImage;
  }
  if (typeof superFetch !== "undefined") {
    window.superFetch = superFetch;
    window.pluginSuperFetch = superFetch;
  }
  if (typeof remember !== "undefined") {
    window.remember = remember;
    window.pluginRemember = remember;
  }
  if (typeof upload !== "undefined") {
    window.upload = upload;
    window.pluginUpload = upload;
  }

  /* ⚙️ CONFIG BRIDGE */
  window.rpgLists = window.rpgLists || {};
  try {
    // Attempt to pull from global namespace if injected by Perchance Left Panel
    const externalConfig = (typeof rpgLists !== 'undefined') ? rpgLists : null;
    if (externalConfig) {
      Object.assign(window.rpgLists, externalConfig);
    }
  } catch (e) {
    console.warn("rpgLists bridge sync error", e);
  }
</script>
`;

// --- UTILS ---
async function compileStyles() {
  console.log("🎨 Compiling Styles...");
  const picoPath = path.join(LIBS_DIR, "pico.min.css");
  let pico = "";
  try {
    pico = await fs.readFile(picoPath, "utf8");
    console.log("   - Loaded Pico CSS (" + pico.length + " bytes)");
  } catch (e) {
    console.error("   ❌ ERROR: pico.min.css not found in libs/!");
  }

  const result = await sass.compileAsync(ENTRY_SCSS);
  const processed = await postcss([autoprefixer]).process(result.css, {
    from: undefined,
  });
  console.log("   - Compiled App SCSS (" + processed.css.length + " bytes)");

  return pico + "\n" + processed.css;
}

async function bundleJs(entry) {
  console.log(`📦 Bundling ${path.basename(entry)}...`);
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    minify: true, // Keep minified for size
    keepNames: true, // Helps with debugging some class names
    write: false,
    format: "iife",
    globalName: "AppBundle",
  });
  return result.outputFiles[0].text;
}

async function build() {
  console.log("🔥 Building RPGlitch...");
  await fs.mkdir(DIST_DIR, { recursive: true });

  const [css, appJs, rawHtml] = await Promise.all([
    compileStyles(),
    bundleJs(ENTRY_JS),
    fs.readFile(HTML_TEMPLATE, "utf8"),
  ]);

  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => {
    if (error.message.includes("Could not parse CSS stylesheet")) {
      return;
    }
    console.error(error);
  });

  const dom = new JSDOM(rawHtml, { virtualConsole });
  const doc = dom.window.document;

  // 1. CLEANUP: Remove dev scripts/links
  console.log("🧹 Purging dev tags...");
  doc.querySelectorAll("script").forEach((s) => s.remove());
  doc.querySelectorAll("link[rel='stylesheet']").forEach((l) => l.remove());

  // 2. INJECT CSS
  const styleTag = doc.createElement("style");
  styleTag.textContent = css;
  doc.head.appendChild(styleTag);

  // 4. INJECT LIBS + APP
  const libFiles = [
    "purify.min.js",
    "dexie.min.js",
    "_hyperscript.min.js",
    "cash.min.js",
  ];

  // Helper to prevent </script> in strings from breaking HTML
  // We use \x3C (hex escape for <) which is valid in strings and regex literals
  // We also escape Line Separators (U+2028) and Paragraph Separators (U+2029)
  // because they are valid in JSON/Strings but treated as newlines by JS parsers,
  // which breaks string literals.
  const escapeScript = (str) =>
    str
      .replace(/<\/script/gi, "\\x3C/script")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");

  for (const file of libFiles) {
    try {
      const content = await fs.readFile(path.join(LIBS_DIR, file), "utf8");
      const script = doc.createElement("script");
      script.textContent = escapeScript(content);
      doc.body.appendChild(script);
      console.log(`  + Injected lib: ${file}`);
    } catch (e) {
      console.log(`ℹ️ Note: Optional lib ${file} not found.`);
    }
  }

  // 5. INJECT APP
  const mainScript = doc.createElement("script");
  mainScript.textContent = escapeScript(appJs);
  doc.body.appendChild(mainScript);

  // 5. FINALIZE HTML
  // We manually prepend the Bridge because JSDOM might escape the [brackets] if we set textContent
  let outputHtml = dom.serialize();

  // Inject Config Marker before head closes
  outputHtml = outputHtml.replace(
    "</head>",
    "<!--PERCHANCE_CONFIG_TARGET--></head>",
  );

  // Inject Bridge directly into body start
  outputHtml = outputHtml.replace(
    /<body[^>]*>/,
    (match) => match + PERCHANCE_BRIDGE,
  );

  await fs.writeFile(path.join(DIST_DIR, "RPGlitch.html"), outputHtml);
  console.log("✅ Build Complete: dist/RPGlitch.html");
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
