/**
 * @file src/media/policy.test.js
 * Unit tests for the media image-policy surface: per-entity trigger
 * evaluation plus the tier / resolution / optics vocabulary re-exported
 * from the canonical `@simulation` homes.
 */

import { describe, expect, it } from "vitest";
import {
  IMAGE_TIERS,
  TIER_RESOLUTIONS,
  evaluate_image_trigger,
  get_resolution,
  get_resolution_string,
  get_tier_guidance_scale,
  normalize_image_tier,
  resolve_image_trigger,
} from "./policy.js";

const OPTIONS = { BAND_HIGH: 85, BAND_LOW: 15, DISPLACEMENT_THRESHOLD: 50, DEFAULT_TIER: "story_scene" };

describe("media/policy.js - image policy surface", () => {
  describe("evaluate_image_trigger (per-entity axis comparison)", () => {
    it("ignores cross-entity from/to pairs instead of fabricating phantom deltas", () => {
      // intensity 10 lives ONLY on ai (previous), 90 ONLY on fractal (current).
      // A first-finite scan would pair ai:10 -> fractal:90 (delta 80, trigger).
      // Per-entity comparison sees no same-entity pair and stays quiet.
      const result = evaluate_image_trigger({ fractal: { intensity: 90 } }, { ai: { intensity: 10 } }, OPTIONS);
      expect(result.deltas).toHaveLength(0);
      expect(result.triggered).toBe(false);
    });

    it("detects same-entity band crossings with entity attribution", () => {
      const result = evaluate_image_trigger({ ai: { intensity: 92 } }, { ai: { intensity: 50 } }, OPTIONS);
      expect(result.triggered).toBe(true);
      expect(result.signals.band_entry).toMatchObject({ band: "high", axis: "intensity" });
      expect(result.tier).toBe("story_character");
    });

    it("triggers on displacement past the threshold with the default tier", () => {
      const result = evaluate_image_trigger({ ai: { tension: 40, chaos: 40 } }, { ai: { tension: 10, chaos: 10 } }, OPTIONS);
      expect(result.triggered).toBe(true);
      expect(result.signals.displacement).toBe(60);
      expect(result.tier).toBe("story_scene");
    });

    it("stays quiet when nothing moves", () => {
      const result = evaluate_image_trigger({ ai: { tension: 10 } }, { ai: { tension: 10 } }, OPTIONS);
      expect(result.triggered).toBe(false);
      expect(result.deltas).toHaveLength(1);
      expect(result.deltas[0]).toMatchObject({ axis: "tension", delta: 0, entity: "ai" });
    });
  });

  describe("tier / resolution vocabulary (canonical @simulation re-exports)", () => {
    it("exposes the tier list and per-tier resolutions", () => {
      expect(IMAGE_TIERS).toContain("story_scene");
      expect(IMAGE_TIERS).toContain("solo_entity");
      expect(TIER_RESOLUTIONS.story_scene).toBeDefined();
      expect(get_resolution("solo_entity")).toEqual({ width: 512, height: 768 });
    });

    it("normalizes aliases and formats resolution strings", () => {
      expect(normalize_image_tier("character")).toBe("solo_entity");
      expect(normalize_image_tier("scene")).toBe("story_scene");
      expect(get_resolution_string("solo_entity")).toBe("512x768");
    });

    it("derives guidance scales per tier and resolves triggers", () => {
      expect(typeof get_tier_guidance_scale("story_scene")).toBe("number");
      expect(typeof resolve_image_trigger).toBe("function");
    });
  });
});
