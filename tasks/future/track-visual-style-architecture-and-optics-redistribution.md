<!--
  tasks/future/track-visual-style-architecture-and-optics-redistribution.md
  =============================================================================
  🎯 TRACK BLUEPRINT: Visual Style Architecture & Optics Redistribution
  =============================================================================
  Scope:
  - Mirror Narrative Style architecture onto Visual Style:
    - Layer 3 (<CORE_PROTOCOLS>): Static invariants in PROTOCOL_LIBRARY.OPTICS + <VISUAL_STYLE> (medium, palette, textures). Omitted on "none".
    - Layer 4 (<ENTITIES>): Co-located <SUBJECT_RULES> (<DYNAMIC_OVERRIDES>, <GARMENT_ANATOMY>, <IDENTIFIERS>, <CREATURE_DISAMBIGUATION>, <ALTERNATION_OPTIONS>).
    - Layer 6 (<TASK>): <TARGET>, <MANDATE>, <THINK_FORMAT>, unified <SPATIAL_FRAMING> (<FIRST_SENTENCE_MANDATE>, <SPATIAL_GEOMETRY>, <CINEMATOGRAPHY>, <CAMERA>/<COMPOSITION>), <STYLE_KEYWORDS>, <INPUT_INTENT>, <SELFIE_DIRECTIVE>.
  - Eliminate `build_optics_builder_protocol` and nested <VISUAL_SYNTHESIS> wrapper under P4 Zero Backwards Compatibility.
  - Align `prompts.js` manifest and `compile_pipeline_prompt("optics")` switchboard delegation.
  =============================================================================
-->

# 🎯 Track: Visual Style Architecture & Optics Protocols Redistribution

## 1.0 Vision & High-Level Architecture

Establish pure architectural symmetry between **Narrative Style** (Story Prose) and **Visual Style** (Sensory Optics). Deconstruct the monolithic `build_optics_builder_protocol` and distribute its contents across the 7-Layer Universal Pipeline:

```text
[Layer 1: SYSTEM]      ➔ <SYSTEM role="SENSORY_CORTEX">
[Layer 2: CONSTITUTION]  (Omitted for Optics: constitution: false)
[Layer 3: PROTOCOLS]    ➔ <CORE_PROTOCOLS>:
                           • PROTOCOL_LIBRARY.OPTICS invariants (weighting math ban, affirmative framing, typography, environmental grounding)
                           • <VISUAL_STYLE origin="..."> (medium, palette, textures) — omitted if style is "none"
[Layer 4: ENTITIES]     ➔ <ENTITIES>:
                           • Character & fractal sheets (<ACTIVE_CHARACTERS>, <PHYSICAL_APPEARANCE>, <CURRENT_IMPRESSION>)
                           • Co-located <SUBJECT_RULES> (<DYNAMIC_OVERRIDES>, <GARMENT_ANATOMY>, <IDENTIFIERS>, <CREATURE_DISAMBIGUATION>, <ALTERNATION_OPTIONS>)
[Layer 5: HISTORY]      ➔ <CONVERSATION_HISTORY>: Recent sensory snapshots (when enabled)
[Layer 6: TASK]         ➔ <TASK>:
                           • <TARGET> & <MANDATE>
                           • <THINK_FORMAT> (4-step spatial & aesthetic calibration)
                           • <SPATIAL_FRAMING> (<FIRST_SENTENCE_MANDATE>, <SPATIAL_GEOMETRY>, <CINEMATOGRAPHY mode="...">, <CAMERA> / <COMPOSITION>)
                           • <STYLE_KEYWORDS> & <INPUT_INTENT>
                           • <SELFIE_DIRECTIVE> (if is_selfie)
[Layer 7: FORMAT]       ➔ <OUTPUT_FORMAT mode="json">: Schema with _thought_process, prompt, negative_prompt
```

---

## 2.0 Playbook & TDD Execution Steps

- [ ] `1. RED Suite`: Add unit tests in `src/intelligence/modules/protocols.test.js`, `src/intelligence/modules/task.test.js`, `src/intelligence/modules/entities/sheets.test.js`, and `src/intelligence/builder.test.js` asserting:
  - `render_visual_style_xml` compiles `<VISUAL_STYLE>` with medium, palette, and textures, and returns empty string for `"none"`.
  - `render_optics_protocols` compiles clean `<CORE_PROTOCOLS>` containing static optics rules and `<VISUAL_STYLE>`.
  - `render_optics_subject_rules` compiles `<SUBJECT_RULES>` in Layer 4 with dynamic overrides, garment anatomy, identifiers, and conditional alternations.
  - `render_task({ mode: "optics" })` compiles `<THINK_FORMAT>` and unified `<SPATIAL_FRAMING>` with cinematography and camera/composition tokens.
  - `compile_pipeline_prompt("optics")` delegates cleanly through the switchboard.
- [ ] `2. GREEN (Layer 3 Protocols & Prompts Manifest)`:
  - In `src/intelligence/prompts.js`: update `PROMPTS.optics` to list declarative protocols and `task: { think_format: "optics" }`.
  - In `src/intelligence/modules/protocols.js`: add `PROTOCOL_LIBRARY.OPTICS`, export `render_visual_style_xml` and `render_optics_protocols`, and remove `build_optics_builder_protocol` and `OPTICS_BUILDER_PROTOCOL`.
- [ ] `3. GREEN (Layer 4 Entities & Subject Rules)`:
  - In `src/intelligence/modules/entities/sheets.js`: implement `render_optics_subject_rules` and `resolve_optics_cinematography`. Inject `<SUBJECT_RULES>` into `render_optics_entities_xml` and decouple cinematography from `<ENTITIES>`.
- [ ] `4. GREEN (Layer 6 Task & Assembly)`:
  - In `src/intelligence/modules/task.js`: add `THINK_FORMAT`, `FIRST_SENTENCE_MANDATE`, `SPATIAL_GEOMETRY`, and `SELFIE_DIRECTIVE` to `TASK_LIBRARY.OPTICS`. Update `render_task` to assemble unified `<SPATIAL_FRAMING>` and `<THINK_FORMAT>`.
  - In `src/intelligence/builder.js`: refactor `render_optics_prompt` and `compile_pipeline_prompt("optics")` to cleanly assemble Layers 1–7.
- [ ] `5. REFACTOR & GATE`:
  - Run full test suite (`npm test`), hook contracts (`npm run test:hooks`), and linter (`npm run verify`).
  - Synchronize `tasks/PRESENT.md` pulse buffer and task pointers.

---

## 3.0 Changelog

<!-- CHANGELOG_START -->

- 2026-09-19: Track initialized following grill-me architectural consensus on Visual Style mirroring Narrative Style, subject rules co-location in Layer 4, and unified spatial framing in Layer 6.

<!-- CHANGELOG_END -->
