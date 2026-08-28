/**
 * src/data/normalizer.js
 * 🧪 CONTENT NORMALISATION LOGIC
 * Enforces the strict "Twin-Cylinder" data structure across the app.
 * ZERO BACKWARDS COMPATIBILITY.
 */
import { pick_random, generate_uuid } from "@utils";
import { SIGNATURE_COLORS } from "./definitions/signature-colors.js";
import { security } from "@platform";

const sanitize_html = (/** @type {any} */ val) => security.sanitize(val);
const STORAGE_VERSION = 3;

/**
 * 🐣 ENTITY TEMPLATES
 * Defines the initial structure for new entities born in the Library.
 * Fields are empty strings so that UI 'placeholder' attributes can work correctly.
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
    voice_register: "",
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
    voice_register: "",
    relationships: [],
    chapters: [],
  },
};

/**
 * Utility to safely access the palette for a random signature key.
 */
export const get_random_signature_key = () => {
  return pick_random(SIGNATURE_COLORS);
};

/**
 * Main Normalizer
 * Enforces structural integrity and sanitization.
 * @param {any} base
 */
export const normalize = (base = {}) => {
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
    voice_register = "",
    is_wanderer,
    relationships,
    chapters,
  } = base;

  const norm_is_premade = is_premade ?? 0;
  const norm_is_custom = is_custom ?? 0;
  const norm_origin_id = origin_id ?? null;
  const norm_dynamics_baseline = dynamics_baseline instanceof Object ? { ...dynamics_baseline } : null;

  const result = {
    // --- CORE METADATA ---
    id: id ?? "",
    created_at: created_at ?? 0,
    updated_at: updated_at ?? 0,
    origin_id: norm_origin_id,
    is_premade: norm_is_premade,
    is_custom: norm_is_custom,
    version: version ?? 0,
    dynamics_baseline: norm_dynamics_baseline,

    name: (() => {
      const clean = sanitize_html(name)
        .replace(/[\r\n]+/g, " ")
        .trim();
      return clean.length > 80 ? clean.slice(0, 80).trim() : clean;
    })(),
    description: sanitize_html(description).trim(),
    type: type,
    signature_color: (() => {
      const parsed = sanitize_html(String(signature_color)).trim();
      return SIGNATURE_COLORS.includes(parsed) ? parsed : get_random_signature_key();
    })(),
    profile_picture: sanitize_html(String(profile_picture)).trim(),
    narrative_style: sanitize_html(String(narrative_style)).trim(),
    visual_style: (() => {
      const parsed = sanitize_html(String(visual_style)).trim();
      if (parsed && parsed !== "default") return parsed;
      return "none";
    })(),
    pov: (() => {
      const parsed = sanitize_html(String(pov)).trim();
      if (parsed === "1st_person" || parsed === "3rd_person") return parsed;
      return type === "fractal" ? "3rd_person" : "1st_person";
    })(),
    voice_register: (() => {
      const parsed = sanitize_html(String(voice_register || "")).trim();
      return parsed === "ornate" || parsed === "plain" ? parsed : "";
    })(),
    tags: (Array.isArray(tags) ? tags : []).map((s) => (s != null ? sanitize_html(String(s).trim()) : "")).filter(Boolean),

    // --- NPC WORLD-CAST (Relationships & Wandering) ---
    // is_wanderer: characters not bound to a single Fractal.
    // relationships: plain-text directed vectors "[Source] → [Target]: [Dynamic]".
    is_wanderer: !!is_wanderer,
    relationships: (Array.isArray(relationships) ? relationships : [])
      .map((r) => (r != null ? sanitize_html(String(r)).trim() : ""))
      .filter(Boolean)
      .map((r) => (r.length > 240 ? `${r.slice(0, 240).trim()}…` : r))
      .slice(0, 40),

    // --- MACRO-QUEST CHAPTER ARCHIVE (Track Director 4.5) ---
    // Closed/open chapter boundaries detected by the Memory Forge. Pure
    // informational archive — never rendered into the live prompt directly,
    // only into <CHAPTER_HISTORY> for the forge and profile readers.
    chapters: (Array.isArray(chapters) ? chapters : [])
      .map((c) => {
        if (!c || typeof c !== "object") return null;
        const title = sanitize_html(String(c.title || ""))
          .trim()
          .slice(0, 80);
        return {
          id: sanitize_html(String(c.id || ""))
            .trim()
            .slice(0, 40),
          title: title || "Untitled chapter",
          summary: sanitize_html(String(c.summary || ""))
            .trim()
            .slice(0, 400),
          agenda: sanitize_html(String(c.agenda || ""))
            .trim()
            .slice(0, 600),
          status: c.status === "open" || c.status === "closed" ? c.status : "closed",
          created_at: Number(c.created_at) || 0,
          closed_at: c.closed_at ? Number(c.closed_at) || 0 : 0,
        };
      })
      .filter(Boolean)
      .slice(-12),

    // --- TEMPORAL HYBRID 6 (PURGED: appearance, identity, outfit, status) ---
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

    // --- MODIFIERS (Visual/Aesthetic overrides) ---
    modifiers: {
      prompt: sanitize_html(modifiers?.prompt ?? "").trim(),
      negative_prompt: sanitize_html(modifiers?.negative_prompt ?? "").trim(),
      flipped: !!(modifiers?.flipped ?? false),
      profile_picture_seed: Number(modifiers?.profile_picture_seed ?? 0),
      last_generated_seed: modifiers?.last_generated_seed ?? null,
      color_name: sanitize_html(modifiers?.color_name ?? "").trim(),
    },

    // --- DYNAMICS (Physics Sliders) ---
    dynamics: (() => {
      if (dynamics && Object.keys(dynamics).length > 0) return { ...dynamics };
      // Seed from type-template on birth
      const template = /** @type {any} */ (ENTITY_TEMPLATES)[type];
      return template?.dynamics ? { ...template.dynamics } : {};
    })(),

    // --- VOICE ---
    voice: {
      name: sanitize_html(voice?.name || "").trim(),
      uri: sanitize_html(voice?.uri || "").trim(),
      cadence: sanitize_html(voice?.cadence || "standard").trim(),
    },

    // --- INTERNAL ---
    custom_data: custom_data || {},
  };

  return result;
};

