/**
 * src/storage/entities.js
 * ============================================================================
 * 🧬 4-QUADRANT ENTITY MODEL
 * ============================================================================
 *
 * Enforces the canonical 4-quadrant bracket-string schema for Characters
 * and Fractals (eternal / present / future / past).
 * ============================================================================
 */

import { generate_uuid, state_bridge } from "@utils";
import { format_clean_brackets } from "./parser.js";
import { FLAT_LEAF_MAP } from "./profile-fields.js";
import { get_story, update_cast, upsert_entity, update_entity, append_ledger_entries } from "./db.js";
import { DYNAMICS_SCALE } from "../config.js";
import { default_dynamics_for_scope } from "../definitions/dynamics-registry.js";

/**
 * Clamps a dynamics number to an integer between 1 and 100.
 *
 * @param {any} value
 * @param {number} fallback
 * @returns {number}
 */
function clamp_dynamic(value, fallback = DYNAMICS_SCALE.MID) {
  const num = Number(value);
  if (!Number.isFinite(num) || isNaN(num)) return fallback;
  return Math.max(DYNAMICS_SCALE.MIN, Math.min(DYNAMICS_SCALE.MAX, Math.round(num)));
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
 * Coerces a past-timeline value into a canonical multiline bracket string.
 * Non-string inputs (arrays, objects, null) yield "" — there is exactly one
 * writer of entity rows and it always stores bracket strings, so anything
 * else is corrupt input, not a shape to support.
 *
 * @param {any} raw_past
 * @returns {string}
 */
function normalize_past_to_brackets(raw_past) {
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
 * Normalizes bracket strings by ensuring all relational bracket targets ([@target: ...])
 * are canonicalized to uppercase ([@TARGET: ...]).
 *
 * @param {string} text
 * @returns {string}
 */
function normalize_relational_brackets(text) {
  if (typeof text !== "string" || !text.includes("[@")) return text || "";
  return text.replace(/\[@([a-z0-9_]+):/gi, (_, target) => `[@${target.toUpperCase()}:`);
}

/**
 * Enforces pure 4-quadrant multiline bracket strings across all fields.
 *
 * @param {object} raw - entity row
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

    // 4-Quadrant Temporal Model (with canonical uppercase [@TARGET: ...] relations)
    eternal: {
      physical: normalize_relational_brackets(typeof eternal.physical === "string" ? eternal.physical.trim() : ""),
      non_physical: normalize_relational_brackets(typeof eternal.non_physical === "string" ? eternal.non_physical.trim() : ""),
    },
    present: {
      physical: normalize_relational_brackets(typeof present.physical === "string" ? present.physical.trim() : ""),
      non_physical: normalize_relational_brackets(typeof present.non_physical === "string" ? present.non_physical.trim() : ""),
    },
    future: normalize_relational_brackets(normalize_future_to_brackets(raw.future)),
    past: normalize_relational_brackets(normalize_past_to_brackets(raw.past)),

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
    dynamics: entity_type === "character" ? default_dynamics_for_scope("somatic") : default_dynamics_for_scope("fractal"),
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

/**
 * Runs the LLM ingestion sorter over raw prose and returns the structured profile.
 * Delegates to the greenfield Caretaker purpose core via @engine.
 *
 * @param {string} raw
 * @param {'character' | 'fractal'} type
 * @returns {Promise<Object | null>}
 */
export async function structure_profile(raw, type = "character") {
  const { structure_profile: engine_structure } = await import("@engine");
  return engine_structure(raw, type);
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

  const leaf_map = FLAT_LEAF_MAP[entity.type] || FLAT_LEAF_MAP.character || {};

  for (const [key, value] of Object.entries(profile)) {
    // Identity/asset keys are set by the orchestrator, never by the profile.
    if (key === "profile_picture" || key === "image" || key === "id" || key === "type") continue;

    if (key === "past") {
      const incoming_items = Array.isArray(value) ? value : typeof value === "string" ? [value] : null;
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
      const mapped_path = leaf_map[key] || FLAT_LEAF_MAP.character?.[key];
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

/**
 * Common birth core shared across spawn_character and ImportModal.
 * Runs structuring (if prose), maps profile leaves, saves to DB,
 * writes genesis ledger entries, and chains post-save portrait generation.
 *
 * @param {'character' | 'fractal'} type
 * @param {Object} draft
 * @param {Object} [options]
 * @returns {Promise<any>}
 */
export async function birth_entity_core(type, draft = {}, options = {}) {
  const name = String(draft?.name || "").trim();
  const raw_color = String(draft?.signature_color || "").trim();
  const description = String(draft?.description || "").trim();
  const scene_context = String(draft?.scene_context || "").trim();

  let entity = {
    name: name || (type === "fractal" ? "New Fractal" : "New Character"),
    type,
    description,
    eternal: {
      physical: description,
      non_physical: "",
    },
    present: {
      physical: description,
      non_physical: "",
    },
    future: "",
    past: [],
    dynamics: { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
    dynamics_baseline: { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
    speaking_style: draft?.speaking_style || "casual",
    is_wanderer: false,
    signature_color: raw_color || undefined,
  };

  // Run structuring if rich synthesis text is provided
  if (options.run_sorter || (!draft?.eternal && !draft?.present && (name || description))) {
    try {
      const synthesis_source = [
        `Entity Name: ${entity.name}`,
        description ? `Core Concept: ${description}` : "",
        raw_color ? `Signature Color: ${raw_color}` : "",
        scene_context ? `Scene Context & Atmosphere: ${scene_context}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const rich_profile = await structure_profile(synthesis_source, type);
      if (rich_profile && typeof rich_profile === "object") {
        entity = apply_profile_to_entity(entity, rich_profile);
      }
    } catch (error) {
      state_bridge.app?.log(`[GameMaster] Genesis rich synthesis failed for "${name}": ${error?.message || error}`, "warn");
    }
  } else if (draft && typeof draft === "object") {
    entity = apply_profile_to_entity(entity, draft);
  }

  if (name) entity.name = name;
  if (raw_color) entity.signature_color = raw_color;

  const saved_entity = await upsert_entity(entity);

  // Write Genesis Ledger Entries for all populated quadrant fields
  const story_id = options.story_id ?? state_bridge.runtime?.story_id ?? null;
  const ledger_lines = [];

  const record_genesis_field = (field_path, value) => {
    if (!value) return;
    const string_value = Array.isArray(value) ? JSON.stringify(value) : typeof value === "object" ? JSON.stringify(value) : String(value);
    if (!string_value.trim()) return;
    ledger_lines.push({
      story_id,
      round: 0,
      seq: 0,
      entity_id: saved_entity.id,
      field: field_path,
      new_value: string_value,
      writer: "genesis",
      decider: "genesis",
    });
  };

  record_genesis_field("eternal.physical", saved_entity.eternal?.physical);
  record_genesis_field("eternal.non_physical", saved_entity.eternal?.non_physical);
  record_genesis_field("present.physical", saved_entity.present?.physical);
  record_genesis_field("present.non_physical", saved_entity.present?.non_physical);
  if (Array.isArray(saved_entity.past) ? saved_entity.past.length > 0 : saved_entity.past) {
    record_genesis_field("past", saved_entity.past);
  }
  record_genesis_field("future", saved_entity.future);

  if (ledger_lines.length > 0) {
    try {
      await append_ledger_entries(ledger_lines);
    } catch (err) {
      void err;
    }
  }

  // Register NPC on active story if spawned during a story session
  if (type === "character" && story_id && story_id !== "debug") {
    try {
      const story = await get_story(story_id);
      const existing_npcs = Array.isArray(story?.npc_ids) ? story.npc_ids : [];
      const updated_npcs = [...new Set([...existing_npcs, saved_entity.id])];
      if (updated_npcs.length !== existing_npcs.length) {
        await update_cast(story_id, updated_npcs);
      }
    } catch (err) {
      state_bridge.app?.log(`[Storage] Failed to register NPC on story ${story_id}: ${err?.message || err}`, "warn");
    }
  }

  // Chained post-save portrait generation (fire-and-forget)
  if (options.generate_portrait !== false && type === "character") {
    const { visual_engine } = await import("@media");
    if (typeof visual_engine?.generate === "function" && typeof window !== "undefined") {
      try {
        const portrait_promise = visual_engine
          .generate(saved_entity.id, { mode: "solo_entity", resolution: "512x512", _entity: saved_entity })
          .then(async (image_url) => {
            if (image_url && saved_entity.id) {
              const data_url = typeof image_url === "object" && image_url?.url ? image_url.url : image_url;
              await update_entity(saved_entity.id, { profile_picture: data_url });
              await state_bridge.runtime?.update_entity?.("character", saved_entity.id, { profile_picture: data_url });
            }
          });
        if (portrait_promise && typeof portrait_promise.catch === "function") {
          portrait_promise.catch((error) =>
            state_bridge.app?.log(`[GameMaster] Portrait generation for "${name}" failed: ${error?.message || error}`, "warn"),
          );
        }
      } catch (_error) {
        /* portrait failure must never break genesis */
      }
    }
  }

  return saved_entity;
}
