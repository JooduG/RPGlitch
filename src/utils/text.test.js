import { describe, expect, it } from "vitest";
import {
  AGGREGATE_KEYS,
  clean_text,
  CLEAR_TOKENS,
  collapse_history,
  decompose_story_title,
  derive_vector_title,
  escape_unescaped_json_quotes,
  extract_json_block,
  first_sentence,
  format_datetime,
  format_key_as_label,
  format_relational_vector,
  get_style_initials,
  ind,
  match_case,
  merge_prose_into_field,
  NAME_PREFIXES,
  parse_relational_vector,
  safe_parse_json,
  safe_parse_pseudo_json,
  strip_cognition_blocks,
} from "./text.js";

describe("safe_parse_json", () => {
  it("extracts embedded JSON object from surrounding text", () => {
    const raw = `Here is your prompt: {"prompt": "cyberpunk alley", "negative_prompt": "blurry"} Hope you like it!`;
    expect(safe_parse_json(raw)).toEqual({ prompt: "cyberpunk alley", negative_prompt: "blurry" });
  });

  it("extracts embedded JSON array from surrounding text", () => {
    const raw = `Available targets: ["solo_entity", "story_scene"]`;
    expect(safe_parse_json(raw)).toEqual(["solo_entity", "story_scene"]);
  });

  it("returns null for non-JSON or invalid input", () => {
    expect(safe_parse_json("just text")).toBeNull();
    expect(safe_parse_json("")).toBeNull();
    expect(safe_parse_json(null)).toBeNull();
    expect(safe_parse_json("{ broken json ")).toBeNull();
  });
});

describe("strip_cognition_blocks", () => {
  it("removes think tags and internal monologue from text", () => {
    expect(strip_cognition_blocks("<think>Planning next turn...</think>Hello world.")).toBe("Hello world.");
    expect(strip_cognition_blocks("Before <think>secret thought</think> After")).toBe("Before  After");
  });

  it("handles dangling closing think tags and model artifact prefixes", () => {
    expect(strip_cognition_blocks("Prose content.</think>")).toBe("Prose content.");
    expect(strip_cognition_blocks("Mattis. Archetypes: Hero\nReal story begins.")).toBe("Real story begins.");
  });

  it("handles null or empty inputs", () => {
    expect(strip_cognition_blocks(null)).toBe("");
    expect(strip_cognition_blocks("")).toBe("");
  });
});

describe("safe_parse_pseudo_json", () => {
  it("extracts bracketed key value pairs", () => {
    const parsed = safe_parse_pseudo_json("[SHIRT: leather jacket] [LOCATION: tavern]");
    expect(parsed).toEqual({
      SHIRT: "leather jacket",
      LOCATION: "tavern",
    });
  });

  it("applies atomic clearing tokens by deleting the key", () => {
    const parsed = safe_parse_pseudo_json("[SHIRT: leather jacket] [HELD: none] [INJURY: healed]");
    expect(parsed).toEqual({
      SHIRT: "leather jacket",
    });
  });

  it("aggregates repeated INVENTORY / STASH entries", () => {
    const parsed = safe_parse_pseudo_json("[INVENTORY: potion, map] [INVENTORY: dagger]");
    expect(parsed.INVENTORY).toEqual(["potion", "map", "dagger"]);
  });

  it("falls back to quoted JSON or raw prose", () => {
    expect(safe_parse_pseudo_json('"STATUS": "active"')).toEqual({ STATUS: "active" });
    expect(safe_parse_pseudo_json("Just raw narrative prose.")).toEqual({
      __raw_prose__: "Just raw narrative prose.",
    });
  });
});

describe("merge_prose_into_field", () => {
  it("merges new bracket directives into existing structured field", () => {
    const current = "[SHIRT: tunic] [PANTS: trousers]";
    const result = merge_prose_into_field(current, "[SHIRT: armored vest] [HELD: sword]");
    expect(result).toContain("[SHIRT: armored vest]");
    expect(result).toContain("[PANTS: trousers]");
    expect(result).toContain("[HELD: sword]");
  });

  it("clears clothing keys on [CLOTHING: none]", () => {
    const current = "[SHIRT: tunic] [PANTS: jeans] [BOOTS: leather]";
    const result = merge_prose_into_field(current, "[CLOTHING: none]");
    expect(result).not.toContain("SHIRT");
    expect(result).not.toContain("PANTS");
    expect(result).not.toContain("BOOTS");
  });

  it("appends raw prose to existing raw prose fields", () => {
    const current = "A weathered nomad.";
    const result = merge_prose_into_field(current, "Carries a bronze locket.");
    expect(result).toBe("A weathered nomad.\nCarries a bronze locket.");
  });
});

describe("ind", () => {
  it("indents multi-line string content with specified spaces", () => {
    const text = "line1\nline2\nline3";
    expect(ind(text, 2)).toBe("line1\n  line2\n  line3");
  });

  it("returns empty string on empty inputs", () => {
    expect(ind(null, 2)).toBe("");
    expect(ind("", 2)).toBe("");
  });
});

