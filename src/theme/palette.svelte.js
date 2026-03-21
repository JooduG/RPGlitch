/* ============================================================================
 *  src/theme/palette.svelte.js
 *  🎨 THEME STORE (REACTIVE)
 *  Centralized management for Signature Colors using Svelte 5 Runes.
 *  Flattened for the Twin-Cylinder architecture.
 *  ============================================================================ */

/**************************************************************************************
 * 🧩 [SECTION: COLOR PALETTE & MAPPINGS]
 * Static registries merged from legacy `palette.js`.
 ************************************************************************************/
import { normalize } from "@data/content_normaliser.js";
export const PALETTE = {
  "Crimson Red": "#ef4444",
  "Sunset Orange": "#f97316",
  "Pumpkin Amber": "#fbbf24",
  "Lemon Yellow": "#fde047",
  "Lime Green": "#84cc16",
  "Forest Green": "#15803d",
  "Emerald Green": "#10b981",
  "Neon Teal": "#14b8a6",
  "Electric Cyan": "#11aecc",
  "Ocean Blue": "#3b82f6",
  "Deep Indigo": "#818cf8",
  "Twilight Violet": "#c084fc",
  "Royal Purple": "#a855f7",
  "Hot Pink": "#ec4899",
  "Coral Rose": "#fb7185",
};

export const PALETTE_VARS = {
  "#ef4444": "var(--color-red)",
  "#f97316": "var(--color-orange)",
  "#fbbf24": "var(--color-amber)",
  "#fde047": "var(--color-yellow)",
  "#84cc16": "var(--color-lime)",
  "#15803d": "var(--color-forest)",
  "#10b981": "var(--color-emerald)",
  "#14b8a6": "var(--color-teal)",
  "#11aecc": "var(--color-cyan)",
  "#3b82f6": "var(--color-blue)",
  "#818cf8": "var(--color-indigo)",
  "#c084fc": "var(--color-violet)",
  "#a855f7": "var(--color-purple)",
  "#ec4899": "var(--color-pink)",
  "#fb7185": "var(--color-rose)",
};

export const RGB_MAP = {
  "Crimson Red": "239, 68, 68",
  "Sunset Orange": "249, 115, 22",
  "Pumpkin Amber": "251, 191, 36",
  "Lemon Yellow": "253, 224, 71",
  "Lime Green": "132, 204, 22",
  "Forest Green": "21, 128, 61",
  "Emerald Green": "16, 185, 129",
  "Neon Teal": "20, 184, 166",
  "Electric Cyan": "17, 174, 204",
  "Ocean Blue": "59, 130, 246",
  "Deep Indigo": "129, 140, 248",
  "Twilight Violet": "192, 132, 252",
  "Royal Purple": "168, 85, 247",
  "Hot Pink": "236, 72, 153",
  "Coral Rose": "251, 113, 133",
};

export const IMG_RESOLUTION = "512x768";
export const PROFILE_PICTURE_PLACEHOLDERS = {
  default:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTEyIDhhNCA0IDAgMSAwIDAtOCA0IDQgMCAwIDAgMCA4eiIvPjxwYXRoIGQ9Ik02IDIxdi0yYTYgNiAwIDAgMSAxMiAweiIvPjwvc3ZnPg==",
};
class ThemeStore {
  /************************************************************************************
   * 🧩 [SECTION: CORE PARSERS & HELPERS]
   * ----------------------------------------------------------------------------------
   * Raw string and hex manipulation utilities.
   * Helper to convert Hex to RGB triplet
   * @param {string} hex - "#RRGGBB"
   * @returns {string} - "R, G, B" (Updated to use comma separation for CSS variables)
   ************************************************************************************/
  hex_to_rgb(hex) {
    if (!hex) return "168, 85, 247"; // Default purple (Vibrant Violet)
    
    // Reverse lookup CSS tokens back to raw hex if they come from the standard palette
    if (hex.startsWith("var(")) {
      const standard_match = Object.entries(PALETTE_VARS).find(([k, v]) => v === hex);
      if (standard_match) hex = standard_match[0]; // Feed the raw hex down to the regex
      else return hex.replace(")", "-rgb)"); // Nordic custom colors fallback to CSS variable passthrough
    }

    const shorthand_regex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthand_regex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : "168, 85, 247";
  }

