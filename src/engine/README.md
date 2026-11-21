# RPGlitch Sovereign Simulation Engine (`src/engine/`)

## Overview

Headless, reactive simulation engine, state runtime, and turn orchestration pipeline for **RPGlitch**. This package encapsulates the 3-turn narrative heartbeat (Director Shot, Character Shot, and Caretaker Round-Robin), prologue/epilogue lifecycle flows, XML prompt envelope compilation, priority-gated LLM transport abstraction, Two-Tier Sieve RAG vector memory, somatic/fractal dynamics math, and Svelte 5 state reactivity.

- **Barrel Entry & Dependency Inversion**: Consumer layers (`src/ui/`, `src/App.svelte`, `src/main.js`) import via [`index.js`](./index.js). On module evaluation, [`index.js`](./index.js) registers [`execute_visualizer_envision`](./lifecycle.js) into `@media` via `set_visualizer_envision_impl` so the media layer never imports `@engine`. (`src/data/` does not import `@engine`.)
- **Cross-Package Delegation**: Reactive state stores live in [`@state`](../state/) (`app`, `execution`, `session`), while bracket/`<think>` parsing lives in `@simulation`.
- **Subdirectories**: None (`src/engine/` is a leaf package).

## Interface

The package exposes its primary public interface via [`index.js`](./index.js), plus relocated simulation helpers in [`dynamics.js`](../simulation/dynamics.js), [`caretaker-compaction-template.md`](../simulation/caretaker-compaction-template.md), and inlined test fixtures in [`runner.test.js`](./runner.test.js).

### 1. Session Lifecycle, Runs & Reactive State

- [`chrono.svelte.js`](./chrono.svelte.js) (barrel):
  - `ChronoEngine`, `chrono_engine`: Reactive session/turn controller (`error` `$state`) exposing `start(selection)`, `send(text)`, `retry()`, `continue(target_id)`, `advance_turn(input, options)`, and `stop()`.
- [`@state`](../state/README.md):
  - `app` ([`interface.svelte.js`](../state/interface.svelte.js)): Interface, navigation, viewport, settings, and storyboard staging store.
  - `execution` ([`execution.svelte.js`](../state/execution.svelte.js)): Simulation execution phase/thinking-stage state machine, streaming buffer/abort handle (`stream`), and freeze watchdog (`install_freeze_watchdog()`, `uninstall_freeze_watchdog()`).
  - `session` ([`session.svelte.js`](../state/session.svelte.js)): Active story session, cast/dynamics (`ai_dynamics`, `fractal_dynamics`), reactive `feed`, and persistence synchronization store.
- [`runner.js`](./runner.js):
  - Barrel: `run_turn(user_input, _options)`, `continue_turn(target_entry, _options)`, `apply_dynamics_step(ai_entity, fractal_entity, deltas)`, `write_back_turn_state({ ai, fractal, user, round, outcome, options })`.
  - Direct module exports: `dispatch_consolidation({ ai, user, fractal, history, round }, transport, signal)`, `reset_turn_scope_for_testing()`.
  - Direct-store turn execution operating on `session` and `execution` using transient normalized quadrant copies, `[5, 95]` dynamics clamping (`apply_dynamics_step`), round rollback on failure (`run_turn`), and background Caretaker consolidation dispatch.
- [`lifecycle.js`](./lifecycle.js) (barrel):
  - `birth_entity_core(type, draft, options)` (profile structuring, DB upsert, genesis ledger entries, story NPC cast registration, and post-save portrait generation via `visual_engine.generate`), `execute_prologue(story_id)`, `execute_epilogue(story_id, conclusion_status)`, `execute_visualizer_envision(text, type, entity, app_style, signal)`, `structure_profile(raw, type, signal)`.

### 2. Turn Orchestration & Dynamics Physics

- [`runner.js`](./runner.js):
  - Barrel: `CARETAKER_ROTATION`, `build_turn_summary(feed, round)`, `calculate_turn_tempo(history)`, `execute_ghostwriter(transport, input_text, signal, on_token, context = {})`, `execute_round(options)`, `execute_turn_1_director(options)`, `execute_turn_2_character(options)`, `execute_turn_2_continue(options)`, `execute_turn_3_caretaker(options)`, `execute_turn_structuring(options)`, `execute_turn_visualizer(options)`, `resolve_caretaker_target(cursor_or_round, entities, use_cursor)`.
  - Direct module exports: `extract_think_and_body(raw, start_with)`, `reconstruct_history_from_feed(feed, cast)`.
