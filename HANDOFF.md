# RPGlitch — Prompt-Template Quirk Fixes (perchance console findings)

**Date**: 2026-08-03 · **Session**: perchance workspace (`scratch/src/`)
**User actions required**: `npm run verify` → `npm run build` → redeploy. No schema migration, no new deps.

---

## 1. What changed and why

Fixes for prompt-template quirks surfaced in the user's perchance console (issues **1–5 + 8 + related**; issue 6 — image-gen thought process in devmode — was dropped as impossible at the user's request).

### 1.1 Double `<VISUAL_ENGINE>` (issue 1)

Every style preset in `visual-styles.js` ships its own `<VISUAL_ENGINE>...</VISUAL_ENGINE>` wrapper, and `PromptTemplates.BUILDER` wrapped `style_obj.visual_engine` in another one → nested double tag in the image prompt. `optics.js` now strips the preset's inner wrapper before composing (`visual_engine.replace(/<\/?VISUAL_ENGINE[^>]*>/gi, "")`), producing exactly one `<VISUAL_ENGINE>`.

### 1.2 POV duplication & narrator contradiction (issue 2)

- Character prompts carried BOTH a `pov_protocol` in the protocols block AND a `<POV_DIRECTIVE>` in the task — the POV directive is now the single authority (removed `pov_protocol,` from `render_character`'s protocols).
- Narrator (prologue/epilogue) protocols forced `POV.THIRD_PERSON` while the task `<POV_DIRECTIVE>` was `POV.NARRATOR` — a limited-vs-omniscient contradiction. `POV.THIRD_PERSON` removed; narrator keeps `POV.NARRATOR`.

### 1.3 Space/underscore directive keys (issue 3 + related)

`[DENTAL FEATURES: ...]`-style keys with spaces broke keyed XML emission and merge logic. Fixed end-to-end:

- `text.js` `safe_parse_pseudo_json` normalizes keys (`.replace(/\s+/g, "_")`) in both bracket and quoted tiers.
- `parser.js` bracketed regex widened to `[A-Z_ ]{3,25}`; captured keys normalized (`toUpperCase().replace(/\s+/g, "_")`).
- `physical_to_xml` (prompts.js + optics.js) emits `<tag>` names with spaces → underscores.
- `premades.js` Nova City fractal keys converted: `UPPER_CITY` / `LOWER_CITY` / `VISUAL_THEME`.
- `fragments.js` directives list the new optional keys: `[EARS: ...]`, `[DENTAL_FEATURES: ...]` (character) and `[UPPER_CITY: ...]`, `[LOWER_CITY: ...]`, `[CONNECTION: ...]`, `[VISUAL_THEME: ...]` (fractal).

### 1.4 `<PRESENT><PHYSICAL>` / `<ETERNAL><PHYSICAL>` nesting (issue 4)

All templates now nest temporal sections with physical/non-physical children: director (AI/USER/FRACTAL), character (system ETERNAL + task FRACTAL_FEED PRESENT), ghostwriter, narrator, entity-memory-context, and enhancement. Legacy flat `<PRESENT_PHYSICAL>`/`<ETERNAL_PHYSICAL>` tags are gone everywhere.

### 1.5 Fractal cognitive attrs (issue 5)

`format_dynamics_attrs(dynObj, { cognitive = true })` — fractal identities (director FRACTAL, character FRACTAL_FEED, narrator YOUR_IDENTITY) pass `{ cognitive: false }`, so `certainty`/`regulation` are emitted for characters only. Epilogue fractal identity is now exactly `<YOUR_IDENTITY name="Void" velocity="85" entropy="90">`.

### 1.6 Fractal role preservation (issue 8)

`<entry role="AI_CHARACTER" name="Nova City">` — the kernel flattened every non-user message to `model`, so `collapse_history` mapped fractal messages to `AI_CHARACTER`. Both flatten sites (`execute_turn` + `execute_ghostwriter`) now preserve `role: "fractal"`, making `collapse_history`'s `["prologue","fractal"] → FRACTAL` branch live.

### 1.7 JSON-schema-vs-DB drift (issue 7 + related)

- `DIRECTOR_JSON_SCHEMA.new_vectors` `"weight": 5` → `"emotional_weight": 5` (both AI_CHARACTER and FRACTAL blocks) — matches what the DB/kernel actually store.
- `temporal.js` vector creation now tolerates both: `create(payload, type, v.emotional_weight ?? v.weight ?? 5)`.
- `protocols.js` PROFILE.SCHEMA `past`/`future` wording now reflects that entries become memory/intent vectors.

## 2. Files

| File                               | Change                                                                                                                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/intelligence/prompts.js`      | PRESENT/ETERNAL nesting across all templates; POV dedupe; `format_dynamics_attrs` cognitive option + fractal call sites; `physical_to_xml` underscore keys; DIRECTOR_JSON_SCHEMA `emotional_weight`. |
| `src/media/optics.js`              | `visual_engine_block` strips inner `<VISUAL_ENGINE>` wrapper; `physical_to_xml` underscore keys.                                                                                                     |
| `src/ui/utils/text.js`             | `safe_parse_pseudo_json` key normalization (both tiers).                                                                                                                                             |
| `src/intelligence/parser.js`       | bracketed regex widened + key normalization.                                                                                                                                                         |
| `src/data/presets/premades.js`     | Nova City keys → `UPPER_CITY`/`LOWER_CITY`/`VISUAL_THEME`.                                                                                                                                           |
| `src/intelligence/kernel.js`       | role flattening preserves `fractal` (2 sites).                                                                                                                                                       |
| `src/intelligence/temporal.js`     | `v.emotional_weight ?? v.weight ?? 5` fallback.                                                                                                                                                      |
| `src/ui/utils/protocols.js`        | PROFILE.SCHEMA past/future wording.                                                                                                                                                                  |
| `src/intelligence/fragments.js`    | directive optional keys for character + fractal eternal.physical.                                                                                                                                    |
| `src/intelligence/prompts.test.js` | removed system POV assertions; epilogue identity expectation; enhancement `ETERNAL`/`PHYSICAL` assertions.                                                                                           |
| `tasks/PRESENT.md`                 | new pulse row (`2026-08-03 20:45`)                                                                                                                                                                   |
| `tasks/FUTURE.md`                  | track entry (`2026-08-03 20:45`)                                                                                                                                                                     |

Not changed: presets' `visual_engine` strings (still carry their own wrapper — stripped at composition), `DevTelemetryBlock`, `Message.svelte`.

## 3. Verification (this session, no local shell)

- esbuild-wasm syntax transform of all 10 edited source/test files: **0 errors**.
- esbuild-wasm bundled runtime smoke tests against the real modules (worker + path-alias + minimal stubs for `@platform`/`@data`/`markdown-it`/`temporal_engine`): all assertions pass — parser space-key merge (`[DENTAL FEATURES:]`, `[UPPER_CITY:]`), text key normalization, synthesize (no FIRST/THIRD_PERSON in system, POV only via task directive, character keeps cognitive attrs, fractal omits them, PRESENT/ETERNAL nesting in FRACTAL_FEED), epilogue (`<YOUR_IDENTITY name="Void" velocity="85" entropy="90">`, no third-person), ghostwriter ETERNAL nesting, enhancement `<ETERNAL><PHYSICAL>` + `<eyeColor>`, optics single `<VISUAL_ENGINE>` wrapper (real regex verified against the `visual-styles.js` preset format).
- Repo-wide grep: zero remaining `PRESENT_PHYSICAL`/`ETERNAL_PHYSICAL`; no test asserts old behaviors.
- `npm run verify` / `npm run build` to be run locally (no Node in this environment).
