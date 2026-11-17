# Implementation Plan: Ground-Up Engine, Simulation & State Refactor

## 1. Architectural Vision & Rule Upgrades

Instead of working around old layer rules with callback-injection shims (`registries.js`, `bind_session_driver`, `set_visualizer_envision_impl`, `register_speaking_rules`), we upgrade the layer hierarchy in `.agents/skills/local-scripts/scripts/rules/layers.js` to a strict, acyclic 6-Rank downward DAG (`Rank 5 -> Rank 0`):

```text
Rank 5: src/ui/          (@ui, @primitives — Svelte 5 View Components)
  ↓
Rank 4: src/engine/      (@engine — LLM Transport, Turn Runner, Lifecycle, Chrono)
  ↓
Rank 3: src/state/       (@state — Reactive Svelte 5 Stores: app, runtime, chat, status, streaming, devlog)
  ↓
Rank 2: src/data/        (@data — Pure Dexie Persistence: db, session, records, ledger, checkpoint, card-codec, exporters)
        src/media/       (@media — Pure Sensory/Plugin Dispatch: policy, image-generation, audio, motion)
  ↓
Rank 1: src/simulation/  (@simulation — Pure Simulation Logic: brackets, llm-output, history, dynamics, retrieval, prompts)
  ↓
Rank 0: src/definitions/ (@definitions — Declarative Style, Taxonomy, Premade & Rule Registries)
        src/utils/       (@utils — Pure Foundation: math, vectors, text, queue, resilience, xml, macros, html, onnx, embeddings)
        src/config.js    (@config — Frozen System Constants)
```

### Why This Ordering Solves Every Circular & Upward Import

1. **`@definitions` + `@utils` at Rank 0**:
   - Moving `palette.js` and `tokens.js` (pure generated design tokens and deterministic FNV color/label math) into `src/utils/` (or `@definitions`) breaks the `@definitions` ↔ `@media` cycle (`profile-taxonomy.js` importing `SIGNATURE_COLORS` from `@media`) and lets `src/simulation/prompts.js` (Rank 1) build entity aesthetic maps without importing `@media` (Rank 2).
   - Keeping `src/utils/vectors.js` and `src/utils/queue.js` in Rank 0 lets `src/utils/embeddings.svelte.js` (Rank 0), `src/simulation/retrieval.js` (Rank 1), `src/state/status.svelte.js` (Rank 3), and `src/engine/transport.js` (Rank 4) import vector math and queue status downward without upward leaks.
2. **`@simulation` at Rank 1 (Above `@definitions`, Below `@data` & `@media`)**:
   - `src/simulation/llm-output.js` imports `SPEAKING_STYLE_RULES`, `ANTI_AI_REPLACEMENTS`, and `TIER_2_CLUSTER_WORDS` directly from `@definitions` (Rank 0), eliminating the module-load `register_*` caches in `detox.js` and `styles.js`.
   - `src/data/` (`records.js`, `ledger.js`, `exporters.js`, `session.js`) and `src/media/` (`policy.js`, `image-generation.js`) at Rank 2 can freely import bracket parsers, history normalizers, and prompt builders from `@simulation` (Rank 1).
3. **`@state` at Rank 3 (Including `app.svelte.js`)**:
   - Moving `InterfaceStore` (`app`) from `src/ui/interface.svelte.js` into `src/state/app.svelte.js` (matching its own `@file src/state/interface.svelte.js` header) allows `src/engine/` (Rank 4) and sibling `@state` stores to import `app`, `runtime`, `chat`, `status`, `streaming`, and `devlog` directly—**eradicating `registries.js` (`state_bridge`, `stream_bridge`, `stories_bridge`), `bind_session_driver`, and `set_visualizer_envision_impl` completely**.

---

## 2. Target Folder Structure

- **`src/utils/` (Rank 0 — Pure Foundation, Vectors, Tokens & Queue)**
  - `math.js` *(scalar math, FNV-1a hashing, CSPRNG)*
  - `vectors.js` *(extracted from `math.js` + `engine/sieve.js` — L2-normalized `cosine_similarity`, Q8 quantization, serialization)*
  - `text.js` *(generic string helpers + unified `count_tokens` from `sieve.js`/`text.js`)*
  - `queue.js` *(unifies `utils/job-queue.js` + `engine/gate.js` — priority preemption + bounded worker queue)*
  - `resilience.js` *(retryer, circuit breaker, abort signals)*
  - `tokens.js` & `palette.js` *(moved from `src/media/` — pure design tokens & deterministic color/label resolvers)*
  - `embeddings.svelte.js`, `onnx.js`, `xml.js`, `macros.js`, `alternations.js`, `markdown.js`, `html.js`, `field-path.js`, `actions.js`, `ui-helpers.js` *(kept)*
  - ~~`tags.js`~~ *(moved → `src/simulation/brackets.js`)*
  - ~~`llm-sanitize.js`~~ *(moved → `src/simulation/llm-output.js`)*
  - ~~`detox.js`~~ & ~~`styles.js`~~ *(moved → `src/simulation/llm-output.js`)*
  - ~~`registries.js`~~ *(deleted — replaced by direct `@state` imports)*
  - ~~`job-queue.js`~~ *(merged → `src/utils/queue.js`)*