- [`dynamics.js`](../simulation/dynamics.js) (moved to `src/simulation/`):
  - `reduce_dynamics(current, baselines, entropy, deltas)`, `apply_dynamics_gravity(dynamics, baselines, active_entropy, base_gravity, skip_axes)`, `extract_entity_dynamics_baselines(entity)`, `compute_dynamics_deltas(target, dynamics, runtime_target)`, `evaluate_subtext_protocols(options)`, `evaluate_dynamics_rules(dynamics, manual_keywords, max_directives)`.

### 3. Prompt Assembly, Structural Verification & Vector RAG

- [`prompts.js`](../simulation/prompts.js):
  - Barrel: `PURPOSE_CORES` (`DIRECTOR`, `CARETAKER`, `CHARACTER`, `VISUALIZER`), `compile_prompt({ core, round, entities, history, memories, task_options })`.
  - Direct module export: `render_thinking_mode({ mode, lens, max_words, pivot_pov })`.
- [`prompts.js`](../simulation/prompts.js) (XML verifier):
  - `extract_tag_sequence(promptText)`, `verify_tag_balance(promptText)`, `verify_system_envelope(promptText)`, `verify_tag_order(promptText, expectedTagOrder)`, `verify_prompt_hygiene(promptText)`, `verify_compiled_prompt(promptText, options)`.
- [`retrieval.js`](../simulation/retrieval.js):
  - Barrel: `cosine_similarity(vecA, vecB)`, `count_text_tokens(text)`, `create_ephemeral_vector_cache()`, `score_and_rank_memories(candidates, queryVector)`, `two_tier_sieve_rag(options)`.
  - Direct module export: `TOTAL_FIELD_FLOORS_CHARACTERS`.
- [`caretaker-compaction-template.md`](../simulation/caretaker-compaction-template.md):
  - Standalone reference summarization/compaction prompt template used for memory batch compression.

### 4. Priority Gate & Streaming Transport

- [`transport.js`](./transport.js) (priority gate):
  - Barrel: `LLM_PRIORITY` (`{ FOREGROUND: 10, BACKGROUND: 1 }`), `run_llm_job(run, priority)`, `resolve_priority(priority_name)`, `get_llm_gate_status()`.
  - Direct module export: `_reset_gate_for_testing()`.
- [`transport.js`](./transport.js):
  - Barrel: `get_transport()`, `get_mock_message()`.
  - Direct module exports: `create_live_stream_fn()`, `reset_transport()`, `generate_text(payload, options)`, `enhance_text(payload)`.

### 5. Test Utilities & Contract Fixtures

- [`runner.test.js`](./runner.test.js) (inlined contract fixtures):
  - `create_contract_fixtures()`: Deterministic entity (`AI`, `USER`, `FRACTAL`, `npc`), dynamics snapshots, and message history fixtures for engine unit test suites.

## Invariants

