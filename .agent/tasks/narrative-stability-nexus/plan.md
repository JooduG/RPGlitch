# Plan: Narrative Stability Nexus (`narrative-stability-nexus`)

## Phase 1: Stability (State & Logic)

1. **[Core]** Fix `this` binding in `AppStore.saveSettings` in `app.svelte.js`.
2. **[UI]** Update `ControlPanel.svelte` toggles to use explicit arrow function calls `onchange={() => app.saveSettings()}`.
3. **[Intelligence]** Scaffold `NarrativeDirector` in `Engine.js` to manage turn-over logic and thread updates.

## Phase 2: Narrative Anchor (Prompt Engineering)

1. **[Intelligence]** Implement `[CHRONO_LAYER]` in `broker.js`.
2. **[Intelligence]** Implement `ENTITY_LAYER` refactor with "Punchy Transformer" (Trait condensation) and "Lexical Filter" (Keyword matching).
3. **[Intelligence]** Implement L1 Narrative Snapshot (2-sentence carry-over).

## Phase 3: Memory Consolidation

1. **[Data]** Wire `Echo.memorize()` into the Turn Loop (every 10 turns).
2. **[Memory]** Implement message eviction logic to keep the prompt buffer slim.
3. **[Verification]** Create `tests/logic/broker.test.js` to verify prompt assembly structure.

## Phase 4: Final Audit

1. **[Audit]** Hygiene Scan for console logs.
2. **[Walkthrough]** Document the new Narrative Nexus in `walkthrough.md`.
