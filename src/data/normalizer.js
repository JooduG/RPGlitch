/**
 * ============================================================================
 * src/data/normalizer.js
 * 🧪 ENTITY NORMALIZATION & SCHEMA COMPLIANCE ENGINE
 * ============================================================================
 *
 * Single source of truth for normalizing, sanitizing, and validating RPGlitch
 * entity data models (Characters and Fractals) against the Four-Quadrant schema:
 *   - Eternal:  Baseline physical and non-physical identity facts.
 *   - Present:  Active, momentary physical states and psychological condition.
 *   - Past:     Semantic memory vectors (RAG anchors with origin provenance).
 *   - Future:   Impending standing agenda and active trajectory prose.
 *
 * RESPONSIBILITIES:
 *   1. Enforce strict type constraints, string bounds, and HTML sanitization.
 *   2. Clamp physics dynamics sliders to the canonical [1, 100] integer scale.
 *   3. Enforce World-Cast relationship graph bounds (<=40 links, <=240 chars).
 *   4. Format and cap macro-quest chapter archives (<=12 chapters).
 *   5. Produce pristine factory entity instances with typed UUID prefixes.
 *   6. Scrub transient database IDs and internal embeddings for clean exports.
 *
 * EXPORTS:
 *   - ENTITY_TEMPLATES:                 Baseline blueprints for Characters and Fractals.
 *   - normalize(base):                  Normalizes raw objects into guaranteed entity schema.
 *   - create_new(type, overrides):       Instantiates a fresh entity with timestamps and UUID.
 *   - format_premade(data, type):        Formats catalog premades for database storage.
 *   - coerce_temporal_vectors(value):   Normalizes memory vector objects with origin stamps.
 *   - coerce_temporal_array(value):     Parses raw strings/arrays into clean string lists.
 *   - serialize_entity_for_export(ent): Strips transient database fields for export.
 *   - get_random_signature_key():        Selects a random palette signature color.
 *
 * DEPENDENCIES:
 *   - `@utils`: generate_uuid, pick_random
 *   - `@platform`: security.sanitize
 *   - `./definitions/signature-colors.js`: SIGNATURE_COLORS
 *   - `./definitions/speaking-styles.js`: is_valid_speaking_style
 * ============================================================================
 */

import { generate_uuid, pick_random } from "@utils";
import { security } from "@platform";
import { SIGNATURE_COLORS } from "./definitions/signature-colors.js";
import { is_valid_speaking_style } from "./definitions/speaking-styles.js";

const sanitize_html = (/** @type {any} */ value) => security.sanitize(value);

// ============================================================================
// 1. FACTORY ENTITY TEMPLATES
// ============================================================================

/**
 * Baseline factory definitions for entities created in the Library.
 * Fields initialize to empty strings so UI placeholder attributes render properly.
 */
export const ENTITY_TEMPLATES = {
  character: {
    name: "New Character",
    type: "character",
    description: "",
    dynamics: {
      chaos: 50,
      intensity: 50,
      openness: 50,
      affinity: 50,
    },
    eternal: { physical: "", non_physical: "" },
    present: { physical: "", non_physical: "" },
    modifiers: {
      prompt: "",
      negative_prompt: "",
      flipped: false,
      profile_picture_seed: 0,
      last_generated_seed: null,
      color_name: "",
    },
    past: [],
    future: "",
    visual_style: "none",
    pov: "1st_person",
    speaking_style: "",
    is_wanderer: false,
    relationships: [],
    chapters: [],
  },
  fractal: {
    name: "New Fractal",
    type: "fractal",
    description: "",
    dynamics: {
      velocity: 50,
      entropy: 50,
    },
    eternal: { physical: "", non_physical: "" },
    present: { physical: "", non_physical: "" },
    past: [],
    future: "",
    narrative_style: "",
    visual_style: "none",
    pov: "3rd_person",
    speaking_style: "",
    is_wanderer: false,
    relationships: [],
    chapters: [],
  },
};

/**
 * Utility to safely select a random signature color from the canonical palette.
 * @returns {string}
 */
export function get_random_signature_key() {
  return pick_random(SIGNATURE_COLORS);
}

// ============================================================================
// 2. EXTRACTION & FIELD NORMALIZATION HELPERS
// ============================================================================

/**
 * Normalizes entity name with sanitization, single-line flattening, and length capping.
 * @param {any} raw_name
 * @returns {string}
 */
function normalize_name(raw_name) {
  const sanitized_text = sanitize_html(raw_name || "")
    .replace(/[\r\n]+/g, " ")
    .trim();
  return sanitized_text.length > 80 ? sanitized_text.slice(0, 80).trim() : sanitized_text;
}

