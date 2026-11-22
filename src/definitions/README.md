# RPGlitch Definitions Registry (`src/definitions/`)

## Overview

`src/definitions/` holds the declarative rules, taxonomies, and style catalogs for **RPGlitch**: dynamics equilibrium protocols and trigger predicates, literary narrative style catalogs, the 4-layer character/fractal profile taxonomy, starter character and fractal blueprints, regex-based speaking-style and anti-AI prose detox dictionaries, diffusion visual style specifications, and unified style tile resolution. Its public barrel [`index.js`](./index.js) (`@definitions`) re-exports `*` from all 7 definition modules, accompanied by 5 unit test suites (`narrative-styles.test.js`, `premades.test.js`, `profile-taxonomy.test.js`, `speaking-styles.test.js`, `visual-styles.test.js`).

## Interface

### 1. Barrel Entry Point (`index.js`)

- [`index.js`](./index.js) (`@definitions`): Re-exports `*` from `dynamics-registry.js`, `narrative-styles.js`, `premades.js`, `profile-taxonomy.js`, `speaking-styles.js`, `styles.js`, and `visual-styles.js`.

### 2. Dynamics Registry & Physics Rules (`dynamics-registry.js`)

- [`dynamics-registry.js`](./dynamics-registry.js):
  - `DYNAMICS_METRIC_NAMES`: Frozen array `["chaos", "intensity", "openness", "affinity", "velocity", "entropy"]`.
  - `default_dynamics_for_scope(scope)`: Builds an axis-to-`DYNAMICS.SCALE.MID` (`50`) map for `"somatic"` or `"fractal"` scope.
  - `PHYSICS_PROTOCOLS`: Frozen dictionary of 30 directive strings (12 somatic/trauma archetypes and 18 dynamics triggers).
  - `AVAILABLE_KEYWORDS`: Frozen array of the 12 somatic archetype IDs exposed to the Director (`"SHAME"`, `"FEAR"`, `"VULNERABILITY"`, `"BETRAYAL"`, `"ABANDONMENT"`, `"EMOTIONAL_NEGLECT"`, `"DEFIANCE"`, `"INTIMACY"`, `"GRIEF"`, `"DOMINANCE"`, `"DECEPTION"`, `"DYSREGULATION"`).
  - `DYNAMICS_RULES`: Array of 27 threshold/trigger predicate objects `{ id, when, priority? }` (9 priority-ranked reaction thresholds and 18 baseline/composite triggers).

### 3. Literary Narrative Styles (`narrative-styles.js`, `narrative-styles.test.js`)

- [`narrative-styles.js`](./narrative-styles.js) (tested by [`narrative-styles.test.js`](./narrative-styles.test.js)):
  - `NARRATIVE_STYLES`: Frozen catalog of 24 `NarrativeStyle` records (`default`, `anais_nin`, `anna_zaires`, `bernardo_bertolucci`, `cara_mckenna`, `cormac_mccarthy`, `david_lynch`, `edgar_allan_poe`, `george_rr_martin`, `haruki_murakami`, `hd_carlton`, `hp_lovecraft`, `jane_austen`, `jrr_tolkien`, `lee_child`, `penelope_douglas`, `philip_k_dick`, `sally_rooney`, `samuel_delany`, `stephen_king`, `william_gibson`, `ernest_hemingway`, `joe_abercrombie`, `arthur_morgan`).
  - `STYLE_MOTIF_REGISTRY`: Frozen map of all 26 motif directives aggregated across `NARRATIVE_STYLES`.
  - `extract_style_dna(style)`: Normalizes `style.dna` into `{ internal_ratio, rhythm, sensory, grounding }`.
  - `get_narrative_style(style_key = "default")`: Returns `NARRATIVE_STYLES[style_key]` or `NARRATIVE_STYLES.default`.
  - `get_style_keywords(style_key = "")`: Returns a shallow copy of `motif_keys` for a style.
  - `resolve_active_style_key(explicit_narrative_style = "")`: Resolves active narrative style via `@utils` `resolve_style`.

### 4. Profile Taxonomy & Leaf Mapping (`profile-taxonomy.js`, `profile-taxonomy.test.js`)

