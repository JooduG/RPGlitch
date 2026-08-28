/**
 * src/intelligence/prompts/story-prompts.test.js
 * 🎭 UNIT TESTS: STORY PROMPT SYNTHESIS (DIRECTOR, CHARACTER, NPC, NARRATOR, GHOSTWRITER)
 */

import { describe, expect, it, vi } from "vitest";
import { render_character, render_npc_character, render_ghostwriter, build_narrator } from "./story-prompts.js";

const _mock_app = {
  settings: { narrative_style: "default" },
};

vi.mock("@utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    state_bridge: {
      get app() {
        return _mock_app;
      },
      get runtime() {
        return { active_fractal: null };
      },
    },
  };
});

describe("Story Prompts (story-prompts.js)", () => {
  const base_payload = () => ({
    round: 1,
    entities: {
      AI: {
        name: "Viper",
        present: { non_physical: "Volatile Present" },
        eternal: { non_physical: "Static Eternal" },
        past: [{ directive: "Viper past 1" }],
        future: "Viper future 1",
      },
      USER: {
        name: "Ghost",
        present: { non_physical: "Ghost Present" },
        eternal: { non_physical: "Ghost Eternal" },
        past: [{ directive: "Ghost past 1" }],
        future: "Ghost future 1",
      },
      FRACTAL: {
        name: "Void",
        present: { non_physical: "Void Present" },
        eternal: { non_physical: "Void Eternal" },
        past: [{ directive: "Void past 1" }],
        future: "Void future 1",
      },
    },
    simulation_log: [],
    input: "Check the door.",
  });

  const base_snapshot = {
    ai: { dynamics: { intensity: 50, openness: 60 } },
    fractal: { dynamics: { entropy: 10 } },
    flags: {},
  };

  describe("Character Prompt (render_character)", () => {
    it("separates static SYSTEM from volatile SNAPSHOT", () => {
      const result = render_character({
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
      const result = render_character({
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
      const result = render_character({
        ...payload,
        compressed_snapshot: base_snapshot,
      });
      expect(result.task).not.toContain("hidden stolen cipher");
      expect(result.task).not.toContain("run away");
    });

    it("withholds USER_PERSONA future intent from the character", () => {
      const result = render_character({
        ...base_payload(),
        compressed_snapshot: base_snapshot,
      });
      expect(result.task).not.toContain("Ghost future 1");
    });

    it("renders author style when narrative_style setting is active", () => {
      _mock_app.settings.narrative_style = "anna_zaires";
      const result = render_character({
        ...base_payload(),
        compressed_snapshot: base_snapshot,
      });
      expect(result.system).toContain('<NARRATIVE_STYLE narrator="anna_zaires">');
      _mock_app.settings.narrative_style = "default";
    });
  });

  describe("Supporting NPC Character Prompt (render_npc_character)", () => {
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
      const result = render_npc_character({
        ...payload,
        entities: { ...payload.entities, [npc.id]: npc },
        npc,
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

  describe("Scene Narrator Prompt (build_narrator)", () => {
    it("builds fractal scene narration prompt", () => {
      const result = build_narrator("scene", {
        ...base_payload(),
        compressed_snapshot: base_snapshot,
        director_data: { keywords: ["dysregulation"] },
      });
      expect(result.system).toContain('<ROLE name="Void" mode="SCENE">');
      expect(result.task).toContain("You are the Fractal itself, narrating the scene");
      expect(result.task).toContain("<SOMATIC_DIRECTIVES>");
    });

    it("builds prologue narration prompt", () => {
      const result = build_narrator("prologue", {
        ...base_payload(),
        compressed_snapshot: base_snapshot,
      });
      expect(result.system).toContain('mode="PROLOGUE"');
      expect(result.system).toContain("<ACTIVE_CHARACTERS>");
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
      expect(task).toContain("Draft a compelling");
      expect(task).toContain("<THINK_FORMAT>");
    });

    it("compiles enhancement directive when draft input is provided", () => {
      const { system, task } = render_ghostwriter({ entities, input: "I step forward." });
      expect(system).toContain('<AI_CHARACTER name="Rafael Orion">');
      expect(task).toContain("I step forward.");
      expect(task).toContain("Enhance");
    });
  });
});
