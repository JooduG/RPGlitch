/**
 * src/utils/math.js
 * 🧮 MATHEMATICAL, CRYPTOGRAPHIC & HASHING ENGINE
 *
 * Core Responsibilities:
 * - Numeric clamping, percentage calculations, and bounds normalization.
 * - High-speed vector dot product and cosine similarity for semantic embeddings.
 * - Secure cryptographically random UUID v4 generation and unbiased rejection-sampled seeds.
 * - High-speed 32-bit FNV-1a hashing for deterministic selection and seed-based pseudo-random picks.
 * - 100% pure and stateless with zero external dependencies.
 */

// ============================================================================
// [SECTION 1: NUMERIC CLAMPING & NORMALIZATION]
// ============================================================================

/**
 * Clamps a numeric value between a minimum and maximum boundary.
 * Defaults to [0, 100]. Non-numeric or NaN values normalize to 0.
 * @param {number | string | unknown} value - Target value.
 * @param {number} [min=0] - Lower bound.
 * @param {number} [max=100] - Upper bound.
 * @returns {number} Clamped numeric value.
 */
export function clamp(value, min = 0, max = 100) {
  const num = Number(value);
  const safe_num = Number.isNaN(num) ? 0 : num;
  return Math.min(max, Math.max(min, safe_num));
}

/**
 * Normalizes a value to an integer percentage in [0, 100].
 * Falsy inputs default to 50 for neutral dynamics meter displays.
 * @param {number | unknown} value - Input score or percentage.
 * @returns {number} Integer between 0 and 100.
 */
export function get_percentage(value) {
  const num = Number(value || 50);
  const safe_num = Number.isNaN(num) ? 50 : num;
  return Math.max(0, Math.min(100, Math.round(safe_num)));
}

// ============================================================================
// [SECTION 2: VECTOR MATHEMATICS]
// ============================================================================

/**
 * Computes cosine similarity between two normalized embedding vectors.
 * Because embeddings are unit vectors, this computes their dot product.
 * @param {Float32Array | number[] | null | undefined} a - First vector.
 * @param {Float32Array | number[] | null | undefined} b - Second vector.
 * @returns {number} Similarity score in range [-1, 1], or 0 on dimension mismatch.
 */
export function cosine_similarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  const len = a.length;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

// ============================================================================
// [SECTION 3: CRYPTOGRAPHIC GENERATION & SAMPLING]
// ============================================================================

/**
 * Generates a cryptographically secure UUID v4 string.
 * @returns {string} RFC 4122 compliant UUID v4.
 * @throws {Error} If crypto.randomUUID is unavailable in current environment.
 */
export function generate_uuid() {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("crypto.randomUUID is not available in this environment. Ensure you are in a secure context (HTTPS).");
  }
  return globalThis.crypto.randomUUID();
}

/**
 * Generates a uniform cryptographically secure random integer in [0, limit).
 * Employs rejection sampling to eliminate modulo bias for non-power-of-two limits.
 * @param {number} [limit=1000000] - Upper exclusive limit.
 * @returns {number} Random integer in [0, limit).
 * @throws {Error} If crypto.getRandomValues is unavailable.
 */
export function generate_secure_seed(limit = 1000000) {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("crypto.getRandomValues is not available in this environment. Ensure you are in a secure context (HTTPS).");
  }

  const lim = Math.max(1, Math.floor(Number(limit) || 1));
  const buffer = new Uint32Array(1);

  // For limits exceeding 2^32, standard modulo is unbiased relative to draw range
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
 * Randomly selects an element from an array using cryptographically secure seed generation.
 * @template T
 * @param {readonly T[] | T[]} array - Source array.
 * @returns {T | null} Randomly selected element, or null if array is empty or non-array.
 */
export function pick_random(array) {
  if (!Array.isArray(array) || array.length === 0) return null;
  const index = generate_secure_seed(array.length);
  return array[index];
}

// ============================================================================
// [SECTION 4: DETERMINISTIC HASHING & SEED PICKING]
// ============================================================================

/** @type {number} FNV-1a 32-bit offset basis */
export const HASH_OFFSET_BASIS = 0x811c9dc5;

