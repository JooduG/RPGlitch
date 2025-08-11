/* build/scripts/sync-ignores.js
 * Generate tool-specific ignore files from config/ignore.master
 */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const MASTER = path.join(REPO_ROOT, 'config', 'ignore.master');

function readMaster() {
  const raw = fs.readFileSync(MASTER, 'utf8');
  return raw.split(/\r?\n/).filter(Boolean);
}
function stripComments(lines) {
  return lines.filter(line => !line.trim().startsWith('#'));
}
function dropNegations(lines) {
  return lines.filter(line => !line.trim().startsWith('!'));
}
function writeFile(p, lines, header) {
  const body = [
    `# Generated from config/ignore.master — do not edit directly`,
    ...(header ? [header] : []),
    '',
    ...lines
  ].join('\n') + '\n';
  fs.writeFileSync(p, body, 'utf8');
  console.log('✔ wrote', path.relative(REPO_ROOT, p));
}

(function main() {
  const lines = stripComments(readMaster());

  // .gitignore keeps everything (including negations)
  writeFile(
    path.join(REPO_ROOT, '.gitignore'),
    lines,
    '# You may append project-specific entries below'
  );

  // Tools don’t reliably support negations — drop them
  const toolLines = dropNegations(lines);

  writeFile(path.join(REPO_ROOT, '.eslintignore'), toolLines);
  writeFile(path.join(REPO_ROOT, '.stylelintignore'), toolLines);
  writeFile(path.join(REPO_ROOT, '.htmlhintignore'), toolLines);
  writeFile(path.join(REPO_ROOT, '.cursorignore'), toolLines);
})();
