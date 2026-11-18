# Post-Execution Audit Specification: Engine, Simulation & State Architecture

## 1. Strict 6-Rank Layer DAG (`Rank 5 -> Rank 0`)

All imports must flow strictly downward (`Rank N -> Rank < N`, or sibling imports where allowed within `@state` and `@utils`). Upward imports, circular dependencies, and runtime callback-injection shims are prohibited.

```text
Rank 5: src/ui/          (@ui, @primitives — Svelte 5 View Components)
  ↓
Rank 4: src/engine/      (@engine — LLM Transport, Turn Runner, Lifecycle, Chrono)
  ↓
Rank 3: src/state/       (@state — Reactive Svelte 5 Stores: interface, runtime, chat, status, streaming, devlog)
  ↓
Rank 2: src/data/        (@data — Pure Dexie Persistence: db, session, records, ledger, checkpoint, card-codec, exporters)
        src/media/       (@media — Pure Sensory/Plugin Dispatch: image-generation, audio, motion)
  ↓
Rank 1: src/simulation/  (@simulation — Pure Simulation Logic: brackets, llm-output, history, dynamics, retrieval, prompts)
  ↓
Rank 0: src/definitions/ (@definitions — Declarative Style, Taxonomy, Premade & Rule Registries)
        src/utils/       (@utils — Pure Foundation: math, vectors, text, style-resolve, queue, resilience, tokens, palette, xml, macros, html, onnx, embeddings)
        src/config.js    (@config — Frozen System Constants)
```

---

## 2. Extinction Ledger (Must Not Exist)

Confirm zero remaining files or symbol references across the codebase for the following retired artifacts:

- **Deleted Files (`src/utils/`)**: `tags.js`, `llm-sanitize.js`, `detox.js`, `styles.js`, `registries.js`, `registries.test.js`, `job-queue.js`, `job-queue.test.js`.
- **Deleted Files (`src/media/`)**: `optics.js`, `visual.svelte.js`, `policy.js`, `tokens.js` _(moved to `@utils`)_, `palette.js` _(moved to `@utils`)_.
- **Deleted Files (`src/ui/`)**: `interface.svelte.js` _(moved to `src/state/interface.svelte.js`)_.
- **Deleted Files (`src/engine/`)**: `gate.js`, `dynamics.js`, `sieve.js`, `prompts.js`, `verifier.js`, `sessions.svelte.js`, `runtime.svelte.js`, `log.svelte.js`, `status.svelte.js`, `runs.js`, `turns.js` _(plus their superseded test files; `caretaker-compaction-template.md` and `fixtures.test-util.js` live in `src/simulation/`)_.
- **Eradicated Shims & Bridges**: `state_bridge`, `stream_bridge`, `stories_bridge`, `register_state_accessors`, `register_stream_handlers`, `register_bump`, `get_app`, `bind_session_driver`, `set_visualizer_envision_impl`, `register_speaking_rules`, `register_anti_ai_rules`, `register_cluster_words`.
- **Pruned Dead Exports & Methods**:
  - **LLM Output**: `extract_json_block`, `escape_unescaped_json_quotes`, `looks_truncated`, `raw_to_text`, `raw_stop_reason`, `parse_profile_json`.
  - **Media (`VisualEngine` / `ImageService`)**: `ImageService`, `is_loading`, `error`, `attempts`, `is_offline`, and the `story_id` parameter on `visualize()`.
  - **State (`runtime`)**: `acquire_foreground_generation`, `release_foreground_generation`, `acquire_background_generation`, `release_background_generation`.
  - **State (`chat`)**: `get_recent_window`.

---

## 3. Target Module State & Invariants by Rank

### Rank 0: `src/utils/` & `src/definitions/`

- **`src/utils/math.js`**
  - **Exports**: `clamp`, `get_percentage`, `HASH_OFFSET_BASIS`, `HASH_PRIME`, `fnv1a_hash`, `stable_pick`, `generate_uuid`, `generate_secure_seed`, `pick_random`.
  - **Invariants**: `get_percentage(0)` returns `0` via `Number.isFinite(Number(value)) ? clamp(Math.round(Number(value)), 0, 100) : 50`. Contains zero vector math or image-trigger functions.

