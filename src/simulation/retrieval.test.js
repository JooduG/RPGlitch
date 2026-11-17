import { describe, expect, it } from "vitest";
import { create_vector_cache, rank_memories, select_context_memories } from "./retrieval.js";

describe("rank_memories", () => {
  it("boosts origin entries", () => {
    const ranked = rank_memories(
      [
        { id: "a", text: "plain", is_origin: false, weight: 5 },
        { id: "b", text: "origin", is_origin: true, weight: 5 },
      ],
      null,
    );
    expect(ranked[0].item.id).toBe("b");
  });
});

describe("select_context_memories", () => {
  it("selects from primary pool", () => {
    const { selected } = select_context_memories({ primary_memories: [{ id: "p", text: "x" }], lore_memories: [], query_vector: null });
    expect(selected.length).toBeGreaterThan(0);
  });
});

describe("create_vector_cache", () => {
  it("evicts oldest only when adding new keys at capacity", async () => {
    const cache = create_vector_cache(1);
    await cache.set("a", [1]);
    await cache.set("a", [2]);
    expect(await cache.get("a")).toEqual([2]);
    await cache.set("b", [3]);
    expect(await cache.get("a")).toBeNull();
  });
});
