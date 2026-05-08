import { describe, it, expect } from "vitest";
import { pickRandom, generateSecureSeed, generateUUID } from "./utils.js";

describe("core/utils", () => {
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
});
