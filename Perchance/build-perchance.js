#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * RPGlitch Perchance Build Script
 * 
 * This script combines the separate RPGlitch files into a single output:
 * 1. RPGlitch-perchance.html: For deploying to the Perchance platform.
 * 
 * Development follows the comprehensive rules system:
 * - plan-act-mode.mdc: Mode control for development tasks
 * - core-startup.mdc: Mandatory startup protocol
 * - context-management.mdc: 60% context threshold management
 * - enhanced-error-handling.mdc: Proactive error handling
 * - code-quality-standards.mdc: Complete implementation standards
 * - perchance-best-practices.mdc: Platform-specific patterns
 * 
 * Usage: node build-perchance.js
 */

const SOURCE_FILES = [
    { name: 'RPGlitch/RPGlitch.html', type: 'html', description: 'Main HTML structure' },
    { name: 'RPGlitch/RPGlitch.css', type: 'style', description: 'CSS styles' },
    { name: 'RPGlitch/RPGlitch.js', type: 'script', description: 'JavaScript logic' }
];

/**
 * Combines the HTML, CSS, and JS source files into a single string for the 'right panel'.
 * @returns {string|null} The combined content, or null if an error occurs.
 */
function getCombinedRightPanelContent() {
    let combinedContent = '';
    let hasErrors = false;

    SOURCE_FILES.forEach(file => {
        const filePath = path.join(__dirname, file.name);
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${file.name}`);
            }

            const content = fs.readFileSync(filePath, 'utf8').trim();
            console.log(`✅ Read ${file.name} (${content.length} characters)`);

            if(file.type !== 'html') { // Add separators for non-html sections for clarity
              combinedContent += `\n<!-- ======================================== -->\n`;
              combinedContent += `<!-- ${file.description.toUpperCase()} -->\n`;
              combinedContent += `<!-- ======================================== -->\n\n`;
            }

            switch(file.type) {
                case 'html':
                    let htmlContent = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gim, '').trim();
                    htmlContent = htmlContent.replace(/<link[^>]*>/gim, '').trim();
                    combinedContent += htmlContent;
                    break;
                case 'style':
                    combinedContent += `<style>\n${content}\n</style>\n`;
                    break;
                case 'script':
                    combinedContent += `<script type="module">\n${content}\n</script>\n`;
                    break;
            }
        } catch (error) {
            console.error(`❌ Error processing ${file.name}:`, error.message);
            hasErrors = true;
        }
    });

    return hasErrors ? null : combinedContent;
}

/**
 * Builds the single file for Perchance.org deployment.
 */
function buildPerchanceFile() {
    console.log('🚀 Building RPGlitch for Perchance...');
    
    const buildDir = path.join(__dirname, 'build');
    const outputFile = path.join(buildDir, 'RPGlitch-perchance.html');
    
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
        console.log('📁 Created build directory');
    }
    
    const combinedContent = getCombinedRightPanelContent();
    if (combinedContent === null) {
        console.error('\n❌ Perchance build failed because source files could not be processed.');
        return false;
    }
    
    const header = `<!-- \n    ========================================\n    RPGLITCH - PERCHANCE VERSION\n    ========================================\n    \n    Generated: ${new Date().toISOString()}\n    Build Script: build-perchance.js\n    Platform: Perchance (perchance.org)\n    \n    This file combines:\n    - RPGlitch.html (HTML structure)\n    - RPGlitch.css (CSS styles)\n    - RPGlitch.js (JavaScript)\n    \n    For development, use the separate files.\n    For Perchance deployment, use this combined file.\n    \n    ========================================\n-->\n\n`;
    
    const finalContent = header + combinedContent;
    
    try {
        fs.writeFileSync(outputFile, finalContent, 'utf8');
        console.log(`\n✅ Successfully created for Perchance: ${outputFile}`);
        console.log(`📊 File size: ${(finalContent.length / 1024).toFixed(1)} KB`);
        return true;
    } catch (error) {
        console.error('❌ Error writing Perchance output file:', error.message);
        return false;
    }
}

/**
 * Validates that all required source files exist.
 */
function validateFiles() {
    console.log('🔍 Validating source files...\n');
    
    const requiredFiles = [
        ...SOURCE_FILES.map(f => f.name)
    ];
    
    let allExist = true;
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ ${file} (missing)`);
            allExist = false;
        }
    });
    
    if (!allExist) {
        console.log('\n❌ Some required files are missing. Please ensure all files exist before building.');
        process.exit(1);
    }
    
    console.log('\n✅ All source files found!\n');
}

// Main execution
if (require.main === module) {
    console.log('🎭 RPGlitch Perchance Build Script\n');
    
    validateFiles();
    
    const perchanceSuccess = buildPerchanceFile();
    
    if (perchanceSuccess) {
        console.log(`\n🎯 Next steps:`);
        console.log(`   1. For Perchance: Copy contents of build/RPGlitch-perchance.html`);
        console.log(`\n🚀 Ready for Perchance deployment!`);
    } else {
        console.error('\n❌ Build failed due to errors above.');
        process.exit(1);
    }
}

module.exports = { buildPerchanceFile, validateFiles }; 