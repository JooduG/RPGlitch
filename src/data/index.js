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
  apply_bracket_deltas,
  clean_image_prompts,
  extract_entity_relationships,
  extract_memory_candidates,
  filter_epistemic_brackets,
  format_clean_brackets,
  parse_bracket_entries,
  parse_bracket_token,
  parse_brackets,
  parse_profile_json,
  parse_think_block,
  strip_bracket_engine_flags,
  strip_covert_directives,
} from "./parser.js";

// 2. Profile Fields, Leaf Mapping & Enhancers
// (retired - single home is now ../definitions/profile-taxonomy.js; import from there)

// 3. Premades & Author Narrative Presets
export {
  ALL_PREMADES,
  get_narrative_preset,
  get_starter_entities,
  get_starter_entity_by_id,
  NARRATIVE_PRESETS,
  PREMADE_CHARACTERS,
  PREMADE_FRACTALS,
} from "./presets.js";

// 4. 4-Quadrant Entity Model & Normalizer
export {
  apply_profile_to_entity,
  birth_entity_core,
  create_entity,
  filter_entity_epistemics,
  normalize_entity,
  serialize_entity_for_export,
  structure_profile,
} from "./entities.js";

// 4b. Character Card Conversion & PNG Metadata
export { detect_card_format, extract_card_from_png, parse_character_card, serialize_character_card, serialize_rpglitch_entity } from "./card-conversion.js";

// 5. Dexie Persistence Engine
export {
  active_entity_ids,
  append_ledger_entries,
  append_ledger_entry,
  append_log_entry,
  CHECKPOINT_KEY,
  clear_active_session_id,
  clear_session_checkpoint,
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
  get_story_ledger,
  get_story_log,
  init_db,
  list_entities,
  list_stories,
  load_session_checkpoint,
  query_entity_history,
  query_story_snapshot,
  record_session_access,
  replay_entity_field,
  replay_full_entity_at_round,
  save_session_checkpoint,
  seed_premades,
  SESSION_ID_KEY,
  set_active_session_id,
  set_versionchange_quiesce,
  stories,
  update_cast,
  update_entity,
  update_log_attachment,
  update_story,
  upsert_entity,
  WINDOW_NAME_CHECKPOINT_PREFIX,
} from "./db.js";

// 6. Session Driver & Lifecycle Manager
export { session_driver } from "./sessions.svelte.js";

// 7. Dialogue & Developer Telemetry Log Stores
export { developer_log, DEVELOPER_TELEMETRY_STORAGE_KEY, DeveloperLogStore, simulation_log, SimulationLogStore } from "./log.svelte.js";
