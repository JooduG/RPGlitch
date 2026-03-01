# Plan: Event Bus Purge

## Phase 1: Preparation (State Refectoring)

- [ ] **[MODIFY] runtime.svelte.js**
    - [ ] Remove `events` and `EVENTS` imports.
    - [ ] Remove `_initListeners()`.
    - [ ] Add `updateEntity(id, updates)` method for direct mutation.
- [ ] **[MODIFY] messages.svelte.js**
    - [ ] Remove `events` and `EVENTS` imports.
    - [ ] Remove `_initListeners()`.
    - [ ] Add `refresh()` method (async) to load messages from `Session`.
- [ ] **[MODIFY] session.svelte.js**
    - [ ] Remove `events` and `EVENTS` imports.
    - [ ] Replace bus listeners for `GENERATION_*` with direct updates to `engineState` (if not already handled).

## Phase 2: Engine & Data Refactoring

- [ ] **[MODIFY] session-driver.js**
    - [ ] Remove `applyPatch`, `events`, `EVENTS` imports.
    - [ ] Replace `applyPatch` calls with direct mutations (e.g., `app.story.byId[id] = ...`).
    - [ ] Replace `events.dispatchEvent` for `CHAT_REFRESH` with `messages.refresh()`.
- [ ] **[MODIFY] engine.js**
    - [ ] Remove `events`, `EVENTS` imports.
    - [ ] Replace `dispatchEvent` calls with direct store mutations or method calls.
- [ ] **[MODIFY] bootstrap.js**
    - [ ] Remove bus initialization and listeners.
    - [ ] Ensure `AppBootstrap` triggers initial hydration directly into `runtime` and `app`.

## Phase 3: Cleanup & Deletion

- [ ] **[DELETE] src/core/engine/bus.svelte.js**
- [ ] Global search for any remaining imports and purge them.

## Phase 4: Verification

- [ ] Run `npm test` for the state and engine layers.
- [ ] Manual E2E flow: Start story -> Send message -> Verify UI updates during and after generation.
