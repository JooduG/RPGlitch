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

  try {
    // Check if Jest output exists
    const testOutput = execSync('npm test 2>&1', { cwd: REPO_ROOT, encoding: 'utf8' });
    const testMatch = testOutput.match(/(\d+) passed.*?(\d+) total/);
    if (testMatch) stats.tests = `${testMatch[1]}/${testMatch[2]}`;
  } catch { /* empty */ }

  try {
    // Check build output exists
    const buildFile = path.join(REPO_ROOT, 'build/output/RPGlitch-perchance.html');
    stats.build = fs.existsSync(buildFile) ? '✅' : '❌';
  } catch { /* empty */ }

  try {
    // Check last sync time
    const hubFile = path.join(OUTPUT_DIR, 'hub.md');
    if (fs.existsSync(hubFile)) {
      const content = fs.readFileSync(hubFile, 'utf8');
      const timeMatch = content.match(/Generated (\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/); 
      if (timeMatch) {
        const syncTime = new Date(timeMatch[1]);
        const now = new Date();
        const diffHours = Math.floor((now - syncTime) / (1000 * 60 * 60));
        stats.lastSync = diffHours < 1 ? 'Just now' : `${diffHours}h ago`;
      }
    }
  } catch { /* empty */ }

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
├── .rules/                # Master IDE rules
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
  // When run directly, generate hub from existing combined files
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