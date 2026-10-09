/**
 * src/utils/macros.test.js
 * 🧪 UNIT TESTS: Macros & Universal @ENTITY Resolution
 *
 * Verifies case-insensitive uppercase @ENTITY and role token resolution across
 * AI, User, and Fractal perspectives, concrete ID matches, and display segments.
 */

import { describe, it, expect } from "vitest";
import { parse_macros, resolve_display_macro_segments } from "./macros.js";

// ============================================================================
// [SECTION 1: TEST SUITE]
// ============================================================================

describe("Universal @ENTITY Macro Engine", () => {
  const user = { id: "usr_protagonist", name: "Alice", type: "user" };
  const ai = { id: "char_julien", name: "Julien", type: "character", signature_color: "Soft Rose" };
  const fractal = { id: "fractal_spire", name: "The Spire", type: "fractal", signature_color: "Emerald" };
  const entities = { USER: user, AI: ai, FRACTAL: fractal };

  describe("parse_macros", () => {
    it("resolves role tokens from AI perspective", () => {
      const text = "@SPEAKER observes @LISTENER within @FRACTAL.";
      const resolved = parse_macros(text, ai, entities);
      expect(resolved).toBe("Julien observes Alice within The Spire.");
    });

    it("resolves @ME and @YOU from User perspective", () => {
      const text = "@ME speaks to @YOU.";
      const resolved = parse_macros(text, user, entities);
      expect(resolved).toBe("Alice speaks to Julien.");
    });

    it("resolves @USER and @CHAR explicitly regardless of perspective", () => {
      const text = "A pact between @USER and @CHAR.";
      expect(parse_macros(text, ai, entities)).toBe("A pact between Alice and Julien.");
      expect(parse_macros(text, user, entities)).toBe("A pact between Alice and Julien.");
    });

    it("resolves concrete @JULIEN token to Julien", () => {
      const text = "A message meant for @JULIEN.";
      const resolved = parse_macros(text, user, entities);
      expect(resolved).toBe("A message meant for Julien.");
    });

    it("resolves unified perspective braces {me}/{you} like @ME/@YOU", () => {
      expect(parse_macros("{me} speaks to {you}.", user, entities)).toBe("Alice speaks to Julien.");
      expect(parse_macros("{me} observes {you}.", ai, entities)).toBe("Julien observes Alice.");
      expect(parse_macros("A pact between {you} and {me}.", ai, entities)).toBe("A pact between Alice and Julien.");
    });
  });

  describe("resolve_display_macro_segments", () => {
    it("segments text and attaches referenced entity for signature color styling", () => {
      const text = "Hello @CHAR and @USER";
      const segments = resolve_display_macro_segments(text, null, entities);
      expect(segments).toHaveLength(4);
      expect(segments[0]).toEqual({ text: "Hello ", macro: null, entity: null });
      expect(segments[1].text).toBe("Julien");
      expect(segments[1].entity).toBe(ai);
      expect(segments[2]).toEqual({ text: " and ", macro: null, entity: null });
      expect(segments[3].text).toBe("Alice");
      expect(segments[3].entity).toBe(user);
    });

    it("resolves concrete entity token @JULIEN to AI entity", () => {
      const text = "Seen with @JULIEN";
      const segments = resolve_display_macro_segments(text, null, entities);
      expect(segments).toHaveLength(2);
      expect(segments[1].text).toBe("Julien");
      expect(segments[1].entity).toBe(ai);
    });
  });
});

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-10-01: Initial test suite for universal @ENTITY macro engine and role tokens.
 * ============================================================================
 */
