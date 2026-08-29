/**
 * @file src/media/image-aesthetics.js
 * 👁️ SENSORY CORTEX — AESTHETIC MAP BUILDER & VISUAL ENGINE SYNTHESIS
 *
 * Core Responsibilities:
 * 1. Visual Exclusion Filtering (`VISUAL_EXCLUDED_KEYS`, `strip_visual_excluded`):
 *    - Strips non-visual metadata (`INVENTORY`, `STASH`, `SECRET`, `PLAN`, `STATUS`) from image prompts.
 * 2. Aesthetic Map Synthesis (`build_aesthetic_map`):
 *    - Merges eternal/present physical traits with clothing override protocols.
 *    - Injects resolved visual style tokens (`_visual_style_medium`, `_visual_style_palette`, `_visual_style_camera`, `_visual_style_composition`, `_visual_style_texture`, `_visual_style_tags`).
 *    - Resolves signature palette color aesthetics (`in color #HEX`).
 * 3. Aesthetic Resolvers (`aesthetic_resolver`):
 *    - `extract(entity)`: Formats aesthetic map as formatted JSON property lines.
 *    - `flatten(entity)`: Converts aesthetic map into cohesive descriptive prose sentences.
 *
 * Purity: 100% pure deterministic functions. Zero side effects, zero Svelte runes.
 */

import { VISUAL_STYLES, resolve_portrait_visual_style_key } from "@data";
import { CLOTHING_KEYS, safe_parse_pseudo_json, parse_visual_engine, normalize_comma_spacing } from "@utils";
import { get_signature_label, PALETTE } from "./palette.js";

// ============================================================================
// [SECTION 1: TYPE DEFINITIONS & CONSTANTS]
// ============================================================================

/**
 * @typedef {Object} VisualEngineTokens
 * @property {string} [medium]
 * @property {string} [palette]
 * @property {string} [camera]
 * @property {string} [composition]
 * @property {string} [texture]
 * @property {string} [negative_prompt]
 */

/**
 * @typedef {Object} EntityPhysicalFragment
 * @property {string} [physical]
 */

/**
 * @typedef {Object} AestheticEntityInput
 * @property {string} [id]
 * @property {string} [name]
 * @property {string} [type]
 * @property {string} [kind]
 * @property {string[]} [tags]
 * @property {string} [signature_color]
 * @property {string} [visual_style]
 * @property {EntityPhysicalFragment} [eternal]
 * @property {EntityPhysicalFragment} [present]
 */

/**
 * Keys that must NEVER reach an image-generation prompt (private state or physical inventory).
 * @type {ReadonlySet<string>}
 */
export const VISUAL_EXCLUDED_KEYS = Object.freeze(new Set(["INVENTORY", "STASH", "SECRET", "PLAN", "STATUS"]));

/**
 * Ordered visual style token keys for deterministic prompt composition.
 * @type {ReadonlyArray<string>}
 */
export const ORDERED_VISUAL_STYLE_KEYS = Object.freeze([
  "_visual_style_medium",
  "_visual_style_palette",
  "_visual_style_camera",
  "_visual_style_composition",
  "_visual_style_texture",
  "_visual_style_tags",
]);

/**
 * Pre-compiled regex matching clothing removal markers in present state strings.
 * @type {RegExp}
 */
const BARE_MARKER_REGEX =
  /\[(?:CLOTHING|SHIRT|PANTS|SUIT|JACKET|DRESS|SKIRT|COAT|ROBE|ROBES|APPAREL|UNDERWEAR|OUTFIT|CLOAK|BOTTOMS|TOPS|ACCESSORIES|HARNESS|SCRUBS|HARDWARE|EQUIPMENT|GEAR)\s*:\s*(?:none|bare|naked|off|removed|disrobed)\s*\]/i;

// ============================================================================
// [SECTION 2: EXCLUSION FILTERS & ENGINE TOKEN RESOLVERS]
// ============================================================================

