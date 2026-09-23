/**
 * @file src/media/optics.test.js
 * Unit tests for Sensory Cortex — Visual Optics Compiler, Taxonomy, Trigger Arbitration, and Aesthetic Synthesis.
 */

import { describe, expect, it } from "vitest";
import {
  DEFAULT_IMAGE_TIER,
  IMAGE_TIERS,
  ORDERED_VISUAL_STYLE_KEYS,
  aesthetic_resolver,
  build_aesthetic_map,
  compose_visual_generation_prompt,
  evaluate_image_trigger,
  get_resolution,
  get_tier_guidance_scale,
  normalize_image_tier,
  resolve_image_trigger,
} from "./optics.js";
import { VISUAL_EXCLUDED_KEYS, strip_visual_excluded } from "@utils";

describe("optics.js — 4-Tier Image Taxonomy & Resolutions", () => {
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
      expect(normalize_image_tier("group")).toBe("story_entities");
      expect(normalize_image_tier("story_entities")).toBe("story_entities");
      expect(normalize_image_tier("  CHARACTERS  ")).toBe("story_entities");
    });

    it("normalizes prologue and epilogue to landscape story_scene", () => {
      expect(normalize_image_tier("prologue")).toBe("story_scene");
      expect(normalize_image_tier("epilogue")).toBe("story_scene");
      expect(normalize_image_tier("PROLOGUE")).toBe("story_scene");
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

    it("normalizes fractal profile tier and landscape narrative group scenes to story_scene (768x512)", () => {
      expect(normalize_image_tier("fractal_profile")).toBe("story_scene");
      expect(get_resolution(normalize_image_tier("fractal_profile"))).toEqual({ width: 768, height: 512 });
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

describe("optics.js — Trigger Decision Engine & Dynamics Gate", () => {
  describe("evaluate_image_trigger (Pure-JS Dynamics Gate)", () => {
    it("triggers on Signal B high-band entry (transitioning into >= 85)", () => {
      const prev = { ai: { intensity: 80 } };
      const curr = { ai: { intensity: 88 } };
      const res = evaluate_image_trigger(curr, prev);

      expect(res.triggered).toBe(true);
      expect(res.signals.band_entry).toEqual({ axis: "intensity", from: 80, to: 88, band: "high" });
      expect(res.tier).toBe("story_character");
    });

    it("triggers on Signal B low-band entry (transitioning into <= 15)", () => {
      const prev = { fractal: { entropy: 20 } };
      const curr = { fractal: { entropy: 12 } };
      const res = evaluate_image_trigger(curr, prev);

      expect(res.triggered).toBe(true);
      expect(res.signals.band_entry).toEqual({ axis: "entropy", from: 20, to: 12, band: "low" });
      expect(res.tier).toBe("story_scene");
    });

    it("does not trigger when staying within an extreme band", () => {
      const prev = { ai: { intensity: 86 } };
      const curr = { ai: { intensity: 90 } };
      const res = evaluate_image_trigger(curr, prev);

      expect(res.triggered).toBe(false);
      expect(res.signals.band_entry).toBeNull();
    });

    it("triggers on Signal A displacement sum exceeding threshold (60)", () => {
      const prev = { ai: { intensity: 50, dominance: 50 }, fractal: { entropy: 50 } };
      const curr = { ai: { intensity: 75, dominance: 70 }, fractal: { entropy: 70 } };
      const res = evaluate_image_trigger(curr, prev);

      expect(res.triggered).toBe(true);
      expect(res.signals.displacement).toBe(65);
      expect(res.tier).toBe("story_scene");
    });

    it("handles non-finite values safely without crashing", () => {
      const prev = { ai: { intensity: NaN } };
      const curr = { ai: { intensity: 50 } };
      const res = evaluate_image_trigger(curr, prev);

      expect(res.triggered).toBe(false);
    });
  });

  describe("resolve_image_trigger (Dual-Source & Decoupled Cooldown Orchestration)", () => {
    it("resolves dynamics trigger when dynamics cooldown has elapsed", () => {
      const snapshot = { ai: { dynamics: { intensity: 90 } } };
      const prev_dynamics = { ai: { intensity: 50 } };
      const res = resolve_image_trigger({
        snapshot,
        prev_dynamics,
        director_data: {},
        turn_round: 4,
        last_director_beat_round: -1,
        last_dynamics_beat_round: 0,
      });

      expect(res.active).toBe(true);
      expect(res.tier).toBe("story_character");
      expect(res.source).toBe("dynamics");
      expect(res.next_dynamics_round).toBe(4);
      expect(res.next_director_round).toBeNull();
    });

    it("suppresses dynamics trigger when dynamics cooldown is active (3 rounds)", () => {
      const snapshot = { ai: { dynamics: { intensity: 90 } } };
      const prev_dynamics = { ai: { intensity: 50 } };
      const res = resolve_image_trigger({
        snapshot,
        prev_dynamics,
        director_data: {},
        turn_round: 2,
        last_director_beat_round: -1,
        last_dynamics_beat_round: 1,
      });

      expect(res.active).toBe(false);
      expect(res.tier).toBeNull();
    });

    it("allows director explicit trigger on 2-round cooldown even if dynamics is on 3-round cooldown", () => {
      const snapshot = { ai: { dynamics: { intensity: 50 } } };
      const prev_dynamics = { ai: { intensity: 50 } };
      const res = resolve_image_trigger({
        snapshot,
        prev_dynamics,
        director_data: { trigger_image: "story_entities" },
        turn_round: 3,
        last_director_beat_round: 1,
        last_dynamics_beat_round: 2,
      });

      expect(res.active).toBe(true);
      expect(res.tier).toBe("story_entities");
      expect(res.source).toBe("director");
      expect(res.next_director_round).toBe(3);
    });
  });
});

describe("optics.js — Aesthetic Map & Prompt Composition", () => {
  describe("constants", () => {
    it("exports frozen VISUAL_EXCLUDED_KEYS set", () => {
      expect(VISUAL_EXCLUDED_KEYS).toBeInstanceOf(Set);
      expect(VISUAL_EXCLUDED_KEYS.has("INVENTORY")).toBe(true);
      expect(VISUAL_EXCLUDED_KEYS.has("STASH")).toBe(true);
      expect(VISUAL_EXCLUDED_KEYS.has("SECRET")).toBe(true);
      expect(VISUAL_EXCLUDED_KEYS.has("PLAN")).toBe(true);
      expect(VISUAL_EXCLUDED_KEYS.has("STATUS")).toBe(true);
      expect(Object.isFrozen(VISUAL_EXCLUDED_KEYS)).toBe(true);
    });

    it("exports frozen ORDERED_VISUAL_STYLE_KEYS array", () => {
      expect(Array.isArray(ORDERED_VISUAL_STYLE_KEYS)).toBe(true);
      expect(ORDERED_VISUAL_STYLE_KEYS).toEqual([
        "_visual_style_medium",
        "_visual_style_palette",
        "_visual_style_camera",
        "_visual_style_composition",
        "_visual_style_texture",
        "_visual_style_tags",
      ]);
      expect(Object.isFrozen(ORDERED_VISUAL_STYLE_KEYS)).toBe(true);
    });
  });

  describe("strip_visual_excluded", () => {
    it("returns empty string for falsy input", () => {
      expect(strip_visual_excluded("")).toBe("");
      expect(strip_visual_excluded(null)).toBe("");
      expect(strip_visual_excluded(undefined)).toBe("");
    });

    it("preserves raw prose strings that are not pseudo-json brackets", () => {
      const raw = "A towering cybernetic titan with glowing amber optical sensors.";
      expect(strip_visual_excluded(raw)).toBe(raw);
    });

    it("strips excluded keys and preserves visual keys", () => {
      const input = "[SHIRT: black leather jacket] [INVENTORY: keycard, blaster] [EYES: icy blue] [SECRET: undercover spy]";
      const result = strip_visual_excluded(input);
      expect(result).toContain("[SHIRT: black leather jacket]");
      expect(result).toContain("[EYES: icy blue]");
      expect(result).not.toContain("INVENTORY");
      expect(result).not.toContain("SECRET");
    });
  });

  describe("build_aesthetic_map", () => {
    it("merges eternal and present traits while respecting clothing overrides", () => {
      const entity = {
        name: "Test Subject",
        signature_color: "Electric Cyan",
        eternal: {
          physical: "[BUILD: lean athletic] [JACKET: worn brown duster] [EYES: silver]",
        },
        present: {
          physical: "[CLOTHING: none] [POSTURE: defensive]",
        },
      };

      const map = build_aesthetic_map(entity);
      expect(map.BUILD).toBe("lean athletic");
      expect(map.EYES).toBe("silver");
      expect(map.POSTURE).toBe("defensive");
      expect(map.JACKET).toBeUndefined();
      expect(map.aesthetic).toContain("#11aecc");
    });
  });

  describe("compose_visual_generation_prompt", () => {
    it("assembles positive tokens and deduplicates negative tokens", () => {
      const { prompt, negative_prompt } = compose_visual_generation_prompt({
        prompt: "A neon lit alleyway in rain",
        style_key: "none",
        is_character_shot: false,
        base_negative_prompt: "blurry, low resolution, ugly",
      });

      expect(prompt).toBe("A neon lit alleyway in rain");
      expect(negative_prompt).toContain("blurry");
      expect(negative_prompt).toContain("low resolution");
      expect(negative_prompt).toContain("ugly");
    });
  });

  describe("aesthetic_resolver", () => {
    it("extracts formatted JSON properties", () => {
      const entity = {
        name: "Silvers",
        signature_color: "Electric Cyan",
        eternal: { physical: "[BUILD: athletic] [HAIR: silver]" },
      };
      const extracted = aesthetic_resolver.extract(entity);
      expect(extracted).toContain('"BUILD": "athletic"');
      expect(extracted).toContain('"HAIR": "silver"');
    });

    it("flattens entity physical traits into continuous descriptive sentences", () => {
      const entity = {
        type: "character",
        signature_color: "Electric Cyan",
        eternal: { physical: '{"height": "1.8m", "eyes": "glow blue"}' },
        present: { physical: '{"wears": "dark cloak"}' },
      };
      const flattened = aesthetic_resolver.flatten(entity);
      expect(flattened).toContain("1.8m");
      expect(flattened).toContain("glow blue");
      expect(flattened).toContain("dark cloak");
      expect(flattened).toContain("in color #11aecc");
    });
  });
});