- [`profile-taxonomy.js`](./profile-taxonomy.js) (tested by [`profile-taxonomy.test.js`](./profile-taxonomy.test.js)):
  - `PROFILE_FIELDS`: Top-level entity metadata schema (`name`, `description`, `signature_color`, `pov`) plus symmetric 4-layer taxonomies (`eternal`, `present`, `future`, `past`) for `character` and `fractal`.
  - `FIELD_ATOMS`: Frozen array of 12 `FieldAtom` descriptors compiled from `PROFILE_FIELDS`.
  - `ATOM_BY_ID`: Frozen map indexing `FIELD_ATOMS` by `atom.id` (e.g., `"character.eternal.physical"`, `"fractal.past"`).
  - `PROFILE_FIELD_CATALOG`: Frozen catalog mapping atom IDs to `{ tag, section_label, layer_key }`.
  - `FLAT_LEAF_MAP`: Nested frozen alias tables mapping flat/legacy profile keys to canonical dot-paths for `character` and `fractal`.
  - `ENHANCER_DIRECTIVES`: Frozen map from all 12 enhancer IDs (e.g., `BIOMETRIC_RENDERER`, `HISTORIAN`) to their directive strings.
  - `PROFILE_SECTIONS_BY_TYPE`: Frozen `{ character, fractal }` UI/editor section layouts.
  - `resolve_entity_type(type)`, `canonicalize_field_key(field_name, entity_type = "character")`, `resolve_flat_path(field_name, entity_type = "character")`, `atom_for(entity_type, key)`, `output_key_for_path(path)`, `caretaker_brief(entity_type = "character")`, `build_profile_sections(entity_type = "character")`.

### 5. Speaking Styles & Prose Detox Rules (`speaking-styles.js`, `speaking-styles.test.js`)

- [`speaking-styles.js`](./speaking-styles.js) (tested by [`speaking-styles.test.js`](./speaking-styles.test.js)):
  - `VOCAL_RULES` (6), `SOUND_RULES` (5), `SENSORY_RULES` (17), `METAPHOR_RULES` (11), `COMMUNITY_RULES` (56): Frozen rule category arrays.
  - `SPEAKING_STYLE_RULES`: Frozen consolidated array of all 95 style-specific detox rules.
  - `ANTI_AI_REPLACEMENTS`: Frozen array of 30 Tier 1A/1B `{ pattern, replace }` anti-AI substitution rules.
  - `TIER_2_CLUSTER_WORDS`: Frozen array of 37 lowercase Tier 2 AI cluster-marker words.
  - `is_valid_speaking_style(candidate_style)`: Strict membership check against `SPEAKING_STYLES` from `@config`.

### 6. Visual Diffusion Styles (`visual-styles.js`, `visual-styles.test.js`)

- [`visual-styles.js`](./visual-styles.js) (tested by [`visual-styles.test.js`](./visual-styles.test.js)):
  - `VISUAL_STYLES`: Frozen catalog of 26 `VisualStyle` entries (`none` plus 25 camera- or composition-configured visual engines).
  - `VALID_VISUAL_STYLES`: Frozen `Set` of the 26 style keys in `VISUAL_STYLES`.
  - `is_valid_visual_style(candidate_style)`: Strict string membership check against `VALID_VISUAL_STYLES`.
  - `get_visual_style(style_key = "none")`: Returns `VISUAL_STYLES[style_key]` or `VISUAL_STYLES.none`.
  - `resolve_portrait_visual_style_key(entity = {})`: Resolves entity portrait style via `resolve_style(..., "none")`.
  - `resolve_story_visual_style_key(fractal = null, fallback_fractal = null)`: Resolves story beat visual style prioritizing `fractal?.visual_style` over `fallback_fractal?.visual_style`, defaulting to `"none"`.

### 7. Premade Entities & Blueprints (`premades.js`, `premades.test.js`)

- [`premades.js`](./premades.js) (tested by [`premades.test.js`](./premades.test.js)):
  - `PREMADE_CHARACTERS`: Shallow-frozen array (`Object.freeze([...])`) of 7 starter character blueprints (`orion`, `glitch`, `silvers`, `hank`, `elias`, `julien`, `beast`).
  - `PREMADE_FRACTALS`: Shallow-frozen array (`Object.freeze([...])`) of 3 starter fractal blueprints (`nova`, `ashenweald`, `tartarus`).
  - `ALL_PREMADES`: Consolidated shallow-frozen array (`Object.freeze([...])`) of all 10 starter blueprints.
  - `PREMADE_ENTITY_MAP`: `Map` indexing all starter blueprints by exact lowercase `blueprint.id`.
  - `get_premade_entity_by_id(id)`: Retrieves a premade blueprint case-insensitively (`id.toLowerCase()`) or returns `null`.
  - `has_premade_entity(id)`: Case-insensitive (`id.toLowerCase()`) boolean check whether an ID exists in `PREMADE_ENTITY_MAP`.
  - `get_premade_characters()`: Returns `PREMADE_CHARACTERS`.
  - `get_premade_fractals()`: Returns `PREMADE_FRACTALS`.

