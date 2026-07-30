import { prompt_builder, PROTOCOL_LIBRARY, render_ghostwriter, build_cognitive_state, build_dynamics_calibration } from "./prompts.js";
import { vi, describe, expect, it } from "vitest";

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
      const out = prompt_builder.render_protocols("AGENCY.MOMENTUM, HYGIENE.PROSE");
      expect(out).toContain("<MOMENTUM>End on a live beat");
      expect(out).toContain("without structural labels.</MOMENTUM>");
      expect(out).toContain("<PROSE>Omit conversational preambles");
      expect(out).toContain("24h clocks.</PROSE>");
    });
  });

  describe("Protocol Library Consolidation", () => {
    it("should ensure core protocols are compacted and deduplicated", () => {
      // Assert length limits to prevent token bloat
      expect(PROTOCOL_LIBRARY.HYGIENE.PROSE.length).toBeLessThan(300);
      expect(PROTOCOL_LIBRARY.COGNITION.PHASES.length).toBeLessThan(500);
      expect(PROTOCOL_LIBRARY.AGENCY.USER_BOUNDARIES.length).toBeLessThan(200);
      expect(PROTOCOL_LIBRARY.AGENCY.MOMENTUM.length).toBeLessThan(250);
      expect(PROTOCOL_LIBRARY.HYGIENE.MARKDOWN.length).toBeLessThan(200);

      // Verify that HYGIENE and DATA_HYGIENE use the deduplicated BASE_HYGIENE prefix
      const base_hygiene = "Omit conversational preambles, greetings, or meta-commentary. Start instantly.";
      expect(PROTOCOL_LIBRARY.HYGIENE.PROSE).toContain(base_hygiene);
      expect(PROTOCOL_LIBRARY.HYGIENE.DATA).toContain(base_hygiene);
    });
  });

  describe("Macro Parsing Pipeline", () => {
    const mock_entities = {
      AI: { name: "Viper" },
      USER: { name: "Ghost" },
      FRACTAL: { name: "Void" },
    };

    it("parse_macros() should resolve macros correctly for AI owner", () => {
      const text = "I am {{me}}, you are {{you}}.";
      const result = prompt_builder.parse_macros(text, mock_entities.AI, mock_entities);
      expect(result).toBe("I am Viper, you are Ghost.");

      const alt = "Legacy {{char}} and {{user}}.";
      const alt_result = prompt_builder.parse_macros(alt, mock_entities.AI, mock_entities);
      expect(alt_result).toBe("Legacy Viper and Ghost.");
    });

    it("parse_macros() should resolve macros correctly for USER owner", () => {
      const text = "I am {{me}}, you are {{you}}.";
      const result = prompt_builder.parse_macros(text, mock_entities.USER, mock_entities);
      expect(result).toBe("I am Ghost, you are Viper.");

      const alt = "Legacy {{user}} and {{char}}.";
      const alt_result = prompt_builder.parse_macros(alt, mock_entities.USER, mock_entities);
      expect(alt_result).toBe("Legacy Ghost and Viper.");
    });

    it("parse_macros() should resolve macros correctly for FRACTAL owner", () => {
      const text = "This is {{fractal}}, welcome {{you}}.";
      const result = prompt_builder.parse_macros(text, mock_entities.FRACTAL, mock_entities);
      expect(result).toBe("This is Void, welcome Viper and Ghost.");

      const alt = "Fallback {{me}}, AI is {{char}}, User is {{user}}.";
      const alt_result = prompt_builder.parse_macros(alt, mock_entities.FRACTAL, mock_entities);
      expect(alt_result).toBe("Fallback Void, AI is Viper, User is Ghost.");
    });
  });

  describe("Assembly Pipeline", () => {
    const mock_payload = {
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

    const mock_snapshot = {
      ai: { dynamics: {} },
      fractal: { dynamics: {} },
      flags: {},
    };

    it("synthesize() omits duplicate SESSION_TIMELINE from FRACTAL PAST block", () => {
      const result = prompt_builder.synthesize(mock_payload, mock_snapshot);
      expect(result.system).not.toContain("<SESSION_TIMELINE>");
    });

    it("synthesize() injects core XML tags into simulation prompts", () => {
      const result = prompt_builder.synthesize(mock_payload, mock_snapshot);
      expect(result.system).toContain("<SYSTEM");
      expect(result.system).toContain('<YOUR_IDENTITY name="Viper">');
      expect(result.system).toContain("<FIRST_PERSON>");
      expect(result.system).toContain("Write strictly in first-person");
      expect(result.task).toContain("<POV_DIRECTIVE>");
      expect(result.task).toContain("Write strictly in first-person");
      expect(result.task).not.toContain("undefined");
      expect(result.task).toContain("<PAST>");
    });

    it("synthesize() renders third-person POV when entity pov is 3rd_person", () => {
      const third_payload = {
        ...mock_payload,
        entities: {
          ...mock_payload.entities,
          AI: { ...mock_payload.entities.AI, pov: "3rd_person" },
        },
      };
      const result = prompt_builder.synthesize(third_payload, mock_snapshot);
      expect(result.system).toContain("<THIRD_PERSON>");
      expect(result.system).toContain("Write strictly in third-person");
      expect(result.task).toContain("<POV_DIRECTIVE>");
      expect(result.task).toContain("Write strictly in third-person");
      expect(result.task).not.toContain("undefined");
    });

    it("synthesize() respects prologue mode", () => {
      const prologue_payload = { ...mock_payload, type: "prologue" };
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
      const empty_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Check the door.",
      };
      const result = prompt_builder.synthesize(empty_payload, mock_snapshot);
      expect(result.system).toContain("<SYSTEM");
      expect(result.system).not.toContain("<PAST>");
      expect(result.system).not.toContain("<FUTURE>");
    });
  });

  describe("Prefix-Cache System Prompt Re-ordering", () => {
    it("should separate static SYSTEM from volatile FRACTAL_FEED in character prompt", () => {
      const payload = {
        round: 5,
        entities: {
          AI: {
            name: "Viper",
            present: { non_physical: "Volatile Present" },
            eternal: { non_physical: "Static Eternal" },
            past: [{ directive: "Volatile Past", emotional_weight: 9 }],
            future: [{ directive: "Volatile Future", emotional_weight: 9 }],
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

      // FRACTAL_FEED should contain dynamics, present, past, future
      expect(result.task).toContain("<FRACTAL_FEED>");
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
      expect(result.system).toContain("<JSON_ONLY>");
      expect(result.system).not.toContain("<PROSE>");
      expect(result.system).not.toContain("<PHASES>");
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
            past: [{ directive: "P1", emotional_weight: 9 }],
            future: [{ directive: "F1", emotional_weight: 9 }],
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
      expect(result.task).toContain('<YOUR_IDENTITY name="Viper" intensity="50" openness="60" certainty="moderate" regulation="stable">');
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
      expect(result.task).toContain("WARNING: Structural drift detected.");

      // Errors = 3
      payload.meta.structural_errors = 3;
      result = prompt_builder.synthesize(payload, snapshot);
      expect(result.task).toContain("CRITICAL: Structural collapse.");
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
      expect(result.system).toContain('<YOUR_IDENTITY name="Void" velocity="85" entropy="90" certainty="moderate" regulation="stable">');
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
      const char_result = prompt_builder.build_enhancement("eternal.non_physical", "Content", "Viper", "character");
      expect(char_result.system).toContain("Use placeholder macros for entities: '{{me}}' (self)");
      expect(char_result.system).not.toContain("'{{user}}' (user persona), '{{char}}' (AI character)");

      const fractal_result = prompt_builder.build_enhancement("eternal.non_physical", "Content", "Void", "fractal");
      expect(fractal_result.system).toContain("'{{user}}' (user persona), '{{char}}' (AI character)");
      expect(fractal_result.system).not.toContain("'{{me}}' (self)");
    });

    it("build_profile_sorting_prompt() injects sorting instructions correctly", () => {
      const char_result = prompt_builder.build_profile_sorting_prompt("Raw text block", "character");
      expect(char_result.system).toContain("FOCUS: Extracting data for an individual CHARACTER");
      expect(char_result.system).toContain("Use placeholder macros for entities: '{{me}}' (self)");

      const fractal_result = prompt_builder.build_profile_sorting_prompt("Raw text block", "fractal");
      expect(fractal_result.system).toContain("FOCUS: Extracting data for a FRACTAL");
      expect(fractal_result.system).toContain("Use placeholder macros for entities: '{{user}}' (user persona), '{{char}}'");
    });

    it("should prepend author style prompt to build_character_prompt if app.settings.narrative_style is active", () => {
      _mock_app.settings.narrative_style = "anna_zaires";
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const result = prompt_builder.build_character_prompt(mock_payload, mock_snapshot, {});
      expect(result.system).toContain('<NARRATIVE_STYLE author="anna_zaires">');
      _mock_app.settings.narrative_style = "default";
    });

    it("should not prepend author style prompt if app.settings.narrative_style is 'default'", () => {
      _mock_app.settings.narrative_style = "default";
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const result = prompt_builder.build_character_prompt(mock_payload, mock_snapshot, {});
      expect(result.system).not.toContain("<NARRATIVE_STYLE");
    });
    it("should prepend author style prompt to render_narrator (prologue) if active", () => {
      _mock_app.settings.narrative_style = "william_gibson";
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const prologue_payload = { ...mock_payload, type: "prologue" };
      const result = prompt_builder.synthesize(prologue_payload, mock_snapshot);
      expect(result.system).toContain('<NARRATIVE_STYLE author="william_gibson">');
      _mock_app.settings.narrative_style = "default";
    });

    it("should include EPISTEMIC_PHYSICS in build_character_prompt but not build_epilogue or prologue narrator narration", () => {
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      const char_result = prompt_builder.build_character_prompt(mock_payload, mock_snapshot, {});
      expect(char_result.task).toContain("Perception ends at sensory horizon");

      const epilogue_result = prompt_builder.build_epilogue(mock_payload.entities, {}, []);
      expect(epilogue_result.system).not.toContain("Perception ends at sensory horizon");

      const prologue_payload = { ...mock_payload, type: "prologue" };
      const prologue_result = prompt_builder.synthesize(prologue_payload, mock_snapshot);
      expect(prologue_result.system).not.toContain("Perception ends at sensory horizon");
    });

    it("should omit USER_ACTION and INTERNAL_DIRECTION tags if they are empty", () => {
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      const char_result = prompt_builder.build_character_prompt(mock_payload, mock_snapshot, { directive: "" });
      expect(char_result.system).not.toContain("</USER_ACTION>");
      expect(char_result.system).not.toContain("</DIRECTION>");
      expect(char_result.system).not.toContain("</SUBCONSCIOUS>");

      const dir_result = prompt_builder.build_director_prompt(mock_payload, mock_snapshot);
      expect(dir_result.system).not.toContain("</USER_ACTION>");
    });

    it("should safely build prompts even if entities.FRACTAL is undefined", () => {
      const mock_payload_no_fractal = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: undefined,
        },
        simulation_log: [],
        input: "Run simulation",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      // Should not throw an error
      const dir_result = prompt_builder.build_director_prompt(mock_payload_no_fractal, mock_snapshot);
      expect(dir_result.system).not.toContain("<FRACTAL");

      const char_result = prompt_builder.build_character_prompt(mock_payload_no_fractal, mock_snapshot, {});
      expect(char_result.system).not.toContain("<FRACTAL");
    });

    it("build_director_prompt() includes DYNAMICS_LEGEND with all axis descriptions", () => {
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: [] },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      const result = prompt_builder.build_director_prompt(mock_payload, mock_snapshot);
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

  describe("build_cognitive_state()", () => {
    it("returns grounded when openness is high and chaos is low", () => {
      expect(build_cognitive_state({ openness: 70, chaos: 30, intensity: 50 })).toContain('certainty="grounded"');
    });

    it("returns fragile when openness is low and chaos is high", () => {
      expect(build_cognitive_state({ openness: 30, chaos: 70, intensity: 50 })).toContain('certainty="fragile"');
    });

    it("returns moderate for neutral dynamics", () => {
      expect(build_cognitive_state({ openness: 50, chaos: 50, intensity: 50 })).toContain('certainty="moderate"');
    });

    it("returns strained when intensity and chaos are both high", () => {
      expect(build_cognitive_state({ openness: 50, chaos: 70, intensity: 80 })).toContain('regulation="strained"');
    });

    it("returns elevated when intensity is high but chaos is low", () => {
      expect(build_cognitive_state({ openness: 50, chaos: 30, intensity: 80 })).toContain('regulation="elevated"');
    });

    it("returns depleted when intensity is very low", () => {
      expect(build_cognitive_state({ openness: 50, chaos: 50, intensity: 20 })).toContain('regulation="depleted"');
    });

    it("returns stable for moderate intensity and chaos", () => {
      expect(build_cognitive_state({ openness: 50, chaos: 50, intensity: 50 })).toContain('regulation="stable"');
    });

    it("handles null/undefined dynamics gracefully", () => {
      const result = build_cognitive_state(null);
      expect(result).toContain('certainty="moderate"');
      expect(result).toContain('regulation="stable"');
    });
  });

  describe("build_dynamics_calibration()", () => {
    it("generates calibration block for character axes", () => {
      const result = build_dynamics_calibration({ chaos: 75, intensity: 25, openness: 60, affinity: 40 });
      expect(result).toContain("<DYNAMICS_CALIBRATION>");
      expect(result).toContain('Chaos="75"');
      expect(result).toContain('Intensity="25"');
      expect(result).toContain('Openness="60"');
      expect(result).toContain('Affinity="40"');
    });

    it("describes high values as dominant", () => {
      const result = build_dynamics_calibration({ chaos: 75, intensity: 50, openness: 50, affinity: 50 });
      expect(result).toContain("High — dominates behavior");
    });

    it("describes low values as suppressed", () => {
      const result = build_dynamics_calibration({ chaos: 25, intensity: 50, openness: 50, affinity: 50 });
      expect(result).toContain("Low — suppressed state");
    });

    it("describes mid values as balanced", () => {
      const result = build_dynamics_calibration({ chaos: 50, intensity: 50, openness: 50, affinity: 50 });
      expect(result).toContain("Balanced — neutral baseline");
    });

    it("returns empty string for null/undefined dynamics", () => {
      expect(build_dynamics_calibration(null)).toBe("");
      expect(build_dynamics_calibration(undefined)).toBe("");
    });
  });

  describe("Phase 4: Cognitive State Attrs in render_character", () => {
    const mock_payload = {
      round: 1,
      entities: {
        AI: {
          name: "Viper",
          present: { non_physical: "Volatile Present" },
          eternal: { non_physical: "Static Eternal" },
          past: [],
          future: [],
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
      input: "Hello",
    };

    it("injects certainty and regulation attrs onto YOUR_IDENTITY tag", () => {
      const snapshot = {
        ai: { dynamics: { openness: 70, chaos: 30, intensity: 50 } },
        fractal: { dynamics: {} },
        flags: {},
      };
      const result = prompt_builder.build_character_prompt(mock_payload, snapshot, {});
      expect(result.task).toContain('certainty="grounded"');
      expect(result.task).toContain('regulation="stable"');
    });

    it("places certainty and regulation attrs on YOUR_IDENTITY before PRESENT", () => {
      const payload = {
        ...mock_payload,
        entities: {
          ...mock_payload.entities,
          AI: {
            ...mock_payload.entities.AI,
            past: [{ directive: "Viper past 1", emotional_weight: 5 }],
          },
        },
      };
      const snapshot = {
        ai: { dynamics: { openness: 30, chaos: 70, intensity: 80 } },
        fractal: { dynamics: {} },
        flags: {},
      };
      const result = prompt_builder.build_character_prompt(payload, snapshot, {});
      const identity_idx = result.task.indexOf("<YOUR_IDENTITY");
      const present_idx = result.task.indexOf("Volatile Present");
      // certainty/regulation are attrs on YOUR_IDENTITY, so they appear before PRESENT content
      expect(identity_idx).toBeLessThan(present_idx);
      expect(result.task.substring(identity_idx, present_idx)).toContain("certainty=");
      expect(result.task.substring(identity_idx, present_idx)).toContain("regulation=");
    });

    it("includes the cognitive ground instruction in EPISTEMIC_PHYSICS", () => {
      const snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const result = prompt_builder.build_character_prompt(mock_payload, snapshot, {});
      expect(result.task).toContain("certainty and regulation attributes color");
      expect(result.task).toContain("without explicit naming");
    });

    it("includes DYNAMICS_CALIBRATION block in FRACTAL_FEED when dynamics are present", () => {
      const snapshot = {
        ai: { dynamics: { chaos: 50, intensity: 75, openness: 32, affinity: 69 } },
        fractal: { dynamics: {} },
        flags: {},
      };
      const result = prompt_builder.build_character_prompt(mock_payload, snapshot, {});
      expect(result.task).toContain("<DYNAMICS_CALIBRATION>");
      expect(result.task).toContain('Chaos="50"');
      expect(result.task).toContain('Intensity="75"');
    });

    it("omits DYNAMICS_CALIBRATION when no dynamics are present", () => {
      const snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const result = prompt_builder.build_character_prompt(mock_payload, snapshot, {});
      expect(result.task).not.toContain("<DYNAMICS_CALIBRATION>");
    });

    it("keeps cognitive attrs in volatile task, not static system prefix", () => {
      const snapshot = {
        ai: { dynamics: { openness: 70, chaos: 30, intensity: 50 } },
        fractal: { dynamics: {} },
        flags: {},
      };
      const result = prompt_builder.build_character_prompt(mock_payload, snapshot, {});
      expect(result.system).not.toContain("certainty=");
      expect(result.task).toContain("certainty=");
    });
  });

  describe("Unified FUTURE block in render_character", () => {
    it("renders future vectors inside a clean unified FUTURE tag", () => {
      const payload = {
        round: 1,
        entities: {
          AI: {
            name: "Viper",
            present: { non_physical: "Volatile Present" },
            eternal: { non_physical: "Static Eternal" },
            past: [],
            future: [
              { id: "g1", content: "Seek the artifact", emotional_weight: 8 },
              { id: "t1", content: "The empire watches", emotional_weight: 5 },
            ],
          },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: [] },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: [] },
        },
        simulation_log: [],
        input: "Check the door.",
      };
      const snapshot = { ai: { dynamics: { affinity: 50, openness: 50 } }, fractal: { dynamics: {} }, flags: {} };
      const result = prompt_builder.build_character_prompt(payload, snapshot, {});

      expect(result.task).toContain("<FUTURE>");
      expect(result.task).toContain("Seek the artifact");
      expect(result.task).toContain("The empire watches");
    });
  });
});
