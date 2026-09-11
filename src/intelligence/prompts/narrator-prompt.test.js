import { describe, expect, it } from "vitest";
import { render_narrator_prose } from "./narrator-prompt.js";

const entities = {
  AI: {
    id: "BEAST",
    name: "Beast",
    type: "character",
    pov: "1st_person",
    eternal: { physical: "[BUILD: massive grey-green orc]", non_physical: "A brutal arena fighter." },
    present: { physical: "[SHIRT: leather harness]", non_physical: "Protective." },
    future: "Break the challenger.",
    past: [],
    relationships: ["Beast -> Lord Benedict Silvers: wary respect"],
    dynamics: { chaos: 40, intensity: 60, openness: 30, affinity: 20 },
  },
  USER: {
    id: "SILVERS",
    name: "Lord Benedict Silvers",
    type: "character",
    eternal: { physical: "[HAIR: dark with silver streaks]", non_physical: "An ancient vampire." },
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
    eternal: { physical: "[LANDMARKS: rows of vat tanks]", non_physical: "A sterile station." },
    present: { physical: "[STATE: alert]", non_physical: "Cold." },
    future: "Drift.",
    past: [],
    dynamics: { velocity: 40, entropy: 60 },
  },
};

function slice_sheet(system, tag) {
  const match = String(system).match(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`));
  return match ? match[0] : "";
}

function slice_axes(xml) {
  return (String(xml).match(/<DYNAMIC_AXES[\s\S]*?<\/DYNAMIC_AXES>/g) || []).join("\n");
}

function assert_fused_shape(result) {
  const system = result.system;
  const task = result.task;
  expect((system.match(/<SYSTEM\b/g) || []).length).toBe(1);
  expect(system).not.toContain("</SYSTEM>");
  expect(result.system_close).toBe("</SYSTEM>");
  expect(system).toMatch(/<SYSTEM[^>]*mode="narrator"/);
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

describe("narrator beats", () => {
  it("renders the continuation beat in narrator POV with the Fractal frame", () => {
    const result = render_narrator_prose({ scene_template: "CONTINUATION", round: 5, entities, input: "The station hums." });
    expect(assert_fused_shape(result)).toBe(true);
    expect(result.task).toContain("Narrate the present moment");
    expect(result.system).toContain("You are Project Tartarus, the Fractal itself");
    expect(result.system).toContain("third-person omniscient narrator POV");
  });

  it("renders the prologue beat and folds the opening input into its directive", () => {
    const result = render_narrator_prose({ scene_template: "PROLOGUE", round: 1, entities, input: "Open on the arena." });
    expect(assert_fused_shape(result)).toBe(true);
    expect(result.task).toContain("Open the scene");
    expect(result.task).toContain("Input: Open on the arena.");
  });

  it("renders the epilogue beat", () => {
    const result = render_narrator_prose({ scene_template: "EPILOGUE", round: 9, entities, input: "" });
    expect(assert_fused_shape(result)).toBe(true);
    expect(result.task).toContain("Close the scene");
  });

  it("renders the collapse beat", () => {
    const result = render_narrator_prose({ scene_template: "COLLAPSE", round: 9, entities, input: "" });
    expect(assert_fused_shape(result)).toBe(true);
    expect(result.task).toContain("Close the scene on irrevocable tragedy");
  });

  it("carries the <INPUT origin> inside the task, omitting it for a prologue", () => {
    const continuation = render_narrator_prose({ scene_template: "CONTINUATION", round: 5, entities, input: "The station hums." });
    expect(continuation.task).toContain('<INPUT origin="SILVERS">The station hums.</INPUT>');

    const prologue = render_narrator_prose({ scene_template: "PROLOGUE", round: 1, entities, input: "Open on the arena." });
    expect(prologue.task).not.toContain("<INPUT");
  });

  it("never emits DELIVERY_POSTURE or the character THINK_FORMAT", () => {
    const { task } = render_narrator_prose({ scene_template: "CONTINUATION", round: 5, entities, input: "The station hums." });
    expect(task).not.toContain("<DELIVERY_POSTURE>");
    expect(task).toContain("ALL internal calculations, scene/atmosphere shifts, and markdown headers MUST remain strictly INSIDE this block.");
    expect(task).not.toContain("<BEAT id=");
  });
});

describe("narrator omniscience", () => {
  it("scopes the FRACTAL sheet to the fractal axes", () => {
    const { system } = render_narrator_prose({ scene_template: "CONTINUATION", round: 5, entities, input: "The station hums." });
    const axes = slice_axes(slice_sheet(system, "FRACTAL"));
    expect(axes).toContain("<VELOCITY");
    expect(axes).not.toContain("<CHAOS");
  });

  it("exposes the USER persona's dispositions to the omniscient narrator", () => {
    const { system } = render_narrator_prose({ scene_template: "CONTINUATION", round: 5, entities, input: "The station hums." });
    const persona = slice_sheet(system, "USER_PERSONA");
    expect(persona).toContain('<DISPOSITION target="BEAST">prized asset</DISPOSITION>');
  });
});
