/**
 * src/intelligence/prompts/story-prompts.test.js
 * 🎭 UNIT TESTS: STORY PROMPT SYNTHESIS (DIRECTOR, CHARACTER, NPC, NARRATOR, GHOSTWRITER)
 */

import { describe, expect, it, vi } from "vitest";
import { render_story_prose, render_ghostwriter } from "./story-prompts.js";
import { system_head_cache } from "./shared.js";

const _mock_app = {
  settings: { narrative_style: "default" },
};

vi.mock("@data", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    resolve_active_style_key: () => _mock_app.settings.narrative_style,
    render_narrative_style_xml: (style_key = _mock_app.settings.narrative_style) =>
      style_key === "anna_zaires" ? '<NARRATIVE_STYLE narrator="anna_zaires">' : "",
    get_narrative_style: (key) =>
      key === "anna_zaires"
        ? {
            author: "anna_zaires",
            rules: ["High tension", "First person immediate"],
            motifs: {
              stoic_pain: { directive: "Mask pain behind curt declarative statements." },
            },
          }
        : null,
    STYLE_MOTIF_REGISTRY: {
      ...actual.STYLE_MOTIF_REGISTRY,
      stoic_pain: { directive: "Mask pain behind curt declarative statements." },
    },
  };
});

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  };
});

