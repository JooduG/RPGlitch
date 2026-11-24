import { describe, expect, it } from "vitest";
import {
  apply_tagged_field_deltas,
  CLEAR_TOKENS,
  CLOTHING_KEYS,
  extract_entity_relationships,
  format_tagged_fields,
  has_bracket_bond,
  parse_relationship_brackets,
  parse_tagged_fields,
  safe_parse_pseudo_json,
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

describe("CLEAR_TOKENS & aggregate behavior", () => {
  it("exposes canonical clearing tokens in a frozen Set and aggregates INVENTORY/STASH", () => {
    expect(CLEAR_TOKENS.has("none")).toBe(true);
    expect(CLEAR_TOKENS.has("healed")).toBe(true);
    expect(apply_tagged_field_deltas("[INVENTORY: sword]", "[INVENTORY: shield]")).toContain("sword, shield");
    expect(apply_tagged_field_deltas("[STASH: coin]", "[STASH: gem]")).toContain("coin, gem");
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
