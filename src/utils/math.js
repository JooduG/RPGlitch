/**
 * src/utils/math.js
 * 🧮 MATH & CRYPTO UTILITIES
 * Pure, stateless mathematical, cryptographic, and random helper functions.
 * ZERO dependencies on any architectural layer.
 */

/**
 * Clamps a number between min and max.
 * @param {number|string} n
 * @param {number} [min=0]
 * @param {number} [max=100]
 * @returns {number}
 */
export const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, Number(n) || 0));

/**
 * Rounds a value to a percentage clamped to 0-100, defaulting to 50 for
 * falsy input (dynamics meter display).
 * @param {number} val
 * @returns {number}
 */
export const get_pct = (val) => Math.max(0, Math.min(100, Math.round(val || 50)));

/**
 * Computes cosine similarity between two embedding vectors.
 * Since embeddings are normalised (unit vectors), this is just a dot product.
 * @param {Float32Array|number[]} a
 * @param {Float32Array|number[]} b
 * @returns {number} -1 to 1
 */
export function cosine_similarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

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
 * Generates a uniform secure random seed in [0, limit).
 * Uses rejection sampling so every result is exactly equally likely — the
 * naive `draw % limit` is biased toward low buckets for non-power-of-two
 * limits. For limit > 2^32 the draw range is already smaller than the
 * modulus, so plain modulo is unbiased there.
 * @param {number} [limit=1000000]
 * @returns {number}
 */
export const generate_secure_seed = (limit = 1000000) => {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("crypto.getRandomValues is not available in this environment. Ensure you are in a secure context (HTTPS).");
  }
  const lim = Math.max(1, Math.floor(Number(limit) || 1));
  const array = new Uint32Array(1);
  if (lim > 0x100000000) {
    globalThis.crypto.getRandomValues(array);
    return array[0] % lim;
  }
  const max_valid = 0x100000000 - (0x100000000 % lim);
  let value;
  do {
    globalThis.crypto.getRandomValues(array);
    value = array[0];
  } while (value >= max_valid);
  return value % lim;
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

const HASH_OFFSET_BASIS = 0x811c9dc5;
const HASH_PRIME = 0x01000193;

/**
 * Computes a deterministic 32-bit FNV-1a hash of a string.
 * @param {string} str
 * @returns {number} 32-bit unsigned integer
 */
export const fnv1a_hash = (str) => {
  if (typeof str !== "string") return 0;
  let hash_val = HASH_OFFSET_BASIS;
  for (let i = 0; i < str.length; i++) {
    hash_val ^= str.charCodeAt(i);
    hash_val = Math.imul(hash_val, HASH_PRIME) >>> 0;
  }
  return hash_val;
};

/**
 * Deterministically picks an element from an array based on a seed string and offset.
 * Uses FNV-1a hashing for high-speed, stable distribution.
 * @param {any[]} list
 * @param {string} seed
 * @param {number} [offset=0]
 * @returns {any}
 */
export const stable_pick = (list, seed = "", offset = 0) => {
  if (!Array.isArray(list) || list.length === 0) return "";
  const seed_str = seed + "@" + offset;
  const hash = fnv1a_hash(seed_str);
  return list[hash % list.length];
};
