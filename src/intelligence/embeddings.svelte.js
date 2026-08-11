/**
 * src/intelligence/embeddings.svelte.js
 * 🔮 EMBEDDINGS ENGINE — Semantic vector matching via Transformers.js
 * Lazy-loads an ONNX sentence-transformer model in the browser via WASM/WebGPU.
 * Embeds text into 384-dim float arrays; cosine similarity for semantic retrieval.
 */

import { deserialize_embedding, onnx_mutex } from "@utils";

let _pipeline = null;
let _loading = null;
let _load_progress = $state(0);
let _is_loading = $state(false);
let _model_ready = $state(false);

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

/** @type {Record<string, number>} */
const file_progress = {};

/**
 * Loads the transformers.js pipeline with progress tracking.
 * Can be triggered on boot or lazily on first embedding request.
 * @returns {Promise<any>}
 */
export async function load_model() {
  if (_pipeline) {
    _model_ready = true;
    _load_progress = 100;
    _is_loading = false;
    return _pipeline;
  }
  if (_loading) return _loading;

  _is_loading = true;
  _loading = (async () => {
    try {
      const transformers = await import("https://esm.sh/@huggingface/transformers@3.5.2");
      // Run ONNX inference on a Web Worker so long embeds never block the main
      // thread. Fall back silently if the runtime doesn't support it.
      try {
        transformers.env.backends.onnx.wasm.proxy = true;
      } catch (err) {
        console.warn("[Embeddings] Worker-backed ONNX unavailable, using main thread:", err);
      }
      _pipeline = await transformers.pipeline("feature-extraction", MODEL_ID, {
        progress_callback: (/** @type {any} */ data) => {
          if (data && (data.status === "progress" || data.status === "download")) {
            if (data.file && typeof data.progress === "number") {
              file_progress[data.file] = data.progress;
              const values = Object.values(file_progress);
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              _load_progress = Math.round(avg);
            }
          }
        },
      });
      _load_progress = 100;
      _model_ready = true;
      return _pipeline;
    } catch (err) {
      console.error("[Embeddings] Failed to load model:", err);
      _model_ready = false;
      _load_progress = 0;
      _pipeline = null;
      throw err;
    } finally {
      _is_loading = false;
    }
  })();

  // Clear _loading only after the promise chain fully resolves/rejects so
  // concurrent callers share the same in-flight load and a new call right
  // after finally doesn't start a duplicate.
  _loading = _loading.finally(() => {
    _loading = null;
  });

  return _loading;
}

/**
 * Lazily loads the transformers.js pipeline.
 * @returns {Promise<any>}
 */
async function get_pipeline() {
  return load_model();
}

/** @type {Map<string, Float32Array>} */
const _embedding_cache = new Map();
export const EMBEDDING_CACHE_MAX = 1500;
/** @type {number} */
let _max_cache = EMBEDDING_CACHE_MAX;
let _cache_hits = 0;
let _cache_misses = 0;

/**
 * Embeds a text string into a normalised Float32Array.
 * Cached by text content with a bounded true-LRU policy: hits refresh the
 * key's recency; overflow evicts the least-recently-used entry.
 * @param {string} text
 * @returns {Promise<Float32Array | null>}
 */
export async function embed(text) {
  if (!text || !text.trim()) return null;

  const cache_key = text.trim();
  if (cache_key.length > 1e6) return null;

  const hit = _embedding_cache.get(cache_key);
  if (hit) {
    _cache_hits++;
    // Refresh LRU recency: re-insert so the Map treats this key as most-recently-used.
    _embedding_cache.delete(cache_key);
    _embedding_cache.set(cache_key, hit);
    return hit;
  }

  _cache_misses++;
  try {
    const pipe = await get_pipeline();
    // Yield one frame before inference so the UI can repaint even when the
    // embed runs synchronously on the main thread (worker-unavailable fallback).
    await new Promise((resolve) => setTimeout(resolve, 0));
    const output = await onnx_mutex.run(() => pipe(text, { pooling: "mean", normalize: true }));
    const embedding = new Float32Array(output.data);

    if (_embedding_cache.size >= _max_cache) {
      const lru_key = _embedding_cache.keys().next().value;
      _embedding_cache.delete(lru_key);
    }
    _embedding_cache.set(cache_key, embedding);
    return embedding;
  } catch (err) {
    console.warn("[Embeddings] Embed failed for text:", text.substring(0, 60), err);
    return null;
  }
}

