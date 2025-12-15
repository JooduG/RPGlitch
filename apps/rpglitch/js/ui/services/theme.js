import { PALETTE } from "../../core/constants.js";

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
