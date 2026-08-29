import { describe, it, expect } from "vitest";
import {
  clamp,
  get_pct,
  cosine_similarity,
  generate_uuid,
  generate_secure_seed,
  pick_random,
  fnv1a_hash,
  stable_pick,
  HASH_OFFSET_BASIS,
  HASH_PRIME,
} from "./math.js";

describe("math and crypto utilities", () => {
  describe("clamp", () => {
    it("should clamp values between min and max", () => {
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(0, 0, 100)).toBe(0);
      expect(clamp(100, 0, 100)).toBe(100);
    });

    it("should use default min=0 and max=100", () => {
      expect(clamp(-5)).toBe(0);
      expect(clamp(105)).toBe(100);
      expect(clamp(42)).toBe(42);
    });

    it("should safely handle non-numeric inputs", () => {
      expect(clamp("50", 0, 100)).toBe(50);
      expect(clamp(NaN, 0, 100)).toBe(0);
      expect(clamp(null, 0, 100)).toBe(0);
    });
  });

  describe("get_pct", () => {
    it("normalizes numbers to integers within [0, 100]", () => {
      expect(get_pct(75.4)).toBe(75);
      expect(get_pct(75.6)).toBe(76);
      expect(get_pct(150)).toBe(100);
      expect(get_pct(-20)).toBe(0);
    });

    it("defaults to 50 for falsy or NaN values", () => {
      expect(get_pct(null)).toBe(50);
      expect(get_pct(undefined)).toBe(50);
      expect(get_pct(NaN)).toBe(50);
      expect(get_pct(0)).toBe(50);
    });
  });

  describe("cosine_similarity", () => {
    it("computes exact dot product for normalized unit vectors", () => {
      const a = [1, 0, 0];
      const b = [1, 0, 0];
      expect(cosine_similarity(a, b)).toBe(1);

      const orthogonal = [0, 1, 0];
      expect(cosine_similarity(a, orthogonal)).toBe(0);

      const opposite = [-1, 0, 0];
      expect(cosine_similarity(a, opposite)).toBe(-1);
    });

    it("handles Float32Array inputs", () => {
      const a = new Float32Array([0.6, 0.8]);
      const b = new Float32Array([0.6, 0.8]);
      expect(cosine_similarity(a, b)).toBeCloseTo(1, 4);
    });

    it("returns 0 on null, undefined, empty, or mismatched vectors", () => {
      expect(cosine_similarity(null, [1, 2])).toBe(0);
      expect(cosine_similarity([1, 2], null)).toBe(0);
      expect(cosine_similarity([], [])).toBe(0);
      expect(cosine_similarity([1, 2], [1, 2, 3])).toBe(0);
    });
  });

  describe("generate_uuid", () => {
    it("should generate a valid UUID v4", () => {
      const uuid = generate_uuid();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe("generate_secure_seed", () => {
    it("should generate a number within the limit", () => {
      const limit = 10;
      for (let i = 0; i < 100; i++) {
        const seed = generate_secure_seed(limit);
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(seed).toBeLessThan(limit);
      }
    });

    it("should reject out-of-range draws (rejection sampling, no modulo bias)", () => {
      const limit = 10;
      const max_valid = 0x100000000 - (0x100000000 % limit); // 4294967290
      const draws = [max_valid, 3]; // first draw is exactly the reject threshold -> redrawn
      let i = 0;
      const real = globalThis.crypto.getRandomValues;
      globalThis.crypto.getRandomValues = (/** @type {Uint32Array} */ arr) => {
        arr[0] = draws[i++ % draws.length];
        return arr;
      };
      try {
        expect(generate_secure_seed(limit)).toBe(3 % limit);
      } finally {
        globalThis.crypto.getRandomValues = real;
      }
    });

    it("handles large limits >= 2^32", () => {
      const big_limit = 0x200000000;
      const seed = generate_secure_seed(big_limit);
      expect(seed).toBeGreaterThanOrEqual(0);
    });
  });

  describe("pick_random", () => {
    it("should pick an element from the array", () => {
      const arr = ["a", "b", "c"];
      const picked = pick_random(arr);
      expect(arr).toContain(picked);
    });

    it("should return null for empty array", () => {
      expect(pick_random([])).toBeNull();
    });

    it("should return null for non-array", () => {
      // @ts-ignore
      expect(pick_random(null)).toBeNull();
      // @ts-ignore
      expect(pick_random(undefined)).toBeNull();
    });
  });

  describe("fnv1a_hash & constants", () => {
    it("exposes HASH_OFFSET_BASIS and HASH_PRIME constants", () => {
      expect(HASH_OFFSET_BASIS).toBe(0x811c9dc5);
      expect(HASH_PRIME).toBe(0x01000193);
    });

    it("should produce deterministic 32-bit hashes", () => {
      expect(fnv1a_hash("hello")).toBe(fnv1a_hash("hello"));
      expect(fnv1a_hash("hello")).not.toBe(fnv1a_hash("world"));
      expect(fnv1a_hash(null)).toBe(0);
      expect(fnv1a_hash(123)).toBe(0);
    });
  });

  describe("stable_pick", () => {
    it("should deterministically pick the same element for the same seed", () => {
      const list = ["apple", "banana", "cherry", "date"];
      const pick1 = stable_pick(list, "seed-1", 0);
      const pick2 = stable_pick(list, "seed-1", 0);
      expect(pick1).toBe(pick2);
      expect(list).toContain(pick1);
    });

    it("should handle empty or invalid lists safely", () => {
      expect(stable_pick([], "seed")).toBe("");
      expect(stable_pick(null, "seed")).toBe("");
    });
  });
});
