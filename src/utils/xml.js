/**
 * src/utils/xml.js
 * 📋 XML UTILITIES
 * Pure, stateless XML escaping + physical-state → XML prompt-block rendering.
 * escape_xml/prompt_escape: ZERO dependencies on any architectural layer.
 * physical_to_xml/CLOTHING_KEYS: shared by @intelligence/prompts.js, @intelligence/parser.js
 * and @media/image-prompts.js (top shared layer, so media can use it without a cycle).
 */
import { safe_parse_pseudo_json } from "./text.js";

/**
 * Escapes characters for safe use in XML.
 * @param {string|null|undefined} str
 * @returns {string}
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
 * Escapes content destined for LLM prompt text nodes: keeps XML-tag and Perchance
 * square-bracket safety, but leaves quotes raw so dialogue and names render as real
 * characters instead of &apos;/&quot; noise the model has to decode.
 * Do NOT use inside XML attribute values (e.g. name="...") — those need escape_xml.
 * @param {string|null|undefined} str
 * @returns {string}
 */
export const prompt_escape = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\[/g, "&#91;").replace(/\]/g, "&#93;");
};

/**
 * Converts a raw physical-state value (prose string or pseudo-JSON) into an
 * escaped XML block. Prose collapses into a single text node; pseudo-JSON
 * becomes one child tag per key.
 * @param {any} raw
 * @param {string} tagName
 * @returns {string}
 */
export function physical_to_xml(raw, tagName) {
  if (!raw) return "";
  const parsed = safe_parse_pseudo_json(raw);
  if (parsed.__raw_prose__) {
    return `  <${tagName}>${prompt_escape(parsed.__raw_prose__)}</${tagName}>`;
  }
  const children = Object.entries(parsed)
    .map(([k, v]) => {
      const tag = k.replace(/\s+/g, "_");
      return `    <${tag}>${prompt_escape(String(v))}</${tag}>`;
    })
    .join("\n");
  return `  <${tagName}>\n${children}\n  </${tagName}>`;
}

/**
 * Canonical clothing tag keys — shared by the clothing-override protocol in
 * both merge_prose_into_field (@intelligence/parser.js) and the visual
 * aesthetic map (@media/image-prompts.js).
 */
export const CLOTHING_KEYS = [
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
];
