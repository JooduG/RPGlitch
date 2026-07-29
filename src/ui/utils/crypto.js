/**
 * src/ui/utils/crypto.js
 * 🔐 CRYPTO UTILITIES
 * Pure, stateless cryptographic helper functions.
 * ZERO dependencies on any architectural layer.
 */

/**
 * Generates a standard UUID v4.
 * @returns {string}
 */
export const generate_uuid = () => {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("crypto.randomUUID is not available in this environment. Ensure you are in a secure context (HTTPS).");
  }
  return globalThis.crypto.randomUUID();
};

/**
 * Generates a secure random seed up to a specified limit.
 * @param {number} [limit=1000000]
 * @returns {number}
 */
export const generate_secure_seed = (limit = 1000000) => {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("crypto.getRandomValues is not available in this environment. Ensure you are in a secure context (HTTPS).");
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
export const pick_random = (array) => {
  if (!Array.isArray(array) || array.length === 0) return null;
  const index = generate_secure_seed(array.length);
  return array[index];
};
