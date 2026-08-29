/**
 * ============================================================================
 * RPGlitch Data Layer Sovereign Barrel Export
 * ============================================================================
 *
 * @file src/data/index.js
 * @description Central barrel export providing unified access to IndexedDB
 * storage, repositories, session drivers, entity normalization, card conversion,
 * and canonical domain definitions (styles, profiles, premade entities).
 *
 * Architectural Laws:
 * - Unidirectional layer flow: Data layer must never import from UI or State.
 * - Single source of truth: All persistent state interfaces and schema
 *   definitions are routed through this barrel.
 *
 * ============================================================================
 */

// ============================================================================
// Database & Persistence
// ============================================================================

export { db, init_db, set_versionchange_quiesce } from "./db.js";

// ============================================================================
// Repositories & State Bridges
// ============================================================================

export { seed_premades, stories, entities, coerce_story_key } from "./repository.js";

// ============================================================================
// Sessions & Lifecycle Drivers
// ============================================================================

export { session_driver, SESSION_ID_KEY } from "./sessions.svelte.js";

// ============================================================================
// Normalization & Serialization
// ============================================================================

export { normalize, create_new, format_premade, serialize_entity_for_export } from "./normalizer.js";

// ============================================================================
// Character Card Parsing & Conversion
// ============================================================================

export {
  detect_card_format,
  extract_card_from_png,
  parse_character_card,
  serialize_character_card,
  serialize_rpglitch_entity,
} from "./card-conversion.js";

// ============================================================================
// Premade Entities & Archetype Registries
// ============================================================================

export {
  premade,
  PREMADE_ENTITIES,
  PREMADE_CHARACTERS,
  PREMADE_FRACTALS,
  PREMADE_ENTITY_MAP,
  get_premade_entity_by_id,
  has_premade_entity,
  get_premade_characters,
  get_premade_fractals,
} from "./definitions/premade-entities.js";

// ============================================================================
// Speaking Styles & Dialogue Registries
// ============================================================================

export { SPEAKING_STYLES, VALID_SPEAKING_STYLES, is_valid_speaking_style, SPEAKING_STYLE_RULES } from "./definitions/speaking-styles.js";

// ============================================================================
// Narrative Styles & Motif Registries
// ============================================================================

export {
  NARRATIVE_STYLES,
  STYLE_MOTIF_REGISTRY,
  get_narrative_style,
  get_style_keywords,
  resolve_active_style_key,
  render_narrative_style_xml,
} from "./definitions/narrative-styles.js";

// ============================================================================
// Visual Styles & Aesthetic Registries
// ============================================================================

export { VISUAL_STYLES, get_visual_style, resolve_portrait_visual_style_key, resolve_story_visual_style_key } from "./definitions/visual-styles.js";

// ============================================================================
// Profile Fields & Attribute Specifications
// ============================================================================

export {
  PROFILE_FIELDS,
  PROFILE_FIELD_CATALOG,
  PROFILE_SECTIONS_BY_TYPE,
  FLAT_LEAF_MAP,
  build_profile_sections,
} from "./definitions/profile-fields.js";

// ============================================================================
// Palette & Color Constants
// ============================================================================

export { SIGNATURE_COLORS } from "./definitions/signature-colors.js";

// ============================================================================
// Style & Prose Resolution Proxies
// ============================================================================

export { detox_prose, resolve_speaking_style, resolve_style } from "@utils";

/**
 * CHANGELOG:
 * - 2026-08-29: Structured into canonical functional sections with universal header/footer architecture (/harmonize).
 */
