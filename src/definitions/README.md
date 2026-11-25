# RPGlitch Definitions Registry (`src/definitions/`)

## Overview

`src/definitions/` holds the declarative rules, taxonomies, and style catalogs for **RPGlitch**: dynamics equilibrium protocols and trigger predicates, literary narrative style catalogs, the 4-layer character/fractal profile taxonomy, starter character and fractal blueprints, regex-based speaking-style and anti-AI prose detox dictionaries, and diffusion visual style specifications. Its public barrel [`index.js`](./index.js) (`@definitions`) re-exports `*` from all 6 definition modules, accompanied by 5 unit test suites (`narrative-styles.test.js`, `premades.test.js`, `profile-taxonomy.test.js`, `speaking-styles.test.js`, `visual-styles.test.js`).

## Interface

### 1. Barrel Entry Point (`index.js`)

- [`index.js`](./index.js) (`@definitions`): Re-exports `*` from `dynamics-registry.js`, `narrative-styles.js`, `premades.js`, `profile-taxonomy.js`, `speaking-styles.js`, and `visual-styles.js`.

### 2. Dynamics Registry & Physics Rules (`dynamics-registry.js`)

- [`dynamics-registry.js`](./dynamics-registry.js):
  - `default_dynamics_for_scope(scope)`: Builds an axis-to-`DYNAMICS.SCALE.MID` (`50`) map for `"character"` or `"fractal"` scope.
  - `PHYSICS_PROTOCOLS`: Frozen dictionary of 30 directive strings (12 somatic/trauma archetypes and 18 dynamics triggers, parked in `ROADMAP.md`).
  - `DYNAMICS_RULES`: Array of 27 threshold/trigger predicate objects `{ id, when, priority? }` (9 priority-ranked reaction thresholds and 18 baseline/composite triggers).

### 3. Literary Narrative Styles (`narrative-styles.js`, `narrative-styles.test.js`)

- [`narrative-styles.js`](./narrative-styles.js) (tested by [`narrative-styles.test.js`](./narrative-styles.test.js)):
  - `NARRATIVE_STYLES`: Frozen catalog of 24 `NarrativeStyle` records (`default`, `anais_nin`, `anna_zaires`, `bernardo_bertolucci`, `cara_mckenna`, `cormac_mccarthy`, `david_lynch`, `edgar_allan_poe`, `george_rr_martin`, `haruki_murakami`, `hd_carlton`, `hp_lovecraft`, `jane_austen`, `jrr_tolkien`, `lee_child`, `penelope_douglas`, `philip_k_dick`, `sally_rooney`, `samuel_delany`, `stephen_king`, `william_gibson`, `ernest_hemingway`, `joe_abercrombie`, `arthur_morgan`).
  - `get_narrative_style(style_key = "default")`: Returns `NARRATIVE_STYLES[style_key]` or `NARRATIVE_STYLES.default`.

### 4. Profile Taxonomy & Leaf Mapping (`profile-taxonomy.js`, `profile-taxonomy.test.js`)

- [`profile-taxonomy.js`](./profile-taxonomy.js) (tested by [`profile-taxonomy.test.js`](./profile-taxonomy.test.js)):
  - `PROFILE_FIELDS`: Top-level entity metadata schema (`name`, `description`, `signature_color`, `pov`) plus symmetric 4-layer taxonomies (`eternal`, `present`, `future`, `past`) for `character` and `fractal`.
  - `PROFILE_SECTIONS_BY_TYPE`: Frozen `{ character, fractal }` UI/editor section layouts.
  - `resolve_entity_type(type)`, `canonicalize_field_key(field_name, entity_type = "character")`, `atom_for(entity_type, key)`, `caretaker_brief(entity_type = "character")`.

### 5. Speaking Styles & Prose Detox Rules (`speaking-styles.js`, `speaking-styles.test.js`)

