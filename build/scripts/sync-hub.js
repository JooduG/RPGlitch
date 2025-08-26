#!/usr/bin/env node
/* Generate build/output/hub.md with a small dashboard and quick links.
 * - Never blocks the pipeline.
 * - Tests are OPTIONAL: set HUB_RUN_TESTS=1 to include counts (30s timeout).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

function getActivityDashboard() {
  const stats = {
    tests: '?/?',
    build: '?',
    lastSync: 'Never'
  };

  // Optional test run (off by default)
  if (process.env.HUB_RUN_TESTS === '1') {
    try {
      const cmd = process.platform === 'win32' ? 'npm.cmd test --silent' : 'npm test --silent';
      const out = execSync(cmd, {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000, // hard cap so hub cannot hang
        env: { ...process.env, CI: 'true' }
      });
      const m = out.match(/(\d+)\s+passed.*?(\d+)\s+total/);
      if (m) stats.tests = `${m[1]}/${m[2]}`;
    } catch {
      stats.tests = '⚠︎';
    }
  }

  // Check actual build artifact used by build-rpglitch.js
  try {
    const buildFile = path.join(REPO_ROOT, 'build', 'output', 'RPGlitch.html');
    stats.build = fs.existsSync(buildFile) ? '✅' : '❌';
  } catch { /* ignore */ }

  // Rough "last sync" from previous hub timestamp
  try {
    const hubFile = path.join(OUTPUT_DIR, 'hub.md');
    if (fs.existsSync(hubFile)) {
      const content = fs.readFileSync(hubFile, 'utf8');
      const timeMatch = content.match(/Generated (\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
      if (timeMatch) {
        const syncTime = new Date(timeMatch[1]);
        const diffHours = Math.floor((Date.now() - syncTime.getTime()) / 36e5);
        stats.lastSync = diffHours < 1 ? 'Just now' : `${diffHours}h ago`;
      }
    }
  } catch { /* ignore */ }

  return `🧪 Tests: ${stats.tests}  🏗️ Build: ${stats.build}  🔄 Last sync: ${stats.lastSync}`;
}

function buildSimpleRepoTree() {
  return `
\`\`\`text
rpglitch/
├── apps/
│   ├── rpglitch/          # Main Perchance app
│   └── imageglitch/       # Image generator app
├── build/
│   ├── scripts/           # Build & sync automation
│   ├── config/            # Linting & tool configs
│   └── output/            # Generated files
├── docs/                  # Project documentation
├── tests/                 # Jest test suites
├── tools/                 # Development utilities
├── memory-bank/           # AI context & knowledge
├── rules/                 # Canonical rules (synced to IDE configs)
├── .cursor/               # Cursor IDE config
├── .windsurf/             # Windsurf IDE config
└── .github/               # GitHub workflows
\`\`\`
`;
}

function buildHub(built) {
  const ts = new Date().toISOString();
  const others = built.filter(b => b.name !== 'hub');

  const navSections = {
    'Core': ['rules', 'docs', 'tests'],
    'Content': ['memory', 'tools', 'combined-other'],
    'Complete': ['combined-everything', 'combined-recent-changes', 'readmes']
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
    '',
    '```bash',
    'npm run sync          # Update all (libs + configs + docs)',
    'npm run deploy        # Full deploy pipeline (local)',
    'npm run deploy:ci     # CI-safe deploy (no clipboard)',
    'npm run test          # Run test suite',
    'npm run lint:fix      # Fix linting issues',
    'npm run build:copy    # Build & copy to clipboard (local)',
    'npm run sync:hub      # Update this hub',
    '```',
    ''
  ].join('\n');

  const tree = buildSimpleRepoTree();

  return [
    '<!-- markdownlint-disable MD032 MD022 MD036 MD024 -->',
    '# Repository Hub',
    '',
    `> Generated ${ts} by \`build/scripts/sync-hub.js\``,
    '',
    dashboard,
    '',
    navLines.join('\n'),
    quickActions,
    '## Repository Structure',
    tree,
    '## About',
    '',
    'This repository contains RPGlitch, an AI-powered storytelling platform for Perchance.',
    'Use the links above to explore different aspects of the codebase.',
    ''
  ].join('\n');
}

function writeHub(built) {
  const hubPath = path.join(OUTPUT_DIR, 'hub.md');
  const content = buildHub(built);

  fs.mkdirSync(path.dirname(hubPath), { recursive: true });
  fs.writeFileSync(hubPath, content, 'utf8');
  console.log(`✔ hub created → ${path.relative(REPO_ROOT, hubPath)}`);
}

// CLI support
if (require.main === module) {
  // Gather available combined files if the folder exists; otherwise still emit a hub.
  let outputFiles = [];
  try {
    if (fs.existsSync(OUTPUT_DIR)) {
      outputFiles = fs.readdirSync(OUTPUT_DIR)
        .filter(f => f.startsWith('combined-') && f.endsWith('.md'))
        .map(f => ({
          name: f.replace('combined-', '').replace('.md', ''),
          title: f.replace('combined-', '').replace('.md', '').replace(/-/g, ' '),
          output: f
        }));
    }
  } catch { /* ignore */ }

  writeHub(outputFiles);
}

module.exports = { writeHub };
