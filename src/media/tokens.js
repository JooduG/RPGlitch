/* ============================================================================
 *  src/media/tokens.js
 *  [**] TOKENS & LOGIC
 *  Centralized management for Design Tokens and Theme Logic.
 *  Following the "Red Thread": Foundation -> Logic -> UI Fallbacks.
 *  ============================================================================ */

// --- BEGIN AUTO-GENERATED TOKENS ---
export const TOKENS = {
  "color-adrenaline-pink": "#ec4899",
  "color-background-gradient-1": "#0b101a",
  "color-background-gradient-2": "#14182b",
  "color-background-gradient-3": "#1e1b38",
  "color-background-gradient-4": "#16243b",
  "color-chalk": "#171717",
  "color-crimson-red": "#ef4444",
  "color-deep-indigo": "#818cf8",
  "color-electric-cyan": "#11aecc",
  "color-emerald-green": "#10b981",
  "color-forest-green": "#15803d",
  "color-frisk": "#f8fafc",
  "color-frozen": "#475569",
  "color-glass-elevated": "#4755694d",
  "color-glass-peak": "#fff9",
  "color-glass-sunken": "#17171799",
  "color-gunmetal": "#334155",
  "color-lemon-yellow": "#fde047",
  "color-proud-purple": "#a855f7",
  "color-pumpkin-amber": "#fbbf24",
  "color-pure-white": "#fff",
  "color-rusty-orange": "#f97316",
  "color-scientific-teal": "#14b8a6",
  "color-signature-color": "#475569",
  "color-soft-rose": "#fb7185",
  "color-space-blue": "#3b82f6",
  "color-swatch-color": "#475569",
  "color-toxic-green": "#84cc16",
  "color-twilight-violet": "#c084fc",
  "color-void-black": "#000",
  "font-base": '"Inter", sans-serif',
  "font-heading": '"Ubuntu", sans-serif',
  "font-mono": '"JetBrains Mono", monospace',
  "text-base": "clamp(0.9rem, 0.8vw + 0.8rem, 1.1rem)",
  "text-h1": "clamp(3rem, 5vw + 2rem, 6rem)",
  "text-h2": "clamp(2.8rem, 4.5vw + 2.2rem, 4.8rem)",
  "text-h3": "clamp(2rem, 3vw + 1.6rem, 3.2rem)",
  "text-h4": "clamp(1.6rem, 2vw + 1.4rem, 2.4rem)",
  "text-h5": "clamp(1.1rem, 1.2vw + 1rem, 1.5rem)",
  "text-h6": "clamp(1rem, 1vw + 0.9rem, 1.25rem)",
  "text-nano": "clamp(0.6rem, 0.3vw + 0.5rem, 0.7rem)",
  "text-small": "clamp(0.8rem, 0.6vw + 0.7rem, 0.95rem)",
  "radius-sharp": "0.25rem",
  "radius-standard": "1rem",
  "spacing-column-unit": "calc(var(--spacing-grid-width) / 12)",
  "spacing-gap-standard": "calc(var(--spacing-spacing-unit) * 4)",
  "spacing-gap-tight": "calc(var(--spacing-spacing-unit) * 2)",
  "spacing-grid-height": "clamp(20rem, 100dvh, var(--spacing-grid-height-max))",
  "spacing-grid-height-max": "clamp(25rem, calc(var(--spacing-golden-ratio) * 100vw), 100dvh)",
  "spacing-grid-width": "clamp(20rem, 100vw, var(--spacing-grid-width-max))",
  "spacing-grid-width-max": "clamp(50rem, calc(var(--spacing-golden-ratio) * 100dvh), 100vw)",
  "spacing-padding-standard": "calc(var(--spacing-spacing-unit) * 4)",
  "spacing-padding-tight": "calc(var(--spacing-spacing-unit) * 2)",
  "spacing-row-unit": "calc(var(--spacing-grid-height) / 12)",
  "spacing-spacing-pixel": "1px",
  "spacing-spacing-unit": "0.25rem",
  "blur-mist": "blur(calc(var(--spacing-spacing-unit) * 4))",
  "breakpoint-desktop": "80rem",
  "breakpoint-high-density": "120rem",
  "breakpoint-mini": "30rem",
  "breakpoint-mobile": "48rem",
  "breakpoint-tablet": "64rem",
  "brightness-dim": "0.9",
  "brightness-glow": "1.1",
  "brightness-muted": "0.3",
  "duration-ambient": "2000ms",
  "duration-fast": "150ms",
  "duration-slow": "500ms",
  "duration-standard": "300ms",
  "ease-elastic": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
  "ease-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
  "empty-fill": "rgb(23 23 23 / 0.6)",
  "kinetic-drag-threshold": "10",
  "kinetic-momentum-friction": "0.95",
  "kinetic-scroll-multiplier": "1.5",
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
  "scrollbar-thumb": "var(--color-gunmetal)",
  "scrollbar-thumb-hover": "var(--color-frisk)",
  "scrollbar-track": "transparent",
  "shadow-ghost": "0 var(--spacing-spacing-pixel) var(--spacing-spacing-pixel)\nrgb(from var(--color-void-black) r g b / var(--opacity-ghost))",
  "shadow-standard":
    "0 var(--spacing-spacing-unit) calc(var(--spacing-spacing-unit) * 4)\nrgb(from var(--color-void-black) r g b / var(--opacity-whisper))",
  "signature-color": "var(--color-signature-color)",
  "signature-glow": "0 0 calc(var(--spacing-spacing-unit) * 4) var(--color-signature-color)",
  "spacing-avatar-medium-size": "calc(var(--spacing-column-unit) * 2)",
  "spacing-border-width-base": "var(--spacing-spacing-pixel)",
  "spacing-border-width-thick": "var(--spacing-spacing-unit)",
  "spacing-dropdown-max-height": "calc(var(--spacing-spacing-unit) * 80)",
  "spacing-golden-ratio": "1.618",
  "spacing-icon-medium": "calc(var(--spacing-spacing-unit) * 8)",
  "spacing-icon-small": "calc(var(--spacing-spacing-unit) * 4)",
  "spacing-kinetic-shimmy-offset": "var(--spacing-spacing-pixel)",
  "spacing-kinetic-shimmy-y": "calc(var(--spacing-spacing-pixel) / 2)",
  "spacing-kinetic-slide-y": "calc(var(--spacing-spacing-pixel) * 10)",
  "spacing-kinetic-stab-distance": "var(--spacing-spacing-unit)",
  "spacing-modal-width-thin": "calc(var(--spacing-column-unit) * 3)",
  "spacing-scrollbar-width": "calc(var(--spacing-spacing-unit) * 2)",
  "spacing-storyboard-character-card-height": "clamp(20rem, calc(var(--spacing-row-unit) * 5), 28rem)",
  "spacing-storyboard-character-card-width": "clamp(14rem, calc(var(--spacing-column-unit) * 2), 18rem)",
  "spacing-storyboard-fractal-card-height": "clamp(12rem, calc(var(--spacing-row-unit) * 4), 18rem)",
  "spacing-storyboard-fractal-card-width": "clamp(16rem, calc(var(--spacing-column-unit) * 4), 24rem)",
  "spring-damping-default": "0.8",
  "spring-stiffness-default": "0.15",
  "state-dev-accent": "var(--color-electric-cyan)",
  "state-fill-end": "100%",
  "state-fill-start": "0%",
  "state-weight-intensity": "0",
  "swatch-color": "var(--color-swatch-color)",
  "title-shadow-ambient": "0 0 calc(var(--spacing-spacing-unit) * 5) var(--color-void-black)",
  "z-index-max": "999",
};

