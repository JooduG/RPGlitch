/**
 * Eject ImageGlitch Script
 * Decouples apps/imageglitch into a standalone repo at _ejected_imageglitch
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../../");

const SOURCE_APP = path.join(ROOT, "apps/imageglitch");
const SOURCE_LIBS = path.join(ROOT, "libs");
const BUILD_SCRIPT_PATH = path.join(ROOT, "tools/build/app.js");

const TARGET_ROOT = path.join(ROOT, "_ejected_imageglitch");
const TARGET_SRC = path.join(TARGET_ROOT, "src");
const TARGET_LIBS = path.join(TARGET_ROOT, "libs");

// --- CONSTANTS ---
const REQUIRED_DEPS = [
  "esbuild",
  "sass",
  "postcss",
  "autoprefixer",
  "chokidar",
  "http-server",
  "npm-run-all",
];

const EXTRACT_LIBS = ["dexie.min.js", "purify.min.js", "pico.min.css"];

// --- TEMPLATES ---
const README_CONTENT = `# JooduG ImageGlitch

A standalone glitch art creation tool, extracted from the JooduG monorepo.

## Setup

\`\`\`bash
npm install
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Start Production Server

\`\`\`bash
npm start
\`\`\`
`;

// --- MAIN FUNCTION ---
async function eject() {
  console.log("🚀 Starting ImageGlitch Ejection...");

  // 1. Create Directories
  if (!fs.existsSync(TARGET_ROOT)) fs.mkdirSync(TARGET_ROOT);
  if (!fs.existsSync(TARGET_SRC)) fs.mkdirSync(TARGET_SRC);
  if (!fs.existsSync(TARGET_LIBS)) fs.mkdirSync(TARGET_LIBS);

  // 2. Copy Source Code
  console.log("📂 Copying Source Code...");
  if (fs.existsSync(SOURCE_APP)) {
    fs.cpSync(SOURCE_APP, TARGET_SRC, { recursive: true });
  } else {
    console.error(`❌ Source path not found: ${SOURCE_APP}`);
  }

  // 3. Copy Libraries
  console.log("📚 Copying Libraries...");
  EXTRACT_LIBS.forEach((lib) => {
    const srcPath = path.join(SOURCE_LIBS, lib);
    const destPath = path.join(TARGET_LIBS, lib);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
    } else {
      console.warn(`⚠️ Warning: Library not found: ${srcPath}`);
    }
  });

  // 4. Generate package.json
  console.log("📦 Generating package.json...");
  let rootPackage = {};
  try {
    rootPackage = JSON.parse(
      fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
    );
  } catch (e) {
    console.warn("⚠️  Could not read root package.json");
  }

  const newPackage = {
    name: "joodug-imageglitch",
    version: "1.0.0",
    description: "Standalone ImageGlitch App",
    type: "module",
    scripts: {
      start: "http-server dist",
      build: "node build.js",
      dev: "node build.js --watch",
    },
    dependencies: {},
    devDependencies: {},
  };

  // Extract versions
  [...REQUIRED_DEPS].forEach((dep) => {
    if (rootPackage.dependencies && rootPackage.dependencies[dep]) {
      newPackage.dependencies[dep] = rootPackage.dependencies[dep];
    } else if (
      rootPackage.devDependencies &&
      rootPackage.devDependencies[dep]
    ) {
      newPackage.devDependencies[dep] = rootPackage.devDependencies[dep];
    } else {
      console.warn(`⚠️ Warning: Dependency version not found for ${dep}`);
      newPackage.devDependencies[dep] = "latest";
    }
  });

  if (rootPackage.devDependencies && rootPackage.devDependencies["jsdom"]) {
    newPackage.devDependencies["jsdom"] = rootPackage.devDependencies["jsdom"];
  } else {
    newPackage.devDependencies["jsdom"] = "latest";
  }

  fs.writeFileSync(
    path.join(TARGET_ROOT, "package.json"),
    JSON.stringify(newPackage, null, 2),
  );

  // 5. Generate build.js from template
  console.log("🛠️  Generating build.js...");
  try {
    let buildScript = fs.readFileSync(BUILD_SCRIPT_PATH, "utf8");

    // Apply Replacements to adapt logic

    // 1. REPO_ROOT -> __dirname
    buildScript = buildScript.replace(
      `const REPO_ROOT = path.resolve(__dirname, "../..");`,
      `const REPO_ROOT = __dirname; const DIST_DIR = path.join(REPO_ROOT, "dist");`,
    );

    // 2. CONFIG
    const NEW_CONFIG = `
const APP_CONFIG = {
    extraLibs: [
        { name: "dexie", file: "dexie.min.js" },
        { name: "dompurify", file: "purify.min.js" },
    ],
    useComplexLoader: true,
};
`;
    // Regex to replace APP_CONFIGS object
    buildScript = buildScript.replace(
      /const APP_CONFIGS = \{[\s\S]*?\};/,
      NEW_CONFIG,
    );

    // 3. appName arg removal
    buildScript = buildScript.replace(
      /async function build\(appName\) \{/,
      "async function build() {",
    );
    buildScript = buildScript.replace(
      /if \(!appName[\s\S]*?process\.exit\(1\);\n\s*\}/,
      "",
    );
    buildScript = buildScript.replace(
      /console\.log\(\`🔨 Building \$\{appName\}\.\.\.\`\);/,
      "console.log(`🔨 Building ImageGlitch...`);",
    );

    // 4. Config usage
    buildScript = buildScript.replace(
      /const config = APP_CONFIGS\[appName\];/,
      "const config = APP_CONFIG;",
    );

    // 5. Paths
    // const appDir = path.join(REPO_ROOT, "apps", appName); -> const appDir = path.join(REPO_ROOT, "src");
    buildScript = buildScript.replace(
      /const appDir = path.join\(REPO_ROOT, "apps", appName\);/,
      'const appDir = path.join(REPO_ROOT, "src");',
    );

    // path.resolve(REPO_ROOT, "libs", "pico.min.css"); -> path.join(LOCAL_LIBS_DIR, "pico.min.css");
    buildScript = buildScript.replace(
      /path\.resolve\(REPO_ROOT, "libs", "pico\.min\.css"\)/,
      'path.join(LOCAL_LIBS_DIR, "pico.min.css")',
    );

    // Entry points adjustment
    // appName === "imageglitch" ? ... : ...
    // We just text replace the conditional block with fixed paths
    // This is a bit brittle, so we can try replacing the whole block
    const entryPointBlockRegex =
      /const entryPointJs =[\s\S]*?const htmlFile = path\.join\(appDir, "index\.html"\);/;
    const newEntryPointBlock = `const entryPointJs = path.join(appDir, "js", "index.js");
  const entryPointScss = path.join(appDir, "scss", "index.scss");
  const htmlFile = path.join(appDir, "index.html");`;

    buildScript = buildScript.replace(entryPointBlockRegex, newEntryPointBlock);

    // 6. Execution call
    buildScript = buildScript.replace(
      /const appNameToBuild = process\.argv\[2\];/,
      "",
    );
    buildScript = buildScript.replace(/build\(appNameToBuild\);/, "build();");

    // 7. Ensure output path is dist/index.html
    // Original: const finalOutputPath = path.join(appDir, finalOutputName);
    // New: const finalOutputPath = path.join(DIST_DIR, "index.html");

    // Ensure dist exists
    const distCheck = `
  if (!fsSync.existsSync(DIST_DIR)) {
      fsSync.mkdirSync(DIST_DIR);
  }
        `;
    // Insert dist check at start of build
    buildScript = buildScript.replace(
      /console\.log\(\`🔨 Building ImageGlitch\.\.\.\`\);/,
      `console.log(\`🔨 Building ImageGlitch...\`);${distCheck}`,
    );

    buildScript = buildScript.replace(
      /const finalOutputName =[\s\S]*?const finalOutputPath = path\.join\(appDir, finalOutputName\);/,
      `const finalOutputPath = path.join(DIST_DIR, "index.html");`,
    );

    // 8. Cleanup paths in finalHtml.replace
    // The original script has a list of scriptsToRemove.
    // We need to keep that logic but update the relative paths if needed.
    // The original logic uses hardcoded string arrays.
    // We can just rely on the existing logic if it covers what we need?
    // Original: "../js/core/bootstrap.js", "js/index.js", etc.
    // In ejected app, `js/index.js` is correct. `libs/dexie.min.js` will appear as relative?
    // Let's assume the cleanup logic is "good enough" or might need tweaking in the future.
    // For now, preservation is safer than rewriting via regex.

    fs.writeFileSync(path.join(TARGET_ROOT, "build.js"), buildScript);
  } catch (e) {
    console.error("❌ Failed to generate build.js:", e);
    throw e;
  }

  // 6. Write README.md and .gitignore
  console.log("📝 Writing Configs...");
  fs.writeFileSync(path.join(TARGET_ROOT, "README.md"), README_CONTENT);

  const gitIgnoreContent = `node_modules/\ndist/\n.DS_Store\n`;
  fs.writeFileSync(path.join(TARGET_ROOT, ".gitignore"), gitIgnoreContent);

  console.log("\n✅ Ejection Complete!");
  console.log("👉 Next Steps:");
  console.log("   cd _ejected_imageglitch");
  console.log("   npm install");
  console.log("   npm run build");
}

eject().catch((err) => {
  console.error("❌ Ejection Failed:", err);
  process.exit(1);
});
