/* ============================================================================
 *  src/theme/palette.svelte.js
 *  [**] THEME STORE (REACTIVE)
 *  Centralized management for Signature Colors using Svelte 5 Runes.
 *  Following the "Red Thread": Foundation -> Logic -> UI Fallbacks.
 *  ============================================================================ */

import { PALETTE as DYNAMIC_PALETTE, PALETTE_VARS as DYNAMIC_PALETTE_VARS } from "./tokens.js";

/**************************************************************************************
 * [LEVEL 0: FOUNDATION REGISTRY]
 * The static mapping of colors and their CSS variable counterparts.
 ************************************************************************************/

export const PALETTE = DYNAMIC_PALETTE;
export const PALETTE_VARS = DYNAMIC_PALETTE_VARS;

/**
 * Filtered registry of vibrant colors suitable for entity signatures.
 * Excludes backgrounds, neutrals, and non-vibrant utility colors.
 */
export const SIGNATURE_COLORS = Object.keys(PALETTE).filter(
  (key) =>
    !key.startsWith("Background") &&
    !["Chalk", "Frisk", "Frozen", "Gunmetal", "Pure White", "Void Black"].includes(key),
);

export const IMG_RESOLUTION = "512x768";

export const PROFILE_PICTURE_PLACEHOLDERS = {
  default:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTEyIDhhNCA0IDAgMSAwIDAtOCA0IDQgMCAwIDAgMCA4eiIvPjxwYXRoIGQ9Ik02IDIxdi0yYTYgNiAwIDAgMSAxMiAweiIvPjwvc3ZnPg==",
};

/**
 *
 */
class ThemeStore {
  /************************************************************************************
   * [LEVEL 1: LOGIC & PARSERS]
   * ----------------------------------------------------------------------------------
   * utilities for color transformation and entity resolution.
   ************************************************************************************/

  /**
   * Gets a deterministic color from a seed if no explicit color is set.
   * @param {string} [seed]
   */
  get_deterministic_color(seed) {
    const final_seed = seed || "default";
    const hash = this._hash(final_seed);
    const keys = SIGNATURE_COLORS;
    const key = keys[Math.abs(hash) % keys.length];
    const hex = /** @type {string} */ (/** @type {any} */ (PALETTE)[key]);
    return this.resolve_token(hex) || hex;
  }

  /**
   * @param {string} [color]
   * @returns {string | null}
   */
  resolve_token(color) {
    if (!color) return null;
    if (color.startsWith("var(")) return color;
    return /** @type {any} */ (PALETTE_VARS)[color] || null;
  }

  /**
   * @param {string} [hex]
   * @returns {string}
   */
  get_color_name(hex) {
    if (!hex) return "";
    // 1. Direct search in PALETTE by value
    const match = Object.entries(PALETTE).find(
      ([_, value]) => value.toLowerCase() === hex.toLowerCase(),
    );
    if (match) return match[0];

    // 2. Resolve token first if it's a var()
    if (hex.startsWith("var(")) {
      const hex_val = Object.entries(PALETTE_VARS).find(([, v]) => v === hex)?.[0];
      if (hex_val) return this.get_color_name(hex_val);
    }

    return "";
  }

  /**
   * Returns the direct human-readable label for an entity's signature color.
   * Eliminates the Name -> Hex -> Name round-trip.
   * @param {any} entity
   * @returns {string}
   */
  get_signature_label(entity) {
    if (!entity) return "Electric Cyan";
    const color = entity.signature_color;

    // 1. If it's already a valid label (UI default), use it
    if (color && /** @type {any} */ (PALETTE)[color]) return color;

    // 2. If it's a hex or token, try to resolve it
    if (color) {
      const name = this.get_color_name(color);
      if (name) return name;
    }

    // 3. Fallback to deterministic label (Seed -> Name)
    const seed = [entity?.name || "", ...(entity?.tags || [])].filter(Boolean).join(",");
    const hash = this._hash(seed || entity?.id || "default");
    const keys = SIGNATURE_COLORS;
    return keys[Math.abs(hash) % keys.length];
  }

  // Internal hash helper for deterministic resolution
  /**
   * @param {string} str
   * @returns {number}
   */
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  /**
   * Resolves the actual color value (Hex or Token) for an entity or raw color string.
   * @param {any} entity - The entity object or a raw color string/hex.
   * @param {string} [fallback='var(--gunmetal)'] - Neutral fallback for non-entity contexts.
   * @returns {string}
   */
  get_signature_color(entity, fallback = "var(--signature-color)") {
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
      const token = this.resolve_token(color);
      if (token) return token;

      if (/** @type {any} */ (PALETTE)[color]) {
        const hex = /** @type {any} */ (PALETTE)[color];
        return this.resolve_token(hex) || hex;
      }
      return color; // Fallback to raw hex or the string itself
    }

    // 3. Strict guard for non-entities (must have identity if no explicit color)
    if (typeof entity === "object" && !entity.id && !entity.name) {
      return fallback;
    }

    // 4. Fallback to deterministic color for valid entities
    const seed = [entity.name || "", ...(entity.tags || [])].filter(Boolean).join(",");
    return this.get_deterministic_color(seed || entity.id || "default");
  }

  /************************************************************************************
   * [LEVEL 2: UI FALLBACKS & MATH]
   * ----------------------------------------------------------------------------------
   * Luminosity and generative aesthetics.
   ************************************************************************************/

  /**
   * @param {string | null} [hex]
   * @returns {string}
   */
  get_contrast_color(hex) {
    if (!hex || typeof hex !== "string" || hex.startsWith("hsl")) return "var(--pure-white)";
    let color = hex.replace("#", "");
    if (color.length === 3) {
      color = color
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (color.length !== 6 || !/^[0-9a-f]{6}$/i.test(color)) return "var(--pure-white)";
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "var(--void-black)" : "var(--pure-white)";
  }

  /**
   * @param {string} hex
   * @param {number} [amount]
   * @returns {string}
   */
  darken_color(hex, amount = 20) {
    if (!hex || hex.startsWith("var") || hex.startsWith("hsl")) return hex;
    let color = hex.replace("#", "");
    const num = parseInt(color, 16);
    let r = (num >> 16) - amount;
    let g = ((num >> 8) & 0x00ff) - amount;
    let b = (num & 0x0000ff) - amount;
    return (
      "#" +
      (((r < 0 ? 0 : r) << 16) | ((g < 0 ? 0 : g) << 8) | (b < 0 ? 0 : b))
        .toString(16)
        .padStart(6, "0")
    );
  }
}

export const themeStore = new ThemeStore();