/**
 * Resolves and validates a signature color against the palette.
 * @param {any} raw_color
 * @returns {string}
 */
function normalize_signature_color(raw_color) {
  const parsed_color = sanitize_html(String(raw_color || "")).trim();
  return SIGNATURE_COLORS.includes(parsed_color) ? parsed_color : get_random_signature_key();
}

/**
 * Resolves visual style preset string.
 * @param {any} raw_style
 * @returns {string}
 */
function normalize_visual_style(raw_style) {
  const parsed_style = sanitize_html(String(raw_style || "")).trim();
  return parsed_style && parsed_style !== "default" ? parsed_style : "none";
}

/**
 * Resolves entity narrative point of view.
 * @param {any} raw_pov
 * @param {'character'|'fractal'} resolved_type
 * @returns {string}
 */
function normalize_point_of_view(raw_pov, resolved_type) {
  const parsed_pov = sanitize_html(String(raw_pov || "")).trim();
  if (parsed_pov === "1st_person" || parsed_pov === "3rd_person") return parsed_pov;
  return resolved_type === "fractal" ? "3rd_person" : "1st_person";
}

/**
 * Validates speaking style against canonical registry.
 * @param {any} raw_speaking_style
 * @returns {string}
 */
function normalize_speaking_style(raw_speaking_style) {
  const parsed_style = sanitize_html(String(raw_speaking_style || "")).trim();
  return is_valid_speaking_style(parsed_style) ? parsed_style : "";
}

/**
 * Normalizes tag strings array.
 * @param {any} raw_tags
 * @returns {string[]}
 */
function normalize_tags(raw_tags) {
  return (Array.isArray(raw_tags) ? raw_tags : [])
    .map((tag) => (tag != null ? sanitize_html(String(tag).trim()) : ""))
    .filter(Boolean)
    .slice(0, 30);
}

/**
 * Normalizes entity relationships array.
 * @param {any} raw_relationships
 * @returns {string[]}
 */
function normalize_relationships(raw_relationships) {
  return (Array.isArray(raw_relationships) ? raw_relationships : [])
    .map((relationship) => (relationship != null ? sanitize_html(String(relationship)).trim() : ""))
    .filter(Boolean)
    .map((relationship) => (relationship.length > 240 ? `${relationship.slice(0, 240).trim()}…` : relationship))
    .slice(0, 40);
}

/**
 * Normalizes chapter archive entries.
 * @param {any} raw_chapters
 * @returns {Array<{id: string, title: string, summary: string, agenda: string, status: 'open'|'closed', created_at: number, closed_at: number}>}
 */
function normalize_chapters(raw_chapters) {
  return (Array.isArray(raw_chapters) ? raw_chapters : [])
    .map((chapter) => {
      if (!chapter || typeof chapter !== "object") return null;
      const title = sanitize_html(String(chapter.title || ""))
        .trim()
        .slice(0, 80);
      return {
        id: sanitize_html(String(chapter.id || ""))
          .trim()
          .slice(0, 40),
        title: title || "Untitled chapter",
        summary: sanitize_html(String(chapter.summary || ""))
          .trim()
          .slice(0, 400),
        agenda: sanitize_html(String(chapter.agenda || ""))
          .trim()
          .slice(0, 600),
        status: chapter.status === "open" || chapter.status === "closed" ? chapter.status : "closed",
        created_at: Number(chapter.created_at) || 0,
        closed_at: chapter.closed_at ? Number(chapter.closed_at) || 0 : 0,
      };
    })
    .filter(Boolean)
    .slice(-12);
}

/**
 * Clamps and structures physics dynamics according to entity template axes.
 * @param {any} raw_dynamics
 * @param {Record<string, number>} template_dynamics
 * @returns {Record<string, number>}
 */
function normalize_dynamics(raw_dynamics, template_dynamics) {
  const valid_axes = Object.keys(template_dynamics);
  const normalized_dynamics = {};
  const source_dynamics = raw_dynamics && typeof raw_dynamics === "object" ? raw_dynamics : template_dynamics;

  for (const axis of valid_axes) {
    const raw_value = source_dynamics[axis];
    const numeric_value = Number(raw_value);
    normalized_dynamics[axis] = Number.isFinite(numeric_value) ? Math.max(1, Math.min(100, Math.round(numeric_value))) : template_dynamics[axis];
  }
  return normalized_dynamics;
}

// ============================================================================
// 3. CORE NORMALIZER ENGINE
// ============================================================================

