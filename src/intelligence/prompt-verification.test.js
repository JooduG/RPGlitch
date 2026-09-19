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
import { compile_prompt, ENVELOPE_LAYER_TAGS, PROMPTS } from "./prompts.js";
import { CONTRACT, CONTRACT_SIZES, make_contract_cases } from "./prompt-verification.js";

const TAG_PATTERN = /<([A-Z][A-Z0-9_]{1,})(?=[\s>/])/g;
const RESERVED_REFERENCE_PATTERN = /<(INPUT|AGENDA|TRAJECTORY|SHIRT|JACKET)\s*\/>/;

/** Manifest layer keys that emit plain text rather than a tag (never match a direct-child tag). */
const TEXT_ONLY_LAYERS = new Set(["role", "stability_lock"]);

/**
 * Extracts ONLY the direct (indent-2) child element tags of an envelope string, so nested
 * content (protocol atoms, entity sheets) can never mask a missing or undeclared top-level layer.
 * @param {string} [text]
 * @returns {string[]}
 */
function extract_layer_tags(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.match(/^ {2}<([A-Z][A-Z0-9_]*)\b/))
    .filter(Boolean)
    .map((match) => match[1]);
}

/**
 * True when `sequence` appears within `container` in the same relative order.
 * @param {string[]} sequence
 * @param {string[]} container
 * @returns {boolean}
 */
function is_subsequence(sequence, container) {
  let index = 0;
  for (const item of container) {
    if (item === sequence[index]) index += 1;
  }
  return index === sequence.length;
}

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

describe("Prompt pipeline — declared envelope layers", () => {
  beforeEach(with_accessors);
  afterEach(() => register_state_accessors({ runtime: null }));

  const cases = make_contract_cases();

  for (const mode_key of Object.keys(PROMPTS)) {
    it(mode_key + " emits exactly its declared envelope layers", () => {
      const [case_key, context] = cases[mode_key];
      const prompt_package = compile_prompt(case_key, context);
      const config = PROMPTS[mode_key];

      const declared_system = config.layers.system.map((key) => ENVELOPE_LAYER_TAGS[key]).filter(Boolean);
      const declared_task = config.layers.task.map((key) => ENVELOPE_LAYER_TAGS[key]).filter(Boolean);

      const emitted_system = extract_layer_tags(prompt_package.system);
      const emitted_task = extract_layer_tags(prompt_package.task);

      // No undeclared top-level layer may leak, and declaration order must be respected.
      expect(emitted_system.every((tag) => declared_system.includes(tag))).toBe(true);
      expect(emitted_task.every((tag) => declared_task.includes(tag))).toBe(true);
      expect(is_subsequence(emitted_system, declared_system)).toBe(true);
      expect(is_subsequence(emitted_task, declared_task)).toBe(true);
    });

    it(mode_key + " declares only known layer keys", () => {
      const config = PROMPTS[mode_key];
      for (const key of [...config.layers.system, ...config.layers.task]) {
        expect(TEXT_ONLY_LAYERS.has(key) || key in ENVELOPE_LAYER_TAGS).toBe(true);
      }
    });
  }
});

/**
 * CHANGELOG
 * - 2026-09-22: Added the declared-envelope-layer gate (recommendation #4) — each mode's manifest `layers` must cover every emitted top-level layer tag, in declared order, and may only declare known keys.
 * - 2026-09-20: Extended the gate with universal envelope invariants (open <SYSTEM> + role line, single top-level <TASK>, no reserved-tag metasyntax) alongside the regenerated per-mode tag inventory.
 * - 2026-09-19: Added Phase-0 per-mode contract tests (tag inventory + package shape + size tripwire) for every registered prompt mode.
 * - 2026-09-19: Renamed from prompt-goldens.test.js (golden fixtures -> prompt contract).
 */
