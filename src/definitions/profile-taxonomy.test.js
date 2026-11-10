/**
 * src/definitions/profile-taxonomy.test.js
 * Unit tests for PROFILE_FIELDS taxonomy, PROFILE_FIELD_CATALOG, and build_profile_sections.
 * (FLAT_LEAF_MAP coverage lives in src/storage/profile-fields.test.js against the live ingestion map.)
 */

import { describe, expect, it } from "vitest";
import { PROFILE_FIELDS, PROFILE_FIELD_CATALOG, PROFILE_SECTIONS_BY_TYPE, build_profile_sections } from "./profile-taxonomy.js";

describe("profile-taxonomy.js schema invariants", () => {
  it("defines top-level taxonomy sections and entity root schemas", () => {
    expect(PROFILE_FIELDS.name).toBeDefined();
    expect(PROFILE_FIELDS.description).toBeDefined();
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

  it("ensures PROFILE_FIELD_CATALOG contains valid directives and enhancers", () => {
    for (const metadata of Object.values(PROFILE_FIELD_CATALOG)) {
      expect(typeof metadata.label).toBe("string");
      expect(typeof (metadata.directive || "")).toBe("string");
      expect(typeof (metadata.enhancer || "")).toBe("string");
    }
  });

  it("builds distinct section models for character and fractal types", () => {
    const character_sections = build_profile_sections("character");
    const fractal_sections = build_profile_sections("fractal");

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

  it("verifies PROFILE_SECTIONS_BY_TYPE cached maps match builder output", () => {
    expect(PROFILE_SECTIONS_BY_TYPE.character).toEqual(build_profile_sections("character"));
    expect(PROFILE_SECTIONS_BY_TYPE.fractal).toEqual(build_profile_sections("fractal"));
  });
});