export const PALETTE = {
  "Adrenaline Pink": "#ec4899",
  "Background Gradient 1": "#0b101a",
  "Background Gradient 2": "#14182b",
  "Background Gradient 3": "#1e1b38",
  "Background Gradient 4": "#16243b",
  Chalk: "#171717",
  "Crimson Red": "#ef4444",
  "Deep Indigo": "#818cf8",
  "Electric Cyan": "#11aecc",
  "Emerald Green": "#10b981",
  "Forest Green": "#15803d",
  Frisk: "#f8fafc",
  Frozen: "#475569",
  "Glass Elevated": "#4755694d",
  "Glass Peak": "#fff9",
  "Glass Sunken": "#17171799",
  Gunmetal: "#334155",
  "Lemon Yellow": "#fde047",
  "Proud Purple": "#a855f7",
  "Pumpkin Amber": "#fbbf24",
  "Pure White": "#fff",
  "Rusty Orange": "#f97316",
  "Scientific Teal": "#14b8a6",
  "Signature Color": "#475569",
  "Soft Rose": "#fb7185",
  "Space Blue": "#3b82f6",
  "Swatch Color": "#475569",
  "Toxic Green": "#84cc16",
  "Twilight Violet": "#c084fc",
  "Void Black": "#000",
};

export const PALETTE_VARS = {
  "#ec4899": "var(--color-adrenaline-pink)",
  "#0b101a": "var(--color-background-gradient-1)",
  "#14182b": "var(--color-background-gradient-2)",
  "#1e1b38": "var(--color-background-gradient-3)",
  "#16243b": "var(--color-background-gradient-4)",
  "#171717": "var(--color-chalk)",
  "#ef4444": "var(--color-crimson-red)",
  "#818cf8": "var(--color-deep-indigo)",
  "#11aecc": "var(--color-electric-cyan)",
  "#10b981": "var(--color-emerald-green)",
  "#15803d": "var(--color-forest-green)",
  "#f8fafc": "var(--color-frisk)",
  "#475569": "var(--color-swatch-color)",
  "#4755694d": "var(--color-glass-elevated)",
  "#fff9": "var(--color-glass-peak)",
  "#17171799": "var(--color-glass-sunken)",
  "#334155": "var(--color-gunmetal)",
  "#fde047": "var(--color-lemon-yellow)",
  "#a855f7": "var(--color-proud-purple)",
  "#fbbf24": "var(--color-pumpkin-amber)",
  "#fff": "var(--color-pure-white)",
  "#f97316": "var(--color-rusty-orange)",
  "#14b8a6": "var(--color-scientific-teal)",
  "#fb7185": "var(--color-soft-rose)",
  "#3b82f6": "var(--color-space-blue)",
  "#84cc16": "var(--color-toxic-green)",
  "#c084fc": "var(--color-twilight-violet)",
  "#000": "var(--color-void-black)",
};
// --- END AUTO-GENERATED TOKENS ---

/**
 * Filtered registry of vibrant colors suitable for entity signatures.
 * Excludes backgrounds, neutrals, and non-vibrant utility colors.
 */
export const SIGNATURE_COLORS = Object.keys(PALETTE).filter(
  (key) =>
    !key.startsWith("Background") &&
    ![
      "Chalk",
      "Frisk",
      "Frozen",
      "Gunmetal",
      "Pure White",
      "Void Black",
      "Glass Peak",
      "Glass Elevated",
      "Signature Color",
      "Swatch Color",
      "Glass Sunken",
    ].includes(key),
);

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
  const match = Object.entries(PALETTE).find(([_, value]) => value.toLowerCase() === hex.toLowerCase());
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
export function get_signature_color(entity, fallback = "var(--color-frozen)") {
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
