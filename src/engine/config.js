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

export { IMAGE_TRIGGER } from "@intelligence/dynamics.js";

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
