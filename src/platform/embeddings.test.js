import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  embeddings_engine,
  embed,
  ensure_embedding,
  EMBEDDING_CACHE_MAX,
  EMBEDDING_DIM,
  serialize_embedding,
  deserialize_embedding,
  quantize_vector_q8,
  dequantize_vector_q8,
} from "./embeddings.svelte.js";

describe("embedding serialization", () => {
  it("round-trips Float32Array to number[] and back", () => {
    const raw = new Float32Array(EMBEDDING_DIM);
    raw[0] = 0.42;
    const serialized = serialize_embedding(raw);
    expect(Array.isArray(serialized)).toBe(true);
    expect(serialized?.length).toBe(EMBEDDING_DIM);

    const deserialized = deserialize_embedding(serialized);
    expect(deserialized instanceof Float32Array).toBe(true);
    expect(deserialized?.[0]).toBeCloseTo(0.42);
  });

  it("quantizes Float32Array to Uint8Array and preserves cosine fidelity > 0.99", () => {
    const raw = new Float32Array(EMBEDDING_DIM);
    // Fill with normalized vector values
    let norm = 0;
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      raw[i] = Math.sin(i * 0.1);
      norm += raw[i] * raw[i];
    }
    norm = Math.sqrt(norm);
    for (let i = 0; i < EMBEDDING_DIM; i++) raw[i] /= norm;

    const quantized = quantize_vector_q8(raw);
    expect(quantized instanceof Uint8Array || typeof quantized === "string").toBe(true);

    const dequantized = dequantize_vector_q8(quantized);
    expect(dequantized instanceof Float32Array).toBe(true);
    expect(dequantized.length).toBe(EMBEDDING_DIM);

    // Compute cosine similarity between raw and dequantized
    let dot = 0;
    let norm_deq = 0;
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      dot += raw[i] * dequantized[i];
      norm_deq += dequantized[i] * dequantized[i];
    }
    const similarity = dot / (1.0 * Math.sqrt(norm_deq));
    expect(similarity).toBeGreaterThan(0.99);
  });
});

/**
 * Deterministic fake pipeline: maps text → a unit-ish Float32Array via hashing.
 * @param {string} text
 * @returns {{ data: Float32Array }}
 */
function fake_pipeline(text) {
  const arr = new Float32Array(EMBEDDING_DIM);
  let h = 7;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  arr[0] = 1 + (h % 1000) / 1000;
  return { data: arr };
}

describe("embeddings LRU cache", () => {
  beforeEach(() => {
    embeddings_engine._debug_reset_cache(4);
    embeddings_engine._debug_set_pipeline(async (text) => fake_pipeline(text));
  });

  afterEach(() => {
    embeddings_engine._debug_reset_cache();
    embeddings_engine._debug_set_pipeline(null);
  });

  it("serves repeated text from cache (same instance)", async () => {
    const a = await embed("the vault door");
    const b = await embed("the vault door");
    expect(a).toBe(b);
  });

  it("rejects null, empty and whitespace-only input", async () => {
    expect(await embed("")).toBeNull();
    expect(await embed("   ")).toBeNull();
    expect(await embed(null)).toBeNull();
    expect(await embed(undefined)).toBeNull();
  });

  it("evicts the least-recently-used entry at the cap", async () => {
    const a = await embed("A");
    const b = await embed("B");
    const a_refreshed = await embed("A"); // A becomes most-recently-used
    await embed("C");
    await embed("D");
    await embed("E"); // overflow → evicts B (least recently used)

    const stats = embeddings_engine.cache_stats();
    expect(stats.size).toBe(4);

    // A survived (refreshed) → cached instance returned
    expect(await embed("A")).toBe(a);
    expect(await embed("A")).toBe(a_refreshed);
    // B was evicted → re-inferred as a fresh instance
    expect(await embed("B")).not.toBe(b);
  });

  it("tracks hit/miss statistics", async () => {
    embeddings_engine._debug_reset_cache(100);
    await embed("alpha");
    await embed("alpha");
    await embed("beta");
    const stats = embeddings_engine.cache_stats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(2);
  });

  it("exposes the configured maximum cache size", () => {
    embeddings_engine._debug_reset_cache();
    expect(EMBEDDING_CACHE_MAX).toBe(1500);
    expect(embeddings_engine.cache_stats().max).toBe(1500);
  });

  it("upgrades a persisted plain-array embedding via ensure_embedding", async () => {
    const vector = { content: "lore", _embedding: Array.from({ length: EMBEDDING_DIM }, (_, i) => i % 10) };
    const emb = await ensure_embedding(vector);
    expect(emb).toBeInstanceOf(Float32Array);
    expect(emb.length).toBe(EMBEDDING_DIM);
    expect(vector._embedding).toBe(emb);
  });

  it("re-infers when the stored embedding is corrupt", async () => {
    const vector = { content: "lore", _embedding: { 0: "nope" } };
    const emb = await ensure_embedding(vector);
    expect(emb).toBeInstanceOf(Float32Array);
    expect(vector._embedding).toBe(emb);
  });

  it("returns null when a vector has no text", async () => {
    expect(await ensure_embedding({})).toBeNull();
    expect(await ensure_embedding(null)).toBeNull();
  });

  it("resets pipeline and attempts retry when inference throws error", async () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    let call_count = 0;
    embeddings_engine._debug_set_pipeline(async (text) => {
      call_count++;
      if (call_count === 1) {
        throw new Error("ONNX WASM worker error");
      }
      return fake_pipeline(text);
    });

    const result = await embed("retry text");
    expect(result).toBeInstanceOf(Float32Array);
    expect(call_count).toBe(2);
    expect(warn_spy).toHaveBeenCalled();
    warn_spy.mockRestore();
  });
});
