# 🌌 RPGlitch: GEMINI.md

> **Vision:** A local-first, genre-agnostic RPG engine where state drives reality and narrative is forged through recursive intelligence.

---

## 🏗️ Project Overview

RPGlitch is a **Local-First Reactive Monolith** designed for immersive storytelling. It bridges creative prose and mechanical truth through a triad of layers:

- **The Spec (Blueprint):** Deep lore and character archetypes.
- **The State (Live):** Reactive Svelte 5 Runes mirroring reality.
- **The Echo (History):** Persistent logs in IndexedDB (via Dexie.js).

The project targets **Perchance** as its primary deployment platform, requiring a self-contained single `index.html` bundle.

---

## 🛠️ Technical Stack

- **Framework:** Svelte 5 (Runes-only: `$state`, `$derived`, `$effect`).
- **Build Tool:** Vite (with `vite-plugin-singlefile` for Perchance).
- **Persistence:** Dexie.js (IndexedDB).
- **Styling:** Vanilla CSS with **Chalk Regime** design tokens.
- **Intelligence:** Logic-driven prompts with Sino-Logic internal processing.
- **Testing:** Vitest (Unit) and Playwright (E2E).

---

## 🚦 Key Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start local development server (Vite). |
| `npm run build` | Build the project for production. |
| `npm run verify` | Run full suite: Svelte-check, linting, and unit tests. |
| `npm run test` | Run unit tests and security audit. |
| `npm run deploy` | Full pipeline: Verify, build, and deploy to Perchance. |
| `npm run deploy:perchance` | Automated deployment via Playwright script. |
| `npm run format` | Format codebase using Prettier. |

---

## 📜 Development Conventions

### 1. ⚡ Svelte 5 Supremacy

- **Mandate:** All new code **must** use Svelte 5 Runes.
- **Forbidden:** `export let`, `$:`, `writable/readable` stores.
- **Pattern:** Use `$state` for reactive variables and `$derived` for computed logic. Silently refactor legacy code on sight.

### 2. 🎨 The Chalk Regime (Visuals)

- **Constraint:** Use **only** CSS variables defined in `src/theme/tokens.css`.
- **Forbidden:** Hardcoded hex codes or RGB values in `.svelte` or `.css` files.
- **Aesthetic:** High-contrast, atmospheric, and diegetic "Chalk" UI.

### 3. 🛡️ Perchance Constraints

- **Self-Contained:** The build must result in a single `index.html`.
- **Runtime:** No Node.js modules are available at runtime. All logic must be browser-compatible.

### 4. 🧠 Sino-Logic (Intelligence)

- **Convention:** For complex reasoning or "Intelligence Kernel" tasks, the agent may use **Concise Technical Chinese (zh-CN)** within `<think>` blocks.
- **Output:** All narrative, UI text, and final responses **must** be in English.

### 5. 🧱 Skill-Based Architecture

- Logic is organized into modular "skills" within `.agent/skills/`.
- Cross-cutting concerns (Audio, Data, Svelte, Security) should be handled by their respective skill logic.

---

## 📂 Directory Map

- `.agent/`: Project-specific intelligence, rules, and automation skills.
- `src/core/`: Core engine logic (Intelligence, Security).
- `src/data/`: Database (Dexie), entity premades, and repositories.
- `src/state/`: Global Svelte 5 app state and reactive stores.
- `src/theme/`: Design tokens, global styles, and palettes.
- `src/ui/`: Atomic design components (Atoms, Molecules, Organisms).

---

## 📝 Ongoing Tasks (Tracks)

Refer to `.agent/tasks/` for active development tracks:

- `intelligence-kernel.md`: ContextBroker and PromptBuilder refinement.
- `ui-refactor.md`: Migration of legacy components to Svelte 5.
