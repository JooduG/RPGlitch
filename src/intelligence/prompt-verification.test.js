/**
 * src/intelligence/prompt-verification.test.js
 * ============================================================================
 * 📜 PROMPT PIPELINE CONTRACT TESTS — Per-mode envelope regression gate
 * ============================================================================
 *
 * Compiles every registered `PROMPTS` mode against the frozen fixtures in
 * `prompt-verification.js` and asserts the emitted `<SYSTEM>` / `<TASK>` tag
 * inventory, package shape, and a coarse size baseline. This is the Phase-0
 * safety net: any later refactor that alters emitted text surfaces as a
 * reviewable contract diff instead of a silent regression.
 * ============================================================================
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { register_state_accessors } from "@utils";
import { CONTRACT, CONTRACT_SIZES, make_contract_cases } from "./prompt-verification.js";
import { compile_prompt } from "./prompts.js";

const TAG_PATTERN = /<([A-Z][A-Z0-9_]{1,})(?=[\s>/])/g;

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

describe("Prompt pipeline — per-mode contract envelopes", () => {
  beforeEach(() => {
    register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
  });

  afterEach(() => {
    register_state_accessors({ runtime: null });
  });

  const cases = make_contract_cases();

  for (const mode_name of Object.keys(CONTRACT)) {
    it(`${mode_name} emits its frozen layer envelope`, () => {
      const [mode_key, context] = cases[mode_name];
      const prompt_package = compile_prompt(mode_key, context);

      expect(extract_tags(prompt_package.system)).toEqual(CONTRACT[mode_name].system);
      expect(extract_tags(prompt_package.task)).toEqual(CONTRACT[mode_name].task);
      expect(Boolean(prompt_package.system_close)).toBe(CONTRACT[mode_name].system_close);
      expect((prompt_package.messages || []).length).toBe(CONTRACT[mode_name].messages);

      const size = CONTRACT_SIZES[mode_name];
      expect(within_tolerance(String(prompt_package.system || "").length, size.system)).toBe(true);
      expect(within_tolerance(String(prompt_package.task || "").length, size.task)).toBe(true);
    });
  }

  it("declares a contract case and envelope for every mode key", () => {
    expect(Object.keys(CONTRACT).sort()).toEqual(Object.keys(cases).sort());
  });
});

/**
 * CHANGELOG
 * - 2026-09-19: Added Phase-0 per-mode contract tests (tag inventory + package shape + size tripwire) for every registered prompt mode.
 * - 2026-09-19: Renamed from prompt-goldens.test.js (golden fixtures -> prompt contract).
 */
