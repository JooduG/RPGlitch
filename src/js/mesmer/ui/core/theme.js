import { PALETTE } from "../../../gamemaster/config.js";

/**
 * THEME SERVICE
 * Centralized management for Signature Colors and Visual Themes.
 */

// Re-export PALETTE if needed, or consumers should import from constants.
// For now, keeping PALETTE export here for backward compatibility
export { PALETTE };

/**
 * Helper to convert Hex to RGB triplet (for use in rgba(var(--rgb) / alpha))
 * @param {string} hex - "#RRGGBB"
 * @returns {string} - "R G B"
 */
function hexToRgb(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : "182 69 205"; // Default purple fallback
}

/**
 * Generates a deterministic HSL color from a seed string.
 */
export const getDeterministicColor = (seed) => {
  if (!seed) return `hsl(0, 0%, 50%)`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 40%, 60%)`;
};

/**
 * Returns a generic signature color (CSS var or Hex) for an entity.
 */
export const getSignature = (entity = {}) => {
  if (!entity) return getDeterministicColor("default");

  if (entity.signatureColor && entity.signatureColor !== "default") {
    // If it's a known palette key, assume we want the var reference
    if (PALETTE[entity.signatureColor]) {
      return `var(--signature-${entity.signatureColor})`;
    }
    return entity.signatureColor; // Return raw if it's custom? Or fallback.
  }
  const seed = [entity.name || "", ...(entity.tags || [])]
    .filter(Boolean)
    .join(",");
  return getDeterministicColor(seed || entity.id || entity.type || "default");
};

/**
 * Determins if text should be black or white based on background hex.
 */
export const getContrastColor = (hex) => {
  if (!hex || typeof hex !== "string") return "#000";
  if (hex.startsWith("var(")) return "#fff";
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  if (hex.length !== 6) return "#000";

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) return "#000";

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
};

/**
 * Darkens a hex color by a percentage (0-1).
 */
export const darkenColor = (hex, amount) => {
  if (!hex || typeof hex !== "string") return hex;
  if (hex.startsWith("#")) hex = hex.slice(1);
  if (hex.length === 3)
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  if (hex.length !== 6) return hex;

  const num = parseInt(hex, 16);
  let r = num >> 16;
  let g = (num >> 8) & 0x00ff;
  let b = num & 0x0000ff;

  r = Math.floor(r * (1 - amount));
  g = Math.floor(g * (1 - amount));
  b = Math.floor(b * (1 - amount));

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Mixes two hex colors by a weight (0-1).
 */
export const mixHex = (c1, c2, weight) => {
  const parse = (c) => {
    c = c.replace("#", "");
    if (c.length === 3)
      c = c
        .split("")
        .map((x) => x + x)
        .join("");
    return [
      parseInt(c.substr(0, 2), 16),
      parseInt(c.substr(2, 2), 16),
      parseInt(c.substr(4, 2), 16),
    ];
  };
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);

  const w = Math.min(1, Math.max(0, weight));
  const r = Math.round(r1 + (r2 - r1) * w);
  const g = Math.round(g1 + (g2 - g1) * w);
  const b = Math.round(b1 + (b2 - b1) * w);

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const ThemeService = {
  /**
   * Applies the signature theme to a target element.
   * Injects CSS variables for immediate styling.
   *
   * @param {HTMLElement} element - The DOM element to style (e.g., .card, .bubble)
   * @param {string} colorName - The key from PALETTE (e.g., "cyan")
   */
  apply(element, colorName) {
    if (!element) return;

    const safeKey = (colorName || "default").toLowerCase();
    const hex = PALETTE[safeKey] || PALETTE.default;
    const rgb = hexToRgb(hex);

    // 1. Set Identifiers (for debugging/selectors)
    element.dataset.signature = safeKey;
    element.classList.add("themed-signature");

    // Remove any existing signature classes to prevent conflict
    const classes = Array.from(element.classList);
    classes.forEach((c) => {
      if (c.startsWith("signature-") && c !== `signature-${safeKey}`) {
        element.classList.remove(c);
      }
    });
    element.classList.add(`signature-${safeKey}`);

    // 2. Inject CSS Variables
    element.style.setProperty("--signature-color", hex);
    element.style.setProperty("--signature-rgb", rgb);

    // Optional: Set --signature-contrast automatically?
    // For now, we assume white text on signature colors usually works,
    // or we rely on the SCSS to handle contrast variables if needed.
  },

  /**
   * Returns the Hex code for a color name.
   */
  getColor(colorName) {
    const safeKey = (colorName || "default").toLowerCase();
    return PALETTE[safeKey] || PALETTE.default;
  },
};
