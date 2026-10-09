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

import { CLOTHING_KEYS, escape_xml, prompt_escape, render_xml_tag, safe_parse_pseudo_json, VISUAL_EXCLUDED_KEYS } from "@utils";
import {
  extract_style_dna,
  get_narrative_style,
  get_style_keywords,
  get_visual_style,
  resolve_active_style_key,
  resolve_story_visual_style_key,
  resolve_portrait_visual_style_key,
  VISUAL_STYLES,
} from "@data";
import { resolve_optics_atom } from "./protocols.js";
import { get_signature_label, PALETTE } from "../../media/palette.js";

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

// ============================================================================
// [SECTION 2: OPTICS CINEMATOGRAPHY FRAMING]
// ============================================================================
// Track 0.11: moved verbatim from sensory.js Section 2 - declarative camera
// framing (presets, descriptor rules, resolver) lives with style presentation.
// Reads OPTICS.CINEMATOGRAPHY templates via protocols resolve_optics_atom
// (call-time only, mirroring the retired task<->sensory precedent).

export const CINEMATOGRAPHY_PRESETS = Object.freeze({
  WIDE_ENVIRONMENTAL: Object.freeze({
    mode: "Wide Environmental",
    tokens: "wide-angle environmental shot, deep spatial composition, atmospheric scale, full silhouette",
  }),
  DUTCH_LOW_ANGLE: Object.freeze({
    mode: "Dutch / Low-Angle",
    tokens: "dutch angle composition, low-angle perspective, imposing scale, dramatic lighting contrast",
  }),
  INTIMATE_CLOSE_UP: Object.freeze({
    mode: "Intimate Close-Up",
    tokens: "tight close-up portrait, shallow depth of field, sharp focus on eyes, macro expression detail",
  }),
  MEDIUM_ACTION: Object.freeze({
    mode: "Medium Action",
    tokens: "medium shot, waist-up framing, dynamic posture, clear wardrobe & prop details",
  }),
  SOLO_PORTRAIT: Object.freeze({
    mode: "Solo Portrait",
    tokens: "medium portrait framing, waist-up composition, distinctive wardrobe, signature atmospheric backdrop",
  }),
});

export const CINEMATOGRAPHY_RULES = Object.freeze([
  Object.freeze({ is_fractal_target: true, preset: "WIDE_ENVIRONMENTAL" }),
  Object.freeze({ chaos_gte: 75, preset: "DUTCH_LOW_ANGLE" }),
  Object.freeze({ intensity_gte: 75, preset: "INTIMATE_CLOSE_UP" }),
  Object.freeze({ affinity_gte: 75, preset: "INTIMATE_CLOSE_UP" }),
  Object.freeze({ tier: "solo_entity", preset: "SOLO_PORTRAIT" }),
]);

/**
 * Tests one cinematography descriptor row: a row matches when every constraint it
 * declares holds against the normalized framing context.
 * @param {{ preset: string }} rule
 * @param {{ is_fractal_target: boolean, chaos: number, intensity: number, affinity: number, tier: string }} framing
 * @returns {boolean}
 */
function matches_cinematography_rule(rule, framing) {
  if (rule.is_fractal_target === true && !framing.is_fractal_target) return false;
  if (rule.chaos_gte != null && !(framing.chaos >= rule.chaos_gte)) return false;
  if (rule.intensity_gte != null && !(framing.intensity >= rule.intensity_gte)) return false;
  if (rule.affinity_gte != null && !(framing.affinity >= rule.affinity_gte)) return false;
  if (rule.tier != null && framing.tier !== rule.tier) return false;
  return true;
}

/**
 * Resolves camera framing, scale tokens, and staging directives for Sensory Optics.
 * Generates dynamic camera framing tokens and context descriptions for Layer 6 (<TASK>).
 *
 * @param {Object} [parameters={}]
 * @returns {{ mode: string, tokens: string, narrative_context: string, visual_staging: string }}
 */
