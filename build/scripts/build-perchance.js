#!/usr/bin/env node
/* eslint-disable no-unused-vars */
 

const fs = require('fs');
 
const path = require('path');
const sass = require('sass');
const https = require('https');
let postcss;
let cssnano;
let terser;
let minifyHtml;

try {
    postcss = require('postcss');
} catch (err) {
    console.warn('⚠️ postcss not available - skipping CSS optimization');
}
try {
    cssnano = require('cssnano');
} catch (err) {
    console.warn('⚠️ cssnano not available - skipping CSS minification');
}
try {
    terser = require('terser');
} catch (err) {
    console.warn('⚠️ Terser not available - skipping JS minification');
}
try {
    ({ minify: minifyHtml } = require('html-minifier-terser'));
} catch (err) {
    console.warn('⚠️ html-minifier not available - skipping HTML minification');
}

// CLI flags
const args = process.argv.slice(2);
const offline = args.includes('--offline') || process.env.PROCESS_DOWNLOADS === 'false';
const forceDownload = args.includes('--force');

/**
 * RPGlitch Perchance Build Script (Enhanced)
 * 
 * Purpose: Combine separate RPGlitch files into a single, optimized output
 * Now includes external dependency inlining for better reliability
 * 
 * Build Process Overview:
 * - Downloads and inlines external CSS/JS libraries
 * - Compiles SCSS to CSS
 * - Inlines local JavaScript files
 * - Embeds component modules as data URLs for dynamic import
 * - Creates self-contained output file
 * 
 * Usage: node build-perchance.js [--offline] [--force]
 * 
 * @version 2.2.0
 * @lastUpdated 2025-02-15
 */

// Build configuration
const BUILD_CONFIG = {
    version: '2.2.0',
    buildTimestamp: new Date().toISOString(),
    buildId: `build-${Date.now()}`,
    performanceTracking: true
};

// Performance tracking
const buildMetrics = {
    startTime: Date.now(),
    processingTimes: {},
    totalSize: 0,
    errors: []
};

// External dependencies to inline
const EXTERNAL_CSS_FILES = [
    {
        url: 'https://unpkg.com/@picocss/pico@2.1.1/css/pico.min.css',
        local: 'pico.min.css',
        description: 'Pico CSS framework'
    }
];

const EXTERNAL_JS_FILES = [
    {
        url: 'https://unpkg.com/hyperscript.org@0.9.12/dist/_hyperscript.min.js',
        local: '_hyperscript.min.js',
        description: 'Hyperscript library'
    },
    {
        url: 'https://unpkg.com/cash-dom@8.1.5/dist/cash.min.js',
        local: 'cash.min.js',
        description: 'Cash DOM library'
    },
    {
        url: 'https://unpkg.com/dexie@3.2.4/dist/dexie.js',
        local: 'dexie.js',
        description: 'Dexie.js library'
    },
    {
        url: 'https://unpkg.com/dompurify@3.0.1/dist/purify.min.js',
        local: 'purify.min.js',
        description: 'DOMPurify library'
    },
];

const RPGLITCH_DIR = path.join(__dirname, '../../apps/rpglitch');

const ROOT_JS_FILES = fs
    .readdirSync(RPGLITCH_DIR)
    .filter((f) => f.endsWith('.js') && f !== 'RPGlitch.js')
    .map((f) => ({
        name: path.join(RPGLITCH_DIR, f),
        type: 'script',
        description: `${f} script`
    }));

ROOT_JS_FILES.push({
    name: path.join(RPGLITCH_DIR, 'js/picture.js'),
    type: 'script',
    description: 'picture.js script'
});

const SOURCE_FILES = [
    { name: path.join(RPGLITCH_DIR, 'RPGlitch.html'), type: 'html', description: 'Main HTML structure' },
    { name: path.join(RPGLITCH_DIR, 'RPGlitch.scss'), type: 'sass', description: 'Main Sass stylesheet' },
    ...ROOT_JS_FILES,
    { name: path.join(RPGLITCH_DIR, 'RPGlitch.js'), type: 'script', description: 'JavaScript logic' }
];

