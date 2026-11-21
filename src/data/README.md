# RPGlitch Data & Persistence Layer (`src/data/`)

## Overview

`src/data/` is the pure persistence and data-modeling package for **RPGlitch** (zero Svelte runes, zero `state_bridge`, zero upward imports). It owns the IndexedDB schema via Dexie (`"rpglitch"`), the canonical 4-quadrant entity schema (`eternal`, `present`, `future`, `past`), entity CRUD and starter premade seeding, story and simulation-log persistence, TavernAI V2/V3 character card and PNG metadata codecs, synchronous 3-tier session reload checkpoints, and story Markdown transcript exports. Premade blueprints, profile taxonomies, and style catalogs live in `../definitions/`, bracket parsing lives in `@simulation`/`@utils`, and turn/session orchestration lives in `@engine`.

## Interface

The package exposes its public barrel via [`index.js`](./index.js). Unless noted below, exported module symbols are re-exported directly from [`index.js`](./index.js).

### 1. Barrel Entry Point (`index.js`)

- [`index.js`](./index.js) (`@data`): Re-exports the public surface of `records.js`, `card-codec.js`, `db.js`, `entity-repository.js`, `story-library.js`, `checkpoint.js`, and `exporters.js`. Contains zero Svelte runes, zero `state_bridge`, and zero upward imports.

### 2. Dexie Cabinet, Key Helpers & Session Bookmark (`db.js`)

- [`db.js`](./db.js):
  - `db`, `init_db()`, `set_versionchange_quiesce(quiesce_callback)`.
  - `coerce_story_key(id)`, `story_key_variants(id)`, `coerce_log_key(id)`.
  - `SESSION_ID_KEY` (`"active_session_id"`), `record_session_access(session_id)`, `get_recent_sessions(limit = 10)`, `get_active_session_id()`, `require_active()`, `set_active_session_id(session_id)`, `clear_active_session_id()`.

### 3. Entity Repository & Premade Seeding (`entity-repository.js`)

- [`entity-repository.js`](./entity-repository.js):
  - `entities`: Non-polymorphic facade `{ list, get, upsert, update, delete }`.
  - `seed_premades()`, `list_entities(type)`, `get_entity(id, expected_type = null)`, `upsert_entity(entity)`, `update_entity(id, changes)`, `delete_entity(id)`.

### 4. Story Library & Simulation Logs (`story-library.js`)

- [`story-library.js`](./story-library.js):
  - `stories`: Facade `{ list, get, create, update, update_cast, active_entity_ids, conclude, delete }`.
  - `list_stories()`, `get_story(id)`, `create_story(data)`, `update_story(id, changes)`, `update_cast(id, npc_ids)`, `active_entity_ids()`, `conclude_story(id)`, `delete_story(id)`.
  - `find_log_entry(id, feed = null)`, `resolve_log_entity_id(role, character_name, snapshots = null, story_id = null)`, `resolve_story_round(story_id)`.
  - `log_message(...)`, `load_log(story_id)`, `delete_story_log(story_id)`, `delete_log_entry(id, env = null)`, `edit_log_entry(id, new_text, meta_patch = null, env = null)`, `update_log_attachment(id, attachment_index, new_attachment, env = null)`, `delete_log_attachment(id, attachment_index, env = null)`.
  - `create_from_selection(selection, deps = {})`, `send(text, deps = {})`, `regenerate(deps = {})`.

### 5. 4-Quadrant Entity Records (`records.js`)

- [`records.js`](./records.js):
  - `normalize_entity(raw = {})`: Normalizes defaults, dynamics axes, voice config, visual modifiers (`prompt`, `negative_prompt`, `flipped`, `profile_picture_seed`, `last_generated_seed`), and all 4 quadrant strings (`eternal`, `present`, `future`, `past`) with uppercase `[@TARGET: ...]` prefixes.
  - `create_entity(type = "character", overrides = {})`: Creates a normalized `"character"` or `"fractal"` with scope-appropriate defaults.
  - `filter_entity_epistemics(entity, options = {})`: Non-mutating clone filtering all 4 quadrant bracket strings via `format_tagged_fields` (`see_hidden`, `is_counterpart`, `strip_inventory`).
  - `serialize_entity_for_export(entity)`: Normalizes and strips `id`, `created_at`, `updated_at`, and `origin_id`.
  - `apply_profile_to_entity(entity, profile)`: Mutates and returns `entity`, mapping flat profile fields onto the 4-quadrant schema via `canonicalize_field_key`.

