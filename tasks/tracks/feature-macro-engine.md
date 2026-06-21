---
id: feature-macro-engine
status: active
created: 2026-06-21
description: Universal Macro Parsing Engine and Enhance Profile Feature
---

# ETERNAL

## Objective

Implement a Universal Macro Parsing Engine that supports contextual scoping (`{{me}}`, `{{you}}`, `{{fractal}}`, `{{char}}`, `{{user}}`) for entity definitions. Add an "Enhance Profile" feature to the UI that utilizes the Macro Preservation Protocol to safely categorize and generate entity fragments without destroying macro placeholders. Allow for character import parsing using the same enhancement logic.

## Success Criteria

- JIT Compilation in `prompts.js` successfully replaces macros correctly based on the owning entity.
- "Enhance" mode successfully instructs the AI to preserve macros based on the entity type.
- Legacy `{{char}}` and `{{user}}` are supported alongside the new intuitive `{{me}}` and `{{you}}` syntax.

## Boundaries

- Do NOT perform global string replacements of macros across the entire compiled prompt. Replace contextually per-entity.
- Do NOT permanently overwrite macros with hardcoded names during the Enhance/Import phase.
- Maintain Svelte 5 Rune reactivity guidelines for any UI additions.

## FUTURE

## Phase 1: The JIT Macro Parser

- `[x]` `[RED]` Add unit tests for `parse_macros` context scoping in `prompts.test.js`.
- `[x]` `[GREEN]` Implement `parse_macros` in `prompts.js` within `create_render_atom` or at the field extraction layer.
- `[x]` `[REFACTOR]` Ensure backwards compatibility and performance.

## Phase 2: Macro Preservation Protocol

- `[x]` `[RED]` Add tests verifying the correct `<MACRO_PROTOCOL>` injection based on entity type.
- `[x]` `[GREEN]` Update `render_enhancement()` in `prompts.js` to dynamically inject the `<MACRO_PROTOCOL>`.
- `[x]` `[REFACTOR]` Clean up prompt structures.

## Phase 3: Enhance Profile UI

- `[x]` `[RED]` Write test for Enhance button state and dialog trigger.
- `[x]` `[GREEN]` Add "Enhance" button to `Profile.svelte` (bottom next to Save/Delete) with an overwrite warning dialog. Wire to `build_enhancement()`.
- `[x]` `[REFACTOR]` Apply Chalk Regime styles and ensure correct visual states.

## Phase 4: Universal Import Pipeline

- `[x]` `[RED]` Write test for `build_sort_prompt` generating correct schemas based on `fragments.js`.
- `[x]` `[GREEN]` Implement `build_sort_prompt` in `prompts.js`. Build UI buttons in `UnifiedConsole.svelte` (Storyboard section) for Import Character / Fractal / Both.
- `[x]` `[REFACTOR]` Consolidate error handling and parallelize the "Import Both" function.
