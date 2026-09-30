/**
 * src/intelligence/synaptic.test.js
 * ============================================================================
 * 🧠 SYNAPTIC BRACKET ENGINE TEST SUITE
 * ============================================================================
 *
 * Validates the Universal Bracket Predicate Engine:
 * - Brace-depth aware tokenization for Perchance alternations {a|b}
 * - Parsing of flags (visibility, clamped weight, status)
 * - Prose & layout preservation via targeted slice splicing
 * - Deterministic supersession ledger contract { text, superseded, history }
 * - Atomic clearing keywords
 * - Three-way perspective compilation ('owner' | 'other' | 'vision')
 * - Epistemic secrecy signal preservation for owners
 * - Cross-field relationship harvesting
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import {
  parse_bracket_entries,
  format_bracket_entry,
  apply_bracket_mutation,
  filter_epistemic_brackets,
  extract_entity_relationships,
} from "./synaptic.js";

describe("synaptic: brace-depth aware tokenization & parsing", () => {
  it("preserves Perchance alternations {a|b} inside values without splitting on pipe", () => {
    const input = "[CLOTHING: {clad in dark hoodie|weathered leather jacket} | hide | w: 7]";
    const entries = parse_bracket_entries(input);

    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("CLOTHING");
    expect(entries[0].value).toBe("{clad in dark hoodie|weathered leather jacket}");
    expect(entries[0].visibility).toBe("hide");
    expect(entries[0].weight).toBe(7);
  });

  it("handles multiple nested braces or complex values cleanly", () => {
    const input = "[LOADOUT: {item1|item2|{sub1|sub2}} | w: 9]";
    const entries = parse_bracket_entries(input);

    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("LOADOUT");
    expect(entries[0].value).toBe("{item1|item2|{sub1|sub2}}");
    expect(entries[0].weight).toBe(9);
    expect(entries[0].visibility).toBe("show");
  });

  it("parses [KEY: value] with implied show and default weight 5", () => {
    const input = "[TOP: leather jacket]";
    const entries = parse_bracket_entries(input);

    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("TOP");
    expect(entries[0].value).toBe("leather jacket");
    expect(entries[0].visibility).toBe("show");
    expect(entries[0].weight).toBe(5);
    expect(entries[0].status).toBe("active");
  });

  it("parses [KEY: value | hide | w: 8] correctly", () => {
    const input = "[DAGGER: silver stiletto | hide | w: 8]";
    const entries = parse_bracket_entries(input);

    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe("DAGGER");
    expect(entries[0].value).toBe("silver stiletto");
    expect(entries[0].visibility).toBe("hide");
    expect(entries[0].weight).toBe(8);
  });

  it("clamps weight values outside 1-10 range", () => {
    const input_low = "[DAGGER: knife | w: 0]";
    const input_high = "[AMULET: locket | w: 15]";

    expect(parse_bracket_entries(input_low)[0].weight).toBe(1);
    expect(parse_bracket_entries(input_high)[0].weight).toBe(10);
  });

  it("parses multiple brackets in a single string", () => {
    const input = "[TOP: leather jacket] [LOCATION: harbour docks] [DAGGER: stiletto | hide]";
    const entries = parse_bracket_entries(input);

    expect(entries).toHaveLength(3);
    expect(entries[0].key).toBe("TOP");
    expect(entries[1].key).toBe("LOCATION");
    expect(entries[2].key).toBe("DAGGER");
    expect(entries[2].visibility).toBe("hide");
  });
});

describe("synaptic: formatting", () => {
  it("formats standard entries without default flags", () => {
    const entry = { key: "TOP", value: "jacket", visibility: "show", weight: 5 };
    expect(format_bracket_entry(entry)).toBe("[TOP: jacket]");
  });

  it("formats flagged entries cleanly with pipes", () => {
    const entry = { key: "DAGGER", value: "stiletto", visibility: "hide", weight: 8 };
    expect(format_bracket_entry(entry)).toBe("[DAGGER: stiletto | hide | w: 8]");
  });
});

describe("synaptic: targeted mutation & prose preservation", () => {
  it("preserves natural language prose and surrounding whitespace during mutation", () => {
    const initial = `Analytical cybernetic specialist with an eye for detail.
[CORE: unyielding]
[FOCUS: locate courier]
Never leaves a colleague behind.`;

    const mutation = "[FOCUS: infiltrate the mainframe]";
    const result = apply_bracket_mutation(initial, mutation, { round: 2 });

    expect(result.text).toContain("Analytical cybernetic specialist with an eye for detail.");
    expect(result.text).toContain("[CORE: unyielding]");
    expect(result.text).toContain("[FOCUS: infiltrate the mainframe]");
    expect(result.text).not.toContain("[FOCUS: locate courier]");
    expect(result.text).toContain("Never leaves a colleague behind.");
  });

  it("records superseded entries in the ledger with active round metadata", () => {
    const initial = "[TOP: leather jacket | w: 5]";
    const mutation = "[TOP: heavy trenchcoat | hide | w: 8]";

    const result = apply_bracket_mutation(initial, mutation, { round: 3 });

    expect(result.text).toBe("[TOP: heavy trenchcoat | hide | w: 8]");
    expect(result.superseded).toHaveLength(1);
    expect(result.superseded[0].key).toBe("TOP");
    expect(result.superseded[0].value).toBe("leather jacket");
    expect(result.superseded[0].round_superseded).toBe(3);
    expect(result.history).toHaveLength(1);
  });

  it("handles atomic clearing keywords like [KEY: none] by removing the bracket", () => {
    const initial = `[OVERWEAR: trenchcoat]
[TOP: linen shirt]`;

    const mutation = "[OVERWEAR: none]";
    const result = apply_bracket_mutation(initial, mutation, { round: 4 });

    expect(result.text).not.toContain("OVERWEAR");
    expect(result.text).toContain("[TOP: linen shirt]");
    expect(result.superseded).toHaveLength(1);
    expect(result.superseded[0].key).toBe("OVERWEAR");
    expect(result.superseded[0].value).toBe("trenchcoat");
    expect(result.superseded[0].round_superseded).toBe(4);
  });

  it("is idempotent when applying identical directives", () => {
    const initial = "[TOP: leather jacket | w: 5]";
    const mutation = "[TOP: leather jacket | w: 5]";

    const result = apply_bracket_mutation(initial, mutation, { round: 5 });

    expect(result.text).toBe("[TOP: leather jacket | w: 5]");
    expect(result.superseded).toHaveLength(0);
  });

  it("appends new keys cleanly when not present in initial text", () => {
    const initial = "[TOP: shirt]";
    const mutation = "[WEAPON: katana | hide | w: 9]";

    const result = apply_bracket_mutation(initial, mutation, { round: 1 });

    expect(result.text).toContain("[TOP: shirt]");
    expect(result.text).toContain("[WEAPON: katana | hide | w: 9]");
    expect(result.superseded).toHaveLength(0);
  });
});

describe("synaptic: epistemic perspectives ('owner' | 'other' | 'vision')", () => {
  const sample = `A weathered wanderer.
[TOP: travel cloak]
[DAGGER: silver stiletto | hide | w: 8]
[INVENTORY: rations, lockpicks | hide]
Always walks with a slight limp.`;

  it("owner perspective keeps hide entries marked with '| private' secrecy signal", () => {
    const compiled = filter_epistemic_brackets(sample, "owner");

    expect(compiled).toContain("[TOP: travel cloak]");
    expect(compiled).toContain("[DAGGER: silver stiletto | private]");
    expect(compiled).toContain("[INVENTORY: rations, lockpicks | private]");
    expect(compiled).toContain("A weathered wanderer.");
    expect(compiled).toContain("Always walks with a slight limp.");
    // Engine metadata must be stripped
    expect(compiled).not.toContain("| hide");
    expect(compiled).not.toContain("| w:");
  });

  it("other perspective completely removes hide entries", () => {
    const compiled = filter_epistemic_brackets(sample, "other");

    expect(compiled).toContain("[TOP: travel cloak]");
    expect(compiled).not.toContain("DAGGER");
    expect(compiled).not.toContain("INVENTORY");
    expect(compiled).toContain("A weathered wanderer.");
    expect(compiled).toContain("Always walks with a slight limp.");
  });

  it("vision perspective removes hide entries AND visual-excluded keys", () => {
    const sample_with_show_inventory = `[TOP: travel cloak]
[INVENTORY: gold coins]
[STATUS: wounded | w: 6]
[DAGGER: silver stiletto | hide]`;

    const compiled = filter_epistemic_brackets(sample_with_show_inventory, "vision");

    expect(compiled).toContain("[TOP: travel cloak]");
    expect(compiled).not.toContain("INVENTORY");
    expect(compiled).not.toContain("STATUS");
    expect(compiled).not.toContain("DAGGER");
  });
});

describe("synaptic: relationship extraction", () => {
  it("harvests entity-keyed brackets across eternal, present, past, and future", () => {
    const entity = {
      name: "Kael",
      eternal: {
        physical: "[HAIR: silver] [SCAR: jawline]",
        non_physical: "Quiet protector. [ELARA: younger sister | w: 10] [CREED: defend the weak]",
      },
      present: {
        physical: "[TOP: leather jacket]",
        non_physical: "[ELARA: protective companion | w: 8] [ORION: bitter rival | hide | w: 8]",
      },
      past: [{ content: "[ORION: clashed at the clocktower during round 2 | w: 8]" }, { content: "[ELARA: shared meal at the hearth | w: 6]" }],
      future: "[ELARA: guide safely to sanctuary | w: 9] [ORION: confront in the courtyard | hide]",
    };

    const relationships = extract_entity_relationships(entity, ["Elara", "Orion"]);

    expect(relationships.has("ELARA")).toBe(true);
    expect(relationships.has("ORION")).toBe(true);

    const elara_links = relationships.get("ELARA");
    expect(elara_links.eternal).toBe("younger sister");
    expect(elara_links.present).toBe("protective companion");
    expect(elara_links.past).toHaveLength(1);
    expect(elara_links.past[0]).toContain("shared meal");
    expect(elara_links.future).toBe("guide safely to sanctuary");

    const orion_links = relationships.get("ORION");
    expect(orion_links.present).toBe("bitter rival");
    expect(orion_links.past[0]).toContain("clashed at the clocktower");
  });
});

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-09-29: Initial comprehensive TDD test suite for the Synaptic Bracket Engine (synaptic.js).
 * ============================================================================
 */
