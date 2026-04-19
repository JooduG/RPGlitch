/* ============================================================================
 *  src/theme/palette.svelte.js
 *  🎨 THEME STORE (REACTIVE)
 *  Centralized management for Signature Colors using Svelte 5 Runes.
 *  Following the "Red Thread": Foundation -> Logic -> UI Fallbacks.
 *  ============================================================================ */

/**************************************************************************************
 * 🧩 [LEVEL 0: FOUNDATION REGISTRY]
 * The static mapping of colors and their CSS variable counterparts.
 ************************************************************************************/

export const PALETTE = {
  /* Warm Hues */
  "Crimson Red": "#ef4444",
  "Sunset Orange": "#f97316",
  "Pumpkin Amber": "#fbbf24",
  "Lemon Yellow": "#fde047",

  /* Green Hues */
  "Lime Green": "#84cc16",
  "Forest Green": "#15803d",
  "Emerald Green": "#10b981",

  /* Cool Hues */
  "Neon Teal": "#14b8a6",
  "Electric Cyan": "#11aecc",
  "Ocean Blue": "#3b82f6",
  "Deep Indigo": "#818cf8",

  /* Purple & Pink Hues */
  "Twilight Violet": "#c084fc",
  "Royal Purple": "#a855f7",
  "Hot Pink": "#ec4899",
  "Coral Rose": "#fb7185",
};

export const PALETTE_VARS = {
  /* Warm */
  "#ef4444": "var(--color-red)",
  "#f97316": "var(--color-orange)",
  "#fbbf24": "var(--color-amber)",
  "#fde047": "var(--color-yellow)",

  /* Green */
  "#84cc16": "var(--color-lime)",
  "#15803d": "var(--color-forest)",
  "#10b981": "var(--color-emerald)",

  /* Cool */
  "#14b8a6": "var(--color-teal)",
  "#11aecc": "var(--color-cyan)",
  "#3b82f6": "var(--color-blue)",
  "#818cf8": "var(--color-indigo)",

  /* Purple/Pink */
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
   * 🧩 [LEVEL 1: LOGIC & PARSERS]
   * ----------------------------------------------------------------------------------
   * utilities for color transformation and entity resolution.
   ************************************************************************************/

  /**
   * Helper to convert Hex to RGB triplet
   * @param {string} hex - "#RRGGBB" or "var(--color-name)"
   * @returns {string} - "R, G, B"
   */
  hex_to_rgb(hex) {
    if (!hex) return "168, 85, 247"; // Default purple

    // Reverse lookup CSS tokens back to raw hex if they come from the standard palette
    if (hex.startsWith("var(")) {
      const standard_match = Object.entries(PALETTE_VARS).find(([k, v]) => v === hex);
      if (standard_match) hex = standard_match[0];
      else return hex.replace(")", "-rgb)"); // Nordic custom colors fallback
    }

    const shorthand_regex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthand_regex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : "168, 85, 247";
  }

  /**
   * Gets a deterministic color from a seed if no explicit color is set.
   */
  get_deterministic_color(seed) {
    const final_seed = seed || "default";
    let hash = 0;
    for (let i = 0; i < final_seed.length; i++) {
      hash = final_seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const keys = Object.keys(PALETTE);
    const hex = PALETTE[keys[Math.abs(hash) % keys.length]];
    return this.resolve_token(hex) || hex;
  }

  resolve_token(color) {
    if (!color) return null;
    if (color.startsWith("var(")) return color;
    return PALETTE_VARS[color] || null;
  }

  /**
   * Resolves the actual color value (Hex or Token) for an entity.
   */
  get_signature_color(entity) {
    if (entity) {
      const color = entity.signature_color;
      if (color) {
        // 1. Check mapped tokens
        const token = this.resolve_token(color);
        if (token) return token;

        // 2. Check named palette keys
        if (PALETTE[color]) {
          const hex = PALETTE[color];
          return this.resolve_token(hex) || hex;
        }
        return color; // Fallback to raw hex
      }
    }

    // Fallback to deterministic color
    const seed = [entity?.name || "", ...(entity?.tags || [])].filter(Boolean).join(",");
    return this.get_deterministic_color(seed || entity?.id || "");
  }

  /************************************************************************************
   * 🧩 [LEVEL 2: UI FALLBACKS & MATH]
   * ----------------------------------------------------------------------------------
   * Luminosity and generative aesthetics.
   ************************************************************************************/

  get_contrast_color(hex) {
    if (!hex || typeof hex !== "string" || hex.startsWith("hsl")) return "var(--color-white)";
    let color = hex.replace("#", "");
    if (color.length === 3) {
      color = color
        .split("")
        .map((c) => c + c)
        .join("");
    }
    if (color.length !== 6 || !/^[0-9a-f]{6}$/i.test(color)) return "var(--color-white)";
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "var(--color-black)" : "var(--color-white)";
  }

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
