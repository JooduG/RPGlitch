/**
 * src/intelligence/metasyntax.test.js
 * ============================================================================
 * METASYNTAX STANDING GATE — Token-Hygiene Enforcement (Track 0.12)
 * ============================================================================
 *
 * Standing automated gate over the three-layer token contract (Track 0.2):
 * `{...}` build-time interpolation, `«ABSOLUTE»` runtime referents, `@`
 * output vocabulary only.
 *
 * 1. No raw tag literals in directive prose bodies — only the THINK concept
 *    token, which the CONTRACT inventories pin as a sealed envelope.
 * 2. Every «TOKEN» runtime referent matches the frozen allowlist.
 * 3. Zero stray {placeholder} braces survive compilation. OUTPUT_FORMAT
 *    schemas and INPUT user content are machine shape / user voice, not
 *    directive prose, so they are excluded from this scan.
 * 4. @-tokens appear strictly inside bracket directives or macro rules.
 *    XML-escaped bracket predicates in entity sheets are decoded first;
 *    OUTPUT_FORMAT schemas and INPUT blocks are excluded like in (3).
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { register_state_accessors } from "@utils";
import { compile_prompt } from "./prompts.js";
import { make_contract_cases } from "./prompt-verification.js";
import { TASK_LIBRARY } from "./modules/task.js";
import { PROTOCOL_LIBRARY } from "./modules/protocols.js";
import { REFLEX_LIBRARY } from "./modules/reflex.js";
import { ROLE_LIBRARY } from "./modules/system.js";

/** Concept-level tag literals permitted inside directive prose bodies. */
const TAG_BODY_ALLOWLIST = Object.freeze(["THINK"]);

/** Frozen runtime-referent vocabulary (Track 0.2 «ABSOLUTE» layer). */
const RUNTIME_REFERENT_ALLOWLIST = Object.freeze(["INPUT", "USER_PERSONA", "AI_CHARACTER", "HISTORY", "SHIRT", "JACKET"]);

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

function collect_catalog_bodies() {
  const bodies = [];
  walk_strings(TASK_LIBRARY, bodies);
  walk_strings(PROTOCOL_LIBRARY, bodies);
  walk_strings(REFLEX_LIBRARY, bodies);
  walk_strings(ROLE_LIBRARY, bodies);
  return bodies;
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

function with_accessors() {
  register_state_accessors({ runtime: { active_fractal: { narrative_style: "cormac_mccarthy" } } });
}

function compile_all() {
  const cases = make_contract_cases();
  const compiled = {};
  for (const [mode_name, [mode_key, context]] of Object.entries(cases)) {
    compiled[mode_name] = String(compile_prompt(mode_key, context).system || "");
  }
  return compiled;
}

describe("metasyntax gate — catalog prose hygiene", () => {
  it("allows no raw tag literals in directive bodies outside THINK", () => {
    const violations = [];
    for (const body of collect_catalog_bodies()) {
      for (const tag of collect_tag_literals(body)) {
        if (!TAG_BODY_ALLOWLIST.includes(tag)) violations.push(tag + " :: " + body.slice(0, 90));
      }
    }
    expect(violations).toEqual([]);
  });

  it("restricts every «TOKEN» to the frozen referent allowlist", () => {
    const bodies = collect_catalog_bodies();
    for (const system of Object.values(compile_all())) bodies.push(system);
    const violations = [];
    for (const body of bodies) {
      for (const token of collect_guillemets(body)) {
        if (!RUNTIME_REFERENT_ALLOWLIST.includes(token)) violations.push(token);
      }
    }
    expect(violations).toEqual([]);
  });
});

describe("metasyntax gate — compiled prompt hygiene", () => {
  beforeEach(with_accessors);
  afterEach(() => register_state_accessors({ runtime: null }));

  it("leaves zero stray {placeholder} braces outside machine-shape blocks", () => {
    const compiled = compile_all();
    const violations = [];
    for (const [mode_name, system] of Object.entries(compiled)) {
      let text = strip_spans(system, "<OUTPUT_FORMAT", "</OUTPUT_FORMAT>");
      text = strip_spans(text, "<INPUT", "</INPUT>");
      for (const token of collect_brace_tokens(text)) violations.push(mode_name + ": " + token);
    }
    expect(violations).toEqual([]);
  });

  it("confines @-tokens to bracket directives and macro rules", () => {
    const compiled = compile_all();
    const macro_bodies = Object.values(PROTOCOL_LIBRARY.MACROS);
    const violations = [];
    for (const [mode_name, system] of Object.entries(compiled)) {
      const decoded = decode_entities(system);
      let opens = 0;
      let closes = 0;
      for (let i = 0; i < decoded.length; i += 1) {
        if (decoded[i] === "[") opens += 1;
        if (decoded[i] === "]") closes += 1;
      }
      expect(mode_name + " brackets balanced: " + opens + "/" + closes).toBe(mode_name + " brackets balanced: " + opens + "/" + opens);
      let text = strip_bracket_spans(decoded);
      for (const macro of macro_bodies) text = text.split(macro).join("");
      text = strip_spans(text, "<OUTPUT_FORMAT", "</OUTPUT_FORMAT>");
      text = strip_spans(text, "<INPUT", "</INPUT>");
      for (const token of collect_at_tokens(text)) violations.push(mode_name + ": " + token);
    }
    expect(violations).toEqual([]);
  });
});
