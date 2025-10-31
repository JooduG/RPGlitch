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

---

## 📚 Master Documentation (Start Here)

This is your single source of truth. Read in this order:

1. **[FOUNDATIONS.md](./FOUNDATIONS.md)** ← **Start here** for operational identity & STO framework
2. **[AGENTS.md](./AGENTS.md)** ← Complete protocols, coding standards, all rules
3. **[CLAUDE.md](./CLAUDE.md)** ← Claude Code quick start
4. **[design-system.md](./design-system.md)** ← UI/UX guidelines & components
5. **[CODE_REVIEW.md](./CODE_REVIEW.md)** ← Quality gates, security, implementation checklist
6. **[plan.md](./plan.md)** ← Project roadmap, backlog, feature pipeline

---

## 🤖 AI Agent Operation

This repository is optimized for AI-assisted development via Claude Code subagents.

### Subagent Architecture

All subagents live in `.claude/agents/` and are automatically loaded by Claude Code.

| Subagent | Role | Tools | When to Use |
|----------|------|-------|------------|
| **Architect** | Strategic design | read, grep | High-level system decisions |
| **Planner** | Operational blueprints | read, grep | Planning before execution (MUST USE) |
| **Coder** | Implementation | read, write, bash | Writing code, running tests |
| **UI/UX** | Interface design | read, write, bash | Designing & implementing UI |
| **Security/QA** | Quality gates | read, bash | Verify security, run tests |
| **Debugger** | Error resolution | read, bash | Investigate & fix bugs |
| **Test Runner** | Test automation | read, write, bash | Run tests, improve coverage |
| **Memory Keeper** | Knowledge archive | read, write | Document handoffs, archive tasks |

**Usage:** Mention a subagent by name in Claude Code, or they auto-delegate based on task context.

**Read More:** [FOUNDATIONS.md](./FOUNDATIONS.md) – Operational roles & hierarchy

### Model Efficiency

Each subagent uses a cost-optimized Claude model:
- **Opus 4.1** (Strategy/Planning) – Heavy thinking
- **Sonnet 4.5** (Implementation/Design) – Balanced
- **Haiku 4.5** (Testing/Security/Docs) – Fast & cheap

---

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
- **[`CODE_REVIEW.md`](./CODE_REVIEW.md)** - Current code review & improvement backlog

### Tooling & Utilities
- **[`tools/`](./tools/)** - Diagnostic scripts, utilities, git guards
- **[`.claude/agents/`](./.claude/agents/)** - Claude Code subagent definitions

### Documentation & Planning
- **[`plan.md`](./plan.md)** - Project roadmap, feature backlog, execution plans
- **[`design-system.md`](./design-system.md)** - UI/UX guidelines, components, Icon-Free Mandate
- **[`memory-bank/archive/`](./memory-bank/archive/)** - Historical task logs & decisions (read-only)

---

## 🔧 Development Workflow

### For Humans
1. Read [FOUNDATIONS.md](./FOUNDATIONS.md) & [AGENTS.md](./AGENTS.md)
2. Understand the architecture in `/apps/`
3. Check [design-system.md](./design-system.md) for UI rules
4. See [plan.md](./plan.md) for what to work on next

### For Claude Code
1. Mention a subagent by name or task
2. Subagents auto-coordinate using STO framework
3. All work flows through Planner (orchestrator)
4. Security/QA gates every change
5. Tests run automatically after implementation

---

## ✅ Non-Negotiable Rules

**Code:**
- No `var` keyword (use `const`/`let`)
- No localStorage/sessionStorage (IndexedDB only)
- DOMPurify.sanitize() on all dynamic HTML
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
npm run build                  # Build all apps
npm run build:rpglitch        # Build RPGlitch only
npm run deploy                # Full pipeline: sync → lint → build → test
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

---

## 🏗️ Architecture Overview

### Two-Panel Architecture (Perchance)

Every application follows this strict separation:

- **Left Panel** (`*-left-panel.txt`)
  - Perchance engine logic
  - Plugin imports (ai-text-plugin, text-to-image-plugin, etc.)
  - Core setup & configuration

- **Right Panel** (source: `apps/*/html/index.html`)
  - Main application UI & logic
  - JavaScript modules (`js/`)
  - Styles (`scss/`)
  - **Compiled into single inlined HTML** during build

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

---

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
| STO Framework | Strategy → Tactics → Operations (execution blueprint) |

---

## 🚀 Next Steps

1. **New to the project?** → Read [FOUNDATIONS.md](./FOUNDATIONS.md)
2. **Using Claude Code?** → Check [CLAUDE.md](./CLAUDE.md)
3. **Building UI?** → See [design-system.md](./design-system.md)
4. **Reviewing code?** → Check [CODE_REVIEW.md](./CODE_REVIEW.md)
5. **Planning features?** → See [plan.md](./plan.md)

---

## 📞 Support

- **AI Agent Protocols:** [AGENTS.md](./AGENTS.md)
- **Build Issues:** [build/README.md](./build/README.md)
- **Testing:** [tests/](./tests/) & [CODE_REVIEW.md](./CODE_REVIEW.md)
- **Tools & Utilities:** [tools/README.md](./tools/README.md)

---

*Optimized for AI-assisted Perchance development. Humans welcome too.*