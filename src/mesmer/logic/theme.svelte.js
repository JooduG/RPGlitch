import { PALETTE } from "../../gamemaster/config.js";

/**
 * THEME STORE (REACTIVE)
 * Centralized management for Signature Colors using Svelte 5 Runes.
 */
class ThemeStore {
  /**
   * Helper to convert Hex to RGB triplet
   * @param {string} hex - "#RRGGBB"
   * @returns {string} - "R G B"
   */
  hexToRgb(hex) {
    if (!hex) return "182 69 205"; // Default purple
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
      : "182 69 205";
  }

  /**
   * Normalizes an entity to ensure it has valid visual and behavioral properties.
   * @param {Object} entity
   * @returns {Object}
   */
  normalizeEntity(entity) {
    if (!entity) return null;
    const e = { ...entity };

    // 1. VISUALS
    if (!e.visuals) e.visuals = {};
    if (e.signatureColor && !e.visuals.signatureColor) {
      e.visuals.signatureColor = e.signatureColor;
    }
    const baseColor = e.visuals.signatureColor || "default";
    if (PALETTE[baseColor]) {
      e.visuals.signatureColor = PALETTE[baseColor];
    }
    if (!e.visuals.signatureColor) {
      e.visuals.signatureColor = PALETTE.default;
    }

    // [FIX] Ensure voice object exists to prevent "rate" TypeError in Profile.svelte
    if (!e.voice) {
      e.voice = {
        uri: "",
        rate: 1.0,
        pitch: 1.0,
      };
    } else {
      // Ensure defaults if partial voice object exists
      if (e.voice.rate === undefined) e.voice.rate = 1.0;
      if (e.voice.pitch === undefined) e.voice.pitch = 1.0;
    }

    // [FIX] Ensure dynamics object exists for the radar chart/sliders
    if (!e.dynamics) {
      e.dynamics = {
        chaos: 50,
        order: 51,
        entropy: 50,
        velocity: 50,
      };
    }

    // [FIX] Ensure customData.plot exists for the tracker
    if (!e.customData) e.customData = {};
    if (!e.customData.plot) {
      e.customData.plot = { active: [], resolved: [] };
    }

    return e;
  }

  /**
   * Gets a deterministic color from a seed if no explicit color is set.
   */
  getDeterministicColor(seed) {
    const finalSeed = seed || "default";
    let hash = 0;
    for (let i = 0; i < finalSeed.length; i++)
      hash = finalSeed.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 40%, 60%)`;
  }

  /**
   * Resolves the actual color value (Hex or HSL) for an entity.
   */
  getSignatureColor(entity) {
    if (entity) {
      const color = entity.visuals?.signatureColor || entity.signatureColor;

      if (color && color !== "default") {
        // If it's a known palette key, return the hex
        if (PALETTE[color]) return PALETTE[color];
        return color; // Return raw hex
      }
    }

    const seed = [entity?.name || "", ...(entity?.tags || [])]
      .filter(Boolean)
      .join(",");
    return this.getDeterministicColor(seed || entity?.id || "default");
  }

  /**
   * Calculates the best contrast color (black or white) for a given hex background.
   */
  getContrastColor(hex) {
    if (!hex || typeof hex !== "string") return "#000";
    let color = hex.replace("#", "");
    if (color.length === 3) {
      color = color
        .split("")
        .map((char) => char + char)
        .join("");
    }
    if (color.length !== 6 || !/^[0-9a-f]{6}$/i.test(color)) return "#000";

    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000" : "#fff";
  }

  darkenColor(hex, amount = 20) {
    if (!hex || hex.startsWith("var")) return hex;
    // Simple darken logic
    let color = hex.replace("#", "");
    const num = parseInt(color, 16);
    let r = (num >> 16) - amount;
    let g = ((num >> 8) & 0x00ff) - amount;
    let b = (num & 0x0000ff) - amount;
    r = r < 0 ? 0 : r;
    g = g < 0 ? 0 : g;
    b = b < 0 ? 0 : b;
    return "#" + (g | (r << 8) | (b << 16)).toString(16).padStart(6, "0");
  }

  mixHex(color1) {
    // Basic hex mixing
    return color1; // Placeholder to satisfy imports
  }

  /**
   * Generates a smart initial string from an entity name.
   * Filters out common stopwords unless they are the only word.
   * Max 3 characters.
   */
  getInitials(name) {
    if (!name) return "?";

    const stopWords = new Set([
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

    const words = name.trim().split(/\s+/);

    // Filter stopwords, but keep them if it results in an empty list (e.g. name is "The")
    let filteredWords = words.filter((w) => !stopWords.has(w.toLowerCase()));
    if (filteredWords.length === 0) filteredWords = words;

    // Take up to 3 initials
    return filteredWords
      .slice(0, 3)
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase();
  }
}

export const themeStore = new ThemeStore();
export { PALETTE };
