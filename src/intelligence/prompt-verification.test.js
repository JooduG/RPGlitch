/**
 * src/intelligence/prompt-verification.test.js
 * ============================================================================
 * 📜 PROMPT PIPELINE CONTRACT TESTS — Envelope invariants + per-mode gate
 * ============================================================================
 *
 * Compiles every registered PROMPTS mode against the frozen fixtures in
 * prompt-verification.js and asserts the universal envelope invariants plus the
 * frozen per-mode ordered tag inventory. Any later change that alters emitted
 * text surfaces as a reviewable contract diff.
 * ============================================================================
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { register_state_accessors } from "@utils";
import { compile_prompt, PROMPTS } from "./prompts.js";
import { MODE_ADAPTERS, PROMPT_LAYERS } from "./builder.js";
import { SYSTEM_ROLES } from "./modules/system.js";
import { TASK_MODE_PLANS, TASK_LAYERS } from "./modules/task.js";
import { VISIBILITY_POLICIES } from "./modules/entities.js";
import { CONTRACT, MODE_DIRECTIVE_LEADS, make_contract_cases } from "./prompt-verification.js";

const TAG_PATTERN = /<([A-Z][A-Z0-9_]{1,})(?=[\s>/])/g;
const RESERVED_REFERENCE_PATTERN = /<(INPUT|AGENDA|TRAJECTORY|SHIRT|JACKET)\s*\/>/;

/** Manifest layer keys that emit plain text rather than a tag (never match a direct-child tag). */
const TEXT_ONLY_LAYERS = new Set(["role"]);

/**
 * Extracts ONLY the direct (indent-2) child element tags of the <SYSTEM> region,
 * stopping at the sealed <TASK> block — the task's own children share the same
 * indent depth and must never read as system-level layers.
 * @param {string} [text]
 * @returns {string[]}
 */
function extract_layer_tags(text) {
  const system_only = String(text || "").split("<TASK")[0];
  return system_only
    .split("\n")
    .map((line) => line.match(/^ {2}<([A-Z][A-Z0-9_]*)\b/))
    .filter(Boolean)
    .map((match) => match[1]);
}

/**
 * True when `emitted` lists only declared tags, in non-decreasing declaration order. A single
 * declared layer may emit the same tag more than once (e.g. the Director's `inputs` layer emits
 * both the user action and the AI reply as sibling `<INPUT>` blocks), which a plain subsequence
 * check would reject.
 * @param {string[]} emitted
 * @param {string[]} declared
 * @returns {boolean}
 */
function respects_declared_order(emitted, declared) {
  let last_index = -1;
  for (const tag of emitted) {
    const index = declared.indexOf(tag);
    if (index === -1 || index < last_index) return false;
    last_index = index;
  }
  return true;
}

/**
 * Extracts the ordered opening-tag inventory from a rendered prompt.
 * @param {string} [text]
 * @returns {string[]}
 */
function extract_tags(text) {
  return [...String(text || "").matchAll(TAG_PATTERN)].map((match) => match[1]);
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
      const system = String(prompt_package.system || "");

      // 1. Closed <SYSTEM> envelope carrying the single machine-readable `mode` and a human role line.
      expect(system).toContain("<SYSTEM");
      expect(system.endsWith("</SYSTEM>")).toBe(true);
      expect(system).toMatch(/<SYSTEM[^>]*mode="[a-z_]+"/);
      expect(system).toContain("You are ");

      // 2. The <TASK> block is sealed inside the envelope — exactly one, after any <HISTORY>.
      expect(system).toContain("<TASK");
      expect((system.match(/<TASK\b/g) || []).length).toBe(1);
      const history_index = system.indexOf("<HISTORY>");
      const task_index = system.indexOf("<TASK");
      expect(history_index === -1 || history_index < task_index).toBe(true);

      // 3. No reserved tag reused as inline prose metasyntax.
      expect(RESERVED_REFERENCE_PATTERN.test(system)).toBe(false);
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
      expect(prompt_package.system.endsWith("</SYSTEM>")).toBe(true);
      expect(prompt_package.task).toBeUndefined();
    });
  }

  for (const [mode_name, leads] of Object.entries(MODE_DIRECTIVE_LEADS)) {
    it("emits the " + mode_name + " directive paragraphs in the declared sequence", () => {
      const [mode_key, context] = cases[mode_name];
      const system = String(compile_prompt(mode_key, context).system || "");
      const positions = leads.map((lead) => system.indexOf(lead));
      expect(positions.every((position) => position !== -1)).toBe(true);
      expect(positions).toEqual([...positions].sort((left, right) => left - right));
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

      const declared = [...config.layers.system, "task"].filter((key) => !TEXT_ONLY_LAYERS.has(key)).map((key) => key.toUpperCase());

      const emitted = extract_layer_tags(prompt_package.system);

      // No undeclared top-level layer may leak, and declaration order must be respected.
      expect(emitted.every((tag) => declared.includes(tag))).toBe(true);
      expect(respects_declared_order(emitted, declared)).toBe(true);
    });

    it(mode_key + " declares only known layer keys", () => {
      const config = PROMPTS[mode_key];
      const valid_system_keys = new Set(PROMPT_LAYERS.map((layer) => layer.key));
      const valid_task_keys = new Set(TASK_LAYERS.map((layer) => layer.key));

      for (const key of config.layers.system) {
        expect(valid_system_keys.has(key)).toBe(true);
      }
      for (const key of config.layers.task) {
        expect(valid_task_keys.has(key)).toBe(true);
      }
    });
  }
});

