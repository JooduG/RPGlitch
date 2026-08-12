import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { embeddings_engine, embed, ensure_embedding, EMBEDDING_CACHE_MAX } from "./embeddings.svelte.js";

const EMBED_DIM = 384;

/**
 * Deterministic fake pipeline: maps text → a unit-ish Float32Array via hashing.
 * @param {string} text
 * @returns {{ data: Float32Array }}
 */
function fake_pipeline(text) {
  const arr = new Float32Array(EMBED_DIM);
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

    const stats = embeddings_engine.cacheStats();
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
    const stats = embeddings_engine.cacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(2);
  });

  it("exposes the configured maximum cache size", () => {
    embeddings_engine._debug_reset_cache();
    expect(EMBEDDING_CACHE_MAX).toBe(1500);
    expect(embeddings_engine.cacheStats().max).toBe(1500);
  });

  it("upgrades a persisted plain-array embedding via ensure_embedding", async () => {
    const vector = { content: "lore", _embedding: Array.from({ length: EMBED_DIM }, (_, i) => i % 10) };
    const emb = await ensure_embedding(vector);
    expect(emb).toBeInstanceOf(Float32Array);
    expect(emb.length).toBe(EMBED_DIM);
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
  });
});
