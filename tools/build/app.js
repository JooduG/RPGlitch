/**
 * Build Script for Perchance Applications (RPGlitch & ImageGlitch)
 *
 * This script compiles SCSS, bundles JavaScript with esbuild, inlines vendored
 * libraries, and outputs a single self-contained HTML file for deployment to
 * Perchance.org.
 *
 * Two loader strategies are available:
 * - Complex Loader: Chunks code into 500-char pieces (proven on Perchance)
 * - Simple Loader: Direct inline (simpler, but untested on Perchance)
 *
 * Usage: node scripts/build-app.js <appname>
 * Example: node scripts/build-app.js rpglitch
 */
import esbuild from "esbuild";
import * as sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM, VirtualConsole } from "jsdom";

// --- CONFIGURATION ---
const APP_CONFIGS = {
  imageglitch: {
    extraLibs: [
      { name: "dexie", file: "dexie.min.js" },
      { name: "dompurify", file: "purify.min.js" },
    ],
    useComplexLoader: true, // Proven to work on Perchance
  },
  rpglitch: {
    extraLibs: [
      { name: "cash", file: "cash.min.js" },
      { name: "dexie", file: "dexie.min.js" },
      { name: "dompurify", file: "purify.min.js" },
      { name: "hyperscript", file: "_hyperscript.min.js" },
    ],
    useComplexLoader: false, // Proven to work on Perchance
  },
};

// --- PATHS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..");
const LOCAL_LIBS_DIR = path.join(REPO_ROOT, "libs");

// --- UTILITIES ---
/**
 * Splits a string into fixed-size chunks for the complex loader.
 * Used to work around potential Perchance HTML panel size limits.
 * @param {string} str - The string to split
 * @param {number} chunkSize - Size of each chunk (default: 500)
 * @returns {string[]} Array of string chunks
 */