export function resolve_optics_cinematography({
  tier = "solo_entity",
  solo_subject = null,
  active_ai_character = null,
  active_user_persona = null,
  active_fractal_setting = null,
  main_entity = null,
  visual_staging = "",
} = {}) {
  const is_fractal_target = tier === "story_scene" || solo_subject?.type === "fractal";
  const ai_dynamics = active_ai_character?.dynamics || {};
  const intensity = Number(ai_dynamics.intensity ?? 50);
  const chaos = Number(ai_dynamics.chaos ?? 50);
  const affinity = Number(ai_dynamics.affinity ?? 50);

  const PRESETS = CINEMATOGRAPHY_PRESETS;
  const framing = { is_fractal_target, chaos, intensity, affinity, tier };
  const hit = CINEMATOGRAPHY_RULES.find((rule) => matches_cinematography_rule(rule, framing));
  const preset = hit ? PRESETS[hit.preset] : PRESETS.MEDIUM_ACTION;

  const visual_staging_directive = visual_staging
    ? resolve_optics_atom("OPTICS.CINEMATOGRAPHY.STAGING_DIRECTIVE", { visual_staging: prompt_escape(visual_staging) })
    : "";
  const narrative_context_desc =
    tier === "story_entities"
      ? resolve_optics_atom("OPTICS.CINEMATOGRAPHY.NARRATIVE_CONTEXT.GROUP", {
          ai_name: prompt_escape(active_ai_character?.name || "AI"),
          user_name: prompt_escape(active_user_persona?.name || "User"),
        })
      : tier === "story_character" && active_fractal_setting && main_entity?.type !== "fractal" && main_entity !== active_fractal_setting
        ? resolve_optics_atom("OPTICS.CINEMATOGRAPHY.NARRATIVE_CONTEXT.CHARACTER_IN_SCENE", {
            character_name: prompt_escape(main_entity?.name || "Subject"),
            setting_name: prompt_escape(active_fractal_setting.name || "Setting"),
          })
        : "";

  return {
    mode: preset.mode,
    tokens: preset.tokens,
    narrative_context: narrative_context_desc,
    visual_staging: visual_staging_directive,
  };
}

// ============================================================================

// ============================================================================
// [SECTION 3: VISUAL PAYLOAD SYNTHESIS]
// ============================================================================
// Track 0.11: moved verbatim from media/optics.js Sections 3+4 - visual engine
// tokens, prompt composition, and the aesthetic map live with style
// presentation. Palette binding reads media/palette.js directly (permitted
// intelligence-to-media direction); aesthetic_resolver stays in media/optics.js.

/**
 * Pre-compiled regex matching clothing removal markers in present state strings.
 * @type {RegExp}
 */
const BARE_MARKER_REGEX =
  /\[(?:CLOTHING|SHIRT|PANTS|SUIT|JACKET|DRESS|SKIRT|COAT|ROBE|ROBES|APPAREL|UNDERWEAR|OUTFIT|CLOAK|BOTTOMS|TOPS|ACCESSORIES|HARNESS|SCRUBS|HARDWARE|EQUIPMENT|GEAR)\s*:\s*(?:none|bare|naked|off|removed|disrobed)\s*\]/i;

export function resolve_visual_engine_tokens(visual_style_key) {
  const visual_style = VISUAL_STYLES[visual_style_key] || VISUAL_STYLES.none;
  const engine = visual_style.engine || {};

  return {
    medium: String(engine.medium || "").trim(),
    palette: String(engine.palette || "").trim(),
    camera: String(engine.camera || "").trim(),
    composition: String(engine.composition || "").trim(),
    texture: String(engine.texture || "").trim(),
    negative_prompt: String(visual_style.negative_prompt || "").trim(),
  };
}

/**
 * Composes the final image-model prompt and negative prompt from a base prompt and a visual
 * style key: injects the ordered positive style tokens, then assembles the negative tokens
 * (case-folded, punctuation-stripped, deduplicated) over the universal baseline quality floor.
 * Pure — so the media engine's generate() only transports the finished spec.
 *
 * @param {Object} [options={}]
 * @param {string} [options.prompt] - The clean descriptive prompt.
 * @param {string} [options.style_key] - Resolved visual style key.
 * @param {boolean} [options.is_character_shot] - Whether to add the "no empty background" guard.
 * @param {string} [options.base_negative_prompt] - Caller/entity-supplied negatives.
 * @returns {{ prompt: string, negative_prompt: string }}
 */

