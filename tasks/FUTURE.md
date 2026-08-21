# 🚀 Implementation Blueprint — `track-genesis-rich-synthesis-2026-08-21`

> **Track Goal**: Upgrade the NPC Genesis turn pipeline from minimal draft placeholders to fully realized Twin-Cylinder character entities using the standardized character creation LLM pipeline, while unifying cast terminology to `<ROSTER>`.
>
> 1. **Nomenclature Harmonization**: Rename `<WORLD_CAST>` to `<ROSTER>` / `render_roster_xml()` across all prompt assembly and test assertions.
> 2. **Rich Character Synthesis on Genesis**: When the Director outputs a `genesis` draft, execute the rich character creation prompt (`sort_into_profile()`) contextualized with recent scene events.
> 3. **Twin-Cylinder Normalization & Immediate Sensory Trigger**: Map the synthesized profile onto the nested schema via `apply_profile_to_entity()` and fire background portrait generation via `visual_engine.generate()` using the rich physical bracket descriptions.
> 4. **Resilient Fallback**: Automatically fall back to the Director's raw draft if LLM sorting fails or times out.

---

## 1. Tactical Tasks

- [x] `task-1`: **RED Test Suite — `<ROSTER>` Renaming & Rich Genesis Pipeline**: Write failing tests in `prompts.test.js` and `kernel.test.js` covering `<ROSTER>` schema generation, rich Genesis profile synthesis, and fallback behavior.
- [x] `task-2`: **GREEN Implementation — Prompts & Protocols**: Update `prompts.js` and `protocols.js` to replace `<WORLD_CAST>` with `<ROSTER>`, updating `DIRECTOR_JSON_SCHEMA`, `ENTITY_CONVERGENCE_LAW_XML`, and task descriptions.
- [x] `task-3`: **GREEN Implementation — Intelligence Kernel Genesis Expansion**: Update `_apply_genesis()` and `spawn_npc()` in `kernel.js` to build rich character profiles using `sort_into_profile()`, normalize via `apply_profile_to_entity()`, persist to Dexie, and dispatch portrait generation.
- [x] `task-4`: **REFACTOR & Verification Baseline**: Run unit test suites, `npm run verify`, and `npm run deploy:prepare` to guarantee 0 regressions and a clean production build.

---

## 2. Verification Gate

- Unit Tests: `npx vitest run src/intelligence/prompts.test.js src/intelligence/kernel.test.js src/state/runtime.test.js`
- Full Verify: `npm run verify`
- Production Build: `npm run deploy:prepare`
