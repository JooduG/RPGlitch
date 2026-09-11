import { describe, expect, it } from "vitest";
import prompt_modes from "./prompt-modes.json";
import { get_prompt_mode, render_ghostwriter, render_story_prose, resolve_prompt_mode } from "./story-prompts.js";
import { render_builder } from "./builder.js";

const REQUIRED_FIELDS = [
  "system_mode",
  "speaker_role",
  "ghostwrite",
  "swap_perspectives",
  "axes_scope",
  "user_sovereignty",
  "input",
  "scene_template",
  "think_format",
];

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
  expect(system).toMatch(new RegExp(`<SYSTEM[^>]*mode="${mode}"`));
  expect(task.startsWith("<TASK>")).toBe(true);
  expect(task).not.toContain("mode=");
  const axiom = system.indexOf("<AXIOMATIC_CONSTITUTION>");
  const core = system.indexOf("<CORE_PROTOCOLS>");
  expect(axiom).toBeGreaterThan(-1);
  expect(core).toBeGreaterThan(-1);
  expect(axiom).toBeLessThan(core);
  expect(system).toContain("<DISPOSITIONS>");
  return true;
}

describe("prompt-modes registry", () => {
  it("defines every required field for every mode", () => {
    for (const [_key, mode] of Object.entries(prompt_modes)) {
      for (const field of REQUIRED_FIELDS) {
        expect(mode).toHaveProperty(field);
      }
      expect(typeof mode.system_mode).toBe("string");
      expect(typeof mode.ghostwrite).toBe("boolean");
      expect(typeof mode.swap_perspectives).toBe("boolean");
      expect(typeof mode.user_sovereignty).toBe("boolean");
      expect(mode.input).toBeTypeOf("object");
      expect(mode.input).toHaveProperty("tag");
      expect(mode.input).toHaveProperty("source");
      expect(mode.input).toHaveProperty("required");
    }
  });

  it("declares the expected mode keys", () => {
    expect(Object.keys(prompt_modes).sort()).toEqual(["director", "epilogue", "fractal", "ghostwrite", "interaction", "npc", "prologue"].sort());
  });

  it("maps each builder to a known mode", () => {
    expect(resolve_prompt_mode({ mode: "character" }).system_mode).toBe("interaction");
    expect(resolve_prompt_mode({ mode: "character", is_npc: true }).system_mode).toBe("npc");
    expect(resolve_prompt_mode({ mode: "character", ghostwrite: true }).system_mode).toBe("ghostwrite");
    expect(resolve_prompt_mode({ mode: "scene" }).system_mode).toBe("fractal");
    expect(resolve_prompt_mode({ mode: "prologue" }).system_mode).toBe("prologue");
    expect(resolve_prompt_mode({ mode: "epilogue" }).system_mode).toBe("epilogue");
    expect(get_prompt_mode("director").system_mode).toBe("director");
    expect(get_prompt_mode("unknown-mode").system_mode).toBe("interaction");
  });
});

describe("fused rendering per mode", () => {
  it("renders the interaction mode", () => {
    const result = render_story_prose({ mode: "character", round: 3, entities, input: "Beast steps forward." });
    expect(assert_fused_shape(result, "interaction")).toBe(true);
  });

  it("renders the npc mode", () => {
    const result = render_story_prose({
      mode: "character",
      round: 4,
      entities,
      speaker: npc,
      input: "Gaoler sneers.",
      npc_entities: [npc],
      in_scene_ids: ["GAOLER"],
    });
    expect(assert_fused_shape(result, "npc")).toBe(true);
  });

  it("renders the fractal mode", () => {
    const result = render_story_prose({ mode: "scene", round: 5, entities, input: "The station hums." });
    expect(assert_fused_shape(result, "fractal")).toBe(true);
  });

  it("renders the prologue mode", () => {
    const result = render_story_prose({ mode: "prologue", round: 1, entities, input: "Open on the arena." });
    expect(assert_fused_shape(result, "prologue")).toBe(true);
  });

  it("renders the epilogue mode", () => {
    const result = render_story_prose({ mode: "epilogue", round: 9, entities, input: "" });
    expect(assert_fused_shape(result, "epilogue")).toBe(true);
  });

  it("renders the ghostwrite mode", () => {
    const result = render_ghostwriter({ entities, input: "I step forward and bare my teeth." });
    expect(assert_fused_shape(result, "ghostwrite")).toBe(true);
  });
});

describe("dynamic-axes scoping", () => {
  const interaction = render_story_prose({ mode: "character", round: 3, entities, input: "Beast steps forward." });
  const npc_result = render_story_prose({
    mode: "character",
    round: 4,
    entities,
    speaker: npc,
    input: "Gaoler sneers.",
    npc_entities: [npc],
    in_scene_ids: ["GAOLER"],
  });
  const fractal_result = render_story_prose({ mode: "scene", round: 5, entities, input: "The station hums." });

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

  it("scopes the FRACTAL sheet to the fractal axes", () => {
    const axes = slice_axes(slice_sheet(fractal_result.system, "FRACTAL"));
    expect(axes).toContain("<VELOCITY");
    expect(axes).not.toContain("<CHAOS");
  });
});

describe("conversation history entries", () => {
  it("carry origin and round, never a mode attribute", () => {
    const history = render_builder.render_history([
      { role: "AI_CHARACTER", content: "He nods.", origin: "BEAST" },
      { role: "USER_PERSONA", content: "I wave.", origin: "SILVERS" },
    ]);
    expect(history).toContain('origin="BEAST"');
    expect(history).toContain('round="1"');
    expect(history).not.toContain("mode=");
  });
});
