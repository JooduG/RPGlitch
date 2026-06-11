/* ============================================================================
 *  src/media/tokens.js
 *  [**] TOKENS & LOGIC
 *  Centralized management for Design Tokens and Theme Logic.
 *  Following the "Red Thread": Foundation -> Logic -> UI Fallbacks.
 *  ============================================================================ */

// --- BEGIN AUTO-GENERATED TOKENS ---
export const TOKENS = {
  "background-gradient-1": "#0b101a",
  "background-gradient-2": "#14182b",
  "background-gradient-3": "#1e1b38",
  "background-gradient-4": "#16243b",
  chalk: "#171717",
  "coral-rose": "#fb7185",
  "crimson-red": "#ef4444",
  "deep-indigo": "#818cf8",
  "electric-cyan": "#11aecc",
  "emerald-green": "#10b981",
  "forest-green": "#15803d",
  frisk: "#f8fafc",
  frozen: "#475569",
  "glass-elevated": "rgb(from var(--frozen) r g b / var(--opacity-whisper))",
  "glass-peak": "rgb(from var(--pure-white) r g b / var(--opacity-muted))",
  "glass-sunken": "rgb(from var(--chalk) r g b / var(--opacity-muted))",
  gunmetal: "#334155",
  "hot-pink": "#ec4899",
  "lemon-yellow": "#fde047",
  "lime-green": "#84cc16",
  "neon-teal": "#14b8a6",
  "ocean-blue": "#3b82f6",
  "pumpkin-amber": "#fbbf24",
  "pure-white": "#fff",
  "royal-purple": "#a855f7",
  "signature-color": "var(--frozen)",
  "sunset-orange": "#f97316",
  "swatch-color": "var(--signature-color)",
  "twilight-violet": "#c084fc",
  "void-black": "#000",
  "font-family-base": '"Inter", sans-serif',
  "font-family-heading": '"Ubuntu", sans-serif',
  "font-family-mono": '"JetBrains Mono", monospace',
  "font-size-base": "clamp(0.9rem, 0.8vw + 0.8rem, 1.1rem)",
  "font-size-h1": "clamp(3rem, 5vw + 2rem, 6rem)",
  "font-size-h2": "clamp(2.8rem, 4.5vw + 2.2rem, 4.8rem)",
  "font-size-h3": "clamp(2rem, 3vw + 1.6rem, 3.2rem)",
  "font-size-h4": "clamp(1.6rem, 2vw + 1.4rem, 2.4rem)",
  "font-size-h5": "clamp(1.1rem, 1.2vw + 1rem, 1.5rem)",
  "font-size-h6": "clamp(1rem, 1vw + 0.9rem, 1.25rem)",
  "font-size-nano": "clamp(0.6rem, 0.3vw + 0.5rem, 0.7rem)",
  "font-size-small": "clamp(0.8rem, 0.6vw + 0.7rem, 0.95rem)",
  "radius-sharp": "0.25rem",
  "radius-standard": "1rem",
  "column-unit": "calc(var(--grid-width) / 12)",
  "gap-standard": "calc(var(--spacing-unit) * 4)",
  "gap-tight": "calc(var(--spacing-unit) * 2)",
  "grid-height": "clamp(20rem, 100vh, var(--grid-height-max))",
  "grid-height-max": "clamp(25rem, calc(var(--golden-ratio) * 100vw), 100vh)",
  "grid-width": "clamp(20rem, 100vw, var(--grid-width-max))",
  "grid-width-max": "clamp(50rem, calc(var(--golden-ratio) * 100vh), 100vw)",
  "padding-standard": "calc(var(--spacing-unit) * 4)",
  "padding-tight": "calc(var(--spacing-unit) * 2)",
  "row-unit": "calc(var(--grid-height) / 12)",
  "spacing-pixel": "1px",
  "spacing-unit": "0.25rem",
  "avatar-medium-size": "calc(var(--column-unit) * 2)",
  "blur-mist": "blur(calc(var(--spacing-unit) * 4))",
  "border-width-base": "var(--spacing-pixel)",
  "border-width-thick": "var(--spacing-unit)",
  "breakpoint-desktop": "80rem",
  "breakpoint-high-density": "120rem",
  "breakpoint-mini": "30rem",
  "breakpoint-mobile": "48rem",
  "breakpoint-tablet": "64rem",
  "brightness-dim": "0.9",
  "brightness-glow": "1.1",
  "brightness-muted": "0.3",
  "dropdown-max-height": "calc(var(--spacing-unit) * 80)",
  "duration-ambient": "2000ms",
  "duration-fast": "150ms",
  "duration-slow": "500ms",
  "duration-standard": "300ms",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
  "empty-fill": "rgb(23 23 23 / 0.6)",
  "golden-ratio": "1.618",
  "icon-medium": "calc(var(--spacing-unit) * 8)",
  "icon-small": "calc(var(--spacing-unit) * 4)",
  "kinetic-drag-threshold": "10",
  "kinetic-momentum-friction": "0.95",
  "kinetic-scroll-multiplier": "1.5",
  "kinetic-shimmy-offset": "var(--spacing-pixel)",
  "kinetic-shimmy-y": "calc(var(--spacing-pixel) / 2)",
  "kinetic-slide-y": "calc(var(--spacing-pixel) * 10)",
  "kinetic-stab-distance": "var(--spacing-unit)",
  "modal-width-thin": "calc(var(--column-unit) * 3)",
  "motion-dissolve": "opacity var(--duration-standard) var(--ease-standard)",
  "motion-elastic": "var(--duration-slow) var(--ease-elastic)",
  "noise-url":
    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
  "opacity-ghost": "0.1",
  "opacity-muted": "0.6",
  "opacity-none": "0",
  "opacity-solid": "1",
  "opacity-whisper": "0.3",
  "scale-lift": "1.02",
  "scale-pulse": "1.05",
  "scale-sink": "0.96",
  "scan-animation": "scan var(--duration-ambient) linear infinite",
  "scrollbar-thumb": "var(--gunmetal)",
  "scrollbar-thumb-hover": "var(--frisk)",
  "scrollbar-track": "transparent",
  "scrollbar-width": "calc(var(--spacing-unit) * 2)",
  "shadow-ghost":
    "0 var(--spacing-pixel) var(--spacing-pixel)\nrgb(from var(--void-black) r g b / var(--opacity-ghost))",
  "shadow-standard":
    "0 var(--spacing-unit) calc(var(--spacing-unit) * 4)\nrgb(from var(--void-black) r g b / var(--opacity-whisper))",
  "signature-glow": "0 0 calc(var(--spacing-unit) * 4) var(--signature-color)",
  "spring-damping-default": "0.8",
  "spring-stiffness-default": "0.15",
  "state-dev-accent": "var(--electric-cyan)",
  "state-fill-end": "100%",
  "state-fill-start": "0%",
  "state-weight-intensity": "0",
  "storyboard-character-card-height": "calc(var(--row-unit) * 5)",
  "storyboard-character-card-width": "calc(var(--column-unit) * 2)",
  "storyboard-fractal-card-height": "calc(var(--row-unit) * 4)",
  "storyboard-fractal-card-width": "calc(var(--column-unit) * 4)",
  "title-shadow-ambient": "0 0 calc(var(--spacing-unit) * 5) var(--void-black)",
  "z-index-max": "999",
};

