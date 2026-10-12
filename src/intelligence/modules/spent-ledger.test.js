/**
 * src/intelligence/modules/spent-ledger.test.js
 * ============================================================================
 * 🧪 UNIT TESTS: Spent Ledger Engine
 * ============================================================================
 */

import { describe, expect, it } from "vitest";
import { extract_spent_ledger, render_spent_ledger_directive, MANNERISM_PATTERNS } from "./spent-ledger.js";

describe("src/intelligence/modules/spent-ledger.js", () => {
  it("extracts mannerisms and opening clauses from recent messages", () => {
    const messages = [
      { role: "user", text: "What do you see ahead?" },
      { role: "ai", text: "Silvers shifted his weight and gripped the hilt tightly. He looked into the fog." },
      { role: "user", text: "Is anyone there?" },
      { role: "ai", text: "Silvers shifted his weight again. He nodded slowly in silence." },
    ];

    const ledger = extract_spent_ledger(messages, { window_size: 4 });
    expect(ledger.mannerisms.length).toBeGreaterThan(0);
    expect(ledger.mannerisms.some((m) => m.includes("shifted his weight"))).toBe(true);
    expect(ledger.mannerisms.some((m) => m.includes("gripped the hilt"))).toBe(true);
    expect(ledger.mannerisms.some((m) => m.includes("nodded slowly"))).toBe(true);
    expect(ledger.spent_items.length).toBeGreaterThan(0);
  });

  it("safely handles empty or non-array inputs", () => {
    const empty_ledger = extract_spent_ledger([]);
    expect(empty_ledger.spent_items).toEqual([]);
    expect(render_spent_ledger_directive(empty_ledger)).toBe("");

    const null_ledger = extract_spent_ledger(null);
    expect(null_ledger.spent_items).toEqual([]);
    expect(render_spent_ledger_directive(null)).toBe("");
  });

  it("renders a clean prompt directive with exhausted items", () => {
    const mock_ledger = {
      opening_clauses: ["silvers looked toward the gate"],
      mannerisms: ["gripped the hilt", "shifted his weight"],
      spent_items: ["gripped the hilt", "shifted his weight"],
    };

    const directive = render_spent_ledger_directive(mock_ledger);
    expect(directive).toContain("# SPENT LEDGER (PROHIBITED REPETITIONS)");
    expect(directive).toContain('"gripped the hilt"');
    expect(directive).toContain('"shifted his weight"');
  });

  it("exports frozen pattern array", () => {
    expect(Object.isFrozen(MANNERISM_PATTERNS)).toBe(true);
    expect(MANNERISM_PATTERNS.length).toBeGreaterThan(0);
  });
});

/**
 * CHANGELOG
 * - Track 3.1: Unit test suite for spent-ledger.js verifying extraction and prompt directive compilation.
 */
