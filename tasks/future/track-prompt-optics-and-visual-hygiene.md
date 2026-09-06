---
name: track-prompt-optics-and-visual-hygiene
description: Prompt optics harmonization, sensory architecture, affirmative visual protocols, and dynamic state hygiene
status: queued
last_synchronized: 2026-09-06
references: scrobbles.md, scribbles.md
---

# 🎯 Track: Prompt Optics Harmonization, Sensory Architecture & Dynamic Visual Hygiene

## 1.0 Vision & High-Level Architecture

Clean up, streamline, and harmonize the prompt generation cortex across `src/media/` and `src/intelligence/prompts/` based on live testing forensic analysis in `scrobbles.md` and user architectural specifications.

### 1.1 Key Refinement Pillars

1. **Optics Builder & Visual Synthesis Overhaul (`src/media/image-prompts.js`)**:
   - Rename `PHASE_1` task from `EXECUTION_&_OUTPUT_STRUCTURE` to `task="Composition Strategy and Output Schema"`.
   - Rename `<THOUGHT_PROCESS>` to `<COGNITIVE_DIRECTIVE>` with clear analytical instructions.
   - Extract `<POSITIVE_FRAMING>` into canonical `PROTOCOL_LIBRARY.HYGIENE.POSITIVE_FRAMING` in `shared.js`.
   - Merge `<DIRECT_DEPICTION>` into `<SPATIAL_GEOMETRY>` (avoiding the overloaded word "composition").
   - Upgrade `<COMPOSITION>` and `<CAMERA>` visual style tags with authoritative instructional prefixes.
   - Dynamically inject `<ALTERNATION_RESOLUTION>` strictly when alternation syntax `/\{[^{}]+(?:\|[^{}]+)+\}/` is present in inputs.
   - Eliminate fractal-in-fractal recursion ("Nova City situated directly within Nova City") and ensure non-character entities (fractals/scenes) are never assigned wardrobe/cinematography.
   - Flatten `<PROTOCOL><VISUAL_SYNTHESIS>` into a single `<VISUAL_SYNTHESIS>` block under `<SYSTEM role="SENSORY_CORTEX">`.

2. **Visual Styles & Tags Review (`src/data/definitions/visual-styles.js`)**:
   - Review all visual styles and engine token tags (`<MEDIUM>`, `<PALETTE>`, `<CAMERA>`, `<COMPOSITION>`, `<TEXTURE>`).
   - Ensure clear instructional prefixes across engine token injections (e.g. "Strict palette overrides conflicting color terms", "Mandatory staging and visual layout").

3. **Story Prose & Shared Prompts Hardening (`src/intelligence/prompts/`)**:
   - Fix bug `<ANCHOR>undefined</ANCHOR>` in `story-prompts.js` by providing canonical anchor directive or pruning dead anchor references.
   - Consolidate dynamics readings in `<DYNAMICS>` with live values (`[current: XX]`) for all active entities (AI character, user persona, fractal).
   - Standardize character permanent appearance formatting to clean semantic XML.
   - Relocate entity dynamics deltas out of inline attributes (`<AI_CHARACTER chaos="57" ...>`) and into the `<DYNAMICS>` legend block.
   - Streamline verbose `<ROLE>` preamble in story prompts.
   - Reformat Director `<AVAILABLE_KEYWORDS>` from a flat comma-separated line to distinct bracketed tags: `[shame] [fear] ...`.

4. **UI & Image Generation Integration (`src/ui/message/Message.svelte` & `src/App.svelte`)**:
   - Fix "Generate NPC Picture" context menu action in `Message.svelte` to properly invoke image generation without relying on an existing attachment index.

---

## 2.0 Playbook & Checklists (TDD Red-Green-Refactor)

### Phase 1: Test Suites & Regression Baseline (RED)

- [x] `d033330` Extend `src/media/image-prompts.test.js` to assert:
  - `task="Composition Structure Output Schema"`
  - `<COGNITIVE_DIRECTIVE>` presence instead of `<THOUGHT_PROCESS>`
  - `<SPATIAL_GEOMETRY>` contains spatial action without redundant `<DIRECT_DEPICTION>`
  - `<ALTERNATION_RESOLUTION>` only emitted when `{...|...}` syntax exists
  - Fractal target generates environmental framing without fractal-in-fractal character text
  - Flattened `<VISUAL_SYNTHESIS>` without redundant `<PROTOCOL>` nesting
- [x] `d033330` Extend `src/intelligence/story-prompts.test.js` and `director-prompts.test.js`:
  - No `undefined` inside `<ANCHOR>`
  - Bracketed `<AVAILABLE_KEYWORDS>` formatting (`[keyword1] [keyword2]`)
  - Dynamics values cleanly unified

### Phase 2: Implementation & Prompts Modernization (GREEN)

- [x] `d033330` Implement changes in `src/intelligence/prompts/shared.js` (`PROTOCOL_LIBRARY.HYGIENE.AFFIRMATIVE_FRAMING`, dynamics unification).
- [x] `d033330` Implement changes in `src/media/image-prompts.js`.
- [x] `d033330` Implement review changes in `src/data/definitions/visual-styles.js`.
- [x] `d033330` Implement changes in `src/intelligence/prompts/story-prompts.js`.
- [x] `d033330` Implement changes in `src/intelligence/prompts/director-prompts.js`.
- [x] `d033330` Fix "Generate NPC Picture" handler in `src/ui/message/Message.svelte`.

### Phase 3: Verification & Review (REFACTOR)

- [x] `d033330` Run full test suite: `npx vitest run` (75/75 files, 991 tests passed).
- [x] `d033330` Run lint audit: `npm run lint` (all parallel linters passed).
- [x] `d033330` Validate Svelte components with `svelte-autofixer`.
- [ ] Update `tasks/PRESENT.md` and commit.

---

## 3.0 Changelog

- 2026-09-06: Initialized track blueprint for prompt optics harmonization, sensory architecture, and visual hygiene.
