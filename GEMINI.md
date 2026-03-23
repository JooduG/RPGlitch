# 🌌 RPGlitch: GEMINI.md (Neural Overrides)

> **Vision:** A local-first, genre-agnostic RPG engine where state drives reality and narrative is forged through recursive intelligence. This file contains the mandatory neural overrides and behavioral guardrails for Gemini-based sub-routines.

---

## 🏗️ Project Overview

RPGlitch is a **Local-First Reactive Monolith** designed for immersive storytelling. It bridges creative prose and mechanical truth through a triad of layers:

- **The Spec (Blueprint):** Deep lore, taxonomies, and character archetypes.
- **The State (Live):** Reactive Svelte 5 Runes mirroring physical and psychological reality.
- **The Echo (History):** Persistent logs in IndexedDB (via Dexie.js) that give context and weight to every decision.

The project targets **Perchance** as its primary deployment platform, requiring a self-contained single `index.html` bundle.

---

## 🛠️ Technical Stack & Environment

- **Framework:** Svelte 5 (Runes-only: `$state`, `$derived`, `$effect`).
- **Build Tool:** Vite (with `vite-plugin-singlefile` for Perchance).
- **Environment (Perchance Two-Panel Paradigm):** No Node.js backend. Rely entirely on **Just-In-Time (JIT) Compilation** and **ESM/CDN imports** (via `esm.sh`) for external libraries.
- **Persistence:** Dexie.js (IndexedDB).
- **Styling:** Vanilla CSS with **Chalk Regime** design variables.

---

## ⚡ Engineering Mandates (Neural Directives)

### 1. Svelte 5 Sovereignty

- **Mandate:** All new code **must** use Svelte 5 Runes.
- **Forbidden:** `export let`, `$:`, `writable()`, `readable()`, and `onMount` (where `$effect` is applicable).
- **Action:** Silently refactor legacy Svelte 4 code to Svelte 5 Runes immediately upon encounter.

### 2. The Specification Protocol (Visual Integrity)

- **Mandate:** All styling must strictly adhere to `.agent/rules/03-specification.md`.
- **Constraint:** Use **only** native CSS variables defined in `src/theme/tokens.css` (e.g., `var(--color-chalk)`).
- **Forbidden:** You are strictly forbidden from hallucinating generic hex codes, RGB values, or arbitrary inline colors.

### 3. ANEX_BLACKTIDE Authority Hierarchy

- **Mandate:** Respect the narrative hierarchy: **L1_ABSOLUTE (User Agency) > L2_CRITICAL (Character/Temporal Truth) > L3_HIGH (Plot/Sensory) > L4_MODERATE (Style)**.
- **Forbidden:** You must **never** utilize narrator-voice, and you must **never** speak, think, or act on behalf of the user. Maintain strict third-person limited integrity for the entities.
- **Diegesis:** Express statistical signals (e.g., trust, sanity, BayesMind data) diegetically through body language or internal logic within `<think>` blocks, never as raw numbers in the narrative output.

### 4. The Handoff Law (Paperwork Routine)

- **Mandate:** You are strictly prohibited from ending a session without executing `.agent/workflows/06-continue.md` (or equivalent paperwork routine) to update the `.agent/state/` shard.

---

## 📂 Directory Map

- `.agent/`: Project-specific intelligence, rules, and automation skills (The Sovereign Core).
- `src/core/`: Core engine logic (Intelligence, Security, BayesMind/DynamicsEngine).
- `src/data/`: Database (Dexie), entity premades, and repositories.
- `src/state/`: Global Svelte 5 app state and reactive stores.
- `src/theme/`: Design tokens, global styles, and palettes (The Chalk Regime).
- `src/ui/`: Atomic design components (Atoms, Molecules, Organisms).

---

## 📝 Ongoing Tasks (Tracks)

Active development and architectural task tracking is dynamically managed via the Antigravity Mission Board.

Please refer to:

- **`.agent/state/global.md`** (The Mission Board / Active State)
- **`.agent/state/tracks.md`** (Session deltas and summaries)
- **`.agent/state/backlog.md`** (WIP and Done status sync)
- **`.agent/state/next-prompt.md`** (High-context instructions for the next agent session)
