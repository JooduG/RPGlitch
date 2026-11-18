import { CHARS_PER_TOKEN } from "@config";
import { describe, expect, it } from "vitest";
import {
  alternation_field_label,
  diff_alternation_picks,
  extract_alternations,
  has_alternations,
  resolve_alternations,
  strip_alternation_braces,
} from "./alternations.js";
import {
  clean_text,
  collapse_whitespace,
  compute_initials,
  count_tokens,
  format_datetime,
  format_key_as_label,
  indent_continuation,
  match_case,
  NAME_PREFIX_STEMS,
  NAME_PREFIXES,
  truncate_at_word,
  truncate_at_boundary,
} from "./text.js";

describe("indent_continuation", () => {
  it("indents multi-line string content with specified spaces", () => {
    const text = "line1\nline2\nline3";
    expect(indent_continuation(text, 2)).toBe("line1\n  line2\n  line3");
  });

  it("returns empty string on empty inputs", () => {
    expect(indent_continuation(null, 2)).toBe("");
    expect(indent_continuation("", 2)).toBe("");
  });
});

describe("compute_initials", () => {
  it("skips title/stop prefixes", () => {
    expect(compute_initials("Lord Benedict Silvers")).toBe("BS");
    expect(compute_initials("The One Ring")).toBe("OR");
    expect(compute_initials("Sir Reginald")).toBe("R");
    expect(compute_initials("Alexander The Great")).toBe("AG");
  });

  it("honours an explicit stop-word set", () => {
    expect(compute_initials("Sir Reginald", new Set(["sir"]))).toBe("R");
    expect(compute_initials("Alexander The Great", new Set([]))).toBe("ATG");
  });

  it("keeps unicode letters and strips punctuation", () => {
    expect(compute_initials("María José")).toBe("MJ");
    expect(compute_initials("Glitch-7 (hacker)")).toBe("GH");
  });

  it("falls back to raw words when every word is a stop word", () => {
    expect(compute_initials("Dr. Professor Lord")).toBe("P");
    expect(compute_initials("Dr Lord Prof")).toBe("DLP");
  });

  it("handles empty input with a question mark", () => {
    expect(compute_initials("")).toBe("?");
    expect(compute_initials("   ")).toBe("?");
    expect(compute_initials(null)).toBe("?");
  });

  it("derives NAME_PREFIX_STEMS without trailing periods", () => {
    expect(NAME_PREFIX_STEMS.has("dr")).toBe(true);
    expect(NAME_PREFIX_STEMS.has("dr.")).toBe(false);
  });
});

describe("clean_text", () => {
  it("strips markdown characters and collapses whitespace", () => {
    expect(clean_text("**Bold** and `code` with [links]")).toBe("Bold and code with links");
  });

  it("respects character limits with ellipsis", () => {
    expect(clean_text("Long text string that will be trimmed", 10)).toBe("Long text...");
  });
});

describe("format_datetime", () => {
  it("formats epoch timestamps into clean YYYY-MM-DD HH:mm", () => {
    const d = new Date(2026, 7, 29, 14, 30);
    expect(format_datetime(d.getTime())).toMatch(/^2026-08-29\s+14:30$/);
  });

  it("returns fallback dashes on null", () => {
    expect(format_datetime(null)).toBe("---");
    expect(format_datetime(undefined)).toBe("---");
  });
});

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
    expect(format_key_as_label("non_physical")).toBe("Non-Physical");
  });

  it("handles null or empty inputs gracefully", () => {
    expect(format_key_as_label("")).toBe("");
    expect(format_key_as_label(null)).toBe("");
  });
});

describe("NAME_PREFIXES", () => {
  it("contains common title prefixes and stop words in frozen array", () => {
    expect(NAME_PREFIXES).toContain("dr");
    expect(NAME_PREFIXES).toContain("the");
    expect(NAME_PREFIXES).toContain("mr.");
  });
});

describe("truncate_at_word", () => {
  it("truncates at word boundary within limit and appends ellipsis", () => {
    const input = "The quick brown fox jumps over the lazy dog";
    expect(truncate_at_word(input, 20)).toBe("The quick brown fox…");
  });

  it("leaves text untouched if under limit", () => {
    expect(truncate_at_word("Short text", 20)).toBe("Short text");
  });

  it("reserves room for the ellipsis when requested", () => {
    const out = truncate_at_word("The quick brown fox jumps over the lazy dog", 20, { reserve_ellipsis: true });
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith("…")).toBe(true);
  });

  it("honours a minimum word-boundary ratio", () => {
    expect(truncate_at_word("alpha beta gamma delta epsilon", 20)).toBe("alpha beta gamma…");
    expect(truncate_at_word("alpha beta gamma delta epsilon", 20, { min_bound_ratio: 0.9 })).toBe("alpha beta gamma del…");
  });

  it("strips trailing punctuation before the ellipsis when requested", () => {
    const out = truncate_at_word("one, two, three, four", 16, { strip_trailing_punctuation: true });
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/[,;:]…$/);
  });

  it("handles null or empty inputs", () => {
    expect(truncate_at_word(null)).toBe("");
    expect(truncate_at_word("")).toBe("");
  });
});

