# `src/engine` — Stage 1 Goldfish Atom Inventory

> **Scope**: All 14 production `.js` / `.svelte.js` modules in `src/engine/` (excluding `index.js`, `*.test.js`, `*.test-util.js`).  
> **Purpose**: Raw Stage 1 deconstruction (`inputs -> behavior -> outputs`, dependencies, overlaps, dead code, side effects) prior to Stage 2 (Elephant Synthesis & De-theming) and boundary decisions.

---

## 1. Cross-Layer Coupling & Candidate Files to Include

From scanning `src/engine/*.js` imports, `src/engine/` is heavily coupled to the following external modules—especially `@utils`, which houses several simulation-specific helpers:

### High-Priority `@utils` Candidates (Closely Coupled to `src/engine`)
1. **`@utils` — Bracket & Think Parsing**:
   - `apply_bracket_deltas`, `parse_bracket_entries`, `parse_brackets`, `format_clean_brackets`, `has_bracket_bond`
   - `parse_think_block`
   - *Why*: Used almost exclusively by `runs.js`, `turns.js`, `prompts.js`, `sessions.svelte.js`, `lifecycle.js`.
2. **`@utils` — Bridges & Stream/State Shims**:
   - `state_bridge`, `stories_bridge`, `stream_bridge`
   - *Why*: `state_bridge.app` is mutated directly across `chrono.svelte.js`, `lifecycle.js`, `runs.js`, `runtime.svelte.js`; `stream_bridge` is driven by `transport.js`; `stories_bridge` by `sessions.svelte.js`.
3. **`@utils` — Message/Text Helpers**:
   - `is_empty_narrative_message`, `is_telemetry_meta`, `decompose_story_title`, `sanitize_llm`, `safe_parse_json`, `merge_abort_signals`
   - `detox_prose` (imported via relative `../utils/detox.js` in `lifecycle.js`)
   - *Why*: `is_empty_narrative_message` and `is_telemetry_meta` are simulation-log domain rules; `sanitize_llm` / `safe_parse_json` / `merge_abort_signals` are LLM transport/turn utilities.
4. **`@utils` — Math Overlap**:
   - `src/utils/math.js` (`cosine_similarity` assumes unit vectors) vs `src/engine/sieve.js` (`cosine_similarity` normalizes by L2 norms).

### Other Notable External Couplings
- **`@media`**: `visual.svelte.js` (`visual_engine`, `mark_generation_in_flight`, `clear_generation_in_flight`), `optics.js` (`get_resolution_string`), `get_image_generation_queue`, `resolve_image_trigger`, `spawn_image_beat`, `get_signature_color`, `Audio`. (Note: `lifecycle.js` uses relative `../media/...` imports instead of `@media`.)
- **`@definitions`**: `caretaker_brief`, `DYNAMICS_RULES`, `default_dynamics_for_scope`, `visual-styles.js` (`get_visual_style` via relative `../definitions/...` in `lifecycle.js`).
- **`@data`**: `db`, `entities`, `normalize_entity`, `create_entity`, `upsert_entity`, `update_entity`, `apply_profile_to_entity`, `get_story`, `update_cast`, `append_ledger_entries`, `delete_log_entry`, `edit_log_entry`, `delete_log_attachment`, `load_session_checkpoint`, `clear_session_checkpoint`, `coerce_story_key`, `SESSION_ID_KEY`.

---

## 2. Extracted Atoms by File

### `src/engine/chrono.svelte.js`
- **Imports**: `build_turn_summary` (`./turns.js`), `state_bridge` (`@utils`), `simulation_log` (`./log.svelte.js`), `runtime` (`./runtime.svelte.js`), `session_driver` (`./sessions.svelte.js`), `simulation_state` (`./status.svelte.js`), `execute_prologue` (`./lifecycle.js`), `execute_continue`, `execute_turn` (`./runs.js`).
- **Atoms**:
  1. `ChronoEngine` *(exported class)*: Orchestrates simulation turn/session lifecycle.
  2. `ChronoEngine.error` *(`$state(null)`)*: Stores `error.message` on `start`, `retry`, `continue` failures (never reset at start of calls; never written by `advance_turn`).
  3. `ChronoEngine._orphan_retry_in_flight` *(boolean)*: Re-entrancy guard for single automatic orphan-turn retry in `advance_turn`.
  4. `ChronoEngine.start(selection)` *(async)*: Busy-guard -> resets title -> `session_driver.create_from_selection` -> `runtime.sync` -> sets card-flight flags -> `execute_prologue` -> switches view to `"storymode"`.
  5. `ChronoEngine.send(text)` *(async)*: Busy-guard + non-empty check -> delegates to `advance_turn(text)`.
  6. `ChronoEngine.retry()` *(async)*: Busy-guard -> `session_driver.regenerate()` -> `advance_turn(null, { is_retry: true })`.
  7. `ChronoEngine.continue(target_id = null)` *(async)*: Busy-guard -> refreshes `simulation_log` if empty -> if `target_id` matches feed entry, runs `execute_continue` with `AbortController`; else `advance_turn(null, { is_continue: true })`.
  8. `ChronoEngine.advance_turn(input, options = {})` *(async)*: Checks `runtime.story_id` -> locks intent/loading -> `session_driver.send` -> `execute_turn` -> `build_turn_summary` -> `runtime.save` -> handles `AbortError` (rollback round + delete trailing user msg) and non-abort errors (orphan retry + `TURN_ORPHANED` marker).
  9. `ChronoEngine.stop()` *(async)*: `runtime.save()` (if `story_id`) -> `session_driver.clear_active()`.
  10. `chrono_engine` *(exported singleton)*: `new ChronoEngine()`.
