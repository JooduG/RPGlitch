# RPGlitch

A feature-rich Perchance application for managing AI-powered RPG entities (Characters, Worlds, Stories) with interactive chat capabilities.

## Overview

RPGlitch enables users to create characters and worlds, then engage in AI-driven roleplay conversations. It uses IndexedDB for local-first data persistence and integrates with Perchance AI plugins for text generation.

## Architecture

### Two-Panel Structure (Perchance)

- **Left Panel:** `RPGlitch-left-panel.txt`

  - Perchance engine logic
  - Plugin imports (ai-text-plugin, text-to-image-plugin, super-fetch-plugin, etc.)
  - Core setup and configuration
  - Note: Dexie.js and DOMPurify are vendored in build, not loaded via plugins

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

```text
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
- **Security Hardened:** Defense-in-depth approach with XSS prevention and input validation

## Technology Stack

- **State Management:** IndexedDB via Dexie.js (single source of truth)
- **UI Framework:** Custom components built on Pico.css
- **JavaScript:** ES6+ modules (vanilla, no framework)
- **Styling:** SCSS compiled to CSS, inlined in build
- **Security:** DOMPurify for all dynamic HTML sanitization

## Security Features

RPGlitch implements a defense-in-depth security architecture:

- **XSS Prevention:** All user input and AI-generated content sanitized with DOMPurify before rendering
- **URL Validation:** SOTA URL validation using native URL constructor for image uploads and generation
- **Type Safety:** Comprehensive type checking for all plugin responses and external data
- **Input Sanitization:** Multi-layer validation for file uploads, image URLs, and user-provided content
- **Safe DOM Manipulation:** Prefer `textContent` over `innerHTML` where possible; sanitize when HTML rendering is required
- **Plugin Response Validation:** All Perchance plugin responses validated and sanitized before use

Recent security improvements (2025-11-10):
- Patched critical XSS vulnerabilities in image handling (PR #280)
- Implemented comprehensive URL validation with proper pathname and query parameter handling
- Added defense against malicious data URLs and file paths
- Enhanced error logging for security-relevant events

## Development

See the main repository README.md and GEMINI.md for:

- Complete development protocol and rules
- Coding standards
- Build process details
- Testing guidelines
- Deployment workflow

## Related Documentation

- [GEMINI.md](../../GEMINI.md) - Complete protocol and development guidelines
- [design-system.md](../../design-system.md) - UI/UX guidelines and components
- [plan.md](../../plan.md) - Project roadmap and feature backlog
