#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');
const sass = require('sass');
const https = require('https');

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
 * - Creates self-contained output file
 * 
 * Usage: node build-perchance.js
 * 
 * @version 2.1.0
 * @lastUpdated 2025-01-03
 */

// Build configuration
const BUILD_CONFIG = {
    version: '2.1.0',
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
    { url: 'https://unpkg.com/@picocss/pico@2.1.1/css/pico.min.css', description: 'Pico CSS framework' }
];

const EXTERNAL_JS_FILES = [
    { url: 'https://unpkg.com/hyperscript.org@0.9.12/dist/_hyperscript.min.js', description: 'Hyperscript library' },
    { url: 'https://unpkg.com/cash-dom@8.1.5/dist/cash.min.js', description: 'Cash DOM library' },
    { url: 'https://unpkg.com/dexie@3.2.4/dist/dexie.js', description: 'Dexie.js library' },
    { url: 'https://unpkg.com/dompurify@3.0.1/dist/purify.min.js', description: 'DOMPurify library' },
    // { url: 'https://perchance.org/api/getPlugin?name=text-to-image-plugin', description: 'Perchance Text-to-Image plugin' }
];

const SOURCE_FILES = [
    { name: path.join(__dirname, '../../apps/rpglitch/RPGlitch.html'), type: 'html', description: 'Main HTML structure' },
    { name: path.join(__dirname, '../../apps/rpglitch/RPGlitch.scss'), type: 'sass', description: 'Main Sass stylesheet' },
    { name: path.join(__dirname, '../../apps/rpglitch/ProfilePictureComponent.js'), type: 'component', description: 'Profile Picture rendering logic' },
    { name: path.join(__dirname, '../../apps/rpglitch/RPGlitch.js'), type: 'script', description: 'JavaScript logic' }
];

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
 * Downloads and inlines external CSS files
 * @returns {Promise<string>} Combined CSS content
 */
async function getExternalCSS() {
    console.log('📥 Downloading external CSS files...');
    let combinedCSS = '';
    
    for (const file of EXTERNAL_CSS_FILES) {
        try {
            console.log(`  📦 Downloading: ${file.description}`);
            const css = await downloadFromUrl(file.url);
            combinedCSS += `/* ${file.description} */\n${css}\n\n`;
            console.log(`  ✅ Downloaded: ${file.description}`);
        } catch (error) {
            console.error(`  ❌ Failed to download ${file.description}: ${error.message}`);
            buildMetrics.errors.push(`CSS download failed: ${file.description} - ${error.message}`);
        }
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
        try {
            console.log(`  📦 Downloading: ${file.description}`);
            const js = await downloadFromUrl(file.url);
            combinedJS += `/* ${file.description} */\n${js}\n\n`;
            console.log(`  ✅ Downloaded: ${file.description}`);
        } catch (error) {
            console.error(`  ❌ Failed to download ${file.description}: ${error.message}`);
            buildMetrics.errors.push(`JS download failed: ${file.description} - ${error.message}`);
        }
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
        const htmlContent = readFile(SOURCE_FILES[0].name, SOURCE_FILES[0].description);
        const scssContent = readFile(SOURCE_FILES[1].name, SOURCE_FILES[1].description);
        const profileComponentContent = readFile(SOURCE_FILES[2].name, SOURCE_FILES[2].description);
        const jsContent = readFile(SOURCE_FILES[3].name, SOURCE_FILES[3].description);
        
        // Compile SCSS to CSS
        const compiledCSS = compileSass(SOURCE_FILES[1].name);
        
        // Combine all content
        const combinedCSS = externalCSS + compiledCSS;
        const combinedJS = externalJS + profileComponentContent + jsContent;
        
        // Create final HTML
        const finalHtml = htmlContent
            .replace(/<link[^>]*href="[^"]*pico[^"]*"[^>]*>/g, '') // Remove Pico CSS link
            .replace(/<script[^>]*src="[^"]*(hyperscript|cash|dexie|purify)[^"]*"[^>]*><\/script>/g, '') // Remove external script tags
            .replace('</head>', `<style>\n${combinedCSS}\n</style>\n</head>`)
            .replace('</body>', `<script>\n${combinedJS}\n</script>\n</body>`);
        
        // Write the final file
        const outputPath = path.join(__dirname, '../output/RPGlitch-perchance.html');
        fs.writeFileSync(outputPath, finalHtml, 'utf8');
        
        buildMetrics.totalSize = finalHtml.length;
        
        console.log(`\n✅ Build completed successfully!`);
        console.log(`📁 Output: ${outputPath}`);
        console.log(`📊 File size: ${(finalHtml.length / 1024).toFixed(2)} KB`);
        
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
        console.log('Validation successful: output file exists.')
    } else {
        console.error('Validation failed: output file missing.')
        process.exit(1)
    }
}
