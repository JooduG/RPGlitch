/**
 * Unit tests for ThemeStore and Color Generation logic
 * Ported from legacy entities.test.js
 */
import { themeStore } from "@theme/palette.svelte.js";
import { describe, expect, test } from "vitest";
describe("ThemeStore Color Generation", () => {
  const get_signature = (e) => themeStore.get_signature_color(e);
  describe("Modern entities with signature_color", () => {
    test("returns hex value for entity with signature_color", () => {
      const entity = { signature_color: "Electric Cyan" };
      const result = get_signature(entity);
      expect(result).toBe("var(--color-cyan)");
    });
    test("returns hex value for entity with pink signature_color", () => {
      const entity = { signature_color: "Hot Pink" };
      const result = get_signature(entity);
      expect(result).toBe("var(--color-pink)");
    });
    test("returns hex value for entity with emerald signature_color", () => {
      const entity = { signature_color: "Emerald Green" };
      const result = get_signature(entity);
      expect(result).toBe("var(--color-emerald)");
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
      expect(result).toMatch(/^var\(--color-[a-z]+\)$/);
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
      expect(result).toMatch(/^var\(--color-[a-z]+\)$/);
    });
    test("uses kind as fallback seed when name and id are empty", () => {
      const entity = { kind: "character", name: "", id: "" };
      const result = get_signature(entity);
      expect(result).toMatch(/^var\(--color-[a-z]+\)$/);
    });
    test("handles completely empty entity gracefully", () => {
      const entity = {};
      const result = get_signature(entity);
      expect(result).toMatch(/^var\(--color-[a-z]+\)$/);
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
      expect(result).toMatch(/^var\(--color-[a-z]+\)$/);
    });
  });

  describe("get_contrast_color", () => {
    test("returns black for light colors", () => {
      expect(themeStore.get_contrast_color("#ffffff")).toBe("var(--color-black)");
      expect(themeStore.get_contrast_color("#fde047")).toBe("var(--color-black)"); // Lemon Yellow
    });

    test("returns white for dark colors", () => {
      expect(themeStore.get_contrast_color("#000000")).toBe("var(--color-white)");
      expect(themeStore.get_contrast_color("#15803d")).toBe("var(--color-white)"); // Forest Green
    });

    test("handles shorthand hex", () => {
      expect(themeStore.get_contrast_color("#fff")).toBe("var(--color-black)");
      expect(themeStore.get_contrast_color("#000")).toBe("var(--color-white)");
    });

    test("handles invalid input gracefully", () => {
      expect(themeStore.get_contrast_color(null)).toBe("var(--color-white)");
      expect(themeStore.get_contrast_color("invalid")).toBe("var(--color-white)");
      expect(themeStore.get_contrast_color("hsl(0, 0%, 100%)")).toBe("var(--color-white)");
    });
  });
});