- **`src/definitions/` (Rank 0 — Declarative Catalogs)**
  - `dynamics-registry.js`, `narrative-styles.js`, `premades.js`, `profile-taxonomy.js`, `speaking-styles.js`, `visual-styles.js` *(kept — `register_*` side effects removed from `speaking-styles.js`)*
- **`src/simulation/` (Rank 1 — Pure Simulation Grammars, Dynamics, RAG & Unified Prompts)**
  - `brackets.js` *(from `src/utils/tags.js` + relational graph/bond helpers)*
  - `llm-output.js` *(from `src/utils/llm-sanitize.js` + `src/utils/detox.js` + `src/utils/styles.js` + `turns.js#extract_think_and_body`)*
  - `history.js` *(from `src/utils/text.js` history helpers + `turns.js` history/tempo/summary helpers + speaker matchers)*
  - `dynamics.js` *(from `src/engine/dynamics.js` + `runs.js#apply_director_deltas_to_dynamics` + `turns.js#resolve_caretaker_target`)*
  - `retrieval.js` *(from `src/engine/sieve.js` + `tags.js#extract_memory_candidates`)*
  - `prompts.js` *(single unified prompt file: `src/engine/prompts.js` + `src/engine/verifier.js` + `optics.js` aesthetic builders + `visual.svelte.js` beat prompt composition)*
  - `caretaker-compaction-template.md` & `fixtures.test-util.js` *(moved from `src/engine/`)*
- **`src/data/` (Rank 2 — Pure IndexedDB Persistence)**
  - `session.js` *(unifies `src/engine/sessions.svelte.js` DB logic + `src/data/db.js` Sections 3 & 4)*
  - `db.js` *(Dexie instance + Story & Entity CRUD)*
  - `records.js`, `ledger.js`, `checkpoint.js`, `card-codec.js`, `exporters.js` *(kept, importing `@simulation`)*
- **`src/media/` (Rank 2 — Image Policy, Dispatch & Sensory Output)**
  - `policy.js` *(from `optics.js` resolution/tier/trigger rules + `math.js#evaluate_image_trigger`)*
  - `image-generation.js` *(replaces `visual.svelte.js`, drops `.svelte.js` — Perchance plugin discovery, resilient dispatch, placeholder queue)*
  - `audio.svelte.js`, `motion.svelte.js`, `design.css` *(kept)*
  - ~~`optics.js`~~ *(split → `src/media/policy.js` + `src/simulation/prompts.js`)*
  - ~~`visual.svelte.js`~~ *(split → `src/media/image-generation.js` + `src/simulation/prompts.js`)*
- **`src/state/` (Rank 3 — Reactive Svelte 5 Stores)**
  - `app.svelte.js` *(moved from `src/ui/interface.svelte.js` + lightbox/picker state from `ImagePreview.svelte`)*
  - `runtime.svelte.js` *(from `src/engine/runtime.svelte.js`)*
  - `chat.svelte.js` *(from `src/engine/log.svelte.js` `SimulationLogStore` + reactive session pointer from `sessions.svelte.js`)*
  - `devlog.svelte.js` *(from `src/engine/log.svelte.js` `DeveloperLogStore`)*
  - `streaming.svelte.js` *(from `src/engine/status.svelte.js` `StreamingStore`)*
  - `status.svelte.js` *(from `src/engine/status.svelte.js` `SimulationStateStore` + `UIStateStore` + freeze watchdog)*
- **`src/engine/` (Rank 4 — LLM Transport, Turn Runner & Session Orchestration)**
  - `transport.js` *(unified streaming & direct LLM transport)*
  - `runner.js` *(merges `src/engine/turns.js` + `src/engine/runs.js` — stateless LLM steps + stateful turn/round/consolidation execution)*
  - `lifecycle.js` *(opening, closing, entity genesis, profile structuring, image prompt envisioning)*
  - `chrono.svelte.js` *(top-level turn & session lifecycle controller)*

---

## 3. Atom Deconstruction, Bug Upgrades & Re-Homing by File

### Rank 0: `src/utils/` & `src/definitions/`

#### 1. `src/utils/math.js`

- **Kept Atoms**: `clamp`, `get_percentage`, `HASH_OFFSET_BASIS`, `HASH_PRIME`, `fnv1a_hash`, `stable_pick`, `generate_uuid`, `generate_secure_seed`, `pick_random`.
- **Upgrades**: Fix `get_percentage(0)` returning `50` due to `value || 50` falsy coercion; use `Number.isFinite(Number(value)) ? clamp(Math.round(Number(value)), 0, 100) : 50`.
- **Moved Out**:
  - `cosine_similarity`, `serialize_embedding`, `deserialize_embedding`, `quantize_vector_q8`, `dequantize_vector_q8` → `src/utils/vectors.js`.
  - `evaluate_image_trigger` → `src/media/policy.js`.

