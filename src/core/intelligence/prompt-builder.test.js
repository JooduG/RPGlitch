import { describe, expect, it } from "vitest";
import { prompt_builder } from "./prompt-builder.js";

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
});