- **Overlaps / Quirks**: Busy-guard duplicated 4x; `AbortController`/stream lifecycle duplicated between `continue` and `advance_turn`; redundant `return (async () => ...)()` wrapper in `advance_turn`; `options.role` unused by any caller.

---

### `src/engine/dynamics.js`
- **Imports**: `DYNAMICS` (`@config`), `DYNAMICS_RULES` (`@definitions`), `clamp` (`@utils`).
- **Atoms**:
  1. `reduce_dynamics(current, baselines, entropy, deltas)` *(exported)*: Pure deterministic gravity pull toward `baselines` + `deltas`, clamped `[0, 100]`, returns frozen object.
  2. `apply_dynamics_gravity(dynamics, baselines, active_entropy, base_gravity, skip_axes)` *(exported)*: In-place mutation with `Math.random()` variance, clamped `[0, 100]`.
  3. `extract_entity_dynamics_baselines(entity)` *(exported)*: Returns `entity?.dynamics_baseline || {}`.
  4. `compute_dynamics_deltas(target, dynamics, runtime_target)` *(exported)*: Filters axes by `DYNAMICS[axis].scope`, computes diffs vs `runtime_target`, returns `{ deltas, log_strings }`.
  5. `evaluate_subtext_protocols({ ai_dynamics, fractal_dynamics, style })` *(exported)*: Evaluates `DYNAMICS_RULES` where `priority === undefined` + `style.triggers`.
  6. `evaluate_dynamics_rules(dynamics, manual_keywords, max_directives)` *(exported)*: Evaluates `DYNAMICS_RULES` where `priority !== undefined`, sorted descending, capped at `max_directives`.
- **Overlaps / Dead Code**: **Zero production callers** in `src/` (only `dynamics.test.js`). `runs.js` implements `apply_director_deltas_to_dynamics` inline instead of using `reduce_dynamics`.

---

### `src/engine/gate.js`
- **Imports**: `TIMING_MS` (`@config`).
- **Atoms**:
  1. `LLM_PRIORITY` *(exported frozen const)*: `{ FOREGROUND: 10, BACKGROUND: 1 }`.
  2. Module state: `active_job`, `active_controller`, `active_priority`, `waiting`, `sequence`.
  3. `release_slot(job)` *(internal)*: Clears active slot and calls `pump()`.
  4. `preempt_active()` *(internal)*: Aborts `active_controller` and schedules `setTimeout(..., TIMING_MS.INTERACTION)` force-release.
  5. `pump()` *(internal)*: Preempts background job if foreground is waiting; otherwise sorts `waiting` by priority/seq and runs next job with `AbortController`.
  6. `run_llm_job(run, priority)` *(exported)*: Enqueues job and returns Promise.
  7. `resolve_priority(priority_name)` *(exported)*: Maps `"background"` -> `BACKGROUND`, else `FOREGROUND`.
  8. `get_llm_gate_status()` *(exported)*: Returns `{ active, active_priority, queued, foreground_queued }`.
  9. `_reset_gate_for_testing()` *(exported)*: Resets module state (unused in `src/`).

---

### `src/engine/lifecycle.js`
- **Imports**: `normalize_entity`, `append_ledger_entries`, `apply_profile_to_entity`, `create_entity`, `get_story`, `update_cast`, `update_entity`, `upsert_entity` (`@data`), `parse_think_block`, `state_bridge` (`@utils`), `simulation_state` (`./status.svelte.js`), `execute_turn` (`./runs.js`), `runtime` (`./runtime.svelte.js`), `session_driver` (`./sessions.svelte.js`), `enhance_text`, `generate_text`, `get_transport` (`./transport.js`), `execute_turn_structuring`, `execute_turn_visualizer` (`./turns.js`), plus dynamic relative imports (`../media/optics.js`, `../definitions/visual-styles.js`, `../media/visual.svelte.js`, `../utils/detox.js`, `@media`).
- **Atoms**:
  1. `execute_visualizer_envision(text, type, entity, app_style, signal)` *(exported async)*: Resolves visual style + resolution, optionally refines prompt via `execute_turn_visualizer` with inline `live_transport`.
  2. `structure_profile(raw, type, signal)` *(exported async)*: Wraps `enhance_text` in inline `live_transport` and calls `execute_turn_structuring`.
  3. `execute_prologue(story_id)` *(exported async)*: Resets `runtime.round = 0`, compiles `CHARACTER` prompt, streams prologue, logs `"fractal"` message, launches gated background `visual_engine.visualize`, calls `execute_turn(prologue_text, { is_opening_turn: true })`.
  4. `execute_epilogue(story_id, conclusion_status)` *(exported async)*: Compiles `CHARACTER` epilogue prompt, calls `generate_text`, runs `detox_prose`, logs `"fractal"` message, locks `simulation_state`.
  5. `birth_entity_core(type, draft, options)` *(exported async)*: Creates entity, optionally synthesizes via `structure_profile`, upserts to DB, writes round-0 genesis ledger, registers NPC on story cast, and fires background `visual_engine.generate` portrait.
