import { describe, expect, it } from "vitest";
import {
  AGGREGATE_KEYS,
  apply_tagged_field_deltas,
  balance_brackets,
  CLEAR_TOKENS,
  CLOTHING_KEYS,
  derive_vector_title,
  extract_entity_relationships,
  format_relational_vector,
  format_tagged_fields,
  has_bracket_bond,
  parse_relationship_brackets,
  parse_relational_vector,
  parse_tagged_fields,
  safe_parse_pseudo_json,
  strip_leading_key_echo,
  VISUAL_EXCLUDED_KEYS,
} from "./brackets.js";

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

describe("CLOTHING_KEYS", () => {
  it("contains canonical clothing keys in a frozen array", () => {
    expect(CLOTHING_KEYS).toContain("SHIRT");
    expect(CLOTHING_KEYS).toContain("PANTS");
    expect(CLOTHING_KEYS).toContain("ARMOR");
    expect(CLOTHING_KEYS).toContain("CLOTHING");
    expect(Object.isFrozen(CLOTHING_KEYS)).toBe(true);
  });
});

describe("strip_leading_key_echo", () => {
  it("strips matching underscore or spaced key echoes", () => {
    expect(strip_leading_key_echo("STATE: protective", ["STATE"])).toBe("protective");
    expect(strip_leading_key_echo("DENTAL FEATURES: sharp fangs", ["DENTAL_FEATURES"])).toBe("sharp fangs");
    expect(strip_leading_key_echo("plain value", ["STATE"])).toBe("plain value");
  });
});