- [`speaking-styles.js`](./speaking-styles.js) (tested by [`speaking-styles.test.js`](./speaking-styles.test.js)):
  - `SPEAKING_STYLE_RULES`: Frozen consolidated array of all 95 style-specific detox rules.
  - `ANTI_AI_REPLACEMENTS`: Frozen array of 30 Tier 1A/1B `{ pattern, replace }` anti-AI substitution rules.

### 6. Visual Diffusion Styles (`visual-styles.js`, `visual-styles.test.js`)

- [`visual-styles.js`](./visual-styles.js) (tested by [`visual-styles.test.js`](./visual-styles.test.js)):
  - `VISUAL_STYLES`: Frozen catalog of 26 `VisualStyle` entries (`none` plus 25 camera- or composition-configured visual engines).
  - `get_visual_style(style_key = "none")`: Returns `VISUAL_STYLES[style_key]` or `VISUAL_STYLES.none`.

### 7. Premade Entities & Blueprints (`premades.js`, `premades.test.js`)

- [`premades.js`](./premades.js) (tested by [`premades.test.js`](./premades.test.js)):
  - `PREMADES`: Shallow-frozen array (`Object.freeze([...])`) of all 10 starter blueprints (7 characters: `orion`, `glitch`, `silvers`, `hank`, `elias`, `julien`, `beast`; 3 fractals: `nova`, `ashenweald`, `tartarus`).

## Invariants

- **Barrel Re-Export & Strictly Downward Imports (`index.js`)**: `src/definitions/index.js` re-exports `*` from all 7 definition modules; modules import solely from `@config` and `@utils`.
- **Dynamics Axis & Rule Alignment (`dynamics-registry.js`)**: All 27 `DYNAMICS_RULES` IDs exist in `PHYSICS_PROTOCOLS` and default missing axes to `50` (`?? 50`).
- **Narrative Style Key & Voice Integrity (`narrative-styles.js`)**: Every entry in `NARRATIVE_STYLES` enforces `key === record.id` and `speaking_style` in `{"casual", "lyrical", "primal", "clinical"}`.
- **Symmetric 4-Layer Schema & Merge Semantics (`profile-taxonomy.js`)**: Only `character` and `fractal` temporal layers become internal `FIELD_ATOMS` (excluding `name`, `description`, `signature_color`, `pov`); `merge` is `"append"` exclusively for `past` and `"replace"` for all other layers. `canonicalize_field_key()` checks `fractal` aliases before `character` aliases when `entity_type === "fractal"` (otherwise checking `character` aliases only) and requires string inputs.
- **Four-Style Rule Completeness & Ordering (`speaking-styles.js`)**: Every non-callback rule in `SPEAKING_STYLE_RULES` supplies all 4 canonical speaking style keys (`casual`, `lyrical`, `primal`, `clinical`), retains identical `pattern` and `regex` `/gi` `RegExp` references, and maintains specific-before-generic ordering across concatenated categories.
- **Visual Style Engine Mutual Exclusion (`visual-styles.js`)**: `"none"` omits `engine` and sets `llm_refine: false`; all 25 styled entries define `medium`, `palette`, `texture`, and strictly one of `camera` or `composition` (never both).
- **Premade Blueprint Shallow Freezing (`premades.js`)**: `PREMADES` is shallow-frozen (`Object.freeze([...])`) while individual blueprint objects are plain literals.

## Side Effects

- **Pure Definitions**: `dynamics-registry.js`, `narrative-styles.js`, `premades.js`, `profile-taxonomy.js`, `speaking-styles.js`, `styles.js`, and `visual-styles.js` perform no external I/O, storage writes, or cross-module mutations.

## Verification

- Run full suite: `npm test`
- Run package unit tests: `npx vitest run src/definitions/` (runs all 5 test suites: `narrative-styles.test.js`, `premades.test.js`, `profile-taxonomy.test.js`, `speaking-styles.test.js`, `visual-styles.test.js`)
