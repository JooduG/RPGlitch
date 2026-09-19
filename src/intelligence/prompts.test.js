/**
 * src/intelligence/prompts.test.js
 * 🎭 UNIT TESTS: PROMPTS MANIFEST & PROMPT MODES CONFIGURATION REGISTRY
 */

import { describe, expect, it } from "vitest";
import { PROMPTS as prompt_modes, get_prompt, resolve_prompt_mode, compile_prompt } from "./prompts.js";
import { render_story_prose, render_scene_narrator, MODE_ADAPTERS } from "./builder.js";
import { render_history } from "./modules/history.js";

const entities = {
  AI: {
    id: "BEAST",
    name: "Beast",
    type: "character",
    pov: "1st_person",
    eternal: {
      physical: "[BUILD: massive grey-green orc] [HAIR: dark with silver streaks at the temples]\n[DENTAL_FEATURES: perfectly white sharp fangs]",
      non_physical: "A brutal arena fighter.",
    },
    present: { physical: "[SHIRT: leather harness] [APPAREL: oiled cloth wraps] [POSTURE: coiled]", non_physical: "Protective and possessive." },
    future: "Break the challenger.",
    past: [],
    relationships: ["Beast -> Lord Benedict Silvers: wary respect", "Beast -> Absent Stranger: dread"],
    dynamics: { chaos: 40, intensity: 60, openness: 30, affinity: 20 },
  },
  USER: {
    id: "SILVERS",
    name: "Lord Benedict Silvers",
    type: "character",
    eternal: {
      physical: "[HAIR: dark with silver streaks at the temples]\n[DENTAL_FEATURES: perfectly white sharp fangs]",
      non_physical: "An ancient vampire.",
    },
    present: { physical: "[SUIT: charcoal suit]", non_physical: "Observing." },
    future: "Claim Beast.",
    past: [],
    relationships: ["Lord Benedict Silvers -> Beast: prized asset"],
    dynamics: { chaos: 20, intensity: 40, openness: 50, affinity: 60 },
  },
  FRACTAL: {
    id: "TARTARUS",
    name: "Project Tartarus",
    type: "fractal",
    eternal: { physical: "[LANDMARKS: rows of vat tanks] [VISUAL_THEME: sterile chrome]", non_physical: "A sterile station." },
    present: { physical: "[STATE: alert]", non_physical: "Cold." },
    future: "Drift.",
    past: [],
    dynamics: { velocity: 40, entropy: 60 },
  },
};

const npc = {
  id: "GAOLER",
  name: "Gaoler",
  type: "npc",
  eternal: { physical: "[BUILD: wiry]", non_physical: "A jailer." },
  present: { physical: "[SHIRT: mail]", non_physical: "Bored." },
  future: "Watch.",
  past: [],
  relationships: ["Gaoler -> Beast: contempt"],
  dynamics: { chaos: 10, intensity: 20, openness: 10, affinity: 5 },
};

