import { describe, expect, it } from "vitest";
import { resolve_vector_pool } from "@intelligence/vector-pool.js";

describe("resolve_vector_pool()", () => {
  const past = [{ id: "p1", timestamp: 1, content: "past mem", type: "past", emotional_weight: 5, meta: {} }];
  const future = [{ id: "f1", timestamp: 2, content: "future mem", type: "future", emotional_weight: 5, meta: {} }];

  it("combines past and future into one pool", () => {
    const pool = resolve_vector_pool({ past, future });
    expect(pool).toHaveLength(2);
    expect(pool.map((v) => v.type)).toEqual(["past", "future"]);
    expect(pool.map((v) => v.content)).toEqual(["past mem", "future mem"]);
  });

  it("returns past only when future is empty", () => {
    const pool = resolve_vector_pool({ past, future: [] });
    expect(pool).toHaveLength(1);
    expect(pool[0].type).toBe("past");
  });

  it("returns empty array for null, undefined, or memory-less objects", () => {
    expect(resolve_vector_pool(null)).toEqual([]);
    expect(resolve_vector_pool(undefined)).toEqual([]);
    expect(resolve_vector_pool({})).toEqual([]);
    expect(resolve_vector_pool({ past: [], future: [] })).toEqual([]);
  });

  it("normalizes content from directive fallback and infers past type", () => {
    const pool = resolve_vector_pool({ past: [{ id: "p1", directive: "a directive" }] });
    expect(pool[0].content).toBe("a directive");
    expect(pool[0].type).toBe("past");
  });
});
