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
 * 
 * Usage: node build-perchance.js
 * 
 * @version 1.4.0
 * @lastUpdated 2025-07-14
 */
const SOURCE_FILES = [
    { name: 'Perchance/RPGlitch/RPGlitch.html', type: 'html', description: 'Main HTML structure' },
    { name: 'Perchance/RPGlitch/RPGlitch.scss', type: 'sass', description: 'Main Sass stylesheet' }, // New Sass entry point
    { name: 'Perchance/RPGlitch/ProfilePictureComponent.js', type: 'component', description: 'Profile Picture rendering logic' },
    { name: 'Perchance/RPGlitch/RPGlitch.js', type: 'script', description: 'JavaScript logic' }
];

// External JS files that should be inlined during build for reliable loading
// These are downloaded and inlined to avoid CDN timing issues
const EXTERNAL_JS_FILES = [
    { url: 'https://unpkg.com/hyperscript.org@0.9.12', description: 'Hyperscript' },
    { url: 'https://unpkg.com/cash-dom', description: 'Cash DOM' },
    { url: 'https://unpkg.com/dexie@4.0.8/dist/dexie.js', description: 'Dexie.js' },
    { url: 'https://unpkg.com/dompurify@3.0.1/dist/purify.min.js', description: 'DOMPurify' }
];



/**
 * Downloads content from a URL.
 * @param {string} url - The URL to download from.
 * @returns {Promise<string>} The downloaded content.
 */
function downloadFromUrl(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;
        
        const makeRequest = (requestUrl) => {
            protocol.get(requestUrl, (res) => {
                // Handle redirects
                if (res.statusCode === 301 || res.statusCode === 302) {
                    const newUrl = res.headers.location;
                    if (newUrl) {
                        // Resolve relative URLs
                        const resolvedUrl = newUrl.startsWith('http') ? newUrl : new URL(newUrl, requestUrl).href;
                        console.log(`🔄 Following redirect: ${requestUrl} -> ${resolvedUrl}`);
                        makeRequest(resolvedUrl);
                        return;
                    }
                }
                
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
                    return;
                }
                
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve(data);
                });
            }).on('error', (err) => {
                reject(new Error(`Failed to download ${url}: ${err.message}`));
            });
        };
        
        makeRequest(url);
    });
}

/**
 * Compiles a Sass file to CSS.
 * @param {string} inputPath - The path to the input Sass file.
 * @returns {string|null} The compiled CSS string, or null if an error occurs.
 */
function compileSass(inputPath) {
    console.log(`🎨 Compiling Sass: ${inputPath}`);
    try {
        const result = sass.compile(inputPath, {
            style: 'compressed', // Minify the output CSS
            loadPaths: [path.join(__dirname, '..', '..', 'node_modules', '@picocss', 'pico', 'scss')] // Directly point to Pico's scss folder
        });
        console.log(`✅ Sass compiled successfully (${result.css.length} characters)`);
        return result.css;
    } catch (error) {
        console.error(`❌ Sass compilation failed:`, error.message);
        return null;
    }
}

/**
 * Combines the HTML, CSS, and JS source files into a single string for the 'right panel'.
 * @returns {Promise<string|null>} The combined content, or null if an error occurs.
 */
