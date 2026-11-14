# RPGlitch Sovereign Simulation Engine (`src/engine/`)

## Overview

Headless, reactive simulation kernel, state runtime, and turn orchestration pipeline for **RPGlitch**.
This package encapsulates the 3-turn narrative heartbeat (Director Shot, Character Shot, and Caretaker Round-Robin), prologue/epilogue lifecycle flows, XML prompt envelope compilation, priority-gated LLM transport abstraction, Two-Tier Sieve RAG vector memory, somatic/fractal dynamics math, and Svelte 5 state reactivity.

- **Barrel Entry & Dependency Inversion**: Consumer layers (`src/ui/`, `src/App.svelte`, `src/main.js`, `src/data/`) import via [`index.js`](./index.js). On module evaluation, [`index.js`](./index.js) registers [`execute_visualizer_envision`](./lifecycle.js) into `@media` via `set_visualizer_envision_impl` so the media layer never imports `@engine`.
- **Cross-Package Delegation**: Runtime diagnostics and event logging live in [`../data/log.svelte.js`](../data/log.svelte.js) (`developer_log`), and bracket/`<think>` parsing lives in [`../data/parser.js`](../data/parser.js).
- **Subdirectories**: None (`src/engine/` is a leaf package).

## Interface

The package exposes its primary public interface via [`index.js`](./index.js), plus direct-import utilities in [`dynamics.js`](./dynamics.js) and [`caretaker-compaction-template.md`](./caretaker-compaction-template.md).

### 1. Session Lifecycle, Runs & Reactive State

- [`chrono.svelte.js`](./chrono.svelte.js) (barrel):
  - `ChronoEngine`, `chrono_engine`: Reactive session/turn controller (`error` `$state`) exposing `start(selection)`, `send(text)`, `retry()`, `continue(target_id)`, `advance_turn(input, options)`, and `stop()`.
- [`runtime.svelte.js`](./runtime.svelte.js) (barrel):
  - `RuntimeEngineStore`, `RuntimeEngine` (alias of `RuntimeEngineStore`), `runtime`: Authoritative Svelte 5 entity/story store (`active_user`, `active_ai`, `active_fractal`, `active_npcs`, `round`, `turn_type`, `story_id`, `active_story`, `ai`, `fractal`, `last_director_beat_round`, `last_dynamics_beat_round`, `last_director_ms`, `director_ms_pool`, `director_p50_ms`, `director_p95_ms`, `stagnation_turns`, `last_semantic_drift`, `structural_errors`, `back_shot_cursor`, `last_prompt_token_snapshot`, `prompt_snapshots_by_mode`, `is_ready`, `is_foreground_generating`, `is_background_generating`, `snapshot_entities`, `snapshot_npcs`, plus setters for `active_npcs`, `ai`, `fractal`, and `story_id`) with `init_effects()`, `teardown_effects()`, `sync(active_story_id)`, `save(round)`, `save_entity(type, entity)`, `update_entity(type, id, data)`, `delete_entity(type, id)`, `restore_story_title()`, `reset_story_title()`, `record_director_latency(ms)`, `record_turn_drift(drift)`, `acquire_foreground_generation()`, `release_foreground_generation()`, `acquire_background_generation()`, `release_background_generation()`, `can_start_background_generation()`, and `_debug_inject(mock_data)`.
- [`status.svelte.js`](./status.svelte.js) (barrel):
  - `simulation_state` (`SimulationStateStore`), `ui_state` (`UIStateStore`), `streaming` (`StreamingStore`), `force_recover_simulation(reason)`, `install_freeze_watchdog()`: Simulation phase/thinking-stage store (`phase`, `role`, `intent_active`, `director_thinking`, `speaker_thinking`, `media_generating`, `busy`, `is_consolidating`, `generating_entity_type`, `generating_entity_name`, `generating_entity_avatar`, `generating_entity_color`, setters for `phase`, `role`, and `intent_active`, plus `start_generation`, `start_typing`, `stop_typing`, `complete`, `start_director_stage`, `set_delegated_speaker`, `start_media_stage`, `start_stream_stage`, `lock`, `unlock`, `set_intent_active`, `set_generating_entity`, `clear_generating_entity`), UI loading state (`loading`, `set_loading`), active stream buffer/abort handle (`active`, `content`, `node_id`, `role`, `abort_controller`, `start_stream`, `update_stream`, `end_stream`, `trigger_interrupt`), and tiered hang recovery.
- [`kernel.svelte.js`](./kernel.svelte.js) (barrel):
  - `Kernel`: Reactive headless turn state machine (`user`, `ai`, `fractal`, `round`, `phase`, `history`, `error`, `director_enabled`, `transport`) exposing `submit_turn(userText, options)`, `continue_turn(target, options)`, `rewind_to_round(targetRound)`, `retry(options)`, and `continue(options)`.
