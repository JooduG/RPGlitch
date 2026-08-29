/**
 * src/data/definitions/profile-fields.test.js
 * Unit tests for PROFILE_FIELDS taxonomy, FLAT_LEAF_MAP, and build_profile_sections.
 */

import { describe, expect, it } from "vitest";
import { PROFILE_FIELDS, PROFILE_FIELD_CATALOG, PROFILE_SECTIONS_BY_TYPE, FLAT_LEAF_MAP, build_profile_sections } from "./profile-fields.js";

describe("profile-fields.js schema invariants", () => {
  it("defines top-level taxonomy sections", () => {
    expect(PROFILE_FIELDS.name).toBeDefined();
    expect(PROFILE_FIELDS.description).toBeDefined();
    expect(PROFILE_FIELDS.eternal).toBeDefined();
    expect(PROFILE_FIELDS.present).toBeDefined();
    expect(PROFILE_FIELDS.past).toBeDefined();
    expect(PROFILE_FIELDS.future).toBeDefined();
  });

  it("ensures every leaf in FLAT_LEAF_MAP maps to a valid schema path", () => {
    expect(Object.keys(FLAT_LEAF_MAP).length).toBeGreaterThan(0);
    for (const [flat_key, path] of Object.entries(FLAT_LEAF_MAP)) {
      expect(typeof flat_key).toBe("string");
      expect(typeof path).toBe("string");
      expect(path.length).toBeGreaterThan(0);
    }
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
    expect(fractal_metaphysics.label).toBe("Metaphysical Truths");
  });

  it("verifies PROFILE_SECTIONS_BY_TYPE cached maps match builder output", () => {
    expect(PROFILE_SECTIONS_BY_TYPE.character).toEqual(build_profile_sections("character"));
    expect(PROFILE_SECTIONS_BY_TYPE.fractal).toEqual(build_profile_sections("fractal"));
  });
});
