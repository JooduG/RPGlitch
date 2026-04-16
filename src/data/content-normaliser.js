/**
 * src/data/content-normaliser.js
 * 🧪 CONTENT NORMALISATION LOGIC
 * Enforces the strict "Twin-Cylinder" data structure across the app.
 * ZERO BACKWARDS COMPATIBILITY.
 */
import { PALETTE } from "../theme/palette.svelte.js";
import { Security } from "../core/security.js";
const sanitize_html = Security.sanitize;
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
      noBackground: false,
      flipped: false,
      profilePictureSeed: 0,
      colorName: "",
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
  return keys[Math.floor(Math.random() * keys.length)];
};
/**
 * Main Normalizer
 * Enforces structural integrity and sanitization.
 */
export const normalize = (base = {}) => {
  // [FIX] Destructure id, timestamps, and database flags so they aren't lost
  const {
    id,
    created_at,
    updated_at,
    origin_id,
    is_premade,
    is_custom,
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
    _backup_state = null,
    _last_update_msg_id = null,
  } = base;
  const result = {
    // --- CORE METADATA ---
    name: sanitize_html(name).trim(),
    description: sanitize_html(description).trim(),
    type: type,
    signature_color: sanitize_html(String(signature_color)).trim() || get_random_signature_key(),
    profile_picture: sanitize_html(String(profile_picture)).trim(),
    tags: (Array.isArray(tags) ? tags : [])
      .map((s) => sanitize_html(String(s).trim()))
      .filter(Boolean),
    // --- TEMPORAL HYBRID 6 (PURGED: appearance, identity, outfit, status) ---
    eternal: {
      physical: sanitize_html(eternal?.physical ?? "").trim(), // Use ?? "" instead of || ""
      non_physical: sanitize_html(eternal?.non_physical ?? "").trim(),
    },
    present: {
      physical: sanitize_html(present?.physical ?? "").trim(),
      non_physical: sanitize_html(present?.non_physical ?? "").trim(),
    },
    past: Array.isArray(past) ? past : [],
    future: Array.isArray(future) ? future : [],
    // --- MODIFIERS (Visual/Aesthetic overrides) ---
    modifiers: {
      prompt: sanitize_html(modifiers?.prompt ?? visuals?.prompt ?? "").trim(),
      noBackground: !!(modifiers?.noBackground ?? visuals?.noBackground ?? visuals?.no_background ?? false),
      flipped: !!(modifiers?.flipped ?? visuals?.flipped ?? false),
      profile_picture_seed: Number(modifiers?.profile_picture_seed ?? visuals?.profile_picture_seed ?? 0),
      colorName: sanitize_html(modifiers?.colorName ?? visuals?.colorName ?? "").trim(),
    },
    // --- DYNAMICS (Physics Sliders) ---
    dynamics: (() => {
      if (dynamics && Object.keys(dynamics).length > 0) return { ...dynamics };
      // Seed from type-template on birth
      return ENTITY_TEMPLATES[type]?.dynamics ? { ...ENTITY_TEMPLATES[type].dynamics } : {};
    })(),
    // --- VOICE ---
    voice: {
      uri: voice?.uri || "",
      rate: voice?.rate || 1.0,
      pitch: voice?.pitch || 1.0,
    },
    // --- INTERNAL ---
    custom_data: custom_data || {},
    _backup_state,
    _last_update_msg_id,
  };
  // [CRITICAL FIX] Preserve database identity and timestamps!
  // Without this, Profile.svelte's `{#if char && char.id}` will fail and remain hidden.
  if (id) result.id = id;
  if (created_at) result.created_at = created_at;
  if (updated_at) result.updated_at = updated_at;
  if (origin_id) result.origin_id = origin_id;
  if (is_premade !== undefined) result.is_premade = is_premade;
  if (is_custom !== undefined) result.is_custom = is_custom;
  return result;
};

/**
 * Coerces a value into a strictly cleaned array of strings.
 * Used for 'past' and 'future' temporal hybrid fields.
 * @param {string|string[]} val 
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
 * 🏭 THE FACTORY
 * Creates a brand new, fully normalized entity with a RANDOM signature color.
 */
export const create_new = (type = "character", overrides = {}) => {
  const template = ENTITY_TEMPLATES[type] || ENTITY_TEMPLATES.character;
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
 */
export const format_premade = (entity, type) => {
  return {
    ...entity,
    type: type,
    is_premade: 1,
    version: STORAGE_VERSION,
    ...normalize(entity),
    updated_at: 0,
  };
};
