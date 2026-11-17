/**
 * src/utils/vectors.js
 * 🧮 VECTOR MATHEMATICS & EMBEDDING CODEC
 *
 * Single home for embedding vector math and the Q8 serialization codec:
 * - L2-normalized cosine similarity (safe for unnormalized vectors).
 * - JSON-safe serialization / deserialization with dimension + finiteness guards.
 * - 8-bit quantization (Q8) for compact IndexedDB persistence.
 *
 * Moved from src/utils/math.js (dot-product cosine, codec) + src/engine/sieve.js
 * (L2-normalized cosine) — Phase 1 Rank 0 unification. 100% pure and stateless
 * with zero external dependencies.
 */

/**
 * Computes cosine similarity between two vectors with L2 normalization.
 * Unlike a raw dot product, this stays in [-1, 1] for unnormalized inputs.
 * @param {number[] | Float32Array | null | undefined} vecA - First vector.
 * @param {number[] | Float32Array | null | undefined} vecB - Second vector.
 * @returns {number} Cosine similarity in [-1, 1], or 0 on mismatch/degenerate input.
 */
export function cosine_similarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dot / denominator;
}

/**
 * Serializes an embedding into a JSON-safe form (number[]).
 * Non-Float32Array views are reinterpreted by byte length (byteLength / 4 floats),
 * since `.length` counts source units rather than 32-bit lanes.
 * @param {ArrayBufferView | ArrayLike<number> | null | undefined} raw_embedding
 * @returns {number[] | null}
 */
export function serialize_embedding(raw_embedding) {
  if (!raw_embedding) return null;
  if (Array.isArray(raw_embedding)) return raw_embedding.length ? raw_embedding.slice() : null;
  if (raw_embedding instanceof Float32Array) return Array.from(raw_embedding);
  if (ArrayBuffer.isView(raw_embedding)) {
    const float_count = Math.floor(raw_embedding.byteLength / 4);
    if (float_count === 0) return null;
    return Array.from(new Float32Array(raw_embedding.buffer, raw_embedding.byteOffset, float_count));
  }
  return null;
}

/**
 * Deserializes a stored embedding into a Float32Array.
 * Accepts plain number arrays, Float32Array, and quantized base64/Uint8Array shapes.
 * Rejects wrong-dimension and non-finite payloads.
 * @param {string | number[] | Float32Array | Uint8Array | null | undefined} stored_embedding
 * @param {number} [dimensions=384]
 * @returns {Float32Array | null}
 */
export function deserialize_embedding(stored_embedding, dimensions = 384) {
  if (!stored_embedding) return null;
  if (stored_embedding instanceof Float32Array) {
    return stored_embedding.length === dimensions ? stored_embedding : null;
  }
  if (Array.isArray(stored_embedding)) {
    if (stored_embedding.length !== dimensions) return null;
    for (const element of stored_embedding) {
      if (typeof element !== "number" || !Number.isFinite(element)) return null;
    }
    return new Float32Array(stored_embedding);
  }
  if (typeof stored_embedding === "string" || stored_embedding instanceof Uint8Array) {
    return dequantize_vector_q8(stored_embedding, dimensions);
  }
  return null;
}

/**
 * Quantizes a 384-dimensional Float32Array embedding into an 8-bit unsigned integer array (Uint8Array)
 * serialized as a base64 string or Uint8Array.
 * Maps normalized range [-1.0, 1.0] to [0, 255].
 *
 * @param {Float32Array | ArrayLike<number> | null | undefined} raw_embedding
 * @param {boolean} [as_base64=true]
 * @param {number} [dimensions=384]
 * @returns {string | Uint8Array | null}
 */
export function quantize_vector_q8(raw_embedding, as_base64 = true, dimensions = 384) {
  if (!raw_embedding || raw_embedding.length !== dimensions) return null;
  const uint8_array = new Uint8Array(dimensions);
  for (let i = 0; i < dimensions; i++) {
    const val = Number(raw_embedding[i]);
    const clamped = Math.max(-1.0, Math.min(1.0, val));
    uint8_array[i] = Math.round(((clamped + 1.0) / 2.0) * 255);
  }

  if (!as_base64) return uint8_array;

  let binary_string = "";
  for (let i = 0; i < dimensions; i++) {
    binary_string += String.fromCharCode(uint8_array[i]);
  }
  return typeof btoa === "function" ? btoa(binary_string) : Buffer.from(uint8_array).toString("base64");
}

/**
 * Dequantizes an 8-bit quantized embedding (Uint8Array or base64 string) back into a normalized Float32Array.
 *
 * @param {string | Uint8Array | ArrayLike<number> | null | undefined} quantized_data
 * @param {number} [dimensions=384]
 * @returns {Float32Array | null}
 */
export function dequantize_vector_q8(quantized_data, dimensions = 384) {
  if (!quantized_data) return null;

  let uint8_array = null;
  if (typeof quantized_data === "string") {
    try {
      const binary_string = typeof atob === "function" ? atob(quantized_data) : Buffer.from(quantized_data, "base64").toString("binary");
      uint8_array = new Uint8Array(binary_string.length);
      for (let i = 0; i < binary_string.length; i++) {
        uint8_array[i] = binary_string.charCodeAt(i);
      }
    } catch {
      return null;
    }
  } else if (quantized_data instanceof Uint8Array) {
    uint8_array = quantized_data;
  } else if (Array.isArray(quantized_data)) {
    uint8_array = new Uint8Array(quantized_data);
  }

  if (!uint8_array || uint8_array.length !== dimensions) return null;

  const float32_array = new Float32Array(dimensions);
  for (let i = 0; i < dimensions; i++) {
    const uint_val = uint8_array[i];
    float32_array[i] = (uint_val / 255.0) * 2.0 - 1.0;
  }
  return float32_array;
}

/**
 * CHANGELOG:
 * - 2026-11-17: Phase 1 Rank 0 — created from math.js vector section (codec verbatim,
 *   serialize fixed for non-Float32Array views via byteLength / 4) + sieve.js L2 cosine.
 */
