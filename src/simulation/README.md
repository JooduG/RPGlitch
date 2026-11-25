# Simulation Core (`src/simulation/`)

## Overview

Rank 1 deterministic simulation domain (`@simulation`) housing pure bracket/pseudo-JSON parsing, dynamics math, narrative history normalization, LLM output scrubbing/slop linting, two-tier RAG memory selection, and XML/diffusion prompt compilation. Has zero Svelte runes and zero upward imports.

## Interface

- [`index.js`](./index.js): Rank 1 `@simulation` barrel re-exporting all modules below.
- [`brackets.js`](./brackets.js):
  - `parse_tagged_fields`, `format_tagged_fields`, `apply_tagged_field_deltas`, `extract_entity_relationships`, `has_bracket_bond`
  - `safe_parse_pseudo_json`, `parse_relationship_brackets`
  - Constants: `CLEAR_TOKENS`, `VISUAL_EXCLUDED_KEYS`, `CLOTHING_KEYS`
- [`dynamics.js`](./dynamics.js): `step_dynamics`, `evaluate_dynamics_directives`, `resolve_caretaker_target`, `evaluate_image_trigger`, `resolve_image_trigger`.
- [`history.js`](./history.js): `canonicalize_role`, `normalize_history_beat`, `is_narrative_role`, `filter_narrative_messages`, `decompose_story_title`, `calculate_turn_tempo`, `build_turn_summary`, `reconstruct_history_from_feed`, `match_speaker_snapshots`, `is_telemetry_meta`, `is_empty_narrative_message`.
- [`llm-output.js`](./llm-output.js): `strip_cognition_blocks`, `safe_parse_json`, `sanitize_llm`, `strip_covert_directives`, `parse_think_block`, `clean_generated_prose`, `resolve_speaking_style`, `clean_image_prompts`, `sanitize_visual_text`.
- [`prose.js`](./prose.js): `render_think_html`, `parse_message`.
- [`retrieval.js`](./retrieval.js): `extract_memory_candidates`, `rank_memories`, `select_context_memories`.
- [`prompts.js`](./prompts.js): `PURPOSE_CORES`, `compile_prompt`, `resolve_image_resolution`, `get_resolution_string`, `get_tier_guidance_scale`, `extract_aesthetic_traits`, `resolve_story_beat_style`, `compose_story_beat_prompt`.

## Invariants

- **Pipe-Safe Alternations (`brackets.js:parse_tagged_fields`)**: Pipes inside `{Option A | Option B}` alternation scopes never split metadata flags; weights clamp to `[1, 10]` and keys normalize to uppercase.
- **Epistemic & Visual Filtering (`brackets.js:format_tagged_fields`)**: Drops `VISUAL_EXCLUDED_KEYS` when `visual_only=true` and excises `| hide` entries when `see_hidden === "none"` or (`see_hidden === "own"` and `is_counterpart`).
- **Delta Merging (`brackets.js:apply_tagged_field_deltas`)**: Single-value keys overwrite while preserving `| hide` unless explicitly overridden; aggregate keys (`INVENTORY`, `STASH`) and `@`-keys deduplicate case-insensitively; `CLEAR_TOKENS` delete keys (`[CLOTHING: <clear>]` purges all `CLOTHING_KEYS`); output caps at trailing `2000` characters.
- **Pure Dynamics (`dynamics.js:step_dynamics`, `evaluate_image_trigger`)**: Never mutates inputs; returns frozen next values clamped to `[min, max]` (default `[5, 95]`). `evaluate_image_trigger` compares each entity strictly against its own previous axis values.
- **RAG Origin Weighting (`retrieval.js:rank_memories`)**: Applies `ORIGIN_SCORE_MULTIPLIER` (`1.5x`) to `is_origin` memories and `0.5` fallback similarity to unvectorized items.
- **Prompt Compilation (`prompts.js:compile_prompt`)**: Normalizes `core` to uppercase; `memories == null` triggers RAG assembly while an explicit array (including `[]`) is used as-is; history caps at `TEMPO_ROUNDS.STANDARD`; dev/test verification is read-only and never throws.

## Side Effects

- `dynamics.js:step_dynamics` invokes `Math.random()` only when `jitter=true`.

## Verification

- Run simulation tests: `npm test` (or `npx vitest run src/simulation/`)
- Run prompt/simulation gate: `npm run audit:simulation`
