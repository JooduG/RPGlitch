/**
 * src/definitions/profile-taxonomy.test.js
 * Unit tests for PROFILE_FIELDS taxonomy, PROFILE_SECTIONS_BY_TYPE, and authority helpers.
 */

import { describe, expect, it } from "vitest";
import { PROFILE_FIELDS, PROFILE_SECTIONS_BY_TYPE, atom_for, canonicalize_field_key, caretaker_brief, resolve_entity_type } from "./profile-taxonomy.js";

describe("profile-taxonomy.js schema invariants", () => {
  it("defines top-level taxonomy sections and entity root schemas", () => {
    expect(PROFILE_FIELDS.id).toBeDefined();
    expect(PROFILE_FIELDS.name).toBeDefined();
    expect(PROFILE_FIELDS.description).toBeDefined();
    expect(PROFILE_FIELDS.pov).toBeDefined();
    expect(PROFILE_FIELDS.character).toBeDefined();
    expect(PROFILE_FIELDS.character.eternal).toBeDefined();
    expect(PROFILE_FIELDS.character.present).toBeDefined();
    expect(PROFILE_FIELDS.character.past).toBeDefined();
    expect(PROFILE_FIELDS.character.future).toBeDefined();
    expect(PROFILE_FIELDS.fractal).toBeDefined();
    expect(PROFILE_FIELDS.fractal.eternal).toBeDefined();
    expect(PROFILE_FIELDS.fractal.present).toBeDefined();
    expect(PROFILE_FIELDS.fractal.past).toBeDefined();
    expect(PROFILE_FIELDS.fractal.future).toBeDefined();
  });

  it("builds distinct section models in PROFILE_SECTIONS_BY_TYPE for character and fractal types", () => {
    const character_sections = PROFILE_SECTIONS_BY_TYPE.character;
    const fractal_sections = PROFILE_SECTIONS_BY_TYPE.fractal;

    expect(character_sections.length).toBeGreaterThan(0);
    expect(fractal_sections.length).toBeGreaterThan(0);

    const character_eternal = character_sections.find((section) => section.id === "eternal");
    const fractal_eternal = fractal_sections.find((section) => section.id === "eternal");

    expect(character_eternal).toBeDefined();
    expect(fractal_eternal).toBeDefined();

    const character_personality = character_eternal.fields.find((field) => field.key === "eternal.non_physical");
    const fractal_metaphysics = fractal_eternal.fields.find((field) => field.key === "eternal.non_physical");

    expect(character_personality.label).toBe("Personality");
    expect(fractal_metaphysics.label).toBe("Permanent Truths");
  });

  it("resolves entity types, canonical keys, atoms, and caretaker briefs", () => {
    expect(resolve_entity_type("fractal")).toBe("fractal");
    expect(resolve_entity_type("user")).toBe("character");
    expect(canonicalize_field_key("appearance", "character")).toBe("eternal.physical");
    expect(canonicalize_field_key("Permanent Truths", "fractal")).toBe("eternal.non_physical");
    expect(atom_for("character", "personality")?.enhancer).toBe("COGNITIVE_ARCHITECT");
    expect(caretaker_brief("fractal").future).toContain("environmental trajectory");
  });
});
