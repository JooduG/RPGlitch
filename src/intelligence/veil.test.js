/**
 * src/intelligence/veil.test.js
 * ============================================================================
 * 🛡️ VEIL ENGINE TEST SUITE
 * ============================================================================
 *
 * Validates the Universal Bracket Predicate & Epistemic Wall Engine:
 * - Brace-depth aware tokenization for Perchance alternations {a|b}
 * - Parsing of flags (visibility, clamped weight, status)
 * - Prose & layout preservation via targeted slice splicing
 * - Deterministic supersession ledger contract { text, superseded, history }
 * - Atomic clearing keywords
 * - Three-way perspective compilation ('owner' | 'other' | 'vision')
 * - Epistemic secrecy signal preservation for owners
 * - Epistemic wall privacy stripping and integrity auditing
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
  strip_epistemic_tags,
  strip_epistemic_secrets,
  verify_epistemic_integrity,
  strip_covert_directives,
  strip_bracket_engine_flags,
} from "./veil.js";

describe("veil: brace-depth aware tokenization & parsing", () => {
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

  it("extracts multiple brackets correctly", () => {
    const input = "[SHIRT: blue silk] [PANTS: black denim | w: 3] [DAGGER: boot knife | hide]";
    const entries = parse_bracket_entries(input);

    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.key)).toEqual(["SHIRT", "PANTS", "DAGGER"]);
    expect(entries[2].visibility).toBe("hide");
  });
});

describe("veil: format_bracket_entry", () => {
  it("formats standard entry without superfluous flags", () => {
    expect(format_bracket_entry({ key: "TOP", value: "sweater" })).toBe("[TOP: sweater]");
  });

  it("formats hidden entry with hide flag", () => {
    expect(format_bracket_entry({ key: "DAGGER", value: "shiv", visibility: "hide" })).toBe("[DAGGER: shiv | hide]");
  });

  it("formats weighted entry with w: flag when weight differs from 5", () => {
    expect(format_bracket_entry({ key: "ARMOR", value: "plate", weight: 9 })).toBe("[ARMOR: plate | w: 9]");
  });

  it("formats both hide and weight flags together", () => {
    expect(format_bracket_entry({ key: "SECRET", value: "treason", visibility: "hide", weight: 8 })).toBe("[SECRET: treason | hide | w: 8]");
  });
});

describe("veil: apply_bracket_mutation (targeted slice splicing)", () => {
  it("replaces existing bracket value in-place without altering surrounding text", () => {
    const original = "Tall athletic warrior.\n[TOP: old shirt]\nWears leather boots.";
    const mutation = "[TOP: armored vest]";

    const result = apply_bracket_mutation(original, mutation);

    expect(result.text).toBe("Tall athletic warrior.\n[TOP: armored vest]\nWears leather boots.");
    expect(result.superseded).toHaveLength(1);
    expect(result.superseded[0].key).toBe("TOP");
    expect(result.superseded[0].value).toBe("old shirt");
  });

  it("appends new bracket entry when key does not exist", () => {
    const original = "Warrior description.\n[TOP: tunic]";
    const mutation = "[CLOAK: velvet cape]";

    const result = apply_bracket_mutation(original, mutation);

    expect(result.text).toBe("Warrior description.\n[TOP: tunic]\n[CLOAK: velvet cape]");
    expect(result.superseded).toHaveLength(0);
  });

  it("clears bracket when value is none or cleared", () => {
    const original = "Warrior.\n[HAT: fedora]\n[BOOTS: heavy]";
    const mutation = "[HAT: none]";

    const result = apply_bracket_mutation(original, mutation);

    expect(result.text).toBe("Warrior.\n[BOOTS: heavy]");
    expect(result.superseded).toHaveLength(1);
    expect(result.superseded[0].key).toBe("HAT");
  });

  it("preserves descriptive values like normal, bare, or healed as valid content", () => {
    const original = "Warrior.\n[MOOD: normal]\n[CHEST: bare]";
    const mutation = "[WOUND: healed]";

    const result = apply_bracket_mutation(original, mutation);

    expect(result.text).toContain("[MOOD: normal]");
    expect(result.text).toContain("[CHEST: bare]");
    expect(result.text).toContain("[WOUND: healed]");
  });

  it("preserves supersession history across cycles", () => {
    const original = "[SWORD: iron blade]";
    const cycle_1 = apply_bracket_mutation(original, "[SWORD: steel longsword]", { round: 1 });
    const cycle_2 = apply_bracket_mutation(cycle_1.text, "[SWORD: runeblade]", { round: 2, history: cycle_1.history });

    expect(cycle_2.text).toBe("[SWORD: runeblade]");
    expect(cycle_2.history).toHaveLength(2);
    expect(cycle_2.history[0].value).toBe("iron blade");
    expect(cycle_2.history[0].round_superseded).toBe(1);
    expect(cycle_2.history[1].value).toBe("steel longsword");
    expect(cycle_2.history[1].round_superseded).toBe(2);
  });
});

describe("veil: filter_epistemic_brackets & privacy", () => {
  const state = "Active scout. [TOP: leather vest] [SECRET: double agent | hide] [INVENTORY: rations, rope]";

  it("owner perspective keeps all entries with | hide secrecy signal", () => {
    const filtered = filter_epistemic_brackets(state, "owner");
    expect(filtered).toContain("[TOP: leather vest]");
    expect(filtered).toContain("[SECRET: double agent | hide]");
    expect(filtered).toContain("[INVENTORY: rations, rope]");
  });

  it("other perspective completely removes hidden entries", () => {
    const filtered = filter_epistemic_brackets(state, "other");
    expect(filtered).toContain("[TOP: leather vest]");
    expect(filtered).not.toContain("double agent");
    expect(filtered).not.toContain("SECRET");
    expect(filtered).toContain("[INVENTORY: rations, rope]");
  });

  it("vision perspective removes hidden entries AND visual excluded keys", () => {
    const filtered = filter_epistemic_brackets(state, "vision");
    expect(filtered).toContain("[TOP: leather vest]");
    expect(filtered).not.toContain("double agent");
    expect(filtered).not.toContain("INVENTORY");
  });

  it("strip_epistemic_tags delegates to filter_epistemic_brackets other", () => {
    expect(strip_epistemic_tags(state)).toBe(filter_epistemic_brackets(state, "other"));
  });

  it("strip_epistemic_secrets respects is_owner flag", () => {
    expect(strip_epistemic_secrets(state, true)).toBe(filter_epistemic_brackets(state, "owner"));
    expect(strip_epistemic_secrets(state, false)).toBe(filter_epistemic_brackets(state, "other"));
  });

  it("verify_epistemic_integrity detects leaked hide or private tags in unauthorized viewpoints", () => {
    expect(verify_epistemic_integrity("<ENTITIES><CHARACTER>Clean state</CHARACTER></ENTITIES>")).toBe(true);
    expect(verify_epistemic_integrity("<ENTITIES><CHARACTER>[DAGGER: stiletto | hide]</CHARACTER></ENTITIES>")).toBe(false);
    expect(verify_epistemic_integrity("<ENTITIES><CHARACTER>[DAGGER: stiletto | private]</CHARACTER></ENTITIES>")).toBe(false);
    expect(verify_epistemic_integrity("<ENTITIES><CHARACTER>[DAGGER: stiletto | hide]</CHARACTER></ENTITIES>", { is_owner: true })).toBe(true);
  });

  it("strip_bracket_engine_flags removes flags for clean embedding calculations", () => {
    const input = "[DAGGER: stiletto | hide | w: 8] [MOOD: alert | show]";
    expect(strip_bracket_engine_flags(input)).toBe("[DAGGER: stiletto] [MOOD: alert]");
  });
});

describe("veil: extract_entity_relationships", () => {
  const entity = {
    eternal: { non_physical: "Solitary wanderer. [@ELARA: younger sister]" },
    present: { non_physical: "Watchful and tense. [@ELARA: protective companion] [@ORION: bitter rival | hide]" },
    past: [
      { id: "ai_1", content: "Remembered a warm shared meal. [@ELARA: shared meal]" },
      { id: "ai_2", content: "A violent encounter. [@ORION: clashed at the clocktower]" },
    ],
    future: "Plans to reach the coast. [@ELARA: guide safely to sanctuary] [@ORION: confront in the courtyard | hide]",
  };

  it("extracts all relational links for known entities under owner perspective", () => {
    const relationships = extract_entity_relationships(entity, ["Elara", "Orion"], "owner");

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
    expect(orion_links.future).toBe("confront in the courtyard");
  });

  it("redacts hidden relationships when harvested for other perspectives", () => {
    const relationships = extract_entity_relationships(entity, ["Elara", "Orion"], "other");

    expect(relationships.has("ELARA")).toBe(true);
    const orion_links = relationships.get("ORION");
    expect(orion_links?.present).toBeUndefined();
    expect(orion_links?.future).toBeUndefined();
    expect(orion_links?.past).toHaveLength(1);
  });

  it("extracts @TARGET brackets, resolves @USER/@CHAR, and expands @SPEAKER/@LISTENER macros", () => {
    const actor = {
      name: "Julien",
      present: {
        non_physical: "[@USER: @SPEAKER vows to protect @LISTENER | hide] [@BENEDICT: rival hacker]",
      },
    };
    const ambient = {
      USER: { id: "usr_alice", name: "Alice" },
      AI: actor,
    };

    // Owner perspective sees the edge with expanded names
    const owner_rels = extract_entity_relationships(actor, ["Benedict"], "owner", ambient);
    expect(owner_rels.has("ALICE")).toBe(true);
    expect(owner_rels.get("ALICE").present).toBe("Julien vows to protect Alice");
    expect(owner_rels.has("BENEDICT")).toBe(true);
    expect(owner_rels.get("BENEDICT").present).toBe("rival hacker");

    // Other perspective hides the hidden edge
    const other_rels = extract_entity_relationships(actor, ["Benedict"], "other", ambient);
    expect(other_rels.has("ALICE")).toBe(false);
    expect(other_rels.has("BENEDICT")).toBe(true);
  });
});

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-10-01: Renamed synaptic.test.js to veil.test.js and added tests for strip_epistemic_tags, strip_epistemic_secrets, verify_epistemic_integrity, and strip_bracket_engine_flags.
 * - 2026-09-30: Added tests for restricted clearing keywords (none/cleared only), | private token alias, owner round-trip resiliency, and perspective-aware relationship harvesting.
 * - 2026-09-29: Initial comprehensive TDD test suite for the Synaptic Bracket Engine (synaptic.js).
 * ============================================================================
 */

describe("veil: strip_covert_directives (Track 3.3 private directive purging)", () => {
  it("strips covert/secret/private/hidden brackets while preserving veil brackets", () => {
    expect(strip_covert_directives("Advance. [COVERT: betray the pact] Keep walking.")).toBe("Advance. Keep walking.");
    expect(strip_covert_directives("[SECRET: hidden dagger] Strike. [DAGGER: stiletto | hide]")).toBe(" Strike. [DAGGER: stiletto | hide]");
    expect(strip_covert_directives("Move «COVERT: silently» forward.")).toBe("Move forward.");
  });

  it("returns empty for empty input and passes clean text through", () => {
    expect(strip_covert_directives("")).toBe("");
    expect(strip_covert_directives(null)).toBe("");
    expect(strip_covert_directives("Alice checks the charge on her deck.")).toBe("Alice checks the charge on her deck.");
  });
});
