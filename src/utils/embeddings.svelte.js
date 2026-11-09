/**
 * src/utils/embeddings.svelte.js
 * ============================================================================
 * 🧠 NEURAL SEMANTIC EMBEDDINGS ENGINE
 * ============================================================================
 *
 * @description Semantic vector matching via Transformers.js & ONNX vector codec.
 *
 * Core Responsibilities:
 * - Lazy-loads an ONNX sentence-transformer model in the browser via WASM/WebGPU.
 * - Embeds text into normalized 384-dimensional Float32Array vectors.
 * - Manages a bounded true-LRU cache for high-throughput cosine similarity scoring.
 * - Enforces single-threaded WASM and mutex serialization for Perchance iframe stability.
 * - Tracks reactive model loading progress via Svelte 5 runes ($state).
 *
 * Dependencies & Cross-Module Invariants:
 * - `@utils` (`onnx_mutex`, `mark_ort_ready`, `cosine_similarity`, `deserialize_embedding`): Shared ONNX runtime lock and vector math.
 * - `@config` (`EMBEDDING_SPECS`): Dimension is locked to `EMBEDDING_DIM = 384` (Xenova/all-MiniLM-L6-v2).
 * ============================================================================
 */

import { SvelteMap } from "svelte/reactivity";
import { onnx_mutex, mark_ort_ready } from "./onnx.js";
import { cosine_similarity, deserialize_embedding } from "./math.js";
import { EMBEDDING_SPECS } from "@config";

// ============================================================================
// Constants & Configurations
// ============================================================================

/** The canonical embedding dimension produced by the model and enforced on persisted vectors. */
export const EMBEDDING_DIM = EMBEDDING_SPECS.DIMENSIONS;

/** The default maximum capacity for the in-memory LRU embedding cache. */
export const EMBEDDING_CACHE_MAX = EMBEDDING_SPECS.CACHE_CAPACITY;

/** The Hugging Face model identifier for sentence transformation. */
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";

// ============================================================================
// Model Lifecycle & Mutex Pipeline
// ============================================================================

let _pipeline = null;
let _loading = null;
let _load_progress = $state(0);
let _is_loading = $state(false);
let _model_ready = $state(false);

/** @type {Record<string, number>} */
const file_progress = {};

let _debug_pipeline_fn = null;

/**
 * Loads the transformers.js pipeline with progress tracking.
 * Can be triggered on boot or lazily on first embedding request.
 * @returns {Promise<any>}
 */
export async function load_model() {
  if (_debug_pipeline_fn) {
    _pipeline = _debug_pipeline_fn;
    _model_ready = true;
    _is_loading = false;
    return _pipeline;
  }
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
      const transformers = await import("https://esm.sh/@huggingface/transformers@3.5.2?deps=onnxruntime-web@1.22.0");
      try {
        if (transformers.env?.backends?.onnx?.wasm) {
          transformers.env.backends.onnx.wasm.proxy = false;
          transformers.env.backends.onnx.wasm.numThreads = 1;
        }
      } catch (error) {
        console.warn("[Embeddings] ONNX environment setup warning:", error);
      }
      mark_ort_ready();

      _pipeline = await onnx_mutex.run(() =>
        transformers.pipeline("feature-extraction", MODEL_ID, {
          progress_callback: (/** @type {any} */ progress_data) => {
            if (progress_data && (progress_data.status === "progress" || progress_data.status === "download")) {
              if (progress_data.file && typeof progress_data.progress === "number") {
                file_progress[progress_data.file] = progress_data.progress;
                const values = Object.values(file_progress);
                const average_progress = values.reduce((acc, curr) => acc + curr, 0) / values.length;
                _load_progress = Math.round(average_progress);
              }
            }
          },
        }),
      );
      _load_progress = 100;
      _model_ready = true;
      return _pipeline;
    } catch (error) {
      console.error("[Embeddings] Failed to load model:", error);
      _model_ready = false;
      _load_progress = 0;
      _pipeline = null;
      throw error;
    } finally {
      _is_loading = false;
    }
  })();

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

// ============================================================================
// LRU Cache & Inference Engine
// ============================================================================

/** @type {SvelteMap<string, Float32Array>} */
const _embedding_cache = new SvelteMap();
/** @type {number} */
let _max_cache = EMBEDDING_CACHE_MAX;
let _cache_hits = 0;
let _cache_misses = 0;

/**
 * Validates the model's raw output tensor and converts it to a Float32Array.
 * Refuses vectors whose dimension differs from EMBEDDING_DIM so a swapped
 * model can never silently poison the persistence layer's dimension guard.
 * @param {{ data: ArrayLike<number> }} output
 * @returns {Float32Array | null}
 */
