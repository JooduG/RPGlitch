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

- **Forge**: Silently upgrade legacy Svelte 4 reactivity on sight.

### 2. Perchance Runtime Compliance

- **Two-Panel Paradigm**: Logic must operate within the Perchance code-panel vs. output-panel architecture.
- **JIT Compilation**: Use browser-native Svelte 5 compiler for dynamic narrative templates.
- **ESM/CDN Imports**: Exclusively use `esm.sh` for external dependencies to ensure cross-iframe compatibility and bypass the lack of a Node.js backend.

### 3. The Chalk Regime (Visual Constitution)

- **No Hallucinated Colors**: Use ONLY CSS variables from `src/theme/tokens.css` (e.g., `var(--color-chalk)`).
- **Enforcement**: Adhere strictly to the [.agent/rules/03-infrastructure.md](.agent/rules/03-infrastructure.md) visual protocols. Generic hex codes are prohibited.

### 4. Tooling & Execution / A-C-M-Q

- **Pipeline**: Enforce the **A-C-M-Q** loop (Ambiguity -> Complexity -> Meridian -> Quality) as defined in [.agent/rules/04-intelligence.md](.agent/rules/04-intelligence.md).
- **Initialization**: Always use `bash setup.sh` for one-click VM boot sequences.
- **Verification**: Utilize `npm run verify` as the primary quality gate.

### 5. Subject-Matter Sovereignty

- **Mandate**: Group all logic, physics, and state-management into unified, sovereign files.
- **Enforcement**: Map all functional domains to the **Sovereign Skills** (`warden`, `agent-manager`, `gatekeeper`, `simulation`, `data`) for authoritative oversight.

---

## 🚦 Operational Commands

| Command                                             | Purpose                              |
| :-------------------------------------------------- | :----------------------------------- |
| [/00-boot](./.agent/workflows/00-boot.md)           | Fresh initialization & Context Sync. |
| [/01-blueprint](./.agent/workflows/01-blueprint.md) | A-C-M-Q Intent Routing & Planning.   |
| [/02-build](./.agent/workflows/02-build.md)         | Implementation Loop.                 |
| [/03-clean](./.agent/workflows/03-clean.md)         | Maintenance & Bugs.                  |
| [/04-review](./.agent/workflows/04-review.md)       | Quality Gate & Triage.               |
| [/05-deploy](./.agent/workflows/05-deploy.md)       | Solo Deployment.                     |
| [/06-continue](./.agent/workflows/06-continue.md)   | Resume without Boot (The Handoff).   |
| [/07-fleet](./.agent/workflows/07-fleet.md)         | Fleet Orchestration.                 |
| [/08-github](./.agent/workflows/08-github.md)       | Local GitHub Ops.                    |
| [/99-rewind](./.agent/workflows/99-rewind.md)       | Emergency Reset.                     |

---

## 🛡️ Persistence & The Handoff Law

Agents are **strictly prohibited** from terminating a session or clocking out without executing the Paperwork Routine. You must update the `.agent/state/` shard:

1. **Summarize Deltas**: Append a summary of changes to `.agent/state/tracks.md`.
2. **Update Backlog**: Move completed items from WIP to DONE in `.agent/state/backlog.md`.
3. **Pass the Baton**: Load high-context instructions for the next agent into `.agent/state/next-prompt.md`.

_Payload processed. Standard established._