- **Svelte 5 Purity**: All reactive state in `.svelte.js` modules uses Svelte 5 runes and reactive collections (`$state`, `$effect.root`, `SvelteSet`, with derived state exposed via class getters), and zero legacy Svelte 4 stores (`writable`, `readable`).
- **In-Folder Relative Import Discipline**: All modules in `src/engine/` import internal siblings using local relative paths (`./runner.js`, `./lifecycle.js`, `./transport.js`) rather than self-referential barrel imports via `@engine`.
- **Single-Flight Priority Gate & Preemption**: [`transport.js`](./transport.js) runs at most one LLM job at a time sorted by `(priority DESC, seq ASC)`. Foreground jobs (`LLM_PRIORITY.FOREGROUND = 10`) abort active background jobs (`LLM_PRIORITY.BACKGROUND = 1`) and schedule forced slot release after `TIMING_MS.INTERACTION`.
- **Prompt Envelope & Epistemic Wall**: [`compile_prompt`](../simulation/prompts.js) enforces the 11-block Spatial State Spine opening with `<SYSTEM identity="...">` and closing with `</SYSTEM>`, capping `<RECENT>` at `TEMPO_ROUNDS.STANDARD` rounds and enforcing `see_hidden` visibility (`"all"` for `DIRECTOR`/`CARETAKER`, `"own"` for `CHARACTER`, `"none"` with inventory stripping for `VISUALIZER`). [`verify_system_envelope`](../simulation/prompts.js) validates `<SYSTEM` ... `</SYSTEM>` boundaries and [`verify_prompt_hygiene`](../simulation/prompts.js) rejects empty prompts or unparsed `{{...}}` mustache macros.
- **Quadrant Partitioning & Caretaker Cursor**: [`execute_turn_3_caretaker`](./runner.js) parses `eternal`, `present`, `future`, and `past` quadrants along `CARETAKER_ROTATION` (`["AI", "USER", "FRACTAL"]`, plus `NPC` if passed in `entities.NPC`), while [`dispatch_consolidation`](./runner.js) rotates across `{ AI, USER, FRACTAL }` and persists `present` (`physical` / `non_physical`), `future`, and `past` deltas. `session.back_shot_cursor` advances only after successful parsing and target persistence.
- **Dynamics Ownership & Bounding**: [`execute_turn_1_director`](./runner.js) clamps emitted `dynamics_deltas` to `[-20, 20]` (defaulting to `MAIN_CHARACTER` and zeroed deltas on JSON parse failure). [`apply_dynamics_step`](./runner.js) clamps AI (`chaos`, `intensity`, `openness`, `affinity`) and Fractal (`velocity`, `entropy`) dynamics updates to `[5, 95]`, while [`dynamics.js`](../simulation/dynamics.js) clamps `reduce_dynamics` and `apply_dynamics_gravity` to `[0, 100]`.
- **Transactional Rollback & Orphan Recovery**: [`run_turn`](./runner.js) mutates transient normalized quadrant copies, restores `session.round` on error/abort without mutating live dynamics (which commit only via [`write_back_turn_state`](./runner.js)), and guards overlapping turns via `_turn_in_flight` (resettable via [`reset_turn_scope_for_testing`](./runner.js)). [`ChronoEngine.advance_turn`](./chrono.svelte.js) restores `session.round` on error/abort, deletes trailing user messages via `session.delete_entry` on user abort, and performs single-attempt orphan recovery via `_orphan_retry_in_flight`.
- **Transport Fallback & Diffusion Sanitization**: [`generate_text`](./transport.js) restricts mock fallback strictly to local dev (`localhost` / `127.0.0.1` / `import.meta.env.DEV`, never under `VITEST`) and deduplicates `onToken` vs `onChunk` callbacks. [`execute_turn_visualizer`](./runner.js) strips leading `@` prefixes (`@token` -> `token`) and `[{}[\]]` brackets via `sanitize_diffusion_text`.
- **Bounded Caches & Pools**: [`create_ephemeral_vector_cache`](../simulation/retrieval.js) evicts FIFO at `EMBEDDING_SPECS.MAX_EPHEMERAL_VECTORS`; [`two_tier_sieve_rag`](../simulation/retrieval.js) applies `1.5x` origin priority (`is_origin`) within `FIELD_FLOORS.PAST` and `TOTAL_FIELD_FLOORS_CHARACTERS` budgets.

## Side Effects

- **Boot Registration**: [`index.js`](./index.js) injects `_execute_visualizer_envision` into `@media`; [`install_freeze_watchdog`](../state/execution.svelte.js) starts a single `window.setInterval` heartbeat at `TIMING_MS.HEARTBEAT`.
- **IndexedDB Persistence**: [`SessionStore`](../state/session.svelte.js), [`runner.js`](./runner.js), [`lifecycle.js`](./lifecycle.js), and [`chrono.svelte.js`](./chrono.svelte.js) read and mutate Dexie tables (`db.stories`, `db.sessions`, `db.entities`, `db.kv_settings`, `db.simulation_log`, `append_ledger_entries`).
- **External LLM & Media Dispatch**: [`transport.js`](./transport.js) probes host `window`/`window.parent` Perchance text plugins under [`transport.js`](./transport.js) queuing/preemption and updates `execution.stream` (`@state`); [`runner.js`](./runner.js) dispatches detached image beats via `spawn_image_beat`, and [`lifecycle.js`](./lifecycle.js) triggers prologue visual generation via `visual_engine.visualize` and post-save portrait generation in `birth_entity_core` via `visual_engine.generate`.
- **Web Speech Audio & Telemetry**: [`ExecutionStore`](../state/execution.svelte.js) drives `Audio.voice` streaming/interruption; [`execution.svelte.js`](../state/execution.svelte.js), [`runner.js`](./runner.js), [`lifecycle.js`](./lifecycle.js), and [`chrono.svelte.js`](./chrono.svelte.js) emit diagnostics to `console`.

## Verification

- Run: `npx vitest run src/engine/`
