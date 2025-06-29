#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * RPGlitch Perchance Build Script
 * 
 * This script combines the separate RPGlitch files into a single file
 * ready for deployment to the Perchance platform.
 * 
 * Usage: node build-perchance.js
 */

function buildPerchanceFile() {
    console.log('🚀 Building RPGlitch for Perchance...\n');
    
    const buildDir = path.join(__dirname, 'build');
    const outputFile = path.join(buildDir, 'RPGlitch-perchance.html');
    
    // Ensure build directory exists
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
        console.log('📁 Created build directory');
    }
    
    // Define the files to combine (in order)
    const files = [
        { 
            name: 'RPGlitch/RPGlitch.html', 
            type: 'html',
            description: 'Main HTML structure'
        },
        { 
            name: 'RPGlitch/RPGlitch.css', 
            type: 'style',
            description: 'CSS styles'
        },
        { 
            name: 'RPGlitch/RPGlitch.js', 
            type: 'script',
            description: 'JavaScript logic'
        }
    ];
    
    let combinedContent = '';
    let hasErrors = false;
    
    // Process each file
    files.forEach((file, index) => {
        const filePath = path.join(__dirname, file.name);
        
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${file.name}`);
            }

            const content = fs.readFileSync(filePath, 'utf8').trim();
            console.log(`✅ Read ${file.name} (${content.length} characters)`);

            combinedContent += `\n<!-- ======================================== -->\n`;
            combinedContent += `<!-- ${file.description.toUpperCase()} -->\n`;
            combinedContent += `<!-- ======================================== -->\n\n`;

            switch(file.type) {
                case 'html':
                    // Remove all <script ...>...</script> and <link ...> tags from HTML
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
    
    if (hasErrors) {
        console.error('\n❌ Build failed due to errors above.');
        process.exit(1);
    }
    
    // Add header with build information
    const header = `<!-- \n    ========================================\n    RPGLITCH - PERCHANCE VERSION\n    ========================================\n    \n    Generated: ${new Date().toISOString()}\n    Build Script: build-perchance.js\n    Platform: Perchance (perchance.org)\n    \n    This file combines:\n    - RPGlitch.html (HTML structure)\n    - RPGlitch.css (CSS styles)\n    - RPGlitch.js (JavaScript)\n    \n    For development, use the separate files.\n    For Perchance deployment, use this combined file.\n    \n    ========================================\n-->\n\n`;
    
    const finalContent = header + combinedContent;
    
    // Write the combined file
    try {
        fs.writeFileSync(outputFile, finalContent, 'utf8');
        console.log(`\n✅ Successfully created: ${outputFile}`);
        console.log(`📊 File size: ${(finalContent.length / 1024).toFixed(1)} KB`);
        console.log(`\n🎯 Next steps:`);
        console.log(`   1. Copy the contents of ${outputFile}`);
        console.log(`   2. Paste into the right panel of your Perchance project`);
        console.log(`   3. Copy RPGlitch-left-panel.html to the left panel`);
        console.log(`\n🚀 Ready for Perchance deployment!`);
        
    } catch (error) {
        console.error('❌ Error writing output file:', error.message);
        process.exit(1);
    }
}

// Add some helpful utility functions
function validateFiles() {
    console.log('🔍 Validating source files...\n');
    
    const requiredFiles = [
        'RPGlitch/RPGlitch.html',
        'RPGlitch/RPGlitch.css', 
        'RPGlitch/RPGlitch.js'
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
    
    // Validate files first
    validateFiles();
    
    // Build the combined file
    buildPerchanceFile();
}

module.exports = { buildPerchanceFile, validateFiles }; 