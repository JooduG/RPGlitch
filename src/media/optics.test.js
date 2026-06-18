/**
 * src/media/optics.test.js
 */
import { flatten_physical, AestheticResolver } from "./optics.js";
import { describe, expect, it } from "vitest";

describe("flatten_physical", () => {
  it("returns empty string for null/undefined", () => {
    expect(flatten_physical(null)).toBe("");
    expect(flatten_physical(undefined)).toBe("");
    expect(flatten_physical("")).toBe("");
  });

  it("returns raw string for plain-text legacy data", () => {
    const raw = "olive skin, buzzcut black hair, 210cm, hyper-muscular";
    expect(flatten_physical(raw)).toBe(raw);
  });

  it("flattens JSON object values into comma-separated token string", () => {
    const json = JSON.stringify({
      gender: "male",
      age_range: "30-45",
      ethnicity: "transhuman",
      build: "hyper-muscular",
    });
    const result = flatten_physical(json);
    expect(result).toBe("male, 30-45, transhuman, hyper-muscular");
  });

  it("flattens JSON array values (e.g. modifications) into the string", () => {
    const json = JSON.stringify({
      build: "hyper-muscular",
      markings: ["fighting pit scars", "branded containment sigils"],
    });
    const result = flatten_physical(json);
    expect(result).toContain("hyper-muscular");
    expect(result).toContain("fighting pit scars");
    expect(result).toContain("branded containment sigils");
  });

  it("omits empty string values from the output", () => {
    const json = JSON.stringify({
      gender: "male",
      hair: "",
      build: "hyper-muscular",
    });
    const result = flatten_physical(json);
    expect(result).toBe("male, hyper-muscular");
  });

  it("handles invalid JSON gracefully by returning raw string", () => {
    const bad = '{ "gender": "male", broken: }';
    expect(flatten_physical(bad)).toBe(bad);
  });
});

describe("AestheticResolver.extract", () => {
  it("flattens JSON physical fields before concatenating for image prompt", () => {
    const entity = {
      type: "character",
      eternal: {
        physical: JSON.stringify({ gender: "male", build: "hyper-muscular" }),
      },
      present: {
        physical: JSON.stringify({ clothing: "tattered leather loincloth" }),
      },
    };
    const result = AestheticResolver.extract(entity);
    expect(result).toContain("male");
    expect(result).toContain("hyper-muscular");
    expect(result).toContain("tattered leather loincloth");
    // Should NOT contain raw JSON braces
    expect(result).not.toContain("{");
    expect(result).not.toContain("}");
  });

  it("still works with legacy plain-text physical fields", () => {
    const entity = {
      type: "character",
      eternal: { physical: "olive skin, buzzcut black hair" },
    };
    const result = AestheticResolver.extract(entity);
    expect(result).toContain("olive skin, buzzcut black hair");
  });
});
