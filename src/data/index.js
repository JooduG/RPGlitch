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
 * - Dexie Persistence Engine (`db.js`: stories, entities, schema, seeding)
 * - Session Tracking, Story Sessions & Simulation Log (`session.js`)
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

// 3. Dexie Persistence Engine (stories, entities, schema, seeding)
export {
  active_entity_ids,
  coerce_story_key,
  conclude_story,
  create_story,
  db,
  delete_entity,
  delete_story,
  entities,
  get_entity,
  get_story,
  init_db,
  list_entities,
  seed_premades,
  set_versionchange_quiesce,
  stories,
  update_cast,
  update_entity,
  update_story,
  upsert_entity,
} from "./db.js";

// 3b. Session Tracking, Story Sessions & Simulation Log (pure Rank 2 service)
export {
  SESSION_ID_KEY,
  _find_log_entry,
  bind_session_store,
  clear_active_session_id,
  create_from_selection,
  delete_log_attachment,
  delete_log_entry,
  delete_story_log,
  edit_log_entry,
  get_active_session_id,
  get_recent_sessions,
  get_story_log,
  load_log,
  log_message,
  match_speaker_snapshots,
  record_session_access,
  regenerate,
  require_active,
  resolve_log_entity_id,
  resolve_story_round,
  send,
  set_active_session_id,
  update_log_attachment,
} from "./session.js";

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
