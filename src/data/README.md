# RPGlitch Data & Persistence Layer (`src/data/`)

## Overview

`src/data/` is the Rank 2 persistence, state-modeling, and text-tokenization package for **RPGlitch**. It owns the IndexedDB schema via Dexie (`"rpglitch"`), the canonical 4-quadrant entity schema (`eternal`, `present`, `future`, `past`), bracketed pseudo-JSON delta parsing and epistemic filtering, TavernAI character card and PNG metadata conversion, premade character/fractal blueprints and narrative presets, active session lifecycle management, and Svelte 5 reactive simulation and developer log stores.

## Interface

The package exposes its public barrel via [`index.js`](./index.js). Unless noted below, exported module symbols are re-exported directly from [`index.js`](./index.js).

### 1. Barrel Entry Point (`index.js`)

- [`index.js`](./index.js): Re-exports the public surface of `parser.js`, `presets.js`, `entities.js`, `card-conversion.js`, `db.js`, `sessions.svelte.js`, and `log.svelte.js`. Profile field taxonomy (`PROFILE_FIELDS` and leaf mappings) lives in `../definitions/profile-taxonomy.js` rather than this barrel.

### 2. Dexie Persistence, Mutation Ledger & Checkpoints (`db.js`)

- Database & Keys ([`db.js`](./db.js)):
  - `db`: Shared `Dexie("rpglitch")` instance.
  - `SESSION_ID_KEY` (`"active_session_id"`), `CHECKPOINT_KEY` (`"rpglitch.session_checkpoint"`), `WINDOW_NAME_CHECKPOINT_PREFIX` (`"__RPGLITCH_CHECKPOINT__:"`).
  - `init_db()`, `set_versionchange_quiesce(quiesce_callback)`, `coerce_story_key(id)`.
- Stories & Cast ([`db.js`](./db.js)):
  - `stories`: Facade `{ list, get, create, update, update_cast, active_entity_ids, conclude, delete }`.
  - `list_stories()`, `get_story(id)`, `create_story(data)`, `update_story(id, changes)`, `update_cast(id, npc_ids)`, `active_entity_ids()`, `conclude_story(id)`, `delete_story(id)`.
- Entities ([`db.js`](./db.js)):
  - `entities`: Polymorphic facade `{ list, get, upsert, update, delete, remove }`.
  - `seed_premades()`, `list_entities(type)`, `get_entity(id, expected_type = null)`, `upsert_entity(entity)`, `update_entity(id, changes)`, `delete_entity(id)`.
- Simulation Logs & Sessions ([`db.js`](./db.js)):
  - `append_log_entry(entry)`, `delete_log_entry(id)`, `edit_log_entry(id, new_text)`, `update_log_attachment(id, attachment_index, new_attachment)`, `delete_log_attachment(id, attachment_index)`, `get_story_log(story_id)`, `delete_story_log(story_id)`, `log_message(text, role, character_name, options)`.
  - `record_session_access(session_id)`, `get_recent_sessions(limit = 10)`, `get_active_session_id()`, `set_active_session_id(session_id)`, `clear_active_session_id()`.
  - Direct module exports not in `index.js`: `_find_log_entry(id)`, `require_active()`.
- Mutation Ledger & Deterministic Replay ([`db.js`](./db.js)):
  - `append_ledger_entry(entry)`, `append_ledger_entries(entries)`, `get_story_ledger(story_id)`, `query_entity_history(entity_id, field = null)`, `query_story_snapshot(story_id, max_round = Infinity, max_seq = Infinity)`, `replay_entity_field(entity_id, field, up_to_round = Infinity, up_to_seq = Infinity)`, `replay_full_entity_at_round(entity_id, up_to_round = Infinity)`.
- Reload Checkpoints ([`db.js`](./db.js)):
  - `save_session_checkpoint(checkpoint)`, `load_session_checkpoint()`, `clear_session_checkpoint()`.

### 3. 4-Quadrant Entity Model & Genesis (`entities.js`)

- Entity Lifecycle ([`entities.js`](./entities.js)):
  - `normalize_entity(raw = {})`: Normalizes defaults, dynamics axes, voice config, modifiers, and all 4 quadrant strings (`eternal`, `present`, `future`, `past`) with uppercase `[@TARGET: ...]` prefixes.
  - `create_entity(type = "character", overrides = {})`: Creates a normalized `"character"` or `"fractal"` with scope-appropriate defaults.
  - `filter_entity_epistemics(entity, options = {})`: Non-mutating clone filtering quadrant brackets via `format_clean_brackets`.
  - `serialize_entity_for_export(entity)`: Normalizes and strips `id`, `created_at`, `updated_at`, and `origin_id`.
  - `structure_profile(raw, type = "character")`: Async Caretaker sorter wrapper delegating to `@engine`.
  - `apply_profile_to_entity(entity, profile)`: Maps flat profile fields onto the 4-quadrant schema via `canonicalize_field_key`.
  - `birth_entity_core(type, draft = {}, options = {})`: Full genesis flow (optional sorting, Dexie persistence, round-0 genesis ledger entries, story cast registration, and background portrait generation).

