/**
 * @file src/utils/palette.js
 * Pure deterministic entity signature color and label resolution over generated design tokens.
 */

import { fnv1a_hash } from "./math.js";
import { PALETTE, PALETTE_CSS_VARIABLES, SIGNATURE_COLORS } from "./tokens.js";

/**
 * Resolves a raw hex or `var(...)` string to its CSS custom property token.
 * @param {string | null | undefined} color
 * @returns {string | null}
 */
function resolve_token(color) {
  if (!color) return null;
  if (color.startsWith("var(")) return color;
  return PALETTE_CSS_VARIABLES[color] || null;
}

/**
 * Resolves the human-readable palette label from a hex or CSS variable string.
 * @param {string | null | undefined} color_value
 * @returns {string}
 */
function get_color_name(color_value) {
  if (!color_value) return "";

  const match = Object.entries(PALETTE).find(([, value]) => value.toLowerCase() === color_value.toLowerCase());
  if (match) return match[0];

  if (color_value.startsWith("var(")) {
    const matched_hex = Object.entries(PALETTE_CSS_VARIABLES).find(([, value]) => value === color_value)?.[0];
    if (matched_hex) return get_color_name(matched_hex);
  }

  return "";
}

/**
 * Builds a deterministic hash seed string from an entity's identity metadata.
 * @param {any} entity
 * @returns {string}
 */
function build_entity_seed(entity) {
  if (typeof entity !== "object" || !entity) return String(entity || "default");
  const joined = [entity.name || "", ...(entity.tags || [])].filter(Boolean).join(",");
  return joined || entity.id || "default";
}

/**
 * Returns the human-readable palette label for an entity's signature color.
 * @param {{ signature_color?: string, name?: string, tags?: string[], id?: string } | string | null | undefined} entity
 * @returns {string}
 */
export function get_signature_label(entity) {
  if (!entity) return "Frozen";
  const color = typeof entity === "object" ? entity.signature_color : String(entity);

  if (color && PALETTE[color]) return color;

  if (color) {
    const name = get_color_name(color);
    if (name) return name;
  }

  const hash = fnv1a_hash(build_entity_seed(entity));
  return SIGNATURE_COLORS[hash % SIGNATURE_COLORS.length];
}

/**
 * Resolves the CSS color variable or hex string for an entity or raw color string.
 * @param {{ signature_color?: string, name?: string, tags?: string[], id?: string } | string | null | undefined} entity
 * @param {string} [fallback="var(--color-frozen)"]
 * @returns {string}
 */
export function get_signature_color(entity, fallback = "var(--color-frozen)") {
  if (!entity) return fallback;

  const color =
    typeof entity === "string" ? entity
    : typeof entity === "object" && entity.signature_color ? entity.signature_color
    : null;

  if (color) {
    const token = resolve_token(color);
    if (token) return token;

    if (PALETTE[color]) {
      const hex = PALETTE[color];
      return resolve_token(hex) || hex;
    }
    return color;
  }

  if (typeof entity === "object" && !entity.id && !entity.name) {
    return fallback;
  }

  const hash = fnv1a_hash(build_entity_seed(entity));
  const key = SIGNATURE_COLORS[hash % SIGNATURE_COLORS.length];
  const hex = PALETTE[key];
  return resolve_token(hex) || hex;
}
