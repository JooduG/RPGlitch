/**
 * src/utils/xml.js
 * 📋 XML & PROMPT TEMPLATE PROCESSING ENGINE
 *
 * Core Responsibilities:
 * - Pure, stateless XML escaping (`escape_xml`) and LLM prompt escaping (`prompt_escape`).
 *   - `escape_xml`: Full entity escaping (`&`, `<`, `>`, `"`, `'`, `[`, `]`) for XML attribute safety.
 *   - `prompt_escape`: Node text escaping that escapes only XML-significant `<`/`>` so field
 *     values cannot inject fake tags, while brackets, ampersands, and quotes pass through
 *     verbatim (pseudo-JSON `[KEY: value]` state tags reach the model unpolluted).
 * - Physical State XML Serialization (`physical_to_xml`): Compiles entity physical/non-physical state
 *   (either bracket pseudo-JSON or plain prose) into structured, indented XML prompt nodes.
 * - Canonical Clothing Taxonomy (`CLOTHING_KEYS`): Shared taxonomy for clothing overrides, visual strip maps,
 *   and undress/redress state mechanics.
 * - Template Hygiene (`clean_xml`): Trims trailing line whitespace and trims blank boundary lines.
 *
 * Consumed by:
 * - `src/intelligence/prompts.js` (Prompt compilation pipelines).
 * - `src/intelligence/builder.js` (Visual and narrative prompt synthesis).
 * - `src/utils/text.js` (Clothing key resolution).
 */

import { resolve_catalog_atom, interpolate_tokens } from "./catalog.js";

// ============================================================================
// [SECTION 1: CONSTANTS & CLOTHING KEYS]
// ============================================================================

/**
 * Canonical clothing tag keys — shared across the engine for clothing overrides,
 * visual strip filters, and state mutations.
 * @type {ReadonlyArray<string>}
 */
export const CLOTHING_KEYS = Object.freeze([
  "SHIRT",
  "PANTS",
  "SUIT",
  "JACKET",
  "DRESS",
  "SKIRT",
  "COAT",
  "SHOES",
  "BOOTS",
  "GLOVES",
  "HAT",
  "ARMOR",
  "ROBE",
  "ROBES",
  "APPAREL",
  "UNDERWEAR",
  "OUTFIT",
  "CLOTHING",
  "CLOAK",
  "BOTTOMS",
  "TOPS",
  "ACCESSORIES",
  "HARNESS",
  "SCRUBS",
  "HARDWARE",
  "EQUIPMENT",
  "GEAR",
]);

// ============================================================================
// [SECTION 2: XML ESCAPING PIPELINE]
// ============================================================================

/**
 * Escapes characters for safe use in XML attributes and strict XML nodes.
 * @param {string | null | undefined} str - Raw input string.
 * @returns {string} Fully escaped XML string.
 */
export const escape_xml = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[/g, "&#91;")
    .replace(/\]/g, "&#93;");
};

/**
 * Escapes content destined for LLM prompt text nodes:
 * Only XML-significant `<` and `>` are escaped, keeping field values from injecting
 * fake tags into the prompt's XML structure. Brackets, ampersands, and quotes pass
 * through verbatim so pseudo-JSON state tags (`[KEY: value]`) and dialogue stay
 * natural — the transport layer passes instructions as a function, so perchance
 * does not pjs-evaluate `[...]`/`{...}` (see `transport.js`).
 *
 * NOTE: Do NOT use inside XML attribute values (e.g. `name="..."`) — use `escape_xml` instead.
 *
 * @param {string | null | undefined} str - Raw prompt text.
 * @returns {string} Prompt-safe escaped string.
 */
export const prompt_escape = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// ============================================================================
// [SECTION 3: PHYSICAL STATE XML BUILDER]
// ============================================================================

/**
 * Canonical remaps for physical-state keys the Director may write as variants of
 * the shared vocabulary. Canonically-named keys always win over these aliases.
 * @type {Readonly<Record<string, string>>}
 */
export const PHYSICAL_KEY_ALIASES = Object.freeze({
  SHORTS: "APPAREL",
  SOMA: "SOMATIC",
  POSE: "POSTURE",
});

/**
 * Strips a duplicated "KEY:" prefix echoed inside its own value (e.g. the value
 * "STATE: protective" for key "STATE"). Matches whole underscore-or-space keys.
 * @param {string | null | undefined} value
 * @param {string | string[]} keys
 * @returns {string}
 */