- **Overlaps / Dead Code**: Duplicate inline `live_transport` adapters in `execute_visualizer_envision` and `structure_profile`; unused `_ai_quadrant` in `execute_prologue`; relative dynamic imports instead of barrels.

---

### `src/engine/log.svelte.js`
- **Imports**: `SvelteSet` (`svelte/reactivity`), `db`, `delete_log_attachment`, `delete_log_entry`, `edit_log_entry` (`@data`), `match_speaker_snapshots`, `session_driver` (`./sessions.svelte.js`), `generate_uuid` (`@utils`), `TELEMETRY_CAPS` (`@config`).
- **Atoms**:
  1. `DEVELOPER_TELEMETRY_STORAGE_KEY` *(exported const)*: `"dev_telemetry"`.
  2. `resolve_entity_id_by_name(name, snapshots)` *(exported)*: Normalizes name and delegates to `match_speaker_snapshots`.
  3. `SimulationLogStore` *(exported class)*: `feed` (`$state([])`), `#id_set`, `#last_story_id`; methods `refresh`, `add`, `update`, `remove`, `delete_entry`, `delete_attachment`, `edit_entry`, `get_recent_window` (dead code), `clear`.
  4. `DeveloperLogStore` *(exported class)*: `#entries` (`$state([])`), `#persist_timer`; methods `entries` getter, `flush`, `#schedule_persist`, `log`, `hydrate`, `clear`.
  5. `simulation_log`, `developer_log` *(exported singletons)*.
  6. Browser `pagehide` / `visibilitychange` listeners flushing `developer_log`.
- **Overlaps / Dead Code**: `get_recent_window` has 0 callers; `SimulationLogStore` and `session_driver` have parallel log CRUD paths; `delete_attachment` doesn't update `this.feed`.

---

### `src/engine/prompts.js`
- **Imports**: `DYNAMICS`, `TEMPO_ROUNDS` (`@config`), `format_clean_brackets` (`@utils`), `caretaker_brief` (`@definitions`).
- **Atoms**:
  1. `render_thinking_mode({ mode, lens, max_words, pivot_pov })` *(exported)*: Renders `### Thinking Mode` directive block.
  2. `PURPOSE_CORES` *(exported frozen const)*: `DIRECTOR`, `CARETAKER`, `CHARACTER`, `VISUALIZER` (each with `identity`, `see_hidden`, `start_with`, `resolve_identity_text`, `task_block`).
  3. `render_block_1_system({ identity, identity_text })` *(internal)*: Renders `<SYSTEM>`, `<AXIOMATIC_CONSTITUTION>`, `<PROTOCOLS>`.
  4. `compile_prompt({ core, round, entities, history, memories, task_options })` *(exported)*: Compiles 11-block Spatial State Spine (`<SYSTEM>`, `<REALITY>`, `<CHARACTERS>`, `<SCENARIO>`, `<TRAJECTORY>`, `<HISTORY>`, `<TASK>`). Contains inner `render_entity_character`.
- **Overlaps / Quirks**: `core` default/JSDoc is lowercase (`"character"`) while `PURPOSE_CORES` keys are uppercase (`CHARACTER`); `DIRECTOR`/`CARETAKER`/`VISUALIZER` duplicate `<TASK>` + `render_thinking_mode` boilerplate.

---

### `src/engine/runs.js`
- **Imports**: `IMAGE_POLICY` (`@config`), `append_ledger_entries`, `db`, `normalize_entity` (`@data`), `apply_bracket_deltas`, `parse_bracket_entries`, `parse_think_block`, `state_bridge` (`@utils`, imported twice), `get_image_generation_queue`, `resolve_image_trigger`, `spawn_image_beat` (`@media`), `simulation_log`, `runtime`, `session_driver`, `simulation_state`, `get_transport`, `turns.js`.
- **Atoms**:
  1. `apply_director_deltas_to_dynamics(ai_entity, fractal_entity, deltas)` *(exported)*: Mutates `dynamics` in place, clamped `[5, 95]`.
  2. `_turn_in_flight` *(internal mutex)*, `reset_turn_scope_for_testing` *(exported)*, `_begin_turn_scope` *(internal)*, `_end_turn_scope` *(internal)*.
  3. `build_turn_context(app, feed)` *(internal)*: Normalizes active entities + reconstructs history.
  4. `persist_turn_rows(...)` *(internal async)*: Logs `DYNAMICS_DELTA` + `AI_TURN` and enforces `created_at` ordering.
  5. `maybe_spawn_turn_image(...)` *(internal async)*: Evaluates `resolve_image_trigger` and fires `spawn_image_beat`.
  6. `execute_turn(user_input, _options)` *(exported async)*: Acquires mutex -> builds context -> increments `runtime.round` -> `execute_round` -> `apply_director_deltas_to_dynamics` -> `persist_turn_rows` -> `write_back_turn_state` -> `maybe_spawn_turn_image`.
  7. `execute_continue(target_entry, _options)` *(exported async)*: Slices prior feed -> `execute_turn_2_continue` -> `simulation_log.edit_entry`.
  8. `write_back_turn_state(...)` *(exported async)*: Syncs `runtime` entities/physics/round, saves to DB, fires `dispatch_caretaker_consolidation`.
  9. `dispatch_caretaker_consolidation(...)` *(exported async)*: Runs `execute_turn_3_caretaker`, records ledger diffs, applies bracket deltas, emits `CONTINUUM_FORMATION`, increments `back_shot_cursor`.