/**
 * Main Normalizer: Enforces structural integrity, security sanitization,
 * Four-Quadrant entity fragments, and clamped physics dynamics boundaries.
 * @param {Record<string, any>} [base={}]
 * @returns {Record<string, any>}
 */
export function normalize(base = {}) {
  const {
    id,
    created_at,
    updated_at,
    origin_id,
    is_premade,
    is_custom,
    version,
    dynamics_baseline,
    name = "",
    description = "",
    type = "character",
    eternal = {},
    present = {},
    past = [],
    future = "",
    tags = [],
    signature_color = "",
    profile_picture = "",
    dynamics = null,
    modifiers = {},
    voice = {},
    custom_data = {},
    narrative_style = "",
    visual_style = "",
    pov = "",
    speaking_style = "",
    is_wanderer,
    relationships,
    chapters,
  } = base;

  const resolved_type = type === "fractal" ? "fractal" : "character";
  const template = ENTITY_TEMPLATES[resolved_type];

  const is_premade_normalized = is_premade ?? 0;
  const is_custom_normalized = is_custom ?? 0;
  const origin_id_normalized = origin_id ?? null;
  const dynamics_baseline_normalized = dynamics_baseline instanceof Object ? { ...dynamics_baseline } : null;

  return {
    // --- CORE METADATA ---
    id: id ?? "",
    created_at: created_at ?? 0,
    updated_at: updated_at ?? 0,
    origin_id: origin_id_normalized,
    is_premade: is_premade_normalized,
    is_custom: is_custom_normalized,
    version: version ?? 0,
    dynamics_baseline: dynamics_baseline_normalized,

    name: normalize_name(name),
    description: sanitize_html(description).trim(),
    type: resolved_type,
    signature_color: normalize_signature_color(signature_color),
    profile_picture: sanitize_html(String(profile_picture || "")).trim(),
    narrative_style: sanitize_html(String(narrative_style || "")).trim(),
    visual_style: normalize_visual_style(visual_style),
    pov: normalize_point_of_view(pov, resolved_type),
    speaking_style: normalize_speaking_style(speaking_style),
    tags: normalize_tags(tags),

    // --- NPC WORLD-CAST (Relationships & Wandering) ---
    is_wanderer: Boolean(is_wanderer),
    relationships: normalize_relationships(relationships),

    // --- MACRO-QUEST CHAPTER ARCHIVE ---
    chapters: normalize_chapters(chapters),

    // --- FOUR-QUADRANT ENTITY FRAGMENTS ---
    eternal: {
      physical: sanitize_html(eternal?.physical ?? "").trim(),
      non_physical: sanitize_html(eternal?.non_physical ?? "").trim(),
    },
    present: {
      physical: sanitize_html(present?.physical ?? "").trim(),
      non_physical: sanitize_html(present?.non_physical ?? "").trim(),
    },
    past: coerce_temporal_vectors(past),
    future: sanitize_html(typeof future === "string" ? future : "").trim(),

    // --- MODIFIERS (Visual & Generation Overrides) ---
    modifiers: {
      prompt: sanitize_html(modifiers?.prompt ?? "").trim(),
      negative_prompt: sanitize_html(modifiers?.negative_prompt ?? "").trim(),
      flipped: Boolean(modifiers?.flipped ?? false),
      profile_picture_seed: Number(modifiers?.profile_picture_seed ?? 0),
      last_generated_seed: modifiers?.last_generated_seed ?? null,
      color_name: sanitize_html(modifiers?.color_name ?? "").trim(),
    },

    // --- DYNAMICS (Physics Sliders 1-100) ---
    dynamics: normalize_dynamics(dynamics, template.dynamics),

    // --- VOICE (Neural TTS Attributes) ---
    voice: {
      name: sanitize_html(voice?.name || "").trim(),
      uri: sanitize_html(voice?.uri || "").trim(),
      cadence: sanitize_html(voice?.cadence || "standard").trim(),
    },

    // --- INTERNAL CUSTOM EXTENSIONS ---
    custom_data: custom_data || {},
  };
}

// ============================================================================
// 4. TEMPORAL & VECTOR COERCION
// ============================================================================

/**
 * Coerces a value into a strictly cleaned array of strings.
 * @param {any} value
 * @returns {string[]}
 */