export function strip_leading_key_echo(value, keys = []) {
  const text = String(value ?? "");
  const patterns = (Array.isArray(keys) ? keys : [keys]).filter(Boolean).map((k) =>
    String(k)
      .replace(/[^A-Za-z0-9_]/g, "")
      .replace(/_/g, "[_ ]"),
  );
  if (!patterns.length) return text.trim();
  return text.replace(new RegExp("^\\s*(?:" + patterns.join("|") + ")\\s*:\\s*", "i"), "").trim();
}

/**
 * Canonicalizes parsed physical/non-physical keys: known aliases remap to their
 * canonical SCREAMING_SNAKE name, other keys keep their original casing, echoed
 * "KEY:" value prefixes are stripped, and duplicate keys collapse (the
 * canonically-named entry wins over an alias).
 * @param {Record<string, any>} parsed
 * @returns {Record<string, string>}
 */
export function normalize_physical_entries(parsed) {
  const out = {};
  for (const [k, v] of Object.entries(parsed || {})) {
    if (k === "__raw_prose__") continue;
    const raw_key = String(k).replace(/\s+/g, "_").trim();
    if (!raw_key) continue;
    const upper_key = raw_key.toUpperCase();
    const canonical = PHYSICAL_KEY_ALIASES[upper_key] || raw_key;
    const value = Array.isArray(v) ? v.join(", ") : String(v);
    const cleaned = strip_leading_key_echo(value, [raw_key, upper_key, canonical]);
    if (!cleaned) continue;
    if (out[canonical] === undefined || raw_key === canonical) {
      out[canonical] = cleaned;
    }
  }
  return out;
}

/**
 * Renders a profile field block (<APPEARANCE>, <CURRENT_LOOK>, <PERSONALITY>, <STATE>, etc.)
 * separating compacted attributes from complex child rows. Emits a self-closing tag when
 * child rows are empty.
 *
 * @param {string} tag - XML tag name
 * @param {string[]} [rows=[]] - Pre-parsed row strings (either `attr="val"` or `<TAG>val</TAG>`)
 * @returns {string|null} Structured XML block, or null if rows is empty
 */
export function render_profile_field_block(tag, rows = []) {
  if (!rows || !rows.length) return null;
  const attrs = {};
  const children = [];
  for (const row of rows) {
    const attr_match = String(row).match(/^([a-z0-9_]+)="([\s\S]*)"$/);
    if (attr_match) {
      attrs[attr_match[1]] = attr_match[2];
    } else {
      children.push(row);
    }
  }
  const attr_keys = Object.keys(attrs);
  const attr_str = attr_keys.map((k) => `${k}="${attrs[k]}"`).join(" ");
  if (!children.length) {
    return attr_str ? `<${tag} ${attr_str} />` : `<${tag} />`;
  }
  const open = attr_str ? `<${tag} ${attr_str}>` : `<${tag}>`;
  return `${open}\n${children.map((c) => `  ${c}`).join("\n")}\n</${tag}>`;
}

// ============================================================================
// [SECTION 4: XML FORMATTING & CLEANUP]
// ============================================================================

/**
 * Strips trailing line whitespace and eliminates leading/trailing empty boundary lines
 * from XML-like template strings.
 * @param {string | null | undefined} xml - Raw XML template string.
 * @returns {string} Cleaned XML string.
 */
export function clean_xml(xml) {
  if (!xml || typeof xml !== "string") return "";
  return xml
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, i, arr) => {
      if ((i === 0 || i === arr.length - 1) && !line.trim()) return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

// ============================================================================
// [SECTION 5: INDENTATION & TAG WRAPPING HELPERS]
// ============================================================================

/**
 * Normalizes a block's own leading indentation to column zero: drops boundary blank
 * lines, then removes the common leading whitespace shared by every non-blank line.
 * Relative indentation inside the block is preserved, so a pre-indented fragment can be
 * re-embedded at any depth without its first line losing (or its later lines keeping) an
 * accidental offset — the bug that left open tags at column 0 and their closing tags at
 * column 2.
 *
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function dedent_all(text) {
  if (text == null) return "";
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  if (!lines.length) return "";
  const indents = lines.filter((line) => line.trim()).map((line) => (line.match(/^[ \t]*/) || [""])[0].length);
  const common_indent = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => (line.trim() ? line.slice(common_indent).trimEnd() : "")).join("\n");
}

/**
 * Indents every line of a multi-line string.
 * @param {string | null | undefined} text
 * @param {number} spaces
 * @returns {string}
 */
export function indent_all(text, spaces) {
  if (!text) return "";
  const prefix = " ".repeat(spaces);
  return String(text)
    .trim()
    .split("\n")
    .map((line) => `${prefix}${line}`)
    .join("\n");
}

