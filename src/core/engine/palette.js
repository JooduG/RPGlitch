/**
 * src/core/engine/palette.js
 * 🎨 Visual Constants Registry
 * Colors, palettes, resolution, and visual asset constants.
 * Extracted from config.js to enforce SRP.
 */
/************************************************************************************
 * 🧩 [SECTION: COLOR PALETTE]
 * ----------------------------------------------------------------------------------
 * Named color palette for entity signature colors.
 ************************************************************************************/
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
  default: "#a855f7",
};
/**
 * 🔗 [MAPPING: CSS VARIABLES]
 * Maps hex codes from the palette back to their respective design tokens.
 * This ensures UI components strictly use var(--signature-*) instead of raw hex values.
 */
export const PALETTE_VARS = {
  "#ef4444": "var(--signature-red)",
  "#f97316": "var(--signature-orange)",
  "#fbbf24": "var(--signature-amber)",
  "#fde047": "var(--signature-yellow)",
  "#84cc16": "var(--signature-lime)",
  "#15803d": "var(--signature-forest)",
  "#10b981": "var(--signature-emerald)",
  "#14b8a6": "var(--signature-teal)",
  "#11aecc": "var(--signature-cyan)",
  "#3b82f6": "var(--signature-blue)",
  "#818cf8": "var(--signature-indigo)",
  "#c084fc": "var(--signature-violet)",
  "#a855f7": "var(--signature-purple)",
  "#ec4899": "var(--signature-pink)",
  "#fb7185": "var(--signature-rose)",
};
/************************************************************************************
 * 🧩 [SECTION: ROLE COLORS]
 * ----------------------------------------------------------------------------------
 * Default signature colors keyed by entity role.
 ************************************************************************************/
export const DEFAULT_COLORS = {
  USER: "var(--color-user)",
  AI: "var(--color-ai)",
  FRACTAL: "var(--color-fractal)",
  SYSTEM: "var(--color-system)",
};
/************************************************************************************
 * 🧩 [SECTION: RGB MAP]
 * ----------------------------------------------------------------------------------
 * Pre-computed RGB triplets for CSS custom property injection.
 ************************************************************************************/
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
  default: "168, 85, 247",
};
/************************************************************************************
 * 🧩 [SECTION: IMAGE & VISUAL CONSTANTS]
 * ----------------------------------------------------------------------------------
 * Resolution presets and placeholder assets.
 ************************************************************************************/
export const IMG_RESOLUTION = "512x768";
export const PROFILE_PICTURE_PLACEHOLDERS = {
  default:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTEyIDhhNCA0IDAgMSAwIDAtOCA0IDQgMCAwIDAgMCA4eiIvPjxwYXRoIGQ9Ik02IDIxdi0yYTYgNiAwIDAgMSAxMiAweiIvPjwvc3ZnPg==",
};