describe("Story Prompts (story-prompts.js)", () => {
  const base_payload = () => ({
    round: 1,
    entities: {
      AI: {
        id: "ai-1",
        name: "Viper",
        eternal: { non_physical: "Static Eternal", physical: "Cybernetic eye" },
        present: { non_physical: "Volatile Present", physical: "Black jacket" },
        future: "Viper future 1",
        past: [{ directive: "Viper past 1" }],
      },
      USER: {
        id: "user-1",
        name: "Ghost",
        eternal: { non_physical: "Ghost Eternal", physical: "Hooded cloak" },
        present: { non_physical: "Ghost Present", physical: "Combat boots" },
        future: "Ghost future 1",
        past: [{ directive: "Ghost past 1" }],
      },
      FRACTAL: {
        id: "fractal-1",
        name: "Void",
        eternal: { non_physical: "Void Eternal", physical: "Starry expanse" },
        present: { non_physical: "Void Present", physical: "Cosmic dust" },
        future: "Void future 1",
        past: [{ directive: "Void past 1" }],
      },
    },
    input: "Check the door.",
  });

  const base_snapshot = {
    ai: { dynamics: { intensity: 50, openness: 60 } },
    fractal: { dynamics: { entropy: 10 } },
    flags: {},
  };

  describe("Character Prompt (render_story_prose mode: character)", () => {
    it("separates static SYSTEM from volatile SNAPSHOT", () => {
      const result = render_story_prose({
        mode: "character",
        ...base_payload(),
        compressed_snapshot: base_snapshot,
      });
      expect(result.system).toContain('<ROLE name="Viper">');
      expect(result.system).toContain("Static Eternal");
      expect(result.system).not.toContain("Volatile Present");
      expect(result.task).toContain("<SNAPSHOT>");
      expect(result.task).toContain("Volatile Present");
      expect(result.task).toContain("Viper past 1");
      expect(result.task).toContain("<RECENCY_ANCHOR>");
      expect(result.task).toContain("Hold your temperament; do not soften into pleasantness");
    });

    it("injects somatic directives when keywords or high intensity are selected", () => {
      const result = render_story_prose({
        mode: "character",
        ...base_payload(),
        compressed_snapshot: base_snapshot,
        director_data: { keywords: ["shame", "stoic_pain"] },
      });
      expect(result.task).toContain("<SOMATIC_DIRECTIVES>");
      expect(result.task).toContain("- shame: Weave involuntary physical shame tells");
      expect(result.task).toContain("- stoic_pain: Mask pain behind curt declarative statements");
    });

    it("strips user's SECRET and PLAN across the Epistemic Wall", () => {
      const payload = base_payload();
      payload.entities.USER.present.non_physical = "[SECRET: hidden stolen cipher] [PLAN: run away]";
      const result = render_story_prose({
        mode: "character",
        ...payload,
        compressed_snapshot: base_snapshot,
      });
      expect(result.task).not.toContain("hidden stolen cipher");
      expect(result.task).not.toContain("run away");
    });

    it("withholds USER_PERSONA future intent from the character", () => {
      const result = render_story_prose({
        mode: "character",
        ...base_payload(),
        compressed_snapshot: base_snapshot,
      });
      expect(result.task).not.toContain("Ghost future 1");
    });

    it("renders author style when narrative_style setting is active", () => {
      system_head_cache.clear();
      _mock_app.settings.narrative_style = "anna_zaires";
      const result = render_story_prose({
        mode: "character",
        ...base_payload(),
        compressed_snapshot: base_snapshot,
      });
      expect(result.system).toContain('<NARRATIVE_STYLE narrator="anna_zaires">');
      _mock_app.settings.narrative_style = "default";
      system_head_cache.clear();
    });
  });

  describe("Supporting NPC Character Prompt (render_story_prose with speaker)", () => {
    it("builds a third-person persona for delegated NPCs", () => {
      const npc = {
        id: "npc-mira",
        name: "Mira",
        eternal: { non_physical: "A fixer.", physical: "Tattooed arms." },
        present: { non_physical: "Calm.", physical: "Holding wrench." },
        future: "Trade favors.",
        past: [{ directive: "Old debt" }],
      };
      const payload = base_payload();
      const result = render_story_prose({
        mode: "character",
        ...payload,
        entities: { ...payload.entities, [npc.id]: npc },
        speaker: npc,
        compressed_snapshot: base_snapshot,
        director_data: { directive: "", keywords: [] },
      });
      expect(result.system).toContain('<ROLE name="Mira">');
      expect(result.system).toContain("A fixer.");
      expect(result.task).toContain("Calm.");
      expect(result.task).toContain("Holding wrench.");
      expect(result.task).toContain("Old debt");
      expect(result.task).toContain("supporting character");
    });
  });

  describe("Scene Narrator Prompt (render_story_prose mode: scene / prologue)", () => {
    it("builds fractal scene narration prompt", () => {
      const result = render_story_prose({
        mode: "scene",
        ...base_payload(),
        compressed_snapshot: base_snapshot,
        director_data: { keywords: ["dysregulation"] },
      });
      expect(result.system).toContain('<ROLE name="Void" mode="SCENE">');
      expect(result.task).toContain("You are the Fractal itself, narrating the scene");
      expect(result.task).toContain("<SOMATIC_DIRECTIVES>");
    });

    it("builds prologue narration prompt", () => {
      const result = render_story_prose({
        mode: "prologue",
        ...base_payload(),
        input: "",
        compressed_snapshot: base_snapshot,
      });
      expect(result.system).toContain('mode="PROLOGUE"');
      expect(result.task).toContain("The scene begins.");
    });
  });

  describe("Ghostwriter Prompt (render_ghostwriter)", () => {
    const entities = {
      USER: { name: "Rafael Orion", eternal: { non_physical: "Heroic himbo" }, present: { non_physical: "Ready" } },
      AI: { name: "Glitch", eternal: { non_physical: "Cyan-haired hacker" } },
      FRACTAL: { name: "Nova City", eternal: { non_physical: "Cyberpunk metropolis" } },
    };

    it("swaps perspective and compiles inverse identity prompts", () => {
      const { system, task } = render_ghostwriter({ entities, input: "" });
      expect(system).toContain('<AI_CHARACTER name="Rafael Orion">');
      expect(system).toContain('USER_PERSONA name="Glitch"');
      expect(system).toContain("<THINK_FORMAT>");
      expect(task).toContain("Draft a compelling");
    });

    it("compiles enhancement directive when draft input is provided", () => {
      const { system, task } = render_ghostwriter({ entities, input: "I step forward." });
      expect(system).toContain('<AI_CHARACTER name="Rafael Orion">');
      expect(task).toContain("I step forward.");
      expect(task).toContain("Enhance");
    });
  });

  describe("Anti-Trope Governance & Dual Tone Synthesis (task-1.3)", () => {
    it("ANTI_TROPES protocol explicitly bans denial-then-affirmation formulas and prunes character natural words", async () => {
      const { PROTOCOL_LIBRARY } = await import("./shared.js");
      const anti_tropes = PROTOCOL_LIBRARY.HYGIENE.ANTI_TROPES;
      // Formula ban check
      expect(anti_tropes).toContain("didn't just");
      expect(anti_tropes).toContain("not merely");
      expect(anti_tropes).toContain("doesn't simply");
      // Natural character voice words like bellow/boom/rasp should be pruned from lexical blacklist
      expect(anti_tropes).not.toContain("'bellow/boom'");
      expect(anti_tropes).not.toContain("'rasp/raspy'");
    });

    it("DRIFT_AUDIT protocol uses affirmative phrasing across all 5 checks", async () => {
      const { PROTOCOL_LIBRARY } = await import("./shared.js");
      const drift_audit = PROTOCOL_LIBRARY.AGENCY.DRIFT_AUDIT;
      // Expect affirmative phrasing instead of repeated "Never..."
      expect(drift_audit).toContain("ASSISTANT-DRIFT:");
      expect(drift_audit).toContain("SPOTLIGHT-DRIFT:");
      expect(drift_audit).toContain("INTERVIEW-DRIFT:");
      expect(drift_audit).toContain("PACING-DRIFT:");
      expect(drift_audit).toContain("OMNISCIENCE-DRIFT:");
      expect(drift_audit).not.toContain("Never be polite");
    });

    it("render_story_prose enforces quotes-for-speaking-style and prose-for-narrative-style", () => {
      const result = render_story_prose({
        mode: "character",
        ...base_payload(),
        compressed_snapshot: base_snapshot,
      });
      expect(result.system).toContain("Use the character's speaking style strictly for words within quotation marks");
      expect(result.system).toContain("render all surrounding narrative prose and environmental descriptions through the narrative style preset");
    });

    it("render_story_prose in epilogue mode forbids forcing player physical surrender", () => {
      const result = render_story_prose({
        mode: "epilogue",
        ...base_payload(),
        epilogue_type: "EPILOGUE_COLLAPSED",
        compressed_snapshot: base_snapshot,
      });
      expect(result.task).toContain("environmental aftermath");
      expect(result.task).toContain("without forcing player physical surrender");
    });
  });
});
