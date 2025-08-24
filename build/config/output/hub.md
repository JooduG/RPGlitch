<!-- markdownlint-disable MD032 MD022 MD036 MD024 -->
# Repository Hub

> Generated 2025-08-22T02:29:13.288Z by `build/scripts/sync-hub.js`

🧪 Tests: ?/?  🏗️ Build: ❌  🔄 Last sync: 2h ago

**Core**
• [Rules](./combined-rules.md)
• [Docs (docs/)](./combined-docs.md)
• [Tests (tests/)](./combined-tests.md)

**Content**
• [Memory Bank (excluding archive/)](./combined-memory.md)
• [Tools (tools/ + build/scripts/)](./combined-tools.md)
• [Other (config files, root files, and miscellaneous)](./combined-other.md)

**Complete**
• [Everything (entire repo except archive/ & generated dirs)](./combined-everything.md)
• [Recent Changes (last 7 days, up to 100 files)](./combined-recent-changes.md)
• [All READMEs across repo](./combined-readmes.md)

## Quick Actions

```bash
npm run sync          # Update all (libs + configs + docs)
npm run deploy        # Full deploy pipeline
npm run test          # Run test suite
npm run lint:fix      # Fix linting issues
npm run build:copy    # Build & copy to clipboard
npm run sync:hub      # Update this hub
```

## Repository Structure

```text
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
```

## About

This repository contains RPGlitch, an AI-powered storytelling platform for Perchance.
Use the links above to explore different aspects of the codebase.
