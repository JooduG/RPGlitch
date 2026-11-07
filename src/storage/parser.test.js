import { describe, it, expect } from "vitest";
import {
  parse_bracket_token,
  parse_brackets,
  format_clean_brackets,
  apply_bracket_deltas,
  extract_memory_candidates,
  extract_entity_relationships,
} from "./parser.js";

describe("src/storage/parser.js — Canonical Bracket Tokenizer & Epistemic Wall", () => {
  describe("parse_bracket_token", () => {
    it("parses single bracket token with normalized uppercase key and flags", () => {
      const raw = "[knife: concealed in boot | hide | w: 9 | is_origin]";
      const parsed = parse_bracket_token(raw);

      expect(parsed).toEqual({
        key: "KNIFE",
        value: "concealed in boot",
        flags: {
          hide: true,
          show: false,
          is_origin: true,
          weight: 9,
        },
        raw,
      });
    });

    it("isolates pipes inside {Option A | Option B} from control flags", () => {
      const raw = "[OUTFIT: {wearing a black harness | white silk shirt} | hide | w: 7]";
      const parsed = parse_bracket_token(raw);

      expect(parsed.key).toBe("OUTFIT");
      expect(parsed.value).toBe("{wearing a black harness | white silk shirt}");
      expect(parsed.flags.hide).toBe(true);
      expect(parsed.flags.weight).toBe(7);
    });

    it("returns null on invalid or non-bracket string", () => {
      expect(parse_bracket_token("not a bracket")).toBeNull();
      expect(parse_bracket_token("[NO_COLON]")).toBeNull();
      expect(parse_bracket_token("")).toBeNull();
      expect(parse_bracket_token(null)).toBeNull();
    });
  });

  describe("parse_brackets", () => {
    it("extracts multiple brackets from multiline state text", () => {
      const text = `
        [BUILD: tall and athletic]
        [MOOD: cautious]
        [SECRET: knows the cipher | hide]
      `;

      const brackets = parse_brackets(text);
      expect(brackets).toHaveLength(3);
      expect(brackets[0].key).toBe("BUILD");
      expect(brackets[1].key).toBe("MOOD");
      expect(brackets[2].key).toBe("SECRET");
      expect(brackets[2].flags.hide).toBe(true);
    });

    it("returns empty array for empty or invalid input", () => {
      expect(parse_brackets("")).toEqual([]);
      expect(parse_brackets(null)).toEqual([]);
    });
  });

  describe("format_clean_brackets & Epistemic Wall", () => {
    const text = `
      [BUILD: tall]
      [GUN: holstered | hide]
      [INVENTORY: medkit]
      [STASH: gold coin]
    `;

    it("active entity sees own hidden brackets when see_hidden='own' and is_counterpart=false", () => {
      const formatted = format_clean_brackets(text, { see_hidden: "own", is_counterpart: false });
      expect(formatted).toContain("[BUILD: tall]");
      expect(formatted).toContain("[GUN: holstered]");
    });

    it("redacts hidden brackets across the Epistemic Wall when is_counterpart=true", () => {
      const formatted = format_clean_brackets(text, { see_hidden: "own", is_counterpart: true });
      expect(formatted).toContain("[BUILD: tall]");
      expect(formatted).not.toContain("[GUN: holstered]");
    });

    it("keeps all brackets when see_hidden='all'", () => {
      const formatted = format_clean_brackets(text, { see_hidden: "all", is_counterpart: true });
      expect(formatted).toContain("[BUILD: tall]");
      expect(formatted).toContain("[GUN: holstered]");
    });

    it("strips all hidden brackets when see_hidden='none'", () => {
      const formatted = format_clean_brackets(text, { see_hidden: "none", is_counterpart: false });
      expect(formatted).toContain("[BUILD: tall]");
      expect(formatted).not.toContain("[GUN: holstered]");
    });

    it("strips INVENTORY and STASH brackets when strip_inventory=true or see_hidden='none' for diffusion", () => {
      const formatted = format_clean_brackets(text, { strip_inventory: true });
      expect(formatted).toContain("[BUILD: tall]");
      expect(formatted).not.toContain("[INVENTORY: medkit]");
      expect(formatted).not.toContain("[STASH: gold coin]");

      const diffusion = format_clean_brackets(text, { see_hidden: "none" });
      expect(diffusion).toContain("[BUILD: tall]");
      expect(diffusion).not.toContain("[INVENTORY: medkit]");
      expect(diffusion).not.toContain("[STASH: gold coin]");
    });
  });

  describe("apply_bracket_deltas", () => {
    it("overwrites single-value keys with new bracket values", () => {
      const current = "[CHEST: armored]\n[MOOD: relaxed]";
      const delta = "[CHEST: bare]\n[MOOD: alert]";

      const merged = apply_bracket_deltas(current, delta);
      expect(merged).toContain("[CHEST: bare]");
      expect(merged).toContain("[MOOD: alert]");
      expect(merged).not.toContain("[CHEST: armored]");
      expect(merged).not.toContain("[MOOD: relaxed]");
    });

    it("normalizes lowercase incoming keys to uppercase during merge", () => {
      const current = "[CHEST: armored]";
      const delta = "[chest: bare]\n[boots: combat leather]";

      const merged = apply_bracket_deltas(current, delta);
      expect(merged).toContain("[CHEST: bare]");
      expect(merged).toContain("[BOOTS: combat leather]");
      expect(merged).not.toContain("[chest: bare]");
      expect(merged).not.toContain("[boots: combat leather]");
    });

    it("deletes keys when incoming delta value is 'none' or 'cleared', regardless of casing or whitespace", () => {
      const current = "[ARMOR: steel plate]\n[HELMET: iron visored]\n[BOOTS: leather]";
      const delta = "[armor: None]\n[HELMET:  Cleared ]";

      const merged = apply_bracket_deltas(current, delta);
      expect(merged).not.toContain("ARMOR");
      expect(merged).not.toContain("HELMET");
      expect(merged).toContain("[BOOTS: leather]");
    });

    it("appends multi-entry keys (INVENTORY and STASH) without overwriting prior items", () => {
      const current = "[INVENTORY: knife]\n[STASH: map]";
      const delta = "[INVENTORY: grappling hook]\n[STASH: lockpicks]";

      const merged = apply_bracket_deltas(current, delta);
      expect(merged).toContain("[INVENTORY: knife]");
      expect(merged).toContain("[INVENTORY: grappling hook]");
      expect(merged).toContain("[STASH: map]");
      expect(merged).toContain("[STASH: lockpicks]");
    });

    it("appends new single-value keys while preserving existing untouched keys", () => {
      const current = "[HAIR: black]\n[EYES: blue]";
      const delta = "[SCAR: left cheek]";

      const merged = apply_bracket_deltas(current, delta);
      expect(merged).toContain("[HAIR: black]");
      expect(merged).toContain("[EYES: blue]");
      expect(merged).toContain("[SCAR: left cheek]");
    });

    it("handles flags in delta brackets cleanly", () => {
      const current = "[SECRET: none]";
      const delta = "[SECRET: cipher code | hide]";

      const merged = apply_bracket_deltas(current, delta);
      expect(merged).toContain("[SECRET: cipher code | hide]");
    });
  });

  describe("extract_memory_candidates", () => {
    it("converts canonical past multiline bracket string into candidate items for Sieve RAG", () => {
      const past_text = `
        [ORIGIN: escaped facility | is_origin | w: 10]
        [MEMORY: courier at docks | w: 7]
        [ENCOUNTER: shadowy figure | hide | w: 5]
      `;

      const candidates = extract_memory_candidates(past_text);
      expect(candidates).toHaveLength(3);

      expect(candidates[0]).toEqual({
        id: expect.any(String),
        text: "escaped facility",
        is_origin: true,
        weight: 10,
        key: "ORIGIN",
      });

      expect(candidates[1]).toEqual({
        id: expect.any(String),
        text: "courier at docks",
        is_origin: false,
        weight: 7,
        key: "MEMORY",
      });

      expect(candidates[2]).toEqual({
        id: expect.any(String),
        text: "shadowy figure",
        is_origin: false,
        weight: 5,
        key: "ENCOUNTER",
      });
    });

    it("defaults weight to 5 and is_origin to false if omitted", () => {
      const past_text = "[NOTE: simple memo]";
      const candidates = extract_memory_candidates(past_text);

      expect(candidates).toHaveLength(1);
      expect(candidates[0].weight).toBe(5);
      expect(candidates[0].is_origin).toBe(false);
      expect(candidates[0].text).toBe("simple memo");
    });

    it("returns empty array for empty input", () => {
      expect(extract_memory_candidates("")).toEqual([]);
      expect(extract_memory_candidates(null)).toEqual([]);
    });
  });

  describe("extract_entity_relationships", () => {
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

    it("resolves canonical single-word slugs and returns 4-quadrant relational record", () => {
      const actor = {
        name: "Glitch",
        eternal: { non_physical: "[@SILVERS: corporate syndicate rival | show | w:9]" },
        present: { non_physical: "[@SILVERS: hacking financial accounts | hide | w:8]" },
        past: "[@SILVERS: stole security keys | show | w:7]",
        future: "[@SILVERS: expose corruption | show | w:10]",
      };
      const known = [{ id: "SILVERS", name: "Lord Benedict Silvers" }];

      // Owner sees all 4 quadrants
      const owner_rels = extract_entity_relationships(actor, known, "owner");
      expect(owner_rels.has("SILVERS")).toBe(true);
      const silvers_link = owner_rels.get("SILVERS");
      expect(silvers_link.target_id).toBe("SILVERS");
      expect(silvers_link.target_name).toBe("Lord Benedict Silvers");
      expect(silvers_link.eternal).toBe("corporate syndicate rival");
      expect(silvers_link.present).toBe("hacking financial accounts");
      expect(silvers_link.past).toEqual(["stole security keys"]);
      expect(silvers_link.future).toBe("expose corruption");

      // Other perspective redacts present (which is hidden)
      const other_rels = extract_entity_relationships(actor, known, "other");
      expect(other_rels.has("SILVERS")).toBe(true);
      expect(other_rels.get("SILVERS").present).toBeUndefined();
      expect(other_rels.get("SILVERS").eternal).toBe("corporate syndicate rival");
    });
  });
});
