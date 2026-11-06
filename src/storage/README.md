# RPGlitch Sovereign Persistence Engine (`src/storage/`)

## Overview

Pure, Promise-based persistence and entity data layer for **RPGlitch** (Rank 2 Persistence).
This package encapsulates canonical bracket tokenization, Epistemic Wall filtering, 4-quadrant entity modeling, author narrative presets, leaf taxonomy mapping, and Dexie.js IndexedDB schema operations.

### Parallel Coexistence & Migration Architecture

`src/storage/` is built as the **sovereign parallel persistence layer** running alongside legacy `src/data/` until Phase 4 (Gate 4) atomic cutover:

- **Zero Upward Dependencies**: Imports downward strictly from `@utils` and `@config`. Never imports from `@engine`, `@intelligence`, `@state`, or `@ui`.
- **Dexie Schema Invariance**: Operates strictly on Dexie schema `version(2)` sharing the existing IndexedDB store (`stories`, `entities`, `simulation_logs`, `sessions`, `kv_settings`, `mutation_ledger`). Zero schema migrations to `version(3)` to prevent `versionchange` page collisions.
- **Adapt-on-Read Normalization**: Reading legacy entity records automatically adapts array-form memories or unpartitioned data into pure, multiline bracket strings across all four quadrants (`eternal`, `present`, `future`, `past`).
- **Wholesale Cutover**: At Gate 4, UI domain components re-wire persistence imports from `@data` to `@storage`, and legacy directories `src/data/` are deleted.

## Interface

The package exposes its public interface via [`src/storage/index.js`](./index.js):

### 1. Canonical Bracket Parser & Epistemic Wall

- [`parse_bracket_token(bracket_string)`](./parser.js): Parses single bracket token `[KEY: value | flags]`. Normalizes key to uppercase, extracts value (isolating pipes inside `{Option A | Option B}` alternation scopes), and extracts metadata flags (`hide`, `show`, `is_origin`, `weight`).
- [`parse_brackets(text)`](./parser.js) / `parse_bracket_entries`: Extracts all bracket tokens from text strings (supporting both comma-separated and multiline bracket lists).
- [`format_clean_brackets(brackets_text, options)`](./parser.js): Filters bracket text across the Epistemic Wall based on visibility (`see_hidden: "all" | "own" | "none"`, `is_counterpart`, `strip_inventory`) and strips internal control flags, rendering clean comma-separated bracket lists for prompts.
- [`apply_bracket_deltas(existing_text, delta_text)`](./parser.js): Merges incoming bracket deltas into existing bracket text, returning a canonical comma-separated list. Handles single-value overwrites, multi-entry collection appending (`INVENTORY`, `STASH`), and atomic key deletion via `"none"` or `"cleared"`.
- [`extract_memory_candidates(past_text)`](./parser.js): Converts canonical `past` bracket strings into structured candidates `{ id, content, weight, is_origin }` for Sieve RAG vector scoring.

### 2. Profile Fields, Leaf Mapping & Enhancers

- `FLAT_LEAF_MAP`: Canonical dictionary mapping dot-notated profile paths (`"eternal.physical"`, `"present.non_physical"`) and flattened keys to canonical field identifiers.
- [`resolve_flat_path(flat_key)`](./profile-fields.js): Resolves flat key to entity quadrant path.
- `ENHANCER_DIRECTIVES`: Directives instructing the Caretaker Purpose Core on synthesizing specific entity fields.

### 3. Premades & Author Narrative Presets

