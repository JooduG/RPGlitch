// Stylelint config colocated with ignore file under build/config
// We read .stylelintignore ourselves to show the patterns in logs; stylelint
// is still invoked with --ignore-path build/config/.stylelintignore from package.json.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const CONFIG_DIR = path.join(ROOT, 'build', 'config');
const ignorePath = path.join(CONFIG_DIR, '.stylelintignore');

let ignoreFiles = [];
try {
  ignoreFiles = fs.readFileSync(ignorePath, 'utf8')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
} catch {
  // ignore
}

module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended-scss',
  ],
  ignoreFiles, // for visibility; CLI also passes --ignore-path
  rules: {
    'no-empty-source': null,
  },
};
