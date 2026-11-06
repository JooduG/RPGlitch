/**
 * src/storage/entities.js
 * ============================================================================
 * 🧬 4-QUADRANT ENTITY MODEL & ADAPT-ON-READ ENGINE
 * ============================================================================
 *
 * Enforces the canonical 4-quadrant schema across both Characters and Fractals:
 * - eternal: { physical: string, non_physical: string } (multiline [KEY: VALUE])
 * - present: { physical: string, non_physical: string } (multiline [KEY: VALUE])
 * - future:  string (multiline [KEY: VALUE | flags])
 * - past:    string (multiline [KEY: VALUE | flags])
 *
 * Adapt-on-Read: Converts legacy entity rows (array-form memories or legacy
 * object lists) into pure multiline bracket strings in memory without writing
 * uncommitted changes to disk.
 * ============================================================================
 */

import { generate_uuid } from "@utils";
import { format_clean_brackets } from "./parser.js";

const DEFAULT_CHARACTER_DYNAMICS = Object.freeze({
  chaos: 50,
  intensity: 50,
  openness: 50,
  affinity: 50,
});

const DEFAULT_FRACTAL_DYNAMICS = Object.freeze({
  velocity: 50,
  entropy: 50,
});

/**
 * Clamps a dynamics number to an integer between 1 and 100.
 *
 * @param {any} value
 * @param {number} fallback
 * @returns {number}
 */
function clamp_dynamic(value, fallback = 50) {
  const num = Number(value);
  if (!Number.isFinite(num) || isNaN(num)) return fallback;
  return Math.max(1, Math.min(100, Math.round(num)));
}

/**
 * Normalizes dynamics object for character or fractal.
 *
 * @param {any} raw_dynamics
 * @param {"character" | "fractal"} entity_type
 * @returns {Record<string, number>}
 */
function normalize_dynamics(raw_dynamics, entity_type) {
  const is_character = entity_type !== "fractal";
  const dynamics = typeof raw_dynamics === "object" && raw_dynamics !== null ? raw_dynamics : {};

  if (is_character) {
    return {
      chaos: clamp_dynamic(dynamics.chaos, 50),
      intensity: clamp_dynamic(dynamics.intensity, 50),
      openness: clamp_dynamic(dynamics.openness, 50),
      affinity: clamp_dynamic(dynamics.affinity, 50),
    };
  }

  return {
    velocity: clamp_dynamic(dynamics.velocity, 50),
    entropy: clamp_dynamic(dynamics.entropy, 50),
  };
}

/**
 * Adapts legacy array-form memories or objects into a canonical multiline bracket string.
 *
 * @param {any} raw_past
 * @param {any} [raw_memories]
 * @returns {string}
 */
function normalize_past_to_brackets(raw_past, raw_memories) {
  // If already a non-empty string, ensure it has brackets
  if (typeof raw_past === "string" && raw_past.trim().length > 0) {
    const trimmed = raw_past.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      return trimmed;
    }
    // If it's a bare string without brackets, wrap it
    return `[MEMORY: ${trimmed}]`;
  }

  // Check array inputs (either past or legacy memories property)
  const items = Array.isArray(raw_past) ? raw_past : Array.isArray(raw_memories) ? raw_memories : [];
  if (items.length === 0) return "";

  const lines = [];

  for (const item of items) {
    if (!item) continue;
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) continue;
      lines.push(trimmed.startsWith("[") ? trimmed : `[MEMORY: ${trimmed}]`);
      continue;
    }

    if (typeof item === "object") {
      const key = item.key ? String(item.key).trim().toUpperCase() : "MEMORY";
      const text = item.text || item.summary || item.value || "";
      if (!text) continue;

      const flags = [];
      if (item.hide) flags.push("hide");
      if (item.show) flags.push("show");
      if (item.is_origin || item.origin) flags.push("is_origin");
      if (typeof item.weight === "number" && !isNaN(item.weight)) {
        flags.push(`w: ${Math.min(10, Math.max(1, Math.round(item.weight)))}`);
      }

      const flag_str = flags.length > 0 ? ` | ${flags.join(" | ")}` : "";
      lines.push(`[${key}: ${text}${flag_str}]`);
    }
  }

  return lines.join(", ");
}

/**
 * Normalizes future trajectory to canonical bracket string.
 *
 * @param {any} raw_future
 * @returns {string}
 */
function normalize_future_to_brackets(raw_future) {
  if (typeof raw_future !== "string") return "";
  const trimmed = raw_future.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[") && trimmed.includes(":")) {
    return trimmed;
  }
  return `[AGENDA: ${trimmed}]`;
}

