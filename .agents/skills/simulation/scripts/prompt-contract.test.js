/**
 * @file prompt-contract.test.js
 * 🛡️ PROMPT CONTRACT & METASYNTACTIC STANDING GATES.
 *
 * Ports the agent-side harness gates (src/tools/harness/entry.js +
 * meta-entry.js) into the repo Vitest suite, so `audit:simulation` covers the
 * full gate set: live turn execution (simulation-audit.test.js) + prompt
 * byte-identity + catalog metasyntax (this file).
 *
 * Run with: npx vitest run .agents/skills/simulation/scripts/prompt-contract.test.js
 *
 * NOTE ON BYTE PINS: pin values were taken from the agent-side CONTRACT
 * baseline (byte-identical through @e1212a75) and confirmed against a local
 * run except `sorting`, which compiles 5 bytes longer locally (4195): the
 * sorting prompt embeds the locally generated src/media/tokens.js
 * (gitignored build artifact), while the agent harness uses a frozen stub
 * snapshot — the local value is environment truth. If DESIGN tokens change,
 * re-run `npm run sync` first, then re-pin here. Any other pin diff means
 * prompt-emitted strings changed: update intentionally and note it below.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { register_state_accessors } from "../../../../src/utils/index.js";
import { compile_prompt } from "../../../../src/intelligence/prompts.js";
import { CONTRACT, MODE_DIRECTIVE_LEADS, make_contract_cases } from "../../../../src/intelligence/prompt-verification.js";
import { TASK_LIBRARY } from "../../../../src/intelligence/modules/task.js";
import { PROTOCOL_LIBRARY } from "../../../../src/intelligence/modules/protocols.js";
import { REFLEX_LIBRARY } from "../../../../src/intelligence/modules/reflex.js";
import { ROLE_LIBRARY } from "../../../../src/intelligence/modules/system.js";

// ---------------------------------------------------------------------------
// Byte pins: update INTENTIONALLY with prompt changes (Prompt Byte Contract
// Gate, ROADMAP release invariants). Any diff here means prompt-emitted
// strings changed and the baseline story shifts with them.
// ---------------------------------------------------------------------------

const BYTE_PINS = {
  director: 6491,
  director_terse: 1459,
  interaction: 8208,
  ghostwrite: 7429,
  npc: 8938,
  narrator: 7822,
  narrator_prologue: 7850,
  narrator_epilogue: 7785,
  continuum: 4746,
  enhancement: 1669,
  sorting: 4193,
  optics: 5394,
};

// ---------------------------------------------------------------------------
// Contract compile (mirrors src/tools/harness/entry.js)
// ---------------------------------------------------------------------------

const TAG_PATTERN = /<([A-Z][A-Z0-9_]{1,})(?=[\s>/])/g;

function extract_tags(text) {
  return [...String(text || "").matchAll(TAG_PATTERN)].map((match) => match[1]);
}

function arrays_equal(left, right) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function compile_contract_modes() {
  const cases = make_contract_cases();
  const modes = {};
  const problems = [];
  for (const [mode_name, [mode_key, context]] of Object.entries(cases)) {
    let prompt_package;
    try {
      prompt_package = compile_prompt(mode_key, context);
    } catch (error) {
      problems.push(mode_name + " THREW: " + (error && error.stack ? error.stack : String(error)));
      continue;
    }
    const system = String(prompt_package.system || "");
    const tags = extract_tags(system);
    const expected = (CONTRACT[mode_name] && CONTRACT[mode_name].system) || null;
    modes[mode_name] = { bytes: system.length, tag_count: tags.length, tags, system };
    if (!system.endsWith("</SYSTEM>")) problems.push(mode_name + ": missing </SYSTEM> close");
    if ((system.match(/<TASK\b/g) || []).length !== 1) problems.push(mode_name + ": TASK count != 1");
    if (expected && !arrays_equal(tags, expected)) {
      const min = Math.min(tags.length, expected.length);
      let first = -1;
      for (let i = 0; i < min; i += 1) {
        if (tags[i] !== expected[i]) {
          first = i;
          break;
        }
      }
      if (first === -1 && tags.length !== expected.length) first = min;
      problems.push(
        mode_name +
          ": CONTRACT mismatch at index " +
          first +
          " got=" +
          tags.slice(Math.max(0, first - 2), first + 3).join(",") +
          " want=" +
          expected.slice(Math.max(0, first - 2), first + 3).join(",") +
          " (got_len=" +
          tags.length +
          " want_len=" +
          expected.length +
          ")",
      );
    }
  }
  for (const [mode_name, leads] of Object.entries(MODE_DIRECTIVE_LEADS)) {
    const entry = modes[mode_name];
    if (!entry || !entry.system) continue;
    const positions = leads.map((lead) => entry.system.indexOf(lead));
    if (positions.some((position) => position === -1)) {
      problems.push(mode_name + ": missing directive lead: " + leads[positions.indexOf(-1)]);
    } else {
      const sorted = [...positions].sort((a, b) => a - b);
      if (!arrays_equal(positions, sorted)) problems.push(mode_name + ": directive leads out of order");
    }
  }
  return { modes, problems };
}

// ---------------------------------------------------------------------------
// Metasyntax gate (mirrors src/tools/harness/meta-entry.js)
// ---------------------------------------------------------------------------

const TAG_BODY_ALLOWLIST = ["THINK"];
const RUNTIME_REFERENT_ALLOWLIST = ["ACTION", "ENTRY", "USER_PERSONA", "AI_CHARACTER", "HISTORY", "RECENT_ROUNDS", "SHIRT", "JACKET"];

const KNOWN_AT_TOKENS = [
  "enhancement: @ENTITY_NAME",
  "enhancement: @FRACTAL",
  "enhancement: @LISTENER",
  "enhancement: @ME",
  "enhancement: @SPEAKER",
  "enhancement: @YOU",
  "sorting: @ENTITY_NAME",
  "sorting: @FRACTAL",
  "sorting: @LISTENER",
  "sorting: @ME",
  "sorting: @SPEAKER",
  "sorting: @YOU",
];

function is_upper_letter(ch) {
  return ch >= "A" && ch <= "Z";
}
function is_lower_letter(ch) {
  return ch >= "a" && ch <= "z";
}
function is_digit(ch) {
  return ch >= "0" && ch <= "9";
}
function is_tag_char(ch) {
  return is_upper_letter(ch) || is_digit(ch) || ch === "_";
}
function is_at_char(ch) {
  return is_upper_letter(ch) || is_lower_letter(ch) || is_digit(ch) || ch === "_";
}
function is_brace_char(ch) {
  return is_lower_letter(ch) || is_digit(ch) || ch === "_";
}
function walk_strings(node, out) {
  if (typeof node === "string") {
    out.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) walk_strings(item, out);
    return;
  }
  if (node && typeof node === "object") {
    for (const key of Object.keys(node)) walk_strings(node[key], out);
  }
}
function collect_tag_literals(text) {
  const tags = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("<", i);
    if (open < 0) break;
    let j = open + 1;
    if (text[j] === "/") j += 1;
    const start = j;
    while (j < text.length && is_tag_char(text[j])) j += 1;
    if (j > start + 1 && is_upper_letter(text[start])) {
      const next = text[j] || "";
      if (next === ">" || next === " " || next === "/" || next === "\n") tags.push(text.slice(start, j));
    }
    i = open + 1;
  }
  return tags;
}
function collect_guillemets(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("«", i);
    if (open < 0) break;
    const close = text.indexOf("»", open + 1);
    if (close < 0) break;
    tokens.push(text.slice(open + 1, close));
    i = close + 1;
  }
  return tokens;
}
function collect_at_tokens(text) {
  const hits = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== "@") continue;
    let j = i + 1;
    while (j < text.length && is_at_char(text[j])) j += 1;
    if (j > i + 1) hits.push(text.slice(i, j));
  }
  return hits;
}
function collect_brace_tokens(text) {
  const hits = [];
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf("{", i);
    if (open < 0) break;
    let j = open + 1;
    while (j < text.length && is_brace_char(text[j])) j += 1;
    if (j > open + 1 && text[j] === "}") hits.push(text.slice(open, j + 1));
    i = open + 1;
  }
  return hits;
}
function strip_spans(text, open_mark, close_mark) {
  let out = String(text || "");
  let open = out.indexOf(open_mark);
  while (open >= 0) {
    const close = out.indexOf(close_mark, open + open_mark.length);
    if (close < 0) break;
    out = out.slice(0, open) + out.slice(close + close_mark.length);
    open = out.indexOf(open_mark);
  }
  return out;
}
function strip_bracket_spans(text) {
  let out = "";
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "[") {
      depth += 1;
      continue;
    }
    if (ch === "]") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0) out += ch;
  }
  return out;
}
function decode_entities(text) {
  return String(text || "")
    .split("&#91;")
    .join("[")
    .split("&#93;")
    .join("]")
    .split("&lt;")
    .join("<")
    .split("&gt;")
    .join(">")
    .split("&quot;")
    .join('"')
    .split("&amp;")
    .join("&");
}
function count_char(text, ch) {
  let n = 0;
  for (let i = 0; i < text.length; i += 1) if (text[i] === ch) n += 1;
  return n;
}

function run_metasyntax_gate() {
  const bodies = [];
  walk_strings(TASK_LIBRARY, bodies);
  walk_strings(PROTOCOL_LIBRARY, bodies);
  walk_strings(REFLEX_LIBRARY, bodies);
  walk_strings(ROLE_LIBRARY, bodies);
  const tag_violations = [];
  for (const body of bodies) {
    for (const tag of collect_tag_literals(body)) {
      if (TAG_BODY_ALLOWLIST.indexOf(tag) < 0) tag_violations.push(tag + " :: " + body.slice(0, 90));
    }
  }
  const guillemet_violations = [];
  for (const body of bodies) {
    for (const token of collect_guillemets(body)) {
      if (RUNTIME_REFERENT_ALLOWLIST.indexOf(token) < 0) guillemet_violations.push("catalog: " + token);
    }
  }
  const cases = make_contract_cases();
  const brace_violations = [];
  const at_violations = [];
  const bracket_balance = [];
  const macro_bodies = Object.values(PROTOCOL_LIBRARY.MACROS);
  for (const [mode_name, [mode_key, context]] of Object.entries(cases)) {
    const system = String(compile_prompt(mode_key, context).system || "");
    bodies.push(system);
    for (const token of collect_guillemets(system)) {
      if (RUNTIME_REFERENT_ALLOWLIST.indexOf(token) < 0) guillemet_violations.push(mode_name + ": " + token);
    }
    let trimmed = strip_spans(system, "<OUTPUT_FORMAT", "</OUTPUT_FORMAT>");
    trimmed = strip_spans(trimmed, "<INPUT", "</INPUT>");
    for (const token of collect_brace_tokens(trimmed)) brace_violations.push(mode_name + ": " + token);
    const decoded = decode_entities(system);
    bracket_balance.push({ mode: mode_name, open: count_char(decoded, "["), close: count_char(decoded, "]") });
    let rest = strip_bracket_spans(decoded);
    for (const macro of macro_bodies) rest = rest.split(macro).join("");
    rest = strip_spans(rest, "<OUTPUT_FORMAT", "</OUTPUT_FORMAT>");
    rest = strip_spans(rest, "<INPUT", "</INPUT>");
    for (const token of collect_at_tokens(rest)) at_violations.push(mode_name + ": " + token);
  }
  return { tag_violations, guillemet_violations, brace_violations, at_violations, bracket_balance };
}

// ---------------------------------------------------------------------------
// Gates
// ---------------------------------------------------------------------------

describe("🛡️ PROMPT CONTRACT: byte-identity + tag inventories + directive leads", () => {
  beforeAll(() => {
    register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
  });
  afterAll(() => {
    register_state_accessors({ runtime: null });
  });

  it("compiles all 12 modes with zero contract problems", () => {
    const { modes, problems } = compile_contract_modes();
    expect(Object.keys(modes).sort()).toEqual(Object.keys(BYTE_PINS).sort());
    expect(problems).toEqual([]);
  });

  it("pins prompt bytes per mode (update intentionally with prompt changes)", () => {
    const { modes } = compile_contract_modes();
    const mismatches = [];
    for (const [mode_name, pinned] of Object.entries(BYTE_PINS)) {
      if (modes[mode_name].bytes !== pinned) mismatches.push(mode_name + ": got " + modes[mode_name].bytes + ", want " + pinned);
    }
    expect(mismatches).toEqual([]);
  });
});

describe("📐 METASYNTACTIC STANDING GATE: catalogs + compiled modes", () => {
  beforeAll(() => {
    register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
  });
  afterAll(() => {
    register_state_accessors({ runtime: null });
  });

  it("allows no naked tag literals in catalog bodies outside THINK", () => {
    expect(run_metasyntax_gate().tag_violations).toEqual([]);
  });

  it("allows no unlisted guillemet referents in catalogs or compiled modes", () => {
    expect(run_metasyntax_gate().guillemet_violations).toEqual([]);
  });

  it("allows no Perchance brace tokens in compiled output", () => {
    expect(run_metasyntax_gate().brace_violations).toEqual([]);
  });

  it("pins the known macro-doc @ tokens (new strays fail)", () => {
    const { at_violations } = run_metasyntax_gate();
    expect([...at_violations].sort()).toEqual([...KNOWN_AT_TOKENS].sort());
  });

  it("keeps brackets balanced in every compiled mode", () => {
    const { bracket_balance } = run_metasyntax_gate();
    const imbalanced = bracket_balance.filter(({ open, close }) => open !== close).map(({ mode }) => mode);
    expect(imbalanced).toEqual([]);
  });
});

// =============================================================================
// CHANGELOG
// =============================================================================

/**
 * CHANGELOG:
 * - 2026-10-18: Fixed vitest/valid-expect violations (no second arg to expect; collect-and-assert instead). Re-pinned sorting 4190 -> 4195: local generated tokens.js embeds 5 extra bytes vs the agent-harness stub snapshot (environment truth, not a prompt change).
 * - 2026-10-18: Ported agent-side harness gates (entry.js CONTRACT byte-identity + meta-entry.js metasyntax) into the repo suite. Fixed stale «INPUT» referent in the shared allowlist (harmonized to «ACTION»).
 */
