# Engine (`src/engine/`)

## Overview

`src/engine/` is the Rank 4 orchestration layer for RPGlitch. It connects the reactive stores (`@state`) and media services (`@media`) to Perchance's LLM plugin (`window.generate_text`), while keeping prompt compilation and dynamics math in `@simulation` (Rank 1).

Internally, the five modules form a one-way dependency chain:

1. [`transport.js`](./transport.js): Perchance plugin discovery, local mock fallback, priority-gated streaming, and abort detection.
2. [`steps.js`](./steps.js): Stateless LLM step executors with injected `transport` and zero `@state` imports.
3. [`turns.js`](./turns.js): Stateful turn execution, transient quadrant cloning, dynamics stepping, database persistence, image triggers, and background Caretaker consolidation.
4. [`lifecycle.js`](./lifecycle.js): Non-turn jobs for visual prompt refinement, profile structuring, prologue/epilogue beats, entity creation, and user draft ghostwriting.
5. [`chrono.svelte.js`](./chrono.svelte.js): Reactive session facade (`ChronoEngine` / `chrono_engine`) that owns the stream lock, abort rollback, and single-attempt orphan recovery.

## Interface (`index.js`)

External callers (`@ui`) import only from [`index.js`](./index.js). Internal helpers in [`steps.js`](./steps.js) and [`turns.js`](./turns.js) are imported directly by engine siblings, `sim-check.js`, and colocated unit tests.

- **Session Facade** ([`chrono.svelte.js`](./chrono.svelte.js)): `chrono_engine` (`start(selection)`, `send(text)`, `retry()`, `continue(target_id)`, `advance_turn(input, options)`, `stop()`).
- **Lifecycle Jobs** ([`lifecycle.js`](./lifecycle.js)): `refine_image_prompt`, `parse_entity_profile`, `generate_closing`, `create_entity_with_profile`, `generate_user_draft`, `capture_story_image`, `generate_image_candidates`, `import_entities`, `run_mock`.
- **Transport** ([`transport.js`](./transport.js)): `get_transport`.
- **Watchdog** ([`watchdog.js`](./watchdog.js)): `install_freeze_watchdog`.

## Internal Modules

- **Stateless Steps** ([`steps.js`](./steps.js)): `run_planner_step`, `run_generation_step`, `continue_generation_step`, `run_memory_consolidation_step`, `run_image_prompt_step`, `run_schema_extraction_step`, `run_round`, `resolve_continuation_separator`.
- **Stateful Turns** ([`turns.js`](./turns.js)): `run_turn`, `continue_turn`, `write_back_turn_state`, `dispatch_consolidation`, `maybe_spawn_turn_image`, `reset_turn_scope`.
- **Lifecycle & Transport Helpers**: `generate_opening` ([`lifecycle.js`](./lifecycle.js)), `is_abort_error`, `create_live_stream_fn`, `reset_transport`, `get_mock_message` ([`transport.js`](./transport.js)), `uninstall_freeze_watchdog` ([`watchdog.js`](./watchdog.js)).

## Invariants

- **In-Folder Relative Imports**: Modules inside `src/engine/` import siblings via relative paths (`./steps.js`, `./turns.js`, `./transport.js`, `./lifecycle.js`) and never through `@engine`.
- **Zero `@state` in `steps.js`**: Every step in [`steps.js`](./steps.js) receives `transport`, `entities`, and `history` explicitly so prompt and parsing logic stays testable without store setup.
- **Single-Flight Priority Gate**: [`transport.js`](./transport.js) runs one LLM job at a time via `enqueue_llm_job` (`@utils`). Foreground turns preempt active background jobs and wire `generation.stop()` before the first `await`.
- **Transient Quadrant Copies**: [`turns.js`](./turns.js) clones active entities via `normalize_entity` while preserving `dynamics_baseline` for gravity settling, then writes back dynamics and persists once on success. On failure or abort, `session.round` rolls back and live stores stay untouched.
- **Orphan Recovery**: [`chrono.svelte.js`](./chrono.svelte.js) purges trailing aborted user messages on user cancellation and retries at most once (`_orphan_retry_in_flight`) when a non-abort error leaves a user message without a reply.

## Side Effects

- **IndexedDB Writes**: [`turns.js`](./turns.js), [`lifecycle.js`](./lifecycle.js), and [`chrono.svelte.js`](./chrono.svelte.js) persist stories, entities, and log rows through `@state` (`session`) and `@data` (`db.simulation_log`, `upsert_entity`, `update_cast`, `update_entity`).
- **External Plugins & Media**: [`transport.js`](./transport.js) calls `window.generate_text` via `resolve_perchance_plugin`; [`turns.js`](./turns.js) dispatches non-blocking `spawn_image_beat` calls and `Audio.play("notification")`; [`lifecycle.js`](./lifecycle.js) triggers prologue scene and character portrait generation through `visual_engine`.

## Verification

- `npm test` (or `npx vitest run src/engine/`)
- `npm run audit:simulation`