#### 2. `src/utils/vectors.js` *(New — merges `math.js` vector atoms + `engine/sieve.js#cosine_similarity`)*

- **Atoms**: `cosine_similarity`, `serialize_embedding`, `deserialize_embedding`, `quantize_vector_q8`, `dequantize_vector_q8`.
- **Upgrades**: **Unify `cosine_similarity**`: Replace `math.js`'s dot-product-only version with `sieve.js`'s L2-norm-safe implementation (`dot / (Math.sqrt(normA) * Math.sqrt(normB))`) so unnormalized vectors never produce corrupt similarity scores.
- **Fix `serialize_embedding` TypedArray bug**: When passed a non-`Float32Array` `ArrayBufferView` (e.g., `Uint8Array`), compute `byteLength / 4` instead of passing `.length` as float count.

#### 3. `src/utils/text.js`

- **Kept Atoms**: `NAME_PREFIXES` (deduplicate dotted forms like `"mr."`), `NAME_PREFIX_STEMS`, `collapse_whitespace`, `truncate_at_word`, `truncate_at_boundary`, `count_tokens` (unified from `text.js#estimate_tokens` + `sieve.js#count_text_tokens`), `clean_text`, `indent_continuation`, `compute_initials`, `first_sentence`, `match_case`, `format_key_as_label`, `format_datetime`, `normalize_comma_spacing` (add null/type guard so `null`/`undefined` returns `""` instead of throwing `TypeError`), `match_keyword_pattern` (fix `catch` block on invalid regex so it falls through to literal/word matching as its comment claims), plus `export * from "./alternations.js"`.
- **Moved Out**:
  - `parse_relational_vector`, `format_relational_vector`, `derive_vector_title` → `src/simulation/brackets.js`.
  - `role_display_label`, `canonicalize_role`, `normalize_history_beat`, `is_narrative_role`, `collapse_history`, `filter_narrative_messages`, `format_history_entries`, `decompose_story_title`, `TELEMETRY_MESSAGE_TYPES`, `is_telemetry_meta`, `is_empty_narrative_message` → `src/simulation/history.js`.
- Remove `./xml.js` import (no longer needed in `text.js`).

#### 4. `src/utils/queue.js` *(Replaces `src/utils/job-queue.js` + `src/engine/gate.js`)*

- **Atoms**:
  - From `job-queue.js`: `CLEARED_RESULT`, `SUPERSEDED_RESULT`, `create_job_queue`.
  - From `gate.js`: `LLM_PRIORITY`, `enqueue_llm_job` (renamed from `run_llm_job`), `resolve_priority`, `get_queue_status` (renamed from `get_llm_gate_status`), `reset_queue_for_testing` (renamed from `_reset_gate_for_testing`).
- **Upgrades**: Fix `reset_queue_for_testing` so it aborts any `active_controller` and clears pending `preempt_active` `setTimeout` timers before zeroing state.

#### 5. `src/utils/resilience.js`

- **Atoms**: `merge_abort_signals`, `ExponentialBackoffRetryer`, `CircuitBreaker`.
- **Upgrades**:
  - In `CircuitBreaker.reset()`, reject any pending promises in `#queue` with an abort/reset error before setting `#queue.length = 0` so callers never hang forever.
  - In `ExponentialBackoffRetryer.retry()`, clamp `max_attempts = Math.max(1, ...)` so `max_attempts < 1` cannot throw `undefined`.
  - In `merge_abort_signals` fallback path, clean up the sibling `abort` listener when the first signal fires.

---

### Rank 1: `src/simulation/` (Pure Simulation Domain)

#### 6. `src/simulation/brackets.js` *(From `src/utils/tags.js` + relational vector helpers from `src/utils/text.js`)*

- **Merged & Upgraded Atoms**:
  - **Unify the 3 bracket parsers (`parse_bracket_token`, `parse_brackets`, `parse_bracket_entries`) into `parse_tagged_fields(text)**`:
    - Always track `{...}` alternation brace depth so pipes `|` and brackets `[`/`]` inside `{Option A|Option B}` never corrupt tokenization.
    - Support the complete union of flags on every token: `visibility` (`"hide"` for `hide`/`private`, `"show"` for `show`), `is_origin` (`origin`/`is_origin`), `weight` (`w: N`/`weight: N` clamped `1..10`, default `5`), `status` (`"superseded"`), `original_key`, `key` (uppercased), `value`, `raw`, `start_index`, `end_index`.
  - **Unify the 4 bracket formatters (`format_clean_brackets`, `filter_epistemic_brackets`, `strip_bracket_engine_flags`, `strip_visual_excluded`) into `format_tagged_fields(text, options)**`:
    - Options `{ perspective = "owner" | "other" | "vision" | "all", strip_keys = null, strip_flags = true, preserve_prose = false }` replace four separate backward-splicing and array-joining implementations, using `AGGREGATE_KEYS` and `VISUAL_EXCLUDED_KEYS` constants instead of hardcoded `"INVENTORY"`/`"STASH"` strings.
  - **Unify `apply_bracket_deltas` and `merge_prose_into_field` into `apply_tagged_field_deltas(existing_text, delta_text, options)**`:
    - Use `CLEAR_TOKENS` and `AGGREGATE_KEYS` consistently across both structured delta updates and prose field merges, and fix the broken `.replace(/[[]]/g, "")` regex on line 840 to `.replace(/[[\]]/g, "")`.
