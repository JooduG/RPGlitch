# 🤖 AGENTS.md: Technical Standards for Autonomous Engineering

This document defines the RPGlitch technical stack and engineering mandates for all autonomous agents (Jules, Gemini, etc.). It is the "Single Source of Truth" for agentic operations.

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
- **Refactoring**: Silently upgrade legacy Svelte 4 reactivity on sight.

### 2. Perchance Runtime Compliance

- **Two-Panel Paradigm**: Logic must operate within the Perchance code-panel vs. output-panel architecture.
- **JIT Compilation**: Use browser-native Svelte 5 compiler for dynamic narrative templates.
- **ESM/CDN Imports**: Exclusively use `esm.sh` for external dependencies to ensure cross-iframe compatibility and bypass the lack of a Node.js backend.

### 3. The Chalk Regime (Visual Constitution)

- **No Hallucinated Colors**: Use ONLY CSS variables from `src/theme/tokens.css` (e.g., `var(--color-chalk)`).
- **Enforcement**: Adhere strictly to the [.agent/rules/03-technetium.md](.agent/rules/03-technetium.md) visual protocols. Generic hex codes are prohibited.

### 4. Tooling & Execution

- **Initialization**: Always use `bash setup.sh` for one-click VM boot sequences. Do NOT use `npm run dev` in setup scripts as it blocks environment snapshotting.
- **Standard Commands**: Utilize `npm run build` and `npm run test` for validation.

### 5. Governance & Narrative Architecture

- **ANEX_BLACKTIDE Protocol**: Respect the narrative hierarchy (L1_ABSOLUTE > L2_CRITICAL). Never narrate for the user or break third-person integrity.
- **Mandate**: All autonomous operations MUST adhere to the protocol defined in [.agent/policy.toml](./.agent/policy.toml).

---

## 🚦 Operational Commands

| Command | Purpose |
| :--- | :--- |
| [/00-boot](./.agent/workflows/00-boot.md) | Fresh initialization & Context Sync. |
| [/01-plan](./.agent/workflows/01-plan.md) | Unified Scoping & Design. |
| [/02-build](./.agent/workflows/02-build.md) | Implementation Loop. |
| [/03-clean](./.agent/workflows/03-clean.md) | Maintenance & Bugs. |
| [/04-review](./.agent/workflows/04-review.md) | Quality Gate & Triage. |
| [/05-deploy](./.agent/workflows/05-deploy.md) | Solo Deployment. |
| [/06-continue](./.agent/workflows/06-continue.md) | Resume without Boot (The Handoff). |
| [/07-fleet](./.agent/workflows/07-fleet.md) | Fleet Orchestration. |
| [/08-github](./.agent/workflows/08-github.md) | Local GitHub Ops. |
| [/99-rewind](./.agent/workflows/99-rewind.md) | Emergency Reset. |

---

## 🛡️ Persistence & The Handoff Law

Agents are **strictly prohibited** from terminating a session or clocking out without executing the Paperwork Routine. You must update the `.agent/state/` shard:

1. **Summarize Deltas**: Append a summary of changes to `.agent/state/tracks.md`.
2. **Update Backlog**: Move completed items from WIP to DONE in `.agent/state/backlog.md`.
3. **Pass the Baton**: Load high-context instructions for the next agent into `.agent/state/next-prompt.md`.

*Payload processed. Standard established.*