/**
 * Enforces pure 4-quadrant multiline bracket strings across all fields.
 * Adapts legacy rows in-memory.
 *
 * @param {object} raw - entity row (greenfield or legacy)
 * @returns {object} canonical entity
 */
export function normalize_entity(raw = {}) {
  const entity_type = raw.type === "fractal" ? "fractal" : "character";

  const eternal = raw.eternal || {};
  const present = raw.present || {};

  return {
    id: raw.id || generate_uuid(),
    name: typeof raw.name === "string" ? raw.name.trim() : "Unnamed",
    type: entity_type,
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    profile_picture: typeof raw.profile_picture === "string" ? raw.profile_picture.trim() : "",
    signature_color: typeof raw.signature_color === "string" ? raw.signature_color.trim() : "",
    visual_style: typeof raw.visual_style === "string" ? raw.visual_style.trim() : "none",
    pov: raw.pov === "1st_person" ? "1st_person" : "3rd_person",
    speaking_style: typeof raw.speaking_style === "string" ? raw.speaking_style.trim() : "casual",
    narrative_style: typeof raw.narrative_style === "string" ? raw.narrative_style.trim() : "cormac_mccarthy",
    tags: Array.isArray(raw.tags) ? raw.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    voice: typeof raw.voice === "object" && raw.voice !== null ? { ...raw.voice } : { name: "", cadence: "standard" },
    created_at: Number(raw.created_at) || Date.now(),
    updated_at: Number(raw.updated_at) || Date.now(),

    // 4-Quadrant Temporal Model
    eternal: {
      physical: typeof eternal.physical === "string" ? eternal.physical.trim() : "",
      non_physical: typeof eternal.non_physical === "string" ? eternal.non_physical.trim() : "",
    },
    present: {
      physical: typeof present.physical === "string" ? present.physical.trim() : "",
      non_physical: typeof present.non_physical === "string" ? present.non_physical.trim() : "",
    },
    future: normalize_future_to_brackets(raw.future),
    past: normalize_past_to_brackets(raw.past, raw.memories),

    // Dynamics Sliders (1-100)
    dynamics: normalize_dynamics(raw.dynamics, entity_type),
  };
}

/**
 * Creates a brand-new entity conforming to the 4-quadrant schema.
 *
 * @param {"character" | "fractal"} type
 * @param {object} [overrides={}]
 * @returns {object} fresh entity
 */
export function create_entity(type = "character", overrides = {}) {
  const entity_type = type === "fractal" ? "fractal" : "character";
  const now = Date.now();

  const base = {
    id: generate_uuid(),
    name: entity_type === "character" ? "New Character" : "New Fractal",
    type: entity_type,
    description: "",
    profile_picture: "",
    signature_color: "",
    visual_style: "none",
    pov: "3rd_person",
    speaking_style: "casual",
    narrative_style: "cormac_mccarthy",
    tags: [],
    voice: { name: "", cadence: "standard" },
    created_at: now,
    updated_at: now,
    eternal: { physical: "", non_physical: "" },
    present: { physical: "", non_physical: "" },
    future: "",
    past: "",
    dynamics: entity_type === "character" ? { ...DEFAULT_CHARACTER_DYNAMICS } : { ...DEFAULT_FRACTAL_DYNAMICS },
  };

  return normalize_entity({ ...base, ...overrides });
}

/**
 * Filters an entity's 4-quadrant bracket strings through the Epistemic Wall.
 *
 * @param {object} entity
 * @param {object} options
 * @param {"all" | "own" | "none"} [options.see_hidden="own"]
 * @param {boolean} [options.is_counterpart=false]
 * @param {boolean} [options.strip_inventory=false]
 * @returns {object} cloned entity with redacted quadrant strings
 */
export function filter_entity_epistemics(entity, options = {}) {
  const copy = normalize_entity(entity);

  copy.eternal = {
    physical: format_clean_brackets(copy.eternal.physical, options),
    non_physical: format_clean_brackets(copy.eternal.non_physical, options),
  };
  copy.present = {
    physical: format_clean_brackets(copy.present.physical, options),
    non_physical: format_clean_brackets(copy.present.non_physical, options),
  };
  copy.future = format_clean_brackets(copy.future, options);
  copy.past = format_clean_brackets(copy.past, options);

  return copy;
}

/**
 * Strips database primary keys and internal tracking timestamps for clean JSON export.
 *
 * @param {object} entity
 * @returns {object} exportable entity object
 */
export function serialize_entity_for_export(entity) {
  const normalized = normalize_entity(entity);
  const { id: _id, created_at: _created_at, updated_at: _updated_at, origin_id: _origin_id, ...exportable } = normalized;
  return exportable;
}
