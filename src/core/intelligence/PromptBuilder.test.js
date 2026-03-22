import { describe, expect, it } from "vitest";
import { PromptBuilder } from "./PromptBuilder.js";
describe("PromptBuilder (Refactored)", () => {
  describe("Static Helpers", () => {
    it("render_history() should map roles correctly", () => {
      const history = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Greetings", character_name: "Viper" },
        { role: "prologue", content: "The scene opens." },
      ];
      const result = PromptBuilder.render_history(history);
      expect(result).toContain('role="USER_PERSONA"');
      expect(result).toContain('role="AI_CHARACTER" name="Viper"');
      expect(result).toContain('role="FRACTAL"');
    });
    it("render_protocols() should return bulleted list of defined protocols", () => {
      const result = PromptBuilder.render_protocols("MOMENTUM, HYGIENE");
      expect(result).toContain("- MOMENTUM:");
      expect(result).toContain("- HYGIENE:");
    });
  });
  describe("SYSTEM_PROMPTS XML Integrity", () => {
    const mockPayload = {
      round: 1,
      entities: {
        AI: {
          name: "Viper",
          fragments: {
            eternal: { physical: "Viper Frame", non_physical: "Eternal AI" },
            present: { physical: "Viper Glow", non_physical: "Present AI" },
          },
          future: [{ text: "Future AI" }],
          past: [{ text: "Past AI" }],
        },
        USER: {
          name: "Player",
          fragments: {
            eternal: { physical: "Eternal User", non_physical: "Eternal User" },
            present: { physical: "Present User", non_physical: "Present User" },
          },
          future: [{ text: "Future User" }],
          past: [{ text: "Past User" }],
        },
        FRACTAL: {
          name: "City",
          fragments: {
            eternal: { physical: "", non_physical: "Eternal City" },
            present: { physical: "", non_physical: "Present City" },
          },
          future: [{ text: "Future Fractal" }],
          past: [{ text: "Past Fractal" }],
        },
      },
      history: { messages: [], dynamics: {} },
      input: "test action",
    };
    const mockSnapshot = {
      signal_prompts: ["Pacing"],
      flags: ["ADRENALINE"],
      ai: { dynamics: { intensity: 80 } },
      fractal: { dynamics: { entropy: 10 } },
    };
    it("synthesize() should return system prompt and meta", () => {
      const result = PromptBuilder.synthesize(mockPayload, mockSnapshot);
      expect(result.system).toContain('<SYSTEM role="Viper"');
      expect(result.system).toContain('round="1"');
      expect(result.system).toContain("<INPUT_COMMAND>");
      expect(result.system).toContain("test action");
      // Verify Semantic XML Tags
      expect(result.system).toContain("<ETERNAL>Eternal AI</ETERNAL>");
      expect(result.system).toContain("<PRESENT>Present AI</PRESENT>");
      // Verify Physical fields are EXCLUDED (user choice)
      expect(result.system).not.toContain("Viper Glow");
      expect(result.meta.ai.intensity).toBe(80);
    });
    it("should include protocols in the generated prompt", () => {
      const result = PromptBuilder.synthesize(mockPayload, mockSnapshot);
      expect(result.system).toContain("<PROTOCOLS>");
      expect(result.system).toContain("- FIRST_PERSON:");
    });
    it("should use - THIRD_PERSON: in prologue mode", () => {
      const prologue_payload = { ...mockPayload, type: "prologue" };
      const result = PromptBuilder.synthesize(prologue_payload, {});
      expect(result.system).toContain("- THIRD_PERSON:");
      expect(result.system).not.toContain("- FIRST_PERSON:");
    });
  });
  describe("Special Modes", () => {
    it("build_epilogue() should return epilogue system prompt", () => {
      const result = PromptBuilder.build_epilogue();
      expect(result.system).toContain('<SYSTEM role="NARRATOR">');
      expect(result.system).toContain("<TASK_INSTRUCTION>");
    });
    it("build_memory_prompt() should return memory XML", () => {
      const result = PromptBuilder.build_memory_prompt(
        "Viper",
        { name: "Cold entity" },
        "Past events",
      );
      expect(result.system).toContain("<MEMORY_PROTOCOL");
      expect(result.system).toContain('role="Viper"');
      expect(result.system).toContain("<CONTEXT>");
    });
  });
});
