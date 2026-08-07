/**
 * @file src/engine/config.js
 * ⚔️ The Single Source of Truth for Global Architecture.
 */

export const APP_VERSION = "0.3.0";
export const SESSION_ID_KEY = "active_session_id";

export const CONFIG = {
  ENTITIES: {
    AI: "ai_character",
    USER: "user_persona",
    FRACTAL: "fractal",
  },
  ROLES: {
    USER: "user",
    AI: "ai",
    FRACTAL: "fractal",
    SYSTEM: "system",
  },
  VIEWS: {
    STORYBOARD: "storyboard",
    STORYMODE: "storymode",
  },
};

export const { ROLES, ENTITIES, VIEWS } = CONFIG;

/**
 * 🖼️ IMAGE TRIGGER ENGINE CONFIG
 * Dual-source automatic image generation (pure-JS dynamics gate + LLM director),
 * sharing a single cooldown state. See src/intelligence/dynamics.js and kernel.js step 4.6.
 */
export const IMAGE_TRIGGER = {
  // Source A — Pure-JS Dynamics Gate thresholds (Signal B band entry)
  band_high: 85,
  band_low: 15,
  // Source A — Signal A: sum of |Δaxis| across all six axes
  displacement_threshold: 60,
  // Shared cooldown: rounds to wait after any auto-trigger before the next one.
  // Director-explicit triggers bypass the check but reset this timer.
  cooldown_rounds: 3,
  // Default tier for dynamics-gate triggers.
  default_tier: "story_scene",
  // The unified 4-Tier Image Taxonomy.
  tiers: ["story_entities", "story_character", "solo_entity", "story_scene"],
};

/**
 * Clamps a number between min and max.
 * @param {number|string} n
 * @param {number} [min]
 * @param {number} [max]
 * @returns {number}
 */
export const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, Number(n) || 0));

/**
 * Standard log function.
 * Only emits to console if 'dev_mode' is enabled in the app store.
 * @param {...any} args
 */
export const log = (...args) => {
  const is_dev = /** @type {any} */ (globalThis).app?.settings?.dev_mode;
  if (is_dev) {
    console.info("[Engine]", ...args);
  }
};
