import { CHARS_PER_TOKEN } from "@config";
import { describe, expect, it } from "vitest";
import {
  clean_text,
  collapse_whitespace,
  compute_initials,
  count_tokens,
  escape_xml,
  format_datetime,
  format_key_as_label,
  match_case,
  NAME_PREFIX_STEMS,
  NAME_PREFIXES,
  normalize_comma_spacing,
  parse_bracket_display_flags,
  prompt_escape,
  resolve_style,
  to_style_dropdown_items,
  truncate_at_word,
  entity_avatar_props,
} from "./text.js";

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
    expect(NAME_PREFIXES).toContain("dr");
    expect(NAME_PREFIXES).toContain("the");
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
  it("preserves lowercase and capitalizes uppercase originals", () => {
    expect(match_case("hello", "world")).toBe("world");
    expect(match_case("Hello", "world")).toBe("World");
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
    expect(format_key_as_label("")).toBe("");
    expect(format_key_as_label(null)).toBe("");
  });
});

describe("truncate_at_word", () => {
  it("truncates at word boundary within limit and appends ellipsis", () => {
    const input = "The quick brown fox jumps over the lazy dog";
    expect(truncate_at_word(input, 20)).toBe("The quick brown fox…");
    expect(truncate_at_word("Short text", 20)).toBe("Short text");
  });

  it("reserves room for the ellipsis when requested", () => {
    const out = truncate_at_word("The quick brown fox jumps over the lazy dog", 20, { reserve_ellipsis: true });
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith("…")).toBe(true);
  });

  it("honours a minimum word-boundary ratio and strips trailing punctuation", () => {
    expect(truncate_at_word("alpha beta gamma delta epsilon", 20)).toBe("alpha beta gamma…");
    expect(truncate_at_word("alpha beta gamma delta epsilon", 20, { min_bound_ratio: 0.9 })).toBe("alpha beta gamma del…");
    const out = truncate_at_word("one, two, three, four", 16, { strip_trailing_punctuation: true });
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/[,;:]…$/);
  });

  it("handles null or empty inputs", () => {
    expect(truncate_at_word(null)).toBe("");
    expect(truncate_at_word("")).toBe("");
  });
});

describe("collapse_whitespace & normalize_comma_spacing", () => {
  it("collapses whitespace and normalizes comma spacing", () => {
    expect(collapse_whitespace("  a \n\t b  ")).toBe("a b");
    expect(collapse_whitespace(null)).toBe("");
    expect(normalize_comma_spacing("a,b,c")).toBe("a, b, c");
    expect(normalize_comma_spacing(null)).toBe("");
  });
});

describe("count_tokens & CHARS_PER_TOKEN calibration", () => {
  it("exports calibrated CHARS_PER_TOKEN constant (3.35)", () => {
    expect(CHARS_PER_TOKEN).toBe(3.35);
  });

  it("returns 0 for blank inputs and calibrates against CHARS_PER_TOKEN", () => {
    expect(count_tokens("")).toBe(0);
    expect(count_tokens(null)).toBe(0);
    expect(count_tokens(undefined)).toBe(0);
    expect(count_tokens("a".repeat(335))).toBe(100);
    expect(count_tokens("1234567890")).toBe(3);
    expect(count_tokens("x")).toBe(1);
  });
});

describe("escape_xml & prompt_escape", () => {
  it("escape_xml escapes special characters including quotes and brackets", () => {
    const input = `<tag attr="value" prop='single'>& [bracket]</tag>`;
    expect(escape_xml(input)).toBe(`&lt;tag attr=&quot;value&quot; prop=&apos;single&apos;&gt;&amp; &#91;bracket&#93;&lt;/tag&gt;`);
    expect(escape_xml(null)).toBe("");
    expect(escape_xml(123)).toBe("");
  });

  it("prompt_escape escapes only XML tags, keeping brackets, ampersands, and quotes", () => {
    const input = `<dialogue>He said "Hello" & [Action: wave]</dialogue>`;
    expect(prompt_escape(input)).toBe(`&lt;dialogue&gt;He said "Hello" & [Action: wave]&lt;/dialogue&gt;`);
    expect(prompt_escape(null)).toBe("");
  });
});

describe("resolve_style", () => {
  const registry = { noir: {}, cyber: {} };

  it("prefers valid explicit override, then app choice, then fallback", () => {
    expect(resolve_style("cyber", "noir", registry, "none")).toBe("cyber");
    expect(resolve_style("default", "noir", registry, "none")).toBe("noir");
    expect(resolve_style("missing", "missing", registry, "none")).toBe("none");
  });
});

describe("parse_bracket_display_flags", () => {
  it("extracts hide flag and cleans raw value", () => {
    expect(parse_bracket_display_flags("secret plan | hide")).toEqual({ value: "secret plan", is_hidden: true });
    expect(parse_bracket_display_flags("public knowledge | show")).toEqual({ value: "public knowledge", is_hidden: false });
    expect(parse_bracket_display_flags("public knowledge")).toEqual({ value: "public knowledge", is_hidden: false });
    expect(parse_bracket_display_flags(null)).toEqual({ value: "", is_hidden: false });
  });
});

describe("entity_avatar_props", () => {
  it("formats entity for Avatar atom", () => {
    const entity = {
      id: "usr_alice",
      name: "Alice Liddell",
      profile_picture: "https://example.com/alice.png",
      signature_color: "#ff0077",
      modifiers: { flipped: true },
    };
    expect(entity_avatar_props(entity)).toEqual({
      src: "https://example.com/alice.png",
      alt: "Alice Liddell",
      initials: "AL",
      signature_color: "#ff0077",
      flipped: true,
    });
  });

  it("handles null entity gracefully", () => {
    expect(entity_avatar_props(null)).toEqual({ src: "", alt: "", initials: "?", signature_color: "var(--color-gunmetal)", flipped: false });
  });
});

describe("to_style_dropdown_items", () => {
  it("transforms registry map to dropdown options", () => {
    const map = {
      default: { id: "default", name: "Default Prose", description: "Standard voice" },
      noir: { id: "noir", name: "Noir Detective", description: "Gritty streets", speaking_style: "primal", portrait: "noir.png" },
    };
    const items = to_style_dropdown_items(map, "default");
    expect(items).toEqual([
      { value: "default", label: "Default Prose", portrait: "", tag: "DEFAULT", tooltip: "Standard voice" },
      { value: "noir", label: "Noir Detective", portrait: "noir.png", tag: "primal", tooltip: "Gritty streets" },
    ]);
  });
});