- [`runs.js`](./runs.js):
  - Barrel: `execute_turn(user_input, _options)`, `execute_continue(target_entry, _options)`.
  - Direct module exports: `open_turn_session(app, runtime, feed)`, `write_back_kernel_state(kernel, outcome, live_transport, options)`, `dispatch_caretaker_consolidation(kernel, transport, signal)`.
- [`lifecycle.js`](./lifecycle.js) (barrel):
  - `execute_prologue(story_id)`, `execute_epilogue(story_id, conclusion_status)`, `execute_visualizer_envision(text, type, entity, app_style, signal)`, `structure_profile(raw, type, signal)`.

### 2. Turn Orchestration & Dynamics Physics

- [`turns.js`](./turns.js):
  - Barrel: `CARETAKER_ROTATION`, `build_turn_summary(feed, round)`, `calculate_turn_tempo(history)`, `execute_ghostwriter(transport, input_text, signal, on_token)`, `execute_round(options)`, `execute_turn_1_director(options)`, `execute_turn_2_character(options)`, `execute_turn_2_continue(options)`, `execute_turn_3_caretaker(options)`, `execute_turn_structuring(options)`, `execute_turn_visualizer(options)`, `resolve_caretaker_target(cursor_or_round, entities, use_cursor)`.
  - Direct module exports: `extract_think_and_body(raw, start_with)`, `reconstruct_history_from_feed(feed, cast)`.
- [`dynamics.js`](./dynamics.js) (direct module exports, not re-exported by [`index.js`](./index.js)):
  - `reduce_dynamics(current, baselines, entropy, deltas)`, `apply_dynamics_gravity(dynamics, baselines, active_entropy, base_gravity, skip_axes)`, `extract_entity_dynamics_baselines(entity)`, `compute_dynamics_deltas(target, dynamics, runtime_target)`, `evaluate_subtext_protocols(options)`, `evaluate_dynamics_rules(dynamics, manual_keywords, max_directives)`.

### 3. Prompt Assembly, Structural Verification & Vector RAG

- [`prompts.js`](./prompts.js):
  - Barrel: `PURPOSE_CORES` (`DIRECTOR`, `CARETAKER`, `CHARACTER`, `VISUALIZER`), `compile_prompt({ core, round, entities, history, memories, task_options })`.
  - Direct module export: `render_thinking_mode({ mode, lens, max_words, pivot_pov })`.
- [`verifier.js`](./verifier.js) (barrel):
  - `extract_tag_sequence(promptText)`, `verify_tag_balance(promptText)`, `verify_system_envelope(promptText)`, `verify_tag_order(promptText, expectedTagOrder)`, `verify_prompt_hygiene(promptText)`, `verify_compiled_prompt(promptText, options)`.
- [`sieve.js`](./sieve.js):
  - Barrel: `cosine_similarity(vecA, vecB)`, `count_text_tokens(text)`, `create_ephemeral_vector_cache()`, `score_and_rank_memories(candidates, queryVector)`, `two_tier_sieve_rag(options)`.
  - Direct module export: `TOTAL_FIELD_FLOORS_CHARACTERS`.
- [`caretaker-compaction-template.md`](./caretaker-compaction-template.md):
  - Standalone reference summarization/compaction prompt template used for memory batch compression.

### 4. Priority Gate & Streaming Transport

- [`gate.js`](./gate.js):
  - Barrel: `LLM_PRIORITY` (`{ FOREGROUND: 10, BACKGROUND: 1 }`), `run_llm_job(run, priority)`, `resolve_priority(priority_name)`, `get_llm_gate_status()`.
  - Direct module export: `_reset_gate_for_testing()`.
- [`transport.js`](./transport.js):
  - Barrel: `get_transport()`, `get_mock_message()`.
  - Direct module exports: `create_live_stream_fn()`, `reset_transport()`, `generate_text(payload, options)`, `enhance_text(payload)`.

## Invariants

