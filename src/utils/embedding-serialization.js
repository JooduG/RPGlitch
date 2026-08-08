/**
 * src/utils/embedding-serialization.js
 * 🧬 VECTOR UTILITIES — Embedding serialization for durable storage.
 * The repository layer round-trips records through JSON.stringify, which
 * flattens Float32Array into a bare {"0":…} object. These helpers convert
 * embeddings to a JSON-safe number[] on write and back to Float32Array on
 * read so cold loads can reuse persisted embeddings instead of re-inferring.
 */

export const EMBEDDING_DIM = 384;

/**
 * Serializes an embedding into a JSON-safe form (number[]).
 * @param {any} emb
 * @returns {number[] | null}
 */
export function serialize_embedding(emb) {
  if (!emb) return null;
  if (Array.isArray(emb)) return emb.length ? emb.slice() : null;
  if (emb instanceof Float32Array) return Array.from(emb);
  if (ArrayBuffer.isView(emb)) return Array.from(new Float32Array(emb.buffer, emb.byteOffset, emb.length));
  return null;
}

/**
 * Deserializes a stored embedding back into a Float32Array of EMBEDDING_DIM.
 * Accepts Float32Array or number[] (the JSON-safe persisted form). Returns
 * null for missing/corrupt values so callers re-infer.
 * @param {any} value
 * @returns {Float32Array | null}
 */
export function deserialize_embedding(value) {
  if (value instanceof Float32Array) return value.length === EMBEDDING_DIM ? value : null;
  if (Array.isArray(value)) {
    if (value.length !== EMBEDDING_DIM) return null;
    for (const n of value) {
      if (typeof n !== "number" || !Number.isFinite(n)) return null;
    }
    return Float32Array.from(value);
  }
  return null;
}