- **Pseudo-JSON & Physical Normalization**: `safe_parse_pseudo_json` (fix Tier 2 `"KEY": "VALUE"` to route through `_store_parsed_entry` so `CLEAR_TOKENS` and `AGGREGATE_KEYS` work across all tiers, and use local regex clone instead of mutating module-global `PSEUDO_JSON_KEY_REGEX.lastIndex`), `balance_brackets`, `normalize_physical_entries`, `strip_leading_key_echo`, plus constants `CLEAR_TOKENS`, `AGGREGATE_KEYS`, `VISUAL_EXCLUDED_KEYS`, `CLOTHING_KEYS`, `PHYSICAL_KEY_ALIASES`.
- **Relational Graph & Vector Helpers**: `extract_entity_relationships` (remove dead `entry.flags` check), `has_bracket_bond` (reuse `parse_tagged_fields` instead of ad-hoc regex), `parse_relational_vector`, `format_relational_vector`, `derive_vector_title`.

#### 7. `src/simulation/llm-output.js` *(From `src/utils/llm-sanitize.js` + `src/utils/detox.js` + `src/utils/styles.js` + `turns.js#extract_think_and_body`)*

- **Merged & Upgraded Atoms**:
  - **Unified Think-Block Parser (`parse_think_block(raw, start_with = "")`)**: Merges `llm-sanitize.js#parse_think_block` and `turns.js#extract_think_and_body` into a single function that reconciles prefilled `start_with` prefixes and returns `{ think, prose, content }`.
  - **LLM Output & JSON Recovery**: `strip_cognition_blocks`, `safe_parse_json`, `sanitize_llm`, `strip_covert_directives`.
  - **Prose Detox & Slop Auditing**: `clean_generated_prose` (from `detox_prose`, importing `SPEAKING_STYLE_RULES` and `ANTI_AI_REPLACEMENTS` directly from `@definitions` and deriving voice fallback order from `SPEAKING_STYLES`), `resolve_speaking_style`, `resolve_style`, `lint_narrative_slop`, `cap_somatic_markers`, `audit_macro_shape` (importing `TIER_2_CLUSTER_WORDS` directly from `@definitions`).
  - **P4 Dead Code Pruned**: Delete unused exports `extract_json_block`, `escape_unescaped_json_quotes`, `looks_truncated`, `raw_to_text`, `raw_stop_reason`, `parse_profile_json`, and delete `register_speaking_rules`, `register_anti_ai_rules`, `register_cluster_words`.

#### 8. `src/simulation/history.js` *(From `src/utils/text.js` + `src/engine/turns.js` + `sessions.svelte.js` + `log.svelte.js`)*

- **Merged & Upgraded Atoms**:
  - **Role & Beat Normalization**: `canonicalize_role` (absorbing `role_display_label` so `"prologue"`/`"epilogue"`/`"narrator"`/`"system"` map consistently), `is_narrative_role` (case-insensitive, excluding both `SYSTEM` and `telemetry`), `normalize_history_beat`, `collapse_history` (using `canonicalize_role` and `is_narrative_role` instead of hardcoded role strings), `filter_narrative_messages` (delegating to `is_empty_narrative_message` and `is_narrative_role`), `format_history_entries` (eliminating the double `strip_cognition_blocks` pass when `collapse = true`).
  - **Feed Reconstruction, Tempo & Turn Summary (from `turns.js`)**: `reconstruct_history_from_feed` (accepting both `.text` and `.content` so ghostwriter seed messages never drop), `calculate_turn_tempo`, `build_turn_summary`.
  - **Speaker Snapshot Matchers (from `sessions.svelte.js` & `log.svelte.js`)**: `match_speaker_snapshots` (supporting both uppercase `AI`/`USER`/`FRACTAL` and lowercase `ai`/`user`/`fractal` keys to fix the `story.entity_snapshots` lookup bug) and `resolve_entity_id_by_name`.
  - **Predicates & Story Title**: `is_telemetry_meta`, `is_empty_narrative_message`, `decompose_story_title`.

#### 9. `src/simulation/dynamics.js` *(Deconstructed, Upgraded & Wired from `src/engine/dynamics.js` + `runs.js` + `turns.js`)*

