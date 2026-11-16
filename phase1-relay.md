# Phase 1 relay — `src/utils/` unification (`tags.js` + `llm-sanitize.js`)

Unzip at repo root. Then `git rm src/data/parser.js` (deleted, only a pointer comment remains in its old barrel section). Run `npm run test`.

## What moved (old → new home)

From `src/data/parser.js` (DELETED):

| Name | New home |
| --- | --- |
| `parse_bracket_token`, `parse_brackets`, `parse_bracket_entries`, `apply_bracket_deltas`, `reconstruct_bracket_string` (internal), `extract_memory_candidates`, `extract_entity_relationships`, `format_clean_brackets`, `filter_epistemic_brackets`, `strip_bracket_engine_flags`, `parse_profile_json`, `clean_image_prompts`, `strip_covert_directives`, `safe_parse_pseudo_json`, `merge_prose_into_field`, `strip_visual_excluded`, `balance_brackets`, `has_bracket_bond`, `CLEAR_TOKENS`, `AGGREGATE_KEYS`, `VISUAL_EXCLUDED_KEYS`, `PHYSICAL_KEY_ALIASES`, `normalize_physical_entries`, `strip_leading_key_echo`, `CLOTHING_KEYS` | `src/utils/tags.js` (NEW) |
| `strip_cognition_blocks`, `extract_json_block`, `escape_unescaped_json_quotes`, `safe_parse_json`, `looks_truncated`, `raw_to_text`, `raw_stop_reason`, `sanitize_llm`, `parse_think_block`, `extract_reasoning_block` (think always `string`, never `null`) | `src/utils/llm-sanitize.js` (NEW) |

`src/utils/text.js` and `src/utils/xml.js` rewritten (moved blocks removed; text.js gains two NEW shared predicates `is_empty_narrative_message` / `is_telemetry_meta`, strip_cognition_blocks re-imported from llm-sanitize). `src/utils/index.js` gains `tags.js` + `llm-sanitize.js` barrels. `src/data/index.js` parser section replaced with a pointer comment.

## Caller rewiring (all in this zip, already applied — verify, don't re-do)

- `src/data/entities.js` — `format_clean_brackets` from `@utils`
- `src/data/db.js` — `is_empty_narrative_message, parse_bracket_entries` from `@utils` (static import; replaces dynamic `../data/parser.js`)
- `src/data/sessions.svelte.js` — `has_bracket_bond, is_empty_narrative_message, is_telemetry_meta` from `@utils` (shared predicates at all 3 sites)
- `src/engine/prompts.js` — `format_clean_brackets` from `@utils`
- `src/engine/runs.js` — `apply_bracket_deltas, parse_bracket_entries, parse_think_block` from `@utils`
- `src/engine/turns.js` — `parse_brackets, parse_think_block, safe_parse_json` from `@utils`
- `src/engine/lifecycle.js` — `parse_think_block` from `@utils` (dynamic `../data/parser.js` import dropped)
- `src/media/optics.js` — `CLEAR_TOKENS, CLOTHING_KEYS, …` from `@utils`
- `src/media/audio.svelte.js` — `strip_cognition_blocks` from `@utils`
- `src/ui/ChatBubble.svelte` — `parse_bracket_entries, parse_think_block, strip_bracket_engine_flags` from `@utils`
- `src/ui/Storymode.svelte` — `clean_image_prompts, filter_epistemic_brackets, parse_think_block, strip_covert_directives` from `@utils`
- `src/ui/RelationalGraph.svelte` — `extract_entity_relationships` from `@utils`
- `src/AGENTS.md` — bracket/text/epistemic bullets updated

## Behavior changes (encode in tests — all intentional)

1. `parse_think_block("")` / `(null)` → `think: ""` (was `think: null`).
2. `safe_parse_json` recovers unescaped newlines inside strings (was `null`).
3. `TagEntry` carries both `flags` and `visibility/weight/status` shapes.

## Test updates needed (tests live repo-side)

- DELETE `src/data/parser.test.js` → SPLIT into `src/utils/tags.test.js` + `src/utils/llm-sanitize.test.js` (re-point imports).
- `src/utils/text.test.js`: drop moved-fn cases; add predicate tests for the two new shared predicates.
- `src/utils/xml.test.js`: drop moved normalizer/CLOTHING cases (now in tags tests).
- Re-point any test importing moved names from old paths or `@data`.
- Port think-shape coverage: `parse_think_block` empty → `think === ""`.

## Verification done here (workspace)

- esbuild transform: 15/15 touched JS files OK.
- svelte compile: ChatBubble / Storymode / RelationalGraph / sessions.svelte.js all OK.
- 46-vector behavior baseline: 43 identical, exactly the 3 intended diffs above.
- Barrel bundle: all 34 moved names resolve from `@utils`, 0 remain on `@data`, `think_fixed` true, 0 warnings.
- Preview boots to storyboard, clean.
