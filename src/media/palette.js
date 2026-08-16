/**
 * src/media/palette.js
 * 🎨 SIGNATURE PALETTE LOGIC
 * Hand-written bridge between the generated design tokens and the UI.
 *
 * - PALETTE / PALETTE_VARS are DERIVED here from the generated TOKENS, never
 *   hand-maintained — the hex values live in DESIGN.md.
 * - SIGNATURE_COLORS (the 15 vibrant entity colors) lives in @data and is
 *   generated from DESIGN.md's `signatures` block; it is re-exported here so
 *   the @media barrel stays the single UI-facing facade.
 * - The deterministic resolution functions live here so that tokens.js stays
 *   100% generated and the data layer never depends on @media.
 */

import { SIGNATURE_COLORS } from "@data";
import { TOKENS } from "./tokens.js";

const to_label = (name) =>
  name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const color_entries = Object.entries(TOKENS)
  .filter(([name, value]) => name.startsWith("color-") && typeof value === "string" && value.startsWith("#"))
  .sort(([a], [b]) => a.localeCompare(b));

export const PALETTE = Object.fromEntries(color_entries.map(([name, value]) => [to_label(name.slice("color-".length)), value]));

export const PALETTE_VARS = Object.fromEntries(color_entries.map(([name, value]) => [value, `var(--${name})`]));

export { SIGNATURE_COLORS };

/************************************************************************************
 * [LEVEL 1: LOGIC & PARSERS]
 * ----------------------------------------------------------------------------------
 * utilities for color transformation and entity resolution.
 ************************************************************************************/

// Internal hash helper for deterministic resolution
/**
 * @param {string} str
 * @returns {number}
 */
function _hash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

/**
 * @param {string} [color]
 * @returns {string | null}
 */
export function resolve_token(color) {
  if (!color) return null;
  if (color.startsWith("var(")) return color;
  return /** @type {any} */ (PALETTE_VARS)[color] || null;
}

/**
 * Gets a deterministic color from a seed if no explicit color is set.
 * @param {string} [seed]
 */
export function get_deterministic_color(seed) {
  const final_seed = seed || "default";
  const hash = _hash(final_seed);
  const keys = SIGNATURE_COLORS;
  const key = keys[Math.abs(hash) % keys.length];
  const hex = /** @type {string} */ (/** @type {any} */ (PALETTE)[key]);
  return resolve_token(hex) || hex;
}

/**
 * @param {string} [hex]
 * @returns {string}
 */
export function get_color_name(hex) {
  if (!hex) return "";
  // 1. Direct search in PALETTE by value
  const match = Object.entries(PALETTE).find(([_, value]) => value.toLowerCase() === hex.toLowerCase());
  if (match) return match[0];

  // 2. Resolve token first if it's a var()
  if (hex.startsWith("var(")) {
    const hex_val = Object.entries(PALETTE_VARS).find(([, v]) => v === hex)?.[0];
    if (hex_val) return get_color_name(hex_val);
  }

  return "";
}

/**
 * Returns the direct human-readable label for an entity's signature color.
 * Eliminates the Name -> Hex -> Name round-trip.
 * @param {any} entity
 * @returns {string}
 */
export function get_signature_label(entity) {
  if (!entity) return "Frozen";
  const color = entity.signature_color;

  // 1. If it's already a valid label (UI default), use it
  if (color && /** @type {any} */ (PALETTE)[color]) return color;

  // 2. If it's a hex or token, try to resolve it
  if (color) {
    const name = get_color_name(color);
    if (name) return name;
  }

  // 3. Fallback to deterministic label (Seed -> Name)
  const seed = [entity?.name || "", ...(entity?.tags || [])].filter(Boolean).join(",");
  const hash = _hash(seed || entity?.id || "default");
  const keys = SIGNATURE_COLORS;
  return keys[Math.abs(hash) % keys.length];
}

/**
 * Resolves the actual color value (Hex or Token) for an entity or raw color string.
 * @param {any} entity - The entity object or a raw color string/hex.
 * @param {string} [fallback='var(--frozen)'] - Neutral fallback for non-entity contexts.
 * @returns {string}
 */
export function get_signature_color(entity, fallback = "var(--color-frozen)") {
  if (!entity) return fallback;

  // 1. Resolve potential 'color' string (from raw input or entity property)
  let color = null;
  if (typeof entity === "string") {
    color = entity;
  } else if (typeof entity === "object" && entity.signature_color) {
    color = entity.signature_color;
  }

  // 2. If we found a color string, try to resolve it against the palette
  if (color) {
    const token = resolve_token(color);
    if (token) return token;

    if (/** @type {any} */ (PALETTE)[color]) {
      const hex = /** @type {any} */ (PALETTE)[color];
      return resolve_token(hex) || hex;
    }
    return color; // Fallback to raw hex or the string itself
  }

  // 3. Strict guard for non-entities (must have identity if no explicit color)
  if (typeof entity === "object" && !entity.id && !entity.name) {
    return fallback;
  }

  // 4. Fallback to deterministic color for valid entities
  const seed = [entity.name || "", ...(entity.tags || [])].filter(Boolean).join(",");
  return get_deterministic_color(seed || entity.id || "default");
}
