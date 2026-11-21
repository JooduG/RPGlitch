/**
 * @file src/utils/embeddings.svelte.js
 * Reactive MiniLM (`Xenova/all-MiniLM-L6-v2`) embedding pipeline with
 * single-concurrency ONNX mutex serialization and bounded true-LRU cache.
 */

import { EMBEDDING_SPECS } from "@config";
import { SvelteMap } from "svelte/reactivity";
import { create_job_queue } from "./async.js";

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const onnx_mutex = create_job_queue({ max_concurrency: 1 });

let _pipeline = null;
let _loading = null;
let _load_progress = $state(0);
let _is_loading = $state(false);
let _model_ready = $state(false);
/** @type {Record<string, number>} */
const file_progress = {};
let _debug_pipeline_fn = null;

/** @type {SvelteMap<string, Float32Array>} */
const _embedding_cache = new SvelteMap();
let _max_cache = EMBEDDING_SPECS.CACHE_CAPACITY;
let _cache_hits = 0;
let _cache_misses = 0;

/**
 * Loads the transformers.js feature-extraction pipeline once with reactive progress.
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
 * Validates raw tensor output length against `EMBEDDING_SPECS.DIMENSIONS`.
 * @param {{ data: ArrayLike<number> }} output
 * @returns {Float32Array | null}
 */
function to_embedding(output) {
  const embedding = new Float32Array(output?.data);
  if (embedding.length !== EMBEDDING_SPECS.DIMENSIONS) {
    console.warn(`[Embeddings] Model output dimension ${embedding.length} != expected ${EMBEDDING_SPECS.DIMENSIONS} - refusing embedding.`);
    return null;
  }
  return embedding;
}

/**
 * Executes a single serialized inference pass and stores the result in the LRU cache.
 * @param {string} text
 * @param {string} cache_key
 * @returns {Promise<Float32Array | null>}
 */
async function run_embedding_pass(text, cache_key) {
  const pipeline = await load_model();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const output = await onnx_mutex.run(() => pipeline(text, { pooling: "mean", normalize: true }));
  const embedding = to_embedding(output);
  if (!embedding) return null;

  if (_embedding_cache.size >= _max_cache) {
    const lru_key = _embedding_cache.keys().next().value;
    if (lru_key !== undefined) _embedding_cache.delete(lru_key);
  }
  _embedding_cache.set(cache_key, embedding);
  return embedding;
}

/**
 * Embeds a text string into a normalized 384-d `Float32Array`, retrying once on pipeline failure.
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
    return await run_embedding_pass(text, cache_key);
  } catch (error) {
    console.warn("[Embeddings] Embed failed for text, clearing pipeline for retry:", text.substring(0, 60), error);
    _pipeline = _debug_pipeline_fn || null;
    _loading = null;
    _model_ready = Boolean(_debug_pipeline_fn);
    try {
      return await run_embedding_pass(text, cache_key);
    } catch (retry_error) {
      console.warn("[Embeddings] Embed retry failed:", retry_error);
      return null;
    }
  }
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
  cache_stats() {
    return { size: _embedding_cache.size, hits: _cache_hits, misses: _cache_misses, max: _max_cache };
  },
  /** @private TEST ONLY */
  _debug_reset_cache(capacity = EMBEDDING_SPECS.CACHE_CAPACITY) {
    _embedding_cache.clear();
    _cache_hits = 0;
    _cache_misses = 0;
    _max_cache = capacity;
  },
  /** @private TEST ONLY */
  _debug_set_pipeline(pipeline_function) {
    _debug_pipeline_fn = typeof pipeline_function === "function" ? pipeline_function : null;
    _pipeline = _debug_pipeline_fn;
    _model_ready = typeof pipeline_function === "function";
    _loading = null;
    _is_loading = false;
  },
};
