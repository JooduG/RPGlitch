import {
  coerce_temporal_array,
  create_new,
  ENTITY_TEMPLATES,
  format_premade,
  get_random_signature_key,
  normalize,
  STORAGE_VERSION,
} from "@data";
import { Security } from "@platform";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Security.sanitize
vi.mock("@platform/security.js", () => ({
  Security: {
    sanitize: vi.fn((val) => (typeof val === "string" ? val.trim() : val)),
  },
}));

describe("content-normaliser.js", () => {
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
        future: [],
        modifiers: {
          prompt: "",
          no_background: false,
          flipped: false,
          profile_picture_seed: 0,
          color_name: "",
        },
        voice: {
          uri: "",
          rate: 1.0,
          pitch: 1.0,
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
      expect(Security.sanitize).toHaveBeenCalledWith("<b>Danger</b>");
      expect(Security.sanitize).toHaveBeenCalledWith(" Hello ");
      expect(Security.sanitize).toHaveBeenCalledWith("Red");
    });

    it("should handle [BACKWARD COMPAT] visuals -> modifiers migration", () => {
      const input = {
        visuals: {
          prompt: "test prompt",
          no_background: true,
          flipped: true,
          profile_picture_seed: 123,
          color_name: "Blue",
        },
      };
      const result = normalize(input);
      expect(result.modifiers).toEqual({
        prompt: "test prompt",
        no_background: true,
        flipped: true,
        profile_picture_seed: 123,
        color_name: "Blue",
      });
    });

    it("should prioritize modifiers over legacy visuals", () => {
      const input = {
        modifiers: { prompt: "new prompt" },
        visuals: { prompt: "old prompt" },
      };
      const result = normalize(input);
      expect(result.modifiers.prompt).toBe("new prompt");
    });

    it("should preserve database identity and timestamps", () => {
      const input = {
        id: "id-123",
        created_at: 1000,
        updated_at: 2000,
        origin_id: "origin-456",
        is_premade: 1,
        is_custom: 1,
        is_chosen: 1,
        is_snapshot: 1,
        version: 5,
        associated_ids: ["abc"],
        dynamics_baseline: { chaos: 50 },
      };
      const result = normalize(input);
      expect(result.id).toBe("id-123");
      expect(result.created_at).toBe(1000);
      expect(result.updated_at).toBe(2000);
      expect(result.origin_id).toBe("origin-456");
      expect(result.is_premade).toBe(1);
      expect(result.is_custom).toBe(1);
      expect(result.is_chosen).toBe(1);
      expect(result.is_snapshot).toBe(1);
      expect(result.version).toBe(5);
      expect(result.associated_ids).toEqual(["abc"]);
      expect(result.dynamics_baseline).toEqual({ chaos: 50 });

      // Verify camelCase mappings
      expect(result.originId).toBe("origin-456");
      expect(result.isCustom).toBe(1);
      expect(result.isPremade).toBe(1);
      expect(result.isChosen).toBe(1);
      expect(result.isSnapshot).toBe(1);
      expect(result.associatedIds).toEqual(["abc"]);
      expect(result.dynamicsBaseline).toEqual({ chaos: 50 });
    });

    it("should handle camelCase variants for database flags", () => {
      const input = {
        createdAt: 1000,
        updatedAt: 2000,
        originId: "origin-456",
        isPremade: 1,
        isCustom: 1,
        isChosen: 1,
        isSnapshot: 1,
        associatedIds: ["abc"],
        dynamicsBaseline: { chaos: 50 },
      };
      const result = normalize(input);
      expect(result.created_at).toBe(1000);
      expect(result.updated_at).toBe(2000);
      expect(result.origin_id).toBe("origin-456");
      expect(result.is_premade).toBe(1);
      expect(result.is_custom).toBe(1);
      expect(result.is_chosen).toBe(1);
      expect(result.is_snapshot).toBe(1);
      expect(result.associated_ids).toEqual(["abc"]);
      expect(result.dynamics_baseline).toEqual({ chaos: 50 });

      // Verify camelCase preservation
      expect(result.originId).toBe("origin-456");
      expect(result.isCustom).toBe(1);
      expect(result.isPremade).toBe(1);
      expect(result.isChosen).toBe(1);
      expect(result.isSnapshot).toBe(1);
      expect(result.associatedIds).toEqual(["abc"]);
      expect(result.dynamicsBaseline).toEqual({ chaos: 50 });
    });

    it("should prioritize snake_case over camelCase when both are present", () => {
      const input = {
        is_custom: 1,
        isCustom: 0,
        origin_id: "snake-id",
        originId: "camel-id",
      };
      const result = normalize(input);
      expect(result.is_custom).toBe(1);
      expect(result.isCustom).toBe(1);
      expect(result.origin_id).toBe("snake-id");
      expect(result.originId).toBe("snake-id");
    });

    it("should process tags into a sanitized array of strings", () => {
      const input = { tags: [" tag1 ", "tag2", null, 123] };
      const result = normalize(input);
      // Security.sanitize is mocked to trim
      expect(result.tags).toEqual(["tag1", "tag2", "123"]);
    });

    it("should seed dynamics from templates if missing", () => {
      const charResult = normalize({ type: "character" });
      expect(charResult.dynamics).toEqual(ENTITY_TEMPLATES.character.dynamics);

      const fractalResult = normalize({ type: "fractal" });
      expect(fractalResult.dynamics).toEqual(ENTITY_TEMPLATES.fractal.dynamics);
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
    it("should format an entity for storage with correct flags", () => {
      const entity = { name: "Premade One", type: "character" };
      const result = format_premade(entity, "character");
      expect(result.is_premade).toBe(1);
      expect(result.version).toBe(STORAGE_VERSION);
      expect(result.updated_at).toBe(0);
      expect(result.name).toBe("Premade One");
    });
  });

  describe("get_random_signature_key()", () => {
    it("should return a valid key from the PALETTE", async () => {
      const { PALETTE } = await import("@media/palette.svelte.js");
      const key = get_random_signature_key();
      expect(Object.keys(PALETTE)).toContain(key);
      expect(key).not.toBe("default");
    });
  });
});
