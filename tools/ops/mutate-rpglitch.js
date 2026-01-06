import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../");

async function mutate() {
  console.log("🧬 Starting RPGlitch Mutation...");

  // --- 1. CLEANUP ---
  console.log("🗑️  Cleaning up ImageGlitch and legacy artifacts...");
  const pathsToRemove = [
    path.join(REPO_ROOT, "apps", "imageglitch"),
    path.join(REPO_ROOT, "_ejected_imageglitch"),
    path.join(REPO_ROOT, "tools", "ops", "eject-imageglitch.js"),
  ];

  for (const p of pathsToRemove) {
    try {
      await fs.rm(p, { recursive: true, force: true });
      console.log(`   - Removed: ${p}`);
    } catch (e) {
      console.log(`   - Skipped (not found/error): ${p}`);
    }
  }

  // --- 2. RESTRUCTURE ---
  console.log("🏗️  Restructuring repository...");
  const srcDir = path.join(REPO_ROOT, "src");
  const appSource = path.join(REPO_ROOT, "apps", "rpglitch");
  const appsDir = path.join(REPO_ROOT, "apps");

  try {
    await fs.mkdir(srcDir, { recursive: true });

    // Read apps/rpglitch content
    const files = await fs.readdir(appSource);
    for (const file of files) {
      const srcPath = path.join(appSource, file);
      const destPath = path.join(srcDir, file);
      await fs.rename(srcPath, destPath);
      console.log(`   - Moved: ${file} -> src/`);
    }

    // Remove empty apps directory
    await fs.rm(appsDir, { recursive: true, force: true });
    console.log("   - Removed: apps/ directory");
  } catch (error) {
    console.error("❌ Error during restructuring:", error);
    process.exit(1);
  }

  // --- 3. REWRITE BUILD SCRIPT ---
  console.log("🔨 Rewrite Build Script (tools/build.js)...");
  const buildScriptContent = `
/**
 * RPGlitch Build Script
 * 
 * Compiles SCSS, bundles JS, and injects everything into a single HTML file.
 * Targeted for: src/ -> dist/RPGlitch.html
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../");
const LOCAL_LIBS_DIR = path.join(REPO_ROOT, "libs");

// Configuration
const CONFIG = {
  entryJs: path.join(REPO_ROOT, "src", "js", "core", "bootstrap.js"),
  entryScss: path.join(REPO_ROOT, "src", "scss", "index.scss"),
  htmlFile: path.join(REPO_ROOT, "src", "index.html"),
  outputDir: path.join(REPO_ROOT, "dist"),
  outputFile: "RPGlitch.html",
  extraLibs: [
    { name: "cash", file: "cash.min.js" },
    { name: "dexie", file: "dexie.min.js" },
    { name: "dompurify", file: "purify.min.js" },
    { name: "hyperscript", file: "_hyperscript.min.js" },
  ]
};

function readFileSafe(filePath, kind) {
  try {
    return fsSync.readFileSync(filePath, "utf8");
  } catch {
    console.warn(\`⚠️  Missing \${kind}: \${filePath}\`);
    return "";
  }
}

async function generatePaletteScss() {
  const constantsPath = path.join(REPO_ROOT, "src", "js", "core", "constants.js");
  const outputPath = path.join(REPO_ROOT, "src", "scss", "abstracts", "_palette-generated.scss");
  
  try {
    const jsContent = await fs.readFile(constantsPath, "utf8");
    const match = jsContent.match(/export const PALETTE = \\{([\\s\\S]*?)\\};/);
    if (!match) return;

    const lines = match[1].split("\\n");
    const colors = [];
    for (const line of lines) {
      const colorMatch = line.trim().match(/^(\\w+):\\s*"#([0-9a-fA-F]{6})"/);
      if (colorMatch) {
         colors.push(\`  "\${colorMatch[1]}": (color: #\${colorMatch[2]})\`);
      }
    }
    const scss = \`// AUTO-GENERATED\\n$signature-colors: (\\n\${colors.join(",\\n")}\\n);\\n\`;
    await fs.writeFile(outputPath, scss);
    console.log(\`🎨 Generated Palette SCSS (\${colors.length} colors)\`);
  } catch (e) {
    console.warn("⚠️  Palette generation skipped:", e.message);
  }
}

async function compileStyles(entry, picoPath) {
  const picoCss = await fs.readFile(picoPath, "utf8");
  const sassResult = await sass.compileAsync(entry);
  const combined = picoCss + "\\n" + sassResult.css;
  const result = await postcss([autoprefixer]).process(combined, { from: undefined });
  return result.css;
}

async function bundleJs(entry) {
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    write: false,
    format: "iife",
  });
  return result.outputFiles[0].text;
}

async function build() {
  console.log("🚀 Building RPGlitch...");
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  await generatePaletteScss();

  const picoPath = path.join(LOCAL_LIBS_DIR, "pico.min.css");
  
  const [css, js, html, workerJs] = await Promise.all([
    compileStyles(CONFIG.entryScss, picoPath),
    bundleJs(CONFIG.entryJs),
    fs.readFile(CONFIG.htmlFile, "utf8"),
    bundleJs(path.join(REPO_ROOT, "src", "js", "engine", "physics", "worker.js"))
  ]);

  const virtualConsole = new VirtualConsole();
  virtualConsole.sendTo(console, { omitJSDOMErrors: true });
  const dom = new JSDOM(html, { virtualConsole });
  const { document } = dom.window;

  // Inject CSS
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // Inject Worker
  if (workerJs) {
     const dexieLib = CONFIG.extraLibs.find(l => l.name === "dexie");
     const dexieSrc = dexieLib ? readFileSafe(path.join(LOCAL_LIBS_DIR, dexieLib.file), "dexie") : "";
     const workerContent = dexieSrc + ";\\n" + workerJs;
     const workerScript = document.createElement("script");
     workerScript.textContent = \`window.RPGLITCH_WORKER_SOURCE = \${JSON.stringify(workerContent)};\`;
     document.body.appendChild(workerScript);
  }

  // Inject JS (Simple Loader)
  const libs = CONFIG.extraLibs.map(l => readFileSafe(path.join(LOCAL_LIBS_DIR, l.file), l.name)).join(";\\n");
  const finalJs = libs + ";\\n" + js;
  const script = document.createElement("script");
  script.textContent = finalJs;
  document.body.appendChild(script);

  let finalHtml = dom.serialize();
  
  // Cleanup External Links
  finalHtml = finalHtml.replace(/<link[^>]*href="[^"]*pico\\.min\\.css"[^>]*>/g, "");
  finalHtml = finalHtml.replace(/<link[^>]*href="[^"]*index\\.scss"[^>]*>/g, "");
  
  // Remove scripts
  const scriptsToRemove = [
    "js/core/bootstrap.js", "js/index.js", "../js/index.js", 
    "libs/dexie", "libs/cash", "libs/purify", "libs/_hyperscript"
  ];
  // Regex to remove any script tag that contains these strings in src
  scriptsToRemove.forEach(s => {
      // Escape for regex
      const escaped = s.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&"); 
      const regex = new RegExp(\`<script[^>]*src="[^"]*\${escaped}[^"]*"[^>]*><\\/script>\`, "g");
      finalHtml = finalHtml.replace(regex, "");
  });

  const finalPath = path.join(CONFIG.outputDir, CONFIG.outputFile);
  await fs.writeFile(finalPath, finalHtml);
  console.log(\`✅ Build Complete: \${path.relative(REPO_ROOT, finalPath)}\`);
}

build().catch(e => {
  console.error("❌ Build Failed:", e);
  process.exit(1);
});
`;

  await fs.writeFile(
    path.join(REPO_ROOT, "tools", "build.js"),
    buildScriptContent.trim(),
  );
  console.log("   - Created: tools/build.js");

  // --- 4. HANDLE WATCH SCRIPT ---
  console.log("👀 Updating Watch Script...");
  const watchScriptContent = `
/**
 * Watcher for RPGlitch (Single App)
 */
import chokidar from "chokidar";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../");
const SRC_DIR = path.join(REPO_ROOT, "src");
const BUILD_SCRIPT = path.join(REPO_ROOT, "tools", "build.js");

console.log("👀 Watching src/ for changes...");

const watcher = chokidar.watch([
  path.join(SRC_DIR, "**/*.html"),
  path.join(SRC_DIR, "**/*.js"),
  path.join(SRC_DIR, "**/*.scss")
], {
  ignored: /(^|[\\/\\\\])\\../,
  persistent: true,
  ignoreInitial: true
});

const runBuild = () => {
  console.log("🚀 Change detected. Rebuilding...");
  exec(\`node "\${BUILD_SCRIPT}"\`, (err, stdout, stderr) => {
    if (err) console.error("❌ Build Error:", stderr);
    else console.log(stdout.trim());
  });
};

watcher.on("all", runBuild);
`;
  await fs.writeFile(
    path.join(REPO_ROOT, "tools", "watch.js"),
    watchScriptContent.trim(),
  );
  console.log("   - Created/Updated: tools/watch.js");

  // Remove old tools/build dir if exists
  try {
    await fs.rm(path.join(REPO_ROOT, "tools", "build"), {
      recursive: true,
      force: true,
    });
    console.log("   - Removed: tools/build/ (legacy)");
  } catch (e) {}

  // --- 5. UPDATE PACKAGE.JSON ---
  console.log("📦 Updating package.json...");
  const pkgPath = path.join(REPO_ROOT, "package.json");
  const pkgFn = await fs.readFile(pkgPath, "utf8");
  const pkg = JSON.parse(pkgFn);

  pkg.name = "joodug-rpglitch";
  pkg.description = "The Prometheus Narrative Physics Engine for Perchance.";

  // Clean Scripts
  pkg.scripts = {
    start: "npm run build && http-server dist -o",
    build: "node tools/build.js",
    watch: "node tools/watch.js",
    test: "jest",
    "lint:js": "eslint .",
    "lint:js:fix": "eslint . --fix",
  };

  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
  console.log("   - Updated: package.json");

  console.log("🧬 RPGlitch Mutation Complete. The repo is now flat.");
}

mutate().catch(console.error);
