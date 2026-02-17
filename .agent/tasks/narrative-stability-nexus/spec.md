# Spec: Narrative Stability Nexus (Slug: `narrative-stability-nexus`)

> **Goal:** Anchor the narrative state and stabilize system persistence while maintaining the permissive, adult-oriented tone of the simulation.

## 1. Context & Rationale

The current prompt engine (`broker.js`) is "leaky"—it provides raw character/world data but lacks a structural anchor to prevent the LLM from drifting into incoherence or repetitive loops. Additionally, a critical crash in `saveSettings` prevents users from persisting their configuration.

## 2. Acceptance Criteria

- [ ] **Chrono Layer**: The prompt includes a `[CHRONO_LAYER]` that summarizes the current plot-point/tension to prevent drifting.
- [ ] **State Integrity**: The `saveSettings` crash is resolved, and settings correctly persist to `Dexie.js`.
- [ ] **Tiered Memory**: Implement a tiered L1 (Snapshot) and L2 (Echo) buffer system to keep prompt history lean.
- [ ] **Semantic Prioritization**: Implement JS-driven trait condensation and lexical filtering to prioritize relevant traits without AI overhead.
- [ ] **Zero Logic Loss**: All existing character lore and fractal data is preserved and optimized.

## 3. Technical Constraints

- Must use Svelte 5 Runes ($state, $derived, $effect).
- Must adhere to the "Physics" rules in `03-physics.md`.
- No hardcoded strings for narrative beats; they must be dynamic based on simulation state.
- **Security**: No AI Decision-making for prompt assembly; Logic must be JS-controlled.

## 4. Proposed Architecture

### 4.1 Intelligence Layer (`broker.js`)

- **CHRONO_LAYER**: Dynamic objective injection from `plot.active` threads.
- **ENTITY_LAYER**: Weighted injection with JS Lexical Filtering (Prioritize matching keywords).
- **Snapshot Manager**: L1 cache of the last 2-3 narrative beats.

### 4.2 State & UI

- **Lexical Stability**: Fix the context binding in `saveSettings` using arrow function handlers in `ControlPanel.svelte`.
- **NarrativeDirector**: New controller in `Engine.js` to manage plot thread transitions and chronological stepping.