function slice_sheet(system, tag) {
  const match = String(system).match(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`));
  return match ? match[0] : "";
}

function slice_axes(xml) {
  return (String(xml).match(/<DYNAMIC_AXES[\s\S]*?<\/DYNAMIC_AXES>/g) || []).join("\n");
}

function assert_fused_shape(result, mode) {
  const system = result.system;
  const task = result.task;
  expect((system.match(/<SYSTEM\b/g) || []).length).toBe(1);
  expect(system).not.toContain("</SYSTEM>");
  expect(system).toMatch(new RegExp(`<SYSTEM[^>]*mode="${mode}"`));
  expect(task.startsWith("<TASK>")).toBe(true);
  expect(task.endsWith("</TASK>")).toBe(true);
  expect(task).not.toMatch(/<TASK[^>]*mode=/);
  const axiom = system.indexOf("<AXIOMATIC_CONSTITUTION>");
  const core = system.indexOf("<CORE_PROTOCOLS>");
  expect(axiom).toBeGreaterThan(-1);
  expect(core).toBeGreaterThan(-1);
  expect(axiom).toBeLessThan(core);
  expect(system).toContain("<DISPOSITIONS>");
  return true;
}

const REQUIRED_MODULE_KEYS = ["system", "constitution", "protocols", "entities", "format", "task"];
const EXPECTED_PROMPT_KEYS = ["continuum", "director", "enhancement", "ghostwrite", "interaction", "narrator", "npc", "optics", "sorting"];

describe("prompt-modes registry", () => {
  it("defines all 6 module keys (system, constitution, protocols, entities, format, task) for every mode", () => {
    for (const [_key, mode] of Object.entries(prompt_modes)) {
      for (const key of REQUIRED_MODULE_KEYS) {
        expect(mode).toHaveProperty(key);
      }
      expect(typeof mode.system.mode).toBe("string");
      expect(typeof mode.constitution).toBe("boolean");
      expect(Array.isArray(mode.protocols)).toBe(true);
      expect(typeof mode.entities).toBe("object");
      expect(typeof mode.format === "string" || typeof mode.format === "object").toBe(true);
      expect(typeof mode.task).toBe("object");
    }
  });

  it("declares all 9 canonical simulation prompt keys", () => {
    expect(Object.keys(prompt_modes).sort()).toEqual(EXPECTED_PROMPT_KEYS.sort());
  });

  it("maps each builder to a known mode", () => {
    expect(resolve_prompt_mode().system.mode).toBe("interaction");
    expect(resolve_prompt_mode({ is_npc: true }).system.mode).toBe("npc");
    expect(resolve_prompt_mode({ ghostwrite: true }).system.mode).toBe("ghostwrite");
    expect(get_prompt("narrator").system.mode).toBe("narrator");
    expect(get_prompt("director").system.mode).toBe("director");
    expect(get_prompt("unknown-mode").system.mode).toBe("interaction");
  });

  it("declares the history layer only for continuum (its sole consumer)", () => {
    expect(prompt_modes.continuum.history).toEqual({ limit: 16 });
    for (const mode_key of ["director", "interaction", "ghostwrite", "npc", "narrator", "enhancement", "sorting", "optics"]) {
      expect(prompt_modes[mode_key].history).toBeNull();
    }
  });

  it("exposes only the live task key (think_format) across every mode", () => {
    for (const mode of Object.values(prompt_modes)) {
      expect(Object.keys(mode.task)).toEqual(["think_format"]);
    }
  });

  it("routes every manifest mode through the adapter table (no switch)", () => {
    expect(typeof MODE_ADAPTERS.prose).toBe("function");
    for (const mode_key of Object.keys(prompt_modes)) {
      expect(typeof (MODE_ADAPTERS[mode_key] || MODE_ADAPTERS.prose)).toBe("function");
    }
  });

  it("composes the Shot-2A prose protocol bundles without duplicated key lists", () => {
    const discipline = [
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.TYPOGRAPHY",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.PHYSICALITY",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.ANTI_TROPES",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.BANNED_CLICHES",
    ];
    const compose = (natural) => [
      "CORE_PROTOCOLS.SIMULATION_FIDELITY",
      "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT",
      ...discipline,
      ...(natural ? ["CORE_PROTOCOLS.PROSE_DISCIPLINE.NATURAL_DIALOGUE"] : []),
      "CORE_PROTOCOLS.ALTERNATION_OPTIONS",
    ];

    expect(prompt_modes.interaction.protocols).toEqual(compose(true));
    expect(prompt_modes.ghostwrite.protocols).toEqual(compose(true));
    expect(prompt_modes.npc.protocols).toEqual(compose(true));
    expect(prompt_modes.narrator.protocols).toEqual(compose(false));

    // POV is resolved by the single `resolve_pov_protocol` resolver — never baked into the manifest lists.
    for (const mode_key of ["interaction", "ghostwrite", "npc", "narrator"]) {
      expect(prompt_modes[mode_key].protocols.some((protocol) => protocol.includes(".POV."))).toBe(false);
    }
  });

  it("compiles prompt packages directly through compile_prompt switchboard", () => {
    // 1. Director shot
    const director_shot = compile_prompt("director", {
      round: 1,
      entities,
      input: "Beast moves.",
    });
    expect(director_shot.system).toContain('mode="director"');
    expect(director_shot.task).toContain("<TASK>");

    // 2. Prose shot (interaction)
    const interaction_shot = compile_prompt("interaction", {
      round: 1,
      entities,
      input: "Beast prepares.",
    });
    expect(interaction_shot.system).toContain('mode="interaction"');
    expect(interaction_shot.task).toContain("<TASK>");

    // 3. Continuum caretaker
    const continuum_shot = compile_prompt("continuum", {
      target_entity: entities.AI,
      target_key: "AI_CHARACTER",
      other_entities: entities,
      history: [],
    });
    expect(continuum_shot.system).toContain('mode="continuum"');

    // 4. Optics sensory cortex
    const optics_shot = compile_prompt("optics", {
      target_tier: "character",
      prompt_context: "Standing in neon light",
    });
    expect(optics_shot.system).toContain('mode="optics"');
  });
});

describe("fused rendering per mode", () => {
  it("renders the interaction mode", () => {
    const result = render_story_prose({ round: 3, entities, input: "Beast steps forward." });
    expect(assert_fused_shape(result, "interaction")).toBe(true);
  });

  it("renders the npc mode", () => {
    const result = render_story_prose({
      round: 4,
      entities,
      speaker: npc,
      input: "Gaoler sneers.",
      npc_entities: [npc],
      in_scene_ids: ["GAOLER"],
    });
    expect(assert_fused_shape(result, "npc")).toBe(true);
  });

  it("renders the ghostwrite mode", () => {
    const result = render_story_prose({ entities, input: "I step forward and bare my teeth.", ghostwrite: true });
    expect(assert_fused_shape(result, "ghostwrite")).toBe(true);
  });

  it("carries the <INPUT origin> inside the interaction task", () => {
    const interaction = render_story_prose({ round: 3, entities, input: "Beast steps forward." });
    expect(interaction.task).toContain('<INPUT origin="SILVERS" round="3" mode="action">Beast steps forward.</INPUT>');
  });

  it("strictly respects the manifest protocol list: interaction includes NATURAL_DIALOGUE, narrator omits it", () => {
    const interaction = render_story_prose({ round: 3, entities, input: "Beast steps forward." });
    expect(interaction.system).toContain("<NATURAL_DIALOGUE>");

    const narrator = render_scene_narrator({ entities, round: 1, input: "The station groans." });
    expect(narrator.system).not.toContain("<NATURAL_DIALOGUE>");
    expect(narrator.system).toContain("<TYPOGRAPHY>");
    expect(narrator.system).toContain("<PHYSICALITY>");
    expect(narrator.system).toContain("<ANTI_TROPES>");
    expect(narrator.system).toContain("<BANNED_CLICHES>");
  });
});

describe("dynamic-axes scoping", () => {
  const interaction = render_story_prose({ round: 3, entities, input: "Beast steps forward." });
  const npc_result = render_story_prose({
    round: 4,
    entities,
    speaker: npc,
    input: "Gaoler sneers.",
    npc_entities: [npc],
    in_scene_ids: ["GAOLER"],
  });

  it("scopes the AI_CHARACTER sheet to the somatic axes", () => {
    const axes = slice_axes(slice_sheet(interaction.system, "AI_CHARACTER"));
    expect(axes).toContain("<CHAOS");
    expect(axes).not.toContain("<VELOCITY");
  });

  it("scopes the NPC sheet to the somatic axes", () => {
    const axes = slice_axes(slice_sheet(npc_result.system, "NPC"));
    expect(axes).toContain("<CHAOS");
    expect(axes).not.toContain("<VELOCITY");
  });
});

describe("conversation history entries", () => {
  it("carry origin and round, never a mode attribute", () => {
    const history = render_history([
      { role: "AI_CHARACTER", content: "He nods.", origin: "BEAST" },
      { role: "USER_PERSONA", content: "I wave.", origin: "SILVERS" },
    ]);
    expect(history).toContain('origin="BEAST"');
    expect(history).toContain('round="1"');
    expect(history).not.toContain("mode=");
  });
});

describe("master switchboard compile_prompt", () => {
  it("compiles optics prompt with onAlternationPick callback for interactive dice-picking", () => {
    const picks = [];
    const context = {
      target_type: "solo_entity",
      raw_intent: "Standing in the rain {wearing a slicker|holding an umbrella}.",
      entity: entities.AI,
      onAlternationPick: (p) => picks.push(...p),
    };

    const result = compile_prompt("optics", context);
    expect(result.system).toContain("<SYSTEM");
    expect(result.system).toContain('mode="optics"');
    expect(result.task).toContain("<TASK");
    expect(picks.length).toBeGreaterThan(0);
    expect(["wearing a slicker", "holding an umbrella"]).toContain(picks[0].option);
  });

  it("compiles optics prompt in enhancement mode without errors", () => {
    const context = {
      target_type: "character",
      raw_intent: "A tall cyborg warrior.",
      mode: "enhance",
      entity: entities.AI,
    };

    const result = compile_prompt("optics", context);
    expect(result.system).toContain('mode="optics"');
    expect(result.system).toContain("<SUBJECT_RULES");
  });

  it("compiles director prompt directly through compile_prompt", () => {
    const result = compile_prompt("director", {
      round: 1,
      input: "Hello",
      entities,
      compressed_snapshot: { ai: { dynamics: { chaos: 50 } } },
    });

    expect(result.system).toContain('mode="director"');
    expect(result.task).toContain('"_thought_process"');
  });

  it("compiles continuum prompt directly through compile_prompt", () => {
    const result = compile_prompt("continuum", {
      target_entity: entities.AI,
      history: [],
    });

    expect(result.system).toContain('mode="continuum"');
  });

  it("compiles enhancement and sorting directly through compile_prompt", () => {
    const enhancement = compile_prompt("enhancement", {
      content: "Cold demeanor",
      label: "Personality",
      directive: "Enrich",
      enhancer: "PSYCHOLOGICAL",
      field_id: "personality",
      entity: entities.AI,
    });
    expect(enhancement.system).toContain('mode="enhancement"');

    const sorting = compile_prompt("sorting", {
      input_data: { name: "Test" },
      entity_type: "character",
    });
    expect(sorting.system).toContain('mode="sorting"');
  });

  it("defensively hydrates catalog metadata for enhancement when optional parameters are omitted (E1 regression)", () => {
    const physical_enhancement = compile_prompt("enhancement", {
      field_id: "eternal.physical",
      content: "[HAIR: dark brown]",
      entity_type: "character",
      entity: entities.AI,
    });

    // Check that PROFILE_FIELD_CATALOG attributes were successfully populated
    expect(physical_enhancement.system).toContain('mode="enhancement"');
    expect(physical_enhancement.system).toContain("You are the BIOMETRIC_RENDERER Profile Enhancer");
    expect(physical_enhancement.system).toContain('scope="Physical Appearance"');
    expect(physical_enhancement.system).toContain("<LAYER>ETERNAL</LAYER>");
    expect(physical_enhancement.task).toContain("[KEY: value] permanent biometrics");

    const non_physical_enhancement = compile_prompt("enhancement", {
      field_id: "eternal.non_physical",
      content: "Calm and composed.",
      entity_type: "character",
      entity: entities.AI,
    });

    expect(non_physical_enhancement.system).toContain('mode="enhancement"');
    expect(non_physical_enhancement.system).toContain("You are the COGNITIVE_ARCHITECT Profile Enhancer");
    expect(non_physical_enhancement.system).toContain('scope="Personality"');
    expect(non_physical_enhancement.system).toContain("<LAYER>ETERNAL</LAYER>");
    expect(non_physical_enhancement.task).toContain("Prose only");
  });
});

/**
 * CHANGELOG
 * - 2026-09-23: Envelope-harmonization assertions — the registry reads the single `mode` discriminator (`mode.system.mode`; the `role` attribute was retired).
 * - 2026-09-21: Realigned registry assertions to the standardization pass — key count is 9 (the `director_terse` mode collapsed into `director` + `{ terse: true }`), prose protocol bundles no longer carry POV keys (resolved by `resolve_pov_protocol`), and the enhancement scope attribute is asserted as `scope=`.
 * - 2026-09-19: Table-driven assembler (P4) — asserted every manifest mode resolves through `MODE_ADAPTERS` (or the prose fallback), replacing the former switch dispatch.
 * - 2026-09-19: Manifest DRY (P3) — asserted the shared `prose_protocols` bundle reproduces the four prose protocol arrays exactly, and that `director`/`director_terse` share one schema constant.
 * - 2026-09-19: Retired inert manifest data (P2) — history is asserted only on continuum (its `resolve_history` consumer), the six prose/tooling modes carry no history layer, and `task` is asserted to expose only the live `think_format` key.
 * - 2026-09-19: Added E1 regression test verifying defensive hydration of PROFILE_FIELD_CATALOG metadata (role, label, layer, directive) for compile_prompt("enhancement").
 * - 2026-09-19: Added unit tests for compile_prompt switchboard: optics single door with onAlternationPick dice callback, and direct execution across all canonical modes (Mega Report S1, S2, R4).
 * - 2026-09-18: Updated expected prompt keys count to 10 (including director_terse and optics).
 * - 2026-09-15: Added unit test verifying history limit 16 across all four Shot-2A prose sibling modes (interaction, ghostwrite, npc, narrator).
 * - 2026-09-11: Updated imports/assertions to the modern manifest (PROMPTS/get_prompt) after PROMPT_MODES/get_prompt_mode were removed.
 * - 2026-09-11: Renamed from prompt-modes.test.js to prompts.test.js reflecting prompts.js master registry.
 * - 2026-09-11: Moved prompt-modes.test.js to root of intelligence folder and updated imports to story-prompts.js and builder.js.
 */
