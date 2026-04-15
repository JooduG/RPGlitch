import { describe, it, expect, vi } from "vitest";
import { generateUUID, generateSecureSeed, pickRandom } from "./core.js";
describe("utils", () => {
  describe("generateSecureSeed", () => {
    it("should return a number within the specified limit", () => {
      const limit = 1000;
      for (let i = 0; i < 100; i++) {
        const seed = generateSecureSeed(limit);
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(seed).toBeLessThan(limit);
        expect(Number.isInteger(seed)).toBe(true);
      }
    });

    it("should throw an error if crypto.getRandomValues is not available", () => {
      const originalCrypto = globalThis.crypto;
      Object.defineProperty(globalThis, "crypto", {
        value: { ...originalCrypto, getRandomValues: undefined },
        configurable: true,
      });
      expect(() => generateSecureSeed()).toThrow(/crypto.getRandomValues is not available/);
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });

    it("should use crypto.getRandomValues", () => {
      const originalCrypto = globalThis.crypto;
      const mockGetRandomValues = vi.fn((arr) => {
        arr[0] = 123456;
        return arr;
      });
      Object.defineProperty(globalThis, "crypto", {
        value: { ...originalCrypto, getRandomValues: mockGetRandomValues },
        configurable: true,
      });

      const seed = generateSecureSeed(100);
      expect(mockGetRandomValues).toHaveBeenCalled();
      expect(seed).toBe(123456 % 100);

      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });
  });

  describe("pickRandom", () => {
    it("should return null for empty arrays or non-arrays", () => {
      expect(pickRandom([])).toBe(null);
      expect(pickRandom(null)).toBe(null);
      expect(pickRandom(undefined)).toBe(null);
      expect(pickRandom({})).toBe(null);
    });

    it("should return an element from the array", () => {
      const arr = ["a", "b", "c"];
      const result = pickRandom(arr);
      expect(arr).toContain(result);
    });

    it("should use Math.random if generateSecureSeed fails", () => {
      const arr = ["a"];
      const originalCrypto = globalThis.crypto;
      Object.defineProperty(globalThis, "crypto", {
        value: undefined,
        configurable: true,
      });

      const result = pickRandom(arr);
      expect(result).toBe("a");

      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });
  });

  describe("generateUUID", () => {
    it("should return a valid UUID string", () => {
      const uuid = generateUUID();
      // Basic UUID v4 regex
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
    it("should return different UUIDs on subsequent calls", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
    it("should throw an error if crypto.randomUUID is not available", () => {
      const originalCrypto = globalThis.crypto;
      // Mock an environment where crypto.randomUUID is missing
      Object.defineProperty(globalThis, "crypto", {
        value: { ...originalCrypto, randomUUID: undefined },
        configurable: true,
      });
      expect(() => generateUUID()).toThrow(/crypto.randomUUID is not available/);
      // Restore the original crypto object
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });
  });
});
