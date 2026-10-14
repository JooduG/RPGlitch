/**
 * src/intelligence/prompts.test.js
 * 🎭 UNIT TESTS: PROMPTS MANIFEST & PROMPT MODES CONFIGURATION REGISTRY
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PROMPTS as prompt_modes, get_prompt, resolve_prompt_mode, compile_prompt, director_directives } from "./prompts.js";
import { MODE_ADAPTERS } from "./builder.js";
import { render_history } from "./modules/history.js";
import { register_state_accessors } from "@utils";
import { make_contract_cases } from "./prompt-verification.js";
import { TASK_LIBRARY } from "./modules/task.js";
import { PROTOCOL_LIBRARY } from "./modules/protocols.js";
import { REFLEX_LIBRARY } from "./modules/reflex.js";
import { ROLE_LIBRARY } from "./modules/system.js";
import { PREMADE_ENTITIES } from "@data";

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

function slice_sheet(system, identifier) {
  const by_id = String(system).match(new RegExp(`<CHARACTER[^>]*id="${identifier}"[\\s\\S]*?</CHARACTER>`, "i"));
  if (by_id) return by_id[0];
  const by_tag = String(system).match(new RegExp(`<${identifier}\\b[\\s\\S]*?</${identifier}>`));
  return by_tag ? by_tag[0] : "";
}

function slice_axes(xml) {
  return (String(xml).match(/<DYNAMIC_AXES[\s\S]*?<\/DYNAMIC_AXES>/g) || []).join("\n");
}

function assert_fused_shape(result, mode) {
  const system = result.system;
  const is_turn = ["interaction", "ghostwrite", "npc", "narrator"].includes(mode);
  const tag = is_turn ? "TURN" : "SYSTEM";
  expect((system.match(new RegExp(`<${tag}\\b`, "g")) || []).length).toBe(1);
  expect(system).toContain(`</${tag}>`);
  if (!is_turn) {
    expect(system).toMatch(new RegExp(`<SYSTEM[^>]*mode="${mode}"`));
  }
  expect(system).toContain("<TASK>");
  expect(system).toContain("</TASK>");
  expect(system).not.toMatch(/<TASK[^>]*mode=/);
  const axiom = system.indexOf("<AXIOMATIC_CONSTITUTION>");
  const core = system.indexOf("<CORE_PROTOCOLS>");
  expect(axiom).toBeGreaterThan(-1);
  expect(core).toBeGreaterThan(-1);
  expect(axiom).toBeLessThan(core);
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
    expect(interaction_shot.system).toContain('<TURN speaker="beast" listener="silvers">');
    expect(interaction_shot.system).toContain("<TASK>");
    expect(interaction_shot.system).toContain("</TURN>");

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

  it("injects MOMENTUM tier='soft' at 8 stagnant turns and tier='critical' at 16 turns", () => {
    const neutral = director_directives({ stagnation_turns: 0 });
    expect(neutral.some((item) => typeof item === "string" && item.includes("<MOMENTUM"))).toBe(false);

    const soft = director_directives({ stagnation_turns: 8 });
    expect(soft.some((item) => typeof item === "string" && item.includes('<MOMENTUM tier="soft" turns="8">'))).toBe(true);

    const hard = director_directives({ stagnation_turns: 16 });
    expect(hard.some((item) => typeof item === "string" && item.includes('<MOMENTUM tier="critical" turns="16">'))).toBe(true);
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

  it("carries the <ACTION origin> inside the interaction task", () => {
    const interaction = compile_prompt("interaction", { round: 3, entities, input: "Beast steps forward." });
    expect(interaction.system).toContain('<ACTION round="3" origin="SILVERS">Beast steps forward.</ACTION>');
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
    const axes = slice_axes(slice_sheet(interaction.system, "BEAST"));
    expect(axes).toContain("<CHAOS");
    expect(axes).not.toContain("<VELOCITY");
  });

  it("scopes the NPC sheet to the somatic axes", () => {
    const axes = slice_axes(slice_sheet(npc_result.system, "GAOLER"));
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
    expect(task).toContain('<ACTION origin="SILVERS">I step forward and bare my teeth.</ACTION>');
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
    expect(ghostwrite.system).toContain("Every participant owns their voice, body, actions, thoughts, and choices.");
  });
});

describe("interaction structural integrity", () => {
  it("never includes legacy computing slot tags in prompt output", () => {
    const { system } = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    expect(system).not.toContain("<USER_PERSONA");
    expect(system).not.toContain("<AI_CHARACTER");
    expect(system).not.toContain("<NPC");
    expect(system).not.toContain("<DISPOSITIONS");
  });

  it("renders characters using universal egalitarian CHARACTER envelope", () => {
    const { system } = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    expect(system).toContain('<CHARACTER id="BEAST" name="Beast">');
    expect(system).toContain('<CHARACTER id="SILVERS" name="Lord Benedict Silvers">');
    expect(system).toContain('<FRACTAL id="TARTARUS" name="Project Tartarus">');
  });

  it("places AGENDA inside PSYCHOLOGY on character sheets", () => {
    const { system } = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    const ai_sheet = system.match(/<CHARACTER[^>]*id="BEAST"[\s\S]*?<\/CHARACTER>/)[0];
    expect(ai_sheet).toMatch(/<PSYCHOLOGY>[\s\S]*<AGENDA>[\s\S]*Break the challenger\.[\s\S]*<\/AGENDA>[\s\S]*<\/PSYCHOLOGY>/);
  });

  it("places TRAJECTORY inside PSYCHOLOGY on the fractal sheet", () => {
    const { system } = compile_prompt("interaction", { round: 3, entities: _relocated_prompt_entities, input: "Beast steps forward." });
    const fractal_sheet = system.match(/<FRACTAL\b[\s\S]*?<\/FRACTAL>/)[0];
    expect(fractal_sheet).toMatch(/<PSYCHOLOGY>[\s\S]*<TRAJECTORY>[\s\S]*Drift\.[\s\S]*<\/TRAJECTORY>[\s\S]*<\/PSYCHOLOGY>/);
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
    expect(result.system).toContain('<TURN speaker="tartarus" listener="silvers">');
    expect(result.system).toContain("You are Project Tartarus, the Fractal itself, narrating the story.");
    expect(result.system).toContain('<PERSPECTIVE person="THIRD" tense="PRESENT">');
    expect(result.system).toContain("<TASK>");
    expect(result.system).toContain("Narrate through ambient physics, sensory textures, and environmental shifts in reaction to recent events.");
    expect(result.system).toContain("</TURN>");
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

// ============================================================================
// [SECTION 9: METASYNTAX STANDING GATE — TOKEN-HYGIENE ENFORCEMENT]
// ============================================================================

/** Concept-level tag literals permitted inside directive prose bodies. */
const TAG_BODY_ALLOWLIST = Object.freeze(["THINK"]);

