import { describe, expect, it } from "vitest";
import { EMBEDDING_SPECS } from "../config.js";
import { cosine_similarity, count_text_tokens, create_ephemeral_vector_cache, score_and_rank_memories, two_tier_sieve_rag } from "./sieve.js";

describe("src/engine/sieve.js - Two-Tier Sieve RAG & Vector Retrieval Engine", () => {
  it("computes cosine similarity accurately", () => {
    const vecA = new Float32Array(EMBEDDING_SPECS.QUANTIZE_MAX).fill(1);
    const vecB = new Float32Array(EMBEDDING_SPECS.QUANTIZE_MAX).fill(1);
    const vecC = new Float32Array(EMBEDDING_SPECS.QUANTIZE_MAX).fill(-1);

    expect(cosine_similarity(vecA, vecB)).toBeCloseTo(1.0, 5);
    expect(cosine_similarity(vecA, vecC)).toBeCloseTo(-1.0, 5);
  });

  it("stores and retrieves vectors through the ephemeral cache adapter", async () => {
    const cache = create_ephemeral_vector_cache();
    const vec = new Float32Array([0.1, 0.2, 0.3]);

    await cache.set("mem_1", vec);
    const retrieved = await cache.get("mem_1");
    expect(retrieved).toEqual(vec);

    await cache.clear();
    const cleared = await cache.get("mem_1");
    expect(cleared).toBeNull();
  });

  it("counts tokens via hybrid count_text_tokens", () => {
    const text = "1234567890"; // 10 chars
    const tokens = count_text_tokens(text);
    expect(tokens).toBe(3); // ceil(10 / 3.35) = 3
  });

  it("scores memories applying 1.5x origin-protection multiplier", () => {
    const query = new Float32Array([1, 0, 0]);
    const candidates = [
      { id: "1", text: "Origin canon", vector: [1, 0, 0], is_origin: true },
      { id: "2", text: "Regular memory", vector: [1, 0, 0], is_origin: false },
    ];

    const ranked = score_and_rank_memories(candidates, query);
    expect(ranked[0].item.id).toBe("1");
    expect(ranked[0].score).toBeCloseTo(ranked[1].score * 1.5, 4);
  });

  it("enforces Two-Tier Sieve RAG in pure characters: guaranteed floor + overflow pool", () => {
    const primary = [
      { id: "p1", text: "Short primary text", vector: [1, 0, 0] },
      { id: "p2", text: "Another primary memory", vector: [0.9, 0, 0] },
    ];
    const lore = [{ id: "l1", text: "World lore fact about Sector Four", vector: [0.95, 0, 0] }];

    const result = two_tier_sieve_rag({
      primary_memories: primary,
      lore_memories: lore,
      query_vector: [1, 0, 0],
      guaranteed_floor_characters: 50,
      total_budget_characters: 200,
    });

    expect(result.selected.some((m) => m.id === "p1")).toBe(true);
    expect(result.selected.some((m) => m.id === "l1")).toBe(true);
    expect(result.tier1_count).toBeGreaterThan(0);
    expect(result.tier2_count).toBeGreaterThan(0);
    expect(result.total_characters).toBeGreaterThan(0);
  });
});