describe("collapse_whitespace", () => {
  it("collapses runs of whitespace and trims the result", () => {
    expect(collapse_whitespace("  a \n\t b  ")).toBe("a b");
  });

  it("handles null or empty inputs", () => {
    expect(collapse_whitespace(null)).toBe("");
    expect(collapse_whitespace("")).toBe("");
  });
});

describe("alternation macros (selectable options & dice resolution)", () => {
  it("extracts only real alternation groups (2+ options)", () => {
    expect(extract_alternations("[SHIRT: {red|black}]")).toEqual([{ raw: "{red|black}", options: ["red", "black"] }]);
    expect(extract_alternations("{a|b|c}")).toHaveLength(1);
    expect(extract_alternations("{single} and {a|b}")).toHaveLength(1);
    expect(extract_alternations("no braces")).toEqual([]);
    expect(extract_alternations(null)).toEqual([]);
  });

  it("has_alternations detects groups", () => {
    expect(has_alternations("[POSE: {standing|kneeling}]")).toBe(true);
    expect(has_alternations("[POSE: standing]")).toBe(false);
  });

  it("resolve_alternations rolls one option per group via injectable random", () => {
    const always_first = () => 0;
    const r = resolve_alternations("[SHIRT: {red|black}] belt {leather|cloth}", { random: always_first });
    expect(r.text).toBe("[SHIRT: red] belt leather");
    expect(r.picks).toHaveLength(2);
    expect(r.picks[0]).toEqual({ raw: "{red|black}", options: ["red", "black"], index: 0, option: "red" });

    const always_last = () => 0.99;
    expect(resolve_alternations("{a|b}", { random: always_last }).text).toBe("b");
  });

  it("reports dice picks through onPick and returns empty picks without alternations", () => {
    const seen = [];
    resolve_alternations("x {a|b|c}", { onPick: (pick) => seen.push(pick.index) });
    expect(seen).toHaveLength(1);
    expect(resolve_alternations("plain").picks).toEqual([]);
    expect(resolve_alternations(null).text).toBe("");
  });

  it("diff_alternation_picks detects which option a resolved string committed to", () => {
    const picks = diff_alternation_picks("[SHIRT: {red|black}]", "[SHIRT: black]");
    expect(picks).toHaveLength(1);
    expect(picks[0].option).toBe("black");
    expect(picks[0].index).toBe(1);
    expect(diff_alternation_picks("[SHIRT: {red|black}]", "[SHIRT: green]")).toEqual([]);
  });

  it("strip_alternation_braces collapses any leaked group to its first option", () => {
    expect(strip_alternation_braces("He wore {the red coat|a blue cape} while {running|walking}.")).toBe("He wore the red coat while running.");
    expect(strip_alternation_braces("plain")).toBe("plain");
    expect(strip_alternation_braces(null)).toBeNull();
  });

  it("alternation_field_label resolves the enclosing bracket key", () => {
    expect(alternation_field_label("[SHIRT: {red|black}]", "{red|black}")).toBe("SHIRT");
    expect(alternation_field_label("plain {a|b} prose", "{a|b}")).toBe("");
    expect(alternation_field_label("[MOOD: {calm|furious}] then {a|b}", "{a|b}")).toBe("");
  });
});

describe("count_tokens & CHARS_PER_TOKEN calibration", () => {
  it("exports calibrated CHARS_PER_TOKEN constant (3.35)", () => {
    expect(CHARS_PER_TOKEN).toBe(3.35);
  });

  it("returns 0 for blank or null inputs", () => {
    expect(count_tokens("")).toBe(0);
    expect(count_tokens(null)).toBe(0);
    expect(count_tokens(undefined)).toBe(0);
  });

  it("calibrates token estimation using Math.ceil(length / CHARS_PER_TOKEN)", () => {
    // 335 chars should be exactly 100 tokens
    const sample = "a".repeat(335);
    expect(count_tokens(sample)).toBe(100);
    // 10 chars is ceil(10 / 3.35) = ceil(2.985) = 3 tokens
    expect(count_tokens("1234567890")).toBe(3);
    // Minimum 1 token for non-empty string
    expect(count_tokens("x")).toBe(1);
  });
});

describe("truncate_at_boundary", () => {
  it("returns original text if within limit", () => {
    expect(truncate_at_boundary("[MOOD: calm]", 50)).toBe("[MOOD: calm]");
    expect(truncate_at_boundary("Plain text within limits.", 50)).toBe("Plain text within limits.");
  });

  it("clips at the last intact ']' when a pseudo-JSON bracket is sliced mid-tag", () => {
    const input = "[MOOD: calm] [STATUS: alert and watching]";
    // Slicing at 25 cuts inside [STATUS: ...
    const truncated = truncate_at_boundary(input, 25);
    expect(truncated).toBe("[MOOD: calm]");
  });

  it("falls back to truncate_at_word when no brackets are cut mid-tag", () => {
    const input = "[MOOD: calm] Walking along the corridor into the open courtyard.";
    const truncated = truncate_at_boundary(input, 35, { ellipsis: "…" });
    expect(truncated).toBe("[MOOD: calm] Walking along the…");
  });

  it("handles empty or null gracefully", () => {
    expect(truncate_at_boundary("", 20)).toBe("");
    expect(truncate_at_boundary(null, 20)).toBe("");
  });
});

/**
 * CHANGELOG
 * - 2026-09-11: Updated the ind helper tests to the renamed indent_continuation.
 */
