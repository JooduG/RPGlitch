import { prompt_builder } from "@intelligence";
import { describe, expect, it } from "vitest";

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

    it("render_history() should collapse consecutive messages of the same entity before slicing", () => {
      const history = [
        { role: "user", content: "Hello", character_name: "Ghost" },
        { role: "user", content: "Are you there?", character_name: "Ghost" },
        { role: "assistant", content: "Greetings", character_name: "Viper" },
        { role: "assistant", content: "I am ready.", character_name: "Viper" },
      ];
      // When sliced with count = 2, it should output exactly 2 collapsed entries:
      // entry 1: Ghost's collapsed message
      // entry 2: Viper's collapsed message
      const result = prompt_builder.render_history(history, 2);
      expect(result).toContain('name="Ghost">Hello\n\nAre you there?</entry>');
      expect(result).toContain('name="Viper">Greetings\n\nI am ready.</entry>');
    });

    it("render_history() should filter out system messages", () => {
      const history = [
        { role: "user", content: "Hello", character_name: "Ghost" },
        { role: "system", content: "Vector Resolved: ..." },
        { role: "assistant", content: "Greetings", character_name: "Viper" },
      ];
      const result = prompt_builder.render_history(history, 2);
      expect(result).toContain('name="Ghost">Hello</entry>');
      expect(result).toContain('name="Viper">Greetings</entry>');
      expect(result).not.toContain("Vector Resolved");
    });

    it("render_protocols() should return bulleted list of defined protocols", () => {
      const result = prompt_builder.render_protocols("MOMENTUM, HYGIENE");
      expect(result).toContain(
        "- Proactively drive the scene forward. Avoid conversational stagnation. Every turn must introduce a shifting micro-tension, physical movement, environmental shift, or psychological progression while matching the scene's emotional volume.",
      );
      expect(result).toContain("- Omit all preambles, greetings, or structural commentary. Start prose immediately.");
    });
  });

  describe("Assembly Pipeline", () => {
    const mockPayload = {
      round: 1,
      entities: {
        AI: {
          name: "Viper",
          fragments: { present: { non_physical: "Viper Present" }, eternal: { non_physical: "Viper Eternal" } },
          past: [{ text: "Viper past 1" }],
          future: [{ text: "Viper future 1" }],
        },
        USER: {
          name: "Ghost",
          fragments: { present: { non_physical: "Ghost Present" }, eternal: { non_physical: "Ghost Eternal" } },
          past: [{ text: "Ghost past 1" }],
          future: [],
        },
        FRACTAL: {
          name: "Void",
          fragments: { present: { non_physical: "Void Present" }, eternal: { non_physical: "Void Eternal" } },
          past: [{ text: "Void past 1" }],
          future: [{ text: "Void future 1" }],
        },
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
      expect(result.system).toContain('<YOUR_IDENTITY name="Viper">');
      expect(result.system).toContain("<PAST>");
    });

    it("synthesize() respects prologue mode", () => {
      const prologue_payload = { ...mockPayload, type: "prologue" };
      const result = prompt_builder.synthesize(prologue_payload, {});
      expect(result.system).toContain('mode="PROLOGUE"');
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

    it("synthesize() prunes empty tags and formats entity blocks cleanly", () => {
      const emptyPayload = {
        round: 1,
        entities: {
          AI: { name: "Viper", fragments: { present: {}, eternal: {} }, past: [], future: [] },
          USER: { name: "Ghost", fragments: { present: {}, eternal: {} }, past: [], future: [] },
          FRACTAL: { name: "Void", fragments: { present: {}, eternal: {} }, past: [], future: [] },
        },
        simulation_log: [],
        input: "Check the door.",
      };
      const result = prompt_builder.synthesize(emptyPayload, mockSnapshot);
      expect(result.system).toContain("<SYSTEM");
      expect(result.system).not.toContain("<PAST>");
      expect(result.system).not.toContain("<FUTURE>");
      expect(result.system).not.toContain("<ETERNAL>");
      expect(result.system).not.toContain("<PRESENT>");
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
            past: [{ text: "P1", base_weight: 9 }],
            future: [{ text: "F1", base_weight: 9 }],
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
      expect(result.system).toContain('<YOUR_IDENTITY name="Viper">');
      expect(result.system).toContain("<PAST>");
      expect(result.system).toContain("STYLE: Grit");
      expect(result.system).toContain("<PROTOCOLS>");
      expect(result.system).toContain("<TASK>");
      expect(result.system).toContain("Input parameter from user: Check the console.");

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
      expect(result.system).toContain('<ENTITY name="Ghost">');
      expect(result.system).toContain("Ghost Current Mood");
      expect(result.system).toContain('<ENTITY name="Void">');
      expect(result.system).toContain("Void Collapsing");
      expect(result.system).toContain("End on sensation, not summary.");
    });
  });
});