const COMPONENTS_DIR = path.join(__dirname, '../../apps/rpglitch/js');
const COMPONENT_FILES = fs.readdirSync(COMPONENTS_DIR)
    .filter((f) => f.endsWith('.js') && f !== 'picture.js')
    .map((f) => ({
        name: path.join(COMPONENTS_DIR, f),
        output: f,
        placeholder: `__${f.replace(/\.js$/, '').replace(/[-.]/g, '_').toUpperCase()}__`,
        description: `${f} component`
    }));

/**
 * Downloads content from a URL
 * @param {string} url - URL to download from
 * @returns {Promise<string>} Downloaded content
 */
function downloadFromUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

/**
 * Downloads a file with a local fallback if the network request fails.
 * @param {{url: string, local: string, description: string}} file
 * @returns {Promise<string>} file contents
 */

async function downloadWithFallback(file) {
    const localPath = path.join(__dirname, '../local_libs', file.local);
    const localFileExists = fs.existsSync(localPath);

    if (localFileExists && (offline || !forceDownload)) {
        console.log(`  📚 Using cached: ${file.description}`);
        return fs.readFileSync(localPath, 'utf8');
    }

    if (offline) { // This will only be reached if the local file does not exist
        throw new Error(`Offline mode enabled and local copy missing for ${file.description}`);
    }

    try {
        const data = await downloadFromUrl(file.url);
        console.log(`  ✅ Downloaded: ${file.description}`);
        fs.writeFileSync(localPath, data, 'utf8');
        return data;
    } catch (error) {
        console.warn(`  ⚠️ Failed to download ${file.description}: ${error.message}`);
        if (localFileExists) {
            console.log(`  📚 Using cached fallback: ${file.description}`);
            buildMetrics.errors.push(`${file.description} downloaded from local fallback`);
            return fs.readFileSync(localPath, 'utf8');
        }
        throw new Error(`Failed to download ${file.description} and no local copy found.`);
    }
}

/**
 * Downloads and inlines external CSS files
 * @returns {Promise<string>} Combined CSS content
 */

async function getExternalCSS() {
    console.log('📥 Downloading external CSS files...');
    let combinedCSS = '';
    
    for (const file of EXTERNAL_CSS_FILES) {
        console.log(`  📦 Fetching: ${file.description}`);
        const css = await downloadWithFallback(file);
        combinedCSS += `/* ${file.description} */\n${css}\n\n`;
    }
    
    return combinedCSS;
}

/**
 * Downloads and inlines external JavaScript files
 * @returns {Promise<string>} Combined JavaScript content
 */
async function getExternalJS() {
    console.log('📥 Downloading external JavaScript files...');
    let combinedJS = '';

    for (const file of EXTERNAL_JS_FILES) {
        console.log(`  📦 Fetching: ${file.description}`);
        const js = await downloadWithFallback(file);
        combinedJS += `/* ${file.description} */\n${js}\n\n`;
    }
    
    return combinedJS;
}

/**
 * Compiles Sass to CSS
 * @param {string} inputPath - Path to the Sass file
 * @returns {string} Compiled CSS
 */
function compileSass(inputPath) {
    const startTime = Date.now();
    
    try {
        console.log(`📦 Compiling Sass: ${inputPath}`);
        
        const result = sass.compile(inputPath, {
            style: 'compressed',
            loadPaths: [path.dirname(inputPath)]
        });
        
        const processingTime = Date.now() - startTime;
        buildMetrics.processingTimes.sass = processingTime;
        
        console.log(`✅ Sass compiled successfully (${processingTime}ms)`);
        return result.css;
        
    } catch (error) {
        buildMetrics.errors.push(`Sass compilation failed: ${error.message}`);
        console.error(`❌ Sass compilation failed: ${error.message}`);
        throw error;
    }
}

