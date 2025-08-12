/* build/scripts/sync-ignores.js
 * Generate tool-specific ignore files from config/ignore.master
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const MASTER = path.join(REPO_ROOT, 'config', 'ignore.master');

function readMaster() {
  const raw = fs.readFileSync(MASTER, 'utf8');
  return raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}
function stripComments(lines) {
  return lines.filter(line => !line.startsWith('#'));
}
function dropNegations(lines) {
  return lines.filter(line => !line.startsWith('!'));
}
function writeTextFile(p, lines, header) {
  const body = [
    `# Generated from config/ignore.master — do not edit directly`,
    ...(header ? [header] : []),
    '',
    ...lines
  ].join('\n') + '\n';
  fs.writeFileSync(p, body, 'utf8');
  console.log('✔ wrote', path.relative(REPO_ROOT, p));
}
function writeJsonFile(p, data) {
  const body = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(p, body, 'utf8');
  console.log('✔ wrote', path.relative(REPO_ROOT, p));
}

(function main() {
  const master = stripComments(readMaster());

  // .gitignore keeps everything (including negations)
  writeTextFile(
    path.join(REPO_ROOT, '.gitignore'),
    master,
    '# You may append project-specific entries below'
  );

  // Tools don’t reliably support negations — drop them
  const toolLines = dropNegations(master);

  // Style/CSS/HTML/cursor ignores
  writeTextFile(path.join(REPO_ROOT, '.stylelintignore'), toolLines);
  writeTextFile(path.join(REPO_ROOT, '.htmlhintignore'), toolLines);
  writeTextFile(path.join(REPO_ROOT, '.cursorignore'), toolLines);

  // ESLint v9 flat-config: no .eslintignore. Generate a JSON list ESLint can import.
  writeJsonFile(path.join(REPO_ROOT, 'config', 'ignore.eslint.json'), toolLines);
})();
