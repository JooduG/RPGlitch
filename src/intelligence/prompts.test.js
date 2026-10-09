/**
 * src/intelligence/prompts.test.js
 * 🎭 UNIT TESTS: PROMPTS MANIFEST & PROMPT MODES CONFIGURATION REGISTRY
 */

import { describe, expect, it } from "vitest";
import { PROMPTS as prompt_modes, get_prompt, resolve_prompt_mode, compile_prompt, director_directives } from "./prompts.js";
import { MODE_ADAPTERS } from "./builder.js";
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
    present: {
      physical: "[SHIRT: leather harness] [APPAREL: oiled cloth wraps] [POSTURE: coiled]",
      non_physical: "Protective and possessive. [@SILVERS: wary respect] [@ABSENT_STRANGER: dread]",
    },
    future: "Break the challenger.",
    past: [],
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
    present: { physical: "[SUIT: charcoal suit]", non_physical: "Observing. [@BEAST: prized asset]" },
    future: "Claim Beast.",
    past: [],
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
  present: { physical: "[SHIRT: mail]", non_physical: "Bored. [@BEAST: contempt]" },
  future: "Watch.",
  past: [],
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
  expect((system.match(/<SYSTEM\b/g) || []).length).toBe(1);
  expect(system).toContain("</SYSTEM>");
  expect(system).toMatch(new RegExp(`<SYSTEM[^>]*mode="${mode}"`));
  expect(system).toContain("<TASK>");
  expect(system).toContain("</TASK>");
  expect(system).not.toMatch(/<TASK[^>]*mode=/);
  const axiom = system.indexOf("<AXIOMATIC_CONSTITUTION>");
  const core = system.indexOf("<CORE_PROTOCOLS>");
  expect(axiom).toBeGreaterThan(-1);
  expect(core).toBeGreaterThan(-1);
  expect(axiom).toBeLessThan(core);
  expect(system).toContain("<DISPOSITIONS>");
  return true;
}

const REQUIRED_MODULE_KEYS = ["system", "constitution", "protocols", "entities", "format"];
const EXPECTED_PROMPT_KEYS = ["continuum", "director", "enhancement", "ghostwrite", "interaction", "narrator", "npc", "optics", "sorting"];

