import { coerce_temporal_array, create_new, ENTITY_TEMPLATES, format_premade, get_random_signature_key, normalize } from "./normalizer.js";
import { security } from "@platform";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock security.sanitize
vi.mock("@platform/security.js", () => ({
  security: {
    sanitize: vi.fn((val) => (typeof val === "string" ? val.trim() : val)),
  },
}));

describe("normalizer.js", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock crypto idiomatic way
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "test-uuid"),
      getRandomValues: vi.fn((buffer) => {
        for (let i = 0; i < buffer.length; i++) buffer[i] = Math.floor(Math.random() * 256);
        return buffer;
      }),
    });
  });

  describe("normalize()", () => {
    it("should return a fully structured object even with empty input", () => {
      const result = normalize({});
      expect(result).toMatchObject({
        name: "",
        description: "",
        type: "character",
        eternal: { physical: "", non_physical: "" },
        present: { physical: "", non_physical: "" },
        past: [],
        future: "",
        modifiers: {
          prompt: "",
          negative_prompt: "",
          flipped: false,
          profile_picture_seed: 0,
          last_generated_seed: null,
        },
        voice: {
          name: "",
          uri: "",
          cadence: "standard",
        },
      });
      expect(result.signature_color).toBeDefined();
    });

    it("should sanitize string fields", () => {
      const input = {
        name: "<b>Danger</b>",
        description: " Hello ",
        signature_color: "Red",
      };
      normalize(input);
      expect(security.sanitize).toHaveBeenCalledWith("<b>Danger</b>");
      expect(security.sanitize).toHaveBeenCalledWith(" Hello ");
      expect(security.sanitize).toHaveBeenCalledWith("Red");
    });

    it("should sanitize, strip newlines, and cap super long name fields", () => {
      const long_name = "Lord Valerius Vance\n" + "A".repeat(150);
      const result = normalize({ name: long_name });
      expect(result.name.length).toBeLessThanOrEqual(80);
      expect(result.name).not.toContain("\n");
      expect(result.name.startsWith("Lord Valerius Vance")).toBe(true);
    });

    it("should persist a custom negative_prompt value", () => {
      const input = {
        modifiers: { prompt: "a hero", negative_prompt: "blurry, low quality" },
      };
      const result = normalize(input);
      expect(result.modifiers.negative_prompt).toBe("blurry, low quality");
    });

    it("should default negative_prompt to empty string when absent", () => {
      const input = { modifiers: { prompt: "a hero" } };
      const result = normalize(input);
      expect(result.modifiers.negative_prompt).toBe("");
    });

    it("should preserve database identity, timestamps, origin, and dynamics baseline", () => {
      const input = {
        id: "id-123",
        created_at: 1000,
        updated_at: 2000,
        origin_id: "origin-456",
        dynamics_baseline: { chaos: 50 },
      };
      const result = normalize(input);
      expect(result.id).toBe("id-123");
      expect(result.created_at).toBe(1000);
      expect(result.updated_at).toBe(2000);
      expect(result.origin_id).toBe("origin-456");
      expect(result.dynamics_baseline).toEqual({ chaos: 50 });
    });

    it("should process tags into a sanitized array of strings", () => {
      const input = { tags: [" tag1 ", "tag2", null, 123] };
      const result = normalize(input);
      // security.sanitize is mocked to trim
      expect(result.tags).toEqual(["tag1", "tag2", "123"]);
    });

    it("should seed dynamics from templates if missing", () => {
      const char_result = normalize({ type: "character" });
      expect(char_result.dynamics).toEqual(ENTITY_TEMPLATES.character.dynamics);

      const fractal_result = normalize({ type: "fractal" });
      expect(fractal_result.dynamics).toEqual(ENTITY_TEMPLATES.fractal.dynamics);
    });
  });

  describe("coerce_temporal_array()", () => {
    it("should return the array if input is already an array", () => {
      const arr = ["one", "two"];
      expect(coerce_temporal_array(arr)).toBe(arr);
    });

    it("should split strings by newlines and trim values", () => {
      const input = " line1 \n line2 \n\n line3 ";
      expect(coerce_temporal_array(input)).toEqual(["line1", "line2", "line3"]);
    });

    it("should return empty array for non-string non-array inputs", () => {
      expect(coerce_temporal_array(null)).toEqual([]);
      expect(coerce_temporal_array(123)).toEqual([]);
    });
  });

  describe("create_new()", () => {
    it("should create a fully normalized entity with a random color and UUID", () => {
      const result = create_new("character", { name: "Test Hero" });
      expect(result.name).toBe("Test Hero");
      expect(result.id).toBe("test-uuid");
      expect(result.created_at).toBeDefined();
      expect(result.updated_at).toBeDefined();
      expect(result.type).toBe("character");
    });
  });

  describe("format_premade()", () => {
    it("should format an entity for storage", () => {
      const entity = { name: "Premade One", type: "character" };
      const result = format_premade(entity, "character");
      expect(result.updated_at).toBe(0);
      expect(result.name).toBe("Premade One");
    });
  });

  describe("get_random_signature_key()", () => {
    it("should return a valid key from the PALETTE", async () => {
      const { PALETTE } = await import("@media/tokens.js");
      const key = get_random_signature_key();
      expect(Object.keys(PALETTE)).toContain(key);
      expect(key).not.toBe("default");
    });
  });

  describe("world-cast tier fields (role_tier / is_wanderer / relationships)", () => {
    it("defaults to tier 1 background when absent or invalid", () => {
      expect(normalize({}).role_tier).toBe(1);
      expect(normalize({ role_tier: 99 }).role_tier).toBe(1);
      expect(normalize({ role_tier: "banana" }).role_tier).toBe(1);
    });

    it("preserves tier 2 (recurring) and tier 3 (major)", () => {
      expect(normalize({ role_tier: 2 }).role_tier).toBe(2);
      expect(normalize({ role_tier: 3 }).role_tier).toBe(3);
    });

    it("coerces is_wanderer to a boolean", () => {
      expect(normalize({}).is_wanderer).toBe(false);
      expect(normalize({ is_wanderer: true }).is_wanderer).toBe(true);
      expect(normalize({ is_wanderer: "yes" }).is_wanderer).toBe(true);
      expect(normalize({ is_wanderer: 0 }).is_wanderer).toBe(false);
    });

    it("sanitizes, trims, caps (240 chars each / 40 items) and dedupes not — relationships array", () => {
      const long_rel = "[Mira] → [Elias]: " + "devoted ".repeat(60);
      const input = {
        relationships: [`[Mira] → [Elias]: allies `, long_rel, "", null, 42, `[Elias] → [Mira]: wary`],
      };
      const result = normalize(input);
      expect(result.relationships).toHaveLength(4);
      expect(result.relationships[0]).toBe("[Mira] → [Elias]: allies");
      expect(result.relationships[0]).not.toMatch(/\s$/);
      // 240 content chars + the "…" truncation marker = 241 max.
      expect(result.relationships.every((r) => r.length <= 241)).toBe(true);
    });

    it("caps the relationships array at 40 entries", () => {
      const many = Array.from({ length: 50 }, (_, i) => `[A${i}] → [B${i}]: contact`);
      expect(normalize({ relationships: many }).relationships).toHaveLength(40);
    });

    it("defaults relationships to an empty array", () => {
      expect(normalize({}).relationships).toEqual([]);
      expect(normalize({ relationships: "not-an-array" }).relationships).toEqual([]);
    });

    it("seeds the tier fields from templates", () => {
      expect(ENTITY_TEMPLATES.character.role_tier).toBe(1);
      expect(ENTITY_TEMPLATES.character.is_wanderer).toBe(false);
      expect(ENTITY_TEMPLATES.character.relationships).toEqual([]);
    });
  });
});
