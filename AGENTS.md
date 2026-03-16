# 🤖 AGENTS.md: Technical Standards for Autonomous Engineering

This document defines the RPGlitch technical stack and engineering mandates for all autonomous agents (Jules, Gemini, etc.).

---

## 🏗️ The Tech Stack

- **Framework**: Svelte 5 (Strict **Runes Only**).

- **Build Tool**: Vite + `vite-plugin-singlefile`.

- **Primary Deployment Target**: **Perchance** (Single-file Reactive Monolith).

- **State Management**: Reactive Svelte 5 Runes (`$state`, `$derived`, `$effect`).

- **Persistence**: Dexie.js (IndexedDB).

- **Styling**: Vanilla CSS (The **Chalk Regime** tokens).

---

## ⚡ Engineering Mandates (The Law)

### 1. Svelte 5 Sovereignty

- **Forbidden**: `export let`, `$:`, `writable()`, `readable()`.
- **Mandate**: Use Svelte 5 Runes exclusively.
- **Refactoring**: Silently upgrade legacy reactivity on sight.

### 2. Perchance Runtime Compliance

- **Two-Panel Paradigm**: Logic must operate within the Perchance code-panel vs. output-panel architecture.
- **JIT Compilation**: Use browser-native Svelte 5 compiler for dynamic narrative templates.
- **ESM/CDN Imports**: Prefer `esm.sh` for external dependencies to ensure cross-iframe compatibility and minimal bundle weight.

### 3. The Chalk Regime

- **No Hallucinated Colors**: Use ONLY CSS variables from `src/theme/tokens.css`.
- **High-Fidelity**: Prioritize Nord-themed, high-contrast, atmospheric UI.

---

## 🚦 Operational Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start Vite dev server. |
| `npm run build` | Generate production `index.html`. |
| `npm run verify` | Full quality audit (Check + Lint + Test). |
| `npm run test` | Execute unit tests. |
| `npm run deploy` | Full build and automated deployment. |

---

## 🛡️ Persistence & Handoff

Agents are **prohibited** from terminating a session without:

1. Updating `.agent/state/global.md`.
2. Syncing checkpoint deltas in `tracks.md`.
3. Loading the next agent's payload into `next-prompt.md`.

*Payload processed. Standard established.*
