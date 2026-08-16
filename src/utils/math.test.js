import { describe, it, expect } from "vitest";
import {
  clamp,
  pick_random as pickRandom,
  generate_secure_seed as generateSecureSeed,
  generate_uuid as generateUUID,
  fnv1a_hash as fnv1aHash,
  stable_pick as stablePick,
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

  describe("generateUUID", () => {
    it("should generate a valid UUID", () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe("generateSecureSeed", () => {
    it("should generate a number within the limit", () => {
      const limit = 10;
      for (let i = 0; i < 100; i++) {
        const seed = generateSecureSeed(limit);
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(seed).toBeLessThan(limit);
      }
    });

    it("should reject out-of-range draws (rejection sampling, no modulo bias)", () => {
      const limit = 10;
      const max_valid = 0x100000000 - (0x100000000 % limit); // 4294967290
      const draws = [max_valid, 3]; // first draw is exactly the reject threshold → redrawn
      let i = 0;
      const real = globalThis.crypto.getRandomValues;
      globalThis.crypto.getRandomValues = (/** @type {Uint32Array} */ arr) => {
        arr[0] = draws[i++ % draws.length];
        return arr;
      };
      try {
        expect(generateSecureSeed(limit)).toBe(3 % limit);
      } finally {
        globalThis.crypto.getRandomValues = real;
      }
    });
  });

  describe("pickRandom", () => {
    it("should pick an element from the array", () => {
      const arr = ["a", "b", "c"];
      const picked = pickRandom(arr);
      expect(arr).toContain(picked);
    });

    it("should return null for empty array", () => {
      expect(pickRandom([])).toBeNull();
    });

    it("should return null for non-array", () => {
      // @ts-ignore
      expect(pickRandom(null)).toBeNull();
      // @ts-ignore
      expect(pickRandom(undefined)).toBeNull();
    });
  });

  describe("fnv1aHash", () => {
    it("should produce deterministic 32-bit hashes", () => {
      expect(fnv1aHash("hello")).toBe(fnv1aHash("hello"));
      expect(fnv1aHash("hello")).not.toBe(fnv1aHash("world"));
      expect(fnv1aHash(null)).toBe(0);
    });
  });

  describe("stablePick", () => {
    it("should deterministically pick the same element for the same seed", () => {
      const list = ["apple", "banana", "cherry", "date"];
      const pick1 = stablePick(list, "seed-1", 0);
      const pick2 = stablePick(list, "seed-1", 0);
      expect(pick1).toBe(pick2);
      expect(list).toContain(pick1);
    });

    it("should handle empty or invalid lists safely", () => {
      expect(stablePick([], "seed")).toBe("");
      expect(stablePick(null, "seed")).toBe("");
    });
  });
});