### 4. Bracket Parser, Delta Merging & Epistemic Wall (`parser.js`)

- Tokenization & Deltas ([`parser.js`](./parser.js)):
  - `parse_bracket_token(bracket_string)`: Parses `[KEY: VALUE | flags]` into `{ key, value, flags: { hide, show, is_origin, weight }, raw } | null`.
  - `parse_brackets(text)`, `parse_bracket_entries(text)`: Extract balanced `[...]` tokens and positional metadata (`visibility`, `weight`, `status`, `start_index`, `end_index`).
  - `format_clean_brackets(brackets_text, options = {})`: Filters `INVENTORY`/`STASH` and `hide` entries by perspective (`see_hidden`, `is_counterpart`, `strip_inventory`) and strips flags.
  - `apply_bracket_deltas(existing_text, delta_text)`: Merges delta tokens onto existing brackets (deletes on `none`/`cleared`, appends `INVENTORY`/`STASH`, overwrites single-value keys in-place).
- Extraction & Sanitization ([`parser.js`](./parser.js)):
  - `extract_memory_candidates(past_text)`, `extract_entity_relationships(entity, known_entities = [], perspective = "owner", ambient_entities = {})`.
  - `parse_profile_json(raw)`, `clean_image_prompts(text)`, `parse_think_block(text)`.
  - `filter_epistemic_brackets(text, perspective = "other")`, `strip_covert_directives(text)`, `strip_bracket_engine_flags(text)`.

### 5. Character Card Conversion & PNG Metadata (`card-conversion.js`)

- Import & Export ([`card-conversion.js`](./card-conversion.js)):
  - `detect_card_format(payload_json)`: Returns `"v2" | "rpglitch" | "unknown"`.
  - `parse_character_card(payload_json)`: Maps TavernAI V2/V3 card fields into a flat RPGlitch profile.
  - `extract_card_from_png(binary_buffer)`: Scans binary PNG chunks for the `"chara"` `tEXt` chunk and decodes Base64 UTF-8 JSON.
  - `serialize_character_card(entity)`, `serialize_rpglitch_entity(entity)`.

### 6. Premade Archetypes & Narrative Presets (`presets.js`)

- Blueprints & Presets ([`presets.js`](./presets.js)):
  - `PREMADE_CHARACTERS` (7 frozen character blueprints), `PREMADE_FRACTALS` (3 frozen fractal blueprints), `ALL_PREMADES` (10 combined blueprints).
  - `NARRATIVE_PRESETS` (5 frozen presets: `cormac_mccarthy`, `william_gibson`, `anais_nin`, `david_lynch`, `arthur_morgan`).
  - `get_starter_entities(type)`, `get_starter_entity_by_id(id)`, `get_narrative_preset(id)`.
  - Direct module exports not in `index.js`: `PREMADE_ENTITY_MAP`, `get_premade_entity_by_id(id)`, `has_premade_entity(id)`, `get_premade_characters()`, `get_premade_fractals()`.

### 7. Session Driver & Reactive Log Stores (`sessions.svelte.js`, `log.svelte.js`)

- Active Session Controller ([`sessions.svelte.js`](./sessions.svelte.js)):
  - `session_driver`: Exposes `active_id` getter and `require_active()`, `set_active(id)`, `restore_active(id)`, `clear_active()`, `create_from_selection(selection)`, `send(text)`, `regenerate()`, `delete_log_entry(id)`, `edit_log_entry(id, new_text)`, `update_log_attachment(id, attachment_index, new_attachment)`, `delete_log_attachment(id, attachment_index)`, `log_message(text, role, character_name, options)`, `load_log(story_id)`, `log_system_entry(text, role, meta, story_id, round)`.
- Reactive Stores ([`log.svelte.js`](./log.svelte.js)):
  - `DEVELOPER_TELEMETRY_STORAGE_KEY` (`"dev_telemetry"`).
  - `SimulationLogStore`, singleton `simulation_log` (`feed` state + `refresh`, `add`, `update`, `remove`, `delete_entry`, `delete_attachment`, `edit_entry`, `get_recent_window`, `clear`).
  - `DeveloperLogStore`, singleton `developer_log` (`entries` getter + `flush`, `log`, `hydrate`, `clear`).
  - Direct module export not in `index.js`: `resolve_entity_id_by_name(name)`.

## Invariants

