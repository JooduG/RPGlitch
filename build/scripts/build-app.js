import esbuild from "esbuild";
import * as sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import fs from "fs/promises";
import fsSync from 'fs';
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM, VirtualConsole } from "jsdom";

// --- CONFIGURATION ---
const APP_CONFIGS = {
  imageglitch: {
    extraLibs: [],
    useComplexLoader: false
  },
  rpglitch: {
    extraLibs: [
      { name: 'cash', file: 'cash.min.js' },
      { name: 'dexie', file: 'dexie.js' },
      { name: 'dompurify', file: 'purify.min.js' },
      { name: 'hyperscript', file: '_hyperscript.min.js' },
    ],
    useComplexLoader: true
  }
};

// --- PATHS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const OUTPUT_DIR = path.join(REPO_ROOT, "build", "output");
const LOCAL_LIBS_DIR = path.join(REPO_ROOT, 'build', 'local_libs');

// --- UTILITIES ---
function chunkString(str, chunkSize) {
    const chunks = [];
    for (let i = 0; i < str.length; i += chunkSize) {
        chunks.push(str.substring(i, i + chunkSize));
    }
    return chunks;
}

function readFileSafe(filePath, kind) {
    try {
        return fsSync.readFileSync(filePath, 'utf8');
    } catch {
        console.warn(`⚠️  Missing ${kind}: ${filePath}`);
        return '';
    }
}

// --- CORE BUILD LOGIC ---
async function compileStyles(entryPointScss, picoCssPath) {
    try {
        const picoCss = await fs.readFile(picoCssPath, "utf8");
        const sassResult = await sass.compileAsync(entryPointScss);
        const combinedCss = picoCss + '\n' + sassResult.css;
        const postcssResult = await postcss([autoprefixer]).process(combinedCss, { from: undefined });
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
            format: 'iife',
        });
        return result.outputFiles[0].text;
    } catch(error) {
        console.error("❌ esbuild bundling failed:", error);
        throw error;
    }
}

// --- MAIN ---
async function build(appName) {
    if (!appName || !APP_CONFIGS[appName]) {
        console.error(`❌ Invalid or missing app name. Use 'rpglitch' or 'imageglitch'.`);
        process.exit(1);
    }
    console.log(`🔨 Building ${appName}...`);

    const config = APP_CONFIGS[appName];
    const appDir = path.join(REPO_ROOT, "apps", appName);

    const entryPointJs = path.join(appDir, "js", "index.js");
    const entryPointScss = path.join(appDir, "scss", "index.scss");
    const htmlFile = path.join(appDir, "html", "index.html");
    const PICO_CSS_PATH = path.resolve(REPO_ROOT, "build", "local_libs", "pico.min.css");

    try {
        await fs.mkdir(OUTPUT_DIR, { recursive: true });

        const [cssContent, jsContent, htmlContent] = await Promise.all([
            compileStyles(entryPointScss, PICO_CSS_PATH),
            bundleJs(entryPointJs),
            fs.readFile(htmlFile, "utf8"),
        ]);
        console.log("✅ JS and CSS processed successfully.");

        const virtualConsole = new VirtualConsole();
        virtualConsole.sendTo(console, { omitJSDOMErrors: true });
        const dom = new JSDOM(htmlContent, { virtualConsole });
        const { document } = dom.window;

        // Inject CSS
        const styleTag = document.createElement("style");
        styleTag.textContent = cssContent;
        document.head.appendChild(styleTag);

        // Remove existing script tags to prevent duplicates
        Array.from(document.querySelectorAll('script[src="js/index.js"]')).forEach(s => s.remove());

        // Inject JS
        if (config.useComplexLoader) {
            const extraLibsContent = config.extraLibs
                .map(lib => readFileSafe(path.join(LOCAL_LIBS_DIR, lib.file), lib.name))
                .filter(Boolean)
                .join(';\n');

            const libsChunks = chunkString(extraLibsContent, 500);
            const jsChunks = chunkString(jsContent, 500);

            const libsString = JSON.stringify(libsChunks) + ".join('')";
            const jsString = JSON.stringify(jsChunks) + ".join('')";

            const loaderScriptContent = `
              const libsContent = ${libsString};
              const appContent = ${jsString};
              const libsScript = document.createElement('script');
              libsScript.textContent = libsContent;
              document.body.appendChild(libsScript);
              const appScript = document.createElement('script');
              appScript.textContent = appContent;
              document.body.appendChild(appScript);
            `;
            const loaderScriptTag = document.createElement('script');
            loaderScriptTag.textContent = loaderScriptContent.trim();
            document.body.appendChild(loaderScriptTag);

        } else {
            const scriptTag = document.createElement("script");
            scriptTag.textContent = jsContent;
            document.body.appendChild(scriptTag);
        }
        console.log("✅ Injected CSS and JS into HTML.");

        const finalHtml = dom.serialize();
        const finalOutputName = appName === 'rpglitch' ? 'RPGlitch.html' : `${appName}.html`;
        const finalOutputPath = path.join(OUTPUT_DIR, finalOutputName);
        await fs.writeFile(finalOutputPath, finalHtml);
        console.log(`✨ Successfully created ${path.relative(REPO_ROOT, finalOutputPath)}`);

    } catch (error) {
        console.error(`\n❌ Build failed for ${appName}.`, error);
        process.exit(1);
    }
}

const appNameToBuild = process.argv[2];
build(appNameToBuild);