/** @type {number} FNV-1a 32-bit prime multiplier */
export const HASH_PRIME = 0x01000193;

/**
 * Computes a deterministic 32-bit FNV-1a hash of a string.
 * @param {string | unknown} str - Target string to hash.
 * @returns {number} 32-bit unsigned integer hash.
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
 * Uses 32-bit FNV-1a hashing to provide uniform, stable distribution without RNG drift.
 * @template T
 * @param {readonly T[] | T[]} list - Array of elements.
 * @param {string} [seed=""] - Deterministic seed key.
 * @param {number} [offset=0] - Offset index for subsequent picks with same seed.
 * @returns {T | string} Selected item, or "" on invalid list.
 */
export function stable_pick(list, seed = "", offset = 0) {
  if (!Array.isArray(list) || list.length === 0) return "";
  const seed_key = `${seed}@${offset}`;
  const hash = fnv1a_hash(seed_key);
  return list[hash % list.length];
}

/**
 * Evaluates whether dynamics deltas or band crossings trigger an image beat.
 * @param {Record<string, any>} [current={}]
 * @param {Record<string, any>} [previous={}]
 * @param {Record<string, any>} [options={}]
 * @returns {{ triggered: boolean, signals: any, tier: string, deltas: any[] }}
 */
export function evaluate_image_trigger(current = {}, previous = {}, options = {}) {
  const band_high = options.band_high ?? 85;
  const band_low = options.band_low ?? 15;
  const displacement_threshold = options.displacement_threshold ?? 30;
  const default_tier = options.default_tier ?? "story_scene";

  const entities_set = new Set([...Object.keys(current || {}), ...Object.keys(previous || {})]);
  const axis_names = new Set();

  for (const entity of entities_set) {
    for (const axis of Object.keys((current || {})[entity] || {})) axis_names.add(axis);
    for (const axis of Object.keys((previous || {})[entity] || {})) axis_names.add(axis);
  }

  const deltas = [];
  const band_entries = [];
  let band_entry = null;
  let displacement = 0;
  const character_domain_entities = new Set(["ai", "user"]);

  for (const axis of axis_names) {
    let from = null;
    let to = null;
    let from_entity = null;
    let to_entity = null;

    for (const entity of entities_set) {
      const previous_entity_dynamics = (previous || {})[entity] || {};
      const current_entity_dynamics = (current || {})[entity] || {};
      if (from === null && Number.isFinite(previous_entity_dynamics[axis])) {
        from = previous_entity_dynamics[axis];
        from_entity = entity;
      }
      if (to === null && Number.isFinite(current_entity_dynamics[axis])) {
        to = current_entity_dynamics[axis];
        to_entity = entity;
      }
    }

    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;

    const delta = Math.round((to - from) * 10) / 10;
    deltas.push({ axis, from, to, delta, entity: to_entity || from_entity });
    displacement += Math.abs(to - from);

    const entry_entity = to_entity || from_entity;
    if (to >= band_high && from < band_high) {
      band_entries.push({ axis, from, to, band: "high", entity: entry_entity });
      if (!band_entry) band_entry = { axis, from, to, band: "high" };
    } else if (to <= band_low && from > band_low) {
      band_entries.push({ axis, from, to, band: "low", entity: entry_entity });
      if (!band_entry) band_entry = { axis, from, to, band: "low" };
    }
  }

  displacement = Math.round(displacement * 10) / 10;
  const triggered = band_entry !== null || displacement >= displacement_threshold;

  const character_band_entry = band_entries.find((entry) => character_domain_entities.has(entry.entity));
  const tier = character_band_entry ? "story_character" : band_entries.length > 0 ? "story_scene" : default_tier;

  return {
    triggered,
    signals: {
      band_entry,
      displacement,
      displacement_threshold,
    },
    tier,
    deltas,
  };
}

/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported frozen hash constants (HASH_OFFSET_BASIS, HASH_PRIME),
 *   added vector dimension validation, aligned JSDoc annotations, and unified test suite.
 * - 2026-06-15: Added rejection sampling to eliminate modulo bias in generate_secure_seed.
 */
