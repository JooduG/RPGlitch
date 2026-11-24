import { describe, expect, it } from "vitest";
import { create_relational_context, parse_macros, resolve_display_macro_segments } from "./macros.js";

describe("Universal @ENTITY Macro Engine", () => {
  const user = { id: "usr_protagonist", name: "Alice", type: "user" };
  const ai = { id: "char_julien", name: "Julien", type: "character", signature_color: "Soft Rose" };
  const fractal = { id: "fractal_spire", name: "The Spire", type: "fractal", signature_color: "Emerald" };
  const entities = { USER: user, AI: ai, FRACTAL: fractal };

  describe("parse_macros", () => {
    it("resolves role tokens from AI perspective", () => {
      expect(parse_macros("@SPEAKER observes @LISTENER within @FRACTAL.", ai, entities)).toBe("Julien observes Alice within The Spire.");
    });

    it("resolves @ME and @YOU from User perspective", () => {
      expect(parse_macros("@ME speaks to @YOU.", user, entities)).toBe("Alice speaks to Julien.");
    });

    it("resolves @USER and @CHAR explicitly regardless of perspective", () => {
      const text = "A pact between @USER and @CHAR.";
      expect(parse_macros(text, ai, entities)).toBe("A pact between Alice and Julien.");
      expect(parse_macros(text, user, entities)).toBe("A pact between Alice and Julien.");
    });

    it("preserves concrete @JULIEN token verbatim", () => {
      expect(parse_macros("A message meant for @JULIEN.", user, entities)).toBe("A message meant for @JULIEN.");
    });

    it("does not parse legacy curly braces", () => {
      expect(parse_macros("{me} speaks to {you}.", user, entities)).toBe("{me} speaks to {you}.");
    });

    it("resolves @ME and @YOU from secondary NPC perspective without stealing companion identity", () => {
      const npc = { id: "npc_rust", name: "Rust", type: "character" };
      expect(parse_macros("@ME speaks to @YOU.", npc, entities)).toBe("Rust speaks to Alice.");
    });

    it("resolves diegetic fallbacks when entities are absent", () => {
      expect(parse_macros("@CHAR observes @USER.", null, {})).toBe("the companion observes the traveler.");
    });

    it("supports frozen RelationalContext tuple resolving @ME, @YOU, @SPEAKER, @LISTENER, @TARGET", () => {
      const target = { id: "char_silvers", name: "Silvers" };
      const context = create_relational_context({ me: ai, you: user, speaker: ai, listener: user, target });
      expect(Object.isFrozen(context)).toBe(true);
      expect(parse_macros("@SPEAKER says to @LISTENER: behold @TARGET! (Signed: @ME to @YOU)", context, entities)).toBe(
        "Julien says to Alice: behold Silvers! (Signed: Julien to Alice)",
      );
    });
  });

  describe("resolve_display_macro_segments & render_display_macros", () => {
    it("segments text as canonical @ID handles and attaches referenced entity", () => {
      const segments = resolve_display_macro_segments("Hello @CHAR and @USER", null, entities);
      expect(segments).toHaveLength(4);
      expect(segments[0]).toEqual({ text: "Hello ", macro: null, entity: null });
      expect(segments[1].text).toBe("@CHAR_JULIEN");
      expect(segments[1].entity).toBe(ai);
      expect(segments[2]).toEqual({ text: " and ", macro: null, entity: null });
      expect(segments[3].text).toBe("@USR_PROTAGONIST");
      expect(segments[3].entity).toBe(user);
    });

    it("resolves concrete entity tokens against active entities and entities.ALL", () => {
      const beast = { id: "beast", name: "Beast", type: "character", signature_color: "#f97316" };
      const orion = { id: "orion_id", name: "Orion the Pink Protector", type: "character", signature_color: "#ec4899" };
      const roster_entities = { ...entities, ALL: [beast, orion] };

      const segments = resolve_display_macro_segments("Architect of @BEAST and @ORION", null, roster_entities);
      expect(segments).toHaveLength(4);
      expect(segments[1]).toEqual({ text: "@BEAST", macro: "BEAST", entity: beast });
      expect(segments[3]).toEqual({ text: "@ORION_ID", macro: "ORION", entity: orion });
      expect(
        resolve_display_macro_segments("Seen with @JULIEN", null, entities)
          .map((segment) => segment.text)
          .join(""),
      ).toBe("Seen with @CHAR_JULIEN");
    });
  });
});
