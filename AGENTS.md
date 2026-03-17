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

### 4. The Navigator Protocol

- **Mandate**: All internal documentation MUST follow the [.agent/rules/03-technetium.md](.agent/rules/03-technetium.md) standards.
- **Interactivity**: Every state reference and skill invocation MUST be clickable.

---

## 🚦 Operational Commands

| Command | Purpose |
| :--- | :--- |
| [/00-boot](./.agent/workflows/00-boot.md) | Fresh initialization. |
| [/01-plan](./.agent/workflows/01-plan.md) | Unified Scoping & Design. |
| [/02-build](./.agent/workflows/02-build.md) | Implementation Loop. |
| [/03-clean](./.agent/workflows/03-clean.md) | Maintenance & Bugs. |
| [/04-review](./.agent/workflows/04-review.md) | Quality Gate & Triage. |
| [/05-deploy](./.agent/workflows/05-deploy.md) | Solo Deployment. |
| [/06-continue](./.agent/workflows/06-continue.md) | Resume without Boot. |
| [/07-fleet](./.agent/workflows/07-fleet.md) | Fleet Orchestration. |
| [/08-github](./.agent/workflows/08-github.md) | Local GitHub Ops. |
| [/99-rewind](./.agent/workflows/99-rewind.md) | Emergency Reset. |

---

## 🛡️ Persistence & Handoff

Agents are **prohibited** from terminating a session without:

1. Updating `.agent/state/global.md`.
2. Syncing checkpoint deltas in `.agent/state/tracks.md`.
3. Loading the next agent's payload into `.agent/state/next-prompt.md`.

*Payload processed. Standard established.*