- **Overlaps**: Duplicate `@utils` import; duplicate `stage_ai_speaker` closure in `execute_turn` and `execute_continue`.

---

### `src/engine/runtime.svelte.js`
- **Imports**: `TELEMETRY_CAPS` (`@config`), `clear_session_checkpoint`, `coerce_story_key`, `db`, `entities`, `load_session_checkpoint`, `SESSION_ID_KEY` (`@data`), `default_dynamics_for_scope` (`@definitions`), `get_signature_color` (`@media`), `decompose_story_title`, `state_bridge` (`@utils`), `session_driver` (`./sessions.svelte.js`), `SvelteSet` (`svelte/reactivity`).
- **Atoms**:
  1. `get_app()`, `apply_story_title(...)` *(internal)*.
  2. `RuntimeEngineStore` *(exported class)*:
     - `$state` fields: `active_user`, `active_ai`, `active_fractal`, `#active_npcs`, `is_ready`, `#story`, `round`, `turn_type`, `#ai_physics`, `#fractal_physics`, `last_director_beat_round`, `last_dynamics_beat_round`, `last_director_ms`, `director_ms_pool`, `structural_errors`, `back_shot_cursor`, `stagnation_turns`, `last_semantic_drift`, `last_prompt_token_snapshot`, `prompt_snapshots_by_mode`, `is_foreground_generating`, `is_background_generating`.
     - Methods: `init_effects`, `teardown_effects`, `snapshot_entities`, `snapshot_npcs`, `active_npcs`, `ai`, `fractal`, `story_id`, `active_story`, `director_p50_ms`, `director_p95_ms`, `record_director_latency`, `record_turn_drift`, `acquire/release_foreground_generation`, `acquire/release_background_generation`, `can_start_background_generation`, `sync`, `restore_story_title`, `reset_story_title`, `#persist_story_snapshot`, `save`, `save_entity`, `update_entity`, `delete_entity`, `_debug_inject`.
  3. `runtime` *(exported singleton)* + browser `window.runtime` / `init_effects()` boot.

---

### `src/engine/sessions.svelte.js`
- **Imports**: `has_bracket_bond`, `is_empty_narrative_message`, `is_telemetry_meta`, `stories_bridge` (`@utils`), `append_ledger_entries`, `db`, `SESSION_ID_KEY` (`@data`), `simulation_state` (`./status.svelte.js`).
- **Atoms**:
  1. `_environment`, `_active_id` *(internal non-reactive state)*, `bind_session_driver(environment)` *(exported)*.
  2. `match_speaker_snapshots(snapshots, key)` *(exported)*, `resolve_log_entity_id(...)` *(exported async)*, `resolve_story_round(story_id)` *(internal async)*, `_find_log_entry(id, feed)` *(internal async)*.
  3. `session_driver` *(exported singleton)*: `active_id`, `require_active`, `set_active`, `restore_active`, `clear_active`, `create_from_selection`, `send`, `regenerate`, `delete_log_entry`, `edit_log_entry`, `update_log_attachment`, `delete_log_attachment`, `log_message`, `load_log`.

---

### `src/engine/sieve.js`
- **Imports**: `CHARS_PER_TOKEN`, `EMBEDDING_SPECS`, `FIELD_FLOORS` (`@config`).
- **Atoms**:
  1. `ORIGIN_SCORE_MULTIPLIER` *(internal const `1.5`)*, `TOTAL_FIELD_FLOORS_CHARACTERS` *(exported const `1700`)*.
  2. `count_text_tokens(text)` *(exported)*, `cosine_similarity(vecA, vecB)` *(exported)*, `create_ephemeral_vector_cache()` *(exported)*, `score_and_rank_memories(candidates, queryVector)` *(exported)*, `two_tier_sieve_rag(...)` *(exported)*.
- **Overlaps / Dead Code**: **Zero production callers** in `src/` (only `sieve.test.js` and `sim-check.js`). `cosine_similarity` overlaps with `src/utils/math.js`.

---

