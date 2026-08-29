/**
 * src/utils/xml.js
 * 📋 XML & PROMPT TEMPLATE PROCESSING ENGINE
 *
 * Core Responsibilities:
 * - Pure, stateless XML escaping (`escape_xml`) and LLM prompt escaping (`prompt_escape`).
 *   - `escape_xml`: Full entity escaping (`&`, `<`, `>`, `"`, `'`, `[`, `]`) for XML attribute safety.
 *   - `prompt_escape`: Node text escaping that protects XML tags and Perchance brackets while leaving
 *     quotes unescaped so dialogue and character names remain natural and unpolluted by entity codes.
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
 * Preserves XML tag and Perchance square-bracket safety (`&#91;` / `&#93;`),
 * but leaves quotes unescaped so dialogue and character names render naturally
 * without decoding overhead for the model.
 *
 * NOTE: Do NOT use inside XML attribute values (e.g. `name="..."`) — use `escape_xml` instead.
 *
 * @param {string | null | undefined} str - Raw prompt text.
 * @returns {string} Prompt-safe escaped string.
 */
export const prompt_escape = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;");
};

// ============================================================================
// [SECTION 3: PHYSICAL STATE XML BUILDER]
// ============================================================================

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

  const entries = Object.entries(parsed);
  if (entries.length === 0) return "";

  const children = entries
    .map(([k, v]) => {
      const tag = k.replace(/\s+/g, "_");
      const val_str = Array.isArray(v) ? v.join(", ") : String(v);
      return `    <${tag}>${prompt_escape(val_str)}</${tag}>`;
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
    .join("\n");
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured 4 clear section dividers, exported frozen CLOTHING_KEYS array, added comprehensive
 *   JSDoc schemas, and created unit test suite xml.test.js.
 * - 2026-06-15: Initial XML escaping and physical-state prompt builder implementation.
 */