- **`src/utils/vectors.js`**
  - **Exports**: `cosine_similarity`, `serialize_embedding`, `deserialize_embedding`, `quantize_vector_q8`, `dequantize_vector_q8`.
  - **Invariants**: `cosine_similarity` computes full L2 normalization (`dot / (Math.sqrt(normA) * Math.sqrt(normB))`). `serialize_embedding` uses `byteLength / 4` when passed non-`Float32Array` `ArrayBufferView` inputs.

- **`src/utils/text.js`**
  - **Exports**: `NAME_PREFIXES` (no duplicate dotted entries), `NAME_PREFIX_STEMS`, `collapse_whitespace`, `truncate_at_word`, `truncate_at_boundary`, `count_tokens`, `clean_text`, `indent_continuation`, `compute_initials`, `match_case`, `format_key_as_label`, `format_datetime`, `normalize_comma_spacing`, `match_keyword_pattern`, plus `export * from "./alternations.js"`.
  - **Invariants**: `normalize_comma_spacing` returns `""` on `null`/`undefined`. `match_keyword_pattern` falls through to literal/word matching in `catch` when given an invalid regex. Does not import `./xml.js` or contain history/relational-vector helpers.

- **`src/utils/style-resolve.js`**
  - **Exports**: `resolve_style`.
  - **Invariants**: Pure Rank 0 style-lookup helper shared by `@definitions` and `@simulation/prompts`.

- **`src/utils/queue.js`**
  - **Exports**: `CLEARED_RESULT`, `SUPERSEDED_RESULT`, `create_job_queue`, `LLM_PRIORITY`, `enqueue_llm_job`, `resolve_priority`, `get_queue_status`, `reset_queue_for_testing`.
  - **Invariants**: `reset_queue_for_testing` aborts any active `AbortController` and clears pending `preempt_active` timers before zeroing state.

- **`src/utils/resilience.js`**
  - **Exports**: `merge_abort_signals`, `ExponentialBackoffRetryer`, `CircuitBreaker`.
  - **Invariants**: `CircuitBreaker.reset()` rejects pending `#queue` promises before setting `#queue.length = 0`. `ExponentialBackoffRetryer.retry()` clamps `max_attempts = Math.max(1, ...)`. `merge_abort_signals` fallback cleans up the sibling `abort` listener when the first signal fires.

- **`src/utils/tokens.js` & `src/utils/palette.js`**
  - **Invariants**: Pure generated design tokens and deterministic FNV color/label resolvers live in `@utils`. `.agents/skills/design/scripts/sync-css.js` outputs `tokens.js` to `src/utils/tokens.js`.

- **`src/utils/` (Remaining Foundation)**
  - **Modules**: `embeddings.svelte.js`, `onnx.js`, `xml.js`, `macros.js`, `alternations.js`, `markdown.js`, `html.js`, `field-path.js`, `actions.js`, `ui-helpers.js`, `index.js`.

- **`src/definitions/`**
  - **Modules**: `dynamics-registry.js`, `narrative-styles.js`, `premades.js`, `profile-taxonomy.js`, `speaking-styles.js`, `visual-styles.js`, `index.js`.
  - **Invariants**: `profile-taxonomy.js` imports `SIGNATURE_COLORS` from `@utils`. `speaking-styles.js` is purely declarative with zero module-load `register_*` calls.

---

### Rank 1: `src/simulation/` (Pure Simulation Domain)

Zero Svelte runes, zero IndexedDB calls, zero DOM access across all Rank 1 modules.