### 8. Style Tile Resolution (`styles.js`)

- [`styles.js`](./styles.js):
  - `resolve_entity_style_tiles(entity, options = {})`: Maps `entity.narrative_style` (or `entity.narrative_engine`) and `entity.visual_style` (or `entity.visual_engine`) into `{ narrative: StyleTileDescriptor | null, visual: StyleTileDescriptor | null }` (`{ name, portrait, fallback, tooltip, size_tier: "sm" }`), omitting `"default"` and `"none"` unless `options.include_defaults` is `true`.

## Invariants

- **Barrel Re-Export & Strictly Downward Imports (`index.js`)**: `src/definitions/index.js` re-exports `*` from all 7 definition modules; modules import solely from `@config`, `@utils`, and `@media` (`profile-taxonomy.js`).
- **Dynamics Axis & Rule Alignment (`dynamics-registry.js`)**: All 27 `DYNAMICS_RULES` IDs exist in `PHYSICS_PROTOCOLS` and default missing axes to `50` (`?? 50`); `AVAILABLE_KEYWORDS` contains only the 12 somatic archetype keys (3 of which — `ABANDONMENT`, `DOMINANCE`, `DECEPTION` — have no threshold rule in `DYNAMICS_RULES`).
- **Narrative Style Key & Voice Integrity (`narrative-styles.js`)**: Every entry in `NARRATIVE_STYLES` enforces `key === record.id` and `speaking_style` in `{"casual", "lyrical", "primal", "clinical"}`. `get_style_keywords()` returns fresh array copies; `extract_style_dna()` always returns strings (`internal_ratio` defaults to `"0.50"`).
- **Symmetric 4-Layer Schema & Merge Semantics (`profile-taxonomy.js`)**: Only `character` and `fractal` temporal layers become `FIELD_ATOMS` (excluding `name`, `description`, `signature_color`, `pov`); `merge` is `"append"` exclusively for `past` and `"replace"` for all other layers. `canonicalize_field_key()` checks `fractal` aliases before `character` aliases when `entity_type === "fractal"` (otherwise checking `character` aliases only) and requires string inputs.
- **Four-Style Rule Completeness & Ordering (`speaking-styles.js`)**: Every non-callback rule in `SPEAKING_STYLE_RULES` supplies all 4 canonical speaking style keys (`casual`, `lyrical`, `primal`, `clinical`), retains identical `pattern` and `regex` `/gi` `RegExp` references, and maintains specific-before-generic ordering across concatenated categories.
- **Visual Style Engine Mutual Exclusion (`visual-styles.js`)**: `"none"` omits `engine` and sets `llm_refine: false`; all 25 styled entries define `medium`, `palette`, `texture`, and strictly one of `camera` or `composition` (never both).
- **Premade Blueprint Shallow Freezing & Map Indexing (`premades.js`)**: Outer arrays (`PREMADE_CHARACTERS`, `PREMADE_FRACTALS`, `ALL_PREMADES`) are shallow-frozen (`Object.freeze([...])`) while individual blueprint objects are plain literals; `PREMADE_ENTITY_MAP` is keyed by exact lowercase `blueprint.id` (with case-insensitive lookup via `id.toLowerCase()` performed in `get_premade_entity_by_id()` and `has_premade_entity()`); query helpers return `null`/`false` for non-string or missing identifiers.

## Side Effects

- **Rule & Word Registry Hydration (`speaking-styles.js`)**: Evaluating `speaking-styles.js` executes three top-level calls (`register_speaking_rules(SPEAKING_STYLE_RULES)`, `register_anti_ai_rules(ANTI_AI_REPLACEMENTS)`, `register_cluster_words(TIER_2_CLUSTER_WORDS)`) that populate registries inside `@utils`.
- **Pure Definitions Elsewhere**: `dynamics-registry.js`, `narrative-styles.js`, `premades.js`, `profile-taxonomy.js`, `styles.js`, and `visual-styles.js` perform no external I/O, storage writes, or cross-module mutations.

## Verification

- Run full suite: `npm test`
- Run package unit tests: `npx vitest run src/definitions/` (runs all 5 test suites: `narrative-styles.test.js`, `premades.test.js`, `profile-taxonomy.test.js`, `speaking-styles.test.js`, `visual-styles.test.js`)