/**
 * Inlines single-line content inside a tag, or renders multi-line content as an
 * indented block with the closing tag at `indent - 2`.
 * @param {string | null | undefined} content
 * @param {number} indent
 * @returns {string}
 */
export function inline_or_block(content, indent) {
  const text = String(content || "").trim();
  if (!text) return "";
  if (text.includes("\n")) {
    return `\n${indent_all(text, indent)}\n${" ".repeat(indent - 2)}`;
  }
  return text;
}

/**
 * Wraps already-rendered inner content in a tag, indented to `indent`.
 * @param {string} tag
 * @param {string | null | undefined} inner
 * @param {number} indent
 * @returns {string}
 */
export function wrap_tag(tag, inner, indent) {
  const body = String(inner || "").trim();
  if (!body) return "";
  const pad = " ".repeat(indent);
  return `${pad}<${tag}>\n${indent_all(body, indent + 2)}\n${pad}</${tag}>`;
}

/**
 * Universal XML block composer — the single primitive every module builds tags from.
 * Escapes attribute values with `escape_xml`, drops null/blank children, and joins
 * them with `separator`. With no children and `closed: false` it emits only the open
 * tag (used for streaming envelopes the transport closes later).
 *
 * @param {Object} [params]
 * @param {string} params.tag - Tag name.
 * @param {Record<string, string|number|null|undefined>} [params.attrs={}] - Attribute map (blank/null dropped).
 * @param {Array<string|null|undefined>|string} [params.children=[]] - Ordered content blocks.
 * @param {number} [params.indent=0] - Left-shift applied to the whole block (open, body, close).
 * @param {number|null} [params.child_indent=null] - If set, indents the joined body by this many spaces (relative to the open tag).
 * @param {boolean} [params.closed=true] - Whether to emit the closing tag.
 * @param {string} [params.separator="\n\n"] - Joiner between child blocks.
 * @param {boolean} [params.inline=false] - Emit `<tag>body</tag>` on one line when the body has no newline.
 * @returns {string}
 */
export function render_xml_tag({
  tag,
  attrs = {},
  children = [],
  indent = 0,
  child_indent = null,
  closed = true,
  separator = "\n\n",
  inline = false,
}) {
  const attr_str = Object.entries(attrs)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `${key}="${escape_xml(String(value))}"`)
    .join(" ");
  const open = attr_str ? `<${tag} ${attr_str}>` : `<${tag}>`;
  let body = (Array.isArray(children) ? children : [children])
    .filter((item) => item != null && String(item).trim().length > 0)
    .map((item) => dedent_all(item))
    .join(separator);
  if (child_indent != null && body && !(inline && !body.includes("\n"))) body = indent_all(body, child_indent);
  let block;
  if (!body) block = closed ? `${open}\n</${tag}>` : open;
  else if (inline && !body.includes("\n")) block = closed ? `${open}${body}</${tag}>` : `${open}${body}`;
  else block = closed ? `${open}\n${body}\n</${tag}>` : `${open}\n${body}`;
  return indent > 0 ? indent_all(block, indent) : block;
}

/**
 * Universal Atom Compiler — resolves and compiles any prompt library atom into XML.
 * Supports dual-mode invocation:
 * 1. Direct Atom: `render_atom_xml(atom, options)`
 * 2. Catalog Lookup: `render_atom_xml(catalog, key, values, options)`
 *
 * @param {Record<string, any>|string} atom_or_catalog - Atom record { tag, body, attrs?, inline? } OR catalog record
 * @param {string|Object} [key_or_options={}] - Dotted key path if catalog lookup, else compiler options
 * @param {Record<string, any>} [values_or_options={}] - Token interpolation bag if catalog lookup, else compiler options
 * @param {Object} [options_param={}] - Compiler options when using 4-argument catalog lookup
 * @returns {string} Clean, escaped XML string (or bare prompt prose if body_only: true)
 */