async function getCombinedRightPanelContent() { // Made async
    let combinedContent = '';
    let hasErrors = false;
    let jsBundle = '';
    let cssBundle = '';

    // Download and inline external JS files for reliable loading
    console.log(`ℹ️ Downloading and inlining external JS files: ${EXTERNAL_JS_FILES.map(f => f.description).join(', ')}`);
    
    // Download external libraries first
    for (const externalFile of EXTERNAL_JS_FILES) {
        try {
            console.log(`📥 Downloading ${externalFile.description} from ${externalFile.url}...`);
            const content = await downloadFromUrl(externalFile.url);
            jsBundle += `\n// ${externalFile.description} (inlined)\n${content}\n`;
            console.log(`✅ Downloaded ${externalFile.description} (${content.length} characters)`);
        } catch (error) {
            console.error(`❌ Failed to download ${externalFile.description}:`, error.message);
            hasErrors = true;
            break;
        }
    }

    for (const file of SOURCE_FILES) { // Changed from forEach to allow early exit on error
        const filePath = path.join(__dirname, file.name);
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${file.name}`);
            }

            let content;
            if (file.type === 'sass') {
                content = compileSass(filePath);
                if (content === null) {
                    hasErrors = true;
                    break; // Exit loop if Sass compilation failed
                }
            } else {
                // Read file as utf8 and explicitly strip the BOM if present.
                // The BOM (Byte Order Mark) is a special character (\uFEFF) that can appear
                // at the start of files and cause rendering issues.
                content = fs.readFileSync(filePath, 'utf8');
                if (content.charCodeAt(0) === 0xFEFF) {
                    content = content.slice(1);
                }
                content = content.trim();
                console.log(`✅ Read ${file.name} (${content.length} characters)`);
            }

            switch(file.type) {
                case 'html':
                    // Remove only internal <script> tags without src (inline scripts)
                    // External libraries are now inlined, so no need for script tags
                    let htmlContent = content.replace(/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/gim, '').trim();
                    // Keep Pico.css CDN link - let Perchance handle loading
                    // htmlContent = htmlContent.replace(/<link\s+rel="stylesheet"\s+href="https:\/\/unpkg\.com\/@picocss\/pico@[^\/]+\/css\/pico\.min\.css">\n?/, '').trim();
                    // Replace old chinArea ID with chin-area (if any exist)
                    htmlContent = htmlContent.replace(/id="chinArea"/g, 'id="chin-area"');
                    
                    combinedContent += htmlContent;
                    break;
                case 'sass': // Handle compiled Sass output
                    cssBundle += `\n/* --- ${file.description} --- */\n` + content + '\n';
                    break;
                case 'component':
                    // Strip ALL export statements from components for inlining
                    let componentJs = content.replace(/^(export\s+(?:default\s+)?(?:function|const|let|var|class)\s+)/gm, '');
                    jsBundle += `\n// ProfilePictureComponent.js (inlined)\n`;
                    // Explicitly expose getProfilePictureHTML for RPGlitch.js
                    if (file.name.includes('ProfilePictureComponent.js')) {
                        jsBundle += 'window.getProfilePictureHTML = getProfilePictureHTML;\n';
                    }
                    jsBundle += `${componentJs}\n`;
                    break;
                case 'script':
                    // Strip ALL import/export statements from main script
                    let jsContent = content
                        .replace(/import\s*(?:[\w\s,{}]*)from\s*(['"].*?['"]);?/g, '// Removed import: Inlined dependencies above') // More aggressively remove imports
                        .replace(/\bexport\s*(?:default\s*)?(?:function|const|let|var|class)\s+/g, ''); // Strip exports
                    jsBundle += `\n// RPGlitch.js (inlined)\n`;
                    jsBundle += `${jsContent}\n`;
                    break;
            }
        } catch (error) {
            console.error(`❌ Error processing ${file.name}:`, error.message);
            hasErrors = true;
            break; // Exit loop on error
        }
    }

    if (hasErrors) return null;

    // Output a single <style> block for all CSS
    if (cssBundle) {
        // Inject standard CSS properties to resolve linter warnings
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
        cssBundle += injectedCss; // Append to the existing CSS bundle

        combinedContent += `\n<style>\n${cssBundle}\n</style>\n`;
    }

    // After all JS is collected, wrap in a single <script> block (not module!)
    if (jsBundle) {
        // Explicitly expose external libraries globally for access in RPGlitch.js
        const globalExposures = `\n// --- Ensure all globals are set before app code --- //\n`;
        jsBundle = globalExposures + jsBundle;
        // Always append window.App = App at the very end for Perchance deployment
        jsBundle += '\n// Deployment safeguard: ensure App is global\nwindow.App = App;\nconsole.log("App global:", typeof window.App, window.App);\n';
        combinedContent += `<script>
${jsBundle}
</script>
`;
    }

    return combinedContent;
}

/**
 * Builds the single file for Perchance.org deployment.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
async function buildPerchanceFile() {
    console.log('🚀 Building RPGlitch for Perchance...');
    
    const buildDir = path.join(__dirname, 'Perchance', 'build');
    const archiveDir = path.join(__dirname, 'Perchance', 'archive');
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
    
    const combinedContent = await getCombinedRightPanelContent(); // AWAIT THE ASYNC FUNCTION
    if (combinedContent === null) {
        console.error('\n❌ Perchance build failed because source files could not be processed.');
        return false;
    }
    
    const header = `<!-- RPGlitch for Perchance -->

`;
    
    const finalContent = header + combinedContent;
    
    try {
        console.log('[DEBUG] Final content (before writing) length:', finalContent.length);
        console.log('[DEBUG] Final content (excerpt with emojis):', finalContent.substring(finalContent.indexOf('Save All Data ') - 5, finalContent.indexOf('Save All Data ') + 25)); // Log the part with emojis
        // Write directly as a UTF-8 buffer WITHOUT BOM
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

        // Success message
        console.log('✅ Build complete. Output written to', outputFile);
    } catch (error) {
        console.error('❌ Error writing output file:', error.message);
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
            process.exit(0); // Explicitly exit on success
        } else {
            console.error('❌ Build failed');
            process.exit(1);
        }
    }).catch(error => {
        console.error('❌ Build error:', error.message);
        process.exit(1);
    });
}