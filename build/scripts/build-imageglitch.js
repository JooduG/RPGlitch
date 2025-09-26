import esbuild from "esbuild";
import * as sass from "sass";
import postcss from "postcss";
import autoprefixer from "autoprefixer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM, VirtualConsole } from "jsdom";

// --- PATHS ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const appName = "imageglitch";
const appDir = path.join(REPO_ROOT, "apps", appName);
const OUTPUT_DIR = path.join(REPO_ROOT, "build", "output");

const entryPointJs = path.join(appDir, "js", "index.js");
const entryPointScss = path.join(appDir, "scss", "index.scss");
const htmlFile = path.join(appDir, "html", "index.html");
const outputHtmlFile = path.join(OUTPUT_DIR, `${appName}.html`);
const PICO_CSS_PATH = path.resolve(REPO_ROOT, "build", "local_libs", "pico.min.css");


/**
 * Compiles SCSS to CSS, prepends PicoCSS, and runs it through PostCSS for autoprefixing.
 */
async function compileStyles() {
  try {
    // 1. Read PicoCSS content
    const picoCss = await fs.readFile(PICO_CSS_PATH, "utf8");

    // 2. Compile SCSS to CSS
    const sassResult = await sass.compileAsync(entryPointScss);
    
    // 3. Concatenate PicoCSS and compiled SCSS
    const combinedCss = picoCss + '\n' + sassResult.css;

    // 4. Run PostCSS for autoprefixing
    const postcssResult = await postcss([autoprefixer]).process(combinedCss, { from: undefined });
    
    return postcssResult.css;
  } catch (error) {
    console.error("❌ SCSS/PostCSS compilation failed:", error);
    throw error;
  }
}

/**
 * Bundles all JavaScript into a single minified string.
 */
async function bundleJs() {
    try {
        const result = await esbuild.build({
            entryPoints: [entryPointJs],
            bundle: true,
            minify: true,
            write: false, // Return the result as a string
            format: 'iife',
        });
        return result.outputFiles[0].text;
    } catch(error) {
        console.error("❌ esbuild bundling failed:", error);
        throw error;
    }
}


/**
 * The main build function.
 */
async function build() {
  try {
    console.log(`🔨 Building ${appName}...`);
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // 1. Concurrently compile styles, bundle JS, and read the HTML template
    const [cssContent, jsContent, htmlContent] = await Promise.all([
      compileStyles(),
      bundleJs(),
      fs.readFile(htmlFile, "utf8"),
    ]);
    console.log("✅ JS and CSS processed successfully.");

    // 2. Inject the CSS and JS into the HTML
    const virtualConsole = new VirtualConsole();
    virtualConsole.sendTo(console, { omitJSDOMErrors: true });
    const dom = new JSDOM(htmlContent, { virtualConsole });
    const { document } = dom.window;

    // Inject CSS into the <head>
    const styleTag = document.createElement("style");
    styleTag.textContent = cssContent;
    document.head.appendChild(styleTag);

    // Inject JS into the <body>
    const scriptTag = document.createElement("script");
    scriptTag.textContent = jsContent;
    document.body.appendChild(scriptTag);
    console.log("✅ Injected CSS and JS into HTML.");

    // 3. Write the final, self-contained HTML file
    const finalHtml = dom.serialize();
    await fs.writeFile(outputHtmlFile, finalHtml);
    console.log(`✨ Successfully created ${path.relative(REPO_ROOT, outputHtmlFile)}`);

  } catch (error) {
    console.error(`
❌ Build failed for ${appName}.`, error);
    process.exit(1);
  }
}

build();
