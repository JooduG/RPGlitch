/**
 * src/utils/physical-xml.js
 * 🧩 ENTITY PHYSICAL STATE → XML
 * Shared helpers for rendering an entity's physical state (eternal/present)
 * into escaped XML prompt blocks. Consumed by both the narrative prompt
 * builder (@intelligence/prompts.js) and the visual prompt builder
 * (@media/optics.js). Lives in @utils (the top shared layer) so media can
 * use it without creating an intelligence↔media cycle.
 */
import { safe_parse_pseudo_json } from "./text.js";
import { prompt_escape } from "./xml.js";

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
 * aesthetic map (@media/optics.js).
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
  "CLOAK",
  "BOTTOMS",
  "TOPS",
  "ACCESSORIES",
];
