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
import {
  SUBJECT_TIERS,
  resolve_optics_subject,
  render_optics_entities_xml,
  render_memory_advisory_xml,
  resolve_memory_advisory_slot,
} from "./entities.js";
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

describe("Track 2.4 memory advisory slot", () => {
  const facts = [
    { text: "Sworn oath at the docks", source: "origin" },
    { text: "Descent — Entered the cavern", source: "chapter" },
  ];

  it("renders the MEMORY_ADVISORY block with numbered settled facts", () => {
    const xml = render_memory_advisory_xml(facts);
    expect(xml).toContain("<MEMORY_ADVISORY>");
    expect(xml).toContain("# ALREADY REMEMBERED");
    expect(xml).toContain("1. Sworn oath at the docks");
    expect(xml).toContain("2. Descent — Entered the cavern");
    expect(xml).toContain("</MEMORY_ADVISORY>");
  });

  it("renders empty string when no settled facts exist", () => {
    expect(render_memory_advisory_xml([])).toBe("");
    expect(render_memory_advisory_xml(null)).toBe("");
    expect(resolve_memory_advisory_slot({}, { memory_advisory_args: { enabled: true, facts: [] } })).toBe("");
    expect(resolve_memory_advisory_slot({}, { memory_advisory_args: { enabled: false, facts } })).toBe("");
  });

  it("seals facts through the slot resolver when enabled", () => {
    const sealed = resolve_memory_advisory_slot({}, { memory_advisory_args: { enabled: true, facts } });
    expect(sealed).toContain("<MEMORY_ADVISORY>");
    expect(sealed).toContain("# ALREADY REMEMBERED");
  });
});
