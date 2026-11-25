/**
 * src/data/records.js
 * ============================================================================
 * 🧬 4-QUADRANT ENTITY RECORDS (pure, no runes, no upward imports)
 * ============================================================================
 *
 * Canonical entity normalization, factory, epistemic filtering and export.
 * Birth orchestration lives in `src/engine/lifecycle.js` (`create_entity_with_profile`);
 * profile structuring lives there too (`parse_entity_profile`).
 * Persistence lives in `./db.js` (cabinet), `./entity-repository.js` (entities)
 * and `./story-library.js` (stories + simulation logs).
 * ============================================================================
 */

import { DYNAMICS } from "@config";
import { canonicalize_field_key, default_dynamics_for_scope } from "@definitions";
import { generate_uuid } from "@utils";

/**
 * Clamps a dynamics number to an integer between 1 and 100.
 *
 * @param {any} value
 * @param {number} fallback
 * @returns {number}
 */
function clamp_dynamic(value, fallback = DYNAMICS.SCALE.MID) {
  const num = Number(value);
  if (!Number.isFinite(num) || isNaN(num)) return fallback;
  return Math.max(DYNAMICS.SCALE.MIN, Math.min(DYNAMICS.SCALE.MAX, Math.round(num)));
}

/**
 * Normalizes dynamics object for character or fractal.
 *
 * @param {any} raw_dynamics
 * @param {"character" | "fractal"} entity_type
 * @returns {Record<string, number>}
 */
function normalize_dynamics(raw_dynamics, entity_type) {
  const scope = entity_type === "fractal" ? "fractal" : "character";
  const dynamics = typeof raw_dynamics === "object" && raw_dynamics !== null ? raw_dynamics : {};
  const normalized = {};
  for (const axis of Object.keys(default_dynamics_for_scope(scope))) {
    normalized[axis] = clamp_dynamic(dynamics[axis], DYNAMICS.SCALE.MID);
  }
  return normalized;
}

/**
 * Coerces a past-timeline value into a canonical multiline bracket string.
 * Legacy rows predate the bracket grammar and store string arrays (or bare
 * prose); arrays migrate item-by-item into `[MEMORY: ...]` brackets (multiple
 * brackets per field are canonical) instead of being dropped, so a sync
 * never deletes memories it was meant to preserve.
 *
 * @param {any} raw_past
 * @returns {string}
 */
function normalize_past_to_brackets(raw_past) {
  // Legacy array shape: migrate each entry into its own bracket
  if (Array.isArray(raw_past)) {
    const items = raw_past.map((entry) => String(entry ?? "").trim()).filter(Boolean);
    if (items.length === 0) return "";
    return items.map((item) => (item.startsWith("[") && item.endsWith("]") ? item : `[MEMORY: ${item}]`)).join(" ");
  }

  // If already a non-empty string, ensure it has brackets
  if (typeof raw_past === "string" && raw_past.trim().length > 0) {
    const trimmed = raw_past.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      return trimmed;
    }
    // If it's a bare string without brackets, wrap it
    return `[MEMORY: ${trimmed}]`;
  }

  return "";
}

/**
 * Normalizes future trajectory to canonical bracket string.
 * Legacy array rows migrate item-by-item into `[AGENDA: ...]` brackets.
 *
 * @param {any} raw_future
 * @returns {string}
 */
function normalize_future_to_brackets(raw_future) {
  if (Array.isArray(raw_future)) {
    const items = raw_future.map((entry) => String(entry ?? "").trim()).filter(Boolean);
    if (items.length === 0) return "";
    return items.map((item) => (item.startsWith("[") && item.includes(":") ? item : `[AGENDA: ${item}]`)).join(" ");
  }
  if (typeof raw_future !== "string") return "";
  const trimmed = raw_future.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[") && trimmed.includes(":")) {
    return trimmed;
  }
  return `[AGENDA: ${trimmed}]`;
}

/**
 * Normalizes bracket strings by ensuring all inline relational entity tokens (@target)
 * inside `[...]` brackets are canonicalized to uppercase (`@TARGET`).
 *
 * @param {string} text
 * @returns {string}
 */
function normalize_relational_brackets(text) {
  if (typeof text !== "string" || !text.includes("@")) return text || "";
  return text.replace(/\[[^\]]+\]/g, (bracket) => bracket.replace(/(?<!\w)@([a-z0-9_-]+)\b/gi, (_, target) => `@${target.toUpperCase()}`));
}

/**
 * Enforces pure 4-quadrant multiline bracket strings across all fields.
 *
 * @param {object} raw - entity row
 * @returns {object} canonical entity
 */