- **Merged & Upgraded Atoms**:
  - **`step_dynamics(current, baselines, deltas, { entropy = 50, min = 5, max = 95, jitter = false, scope = null })`** *(merges `reduce_dynamics`, `apply_dynamics_gravity`, `apply_director_deltas_to_dynamics`, and `compute_dynamics_deltas`)*:
    - Pure function (never mutates `current` in place, fixing the `prev_dynamics` bug in `maybe_spawn_turn_image`).
    - Uses nullish coalescing (`?? 50`) instead of `|| 50` (fixing the falsy `0` coercion bug).
    - Applies baseline gravity pull (`DYNAMICS.PHYSICS.GRAVITY` scaled by `entropy`, with optional stochastic `VARIANCE` when `jitter = true`) plus `deltas`, clamped to `[min, max]`.
    - Returns `{ next, diffs, log_strings }` in a single pass.
  - **`evaluate_dynamics_directives({ ai_dynamics, fractal_dynamics, style, manual_keywords = [], max_directives = 2 })`** *(merges `evaluate_subtext_protocols` and `evaluate_dynamics_rules`)*:
    - Single pass over `DYNAMICS_RULES` (from `@definitions`) + `style?.triggers`, returning `{ priority_directives, subtext_protocols }`.
  - **`extract_metric_baselines(entity)`** (from `extract_entity_dynamics_baselines`).
  - **`CARETAKER_ROTATION`** & **`resolve_caretaker_target(cursor_or_round, entities, use_cursor)`** (moved from `turns.js`).

#### 10. `src/simulation/retrieval.js` *(Deconstructed, Upgraded & Wired from `src/engine/sieve.js` + `tags.js#extract_memory_candidates`)*

- **Merged & Upgraded Atoms**:
  - `extract_memory_candidates(past_text)` (moved from `tags.js`).
  - `rank_memories(candidates, query_vector)` (from `score_and_rank_memories`, importing `cosine_similarity` from `@utils/vectors.js` and applying `ORIGIN_SCORE_MULTIPLIER = 1.5`).
  - `select_context_memories({ primary_memories, lore_memories, query_vector, total_budget_characters, guaranteed_floor_characters })` (from `two_tier_sieve_rag`, with `TOTAL_FIELD_FLOORS_CHARACTERS` and `FIELD_FLOORS.PAST`).
  - `create_vector_cache()` (from `create_ephemeral_vector_cache`, fixing the `set()` bug where updating an existing key at capacity still evicted the oldest entry: check `!store.has(id) && store.size >= MAX`).

#### 11. `src/simulation/prompts.js` *(Single Consolidated Prompt File: `engine/prompts.js` + `engine/verifier.js` + `optics.js` builders + `visual.svelte.js` beat composition)*

- **Part 1 — Narrative XML Prompt Compilation (from `engine/prompts.js`)**:
  - `PROMPT_ROLES` (`DIRECTOR`, `CARETAKER`, `CHARACTER`, `VISUALIZER`, deep-frozen via recursive freeze) + helper `render_task_envelope(round, thinking_options, body)` to eliminate the duplicated `<TASK round="...">` + `render_thinking_mode` boilerplate across `DIRECTOR`, `CARETAKER`, and `VISUALIZER`.
  - `render_thinking_mode`.
  - `compile_prompt({ core = "CHARACTER", round = 1, entities = {}, history = [], memories = null, style = null, task_options = {} })`:
  - **Bug Fix 1**: Normalize `String(core || "CHARACTER").toUpperCase()` so lowercase `"director"`, `"character"`, `"caretaker"`, or `"visualizer"` never silently fall back to `CHARACTER`.
  - **Bug Fix 2**: Honor counterpart appearance ordering (`[eter_phys, pres_phys]` when `is_counterpart` is true) and pass `strip_inventory: see_hidden === "none"` consistently for `npc` and `fractal.present`.
    - **Live Wiring 1 (Dynamics Rules)**: Automatically call `evaluate_dynamics_directives({ ai_dynamics: entities.AI?.dynamics, fractal_dynamics: entities.FRACTAL?.dynamics, style })` and inject active somatic/subtext directives into `<SCENARIO>` / `<TASK>`.
    - **Live Wiring 2 (Two-Tier Sieve RAG)**: When `memories` is not explicitly provided, automatically extract `past` memory candidates from `entities.AI`, `entities.USER`, and `entities.FRACTAL` via `extract_memory_candidates` and filter them through `select_context_memories` (`retrieval.js`).
    - **Live Wiring 3 (Verifier)**: In dev/test mode (`import.meta.env?.DEV || process.env?.VITEST`), validate compiled output via `verify_compiled_prompt`.
- **Part 2 — Structural XML Verification (from `engine/verifier.js`)**:
  - `extract_tag_sequence`, `verify_tag_balance`, `verify_system_envelope`, `verify_tag_order`, `verify_prompt_hygiene` (removing the empty `<think>` no-op `if` block), and `verify_compiled_prompt` (passing pre-computed `tags = extract_tag_sequence(promptText)` into `verify_tag_balance` and `verify_tag_order` so the regex only scans once).