export const PALETTE = {
  "Background Gradient 1": "#0b101a",
  "Background Gradient 2": "#14182b",
  "Background Gradient 3": "#1e1b38",
  "Background Gradient 4": "#16243b",
  Chalk: "#171717",
  "Coral Rose": "#fb7185",
  "Crimson Red": "#ef4444",
  "Deep Indigo": "#818cf8",
  "Electric Cyan": "#11aecc",
  "Emerald Green": "#10b981",
  "Forest Green": "#15803d",
  Frisk: "#f8fafc",
  Frozen: "#475569",
  Gunmetal: "#334155",
  "Hot Pink": "#ec4899",
  "Lemon Yellow": "#fde047",
  "Lime Green": "#84cc16",
  "Neon Teal": "#14b8a6",
  "Ocean Blue": "#3b82f6",
  "Pumpkin Amber": "#fbbf24",
  "Pure White": "#fff",
  "Royal Purple": "#a855f7",
  "Sunset Orange": "#f97316",
  "Twilight Violet": "#c084fc",
  "Void Black": "#000",
};

export const PALETTE_VARS = {
  "#0b101a": "var(--background-gradient-1)",
  "#14182b": "var(--background-gradient-2)",
  "#1e1b38": "var(--background-gradient-3)",
  "#16243b": "var(--background-gradient-4)",
  "#171717": "var(--chalk)",
  "#fb7185": "var(--coral-rose)",
  "#ef4444": "var(--crimson-red)",
  "#818cf8": "var(--deep-indigo)",
  "#11aecc": "var(--electric-cyan)",
  "#10b981": "var(--emerald-green)",
  "#15803d": "var(--forest-green)",
  "#f8fafc": "var(--frisk)",
  "#475569": "var(--frozen)",
  "#334155": "var(--gunmetal)",
  "#ec4899": "var(--hot-pink)",
  "#fde047": "var(--lemon-yellow)",
  "#84cc16": "var(--lime-green)",
  "#14b8a6": "var(--neon-teal)",
  "#3b82f6": "var(--ocean-blue)",
  "#fbbf24": "var(--pumpkin-amber)",
  "#fff": "var(--pure-white)",
  "#a855f7": "var(--royal-purple)",
  "#f97316": "var(--sunset-orange)",
  "#c084fc": "var(--twilight-violet)",
  "#000": "var(--void-black)",
};
// --- END AUTO-GENERATED TOKENS ---

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