describe("safe_parse_pseudo_json", () => {
  it("extracts bracketed key value pairs", () => {
    const parsed = safe_parse_pseudo_json("[SHIRT: leather jacket] [LOCATION: tavern]");
    expect(parsed).toEqual({ SHIRT: "leather jacket", LOCATION: "tavern" });
  });

  it("applies atomic clearing tokens by deleting the key", () => {
    const parsed = safe_parse_pseudo_json("[SHIRT: leather jacket] [HELD: none] [INJURY: healed]");
    expect(parsed).toEqual({ SHIRT: "leather jacket" });
  });

  it("aggregates repeated INVENTORY / STASH entries", () => {
    const parsed = safe_parse_pseudo_json("[INVENTORY: potion, map] [INVENTORY: dagger]");
    expect(parsed.INVENTORY).toEqual(["potion", "map", "dagger"]);
  });

  it("aggregates multiple relational @-prefixed entries under the same target", () => {
    const parsed = safe_parse_pseudo_json("[@ASHENWEALD: high court birthplace] [@ASHENWEALD: site of public stripping of princehood]");
    expect(parsed["@ASHENWEALD"]).toEqual(["high court birthplace", "site of public stripping of princehood"]);
  });

  it("falls back to quoted JSON or raw prose", () => {
    expect(safe_parse_pseudo_json('"STATUS": "active"')).toEqual({ STATUS: "active" });
    expect(safe_parse_pseudo_json("Just raw narrative prose.")).toEqual({ __raw_prose__: "Just raw narrative prose." });
  });

  it("keeps multi-word uppercase keys separate when unbracketed (tag-name leak regression)", () => {
    const parsed = safe_parse_pseudo_json("HAIR: dark with silver streaks at the temples DENTAL FEATURES: perfectly white sharp fangs HEIGHT: 193 cm");
    expect(parsed).toEqual({ HAIR: "dark with silver streaks at the temples", DENTAL_FEATURES: "perfectly white sharp fangs", HEIGHT: "193 cm" });
  });

  it("never merges a following key into the previous value across unbracketed keys", () => {
    const parsed = safe_parse_pseudo_json("LANDMARKS: rows of vat tanks VISUAL_THEME: sterile chrome and cold blue light");
    expect(parsed).toEqual({ LANDMARKS: "rows of vat tanks", VISUAL_THEME: "sterile chrome and cold blue light" });
  });

  it("does not let a bracket value swallow the next bracket's key", () => {
    const parsed = safe_parse_pseudo_json("[HAIR: silver streaks] [DENTAL_FEATURES: sharp fangs]");
    expect(parsed).toEqual({ HAIR: "silver streaks", DENTAL_FEATURES: "sharp fangs" });
  });

  it("splits a following uppercase key swallowed inside a single bracket (tag-name leak regression)", () => {
    const parsed = safe_parse_pseudo_json("[HAIR: dark with silver streaks at the temples DENTAL FEATURES: perfectly white sharp fangs]");
    expect(parsed).toEqual({ HAIR: "dark with silver streaks at the temples", DENTAL_FEATURES: "perfectly white sharp fangs" });
  });

  it("splits multiple keys inside one bracket", () => {
    const parsed = safe_parse_pseudo_json("[STATE: protective, possessive SECRET: he fears being owned]");
    expect(parsed).toEqual({ STATE: "protective, possessive", SECRET: "he fears being owned" });
  });

  it("preserves lowercase keys and URL values while splitting embedded keys", () => {
    expect(safe_parse_pseudo_json("[location: tavern]")).toEqual({ location: "tavern" });
    expect(safe_parse_pseudo_json("[NOTE: see HTTP://example.com]")).toEqual({ NOTE: "see HTTP://example.com" });
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

describe("CLEAR_TOKENS & AGGREGATE_KEYS", () => {
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
    expect(v3).toEqual({ source_name: "K-9", target_name: "Nova-City", dynamic: "defense patrol unit", raw: "K-9 → Nova-City: defense patrol unit" });
  });

  it("handles vectors with no dynamic description", () => {
    const v = parse_relational_vector("Julien → Ashenweald");
    expect(v).toEqual({ source_name: "Julien", target_name: "Ashenweald", dynamic: "", raw: "Julien → Ashenweald" });
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

describe("balance_brackets", () => {
  it("encloses line that ends with ] but misses [", () => {
    const input = "high-alert containment breach | w: 8]";
    expect(balance_brackets(input)).toBe("[high-alert containment breach | w: 8]");
  });

  it("closes line that starts with [ but misses ]", () => {
    const input = "[ANOMALY: imminent orbital dissemination of mind-wipe virus";
    expect(balance_brackets(input)).toBe("[ANOMALY: imminent orbital dissemination of mind-wipe virus]");
  });

  it("repairs multiline text containing both opening and closing bracket errors", () => {
    const input = "high-alert containment breach | w: 8]\n[ANOMALY: imminent orbital dissemination of mind-wipe virus";
    expect(balance_brackets(input)).toBe("[high-alert containment breach | w: 8]\n[ANOMALY: imminent orbital dissemination of mind-wipe virus]");
  });

  it("leaves already balanced brackets untouched", () => {
    const input = "[STATE: active] [MOOD: tense | w: 7]";
    expect(balance_brackets(input)).toBe("[STATE: active] [MOOD: tense | w: 7]");
  });

  it("wraps unbracketed key-value or weight directives", () => {
    expect(balance_brackets("ANOMALY: containment breach | w: 8")).toBe("[ANOMALY: containment breach | w: 8]");
    expect(balance_brackets("@DR_TARIQ: hostile | hide")).toBe("[@DR_TARIQ: hostile | hide]");
  });

  it("does not wrap natural language prose lines with colons or pipes", () => {
    expect(balance_brackets("Note: the corridor hums quietly.")).toBe("Note: the corridor hums quietly.");
    expect(balance_brackets("He whispered: run before they find you.")).toBe("He whispered: run before they find you.");
    expect(balance_brackets("They played hide and seek in the shadows.")).toBe("They played hide and seek in the shadows.");
  });

  it("handles null and empty input gracefully", () => {
    expect(balance_brackets(null)).toBe("");
    expect(balance_brackets("")).toBe("");
  });
});

describe("visual exclusion via format_tagged_fields & VISUAL_EXCLUDED_KEYS", () => {
  it("exports frozen VISUAL_EXCLUDED_KEYS set", () => {
    expect(VISUAL_EXCLUDED_KEYS).toBeInstanceOf(Set);
    expect(VISUAL_EXCLUDED_KEYS.has("INVENTORY")).toBe(true);
    expect(VISUAL_EXCLUDED_KEYS.has("STASH")).toBe(true);
    expect(VISUAL_EXCLUDED_KEYS.has("SECRET")).toBe(true);
    expect(VISUAL_EXCLUDED_KEYS.has("PLAN")).toBe(true);
    expect(VISUAL_EXCLUDED_KEYS.has("STATUS")).toBe(true);
    expect(Object.isFrozen(VISUAL_EXCLUDED_KEYS)).toBe(true);
  });

  it("returns empty string for falsey inputs", () => {
    expect(format_tagged_fields("", { visual_only: true })).toBe("");
    expect(format_tagged_fields(null, { visual_only: true })).toBe("");
    expect(format_tagged_fields(undefined, { visual_only: true })).toBe("");
  });

  it("preserves raw prose if no pseudo-JSON brackets are parsed", () => {
    const raw = "A lone figure stands in the rain";
    expect(format_tagged_fields(raw, { visual_only: true })).toBe(raw);
  });

  it("strips visual excluded keys and retains visual keys", () => {
    const input = "[SHIRT: red tunic] [INVENTORY: dagger, potion] [HAIR: raven] [SECRET: knows the truth] [STATUS: bleeding]";
    const result = format_tagged_fields(input, { visual_only: true });
    expect(result).toContain("[SHIRT: red tunic]");
    expect(result).toContain("[HAIR: raven]");
    expect(result).not.toContain("INVENTORY");
    expect(result).not.toContain("SECRET");
    expect(result).not.toContain("STATUS");
  });
});

describe("extract_entity_relationships & has_bracket_bond", () => {
  const known = [
    { id: "silvers", name: "Lord Benedict Silvers" },
    { id: "glitch", name: "Glitch" },
    { id: "nova", name: "Nova City" },
  ];

  it("harvests value-referenced @IDs across all 6 quadrant fields as arrays without overwriting", () => {
    const orion = {
      id: "orion",
      name: "Orion",
      eternal: { physical: "[TATTOO: glowing mark from @NOVA]", non_physical: "[RIVALRY: @GLITCH hacker rivalry], [SPONSORSHIP: @SILVERS protein deal]" },
      present: {
        physical: "[DANCING_MAN: @GLITCH watching from the rooftop]",
        non_physical: "[FOCUS: @SILVERS' posture], [SUSPICION: @SILVERS' motives | hide]",
      },
      future: "[GOAL: dismantle @SILVERS' composure]",
      past: "[BREACH: @GLITCH and @SILVERS clashed at @NOVA]",
    };

    const rels = extract_entity_relationships(orion, known, "owner");
    expect(rels.get("SILVERS").present).toEqual(["[FOCUS: @SILVERS' posture]", "[SUSPICION: @SILVERS' motives]"]);
    expect(rels.get("SILVERS").future).toEqual(["[GOAL: dismantle @SILVERS' composure]"]);
    expect(rels.get("GLITCH").present).toEqual(["[DANCING_MAN: @GLITCH watching from the rooftop]"]);
    expect(rels.get("NOVA").eternal).toEqual(["[TATTOO: glowing mark from @NOVA]"]);
    // Multi-target past bracket emits an edge to each referenced target
    expect(rels.get("GLITCH").past).toEqual(["[BREACH: @GLITCH and @SILVERS clashed at @NOVA]"]);
    expect(rels.get("SILVERS").past).toEqual(["[BREACH: @GLITCH and @SILVERS clashed at @NOVA]"]);
    expect(rels.get("NOVA").past).toEqual(["[BREACH: @GLITCH and @SILVERS clashed at @NOVA]"]);
  });

  it("filters | hide entries for 'other' perspective and ignores unknown @words", () => {
    const entity = {
      id: "orion",
      name: "Orion",
      present: { non_physical: "[PUBLIC: trusts @SILVERS | show], [SECRET: plotting against @SILVERS | hide], [NOTE: @UNKNOWN_HANDLE]" },
    };
    const other_rels = extract_entity_relationships(entity, known, "other");
    expect(other_rels.get("SILVERS").present).toEqual(["[PUBLIC: trusts @SILVERS]"]);
    expect(other_rels.has("UNKNOWN_HANDLE")).toBe(false);
  });

  it("expands @ME/@YOU and resolves ambient @USER/@CHAR/@FRACTAL", () => {
    const entity = { id: "orion", name: "Orion", present: { non_physical: "[BOND: @ME watches @YOU and @USER]" } };
    const rels = extract_entity_relationships(entity, known, "owner", { USER: { id: "u1", name: "Alex" } });
    expect(rels.get("U1").present).toEqual(["[BOND: Orion watches Alex and Alex]"]);
  });

  it("has_bracket_bond detects @TARGET inside bracket values across quadrants", () => {
    const fractal = { id: "nova", name: "Nova City", present: { physical: "[STAGE: @ORION is busting out some moves]" } };
    expect(has_bracket_bond(fractal, { id: "orion", name: "Orion" })).toBe(true);
    expect(has_bracket_bond(fractal, { id: "silvers", name: "Silvers" })).toBe(false);
  });

  it("parse_relationship_brackets parses quadrant links and extracts display flags", () => {
    const links = { present: ["[BOND: @TARGET loyal | show]", "[SECRET: @TARGET rival | hide]"], eternal: ["[PACT: Blood oath]"] };
    const items = parse_relationship_brackets(links);
    expect(items).toEqual([
      { key: "BOND", value: "@TARGET loyal", is_hidden: false, quadrant: "present" },
      { key: "SECRET", value: "@TARGET rival", is_hidden: true, quadrant: "present" },
      { key: "PACT", value: "Blood oath", is_hidden: false, quadrant: "eternal" },
    ]);
  });
});