describe("get_style_initials", () => {
  it("derives initials from style names", () => {
    expect(get_style_initials("Cyberpunk Noir")).toBe("CN");
    expect(get_style_initials("Dark-Gothic-Horror")).toBe("DGH");
  });

  it("returns fallback question mark on none styles", () => {
    expect(get_style_initials("No Narrative Style")).toBe("?");
    expect(get_style_initials("No Visual Style")).toBe("?");
    expect(get_style_initials("")).toBe("?");
  });
});

describe("first_sentence", () => {
  it("extracts the first sentence within boundary", () => {
    expect(first_sentence("The sky broke open. Rain poured down.")).toBe("The sky broke open.");
    expect(first_sentence("A quick alert!")).toBe("A quick alert!");
  });

  it("returns empty string on empty input", () => {
    expect(first_sentence(null)).toBe("");
    expect(first_sentence("")).toBe("");
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

describe("extract_json_block", () => {
  it("extracts JSON object substring ignoring markdown fences", () => {
    const raw = '```json\n{\n  "action": "attack"\n}\n```';
    expect(extract_json_block(raw)).toBe('{\n  "action": "attack"\n}');
  });

  it("returns null when no braces exist", () => {
    expect(extract_json_block("No JSON here")).toBeNull();
    expect(extract_json_block(null)).toBeNull();
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

describe("collapse_history", () => {
  it("groups consecutive messages from the same role and character", () => {
    const messages = [
      { role: "user", text: "Hello", character_name: "Orion" },
      { role: "user", text: "Are you there?", character_name: "Orion" },
      { role: "assistant", text: "I am here.", character_name: "Glitch" },
    ];
    const collapsed = collapse_history(messages);
    expect(collapsed).toEqual([
      { role: "USER_PERSONA", name: "Orion", content: "Hello\nAre you there?" },
      { role: "AI_CHARACTER", name: "Glitch", content: "I am here." },
    ]);
  });

  it("ignores system messages in collapsed history", () => {
    const messages = [
      { role: "system", text: "Telemetry delta" },
      { role: "assistant", text: "Welcome.", character_name: "Glitch" },
    ];
    expect(collapse_history(messages)).toEqual([{ role: "AI_CHARACTER", name: "Glitch", content: "Welcome." }]);
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

describe("derive_vector_title", () => {
  it("derives a clean title from short directive text", () => {
    expect(derive_vector_title("Washed ashore at Mournhold.")).toBe("Washed ashore at Mournhold");
  });

  it("truncates long directive text with ellipsis at word boundary", () => {
    const long_text = "This is a very long directive text that exceeds the maximum length limit allowed for headers";
    const title = derive_vector_title(long_text, 38);
    expect(title.length).toBeLessThanOrEqual(40);
    expect(title.endsWith("…")).toBe(true);
  });

  it("handles null or non-string inputs gracefully", () => {
    expect(derive_vector_title(null)).toBe("");
    expect(derive_vector_title(undefined)).toBe("");
    expect(derive_vector_title("")).toBe("");
  });
});

describe("NAME_PREFIXES, CLEAR_TOKENS, AGGREGATE_KEYS", () => {
  it("contains common title prefixes and stop words in frozen array", () => {
    expect(NAME_PREFIXES).toContain("dr");
    expect(NAME_PREFIXES).toContain("the");
    expect(NAME_PREFIXES).toContain("mr.");
  });

  it("exposes canonical clearing and aggregation tokens in frozen Sets", () => {
    expect(CLEAR_TOKENS.has("none")).toBe(true);
    expect(CLEAR_TOKENS.has("healed")).toBe(true);
    expect(AGGREGATE_KEYS.has("INVENTORY")).toBe(true);
    expect(AGGREGATE_KEYS.has("STASH")).toBe(true);
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

describe("decompose_story_title", () => {
  it("decomposes standard title into colored entity segments", () => {
    const entities = {
      ai: { name: "Glitch" },
      user: { name: "Orion" },
      fractal: { name: "Nova City" },
      get_color: (e) => (e.name === "Glitch" ? "#00ffcc" : e.name === "Orion" ? "#ff66cc" : "#6699ff"),
    };
    const title = "Chronicles of Glitch & Orion in Nova City";
    const parts = decompose_story_title(title, entities);
    expect(parts).toEqual([
      { text: "Chronicles of " },
      { text: "Glitch", color: "#00ffcc" },
      { text: " & " },
      { text: "Orion", color: "#ff66cc" },
      { text: " in " },
      { text: "Nova City", color: "#6699ff" },
    ]);
  });

  it("handles custom arbitrary titles gracefully", () => {
    const title = "Custom Dark Fantasy Epic";
    const parts = decompose_story_title(title, {});
    expect(parts).toEqual([{ text: "Custom Dark Fantasy Epic" }]);
  });

  it("handles null or empty title gracefully", () => {
    expect(decompose_story_title(null)).toEqual([{ text: "" }]);
    expect(decompose_story_title("")).toEqual([{ text: "" }]);
  });
});