/** Frozen runtime-referent vocabulary (Track 0.2 «ABSOLUTE» layer). */
const RUNTIME_REFERENT_ALLOWLIST = Object.freeze(["INPUT", "USER_PERSONA", "AI_CHARACTER", "HISTORY", "SHIRT", "JACKET"]);

function is_upper_letter(ch) {
  return ch >= "A" && ch <= "Z";
}

function is_lower_letter(ch) {
  return ch >= "a" && ch <= "z";
}

function is_digit(ch) {
  return ch >= "0" && ch <= "9";
}

function is_tag_char(ch) {
  return is_upper_letter(ch) || is_digit(ch) || ch === "_";
}

function is_at_char(ch) {
  return is_upper_letter(ch) || is_lower_letter(ch) || is_digit(ch) || ch === "_";
}

function is_brace_char(ch) {
  return is_lower_letter(ch) || is_digit(ch) || ch === "_";
}

function walk_strings(node, out) {
  if (typeof node === "string") {
    out.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) walk_strings(item, out);
    return;
  }
  if (node && typeof node === "object") {
    for (const key of Object.keys(node)) walk_strings(node[key], out);
  }
}

function collect_catalog_bodies() {
  const bodies = [];
  walk_strings(TASK_LIBRARY, bodies);
  walk_strings(PROTOCOL_LIBRARY, bodies);
  walk_strings(REFLEX_LIBRARY, bodies);
  walk_strings(ROLE_LIBRARY, bodies);
  return bodies;
}

