/**
 * src/core/utils.js
 * ENGINE UTILITIES
 * Pure, stateless helper functions for the RPGlitch core.
 * ZERO dependencies on UI or Browser-specific globals (except crypto).
 */

/**
 * Generates a standard UUID v4.
 */
export const generateUUID = () => {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error(
      "crypto.randomUUID is not available in this environment. Ensure you are in a secure context (HTTPS).",
    );
  }
  return globalThis.crypto.randomUUID();
};

/**
 * Generates a secure random seed up to a specified limit.
 */
export const generateSecureSeed = (limit = 1000000) => {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error(
      "crypto.getRandomValues is not available in this environment. Ensure you are in a secure context (HTTPS).",
    );
  }
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  return array[0] % limit;
};

/**
 * Picks a random element from an array securely.
 * @param {any[]} array
 * @returns {any}
 */
export const pickRandom = (array) => {
  if (!Array.isArray(array) || array.length === 0) return null;
  const index = generateSecureSeed(array.length);
  return array[index];
};

/**
 * Standard debounce implementation.
 * @param {Function} fn
 * @param {number} [wait]
 * @returns {(...args: any[]) => void}
 */
export const debounce = (fn, wait = 250) => {
  /** @type {any} */
  let t;
  return (/** @type {any[]} */ ...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
};

/**
 * Clamps a number between min and max.
 * @param {number|string} n
 * @param {number} [min]
 * @param {number} [max]
 * @returns {number}
 */
export const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, Number(n) || 0));
