import { describe, it, expect } from "vitest";
import { generateUUID } from "./core.js";
describe("utils", () => {
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
      expect(() => generateUUID()).toThrow(
        /crypto.randomUUID is not available/,
      );
      // Restore the original crypto object
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
    });
  });
});
