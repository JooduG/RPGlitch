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

    it("render_history() should strip double asterisks wrapping dialogue", () => {
      const history = [{ role: "assistant", content: 'She smiled. **"Hello there."**', character_name: "Viper" }];
      const result = prompt_builder.render_history(history);
      expect(result).not.toContain("**&quot;Hello there.&quot;**");
      expect(result).toContain("&quot;Hello there.&quot;");
      expect(result).toContain("She smiled.");
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

  describe("Macro Parsing Pipeline", () => {
    const mockEntities = {
      AI: { name: "Viper" },
      USER: { name: "Ghost" },
      FRACTAL: { name: "Void" },
    };

    it("parse_macros() should resolve macros correctly for AI owner", () => {
      const text = "I am {{me}}, you are {{you}}.";
      const result = prompt_builder.parse_macros(text, mockEntities.AI, mockEntities);
      expect(result).toBe("I am Viper, you are Ghost.");

      const alt = "Legacy {{char}} and {{user}}.";
      const altResult = prompt_builder.parse_macros(alt, mockEntities.AI, mockEntities);
      expect(altResult).toBe("Legacy Viper and Ghost.");
    });

    it("parse_macros() should resolve macros correctly for USER owner", () => {
      const text = "I am {{me}}, you are {{you}}.";
      const result = prompt_builder.parse_macros(text, mockEntities.USER, mockEntities);
      expect(result).toBe("I am Ghost, you are Viper.");

      const alt = "Legacy {{user}} and {{char}}.";
      const altResult = prompt_builder.parse_macros(alt, mockEntities.USER, mockEntities);
      expect(altResult).toBe("Legacy Ghost and Viper.");
    });

    it("parse_macros() should resolve macros correctly for FRACTAL owner", () => {
      const text = "This is {{fractal}}, welcome {{you}}.";
      const result = prompt_builder.parse_macros(text, mockEntities.FRACTAL, mockEntities);
      expect(result).toBe("This is Void, welcome Viper and Ghost.");

      const alt = "Fallback {{me}}, AI is {{char}}, User is {{user}}.";
      const altResult = prompt_builder.parse_macros(alt, mockEntities.FRACTAL, mockEntities);
      expect(altResult).toBe("Fallback Void, AI is Viper, User is Ghost.");
    });

    it("render_tag() should apply macros before escaping", () => {
      const value = "Hello {{me}} <test>";
      const result = prompt_builder.render_tag("GREETING", value, mockEntities.AI, mockEntities);
      expect(result).toBe("  <GREETING>Hello Viper &lt;test&gt;</GREETING>");
    });
  });

  describe("Assembly Pipeline", () => {
    const mockPayload = {
      round: 1,
      entities: {
        AI: {
          name: "Viper",
          present: { non_physical: "Viper Present" },
          eternal: { non_physical: "Viper Eternal" },
          past: [{ text: "Viper past 1" }],
          future: [{ text: "Viper future 1" }],
        },
        USER: {
          name: "Ghost",
          present: { non_physical: "Ghost Present" },
          eternal: { non_physical: "Ghost Eternal" },
          past: [{ text: "Ghost past 1" }],
          future: [],
        },
        FRACTAL: {
          name: "Void",
          present: { non_physical: "Void Present" },
          eternal: { non_physical: "Void Eternal" },
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

    it("synthesize() omits duplicate SESSION_TIMELINE from FRACTAL PAST block", () => {
      const result = prompt_builder.synthesize(mockPayload, mockSnapshot);
      expect(result.system).not.toContain("<SESSION_TIMELINE>");
    });

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

    it("build_epilogue() returns valid fractal system prompt", () => {
      const result = prompt_builder.build_epilogue();
      expect(result.system).toContain('role="FRACTAL"');
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
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
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
            present: { non_physical: "Present" },
            eternal: { non_physical: "Eternal" },
            past: [{ text: "P1", base_weight: 9 }],
            future: [{ text: "F1", base_weight: 9 }],
          },
          USER: {
            name: "Ghost",
            present: { non_physical: "User Present" },
            eternal: { non_physical: "User Eternal" },
            past: [],
            future: [],
          },
          FRACTAL: {
            name: "Void",
            present: { non_physical: "Void Present" },
            eternal: { non_physical: "Void Eternal" },
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
      expect(result.system).toContain('<YOUR_IDENTITY name="Viper" intensity="50" openness="60">');
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

    it("synthesize() injects adaptive stability protocols based on meta.structural_errors", () => {
      const payload = {
        round: 1,
        entities: {
          AI: { name: "Viper" },
          USER: { name: "Ghost" },
          FRACTAL: { name: "Void" },
        },
        simulation_log: [],
        input: "Test input",
        meta: { structural_errors: 1 },
      };

      const snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      // Errors = 1
      let result = prompt_builder.synthesize(payload, snapshot);
      expect(result.system).toContain("WARNING: Previous output exhibited structural drift.");

      // Errors = 3
      payload.meta.structural_errors = 3;
      result = prompt_builder.synthesize(payload, snapshot);
      expect(result.system).toContain("CRITICAL: Severe structural formatting leakage detected.");
    });

    it("build_epilogue() renders a contextually-hydrated closing sequence", () => {
      const entities = {
        AI: {
          name: "Viper",
          present: { non_physical: "Viper Present State" },
          eternal: { non_physical: "Viper Core State" },
        },
        USER: {
          name: "Ghost",
          present: { non_physical: "Ghost Current Mood" },
          eternal: { non_physical: "Ghost Core Spirit" },
        },
        FRACTAL: {
          name: "Void",
          present: { non_physical: "Void Collapsing" },
          eternal: { non_physical: "Void Eternal Abyss" },
        },
      };
      const dynamics = {
        ai: { intensity: 95, openness: 10, chaos: 80, affinity: 45 },
        fractal: { velocity: 85, entropy: 90 },
      };
      const recent_history = [{ role: "user", content: "The end is near." }];

      const result = prompt_builder.build_epilogue(entities, dynamics, recent_history);

      expect(result.system).toContain('<SYSTEM role="Void" mode="EPILOGUE">');
      expect(result.system).toContain('<YOUR_IDENTITY name="Void" velocity="85" entropy="90">');
      expect(result.system).toContain("<ACTIVE_CHARACTERS>");
      expect(result.system).toContain('<AI_CHARACTER name="Viper"');
      expect(result.system).toContain("Viper Present State");
      expect(result.system).toContain('<USER_PERSONA name="Ghost">');
      expect(result.system).toContain("Ghost Current Mood");
      expect(result.system).toContain("Void Collapsing");
      expect(result.system).toContain("End on lingering sensation, not summary.");
    });

    it("build_enhancement() formats physical properties to XML correctly", () => {
      const entity = {
        eternal: { physical: '{"eyeColor": "blue", "hair": "black"}' },
      };
      const result = prompt_builder.build_enhancement("eternal.physical", "Content", "Viper", "character", false, entity);
      expect(result.system).toContain("<ETERNAL_PHYSICAL>");
      expect(result.system).toContain("<eyeColor>blue</eyeColor>");
      expect(result.system).toContain("<hair>black</hair>");
    });

    it("build_enhancement() injects MACRO_PROTOCOL correctly", () => {
      const charResult = prompt_builder.build_enhancement("eternal.non_physical", "Content", "Viper", "character");
      expect(charResult.system).toContain("Use placeholder macros to refer to entities: use '{{me}}'");
      expect(charResult.system).not.toContain("use '{{user}}' to refer to the user persona, '{{char}}'");

      const fractalResult = prompt_builder.build_enhancement("eternal.non_physical", "Content", "Void", "fractal");
      expect(fractalResult.system).toContain("use '{{user}}' to refer to the user persona, '{{char}}'");
      expect(fractalResult.system).not.toContain("use '{{me}}' to refer to this character itself");
    });

    it("build_profile_sorting_prompt() injects sorting instructions correctly", () => {
      const charResult = prompt_builder.build_profile_sorting_prompt("Raw text block", "character");
      expect(charResult.system).toContain("CRITICAL FOCUS: You are extracting data to define an individual CHARACTER");
      expect(charResult.system).toContain("Use placeholder macros to refer to entities: use '{{me}}'");

      const fractalResult = prompt_builder.build_profile_sorting_prompt("Raw text block", "fractal");
      expect(fractalResult.system).toContain("CRITICAL FOCUS: You are extracting data to define a FRACTAL");
      expect(fractalResult.system).toContain("use '{{user}}' to refer to the user persona, '{{char}}'");
    });
  });
});
