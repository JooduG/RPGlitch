# 🚀 Claude Code Quick Start

> **Before you start coding, read [FOUNDATIONS.md](./FOUNDATIONS.md).** It contains your operational rulebook, persona definitions, and the STO execution framework.

> **For complete protocols, see [AGENTS.md](./AGENTS.md).**

## Overview

This is an **AI-assisted monorepo** for developing Perchance web applications (RPGlitch and ImageGlitch). The repository is optimized for AI agent operation and follows strict architectural patterns, particularly the **Perchance Two-Panel Architecture**.

**Important:** All AI agents must read and adhere to **[AGENTS.md](./AGENTS.md)** as the single source of truth for operational protocols, coding standards, and workflows.

## Quick Start

```bash
# Install dependencies and sync configurations
npm ci && npm run sync

# Build all applications
npm run build

# Run tests
npm test

# Lint and auto-fix code
npm run lint:fix
```

## Build Commands

- **Build all apps:** `npm run build`
- **Build RPGlitch:** `npm run build:rpglitch`
- **Build ImageGlitch:** `npm run build:imageglitch`
- **Complete deployment:** `npm run deploy` (sync, lint fix, build, test)

## Testing

- **Run all tests:** `npm test`
- **Test environment:** Jest with jsdom
- **Test location:** All tests must be in `/tests/` directory
- **Test naming:** Use pattern `<feature>.test.js` or `<feature>.test.mjs`
- **Configuration:** `jest.config.cjs` at repository root

## Linting

- **Lint all:** `npm run lint` (checks JS, CSS, HTML, Markdown)
- **Auto-fix:** `npm run lint:fix` (fixes JS and CSS)
- **JavaScript:** ESLint with `eslint.config.mjs`
- **CSS/SCSS:** Stylelint with `stylelint.config.cjs`
- **HTML:** HTMLHint
- **Markdown:** markdownlint-cli2

## Repository Structure

### Critical Architectural Principle: Two-Panel Architecture

All Perchance applications **MUST** maintain strict separation between:

1. **Left Panel** (`*-left-panel.txt`): Perchance engine logic, plugin imports, setup
2. **Right Panel** (source: `apps/*/html/index.html`): UI and application logic, compiled to single inlined HTML

**Never edit files in `/build/output/`** - always modify source files in `/apps/*/html/`, `/apps/*/js/`, or `/apps/*/scss/`.

### Directory Organization

- **`/apps/`**: User-facing Perchance applications
  - `apps/rpglitch/`: RPG entity management application
    - Logic: `RPGlitch-left-panel.txt`
    - UI: `html/index.html`
    - JavaScript: `js/` (ES6 modules)
    - Styles: `scss/` (compiled and inlined)
  - `apps/imageglitch/`: Text-to-Image generator
    - Logic: `ImageGlitch-left-panel.txt`
    - UI: `html/index.html`

- **`/build/`**: Build scripts, configurations, and output
  - `build/scripts/`: Build automation (build-app.js, sync.js, etc.)
  - `build/local_libs/`: Vendored dependencies (Pico.css, DOMPurify, Dexie, etc.)
  - `build/output/`: Generated artifacts (DO NOT EDIT)

- **`/tests/`**: All automated tests (Jest with jsdom)

- **`/memory-bank/`**: AI agent memory and knowledge base
  - `/forever`: Immutable principles (AGENTS.md, design-system.md)
  - `/present`: Current task workspace and handoffs
  - `/past`: Archive of completed tasks
  - `/future`: Planned tasks

## Architecture & Technology Stack

### JavaScript

- **ES6+ modules** (`import`/`export`) - IIFEs are forbidden
- **Vanilla DOM APIs** only (no jQuery/cash for DOM manipulation)
- **IndexedDB via Dexie.js** for all state persistence (single source of truth)
- **DOMPurify** for sanitizing any dynamic HTML (mandatory for security)
- **No external dependencies** in final build (everything inlined)

### CSS

- **Pico.css** as base framework
- **SCSS** for custom styles (simplified 7-1 pattern)
- **Maximum 3 levels** of selector nesting
- **Atomic CSS utilities** for low-level styling
- Compiled to single CSS block and inlined in HTML

### HTML

- **HTML5 semantic elements** (main, nav, header, footer, article, section)
- **Accessibility required:** all images need alt text, all inputs need labels
- **_hyperscript** for simple declarative UI interactions
- Single inlined HTML output per application

### State Management

