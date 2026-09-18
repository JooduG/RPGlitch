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
  compile_pipeline_prompt,
  prompt_builder,
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
// [SECTION 5: DECLARATIVE PIPELINE RUNNER & FACADE CONSOLIDATION]
// ============================================================================

describe("Declarative Pipeline Runner & Facade Consolidation", () => {
  it("compiles director prompt via compile_pipeline_prompt without duplicate schema in protocols", () => {
    const director_package = compile_pipeline_prompt("director", {
      round: 1,
      entities: test_entities,
      input: "Bob scans the perimeter.",
    });

    expect(director_package.system).toContain("<SYSTEM");
    expect(director_package.system).toContain('mode="director"');
    expect(director_package.system).toContain("<CORE_PROTOCOLS>");
    // Schema should NOT be inside <CORE_PROTOCOLS> in system
    expect(director_package.system).not.toContain("<SCHEMA>");
    // Schema should be inside task
    expect(director_package.task).toContain('<OUTPUT_FORMAT mode="json">');
    expect(director_package.task).toContain('"next_action"');
  });

  it("compiles director_terse mode via compile_pipeline_prompt", () => {
    const terse_package = compile_pipeline_prompt("director_terse", {
      round: 2,
    });

    expect(terse_package.system).toContain("<SYSTEM");
    expect(terse_package.task).toContain("<TASK>");
    expect(terse_package.task).toContain('<OUTPUT_FORMAT mode="json">');
    expect(terse_package.task).toContain('"next_action"');
  });

  it("compiles continuum mode via compile_pipeline_prompt", () => {
    const continuum_package = compile_pipeline_prompt("continuum", {
      target_entity: test_entities.AI,
      target_key: "AI_CHARACTER",
      other_entities: test_entities,
      history: [],
    });

    expect(continuum_package.system).toContain('role="CONTINUUM_CARETAKER"');
    expect(continuum_package.system).toContain("<TARGET_ENTITY_CONTEXT>");
  });

  it("compiles enhancement and sorting via compile_pipeline_prompt", () => {
    const enhancement_package = compile_pipeline_prompt("enhancement", {
      enhancer: "VOICE",
      label: "Personality",
      directive: "Expand vocal cadence",
      content: "Terse, dry.",
      field_id: "eternal.non_physical",
      layer_key: "ETERNAL",
      entity: test_entities.AI,
      entity_type: "character",
    });
    expect(enhancement_package.system).toContain('enhancing="Personality"');

    const sorting_package = compile_pipeline_prompt("sorting", {
      entity_type: "character",
      options: {},
      input_data: "Raw bio text",
    });
    expect(sorting_package.system).toContain('role="NARRATIVE_STRUCTURER"');
    expect(sorting_package.messages.length).toBe(1);
  });

  it("compiles optics mode via compile_pipeline_prompt", () => {
    const optics_package = compile_pipeline_prompt("optics", {
      subject_name: "Alice",
      prompt_context: "Standing on the catwalk in neon rain",
      is_selfie: false,
    });

    expect(optics_package.system).toContain('role="SENSORY_CORTEX"');
    expect(optics_package.task).toContain("<TASK>");
    expect(optics_package.task).toContain('<OUTPUT_FORMAT mode="json">');
    expect(optics_package.task).toContain('"prompt"');
    expect(optics_package.task).toContain('"negative_prompt"');
  });

  it("unifies character, npc, narrator, prologue, and ghostwrite via build_story_prose", () => {
    // 1. Canonical Character
    const character_result = prompt_builder.build_story_prose({
      round: 1,
      entities: test_entities,
      input: "Alice prepares to move.",
    });
    expect(character_result.system).toContain('mode="interaction"');

    // 2. NPC
    const npc_result = prompt_builder.build_story_prose({ round: 1, entities: test_entities, input: "Merchant glances around." }, { npc: test_npc });
    expect(npc_result.system).toContain('mode="npc"');

    // 3. Narrator (continuation)
    const narrator_result = prompt_builder.build_story_prose({ round: 1, entities: test_entities, input: "The wind howls." }, { is_narrator: true });
    expect(narrator_result.system).toContain('mode="narrator"');

    // 4. Prologue
    const prologue_result = prompt_builder.build_story_prose({ round: 0, entities: test_entities }, { is_prologue: true });
    expect(prologue_result.system).toContain('mode="narrator"');

    // 5. Epilogue
    const epilogue_result = prompt_builder.build_story_prose(
      { entities: test_entities, simulation_log: [] },
      { is_epilogue: true, conclusion_status: "CONCLUDED" },
    );
    expect(epilogue_result.system).toContain('mode="narrator"');

    // 6. Ghostwriter
    const ghostwriter_result = prompt_builder.build_story_prose({ entities: test_entities, input: "I steady my aim." }, { ghostwrite: true });
    expect(ghostwriter_result.system).toContain('mode="ghostwrite"');
  });

  it("exposes build_continuum and build_sorting as unified facade methods", () => {
    const continuum_result = prompt_builder.build_continuum(test_entities.AI, []);
    expect(continuum_result.system).toContain('role="CONTINUUM_CARETAKER"');

    const sorting_result = prompt_builder.build_sorting("raw text", "character");
    expect(sorting_result.system).toContain('role="NARRATIVE_STRUCTURER"');
  });
});

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
 * - 2026-09-18: Added Section 5 tests covering `compile_pipeline_prompt` (director, director_terse, continuum, enhancement, sorting, optics) and `build_story_prose` unification.
 * - 2026-09-17: Remediation pass — Added regression tests for PROTOCOL_LIBRARY.HYGIENE.AFFIRMATIVE_FRAMING, SIMULATION_FIDELITY permissive clause, and Director USER_PERSONA_LOCK prompt invariants.
 * - 2026-09-15: Initialized comprehensive builder.test.js unit suite covering narrator style resolution regression, symmetrical Shot-2A compilation, <SIGNATURE_ELEMENTS> tag standardization, and parameter-aware Layer 7 schema routing.
 */
