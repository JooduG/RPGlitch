# 🚀 Perchance Development Monorepo

An **AI-assisted, production-ready ecosystem** for building Perchance applications with sophisticated tooling, automation, and rigorous standards.

---

## 🎯 Quick Start

```bash
# Setup
npm ci && npm run sync

# Build all apps
npm run build:apps

# Test & lint
npm test && npm run lint:fix

npm run deploy
```

---

## 🚢 Deployment Workflow (The "Manual Bridge")

Because Perchance does not have an API, deployment involves a manual "Copy-Paste" step after building.

### 1. Build

Run `npm run deploy` (or `npm run build:apps`).

### 2. Copy Left Panel (The Engine)

1. Open `apps/[App]/[App]-left-panel.txt`.
2. Copy **entire contents**.
3. Paste into Perchance Editor -> **Lists (Left Panel)**.

### 3. Copy Right Panel (The Stage)

1. Open `apps/[App]/[App].html`.
2. Copy **entire contents**.
3. Paste into Perchance Editor -> **HTML (Right Panel)**.

_Save and Refresh to go live._

---

## 📚 Documentation Roadmap

**Choose your path below:**

### 🤖 For AI Assistants

**STOP.** Do not read this file further.

> **[GO TO AGENTS.md](./AGENTS.md)**: Your dedicated entry point, context map, and rigid protocol definitions.

### 👤 For Humans (Developers)

Start here, then pick your path:

- **Features & Roadmap:** **[.agent/planning/plan.md](./.agent/planning/plan.md)** (What we are building)
- **Deep Technical Guide:** **[.agent/knowledge/perchance-technical.md](./.agent/knowledge/perchance-technical.md)** (Architecture & Freedom Protocol)
- **UI Architecture:** **[.agent/rules/style.md](./.agent/rules/style.md)**

---

## 📁 Repository Structure

### Apps Structure

- **[RPGlitch](./apps/rpglitch/README.md)** - RPG entity manager (Characters, Worlds, Stories)
- **[ImageGlitch](./apps/imageglitch/README.md)** - Text-to-image generator

### Build System

- **[`tools/`](./tools/)** - Automated build and maintenance scripts
- **[`libs/`](./libs/)** - Vendored dependencies (Pico.css, Dexie, DOMPurify, etc.)

### Testing & Quality

- **[`tools/tests/`](./tools/tests/)** - Jest test suite with jsdom environment

### Tooling & Utilities

- **[`.gemini/`](./.gemini/)** - Gemini AI configuration, settings, and MCP definitions.

### Documentation & Planning

- **[`plan.md`](./.agent/planning/plan.md)** - Project roadmap, feature backlog, execution plans
- **[`style.md`](./.agent/rules/style.md)** - UI/UX guidelines, components, Icon-Free Mandate

---

## 🔧 Development Workflow

### For Humans

1. Check **[.agent/rules/style.md](./.agent/rules/style.md)** for UI rules
2. Understand the architecture in `/apps/`
3. See **[.agent/planning/plan.md](./.agent/planning/plan.md)** for what to work on next

---

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

---

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
node tools/build/watch.js   # Auto-rebuild on file changes
npm run sync                  # Sync configs & libraries
```

### MCP & Advanced

```bash
npm run sync:mcp              # Generate MCP config from master
npm run mcp:start-all         # Start all MCP servers
```

---

## 🏗️ Tech Stack

| Layer            | Technology               | Purpose                                     |
| ---------------- | ------------------------ | ------------------------------------------- |
| **State**        | IndexedDB (Dexie.js)     | Local-first storage, single source of truth |
| **UI Framework** | Pico.css (+ custom SCSS) | Minimalist, semantic styling                |
| **JavaScript**   | ES6+ modules (vanilla)   | Pure, modular, no frameworks                |
| **Security**     | DOMPurify                | XSS prevention for dynamic HTML             |
| **Build**        | esbuild + PostCSS        | Compile & inline into single HTML file      |

See **[.agent/knowledge/perchance-technical.md](./.agent/knowledge/perchance-technical.md)** for the Two-Panel Architecture explanation and deployment workflow.

---

## 📖 Glossary

| Term                   | Meaning                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| Chin                   | Slide-out side panel in RPGlitch UI                               |
| Storyboard             | 3-column grid for selecting Story/Character/World                 |
| Two-Panel Architecture | Perchance Left (engine) + Right (UI) separation                   |
| FSM                    | Finite State Machine (Chat state: idle, sending, streaming, done) |
| Watchdog               | Polling mechanism to detect and auto-heal UI blocking             |
| Overlay Guard          | Function to force-close lingering UI blockers                     |
| DOMPurify              | HTML sanitizer library (prevents XSS)                             |
| Dexie                  | IndexedDB wrapper library (state persistence)                     |
| STO Framework          | Strategy -\> Tactics -\> Operations (execution blueprint)         |

---

## 🚀 Next Steps

1. **Building UI?** - See **[.agent/rules/style.md](./.agent/rules/style.md)**
2. **Planning features?** - See **[.agent/planning/plan.md](./.agent/planning/plan.md)**
3. **Deploying to Perchance?** - See **[.agent/knowledge/perchance-technical.md](./.agent/knowledge/perchance-technical.md)**

---

## 📞 Support

- **Build Issues:** [tools/build/](./tools/build/)
- **Testing:** [tools/tests/](./tools/tests/)

---

_Optimized for AI-assisted Perchance development. Humans welcome too._
