#!/usr/bin/env node
/* * Generate build/output/hub.md with a dashboard, quick links,
 * and a dynamically generated repository tree.
 */

const fs = require('fs');
const path = require('path');
const tree = require('tree-node-cli');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'build', 'output');

function getActivityDashboard() {
  const stats = { tests: 'N/A', build: 'N/A', lastSync: 'N/A' };
  try {
    const jestResult = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.jest-result.json'), 'utf8'));
    if (jestResult.numTotalTests > 0) {
      stats.tests = `${jestResult.numPassedTests}/${jestResult.numTotalTests} passed`;
    }
  } catch {
    // It's okay if there are no test results.
  }

  const buildFile = path.join(OUTPUT_DIR, 'RPGlitch.html');
  if (fs.existsSync(buildFile)) {
    stats.build = new Date(fs.statSync(buildFile).mtime).toLocaleDateString();
  }

  const hubFile = path.join(OUTPUT_DIR, 'hub.md');
  if (fs.existsSync(hubFile)) {
      stats.lastSync = new Date(fs.statSync(hubFile).mtime).toLocaleString();
  }
  
  return `🧪 Tests: ${stats.tests}  |  🏗️ Last Build: ${stats.build}  |  🔄 Last Sync: ${stats.lastSync}`;
}

/**
 * Dynamically generates a text-based tree of the repository structure.
 * @returns {string} The formatted tree string.
 */
function buildDynamicRepoTree() {
  try {
    const treeString = tree(REPO_ROOT, {
      allFiles: false,
      maxDepth: 3,
      exclude: [
        /node_modules/,
        /\.git/,
        /build\/output/,
        /build\/local_libs/,
        /\.DS_Store/,
        /package-lock\.json/,
        /\.vscode/,
        /\.cursor/,
        /\.gemini/,
        /\.amazonq/,
        /\.windsurf/
      ],
    });
    // The library includes the root directory name, which we can trim for a cleaner look
    return treeString.substring(treeString.indexOf('\n') + 1);
  } catch (error) {
    console.warn("⚠️ Could not generate dynamic repo tree, falling back to static.", error);
    return `
apps/
├── rpglitch/
└── imageglitch/
build/
├── scripts/
└── config/
docs/
memory-bank/
rules/
tests/
tools/
`;
  }
}

function buildHub(built) {
  const ts = new Date().toISOString();
  const others = built.filter(b => b.name !== 'hub');

  const navSections = {
    'Core': ['rules', 'docs', 'tests'],
    'Content': ['memory', 'tools', 'combined-other'],
    'Complete': ['everything', 'recent-changes', 'readmes']
  };

  const navLines = [];
  for (const [section, names] of Object.entries(navSections)) {
    const items = names.map(name => others.find(b => b.name === name)).filter(Boolean);
    if (items.length) {
      navLines.push(`**${section}**`);
      items.forEach(b => {
        navLines.push(`• [${b.title.replace('Combined ', '')}](./${b.output})`);
      });
      navLines.push('');
    }
  }

  const dashboard = getActivityDashboard();
  const quickActions = [
    '## Quick Actions',
    '```bash',
    'npm run sync          # Update all (libs + configs + docs)',
    'npm run deploy        # Full deploy pipeline (local)',
    'npm run build:copy    # Build & copy to clipboard (local)',
    'npm run test          # Run test suite',
    'npm run lint:fix      # Fix linting issues',
    '```'
  ].join('\n');

  const tree = buildDynamicRepoTree();

  return [
    '<!-- markdownlint-disable MD032 MD022 MD036 MD024 -->',
    '# Repository Hub',
    '',
    `> Generated ${ts}`,
    '',
    dashboard,
    '',
    ...navLines,
    quickActions,
    '',
    '## Repository Structure',
    '```text',
    tree,
    '```',
    ''
  ].join('\n');
}

function writeHub(built) {
  const hubPath = path.join(OUTPUT_DIR, 'hub.md');
  const content = buildHub(built);

  fs.mkdirSync(path.dirname(hubPath), { recursive: true });
  fs.writeFileSync(hubPath, content, 'utf8');
  console.log(`✔ Hub created → ${path.relative(REPO_ROOT, hubPath)}`);
}

// CLI support
if (require.main === module) {
  let outputFiles = [];
  try {
    if (fs.existsSync(OUTPUT_DIR)) {
      outputFiles = fs.readdirSync(OUTPUT_DIR)
        .filter(f => f.startsWith('combined-') && f.endsWith('.md'))
        .map(f => ({
          name: f.replace('combined-', '').replace('.md', ''),
          title: f.replace(/combined-|\.md/g, ' ').trim(),
          output: f
        }));
    }
  } catch (err) {
    console.warn('⚠️ Could not read output directory for hub links:', err.message);
  }
  writeHub(outputFiles);
}

module.exports = { writeHub };