export function normalize_entity(raw = {}) {
  const src = raw && typeof raw === "object" ? raw : {};
  const entity_type = src.type === "fractal" ? "fractal" : "character";

  const eternal = src.eternal || {};
  const present = src.present || {};

  // Visual modifiers (image prompt draft, mirror flag, generation seeds) are
  // user data, not derived state: preserve them through normalize so profile
  // saves, reads, and the VisualWing never see them vanish. Missing pieces
  // get safe defaults so `char.modifiers.prompt` is always readable.
  const raw_modifiers = src.modifiers && typeof src.modifiers === "object" ? src.modifiers : {};

  return {
    id: src.id || generate_uuid(),
    name: typeof src.name === "string" ? src.name.trim() : "Unnamed",
    type: entity_type,
    description: typeof src.description === "string" ? src.description.trim() : "",
    profile_picture: typeof src.profile_picture === "string" ? src.profile_picture.trim() : "",
    signature_color: typeof src.signature_color === "string" ? src.signature_color.trim() : "",
    visual_style: typeof src.visual_style === "string" ? src.visual_style.trim() : "none",
    pov:
      src.pov === "1st_person" ? "1st_person"
      : src.pov === "3rd_person" ? "3rd_person"
      : entity_type === "fractal" ? "3rd_person"
      : "1st_person",
    speaking_style: typeof src.speaking_style === "string" ? src.speaking_style.trim() : "casual",
    narrative_style: typeof src.narrative_style === "string" ? src.narrative_style.trim() : "cormac_mccarthy",
    tags: Array.isArray(src.tags) ? src.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    voice: typeof src.voice === "object" && src.voice !== null ? { ...src.voice } : { name: "", cadence: "standard" },
    modifiers: {
      prompt: typeof raw_modifiers.prompt === "string" ? raw_modifiers.prompt : "",
      negative_prompt: typeof raw_modifiers.negative_prompt === "string" ? raw_modifiers.negative_prompt : "",
      flipped: Boolean(raw_modifiers.flipped),
      profile_picture_seed: raw_modifiers.profile_picture_seed ?? null,
      last_generated_seed: raw_modifiers.last_generated_seed ?? null,
    },
    created_at: Number(src.created_at) || Date.now(),
    updated_at: Number(src.updated_at) || Date.now(),

    // 4-Quadrant Temporal Model (with canonical uppercase [@TARGET: ...] relations)
    eternal: {
      physical: normalize_relational_brackets(typeof eternal.physical === "string" ? eternal.physical.trim() : ""),
      non_physical: normalize_relational_brackets(typeof eternal.non_physical === "string" ? eternal.non_physical.trim() : ""),
    },
    present: {
      physical: normalize_relational_brackets(typeof present.physical === "string" ? present.physical.trim() : ""),
      non_physical: normalize_relational_brackets(typeof present.non_physical === "string" ? present.non_physical.trim() : ""),
    },
    future: normalize_relational_brackets(normalize_future_to_brackets(src.future)),
    past: normalize_relational_brackets(normalize_past_to_brackets(src.past)),

    // Dynamics Sliders (1-100)
    dynamics: normalize_dynamics(src.dynamics, entity_type),
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
  return normalize_entity({ name: entity_type === "character" ? "New Character" : "New Fractal", type: entity_type, ...overrides });
}

/**
 * Strips persistence metadata (`id`, `created_at`, `updated_at`) from a normalized
 * entity record for portable JSON export.
 *
 * @param {object} entity
 * @returns {object} cloned entity without persistence metadata
 */
export function serialize_entity_for_export(entity) {
  const normalized = normalize_entity(entity);
  const { id: _id, created_at: _created_at, updated_at: _updated_at, ...exportable } = normalized;
  return exportable;
}

/**
 * Applies a flat structured profile onto a freshly created entity, mapping flat
 * keys onto the nested Twin-Cylinder schema. Mutates and returns `entity`.
 *
 * @param {any} entity
 * @param {Object} profile
 * @returns {any}
 */
export function apply_profile_to_entity(entity, profile) {
  if (!profile || typeof profile !== "object") return entity;

  // Flat keys route through the taxonomy authority (alias + human-shaped keys
  // included). Past-append semantics are recorded on the atoms (merge:"append")
  // and implemented by the dedicated branch above; future/tags/name keep their
  // historical behavior below.
  for (const [key, value] of Object.entries(profile)) {
    // Identity/asset keys are set by the orchestrator, never by the profile.
    if (key === "profile_picture" || key === "image" || key === "id" || key === "type") continue;

    if (key === "past") {
      const incoming_items =
        Array.isArray(value) ? value
        : typeof value === "string" ? [value]
        : null;
      if (incoming_items) {
        const cleaned_texts = incoming_items
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") return item.content || item.directive || JSON.stringify(item);
            return "";
          })
          .map((text) => String(text || "").trim())
          .filter(Boolean);
        if (cleaned_texts.length > 0) {
          const current_text = typeof entity.past === "string" ? entity.past.trim() : "";
          entity.past = current_text ? `${current_text} ${cleaned_texts.join(" ")}` : cleaned_texts.join(" ");
        }
      }
    } else if (key === "future" && typeof value === "string") {
      entity.future = value.trim();
    } else if (key === "tags" && Array.isArray(value)) {
      entity.tags = value
        .map((tag) => String(tag).trim())
        .filter(Boolean)
        .slice(0, 30);
    } else if (typeof value === "object" && !Array.isArray(value)) {
      // Nested flat objects -> shallow-copy their string leaves.
      for (const [sub_key, sub_value] of Object.entries(value)) {
        if (typeof sub_value === "string") {
          if (!entity[key]) entity[key] = {};
          entity[key][sub_key] = sub_value;
        }
      }
    } else if (typeof value === "string") {
      // Flat LLM keys -> nested DB schema; everything else lands verbatim.
      const mapped_path = canonicalize_field_key(key, entity.type);
      if (mapped_path) {
        const [main_key, sub_key] = mapped_path.split(".");
        if (!entity[main_key]) entity[main_key] = {};
        entity[main_key][sub_key] = value;
      } else if (key === "name") {
        entity.name = value.trim().slice(0, 80);
      } else {
        entity[key] = value;
      }
    }
  }

  return entity;
}
