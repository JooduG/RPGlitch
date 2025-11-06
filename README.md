# 🚀 Perchance Development Monorepo

An **AI-assisted, production-ready ecosystem** for building Perchance applications with sophisticated tooling, automation, and rigorous standards.

---

## 🎯 Quick Start
```bash
# Setup
npm ci && npm run sync

# Build
npm run build:apps

# Test
npm test

# Lint & fix
npm run lint:fix

# Deploy
npm run deploy
```

-----

## 📚 Master Documentation (Start Here)

This is your single source of truth. Read in this order:

1.  **AI Protocol** - **START HERE** - Pick your platform:
    - **[CLAUDE.md](./CLAUDE.md)** for Claude Code
    - **[GEMINI.md](./GEMINI.md)** for Gemini
2.  **[design-system.md](./design-system.md)** - UI/UX guidelines & components (Icon-Free Mandate, Chat View, Chin, etc.)
3.  **[PERCHANCE.md](./PERCHANCE.md)** - Perchance Two-Panel Architecture, plugin integration, deployment workflow
4.  **[plan.md](./plan.md)** - Project roadmap, backlog, feature pipeline

### Additional References

  - **[perchance-development-guide.md](./perchance-development-guide.md)** - Comprehensive Perchance platform reference (procedural generation, AI plugins, oc object, LLM theory)

-----

## 🤖 AI Operation

This repository is optimized for AI-assisted development with comprehensive protocols for multiple AI platforms:

### Supported AI Platforms

- **Claude Code** → See **[CLAUDE.md](./CLAUDE.md)** - Instructions for Anthropic's Claude Code CLI
- **Gemini** → See **[GEMINI.md](./GEMINI.md)** - Instructions for Google's Gemini with STO Framework & personas

Both protocols cover:
- Project architecture & build system
- Coding standards & non-negotiable rules
- Task planning & execution workflows
- Testing & deployment procedures

Choose the protocol matching your AI platform.

-----

## 📁 Repository Structure

### Applications

  - **[`apps/rpglitch/`](./apps/rpglitch/)** - RPG entity manager (Characters, Worlds, Stories, Chat)
  - **[`apps/imageglitch/`](./apps/imageglitch/)** - Text-to-image generator

### Build System

  - **[`build/`](./build/)** - Build scripts, vendored dependencies, output artifacts
  - **[`build/scripts/`](./build/scripts/)** - Automated build pipeline
  - **[`build/local_libs/`](./build/local_libs/)** - Vendored dependencies (Pico.css, Dexie, DOMPurify, etc.)
  - **[`build/output/`](./build/output/)** - ⚠️ DO NOT EDIT - generated artifacts only

### Testing & Quality

  - **[`tests/`](./tests/)** - Jest test suite with jsdom environment

### Tooling & Utilities

  - **[`tools/`](./tools/)** - Diagnostic scripts, utilities, git guards
  - **[`.gemini/`](./.gemini/)** - Gemini AI configuration, settings, and MCP definitions.

### Documentation & Planning

  - **[`plan.md`](./plan.md)** - Project roadmap, feature backlog, execution plans
  - **[`design-system.md`](./design-system.md)** - UI/UX guidelines, components, Icon-Free Mandate
  - **[`memory-bank/archive/`](./memory-bank/archive/)** - Historical task logs & decisions (read-only)

-----

## 🔧 Development Workflow

### For Humans

1.  Read the complete protocol: **[CLAUDE.md](./CLAUDE.md)** or **[GEMINI.md](./GEMINI.md)**
2.  Check **[design-system.md](./design-system.md)** for UI rules
3.  Understand the architecture in `/apps/`
4.  See **[plan.md](./plan.md)** for what to work on next

### For AI Assistants

1.  Load your platform-specific protocol (CLAUDE.md or GEMINI.md)
2.  Follow the workflow defined in that protocol
3.  Adhere to all **Non-Negotiable Rules** below
4.  Use TodoWrite for task tracking
5.  Run tests after changes

-----

## ✅ Non-Negotiable Rules

**Code:**

  - No `var` keyword (use `const`/`let`)
  - No localStorage/sessionStorage (IndexedDB only)
  - `DOMPurify.sanitize()` on all dynamic HTML
  - ES6 modules only (no IIFEs)
  - Vanilla DOM APIs (no external libraries)

**UI:**

  - Icon-Free Mandate: text labels required, icons embellish
  - Semantic HTML5 (`<main>`, `<nav>`, `<header>`, etc.)
  - Accessibility baseline: alt text, labels, keyboard nav