  /************************************************************************************
   * 🧩 [SECTION: ENTITY RESOLUTION]
   * ----------------------------------------------------------------------------------
   * Determining base aesthetic states from entity data.
   * Delegates to the central normalizer to ensure strict data structure.
   * ZERO backwards compatibility; ignores nested 'visuals' object.
   ************************************************************************************/
  normalize_entity(entity) {
    if (!entity) return null;
    return normalize(entity);
  }

  /**************************************************************************************
   * Gets a deterministic color from a seed if no explicit color is set.
   * Pulls strictly from the predefined PALETTE to enforce design tokens.
   **************************************************************************************/
  get_deterministic_color(seed) {
    const final_seed = seed || "default";
    let hash = 0;
    for (let i = 0; i < final_seed.length; i++) {
      hash = final_seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const keys = Object.keys(PALETTE).filter((k) => k !== "default");
    const hex = PALETTE[keys[Math.abs(hash) % keys.length]];
    return this.resolve_token(hex) || hex;
  }
  resolve_token(color) {
    if (!color) return null;
    if (color.startsWith("var(")) return color;
    return PALETTE_VARS[color] || null;
  }

  /**************************************************************************************
   * Resolves the actual color value (Hex, HSL, or Token) for an entity.
   * Looks at the flattened signature_color property.
   **************************************************************************************/
  get_signature_color(entity) {
    if (entity) {
      const color = entity.signature_color;
      if (color) {
        // 1. Check if it's already a token or a mapped hex
        const token = this.resolve_token(color);
        if (token) return token;

        // 2. Check if it's a named palette key (e.g., "Hot Pink")
        if (PALETTE[color]) {
          const hex = PALETTE[color];
          return this.resolve_token(hex) || hex;
        }
        return color; // Fallback to raw hex string
      }
    }

    // Fallback to deterministic color based on name/tags
    const seed = [entity?.name || "", ...(entity?.tags || [])]
      .filter(Boolean)
      .join(",");
    return this.get_deterministic_color(seed || entity?.id || "");
  }
  /************************************************************************************
   * 🧩 [SECTION: CONTRAST & MATH]
   * ----------------------------------------------------------------------------------
   * Luminosity calculations and dynamic color adjustments.
   * Calculates the best contrast color (black or white) for a background.
   ************************************************************************************/
  get_contrast_color(hex) {
    if (!hex || typeof hex !== "string" || hex.startsWith("hsl"))
      return "var(--color-white)";
    let color = hex.replace("#", "");
    if (color.length === 3) {
      color = color
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (color.length !== 6 || !/^[0-9a-f]{6}$/i.test(color))
      return "var(--color-white)";
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "var(--color-black)" : "var(--color-white)";
  }

  /**************************************************************************************
   * Simple darkening utility for borders or hover states.
   **************************************************************************************/
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

  /************************************************************************************
   * 🧩 [SECTION: UI FALLBACKS]
   * ----------------------------------------------------------------------------------
   * Generating aesthetic fallbacks for missing assets.
   * Generates initials for avatar fallbacks.
   * Safely strips all punctuation and symbols before extracting letters.
   ************************************************************************************/
  get_initials(name) {
    if (!name) return "?";

    // 1. Strip everything that is not a letter or a space (removes ', ", -, etc.)
    const clean_name = name.replace(/[^a-zA-Z\s]/g, "");
    const stop_words = new Set([
      "the",
      "a",
      "an",
      "of",
      "in",
      "and",
      "or",
      "for",
      "to",
      "at",
      "by",
      "with",
    ]);

    // 2. Split into words
    const words = clean_name.trim().split(/\s+/);

    // 3. Filter stopwords (unless the name *is* just a stopword)
    let filtered_words = words.filter((w) => !stop_words.has(w.toLowerCase()));
    if (filtered_words.length === 0) filtered_words = words;

    // 4. Extract first letter of up to 3 words
    return (
      filtered_words
        .slice(0, 3)
        .map((w) => w.charAt(0))
        .join("")
        .toUpperCase() || "?"
    );
  }
}
export const themeStore = new ThemeStore();