- **`src/simulation/brackets.js`**
  - **Exports**: `parse_tagged_fields`, `format_tagged_fields`, `apply_tagged_field_deltas`, `safe_parse_pseudo_json`, `balance_brackets`, `normalize_physical_entries`, `strip_leading_key_echo`, `extract_entity_relationships`, `has_bracket_bond`, `parse_relational_vector`, `format_relational_vector`, `derive_vector_title`, `CLEAR_TOKENS`, `AGGREGATE_KEYS`, `VISUAL_EXCLUDED_KEYS`, `CLOTHING_KEYS`, `PHYSICAL_KEY_ALIASES`.
  - **Invariants**:
    - `parse_tagged_fields(text)` tracks `{...}` alternation brace depth and outputs unified token metadata (`visibility`, `is_origin`, `weight` clamped `1..10` default `5`, `status`, `original_key`, `key` uppercased, `value`, `raw`, `start_index`, `end_index`).
    - `format_tagged_fields(text, options)` supports `{ perspective = "owner" | "other" | "vision" | "all", strip_keys = null, strip_flags = true, preserve_prose = false }` using `AGGREGATE_KEYS` and `VISUAL_EXCLUDED_KEYS`.
    - `apply_tagged_field_deltas(existing_text, delta_text, options)` uses `CLEAR_TOKENS` and `AGGREGATE_KEYS` across structured deltas and prose merges, stripping brackets with `.replace(/[[\]]/g, "")`.
    - `safe_parse_pseudo_json` routes Tier 2 `"KEY": "VALUE"` pairs through `_store_parsed_entry` and uses a local regex clone (no module-global `lastIndex` mutation).
    - `extract_entity_relationships` has no dead `entry.flags` check; `has_bracket_bond` delegates to `parse_tagged_fields`.

- **`src/simulation/llm-output.js`**
  - **Exports**: `first_sentence`, `parse_think_block`, `strip_cognition_blocks`, `safe_parse_json`, `sanitize_llm`, `strip_covert_directives`, `clean_generated_prose`, `resolve_speaking_style`, `lint_narrative_slop`, `cap_somatic_markers`, `audit_macro_shape`.
  - **Invariants**: `parse_think_block(raw, start_with = "")` reconciles prefilled `start_with` prefixes and returns `{ think, prose, content }`. Imports `SPEAKING_STYLE_RULES`, `ANTI_AI_REPLACEMENTS`, `SPEAKING_STYLES`, and `TIER_2_CLUSTER_WORDS` directly from `@definitions`.

- **`src/simulation/history.js`**
  - **Exports**: `canonicalize_role`, `is_narrative_role`, `normalize_history_beat`, `collapse_history`, `filter_narrative_messages`, `format_history_entries`, `reconstruct_history_from_feed`, `calculate_turn_tempo`, `build_turn_summary`, `match_speaker_snapshots`, `resolve_entity_id_by_name`, `is_telemetry_meta`, `is_empty_narrative_message`, `decompose_story_title` _(with `TELEMETRY_MESSAGE_TYPES` kept as a module-private `Set`)_.
  - **Invariants**: `canonicalize_role` normalizes `"prologue"`, `"epilogue"`, `"narrator"`, and `"system"`. `is_narrative_role` is case-insensitive and excludes both `SYSTEM` and `telemetry`. `format_history_entries` avoids running `strip_cognition_blocks` twice when `collapse = true`. `reconstruct_history_from_feed` reads `.text` or `.content`. `match_speaker_snapshots` resolves both uppercase (`AI`/`USER`/`FRACTAL`) and lowercase (`ai`/`user`/`fractal`) snapshot keys.

- **`src/simulation/dynamics.js`**
  - **Exports**: `step_dynamics`, `evaluate_dynamics_directives`, `evaluate_image_trigger`, `extract_metric_baselines`, `CARETAKER_ROTATION`, `resolve_caretaker_target`.
  - **Invariants**:
    - `step_dynamics(current, baselines, deltas, { entropy = 50, min = 5, max = 95, jitter = false, scope = null })` is pure (never mutates `current`), uses `?? 50` (not `|| 50`), applies baseline gravity pull (`DYNAMICS.PHYSICS.GRAVITY` scaled by `entropy`, plus stochastic `VARIANCE` when `jitter = true`) and `deltas` clamped to `[min, max]`, returning `{ next, diffs, log_strings }`.
    - `evaluate_dynamics_directives({ ai_dynamics, fractal_dynamics, style, manual_keywords = [], max_directives = 2 })` evaluates `DYNAMICS_RULES` (`@definitions`) and `style?.triggers` in a single pass, returning `{ priority_directives, subtext_protocols }`.
    - `evaluate_image_trigger` compares `from` and `to` axes per-entity rather than across entities.

- **`src/simulation/retrieval.js`**
  - **Exports**: `extract_memory_candidates`, `rank_memories`, `select_context_memories`, `create_vector_cache`, `TOTAL_FIELD_FLOORS_CHARACTERS` _(with `ORIGIN_SCORE_MULTIPLIER` kept as a module-private constant)_.
  - **Invariants**: `rank_memories` uses L2 `cosine_similarity` (`@utils`) and internal `ORIGIN_SCORE_MULTIPLIER = 1.5`. `create_vector_cache().set()` only evicts the oldest key when `!store.has(id) && store.size >= MAX`.

