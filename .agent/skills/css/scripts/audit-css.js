/**
 * 🎨 CSS Audit Rules (The Chalk Regime)
 */

export const cssRules = [
  {
    id: "CHALK_RAW_COLOR",
    severity: "HERESY",
    // Matches hex, rgb, hsl. Ignores if it's inside a var() or url().
    regex: /(?!.*var\()#([0-9A-Fa-f]{3}){1,2}\b(?!.*url\()|rgba?\(|hsla?\(/,
    message: "❌ Hardcoded color detected. Use Chalk Tokens: var(--color-chalk), etc.",
    // Additional check to ignore url() content
    validate: (line) => !line.includes("url(") && !line.includes("var("),
  },
  {
    id: "CHALK_PIXEL_BORDER",
    severity: "ADVICE",
    regex: /border:\s*[1-9]px/,
    message: "❌ Pixel border detected. Rule 03 mandates 'whisper-soft' shadows for depth.",
  },
];
