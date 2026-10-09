/**
 * src/intelligence/modules/entities.test.js
 * ============================================================================
 * ENTITIES OPTICS TESTS — Subject Tiers, Optics Atoms & Entities XML
 * ============================================================================
 *
 * Track 0.11: redistributed from sensory.test.js (sensory.js dissolved) -
 * subject/atom/entities-XML coverage lives with presence and assembly;
 * cinematography lives in style.test.js, triggers in physics.test.js,
 * fallback in media/optics.test.js.
 */

import { describe, expect, it } from "vitest";
import { SUBJECT_TIERS, resolve_optics_subject, render_optics_entities_xml } from "./entities.js";
import { resolve_optics_atom } from "./protocols.js";

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

// [SECTION 3: OPTICS ATOMS & SUBJECT TIERS]
// ============================================================================

describe("resolve_optics_atom", () => {
  it("resolves OPTICS-prefixed and bare keys against the sensory catalog", () => {
    expect(resolve_optics_atom("OPTICS.MANDATE", { subject_description: "a portrait" })).toContain("a portrait");
    expect(resolve_optics_atom("MANDATE", { subject_description: "a portrait" })).toContain("a portrait");
    expect(resolve_optics_atom("NOPE.MISSING")).toBe("");
  });
});

describe("resolve_optics_subject", () => {
  it("prefers an explicit subject and falls back through the tier table", () => {
    expect(resolve_optics_subject("story_scene", "")).toContain("expansive landscape");
    expect(resolve_optics_subject("story_scene", "custom framing")).toBe("custom framing");
    expect(resolve_optics_subject("unknown_tier", "")).toBe(SUBJECT_TIERS.story_character);
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
