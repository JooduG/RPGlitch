# RPGlitch Data & Persistence Layer (`src/data/`)

## Overview

`src/data/` is the pure persistence and data-modeling package for **RPGlitch** (zero Svelte runes, zero `state_bridge`, zero upward imports). It owns the IndexedDB schema via Dexie (`"rpglitch"`), the canonical 4-quadrant entity schema (`eternal`, `present`, `future`, `past`), TavernAI V2/V3 character card and PNG metadata codecs, the event-sourced mutation ledger and deterministic replay, synchronous 3-tier session reload checkpoints, and story Markdown transcript exports. Premade blueprints, profile taxonomies, and style catalogs live in `../definitions/`, bracket parsing lives in `@utils`, and session/log orchestration lives in `@engine`.

## Interface

The package exposes its public barrel via [`index.js`](./index.js). Unless noted below, exported module symbols are re-exported directly from [`index.js`](./index.js).

### 1. Barrel Entry Point (`index.js`)

- [`index.js`](./index.js) (`@data`): Re-exports the public surface of `records.js`, `card-codec.js`, `db.js` (including `require_active()`), `ledger.js`, `checkpoint.js`, and `exporters.js`. Contains zero Svelte runes, zero `state_bridge`, and zero upward imports.

### 2. 4-Quadrant Entity Records (`records.js`)

- [`records.js`](./records.js):
  - `normalize_entity(raw = {})`: Normalizes defaults, dynamics axes, voice config, visual modifiers (`prompt`, `negative_prompt`, `flipped`, `profile_picture_seed`, `last_generated_seed`), and all 4 quadrant strings (`eternal`, `present`, `future`, `past`) with uppercase `[@TARGET: ...]` prefixes.
  - `create_entity(type = "character", overrides = {})`: Creates a normalized `"character"` or `"fractal"` with scope-appropriate defaults (`default_dynamics_for_scope("somatic" | "fractal")`, `"1st_person"` for characters, `"3rd_person"` for fractals).
  - `filter_entity_epistemics(entity, options = {})`: Non-mutating clone filtering all 4 quadrant bracket strings via `format_clean_brackets` (`see_hidden`, `is_counterpart`, `strip_inventory`).
  - `serialize_entity_for_export(entity)`: Normalizes and strips `id`, `created_at`, `updated_at`, and `origin_id`.
  - `apply_profile_to_entity(entity, profile)`: Mutates and returns `entity`, mapping flat profile fields onto the 4-quadrant schema via `canonicalize_field_key` (appending `past`, replacing `future`, capping `tags` at 30, truncating `name` at 80, and skipping `profile_picture`, `image`, `id`, `type`).

### 3. Character Card Codec & PNG Metadata (`card-codec.js`)

- [`card-codec.js`](./card-codec.js):
  - `detect_card_format(payload_json)`: Returns `"v2" | "rpglitch" | "unknown"`.
  - `parse_character_card(payload_json)`: Maps TavernAI V2/V3 card fields into a flat RPGlitch profile.
  - `extract_card_from_png(binary_buffer)`: Scans binary PNG chunks for the `"chara"` `tEXt` chunk and decodes Base64 UTF-8 JSON.
  - `serialize_character_card(entity)`: Serializes an entity into a `chara_card_v2` JSON payload.
  - `serialize_rpglitch_entity(entity)`: Normalizes and delegates to `serialize_entity_for_export`.

### 4. Dexie Persistence Engine (`db.js`)

- Database & Lifecycle ([`db.js`](./db.js)):
  - `db`: Shared `Dexie("rpglitch")` instance.
  - `SESSION_ID_KEY` (`"active_session_id"`).
  - `init_db()`, `set_versionchange_quiesce(quiesce_callback)`, `coerce_story_key(id)`.
- Stories & Cast ([`db.js`](./db.js)):
  - `stories`: Facade `{ list, get, create, update, update_cast, active_entity_ids, conclude, delete }`.
  - `list_stories()`, `get_story(id)`, `create_story(data)`, `update_story(id, changes)`, `update_cast(id, npc_ids)`, `active_entity_ids()`, `conclude_story(id)`, `delete_story(id)`.
