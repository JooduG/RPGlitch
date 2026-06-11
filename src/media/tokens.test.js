/**
 * Unit tests for Tokens and Color Generation logic
 * Ported from legacy entities.test.js
 */
import {
  get_signature_color,
  get_signature_label,
  get_contrast_color,
  get_color_name,
  get_deterministic_color,
} from "@media";
import { describe, expect, test } from "vitest";
describe("Tokens Color Generation", () => {
  const get_signature = (/** @type {any} */ e) => get_signature_color(e);
  describe("Modern entities with signature_color", () => {
    test("returns hex value for entity with signature_color", () => {
      const entity = { signature_color: "Electric Cyan" };
      const result = get_signature(entity);
      expect(result).toBe("var(--electric-cyan)");
    });
    test("returns hex value for entity with pink signature_color", () => {
      const entity = { signature_color: "Hot Pink" };
      const result = get_signature(entity);
      expect(result).toBe("var(--hot-pink)");
    });
    test("returns hex value for entity with emerald signature_color", () => {
      const entity = { signature_color: "Emerald Green" };
      const result = get_signature(entity);
      expect(result).toBe("var(--emerald-green)");
    });
  });
  describe("Deterministic color generation fallback", () => {
    test.each([
      { case: "entity with name only", entity: { name: "Aether Blade" } },
      {
        case: "entity with name and tags",
        entity: { name: "Mystic Bard", tags: ["magic", "music"] },
      },
    ])("generates deterministic color for $case", ({ entity }) => {
      const result = get_signature(entity);
      expect(result).toMatch(/^var\(--[a-z0-9-]+\)$/);
    });
    test("generates consistent color for same entity data", () => {
      const entity1 = { name: "Clockwork Rogue", tags: ["stealth"] };
      const entity2 = { name: "Clockwork Rogue", tags: ["stealth"] };
      const result1 = get_signature(entity1);
      const result2 = get_signature(entity2);
      expect(result1).toBe(result2);
    });
    test("generates different colors for different entity data", () => {
      const entity1 = { name: "Entity A" };
      const entity2 = { name: "Entity B" };
      const result1 = get_signature(entity1);
      const result2 = get_signature(entity2);
      expect(result1).not.toBe(result2);
    });
    test("uses id as fallback seed when name is empty", () => {
      const entity = { id: "char-123", name: "" };
      const result = get_signature(entity);
      expect(result).toMatch(/^var\(--[a-z0-9-]+\)$/);
    });
    test("uses kind as fallback seed when name and id are empty", () => {
      const entity = { kind: "character", name: "", id: "" };
      const result = get_signature(entity);
      expect(result).toMatch(/^var\(--[a-z0-9-]+\)$/);
    });
    test("handles completely empty entity gracefully", () => {
      const entity = {};
      const result = get_signature(entity);
      expect(result).toMatch(/^var\(--[a-z0-9-]+\)$/);
    });
    test("never returns non-vibrant or background colors for signatures", () => {
      const problematic_seeds = ["test9", "test20", "admin", "system"];
      for (const seed of problematic_seeds) {
        const color = get_deterministic_color(seed);
        expect(color).not.toBe("var(--pure-white)");
        expect(color).not.toBe("var(--void-black)");
        expect(color).not.toBe("var(--chalk)");
        expect(color).not.toMatch(/background-gradient/);
      }
    });
  });
  describe("Edge cases and robustness", () => {
    test.each([
      { case: "undefined entity", input: undefined },
      { case: "null entity", input: null },
      { case: "entity with empty signature_color string", input: { signature_color: "" } },
      { case: "entity with empty palette object", input: { palette: {} } },
      { case: "entity with null palette.brand", input: { palette: { brand: null } } },
      { case: "entity with empty tags array", input: { name: "Test", tags: [] } },
      { case: "entity with undefined tags", input: { name: "Test", tags: undefined } },
    ])("handles $case", ({ input }) => {
      const result = get_signature(input);
      // Falsy values for signature_color, etc., should fall through to deterministic generation.
      expect(result).toMatch(/^var\(--[a-z0-9-]+\)$/);
    });
    test("get_signature_label returns safe default for null entity", () => {
      expect(get_signature_label(null)).toBe("Frozen");
    });
  });
});

describe("Tokens Contrast Utilities", () => {
  describe("get_contrast_color()", () => {
    test("returns black for light colors", () => {
      expect(get_contrast_color("#fff")).toBe("var(--void-black)");
      expect(get_contrast_color("#fde047")).toBe("var(--void-black)"); // Lemon Yellow
    });

    test("returns white for dark colors", () => {
      expect(get_contrast_color("#000")).toBe("var(--pure-white)");
      expect(get_contrast_color("#15803d")).toBe("var(--pure-white)"); // Forest Green
      expect(get_contrast_color("#ef4444")).toBe("var(--pure-white)"); // Crimson Red
    });

    test("handles shorthand hex codes", () => {
      expect(get_contrast_color("#fff")).toBe("var(--void-black)");
      expect(get_contrast_color("#000")).toBe("var(--pure-white)");
    });

    test("handles invalid inputs gracefully", () => {
      expect(get_contrast_color(null)).toBe("var(--pure-white)");
      expect(get_contrast_color("invalid")).toBe("var(--pure-white)");
      expect(get_contrast_color("hsl(0, 0%, 100%)")).toBe("var(--pure-white)");
    });
  });
});
