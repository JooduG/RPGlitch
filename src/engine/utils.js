/**
 * src/core/utils.js
 * ENGINE UTILITIES
 * Pure, stateless helper functions for the RPGlitch core.
 * ZERO dependencies on UI or Browser-specific globals (except crypto).
 *
 * Crypto helpers (generateUUID, generateSecureSeed, pickRandom) are re-exported
 * from @utils to maintain a single canonical source. Downstream layers should
 * prefer importing directly from @utils.
 */
import { generate_uuid, generate_secure_seed, pick_random } from "@utils";

export { generate_uuid, generate_secure_seed, pick_random };
export { generate_uuid as generateUUID, generate_secure_seed as generateSecureSeed, pick_random as pickRandom };

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

/**
 * Safely indents multi-line string content.
 */
export const ind = (text, spaces) => {
  if (!text) return "";
  const prefix = " ".repeat(spaces);
  return String(text).trim().split("\n").join(`\n${prefix}`);
};