### `src/engine/status.svelte.js`
- **Imports**: `TIMING_MS` (`@config`), `developer_log` (`./log.svelte.js`), `Audio` (`@media`), `get_llm_gate_status` (`./gate.js`).
- **Atoms**:
  1. `SimulationStateStore` *(exported class)*: `#phase`, `#role`, `#intent_active`, `#generating_entity_*`, `#director_thinking`, `#speaker_thinking`, `#media_generating`; `busy`, `is_consolidating`; `start_generation`, `start_typing`, `stop_typing`, `complete`, `start_director_stage`, `set_delegated_speaker`, `start_media_stage`, `start_stream_stage`, `lock`, `unlock`, `set_intent_active`, `set_generating_entity`, `clear_generating_entity`.
  2. `UIStateStore` *(exported class)*: `#loading`, `loading`, `set_loading`.
  3. `StreamingStore` *(exported class)*: `active`, `content`, `node_id`, `role`, `abort_controller`; `start_stream`, `update_stream`, `end_stream`, `trigger_interrupt`.
  4. `force_recover_simulation(reason)` *(exported)*, `install_freeze_watchdog()` *(exported)*, `_freeze_watchdog_started` *(internal)*.
  5. `simulation_state`, `ui_state`, `streaming` *(exported singletons)*.

---

### `src/engine/transport.js`
- **Imports**: `merge_abort_signals`, `sanitize_llm`, `stream_bridge` (`@utils`), `resolve_priority`, `run_llm_job` (`./gate.js`).
- **Atoms**:
  1. `get_mock_message()` *(exported)*, `resolve_ai_engine()` *(internal)*, `run_mock_generation(...)` *(internal async)*.
  2. `to_piece`, `invoke_with_retry`, `normalize_transport_result`, `normalize_direct_result`, `transport_completion` *(internal)*.
  3. `create_live_stream_fn()` *(exported)*, `_shared_transport` *(internal)*, `get_transport()` *(exported)*, `reset_transport()` *(exported)*.
  4. `direct_completion` *(internal async)*, `generate_text(payload, options)` *(exported async)*, `enhance_text(payload)` *(exported async)*.

---

### `src/engine/turns.js`
- **Imports**: `LENGTH_THRESHOLDS` (`@config`), `normalize_entity` (`@data`), `parse_brackets`, `parse_think_block`, `safe_parse_json` (`@utils`), `compile_prompt`, `PURPOSE_CORES` (`./prompts.js`).
- **Atoms**:
  1. `extract_think_and_body(raw, start_with)` *(exported)*
  2. `build_turn_summary(feed, round)` *(exported)*
  3. `CARETAKER_ROTATION` *(exported frozen const)*, `resolve_caretaker_target(cursor_or_round, entities, use_cursor)` *(exported)*
  4. `calculate_turn_tempo(history)` *(exported)*
  5. `execute_turn_1_director(...)` *(exported async)*
  6. `execute_turn_2_character(...)` *(exported async)*
  7. `execute_turn_2_continue(...)` *(exported async)*
  8. `execute_round(...)` *(exported async)*
  9. `execute_turn_3_caretaker(...)` *(exported async)*
  10. `execute_turn_visualizer(...)` *(exported async, with inner `sanitize_diffusion_text`)*
  11. `execute_turn_structuring(...)` *(exported async)*
  12. `reconstruct_history_from_feed(feed, cast)` *(exported)*
  13. `execute_ghostwriter(transport, input_text, signal, on_token, context)` *(exported async)*

---

### `src/engine/verifier.js`
- **Imports**: None.
- **Atoms**:
  1. `extract_tag_sequence(promptText)` *(exported)*
  2. `verify_tag_balance(promptText)` *(exported)*
  3. `verify_system_envelope(promptText)` *(exported)*
  4. `verify_tag_order(promptText, expectedTagOrder)` *(exported)*
  5. `verify_prompt_hygiene(promptText)` *(exported)*
  6. `verify_compiled_prompt(promptText, options)` *(exported)*
- **Overlaps / Dead Code**: **Zero production callers** in `src/` (only `verifier.test.js` and `prompts.test.js`).

---

## 3. Coupled `@utils` Atoms

