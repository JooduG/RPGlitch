/**
 * src/intelligence/modules/sensory.test.js
 * ============================================================================
 * SENSORY MODULE UNIT TESTS — Optics Catalog, Cinematography & Entities
 * ============================================================================
 *
 * Validates the sensory cortex after the Phase 3 domain re-cut:
 * 1. Deterministic optics fallback compiler (moved from builder.test.js)
 * 2. Cinematography preset resolution and narrative context (moved from task.test.js)
 * 3. CINEMATOGRAPHY_RULES descriptor table (moved from task.test.js)
 * 4. Optics entities XML assembly across tiers
 * 5. Sensory atom resolution (OPTICS-prefixed and bare keys)
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import {
  SENSORY_LIBRARY,
  CINEMATOGRAPHY_RULES,
  get_sensory_atom,
  resolve_optics_subject,
  resolve_optics_cinematography,
  render_optics_entities_xml,
  render_optics_fallback,
} from "./sensory.js";

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
// [SECTION 2: CINEMATOGRAPHY RESOLUTION]
// ============================================================================

describe("resolve_optics_cinematography", () => {
  it("resolves optics cinematography mode, tokens, and context correctly", () => {
    const solo = resolve_optics_cinematography({
      tier: "solo_entity",
      solo_subject: { name: "Alice", type: "character" },
    });
    expect(solo.mode).toBe("Solo Portrait");
    expect(solo.tokens).toContain("medium portrait framing");

    const close_up = resolve_optics_cinematography({
      tier: "story_character",
      active_ai_character: { name: "Bob", dynamics: { intensity: 80 } },
    });
    expect(close_up.mode).toBe("Intimate Close-Up");

    const dutch = resolve_optics_cinematography({
      tier: "story_character",
      active_ai_character: { name: "Bob", dynamics: { chaos: 90 } },
    });
    expect(dutch.mode).toBe("Dutch / Low-Angle");

    const environmental = resolve_optics_cinematography({
      tier: "story_scene",
      active_fractal_setting: { name: "Neon City" },
    });
    expect(environmental.mode).toBe("Wide Environmental");

    const group = resolve_optics_cinematography({
      tier: "story_entities",
      active_ai_character: { name: "Aria" },
      active_user_persona: { name: "Protagonist" },
      visual_staging: "side by side under neon light",
    });
    expect(group.narrative_context).toContain("Group Mandate: Feature both Aria and Protagonist");
    expect(group.visual_staging).toContain("Staging Directive: side by side under neon light");

    // Direct assertions on SENSORY_LIBRARY.CINEMATOGRAPHY
    expect(SENSORY_LIBRARY.CINEMATOGRAPHY.PRESETS.WIDE_ENVIRONMENTAL.mode).toBe("Wide Environmental");
    expect(SENSORY_LIBRARY.CINEMATOGRAPHY.PRESETS.DUTCH_LOW_ANGLE.mode).toBe("Dutch / Low-Angle");
    expect(SENSORY_LIBRARY.CINEMATOGRAPHY.PRESETS.INTIMATE_CLOSE_UP.mode).toBe("Intimate Close-Up");
    expect(SENSORY_LIBRARY.CINEMATOGRAPHY.PRESETS.MEDIUM_ACTION.mode).toBe("Medium Action");
    expect(SENSORY_LIBRARY.CINEMATOGRAPHY.PRESETS.SOLO_PORTRAIT.mode).toBe("Solo Portrait");
    expect(get_sensory_atom("OPTICS.CINEMATOGRAPHY.STAGING_DIRECTIVE", { visual_staging: "look left" })).toBe("\n  Staging Directive: look left");
    expect(resolve_optics_cinematography({ tier: "solo_entity" }).visual_staging).toBe("");
  });
});

describe("CINEMATOGRAPHY_RULES descriptor table", () => {
  it("declares ordered single-constraint rows with a MEDIUM_ACTION tail", () => {
    expect(CINEMATOGRAPHY_RULES.map((rule) => rule.preset)).toEqual([
      "WIDE_ENVIRONMENTAL",
      "DUTCH_LOW_ANGLE",
      "INTIMATE_CLOSE_UP",
      "INTIMATE_CLOSE_UP",
      "SOLO_PORTRAIT",
    ]);
    expect(Object.isFrozen(CINEMATOGRAPHY_RULES)).toBe(true);
  });

  it("falls back to MEDIUM_ACTION when no row matches", () => {
    const neutral = resolve_optics_cinematography({
      tier: "story_character",
      active_ai_character: { name: "Bob", dynamics: { intensity: 10, chaos: 10, affinity: 10 } },
    });
    expect(neutral.mode).toBe("Medium Action");
  });

  it("keeps affinity-driven close-ups matching intensity-driven ones", () => {
    const by_affinity = resolve_optics_cinematography({
      tier: "story_character",
      active_ai_character: { name: "Bob", dynamics: { intensity: 10, chaos: 10, affinity: 80 } },
    });
    expect(by_affinity.mode).toBe("Intimate Close-Up");
  });
});

// ============================================================================
// [SECTION 3: SENSORY ATOMS & SUBJECT TIERS]
// ============================================================================

describe("get_sensory_atom", () => {
  it("resolves OPTICS-prefixed and bare keys against the sensory catalog", () => {
    expect(get_sensory_atom("OPTICS.MANDATE", { subject_description: "a portrait" })).toContain("a portrait");
    expect(get_sensory_atom("MANDATE", { subject_description: "a portrait" })).toContain("a portrait");
    expect(get_sensory_atom("NOPE.MISSING")).toBe("");
  });
});

describe("resolve_optics_subject", () => {
  it("prefers an explicit subject and falls back through the tier table", () => {
    expect(resolve_optics_subject("story_scene", "")).toContain("expansive landscape");
    expect(resolve_optics_subject("story_scene", "custom framing")).toBe("custom framing");
    expect(resolve_optics_subject("unknown_tier", "")).toBe(SENSORY_LIBRARY.SUBJECT_TIERS.story_character);
  });
});

// ============================================================================
// [SECTION 4: OPTICS ENTITIES XML]
// ============================================================================

describe("render_optics_entities_xml", () => {
  it("renders the solo-entity cast block for a single subject", () => {
    const xml = render_optics_entities_xml({
      tier: "solo_entity",
      solo_subject: test_entities.AI,
      macro_entities: { AI: test_entities.AI, USER: null, FRACTAL: test_entities.FRACTAL },
    });
    expect(xml).toContain("SOLO_ENTITY");
    expect(xml).toContain("Alice");
  });

  it("renders the story-entities cast with fractal context", () => {
    const xml = render_optics_entities_xml({
      tier: "story_entities",
      active_ai_character: test_entities.AI,
      active_user_persona: null,
      active_fractal_setting: test_entities.FRACTAL,
      macro_entities: { AI: test_entities.AI, USER: null, FRACTAL: test_entities.FRACTAL },
    });
    expect(xml).toContain("AI_CHARACTER");
    expect(xml).toContain("FRACTAL");
  });
});

/**
 * CHANGELOG
 * - 2026-10-07: Modules Ground Refactor Phase 3 — new sensory test suite (fallback coverage from builder.test.js, cinematography and descriptor-table coverage from task.test.js, plus direct optics-entities, atom, and subject-tier coverage).
 */
