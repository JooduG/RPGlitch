import { describe, expect, it } from "vitest";
import { render_ghostwriter, render_story_prose } from "./story-prompts.js";

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
    relationships: ["Beast -> Lord Benedict Silvers: wary respect", "Beast -> Absent Stranger: dread"],
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

describe("ghostwrite identity", () => {
  it("enhances the PLAYER persona's draft, addressed against the AI character", () => {
    const { system, task } = render_ghostwriter({ entities, input: "I step forward and bare my teeth." });
    expect(task).toContain("draft written by Lord Benedict Silvers");
    expect(task).toContain("I step forward and bare my teeth.");
    expect(task).not.toContain("draft written by Beast");
    expect(system).toContain("<DRAFT>I step forward and bare my teeth.</DRAFT>");
  });

  it("drafts for the PLAYER persona in response to the AI character when no input is given", () => {
    const { task } = render_ghostwriter({ entities, input: "" });
    expect(task).toContain("for Lord Benedict Silvers in response to Beast");
  });

  it("omits L5_AGENCY from the constitution while keeping the constitution top-level", () => {
    const ghostwrite = render_ghostwriter({ entities, input: "I step forward." });
    const interaction = render_story_prose({ mode: "character", round: 3, entities, input: "Beast steps forward." });
    expect(interaction.system).toContain('id="L5_AGENCY"');
    expect(ghostwrite.system).not.toContain('id="L5_AGENCY"');
    expect(ghostwrite.system).toContain("<AXIOMATIC_CONSTITUTION>");
    expect(ghostwrite.system.indexOf("<AXIOMATIC_CONSTITUTION>")).toBeLessThan(ghostwrite.system.indexOf("<CORE_PROTOCOLS>"));
  });
});

describe("per-entity DISPOSITIONS", () => {
  it("renders only relationships whose target is present in the story", () => {
    const { system } = render_story_prose({ mode: "character", round: 3, entities, input: "Beast steps forward." });
    expect(system).toContain('<DISPOSITION target="SILVERS">wary respect</DISPOSITION>');
    expect(system).not.toContain("Absent Stranger");
    expect(system).not.toContain("dread");
  });
});

describe("scene grounding", () => {
  it("locks the live scene and grounds the senses in it", () => {
    const { system } = render_story_prose({ mode: "character", round: 3, entities, input: "Beast steps forward." });
    expect(system).toContain("<SCENE_ANCHOR>");
    expect(system).toContain("<LOCATION>Project Tartarus</LOCATION>");
    expect(system).toContain("<ENVIRONMENT>");
    const sensory = (system.match(/<SENSORY_EXPERIENCE>[\s\S]*?<\/SENSORY_EXPERIENCE>/) || [])[0] || "";
    expect(sensory).toContain("vat tanks");
    expect(sensory).toContain("live scene");
  });
});

describe("appearance merge", () => {
  it("collapses a duplicate tag across eternal + present, with the present state winning", () => {
    const merged_entities = {
      AI: {
        id: "BEAST",
        name: "Beast",
        type: "character",
        eternal: { physical: "[HAIR: eternal-hair]", non_physical: "A fighter." },
        present: { physical: "[HAIR: present-hair]", non_physical: "Alert." },
        future: "",
        past: [],
        dynamics: { chaos: 40, intensity: 60, openness: 30, affinity: 20 },
      },
      USER: {
        id: "SILVERS",
        name: "Lord Benedict Silvers",
        type: "character",
        eternal: { physical: "[HAIR: silver]", non_physical: "A vampire." },
        present: { physical: "[SUIT: charcoal]", non_physical: "Observing." },
        future: "",
        past: [],
        dynamics: { chaos: 20, intensity: 40, openness: 50, affinity: 60 },
      },
      FRACTAL: {
        id: "TARTARUS",
        name: "Project Tartarus",
        type: "fractal",
        eternal: { physical: "[LANDMARKS: vats]", non_physical: "A station." },
        present: { physical: "[STATE: alert]", non_physical: "Cold." },
        future: "",
        past: [],
        dynamics: { velocity: 40, entropy: 60 },
      },
    };
    const { system } = render_story_prose({ mode: "character", round: 1, entities: merged_entities, input: "Move." });
    const sheet = system.match(/<AI_CHARACTER\b[\s\S]*?<\/AI_CHARACTER>/)[0];
    expect(sheet).toContain("<HAIR>present-hair</HAIR>");
    expect(sheet).not.toContain("eternal-hair");
    expect((sheet.match(/<HAIR>/g) || []).length).toBe(1);
  });
});
