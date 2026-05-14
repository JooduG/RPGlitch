# 🏛️ Eternal (The Soul)

> **Version**: 1.0.0 (Sovereign)
> **Status**: Grounded / Active

## 1. Objective

RPGlitch is a high-fidelity, local-first simulation engine where **State Drives Reality**. It bridges creative roleplay and mechanical truth through a recursive intelligence kernel.

### Core Vision

- **Atmospheric Canvas**: Minimalist "Chalk Regime" aesthetics focus immersion on imagination.
- **Agentic Pacing**: Autonomous orchestration of narrative beats and state transitions.
- **Local Sovereignty**: Zero-latency, browser-resident memory (Dexie.js).

## 2. Technical Stack

- **Framework**: Svelte 5 (Runes exclusively: `$state`, `$derived`, `$effect`).
- **Persistence**: Dexie.js (IndexedDB) for local-first storage.
- **Build**: Vite 6 (Single-file build for Perchance compatibility).
- **Security**: DOMPurify for boundary sanitization.
- **Aesthetics**: Vanilla CSS (Chalk Regime Token System).
- **Quality**: Vitest (Unit), Playwright (E2E), Warden (Custom Audits).

## 3. Simulation Architecture

The engine follows a strict **Reactive Cycle** (5-Step Loop):

1. **Input**: User/AI interaction submission.
2. **Sanity**: DOMPurify sanitization and boundary validation.
3. **Execution**: Core Engine processes round/turn mutations.
4. **Persistence**: State committed to Dexie.js (The Echo).
5. **Expression**: UI/Sensory feedback via Svelte components.

### Turn Cycle (Chronos)

1. **System Turn**: Synchronous physics and state mutations. UI Locked.
2. **AI Character Turn**: Asynchronous background narrative processing.
3. **User Persona Turn**: Input released for human action.

## 4. Code Style & Logic Laws

- **Svelte Sovereignty**: Runes-only. State over DOM.
- **Lexical Purity**: kebab-case (files), PascalCase (Components), snake_case (logic).
- **Logical Isolation**: Engine logic (IO) must be decoupled from UI expression.
- **Verification Law**: Every logic change requires an accompanying test.

## 5. Boundaries (Forbidden)

- **NO** Svelte 4 legacy logic (`export let`, `$:`, `writable`).
- **NO** raw CSS values (`px`, `#`). Use Token Registry.
- **NO** direct `localStorage` (Use Dexie).
- **NO** unsanitized `{@html}` rendering.

## 6. Maintenance Checklist

- [ ] Periodically audit DESIGN.md for token drift.
- [ ] Review sovereign axioms for evolution.