/**
 * Coerces a value into a strictly cleaned array of strings.
 * Used for the 'past' memory pool.
 * @param {any} val
 * @returns {string[]}
 */
export function coerce_temporal_array(val) {
  if (Array.isArray(val)) return val;
  if (typeof val !== "string") return [];
  return val
    .split("\n")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/**
 * Coerces raw temporal data (strings or objects) into proper TemporalVector-shaped objects.
 * Strings are wrapped into canonical vector objects; object items pass through untouched.
 * `type` is always "past".
 * @param {any} val
 * @returns {any[]}
 */
export function coerce_temporal_vectors(val) {
  if (!Array.isArray(val)) return coerce_temporal_array(val);
  return val
    .map((item) => {
      if (item && typeof item === "object") return item;
      const text = typeof item === "string" ? item.trim() : "";
      if (!text) return null;
      return {
        id: `usr_${generate_uuid()}`,
        timestamp: Date.now(),
        content: text,
        directive: text,
        type: "past",
        emotional_weight: 5,
        meta: {},
      };
    })
    .filter(Boolean);
}

/**
 * 🏘️ THE FACTORY
 * Creates a brand new, fully normalized entity with a RANDOM signature color.
 * @param {string} type
 * @param {any} overrides
 */
export const create_new = (type = "character", overrides = {}) => {
  const template = /** @type {any} */ (ENTITY_TEMPLATES)[type] || ENTITY_TEMPLATES.character;
  const new_entity = {
    ...template,
    ...overrides,
    signature_color: get_random_signature_key(), // Random color on birth
    created_at: Date.now(),
    updated_at: Date.now(),
    id: generate_uuid(),
  };
  return normalize(new_entity);
};

/**
 * Formats a premade entity for storage injection.
 * @param {any} entity
 * @param {string} type
 */
export const format_premade = (entity, type) => {
  return {
    ...normalize(entity),
    type: type,
    is_premade: 1,
    version: STORAGE_VERSION,
    updated_at: 0,
  };
};

/**
 * Serializes an entity into a standalone, re-importable export payload.
 * Strips internal transient database fields (ids, version stamps, premade
 * flags) and drops `_embedding` blobs from memory vectors so the file stays
 * portable and human-readable. Re-import normalizes defaults on the way in.
 * @param {any} entity
 * @returns {any}
 */
export const serialize_entity_for_export = (entity) => {
  if (!entity || typeof entity !== "object") return {};
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

  /** @param {any} value */
  const clone_clean = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (item && typeof item === "object") {
            const copy = { ...item };
            delete copy._embedding;
            return copy;
          }
          return item;
        })
        .filter((item) => {
          if (item && typeof item === "object") return !!(item.content || item.directive)?.trim();
          return true;
        });
    }
    if (value && typeof value === "object") {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        if (k === "_embedding") continue;
        out[k] = clone_clean(v);
      }
      return out;
    }
    return value;
  };

  const out = {};
  for (const [key, value] of Object.entries(entity)) {
    if (TRANSIENT_KEYS.has(key)) continue;
    out[key] = clone_clean(value);
  }
  return JSON.parse(JSON.stringify(out));
};
