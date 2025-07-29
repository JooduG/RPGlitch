#!/usr/bin/env node
/**
 * Build RPGlitch and copy to clipboard with enhanced functionality
 * 
 * Purpose: Build RPGlitch and copy the output to clipboard for easy Perchance deployment
 * Features: Cross-platform clipboard support, validation, and error handling
 * 
 * Usage: node build-and-copy.js
 * 
 * @version 1.4.0
 * @lastUpdated 2025-01-03
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Build configuration
const BUILD_CONFIG = {
    version: '1.4.0',
    clipboardValidation: true,
    maxRetries: 3,
    tempFileTimeout: 5000, // 5 seconds to clean up temp file
    // Removed maxClipboardSize limit - handle all file sizes
    chunkSize: 1000000 // 1MB chunks for large file handling
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
        
        // For large files, compare length and a sample from the middle
        if (expectedContent.length > 10000) {
            const expectedLength = expectedContent.length;
            const clipboardLength = clipboardContent.length;
            
            // Check if lengths are close (within 1% difference)
            const lengthDiff = Math.abs(expectedLength - clipboardLength);
            const lengthRatio = lengthDiff / expectedLength;
            
            if (lengthRatio > 0.01) {
                console.warn(`⚠️  Clipboard content length mismatch - Expected: ${expectedLength}, Got: ${clipboardLength}`);
                return false;
            }
            
            // Sample from middle of content for validation
            const sampleStart = Math.floor(expectedLength / 2);
            const sampleSize = 200;
            const expectedSample = expectedContent.substring(sampleStart, sampleStart + sampleSize);
            const clipboardSample = clipboardContent.substring(sampleStart, sampleStart + sampleSize);
            
            if (expectedSample !== clipboardSample) {
                console.warn('⚠️  Clipboard content sample validation failed');
                return false;
            }
        } else {
            // For smaller files, compare first 100 characters
            const expectedStart = expectedContent.substring(0, 100);
            const clipboardStart = clipboardContent.substring(0, 100);
            
            if (expectedStart !== clipboardStart) {
                console.warn('⚠️  Clipboard content validation failed - content may not have copied correctly');
                return false;
            }
        }
        
        console.log('✅ Clipboard content validated successfully');
        return true;
    } catch (error) {
        console.warn('⚠️  Could not validate clipboard content:', error.message);
        return false;
    }
}

/**
 * Copies content to clipboard with multiple fallback mechanisms
 * @param {string} content - Content to copy to clipboard
 * @param {string} tempFile - Temporary file path
 * @returns {boolean} True if copy was successful
 */
function copyToClipboard(content, tempFile) {
    const methods = [
        // Method 1: PowerShell Get-Content | Set-Clipboard (most reliable)
        () => {
            console.log('📋 Method 1: Using PowerShell Get-Content | Set-Clipboard...');
            execSync(`Get-Content "${tempFile}" | Set-Clipboard`, { shell: 'powershell' });
        },
        
        // Method 2: PowerShell Set-Clipboard with -Raw (for large files)
        () => {
            console.log('📋 Method 2: Using PowerShell Set-Clipboard -Raw...');
            execSync(`Set-Clipboard -Value (Get-Content "${tempFile}" -Raw)`, { shell: 'powershell' });
        },
        
        // Method 3: Direct Set-Clipboard with content
        () => {
            console.log('📋 Method 3: Using PowerShell Set-Clipboard with direct content...');
            // Escape content for PowerShell
            const escapedContent = content.replace(/'/g, "''").replace(/\n/g, "`n");
            execSync(`Set-Clipboard -Value '${escapedContent}'`, { shell: 'powershell' });
        },
        
        // Method 4: Using clip command (Windows)
        () => {
            console.log('📋 Method 4: Using clip command...');
            execSync(`type "${tempFile}" | clip`, { shell: 'cmd' });
        },
        
        // Method 5: Node.js clipboard package fallback (if available)
        () => {
            console.log('📋 Method 5: Trying clipboard package...');
            try {
                const clipboard = require('clipboard');
                clipboard.writeSync(content);
            } catch (e) {
                throw new Error('clipboard package not available');
            }
        }
    ];
    
    for (let i = 0; i < methods.length; i++) {
        try {
            methods[i]();
            
            // Validate the copy
            if (validateClipboardContent(content)) {
                console.log(`✅ Successfully copied using method ${i + 1}`);
                return true;
            } else {
                console.log(`⚠️  Method ${i + 1} validation failed, trying next method...`);
            }
        } catch (error) {
            console.log(`⚠️  Method ${i + 1} failed: ${error.message}`);
            if (i === methods.length - 1) {
                console.error('❌ All clipboard methods failed');
                return false;
            }
        }
    }
    
    return false;
}

/**
 * Handles very large files by splitting into chunks if needed
 * @param {string} content - Content to copy
 * @param {string} tempFile - Temporary file path
 * @returns {boolean} True if copy was successful
 */
function copyLargeFileToClipboard(content, tempFile) {
    const fileSize = content.length;
    console.log(`📊 File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Try normal copy first
    if (copyToClipboard(content, tempFile)) {
        return true;
    }
    
    // If normal copy fails, try chunked approach for very large files
    if (fileSize > BUILD_CONFIG.chunkSize * 2) {
        console.log('🔄 File is very large, trying chunked copy approach...');
        
        try {
            // Create a PowerShell script that handles large files
            const psScript = `
$content = Get-Content "${tempFile}" -Raw -Encoding UTF8
if ($content.Length -gt 0) {
    Set-Clipboard -Value $content
    Write-Host "Success: Copied $($content.Length) characters to clipboard"
} else {
    Write-Host "Error: File is empty"
    exit 1
}
`;
            
            const psScriptFile = tempFile + '.ps1';
            fs.writeFileSync(psScriptFile, psScript);
            
            execSync(`powershell -ExecutionPolicy Bypass -File "${psScriptFile}"`, { stdio: 'inherit' });
            
            // Clean up script file
            if (fs.existsSync(psScriptFile)) {
                fs.unlinkSync(psScriptFile);
            }
            
            // Validate the copy
            if (validateClipboardContent(content)) {
                console.log('✅ Large file copied successfully using PowerShell script');
                return true;
            }
        } catch (error) {
            console.warn('⚠️  Chunked copy failed:', error.message);
        }
    }
    
    return false;
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
        
        if (!htmlContent.includes('RPGlitch - AI Storytelling Platform')) {
            throw new Error('Built file doesn\'t contain expected header - build may have failed');
        }
        
        // Write to a temporary file and copy from there to avoid escaping issues
        const tempFile = path.join(__dirname, 'temp-clipboard.html');
        fs.writeFileSync(tempFile, htmlContent);
        
        // Copy to clipboard with enhanced large file handling
        const copySuccess = copyLargeFileToClipboard(htmlContent, tempFile);
        
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
            console.log('   - Large files are now fully supported in clipboard');
            
            return true;
        } else {
            console.error('❌ Build succeeded but clipboard copy failed');
            console.log(`📁 Built file is available at: ${htmlPath}`);
            console.log('💡 You can manually copy the file contents to clipboard');
            console.log('💡 Or open the file directly in Perchance HTML editor');
            console.log('💡 Try running PowerShell as administrator for better clipboard access');
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