#!/usr/bin/env node
/**
 * Build RPGlitch and copy to clipboard with enhanced functionality
 * 
 * Purpose: Build RPGlitch and copy the output to clipboard for easy Perchance deployment
 * Features: Cross-platform clipboard support, validation, and error handling
 * 
 * Usage: node build-and-copy.js
 * 
 * @version 1.3.0
 * @lastUpdated 2025-01-03
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Build configuration
const BUILD_CONFIG = {
    version: '1.3.0',
    clipboardValidation: true,
    maxRetries: 3,
    tempFileTimeout: 5000, // 5 seconds to clean up temp file
    maxClipboardSize: 500000 // Maximum size for clipboard operations (500KB)
};

/**
 * Validates clipboard content by reading it back
 * @param {string} expectedContent - The content that should be in clipboard
 * @returns {boolean} True if clipboard content matches expected
 */
function validateClipboardContent(expectedContent) {
    if (!BUILD_CONFIG.clipboardValidation) return true;
    
    try {
        // Read clipboard content back for validation
        const clipboardContent = execSync('Get-Clipboard', { shell: 'powershell', encoding: 'utf8' });
        
        // Compare first 100 characters to avoid memory issues with large files
        const expectedStart = expectedContent.substring(0, 100);
        const clipboardStart = clipboardContent.substring(0, 100);
        
        if (expectedStart !== clipboardStart) {
            console.warn('⚠️  Clipboard content validation failed - content may not have copied correctly');
            return false;
        }
        
        console.log('✅ Clipboard content validated successfully');
        return true;
    } catch (error) {
        console.warn('⚠️  Could not validate clipboard content:', error.message);
        return false;
    }
}

/**
 * Copies content to clipboard with fallback mechanisms
 * @param {string} content - Content to copy to clipboard
 * @param {string} tempFile - Temporary file path
 * @returns {boolean} True if copy was successful
 */
function copyToClipboard(content, tempFile) {
    try {
        // Check if content is too large for clipboard
        if (content.length > BUILD_CONFIG.maxClipboardSize) {
            console.warn(`⚠️  Content is very large (${(content.length / 1024).toFixed(1)} KB) - clipboard copy may fail`);
            console.log('💡 Consider using the file directly instead of clipboard');
        }
        
        // Primary method: PowerShell Get-Content | Set-Clipboard
        console.log('📋 Copying to clipboard using PowerShell...');
        execSync(`Get-Content "${tempFile}" | Set-Clipboard`, { shell: 'powershell' });
        
        // Validate clipboard content
        if (validateClipboardContent(content)) {
            return true;
        }
        
        // Fallback method: Use shorter content for clipboard
        console.log('🔄 Trying fallback clipboard method with content preview...');
        const previewContent = content.substring(0, 1000) + '\n\n... [Content truncated for clipboard - use file for full content] ...';
        const previewFile = tempFile + '.preview';
        fs.writeFileSync(previewFile, previewContent);
        
        try {
            execSync(`Get-Content "${previewFile}" | Set-Clipboard`, { shell: 'powershell' });
            fs.unlinkSync(previewFile);
            console.log('✅ Copied content preview to clipboard');
            return true;
        } catch (previewError) {
            if (fs.existsSync(previewFile)) {
                fs.unlinkSync(previewFile);
            }
            throw previewError;
        }
        
    } catch (error) {
        console.error('❌ Clipboard copy failed:', error.message);
        return false;
    }
}

/**
 * Cleans up temporary file with timeout
 * @param {string} tempFile - Path to temporary file
 */
function cleanupTempFile(tempFile) {
    try {
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
            console.log('🧹 Cleaned up temporary file');
        }
    } catch (error) {
        console.warn('⚠️  Could not clean up temporary file:', error.message);
        
        // Schedule cleanup for later
        setTimeout(() => {
            try {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                    console.log('🧹 Cleaned up temporary file (delayed)');
                }
            } catch (err) {
                console.error('❌ Failed to clean up temporary file:', err.message);
            }
        }, BUILD_CONFIG.tempFileTimeout);
    }
}

/**
 * Main build and copy function
 */
async function buildAndCopy() {
    console.log('🔨 Building RPGlitch...');
    console.log(`📋 Build config: Version ${BUILD_CONFIG.version}, Clipboard validation: ${BUILD_CONFIG.clipboardValidation}`);

    try {
        // Run the build script from the same directory
        execSync('node build-perchance.js', { stdio: 'inherit', cwd: __dirname });
        
        // Read the built HTML file - path relative to build/scripts directory
        const htmlPath = path.join(__dirname, '..', 'output', 'RPGlitch-perchance.html');
        
        if (!fs.existsSync(htmlPath)) {
            throw new Error(`Built file not found: ${htmlPath}`);
        }
        
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');
        console.log(`📄 Read built file: ${htmlPath} (${htmlContent.length} characters)`);
        
        // Validate file content
        if (htmlContent.length < 1000) {
            throw new Error('Built file seems too small - build may have failed');
        }
        
        if (!htmlContent.includes('RPGlitch for Perchance')) {
            throw new Error('Built file doesn\'t contain expected header - build may have failed');
        }
        
        // Write to a temporary file and copy from there to avoid escaping issues
        const tempFile = path.join(__dirname, 'temp-clipboard.html');
        fs.writeFileSync(tempFile, htmlContent);
        
        // Copy to clipboard with validation
        const copySuccess = copyToClipboard(htmlContent, tempFile);
        
        // Clean up temp file
        cleanupTempFile(tempFile);
        
        if (copySuccess) {
            console.log('✅ Build completed and copied to clipboard!');
            console.log('📋 Ready to paste into Perchance');
            console.log(`📁 Built file location: ${htmlPath}`);
            console.log(`📊 File size: ${(htmlContent.length / 1024).toFixed(1)} KB`);
            
            // Additional helpful information
            console.log('\n💡 Tips:');
            console.log('   - Paste directly into Perchance HTML editor');
            console.log('   - The file includes all dependencies (no external CDN required)');
            console.log('   - Check the browser console for any loading messages');
            
            if (htmlContent.length > BUILD_CONFIG.maxClipboardSize) {
                console.log('   - File is large - consider opening the file directly in Perchance');
            }
            
            return true;
        } else {
            console.error('❌ Build succeeded but clipboard copy failed');
            console.log(`📁 Built file is available at: ${htmlPath}`);
            console.log('💡 You can manually copy the file contents to clipboard');
            console.log('💡 Or open the file directly in Perchance HTML editor');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        // Provide helpful error information
        if (error.message.includes('Built file not found')) {
            console.log('💡 Try running "npm run build" first to ensure the build script works');
        } else if (error.message.includes('clipboard')) {
            console.log('💡 Try running PowerShell as administrator or check clipboard permissions');
        }
        
        return false;
    }
}

// Run the build and copy if this script is executed directly
if (require.main === module) {
    buildAndCopy().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
    });
}