describe("prompt-modes registry", () => {
  it("defines the canonical module keys for every mode", () => {
    for (const [_key, mode] of Object.entries(prompt_modes)) {
      for (const key of REQUIRED_MODULE_KEYS) {
        expect(mode).toHaveProperty(key);
      }
      expect(typeof mode.system.mode).toBe("string");
      expect(typeof mode.constitution).toBe("boolean");
      expect(Array.isArray(mode.protocols)).toBe(true);
      expect(typeof mode.entities).toBe("object");
      expect(typeof mode.format === "string" || typeof mode.format === "object").toBe(true);
      expect(typeof mode.think_format === "string" || mode.think_format === null).toBe(true);
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

  it("flattens the cognition key (think_format) onto every record", () => {
    for (const mode of Object.values(prompt_modes)) {
      expect(mode).toHaveProperty("think_format");
      expect("task" in mode).toBe(false);
    }
  });

  it("routes every manifest mode through the normalize table (no switch)", () => {
    expect(typeof MODE_ADAPTERS.prose.normalize).toBe("function");
    for (const mode_key of Object.keys(prompt_modes)) {
      expect(typeof (MODE_ADAPTERS[mode_key] || MODE_ADAPTERS.prose).normalize).toBe("function");
    }
  });

  it("composes the Shot-2A prose protocol bundles without duplicated key lists", () => {
    const discipline = [
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.TYPOGRAPHY",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.SENTENCE_FORMULAS",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.SCENE_MOMENTUM",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.CLICHES",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.AGENCY",
    ];
    const compose = (natural) => [
      "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT",
      "CORE_PROTOCOLS.GROUNDING",
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
    expect(director_shot.system).toContain("<TASK>");

    // 2. Prose shot (interaction)
    const interaction_shot = compile_prompt("interaction", {
      round: 1,
      entities,
      input: "Beast prepares.",
    });
    expect(interaction_shot.system).toContain('mode="interaction"');
    expect(interaction_shot.system).toContain("<TASK>");

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
  it("prefers a pre-resolved turn_state over deriving from has_input/round", () => {
    const selection = director_directives({
      has_input: false,
      round: 1,
      turn_state: { first_contact: false, round_one: false, evaluation: "EVALUATION_INPUT" },
    });
    const flat = JSON.stringify(selection);
    expect(flat).toContain("REFLEX.TURN_STATE.EVALUATION_INPUT");
    expect(flat).not.toContain("ROUND_ONE");
  });

  it("renders the interaction mode", () => {
    const result = compile_prompt("interaction", { round: 3, entities, input: "Beast steps forward." });
    expect(assert_fused_shape(result, "interaction")).toBe(true);
  });

  it("renders the npc mode", () => {
    const result = compile_prompt("npc", {
      round: 4,
      entities,
      input: "Gaoler sneers.",
      npc,
      npc_entities: [npc],
      in_scene_ids: ["GAOLER"],
    });
    expect(assert_fused_shape(result, "npc")).toBe(true);
  });

  it("renders the ghostwrite mode", () => {
    const result = compile_prompt("ghostwrite", { entities, input: "I step forward and bare my teeth.", ghostwrite: true });
    expect(assert_fused_shape(result, "ghostwrite")).toBe(true);
  });

  it("carries the <INPUT origin> inside the interaction task", () => {
    const interaction = compile_prompt("interaction", { round: 3, entities, input: "Beast steps forward." });
    expect(interaction.system).toContain('<INPUT origin="SILVERS" round="3" channel="action">Beast steps forward.</INPUT>');
  });

  it("strictly respects the manifest protocol list: interaction includes NATURAL_DIALOGUE, narrator omits it", () => {
    const interaction = compile_prompt("interaction", { round: 3, entities, input: "Beast steps forward." });
    expect(interaction.system).toContain("<NATURAL_DIALOGUE>");

    const narrator = compile_prompt("narrator", { entities, round: 1, input: "The station groans." });
    expect(narrator.system).not.toContain("<NATURAL_DIALOGUE>");
    expect(narrator.system).toContain("<TYPOGRAPHY>");
    expect(narrator.system).toContain("<GROUNDING>");
    expect(narrator.system).toContain("<SENTENCE_FORMULAS>");
    expect(narrator.system).toContain("<SCENE_MOMENTUM>");
    expect(narrator.system).toContain("<CLICHES>");
  });
});

describe("dynamic-axes scoping", () => {
  const interaction = compile_prompt("interaction", { round: 3, entities, input: "Beast steps forward." });
  const npc_result = compile_prompt("npc", {
    round: 4,
    entities,
    input: "Gaoler sneers.",
    npc,
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
    expect(result.system).toContain("<TASK");
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
    expect(result.system).toContain("SIGNATURE COLORS:");
  });

  it("compiles director prompt directly through compile_prompt", () => {
    const result = compile_prompt("director", {
      round: 1,
      input: "Hello",
      entities,
      compressed_snapshot: { ai: { dynamics: { chaos: 50 } } },
    });

    expect(result.system).toContain('mode="director"');
    expect(result.system).toContain('"_thought_process"');
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
    expect(physical_enhancement.system).toContain('tense="PRESENT"');
    expect(physical_enhancement.system).toContain("[KEY: value] permanent biometrics");

    const non_physical_enhancement = compile_prompt("enhancement", {
      field_id: "eternal.non_physical",
      content: "Calm and composed.",
      entity_type: "character",
      entity: entities.AI,
    });

    expect(non_physical_enhancement.system).toContain('mode="enhancement"');
    expect(non_physical_enhancement.system).toContain("You are the COGNITIVE_ARCHITECT Profile Enhancer");
    expect(non_physical_enhancement.system).toContain('scope="Personality"');
    expect(non_physical_enhancement.system).toContain('tense="PRESENT"');
    expect(non_physical_enhancement.system).toContain("[KEY: value]");
  });
});

// ── Relocated Prose Compiler Tests (from story.test.js; compile_prompt switchboard) ──

const _relocated_prompt_entities = {
  AI: {
    id: "BEAST",
    name: "Beast",
    type: "character",
    pov: "1st_person",
    eternal: { physical: "[BUILD: massive grey-green orc]", non_physical: "A brutal arena fighter." },
    present: { physical: "[SHIRT: leather harness]", non_physical: "Protective. [@SILVERS: wary respect] [@ABSENT_STRANGER: dread]" },
    future: "Break the challenger.",
    past: [],
    dynamics: { chaos: 40, intensity: 60, openness: 30, affinity: 20 },
  },
  USER: {
    id: "SILVERS",
    name: "Lord Benedict Silvers",
    type: "character",
    eternal: { physical: "[HAIR: dark with silver streaks]", non_physical: "An ancient vampire." },
    present: { physical: "[SUIT: charcoal suit]", non_physical: "Observing. [@BEAST: prized asset]" },
    future: "Claim Beast.",
    past: [],
    dynamics: { chaos: 20, intensity: 40, openness: 50, affinity: 60 },
  },
  FRACTAL: {
    id: "TARTARUS",
    name: "Project Tartarus",
    type: "fractal",
    eternal: { physical: "[LANDMARKS: rows of vat tanks]", non_physical: "A sterile station." },
    present: { physical: "[STATE: alert]", non_physical: "Cold." },
    future: "Drift.",
    past: [],
    dynamics: { velocity: 40, entropy: 60 },
  },
};

describe("ghostwrite identity", () => {
  it("enhances the PLAYER persona's draft, addressed against the AI character", () => {
    const { system } = compile_prompt("ghostwrite", {
      entities: _relocated_prompt_entities,
      input: "I step forward and bare my teeth.",
      ghostwrite: true,
    });
    const task = system;
    expect(system).toContain("You are Lord Benedict Silvers within FRACTAL Project Tartarus, interacting with Beast.");
    expect(task).toContain('<INPUT origin="SILVERS" channel="action">I step forward and bare my teeth.</INPUT>');
    expect(task).toContain("<DELIVERY_POSTURE>");
    expect(task).toContain("Advance the scene in response to");
  });

  it("drafts for the PLAYER persona in response to the AI character when no input is given", () => {
    const { system } = compile_prompt("ghostwrite", { entities: _relocated_prompt_entities, input: "", ghostwrite: true });
    const task = system;
    expect(system).toContain("You are Lord Benedict Silvers within FRACTAL Project Tartarus, interacting with Beast.");
    expect(task).toContain("<DELIVERY_POSTURE>");
    expect(task).toContain("Take active initiative: drive events forward on your own terms");
  });

  it("maintains universal SOVEREIGNTY axiom in the constitution protecting the listener", () => {
    const ghostwrite = compile_prompt("ghostwrite", { entities: _relocated_prompt_entities, input: "I step forward.", ghostwrite: true });
    const interaction = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    expect(interaction.system).toContain('id="L3" title="Sovereignty"');
    expect(ghostwrite.system).toContain('id="L3" title="Sovereignty"');
    expect(ghostwrite.system).toContain("Never puppeteer the listener");
  });
});

describe("interaction structural integrity", () => {
  it("never includes the USER persona's DISPOSITIONS block", () => {
    const { system } = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    const user_sheet = system.match(/<USER_PERSONA\b[\s\S]*?<\/USER_PERSONA>/)[0];
    expect(user_sheet).not.toContain("<DISPOSITIONS");
  });

  it("renders only relationships whose target is present in the story", () => {
    const { system } = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    expect(system).toContain('<DISPOSITION target="SILVERS">wary respect</DISPOSITION>');
    expect(system).not.toContain("Absent Stranger");
    expect(system).not.toContain("dread");
  });

  it("hides the user persona's dispositions from the AI-visible prompt", () => {
    const { system } = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    const persona = (system.match(/<USER_PERSONA[\s\S]*?<\/USER_PERSONA>/) || [])[0] || "";
    expect(persona).toContain("<PERSONALITY>");
    expect(persona).not.toContain("<DISPOSITIONS>");
    expect(system).not.toContain("prized asset");
  });

  it("places AGENDA inside PSYCHOLOGY on character sheets", () => {
    const { system } = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    const ai_sheet = system.match(/<AI_CHARACTER\b[\s\S]*?<\/AI_CHARACTER>/)[0];
    expect(ai_sheet).toMatch(/<PSYCHOLOGY>[\s\S]*<AGENDA>Break the challenger\.<\/AGENDA>[\s\S]*<\/PSYCHOLOGY>/);
  });

  it("places TRAJECTORY inside PSYCHOLOGY on the fractal sheet", () => {
    const { system } = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    const fractal_sheet = system.match(/<FRACTAL\b[\s\S]*?<\/FRACTAL>/)[0];
    expect(fractal_sheet).toMatch(/<PSYCHOLOGY>[\s\S]*<TRAJECTORY>Drift\.<\/TRAJECTORY>[\s\S]*<\/PSYCHOLOGY>/);
  });

  it("never emits USER_SOVEREIGNTY", () => {
    const interaction = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    const continuation = compile_prompt("narrator", {
      scene_template: "CONTINUATION",
      round: 5,
      entities: _relocated_prompt_entities,
      input: "The station hums.",
    });
    expect(interaction.system).not.toContain("USER_SOVEREIGNTY");
    expect(continuation.system).not.toContain("USER_SOVEREIGNTY");
  });

  it("renders ALTERNATION_OPTIONS only when a rendered entity field carries alternation syntax", () => {
    const plain = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    expect(plain.system).not.toContain("<ALTERNATION_OPTIONS>");

    const with_alt = {
      ..._relocated_prompt_entities,
      USER: { ..._relocated_prompt_entities.USER, present: { physical: "[PANTS: {worn denim|charcoal cargo}]", non_physical: "Observing." } },
    };
    const alt = compile_prompt("interaction", { round: 3, entities: with_alt, input: "Beast steps forward." });
    expect(alt.system).toContain("<ALTERNATION_OPTIONS>");
  });

  it("matches the universal think shell with character steps", () => {
    const { system: task } = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    expect(task).toContain("Open your output with one internal <THINK> block (under 200 words).");
    expect(task).toContain("Reason in order:");
    expect(task).toContain("1. Stance — the speaker's unsaid want and internal feeling.");
    expect(task).toContain("2. Friction — what resists that want in this beat.");
    expect(task).toContain("3. Mask — how their psychology leaks or conceals the feeling.");
    expect(task).toContain("4. Smallest observable action — the single physical tell or movement that carries the beat. Never pre-draft dialogue.");
    expect(task).toContain("Close </THINK> before the narrative. This think block is internal reasoning and is never part of the visible prose.");
    expect(task).toContain("<BEAT_BUDGET");
    expect(task).not.toContain("<BEAT>");
  });
});

describe("narrator prose compiler", () => {
  it("renders continuation beat with fractal role line and third-person narrator perspective", () => {
    const result = compile_prompt("narrator", {
      scene_template: "CONTINUATION",
      round: 1,
      entities: _relocated_prompt_entities,
      input: "The reactor pulses.",
    });
    expect(result.system).toContain('<SYSTEM round="1" mode="narrator">');
    expect(result.system).toContain("You are Project Tartarus, the Fractal itself, narrating the story.");
    expect(result.system).toContain('<PERSPECTIVE person="THIRD" tense="PRESENT">');
    expect(result.system).toContain("<TASK>");
    expect(result.system).toContain("Narrate through ambient physics, sensory textures, and environmental shifts in reaction to recent events.");
  });

  it("renders prologue beat omitting input tag and guiding opening sequence", () => {
    const result = compile_prompt("narrator", {
      scene_template: "PROLOGUE",
      round: 0,
      entities: _relocated_prompt_entities,
      input: "A quiet arrival.",
    });
    expect(result.system).toContain("Open the scene. Use thinking to establish:");
    expect(result.system).toContain("Input: A quiet arrival.");
    expect(result.system).not.toContain("<INPUT");
  });
});

/**
 * CHANGELOG
 * - 2026-10-04: Enhancement assertions track the `<PERSPECTIVE tense>` attribute instead of the deleted `<LAYER>` tag.
 * - 2026-09-23: Prompt-grammar harmonization — task envelopes now assert `<INPUT … channel="action">` (the `mode=` signal discriminator was retired for `channel=` across every signal).
 * - 2026-09-23: Registry assertions realigned to the consolidated record — the required module keys drop `task` (now a flattened `think_format`), and the task-key test asserts `think_format` at the top level with no `task` bag.
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
