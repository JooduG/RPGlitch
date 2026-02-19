# Plan: Narrative Stability Nexus (`narrative-stability-nexus`)

## Phase 1: Stability (State & Logic)

1. **[Core]** Fix `this` binding in `AppStore.saveSettings` in `app.svelte.js`.
2. **[UI]** Update `ControlPanel.svelte` toggles to use explicit arrow function calls `onchange={() => app.saveSettings()}`.
3. **[Intelligence]** Scaffold `NarrativeDirector` in `Engine.js` to manage turn-over logic and thread updates.

- [x] **[TEST]** Verify `EVENTS.MEMORY_PRESSURE_CHECK` triggers `NarrativeDirector.consolidate()`
- [x] **[TEST]** Verify `broker.test.js` passes with new Context/Prompt logic and thread updates.

## Phase 2: Narrative Anchor (Prompt Engineering) [DONE]

1. [x] **[Intelligence]** Implement `[CHRONO_LAYER]` in `broker.js`.
2. [x] **[Intelligence]** Implement `ENTITY_LAYER` refactor with "Punchy Transformer" (Trait condensation) and "Lexical Filter" (Keyword matching).
3. [x] **[Intelligence]** Implement L1 Narrative Snapshot (2-sentence carry-over).

## Phase 3: Memory Consolidation [DONE]

1. [x] **[Data]** Wire `Echo.memorize()` into the Turn Loop (every 10 turns).
2. [x] **[Memory]** Implement message eviction logic to keep the prompt buffer slim.
3. [x] **[Verification]** Create `tests/logic/broker.test.js` to verify prompt assembly structure.

## Phase 4: Final Audit [DONE]

1. [x] **[Audit]** Hygiene Scan for console logs.
2. [x] **[Walkthrough]** Document the new Narrative Nexus in `walkthrough.md`.
