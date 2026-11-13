# RPGlitch Definitions Registry (`src/definitions/`)

## Overview

`src/definitions/` holds the declarative rules, taxonomies, and style catalogs for **RPGlitch**: dynamics equilibrium protocols and trigger predicates, literary narrative style catalogs, the 4-layer character/fractal profile taxonomy, regex-based speaking-style and anti-AI prose detox dictionaries, and diffusion visual style specifications. This directory intentionally has no `index.js` barrel; consumers import directly from the individual definition modules.

## Interface

### 1. Dynamics Registry & Physics Rules (`dynamics-registry.js`)

- [`dynamics-registry.js`](./dynamics-registry.js):
  - `DYNAMICS_METRIC_NAMES`: Frozen array `["chaos", "intensity", "openness", "affinity", "velocity", "entropy"]`.
  - `default_dynamics_for_scope(scope)`: Builds an axis-to-`DYNAMICS.SCALE.MID` (`50`) map for `"somatic"` or `"fractal"` scope.
  - `PHYSICS_PROTOCOLS`: Frozen dictionary of 30 directive strings (12 somatic/trauma archetypes and 18 dynamics triggers).
  - `AVAILABLE_KEYWORDS`: Frozen array of the 12 somatic archetype IDs exposed to the Director (`"SHAME"`, `"FEAR"`, `"VULNERABILITY"`, `"BETRAYAL"`, `"ABANDONMENT"`, `"EMOTIONAL_NEGLECT"`, `"DEFIANCE"`, `"INTIMACY"`, `"GRIEF"`, `"DOMINANCE"`, `"DECEPTION"`, `"DYSREGULATION"`).
  - `DYNAMICS_RULES`: Array of 27 threshold/trigger predicate objects `{ id, when, priority? }` (9 priority-ranked reaction thresholds and 18 baseline/composite triggers).

### 2. Literary Narrative Styles (`narrative-styles.js`)

- [`narrative-styles.js`](./narrative-styles.js):
  - `NARRATIVE_STYLES`: Frozen catalog of 24 `NarrativeStyle` records (`default`, `anais_nin`, `anna_zaires`, `bernardo_bertolucci`, `cara_mckenna`, `cormac_mccarthy`, `david_lynch`, `edgar_allan_poe`, `george_rr_martin`, `haruki_murakami`, `hd_carlton`, `hp_lovecraft`, `jane_austen`, `jrr_tolkien`, `lee_child`, `penelope_douglas`, `philip_k_dick`, `sally_rooney`, `samuel_delany`, `stephen_king`, `william_gibson`, `ernest_hemingway`, `joe_abercrombie`, `arthur_morgan`).
  - `STYLE_MOTIF_REGISTRY`: Frozen map of all 26 motif directives aggregated across `NARRATIVE_STYLES`.
  - `extract_style_dna(style)`: Normalizes `style.dna` into `{ internal_ratio, rhythm, sensory, grounding }`.
  - `get_narrative_style(style_key = "default")`: Returns `NARRATIVE_STYLES[style_key]` or `NARRATIVE_STYLES.default`.
  - `get_style_keywords(style_key = "")`: Returns a shallow copy of `motif_keys` for a style.
  - `resolve_active_style_key(explicit_narrative_style = "")`: Resolves active narrative style via `@utils` `resolve_style`.

### 3. Profile Taxonomy & Leaf Mapping (`profile-taxonomy.js`)

- [`profile-taxonomy.js`](./profile-taxonomy.js):
  - `PROFILE_FIELDS`: Top-level entity metadata schema (`name`, `description`, `signature_color`, `pov`) plus symmetric 4-layer taxonomies (`eternal`, `present`, `future`, `past`) for `character` and `fractal`.
  - `FIELD_ATOMS`: Frozen array of 12 `FieldAtom` descriptors compiled from `PROFILE_FIELDS`.
  - `ATOM_BY_ID`: Frozen map indexing `FIELD_ATOMS` by `atom.id` (e.g., `"character.eternal.physical"`, `"fractal.past"`).
  - `PROFILE_FIELD_CATALOG`: Frozen catalog mapping atom IDs to `{ tag, section_label, layer_key }`.
  - `FLAT_LEAF_MAP`: Nested frozen alias tables mapping flat/legacy profile keys to canonical dot-paths for `character` and `fractal`.
  - `ENHANCER_DIRECTIVES`: Frozen map from all 12 enhancer IDs (e.g., `BIOMETRIC_RENDERER`, `HISTORIAN`) to their directive strings.
  - `PROFILE_SECTIONS_BY_TYPE`: Frozen `{ character, fractal }` UI/editor section layouts.
  - `resolve_entity_type(type)`, `canonicalize_field_key(field_name, entity_type = "character")`, `resolve_flat_path(field_name, entity_type = "character")`, `atom_for(entity_type, key)`, `output_key_for_path(path)`, `caretaker_brief(entity_type = "character")`, `build_profile_sections(entity_type = "character")`.

