import { describe, expect, it } from "vitest";
import { context_broker } from "@core/intelligence/context-broker.js";

describe("context_broker.lexical_filter", () => {
  it("should return data_points as is if objective is null or empty", () => {
    const data_points = [{ text: "apple" }, { text: "banana" }];
    expect(context_broker.lexical_filter(data_points, null)).toEqual(data_points);
    expect(context_broker.lexical_filter(data_points, "")).toEqual(data_points);
  });

  it("should return data_points as is if keywords are all short", () => {
    const data_points = [{ text: "apple" }, { text: "banana" }];
    expect(context_broker.lexical_filter(data_points, "a b c")).toEqual(data_points);
  });

  it("should sort data points with keyword matches to the top and maintain stable order for others", () => {
    const data_points = [
      { text: "This is a cat." },
      { text: "The quick brown fox." },
      { text: "Another random sentence." },
    ];
    const objective = "The quick fox";
    const result = context_broker.lexical_filter(data_points, objective);

    const expected_order = [
      { text: "The quick brown fox." },
      { text: "This is a cat." },
      { text: "Another random sentence." },
    ];
    expect(result).toEqual(expected_order);
  });

  it("should be case-insensitive", () => {
    const data_points = [{ text: "APPLE" }, { text: "banana" }];
    const objective = "apple";
    const result = context_broker.lexical_filter(data_points, objective);
    expect(result[0].text).toBe("APPLE");
  });

  it("should handle missing text property", () => {
    const data_points = [{ text: "apple" }, { something: "else" }];
    const objective = "else";
    // "else" is length 4, so it counts as a keyword
    const result = context_broker.lexical_filter(data_points, objective);
    // Since {something: 'else'} doesn't have 'text', it won't match in current implementation
    expect(result).toEqual(data_points);
  });

  it("should handle non-array data_points gracefully", () => {
    expect(context_broker.lexical_filter(null, "objective")).toBe(null);
    expect(context_broker.lexical_filter({}, "objective")).toEqual({});
  });

  it("should preserve all data points in original order if no matches", () => {
    const data_points = [{ text: "apple" }, { text: "banana" }];
    const objective = "zebra";
    const result = context_broker.lexical_filter(data_points, objective);
    expect(result).toEqual(data_points);
  });
});
