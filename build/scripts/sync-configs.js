import fs from 'fs';
import path from 'path';

const REPO_ROOT = process.cwd();

// --- UTILITIES ---
function copyFile(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    console.warn(`- Skipping: Master config not found at ${path.relative(REPO_ROOT, sourcePath)}`);
    return;
  }
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`📝 Synced ${path.relative(REPO_ROOT, targetPath)}`);
}

// --- MAIN LOGIC ---
function syncAllConfigs() {
  console.log('\n🔄 Syncing tool and IDE configuration files...');

  // These files are copied directly from the master location in build/config
  copyFile(path.join(REPO_ROOT, 'build', 'config', '.htmlhintrc'), path.join(REPO_ROOT, '.htmlhintrc'));
  copyFile(path.join(REPO_ROOT, 'build', 'config', '.markdownlint.json'), path.join(REPO_ROOT, '.markdownlint.json'));
  copyFile(path.join(REPO_ROOT, 'build', 'config', 'eslint.config.mjs'), path.join(REPO_ROOT, 'eslint.config.mjs'));
  copyFile(path.join(REPO_ROOT, 'build', 'config', 'stylelint.config.cjs'), path.join(REPO_ROOT, 'stylelint.config.cjs'));
  copyFile(path.join(REPO_ROOT, 'build', 'config', 'jest.config.cjs'), path.join(REPO_ROOT, 'jest.config.cjs'));

  console.log('✅ Configuration file sync process complete.');
}

syncAllConfigs();
