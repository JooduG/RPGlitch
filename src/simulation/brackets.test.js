import { describe, expect, it } from "vitest";
import { apply_tagged_field_deltas, format_tagged_fields, parse_tagged_fields } from "./brackets.js";

describe("parse_tagged_fields", () => {
  it("parses positions for in-place surgery", () => {
    const entries = parse_tagged_fields("ab [K: v] cd");
    expect(entries).toHaveLength(1);
    expect(entries[0].start_index).toBe(3);
    expect(entries[0].end_index).toBe(9);
    expect(entries[0].key).toBe("K");
  });
  it("reads weight/visibility/is_origin", () => {
    const [entry] = parse_tagged_fields("[SECRET: ambush | hide | w: 8 | is_origin]");
    expect(entry.visibility).toBe("hide");
    expect(entry.weight).toBe(8);
    expect(entry.is_origin).toBe(true);
  });
  it("leaves alternation pipes alone", () => {
    const [entry] = parse_tagged_fields("[CHOICE: {red | blue} | hide]");
    expect(entry.value).toBe("{red | blue}");
    expect(entry.visibility).toBe("hide");
  });
});

describe("format_tagged_fields (in-place, prose-safe)", () => {
  it("returns prose without entries unchanged", () => {
    expect(format_tagged_fields("Just a story.", { see_hidden: "none" })).toBe("Just a story.");
  });
  it("keeps surrounding prose (not a rebuild)", () => {
    expect(format_tagged_fields("He said hello [MOOD: cheerful] and left.", { see_hidden: "none" })).toBe("He said hello [MOOD: cheerful] and left.");
  });
  it("drops hidden entries with prose intact", () => {
    expect(format_tagged_fields("Scout report [SECRET: ambush | hide] done.", { see_hidden: "none" })).toBe("Scout report done.");
  });
  it("keeps | hide signal for owner/all", () => {
    expect(format_tagged_fields("[SECRET: ambush | hide]", { see_hidden: "all" })).toBe("[SECRET: ambush | hide]");
    expect(format_tagged_fields("[SECRET: ambush | hide]", { see_hidden: "own", is_counterpart: false })).toBe("[SECRET: ambush | hide]");
  });
  it("drops hidden entries for counterpart", () => {
    expect(format_tagged_fields("A [SECRET: ambush | hide] B", { see_hidden: "own", is_counterpart: true })).toBe("A B");
  });
  it("strips engine flags on shown entries", () => {
    expect(format_tagged_fields("[MOOD: cheerful | w: 8]", { see_hidden: "all" })).toBe("[MOOD: cheerful]");
  });
  it("rejoins comma lists without orphan separators", () => {
    expect(format_tagged_fields("[A: 1], [SECRET: x | hide], [B: 2]", { see_hidden: "none" })).toBe("[A: 1], [B: 2]");
  });
  it("drops inventory/stash on request", () => {
    expect(format_tagged_fields("[INVENTORY: sword] [MOOD: ok]", { strip_inventory: true })).toBe("[MOOD: ok]");
  });
  it("drops visual-excluded keys in visual mode", () => {
    expect(format_tagged_fields("[SECRET: x] [MOOD: ok]", { visual_only: true })).toBe("[MOOD: ok]");
  });
  it("reveal_hidden strips the flag but keeps the entry", () => {
    expect(format_tagged_fields("[SECRET: ambush | hide]", { reveal_hidden: true })).toBe("[SECRET: ambush]");
  });
});

describe("apply_tagged_field_deltas", () => {
  it("overwrites single-value keys", () => {
    expect(apply_tagged_field_deltas("[MOOD: sad]", "[MOOD: happy]")).toContain("[MOOD: happy");
  });
  it("clears keys on none/cleared", () => {
    expect(apply_tagged_field_deltas("[MOOD: sad] [A: 1]", "[MOOD: none]")).not.toContain("MOOD");
  });
});
