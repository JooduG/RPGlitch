import { validateLine } from "./token-integrity.js";

/**
 * 🎨 CSS Audit Rules
 */

export const cssRules = [
  {
    id: "RAW_COLOR",
    severity: "HERESY",
    regex: /#([0-9A-Fa-f]{3}){1,2}\b|\brgba?\(|\bhsla?\(/,
    message: "❌ Hardcoded color detected. Use Tokens: var(--chalk), etc.",
    validate: (line) =>
      !line.includes("url(") &&
      !line.includes("var(") &&
      !line.includes("hex_to_rgb") &&
      !line.trim().startsWith("/*") &&
      !line.trim().startsWith("*"),
  },
  {
    id: "PIXEL_BORDER",
    severity: "ADVICE",
    regex: /border:\s*[1-9]px/,
    message: "❌ Pixel border detected. Use depth markers like shadows.",
  },
  {
    id: "RAW_UNIT",
    severity: "HERESY",
    // Matches any number followed by px, rem, em, or hex codes.
    // Ignores 0, 0%, 100%, 1px (if specifically allowed), and content inside var() or url().
    regex:
      /(?<!var\([^)]*)\b([1-9][0-9]*(\.[0-9]+)?|0\.[0-9]+)(px|rem|em)\b|#([0-9A-Fa-f]{3}){1,2}\b/,
    message:
      "❌ Hardcoded unit or hex color detected. Use Tokens: calc(var(--spacing-unit) * 4), var(--chalk), etc.",
    validate: (line) => {
      // Ignore comments
      if (line.trim().startsWith("/*") || line.trim().startsWith("*")) return false;

      const unitRegex =
        /\b([1-9][0-9]*(\.[0-9]+)?|0\.[0-9]+)(px|rem|em)\b|#([0-9A-Fa-f]{3}){1,2}\b/g;
      const matches = line.match(unitRegex);
      if (!matches) return false;

      const isHexToRgb = line.includes("hex_to_rgb");
      if (isHexToRgb) return false;

      // Check if ANY of the matches are outside of var() or url()
      // This is a bit complex for a simple validator, but we can check if the match exists outside of those wrappers
      for (const match of matches) {
        // Simple check: is this specific match preceded by "var(" or "url("?
        // We can use the index of the match
        const index = line.indexOf(match);
        const prefix = line.substring(0, index);

        const isInsideVar = prefix.includes("var(") && !prefix.split("var(").pop().includes(")");
        const isInsideUrl = prefix.includes("url(") && !prefix.split("url(").pop().includes(")");

        if (!isInsideVar && !isInsideUrl) return true;
      }

      return false;
    },
  },
  {
    id: "TOKEN_INTEGRITY",
    severity: "HERESY",
    regex: /var\(--/,
    message: "❌ Hallucinated token detected. Variable not defined in design.css.",
    validate: (line) => {
      const invalidToken = validateLine(line);
      return !!invalidToken;
    },
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