- **`src/simulation/prompts.js`** _(plus `caretaker-compaction-template.md` & `fixtures.test-util.js`)_
  - **Exports (Narrative XML)**: `PURPOSE_CORES`, `render_thinking_mode`, `compile_prompt`.
  - **Exports (XML Verifier)**: `extract_tag_sequence`, `verify_tag_balance`, `verify_system_envelope`, `verify_tag_order`, `verify_prompt_hygiene`, `verify_compiled_prompt`.
  - **Exports (Visual, Diffusion & Trigger Resolution)**: `sanitize_visual_text`, `rescue_visual_prose`, `ORDERED_VISUAL_STYLE_KEYS`, `resolve_visual_engine_tokens`, `build_aesthetic_map`, `flatten_aesthetic_map`, `extract_aesthetic_traits`, `render_optics_fallback`, `resolve_story_beat_style`, `compose_story_beat_prompt`, `resolve_image_trigger` _(plus re-exported tier helpers `IMAGE_TIERS`, `TIER_RESOLUTIONS`, `normalize_image_tier`, `get_resolution`, `get_resolution_string`, `get_tier_guidance_scale`)_.
  - **Invariants**:
    - `compile_prompt` normalizes `String(core || "CHARACTER").toUpperCase()`, preserves counterpart appearance ordering (`[eter_phys, pres_phys]`), passes `strip_inventory: see_hidden === "none"` for `npc` and `fractal.present`, auto-injects `evaluate_dynamics_directives` into `<SCENARIO>`/`<TASK>`, auto-runs `extract_memory_candidates` + `select_context_memories` when `memories == null`, and runs `verify_compiled_prompt` in dev/Vitest.
    - `verify_compiled_prompt` computes `extract_tag_sequence(promptText)` once and passes it to `verify_tag_balance` and `verify_tag_order`.
    - `build_aesthetic_map` includes `_visual_style_texture`. `resolve_story_beat_style` takes `{ style, app_style, fractal_style, entity }` as pure parameters. `compose_story_beat_prompt` reuses `resolve_visual_engine_tokens`.

---

### Rank 2: `src/data/` & `src/media/` (Persistence & Sensory Dispatch)

Zero Svelte runes and zero upward imports to `@state`, `@engine`, or `@ui`.

- **`src/data/session.js`**
  - **Exports**: `SESSION_ID_KEY`, `get_active_session_id`, `require_active`, `set_active_session_id`, `clear_active_session_id`, `record_session_access`, `get_recent_sessions`, `create_from_selection`, `_find_log_entry`, `resolve_log_entity_id`, `resolve_story_round`, `log_message`, `send`, `regenerate`, `load_log`, `delete_log_entry`, `edit_log_entry`, `update_log_attachment`, `delete_log_attachment`, `delete_story_log`.
  - **Invariants**:
    - `create_from_selection` filters `[selection.ai_id, selection.user_id].filter(Boolean).map(String)` before string coercion and uses `selection.story_title || "New Story"` in both `db.stories.add` and `STORY_START`.
    - `resolve_log_entity_id` handles upper/lowercase `entity_snapshots` with a single `match_speaker_snapshots` call.
    - `regenerate` protects non-telemetry `is_prologue`, `is_epilogue`, and `STORY_START` entries from deletion.
    - `delete_log_entry` resolves `meta.id` via `_find_log_entry`.
    - `edit_log_entry` supports optional `meta` merging so `meta.think` persists to IndexedDB.
    - `delete_log_attachment` reuses `is_empty_narrative_message`.

- **`src/data/db.js`, `records.js`, `ledger.js`, `checkpoint.js`, `card-codec.js`, `exporters.js`, `index.js`**
  - **Invariants**: `db.js` contains only the Dexie instance and Story/Entity CRUD. `records.js`, `ledger.js`, and `exporters.js` import bracket/history utilities from `@simulation`. `src/data/index.js` re-exports `session.js`.

