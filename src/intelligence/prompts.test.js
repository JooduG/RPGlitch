import { prompt_builder, PROTOCOL_LIBRARY, render_ghostwriter } from "./prompts.js";
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
      expect(result).not.toContain("**");
      expect(result).toContain('"Hello there."');
      expect(result).toContain("She smiled.");
    });

    it("render_history() should collapse consecutive messages of the same entity before slicing", () => {
      const history = [
        { role: "user", content: "Hello", character_name: "Ghost" },
        { role: "user", content: "Are you there?", character_name: "Ghost" },
        { role: "assistant", content: "Greetings", character_name: "Viper" },
        { role: "assistant", content: "I am ready.", character_name: "Viper" },
      ];
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

    it("build_scoring_context() should combine input with recent log content", () => {
      const log = [
        { role: "user", content: "I open the door.", character_name: "Ghost" },
        { role: "assistant", text: "The hinges creak.", character_name: "Viper" },
      ];
      const result = prompt_builder.build_scoring_context("Hello", log);
      expect(result).toContain("Hello");
      expect(result).toContain("I open the door.");
      expect(result).toContain("The hinges creak.");
    });

    it("build_scoring_context() should only include the last 10 entries and tolerate empty input", () => {
      const log = Array.from({ length: 14 }, (_, i) => ({ role: "user", content: `Message ${i}` }));
      const result = prompt_builder.build_scoring_context("", log);
      expect(result).toContain("Message 4");
      expect(result).toContain("Message 13");
      expect(result).not.toContain("Message 0");
      expect(result).not.toContain("Message 3");
      expect(prompt_builder.build_scoring_context("", [])).toBe("");
    });

    it("build_scoring_context() should fall back gracefully for malformed logs", () => {
      expect(prompt_builder.build_scoring_context("only input")).toBe("only input");
      expect(prompt_builder.build_scoring_context("", null)).toBe("");
      expect(prompt_builder.build_scoring_context("", "not-an-array")).toBe("");
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
      expect(PROTOCOL_LIBRARY.HYGIENE.PROSE.length).toBeLessThan(300);
      expect(PROTOCOL_LIBRARY.COGNITION.PHASES.length).toBeLessThan(500);
      expect(PROTOCOL_LIBRARY.AGENCY.USER_BOUNDARIES.length).toBeLessThan(200);
      expect(PROTOCOL_LIBRARY.AGENCY.MOMENTUM.length).toBeLessThan(250);
      expect(PROTOCOL_LIBRARY.HYGIENE.MARKDOWN.length).toBeLessThan(200);

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
          future: "Viper future 1",
        },
        USER: {
          name: "Ghost",
          present: { non_physical: "Ghost Present" },
          eternal: { non_physical: "Ghost Eternal" },
          past: [{ directive: "Ghost past 1" }],
          future: "",
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
    };

    const mock_snapshot = {
      ai: { dynamics: {} },
      fractal: { dynamics: {} },
      flags: {},
    };

    it("build_prologue() omits duplicate SESSION_TIMELINE from FRACTAL PAST block", () => {
      const result = prompt_builder.build_prologue(mock_payload, mock_snapshot);
      expect(result.system).not.toContain("<SESSION_TIMELINE>");
    });

    it("build_prologue() injects core XML tags into simulation prompts", () => {
      const result = prompt_builder.build_prologue(mock_payload, mock_snapshot);
      expect(result.system).toContain("<SYSTEM");
      expect(result.system).toContain('<YOUR_IDENTITY name="Viper">');
      expect(result.task).toContain("<POV_DIRECTIVE>");
      expect(result.task).toContain("Write strictly in first-person");
      expect(result.task).not.toContain("undefined");
      expect(result.task).toContain("<MEMORIES>");
    });

    it("build_prologue() renders third-person POV when entity pov is 3rd_person", () => {
      const third_payload = {
        ...mock_payload,
        entities: {
          ...mock_payload.entities,
          AI: { ...mock_payload.entities.AI, pov: "3rd_person" },
        },
      };
      const result = prompt_builder.build_prologue(third_payload, mock_snapshot);
      expect(result.task).toContain("<POV_DIRECTIVE>");
      expect(result.task).toContain("Write strictly in third-person");
      expect(result.task).not.toContain("undefined");
    });

    it("build_prologue() respects prologue mode", () => {
      const prologue_payload = { ...mock_payload, type: "prologue" };
      const result = prompt_builder.build_prologue(prologue_payload, {});
      expect(result.system).toContain('mode="PROLOGUE"');
      expect(result.system).toContain("<ACTIVE_CHARACTERS>");
    });

    it("build_epilogue() returns valid fractal system prompt", () => {
      const result = prompt_builder.build_epilogue();
      expect(result.system).toContain('role="FRACTAL"');
    });

    it("build_memory_prompt() renders entity-specific forge contexts and Stale Goal Eviction Law", () => {
      const result = prompt_builder.build_memory_prompt({ AI_CHARACTER: { name: "Viper" }, FRACTAL: { name: "Void" } }, []);
      expect(result.system).toContain('<SYSTEM role="MEMORY_FORGE">');
      expect(result.system).toContain('name="Viper"');
      expect(result.system).toContain('name="Void"');
      expect(result.system).toContain("For each active entity");
      expect(result.system).toContain("CRITICAL STALE GOAL EVICTION LAW");
      expect(result.system).toContain("NEVER retain an in-progress statement of an already resolved action");
      expect(result.system).toContain('"type": "past"');
      expect(result.system).not.toContain('"tags"');
    });

    it("build_prologue() prunes empty tags and formats entity blocks cleanly", () => {
      const empty_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
        },
        simulation_log: [],
        input: "Check the door.",
      };
      const result = prompt_builder.build_prologue(empty_payload, mock_snapshot);
      expect(result.system).toContain("<SYSTEM");
      expect(result.system).not.toContain("<MEMORIES>");
      // Empty entity standing-agenda blocks (<INTENT>/<AGENDA>) are pruned;
      // the only remaining reference is the PHASES protocol prose.
      expect(result.system.match(/<INTENT>/g) || []).toHaveLength(0);
      expect(result.system.match(/<AGENDA>/g) || []).toHaveLength(1);
    });
  });

  describe("Prefix-Cache System Prompt Re-ordering", () => {
    it("should separate static SYSTEM from volatile SNAPSHOT in character prompt", () => {
      const payload = {
        round: 5,
        entities: {
          AI: {
            name: "Viper",
            present: { non_physical: "Volatile Present" },
            eternal: { non_physical: "Static Eternal" },
            past: [{ directive: "Volatile Past", emotional_weight: 9 }],
            future: "Volatile Future",
          },
          USER: {
            name: "Ghost",
            present: { non_physical: "User Present" },
            eternal: { non_physical: "User Eternal" },
            past: [],
            future: "",
          },
          FRACTAL: {
            name: "Void",
            present: { non_physical: "Void Present" },
            eternal: { non_physical: "Void Eternal" },
            past: [],
            future: "",
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

      expect(result.system).toContain('<SYSTEM role="Viper">');
      expect(result.system).toContain("Static Eternal");
      expect(result.system).not.toContain("Volatile Present");
      expect(result.system).not.toContain("Volatile Past");
      expect(result.system).toContain("<PROTOCOLS>");
      expect(result.system).not.toContain('intensity="50"');

      expect(result.task).toContain("<SNAPSHOT>");
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
            future: "Future Goal",
          },
          USER: { name: "Ghost", present: {}, eternal: {}, future: "" },
        },
        simulation_log: [],
        input: "Hello",
      };
      const snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} } };

      const result = prompt_builder.build_director_prompt(payload, snapshot);

      expect(result.system).toContain("Volatile Mental State");
      expect(result.system).toContain("Static Mental State");
      expect(result.system).toContain("Future Goal");

      expect(result.system).toContain("<JSON_ONLY>");
      expect(result.system).not.toContain("<PROSE>");
      expect(result.system).not.toContain("<PHASES>");
    });

    it("should include PAST state for all active entities in the Director prompt", () => {
      const payload = {
        round: 1,
        entities: {
          AI: {
            name: "Viper",
            present: {},
            eternal: {},
            past: [{ directive: "Viper past thread" }],
            future: "",
          },
          USER: {
            name: "Ghost",
            present: {},
            eternal: {},
            past: [{ directive: "Ghost past thread" }],
            future: "",
          },
          FRACTAL: {
            name: "Void",
            present: {},
            eternal: {},
            past: [{ directive: "Void past thread" }],
            future: "",
          },
        },
        simulation_log: [],
        input: "Hello",
      };
      const snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} } };

      const result = prompt_builder.build_director_prompt(payload, snapshot);

      expect(result.system).toContain("<MEMORIES>");
      expect(result.system).toContain("Viper past thread");
      expect(result.system).toContain("Ghost past thread");
      expect(result.system).toContain("Void past thread");
    });

    it("should include the directive schema key and Physical Causality Law in the Director prompt", () => {
      const payload = {
        round: 1,
        entities: { AI: { name: "Viper" }, USER: { name: "Ghost" } },
        simulation_log: [],
        input: "Hello",
      };
      const snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} } };

      const result = prompt_builder.build_director_prompt(payload, snapshot);
      expect(result.task).toContain('"directive"');
      expect(result.task).toContain("stage direction");
      expect(result.system).toContain("PHYSICAL CAUSALITY LAW");
    });
  });

  describe("Director Track: Expanded Schema, Keywords & Somatic Directives", () => {
    const base_payload = {
      round: 1,
      entities: {
        AI: {
          name: "Viper",
          present: { non_physical: "Volatile" },
          eternal: { non_physical: "Static" },
          past: [],
          future: "Future Goal",
        },
        USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
        FRACTAL: {
          name: "Void",
          present: { non_physical: "Void Present" },
          eternal: { non_physical: "Void Eternal" },
          past: [],
          future: "",
        },
      },
      simulation_log: [],
      input: "Hello",
    };
    const base_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} } };

    it("exposes <AVAILABLE_KEYWORDS> listing the 12 static archetypes in the Director prompt", () => {
      const result = prompt_builder.build_director_prompt(base_payload, base_snapshot);
      expect(result.system).toContain("<AVAILABLE_KEYWORDS>");
      for (const kw of ["shame", "fear", "betrayal", "abandonment", "grief", "dysregulation"]) {
        expect(result.system).toContain(kw);
      }
    });

    it("exposes the expanded schema fields (speaker, keywords, story_status) in the Director task", () => {
      const result = prompt_builder.build_director_prompt(base_payload, base_snapshot);
      expect(result.task).toContain('"speaker"');
      expect(result.task).toContain('"keywords"');
      expect(result.task).toContain('"story_status"');
      expect(result.task).toContain("CONCLUDED");
      expect(result.task).toContain("COLLAPSED");
    });

    it("injects <SOMATIC_DIRECTIVES> into the character prompt when the Director selects keywords", () => {
      const result = prompt_builder.build_character_prompt(base_payload, base_snapshot, {
        keywords: ["shame", "stoic_pain"],
      });
      expect(result.task).toContain("<SOMATIC_DIRECTIVES>");
      expect(result.task).toContain("- shame: Weave involuntary physical shame tells");
      expect(result.task).toContain("- stoic_pain: Mask pain behind curt declarative statements");
    });

    it("omits <SOMATIC_DIRECTIVES> when the Director selects no keywords", () => {
      const result = prompt_builder.build_character_prompt(base_payload, base_snapshot, { keywords: [] });
      expect(result.task).not.toContain("<SOMATIC_DIRECTIVES>");
    });

    it("builds the scene-narrator prompt for a delegated fractal speaker", () => {
      const result = prompt_builder.build_scene_narrator_prompt(base_payload, base_snapshot, {
        keywords: ["dysregulation"],
      });
      expect(result.system).toContain('<SYSTEM role="Void"');
      expect(result.task).toContain("living world and environment");
      expect(result.task).toContain("<SOMATIC_DIRECTIVES>");
      expect(result.task).toContain("Cognitive overload");
    });

    it("leaves prologue/epilogue bookends free of somatic directives", () => {
      const prologue = prompt_builder.build_prologue(base_payload, base_snapshot);
      expect(prologue.task).not.toContain("<SOMATIC_DIRECTIVES>");
    });

    it("nudges the Director toward fractal narration on non-verbal environmental turns", () => {
      const env_payload = { ...base_payload, input: "I press my palm flat against the cold iron gate and wait." };
      const result = prompt_builder.build_director_prompt(env_payload, base_snapshot);
      expect(result.task).toContain("<USER_ACTION_NOTE>");
      expect(result.task).toContain('"speaker" to "fractal"');
      expect(result.system).toContain("SPEAKER_ROUTING");
    });

    it("does not nudge fractal narration when the user turn contains dialogue", () => {
      const dialogue_payload = { ...base_payload, input: '"Open the gate, Benedict."' };
      const result = prompt_builder.build_director_prompt(dialogue_payload, base_snapshot);
      expect(result.task).not.toContain("<USER_ACTION_NOTE>");
    });

    it("includes the pacing-calibration guidance in the character task", () => {
      const result = prompt_builder.build_character_prompt(base_payload, base_snapshot, {});
      expect(result.task).toContain("Roughly match the length and energy of the user's message");
      expect(result.task).not.toContain("roughly 2 paragraphs");
    });

    it("no longer requires literal bracket hooks in the scene-continuation protocol", () => {
      const result = prompt_builder.build_scene_narrator_prompt(base_payload, base_snapshot, {});
      expect(result.task).toContain("dominant hook");
      expect(result.task).not.toContain("[Statement]");
    });
  });

  describe("Integration: XML Block Verification", () => {
    it("build_prologue() correctly integrates all core XML blocks", () => {
      const payload = {
        round: 5,
        entities: {
          AI: {
            name: "Viper",
            present: { non_physical: "Present" },
            eternal: { non_physical: "Eternal" },
            past: [{ directive: "P1", emotional_weight: 9 }],
            future: "F1",
          },
          USER: {
            name: "Ghost",
            present: { non_physical: "User Present" },
            eternal: { non_physical: "User Eternal" },
            past: [],
            future: "",
          },
          FRACTAL: {
            name: "Void",
            present: { non_physical: "Void Present" },
            eternal: { non_physical: "Void Eternal" },
            past: [],
            future: "",
          },
        },
        simulation_log: [],
        input: "Check the console.",
      };

      const snapshot = {
        ai: { dynamics: { intensity: 50, openness: 60 } },
        fractal: { dynamics: { entropy: 10 } },
        flags: { test: true },
      };

      const result = prompt_builder.build_prologue(payload, snapshot);

      expect(result.system).toContain('<SYSTEM role="Viper">');
      expect(result.system).toContain('<YOUR_IDENTITY name="Viper">');
      expect(result.task).toContain('<YOUR_IDENTITY name="Viper" intensity="50" openness="60">');
      expect(result.task).toContain("<MEMORIES>");
      expect(result.system).not.toContain("<DIRECTION>");
      expect(result.system).toContain("<PROTOCOLS>");
      expect(result.task).toContain("<USER_ACTION>");
      expect(result.task).toContain("Check the console.");

      expect(result.meta).toBeDefined();
      expect(result.meta.ai).toEqual(snapshot.ai.dynamics);
      expect(result.meta.fractal).toEqual(snapshot.fractal.dynamics);
      expect(result.meta?.memories).toBeDefined();
      expect(result.meta?.memories).toBeInstanceOf(Array);
    });

    it("build_prologue() injects adaptive stability protocols based on meta.structural_errors", () => {
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

      let result = prompt_builder.build_prologue(payload, snapshot);
      expect(result.task).toContain("WARNING: Structural drift detected.");

      payload.meta.structural_errors = 3;
      result = prompt_builder.build_prologue(payload, snapshot);
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
      expect(result.system).toContain("<PERMANENT_APPEARANCE>");
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

    it("build_enhancement() scopes context to the field in question (no cross-field bleed)", () => {
      const entity = {
        eternal: { physical: "Eternal body.", non_physical: "Eternal psyche." },
        present: { physical: "Present outfit.", non_physical: "Present mood." },
        past: [{ id: "p1", content: "Old memory anchor", type: "past", emotional_weight: 5 }],
        future: "Impending prophecy",
      };
      const result = prompt_builder.build_enhancement("present.non_physical", "Present mood.", "Viper", "character", false, entity);
      expect(result.system).toContain("Present mood.");
      expect(result.system).not.toContain("Eternal psyche.");
      expect(result.system).not.toContain("Eternal body.");
      expect(result.system).not.toContain("Old memory anchor");
      expect(result.system).not.toContain("Impending prophecy");
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
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const result = prompt_builder.build_character_prompt(mock_payload, mock_snapshot, {});
      expect(result.system).toContain('<NARRATIVE_STYLE narrator="anna_zaires">');
      _mock_app.settings.narrative_style = "default";
    });

    it("should not prepend author style prompt if app.settings.narrative_style is 'default'", () => {
      _mock_app.settings.narrative_style = "default";
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const result = prompt_builder.build_character_prompt(mock_payload, mock_snapshot, {});
      expect(result.system).not.toContain("<NARRATIVE_STYLE");
    });

    it("should prepend author style prompt to build_narrator (prologue) if active", () => {
      _mock_app.settings.narrative_style = "william_gibson";
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const prologue_payload = { ...mock_payload, type: "prologue" };
      const result = prompt_builder.build_prologue(prologue_payload, mock_snapshot);
      expect(result.system).toContain('<NARRATIVE_STYLE narrator="william_gibson">');
      _mock_app.settings.narrative_style = "default";
    });

    it("should include EPISTEMIC_PHYSICS in build_character_prompt but not build_epilogue or prologue narrator narration", () => {
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
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
      const prologue_result = prompt_builder.build_prologue(prologue_payload, mock_snapshot);
      expect(prologue_result.system).not.toContain("Perception ends at sensory horizon");
    });

    it("should omit USER_ACTION and INTERNAL_DIRECTION tags if they are empty", () => {
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
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

    it("should render <DIRECTOR_NOTE> into the character task when the Director emits a directive", () => {
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      const result = prompt_builder.build_character_prompt(mock_payload, mock_snapshot, {
        directive: "The memory of the orphanage fire makes you restless tonight.",
      });

      expect(result.task).toContain("<DIRECTOR_NOTE>");
      expect(result.task).toContain("orphanage fire makes you restless tonight");
      expect(result.task).toContain("unseen stage direction");
    });

    it("should omit <DIRECTOR_NOTE> when the Director emits no directive", () => {
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      const with_directive = prompt_builder.build_character_prompt(mock_payload, mock_snapshot, {
        directive: "The memory of the orphanage fire makes you restless tonight.",
      });
      const without_directive = prompt_builder.build_character_prompt(mock_payload, mock_snapshot, {});

      expect(with_directive.task).toContain("<DIRECTOR_NOTE>");
      expect(without_directive.task).not.toContain("<DIRECTOR_NOTE>");
    });

    it("should escape Director directive content before embedding it in the prompt", () => {
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
        },
        simulation_log: [],
        input: "Hello",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      const result = prompt_builder.build_character_prompt(mock_payload, mock_snapshot, {
        directive: "She asks <them> where 'they' went.",
      });

      expect(result.task).not.toContain("asks <them>");
      expect(result.task).toContain("&lt;them&gt;");
    });

    it("should safely build prompts even if entities.FRACTAL is undefined", () => {
      const mock_payload_no_fractal = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: undefined,
        },
        simulation_log: [],
        input: "Run simulation",
      };
      const mock_snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      const dir_result = prompt_builder.build_director_prompt(mock_payload_no_fractal, mock_snapshot);
      expect(dir_result.system).not.toContain("<FRACTAL");

      const char_result = prompt_builder.build_character_prompt(mock_payload_no_fractal, mock_snapshot, {});
      expect(char_result.system).not.toContain("<FRACTAL");
    });

    it("build_director_prompt() includes DYNAMICS_LEGEND with all axis descriptions", () => {
      const mock_payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
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
      USER: { name: "Rafael Orion", eternal: { non_physical: "Heroic himbo" }, present: { non_physical: "Ready" } },
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

    it("swaps the user and AI data through the character protocol", () => {
      const { system, task } = render_ghostwriter({ entities, input: "" });
      const user_block = system.slice(system.indexOf('YOUR_IDENTITY name="Rafael Orion"'), system.indexOf("</YOUR_IDENTITY>"));
      expect(user_block).toContain("Heroic himbo");
      const ai_block = system.slice(system.indexOf('<USER_PERSONA name="Glitch"'), system.indexOf("</USER_PERSONA>"));
      expect(ai_block).toContain("Cyan-haired hacker");
      expect(task).toContain("<SNAPSHOT>");
      expect(task).toContain("<THINK_FORMAT>");
      expect(task).toContain("Do not write dialogue, actions, or thoughts for Glitch");
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
          future: "",
        },
        USER: {
          name: "Ghost",
          present: { non_physical: "User Present" },
          eternal: { non_physical: "User Eternal" },
          past: [],
          future: "",
        },
        FRACTAL: {
          name: "Void",
          present: { non_physical: "Void Present" },
          eternal: { non_physical: "Void Eternal" },
          past: [],
          future: "",
        },
      },
      simulation_log: [],
      input: "Hello",
    };

    it("includes the cognitive ground instruction in EPISTEMIC_PHYSICS", () => {
      const snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const result = prompt_builder.build_character_prompt(mock_payload, snapshot, {});
      expect(result.task).toContain("Sensory Boundary:");
      expect(result.task).toContain("Perspective Isolation:");
    });

    it("moves the dynamics legend into SYSTEM and keeps values as attrs on YOUR_IDENTITY", () => {
      const snapshot = {
        ai: { dynamics: { chaos: 50, intensity: 75, openness: 32, affinity: 69 } },
        fractal: { dynamics: { entropy: 63, velocity: 41 } },
        flags: {},
      };
      const result = prompt_builder.build_character_prompt(mock_payload, snapshot, {});
      expect(result.task).not.toContain("<DYNAMICS_CALIBRATION>");
      expect(result.system).toContain("<DYNAMICS_LEGEND>");
      expect(result.system).toContain("- entropy (Entropy): Structural Reality / Weirdness");
      expect(result.task).toContain('chaos="50"');
      expect(result.task).toContain('intensity="75"');
      expect(result.task).toContain('entropy="63"');
    });

    it("gates USER_BOUNDARIES and YES_AND on the presence of a user action", () => {
      const snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };
      const with_input = prompt_builder.build_character_prompt({ ...mock_payload, input: "Check the console." }, snapshot, {});
      const without_input = prompt_builder.build_character_prompt({ ...mock_payload, input: "" }, snapshot, {});
      expect(with_input.system).toContain("Never predict, assume, or generate the user's next action");
      expect(without_input.system).not.toContain("Never predict, assume, or generate the user's next action");
      expect(with_input.system).toContain("Yes, and...");
      expect(without_input.system).not.toContain("Yes, and...");
      expect(with_input.task).toContain("Execute your reaction against <USER_ACTION>.");
      expect(without_input.task).toContain("Continue the scene, reacting to the current situation.");
    });

    it("injects a pacing signal when AI intensity is high", () => {
      const snapshot = {
        ai: { dynamics: { intensity: 85, chaos: 50, openness: 50, affinity: 50 } },
        fractal: { dynamics: {} },
        flags: {},
      };
      const result = prompt_builder.build_character_prompt(mock_payload, snapshot, {});
      expect(result.task).toContain("<DYNAMICS_SIGNALS>");
      expect(result.task).toContain("High-adrenaline pacing");
    });

    it("injects a pathetic fallacy signal when fractal entropy is high", () => {
      const snapshot = {
        ai: { dynamics: {} },
        fractal: { dynamics: { entropy: 85, velocity: 50 } },
        flags: {},
      };
      const result = prompt_builder.build_character_prompt(mock_payload, snapshot, {});
      expect(result.task).toContain("Pathetic fallacy");
    });

    it("omits the signals block when all dynamics are neutral", () => {
      const snapshot = {
        ai: { dynamics: { intensity: 50, chaos: 50, openness: 50, affinity: 50 } },
        fractal: { dynamics: { entropy: 50, velocity: 50 } },
        flags: {},
      };
      const result = prompt_builder.build_character_prompt(mock_payload, snapshot, {});
      expect(result.task).not.toContain("<DYNAMICS_SIGNALS>");
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
            future: "Seek the artifact\nThe empire watches",
          },
          USER: { name: "Ghost", present: {}, eternal: {}, past: [], future: "" },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
        },
        simulation_log: [],
        input: "Check the door.",
      };
      const snapshot = { ai: { dynamics: { affinity: 50, openness: 50 } }, fractal: { dynamics: {} }, flags: {} };
      const result = prompt_builder.build_character_prompt(payload, snapshot, {});

      expect(result.task).toContain("<INTENT>");
      expect(result.task).toContain("Seek the artifact");
      expect(result.task).toContain("The empire watches");
    });

    it("withholds the USER_PERSONA FUTURE from the character while keeping it for the Director", () => {
      const payload = {
        round: 1,
        entities: {
          AI: { name: "Viper", present: {}, eternal: {}, past: [], future: "" },
          USER: {
            name: "Ghost",
            present: { non_physical: "Present note" },
            eternal: {},
            past: [],
            future: "Bind the Protector to the rig",
          },
          FRACTAL: { name: "Void", present: {}, eternal: {}, past: [], future: "" },
        },
        simulation_log: [],
        input: "Hello.",
      };
      const snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

      const character = prompt_builder.build_character_prompt(payload, snapshot, {});
      expect(character.task).toContain('<USER_PERSONA name="Ghost">');
      expect(character.task).not.toContain("Bind the Protector to the rig");

      const director = prompt_builder.build_director_prompt(payload, snapshot);
      expect(director.system).toContain("Bind the Protector to the rig");
    });
  });

  describe("Epistemic Wall: SECRET/PLAN filtering", () => {
    const build_entities = () => ({
      AI: {
        name: "Viper",
        present: { non_physical: "[MOOD: alert] [SECRET: knows the vault code] [PLAN: steal the cipher]" },
        eternal: { non_physical: "Static Eternal" },
        past: [],
        future: "",
      },
      USER: {
        name: "Ghost",
        present: { non_physical: "[MOOD: calm] [SECRET: stole the ledger] [PLAN: reach the docks]" },
        eternal: { non_physical: "User Eternal" },
        past: [],
        future: "",
      },
      FRACTAL: { name: "Void", present: { non_physical: "Void Present" }, eternal: { non_physical: "Void Eternal" }, past: [], future: "" },
    });

    const snapshot = { ai: { dynamics: {} }, fractal: { dynamics: {} }, flags: {} };

    it("strips the User's SECRET and PLAN from AI Character prompt rendering", () => {
      const payload = { round: 1, entities: build_entities(), simulation_log: [], input: "Check the door." };
      const result = prompt_builder.build_character_prompt(payload, snapshot, {});

      expect(result.task).not.toContain("stole the ledger");
      expect(result.task).not.toContain("reach the docks");
    });

    it("keeps the AI character's own SECRET and PLAN visible to itself", () => {
      const payload = { round: 1, entities: build_entities(), simulation_log: [], input: "Check the door." };
      const result = prompt_builder.build_character_prompt(payload, snapshot, {});

      expect(result.task).toContain("knows the vault code");
      expect(result.task).toContain("steal the cipher");
    });

    it("keeps the User's SECRET and PLAN visible in the Director overview", () => {
      const payload = { round: 1, entities: build_entities(), simulation_log: [], input: "Check the door." };
      const result = prompt_builder.build_director_prompt(payload, snapshot);

      expect(result.system).toContain("stole the ledger");
      expect(result.system).toContain("reach the docks");
    });
  });

  describe("Ingestion Directive", () => {
    it("omits the ingestion directive by default", () => {
      const result = prompt_builder.build_profile_sorting_prompt("Raw lore", "character");
      expect(result.system).not.toContain("INGESTION_DIRECTIVE");
      expect(result.system).not.toContain("SOURCE_OF_TRUTH");
    });

    it("appends the ingestion directive when ingestion: true", () => {
      const result = prompt_builder.build_profile_sorting_prompt("Raw lore", "character", { ingestion: true });
      expect(result.system).toContain("<INGESTION_DIRECTIVE");
      expect(result.system).toContain("SOURCE_OF_TRUTH");
      expect(result.system).toContain("Map them verbatim into corresponding schema fields.");
      expect(result.system).toContain("NO_NULL_FABRICATION");
      expect(result.system).toContain("NEVER emit null, undefined, or empty string values.");
    });

    it("applies the ingestion directive to fractal sorting too", () => {
      const result = prompt_builder.build_profile_sorting_prompt("World lore", "fractal", { ingestion: true });
      expect(result.system).toContain("FOCUS: Extracting data for a FRACTAL");
      expect(result.system).toContain("<INGESTION_DIRECTIVE");
    });

    it("exposes the directive text in the protocol library", () => {
      expect(PROTOCOL_LIBRARY.PROFILE.INGESTION_DIRECTIVE).toContain("L3_HIGH");
      expect(PROTOCOL_LIBRARY.PROFILE.INGESTION_DIRECTIVE).toContain("NO_NULL_FABRICATION");
    });
  });
});