/************************************************************************************
 * [LEVEL 1: LOGIC & PARSERS]
 * ----------------------------------------------------------------------------------
 * utilities for color transformation and entity resolution.
 ************************************************************************************/

// Internal hash helper for deterministic resolution
/**
 * @param {string} str
 * @returns {number}
 */
function _hash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

/**
 * @param {string} [color]
 * @returns {string | null}
 */
export function resolve_token(color) {
  if (!color) return null;
  if (color.startsWith("var(")) return color;
  return /** @type {any} */ (PALETTE_VARS)[color] || null;
}

/**
 * Gets a deterministic color from a seed if no explicit color is set.
 * @param {string} [seed]
 */
export function get_deterministic_color(seed) {
  const final_seed = seed || "default";
  const hash = _hash(final_seed);
  const keys = SIGNATURE_COLORS;
  const key = keys[Math.abs(hash) % keys.length];
  const hex = /** @type {string} */ (/** @type {any} */ (PALETTE)[key]);
  return resolve_token(hex) || hex;
}

/**
 * @param {string} [hex]
 * @returns {string}
 */
export function get_color_name(hex) {
  if (!hex) return "";
  // 1. Direct search in PALETTE by value
  const match = Object.entries(PALETTE).find(
    ([_, value]) => value.toLowerCase() === hex.toLowerCase(),
  );
  if (match) return match[0];

  // 2. Resolve token first if it's a var()
  if (hex.startsWith("var(")) {
    const hex_val = Object.entries(PALETTE_VARS).find(([, v]) => v === hex)?.[0];
    if (hex_val) return get_color_name(hex_val);
  }

  return "";
}

/**
 * Returns the direct human-readable label for an entity's signature color.
 * Eliminates the Name -> Hex -> Name round-trip.
 * @param {any} entity
 * @returns {string}
 */
export function get_signature_label(entity) {
  if (!entity) return "Frozen";
  const color = entity.signature_color;

  // 1. If it's already a valid label (UI default), use it
  if (color && /** @type {any} */ (PALETTE)[color]) return color;

  // 2. If it's a hex or token, try to resolve it
  if (color) {
    const name = get_color_name(color);
    if (name) return name;
  }

  // 3. Fallback to deterministic label (Seed -> Name)
  const seed = [entity?.name || "", ...(entity?.tags || [])].filter(Boolean).join(",");
  const hash = _hash(seed || entity?.id || "default");
  const keys = SIGNATURE_COLORS;
  return keys[Math.abs(hash) % keys.length];
}

/**
 * Resolves the actual color value (Hex or Token) for an entity or raw color string.
 * @param {any} entity - The entity object or a raw color string/hex.
 * @param {string} [fallback='var(--frozen)'] - Neutral fallback for non-entity contexts.
 * @returns {string}
 */
export function get_signature_color(entity, fallback = "var(--frozen)") {
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
    const token = resolve_token(color);
    if (token) return token;

    if (/** @type {any} */ (PALETTE)[color]) {
      const hex = /** @type {any} */ (PALETTE)[color];
      return resolve_token(hex) || hex;
    }
    return color; // Fallback to raw hex or the string itself
  }

  // 3. Strict guard for non-entities (must have identity if no explicit color)
  if (typeof entity === "object" && !entity.id && !entity.name) {
    return fallback;
  }

  // 4. Fallback to deterministic color for valid entities
  const seed = [entity.name || "", ...(entity.tags || [])].filter(Boolean).join(",");
  return get_deterministic_color(seed || entity.id || "default");
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
export function get_contrast_color(hex) {
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
export function darken_color(hex, amount = 20) {
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
