#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');
const sass = require('sass'); // Added for Sass compilation
const https = require('https');
const http = require('http');

/**
 * RPGlitch Perchance Build Script
 * 
 * Purpose: Combine separate RPGlitch files into a single, optimized output
 * 
 * Build Process Overview:
 * - Merges HTML, CSS, and JavaScript into a single file
 * - Optimizes for Perchance platform deployment
 * - Includes performance metrics and validation
 * 
 * Usage: node build-perchance.js
 * 
 * @version 1.5.0
 * @lastUpdated 2025-01-03
 */

// Build configuration and metadata
const BUILD_CONFIG = {
    version: '1.5.0',
    buildTimestamp: new Date().toISOString(),
    buildId: `build-${Date.now()}`,
    performanceTracking: true,
    contentValidation: true,
    maxRetries: 3,
    downloadTimeout: 30000, // 30 seconds
    minContentLength: 1000 // Minimum expected content length for validation
};

// Performance tracking
const buildMetrics = {
    startTime: Date.now(),
    downloadTimes: {},
    processingTimes: {},
    totalSize: 0,
    errors: []
};

const SOURCE_FILES = [
    { name: 'apps/rpglitch/RPGlitch.html', type: 'html', description: 'Main HTML structure' },
    { name: 'apps/rpglitch/RPGlitch.scss', type: 'sass', description: 'Main Sass stylesheet' },
    { name: 'apps/rpglitch/ProfilePictureComponent.js', type: 'component', description: 'Profile Picture rendering logic' },
    { name: 'apps/rpglitch/RPGlitch.js', type: 'script', description: 'JavaScript logic' }
];

// External JS files that should be inlined during build for reliable loading
// These are downloaded and inlined to avoid CDN timing issues
const EXTERNAL_JS_FILES = [
    { url: 'https://unpkg.com/hyperscript.org@0.9.12', description: 'Hyperscript', expectedMinLength: 50000 },
    { url: 'https://unpkg.com/cash-dom', description: 'Cash DOM', expectedMinLength: 20000 },
    { url: 'https://unpkg.com/dexie@4.0.8/dist/dexie.js', description: 'Dexie.js', expectedMinLength: 100000 },
    { url: 'https://unpkg.com/dompurify@3.0.1/dist/purify.min.js', description: 'DOMPurify', expectedMinLength: 15000 }
];

/**
 * Validates downloaded content for basic integrity
 * @param {string} content - The downloaded content
 * @param {Object} fileInfo - Information about the file being validated
 * @returns {boolean} True if content is valid
 */
function validateDownloadedContent(content, fileInfo) {
    if (!content || typeof content !== 'string') {
        buildMetrics.errors.push(`Invalid content type for ${fileInfo.description}`);
        return false;
    }
    
    if (content.length < BUILD_CONFIG.minContentLength) {
        buildMetrics.errors.push(`Content too short for ${fileInfo.description}: ${content.length} characters`);
        return false;
    }
    
    if (fileInfo.expectedMinLength && content.length < fileInfo.expectedMinLength) {
        buildMetrics.errors.push(`Content shorter than expected for ${fileInfo.description}: ${content.length} < ${fileInfo.expectedMinLength}`);
        return false;
    }
    
    // Basic JavaScript validation for JS files
    if (fileInfo.description.includes('JS') || fileInfo.description.includes('js')) {
        if (!content.includes('function') && !content.includes('var') && !content.includes('const') && !content.includes('let')) {
            buildMetrics.errors.push(`Content doesn't appear to be valid JavaScript for ${fileInfo.description}`);
            return false;
        }
    }
    
    return true;
}

/**
 * Downloads content from a URL with retry logic and validation
 * @param {string} url - The URL to download from
 * @param {Object} fileInfo - Information about the file being downloaded
 * @returns {Promise<string>} The downloaded content
 */
