/**
 * src/intelligence/prompts/shared.test.js
 * 🧩 UNIT TESTS: SHARED PROMPT UTILITIES & PREFIX CACHING
 */

import { describe, expect, it } from "vitest";
import {
  PROTOCOL_LIBRARY,
  parse_macros,
  render_protocols,
  render_system_head,
  strip_epistemic_tags,
  render_display_macros,
  resolve_display_macro_segments,
  strip_profile_wrappers,
  unwrap_enhancement_text,
} from "./shared.js";
import { render_builder } from "./builder.js";
import { build_pacing_directive } from "./story-prompts.js";

describe("Shared Prompt Utilities (shared.js)", () => {
  describe("Static Helpers & History Rendering", () => {
    it("render_history() should map roles correctly", () => {
      const history = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Greetings", character_name: "Viper" },
        { role: "prologue", content: "The scene opens." },
      ];
      const result = render_builder.render_history(history);
      expect(result).toContain('role="USER_PERSONA"');
      expect(result).toContain('role="AI_CHARACTER" name="Viper"');
      expect(result).toContain('role="FRACTAL"');
    });

    it("render_history() should strip double asterisks wrapping dialogue", () => {
      const history = [{ role: "assistant", content: 'She smiled. **"Hello there."**', character_name: "Viper" }];
      const result = render_builder.render_history(history);
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
      const result = render_builder.render_history(history, 2);
      expect(result).toContain('name="Ghost">Hello\nAre you there?</entry>');
      expect(result).toContain('name="Viper">Greetings\nI am ready.</entry>');
    });

    it("render_history() should filter out system messages", () => {
      const history = [
        { role: "user", content: "Hello", character_name: "Ghost" },
        { role: "system", content: "Vector Resolved: ..." },
        { role: "assistant", content: "Greetings", character_name: "Viper" },
      ];
      const result = render_builder.render_history(history, 2);
      expect(result).toContain('name="Ghost">Hello</entry>');
      expect(result).toContain('name="Viper">Greetings</entry>');
      expect(result).not.toContain("Vector Resolved");
    });

    it("render_protocols() should return XML-tagged protocols", () => {
      const out = render_protocols("AGENCY.MOMENTUM, HYGIENE.PROSE_DISCIPLINE");
      expect(out).toContain("<MOMENTUM>End on a live beat");
      expect(out).toContain("without structural labels.</MOMENTUM>");
      expect(out).toContain("<PROSE_DISCIPLINE>Omit conversational preambles");
      expect(out).toContain("Always end on a complete sentence.</PROSE_DISCIPLINE>");
    });
  });

  describe("Protocol Library Consolidation", () => {
    it("should ensure core protocols are compacted and deduplicated", () => {
      expect(PROTOCOL_LIBRARY.HYGIENE.PROSE_DISCIPLINE.length).toBeLessThan(500);
      expect(PROTOCOL_LIBRARY.COGNITION.THINK_CHARACTER.length).toBeLessThan(600);
      expect(PROTOCOL_LIBRARY.AGENCY.USER_BOUNDARIES.length).toBeLessThan(200);
      expect(PROTOCOL_LIBRARY.AGENCY.MOMENTUM.length).toBeLessThan(250);
      expect(PROTOCOL_LIBRARY.HYGIENE.ANTI_TROPES.length).toBeGreaterThan(500);

      const base_hygiene = "Omit conversational preambles, greetings, or meta-commentary. Start instantly.";
      expect(PROTOCOL_LIBRARY.HYGIENE.PROSE_DISCIPLINE).toContain(base_hygiene);
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
      const result = parse_macros(text, mock_entities.AI, mock_entities);
      expect(result).toBe("I am Viper, you are Ghost.");

      const alt = "Legacy {{char}} and {{user}}.";
      const alt_result = parse_macros(alt, mock_entities.AI, mock_entities);
      expect(alt_result).toBe("Legacy Viper and Ghost.");
    });

    it("parse_macros() should resolve macros correctly for USER owner", () => {
      const text = "I am {{me}}, you are {{you}}.";
      const result = parse_macros(text, mock_entities.USER, mock_entities);
      expect(result).toBe("I am Ghost, you are Viper.");

      const alt = "Legacy {{user}} and {{char}}.";
      const alt_result = parse_macros(alt, mock_entities.USER, mock_entities);
      expect(alt_result).toBe("Legacy Ghost and Viper.");
    });

    it("parse_macros() should resolve macros correctly for FRACTAL owner", () => {
      const text = "This is {{fractal}}, welcome {{you}}.";
      const result = parse_macros(text, mock_entities.FRACTAL, mock_entities);
      expect(result).toBe("This is Void, welcome Viper and Ghost.");

      const alt = "Fallback {{me}}, AI is {{char}}, User is {{user}}.";
      const alt_result = parse_macros(alt, mock_entities.FRACTAL, mock_entities);
      expect(alt_result).toBe("Fallback Void, AI is Viper, User is Ghost.");
    });
  });

  describe("Display Macro Rendering (render_display_macros)", () => {
    const mock_entities = {
      AI: { name: "Viper" },
      USER: { name: "Ghost" },
      FRACTAL: { name: "Void" },
    };

    it("resolves known macros to display names", () => {
      expect(render_display_macros("I am {{me}}, you are {{you}}.", mock_entities.AI, mock_entities)).toBe("I am Viper, you are Ghost.");
      expect(render_display_macros("Welcome to {{fractal}}.", mock_entities.AI, mock_entities)).toBe("Welcome to Void.");
      expect(render_display_macros("In {{fractal}}, {{char}} waits.", mock_entities.FRACTAL, mock_entities)).toBe("In Void, Viper waits.");
    });

    it("is case-insensitive", () => {
      expect(render_display_macros("{{ME}}", mock_entities.AI, mock_entities)).toBe("Viper");
    });

    it("emits a visible placeholder for unknown macros instead of the raw token", () => {
      const out = render_display_macros("Grip the {{unknown}} tight.", mock_entities.AI, mock_entities);
      expect(out).toBe(`Grip the \u27e8unknown\u27e9 tight.`);
      expect(out).not.toContain("{{");
    });

    it("emits a friendly muted label for unresolved {{you}}/{{user}}", () => {
      expect(render_display_macros("Talk to {{you}} now.", mock_entities.AI, {})).toBe("Talk to scene partner now.");
      expect(render_display_macros("{{user}} awaits.", mock_entities.AI, {})).toBe("scene partner awaits.");
      expect(render_display_macros("{{you}} vs {{me}}", mock_entities.AI, {})).toBe("scene partner vs Viper");
    });

    it("emits friendly muted labels for every known macro when its entity is absent", () => {
      expect(render_display_macros("Welcome to {{fractal}}.", mock_entities.AI, {})).toBe("Welcome to the world.");
      expect(render_display_macros("{{char}} waits.", mock_entities.AI, {})).toBe("the protagonist waits.");
      expect(render_display_macros("In {{fractal}}, {{char}} and {{you}} meet.", mock_entities.AI, {})).toBe(
        "In the world, the protagonist and scene partner meet.",
      );
    });

    it("emits a friendly label for {{me}} when the owner has no name", () => {
      expect(render_display_macros("I am {{me}}.", { name: "" }, mock_entities)).toBe("I am this character.");
      expect(render_display_macros("Here, {{me}} endures.", { name: "  ", type: "fractal" }, mock_entities)).toBe("Here, this world endures.");
    });

    it("emits placeholders when the owning entity is missing", () => {
      expect(render_display_macros("{{me}}", null, mock_entities)).toBe(`\u27e8me\u27e9`);
      expect(render_display_macros("", mock_entities.AI, mock_entities)).toBe("");
    });

    it("leaves plain prose untouched", () => {
      expect(render_display_macros("A quiet night in the archive.", mock_entities.AI, mock_entities)).toBe("A quiet night in the archive.");
    });
  });

  describe("Display Macro Segments (resolve_display_macro_segments)", () => {
    const pink_ai = { name: "Viper", signature_color: "Adrenaline Pink" };
    const mock_entities = { AI: pink_ai, USER: { name: "Ghost", signature_color: "Electric Cyan" }, FRACTAL: { name: "Void" } };

    it("splits text into plain and macro segments carrying the resolved entity", () => {
      const segs = resolve_display_macro_segments("Hi {{me}}, I see {{char}}.", pink_ai, mock_entities);
      expect(segs).toEqual([
        { text: "Hi ", macro: null, entity: null },
        { text: "Viper", macro: "me", entity: pink_ai },
        { text: ", I see ", macro: null, entity: null },
        { text: "Viper", macro: "char", entity: pink_ai },
        { text: ".", macro: null, entity: null },
      ]);
    });

    it("resolves {{you}} to the USER entity for color", () => {
      const segs = resolve_display_macro_segments("You are {{you}}.", pink_ai, mock_entities);
      expect(segs[1]).toEqual({ text: "Ghost", macro: "you", entity: mock_entities.USER });
    });

    it("marks unresolved {{you}} with null entity so the UI can mute it", () => {
      const segs = resolve_display_macro_segments("Talk to {{you}}.", pink_ai, {});
      expect(segs[1]).toEqual({ text: "scene partner", macro: "you", entity: null });
    });

    it("marks every absent known macro with null entity and its friendly label", () => {
      const segs = resolve_display_macro_segments("In {{fractal}}, {{char}} meets {{me}}.", { name: "", type: "character" }, {});
      expect(segs).toEqual([
        { text: "In ", macro: null, entity: null },
        { text: "the world", macro: "fractal", entity: null },
        { text: ", ", macro: null, entity: null },
        { text: "the protagonist", macro: "char", entity: null },
        { text: " meets ", macro: null, entity: null },
        { text: "this character", macro: "me", entity: null },
        { text: ".", macro: null, entity: null },
      ]);
    });

    it("marks unknown macros with null entity and a placeholder label", () => {
      const segs = resolve_display_macro_segments("The {{glimmer}} shines.", pink_ai, mock_entities);
      expect(segs[1]).toEqual({ text: `\u27e8glimmer\u27e9`, macro: "glimmer", entity: null });
    });

    it("returns [] for empty input", () => {
      expect(resolve_display_macro_segments("", pink_ai, mock_entities)).toEqual([]);
      expect(resolve_display_macro_segments(null, pink_ai, mock_entities)).toEqual([]);
    });
  });

  describe("Profile Wrapper Stripping (strip_profile_wrappers)", () => {
    it("removes structural XML tags the model echoed into a field value", () => {
      const raw = "<ETERNAL><NON_PHYSICAL>The world is a machine of consequence.</NON_PHYSICAL></ETERNAL>";
      expect(strip_profile_wrappers(raw)).toBe("The world is a machine of consequence.");
    });

    it("removes a leading markdown-bold field-key header", () => {
      const raw = "**PRESENT.NON_PHYSICAL** She is restless tonight.";
      expect(strip_profile_wrappers(raw)).toBe("She is restless tonight.");
    });

    it("removes self-closing and attribute-bearing wrapper tags", () => {
      const raw = 'Some prose <LAYER eternal="physical" /> and more <ENTITY_CONTEXT label="x">tail</ENTITY_CONTEXT>';
      const out = strip_profile_wrappers(raw);
      expect(out).not.toContain("<LAYER");
      expect(out).not.toContain("<ENTITY_CONTEXT");
      expect(out).toContain("Some prose");
      expect(out).toContain("tail");
    });

    it("leaves ordinary prose untouched", () => {
      const raw = "She traces the seam of the old world.";
      expect(strip_profile_wrappers(raw)).toBe("She traces the seam of the old world.");
    });

    it("handles nullish and empty input", () => {
      expect(strip_profile_wrappers(null)).toBe("");
      expect(strip_profile_wrappers(undefined)).toBe("");
      expect(strip_profile_wrappers("")).toBe("");
    });
  });

  describe("Enhancement Value Unwrapping (unwrap_enhancement_text)", () => {
    it("unwraps a fenced nested JSON object to the innermost string", () => {
      const raw =
        '```json\n{\n  "eternal": {\n    "non_physical": "Driven by a dual devotion to altruistic heroism and physical perfection, {{me}} operates with earnest energy."\n  }\n}\n```';
      const out = unwrap_enhancement_text(raw, "eternal.non_physical");
      expect(out).toBe("Driven by a dual devotion to altruistic heroism and physical perfection, {{me}} operates with earnest energy.");
    });

    it("prefers the field_id key path when multiple sections exist", () => {
      const raw = '{"present": {"non_physical": "Present prose here."}, "eternal": {"non_physical": "Eternal prose here."}}';
      expect(unwrap_enhancement_text(raw, "eternal.non_physical")).toBe("Eternal prose here.");
      expect(unwrap_enhancement_text(raw, "present.non_physical")).toBe("Present prose here.");
    });

    it("falls back to the longest string leaf for sub-key objects", () => {
      const raw = JSON.stringify({
        present: {
          non_physical: {
            immediate_emotional_pressure: "High-energy euphoria from public validation.",
            active_mental_focus: "Maintaining a heroic public image while scanning the scene.",
            present_behavioral_drivers: "Performative masculinity and the desire for continued attention.",
          },
        },
      });
      const out = unwrap_enhancement_text(raw, "present.non_physical");
      expect(out).toBe("Performative masculinity and the desire for continued attention.");
    });

    it("strips XML tags and fences together", () => {
      const raw = '<PERSONALITY>```json\n{"non_physical": "Clean after all the wrappers."}\n```</PERSONALITY>';
      expect(unwrap_enhancement_text(raw, "non_physical")).toBe("Clean after all the wrappers.");
    });

    it("passes plain prose through untouched", () => {
      const prose = "He hides a deep fear of being rejected for his true, non-superhero self.";
      expect(unwrap_enhancement_text(prose, "eternal.non_physical")).toBe(prose);
    });

    it("returns clean prose when the JSON is unparsable", () => {
      const raw = "Some prose with an unmatched { brace inside.";
      expect(unwrap_enhancement_text(raw, "eternal.non_physical")).toBe("Some prose with an unmatched { brace inside.");
    });

    it("handles nullish and empty input", () => {
      expect(unwrap_enhancement_text(null)).toBe("");
      expect(unwrap_enhancement_text(undefined)).toBe("");
      expect(unwrap_enhancement_text("")).toBe("");
    });
  });

  describe("Shared SYSTEM Head & Caching", () => {
    const make_entities = () => ({
      AI: { id: "ai-1", name: "Viper", eternal: { non_physical: "Static Eternal", physical: "Tall, scarred." } },
      FRACTAL: { id: "f-1", name: "Void", eternal: { non_physical: "Void Eternal", physical: "Endless dark." } },
    });

    it("emits byte-identical <SYSTEM> head when eternal baselines do not change", () => {
      const head1 = render_system_head(make_entities());
      const head2 = render_system_head(make_entities());
      expect(head1).toBe(head2);
      expect(head1).toContain("<CAST>");
      expect(head1).toContain('<AI_CHARACTER name="Viper">');
      expect(head1).toContain('<FRACTAL name="Void">');
    });

    it("omits FRACTAL row from head when fractal entity is absent", () => {
      const entities = { AI: { id: "ai-1", name: "Viper", eternal: { non_physical: "Eternal" } } };
      const head = render_system_head(entities);
      expect(head).not.toContain("<FRACTAL");
      expect(head).toContain("<CAST>");
    });
  });

  describe("Pacing Directive & Epistemic Tags", () => {
    it("classifies terse vs expansive vs silent input correctly", () => {
      expect(build_pacing_directive("")).toContain("PACING: no prompt");
      expect(build_pacing_directive("Where is the vault?")).toContain("PACING: terse");
      expect(build_pacing_directive("w".repeat(320))).toContain("PACING: expansive");
    });

    it("strips [SECRET:] and [PLAN:] tags cleanly", () => {
      const raw = "Visible text [SECRET: stolen key] more text [PLAN: escape at midnight]";
      const stripped = strip_epistemic_tags(raw);
      expect(stripped).toBe("Visible text more text");
    });
  });
});
