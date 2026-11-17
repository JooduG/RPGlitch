# Stage 2: Pure Atom Inventory

## 1. LLM Transport & Job Scheduling
- **`enqueue_llm_job(run, priority)`**, **`resolve_priority(name)`**, **`get_queue_status()`**: Priority queue (`FOREGROUND`, `BACKGROUND`) with `AbortController` preemption of background jobs.
- **`create_stream_transport()`**: Lazily resolves host text-generation engine (or mock fallback), wraps `enqueue_llm_job`, and normalizes response text.
- **`complete_text(payload, options)`**, **`transform_text(payload)`**: Direct completions with signal merging and output sanitization.
- **`ExponentialBackoffRetryer`**, **`CircuitBreaker`**, **`merge_abort_signals`**: Resilience primitives.

## 2. Prompt Compilation & Validation
- **`PROMPT_ROLES`** (`PLANNER`, `CONSOLIDATOR`, `GENERATOR`, `IMAGE_PROMPT`): Role definitions (`identity`, `visibility_scope`, `start_with`, `resolve_identity_text`, `task_block`).
- **`compile_prompt({ role, round, entities, history, memories, task_options })`**: Compiles the structured XML prompt spine (`<SYSTEM>`, `<REALITY>`, `<CHARACTERS>`, `<SCENARIO>`, `<TRAJECTORY>`, `<HISTORY>`, `<TASK>`).
- **`extract_tag_sequence`**, **`verify_tag_balance`**, **`verify_system_envelope`**, **`verify_tag_order`**, **`verify_prompt_hygiene`**, **`verify_compiled_prompt`**: Structural XML/tag prompt validation.

## 3. Turn Execution & Session Orchestration
- **`SessionController`**: Top-level lifecycle controller (`start`, `send`, `retry`, `continue`, `advance_turn`, `stop`).
- **`run_turn(user_input, options)`**, **`continue_turn(target_entry, options)`**: Acquires turn mutex, builds normalized entity context and history, executes generation, persists rows, writes back state, and triggers background side effects.
- **`run_round(...)`**: Runs `run_planner_step` (if enabled) followed by `run_generation_step`.
- **`run_memory_consolidation_step(...)`**, **`dispatch_consolidation(...)`**: Background round-robin (`consolidation_cursor`) state/memory update and ledger diff recording.
- **`generate_opening(session_id)`**, **`generate_closing(session_id, status)`**, **`create_entity_with_profile(type, draft, options)`**: Session and entity lifecycle flows.
- **`generate_user_draft(...)`**: Inverted-cast draft generation for user input.

## 4. State, Persistence & Telemetry Stores
- **`SessionStateStore`**: Reactive state for active entities (`active_user`, `active_ai`, `active_environment`, `active_npcs`), `round`, metrics, `consolidation_cursor`, `is_ready`, foreground/background mutexes, and reactive auto-save.
- **`MessageLogStore`**: Reactive `feed` with ID deduplication (`refresh`, `add`, `update`, `remove`, `delete_entry`, `edit_entry`, `clear`).
- **`DebugLogStore`**: Reactive diagnostic log with debounced persistence and page-hide flush.
- **`SimulationStatusStore`**, **`UIStateStore`**, **`StreamingStore`**: Phase (`idle` | `generating` | `locked`), `intent_active`, `generating_entity_*`, audio-coupled streaming, `force_recover_simulation`, `install_freeze_watchdog`.
- **`session_repository`**: IndexedDB persistence for active session ID, session creation, message logging, regeneration rollback, and log/attachment CRUD.
- **`state_bridge`**, **`stream_bridge`**, **`stories_bridge`**: Cross-layer dependency-injection cells.

## 5. Metrics & Rules
- **`update_metrics`**, **`apply_metric_decay`**, **`extract_metric_baselines`**, **`compute_metric_deltas`**: Deterministic/stochastic metric updates, baseline pull, and scoped diffing.
- **`evaluate_prompt_directives`**, **`evaluate_metric_rules`**: Rule-based prompt directive evaluation.

## 6. Memory Retrieval & Vector Math
- **`count_text_tokens`**, **`create_vector_cache`**, **`rank_memories`**, **`select_context_memories`**: Token counting, FIFO embedding cache, relevance ranking, and two-tier budget selection.
- **`cosine_similarity`**, **`serialize_embedding`**, **`deserialize_embedding`**, **`quantize_vector_q8`**, **`dequantize_vector_q8`**: Vector math and quantization.
- **`clamp`**, **`get_percentage`**, **`fnv1a_hash`**, **`stable_pick`**, **`generate_uuid`**, **`generate_secure_seed`**, **`pick_random`**: General math, hashing, and CSPRNG utilities.

## 7. Text, Tag Parsing & Prose Cleanup
- **`parse_tagged_fields`**, **`format_tagged_fields`**, **`apply_tagged_field_deltas`**, **`parse_key_value_blocks`**, **`merge_prose_into_field`**, **`balance_brackets`**, **`has_entity_bond`**, **`extract_entity_relationships`**, **`extract_memory_candidates`**, **`normalize_physical_entries`**: Structured `[KEY: VALUE | flags]` parsing, filtering, and merging.
- **`strip_cognition_blocks`**, **`safe_parse_json`**, **`sanitize_llm`**, **`parse_think_block`**, **`clean_image_prompts`**, **`strip_covert_directives`**, **`clean_generated_prose`**: LLM output sanitization and prose cleanup.
- **`canonicalize_role`**, **`normalize_history_beat`**, **`collapse_history`**, **`filter_narrative_messages`**, **`format_history_entries`**, **`is_telemetry_meta`**, **`is_empty_narrative_message`**, **`decompose_story_title`**, **`truncate_at_word`**, **`truncate_at_boundary`**, **`collapse_whitespace`**, **`estimate_tokens`**, **`first_sentence`**, **`match_case`**, **`format_key_as_label`**, **`format_datetime`**: History normalization and text formatting.

## 8. Image Prompting, Dispatch & Queue
- **`IMAGE_TIERS`**, **`normalize_image_tier`**, **`get_resolution`**, **`get_resolution_string`**, **`get_tier_guidance_scale`**, **`resolve_image_trigger`**, **`resolve_visual_engine_tokens`**, **`build_aesthetic_map`**, **`flatten_aesthetic_map`**, **`extract_aesthetic_traits`**, **`render_optics_fallback`**: Image tier configuration, trigger arbitration, and trait extraction.
- **`ImageService`**, **`rescue_visual_prose`**, **`sanitize_visual_text`**, **`resolve_story_beat_style`**, **`compose_story_beat_prompt`**, **`find_image_engine`**, **`dispatch_visual_generation`**, **`enqueue_image_generation`**, **`cleanup_stale_placeholders`**: Image prompt composition, host engine dispatch, and background placeholder queue.
