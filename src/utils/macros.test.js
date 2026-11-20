/**
 * src/utils/macros.test.js
 * 🧪 UNIT TESTS: Macros & Universal @ENTITY Resolution
 *
 * Verifies case-insensitive uppercase @ENTITY and role token resolution across
 * AI, User, and Fractal perspectives, concrete ID matches, and display segments.
 */

import { describe, expect, it } from "vitest";
import { create_relational_context, parse_macros, resolve_display_macro_segments } from "./macros.js";

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

    it("preserves concrete @JULIEN token without mangling it into a display name", () => {
      const text = "A message meant for @JULIEN.";
      const resolved = parse_macros(text, user, entities);
      expect(resolved).toBe("A message meant for @JULIEN.");
    });

    it("does not parse legacy {me} and {you} curly braces (purged per P4)", () => {
      expect(parse_macros("{me} speaks to {you}.", user, entities)).toBe("{me} speaks to {you}.");
    });

    it("resolves @ME and @YOU from secondary NPC perspective without stealing companion identity", () => {
      const npc = { id: "npc_rust", name: "Rust", type: "character" };
      const text = "@ME speaks to @YOU.";
      const resolved = parse_macros(text, npc, entities);
      expect(resolved).toBe("Rust speaks to Alice.");
    });

    it("resolves diegetic fallbacks when entities are absent", () => {
      expect(parse_macros("@CHAR observes @USER.", null, {})).toBe("the companion observes the traveler.");
    });

    it("supports frozen RelationalContext tuple resolving @ME, @YOU, @SPEAKER, @LISTENER, @TARGET", () => {
      const target = { id: "char_silvers", name: "Silvers" };
      const context = create_relational_context({ me: ai, you: user, speaker: ai, listener: user, target });
      expect(Object.isFrozen(context)).toBe(true);
      const text = "@SPEAKER says to @LISTENER: behold @TARGET! (Signed: @ME to @YOU)";
      const resolved = parse_macros(text, context, entities);
      expect(resolved).toBe("Julien says to Alice: behold Silvers! (Signed: Julien to Alice)");
    });
  });

  describe("resolve_display_macro_segments", () => {
    it("segments text as canonical @ID handles and attaches referenced entity for signature color styling", () => {
      const text = "Hello @CHAR and @USER";
      const segments = resolve_display_macro_segments(text, null, entities);
      expect(segments).toHaveLength(4);
      expect(segments[0]).toEqual({ text: "Hello ", macro: null, entity: null });
      expect(segments[1].text).toBe("@CHAR_JULIEN");
      expect(segments[1].entity).toBe(ai);
      expect(segments[2]).toEqual({ text: " and ", macro: null, entity: null });
      expect(segments[3].text).toBe("@USR_PROTAGONIST");
      expect(segments[3].entity).toBe(user);
    });

    it("resolves concrete entity token @JULIEN to AI entity @ID handle", () => {
      const text = "Seen with @JULIEN";
      const segments = resolve_display_macro_segments(text, null, entities);
      expect(segments).toHaveLength(2);
      expect(segments[1].text).toBe("@CHAR_JULIEN");
      expect(segments[1].entity).toBe(ai);
    });

    it("resolves non-active roster @ENTITY tokens via entities.ALL by id and name word", () => {
      const beast = { id: "beast", name: "Beast", type: "character", signature_color: "#f97316" };
      const orion = { id: "orion_id", name: "Orion the Pink Protector", type: "character", signature_color: "#ec4899" };
      const roster_entities = { ...entities, ALL: [beast, orion] };

      const segments = resolve_display_macro_segments("Architect of @BEAST and @ORION", null, roster_entities);
      expect(segments).toHaveLength(4);
      expect(segments[1]).toEqual({ text: "@BEAST", macro: "BEAST", entity: beast });
      expect(segments[3]).toEqual({ text: "@ORION_ID", macro: "ORION", entity: orion });
    });
  });
});

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-10-14: Atom 3.2 - Added RelationalContext tests, purged {me}/{you} curly syntax tests, and tested diegetic fallbacks.
 * - 2026-10-01: Initial test suite for universal @ENTITY macro engine and role tokens.
 * ============================================================================
 */