function to_embedding(output) {
  const embedding = new Float32Array(output?.data);
  if (embedding.length !== EMBEDDING_DIM) {
    console.warn(`[Embeddings] Model output dimension ${embedding.length} != expected ${EMBEDDING_DIM} — refusing embedding.`);
    return null;
  }
  return embedding;
}

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
    _embedding_cache.delete(cache_key);
    _embedding_cache.set(cache_key, hit);
    return hit;
  }

  _cache_misses++;
  try {
    const pipeline = await get_pipeline();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const output = await onnx_mutex.run(() => pipeline(text, { pooling: "mean", normalize: true }));
    const embedding = to_embedding(output);
    if (!embedding) return null;

    if (_embedding_cache.size >= _max_cache) {
      const lru_key = _embedding_cache.keys().next().value;
      _embedding_cache.delete(lru_key);
    }
    _embedding_cache.set(cache_key, embedding);
    return embedding;
  } catch (error) {
    console.warn("[Embeddings] Embed failed for text, clearing pipeline for retry:", text.substring(0, 60), error);
    _pipeline = _debug_pipeline_fn || null;
    _loading = null;
    _model_ready = Boolean(_debug_pipeline_fn);
    try {
      const pipeline = await get_pipeline();
      await new Promise((resolve) => setTimeout(resolve, 0));
      const output = await onnx_mutex.run(() => pipeline(text, { pooling: "mean", normalize: true }));
      const embedding = to_embedding(output);
      if (!embedding) return null;
      if (_embedding_cache.size >= _max_cache) {
        const lru_key = _embedding_cache.keys().next().value;
        _embedding_cache.delete(lru_key);
      }
      _embedding_cache.set(cache_key, embedding);
      return embedding;
    } catch (retry_error) {
      console.warn("[Embeddings] Embed retry failed:", retry_error);
      return null;
    }
  }
}

// ============================================================================
// Vector Hydration & Semantic Scoring
// ============================================================================

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

  const existing_embedding = deserialize_embedding(vector._embedding);
  if (existing_embedding) {
    vector._embedding = existing_embedding;
    return existing_embedding;
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
  await Promise.all(vectors.map((vector) => ensure_embedding(vector)));
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

  const scored_vectors = [];
  for (const vector of vectors) {
    const vector_embedding = await ensure_embedding(vector);
    if (!vector_embedding) {
      scored_vectors.push({ vector, similarity: 0 });
      continue;
    }
    scored_vectors.push({ vector, similarity: cosine_similarity(context_embedding, vector_embedding) });
  }

  return scored_vectors;
}

/**
 * Computes semantic drift between two texts as (1 - cosine_similarity).
 * Returns a value in [0.0, 1.0], where 0.0 means identical semantics and 1.0 means maximum drift or blank/missing text.
 *
 * @param {string|null|undefined} current_text
 * @param {string|null|undefined} previous_text
 * @returns {Promise<number>} Semantic drift in range [0.0, 1.0]
 */
export async function calculate_semantic_drift(current_text, previous_text) {
  const current_trimmed = String(current_text || "").trim();
  const previous_trimmed = String(previous_text || "").trim();

  if (!current_trimmed || !previous_trimmed) return 1.0;
  if (current_trimmed === previous_trimmed) return 0.0;

  const [current_embedding, previous_embedding] = await Promise.all([embed(current_trimmed), embed(previous_trimmed)]);

  if (!current_embedding || !previous_embedding) return 1.0;

  const similarity = cosine_similarity(current_embedding, previous_embedding);
  const drift = Math.max(0.0, Math.min(1.0, 1.0 - similarity));
  return drift;
}

/**
 * Checks whether the embeddings model is loaded and ready.
 * @returns {boolean}
 */
export function is_ready() {
  return _pipeline !== null || _model_ready;
}

// ============================================================================
// Singleton Engine Facade & Test Bridges
// ============================================================================

export const embeddings_engine = {
  embed,
  ensure_embedding,
  ensure_embeddings,
  score_by_semantics,
  calculate_semantic_drift,
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
  /** Current LRU cache telemetry (size, hits, misses, max). */
  cache_stats() {
    return { size: _embedding_cache.size, hits: _cache_hits, misses: _cache_misses, max: _max_cache };
  },
  /** @private TEST ONLY: clears the cache and overrides the capacity. */
  _debug_reset_cache(capacity = EMBEDDING_CACHE_MAX) {
    _embedding_cache.clear();
    _cache_hits = 0;
    _cache_misses = 0;
    _max_cache = capacity;
  },
  /** @private TEST ONLY: injects a fake pipeline (pipeline_function(text, options) → {data}). */
  _debug_set_pipeline(pipeline_function) {
    _debug_pipeline_fn = typeof pipeline_function === "function" ? pipeline_function : null;
    _pipeline = _debug_pipeline_fn;
    _model_ready = typeof pipeline_function === "function";
    _loading = null;
    _is_loading = false;
  },
};
