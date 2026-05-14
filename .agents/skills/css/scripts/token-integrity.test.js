import { describe, it, expect, beforeAll } from "vitest";
import { getDefinedTokens, validateLine } from "./token-integrity.js";

/**
 * 🧪 Token Integrity Test Suite
 */
describe("Token Integrity", () => {
  let tokens;

  beforeAll(() => {
    tokens = getDefinedTokens();
  });

  it("should load tokens from design.css", () => {
    expect(tokens.size).toBeGreaterThan(0);
  });

  it("should contain core foundation tokens", () => {
    const knownFoundations = ["--chalk", "--frozen", "--spacing-4"];
    knownFoundations.forEach((token) => {
      expect(tokens.has(token)).toBe(true);
    });
  });

  describe("validateLine", () => {
    it("should return null for valid single token", () => {
      const line = "color: var(--chalk);";
      expect(validateLine(line)).toBe(null);
    });

    it("should return null for multiple valid tokens", () => {
      const line = "margin: var(--spacing-4) var(--spacing-8);";
      expect(validateLine(line)).toBe(null);
    });

    it("should handle var() with fallbacks", () => {
      const line = "color: var(--chalk, #fff);";
      expect(validateLine(line)).toBe(null);
    });

    it("should return the token name for single invalid token", () => {
      const line = "color: var(--heresy-token);";
      expect(validateLine(line)).toBe("--heresy-token");
    });

    it("should return the first invalid token for mixed tokens", () => {
      const line = "color: var(--chalk); background: var(--unknown-bg);";
      expect(validateLine(line)).toBe("--unknown-bg");
    });

    it("should detect tokens even in comments (current limitation)", () => {
      const line = "/* var(--commented-out) */";
      expect(validateLine(line)).toBe("--commented-out");
    });
  });
});
