// Build RPGlitch and copy to clipboard
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building RPGlitch...');

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
    
    // Write to a temporary file and copy from there to avoid escaping issues
    const tempFile = path.join(__dirname, 'temp-clipboard.html');
    fs.writeFileSync(tempFile, htmlContent);
    
    // Copy to clipboard using Get-Content (PowerShell)
    console.log('📋 Copying to clipboard...');
    execSync(`Get-Content "${tempFile}" | Set-Clipboard`, { shell: 'powershell' });
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    console.log('✅ Build completed and copied to clipboard!');
    console.log('📋 Ready to paste into Perchance');
    console.log(`📁 Built file location: ${htmlPath}`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
} 