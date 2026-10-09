/**
 * src/intelligence/modules/lorebook.test.js
 * ============================================================================
 * 📚 LOREBOOK TESTS — Matching Passes, Filters, Scan Plans & Budget Rendering
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import {
  LOREBOOK_DEFAULTS,
  normalize_lorebook,
  normalize_lorebook_entry,
  match_lorebook_key,
  match_lorebook_entry,
  resolve_lorebook_plan,
  render_lorebook_xml,
  resolve_lorebook_slot,
} from "./lorebook.js";

const book = (overrides = {}) =>
  normalize_lorebook({
    id: "docks",
    story_id: "story-1",
    name: "Docks",
    description: "Harbor district.",
    scan_depth: 5,
    token_budget: 800,
    recursive: false,
    entries: [{ id: "cipher", keys: ["cipher"], content: "The cipher opens the tide gate." }],
    ...overrides,
  });

describe("lorebook.js - key matching passes", () => {
  it("matches whole words case-insensitively, not substrings", () => {
    expect(match_lorebook_key("cipher", "The cipher opens the gate.")).toEqual({ hit: true, pass: "word" });
    expect(match_lorebook_key("cipher", "The ciphers open.").hit).toBe(false);
    expect(match_lorebook_key("ciph", "The cipher opens.").hit).toBe(false);
  });

  it("matches /regex/ literals before literal fallthrough", () => {
    expect(match_lorebook_key("/ciph\\w+/", "The cipher opens.")).toEqual({ hit: true, pass: "regex" });
    expect(match_lorebook_key("/(unclosed/", "The (unclosed/ stands.").hit).toBe(false);
  });

  it("matches * and ? glob wildcards", () => {
    expect(match_lorebook_key("tide*", "The tidewater gate.")).toEqual({ hit: true, pass: "glob" });
    expect(match_lorebook_key("gat?", "The gate stands.")).toEqual({ hit: true, pass: "glob" });
    expect(match_lorebook_key("moon*", "The cipher opens.").hit).toBe(false);
  });
});

describe("lorebook.js - entry secondary filters", () => {
  const entry = (filter) => normalize_lorebook_entry({ id: "e1", keys: ["cipher"], content: "C.", filter });

  it("passes any/all/not_any secondary logic", () => {
    expect(match_lorebook_entry(entry({ mode: "any", keys: ["gate", "moon"] }), "The cipher opens the gate.").hit).toBe(true);
    expect(match_lorebook_entry(entry({ mode: "any", keys: ["moon"] }), "The cipher opens the gate.").hit).toBe(false);
    expect(match_lorebook_entry(entry({ mode: "all", keys: ["cipher", "gate"] }), "The cipher opens the gate.").hit).toBe(true);
    expect(match_lorebook_entry(entry({ mode: "all", keys: ["cipher", "moon"] }), "The cipher opens the gate.").hit).toBe(false);
    expect(match_lorebook_entry(entry({ mode: "not_any", keys: ["moon"] }), "The cipher opens the gate.").hit).toBe(true);
    expect(match_lorebook_entry(entry({ mode: "not_any", keys: ["gate"] }), "The cipher opens the gate.").hit).toBe(false);
  });

  it("ignores disabled entries and blank text", () => {
    expect(match_lorebook_entry(normalize_lorebook_entry({ id: "e1", keys: ["cipher"], content: "C.", enabled: false }), "cipher").hit).toBe(false);
    expect(match_lorebook_entry(entry(null), "").hit).toBe(false);
  });
});

describe("lorebook.js - scan plans", () => {
  const turns = [{ text: "We land at dawn." }, { text: "The cipher opens the gate." }, { text: "Rain keeps falling." }];

  it("scans the trailing scan_depth window, most-recent-first wins", () => {
    const plan = resolve_lorebook_plan([book()], turns);
    expect(plan.scanned_turns).toBe(3);
    expect(plan.matches).toHaveLength(1);
    expect(plan.matches[0]).toMatchObject({ lorebook_id: "docks", entry_id: "cipher", turn_index: 1, matched_key: "cipher" });
  });

  it("respects narrow scan windows", () => {
    const plan = resolve_lorebook_plan([book({ scan_depth: 1 })], turns);
    expect(plan.matches).toHaveLength(0);
  });

  it("chains recursive lorebooks one extra pass", () => {
    const recursive = book({
      recursive: true,
      entries: [
        { id: "cipher", keys: ["cipher"], content: "The moonlit tide gate." },
        { id: "tide", keys: ["moonlit"], content: "Tide lore." },
      ],
    });
    const plan = resolve_lorebook_plan([recursive], [{ text: "The cipher opens." }]);
    expect(plan.matches.map((match) => match.entry_id).sort()).toEqual(["cipher", "tide"]);
  });

  it("never chains non-recursive lorebooks", () => {
    const flat = book({
      entries: [
        { id: "cipher", keys: ["cipher"], content: "The moonlit tide gate." },
        { id: "tide", keys: ["moonlit"], content: "Tide lore." },
      ],
    });
    const plan = resolve_lorebook_plan([flat], [{ text: "The cipher opens." }]);
    expect(plan.matches.map((match) => match.entry_id)).toEqual(["cipher"]);
  });
});

describe("lorebook.js - budget rendering and slot", () => {
  it("renders triggered entries and seals empty on no matches", () => {
    const xml = render_lorebook_xml([
      {
        lorebook_id: "docks",
        lorebook_name: "Docks",
        entry_id: "cipher",
        content: "The cipher opens the tide gate.",
        turn_index: 1,
        matched_key: "cipher",
      },
    ]);
    expect(xml).toContain("<LOREBOOK>");
    expect(xml).toContain("The cipher opens the tide gate.");
    expect(render_lorebook_xml([])).toBe("");
  });

  it("enforces the token ceiling by dropping oldest matches first", () => {
    const matches = Array.from({ length: 6 }, (_, index) => ({
      lorebook_id: "docks",
      lorebook_name: "Docks",
      entry_id: `e${index}`,
      content: `Entry number ${index} with harbor lore about the tide gate and neon rain.`,
      turn_index: index,
      matched_key: "harbor",
    }));
    const tiny = render_lorebook_xml(matches, 20);
    expect(tiny).toContain("<LOREBOOK>");
    expect(tiny).not.toContain("Entry number 0");
    expect(tiny).toContain("Entry number 5");
  });

  it("seals empty unless enabled lorebooks with turns match", () => {
    const turns = [{ text: "The cipher opens the gate." }];
    expect(resolve_lorebook_slot(null, {})).toBe("");
    expect(resolve_lorebook_slot(null, { lorebook_args: { enabled: false, lorebooks: [book()], turns } })).toBe("");
    expect(resolve_lorebook_slot(null, { lorebook_args: { enabled: true, lorebooks: [], turns } })).toBe("");
    expect(resolve_lorebook_slot(null, { lorebook_args: { enabled: true, lorebooks: [book()], turns: [{ text: "Rain." }] } })).toBe("");
    expect(resolve_lorebook_slot(null, { lorebook_args: { enabled: true, lorebooks: [book()], turns } })).toContain("<LOREBOOK>");
  });

  it("exposes calibration defaults", () => {
    expect(LOREBOOK_DEFAULTS.SCAN_DEPTH).toBe(5);
    expect(LOREBOOK_DEFAULTS.TOKEN_BUDGET).toBe(800);
  });
});
