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
import {
  extract_style_dna,
  get_narrative_style,
  get_style_keywords,
  get_visual_style,
  resolve_active_style_key,
  resolve_story_visual_style_key,
} from "@data";

/**
 * Resolves a style record into its frozen style-DNA plan. Single owner of the
 * @data parse — prompt plans read the frozen result instead of parsing inline,
 * so one turn parses its style exactly once (in resolve_task_values).
 * @param {any} style - Narrative style record (or null/undefined)
 * @returns {Readonly<{ internal_ratio: string, rhythm: string, sensory: string, grounding: string }>}
 */
export function resolve_style_dna(style) {
  return Object.freeze(extract_style_dna(style));
}

/**
 * Resolves the full per-compile style snapshot: narrative record + keywords +
 * pre-parsed DNA plus the story visual record. Single stateful owner of style
 * resolution — prompt builders read this once per compile and thread the frozen
 * result instead of resolving keys ad hoc.
 * @param {Object} [parameters={}]
 * @param {string|null|undefined} [parameters.explicit_narrative_style] - Narrative override (no implicit runtime lookup; callers pass pre-resolved values)
 * @param {any} [parameters.fractal=null] - Active fractal record for story-visual resolution
 * @param {any} [parameters.fallback_fractal] - Explicit fallback fractal record (no implicit runtime/app lookup)
 * @returns {Readonly<{ narrative_key: string, style: any, keywords: ReadonlyArray<string>, style_dna: any, visual_key: string, visual_style: any }>}
 */
export function resolve_style_snapshot({ explicit_narrative_style, fractal = null, fallback_fractal } = {}) {
  const narrative_explicit = explicit_narrative_style;
  const narrative_key = resolve_active_style_key(narrative_explicit);
  const style = get_narrative_style(narrative_key);
  const visual_fallback = fallback_fractal ?? null;
  const visual_key = resolve_story_visual_style_key(fractal, visual_fallback);
  return Object.freeze({
    narrative_key,
    style,
    keywords: Object.freeze(get_style_keywords(narrative_key)),
    style_dna: resolve_style_dna(style),
    visual_key,
    visual_style: get_visual_style(visual_key),
  });
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
 * Modules Ground Refactor Phase 2 — style.js is pure (state_bridge evicted to builder resolve_builder_style_snapshot); snapshot takes explicit records — prompt bytes byte-identical.
 */
