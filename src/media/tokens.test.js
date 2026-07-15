/**
 * Unit tests for Tokens and Color Generation logic
 * Ported from legacy entities.test.js
 */
import { get_signature_color, get_signature_label, get_deterministic_color } from "./tokens.js";
import { AestheticResolver } from "./optics.js";
import { describe, expect, test } from "vitest";
describe("Tokens Color Generation", () => {
  const get_signature = (/** @type {any} */ e) => get_signature_color(e);
  describe("Modern entities with signature_color", () => {
    test("returns hex value for entity with signature_color", () => {
      const entity = { signature_color: "Electric Cyan" };
      const result = get_signature(entity);
      expect(result).toBe("var(--color-electric-cyan)");
    });
    test("returns hex value for entity with pink signature_color", () => {
      const entity = { signature_color: "Hot Pink" };
      const result = get_signature(entity);
      expect(result).toBe("var(--color-hot-pink)");
    });
    test("returns hex value for entity with emerald signature_color", () => {
      const entity = { signature_color: "Emerald Green" };
      const result = get_signature(entity);
      expect(result).toBe("var(--color-emerald-green)");
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
        expect(color).not.toBe("var(--color-pure-white)");
        expect(color).not.toBe("var(--color-void-black)");
        expect(color).not.toBe("var(--color-chalk)");
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

  describe("AestheticResolver.flatten", () => {
    test("flattens empty entity to default preset", () => {
      const entity = {};
      const result = AestheticResolver.flatten(entity);
      expect(result).toBe(
        "coral rose aesthetic, professional portrait camera configuration, natural lighting, sharp subject focus, fine structural details, high-end studio layout, realistic textures",
      );
    });

    test("flattens character with physical details and signature color", () => {
      const entity = {
        type: "character",
        signature_color: "Electric Cyan",
        eternal: {
          physical: '{"height": "1.8m", "eyes": "glow blue"}',
        },
        present: {
          physical: '{"wears": "dark cloak"}',
        },
      };
      const result = AestheticResolver.flatten(entity);
      expect(result).toContain("1.8m");
      expect(result).toContain("glow blue");
      expect(result).toContain("dark cloak");
      expect(result).toContain("electric cyan aesthetic");
      expect(result).toContain("professional portrait camera configuration");
    });

    test("flattens fractal scene with landscape presets", () => {
      const entity = {
        type: "fractal",
        signature_color: "Void Black",
        eternal: {
          physical: '{"atmosphere": "sub-zero facility"}',
        },
      };
      const result = AestheticResolver.flatten(entity);
      expect(result).toContain("sub-zero facility");
      expect(result).toContain("void black aesthetic");
      expect(result).toContain("cinematic wide-angle environmental frame");
    });
  });
});
