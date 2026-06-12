/**
 * src/data/content-normaliser.js
 * 🧪 CONTENT NORMALISATION LOGIC
 * Enforces the strict "Twin-Cylinder" data structure across the app.
 * ZERO BACKWARDS COMPATIBILITY.
 */
import { pickRandom } from "@utils";
import { PALETTE } from "@media";
import { Security } from "@platform";
const sanitize_html = (/** @type {any} */ val) => Security.sanitize(val);
export const STORAGE_VERSION = 3;
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
      no_background: false,
      flipped: false,
      profile_picture_seed: 0,
      color_name: "",
    },
    past: [],
    future: [],
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
    future: [],
  },
};
/**
 * Utility to safely access the palette for a random signature key.
 */
export const get_random_signature_key = () => {
  const keys = Object.keys(PALETTE).filter((k) => k !== "default");
  return pickRandom(keys);
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
    createdAt,
    updated_at,
    updatedAt,
    origin_id,
    originId,
    is_premade,
    isPremade,
    is_custom,
    isCustom,
    version,
    dynamics_baseline,
    dynamicsBaseline,
    name = "",
    description = "",
    type = "character",
    eternal = {},
    present = {},
    past = [],
    future = [],
    tags = [],
    signature_color = "",
    profile_picture = "",
    dynamics = null,
    modifiers = {},
    visuals = null, // [BACKWARD COMPAT] Legacy object
    voice = {},
    custom_data = {},
  } = base;

  const norm_is_premade = is_premade ?? isPremade ?? 0;
  const norm_is_custom = is_custom ?? isCustom ?? 0;
  const norm_origin_id = origin_id ?? originId ?? null;
  const norm_dynamics_baseline = (dynamics_baseline ?? dynamicsBaseline) instanceof Object ? { ...(dynamics_baseline ?? dynamicsBaseline) } : null;

  const result = {
    // --- CORE METADATA ---
    id: id ?? "",
    created_at: created_at ?? createdAt ?? 0,
    updated_at: updated_at ?? updatedAt ?? 0,
    origin_id: norm_origin_id,
    is_premade: norm_is_premade,
    is_custom: norm_is_custom,
    version: version ?? 0,
    dynamics_baseline: norm_dynamics_baseline,

    // [BACKWARD COMPAT] CamelCase DB flags for Dexie indexes
    isCustom: norm_is_custom,
    isPremade: norm_is_premade,
    originId: norm_origin_id,
    dynamicsBaseline: norm_dynamics_baseline,

    name: sanitize_html(name).trim(),
    description: sanitize_html(description).trim(),
    type: type,
    signature_color: sanitize_html(String(signature_color)).trim() || get_random_signature_key(),
    profile_picture: sanitize_html(String(profile_picture)).trim(),
    tags: (Array.isArray(tags) ? tags : []).map((s) => (s != null ? sanitize_html(String(s).trim()) : "")).filter(Boolean),
    // --- TEMPORAL HYBRID 6 (PURGED: appearance, identity, outfit, status) ---
    eternal: {
      physical: sanitize_html(eternal?.physical ?? "").trim(),
      non_physical: sanitize_html(eternal?.non_physical ?? "").trim(),
    },
    present: {
      physical: sanitize_html(present?.physical ?? "").trim(),
      non_physical: sanitize_html(present?.non_physical ?? "").trim(),
    },
    past: coerce_temporal_array(past),
    future: coerce_temporal_array(future),
    // --- MODIFIERS (Visual/Aesthetic overrides) ---
    modifiers: {
      prompt: sanitize_html(modifiers?.prompt ?? visuals?.prompt ?? "").trim(),
      no_background: !!(modifiers?.no_background ?? modifiers?.noBackground ?? visuals?.noBackground ?? visuals?.no_background ?? false),
      flipped: !!(modifiers?.flipped ?? visuals?.flipped ?? false),
      profile_picture_seed: Number(modifiers?.profile_picture_seed ?? visuals?.profile_picture_seed ?? 0),
      color_name: sanitize_html(modifiers?.color_name ?? modifiers?.colorName ?? visuals?.colorName ?? visuals?.color_name ?? "").trim(),
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
      uri: voice?.uri || "",
      rate: voice?.rate || 1.0,
      pitch: voice?.pitch || 1.0,
    },
    // --- INTERNAL ---
    custom_data: custom_data || {},
  };

  return result;
};

/**
 * Coerces a value into a strictly cleaned array of strings.
 * Used for 'past' and 'future' temporal hybrid fields.
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
    id: crypto.randomUUID(),
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
