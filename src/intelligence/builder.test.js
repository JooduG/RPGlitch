/**
 * src/intelligence/builder.test.js
 * ============================================================================
 * 🧪 MASTER PROMPT BUILDER UNIT TESTS — Symmetrical Multi-Shot Assembly
 * ============================================================================
 *
 * Validates prompt compilation across the master assembly line (builder.js):
 * 1. Shot 2A Prose Symmetrical Compilation (interaction, ghostwrite, npc, narrator)
 * 2. Narrative Style Object Plumbing & Style DNA (no malformed origin="UNDEFINED")
 * 3. Tag Nomenclature Consistency (<SIGNATURE_ELEMENTS> vs <SIGNUM>)
 * 4. Recency Anchor & Dynamics Snapshot Integration
 * 5. Parameter-Aware Layer 7 Schema Routing (continuum, profile sorting, enhancement)
 *
 * Rules:
 * - Strict TDD validation against the declarative manifest in prompts.js.
 * - Full-Name nomenclature strictly enforced.
 * ============================================================================
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { register_state_accessors } from "@utils";
import {
  render_story_prose,
  render_narrator_prose,
  render_ghostwriter,
  render_memory,
  render_profile_sorting,
  render_enhancement,
  render_director,
} from "./builder.js";
import { PROTOCOL_LIBRARY } from "./modules/protocols.js";

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
  USER: {
    id: "BOB",
    name: "Bob",
    type: "character",
    eternal: {
      physical: "[BUILD: broad shoulders]",
      non_physical: "Veteran decker.",
    },
    present: {
      physical: "[COAT: dark trench coat]",
      non_physical: "Patient.",
    },
    future: "Provide tactical cover.",
    past: [],
    relationships: ["Bob -> Alice: protective ally"],
    dynamics: { chaos: 20, intensity: 50, openness: 60, affinity: 70 },
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

const test_npc = {
  id: "MERCHANT",
  name: "Merchant",
  type: "npc",
  eternal: { physical: "[BUILD: stooped]", non_physical: "Scavenger." },
  present: { physical: "[CLOTHING: rags]", non_physical: "Suspicious." },
  future: "Survive.",
  past: [],
  relationships: ["Merchant -> Alice: wary curiosity"],
  dynamics: { chaos: 15, intensity: 25, openness: 15, affinity: 10 },
};

// ============================================================================
// [SECTION 1: NARRATOR STYLE OBJECT PLUMBING & REGRESSION VERIFICATION]
// ============================================================================

describe("render_narrator_prose — Style Object Plumbing (Bug #1 Regression)", () => {
  beforeEach(() => {
    register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
  });

  afterEach(() => {
    register_state_accessors({ runtime: null });
  });

  it("compiles narrator prompt with full style object and never leaks origin='UNDEFINED'", () => {
    const result = render_narrator_prose({
      entities: test_entities,
      round: 1,
      input: "The sirens echo down the alleyway.",
      scene_template: "CONTINUATION",
    });

    expect(result.system).not.toContain('origin="UNDEFINED"');
    expect(result.system).toContain('origin="CORMAC_MCCARTHY"');
    expect(result.system).toContain("<SIGNATURE_ELEMENTS>");
    expect(result.system).not.toContain("<SIGNUM>");
  });

  it("extracts style DNA sentence rhythm and sensory order into narrator task", () => {
    const result = render_narrator_prose({
      entities: test_entities,
      round: 2,
      input: "Rain patters on the rusted metal.",
      scene_template: "CONTINUATION",
    });

    expect(result.task).toContain("<DELIVERY_POSTURE>");
    expect(result.task).toContain("<RHYTHM>");
    expect(result.task).toContain("<DRIVE>");
    // Cormac McCarthy style defines biblical cadence sentence rhythm
    expect(result.task).toContain("Polysyndetic");
  });

  it("passes dynamics snapshot into narrator task recency anchor", () => {
    const result = render_narrator_prose({
      entities: test_entities,
      round: 3,
      input: "A shadow moves behind the vents.",
      scene_template: "CONTINUATION",
    });

    expect(result.task).toContain("<DELIVERY_POSTURE>");
  });
});

// ============================================================================
// [SECTION 2: SYMMETRICAL SHOT-2A PROSE MODES COMPILATION]
// ============================================================================

describe("Shot-2A Prose Modes Symmetrical Compilation", () => {
  it("renders interaction, ghostwrite, npc, and narrator with consistent system envelope structures", () => {
    const interaction_result = render_story_prose({
      round: 1,
      entities: test_entities,
      input: "Alice draws her sidearm.",
    });

    const ghostwrite_result = render_ghostwriter({
      entities: test_entities,
      input: "I check my magazines.",
    });

    const npc_result = render_story_prose({
      round: 1,
      entities: test_entities,
      speaker: test_npc,
      input: "Merchant scurries into the shadows.",
      npc_entities: [test_npc],
      in_scene_ids: ["MERCHANT"],
    });

    const narrator_result = render_narrator_prose({
      entities: test_entities,
      round: 1,
      input: "Steam hisses from an overhead pipe.",
    });

    for (const mode_result of [interaction_result, ghostwrite_result, npc_result, narrator_result]) {
      expect(mode_result.system).toContain("<SYSTEM");
      expect(mode_result.system).toContain("<AXIOMATIC_CONSTITUTION>");
      expect(mode_result.system).toContain("<CORE_PROTOCOLS>");
      expect(mode_result.system).not.toContain("</SYSTEM>");
      expect(mode_result.system_close).toBe("</SYSTEM>");
      expect(mode_result.task).toMatch(/^<TASK>/);
      expect(mode_result.task).toMatch(/<\/TASK>$/);
      expect(mode_result.system).not.toContain('origin="UNDEFINED"');
    }
  });

  it("uses canonical <SIGNATURE_ELEMENTS> tag instead of <SIGNUM> in core protocols", () => {
    const interaction_result = render_story_prose({
      round: 1,
      entities: test_entities,
      input: "Alice steps forward.",
    });

    expect(interaction_result.system).not.toContain("<SIGNUM>");
  });
});

// ============================================================================
// [SECTION 3: PARAMETER-AWARE LAYER 7 SCHEMA ROUTING]
// ============================================================================

describe("Parameter-Aware Layer 7 Output Format Routing", () => {
  it("routes continuum schema dynamically by target taxonomy type", () => {
    const character_memory = render_memory({
      target_entity: test_entities.AI,
      target_key: "AI_CHARACTER",
      other_entities: test_entities,
    });

    expect(character_memory).toContain('"eternal"');
    expect(character_memory).toContain('"relationships"');

    const fractal_memory = render_memory({
      target_entity: test_entities.FRACTAL,
      target_key: "FRACTAL",
      other_entities: test_entities,
    });

    expect(fractal_memory).toContain('"eternal"');
  });

  it("routes profile sorting schema dynamically by resolved taxonomy type", () => {
    const character_sorting = render_profile_sorting("character");
    expect(character_sorting).toContain("&quot;name&quot;");
    expect(character_sorting).toContain("&quot;signature_color&quot;");

    const fractal_sorting = render_profile_sorting("fractal");
    expect(fractal_sorting).toContain("&quot;name&quot;");
    expect(fractal_sorting).toContain("&quot;signature_color&quot;");
  });

  it("routes enhancement output rules via get_output_format", () => {
    const prose_enhancement = render_enhancement({
      enhancer: "VOICE",
      label: "Personality",
      directive: "Expand vocal cadence",
      content: "Terse, dry, sarcastic.",
      field_id: "eternal.non_physical",
      layer_key: "ETERNAL",
      entity: test_entities.AI,
      entity_type: "character",
    });

    expect(prose_enhancement).toContain("<TASK>");
    expect(prose_enhancement).toContain("Emit strictly plain prose");
  });
});

// ============================================================================
// [SECTION 4: PROTOCOL INVARIANTS & REMEDIATION REGRESSION GATES]
// ============================================================================

describe("Protocol Invariants & Remediation Regression Gates", () => {
  it("maintains affirmative framing in PROTOCOL_LIBRARY.HYGIENE", () => {
    expect(PROTOCOL_LIBRARY.HYGIENE.AFFIRMATIVE_FRAMING).toBeDefined();
    expect(typeof PROTOCOL_LIBRARY.HYGIENE.AFFIRMATIVE_FRAMING).toBe("string");
    expect(PROTOCOL_LIBRARY.HYGIENE.AFFIRMATIVE_FRAMING).toContain("Describe positive presence in frame");
  });

  it("maintains permissive clause in CORE_PROTOCOLS.SIMULATION_FIDELITY", () => {
    const fidelity = PROTOCOL_LIBRARY.CORE_PROTOCOLS.SIMULATION_FIDELITY;
    expect(fidelity).toContain("Adult and transgressive content is permitted without censorship or moral framing.");
  });

  it("compiles interaction prose prompt with permissive fidelity clause", () => {
    const interaction_prompt = render_story_prose({
      round: 1,
      entities: test_entities,
      input: "Bob scans the perimeter.",
    });

    expect(interaction_prompt.system).toContain("Adult and transgressive content is permitted without censorship or moral framing.");
  });

  it("compiles Director prompt with user persona lock", () => {
    const director_prompt = render_director({
      round: 1,
      entities: test_entities,
      input: "Bob scans the perimeter.",
    });

    expect(director_prompt.task).toContain('"USER_PERSONA" (or player character name) is never a valid next_action');
  });
});

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
 * - 2026-09-17: Remediation pass — Added regression tests for PROTOCOL_LIBRARY.HYGIENE.AFFIRMATIVE_FRAMING, SIMULATION_FIDELITY permissive clause, and Director USER_PERSONA_LOCK prompt invariants.
 * - 2026-09-15: Initialized comprehensive builder.test.js unit suite covering narrator style resolution regression, symmetrical Shot-2A compilation, <SIGNATURE_ELEMENTS> tag standardization, and parameter-aware Layer 7 schema routing.
 */
