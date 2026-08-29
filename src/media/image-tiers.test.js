/**
 * @file src/media/image-tiers.test.js
 * Unit tests for Unified 4-Tier Image Taxonomy and resolution mapping.
 */
import { describe, expect, it } from "vitest";
import { DEFAULT_IMAGE_TIER, IMAGE_TIERS, get_resolution, get_tier_guidance_scale, normalize_image_tier } from "./image-tiers.js";

describe("image-tiers (4-Tier Image Taxonomy)", () => {
  describe("constants", () => {
    it("exposes the 4 canonical image tiers", () => {
      expect(IMAGE_TIERS).toEqual(["story_entities", "story_character", "solo_entity", "story_scene"]);
    });

    it("defines DEFAULT_IMAGE_TIER as story_scene", () => {
      expect(DEFAULT_IMAGE_TIER).toBe("story_scene");
    });
  });

  describe("normalize_image_tier", () => {
    it("normalizes known aliases and multi-character indicators to story_entities", () => {
      expect(normalize_image_tier("characters")).toBe("story_entities");
      expect(normalize_image_tier("prologue")).toBe("story_entities");
      expect(normalize_image_tier("group")).toBe("story_entities");
      expect(normalize_image_tier("story_entities")).toBe("story_entities");
      expect(normalize_image_tier("  CHARACTERS  ")).toBe("story_entities");
    });

    it("preserves valid canonical tiers unchanged", () => {
      expect(normalize_image_tier("solo_entity")).toBe("solo_entity");
      expect(normalize_image_tier("story_character")).toBe("story_character");
      expect(normalize_image_tier("story_scene")).toBe("story_scene");
    });

    it("falls back to story_character for unknown or empty input", () => {
      expect(normalize_image_tier("")).toBe("story_character");
      expect(normalize_image_tier(null)).toBe("story_character");
      expect(normalize_image_tier(undefined)).toBe("story_character");
      expect(normalize_image_tier("unknown_custom_mode")).toBe("story_character");
    });
  });

  describe("get_resolution", () => {
    it("maps story_scene to landscape (768x512)", () => {
      expect(get_resolution("story_scene")).toEqual({ width: 768, height: 512 });
    });

    it("maps solo_entity and story_character to portrait (512x768)", () => {
      expect(get_resolution("solo_entity")).toEqual({ width: 512, height: 768 });
      expect(get_resolution("story_character")).toEqual({ width: 512, height: 768 });
    });

    it("maps story_entities to square (768x768)", () => {
      expect(get_resolution("story_entities")).toEqual({ width: 768, height: 768 });
      expect(get_resolution("characters")).toEqual({ width: 768, height: 768 });
    });
  });

  describe("get_tier_guidance_scale", () => {
    it("assigns tighter prompt guidance (9) to character shots", () => {
      expect(get_tier_guidance_scale("solo_entity")).toBe(9);
      expect(get_tier_guidance_scale("story_character")).toBe(9);
      expect(get_tier_guidance_scale("story_entities")).toBe(9);
    });

    it("assigns atmospheric baseline guidance (7) to environmental scenes", () => {
      expect(get_tier_guidance_scale("story_scene")).toBe(7);
    });
  });
});