- Entities ([`db.js`](./db.js)):
  - `entities`: Polymorphic facade `{ list, get, upsert, update, delete, remove }`.
  - `seed_premades()`, `list_entities(type)`, `get_entity(id, expected_type = null)`, `upsert_entity(entity)`, `update_entity(id, changes)`, `delete_entity(id)`.
- Simulation Logs & Session Pointers ([`db.js`](./db.js)):
  - `append_log_entry(entry)`, `delete_log_entry(id)`, `edit_log_entry(id, new_text)`, `update_log_attachment(id, attachment_index, new_attachment)`, `delete_log_attachment(id, attachment_index)`, `get_story_log(story_id)`, `delete_story_log(story_id)`.
  - `record_session_access(session_id)`, `get_recent_sessions(limit = 10)`, `get_active_session_id()`, `require_active()`, `set_active_session_id(session_id)`, `clear_active_session_id()`.
  - Direct module export not in `index.js`: `_find_log_entry(id)`.

### 5. Mutation Ledger & Event-Sourced Provenance (`ledger.js`)

- [`ledger.js`](./ledger.js):
  - `append_ledger_entry(entry)`, `append_ledger_entries(entries)`: Appends state mutation diffs to `db.mutation_ledger`, skipping identical mutations and defaulting `writer`/`decider` to `"kernel"`.
  - `get_story_ledger(story_id)`, `query_entity_history(entity_id, field = null)`, `query_story_snapshot(story_id, max_round = Infinity, max_seq = Infinity)`.
  - `replay_entity_field(entity_id, field, up_to_round = Infinity, up_to_seq = Infinity)`: Reconstructs `{ key_values, entries_map, reconstructed_brackets, raw_prose }` up to `(up_to_round, up_to_seq)` using static `parse_bracket_entries` from `@utils`.
  - `replay_full_entity_at_round(entity_id, up_to_round = Infinity)`: Replays `eternal`, `present`, `past`, and `future` in parallel.

### 6. 3-Tier Session Checkpoint (`checkpoint.js`)

- [`checkpoint.js`](./checkpoint.js):
  - `CHECKPOINT_KEY` (`"rpglitch.session_checkpoint"`), `WINDOW_NAME_CHECKPOINT_PREFIX` (`"__RPGLITCH_CHECKPOINT__::"`).
  - `save_session_checkpoint(checkpoint)`, `load_session_checkpoint()`, `clear_session_checkpoint()`: Synchronous 3-tier reload survival across in-memory RAM (`_in_memory_checkpoint`), `window.sessionStorage`, and `window.name`.

### 7. Story Markdown Transcript & Export (`exporters.js`)

- [`exporters.js`](./exporters.js):
  - `format_story_beat(entry, options = {})`: Formats a simulation-log entry via `normalize_history_beat` into Markdown (`> ...` blockquotes for narrator/fractal beats, `**Name:** ...` for user/character beats, `_..._` for system notes when `options.include_system` is enabled, and `![prompt](src)` for image attachments), stripping `<think>` cognition blocks.
  - `export_story_markdown(story = {}, entries = [], options = {})`: Compiles a story record and chronological log entries into a Markdown transcript with title and state metadata header.
  - `build_story_export_filename(story = {}, date = new Date())`: Generates a sanitized download filename (`story-{slug}-{YYYY-MM-DD}.md`, slug capped at 48 characters).

## Invariants