**Architecture:**

  - Perchance Two-Panel Architecture (Left/Right Panel separation)
  - Single inlined HTML output per app (all CSS/JS embedded)
  - IndexedDB (via Dexie) as single source of truth

**Quality:**

  - Zero-error policy: fix bugs immediately
  - Run tests after every change
  - Linting passes before commit
  - Conventional Commits format

**Security:**

  - Never commit secrets (use `.env`)
  - All dependencies vendored (no CDN)
  - Sanitize all user/AI content

-----

## 🎯 Common Tasks

### Build & Deploy

```bash
npm run build:apps            # Build all apps
npm run build:rpglitch        # Build RPGlitch only
npm run build:imageglitch     # Build ImageGlitch only
npm run deploy                # Full pipeline: sync -> lint -> build -> test
```

### Testing

```bash
npm test                      # Run all tests
npm run lint                  # Check linting
npm run lint:fix              # Auto-fix linting
npm run validate              # Verify artifacts exist
```

### Development

```bash
node build/scripts/watch.js   # Auto-rebuild on file changes
npm run sync                  # Sync configs & libraries
```

### MCP & Advanced

```bash
npm run sync:mcp              # Generate MCP config from master
npm run mcp:start-all         # Start all MCP servers
```

-----

## 🏗️ Architecture Overview

### Two-Panel Architecture (Perchance)

Every application follows this strict separation (see **[PERCHANCE.md](./PERCHANCE.md)** for detailed deployment workflow):

  - **Left Panel** (`*-left-panel.txt`) - **Manually deployed, NOT built**

      - Perchance engine logic
      - Plugin imports (ai-text-plugin, text-to-image-plugin, etc.)
      - Core setup & configuration
      - Directly copied/pasted into Perchance editor

  - **Right Panel** (source: `apps/*/html/index.html`) - **Auto-built**

      - Main application UI & logic
      - JavaScript modules (`js/`)
      - Styles (`scss/`)
      - **Compiled into single inlined HTML** during build
      - Output: `build/output/RPGlitch.html` or `build/output/imageglitch.html`

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **State** | IndexedDB (Dexie.js) | Persistent, local-first storage |
| **UI Framework** | Pico.css (+ custom SCSS) | Minimalist, semantic styling |
| **JavaScript** | ES6+ modules (vanilla) | Pure, modular, no frameworks |
| **Security** | DOMPurify | XSS prevention on all HTML |
| **Build** | esbuild + PostCSS | Compile & inline into single HTML |

### Build Output

  - **Single HTML file per app** - No external dependencies
  - **All CSS inlined** - In `<style>` tags
  - **All JS inlined** - In `<script type="module">` tags
  - **Vendored libs inlined** - Pico.css, Dexie, DOMPurify, etc.

-----

## 📖 Glossary

| Term | Meaning |
|------|---------|
| Chin | Slide-out side panel in RPGlitch UI |
| Storyboard | 3-column grid for selecting Story/Character/World |
| Two-Panel Architecture | Perchance Left (engine) + Right (UI) separation |
| FSM | Finite State Machine (Chat state: idle, sending, streaming, done) |
| Watchdog | Polling mechanism to detect and auto-heal UI blocking |
| Overlay Guard | Function to force-close lingering UI blockers |
| DOMPurify | HTML sanitizer library (prevents XSS) |
| Dexie | IndexedDB wrapper library (state persistence) |
| STO Framework | Strategy -\> Tactics -\> Operations (execution blueprint) |

-----

## 🚀 Next Steps

1.  **New to the project?** - Read **[CLAUDE.md](./CLAUDE.md)** or **[GEMINI.md](./GEMINI.md)**
2.  **Building UI?** - See **[design-system.md](./design-system.md)**
3.  **Planning features?** - See **[plan.md](./plan.md)**
4.  **Deploying to Perchance?** - See **[PERCHANCE.md](./PERCHANCE.md)**

-----

## 📞 Support

  - **AI Protocols:** **[CLAUDE.md](./CLAUDE.md)** | **[GEMINI.md](./GEMINI.md)**
  - **Build Issues:** [build/README.md](./build/README.md)
  - **Testing:** [tests/](./tests/)
  - **Tools & Utilities:** [tools/README.md](./tools/README.md)

-----

*Optimized for AI-assisted Perchance development. Humans welcome too.*
