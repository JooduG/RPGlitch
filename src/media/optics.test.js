/**
 * @file src/media/optics.test.js
 * Unit tests for Sensory Cortex — Visual Optics Compiler, Taxonomy, Trigger Arbitration, and Aesthetic Synthesis.
 */

import { describe, expect, it } from "vitest";
import {
  IMAGE_TIERS,
  get_resolution,
  get_resolution_string,
  get_tier_guidance_scale,
  normalize_image_tier,
  resolve_image_trigger,
  render_optics_fallback,
  extract_aesthetic_traits,
} from "./optics.js";
import { IMAGE_TRIGGER } from "../config.js";
import { VISUAL_EXCLUDED_KEYS, strip_visual_excluded } from "@utils";

describe("optics.js — 4-Tier Image Taxonomy & Resolutions", () => {
  describe("constants", () => {
    it("exposes the 4 canonical image tiers", () => {
      expect(IMAGE_TIERS).toEqual(["story_entities", "story_character", "solo_entity", "story_scene"]);
    });

    it("defines IMAGE_TRIGGER.default_tier as story_scene", () => {
      expect(IMAGE_TRIGGER.default_tier).toBe("story_scene");
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

    it("exhaustively resolves every canonical tier in IMAGE_TIERS to an entry in TIER_RESOLUTIONS", () => {
      for (const tier of IMAGE_TIERS) {
        const res = get_resolution(tier);
        expect(res).toBeDefined();
        expect(res.width).toBeGreaterThan(0);
        expect(res.height).toBeGreaterThan(0);
        expect(get_resolution_string(tier)).toBe(`${res.width}x${res.height}`);
      }
    });

    it("resolves character/user profile alias to solo_entity (512x768) and fractal/scene alias to story_scene (768x512)", () => {
      expect(get_resolution_string("character")).toBe("512x768");
      expect(get_resolution_string("user")).toBe("512x768");
      expect(get_resolution_string("solo_entity")).toBe("512x768");

      expect(get_resolution_string("fractal")).toBe("768x512");
      expect(get_resolution_string("scene")).toBe("768x512");
      expect(get_resolution_string("story_scene")).toBe("768x512");
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

    it("allows director explicit trigger on 3-round cooldown when cooldown has elapsed", () => {
      const snapshot = { ai: { dynamics: { intensity: 50 } } };
      const prev_dynamics = { ai: { intensity: 50 } };
      const res = resolve_image_trigger({
        snapshot,
        prev_dynamics,
        director_data: { trigger_image: "story_entities" },
        turn_round: 4,
        last_director_beat_round: 1,
        last_dynamics_beat_round: 2,
      });

      expect(res.active).toBe(true);
      expect(res.tier).toBe("story_entities");
      expect(res.source).toBe("director");
      expect(res.next_director_round).toBe(4);
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

  it("renders a solo_entity portrait cleanly with default parameters", () => {
    const fallback = render_optics_fallback({ tier: "solo_entity", subject: "ai", ai: test_entities.AI, intent: "Close up portrait" });
    expect(fallback).toContain(`Close up portrait, ${test_entities.AI.name}`);
  });
});

describe("extract_aesthetic_traits()", () => {
  it("extracts ordered aesthetic traits as formatted JSON fields from character brackets", () => {
    const entity = {
      visual_style: "cyberpunk",
      eternal: { physical: "[HAIR: neon pink] [EYES: cybernetic blue]" },
      present: { physical: "[OUTFIT: chrome jacket] [INVENTORY: datapad | hide]" },
    };

    const traits = extract_aesthetic_traits(entity);
    expect(traits).toContain('"HAIR": "neon pink"');
    expect(traits).toContain('"EYES": "cybernetic blue"');
    expect(traits).toContain('"OUTFIT": "chrome jacket"');
    // Hidden inventory should be excluded by build_aesthetic_map VISUAL_EXCLUDED_KEYS
    expect(traits).not.toContain('"INVENTORY"');
  });

  it("handles empty entity by falling back to signature color aesthetic", () => {
    expect(extract_aesthetic_traits({})).toBe('  "aesthetic": "in color #ec4899"');
  });
});

// ============================================================================
