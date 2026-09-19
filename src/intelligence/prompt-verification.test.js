/**
 * src/intelligence/prompt-verification.test.js
 * ============================================================================
 * 📜 PROMPT PIPELINE CONTRACT TESTS — Envelope invariants + per-mode gate
 * ============================================================================
 *
 * Compiles every registered PROMPTS mode against the frozen fixtures in
 * prompt-verification.js and asserts the universal envelope invariants plus the
 * frozen per-mode ordered tag inventory and a coarse size tripwire. Any later
 * change that alters emitted text surfaces as a reviewable contract diff.
 * ============================================================================
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { register_state_accessors } from "@utils";
import { compile_prompt } from "./prompts.js";
import { CONTRACT, CONTRACT_SIZES, make_contract_cases } from "./prompt-verification.js";

const TAG_PATTERN = /<([A-Z][A-Z0-9_]{1,})(?=[\s>/])/g;
const RESERVED_REFERENCE_PATTERN = /<(INPUT|AGENDA|TRAJECTORY|SHIRT|JACKET)\s*\/>/;

/**
 * Extracts the ordered opening-tag inventory from a rendered prompt.
 * @param {string} [text]
 * @returns {string[]}
 */
function extract_tags(text) {
  return [...String(text || "").matchAll(TAG_PATTERN)].map((match) => match[1]);
}

/**
 * Coarse baseline guard (25% or 80 chars, whichever is larger).
 * @param {number} actual
 * @param {number} baseline
 * @returns {boolean}
 */
function within_tolerance(actual, baseline) {
  return Math.abs(actual - baseline) <= Math.max(baseline * 0.25, 80);
}

function with_accessors() {
  register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
}

describe("Prompt pipeline — universal envelope invariants", () => {
  beforeEach(with_accessors);
  afterEach(() => register_state_accessors({ runtime: null }));

  const cases = make_contract_cases();

  for (const [mode_name, [mode_key, context]] of Object.entries(cases)) {
    it(mode_name + " satisfies the universal envelope contract", () => {
      const prompt_package = compile_prompt(mode_key, context);
      const task = String(prompt_package.task || "");

      // 1. Open <SYSTEM> fragment carrying a machine-readable role and a human role line.
      expect(prompt_package.system).toContain("<SYSTEM");
      expect(prompt_package.system).not.toContain("</SYSTEM>");
      expect(prompt_package.system).toMatch(/<SYSTEM[^>]*role="[A-Z_]+"/);
      expect(prompt_package.system).toContain("You are ");

      // 2. The Task is the package's own field — never nested in <SYSTEM>.
      expect(prompt_package.system).not.toContain("<TASK");
      expect((task.match(/<TASK\b/g) || []).length).toBe(1);
      expect(task.endsWith("</TASK>")).toBe(true);

      // 3. No reserved tag reused as inline prose metasyntax.
      expect(RESERVED_REFERENCE_PATTERN.test(prompt_package.system + task)).toBe(false);
    });
  }
});

describe("Prompt pipeline — per-mode contract envelopes", () => {
  beforeEach(with_accessors);
  afterEach(() => register_state_accessors({ runtime: null }));

  const cases = make_contract_cases();

  for (const mode_name of Object.keys(CONTRACT)) {
    it(mode_name + " emits its frozen layer envelope", () => {
      const [mode_key, context] = cases[mode_name];
      const prompt_package = compile_prompt(mode_key, context);

      expect(extract_tags(prompt_package.system)).toEqual(CONTRACT[mode_name].system);
      expect(extract_tags(prompt_package.task)).toEqual(CONTRACT[mode_name].task);
      expect((prompt_package.messages || []).length).toBe(CONTRACT[mode_name].messages);

      const size = CONTRACT_SIZES[mode_name];
      expect(within_tolerance(String(prompt_package.system || "").length, size.system)).toBe(true);
      expect(within_tolerance(String(prompt_package.task || "").length, size.task)).toBe(true);
    });
  }

  it("declares a contract case and envelope for every compiled mode", () => {
    expect(Object.keys(CONTRACT).sort()).toEqual(Object.keys(cases).sort());
  });
});

/**
 * CHANGELOG
 * - 2026-09-20: Extended the gate with universal envelope invariants (open <SYSTEM> + role line, single top-level <TASK>, no reserved-tag metasyntax) alongside the regenerated per-mode tag inventory.
 * - 2026-09-19: Added Phase-0 per-mode contract tests (tag inventory + package shape + size tripwire) for every registered prompt mode.
 * - 2026-09-19: Renamed from prompt-goldens.test.js (golden fixtures -> prompt contract).
 */