/**
 * Strips non-visual pseudo-JSON keys from a raw parameter string.
 * @param {string | null | undefined} raw_parameter_string
 * @returns {string} Sanitized visual parameter string
 */
export function strip_visual_excluded(raw_parameter_string) {
  if (!raw_parameter_string) return "";
  const parsed_parameters = safe_parse_pseudo_json(raw_parameter_string);
  if (parsed_parameters.__raw_prose__) return raw_parameter_string;

  const retained_entries = Object.entries(parsed_parameters)
    .filter(([key]) => !VISUAL_EXCLUDED_KEYS.has(key))
    .map(([key, value]) => `[${key}: ${Array.isArray(value) ? value.join(", ") : String(value).replace(/[[\]]/g, "")}]`);

  return retained_entries.join(" ");
}

/**
 * Resolves visual engine medium, palette, camera, and negative prompts for a style key.
 * @param {string} visual_style_key
 * @returns {VisualEngineTokens}
 */
export function resolve_visual_engine_tokens(visual_style_key) {
  const visual_style = VISUAL_STYLES[visual_style_key] || VISUAL_STYLES.none;
  const engine_tokens = parse_visual_engine(visual_style.visual_engine);

  if (visual_style.negative_prompt && typeof visual_style.negative_prompt === "string") {
    engine_tokens.negative_prompt = visual_style.negative_prompt.trim();
  }
  return engine_tokens;
}

// ============================================================================
// [SECTION 3: AESTHETIC MAP SYNTHESIS]
// ============================================================================

/**
 * Builds a consolidated key-value aesthetic map for an entity combining traits, styles, and signature palette.
 * @param {AestheticEntityInput} [entity={}]
 * @returns {Record<string, any>}
 */
export function build_aesthetic_map(entity = {}) {
  const eternal_parsed_object = safe_parse_pseudo_json(entity.eternal?.physical || "");
  const present_parsed_object = safe_parse_pseudo_json(entity.present?.physical || "");

  /** @type {Record<string, any>} */
  const merged_aesthetic_map = {};

  /**
   * @param {Record<string, any>} source_object
   * @param {string} fallback_label
   */
  const merge_input_source = (source_object, fallback_label) => {
    if (source_object.__raw_prose__) {
      merged_aesthetic_map[fallback_label] = source_object.__raw_prose__;
    } else {
      Object.entries(source_object).forEach(([key, value]) => {
        if (VISUAL_EXCLUDED_KEYS.has(key)) return;
        merged_aesthetic_map[key] = value;
      });
    }
  };

  merge_input_source(eternal_parsed_object, "eternal");
  merge_input_source(present_parsed_object, "present");

  // --- Clothing Override Protocol ---
  // If present state declares clothing as None or Bare, purge unoverridden eternal clothing tags.
  const raw_present_physical = entity.present?.physical || "";
  const has_bare_clothing_marker = BARE_MARKER_REGEX.test(raw_present_physical);

  if (has_bare_clothing_marker) {
    for (const clothing_key of CLOTHING_KEYS) {
      if (merged_aesthetic_map[clothing_key] && !(clothing_key in present_parsed_object)) {
        delete merged_aesthetic_map[clothing_key];
      }
    }
  }

  // --- Visual Style Engine Injection ---
  const visual_style_key = resolve_portrait_visual_style_key(entity);
  const visual_style_definition = VISUAL_STYLES[visual_style_key] || VISUAL_STYLES.none;
  const engine_tokens = resolve_visual_engine_tokens(visual_style_key);

  if (engine_tokens.medium) merged_aesthetic_map._visual_style_medium = engine_tokens.medium;
  if (engine_tokens.palette) merged_aesthetic_map._visual_style_palette = engine_tokens.palette;
  if (engine_tokens.camera) merged_aesthetic_map._visual_style_camera = engine_tokens.camera;
  if (engine_tokens.composition) merged_aesthetic_map._visual_style_composition = engine_tokens.composition;
  if (engine_tokens.texture) merged_aesthetic_map._visual_style_texture = engine_tokens.texture;
  if (visual_style_key && visual_style_key !== "none" && Array.isArray(visual_style_definition.tags) && visual_style_definition.tags.length) {
    merged_aesthetic_map._visual_style_tags = visual_style_definition.tags.join(", ");
  }

  if (Array.isArray(entity.tags) && entity.tags.length) {
    merged_aesthetic_map.tags = entity.tags.join(", ");
  }

  // --- Palette Signature Color Binding ---
  const signature_color_name = get_signature_label(entity);
  if (signature_color_name) {
    const signature_color_hex = /** @type {Record<string, string>} */ (PALETTE)[signature_color_name];
    merged_aesthetic_map.aesthetic = signature_color_hex ? `in color ${signature_color_hex}` : `${signature_color_name.toLowerCase()} aesthetic`;
  }

  return merged_aesthetic_map;
}

