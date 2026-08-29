import { describe, expect, it } from "vitest";
import { DIRECTOR_PROTOCOLS, render_director, render_environmental_hint, render_terse_director_task } from "./director-prompts.js";

describe("director-prompts", () => {
  it("exports valid DIRECTOR_PROTOCOLS schema and operational laws", () => {
    expect(DIRECTOR_PROTOCOLS.SCHEMA).toBeDefined();
    expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain("_thought_process");
    expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain("next_action");
    expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain("dynamics_deltas");
    expect(DIRECTOR_PROTOCOLS.CONTINUITY_AND_CAUSALITY).toContain("SECRET AGENDAS");
    expect(DIRECTOR_PROTOCOLS.SPEAKER_ROUTING).toContain("AI_CHARACTER");
  });

  describe("render_environmental_hint", () => {
    it("returns empty string for empty input", () => {
      expect(render_environmental_hint("")).toBe("");
      expect(render_environmental_hint(null)).toBe("");
      expect(render_environmental_hint("   ")).toBe("");
    });

    it("returns empty string when input contains dialogue quotes", () => {
      expect(render_environmental_hint('"Look at that doorway," he said.')).toBe("");
      expect(render_environmental_hint("He says, 'examine the lock'")).toBe("");
    });

    it("detects spatial verbs and nouns in non-verbal environmental action", () => {
      const hint = render_environmental_hint("Walks across the stone floor toward the dark corridor");
      expect(hint).toContain("<USER_ACTION_NOTE>");
      expect(hint).toContain('setting "speaker" to "fractal"');
    });

    it("returns empty string when neither spatial verbs nor nouns are present", () => {
      expect(render_environmental_hint("Ponders the nature of existence silently")).toBe("");
    });
  });

  describe("render_director", () => {
    const mock_entities = {
      AI: {
        name: "Sylvia",
        eternal: { physical: "Silver hair", non_physical: "Analytical" },
        present: { physical: "Wearing coat", non_physical: "Focused" },
      },
      USER: {
        name: "Rowan",
        eternal: { physical: "Tall stature", non_physical: "Observant" },
        present: { physical: "Leather jacket", non_physical: "Cautious" },
      },
      FRACTAL: {
        name: "Sub-Zero Vault",
        present: { physical: "Freezing mist", non_physical: "Oppressive" },
      },
    };

    it("compiles system and task prompt packages", () => {
      const { system, task } = render_director({
        round: 1,
        entities: mock_entities,
        input: "Approaches the locked vault door",
      });

      expect(system).toContain('<ROLE name="DIRECTOR">');
      expect(system).toContain("Sylvia");
      expect(system).toContain("Rowan");
      expect(system).toContain("Sub-Zero Vault");
      expect(system).toContain("<AVAILABLE_KEYWORDS>");
      expect(task).toContain("<ROUND>1</ROUND>");
      expect(task).toContain("<USER_ACTION>");
      expect(task).toContain("Approaches the locked vault door");
      expect(task).toContain('next_action MUST be "AI_CHARACTER"');
    });
  });

  describe("render_terse_director_task", () => {
    it("returns a terse task template for recovery retry", () => {
      const task = render_terse_director_task();
      expect(task).toContain("<TASK>");
      expect(task).toContain("VALID JSON object");
      expect(task).toContain(DIRECTOR_PROTOCOLS.SCHEMA);
    });
  });
});