/**
 * Optimizes CSS using PostCSS and cssnano
 * @param {string} css
 * @returns {Promise<string>} Minified CSS
 */
async function optimizeCSS(css) {
    const startTime = Date.now();
if (!postcss || !cssnano) {
    console.warn('⚠️ PostCSS or cssnano not available - skipping CSS minification');
    return css;
}
    try {
        const result = await postcss([cssnano]).process(css, { from: undefined });
        buildMetrics.processingTimes.postcss = Date.now() - startTime;
        console.log(`✅ CSS optimized (${buildMetrics.processingTimes.postcss}ms)`);
        return result.css;
    } catch (error) {
        buildMetrics.errors.push(`CSS optimization failed: ${error.message}`);
        console.error(`❌ CSS optimization failed: ${error.message}`);
        return css;
    }
}

/**
 * Minifies JavaScript using Terser
 * @param {string} js
 * @returns {Promise<string>} Minified JS
 */
async function minifyJS(js) {
    const startTime = Date.now();
    if (!terser) {
        console.warn('⚠️ Terser not available - skipping JS minification');
        return js;
    }
    try {
        const result = await terser.minify(js, { mangle: { properties: false } });
        buildMetrics.processingTimes.terser = Date.now() - startTime;
        console.log(`✅ JavaScript minified (${buildMetrics.processingTimes.terser}ms)`);
        return result.code;
    } catch (error) {
        buildMetrics.errors.push(`JS minification failed: ${error.message}`);
        console.error(`❌ JS minification failed: ${error.message}`);
        return js;
    }
}

/**
 * Minifies HTML output
 * @param {string} html
 * @returns {Promise<string>} Minified HTML
 */
async function minifyHTMLContent(html) {
    const startTime = Date.now();
    if (!minifyHtml) {
        console.warn('⚠️ html-minifier not available - skipping HTML minification');
        return html;
    }
    try {
        const result = await minifyHtml(html, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: false,
            minifyJS: false
        });
        buildMetrics.processingTimes.htmlmin = Date.now() - startTime;
        console.log(`✅ HTML minified (${buildMetrics.processingTimes.htmlmin}ms)`);
        return result;
    } catch (error) {
        buildMetrics.errors.push(`HTML minification failed: ${error.message}`);
        console.error(`❌ HTML minification failed: ${error.message}`);
        return html;
    }
}

/**
 * Reads and validates a file
 * @param {string} filePath - Path to the file
 * @param {string} description - Description for logging
 * @returns {string} File content
 */
