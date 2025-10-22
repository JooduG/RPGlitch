#!/usr/bin/env node
import esbuild from "esbuild";
import * as sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM, VirtualConsole } from "jsdom";

// --- PARSE ARGS ---
const appName = process.argv[2];
if (!appName) {
  console.error("❌ Error: No app name provided.");
  console.log("Usage: node build-app.js <app-name>");
  process.exit(1);
}

// --- PATHS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const appDir = path.join(REPO_ROOT, "apps", appName);
const OUTPUT_DIR = path.join(REPO_ROOT, "build", "output");
const LOCAL_LIBS_DIR = path.join(REPO_ROOT, 'build', 'local_libs');

const entryPointJs = path.join(appDir, "js", "index.js");
const entryPointScss = path.join(appDir, "scss", "index.scss");
const htmlFile = path.join(appDir, "html", "index.html");
const outputHtmlFile = path.join(OUTPUT_DIR, `${appName}.html`);
const PICO_CSS_PATH = path.resolve(REPO_ROOT, "build", "local_libs", "pico.min.css");

// --- RPGlitch Specific Config ---
const RPGlitchLibs = {
  cash: { file: 'cash.min.js' },
  dexie: { file: 'dexie.js' },
  dompurify: { file: 'purify.min.js' },
  hyperscript: { file: '_hyperscript.min.js' },
};

// --- UTILITIES ---
async function readFileSafe(filePath, kind) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
        console.warn(`⚠️  Missing ${kind}: ${filePath}`);
        return '';
    }
    throw error;
  }
}

function chunkString(str, chunkSize) {
    const chunks = [];
    for (let i = 0; i < str.length; i += chunkSize) {
        chunks.push(str.substring(i, i + chunkSize));
    }
    return chunks;
}


async function compileStyles() {
  try {
    const picoCss = await fs.readFile(PICO_CSS_PATH, "utf8");
    const sassResult = await sass.compileAsync(entryPointScss);
    const combinedCss = picoCss + '\n' + sassResult.css;
    const postcssResult = await postcss([autoprefixer]).process(combinedCss, { from: undefined });
    return postcssResult.css;
  } catch (error) {
    console.error(`❌ SCSS/PostCSS compilation failed for ${appName}:`, error);
    throw error;
  }
}

async function bundleJs() {
    try {
        const result = await esbuild.build({
            entryPoints: [entryPointJs],
            bundle: true,
            minify: true,
            write: false,
            format: 'iife',
        });
        return result.outputFiles[0].text;
    } catch(error) {
        console.error(`❌ esbuild bundling failed for ${appName}:`, error);
        throw error;
    }
}

async function build() {
  try {
    console.log(`🔨 Building ${appName}...`);
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const [cssContent, jsContent, htmlContent] = await Promise.all([
      compileStyles(),
      bundleJs(),
      fs.readFile(htmlFile, "utf8"),
    ]);
    console.log(`✅ JS and CSS for ${appName} processed successfully.`);

    const virtualConsole = new VirtualConsole();
    virtualConsole.sendTo(console, { omitJSDOMErrors: true });
    const dom = new JSDOM(htmlContent, { virtualConsole });
    const { document } = dom.window;

    const styleTag = document.createElement("style");
    styleTag.textContent = cssContent;
    document.head.appendChild(styleTag);

    // Conditional logic for RPGlitch
    if (appName === 'rpglitch') {
        const libPromises = Object.values(RPGlitchLibs).map(lib =>
            readFileSafe(path.join(LOCAL_LIBS_DIR, lib.file), lib.file)
        );
        const libContents = await Promise.all(libPromises);
        const combinedLibs = libContents.filter(Boolean).join(';\n');

        const libsChunks = chunkString(combinedLibs, 500);
        const jsChunks = chunkString(jsContent, 500);
        const libsString = JSON.stringify(libsChunks) + ".join('')";
        const jsString = JSON.stringify(jsChunks) + ".join('')";

        const loaderScriptContent = `
            const libsContent = ${libsString};
            const appContent = ${jsString};
            const libsScript = document.createElement('script');
            libsScript.id = 'rpglitch-inline-libs';
            libsScript.textContent = libsContent;
            document.body.appendChild(libsScript);
            const appScript = document.createElement('script');
            appScript.id = 'rpglitch-inline-js';
            appScript.textContent = appContent;
            document.body.appendChild(appScript);
        `;
        const loaderScript = document.createElement('script');
        loaderScript.id = 'rpglitch-loader';
        loaderScript.textContent = loaderScriptContent.trim();
        document.body.appendChild(loaderScript);
    } else {
        const scriptTag = document.createElement("script");
        scriptTag.textContent = jsContent;
        document.body.appendChild(scriptTag);
    }

    console.log("✅ Injected CSS and JS into HTML.");

    const finalHtml = dom.serialize();
    await fs.writeFile(outputHtmlFile, finalHtml);
    console.log(`✨ Successfully created ${path.relative(REPO_ROOT, outputHtmlFile)}`);

  } catch (error) {
    console.error(`\n❌ Build failed for ${appName}.`);
    process.exit(1);
  }
}

build();