/**
 * Computes cosine similarity between two embedding vectors.
 * Since embeddings are normalised (unit vectors), this is just a dot product.
 * @param {Float32Array} a
 * @param {Float32Array} b
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
 * Embeds a vector's directive and stores the embedding on the vector object.
 * Accepts a live Float32Array or the persisted plain-array form, upgrading
 * whichever is present. If the stored value is corrupt/missing it is dropped
 * so a fresh inference happens once.
 * @param {any} vector
 * @returns {Promise<Float32Array | null>}
 */
export async function ensure_embedding(vector) {
  if (!vector) return null;
  const text = vector.content || vector.text || "";
  if (!text) return null;

  const existing = deserialize_embedding(vector._embedding);
  if (existing) {
    vector._embedding = existing;
    return existing;
  }
  delete vector._embedding;

  const embedding = await embed(text);
  if (embedding) {
    vector._embedding = embedding;
  }
  return embedding;
}

/**
 * Pre-embeds an array of vectors in batch.
 * @param {any[]} vectors
 * @returns {Promise<void>}
 */
export async function ensure_embeddings(vectors) {
  if (!Array.isArray(vectors)) return;
  await Promise.all(vectors.map((v) => ensure_embedding(v)));
}

/**
 * Embeds the conversation context and scores all vectors by semantic similarity.
 * @param {any[]} vectors
 * @param {string} context_text
 * @returns {Promise<{ vector: any, similarity: number }[]>}
 */
export async function score_by_semantics(vectors, context_text) {
  if (!Array.isArray(vectors) || !vectors.length || !context_text?.trim()) return [];

  const context_embedding = await embed(context_text);
  if (!context_embedding) return [];

  const scored = [];
  for (const v of vectors) {
    const emb = await ensure_embedding(v);
    if (!emb) {
      scored.push({ vector: v, similarity: 0 });
      continue;
    }
    scored.push({ vector: v, similarity: cosine_similarity(context_embedding, emb) });
  }

  return scored;
}

/**
 * Checks whether the embeddings model is loaded and ready.
 * @returns {boolean}
 */
export function is_ready() {
  return _pipeline !== null || _model_ready;
}

export const embeddings_engine = {
  embed,
  cosine_similarity,
  ensure_embedding,
  ensure_embeddings,
  score_by_semantics,
  load_model,
  is_ready,
  get load_progress() {
    return _load_progress;
  },
  get is_loading() {
    return _is_loading;
  },
  get model_ready() {
    return _model_ready || _pipeline !== null;
  },
  /** Current LRU cache telemetry (size, hits, misses, cap). */
  cacheStats() {
    return { size: _embedding_cache.size, hits: _cache_hits, misses: _cache_misses, max: _max_cache };
  },
  /** @private TEST ONLY: clears the cache and overrides the cap. */
  _debug_reset_cache(cap = EMBEDDING_CACHE_MAX) {
    _embedding_cache.clear();
    _cache_hits = 0;
    _cache_misses = 0;
    _max_cache = cap;
  },
  /** @private TEST ONLY: injects a fake pipeline (fn(text, opts) → {data}). */
  _debug_set_pipeline(fn) {
    _pipeline = typeof fn === "function" ? fn : null;
    _model_ready = typeof fn === "function";
    _loading = null;
    _is_loading = false;
  },
};
