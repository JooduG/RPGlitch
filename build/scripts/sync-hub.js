const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

function getActivityDashboard() {
  const stats = {
    tests: '?/?',
    lint: '?',
    build: '?',
    lastSync: 'Never'
  };

  // ⚠️ Important:
  // We intentionally SKIP running the test suite here by default, because this script
  // is called inside `npm run sync`, and `deploy(:loose)` runs `npm test` right after sync.
  // To *optionally* run tests from the hub, set HUB_RUN_TESTS=1.
  if (process.env.HUB_RUN_TESTS === '1') {
    try {
      // Keep it deterministic and fast; also guard against hangs.
      const cmd = process.platform === 'win32' ? 'npm.cmd test --silent' : 'npm test --silent';
      const testOutput = execSync(cmd, {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000,           // 30s safety cap so hub generation can’t hang forever
        env: { ...process.env, CI: 'true' }
      });
      const testMatch = testOutput.match(/(\d+)\s+passed.*?(\d+)\s+total/);
      if (testMatch) stats.tests = `${testMatch[1]}/${testMatch[2]}`;
    } catch {
      // If tests fail or timeout, show a warning glyph instead of blocking the pipeline.
      stats.tests = '⚠︎';
    }
  }

  try {
    const buildFile = path.join(REPO_ROOT, 'build/output/RPGlitch-perchance.html');
    stats.build = fs.existsSync(buildFile) ? '✅' : '❌';
  } catch { /* noop */ }

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
  } catch { /* noop */ }

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
    'npm run deploy        # Full deploy pipeline',
    'npm run test          # Run test suite',
    'npm run lint:fix      # Fix linting issues',
    'npm run build:copy    # Build & copy to clipboard',
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
  const outputFiles = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.startsWith('combined-') && f.endsWith('.md'))
    .map(f => ({
      name: f.replace('combined-', '').replace('.md', ''),
      title: f.replace('combined-', '').replace('.md', '').replace(/-/g, ' '),
      output: f
    }));

  writeHub(outputFiles);
}

module.exports = { writeHub };
