# Plan: Event Bus Purge

## Phase 1: Preparation (State Refectoring)

- [x] **[MODIFY] runtime.svelte.js**
    - [x] Remove `events` and `EVENTS` imports.
    - [x] Remove `_initListeners()`.
    - [x] Add `updateEntity(id, updates)` method for direct mutation.
- [x] **[MODIFY] messages.svelte.js**
    - [x] Remove `events` and `EVENTS` imports.
    - [x] Remove `_initListeners()`.
    - [x] Add `refresh()` method (async) to load messages from `Session`.
- [x] **[MODIFY] session.svelte.js**
    - [x] Remove `events` and `EVENTS` imports.
    - [x] Replace bus listeners for `GENERATION_*` with direct updates to `engineState` (if not already handled).

## Phase 2: Engine & Data Refactoring

- [x] **[MODIFY] session-driver.js**
    - [x] Remove `applyPatch`, `events`, `EVENTS` imports.
    - [x] Replace `applyPatch` calls with direct mutations (e.g., `app.story.byId[id] = ...`).
    - [x] Replace `events.dispatchEvent` for `CHAT_REFRESH` with `messages.refresh()`.
- [x] **[MODIFY] engine.js**
    - [x] Remove `events`, `EVENTS` imports.
    - [x] Replace `dispatchEvent` calls with direct store mutations or method calls.
- [x] **[MODIFY] bootstrap.js**
    - [x] Remove bus initialization and listeners.
    - [x] Ensure `AppBootstrap` triggers initial hydration directly into `runtime` and `app`.

## Phase 3: Cleanup & Deletion

- [x] **[DELETE] src/core/engine/bus.svelte.js**
- [x] Global search for any remaining imports and purge them.

## Phase 4: Verification

- [x] Run `npm test` for the state and engine layers.
- [x] Manual E2E flow: Start story -> Send message -> Verify UI updates during and after generation.