- **Part 3 — Image & Diffusion Prompt Composition (from `optics.js`, `visual.svelte.js`, `llm-sanitize.js`, `turns.js`)**:
  - **Unified Diffusion Sanitizer (`sanitize_visual_text(text)`)**: Merges `visual.svelte.js#sanitize_visual_text`, `llm-sanitize.js#clean_image_prompts`, and `turns.js#sanitize_diffusion_text` into one function (rescuing JSON leftovers via `rescue_visual_prose`, stripping `@` from `@TARGET` tokens, removing `{`, `}`, `[`, `]`, and cleaning punctuation).
  - **Visual Trait & Beat Prompt Builders**: `ORDERED_VISUAL_STYLE_KEYS`, `resolve_visual_engine_tokens`, `build_aesthetic_map` (fixing the missing `_visual_style_texture` key), `flatten_aesthetic_map`, `extract_aesthetic_traits`, `render_optics_fallback`, `resolve_story_beat_style(options)` (accepting `{ style, app_style, fractal_style, entity }` as parameters instead of reading `state_bridge`), and `compose_story_beat_prompt` (reusing `resolve_visual_engine_tokens` instead of re-joining engine fields inline).

---

### Rank 2: `src/data/` & `src/media/` (Persistence & Sensory Dispatch)

#### 12. `src/data/session.js` *(Extracted from `src/engine/sessions.svelte.js` + `src/data/db.js` Sections 3 & 4)*

- **Pure IndexedDB Session & Log CRUD (zero Svelte runes, zero upward imports)**:
  - Session pointer & history: `SESSION_ID_KEY`, `get_active_session_id`, `require_active`, `set_active_session_id`, `clear_active_session_id`, `record_session_access`, `get_recent_sessions`.
  - Story session creation: `create_from_selection(selection)`:
    - **Bug Fix 1**: Filter `[selection.ai_id, selection.user_id].filter(Boolean).map(String)` *before* `String()` conversion so `undefined`/`null` are never added as literal `"undefined"`/`"null"` strings to `excluded_ids`.
    - **Bug Fix 2**: Use `selection.story_title || "New Story"` consistently in both `db.stories.add` and the `STORY_START` log entry.
  - Log CRUD & Regeneration: `_find_log_entry`, `resolve_log_entity_id` (fixing uppercase/lowercase `entity_snapshots` lookup and removing the duplicate `match_speaker_snapshots` call), `resolve_story_round`, `log_message` (replacing `append_log_entry`), `send`, `regenerate` (fixing `is_protected_init` check so non-telemetry `is_prologue`/`is_epilogue`/`STORY_START` rows are never deleted), `load_log` (replacing `get_story_log`), `delete_log_entry` (using `_find_log_entry` so `meta.id` references resolve properly), `edit_log_entry` (supporting optional `meta` merge so `execute_continue` and `execute_prologue` persist `meta.think` to IndexedDB), `update_log_attachment`, `delete_log_attachment` (reusing `is_empty_narrative_message`), `delete_story_log`.

#### 13. `src/media/policy.js` *(From `src/media/optics.js` + `src/utils/math.js#evaluate_image_trigger`)*

- **Atoms**: `IMAGE_TIERS`, `TIER_RESOLUTIONS`, `normalize_image_tier`, `get_resolution`, `get_resolution_string`, `get_tier_guidance_scale`, `evaluate_image_trigger` (fixing cross-entity axis loop so `from` and `to` are compared per-entity rather than across different entities), `resolve_image_trigger`.

#### 14. `src/media/image-generation.js` *(Replaces `src/media/visual.svelte.js`, drops `.svelte.js`)*

- **Atoms**:
  - Host engine discovery & resilient dispatch: `find_image_engine`, `reset_cached_image_engine`, `dispatch_visual_generation` (wired to `get_tier_guidance_scale(mode)` instead of hardcoded `guidance_scale = 7`).
  - In-flight & placeholder queue management: `_in_flight_image_generations`, `_image_generation_queue`, `mark_generation_in_flight`, `clear_generation_in_flight`, `is_generation_in_flight`, `reset_generation_in_flight`, `get_image_generation_queue`, `reset_image_generation_queue`, `count_pending_ghosts`.
  - `ImageService` (`visual_engine`): Prune dead fields (`is_loading`, `error`, `attempts`, `is_offline`) and unused `story_id` param in `visualize`. Accept an optional `refine_prompt` callback or pre-refined prompt options from `@engine` instead of boot-time `set_visualizer_envision_impl` mutation.

---

### Rank 3: `src/state/` (Reactive Svelte 5 Stores)

#### 15. `src/state/app.svelte.js` *(Moved from `src/ui/interface.svelte.js` + `ImagePreview.svelte` state)*

- **Atoms**: `InterfaceStore` (`app`), plus reactive `image_preview` and `image_picker` state extracted from `ImagePreview.svelte` so `app.svelte.js` has zero `.svelte` component imports.

#### 16. `src/state/runtime.svelte.js` *(From `src/engine/runtime.svelte.js`)*

