import { EMBEDDING_SPECS } from "@config";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { embeddings_engine } from "./embeddings.svelte.js";

describe("embeddings.svelte.js", () => {
  beforeEach(() => {
    embeddings_engine._debug_reset_cache(2);
    embeddings_engine._debug_set_pipeline(null);
  });

  afterEach(() => {
    embeddings_engine._debug_set_pipeline(null);
  });

  it("embeds valid text, caches hits in LRU order, and evicts oldest entry at capacity", async () => {
    const mock_vec = new Float32Array(EMBEDDING_SPECS.DIMENSIONS).fill(0.25);
    const pipeline = vi.fn().mockResolvedValue({ data: mock_vec });
    embeddings_engine._debug_set_pipeline(pipeline);

    expect(embeddings_engine.is_ready()).toBe(true);
    expect(await embeddings_engine.load_model()).toBe(pipeline);

    const a = await embeddings_engine.embed("first");
    expect(a).toHaveLength(EMBEDDING_SPECS.DIMENSIONS);
    expect(await embeddings_engine.embed("first")).toBe(a);
    await embeddings_engine.embed("second");
    await embeddings_engine.embed("third");

    const stats = embeddings_engine.cache_stats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(3);
    expect(stats.size).toBe(2);
  });

  it("rejects blank inputs and wrong-dimension model outputs", async () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    embeddings_engine._debug_set_pipeline(vi.fn().mockResolvedValue({ data: new Float32Array(10) }));
    expect(await embeddings_engine.embed("   ")).toBeNull();
    expect(await embeddings_engine.embed("bad dimension")).toBeNull();
    warn_spy.mockRestore();
  });

  it("retries once when pipeline inference throws", async () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const good_vec = new Float32Array(EMBEDDING_SPECS.DIMENSIONS).fill(0.1);
    const pipeline = vi.fn().mockRejectedValueOnce(new Error("transient")).mockResolvedValueOnce({ data: good_vec });
    embeddings_engine._debug_set_pipeline(pipeline);

    const result = await embeddings_engine.embed("retry me");
    expect(result).toHaveLength(EMBEDDING_SPECS.DIMENSIONS);
    expect(pipeline).toHaveBeenCalledTimes(2);
    warn_spy.mockRestore();
  });
});
