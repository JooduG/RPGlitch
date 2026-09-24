---
name: track-state-and-ui-runes-harmonization
description: Harmonizing state layer and UI controllers to Svelte 5 class-based Runes stores, starting with runtime.svelte.js
status: active
last_synchronized: 2026-09-24
references: src/state/runtime.svelte.js, src/ui/Storyboard.svelte.js
---

# 🎯 Track: State & UI Runes Harmonization (Svelte 5 Class Stores)

## 1.0 Vision & High-Level Architecture

Harmonize the RPGlitch state architecture by migrating legacy closure-based stores to idiomatic Svelte 5 class-based Runes stores.

Currently:

- `src/state/interface.svelte.js` uses `class InterfaceStore` with `$state` fields.
- `src/state/log.svelte.js` uses `class SimulationLogStore` with `$state` fields and `SvelteSet`.
- `src/state/status.svelte.js` uses `class SimulationStateStore` with private runes.
- `src/media/audio.svelte.js` uses `class VoiceEngine` with `$state` fields.
- **However**, `src/state/runtime.svelte.js` still uses an older factory function `create_runtime_store()` with separate local `$state(...)` variables and over 40 manual getter/setter pairs returning a plain API object.

### 1.1 Goals

1. **Refactor `src/state/runtime.svelte.js` to `class RuntimeEngineStore`**:
   - Modernize all reactive properties into direct `$state` class fields.
   - Maintain 100% downward API compatibility (`runtime.character`, `runtime.active_user`, `runtime.sync()`, `runtime.save()`, etc.).
   - Use `$derived` or getter properties for dynamic calculations (`snapshot_entities`, `snapshot_npcs`, `director_p50_ms`, `director_p95_ms`).
   - Cleanly encapsulate lifecycle effects (`#runtime_cleanup`, `init_effects()`, `teardown_effects()`).
2. **Harmonize `src/ui/Storyboard.svelte.js` (Phase 2)**:
   - Convert plain module-level let bindings (`shuffle_active`, `begin_flight_started`) into reactive `$state` fields on an exported controller.
   - Allow UI components to reactively bind to shuffle and animation states.

---

## 2.0 Technical Architecture & Class Design

```mermaid
classDiagram
    class RuntimeEngineStore {
        +SimulationEntity character
        +SimulationEntity active_user
        +SimulationEntity active_ai
        +SimulationEntity active_fractal
        +Record active_npcs
        +string[] in_scene_npc_ids
        +string streaming_entity_id
        +boolean is_ready
        +string story_id
        +Record story
        +number round
        +string turn_type
        +EntityDynamics ai_physics
        +EntityDynamics fractal_physics
        +number last_director_beat_round
        +number last_dynamics_beat_round
        +number last_director_ms
        +number[] director_ms_pool
        +boolean is_foreground_generating
        +boolean is_background_generating
        +init_effects() void
        +teardown_effects() void
        +sync(story_id) Promise
        +restore_story_title() void
        +save(round) Promise
        +save_entity(type, entity) Promise
        +update_entity(type, id, data) Promise
        +delete_entity(type, id) Promise
        +record_director_latency(ms) void
        +acquire_foreground_generation() void
        +release_foreground_generation() void
        +acquire_background_generation() void
        +release_background_generation() void
        +can_start_background_generation() boolean
        +_debug_inject(mock_data) void
    }
```

---

## 3.0 Implementation Playbook

### Phase 1: Blueprint & Baseline Verification (RED/AUDIT)

- [x] `task-1.1`: Audit all methods, properties, and getters in `src/state/runtime.svelte.js` and verify against `src/state/runtime.test.js`.
- [x] `task-1.2`: Run existing test suite (`src/state/runtime.test.js`) to establish green baseline.

### Phase 2: RuntimeEngineStore Class Migration (GREEN)

- [x] `task-2.1`: Refactor `create_runtime_store()` into `export class RuntimeEngineStore` inside `src/state/runtime.svelte.js`.
- [x] `task-2.2`: Bind singleton instance `export const runtime = new RuntimeEngineStore();` and wire `window.runtime = runtime`.
- [x] `task-2.3`: Execute `svelte-autofixer` via MCP tool on `src/state/runtime.svelte.js` ensuring 0 compilation errors or rune warnings.
- [x] `task-2.4`: Run `src/state/runtime.test.js` and related state tests (`log.test.js`, `status.test.js`, `interface.test.js`, `chrono.test.js`).

### Phase 3: Full Integration & Downstream Verification

- [x] `task-3.1`: Verify all downstream consumers (`main.js`, `story.js`, `sessions.svelte.js`, `TelemetryCard.svelte`, etc.) interface seamlessly with the new class store.
- [x] `task-3.2`: Run full test suite (`npm run test:unit`) across all 61 test files (1,114 tests) to guarantee zero regressions.

<!-- CHANGELOG
  - 2026-09-24: Initialized track file for State & UI Runes Harmonization, migrating runtime.svelte.js from closure factory to modern Svelte 5 class-based Runes store.
-->