### `src/utils/tags.js`
- **Imports**: `collapse_whitespace` (`./text.js`), `strip_cognition_blocks` (`./llm-sanitize.js`).
- **Atoms**:
  1. `parse_bracket_token(bracket_string)` *(exported)*: Parses `[KEY: value | flags]` respecting `{...}` brace depth -> `{ key, value, flags: { hide, show, is_origin, weight }, raw } | null`.
  2. `parse_brackets(text)` *(exported)*: Scans balanced `[...]` blocks (does not track `{...}` depth) -> `Array<ParsedBracketToken>`.
  3. `parse_bracket_entries(text)` *(exported)*: Scans `[...]` respecting `{...}` depth -> `Array<{ key, original_key, value, visibility, weight, status, raw, start_index, end_index }>`.
  4. `format_clean_brackets(brackets_text, options)` *(exported)*: Strips `INVENTORY`/`STASH` and `hide` tokens per `see_hidden` / `is_counterpart` -> `string`.
  5. `reconstruct_bracket_string(token)` *(internal)*: Reassembles `[KEY: value | flags]`.
  6. `apply_bracket_deltas(existing_text, delta_text)` *(exported)*: Applies `"none"`/`"cleared"` deletions, `INVENTORY`/`STASH` appends, and in-place overwrites -> `string`.
  7. `extract_memory_candidates(past_text)` *(exported)*: Maps `parse_brackets` tokens to `{ id, text, is_origin, weight, key }[]`.
  8. `extract_entity_relationships(entity, known_entities, perspective, ambient_entities)` *(exported)*: Extracts `@`-prefixed relational keys across `eternal`, `present`, `past`, `future` -> `Map`.
  9. `CLEAR_TOKENS`, `AGGREGATE_KEYS`, `VISUAL_EXCLUDED_KEYS` *(exported frozen Sets)*.
  10. `_split_key_value_segments(content)` *(internal)*, `_store_parsed_entry(target, k, v)` *(internal)*, `PSEUDO_JSON_KEY_REGEX` *(internal stateful RegExp)*.
  11. `safe_parse_pseudo_json(raw)` *(exported)*: 4-tier parser (`[...]` -> `"KEY": "VALUE"` -> `KEY: VALUE` -> `{ __raw_prose__ }`).
  12. `merge_prose_into_field(current_field_value, new_prose)` *(exported)*: Merges structured/unstructured prose deltas, `CLOTHING_KEYS` purging, `2000`-char cap.
  13. `strip_visual_excluded(raw_parameter_string)` *(exported)*: Strips `VISUAL_EXCLUDED_KEYS` and `[`/`]`.
  14. `balance_brackets(raw)` *(exported)*: Line-by-line bracket repair.
  15. `has_bracket_bond(entity, target_identifier_or_entity)` *(exported)*: Checks if any layer references `@target`.
  16. `CLOTHING_KEYS` *(exported frozen array)*, `PHYSICAL_KEY_ALIASES` *(exported frozen map)*, `strip_leading_key_echo(value, keys)` *(exported)*, `normalize_physical_entries(parsed)` *(exported)*.
  17. `filter_epistemic_brackets(text, perspective)` *(exported)*, `strip_bracket_engine_flags(text)` *(exported)*.
- **Overlaps / Quirks**: `parse_brackets` vs `parse_bracket_entries` divergent flag/brace handling; `apply_bracket_deltas` vs `merge_prose_into_field`; `format_clean_brackets` vs `filter_epistemic_brackets` vs `strip_bracket_engine_flags` vs `strip_visual_excluded`; hardcoded `INVENTORY`/`STASH` and `none`/`cleared` instead of `AGGREGATE_KEYS`/`CLEAR_TOKENS`.

---

### `src/utils/text.js`
- **Imports**: `CANONICAL_ROLES`, `CHARS_PER_TOKEN` (`@config`), `escape_xml`, `prompt_escape` (`./xml.js`), `strip_cognition_blocks` (`./llm-sanitize.js`), re-exports `./alternations.js`.
- **Atoms**:
  1. `NAME_PREFIXES`, `NAME_PREFIX_STEMS` *(exported frozen)*, `TELEMETRY_MESSAGE_TYPES` *(internal Set)*.
  2. `collapse_whitespace(text)`, `truncate_at_word(text, limit, options)`, `truncate_at_boundary(text, limit, options)`, `estimate_tokens(text)`, `clean_text(text, limit)`, `indent_continuation(text, spaces)`, `compute_initials(text, stop_words)`, `first_sentence(text, max_len)`, `match_case(original, replacement)`, `format_key_as_label(key)`, `format_datetime(ts)` *(all exported)*.
  3. `parse_relational_vector(vector_str)`, `format_relational_vector(source_name, target_name, dynamic)`, `derive_vector_title(text, max_len)` *(exported)*.
  4. `role_display_label(role)`, `canonicalize_role(role)`, `normalize_history_beat(entry, options)`, `is_narrative_role(role)`, `collapse_history(messages, options)`, `filter_narrative_messages(messages, options)`, `format_history_entries(messages, options)` *(exported)*.
  5. `decompose_story_title(title, entities)`, `normalize_comma_spacing(str)`, `match_keyword_pattern(pattern, haystack)`, `is_telemetry_meta(meta)`, `is_empty_narrative_message(text, options)` *(exported)*.
- **Overlaps / Quirks**: `role_display_label` vs `canonicalize_role` vs `collapse_history` inline role mapping; `filter_narrative_messages` vs `is_empty_narrative_message`; `format_history_entries` runs `strip_cognition_blocks` twice when `collapse = true`.

---

### `src/utils/detox.js`
- **Imports**: `SPEAKING_STYLES` (`@config`), `stable_pick` (`./math.js`), `match_case` (`./text.js`).
- **Atoms**:
  1. `pick_replacement(...)` *(internal)*: Deterministic replacement picker via `stable_pick` + `match_case`.
  2. `_cached_speaking_rules`, `_cached_anti_ai_rules` *(internal mutable state)*, `register_speaking_rules(rules)` *(exported)*, `register_anti_ai_rules(rules)` *(exported)*.
  3. `detox_prose(raw_text, speaking_style, custom_rules)` *(exported)*: Applies speaking rules, 12 hardcoded anti-AI structural regex passes, and `_cached_anti_ai_rules`.

---