- `PREMADE_CHARACTERS`: 8 starter character archetypes (`orion`, `glitch`, `silvers`, `hank`, `elias`, `julien`, `beast`, `nova`) in pure 4-quadrant bracket schema.
- `PREMADE_FRACTALS`: 2 starter setting archetypes (`ashenweald`, `tartarus`).
- `ALL_PREMADES`: Unified catalog of all 10 starter entities.
- `NARRATIVE_PRESETS`: Author narrative styles (`cormac_mccarthy`, `william_gibson`, `anais_nin`, `david_lynch`, `arthur_morgan`).
- [`get_starter_entities()`](./presets.js): Returns clones of all starter entities.
- [`get_starter_entity_by_id(id)`](./presets.js): Retrieves starter entity by ID.
- [`get_narrative_preset(key)`](./presets.js): Resolves author narrative preset with safe fallback to `"cormac_mccarthy"`.

### 4. 4-Quadrant Entity Model & Normalizer

- [`normalize_entity(raw)`](./entities.js): Normalizes raw or legacy database entities into the canonical 4-quadrant multiline bracket format (`name`, `type`, `role`, `pov`, `signature_color`, `narrative_style`, `eternal`, `present`, `past`, `future`).
- [`create_entity(type, overrides)`](./entities.js): Entity factory generating blank entities with defaults (`pov: "3rd_person"`, standard starter brackets).
- [`filter_entity_epistemics(entity, options)`](./entities.js): Filters all quadrants of an entity across the Epistemic Wall.
- [`serialize_entity_for_export(entity)`](./entities.js): Serializes entity to JSON for export.

### 5. Dexie Persistence Engine

- [`db`](./db.js): Authoritative Dexie.js database instance configured at schema `version(2)`.
- [`init_db()`](./db.js): Verifies database readiness.
- Entity Operations: `db.entities.get(id)`, `db.entities.upsert(entity)`, `db.entities.update(id, changes)`, `db.entities.remove(id)`, `db.entities.list(options)`.
- Story Operations: `db.stories.get(id)`, `db.stories.upsert(story)`, `db.stories.update(id, changes)`, `db.stories.list()`, `db.stories.conclude(id, status)`.
- Simulation Log Operations: `db.simulation_logs.get(id)`, `db.simulation_logs.load(story_id)`, `db.simulation_logs.append(entry)`, `db.simulation_logs.update(id, changes)`, `db.simulation_logs.remove(id)`.
- Session Operations: `db.sessions.get(id)`, `db.sessions.upsert(session)`.
- Settings & KV: `db.kv_settings.get(key)`, `db.kv_settings.set(key, value)`.
- Mutation Ledger: `db.mutation_ledger.append(entry)`, `db.mutation_ledger.load(story_id, options)`.

## Invariants

- **Zero Upward Layer Violations**: `src/storage/` must never import from `@engine`, `@intelligence`, `@state`, or `@ui`.
- **4-Quadrant Purity**: Every entity stored or normalized strictly stores its attributes in four bracket quadrants: `eternal`, `present`, `past`, and `future`. No loose object properties for internal entity attributes.
- **Key Normalization**: Bracket keys are always normalized to uppercase (`[TOP: black harness]`, not `[top: ...]`).
- **Comma-Separated Standard**: Multiple bracket directives per field are formatted cleanly as comma-separated lists (`[KEY1: val1], [KEY2: val2]`).
- **Alternation Safety**: Metadata control flags (`| hide`, `| w: <1-10>`, `| is_origin`) are parsed strictly outside of `{Option A | Option B}` alternation scopes.
- **IndexedDB Schema Lock**: Schema remains locked at Dexie `version(2)`. No bumping to `version(3)` or altering table indexes during Gate 3/4.
- **Origin Memory Lock**: Memories tagged with `| is_origin` cannot be evicted or overwritten during Caretaker memory consolidation.
- **Single Source of Truth**: All persistence operations return pure JavaScript Promises; no reactive Svelte Runes or stores live in `src/storage/`.

## Side Effects

- **IndexedDB I/O**: Performs asynchronous reads, writes, and transactions against browser IndexedDB storage (`rpglitch_db`).
- **Mutation Ledger Recording**: Writes change-only diffs tagged with `writer: "kernel"` to `mutation_ledger` for deterministic replay.

## Verification

- Run test suite: `npm run test:storage`
