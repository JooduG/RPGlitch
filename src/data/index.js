/**
 * src/data/index.js
 * ============================================================================
 * 📦 SOVEREIGN DATA & PERSISTENCE BARREL (@data)
 * ============================================================================
 *
 * Single entry point for the pure persistence layer (zero Svelte runes,
 * zero `state_bridge`, zero upward imports):
 * - 4-Quadrant Entity Records (`records.js`)
 * - Character Card Codec (`card-codec.js`)
 * - Dexie Persistence Engine (`db.js`)
 * - Mutation Ledger & Event-Sourced Provenance (`ledger.js`)
 * - 3-Tier Session Checkpoint (`checkpoint.js`)
 * - Story Markdown Transcript & Export (`exporters.js`)
 *
 * Orchestration (session driver, simulation log) lives in `@engine`.
 * ============================================================================
 */

// 1. 4-Quadrant Entity Records (normalize, factory, epistemics, export, profile apply)
export { apply_profile_to_entity, create_entity, filter_entity_epistemics, normalize_entity, serialize_entity_for_export } from "./records.js";

// 2. Character Card Conversion Codec & PNG Metadata
export { detect_card_format, extract_card_from_png, parse_character_card, serialize_character_card, serialize_rpglitch_entity } from "./card-codec.js";

// 3. Dexie Persistence Engine
export {
  active_entity_ids,
  append_log_entry,
  clear_active_session_id,
  coerce_story_key,
  conclude_story,
  create_story,
  db,
  delete_entity,
  delete_log_attachment,
  delete_log_entry,
  delete_story,
  delete_story_log,
  edit_log_entry,
  entities,
  get_active_session_id,
  get_entity,
  get_recent_sessions,
  get_story,
  get_story_log,
  init_db,
  list_entities,
  record_session_access,
  require_active,
  SESSION_ID_KEY,
  seed_premades,
  set_active_session_id,
  set_versionchange_quiesce,
  stories,
  update_cast,
  update_entity,
  update_log_attachment,
  update_story,
  upsert_entity,
} from "./db.js";

// 4. Mutation Ledger & Event-Sourced Provenance
export {
  append_ledger_entries,
  append_ledger_entry,
  get_story_ledger,
  query_entity_history,
  query_story_snapshot,
  replay_entity_field,
  replay_full_entity_at_round,
} from "./ledger.js";

// 5. 3-Tier Session Checkpoint (RAM -> sessionStorage -> window.name)
export { CHECKPOINT_KEY, clear_session_checkpoint, load_session_checkpoint, save_session_checkpoint, WINDOW_NAME_CHECKPOINT_PREFIX } from "./checkpoint.js";

// 6. Story Markdown Transcript & Export
export { build_story_export_filename, export_story_markdown, format_story_beat } from "./exporters.js";