function collect_tag_literals(text) {
  const tags = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("<", i);
    if (open < 0) break;
    let j = open + 1;
    if (text[j] === "/") j += 1;
    const start = j;
    while (j < text.length && is_tag_char(text[j])) j += 1;
    if (j > start + 1 && is_upper_letter(text[start])) {
      const next = text[j] || "";
      if (next === ">" || next === " " || next === "/" || next === "\n") tags.push(text.slice(start, j));
    }
    i = open + 1;
  }
  return tags;
}

function collect_guillemets(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("«", i);
    if (open < 0) break;
    const close = text.indexOf("»", open + 1);
    if (close < 0) break;
    tokens.push(text.slice(open + 1, close));
    i = close + 1;
  }
  return tokens;
}

function collect_at_tokens(text) {
  const hits = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "@") continue;
    let j = i + 1;
    while (j < text.length && is_at_char(text[j])) j += 1;
    if (j > i + 1) hits.push(text.slice(i, j));
  }
  return hits;
}

function collect_brace_tokens(text) {
  const hits = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open < 0) break;
    let j = open + 1;
    while (j < text.length && is_brace_char(text[j])) j += 1;
    if (j > open + 1 && text[j] === "}") hits.push(text.slice(open, j + 1));
    i = open + 1;
  }
  return hits;
}

function strip_spans(text, open_mark, close_mark) {
  let out = String(text || "");
  let open = out.indexOf(open_mark);
  while (open >= 0) {
    const close = out.indexOf(close_mark, open + open_mark.length);
    if (close < 0) break;
    out = out.slice(0, open) + out.slice(close + close_mark.length);
    open = out.indexOf(open_mark);
  }
  return out;
}

function strip_bracket_spans(text) {
  let out = "";
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "[") {
      depth += 1;
      continue;
    }
    if (ch === "]") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0) out += ch;
  }
  return out;
}

function decode_entities(text) {
  return String(text || "")
    .split("&#91;")
    .join("[")
    .split("&#93;")
    .join("]")
    .split("&lt;")
    .join("<")
    .split("&gt;")
    .join(">")
    .split("&quot;")
    .join('"')
    .split("&amp;")
    .join("&");
}

function with_accessors() {
  register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
}

function compile_all() {
  const cases = make_contract_cases();
  const compiled = {};
  for (const [mode_name, [mode_key, context]] of Object.entries(cases)) {
    compiled[mode_name] = String(compile_prompt(mode_key, context).system || "");
  }
  return compiled;
}

