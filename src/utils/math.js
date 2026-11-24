/**
 * @file src/utils/math.js
 * Numeric clamping, L2-normalized vector cosine similarity, CSPRNG sampling,
 * and deterministic 32-bit FNV-1a hashing.
 */

/**
 * Clamps a numeric value between `min` and `max`. Non-numeric or NaN values normalize to 0.
 * @param {number | string | unknown} value
 * @param {number} [min=0]
 * @param {number} [max=100]
 * @returns {number}
 */
export function clamp(value, min = 0, max = 100) {
  const num = Number(value);
  const safe_num = Number.isNaN(num) ? 0 : num;
  return Math.min(max, Math.max(min, safe_num));
}

/**
 * Computes cosine similarity between two vectors with L2 normalization.
 * @param {number[] | Float32Array | null | undefined} vec_a
 * @param {number[] | Float32Array | null | undefined} vec_b
 * @returns {number} Cosine similarity in [-1, 1], or 0 on mismatch/degenerate input.
 */
export function cosine_similarity(vec_a, vec_b) {
  if (!vec_a || !vec_b || vec_a.length !== vec_b.length) return 0;

  let dot = 0;
  let norm_a = 0;
  let norm_b = 0;

  for (let i = 0; i < vec_a.length; i++) {
    dot += vec_a[i] * vec_b[i];
    norm_a += vec_a[i] * vec_a[i];
    norm_b += vec_b[i] * vec_b[i];
  }

  const denominator = Math.sqrt(norm_a) * Math.sqrt(norm_b);
  if (denominator === 0) return 0;

  return dot / denominator;
}

/**
 * Generates a cryptographically secure UUID v4 string.
 * @returns {string}
 */
export function generate_uuid() {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("crypto.randomUUID is not available in this environment. Ensure you are in a secure context (HTTPS).");
  }
  return globalThis.crypto.randomUUID();
}

/**
 * Generates a uniform cryptographically secure random integer in [0, limit)
 * using rejection sampling to eliminate modulo bias.
 * @param {number} [limit=1000000]
 * @returns {number}
 */
export function generate_secure_seed(limit = 1000000) {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("crypto.getRandomValues is not available in this environment. Ensure you are in a secure context (HTTPS).");
  }

  const lim = Math.max(1, Math.floor(Number(limit) || 1));
  const buffer = new Uint32Array(1);

  if (lim >= 0x100000000) {
    globalThis.crypto.getRandomValues(buffer);
    return buffer[0] % lim;
  }

  const max_valid = 0x100000000 - (0x100000000 % lim);
  let draw;
  do {
    globalThis.crypto.getRandomValues(buffer);
    draw = buffer[0];
  } while (draw >= max_valid);

  return draw % lim;
}

/**
 * Randomly selects an element from an array using CSPRNG sampling.
 * @template T
 * @param {readonly T[] | T[]} array
 * @returns {T | null}
 */
export function pick_random(array) {
  if (!Array.isArray(array) || array.length === 0) return null;
  return array[generate_secure_seed(array.length)];
}

/** @type {number} FNV-1a 32-bit offset basis */
const HASH_OFFSET_BASIS = 0x811c9dc5;

/** @type {number} FNV-1a 32-bit prime multiplier */
const HASH_PRIME = 0x01000193;

/**
 * Computes a deterministic 32-bit FNV-1a hash of a string.
 * @param {string | unknown} str
 * @returns {number}
 */
export function fnv1a_hash(str) {
  if (typeof str !== "string") return 0;

  let hash = HASH_OFFSET_BASIS;
  const len = str.length;
  for (let i = 0; i < len; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, HASH_PRIME) >>> 0;
  }
  return hash;
}

/**
 * Deterministically selects an element from a list based on a seed string and offset index.
 * @template T
 * @param {readonly T[] | T[]} list
 * @param {string} [seed=""]
 * @param {number} [offset=0]
 * @returns {T | string}
 */
export function stable_pick(list, seed = "", offset = 0) {
  if (!Array.isArray(list) || list.length === 0) return "";
  const hash = fnv1a_hash(`${seed}@${offset}`);
  return list[hash % list.length];
}
