# Simulation Core (`src/simulation/`)

## Overview

Rank 1 deterministic simulation domain (`@simulation`) housing pure bracket/pseudo-JSON parsing, dynamics math, narrative history normalization, LLM output scrubbing/slop linting, two-tier RAG memory selection, and XML/diffusion prompt compilation. Has zero Svelte runes and zero upward imports.

## Interface

- [`index.js`](./index.js): Rank 1 `@simulation` barrel re-exporting all modules below.
- [`brackets.js`](./brackets.js):
  - `parse_tagged_fields`, `format_tagged_fields`, `apply_tagged_field_deltas`, `extract_entity_relationships`, `has_bracket_bond`
  - `safe_parse_pseudo_json`, `balance_brackets`, `strip_leading_key_echo`, `normalize_physical_entries`
  - `parse_relational_vector`, `format_relational_vector`, `derive_vector_title`, `parse_relationship_brackets`
  - Constants: `CLEAR_TOKENS`, `AGGREGATE_KEYS`, `VISUAL_EXCLUDED_KEYS`, `CLOTHING_KEYS`, `PHYSICAL_KEY_ALIASES`
- [`dynamics.js`](./dynamics.js): `step_dynamics`, `extract_metric_baselines`, `evaluate_dynamics_directives`, `CARETAKER_ROTATION`, `resolve_caretaker_target`, `evaluate_image_trigger`.
- [`history.js`](./history.js): `role_display_label`, `canonicalize_role`, `normalize_history_beat`, `is_narrative_role`, `collapse_history`, `filter_narrative_messages`, `format_history_entries`, `decompose_story_title`, `calculate_turn_tempo`, `build_turn_summary`, `reconstruct_history_from_feed`, `match_speaker_snapshots`, `resolve_entity_id_by_name`, `is_telemetry_meta`, `is_empty_narrative_message`.
- [`llm-output.js`](./llm-output.js): `strip_cognition_blocks`, `safe_parse_json`, `sanitize_llm`, `strip_covert_directives`, `parse_think_block`, `first_sentence`, `clean_generated_prose`, `SLOP_PATTERNS`, `lint_narrative_slop`, `cap_somatic_markers`, `resolve_speaking_style`, `audit_macro_shape`.
- [`retrieval.js`](./retrieval.js): `TOTAL_FIELD_FLOORS_CHARACTERS` (`1700`), `extract_memory_candidates`, `create_vector_cache`, `rank_memories`, `select_context_memories`.
- [`prompts.js`](./prompts.js): `PURPOSE_CORES`, `render_thinking_mode`, `compile_prompt`, `extract_tag_sequence`, `verify_tag_balance`, `verify_system_envelope`, `verify_tag_order`, `verify_prompt_hygiene`, `verify_compiled_prompt`, `clean_image_prompts`, `rescue_visual_prose`, `sanitize_visual_text`, `IMAGE_TIERS`, `TIER_RESOLUTIONS`, `normalize_image_tier`, `get_resolution`, `resolve_image_resolution`, `get_resolution_string`, `get_tier_guidance_scale`, `resolve_image_trigger`, `ORDERED_VISUAL_STYLE_KEYS`, `resolve_visual_engine_tokens`, `build_aesthetic_map`, `flatten_aesthetic_map`, `extract_aesthetic_traits`, `render_optics_fallback`, `resolve_portrait_visual_style_key`, `resolve_story_beat_style`, `compose_story_beat_prompt`.

## Invariants

- **Pipe-Safe Alternations (`brackets.js:parse_tagged_fields`)**: Pipes inside `{Option A | Option B}` alternation scopes never split metadata flags; weights clamp to `[1, 10]` and keys normalize to uppercase.
- **Epistemic & Visual Filtering (`brackets.js:format_tagged_fields`)**: Drops `VISUAL_EXCLUDED_KEYS` when `visual_only=true` and excises `| hide` entries when `see_hidden === "none"` or (`see_hidden === "own"` and `is_counterpart`).
- **Delta Merging (`brackets.js:apply_tagged_field_deltas`)**: Single-value keys overwrite while preserving `| hide` unless explicitly overridden; `AGGREGATE_KEYS` and `@`-keys deduplicate case-insensitively; `CLEAR_TOKENS` delete keys (`[CLOTHING: <clear>]` purges all `CLOTHING_KEYS`); output caps at trailing `2000` characters.
- **Pure Dynamics (`dynamics.js:step_dynamics`, `evaluate_image_trigger`)**: Never mutates inputs; returns frozen next values clamped to `[min, max]` (default `[5, 95]`). `evaluate_image_trigger` compares each entity strictly against its own previous axis values.
- **Single-Pass History Collapse (`history.js:collapse_history`)**: Strips cognition blocks once so `format_history_entries` does not re-strip collapsed entries.
- **Somatic Cap (`llm-output.js:lint_narrative_slop`)**: `SOMATIC_MARKER_CAP` is fixed at `1` per turn.
- **RAG Caps & Origin Weighting (`retrieval.js`)**: `create_vector_cache` evicts FIFO at `max_entries` (default `200`). `rank_memories` applies `ORIGIN_SCORE_MULTIPLIER` (`1.5x`) to `is_origin` memories and `0.5` fallback similarity to unvectorized items.
- **Prompt Compilation (`prompts.js:compile_prompt`)**: Normalizes `core` to uppercase; `memories == null` triggers RAG assembly while an explicit array (including `[]`) is used as-is; history caps at `TEMPO_ROUNDS.STANDARD`; dev/test verification is read-only and never throws.

## Side Effects

- `dynamics.js:step_dynamics` invokes `Math.random()` only when `jitter=true`.
- `retrieval.js:create_vector_cache` mutates the internal `Map` on the returned cache instance via `set`, `delete`, and `clear`.
- `prompts.js:compile_prompt` calls `console.warn` in dev/test mode when `verify_compiled_prompt` fails.

## Verification

- Run simulation tests: `npm test` (or `npx vitest run src/simulation/`)
- Run prompt/simulation gate: `npm run audit:simulation`
