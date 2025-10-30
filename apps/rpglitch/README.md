# RPGlitch

A feature-rich Perchance application for managing AI-powered RPG entities (Characters, Worlds, Stories) with interactive chat capabilities.

## Overview

RPGlitch enables users to create characters and worlds, then engage in AI-driven roleplay conversations. It uses IndexedDB for local-first data persistence and integrates with Perchance AI plugins for text generation.

## Architecture

### Two-Panel Structure (Perchance)

- **Left Panel:** `RPGlitch-left-panel.txt`
  - Perchance engine logic
  - Plugin imports (ai-text-plugin, ai-character-chat-dependencies-v1)
  - Core setup and configuration

- **Right Panel:** Source in `html/index.html`
  - Main application UI and logic
  - JavaScript modules in `js/`
  - Styles in `scss/`
  - Compiled into single inlined HTML output

## Build

```bash
# Build RPGlitch
npm run build:rpglitch

# Output location
build/output/RPGlitch.html
```

## Source Structure

```
apps/rpglitch/
├── RPGlitch-left-panel.txt    # Perchance engine (plugin imports, setup)
├── html/
│   └── index.html              # Main UI template
├── js/
│   ├── index.js                # Main application logic and App.* APIs
│   ├── db.js                   # Dexie.js database schema
│   ├── entities.js             # Character/World/Story management
│   ├── entity-form.js          # Entity creation/editing forms
│   ├── profile.js              # Profile view rendering
│   ├── profile-router.js       # Profile navigation
│   └── utils.js                # Shared utilities
└── scss/
    └── index.scss              # Styles (compiled and inlined)
```

## Key Features

- **Entity Management:** Create, edit, and delete Characters, Worlds, and Stories
- **Storyboard:** Select Character + World combinations to start AI conversations
- **Chat Interface:** Interactive AI-driven roleplay with FSM-based message handling
- **Local-First:** All data stored in IndexedDB (fully offline capable)
- **Import/Export:** JSON-based data portability
- **UI Safety:** Watchdog systems to prevent UI blocking

## Technology Stack

- **State Management:** IndexedDB via Dexie.js (single source of truth)
- **UI Framework:** Custom components built on Pico.css
- **JavaScript:** ES6+ modules (vanilla, no framework)
- **Styling:** SCSS compiled to CSS, inlined in build
- **Security:** DOMPurify for all dynamic HTML sanitization

## Development

See the main repository README.md and AGENTS.md for:
- Coding standards
- Build process details
- Testing guidelines
- Deployment workflow

## Related Documentation

- [AGENTS.md](../../AGENTS.md) - Development protocols and rules
- [design-system.md](../../design-system.md) - UI/UX guidelines and components
- [CLAUDE.md](../../CLAUDE.md) - Quick start guide
