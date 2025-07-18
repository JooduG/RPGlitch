// Build RPGlitch and copy to clipboard
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building RPGlitch...');

try {
    // Run the build script
    execSync('node build-perchance.js', { stdio: 'inherit' });
    
    // Read the built HTML file
    const htmlPath = path.join('Perchance', 'build', 'RPGlitch-perchance.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Write to a temporary file and copy from there to avoid escaping issues
    const tempFile = path.join(__dirname, 'temp-clipboard.html');
    fs.writeFileSync(tempFile, htmlContent);
    
    // Copy to clipboard using Get-Content
    execSync(`Get-Content "${tempFile}" | Set-Clipboard`, { shell: 'powershell' });
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    console.log('✅ Build completed and copied to clipboard!');
    console.log('📋 Ready to paste into Perchance');
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
} 