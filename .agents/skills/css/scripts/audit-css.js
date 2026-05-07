/**
 * 🎨 CSS Audit Rules
 */

export const cssRules = [
  {
    id: "RAW_COLOR",
    severity: "HERESY",
    // Matches hex, rgb, hsl. Ignores if it's inside a var() or url().
    regex: /#([0-9A-Fa-f]{3}){1,2}\b|\brgba?\(|\bhsla?\(/,
    message: "❌ Hardcoded color detected. Use Tokens: var(--color-chalk), etc.",
    // Additional check to ignore url() content and var()
    validate: (line) =>
      !line.includes("url(") && !line.includes("var(") && !line.includes("hex_to_rgb"),
  },
  {
    id: "PIXEL_BORDER",
    severity: "ADVICE",
    regex: /border:\s*[1-9]px/,
    message: "❌ Pixel border detected. Use depth markers like shadows.",
  },
];

export const themeRules = [
  ...cssRules,
  {
    id: "THEME_HOVER_TRANSFORM",
    severity: "HERESY",
    regex: /:hover\s*{[^}]*translateY|:hover\s*\{[^}]*transform:\s*translate/,
    message:
      "❌ Rule 04 violation: GROUNDED POLICY. Avoid translateY on hover to maintain subterranean weight.",
  },
  {
    id: "THEME_RADIUS",
    severity: "ADVICE",
    regex: /border-radius:\s*[0-9]+px/,
    message: "❌ Hardcoded border-radius. Use Tokens: var(--border-radius-m), etc.",
  },
];
