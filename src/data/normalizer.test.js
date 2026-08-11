import {
  coerce_temporal_array,
  create_new,
  detox_prose,
  ENTITY_TEMPLATES,
  format_premade,
  get_random_signature_key,
  normalize,
} from "./normalizer.js";
import { security } from "@platform";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock security.sanitize
vi.mock("@platform/security.js", () => ({
  security: {
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
        future: "",
        modifiers: {
          prompt: "",
          negative_prompt: "",
          no_background: false,
          flipped: false,
          profile_picture_seed: 0,
          last_generated_seed: null,
        },
        voice: {
          uri: "",
          rate: 1.0,
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
});

describe("detox_prose()", () => {
  it("should scrub classic AI tropes", () => {
    expect(detox_prose("The air tastes of ozone and the room hums.")).not.toMatch(/ozone|hums/i);
    expect(detox_prose("He murmured softly, a testament to his restraint.")).not.toMatch(/murmur|testament/i);
    expect(detox_prose("A rich tapestry of emotion, a symphony of breath.")).not.toMatch(/tapestry|symphony/i);
  });

  it("should scrub Reddit-reported AI-isms", () => {
    expect(detox_prose("His obsidian eyes stared into the void.")).not.toMatch(/obsidian|void/i);
    expect(detox_prose("She stood frozen, white knuckles on the rail.")).not.toMatch(/frozen|white knuckles/i);
    expect(detox_prose("The sky was bruised purple in amber light.")).not.toMatch(/bruised purple|amber light/i);
    expect(detox_prose("Old parchment rustled; once in a blue moon.")).not.toMatch(/parchment|blue moon/i);
    expect(detox_prose("Crimson lips, iridescent scales, a spatial disturbance.")).not.toMatch(/crimson|iridescent|spatial disturbance/i);
    expect(detox_prose("He let out a breath he didn't realize he was holding.")).not.toMatch(/realize.*holding|realized.*holding/i);
    expect(detox_prose("They were merging their molecules together.")).not.toMatch(/merging their molecules/i);
  });

  it("should not mangle ordinary prose", () => {
    const plain = "He smiled and the door swung open. She sighed and looked up.";
    expect(detox_prose(plain)).toBe(plain);
  });

  it("should not touch non-cliché usages", () => {
    expect(detox_prose("He leaned in the doorway, watching her.")).toContain("leaned in the doorway");
    expect(detox_prose("The room was devoid of light.")).toContain("devoid of");
  });
});