- **`src/media/image-generation.js`**
  - **Exports**: `IMAGE_TIERS`, `TIER_RESOLUTIONS`, `normalize_image_tier`, `get_resolution`, `get_resolution_string`, `get_tier_guidance_scale`, `find_image_engine`, `reset_cached_image_engine`, `dispatch_visual_generation`, `_in_flight_image_generations`, `_image_generation_queue`, `mark_generation_in_flight`, `clear_generation_in_flight`, `is_generation_in_flight`, `reset_generation_in_flight`, `get_image_generation_queue`, `reset_image_generation_queue`, `count_pending_ghosts`, `VisualEngine`, `visual_engine`.
  - **Invariants**: Plain `.js` module. `dispatch_visual_generation` uses `get_tier_guidance_scale(mode)`. Accepts `refine_prompt` or pre-refined prompt options directly from callers.

---

### Rank 3: `src/state/` (Reactive Svelte 5 Stores)

- **`src/state/interface.svelte.js`**
  - **Exports**: `InterfaceStore`, `app`, `image_preview`, `image_picker`.
  - **Invariants**: Zero `.svelte` component imports. Sibling stores increment `app.stories_version` directly.

- **`src/state/runtime.svelte.js`**
  - **Exports**: `RuntimeEngineStore`, `runtime`.
  - **Invariants**: Imports `app` and `simulation_log`/`chat` directly. Setting `this.is_ready = true` at the end of `sync()` does not trigger a redundant IndexedDB story writeback in `init_effects()`. `update_entity("story", id, data)` updates both `this.#story.by_id[id]` and `this.#story.by_id[coerce_story_key(id)]`. `#active_npcs` keys are normalized via `String(id)` across `sync`, `save_entity`, `update_entity`, and `delete_entity`. `director_p50_ms` and `director_p95_ms` share `#percentile(p)`.

- **`src/state/chat.svelte.js`**
  - **Exports**: `ChatLogStore`, `simulation_log` (`chat`), `session_driver`.
  - **Invariants**: `feed = $state([])` and `active_id = $state(null)` are Svelte 5 `$state` runes. Wraps `@data/session.js` so `log_message`, `send`, `regenerate`, `delete_entry`, `edit_entry`, `update_attachment`, and `delete_attachment` update both IndexedDB and `this.feed` in lockstep.

- **`src/state/devlog.svelte.js`**
  - **Exports**: `DEVELOPER_TELEMETRY_STORAGE_KEY`, `DeveloperLogStore`, `developer_log`.
  - **Invariants**: `flush()` and `#schedule_persist()` share persistence logic; `clear()` cancels any pending `#persist_timer`.

- **`src/state/streaming.svelte.js`**
  - **Exports**: `StreamingStore`, `streaming`.

- **`src/state/status.svelte.js`**
  - **Exports**: `SimulationStateStore` (`simulation_state`), `UIStateStore` (`ui_state`), `force_recover_simulation`, `install_freeze_watchdog`, `uninstall_freeze_watchdog`[cite: 9, 11].
  - **Invariants**: `force_recover_simulation` aborts `streaming.abort_controller` and calls `Audio.voice?.stop?.()` _before_ `streaming.end_stream()`[cite: 9, 11]. `install_freeze_watchdog` resets `ever_streamed = false` when `!stuck` or after recovery.

---

### Rank 4: `src/engine/` (LLM Runtime & Turn Orchestration)

`src/engine/index.js` is a pure, side-effect-free barrel export.

- **`src/engine/transport.js`**
  - **Exports**: `get_mock_message`, `create_stream_transport` (`create_live_stream_fn`), `get_transport`, `reset_transport`, `complete_text` (`generate_text`), `transform_text` (`enhance_text`).
  - **Invariants**: Single unified `run_completion` pipeline drives `streaming` (`@state`) when `!options.silent` and schedules via `enqueue_llm_job` (`@utils`). `invoke_with_retry` wires `generation.stop()` to `effective_signal` before awaiting `ai_engine`. `run_mock_generation` deduplicates `onToken`/`onChunk` and calls `streaming.end_stream()` in `finally` when `!options.silent`. `transform_text` normalizes `{ text, generatedText }` objects before `sanitize_llm`.

