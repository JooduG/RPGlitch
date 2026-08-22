import { describe, expect, it } from "vitest";
import {
  escape_unescaped_json_quotes,
  format_key_as_label,
  format_relational_vector,
  match_case,
  NAME_PREFIXES,
  parse_relational_vector,
} from "./text.js";

describe("match_case", () => {
  it("preserves lowercase if original was lowercase", () => {
    expect(match_case("hello", "world")).toBe("world");
  });

  it("capitalizes replacement if original was capitalized", () => {
    expect(match_case("Hello", "world")).toBe("World");
  });

  it("handles null or empty inputs gracefully", () => {
    expect(match_case(null, "world")).toBe("world");
    expect(match_case("", "world")).toBe("world");
    expect(match_case("Hello", "")).toBe("");
  });
});

describe("format_key_as_label", () => {
  it("formats snake_case keys into title case labels", () => {
    expect(format_key_as_label("eternal")).toBe("Eternal");
    expect(format_key_as_label("first_name")).toBe("First Name");
  });

  it("handles special case non_physical", () => {
    expect(format_key_as_label("non_physical")).toBe("Non-Physical");
  });

  it("handles null or empty inputs gracefully", () => {
    expect(format_key_as_label("")).toBe("");
    expect(format_key_as_label(null)).toBe("");
  });
});

describe("NAME_PREFIXES", () => {
  it("contains common title prefixes and stop words", () => {
    expect(NAME_PREFIXES).toContain("dr");
    expect(NAME_PREFIXES).toContain("the");
    expect(NAME_PREFIXES).toContain("mr.");
  });
});

describe("parse_relational_vector & format_relational_vector", () => {
  it("parses valid unicode and ascii arrow relational vectors", () => {
    const v1 = parse_relational_vector("Orion the Pink Protector → Glitch: playful superhero vs hacker rivalry");
    expect(v1).toEqual({
      source_name: "Orion the Pink Protector",
      target_name: "Glitch",
      dynamic: "playful superhero vs hacker rivalry",
      raw: "Orion the Pink Protector → Glitch: playful superhero vs hacker rivalry",
    });

    const v2 = parse_relational_vector("Glitch -> Dr. Elias Tariq: containment breach hacker sabotage");
    expect(v2).toEqual({
      source_name: "Glitch",
      target_name: "Dr. Elias Tariq",
      dynamic: "containment breach hacker sabotage",
      raw: "Glitch -> Dr. Elias Tariq: containment breach hacker sabotage",
    });

    const v3 = parse_relational_vector("K-9 → Nova-City: defense patrol unit");
    expect(v3).toEqual({
      source_name: "K-9",
      target_name: "Nova-City",
      dynamic: "defense patrol unit",
      raw: "K-9 → Nova-City: defense patrol unit",
    });
  });

  it("handles vectors with no dynamic description", () => {
    const v = parse_relational_vector("Julien → Ashenweald");
    expect(v).toEqual({
      source_name: "Julien",
      target_name: "Ashenweald",
      dynamic: "",
      raw: "Julien → Ashenweald",
    });
  });

  it("formats canonical relational vectors properly", () => {
    expect(format_relational_vector("Orion", "Nova City", "protector")).toBe("Orion → Nova City: protector");
    expect(format_relational_vector("Orion", "Nova City")).toBe("Orion → Nova City");
    expect(format_relational_vector("", "Nova City")).toBe("");
  });

  it("handles null or malformed inputs safely", () => {
    expect(parse_relational_vector(null)).toBeNull();
    expect(parse_relational_vector("")).toBeNull();
    expect(parse_relational_vector("Not a vector")).toBeNull();
  });
});

describe("escape_unescaped_json_quotes", () => {
  it("should escape unescaped interior double-quotes in JSON strings", () => {
    const input = `{ "mutations": { "AI_CHARACTER": { "state_append": "He said "Hello" to me" } } }`;
    const expected = `{ "mutations": { "AI_CHARACTER": { "state_append": "He said \\"Hello\\" to me" } } }`;
    expect(escape_unescaped_json_quotes(input)).toBe(expected);
  });

  it("should leave already escaped quotes untouched", () => {
    const input = `{ "mutations": { "AI_CHARACTER": { "state_append": "He said \\"Hello\\" to me" } } }`;
    expect(escape_unescaped_json_quotes(input)).toBe(input);
  });

  it("should handle nested commas inside quotes correctly by not stopping at them", () => {
    const input = `{ "mutations": { "AI_CHARACTER": { "state_append": "He said "Hello, friend" to me", "vector_resolve": [] } } }`;
    const expected = `{ "mutations": { "AI_CHARACTER": { "state_append": "He said \\"Hello, friend\\" to me", "vector_resolve": [] } } }`;
    expect(escape_unescaped_json_quotes(input)).toBe(expected);
  });

  it("should handle unescaped quotes with trailing braces or brackets", () => {
    const input = `{ "directive": "Say "hello"" }`;
    const expected = `{ "directive": "Say \\"hello\\"" }`;
    expect(escape_unescaped_json_quotes(input)).toBe(expected);
  });
});
