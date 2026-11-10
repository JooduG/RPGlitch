/**
 * src/data/index.js
 * ============================================================================
 * 📦 SOVEREIGN DATA & PERSISTENCE BARREL (@data)
 * ============================================================================
 *
 * Single entry point for Rank 2 Persistence Layer:
 * - Tokenization, Delta Merging & Epistemic Wall
 * - 4-Quadrant Entity Model, Factory & Export
 * - Flat Leaf Taxonomy & Enhancer Directives
 * - 10 Premade Archetypes & Inlined Author Narrative Presets
 * - Promise-based Dexie CRUD Engine & Mutation Ledger
 * ============================================================================
 */

// 1. Bracket Parser, Delta Merging & Epistemic Wall
export {
  parse_bracket_token,
  parse_brackets,
  parse_bracket_entries,
  format_clean_brackets,
  apply_bracket_deltas,
  extract_memory_candidates,
  extract_entity_relationships,
  parse_profile_json,
  clean_image_prompts,
  parse_think_block,
  filter_epistemic_brackets,
  strip_covert_directives,
  strip_bracket_engine_flags,
} from "./parser.js";

// 2. Profile Fields, Leaf Mapping & Enhancers
// (retired — single home is now ../definitions/profile-taxonomy.js; import from there)

// 3. Premades & Author Narrative Presets
export {
  PREMADE_CHARACTERS,
  PREMADE_FRACTALS,
  ALL_PREMADES,
  NARRATIVE_PRESETS,
  get_starter_entities,
  get_starter_entity_by_id,
  get_narrative_preset,
} from "./presets.js";

// 4. 4-Quadrant Entity Model & Normalizer
export {
  normalize_entity,
  create_entity,
  filter_entity_epistemics,
  serialize_entity_for_export,
  structure_profile,
  apply_profile_to_entity,
  birth_entity_core,
} from "./entities.js";

// 4b. Character Card Conversion & PNG Metadata
export {
  detect_card_format,
  parse_character_card,
  extract_card_from_png,
  serialize_character_card,
  serialize_rpglitch_entity,
} from "./card-conversion.js";

// 5. Dexie Persistence Engine
export {
  db,
  init_db,
  SESSION_ID_KEY,
  clear_session_checkpoint,
  load_session_checkpoint,
  save_session_checkpoint,
  CHECKPOINT_KEY,
  WINDOW_NAME_CHECKPOINT_PREFIX,
  coerce_story_key,
  list_stories,
  get_story,
  create_story,
  update_story,
  update_cast,
  active_entity_ids,
  conclude_story,
  delete_story,
  seed_premades,
  set_versionchange_quiesce,
  list_entities,
  get_entity,
  upsert_entity,
  update_entity,
  delete_entity,
  append_log_entry,
  delete_log_entry,
  edit_log_entry,
  update_log_attachment,
  delete_log_attachment,
  get_story_log,
  delete_story_log,
  record_session_access,
  get_recent_sessions,
  get_active_session_id,
  set_active_session_id,
  clear_active_session_id,
  append_ledger_entry,
  append_ledger_entries,
  get_story_ledger,
  query_entity_history,
  query_story_snapshot,
  replay_entity_field,
  replay_full_entity_at_round,
  stories,
  entities,
} from "./db.js";

// 6. Session Driver & Lifecycle Manager
export { session_driver } from "./sessions.svelte.js";

// 7. Dialogue & Developer Telemetry Log Stores
export { simulation_log, developer_log, DEVELOPER_TELEMETRY_STORAGE_KEY, SimulationLogStore, DeveloperLogStore } from "./log.svelte.js";
