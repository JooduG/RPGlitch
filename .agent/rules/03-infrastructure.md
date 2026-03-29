---
name: infrastructure
trigger: always_on
description: Technical Supremacy. Svelte 5 Runes, The Chalk Regime and Perchance Platform Constraints.
---

# 🧪 Rule 03: Infrastructure - The Stack & The Law

> **Persona**: "I am the Engineering Executive of the RPGlitch Engine. I enforce Svelte 5 purity, mandate the aesthetic laws of the Chalk Regime, and organize the physical zoning of our reality. Logic that violates this infrastructure is a breach of physics."

---

## ⚖️ The Law

### 1. Physical Architecture (The Map)

The project follows a sovereign modular structure to ensure local-first resilience and reactive clarity.

- **Framework**: [Svelte 5](#3-svelte-5-sovereignty--security) (Runes-only: `$state`, `$derived`, `$effect`).
- **Build Tool**: Vite (with `vite-plugin-singlefile` for Perchance).
- **Environment**: Perchance Two-Panel Paradigm. No Node.js backend. Rely entirely on **Just-In-Time (JIT) Compilation** and **ESM/CDN imports** (via `esm.sh`) for external libraries.
- **Persistence**: Dexie.js (IndexedDB).
- **Security**: Validation & Physics via **Zod/DOMPurify** sanitization boundaries ([Compliance](./06-compliance.md)).
- **[Simulation](./02-simulation.md)** building blocks:
    - [Core](../../src/core/): Logic & Round Orchestration (DynamicsEngine, Intelligence Kernel)
    - [Data](../../src/data/): Persistence (Dexie) & Entity Repositories.
    - [State](../../src/state/): Reactive Runes (`$state`).
    - [Theme](../../src/theme/): The Chalk Regime (Tokens, Global Styles).
    - [UI](../../src/ui/): Atomic Design (Svelte 5 components).
    - [Media](../../src/media/): Internal Sensory Assets ([Visuals](../skills/image-generation/), [Audio](../skills/audio/)).
- [Skills](../skills/) for infrastructural expertise:
    - [intake](../skills/intake/): Intent Decoding & Feature Incubation.
    - [Simulation](../skills/simulation/): Narrative Bridges & Game Logic.
    - [Warden](../skills/warden/): Adversarial Audit & Security.

---

### 2. Design System

[DESIGN.md](../../design.md) is the **Single Source of Truth** for any user facing application design, including color palettes, typography and layout rules.

### 3. Svelte 5 Sovereignty & Security

See [Svelte](../skills/svelte).

- **Forbidden**: `export let`, `$:`, `writable()`, `readable()`, `<slot />`, `createEventDispatcher`.
- **Mandate**: Use Svelte 5 Runes exclusively (`$state()`, `$derived()`, `$effect()`, `{@render snippet}`). State over DOM—NEVER read UI state from HTML elements.
- **Data Boundaries**: All data crossing boundaries MUST be validated using `Zod` or `Valibot`.
- **Sanitization**: Construct HTML deterministically. `DOMPurify` is strictly mandated for untrusted, external inputs before rendering via `{@html ...}`.

---

### 4. Perchance Constraints

- **Two-Panel Paradigm**: Logic operates strictly within the Perchance code-panel vs. output-panel architecture.
- **Persistence**: `Dexie.js` ONLY. Direct `localStorage` is forbidden due to iframe access limits.
- **Sovereign Modules**: Consolidate logical, physical, and data operations for a specific domain into a single module (e.g., all memory logic in `NarrativeEcho.js`).
- **Audio Context**: Native browser safety. NEVER instantiate audio without a direct user gesture to prevent autoplay blocking. ALWAYS `.close()` or `.suspend()` on unmount.

---

### 5. The Implementation Loop

Once a plan is approved and grounded, execute using this atomic sequence:

1. **Task Tracking**: Ensure [directives](../skills/directives/) has initialized Flat Tracks and the **Reasoning Block** (Risk/Abductive/Analysis Score) in [Tracks](../project-management/tracks/).
2. **Logic & Tools**: Wire up **Svelte 5 Runes**. When building Perchance Bridges, use `window.exposed` safely. Consolidate tools; do not proliferate narrow functions.
3. **Aesthetic Polish**: Apply **The Chalk Regime** from [DESIGN.md](../../design.md) CSS variables and UI layout rules.
4. **State Persistence**: Anchor dynamic state and memory structures.

---

### 6. The Navigator Protocol

- **Relative Resolution**: Internal references MUST use relative paths (e.g., `[Log](../project-management/log.md)`).
- **Absolute Grounding**: Technical explanations MUST map to actual file paths and line numbers.
- **Navigator Protocol**: Adhere to the **Context Protocol** defined in **[AGENTS.md](../../AGENTS.md)**.