function readFile(filePath, description) {
    const startTime = Date.now();
    
    try {
        console.log(`📖 Reading ${description}: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (!content || content.trim().length === 0) {
            throw new Error(`File is empty: ${filePath}`);
        }
        
        const processingTime = Date.now() - startTime;
        buildMetrics.processingTimes[description.toLowerCase().replace(/\s+/g, '_')] = processingTime;
        
        console.log(`✅ ${description} read successfully (${processingTime}ms)`);
        return content;
        
    } catch (error) {
        buildMetrics.errors.push(`${description} read failed: ${error.message}`);
        console.error(`❌ Failed to read ${description}: ${error.message}`);
        throw error;
    }
}

/**
 * Prints build metrics and performance data
 */
function printBuildMetrics() {
    const totalTime = Date.now() - buildMetrics.startTime;
    
    console.log('\n📊 Build Metrics:');
    console.log(`  ⏱️  Total build time: ${totalTime}ms`);
    console.log(`  📦 Total output size: ${buildMetrics.totalSize} bytes`);
    
    if (Object.keys(buildMetrics.processingTimes).length > 0) {
        console.log('  ⚡ Processing times:');
        for (const [step, time] of Object.entries(buildMetrics.processingTimes)) {
            console.log(`    ${step}: ${time}ms`);
        }
    }
    
    if (buildMetrics.errors.length > 0) {
        console.log('  ⚠️  Errors encountered:');
        buildMetrics.errors.forEach(error => console.log(`    ${error}`));
    }
}

/**
 * Main build function
 */
async function buildPerchanceFile() {
    console.log('🚀 Starting RPGlitch Perchance build...\n');
    
    try {
        // Download external dependencies
        const externalCSS = await getExternalCSS();
        const externalJS = await getExternalJS();
        
        // Read and process source files
        const htmlFile = SOURCE_FILES.find(f => f.type === 'html');
        const scssFile = SOURCE_FILES.find(f => f.type === 'sass');
        const mainJsFile = SOURCE_FILES.find(f => f.name.endsWith('RPGlitch.js'));
        const helperJsFiles = SOURCE_FILES.filter(f => f.type === 'script' && f !== mainJsFile);

        const htmlContent = readFile(htmlFile.name, htmlFile.description);
        readFile(scssFile.name, scssFile.description); // Read for validation
        const helperScripts = helperJsFiles
            .map((file) => readFile(file.name, file.description))
            .join('\n');
        let jsContent = readFile(mainJsFile.name, mainJsFile.description);

        const componentContents = COMPONENT_FILES.map(file => ({
            ...file,
            content: readFile(file.name, file.description)
        }));

        for (const file of componentContents) {
            const optimized = await minifyJS(file.content);
            const dataUrl = `data:text/javascript;base64,${Buffer.from(optimized).toString('base64')}`;
            jsContent = jsContent.replace(`'${file.placeholder}'`, `'${dataUrl}'`);
        }
        
        // Compile SCSS to CSS
        const compiledCSS = compileSass(SOURCE_FILES[1].name);

        // Combine all content
        const combinedCSS = externalCSS + compiledCSS;
        const combinedJS = externalJS + helperScripts + jsContent;

        // Optimize CSS and JavaScript
        const optimizedCSS = await optimizeCSS(combinedCSS);
        const optimizedJS = await minifyJS(combinedJS);

        // Create final HTML
        const finalHtml = htmlContent
            .replace(/<link[^>]*href="[^"]*pico[^"]*"[^>]*>/g, '') // Remove Pico CSS link
            .replace(/<script[^>]*src="[^"]*(hyperscript|cash|dexie|purify)[^"]*"[^>]*><\/script>/g, '') // Remove external script tags
            .replace('</head>', `<style>\n${optimizedCSS}\n</style>\n</head>`)
            .replace('</body>', `<script>\n${optimizedJS}\n</script>\n</body>`);

        const minifiedHtml = await minifyHTMLContent(finalHtml);

        // Write the final file
        const outputPath = path.join(__dirname, '../output/RPGlitch-perchance.html');
        fs.writeFileSync(outputPath, minifiedHtml, 'utf8');

        const componentDir = path.join(__dirname, '../output/components');
        fs.mkdirSync(componentDir, { recursive: true });
        let componentsSize = 0;
        for (const file of componentContents) {
            const optimized = await minifyJS(file.content);
            fs.writeFileSync(path.join(componentDir, file.output), optimized, 'utf8');
            componentsSize += optimized.length;
        }
        buildMetrics.totalSize = minifiedHtml.length + componentsSize;
        console.log(`\n✅ Build completed successfully!`);
        console.log(`📁 Output: ${outputPath}`);
        console.log(`📊 File size: ${(minifiedHtml.length / 1024).toFixed(2)} KB`);
        printBuildMetrics();
    } catch (error) {
        console.error(`\n❌ Build failed: ${error.message}`);
        printBuildMetrics();
        process.exit(1);
    }
}

// Run the build
buildPerchanceFile();

// Simple build output validation
module.exports.validateOutputFile = function validateOutputFile() {
    const outputPath = path.join(__dirname, '../output/RPGlitch-perchance.html')
    if (fs.existsSync(outputPath)) {
        return true
    } else {
        console.error('Validation failed: output file missing.')
        process.exit(1)
    }
}