### `src/utils/resilience.js`
- **Imports**: `TIMING_MS`, `PATIENCE_POLICY` (`@config`).
- **Atoms**:
  1. `merge_abort_signals(caller, secondary)` *(exported)*: Combines two `AbortSignal`s via `AbortSignal.any` or fallback `AbortController`.
  2. `ExponentialBackoffRetryer` *(exported class)*: `.retry(fn, on_retry)`.
  3. `CircuitBreaker` *(exported class)*: `CLOSED` / `OPEN` / `HALF_OPEN` state machine with concurrency queue.

---

### `src/utils/math.js`
- **Imports**: None.
- **Atoms**:
  1. `clamp(value, min, max)` *(exported)*, `get_percentage(value)` *(exported, `0 || 50` quirk)*.
  2. `cosine_similarity(a, b)` *(exported, dot product assuming unit vectors — overlaps with `sieve.js`)*.
  3. `serialize_embedding`, `deserialize_embedding`, `quantize_vector_q8`, `dequantize_vector_q8` *(exported)*.
  4. `generate_uuid()`, `generate_secure_seed(limit)`, `pick_random(array)` *(exported, CSPRNG)*.
  5. `HASH_OFFSET_BASIS`, `HASH_PRIME`, `fnv1a_hash(str)`, `stable_pick(list, seed, offset)` *(exported)*.
  6. `evaluate_image_trigger(current, previous, options)` *(exported — domain-coupled to `"ai"`, `"user"`, `"story_character"`, `"story_scene"` inside `math.js`)*.

---

### `src/utils/llm-sanitize.js`
- **Atoms**:
  1. `strip_cognition_blocks(text)` *(exported)*: Strips `<think>` / cognition blocks.
  2. `extract_json_block(raw)` *(exported)*, `escape_unescaped_json_quotes(json_string)` *(exported)*, `safe_parse_json(raw, options)` *(exported)*: JSON extraction & fault-tolerant parsing.
  3. `looks_truncated(text)` *(exported)*, `raw_to_text(raw)` *(exported)*, `raw_stop_reason(raw)` *(exported)*.
  4. `sanitize_llm(text)` *(exported)*, `parse_profile_json(raw)` *(exported)*, `clean_image_prompts(text)` *(exported)*, `parse_think_block(text)` *(exported)*, `strip_covert_directives(text)` *(exported)*.

---

### `src/utils/registries.js`
- **Atoms**:
  1. `register_state_accessors(accessors)` *(exported)*, `state_bridge` *(exported singleton)*: Cross-layer bridge for `app` / `runtime` state.
  2. `register_stream_handlers(handlers)` *(exported)*, `stream_bridge` *(exported singleton)*: Cross-layer bridge for `start` / `update` / `end` streaming.
  3. `stories_bridge` *(exported singleton)*: Story list invalidation (`bump()`).
  4. `reset_registries_for_testing()` *(exported)*: Test teardown helper.

---

## 4. Coupled `@media` Atoms

### `src/media/visual.svelte.js`
- **Imports**: `IMAGE_POLICY`, `TIMING_MS` (`@config`), `get_visual_style` (`@definitions`), `CircuitBreaker`, `ExponentialBackoffRetryer`, `generate_secure_seed`, `state_bridge` (`@utils`), `get_resolution_string`, `IMAGE_TIERS` (`./optics.js`), dynamic circular `import("./index.js")` in `spawn_image_beat`.
- **Atoms**:
  1. `VISUAL_JSON_PROMPT_RE`, `VISUAL_JSON_NEG_RE` *(internal)*, `unescape_visual_json_value`, `looks_like_visual_json` *(internal)*, `rescue_visual_prose(text)` *(exported, no external callers)*, `sanitize_visual_text(text)` *(exported)*.
  2. `resolve_story_beat_style(options)` *(exported)*, `compose_story_beat_prompt(prompt_text, style_key, base_negative)` *(exported, duplicates `resolve_visual_engine_tokens`)*.
  3. `cached_image_engine` *(internal)*, `find_image_engine()` *(exported)*, `reset_cached_image_engine()` *(exported, test-only)*.
  4. `visual_circuit_breaker`, `visual_retryer`, `create_offline_svg` *(internal)*, `dispatch_visual_generation(payload, options)` *(exported async, hardcodes `guidance_scale = 7` instead of `get_tier_guidance_scale`)*.
  5. `_in_flight_image_generations`, `_image_generation_queue` *(exported)*, `mark_generation_in_flight`, `clear_generation_in_flight`, `is_generation_in_flight`, `reset_generation_in_flight`, `get_image_generation_queue`, `reset_image_generation_queue`, `_remove_from_image_generation_queue`, `count_pending_ghosts`, `mark_placeholder_failed`, `sweep_stale_ghosts`.
  6. `VisualEngine` *(exported class; dead fields `is_loading`, `error`, `attempts`, `is_offline`; dead `story_id` param in `visualize`; zero Svelte 5 runes)*, `visual_engine` *(exported singleton)*, `set_visualizer_envision_impl(fn)` *(exported)*, `spawn_image_beat(tier, options)` *(exported async)*.

---

