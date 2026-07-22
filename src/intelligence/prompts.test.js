import { prompt_builder, PROTOCOL_LIBRARY, render_ghostwriter } from "./prompts.js";
import { app } from "@state";
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
      expect(result).toContain('name="Ghost">Hello\nAre you there?</entry>');
      expect(result).toContain('name="Viper">Greetings\nI am ready.</entry>');
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

    it("render_protocols() should return XML-tagged protocols", () => {
      const out = prompt_builder.render_protocols("MOMENTUM, HYGIENE");
      expect(out).toContain("<MOMENTUM>Drive the scene forward.");
      expect(out).toContain("no structural labels.</MOMENTUM>");
      expect(out).toContain("<HYGIENE>Omit conversational preambles");
      expect(out).toContain("24h clocks.</HYGIENE>");
    });
  });

  describe("Protocol Library Consolidation", () => {
    it("should ensure core protocols are compacted and deduplicated", () => {
      // Assert length limits to prevent token bloat
      expect(PROTOCOL_LIBRARY.HYGIENE.length).toBeLessThan(300);
      expect(PROTOCOL_LIBRARY.COGNITION.length).toBeLessThan(500);
      expect(PROTOCOL_LIBRARY.USER_AGENCY.length).toBeLessThan(200);
      expect(PROTOCOL_LIBRARY.MOMENTUM.length).toBeLessThan(250);
      expect(PROTOCOL_LIBRARY.MARKDOWN_FORMAT.length).toBeLessThan(200);

      // Verify that HYGIENE and DATA_HYGIENE use the deduplicated BASE_HYGIENE prefix
      const baseHygiene = "Omit conversational preambles, greetings, or meta-commentary. Start instantly.";
      expect(PROTOCOL_LIBRARY.HYGIENE).toContain(baseHygiene);
      expect(PROTOCOL_LIBRARY.DATA_HYGIENE).toContain(baseHygiene);
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
  });

  describe("Assembly Pipeline", () => {
    const mockPayload = {
      round: 1,
      entities: {
        AI: {
          name: "Viper",
          present: { non_physical: "Viper Present" },
          eternal: { non_physical: "Viper Eternal" },
          past: [{ directive: "Viper past 1" }],
          future: [{ directive: "Viper future 1" }],
        },
        USER: {
          name: "Ghost",
          present: { non_physical: "Ghost Present" },
          eternal: { non_physical: "Ghost Eternal" },
          past: [{ directive: "Ghost past 1" }],
          future: [],
        },
        FRACTAL: {
          name: "Void",
          present: { non_physical: "Void Present" },
          eternal: { non_physical: "Void Eternal" },
          past: [{ directive: "Void past 1" }],
          future: [{ directive: "Void future 1" }],
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
      expect(result.task).toContain("<PAST>");
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
      expect(result.system).toContain('<SYSTEM role="MEMORY_FORGE" entity="Viper">');
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
    });
  });

  describe("Prefix-Cache System Prompt Re-ordering", () => {
    it("should separate static SYSTEM from volatile SCENE_STATE in character prompt", () => {
      const payload = {
        round: 5,
        entities: {
          AI: {
            name: "Viper",
            present: { non_physical: "Volatile Present" },
            eternal: { non_physical: "Static Eternal" },
            past: [{ directive: "Volatile Past", base_weight: 9 }],
            future: [{ directive: "Volatile Future", base_weight: 9 }],
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
        flags: {},
      };

      const result = prompt_builder.build_character_prompt(payload, snapshot, {});

      // SYSTEM should contain only static eternal traits, protocols, style
      expect(result.system).toContain('<SYSTEM role="Viper">');
      expect(result.system).toContain("Static Eternal");
      expect(result.system).not.toContain("Volatile Present");
      expect(result.system).not.toContain("Volatile Past");
      expect(result.system).toContain("<PROTOCOLS>");
      expect(result.system).not.toContain('intensity="50"');

      // SCENE_STATE should contain dynamics, present, past, future
      expect(result.task).toContain("<SCENE_STATE>");
      expect(result.task).toContain("Volatile Present");
      expect(result.task).toContain("Volatile Past");
      expect(result.task).toContain('intensity="50"');
    });
  });

  describe("Shot 1 (Director) Protocol & Token Compaction", () => {
    it("should include non-physical traits and exclude verbose protocols in Director prompt", () => {
      const payload = {
        round: 1,
        entities: {
          AI: {
            name: "Viper",
            present: { non_physical: "Volatile Mental State" },
            eternal: { non_physical: "Static Mental State" },
            future: [{ directive: "Future Goal" }],
          },
          USER: { name: "Ghost", present: {}, eternal: {}, future: [] },
        },
        simulation_log: [],
        input: "Hello",
      };
      const snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} } };

      const result = prompt_builder.build_director_prompt(payload, snapshot);

      // Should include non-physical state for dynamics resolution
      expect(result.system).toContain("Volatile Mental State");
      expect(result.system).toContain("Static Mental State");
      expect(result.system).toContain("Future Goal");

      // Should ONLY include JSON_OUTPUT protocol, not verbose prose protocols
      expect(result.system).toContain("<JSON_OUTPUT>");
      expect(result.system).not.toContain("<HYGIENE>");
      expect(result.system).not.toContain("<COGNITION>");
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
            past: [{ directive: "P1", base_weight: 9 }],
            future: [{ directive: "F1", base_weight: 9 }],
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
      expect(result.system).toContain('<SYSTEM role="Viper">');
      expect(result.system).toContain('<YOUR_IDENTITY name="Viper">');
      expect(result.task).toContain('<YOUR_IDENTITY name="Viper" intensity="50" openness="60">');
      expect(result.task).toContain("<PAST>");
      expect(result.system).not.toContain("<DIRECTION>");
      expect(result.system).toContain("<PROTOCOLS>");
      expect(result.task).toContain("<USER_ACTION>");
      expect(result.task).toContain("Check the console.");

      // TELEMETRY VERIFICATION
      expect(result.meta).toBeDefined();
      expect(result.meta.ai).toEqual(snapshot.ai.dynamics);
      expect(result.meta.fractal).toEqual(snapshot.fractal.dynamics);
      expect(result.meta?.vectors).toBeDefined();
      expect(result.meta?.vectors?.past).toBeInstanceOf(Array);
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
      expect(result.task).toContain("WARNING: Structural drift detected in previous output.");

      // Errors = 3
      payload.meta.structural_errors = 3;
      result = prompt_builder.synthesize(payload, snapshot);
      expect(result.task).toContain("CRITICAL: Structural formatting has critically collapsed.");
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
      expect(result.task).toContain("End on lingering sensation, not summary.");
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
      expect(charResult.system).toContain("Use placeholder macros to refer to entities: '{{me}}' for this character");
      expect(charResult.system).not.toContain("'{{user}}' for the user persona, '{{char}}' for the AI character");

      const fractalResult = prompt_builder.build_enhancement("eternal.non_physical", "Content", "Void", "fractal");
      expect(fractalResult.system).toContain("'{{user}}' for the user persona, '{{char}}' for the AI character");
      expect(fractalResult.system).not.toContain("'{{me}}' for this character");
    });

    it("build_profile_sorting_prompt() injects sorting instructions correctly", () => {
      const charResult = prompt_builder.build_profile_sorting_prompt("Raw text block", "character");
      expect(charResult.system).toContain("CRITICAL FOCUS: You are extracting data to define an individual CHARACTER");
      expect(charResult.system).toContain("Use placeholder macros to refer to entities: use '{{me}}'");

      const fractalResult = prompt_builder.build_profile_sorting_prompt("Raw text block", "fractal");
      expect(fractalResult.system).toContain("CRITICAL FOCUS: You are extracting data to define a FRACTAL");
      expect(fractalResult.system).toContain("use '{{user}}' to refer to the user persona, '{{char}}'");
    });

    it("should prepend author style prompt to build_character_prompt if app.settings.narrative_style is active", () => {
      app.settings.narrative_style = "anna_zaires";
      const mockPayload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mockSnapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const result = prompt_builder.build_character_prompt(mockPayload, mockSnapshot, {});
      expect(result.system).toContain('<STYLE_PROFILE author="anna_zaires">');
      app.settings.narrative_style = "default";
    });

    it("should not prepend author style prompt if app.settings.narrative_style is 'default'", () => {
      app.settings.narrative_style = "default";
      const mockPayload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mockSnapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const result = prompt_builder.build_character_prompt(mockPayload, mockSnapshot, {});
      expect(result.system).not.toContain("<STYLE_PROFILE");
    });
    it("should prepend author style prompt to render_narrator (prologue) if active", () => {
      app.settings.narrative_style = "william_gibson";
      const mockPayload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mockSnapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const prologue_payload = { ...mockPayload, type: "prologue" };
      const result = prompt_builder.synthesize(prologue_payload, mockSnapshot);
      expect(result.system).toContain('<STYLE_PROFILE author="william_gibson">');
      app.settings.narrative_style = "default";
    });

    it("should include EPISTEMIC_PHYSICS in build_character_prompt but not build_epilogue or prologue narrator narration", () => {
      const mockPayload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mockSnapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      const charResult = prompt_builder.build_character_prompt(mockPayload, mockSnapshot, {});
      expect(charResult.task).toContain("Your perception ends at your sensory horizon");

      const epilogueResult = prompt_builder.build_epilogue(mockPayload.entities, {}, []);
      expect(epilogueResult.system).not.toContain("Your perception ends at your sensory horizon");

      const prologuePayload = { ...mockPayload, type: "prologue" };
      const prologueResult = prompt_builder.synthesize(prologuePayload, mockSnapshot);
      expect(prologueResult.system).not.toContain("Your perception ends at your sensory horizon");
    });

    it("should omit USER_ACTION and INTERNAL_DIRECTION tags if they are empty", () => {
      const mockPayload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "",
      };
      const mockSnapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      const charResult = prompt_builder.build_character_prompt(mockPayload, mockSnapshot, { directive: "" });
      expect(charResult.system).not.toContain("</USER_ACTION>");
      expect(charResult.system).not.toContain("</DIRECTION>");
      expect(charResult.system).not.toContain("</SUBCONSCIOUS>");

      const dirResult = prompt_builder.build_director_prompt(mockPayload, mockSnapshot);
      expect(dirResult.system).not.toContain("</USER_ACTION>");
    });

    it("should safely build prompts even if entities.FRACTAL is undefined", () => {
      const mockPayloadNoFractal = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: undefined,
        },
        simulation_log: [],
        input: "Run simulation",
      };
      const mockSnapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      // Should not throw an error
      const dirResult = prompt_builder.build_director_prompt(mockPayloadNoFractal, mockSnapshot);
      expect(dirResult.system).not.toContain("<FRACTAL");

      const charResult = prompt_builder.build_character_prompt(mockPayloadNoFractal, mockSnapshot, {});
      expect(charResult.system).not.toContain("<FRACTAL");
    });

    it("build_director_prompt() includes DYNAMICS_LEGEND with all axis descriptions", () => {
      const mockPayload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mockSnapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      const result = prompt_builder.build_director_prompt(mockPayload, mockSnapshot);
      expect(result.system).toContain("<DYNAMICS_LEGEND>");
      expect(result.system).toContain("chaos");
      expect(result.system).toContain("intensity");
      expect(result.system).toContain("openness");
      expect(result.system).toContain("affinity");
      expect(result.system).toContain("velocity");
      expect(result.system).toContain("entropy");
    });
  });

  describe("render_ghostwriter()", () => {
    const entities = {
      USER: { name: "Rafael Orion", eternal: { non_physical: "Heroic himbo" } },
      AI: { name: "Glitch", eternal: { non_physical: "Cyan-haired hacker" } },
      FRACTAL: { name: "Nova City", eternal: { non_physical: "Cyberpunk metropolis" } },
    };

    it("compiles inverse identity/persona prompts when input is empty", () => {
      const { system, task } = render_ghostwriter({ entities, input: "" });
      expect(system).toContain('YOUR_IDENTITY name="Rafael Orion"');
      expect(system).toContain('USER_PERSONA name="Glitch"');
      expect(task).toContain("Draft a compelling");
    });

    it("compiles enhancement directive when draft input is provided", () => {
      const { system, task } = render_ghostwriter({ entities, input: "I step forward and grin." });
      expect(system).toContain('YOUR_IDENTITY name="Rafael Orion"');
      expect(task).toContain("I step forward and grin.");
      expect(task).toContain("Enhance");
    });
  });
});
