// blocks any attempt to commit or “patch” build/output files
const { execSync } = require('node:child_process');

function getChangedFiles() {
  try {
    // works both in staged and dirty states
    const diff = execSync('git ls-files -m -o --exclude-standard', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);
    return diff;
  } catch {
    return [];
  }
}

const changed = getChangedFiles();
const offenders = changed.filter(p => p.startsWith('build/output/'));
if (offenders.length) {
  console.error('\n❌ You changed generated files in build/output/:');
  offenders.forEach(f => console.error(' -', f));
  console.error('\nEdit the source files instead (apps/** or build/scripts/**), then rebuild.\n');
  process.exit(1);
}
console.log('✅ No edits to build/output detected.');