- **Atoms**: `RuntimeEngineStore` (`runtime`).
- **Upgrades**:
  - Import `app` from `./app.svelte.js` and `chat` from `./chat.svelte.js` directly (deleting `get_app()` / `state_bridge.app`).
  - Fix `init_effects()` so setting `this.is_ready = true` at the end of `sync()` does not immediately trigger a redundant IndexedDB writeback of the story row that was just read.
  - Fix `update_entity("story", id, data)` so it updates both `this.#story.by_id[id]` and `this.#story.by_id[coerce_story_key(id)]` instead of mutating a throwaway `{}` object, and normalize `#active_npcs[String(id)]` keys consistently across `sync`, `save_entity`, `update_entity`, and `delete_entity`.
  - Deduplicate `director_p50_ms` and `director_p95_ms` percentile sorting into a single `#percentile(p)` helper, and prune the unused `acquire/release_foreground_generation` and `acquire/release_background_generation` methods.

#### 17. `src/state/chat.svelte.js` *(From `src/engine/log.svelte.js` `SimulationLogStore` + `sessions.svelte.js` reactive wrapper)*

- **Atoms**: `ChatLogStore` (`simulation_log` / `chat`) + `session_driver` facade:
  - Owns reactive `feed = $state([])` and `active_id = $state(null)` (upgrading `_active_id` from a non-reactive `let` variable to a true Svelte 5 `$state` rune).
  - Wraps `src/data/session.js` directly so `log_message`, `send`, `regenerate`, `delete_entry`, `edit_entry`, `update_attachment`, and `delete_attachment` update both IndexedDB and `this.feed` in one place (fixing the bug where `delete_attachment` didn't update `this.feed`, and eliminating `bind_session_driver`).
  - Prune dead `get_recent_window` method.

#### 18. `src/state/devlog.svelte.js` *(From `src/engine/log.svelte.js` `DeveloperLogStore`)*

- **Atoms**: `DEVELOPER_TELEMETRY_STORAGE_KEY`, `DeveloperLogStore` (`developer_log`).
- **Upgrades**:
  - Deduplicate the `db.kv_settings.put(...)` persistence block between `flush()` and `#schedule_persist()`.
  - Clear any pending `#persist_timer` inside `clear()` so a debounced timer cannot overwrite `kv_settings` 500ms after `clear()` is called.

#### 19. `src/state/streaming.svelte.js` *(From `src/engine/status.svelte.js` `StreamingStore`)*

- **Atoms**: `StreamingStore` (`streaming`).

#### 20. `src/state/status.svelte.js` *(From `src/engine/status.svelte.js`)*

- **Atoms**: `SimulationStateStore` (`simulation_state`), `UIStateStore` (`ui_state`), `force_recover_simulation`, `install_freeze_watchdog` (importing `get_queue_status` from `@utils/queue.js` and `streaming` from `./streaming.svelte.js`).
- **Upgrades**:
  - In `force_recover_simulation`: abort `streaming.abort_controller` and call `Audio.voice?.stop?.()` *before* calling `streaming.end_stream()`, so a hung stream doesn't flush remaining TTS audio on recovery, and remove the redundant post-`complete()` / post-`end_stream()` assignments.
  - In `install_freeze_watchdog`: reset `ever_streamed = false` when `!stuck` or after recovery so `ever_streamed` doesn't stay latched `true` forever after Turn 1, and add `uninstall_freeze_watchdog()` for clean test teardown.

---

### Rank 4: `src/engine/` (LLM Runtime & Turn Orchestration)

#### 21. `src/engine/transport.js`

- **Atoms**: `get_mock_message`, `create_stream_transport` (`create_live_stream_fn`), `get_transport`, `reset_transport`, `complete_text` (`generate_text`), `transform_text` (`enhance_text`).
- **Upgrades**:
  - Unify `transport_completion` and `direct_completion` into a single `run_completion` pipeline that talks directly to `streaming` (`@state`) when `!options.silent`.
  - Fix `invoke_with_retry` so `generation.stop()` is wired to `effective_signal` *before* awaiting the promise (fixing the dead `generation?.stop` branch).
  - Fix `run_mock_generation` to deduplicate `onToken`/`onChunk` and call `streaming.end_stream()` in `finally` when `!options.silent`.
  - Fix `transform_text` (`enhance_text`) to normalize `{ text, generatedText }` objects before calling `sanitize_llm`.

#### 22. `src/engine/runner.js` *(Merges `src/engine/turns.js` + `src/engine/runs.js`)*

- **Section 1 — Stateless LLM Step Executors (from `turns.js`)**:
  - `run_planner_step` (`execute_turn_1_director`), `run_generation_step` (`execute_turn_2_character`), `continue_generation_step` (`execute_turn_2_continue`, reusing `parse_think_block(raw, start_with)`), `run_memory_consolidation_step` (`execute_turn_3_caretaker`), `run_image_prompt_step` (`execute_turn_visualizer`), `run_schema_extraction_step` (`execute_turn_structuring`, sharing a common `run_caretaker_json_step` helper with `run_memory_consolidation_step`), and `generate_user_draft` (`execute_ghostwriter`, fixing `{ role: "user", text: input_text.trim() }` and fixing the `onChunk` `<think>` streaming state machine so chunks stream incrementally once `</think>` closes).
- **Section 2 — Stateful Turn & Consolidation Orchestration (from `runs.js` + `execute_round`)**:
  - `run_round` (`execute_round`), `run_turn` (`execute_turn`), `continue_turn` (`execute_continue`), `write_back_turn_state`, `dispatch_consolidation` (`dispatch_caretaker_consolidation`), `persist_turn_rows`, `maybe_spawn_turn_image`, `reset_turn_scope_for_testing`.
- **Upgrades**:
  - Deduplicate `stage_ai_speaker` between `run_turn` and `continue_turn`.
  - Replace `apply_director_deltas_to_dynamics` with `step_dynamics` from `@simulation/dynamics.js`, keeping `prev_dynamics` unmutated so `maybe_spawn_turn_image` evaluates true pre-turn vs. post-turn dynamics.
  - In `continue_turn`, pass `{ think: fused_think }` to `simulation_log.edit_entry` so `meta.think` is persisted to IndexedDB.
  - Deduplicate the `runtime.back_shot_cursor` increment in `dispatch_consolidation`.

#### 23. `src/engine/lifecycle.js`

- **Atoms**: `refine_image_prompt` (`execute_visualizer_envision`), `parse_entity_profile` (`structure_profile`), `generate_opening` (`execute_prologue`), `generate_closing` (`execute_epilogue`), `create_entity_with_profile` (`birth_entity_core`).
- **Upgrades**:
  - Replace both inline `live_transport` wrappers in `refine_image_prompt` and `parse_entity_profile` with `get_transport()` (fixing the dropped `signal` and `priority` in `parse_entity_profile`).
  - Replace all relative dynamic imports (`../media/optics.js`, `../definitions/visual-styles.js`, `../media/visual.svelte.js`, `../utils/detox.js`) with static barrel imports (`@media`, `@definitions`, `@simulation`).
  - Remove dead `_ai_quadrant` in `generate_opening`, normalize entities before `compile_prompt` in `generate_closing`, pass resolved entity speaking style into `clean_generated_prose`, and wrap `generate_closing` in `try/finally` so `streaming.end_stream()` always runs.

#### 24. `src/engine/chrono.svelte.js`

- **Atoms**: `ChronoEngine`, `chrono_engine` (`start`, `send`, `retry`, `continue`, `advance_turn`, `stop`).
- **Upgrades**:
  - Extract `#is_busy()` and `#with_stream_lock(fn)` helpers to eliminate the 4x duplicated busy-guards and duplicated `AbortController`/`streaming`/`loading`/`intent_active` setup/teardown blocks across `start`, `send`, `retry`, `continue`, and `advance_turn`.
  - Reset `this.error = null` at the start of every public action and set `this.error` on unhandled `advance_turn` failures.
  - Remove the redundant `return (async () => { ... })()` wrapper in `advance_turn`.
  - Fix the orphan-retry success path in `advance_turn` so it advances `runtime.round`, calls `runtime.save()`, and returns `true`, and make `send()` return `Boolean(result)` so non-abort failures return `false` instead of `true`.

---

## 4. Tooling, Gate & Verification Plan

1. **Fix Subagent Stop Hook (`.agents/skills/local-scripts/scripts/hooks.js`)**:
    - Guard the `Planning Handoff Law` stop hook so read-only subagents (or sessions that made 0 writes to `src/`) are never blocked by pre-existing uncommitted files in `git status`.
2. **Update Layer Gate (`.agents/skills/local-scripts/scripts/rules/layers.js`)**:
    - Update `LAYER_HIERARCHY` to:

        ```js
        export const LAYER_HIERARCHY = Object.freeze({
        "src/ui": 5,
        "src/engine": 4,
        "src/state": 3,
        "src/data": 2,
        "src/media": 2,
        "src/simulation": 1,
        "src/definitions": 0,
        "src/utils": 0,
        });
        ```
        
    - Add `"@state": "src/state"`, `"@simulation": "src/simulation"`, and `"@definitions": "src/definitions"` to `ALIAS_LAYER_MAP`.
3. **Update Build & IDE Aliases (`vite.config.js`, `vitest.config.js`, `jsconfig.json`, `types.d.ts`)**:
    - Register `@simulation` (`./src/simulation`) and `@state` (`./src/state`).
4. **Update Simulation Check Gate (`.agents/skills/simulation/scripts/sim-check.js` & `sim-check.test.js`)**:
    - Point imports to `@simulation` (`prompts.js`, `retrieval.js`, `dynamics.js`) and `@engine` (`runner.js`).
5. **Run Full Verification Suite**:
    - Execute `npm run test:hooks` and `npm run verify` (`lint`, `audit:hygiene`, `audit:layers`, `audit:simulation`, `vitest run`, and `vite build`) to verify 0 errors across the entire repository.
