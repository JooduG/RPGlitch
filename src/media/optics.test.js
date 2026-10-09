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
  get_resolution,
  get_tier_guidance_scale,
  normalize_image_tier,
  render_optics_fallback,
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

    it("biases director tier to story_character when visual_staging specifies intimate/close-up framing", () => {
      const snapshot = { ai: { dynamics: { intensity: 50 } } };
      const prev_dynamics = { ai: { intensity: 50 } };
      const res = resolve_image_trigger({
        snapshot,
        prev_dynamics,
        director_data: {
          trigger_image: true,
          visual_staging: "Tight close-up on Sylvia's face and eyes as she holds her breath in confrontation.",
        },
        turn_round: 5,
        last_director_beat_round: 2,
        last_dynamics_beat_round: 2,
      });

      expect(res.active).toBe(true);
      expect(res.tier).toBe("story_character");
      expect(res.source).toBe("director");
    });

    it("biases tier to story_character when emotional dynamics reflect extreme intensity or affinity", () => {
      const snapshot = { ai: { dynamics: { intensity: 82, affinity: 40 } } };
      const prev_dynamics = { ai: { intensity: 82, affinity: 40 } };
      const res = resolve_image_trigger({
        snapshot,
        prev_dynamics,
        director_data: {
          trigger_image: true,
        },
        turn_round: 5,
        last_director_beat_round: 2,
        last_dynamics_beat_round: 2,
      });

      expect(res.active).toBe(true);
      expect(res.tier).toBe("story_character");
      expect(res.source).toBe("director");
    });

    it("preserves story_scene when visual_staging explicitly requests panoramic environmental framing despite high intensity", () => {
      const snapshot = { ai: { dynamics: { intensity: 85, affinity: 40 } } };
      const prev_dynamics = { ai: { intensity: 85, affinity: 40 } };
      const res = resolve_image_trigger({
        snapshot,
        prev_dynamics,
        director_data: {
          trigger_image: true,
          visual_staging: "Wide panoramic landscape of the burning research sector across the horizon.",
        },
        turn_round: 5,
        last_director_beat_round: 2,
        last_dynamics_beat_round: 2,
      });

      expect(res.active).toBe(true);
      expect(res.tier).toBe("story_scene");
      expect(res.source).toBe("director");
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

const test_entities = {
  AI: {
    id: "ALICE",
    name: "Alice",
    type: "character",
    pov: "1st_person",
    eternal: {
      physical: "[BUILD: tall and athletic]",
      non_physical: "Analytical cybernetic specialist.",
    },
    present: {
      physical: "[JACKET: worn leather] [POSTURE: alert]",
      non_physical: "Guarded vigilance.",
    },
    future: "Infiltrate the mainframe.",
    past: [],
    relationships: ["Alice -> Bob: guarded trust"],
    dynamics: { chaos: 30, intensity: 70, openness: 40, affinity: 20 },
  },
  FRACTAL: {
    id: "SECTOR_FOUR",
    name: "Sector Four",
    type: "fractal",
    eternal: {
      physical: "[LANDMARKS: rusted catwalks] [ATMOSPHERE: neon haze]",
      non_physical: "Degraded industrial district.",
    },
    present: {
      physical: "[WEATHER: acid drizzle]",
      non_physical: "Hostile and oppressive.",
    },
    future: "Decay under acid rain.",
    past: [],
    dynamics: { velocity: 50, entropy: 80 },
  },
};

// ============================================================================

// [SECTION 1: OPTICS FALLBACK COMPILER]
// ============================================================================

describe("render_optics_fallback()", () => {
  it("builds an <image_prompt> grounded in the setting entity for scene tiers", () => {
    const fallback = render_optics_fallback({ tier: "story_scene", subject: "ai", fractal: test_entities.FRACTAL });
    expect(fallback).toContain("<image_prompt>");
    expect(fallback).toContain("</image_prompt>");
    expect(fallback).toContain(test_entities.FRACTAL.name);
  });

  it("situates a story_character inside the fractal setting", () => {
    const fallback = render_optics_fallback({ tier: "story_character", subject: "ai", ai: test_entities.AI, fractal: test_entities.FRACTAL });
    expect(fallback).toContain(test_entities.AI.name);
    expect(fallback).toContain(test_entities.FRACTAL.name);
  });
});

// ============================================================================