export function coerce_temporal_array(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Coerces raw temporal data (strings or objects) into proper TemporalVector-shaped objects.
 * Guarantees that every item has id, content, significance, and origin provenance.
 * @param {any[]} value
 * @returns {any[]}
 */
export function coerce_temporal_vectors(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string" && item.trim().length > 0) {
        return {
          id: generate_uuid("usr_"),
          content: sanitize_html(item).trim(),
          is_origin: true,
          directive: "",
          significance: 50,
          created_round: 0,
        };
      }
      if (item && typeof item === "object" && typeof item.content === "string" && item.content.trim().length > 0) {
        const is_user_origin = String(item.id || "").startsWith("usr_");
        return {
          id: String(item.id || generate_uuid("usr_")),
          content: sanitize_html(item.content).trim(),
          is_origin: item.is_origin !== undefined ? Boolean(item.is_origin) : is_user_origin,
          directive: sanitize_html(item.directive || "").trim(),
          significance: typeof item.significance === "number" ? Math.max(1, Math.min(100, item.significance)) : 50,
          created_round: typeof item.created_round === "number" ? item.created_round : 0,
          ...(item._embedding ? { _embedding: item._embedding } : {}),
        };
      }
      return null;
    })
    .filter(Boolean);
}

// ============================================================================
// 5. FACTORY & SERIALIZATION UTILITIES
// ============================================================================

/**
 * Formats a premade catalog definition into a runtime entity shape.
 * @param {Record<string, any>} premade_data
 * @param {'character'|'fractal'} [type]
 * @returns {Record<string, any>}
 */
export function format_premade(premade_data, type) {
  return normalize({
    ...premade_data,
    ...(type ? { type } : {}),
    is_premade: true,
    is_custom: false,
  });
}

/**
 * Creates a brand new, pristine entity populated with correct template structure.
 * @param {'character'|'fractal'} [type='character']
 * @param {Record<string, any>} [overrides={}]
 * @returns {Record<string, any>}
 */
export function create_new(type = "character", overrides = {}) {
  const resolved_type = type === "fractal" ? "fractal" : "character";
  const template = ENTITY_TEMPLATES[resolved_type];
  const now = Date.now();
  return normalize({
    ...template,
    ...overrides,
    type: resolved_type,
    id: overrides?.id || generate_uuid(resolved_type === "character" ? "char_" : "world_"),
    created_at: overrides?.created_at ?? now,
    updated_at: overrides?.updated_at ?? now,
    origin_id: overrides?.origin_id ?? null,
    is_premade: false,
    is_custom: true,
    signature_color: overrides?.signature_color || get_random_signature_key(),
  });
}

/**
 * Strips private IDs and database metadata from an entity before JSON export.
 * Preserves structured arrays (chapters, custom_data) while scrubbing transient keys and embeddings.
 * @param {Record<string, any>} target_entity
 * @returns {Record<string, any>}
 */
export function serialize_entity_for_export(target_entity) {
  if (!target_entity || typeof target_entity !== "object") return {};
  const TRANSIENT_KEYS = new Set([
    "id",
    "created_at",
    "updated_at",
    "origin_id",
    "version",
    "is_premade",
    "is_custom",
    "is_snapshot",
    "dynamics_baseline",
  ]);

  /**
   * Recursively clones structures while removing transient keys and vector embeddings.
   * @param {any} value
   * @param {string} [parent_key]
   * @returns {any}
   */
  const clone_clean = (value, parent_key = "") => {
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (item && typeof item === "object") {
            const copy = { ...item };
            delete copy._embedding;
            return clone_clean(copy, parent_key);
          }
          return item;
        })
        .filter((item) => {
          if (parent_key === "past" && item && typeof item === "object") {
            return Boolean((item.content || item.directive)?.trim());
          }
          return true;
        });
    }
    if (value && typeof value === "object") {
      const sanitized_object = {};
      for (const [key, prop_value] of Object.entries(value)) {
        if (key === "_embedding") continue;
        sanitized_object[key] = clone_clean(prop_value, key);
      }
      return sanitized_object;
    }
    return value;
  };

  const sanitized_export = {};
  for (const [key, value] of Object.entries(target_entity)) {
    if (TRANSIENT_KEYS.has(key)) continue;
    sanitized_export[key] = clone_clean(value, key);
  }
  return JSON.parse(JSON.stringify(sanitized_export));
}

// ============================================================================
// CHANGELOG
// ============================================================================
/**
 * 2026-08-29: Harmonized module structure under /harmonize protocol:
 *   - Enforced Universal File Architecture with instructional header, structured dividers, and changelog.
 *   - Refactored inline IIFE property assignments into modular, well-typed normalization helpers.
 *   - Aligned parameter names and variables with Anti-Abbreviation mandate (`target_entity`, `is_user_origin`, `normalized_dynamics`).
 *   - Preserved Four-Quadrant schema, chapter archives, relationship graph bounds, and RAG vector provenance.
 * 2026-08-28: Clamped entity dynamics (1-100), unified speaking style validation, and fixed serialize_entity_for_export chapter history preservation.
 */