### `src/media/optics.js`
- **Imports**: `DYNAMICS`, `IMAGE_POLICY`, `IMAGE_RESOLUTIONS` (`@config`), `resolve_portrait_visual_style_key`, `VISUAL_STYLES` (`@definitions`), `CLEAR_TOKENS`, `CLOTHING_KEYS`, `evaluate_image_trigger`, `normalize_comma_spacing`, `safe_parse_pseudo_json`, `VISUAL_EXCLUDED_KEYS` (`@utils`), `get_signature_label` (`./palette.js`), `PALETTE` (`./tokens.js`).
- **Atoms**:
  1. `IMAGE_TIERS` *(exported frozen array)*, `TIER_RESOLUTIONS` *(internal frozen map)*, `normalize_image_tier(target_type)` *(exported)*, `get_resolution(mode)` *(exported)*, `get_resolution_string(mode)` *(exported)*, `get_tier_guidance_scale(mode)` *(exported, unused in runtime)*.
  2. `resolve_image_trigger(...)` *(exported)*: Dual-source cooldown & trigger arbitration (Director vs Dynamics).
  3. `ORDERED_VISUAL_STYLE_KEYS` *(exported frozen array)*, `BARE_MARKER_REGEX` *(internal)*, `resolve_visual_engine_tokens(visual_style_key)` *(exported)*, `build_aesthetic_map(entity)` *(exported, omits `_visual_style_texture`)*, `flatten_aesthetic_map(entity)` *(exported)*, `extract_aesthetic_traits(entity)` *(exported)*, `render_optics_fallback(options)` *(exported)*.

---

## 5. Stage 2: De-themed Atom Mapping (`Current -> Generic Engineering Name`)

| Current Name | Generic Engineering Name | Domain / Notes |
| --- | --- | --- |
| `ChronoEngine` / `chrono_engine` | `SessionController` / `session_controller` | Top-level turn & session lifecycle |
| `execute_prologue` / `execute_epilogue` | `generate_opening` / `generate_closing` | Session start/end generation |
| `birth_entity_core` | `create_entity_with_profile` | Entity creation + synthesis + portrait |
| `execute_visualizer_envision` | `refine_image_prompt` | LLM image prompt refinement |
| `structure_profile` | `parse_entity_profile` | Raw text -> structured entity JSON |
| `execute_ghostwriter` | `generate_user_draft` | Draft user message generation |
| `execute_turn_1_director` | `run_planner_step` | Turn 1 planning & metric deltas |
| `execute_turn_2_character` | `run_generation_step` | Turn 2 narrative generation |
| `execute_turn_2_continue` | `continue_generation_step` | In-place continuation |
| `execute_turn_3_caretaker` | `run_memory_consolidation_step` | Turn 3 background state/memory update |
| `execute_turn_visualizer` | `run_image_prompt_step` | Image prompt synthesis step |
| `execute_turn_structuring` | `run_schema_extraction_step` | Structured JSON extraction step |
| `PURPOSE_CORES` (`DIRECTOR`, `CARETAKER`, `CHARACTER`, `VISUALIZER`) | `PROMPT_ROLES` (`PLANNER`, `CONSOLIDATOR`, `GENERATOR`, `IMAGE_PROMPT`) | Prompt role definitions |
| `fractal` | `environment` / `scene` | World/setting entity |
| `back_shot_cursor` | `consolidation_cursor` | Round-robin entity index |
| `sieve.js` (`two_tier_sieve_rag`, `score_and_rank_memories`) | `retrieval.js` (`select_context_memories`, `rank_memories`) | Vector RAG selection |
| `create_ephemeral_vector_cache` | `create_vector_cache` | In-memory FIFO embedding cache |
| `RuntimeEngineStore` / `runtime` | `SessionStateStore` / `session_state` | Active entities, round, physics state |
| `SimulationLogStore` / `simulation_log` | `MessageLogStore` / `message_log` | Reactive chat/event feed |
| `DeveloperLogStore` / `developer_log` | `DebugLogStore` / `debug_log` | Diagnostic telemetry log |
| `session_driver` | `session_repository` | Session & log persistence |
| `dynamics.js` (`reduce_dynamics`, `apply_dynamics_gravity`) | `metrics.js` (`update_metrics`, `apply_metric_decay`) | Entity metric updates & decay |
| `evaluate_subtext_protocols` / `evaluate_dynamics_rules` | `evaluate_prompt_directives` / `evaluate_metric_rules` | Rule-based prompt directives |
| `gate.js` (`run_llm_job`, `get_llm_gate_status`) | `job_queue.js` (`enqueue_llm_job`, `get_queue_status`) | Priority LLM job queue |
| `transport.js` (`generate_text`, `enhance_text`) | `llm_client.js` (`complete_text`, `transform_text`) | Host LLM transport wrapper |
| `verifier.js` | `prompt_validator.js` | XML/tag prompt validator |
| `detox_prose` | `clean_generated_prose` | Post-generation prose cleanup |
| `parse_brackets` / `parse_bracket_entries` / `safe_parse_pseudo_json` | `parse_tagged_fields` / `parse_key_value_blocks` | Structured `[KEY: VALUE]` parsing |
| `optics.js` / `VisualEngine` | `image_config.js` / `ImageService` | Image tiers, styles, dispatch |
| `spawn_image_beat` / `sweep_stale_ghosts` | `enqueue_image_generation` / `cleanup_stale_placeholders` | Background image queue & cleanup |
