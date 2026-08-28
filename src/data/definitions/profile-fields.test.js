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
    for (const meta of Object.values(PROFILE_FIELD_CATALOG)) {
      expect(typeof meta.label).toBe("string");
      expect(typeof (meta.directive || "")).toBe("string");
      expect(typeof (meta.enhancer || "")).toBe("string");
    }
  });

  it("builds distinct section models for character and fractal types", () => {
    const character_sections = build_profile_sections("character");
    const fractal_sections = build_profile_sections("fractal");

    expect(character_sections.length).toBeGreaterThan(0);
    expect(fractal_sections.length).toBeGreaterThan(0);

    const char_eternal = character_sections.find((s) => s.id === "eternal");
    const frac_eternal = fractal_sections.find((s) => s.id === "eternal");

    expect(char_eternal).toBeDefined();
    expect(frac_eternal).toBeDefined();

    const char_personality = char_eternal.fields.find((f) => f.key === "eternal.non_physical");
    const frac_metaphysics = frac_eternal.fields.find((f) => f.key === "eternal.non_physical");

    expect(char_personality.label).toBe("Personality");
    expect(frac_metaphysics.label).toBe("Metaphysical Truths");
  });

  it("verifies PROFILE_SECTIONS_BY_TYPE cached maps match builder output", () => {
    expect(PROFILE_SECTIONS_BY_TYPE.character).toEqual(build_profile_sections("character"));
    expect(PROFILE_SECTIONS_BY_TYPE.fractal).toEqual(build_profile_sections("fractal"));
  });
});