### 4. Speaking Styles & Prose Detox Rules (`speaking-styles.js`)

- [`speaking-styles.js`](./speaking-styles.js):
  - `VOCAL_RULES` (6), `SOUND_RULES` (5), `SENSORY_RULES` (17), `METAPHOR_RULES` (11), `COMMUNITY_RULES` (56): Frozen rule category arrays.
  - `SPEAKING_STYLE_RULES`: Frozen consolidated array of all 95 style-specific detox rules.
  - `ANTI_AI_REPLACEMENTS`: Frozen array of 30 Tier 1A/1B `{ pattern, replace }` anti-AI substitution rules.
  - `TIER_2_CLUSTER_WORDS`: Frozen array of 37 lowercase Tier 2 AI cluster-marker words.
  - `is_valid_speaking_style(candidate_style)`: Strict membership check against `SPEAKING_STYLES` from `@config`.

### 5. Visual Diffusion Styles (`visual-styles.js`)

- [`visual-styles.js`](./visual-styles.js):
  - `VISUAL_STYLES`: Frozen catalog of 26 `VisualStyle` entries (`none` plus 25 camera- or composition-configured visual engines).
  - `VALID_VISUAL_STYLES`: Frozen `Set` of the 26 style keys in `VISUAL_STYLES`.
  - `is_valid_visual_style(candidate_style)`: Strict string membership check against `VALID_VISUAL_STYLES`.
  - `get_visual_style(style_key = "none")`: Returns `VISUAL_STYLES[style_key]` or `VISUAL_STYLES.none`.
  - `resolve_portrait_visual_style_key(entity = {})`: Resolves entity portrait style via `resolve_style(..., "none")`.
  - `resolve_story_visual_style_key(fractal = null, fallback_fractal = null)`: Resolves story beat visual style prioritizing `fractal?.visual_style` over `fallback_fractal?.visual_style`, defaulting to `"none"`.

## Invariants

- **No Barrel & Strictly Downward Imports**: `src/definitions/` intentionally omits `index.js`; modules import solely from `@config`, `@utils`, and `../media/tokens.js` (`profile-taxonomy.js`).
- **Dynamics Axis & Rule Alignment (`dynamics-registry.js`)**: All 27 `DYNAMICS_RULES` IDs exist in `PHYSICS_PROTOCOLS` and default missing axes to `50` (`?? 50`); `AVAILABLE_KEYWORDS` contains only the 12 somatic archetype keys (3 of which — `ABANDONMENT`, `DOMINANCE`, `DECEPTION` — have no threshold rule in `DYNAMICS_RULES`).
- **Narrative Style Key & Voice Integrity (`narrative-styles.js`)**: Every entry in `NARRATIVE_STYLES` enforces `key === record.id` and `speaking_style` in `{"casual", "lyrical", "primal", "clinical"}`. `get_style_keywords()` returns fresh array copies; `extract_style_dna()` always returns strings (`internal_ratio` defaults to `"0.50"`).
- **Symmetric 4-Layer Schema & Merge Semantics (`profile-taxonomy.js`)**: Only `character` and `fractal` temporal layers become `FIELD_ATOMS` (excluding `name`, `description`, `signature_color`, `pov`); `merge` is `"append"` exclusively for `past` and `"replace"` for all other layers. `canonicalize_field_key()` resolves `fractal` aliases before `character` aliases and requires string inputs.
- **Four-Style Rule Completeness & Ordering (`speaking-styles.js`)**: Every non-callback rule in `SPEAKING_STYLE_RULES` supplies all 4 canonical speaking style keys (`casual`, `lyrical`, `primal`, `clinical`), retains identical `pattern` and `regex` `/gi` `RegExp` references, and maintains specific-before-generic ordering across concatenated categories.
- **Visual Style Engine Mutual Exclusion (`visual-styles.js`)**: `"none"` omits `engine` and sets `llm_refine: false`; all 25 styled entries define `medium`, `palette`, `texture`, and strictly one of `camera` or `composition` (never both).

## Side Effects

- **Rule & Word Registry Hydration (`speaking-styles.js`)**: Evaluating `speaking-styles.js` executes three top-level calls (`register_speaking_rules(SPEAKING_STYLE_RULES)`, `register_anti_ai_rules(ANTI_AI_REPLACEMENTS)`, `register_cluster_words(TIER_2_CLUSTER_WORDS)`) that populate registries inside `@utils`.
- **Pure Definitions Elsewhere**: `dynamics-registry.js`, `narrative-styles.js`, `profile-taxonomy.js`, and `visual-styles.js` perform no external I/O, storage writes, or cross-module mutations.

## Verification

- Run: `npx vitest run src/definitions/`