- **Pure Persistence Layer & Downward-Only Imports (`index.js`, `records.js`, `card-codec.js`, `db.js`, `ledger.js`, `checkpoint.js`, `exporters.js`)**: `src/data/` contains zero Svelte runes, zero `state_bridge`, and zero upward imports; modules import solely from `dexie`, `@config`, `@definitions`, `@utils` (and `../utils/text.js` in `exporters.js`).
- **Dexie Schema Freeze (`db.js:db`)**: The IndexedDB `"rpglitch"` schema remains fixed at `version(2)` (`version(1)` defines `entities`, `stories`, `simulation_log`, `kv_settings`, `sessions`, `audio_prefs`; `version(2)` adds `mutation_ledger`) to prevent `versionchange` reload storms during parallel coexistence.
- **Single-Fire Versionchange & Seeding Locks (`db.js:db.on('versionchange')`, `db.js:seed_premades`)**: `_is_versionchange_pending` ensures quiesce, `db.close()`, and reload run at most once; `_is_seeding_active` prevents concurrent premade seeding races; `seed_premades()` also backfills premade characters with `pov !== "1st_person"`.
- **Empty Attachment Cleanup (`db.js:delete_log_attachment`)**: Deleting the last attachment of an entry with empty trimmed `text` and neither `meta.is_prologue` nor `meta.is_epilogue` deletes the parent `simulation_log` row.
- **Ledger Deduplication & Deterministic Replay (`ledger.js:append_ledger_entry`, `ledger.js:replay_entity_field`, `ledger.js:replay_full_entity_at_round`)**: Identical mutations are skipped (`is_identical_mutation`); entries default `writer`/`decider` to `"kernel"` and require `entity_id` and `field`. Replay stops at `(up_to_round, up_to_seq)`, deletes keys on `new_value === null` or `supersedes`, parses unkeyed bracket values statically via `parse_bracket_entries`, and omits default `visibility === "show"` and `weight === 5` when reconstructing brackets.
- **Adapt-on-Read & Clamped Dynamics (`records.js:normalize_entity`, `db.js:list_entities`, `db.js:get_entity`)**: Entity reads normalize via `normalize_entity`; dynamics axes are rounded and clamped to `[DYNAMICS.SCALE.MIN, DYNAMICS.SCALE.MAX]` (defaulting to `50`) across 4 character axes (`chaos`, `intensity`, `openness`, `affinity`) or 2 fractal axes (`velocity`, `entropy`). `normalize_relational_brackets` uppercases `[@target: ...]` prefixes; `past` wraps bare non-empty strings in `[MEMORY: ...]` and `future` wraps bare non-empty strings in `[AGENDA: ...]`.
- **3-Tier Checkpoint Fallback & Prefix Match (`checkpoint.js:save_session_checkpoint`, `checkpoint.js:load_session_checkpoint`, `checkpoint.js:clear_session_checkpoint`)**: Saves to RAM and `window.sessionStorage` (returning early if stored), falling back to `window.name` prefixed with `WINDOW_NAME_CHECKPOINT_PREFIX` (`"__RPGLITCH_CHECKPOINT__::"`); reads in the same tier order and clears all three tiers when the prefix matches.
- **Export Cognition Stripping & System Filtering (`exporters.js:format_story_beat`, `exporters.js:export_story_markdown`)**: Strips `<think>` cognition blocks (`include_cognition: false`), omits system entries unless `options.include_system` is truthy, and preserves resolved image rows via `keep_resolved_image_rows: true`.

## Side Effects

- **IndexedDB Persistence (`db.js`, `ledger.js`)**: Module initialization registers `"blocked"` and `"versionchange"` handlers on `Dexie("rpglitch")`; CRUD and ledger helpers read/write/delete across `entities`, `stories`, `simulation_log`, `kv_settings`, `sessions`, and `mutation_ledger`.
- **Browser Storage & Global Navigation (`checkpoint.js`, `db.js`)**: `save_session_checkpoint` / `load_session_checkpoint` / `clear_session_checkpoint` mutate module-local `_in_memory_checkpoint`, `window.sessionStorage`, and `window.name`; `db.on("versionchange")` invokes `_versionchange_quiesce` and `window.location.reload()`.
- **No Reactive State, Timers, or LLM Calls**: `src/data/` registers no Svelte stores, DOM event listeners, timers, or `@engine`/`@media` jobs.

## Verification

- Run: `npm run test:unit`