- **`src/engine/runner.js`**
  - **Exports (Stateless Steps)**: `run_planner_step` (`execute_turn_1_director`), `run_generation_step` (`execute_turn_2_character`), `continue_generation_step` (`execute_turn_2_continue`), `run_memory_consolidation_step` (`execute_turn_3_caretaker`), `run_image_prompt_step` (`execute_turn_visualizer`), `run_schema_extraction_step` (`execute_turn_structuring`), `generate_user_draft` (`execute_ghostwriter`).
  - **Exports (Stateful Orchestration)**: `run_round` (`execute_round`), `run_turn` (`execute_turn`), `continue_turn` (`execute_continue`), `write_back_turn_state`, `dispatch_consolidation` (`dispatch_caretaker_consolidation`), `persist_turn_rows`, `maybe_spawn_turn_image`, `reset_turn_scope_for_testing`.
  - **Invariants**:
    - `run_memory_consolidation_step` and `run_schema_extraction_step` share `run_caretaker_json_step`.
    - `generate_user_draft` passes `{ role: "user", text: input_text.trim() }` on the seed entry and streams `onChunk` incrementally once `</think>` closes.
    - `run_turn` and `continue_turn` share `stage_ai_speaker`.
    - Dynamics updates use `step_dynamics` (`@simulation`) without mutating `prev_dynamics` before `maybe_spawn_turn_image`.
    - `continue_turn` passes `{ think: fused_think }` to `simulation_log.edit_entry`.
    - `dispatch_consolidation` increments `runtime.back_shot_cursor` once.

- **`src/engine/lifecycle.js`**
  - **Exports**: `refine_image_prompt` (`execute_visualizer_envision`), `parse_entity_profile` (`structure_profile`), `generate_opening` (`execute_prologue`), `generate_closing` (`execute_epilogue`), `create_entity_with_profile` (`birth_entity_core`).
  - **Invariants**: Both `refine_image_prompt` and `parse_entity_profile` use `get_transport()` (preserving `signal` and `priority`). All imports use static barrels (`@media`, `@definitions`, `@simulation`). `generate_closing` normalizes entities before `compile_prompt`, passes resolved speaking style to `clean_generated_prose`, and wraps execution in `try/finally` so `streaming.end_stream()` always runs.

- **`src/engine/chrono.svelte.js`**
  - **Exports**: `ChronoEngine`, `chrono_engine` (`start`, `send`, `retry`, `continue`, `advance_turn`, `stop`).
  - **Invariants**: Uses `#is_busy()` and `#with_stream_lock(fn)`. Resets `this.error = null` on entry to every public action and records `this.error` on unhandled `advance_turn` errors. No redundant IIFE in `advance_turn`. Orphan-retry path in `advance_turn` increments `runtime.round`, calls `runtime.save()`, and returns `true`. `send()` returns `Boolean(result)`.

---

### Rank 5 & Tooling: `src/ui/`, `src/main.js` & Verification Gates

- **`src/main.js` & `src/ui/**`**: Zero bridge registration glue in `src/main.js`. All UI components and `src/ui/Profile.svelte.js` import directly from `@state`, `@engine`, `@simulation`, `@data`, `@media`, `@utils`, and `@definitions`.
- **`.agents/skills/local-scripts/scripts/rules/layers.js`**: `LAYER_HIERARCHY` enforces Ranks `0..5` (`src/ui: 5`, `src/engine: 4`, `src/state: 3`, `src/data: 2`, `src/media: 2`, `src/simulation: 1`, `src/definitions: 0`, `src/utils: 0`) and `ALIAS_LAYER_MAP` includes `@state`, `@simulation`, and `@definitions`.
- **`.agents/skills/local-scripts/scripts/hooks.js`**: `Planning Handoff Law` stop hook ignores pre-existing dirty files in `git status` when the session made zero writes to `src/`.
- **Build & Type Configs (`vite.config.js`, `vitest.config.js`, `jsconfig.json`, `types.d.ts`)**: Resolve aliases registered for `@simulation` (`./src/simulation`) and `@state` (`./src/state`).
- **`.agents/skills/simulation/scripts/sim-check.js` (& `.test.js`)**: Imports point to `@simulation` (`prompts.js`, `retrieval.js`, `dynamics.js`) and `@engine` (`runner.js`).
- **Gate Commands**: `npm run test:hooks` and `npm run verify` (`lint`, `audit:hygiene`, `audit:layers`, `audit:simulation`, `vitest run`, `vite build`) pass with 0 errors.
