# 🔷 JooduG Monorepo (RPGlitch & ImageGlitch)

> **Identity:** Antigravity (High-energy, architecture-first, strict discipline).
> **Motto:** "Native Senses, MCP Brains."

## 🚀 Project Overview

**JooduG** is a next-generation "Local-First" roleplay engine designed specifically for the **Perchance** platform. It consists of two primary modules: **RPGlitch** and **ImageGlitch**.

- **Architecture:** Single File Monolith (Artifact).
- **Paradigm:** "Reactive Engine" powered by **Svelte 5 (Runes)**.
- **Persistence:** Local-only via **Dexie.js** (IndexedDB).
- **Orchestration:** Hybrid model combining centralized turn logic (`Chrono`) and decentralized reactive state (`$effect`, `$derived`).

## 🏗️ The Five Pillars (System Architecture)

1. **🕰️ Gamemaster (The Executive):** Orchestrates time, logic, and the turn lifecycle.
    - Core: `src/gamemaster/chrono.svelte.js`
2. **🛠️ Artificer (The Body):** Manages the UI kit and building blocks.
    - Core: `src/artificer/` & `src/artificer/state.svelte.js`
3. **🎭 Mesmer (The Senses):** Handles sensory output like visuals (Stable Diffusion), audio (TTS), and themes.
    - Core: `src/mesmer/index.js`
4. **📚 Scholar (The Archivist):** Manages data persistence and truth.
    - Core: `src/scholar/library/echo.js`
5. **🛡️ Warden (The Protector):** Enforces security (DOMPurify) and world physics.
    - Core: `src/warden/`

## 🛠️ Tech Stack & Constraints

- **Framework:** Svelte 5 (Runes exclusively: `$state`, `$derived`, `$effect`, `$props`).
- **Build System:** Vite 6+ targeting a single HTML monolith (`vite-plugin-singlefile`).
- **Styling:** Native SCSS (7-1 Pattern) with Pico.css abstracts. No utility-first CSS.
- **Icons:** Inline SVG only (No external icon fonts).
- **Runtime:** Node 22+ (Build-time).
- **Platform Bridge:** Interacts with Perchance via `window.ai` and `window.rpgLists`.

## ⚡ Development Workflow

### Building and Running

```bash
# Install dependencies
npm install

# Sync MCP tools and project configuration
npm run sync

# Start development server
npm run dev

# Build the Single File Monolith
npm run build

# Run comprehensive validation (lint, test, hygiene)
npm run validate
```

### Key Commands

- `npm run test`: Runs unit (Vitest) and E2E (Playwright) tests.
- `npm run lint`: Checks JS, CSS, and HTML integrity.
- `npm run sync`: Essential for updating MCP tool configurations and libraries.
- `npm run hygiene`: Performs repository cleanup and consistency checks.

## 📜 Development Conventions

1. **Svelte 5 Native:** Never use Svelte 4 stores (`writable`) or legacy props (`export let`). Use Runes.
2. **Universal Reactivity:** Global state must reside in `.svelte.js` modules, not inside UI components.
3. **Security First:** All dynamic HTML (`@html`) **MUST** be sanitized via `DOMPurify.sanitize()`.
4. **Local-First:** Core functionality must work offline. No external HTTP requests for basic logic.
5. **Clean Architecture:** Logic belongs in Gamemaster/Warden/Scholar; UI belongs in Artificer/Mesmer. No direct DOM manipulation.

## 🗺️ Context Map

- **Governing Laws:** `AGENTS.md`
- **Architecture Deep-Dive:** `.agent/rules/architecture.md`
- **Tech Stack Rules:** `.agent/rules/tech-stack.md`
- **Security Protocols:** `.agent/rules/security.md`
- **Knowledge Base:** `.agent/knowledge/`
