/**
 * src/intelligence/modules/style.js
 * ============================================================================
 * 🎨 PROMPT STYLE MODULE — Narrative & Visual Style XML Blocks
 * ============================================================================
 *
 * Renders the declarative `<NARRATIVE_STYLE>` and `<VISUAL_STYLE>` prompt
 * blocks from style records and engine tokens. Style presentation lives here,
 * not in the behavior catalog: protocols.js consumes these renderers when
 * composing `<CORE_PROTOCOLS>`.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation over @utils + @data.
 * - Single source of truth for style-block XML shape.
 * ============================================================================
 */

import { escape_xml, prompt_escape, render_xml_tag } from "@utils";
import { extract_style_dna } from "@data";

/**
 * Resolves a style record into its frozen style-DNA plan. Single owner of the
 * @data parse — prompt plans read the frozen result instead of parsing inline,
 * so one turn parses its style exactly once (in resolve_task_values).
 * @param {any} style - Narrative style record (or null/undefined)
 * @returns {Readonly<{ internal_ratio: string, sentence_rhythm: string, sensory_order: string, emotional_grounding: string }>}
 */
export function resolve_style_dna(style) {
  return Object.freeze(extract_style_dna(style));
}

/**
 * Renders the declarative `<NARRATIVE_STYLE>` XML block.
 * Mirrors `<VISUAL_STYLE>` from Sensory Optics. Omitted if style is default or undefined.
 *
 * @param {Object|null} style - Narrative style record
 * @returns {string} XML formatted `<NARRATIVE_STYLE>` block or empty string
 */
export function render_narrative_style_xml(style) {
  if (!style || typeof style !== "object" || !style.id || style.id === "default") {
    return "";
  }

  const origin = String(style.id).toUpperCase();
  const style_dna = resolve_style_dna(style);
  const description = String(style.description || "").trim();
  const elements = Array.isArray(style.elements) ? style.elements.filter(Boolean).join(", ") : "";

  return render_xml_tag({
    tag: "NARRATIVE_STYLE",
    attrs: { origin, internal_ratio: style_dna.internal_ratio || "0.5" },
    children: [description ? prompt_escape(description) : "", elements ? `<SIGNATURE_ELEMENTS>${prompt_escape(elements)}</SIGNATURE_ELEMENTS>` : ""],
    child_indent: 2,
    separator: "\n",
  });
}

/**
 * Renders the declarative `<VISUAL_STYLE>` XML block (medium, palette, textures).
 * Mirrors `<NARRATIVE_STYLE>` from Story Prose. Omitted if style is "none" or undefined.
 *
 * @param {Object|null} style_definition - Visual style record
 * @param {Record<string, any>} [engine_tokens={}] - Resolved visual engine tokens
 * @returns {string} XML formatted `<VISUAL_STYLE>` block or empty string
 */
export function render_visual_style_xml(style_definition, engine_tokens = {}) {
  if (!style_definition || !style_definition.id || style_definition.id === "none") {
    return "";
  }

  const origin = String(style_definition.id).toUpperCase();
  const description = String(style_definition.description || "").trim();

  const children = [
    description ? prompt_escape(description) : "",
    engine_tokens.medium ? `<MEDIUM>${escape_xml(engine_tokens.medium)}</MEDIUM>` : "",
    engine_tokens.palette ? `<PALETTE>${escape_xml(engine_tokens.palette)}</PALETTE>` : "",
    engine_tokens.texture ? `<TEXTURES>${escape_xml(engine_tokens.texture)}</TEXTURES>` : "",
  ].filter(Boolean);

  return render_xml_tag({
    tag: "VISUAL_STYLE",
    attrs: { origin },
    children,
    child_indent: 2,
    separator: "\n",
  });
}

/**
 * CHANGELOG
 * - 2026-10-04: Added resolve_style_dna — frozen single-owner @data parse; render_narrative_style_xml and all prompt plans read through it.
 */