function downloadFromUrl(url, fileInfo) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;
        let retryCount = 0;
        
        const makeRequest = (requestUrl) => {
            const startTime = Date.now();
            
            const req = protocol.get(requestUrl, { timeout: BUILD_CONFIG.downloadTimeout }, (res) => {
                // Handle redirects
                if (res.statusCode === 301 || res.statusCode === 302) {
                    const newUrl = res.headers.location;
                    if (newUrl) {
                        const resolvedUrl = newUrl.startsWith('http') ? newUrl : new URL(newUrl, requestUrl).href;
                        console.log(`🔄 Following redirect: ${requestUrl} -> ${resolvedUrl}`);
                        makeRequest(resolvedUrl);
                        return;
                    }
                }
                
                if (res.statusCode !== 200) {
                    const error = new Error(`Failed to download ${url}: ${res.statusCode}`);
                    buildMetrics.errors.push(error.message);
                    reject(error);
                    return;
                }
                
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const downloadTime = Date.now() - startTime;
                    buildMetrics.downloadTimes[fileInfo.description] = downloadTime;
                    
                    console.log(`✅ Downloaded ${fileInfo.description} (${data.length} characters) in ${downloadTime}ms`);
                    
                    // Validate downloaded content
                    if (BUILD_CONFIG.contentValidation && !validateDownloadedContent(data, fileInfo)) {
                        const error = new Error(`Content validation failed for ${fileInfo.description}`);
                        reject(error);
                        return;
                    }
                    
                    resolve(data);
                });
            });
            
            req.on('error', (err) => {
                const error = new Error(`Failed to download ${url}: ${err.message}`);
                buildMetrics.errors.push(error.message);
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                const error = new Error(`Download timeout for ${url}`);
                buildMetrics.errors.push(error.message);
                reject(error);
            });
        };
        
        const attemptDownload = () => {
            try {
                makeRequest(url);
            } catch (error) {
                retryCount++;
                if (retryCount < BUILD_CONFIG.maxRetries) {
                    console.log(`🔄 Retry ${retryCount}/${BUILD_CONFIG.maxRetries} for ${fileInfo.description}...`);
                    setTimeout(attemptDownload, 1000 * retryCount); // Exponential backoff
                } else {
                    const finalError = new Error(`Failed to download ${fileInfo.description} after ${BUILD_CONFIG.maxRetries} attempts`);
                    buildMetrics.errors.push(finalError.message);
                    reject(finalError);
                }
            }
        };
        
        attemptDownload();
    });
}

/**
 * Compiles a Sass file to CSS with enhanced error handling
 * @param {string} inputPath - The path to the input Sass file
 * @returns {string|null} The compiled CSS string, or null if an error occurs
 */
function compileSass(inputPath) {
    const startTime = Date.now();
    console.log(`🎨 Compiling Sass: ${inputPath}`);
    
    try {
        const result = sass.compile(inputPath, {
            style: 'compressed', // Minify the output CSS
            loadPaths: [path.join(__dirname, '..', '..', 'node_modules', '@picocss', 'pico', 'scss')]
        });
        
        const compileTime = Date.now() - startTime;
        buildMetrics.processingTimes['sass-compilation'] = compileTime;
        
        console.log(`✅ Sass compiled successfully (${result.css.length} characters) in ${compileTime}ms`);
        
        // Validate compiled CSS
        if (BUILD_CONFIG.contentValidation && result.css.length < 1000) {
            buildMetrics.errors.push('Compiled CSS seems too short');
            return null;
        }
        
        return result.css;
    } catch (error) {
        const errorMsg = `Sass compilation failed: ${error.message}`;
        buildMetrics.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
        return null;
    }
}

/**
 * Combines the HTML, CSS, and JS source files into a single string for the 'right panel'.
 * @returns {Promise<string|null>} The combined content, or null if an error occurs.
 */
