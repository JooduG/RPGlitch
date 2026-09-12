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
 * - `src/intelligence/prompts/` (Prompt compilation pipelines).
 * - `src/media/image-prompts.js` (Visual prompt synthesis).
 * - `src/utils/text.js` (Clothing key resolution).
 */

import { safe_parse_pseudo_json } from "./text.js";

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
function normalize_physical_entries(parsed) {
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
 * Converts a raw physical/non-physical state value (prose string or pseudo-JSON) into
 * an escaped, structured XML block.
 * - Plain prose is wrapped in a single text node.
 * - Structured pseudo-JSON is expanded into one child XML tag per key.
 *
 * @param {string | Record<string, any> | null | undefined} raw - State string or parsed dictionary.
 * @param {string} tagName - Enclosing XML tag name (e.g. "PHYSICAL", "ETERNAL", "PRESENT").
 * @returns {string} Structured XML block.
 */
export function physical_to_xml(raw, tagName) {
  if (!raw) return "";

  const parsed = typeof raw === "string" ? safe_parse_pseudo_json(raw) : (raw ?? {});

  if (parsed.__raw_prose__) {
    return `  <${tagName}>${prompt_escape(parsed.__raw_prose__)}</${tagName}>`;
  }

  const entries = Object.entries(normalize_physical_entries(parsed));
  if (entries.length === 0) return "";

  const children = entries
    .map(([k, v]) => {
      const tag = String(k).replace(/\s+/g, "_");
      return `    <${tag}>${prompt_escape(String(v))}</${tag}>`;
    })
    .join("\n");

  return `  <${tagName}>\n${children}\n  </${tagName}>`;
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

/**
 * Parses structured tokens (<medium>, <palette>, <camera>, <composition>, <texture>, <negative_prompt>)
 * out of a <VISUAL_ENGINE> XML block.
 * @param {string} [engineXml=""]
 * @returns {{ medium: string, palette: string, camera: string, composition: string, texture: string, negative_prompt: string }}
 */
export function parse_visual_engine(engineXml = "") {
  const result = { medium: "", palette: "", camera: "", composition: "", texture: "", negative_prompt: "" };
  if (!engineXml) return result;

  const extract_tag = (tag) => {
    const match = engineXml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
    return match ? match[1].trim() : "";
  };

  result.medium = extract_tag("medium");
  result.palette = extract_tag("palette");
  result.camera = extract_tag("camera");
  result.composition = extract_tag("composition");
  result.texture = extract_tag("texture");
  result.negative_prompt = extract_tag("negative_prompt");
  return result;
}

// ============================================================================
// [SECTION 5: INDENTATION & TAG WRAPPING HELPERS]
// ============================================================================

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
    .map((item) => String(item).trim())
    .join(separator);
  if (child_indent != null && body) body = indent_all(body, child_indent);
  let block;
  if (!body) block = closed ? `${open}\n</${tag}>` : open;
  else if (inline && !body.includes("\n")) block = closed ? `${open}${body}</${tag}>` : `${open}${body}`;
  else block = closed ? `${open}\n${body}\n</${tag}>` : `${open}\n${body}`;
  return indent > 0 ? indent_all(block, indent) : block;
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
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
