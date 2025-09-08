// Description: This script watches for file changes in the rpglitch app directory
// and automatically triggers a rebuild.
// To run: `npm run watch`

const chokidar = require('chokidar');
const { exec } = require('child_process');
const path = require('path');

console.log('👀 Starting build watcher for RPGlitch...');

const rpglitchPath = path.resolve(__dirname, '../../apps/rpglitch');
const buildScriptPath = path.resolve(__dirname, 'build-rpglitch.js');

// Initialize watcher.
const watcher = chokidar.watch([
  `${rpglitchPath}/html/**/*.html`,
  `${rpglitchPath}/js/**/*.js`,
  `${rpglitchPath}/scss/**/*.scss`,
], {
  ignored: /(^|[/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true, // Don't run on initial scan
});

// Function to run the build script
const runBuild = (filePath) => {
  console.log(`\nFile changed: ${path.basename(filePath)}`);
  console.log('🚀 Triggering RPGlitch rebuild...');

  const buildProcess = exec(`node "${buildScriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Build failed:');
      console.error(stderr);
      return;
    }
    console.log('✅ Build successful!');
    console.log(stdout);
  });
};

// Add event listeners.
watcher
  .on('add', runBuild)
  .on('change', runBuild)
  .on('unlink', runBuild)
  .on('error', error => console.error(`Watcher error: ${error}`))
  .on('ready', () => console.log('Watcher is ready and watching for changes...'));