// ============================================================================
// [SECTION 4: AESTHETIC RESOLVERS (EXTRACT & FLATTEN)]
// ============================================================================

export const aesthetic_resolver = {
  /**
   * Deterministic extraction of traits from entity fields into formatted JSON property lines.
   * @param {AestheticEntityInput} [entity={}]
   * @returns {string}
   */
  extract(entity = {}) {
    const merged_aesthetic_map = build_aesthetic_map(entity);
    const ordered_aesthetic_keys = [
      ...ORDERED_VISUAL_STYLE_KEYS.filter((key) => merged_aesthetic_map[key]),
      ...Object.keys(merged_aesthetic_map).filter((key) => !ORDERED_VISUAL_STYLE_KEYS.includes(key)),
    ];

    return ordered_aesthetic_keys
      .map((key) => {
        const value = merged_aesthetic_map[key];
        if (value === undefined || value === null) return "";
        const value_string = Array.isArray(value) ? value.join(", ") : String(value).trim();
        if (!value_string) return "";
        const formatted_value = normalize_comma_spacing(value_string);
        const cleaned_key = key.replace(/^_visual_style_/, "");
        return `  "${cleaned_key}": "${formatted_value.replace(/"/g, '\\"')}"`;
      })
      .filter(Boolean)
      .join(",\n");
  },

  /**
   * Deterministic flattening of entity physical traits into continuous descriptive sentences.
   * @param {AestheticEntityInput} [entity={}]
   * @returns {string}
   */
  flatten(entity = {}) {
    const merged_aesthetic_map = build_aesthetic_map(entity);
    const visual_style_values = ORDERED_VISUAL_STYLE_KEYS.map((key) => merged_aesthetic_map[key]).filter(Boolean);
    const additional_values = Object.entries(merged_aesthetic_map)
      .filter(([key]) => !ORDERED_VISUAL_STYLE_KEYS.includes(key))
      .map(([key, value]) => {
        const value_string = Array.isArray(value) ? value.join(", ") : String(value).trim();
        return key.startsWith("_visual_style_") || key === "aesthetic" ? value_string : `${key.replace(/_/g, " ")}: ${value_string}`;
      })
      .filter(Boolean);

    return normalize_comma_spacing([...visual_style_values, ...additional_values].join(". "));
  },
};

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Harmonized via /harmonize protocol: purged clipped abbreviations (VS_ORDERED_KEYS -> ORDERED_VISUAL_STYLE_KEYS,
 *   _vs_* -> _visual_style_*, *_obj -> *_object, val -> value, val_str -> value_string, vs_values -> visual_style_values),
 *   added JSDoc typedefs (VisualEngineTokens, AestheticEntityInput), extracted precompiled module-level BARE_MARKER_REGEX,
 *   and structured 4 typed section dividers.
 * - 2026-08-29: Applied ground-up /refactor protocol: added Universal File Architecture header block,
 *   structured section dividers, sealed VISUAL_EXCLUDED_KEYS with Object.freeze,
 *   standardized camelCase parameters to snake_case, and verified unit test suite.
 * - 2026-08-28: Bound palette hex directly in build_aesthetic_map and implemented clothing override protocol.
 */