- **Database-first architecture:** IndexedDB (via Dexie) is the single source of truth
- **Local-first:** Applications must be fully functional offline
- **UI reactivity:** UI updates in response to database changes

## Key Perchance Plugins

The applications use these core Perchance plugins (imported in left panel):

- `ai-text-plugin` - LLM text generation
- `text-to-image-plugin` - Stable Diffusion image generation
- `super-fetch-plugin` - CORS bypass for external requests
- `ai-character-chat-dependencies-v1` - Bundles Dexie.js and DOMPurify

## Coding Standards

### Mandatory Rules

1. **ES6+ syntax only:** Use `const`/`let`, arrow functions, template literals
2. **No `var` keyword** - forbidden
3. **DOMPurify.sanitize()** required before any `innerHTML` assignment with user/dynamic content
4. **IndexedDB only** for state - no localStorage/sessionStorage
5. **Zero-error policy:** Fix all bugs immediately before new work
6. **Edit source files only:** Never edit `/build/output/` directly

### Naming Conventions

- **JavaScript:** `camelCase` for functions/variables, `App.*` for global APIs
- **CSS:** `kebab-case` for classes, optional BEM modifiers (`.block--modifier`)

### Security

- Never commit secrets (use `.env` for local development)
- Sanitize all user input and AI-generated content with DOMPurify
- Avoid external network calls in app code (vendor to `/build/local_libs/`)

## Design Philosophy

Detailed design system in **[design-system.md](./design-system.md)**. Key principles:

- **Icon-Free Mandate:** All interactive UI must use explicit text labels (icons only as embellishment)
- **Minimalism with purpose:** Every visual element must serve a purpose
- **Accessibility by design:** Universal usability is non-negotiable
- **Pico.css foundation** with custom gradient background and color palettes

## Common RPGlitch UI Components

- **#main-app-container**: Root element
- **#main-output**: Primary content area
- **#top-bar**: Persistent header
- **#chin**: Slide-out panel for entity selection (Stories/Characters/Worlds)
- **#storyboard**: Three-column grid for Story/Character/World cards
- **#chat-screen-container**: Chat interface (3-column on desktop, 1-column on mobile)

## Git Workflow

### Commit Message Format

Use **Conventional Commits**: `<type>(<scope>): <subject>`

- **Types:** feat, fix, docs, style, refactor, test, chore, build
- **Scopes:** rpglitch, imageglitch, core, build, agents, deps

Examples:
- `feat(rpglitch): add character save functionality`
- `fix(imageglitch): correct aspect ratio calculation`
- `docs(agents): update persona descriptions`
- `test(rpglitch): add unit tests for inventory`

### Branch Naming

- **AI agents:** `{agent-name}/{date}-{time}-{short-feature}`
- **Humans:** `{scope}/{short-task-description}`

## Important Files to Consult

1. **[AGENTS.md](./AGENTS.md)** - Complete operational protocol for AI agents (mandatory reading)
2. **[design-system.md](./design-system.md)** - Complete UI/UX guidelines and component library
3. **[README.md](./README.md)** - Repository overview and navigation guide
4. **package.json** - All available npm scripts and dependencies

## Build Process Details

The build process (`build/scripts/build-app.js`) does the following:

1. Compiles SCSS to CSS (with Pico.css base and autoprefixer)
2. Bundles JavaScript modules with esbuild (ES6+ to IIFE, minified)
3. Inlines all CSS into `<style>` tags
4. Inlines all JavaScript into `<script type="module">` tags
5. Inlines vendored libraries from `/build/local_libs/`
6. Produces single HTML file in `/build/output/`

Final output is a **single, self-contained HTML file** with no external dependencies.

## MCP Servers

This repository uses Model Context Protocol (MCP) servers for advanced reasoning:

- **Master configuration:** `mcp.master.json`
- **Sync MCP config:** `npm run sync:mcp`
- **Start all MCP servers:** `npm run mcp:start-all`

Available MCP servers:
- `@waldzellai/metacognitive-monitoring` - Metacognitive reasoning
- `@waldzellai/scientific-method` - Causal analysis
- `@waldzellai/clear-thought` - Clear thinking patterns

## Development Tips

1. **Always sync first:** Run `npm run sync` after pulling changes to ensure configs are up-to-date
2. **Build before testing:** Some tests may require built artifacts
3. **Check linting:** Run `npm run lint:fix` before committing
4. **Consult AGENTS.md:** For complex tasks, follow the STO Framework (Strategy, Tactics, Operations) defined in AGENTS.md
5. **Test locally:** Run `npm test` to ensure all tests pass before pushing