async function getCombinedRightPanelContent() {
    let combinedContent = '';
    let hasErrors = false;
    let jsBundle = '';
    let cssBundle = '';

    // Download and inline external JS files for reliable loading
    console.log(`ℹ️ Downloading and inlining external JS files: ${EXTERNAL_JS_FILES.map(f => f.description).join(', ')}`);
    
    // Download external libraries first
    for (const externalFile of EXTERNAL_JS_FILES) {
        try {
            const content = await downloadFromUrl(externalFile.url, externalFile);
            jsBundle += `\n// ${externalFile.description} (inlined)\n${content}\n`;
        } catch (error) {
            console.error(`❌ Failed to download ${externalFile.description}:`, error.message);
            hasErrors = true;
            break;
        }
    }

    for (const file of SOURCE_FILES) {
        const filePath = path.join(__dirname, '..', '..', file.name);
        const startTime = Date.now();
        
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${file.name}`);
            }

            let content;
            if (file.type === 'sass') {
                content = compileSass(filePath);
                if (content === null) {
                    hasErrors = true;
                    break;
                }
            } else {
                content = fs.readFileSync(filePath, 'utf8');
                if (content.charCodeAt(0) === 0xFEFF) {
                    content = content.slice(1);
                }
                content = content.trim();
                
                const readTime = Date.now() - startTime;
                buildMetrics.processingTimes[`read-${file.name}`] = readTime;
                
                console.log(`✅ Read ${file.name} (${content.length} characters) in ${readTime}ms`);
            }

            switch(file.type) {
                case 'html':
                    let htmlContent = content.replace(/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/gim, '').trim();
                    htmlContent = htmlContent.replace(/id="chinArea"/g, 'id="chin-area"');
                    combinedContent += htmlContent;
                    break;
                case 'sass':
                    cssBundle += `\n/* --- ${file.description} --- */\n` + content + '\n';
                    break;
                case 'component':
                    let componentJs = content.replace(/^(export\s+(?:default\s+)?(?:function|const|let|var|class)\s+)/gm, '');
                    jsBundle += `\n// ProfilePictureComponent.js (inlined)\n`;
                    if (file.name.includes('ProfilePictureComponent.js')) {
                        jsBundle += 'window.getProfilePictureHTML = getProfilePictureHTML;\n';
                    }
                    jsBundle += `${componentJs}\n`;
                    break;
                case 'script':
                    let jsContent = content
                        .replace(/import\s*(?:[\w\s,{}]*)from\s*(['"].*?['"]);?/g, '// Removed import: Inlined dependencies above')
                        .replace(/\bexport\s*(?:default\s*)?(?:function|const|let|var|class)\s+/g, '');
                    jsBundle += `\n// RPGlitch.js (inlined)\n`;
                    jsBundle += `${jsContent}\n`;
                    break;
            }
        } catch (error) {
            const errorMsg = `Error processing ${file.name}: ${error.message}`;
            buildMetrics.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
            hasErrors = true;
            break;
        }
    }

    if (hasErrors) return null;

    // Output a single <style> block for all CSS
    if (cssBundle) {
        const injectedCss = `
            /* Ensure standard appearance property */
            [type="checkbox"],
            [type="radio"],
            [type="range"],
            [type="file"],
            input:not([type="checkbox"], [type="radio"], [type="range"], [type="file"]),
            select,
            textarea {
                appearance: none;
            }

            /* Ensure standard touch-action property */
            a,
            area,
            button,
            input,
            label,
            select,
            summary,
            textarea,
            [tabindex] {
                touch-action: manipulation;
            }
        `;
        cssBundle += injectedCss;
        combinedContent += `\n<style>\n${cssBundle}\n</style>\n`;
    }

    // After all JS is collected, wrap in a single <script> block
    if (jsBundle) {
        const globalExposures = `\n// --- Ensure all globals are set before app code --- //\n`;
        jsBundle = globalExposures + jsBundle;
        jsBundle += '\n// Deployment safeguard: ensure App is global\nwindow.App = App;\nconsole.log("App global:", typeof window.App, window.App);\n';
        combinedContent += `<script>
${jsBundle}
</script>
`;
    }

    return combinedContent;
}

/**
 * Prints build performance metrics
 */
function printBuildMetrics() {
    if (!BUILD_CONFIG.performanceTracking) return;
    
    const totalTime = Date.now() - buildMetrics.startTime;
    console.log('\n📊 Build Performance Metrics:');
    console.log(`⏱️  Total build time: ${totalTime}ms`);
    console.log(`📦 Total output size: ${buildMetrics.totalSize} characters`);
    
    if (Object.keys(buildMetrics.downloadTimes).length > 0) {
        console.log('\n📥 Download Times:');
        Object.entries(buildMetrics.downloadTimes).forEach(([file, time]) => {
            console.log(`   ${file}: ${time}ms`);
        });
    }
    
    if (Object.keys(buildMetrics.processingTimes).length > 0) {
        console.log('\n⚙️  Processing Times:');
        Object.entries(buildMetrics.processingTimes).forEach(([operation, time]) => {
            console.log(`   ${operation}: ${time}ms`);
        });
    }
    
    if (buildMetrics.errors.length > 0) {
        console.log('\n⚠️  Build Warnings/Errors:');
        buildMetrics.errors.forEach(error => {
            console.log(`   ${error}`);
        });
    }
    
    console.log(`\n🏷️  Build Info: Version ${BUILD_CONFIG.version}, ID: ${BUILD_CONFIG.buildId}`);
    console.log(`📅 Build timestamp: ${BUILD_CONFIG.buildTimestamp}`);
}

/**
 * Builds the single file for Perchance.org deployment.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
async function buildPerchanceFile() {
    console.log('🚀 Building RPGlitch for Perchance...');
    console.log(`📋 Build config: Version ${BUILD_CONFIG.version}, Performance tracking: ${BUILD_CONFIG.performanceTracking}`);
    
    const buildDir = path.join(__dirname, '..', 'output');
    const archiveDir = path.join(__dirname, '..', 'output', 'archive');
    const outputFile = path.join(buildDir, 'RPGlitch-perchance.html');
    const cssOutputFile = path.join(archiveDir, 'RPGlitch-perchance.css');
    const cssMapOutputFile = path.join(archiveDir, 'RPGlitch-perchance.css.map');
    
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
        console.log('📁 Created build directory');
    }
    if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
        console.log('📁 Created archive directory');
    }
    
    const combinedContent = await getCombinedRightPanelContent();
    if (combinedContent === null) {
        console.error('\n❌ Perchance build failed because source files could not be processed.');
        printBuildMetrics();
        return false;
    }
    
    const header = `<!-- RPGlitch for Perchance -->
<!-- Build: ${BUILD_CONFIG.version} | ID: ${BUILD_CONFIG.buildId} | Timestamp: ${BUILD_CONFIG.buildTimestamp} -->

`;
    
    const finalContent = header + combinedContent;
    buildMetrics.totalSize = finalContent.length;
    
    try {
        console.log('[DEBUG] Final content length:', finalContent.length);
        fs.writeFileSync(outputFile, Buffer.from(finalContent, 'utf8'));

        // Write CSS and map to archive directory if they exist in build
        const buildCss = path.join(buildDir, 'RPGlitch-perchance.css');
        const buildCssMap = path.join(buildDir, 'RPGlitch-perchance.css.map');
        if (fs.existsSync(buildCss)) {
            fs.copyFileSync(buildCss, cssOutputFile);
            fs.unlinkSync(buildCss);
            console.log('✅ Moved CSS to archive:', cssOutputFile);
        }
        if (fs.existsSync(buildCssMap)) {
            fs.copyFileSync(buildCssMap, cssMapOutputFile);
            fs.unlinkSync(buildCssMap);
            console.log('✅ Moved CSS map to archive:', cssMapOutputFile);
        }

        console.log('✅ Build complete. Output written to', outputFile);
        printBuildMetrics();
    } catch (error) {
        const errorMsg = `Error writing output file: ${error.message}`;
        buildMetrics.errors.push(errorMsg);
        console.error('❌', errorMsg);
        printBuildMetrics();
        return false;
    }

    return true;
}

/**
 * SASS COMPILATION BEST PRACTICE:
 * - Never modify Pico's core files in node_modules.
 * - All Pico customizations (theme, modules, etc) should be done via the @use ... with clause in RPGlitch.scss.
 * - See https://picocss.com/docs/sass for details.
 */
// Run the build if this script is executed directly
if (require.main === module) {
    buildPerchanceFile().then(success => {
        if (success) {
            console.log('🚀 Ready for Perchance deployment!');
            process.exit(0);
        } else {
            console.error('❌ Build failed');
            process.exit(1);
        }
    }).catch(error => {
        const errorMsg = `Build error: ${error.message}`;
        buildMetrics.errors.push(errorMsg);
        console.error('❌', errorMsg);
        printBuildMetrics();
        process.exit(1);
    });
}