function chunkString(str, chunkSize = 500) {
  const chunks = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.substring(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Safely reads a vendored library file. Returns empty string if not found.
 * @param {string} filePath - Absolute path to the library file
 * @param {string} kind - Library name for logging purposes
 * @returns {string} File contents or empty string
 */
function readFileSafe(filePath, kind) {
  try {
    return fsSync.readFileSync(filePath, "utf8");
  } catch {
    console.warn(`⚠️  Missing ${kind}: ${filePath}`);
    return "";
  }
}

// --- PALETTE SYNCHRONIZATION ---
async function generatePaletteScss(appDir) {
  const constantsPath = path.join(appDir, "js", "core", "constants.js");
  const outputPath = path.join(
    appDir,
    "scss",
    "abstracts",
    "_palette-generated.scss",
  );

  try {
    const jsContent = await fs.readFile(constantsPath, "utf8");

    // Extract PALETTE object via simple parsing (safer than eval)
    // Looking for: export const PALETTE = { ... };
    const match = jsContent.match(/export const PALETTE = \{([\s\S]*?)\};/);
    if (!match) {
      console.warn(
        "⚠️  Could not find PALETTE in constants.js. Skipping SCSS generation.",
      );
      return;
    }

    const body = match[1];
    const lines = body.split("\n");
    const colors = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Match: key: "value", // comment
      // Capture groups: 1=key, 2=value
      const colorMatch = trimmed.match(/^(\w+):\s*"#([0-9a-fA-F]{6})"/);

      if (colorMatch) {
        const [, key, hex] = colorMatch;
        // Format: "key": (color: #hex)
        colors.push(`  "${key}": (color: #${hex})`);
      }
    }

    // Construct SCSS content
    const scssContent = `// AUTO-GENERATED from js/core/constants.js
// Do not edit directly. Run build to update.
$signature-colors: (
${colors.join(",\n")}
);\n`;

    await fs.writeFile(outputPath, scssContent);
    console.log(`🎨 Generated SCSS Palette with ${colors.length} colors.`);
  } catch (error) {
    // If file doesn't exist (e.g. imageglitch might not have it), just strict warn
    if (error.code !== "ENOENT") {
      console.warn("⚠️  Palette generation failed:", error.message);
    }
  }
}

// --- CORE BUILD LOGIC ---
async function compileStyles(entryPointScss, picoCssPath) {
  try {
    const picoCss = await fs.readFile(picoCssPath, "utf8");
    // Sass compileAsync can handle imports relative to the SCSS file
    const sassResult = await sass.compileAsync(entryPointScss);
    console.log("DEBUG: Sass CSS Length:", sassResult.css.length);
    console.log("DEBUG: Sass CSS Preview:", sassResult.css.substring(0, 200));
    const combinedCss = picoCss + "\n" + sassResult.css;
    const postcssResult = await postcss([autoprefixer]).process(combinedCss, {
      from: undefined,
    });
    return postcssResult.css;
  } catch (error) {
    console.error("❌ SCSS/PostCSS compilation failed:", error);
    throw error;
  }
}

async function bundleJs(entryPointJs) {
  try {
    const result = await esbuild.build({
      entryPoints: [entryPointJs],
      bundle: true,
      minify: true,
      write: false,
      format: "iife",
    });
    return result.outputFiles[0].text;
  } catch (error) {
    console.error("❌ esbuild bundling failed:", error);
    throw error;
  }
}

// --- MAIN ---
async function build(appName) {
  if (!appName || !APP_CONFIGS[appName]) {
    console.error(
      `❌ Invalid or missing app name. Use 'rpglitch' or 'imageglitch'.`,
    );
    process.exit(1);
  }
  console.log(`🔨 Building ${appName}...`);

  const config = APP_CONFIGS[appName];
  const appDir = path.join(REPO_ROOT, "apps", appName);

  const entryPointJs =
    appName === "imageglitch"
      ? path.join(appDir, "js", "index.js")
      : path.join(appDir, "js", "core", "bootstrap.js");
  const entryPointScss = path.join(appDir, "scss", "index.scss");
  const htmlFile = path.join(appDir, "index.html");
  const PICO_CSS_PATH = path.resolve(REPO_ROOT, "libs", "pico.min.css");

  try {
    // Sync Palette first
    if (appName === "rpglitch") {
      await generatePaletteScss(appDir);
    }

    const [cssContent, jsContent, htmlContent, workerContent] =
      await Promise.all([
        compileStyles(entryPointScss, PICO_CSS_PATH),
        bundleJs(entryPointJs),
        fs.readFile(htmlFile, "utf8"),
        appName === "rpglitch"
          ? bundleJs(path.join(appDir, "js", "engine", "physics", "worker.js"))
          : Promise.resolve(null),
      ]);
    console.log("✅ JS and CSS processed successfully.");

    const virtualConsole = new VirtualConsole();
    virtualConsole.sendTo(console, { omitJSDOMErrors: true });
    const dom = new JSDOM(htmlContent, { virtualConsole });
    const { document } = dom.window;

    // --- INJECT CSS ---
    const styleTag = document.createElement("style");
    styleTag.textContent = cssContent;
    document.head.appendChild(styleTag);

    // --- INJECT WORKER SOURCE (RPGlitch Only) ---
    if (workerContent) {
      const dexieLib = config.extraLibs.find((l) => l.name === "dexie");
      const dexieSource = dexieLib
        ? readFileSafe(path.join(LOCAL_LIBS_DIR, dexieLib.file), "dexie")
        : "";

      // Prepend Dexie to worker bundle
      const finalWorkerCode = dexieSource + ";\n" + workerContent;

      const workerScript = document.createElement("script");
      workerScript.textContent = `window.RPGLITCH_WORKER_SOURCE = ${JSON.stringify(finalWorkerCode)};`;
      document.body.appendChild(workerScript);
      console.log("✅ Injected Worker Source Code");
    }

    // --- INJECT JAVASCRIPT ---
    // Read vendored libraries once (used by both loaders)
    const extraLibsContent = config.extraLibs
      .map((lib) => readFileSafe(path.join(LOCAL_LIBS_DIR, lib.file), lib.name))
      .filter(Boolean)
      .join(";\n");

    if (config.useComplexLoader) {
      // COMPLEX LOADER: Splits code into 500-char chunks and reassembles at runtime.
      const libsChunks = chunkString(extraLibsContent, 500);
      const jsChunks = chunkString(jsContent, 500);

      const libsString = JSON.stringify(libsChunks) + ".join('')";
      const jsString = JSON.stringify(jsChunks) + ".join('')";

      const loaderScriptContent = `
              var libsContent = ${libsString};
              var appContent = ${jsString};
              var libsScript = document.createElement('script');
              libsScript.textContent = libsContent;
              document.body.appendChild(libsScript);
              var appScript = document.createElement('script');
              appScript.textContent = appContent;
              document.body.appendChild(appScript);
            `;
      const loaderScriptTag = document.createElement("script");
      loaderScriptTag.textContent = loaderScriptContent.trim();
      document.body.appendChild(loaderScriptTag);
    } else {
      // SIMPLE LOADER: Inlines all code directly into a single script tag.
      const finalJsContent = extraLibsContent + ";\n" + jsContent;

      const scriptTag = document.createElement("script");
      scriptTag.textContent = finalJsContent;
      document.body.appendChild(scriptTag);
    }
    console.log("✅ Injected CSS and JS into HTML.");

    let finalHtml = dom.serialize();

    // --- FINAL CLEANUP: Forcefully remove external references via string replacement ---
    finalHtml = finalHtml.replace(
      /<link[^>]*href="[^"]*pico\.min\.css"[^>]*>/g,
      "<!-- pico.min.css removed -->",
    );
    finalHtml = finalHtml.replace(
      /<link[^>]*href="[^"]*index\.scss"[^>]*>/g,
      "<!-- index.scss removed -->",
    );

    const scriptsToRemove = [
      "../js/core/bootstrap.js",
      "js/core/bootstrap.js",
      "../js/index.js", // Keep just in case
      "js/index.js", // Keep just in case
      "../../../libs/dexie.js",
      "../../../libs/cash.min.js",
      "../../../libs/purify.min.js",
      "../../../libs/_hyperscript.min.js",
      "../../../build/local_libs/dexie.js", // Keep legacy for safety briefly
      "../../../build/local_libs/cash.min.js",
      "../../../build/local_libs/purify.min.js",
      "../../../build/local_libs/_hyperscript.min.js",
    ];

    scriptsToRemove.forEach((src) => {
      const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        `<script[^>]*src="${escapedSrc}"[^>]*><\/script>`,
        "g",
      );
      finalHtml = finalHtml.replace(regex, `<!-- ${src} removed -->`);
    });

    console.log("✅ Performed final string cleanup of external tags.");

    const finalOutputName =
      appName === "rpglitch" ? "RPGlitch.html" : `${appName}.html`;
    // Output directly to app directory
    const finalOutputPath = path.join(appDir, finalOutputName);

    await fs.writeFile(finalOutputPath, finalHtml);
    console.log(
      `✨ Successfully created ${path.relative(REPO_ROOT, finalOutputPath)}`,
    );
  } catch (error) {
    console.error(`\n❌ Build failed for ${appName}.`, error);
    process.exit(1);
  }
}

const appNameToBuild = process.argv[2];
build(appNameToBuild);
