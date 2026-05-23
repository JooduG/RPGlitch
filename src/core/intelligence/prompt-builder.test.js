import { describe, expect, it } from "vitest";
import { prompt_builder } from "@core/intelligence/prompt-builder.js";

describe("prompt_builder (Refactored)", () => {
  describe("Static Helpers", () => {
    it("render_history() should map roles correctly", () => {
      const history = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Greetings", character_name: "Viper" },
        { role: "prologue", content: "The scene opens." },
      ];
      const result = prompt_builder.render_history(history);
      expect(result).toContain('role="USER_PERSONA"');
      expect(result).toContain('role="AI_CHARACTER" name="Viper"');
      expect(result).toContain('role="FRACTAL"');
    });

    it("render_protocols() should return bulleted list of defined protocols", () => {
      const result = prompt_builder.render_protocols("MOMENTUM, HYGIENE");
      expect(result).toContain("- MOMENTUM:");
      expect(result).toContain("- HYGIENE:");
    });
  });

  describe("Assembly Pipeline", () => {
    const mockPayload = {
      round: 1,
      entities: {
        AI: { name: "Viper", fragments: { present: {}, eternal: {} }, past: [], future: [] },
        USER: { name: "Ghost", fragments: { present: {}, eternal: {} }, past: [], future: [] },
        FRACTAL: { name: "Void", fragments: { present: {}, eternal: {} }, past: [], future: [] },
      },
      simulation_log: [],
      input: "Check the door.",
    };

    const mockSnapshot = {
      ai: { dynamics: {} },
      fractal: { dynamics: {} },
      flags: {},
    };

    it("synthesize() injects core XML tags into simulation prompts", () => {
      const result = prompt_builder.synthesize(mockPayload, mockSnapshot);
      expect(result.system).toContain("<SYSTEM");
      expect(result.system).toContain("<EXECUTION_CHECKLIST>");
      expect(result.system).toContain("<YOUR_IDENTITY");
      expect(result.system).toContain("<USER_PERSONA");
    });

    it("synthesize() injects SUSPICIOUS_COGNITION when meta.is_suspicious is true", () => {
      const suspiciousPayload = {
        ...mockPayload,
        meta: { is_suspicious: true },
      };
      const result = prompt_builder.synthesize(suspiciousPayload, mockSnapshot);
      expect(result.system).toContain("SUSPICIOUS_COGNITION");
    });

    it("synthesize() respects prologue mode", () => {
      const prologue_payload = { ...mockPayload, type: "prologue" };
      const result = prompt_builder.synthesize(prologue_payload, {});
      expect(result.system).toContain('mode="PROLOGUE"');
      expect(result.system).toContain("<EXECUTION_CHECKLIST>");
      expect(result.system).toContain("<ACTIVE_CHARACTERS>");
    });

    it("build_epilogue() returns valid narrator system prompt", () => {
      const result = prompt_builder.build_epilogue();
      expect(result.system).toContain('role="NARRATOR"');
    });

    it("build_memory_prompt() targets specific entity refinement", () => {
      const result = prompt_builder.build_memory_prompt("AI", { name: "Viper" }, []);
      expect(result.system).toContain('<MEMORY_PROTOCOL role="AI"');
      expect(result.system).toContain("Entity: Viper");
    });
  });

  describe("Integration: XML Block Verification", () => {
    it("synthesize() correctly integrates all core XML blocks", () => {
      const payload = {
        round: 5,
        entities: {
          AI: {
            name: "Viper",
            fragments: {
              present: { non_physical: "Present" },
              eternal: { non_physical: "Eternal" },
            },
            past: [{ content: "P1", score: 0.9 }],
            future: [{ content: "F1", score: 0.8 }],
          },
          USER: {
            name: "Ghost",
            fragments: {
              present: { non_physical: "User Present" },
              eternal: { non_physical: "User Eternal" },
            },
            past: [],
            future: [],
          },
          FRACTAL: {
            name: "Void",
            fragments: {
              present: { non_physical: "Void Present" },
              eternal: { non_physical: "Void Eternal" },
            },
            past: [],
            future: [],
          },
        },
        simulation_log: [],
        input: "Check the console.",
      };

      const snapshot = {
        ai: { dynamics: { intensity: 50, openness: 60 } },
        fractal: { dynamics: { entropy: 10 } },
        flags: { test: true },
        signal_prompts: ["STYLE: Grit"],
        signals: ["SIGNAL_X"],
      };

      const result = prompt_builder.synthesize(payload, snapshot);

      // Verify presence of tags without strict whitespace dependency
      expect(result.system).toContain('<SYSTEM role="Viper" round="5"');
      expect(result.system).toContain("<EXECUTION_CHECKLIST>");
      expect(result.system).toContain('<YOUR_IDENTITY name="Viper">');
      expect(result.system).toContain('<USER_PERSONA name="Ghost">');
      expect(result.system).toContain('<FRACTAL name="Void">');
      expect(result.system).toContain("STYLE: Grit");
      expect(result.system).toContain("<PROTOCOLS>");
      expect(result.system).toContain("<TASK_INSTRUCTION>");
      expect(result.system).toContain("<INPUT_COMMAND>Check the console.</INPUT_COMMAND>");

      // FRACTAL TEMPORAL VECTOR VERIFICATION
      expect(result.system).toContain("<FUTURE_VECTORS>");
      expect(result.system).toContain("<PAST_MEMORIES>");

      // TELEMETRY VERIFICATION
      expect(result.meta).toBeDefined();
      expect(result.meta.ai).toEqual(snapshot.ai.dynamics);
      expect(result.meta.fractal).toEqual(snapshot.fractal.dynamics);
      expect(result.meta.signals).toContain("SIGNAL_X");
      expect(result.meta?.vectors).toBeDefined();
      expect(result.meta?.vectors?.past).toBeInstanceOf(Array);
      expect(result.meta?.vectors?.future).toBeInstanceOf(Array);
    });

    it("build_epilogue() renders a contextually-hydrated closing sequence", () => {
      const entities = {
        AI: {
          name: "Viper",
          fragments: {
            present: { non_physical: "Viper Present State" },
            eternal: { non_physical: "Viper Core State" },
          },
        },
        USER: {
          name: "Ghost",
          fragments: {
            present: { non_physical: "Ghost Current Mood" },
            eternal: { non_physical: "Ghost Core Spirit" },
          },
        },
        FRACTAL: {
          name: "Void",
          fragments: {
            present: { non_physical: "Void Collapsing" },
            eternal: { non_physical: "Void Eternal Abyss" },
          },
        },
      };
      const dynamics = {
        ai: { intensity: 95, openness: 10, chaos: 80, affinity: 45 },
        fractal: { velocity: 85, entropy: 90 },
      };
      const recent_history = [{ role: "user", content: "The end is near." }];

      const result = prompt_builder.build_epilogue(entities, dynamics, recent_history);

      expect(result.system).toContain('<SYSTEM role="NARRATOR" mode="EPILOGUE">');
      expect(result.system).toContain("<FINAL_STATE>");
      expect(result.system).toContain('<ENTITY name="Viper">');
      expect(result.system).toContain("Viper Present State");
      expect(result.system).toContain("Intensity: 95 | Openness: 10 | Chaos: 80 | Affinity: 45");
      expect(result.system).toContain('<ENTITY name="Ghost">');
      expect(result.system).toContain("Ghost Current Mood");
      expect(result.system).toContain('<ENTITY name="Void">');
      expect(result.system).toContain("Void Collapsing");
      expect(result.system).toContain("Velocity: 85 | Entropy: 90");
      expect(result.system).toContain("End on sensation, not summary.");
    });
  });
});
