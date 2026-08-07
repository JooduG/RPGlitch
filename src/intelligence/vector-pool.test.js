import { describe, expect, it } from "vitest";
import { resolve_vector_pool } from "@intelligence/vector-pool.js";

describe("resolve_vector_pool()", () => {
  const past = [{ id: "p1", timestamp: 1, content: "past mem", type: "past", emotional_weight: 5, meta: {} }];
  const future = [{ id: "f1", timestamp: 2, content: "future mem", type: "future", emotional_weight: 5, meta: {} }];

  it("prefers the legacy vectors array when present", () => {
    const pool = resolve_vector_pool({ vectors: [...past, ...future], past: [], future: [] });
    expect(pool).toHaveLength(2);
    expect(pool[0].type).toBe("past");
    expect(pool[1].type).toBe("future");
  });

  it("falls back to past + future when vectors is absent", () => {
    const pool = resolve_vector_pool({ past, future });
    expect(pool).toHaveLength(2);
    expect(pool.map((v) => v.type)).toEqual(["past", "future"]);
  });

  it("combines past and future for new-layer entities", () => {
    const pool = resolve_vector_pool({ past, future, vectors: [] });
    expect(pool.map((v) => v.content)).toEqual(["past mem", "future mem"]);
  });

  it("returns empty array for null, undefined, or memory-less objects", () => {
    expect(resolve_vector_pool(null)).toEqual([]);
    expect(resolve_vector_pool(undefined)).toEqual([]);
    expect(resolve_vector_pool({})).toEqual([]);
    expect(resolve_vector_pool({ vectors: [], past: [], future: [] })).toEqual([]);
  });

  it("normalizes content from directive/text fallbacks and infers past type", () => {
    const pool = resolve_vector_pool({ past: [{ id: "p1", directive: "a directive" }] });
    expect(pool[0].content).toBe("a directive");
    expect(pool[0].type).toBe("past");
  });
});