describe("Prompt pipeline — mode-record single-source-of-truth invariants", () => {
  it("maps every manifest mode to a registered adapter (and every adapter to a manifest mode)", () => {
    for (const mode_key of Object.keys(PROMPTS)) {
      expect(typeof (MODE_ADAPTERS[mode_key] || MODE_ADAPTERS.prose)).toBe("function");
    }
    for (const adapter_key of Object.keys(MODE_ADAPTERS)) {
      if (adapter_key === "prose") continue;
      expect(PROMPTS).toHaveProperty(adapter_key);
    }
  });

  it("stamps every mode with its own envelope discriminator", () => {
    for (const [mode_key, config] of Object.entries(PROMPTS)) {
      expect(config.key).toBe(mode_key);
      expect(config.system.mode).toBe(mode_key);
    }
  });

  it("gives every mode a speaker and a known visibility policy", () => {
    for (const config of Object.values(PROMPTS)) {
      expect(config.speaker === null || typeof config.speaker === "string").toBe(true);
      expect(config.visibility in VISIBILITY_POLICIES).toBe(true);
    }
  });

  it("resolves every role_line key against SYSTEM_ROLES", () => {
    for (const config of Object.values(PROMPTS)) {
      expect(SYSTEM_ROLES[config.role_line]).toBeDefined();
    }
  });

  it("points every task_state at a registered task plan", () => {
    for (const config of Object.values(PROMPTS)) {
      expect(TASK_MODE_PLANS).toHaveProperty(config.task_state);
    }
  });
});

/**
 * CHANGELOG
 * - 2026-09-25: Layer-6 refactor — the mode-record gate now resolves `TASK_MODE_PLANS` (was `TASK_STATE_BUILDERS`), and the directive-sequence gate generalized from `DIRECTOR_DIRECTIVE_LEADS` to the per-mode `MODE_DIRECTIVE_LEADS` map.
 * - 2026-09-25: Added the Director directive-sequence gate (`DIRECTOR_DIRECTIVE_LEADS`) so the `<DIRECTIVES>` prose order is pinned independently of the tag inventory and size tripwire.
 * - 2026-09-23: Declared-envelope gate now tolerates one declared layer emitting the same tag repeatedly (non-decreasing declaration order) — the Director's single `inputs` layer emits both the user action and the AI reply as sibling `<INPUT>` blocks.
 * - 2026-09-23: Added the mode-record single-source-of-truth gate (R8) — asserts the mode↔adapter mapping, `system.mode === key`, a known `visibility` policy per mode, every `role_line` in `SYSTEM_ROLES`, and every `task_state` in `TASK_STATE_BUILDERS`.
 * - 2026-09-23: Invariant now asserts the single `<SYSTEM mode="…">` discriminator (the redundant `role` attribute was dropped) following the envelope-harmonization pass.
 * - 2026-09-22: Added the declared-envelope-layer gate (recommendation #4) — each mode's manifest `layers` must cover every emitted top-level layer tag, in declared order, and may only declare known keys.
 * - 2026-09-20: Extended the gate with universal envelope invariants (open <SYSTEM> + role line, single top-level <TASK>, no reserved-tag metasyntax) alongside the regenerated per-mode tag inventory.
 * - 2026-09-19: Added Phase-0 per-mode contract tests (tag inventory + package shape + size tripwire) for every registered prompt mode.
 * - 2026-09-19: Renamed from prompt-goldens.test.js (golden fixtures -> prompt contract).
 */
