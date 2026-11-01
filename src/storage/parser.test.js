import { describe, it, expect } from "vitest";
import { parse_bracket_token, parse_brackets, format_clean_brackets, apply_bracket_deltas, extract_memory_candidates } from "./parser.js";

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

    it("deletes keys when incoming delta value is 'none' or 'cleared'", () => {
      const current = "[ARMOR: steel plate]\n[HELMET: iron visored]\n[BOOTS: leather]";
      const delta = "[ARMOR: none]\n[HELMET: cleared]";

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
});
