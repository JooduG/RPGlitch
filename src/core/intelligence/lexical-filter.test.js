import { describe, expect, it } from "vitest";
import { context_broker } from "@core/intelligence/context-broker.svelte.js";

describe("context_broker.lexical_filter", () => {
  it("should return data_points as is if objective is null or empty", () => {
    const data_points = [
      { text: "apple", type: "fragment", enhancer: "none", section: "test" },
      { text: "banana", type: "fragment", enhancer: "none", section: "test" },
    ];
    // @ts-ignore
    expect(context_broker.lexical_filter(data_points, null)).toEqual(data_points);
    expect(context_broker.lexical_filter(data_points, "")).toEqual(data_points);
  });

  it("should return data_points as is if keywords are all short", () => {
    const data_points = [
      { text: "apple", type: "fragment", enhancer: "none", section: "test" },
      { text: "banana", type: "fragment", enhancer: "none", section: "test" },
    ];
    expect(context_broker.lexical_filter(data_points, "a b c")).toEqual(data_points);
  });

  it("should sort data points with keyword matches to the top and maintain stable order for others", () => {
    const data_points = [
      { text: "This is a cat.", type: "fragment", enhancer: "none", section: "test" },
      { text: "The quick brown fox.", type: "fragment", enhancer: "none", section: "test" },
      { text: "Another random sentence.", type: "fragment", enhancer: "none", section: "test" },
    ];
    const objective = "The quick fox";
    const result = context_broker.lexical_filter(data_points, objective);

    const expected_order = [
      { text: "The quick brown fox.", type: "fragment", enhancer: "none", section: "test" },
      { text: "This is a cat.", type: "fragment", enhancer: "none", section: "test" },
      { text: "Another random sentence.", type: "fragment", enhancer: "none", section: "test" },
    ];
    expect(result).toEqual(expected_order);
  });

  it("should be case-insensitive", () => {
    const data_points = [
      { text: "APPLE", type: "fragment", enhancer: "none", section: "test" },
      { text: "banana", type: "fragment", enhancer: "none", section: "test" },
    ];
    const objective = "apple";
    const result = context_broker.lexical_filter(data_points, objective);
    expect(result[0].text).toBe("APPLE");
  });

  it("should handle missing text property", () => {
    const data_points = [
      { text: "apple", type: "fragment", enhancer: "none", section: "test" },
      { something: "else", type: "fragment", enhancer: "none", section: "test" },
    ];
    const objective = "else";
    // "else" is length 4, so it counts as a keyword
    // @ts-ignore
    const result = context_broker.lexical_filter(data_points, objective);
    // Since {something: 'else'} doesn't have 'text', it won't match in current implementation
    expect(result).toEqual(data_points);
  });

  it("should handle non-array data_points gracefully", () => {
    // @ts-ignore
    expect(context_broker.lexical_filter(null, "objective")).toBe(null);
    // @ts-ignore
    expect(context_broker.lexical_filter({}, "objective")).toEqual({});
  });

  it("should preserve all data points in original order if no matches", () => {
    const data_points = [
      { text: "apple", type: "fragment", enhancer: "none", section: "test" },
      { text: "banana", type: "fragment", enhancer: "none", section: "test" },
    ];
    const objective = "zebra";
    const result = context_broker.lexical_filter(data_points, objective);
    expect(result).toEqual(data_points);
  });

  it("should assign hit = 1 to data points with layer 'eternal' (case-insensitive) even if they do not match objective keywords", () => {
    const data_points = [
      {
        text: "Voice tic: stutter",
        layer: "eternal",
        type: "fragment",
        enhancer: "none",
        section: "test",
      },
      {
        text: "Active plot point",
        layer: "present",
        type: "fragment",
        enhancer: "none",
        section: "test",
      },
      {
        text: "Unrelated baseline trait",
        layer: "ETERNAL",
        type: "fragment",
        enhancer: "none",
        section: "test",
      },
    ];
    const objective = "plot";
    const result = context_broker.lexical_filter(data_points, objective);

    // All elements are expected to get hit = 1 (either through layer 'eternal' or keyword match 'plot'),
    // so they should all remain at the top and preserve their relative original order.
    expect(result).toEqual(data_points);
  });

  it("should assign hit = 1 to 'eternal' data points and float them to the top alongside active keyword hits, above other non-matching points", () => {
    const data_points = [
      {
        text: "Unrelated non-eternal trait",
        layer: "present",
        type: "fragment",
        enhancer: "none",
        section: "test",
      },
      {
        text: "Eternal voice tic",
        layer: "eternal",
        type: "fragment",
        enhancer: "none",
        section: "test",
      },
      {
        text: "Plot keyword match",
        layer: "present",
        type: "fragment",
        enhancer: "none",
        section: "test",
      },
      {
        text: "Another unrelated non-eternal",
        layer: "present",
        type: "fragment",
        enhancer: "none",
        section: "test",
      },
    ];
    const objective = "keyword";
    const result = context_broker.lexical_filter(data_points, objective);

    // Expected: "Eternal voice tic" (eternal -> hit=1) and "Plot keyword match" (matches "keyword" -> hit=1) should be at the top.
    // The relative order of hit=1 elements is preserved: "Eternal voice tic", then "Plot keyword match".
    // The relative order of hit=0 elements is preserved: "Unrelated non-eternal trait", then "Another unrelated non-eternal".
    const expected = [
      {
        text: "Eternal voice tic",
        layer: "eternal",
        type: "fragment",
        enhancer: "none",
        section: "test",
      },
      {
        text: "Plot keyword match",
        layer: "present",
        type: "fragment",
        enhancer: "none",
        section: "test",
      },
      {
        text: "Unrelated non-eternal trait",
        layer: "present",
        type: "fragment",
        enhancer: "none",
        section: "test",
      },
      {
        text: "Another unrelated non-eternal",
        layer: "present",
        type: "fragment",
        enhancer: "none",
        section: "test",
      },
    ];
    expect(result).toEqual(expected);
  });
});