- **Dexie Schema Freeze (`db.js:db`)**: The IndexedDB `"rpglitch"` schema remains fixed at `version(2)` (`version(1)` defines `entities`, `stories`, `simulation_log`, `kv_settings`, `sessions`, `audio_prefs`; `version(2)` adds `mutation_ledger`) to prevent `versionchange` reload storms during parallel coexistence.
- **Single-Fire Versionchange & Seeding Locks (`db.js:db.on('versionchange')`, `db.js:seed_premades`)**: `_is_versionchange_pending` ensures quiesce, `db.close()`, and reload run at most once; `_is_seeding_active` prevents concurrent premade seeding races.
- **Ledger Deduplication & Deterministic Replay (`db.js:append_ledger_entry`, `db.js:replay_entity_field`, `db.js:replay_full_entity_at_round`)**: Identical mutations are skipped (`is_identical_mutation`); entries default `writer`/`decider` to `"kernel"` and require `entity_id` and `field`. Replay stops at `(up_to_round, up_to_seq)`, deletes keys on `new_value === null` or `supersedes`, and omits default `visibility === "show"` and `weight === 5` when reconstructing brackets.
- **Adapt-on-Read & Clamped Dynamics (`entities.js:normalize_entity`, `db.js:list_entities`, `db.js:get_entity`)**: Entity reads normalize via `normalize_entity`; dynamics axes are rounded and clamped to `[DYNAMICS.SCALE.MIN, DYNAMICS.SCALE.MAX]` (defaulting to `50`) across 4 character axes (`chaos`, `intensity`, `openness`, `affinity`) or 2 fractal axes (`velocity`, `entropy`).
- **Round-0 Genesis & Error Isolation (`entities.js:birth_entity_core`)**: Genesis ledger entries are emitted strictly at `round: 0, seq: 0, writer: "genesis", decider: "genesis"`; cast registration applies only when `type === "character" && story_id && story_id !== "debug"`; portrait generation failures never abort entity creation.
- **Brace-Safe Bracket Parsing & Epistemic Isolation (`parser.js:parse_bracket_token`, `parser.js:parse_bracket_entries`, `parser.js:filter_epistemic_brackets`)**: Top-level `|` delimiters inside `{ ... }` alternation blocks (`brace_depth > 0`) are ignored. `format_clean_brackets` strips `INVENTORY`/`STASH` when `strip_inventory || see_hidden === "none"` and omits `hide` entries unless owned by the caller.
- **Round-Bounded Regeneration & Empty Attachment Cleanup (`sessions.svelte.js:session_driver.regenerate`, `sessions.svelte.js:session_driver.delete_log_attachment`, `db.js:delete_log_attachment`)**: `regenerate()` stops before rounds earlier than `target_round` and preserves `STORY_START`, `is_prologue`, `is_epilogue`, and earlier telemetry. Deleting the last attachment of an entry with empty trimmed `text` and no prologue/epilogue flag deletes the parent `simulation_log` row.
- **Bounded Telemetry & Silent Storage Degradation (`log.svelte.js:DeveloperLogStore`)**: `#entries` is capped at `TELEMETRY_CAPS.DEVELOPER_LOG_ENTRIES` (500) and all IndexedDB telemetry reads/writes swallow errors so telemetry never interrupts narrative execution.
- **Cross-Layer Import Exceptions (`log.svelte.js:runtime`, `entities.js:structure_profile`, `entities.js:birth_entity_core`)**: `sessions.svelte.js` avoids upward imports by routing through `state_bridge` and `stories_bridge`, whereas `log.svelte.js` directly imports `runtime` from `@engine` and `entities.js` dynamically imports `@engine` and `@media`.
- **Fallback Narrative Preset (`presets.js:get_narrative_preset`)**: Missing or unknown preset IDs fall back to `NARRATIVE_PRESETS.cormac_mccarthy`.

## Side Effects

- **IndexedDB Persistence (`db.js`, `sessions.svelte.js`, `log.svelte.js`)**: Module initialization opens `Dexie("rpglitch")` handlers (`blocked`, `versionchange`); CRUD operations read/write/delete across `entities`, `stories`, `simulation_log`, `kv_settings`, `sessions`, and `mutation_ledger`.
- **Browser Storage & Global Navigation (`db.js`)**: `save_session_checkpoint` / `load_session_checkpoint` / `clear_session_checkpoint` mutate in-memory checkpoint state, `window.sessionStorage`, and `window.name`; `db.on('versionchange')` invokes `_versionchange_quiesce` and `window.location.reload()`.
- **Svelte Reactive State & Timers (`log.svelte.js`, `sessions.svelte.js`)**: Instantiating `simulation_log` and `developer_log` creates reactive `$state` / `SvelteSet` stores, registers `window` `"pagehide"` and `document` `"visibilitychange"` listeners, and schedules 500ms `setTimeout` persistence flushes into `db.kv_settings`.
- **State Bridges & Dynamic Cross-Layer Jobs (`entities.js`, `sessions.svelte.js`)**: `sessions.svelte.js` mutates `state_bridge.runtime`, `state_bridge.simulation_state`, `state_bridge.simulation_log`, and `stories_bridge`; `entities.js` invokes Caretaker LLM sorting (`@engine`), fire-and-forget portrait synthesis (`@media`), and `state_bridge.app?.log` / `console.warn` diagnostics; `db.js:replay_entity_field` dynamically imports `./parser.js` at runtime.

## Verification

- Run: `npm run test:unit`
