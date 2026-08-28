/**
 * src/intelligence/prompts/shared.test.js
 * 🧩 UNIT TESTS: SHARED PROMPT UTILITIES & PREFIX CACHING
 */

import { describe, expect, it } from "vitest";
import { PROTOCOL_LIBRARY, parse_macros, render_protocols, render_system_head, strip_epistemic_tags } from "./shared.js";
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
      expect(build_pacing_directive("")).toContain("INPUT RHYTHM: no prompt");
      expect(build_pacing_directive("Where is the vault?")).toContain("INPUT RHYTHM: terse");
      expect(build_pacing_directive("w".repeat(320))).toContain("INPUT RHYTHM: expansive");
    });

    it("strips [SECRET:] and [PLAN:] tags cleanly", () => {
      const raw = "Visible text [SECRET: stolen key] more text [PLAN: escape at midnight]";
      const stripped = strip_epistemic_tags(raw);
      expect(stripped).toBe("Visible text more text");
    });
  });
});