### 6. Character Card Codec & PNG Metadata (`card-codec.js`)

- [`card-codec.js`](./card-codec.js):
  - `detect_card_format(payload_json)`: Returns `"v2" | "rpglitch" | "unknown"`.
  - `parse_character_card(payload_json)`: Maps TavernAI V2/V3 card fields into a flat RPGlitch profile.
  - `extract_card_from_png(binary_buffer)`: Scans binary PNG chunks for the `"chara"` `tEXt` chunk and decodes Base64 UTF-8 JSON.
  - `serialize_character_card(entity)`: Serializes an entity into a `chara_card_v2` JSON payload.

### 7. 3-Tier Session Checkpoint (`checkpoint.js`)

- [`checkpoint.js`](./checkpoint.js):
  - `CHECKPOINT_KEY` (`"rpglitch.session_checkpoint"`), `WINDOW_NAME_CHECKPOINT_PREFIX` (`"__RPGLITCH_CHECKPOINT__::"`).
  - `save_session_checkpoint(checkpoint)`, `load_session_checkpoint()`, `clear_session_checkpoint()`.

### 8. Story Markdown Transcript & Export (`exporters.js`)

- [`exporters.js`](./exporters.js):
  - `format_story_beat(entry, options = {})`, `export_story_markdown(story = {}, entries = [], options = {})`, `build_story_export_filename(story = {}, date = new Date())`.

## Invariants

- **Pure Persistence Layer & Downward-Only Imports**: `src/data/` contains zero Svelte runes, zero `state_bridge`, and zero upward imports; modules import solely from `dexie`, `@config`, `@definitions`, `@simulation`, and `@utils`.
- **Dexie Schema (`db.js:db`)**: IndexedDB `"rpglitch"` defines `entities`, `stories`, `simulation_log`, `kv_settings`, `sessions`, and `audio_prefs` in `version(1)` and drops `mutation_ledger` in `version(2)`.
- **Single-Fire Versionchange & Seeding Locks (`db.js`, `entity-repository.js`)**: `_is_versionchange_pending` ensures quiesce, `db.close()`, and reload run at most once; `_is_seeding_active` prevents concurrent premade seeding races.
- **Empty Attachment Cleanup (`story-library.js:delete_log_attachment`)**: Deleting the last attachment of an entry with empty trimmed `text` and neither `meta.is_prologue` nor `meta.is_epilogue` deletes the parent `simulation_log` row.
- **Adapt-on-Read & Clamped Dynamics (`records.js:normalize_entity`, `entity-repository.js`)**: Entity reads normalize via `normalize_entity`; dynamics axes are rounded and clamped to `[DYNAMICS.SCALE.MIN, DYNAMICS.SCALE.MAX]`.
- **3-Tier Checkpoint Fallback & Prefix Match (`checkpoint.js`)**: Saves/reads across RAM, `window.sessionStorage`, and `window.name` prefixed with `WINDOW_NAME_CHECKPOINT_PREFIX`.

## Side Effects

- **IndexedDB Persistence (`db.js`, `entity-repository.js`, `story-library.js`)**: Module initialization registers `"blocked"` and `"versionchange"` handlers on `Dexie("rpglitch")`; CRUD helpers read/write/delete across `entities`, `stories`, `simulation_log`, `kv_settings`, and `sessions`.
- **Browser Storage & Global Navigation (`checkpoint.js`, `db.js`)**: `checkpoint.js` mutates module-local RAM, `window.sessionStorage`, and `window.name`; `db.on("versionchange")` invokes `_versionchange_quiesce` and `window.location.reload()`.

## Verification

- Run: `npm run test:unit`