export function render_atom_xml(atom_or_catalog, key_or_options = {}, values_or_options = {}, options_param = {}) {
  if (!atom_or_catalog) return "";

  let atom = null;
  let options = {};
  let values = {};

  const is_direct_atom =
    typeof atom_or_catalog === "object" &&
    atom_or_catalog !== null &&
    (typeof atom_or_catalog.tag === "string" || typeof atom_or_catalog.body === "string");

  if (is_direct_atom) {
    atom = atom_or_catalog;
    options = key_or_options && typeof key_or_options === "object" ? key_or_options : {};
    values = options.values || {};
  } else if (typeof atom_or_catalog === "object" && typeof key_or_options === "string") {
    const catalog = atom_or_catalog;
    const key = key_or_options;
    const is_values_bag =
      typeof values_or_options === "object" &&
      values_or_options !== null &&
      values_or_options.indent === undefined &&
      values_or_options.body_only === undefined &&
      values_or_options.inline === undefined &&
      values_or_options.tag === undefined;

    if (is_values_bag) {
      values = values_or_options;
      options = options_param || {};
    } else {
      options = values_or_options || {};
      values = options.values || {};
    }
    atom = resolve_catalog_atom(catalog, key, values, options);
  } else if (typeof atom_or_catalog === "string") {
    atom = { tag: "DIRECTIVE", body: atom_or_catalog };
    options = key_or_options && typeof key_or_options === "object" ? key_or_options : {};
    values = options.values || {};
  }

  if (!atom) return "";

  let raw_body = "";
  let base_tag = "DIRECTIVE";
  let base_attrs = {};
  let base_inline = false;

  if (typeof atom === "object" && atom !== null) {
    raw_body = typeof atom.body === "string" ? atom.body : "";
    base_tag = atom.tag || "DIRECTIVE";
    base_attrs = atom.attrs || atom.attributes || {};
    base_inline = Boolean(atom.inline);
  } else if (typeof atom === "string") {
    raw_body = atom;
  }

  // If atom came from direct object/string and not through resolve_catalog_atom, interpolate tokens
  if (is_direct_atom && values && Object.keys(values).length > 0 && raw_body.includes("{")) {
    raw_body = interpolate_tokens(raw_body, values);
  }

  if (options.body_only) {
    return options.escape ? prompt_escape(raw_body) : raw_body;
  }

  const final_tag = options.tag || base_tag;
  const final_attrs = { ...base_attrs, ...(options.attrs || {}) };
  const final_inline = options.inline ?? base_inline;
  const final_indent = options.indent ?? 0;

  return render_xml_tag({
    tag: final_tag,
    attrs: final_attrs,
    children: [prompt_escape(raw_body)],
    indent: final_indent,
    inline: final_inline,
  });
}

/**
 * CHANGELOG
 * - 2026-10-15: Added `render_atom_xml` (dual-mode universal atom compiler) and migrated `render_profile_field_block` from sheets.js; retired dead `physical_to_xml` under P4 Zero Backwards Compatibility.
 * - 2026-09-22: One indentation primitive (recommendation #1) — added `dedent_all` and routed `render_xml_tag`'s child normalization through it, so a pre-indented child block is re-embedded at a uniform depth instead of having only its first line trimmed (the cause of open tags at column 0 paired with closing tags at column 2).
 * - 2026-09-21: `render_xml_tag` no longer applies `child_indent` to a single-line `inline` body — inline emission now leaves `<tag>body</tag>` on one line, fixing the accidental double-space prefix on inline children.
 * - 2026-09-18: Pruned stale reference to deleted src/intelligence/optics.js from module header.
 * - 2026-09-12: `render_xml_tag` promoted to a true universal composer — `indent` now shifts the WHOLE block (open + body + close) so nested blocks can be emitted at any depth, and `inline: true` emits `<tag>body</tag>` for single-line bodies. This is the one primitive every `modules/*` compiler builds from.
 * - 2026-09-12: Added `render_xml_tag` — the universal XML block composer (attribute escaping, blank-child filtering, optional body indentation, optional open-only envelope) that every `modules/*` compiler now builds from, so tag layout lives in one place.
 * - 2026-09-11: Co-located indent_all, inline_or_block, and wrap_tag layout helpers in xml.js for cross-layer prompt formatting purity.
 * - 2026-09-10: physical_to_xml remaps known state-key aliases (SHORTS->APPAREL, SOMA->SOMATIC,
 *   POSE->POSTURE) while preserving the original casing of every other key, strips echoed
 *   `KEY:` value prefixes, and collapses duplicate keys (the canonical name wins);
 *   added PHYSICAL_KEY_ALIASES + strip_leading_key_echo.
 * - 2026-09-06: prompt_escape now escapes only `<`/`>`; brackets, ampersands, and quotes pass
 *   through verbatim. Transport passes instructions as a function so perchance never pjs-evaluates
 *   `[...]`/`{...}` — eliminates `&#91;`/`&#93;`/`&amp;` entity pollution in model-facing prompts.
 * - 2026-08-29: Added parse_visual_engine for structured <VISUAL_ENGINE> XML parsing.
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured 4 clear section dividers, exported frozen CLOTHING_KEYS array, added comprehensive
 *   JSDoc schemas, and created unit test suite xml.test.js.
 * - 2026-06-15: Initial XML escaping and physical-state prompt builder implementation.
 */