export function compose_visual_generation_prompt({ prompt = "", style_key = "none", is_character_shot = true, base_negative_prompt = "" } = {}) {
  const visual_style_tokens = resolve_visual_engine_tokens(style_key);
  const positive_tokens = [
    visual_style_tokens.medium,
    visual_style_tokens.palette,
    visual_style_tokens.camera || visual_style_tokens.composition,
    visual_style_tokens.texture,
  ]
    .filter(Boolean)
    .join(", ");
  let composed_prompt = prompt;
  if (positive_tokens && style_key !== "none" && !composed_prompt.includes(visual_style_tokens.medium || "\x00")) {
    composed_prompt = `${composed_prompt}, ${positive_tokens}`;
  }

  const character_negative_tokens = is_character_shot
    ? "empty background, landscape without characters, scenery only, no humans, empty environment"
    : "";
  const baseline_floor = VISUAL_STYLES.none?.negative_prompt || "";
  const raw_negative_sources = [base_negative_prompt, baseline_floor, visual_style_tokens.negative_prompt, character_negative_tokens]
    .filter(Boolean)
    .join(", ");

  const seen_negative_tokens = Object.create(null);
  const deduplicated_negative_tokens = [];
  for (const raw_token of raw_negative_sources.split(",")) {
    const token = raw_token.trim().replace(/[.,;]+$/, "");
    if (!token) continue;
    const lookup_key = token.toLowerCase();
    if (!seen_negative_tokens[lookup_key]) {
      seen_negative_tokens[lookup_key] = true;
      deduplicated_negative_tokens.push(token);
    }
  }

  return { prompt: composed_prompt, negative_prompt: deduplicated_negative_tokens.join(", ") };
}

// ============================================================================

export function build_aesthetic_map(entity = {}) {
  const eternal_parsed_object = safe_parse_pseudo_json(entity.eternal?.physical || "");
  const present_parsed_object = safe_parse_pseudo_json(entity.present?.physical || "");

  /** @type {Record<string, any>} */
  const merged_aesthetic_map = {};

  /**
   * @param {Record<string, any>} source_object
   * @param {string} fallback_label
   */
  const merge_input_source = (source_object, fallback_label) => {
    if (source_object.__raw_prose__) {
      merged_aesthetic_map[fallback_label] = source_object.__raw_prose__;
    } else {
      Object.entries(source_object).forEach(([key, value]) => {
        if (VISUAL_EXCLUDED_KEYS.has(key)) return;
        merged_aesthetic_map[key] = value;
      });
    }
  };

  merge_input_source(eternal_parsed_object, "eternal");
  merge_input_source(present_parsed_object, "present");

  // --- Clothing Override Protocol ---
  const raw_present_physical = entity.present?.physical || "";
  const has_bare_clothing_marker = BARE_MARKER_REGEX.test(raw_present_physical);

  if (has_bare_clothing_marker) {
    for (const clothing_key of CLOTHING_KEYS) {
      if (merged_aesthetic_map[clothing_key] && !(clothing_key in present_parsed_object)) {
        delete merged_aesthetic_map[clothing_key];
      }
    }
  }

  // --- Visual Style Engine Injection ---
  const visual_style_key = resolve_portrait_visual_style_key(entity);
  const visual_style_definition = VISUAL_STYLES[visual_style_key] || VISUAL_STYLES.none;
  const engine_tokens = resolve_visual_engine_tokens(visual_style_key);

  if (engine_tokens.medium) merged_aesthetic_map._visual_style_medium = engine_tokens.medium;
  if (engine_tokens.palette) merged_aesthetic_map._visual_style_palette = engine_tokens.palette;
  if (engine_tokens.camera) merged_aesthetic_map._visual_style_camera = engine_tokens.camera;
  if (engine_tokens.composition) merged_aesthetic_map._visual_style_composition = engine_tokens.composition;
  const style_keywords = visual_style_definition.keywords || visual_style_definition.tags;
  if (visual_style_key && visual_style_key !== "none" && Array.isArray(style_keywords) && style_keywords.length) {
    merged_aesthetic_map._visual_style_tags = style_keywords.join(", ");
  }

  if (Array.isArray(entity.tags) && entity.tags.length) {
    merged_aesthetic_map.tags = entity.tags.join(", ");
  }

  // --- Palette Signature Color Binding ---
  const signature_color_name = get_signature_label(entity);
  if (signature_color_name) {
    const signature_color_hex = /** @type {Record<string, string>} */ (PALETTE)[signature_color_name];
    merged_aesthetic_map.aesthetic = signature_color_hex ? `in color ${signature_color_hex}` : `${signature_color_name.toLowerCase()} aesthetic`;
  }

  return merged_aesthetic_map;
}

/**
 * CHANGELOG
 * - Track 0.11: Absorbed optics cinematography (presets, rules, resolver) + visual payload synthesis (engine tokens, prompt composer, aesthetic map) from sensory.js/media optics.js. Prompt bytes byte-identical.
 * - 2026-10-04: Added resolve_style_dna — frozen single-owner @data parse; render_narrative_style_xml and all prompt plans read through it.
 * Modules Ground Refactor Phase 2 — style.js is pure (state_bridge evicted to builder resolve_builder_style_snapshot); snapshot takes explicit records — prompt bytes byte-identical.
 */
