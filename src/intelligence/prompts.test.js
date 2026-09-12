/**
 * src/intelligence/prompts.test.js
 * 🎭 UNIT TESTS: PROMPTS MANIFEST & PROMPT MODES CONFIGURATION REGISTRY
 */

import { describe, expect, it } from "vitest";
import { PROMPTS as prompt_modes, get_prompt, resolve_prompt_mode } from "./prompts.js";
import { render_ghostwriter, render_story_prose, render_builder } from "./builder.js";

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
  expect(result.system_close).toBe("</SYSTEM>");
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
const EXPECTED_PROMPT_KEYS = ["continuum", "director", "enhancement", "ghostwrite", "interaction", "narrator", "npc", "sorting"];

describe("prompt-modes registry", () => {
  it("defines all 6 module keys (system, constitution, protocols, entities, format, task) for every mode", () => {
    for (const [_key, mode] of Object.entries(prompt_modes)) {
      for (const key of REQUIRED_MODULE_KEYS) {
        expect(mode).toHaveProperty(key);
      }
      expect(typeof mode.system.mode).toBe("string");
      expect(typeof mode.constitution.axiomatic).toBe("boolean");
      expect(Array.isArray(mode.protocols)).toBe(true);
      expect(typeof mode.entities).toBe("object");
      expect(typeof mode.format).toBe("string");
      expect(typeof mode.task).toBe("object");
    }
  });

  it("declares all 8 canonical simulation prompt keys", () => {
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
    const result = render_ghostwriter({ entities, input: "I step forward and bare my teeth." });
    expect(assert_fused_shape(result, "ghostwrite")).toBe(true);
  });

  it("carries the <INPUT origin> inside the interaction task", () => {
    const interaction = render_story_prose({ round: 3, entities, input: "Beast steps forward." });
    expect(interaction.task).toContain('<INPUT origin="SILVERS">Beast steps forward.</INPUT>');
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
    const history = render_builder.render_history([
      { role: "AI_CHARACTER", content: "He nods.", origin: "BEAST" },
      { role: "USER_PERSONA", content: "I wave.", origin: "SILVERS" },
    ]);
    expect(history).toContain('origin="BEAST"');
    expect(history).toContain('round="1"');
    expect(history).not.toContain("mode=");
  });
});

/**
 * CHANGELOG
 * - 2026-09-11: Updated imports/assertions to the modern manifest (PROMPTS/get_prompt) after PROMPT_MODES/get_prompt_mode were removed.
 * - 2026-09-11: Renamed from prompt-modes.test.js to prompts.test.js reflecting prompts.js master registry.
 * - 2026-09-11: Moved prompt-modes.test.js to root of intelligence folder and updated imports to story-prompts.js and builder.js.
 */
