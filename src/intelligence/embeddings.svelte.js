/**
 * src/intelligence/embeddings.svelte.js
 * 🔮 EMBEDDINGS ENGINE — Semantic vector matching via Transformers.js
 * Lazy-loads an ONNX sentence-transformer model in the browser via WASM/WebGPU.
 * Embeds text into 384-dim float arrays; cosine similarity for semantic retrieval.
 */

let _pipeline = null;
let _loading = null;
let _loadProgress = $state(0);
let _isLoading = $state(false);
let _modelReady = $state(false);

const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const EMBED_DIM = 384;

/** @type {Record<string, number>} */
const fileProgress = {};

/**
 * Loads the transformers.js pipeline with progress tracking.
 * Can be triggered on boot or lazily on first embedding request.
 * @returns {Promise<any>}
 */
export async function load_model() {
  if (_pipeline) {
    _modelReady = true;
    _loadProgress = 100;
    _isLoading = false;
    return _pipeline;
  }
  if (_loading) return _loading;

  _isLoading = true;
  _loading = (async () => {
    try {
      const transformers = await import("https://esm.sh/@huggingface/transformers@3.5.2");
      _pipeline = await transformers.pipeline("feature-extraction", MODEL_ID, {
        progress_callback: (/** @type {any} */ data) => {
          if (data && (data.status === "progress" || data.status === "download")) {
            if (data.file && typeof data.progress === "number") {
              fileProgress[data.file] = data.progress;
              const values = Object.values(fileProgress);
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              _loadProgress = Math.round(avg);
            }
          }
        },
      });
      _loadProgress = 100;
      _modelReady = true;
      return _pipeline;
    } catch (err) {
      console.error("[Embeddings] Failed to load model:", err);
      _modelReady = true;
      _loadProgress = 100;
      throw err;
    } finally {
      _isLoading = false;
      _loading = null;
    }
  })();

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
const MAX_CACHE = 500;

/**
 * Embeds a text string into a normalised Float32Array.
 * Cached by text content.
 * @param {string} text
 * @returns {Promise<Float32Array | null>}
 */
export async function embed(text) {
  if (!text || !text.trim()) return null;

  const cacheKey = text.trim();
  if (cacheKey.length > 2000) return null;

  if (_embedding_cache.has(cacheKey)) return _embedding_cache.get(cacheKey);

  try {
    const pipe = await get_pipeline();
    const output = await pipe(text, { pooling: "mean", normalize: true });
    const embedding = new Float32Array(output.data);

    if (_embedding_cache.size >= MAX_CACHE) {
      const firstKey = _embedding_cache.keys().next().value;
      _embedding_cache.delete(firstKey);
    }
    _embedding_cache.set(cacheKey, embedding);
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
 * If an embedding already exists, it is reused.
 * @param {any} vector
 * @returns {Promise<Float32Array | null>}
 */
export async function ensure_embedding(vector) {
  if (!vector || !vector.directive) return null;
  if (vector._embedding && vector._embedding.length === EMBED_DIM) return vector._embedding;

  const embedding = await embed(vector.directive);
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
  return _pipeline !== null || _modelReady;
}

export const embeddings_engine = {
  embed,
  cosine_similarity,
  ensure_embedding,
  ensure_embeddings,
  score_by_semantics,
  load_model,
  is_ready,
  get loadProgress() {
    return _loadProgress;
  },
  get isLoading() {
    return _isLoading;
  },
  get modelReady() {
    return _modelReady || _pipeline !== null;
  },
};