- **Svelte 5 Purity**: All reactive state in `.svelte.js` modules uses Svelte 5 runes and reactive collections (`$state`, `$effect.root`, `SvelteSet`, with derived state exposed via class getters), and zero legacy Svelte 4 stores (`writable`, `readable`).
- **Single-Flight Priority Gate & Preemption**: [`gate.js`](./gate.js) runs at most one LLM job at a time sorted by `(priority DESC, seq ASC)`. Foreground jobs (`LLM_PRIORITY.FOREGROUND = 10`) abort active background jobs (`LLM_PRIORITY.BACKGROUND = 1`) and schedule forced slot release after `TIMING_MS.INTERACTION`.
- **Prompt Envelope & Epistemic Wall**: [`compile_prompt`](./prompts.js) enforces the 11-block Spatial State Spine opening with `<SYSTEM identity="...">` and closing with `</SYSTEM>`, capping `<RECENT>` at `TEMPO_ROUNDS.STANDARD` rounds and enforcing `see_hidden` visibility (`"all"` for `DIRECTOR`/`CARETAKER`, `"own"` for `CHARACTER`, `"none"` with inventory stripping for `VISUALIZER`). [`verify_system_envelope`](./verifier.js) validates `<SYSTEM` ... `</SYSTEM>` boundaries and [`verify_prompt_hygiene`](./verifier.js) rejects empty prompts or unparsed `{{...}}` mustache macros.
- **Quadrant Partitioning & Caretaker Cursor**: [`execute_turn_3_caretaker`](./turns.js) parses `eternal`, `present`, `future`, and `past` quadrants along `CARETAKER_ROTATION` (`["AI", "USER", "FRACTAL"]`, plus `NPC` if passed in `entities.NPC`), while [`dispatch_caretaker_consolidation`](./runs.js) rotates across `{ AI, USER, FRACTAL }` and persists `present` (`physical` / `non_physical`), `future`, and `past` deltas. `runtime.back_shot_cursor` advances only after successful parsing and target persistence.
- **Dynamics Ownership & Bounding**: [`execute_turn_1_director`](./turns.js) clamps emitted `dynamics_deltas` to `[-20, 20]` (defaulting to `MAIN_CHARACTER` and zeroed deltas on JSON parse failure). [`Kernel.submit_turn`](./kernel.svelte.js) clamps entity dynamics updates to `[5, 95]`, while [`dynamics.js`](./dynamics.js) clamps `reduce_dynamics` and `apply_dynamics_gravity` to `[0, 100]`.
- **Transactional Rollback & Orphan Recovery**: [`Kernel.submit_turn`](./kernel.svelte.js) restores `round`, `history`, and `ai.dynamics` / `fractal.dynamics` / `user.dynamics` snapshots on failure. [`ChronoEngine.advance_turn`](./chrono.svelte.js) restores `runtime.round` on error/abort, deletes trailing user messages on user abort, and performs single-attempt orphan recovery via `_orphan_retry_in_flight`.
- **Transport Fallback & Diffusion Sanitization**: [`generate_text`](./transport.js) restricts mock fallback strictly to local dev (`localhost` / `127.0.0.1` / `import.meta.env.DEV`, never under `VITEST`) and deduplicates `onToken` vs `onChunk` callbacks. [`execute_turn_visualizer`](./turns.js) strips leading `@` prefixes (`@token` -> `token`) and `[{}[\]]` brackets via `sanitize_diffusion_text`.
- **Bounded Caches & Pools**: [`create_ephemeral_vector_cache`](./sieve.js) evicts FIFO at `EMBEDDING_SPECS.MAX_EPHEMERAL_VECTORS`; [`two_tier_sieve_rag`](./sieve.js) applies `1.5x` origin priority (`is_origin`) within `FIELD_FLOORS.PAST` and `TOTAL_FIELD_FLOORS_CHARACTERS` budgets; [`RuntimeEngineStore.record_director_latency`](./runtime.svelte.js) caps `director_ms_pool` at `TELEMETRY_CAPS.DIRECTOR_LATENCY_POOL`.

## Side Effects

- **Boot Registration & Browser Globals**: [`index.js`](./index.js) injects `_execute_visualizer_envision` into `@media`; [`runtime.svelte.js`](./runtime.svelte.js) attaches `window.runtime` and mounts an auto-save `$effect.root` when `window` is defined; [`install_freeze_watchdog`](./status.svelte.js) starts a single `window.setInterval` heartbeat at `TIMING_MS.HEARTBEAT`.
- **IndexedDB Persistence**: [`RuntimeEngineStore`](./runtime.svelte.js), [`runs.js`](./runs.js), [`lifecycle.js`](./lifecycle.js), and [`chrono.svelte.js`](./chrono.svelte.js) read and mutate Dexie tables (`db.stories`, `db.kv_settings`, `db.simulation_log`, `entities`, `append_ledger_entries`, `log_message`, `session_driver`).
- **External LLM & Media Dispatch**: [`transport.js`](./transport.js) probes host `window`/`window.parent` Perchance text plugins under [`gate.js`](./gate.js) queuing/preemption and updates `stream_bridge`; [`runs.js`](./runs.js) and [`lifecycle.js`](./lifecycle.js) trigger detached image beats (`spawn_image_beat`, `visual_engine.visualize`).
- **Web Speech Audio & Telemetry**: [`StreamingStore`](./status.svelte.js) drives `Audio.voice` streaming/interruption; [`status.svelte.js`](./status.svelte.js), [`runs.js`](./runs.js), [`lifecycle.js`](./lifecycle.js), and [`chrono.svelte.js`](./chrono.svelte.js) emit diagnostics to `developer_log` (`../data/log.svelte.js`), `app.log`, and `console`.

## Verification

- Run: `npx vitest run src/engine/`
