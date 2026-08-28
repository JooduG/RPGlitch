# 🎯 Active Track Implementation Plan: Intelligence & Prompts Seam Hardening

**Track ID**: `track-intelligence-and-prompts-hardening-2026-08-28`  
**Dependencies**: `tasks/PRESENT.md`  
**Status**: `[~]` In Progress

---

## 1. Goal & Architectural Overview

Eliminate runtime bugs and seams across `src/intelligence/` and `src/intelligence/prompts/`:

1. **Fractal Dynamics Channel**: Add `fractal_dynamics_deltas` (`velocity`, `entropy`) to the Director schema and apply them to `snapshot.fractal.dynamics` so entropy visual tier triggers can fire.
2. **Telemetry Mutation Envelope**: Standardize the mutation object shape between `story-pipeline.js` and `telemetry.js:build_update_entry` so `DYNAMICS_DELTA` logs contain rich state mutations.
3. **Structured Genesis Schema**: Add `genesis` (`{ name, description, signature_color, speaking_style }`) to the Director schema and default missing names cleanly to `"Mysterious Stranger"`.
4. **Defensive Edge Cases & Round-1 Guard**: Coerce any non-AI next action to `"AI_CHARACTER"` on round 1; add optional chaining to `state_bridge.simulation_state?.complete()`; clean spatial verb matching in `render_environmental_hint`.
5. **P4 Dead Code & Barrel Pruning**: Prune `execute_genesis`, `apply_state_mutations`, `NEXT_ACTION_VALUES`, and over-exported internal symbols from `src/intelligence/index.js`.
6. **Test Coverage Expansion**: Add dedicated unit test suites for `src/intelligence/payload.test.js` and `src/intelligence/telemetry.test.js`.

---

## 2. Tactical Phases

### Phase 1: Director Prompts & Schema Alignment

- [x] `task-1.1`: Extend `DIRECTOR_PROTOCOLS.SCHEMA` with `fractal_dynamics_deltas` and `genesis` object schema.
- [x] `task-1.2`: Clean up spatial regex matching in `render_environmental_hint`.

### Phase 2: Story Pipeline & Physics Gravity Wiring

- [x] `task-2.1`: Parse and apply `fractal_dynamics_deltas` to `snapshot.fractal.dynamics` and populate `fractal_delta_axes`.
- [x] `task-2.2`: Fix genesis fallback to `"Mysterious Stranger"` and enforce Round-1 AI speaker guard.
- [x] `task-2.3`: Align `final_meta.mutations` envelope for telemetry.

### Phase 3: P4 Dead Code & Barrel Pruning

- [x] `task-3.1`: Prune uncalled helpers (`execute_genesis`, `apply_state_mutations`, `NEXT_ACTION_VALUES`).
- [x] `task-3.2`: Prune internal helpers from `src/intelligence/index.js`.

### Phase 4: Test Coverage (`payload.test.js`, `telemetry.test.js`, `story-pipeline.test.js`)

- [x] `task-4.1`: Create `src/intelligence/payload.test.js`.
- [x] `task-4.2`: Create `src/intelligence/telemetry.test.js`.
- [x] `task-4.3`: Update `story-pipeline.test.js` and run `npm run verify`.
