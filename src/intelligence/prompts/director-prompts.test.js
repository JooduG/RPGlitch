import { describe, expect, it } from "vitest";
import { DIRECTOR_PROTOCOLS, render_director, render_environmental_hint, render_terse_director_task } from "./director-prompts.js";

describe("director-prompts", () => {
  it("exports valid DIRECTOR_PROTOCOLS schema and operational laws", () => {
    expect(DIRECTOR_PROTOCOLS.SCHEMA).toBeDefined();
    expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain("_thought_process");
    expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain("next_action");
    expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain("dynamics_deltas");
    expect(DIRECTOR_PROTOCOLS.CONTINUITY_AND_CAUSALITY).toContain("SECRET AGENDAS");
    expect(DIRECTOR_PROTOCOLS.TERMINATION).toContain("STORY RESOLUTION");
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

  describe("Director Prompt Hardening & Anti-Trope Specifications (task-1.1 & task-1.3)", () => {
    it("DIRECTOR_PROTOCOLS.SCHEMA specifies flat dynamics_deltas with all 6 axes and simplified genesis without signature_color/speaking_style", () => {
      expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain('"chaos"');
      expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain('"intensity"');
      expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain('"openness"');
      expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain('"affinity"');
      expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain('"velocity"');
      expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain('"entropy"');
      // Genesis in director prompt should not duplicate signature_color or speaking_style
      expect(DIRECTOR_PROTOCOLS.SCHEMA).not.toContain('"signature_color"');
      expect(DIRECTOR_PROTOCOLS.SCHEMA).not.toContain('"speaking_style"');
    });

    it("render_director unifies stage spotlight, convergence, and roster into a single clean <SCENE_SPOTLIGHT> block", () => {
      const { system } = render_director({
        round: 2,
        entities: {
          AI: { name: "Sylvia", id: "ai_1" },
          USER: { name: "Rowan", id: "usr_1" },
          FRACTAL: { name: "Sub-Zero Vault", id: "fr_1" },
        },
        npc_entities: [
          { id: "npc_doc", name: "Dr. Aris", description: "Chief Medical Officer" },
          { id: "npc_guard", name: "Sgt. Vance", description: "Security Chief" },
        ],
        in_scene_ids: ["npc_doc"],
      });

      // System should contain the unified SCENE_SPOTLIGHT
      expect(system).toContain("<SCENE_SPOTLIGHT>");
      expect(system).toContain("Dr. Aris");
      expect(system).toContain("Sgt. Vance");
      // Should not have redundant isolated SPEAKER_ROUTING / ENTITY_CONVERGENCE tags inside PROTOCOLS
      expect(system).not.toContain("<SPEAKER_ROUTING>");
      expect(system).not.toContain("<ENTITY_CONVERGENCE>");
    });

    it("DIRECTOR_PROTOCOLS.SCHEMA specifies unified spotlight schema merging in_scene_change and genesis", () => {
      expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain('"spotlight"');
      expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain('"enter"');
      expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain('"exit"');
      expect(DIRECTOR_PROTOCOLS.SCHEMA).toContain('"genesis"');
      // Should not have top-level separate in_scene_change key
      expect(DIRECTOR_PROTOCOLS.SCHEMA).not.toContain('"in_scene_change"');
    });
  });
});
