import { describe, expect, it } from "vitest";
import { render_ghostwriter, render_story_prose } from "./story-prompt.js";

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
    const { task } = render_ghostwriter({ entities, input: "I step forward and bare my teeth." });
    expect(task).toContain("draft written by Lord Benedict Silvers");
    expect(task).toContain("I step forward and bare my teeth.");
    expect(task).not.toContain("draft written by Beast");
    expect(task).toContain('<INPUT origin="SILVERS">I step forward and bare my teeth.</INPUT>');
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

  it("hides the user persona's dispositions from the AI-visible prompt", () => {
    const { system } = render_story_prose({ mode: "character", round: 3, entities, input: "Beast steps forward." });
    const persona = (system.match(/<USER_PERSONA[\s\S]*?<\/USER_PERSONA>/) || [])[0] || "";
    expect(persona).toContain("<PERSONALITY>");
    expect(persona).not.toContain("<DISPOSITIONS>");
    expect(system).not.toContain("prized asset");
  });
});

describe("sensory experience", () => {
  it("emits the selected NarrativeStyle's sensory order and carries no scene anchor", () => {
    const { task } = render_story_prose({ mode: "character", round: 3, entities, input: "Beast steps forward." });
    expect(task).not.toContain("<SCENE_ANCHOR>");
    const sensory = (task.match(/<SENSORY_EXPERIENCE>[\s\S]*?<\/SENSORY_EXPERIENCE>/) || [])[0] || "";
    expect(sensory).toContain("Sight &gt; Sound &gt; Touch &gt; Scent");
    expect(sensory).not.toContain("vat tanks");
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

describe("blueprint schema alignment", () => {
  it("nests AGENDA inside PSYCHOLOGY and TRAJECTORY inside ATMOSPHERE", () => {
    const { system } = render_story_prose({ mode: "character", round: 3, entities, input: "Beast steps forward." });
    const ai_sheet = system.match(/<AI_CHARACTER\b[\s\S]*?<\/AI_CHARACTER>/)[0];
    expect(ai_sheet).toMatch(/<PSYCHOLOGY>[\s\S]*<AGENDA>Break the challenger\.<\/AGENDA>[\s\S]*<\/PSYCHOLOGY>/);
    const fractal_sheet = system.match(/<FRACTAL\b[\s\S]*?<\/FRACTAL>/)[0];
    expect(fractal_sheet).toMatch(/<ATMOSPHERE>[\s\S]*<TRAJECTORY>Drift\.<\/TRAJECTORY>[\s\S]*<\/ATMOSPHERE>/);
  });

  it("never emits USER_SOVEREIGNTY", () => {
    const interaction = render_story_prose({ mode: "character", round: 3, entities, input: "Beast steps forward." });
    const continuation = render_story_prose({ mode: "narrator", scene_template: "CONTINUATION", round: 5, entities, input: "The station hums." });
    expect(interaction.system + interaction.task).not.toContain("USER_SOVEREIGNTY");
    expect(continuation.system + continuation.task).not.toContain("USER_SOVEREIGNTY");
  });

  it("renders ALTERNATION_OPTIONS only when a rendered entity field carries alternation syntax", () => {
    const plain = render_story_prose({ mode: "character", round: 3, entities, input: "Beast steps forward." });
    expect(plain.system).not.toContain("<ALTERNATION_OPTIONS>");

    const with_alt = {
      ...entities,
      USER: { ...entities.USER, present: { physical: "[PANTS: {worn denim|charcoal cargo}]", non_physical: "Observing." } },
    };
    const alt = render_story_prose({ mode: "character", round: 3, entities: with_alt, input: "Beast steps forward." });
    expect(alt.system).toContain("<ALTERNATION_OPTIONS>");
  });

  it("matches the blueprint THINK_FORMAT beats", () => {
    const { task } = render_story_prose({ mode: "character", round: 3, entities, input: "Beast steps forward." });
    expect(task).toContain("Execute internal reasoning across 4 sequential beats");
    expect(task).toContain('<BEAT id="VISCERAL_IMPACT" step="1">Immediate non-verbal reaction to the <INPUT /> element.</BEAT>');
    expect(task).toContain('<BEAT id="EMOTIONAL_CALIBRATION" step="2">Narrative style emotional grounding');
    expect(task).toContain('<BEAT id="STRATEGIC_DRIVE" step="3">How active <AGENDA /> and/or <TRAJECTORY /> navigate immediate friction.</BEAT>');
    expect(task).toContain('<BEAT id="CADENCE_TEST" step="4">Draft a dialogue line before generating outward prose.</BEAT>');
    expect(task).toContain("Close with </THINK> before generating narrative prose.");
  });
});