describe("metasyntax gate — catalog prose hygiene", () => {
  it("allows no raw tag literals in directive bodies outside THINK", () => {
    const violations = [];
    for (const body of collect_catalog_bodies()) {
      for (const tag of collect_tag_literals(body)) {
        if (!TAG_BODY_ALLOWLIST.includes(tag)) violations.push(tag + " :: " + body.slice(0, 90));
      }
    }
    expect(violations).toEqual([]);
  });

  it("restricts every «TOKEN» to the frozen referent allowlist", () => {
    const bodies = collect_catalog_bodies();
    for (const system of Object.values(compile_all())) bodies.push(system);
    const violations = [];
    for (const body of bodies) {
      for (const token of collect_guillemets(body)) {
        if (!RUNTIME_REFERENT_ALLOWLIST.includes(token)) violations.push(token);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe("metasyntax gate — compiled prompt hygiene", () => {
  beforeEach(with_accessors);
  afterEach(() => register_state_accessors({ runtime: null }));

  it("leaves zero stray {placeholder} braces outside machine-shape blocks", () => {
    const compiled = compile_all();
    const violations = [];
    for (const [mode_name, system] of Object.entries(compiled)) {
      let text = strip_spans(system, "<OUTPUT_FORMAT", "</OUTPUT_FORMAT>");
      text = strip_spans(text, "<INPUT", "</INPUT>");
      for (const token of collect_brace_tokens(text)) violations.push(mode_name + ": " + token);
    }
    expect(violations).toEqual([]);
  });

  it("confines @-tokens to bracket directives and macro rules", () => {
    const compiled = compile_all();
    const macro_bodies = Object.values(PROTOCOL_LIBRARY.MACROS);
    const violations = [];
    for (const [mode_name, system] of Object.entries(compiled)) {
      const decoded = decode_entities(system);
      let opens = 0;
      let closes = 0;
      for (let i = 0; i < decoded.length; i += 1) {
        if (decoded[i] === "[") opens += 1;
        if (decoded[i] === "]") closes += 1;
      }
      expect(mode_name + " brackets balanced: " + opens + "/" + closes).toBe(mode_name + " brackets balanced: " + opens + "/" + opens);
      let text = strip_bracket_spans(decoded);
      for (const macro of macro_bodies) text = text.split(macro).join("");
      text = strip_spans(text, "<OUTPUT_FORMAT", "</OUTPUT_FORMAT>");
      text = strip_spans(text, "<INPUT", "</INPUT>");
      for (const token of collect_at_tokens(text)) violations.push(mode_name + ": " + token);
    }
    expect(violations).toEqual([]);
  });

  describe("Phase III 3.8 — Storage Ban Gate on Turn Pragmatics (speaker/listener)", () => {
    it("enforces that speaker and listener attributes never exist in serialized durable entity schemas or vector memory", () => {
      // 1. Check all premade entity definitions in the catalog
      for (const premade of PREMADE_ENTITIES) {
        expect(premade.speaker).toBeUndefined();
        expect(premade.listener).toBeUndefined();
        expect(premade.eternal?.speaker).toBeUndefined();
        expect(premade.eternal?.listener).toBeUndefined();
        expect(premade.present?.speaker).toBeUndefined();
        expect(premade.present?.listener).toBeUndefined();
      }

      // 2. Check test entity fixtures
      for (const ent of Object.values(entities)) {
        expect(ent).not.toHaveProperty("speaker");
        expect(ent).not.toHaveProperty("listener");
        expect(ent.eternal).not.toHaveProperty("speaker");
        expect(ent.eternal).not.toHaveProperty("listener");
        expect(ent.present).not.toHaveProperty("speaker");
        expect(ent.present).not.toHaveProperty("listener");
      }

      // 3. Check compiled prompt meta and output formats — turn pragmatics must be ephemeral XML envelope attributes only
      const interaction_pkg = compile_prompt("interaction", {
        entities,
        active_speaker: "AI",
        in_scene_ids: ["AI", "USER"],
        round: 1,
      });
      // System envelope must contain turn attributes
      expect(interaction_pkg.system).toMatch(/<TURN[^>]*speaker="[a-z0-9_]+"[^>]*listener="[a-z0-9_]+"/);
      // But meta objects returned for persistence must NEVER carry speaker or listener
      expect(interaction_pkg.meta).toBeDefined();
      expect(interaction_pkg.meta).not.toHaveProperty("speaker");
      expect(interaction_pkg.meta).not.toHaveProperty("listener");
    });
  });
});

/**
 * CHANGELOG
 * - 2026-10-12: Merged Section 9 Metasyntax standing gate tests from metasyntax.test.js into prompts.test.js.
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
 * - 2026-10-14: Atom 2.2 & 2.4 — Updated director_directives momentum test to assert typed XML tags <MOMENTUM tier="soft|critical">.
 * - 2026-10-14: Phase 1 — Updated INPUT assertions to omit channel attribute on standard protagonist actions.
 */
