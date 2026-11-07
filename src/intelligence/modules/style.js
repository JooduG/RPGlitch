/**
 * src/intelligence/modules/style.js
 * 🎨 PROMPT STYLE MODULE — Narrative & Visual Style XML Blocks
 */

import { escape_xml, prompt_escape, render_xml_tag } from "@utils";
import {
  extract_style_dna,
  get_narrative_style,
  get_style_keywords,
  get_visual_style,
  resolve_active_style_key,
  resolve_story_visual_style_key,
  VISUAL_STYLES,
} from "@data";
import { resolve_optics_atom } from "./protocols.js";

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
 * Renders the declarative `<AUTHORIAL_VOICE>` XML block.
 * Emits author and internal_ratio attributes, with a child `<SOVEREIGNTY player="...">` element.
 *
 * @param {Object|null} style - Narrative style record
 * @param {string|null} [player_name=null] - Name of biological protagonist
 * @returns {string} XML formatted `<AUTHORIAL_VOICE>` block or empty string
 */
export function render_narrative_style_xml(style, player_name = null) {
  if (!style || typeof style !== "object" || !style.id || style.id === "default") {
    return "";
  }

  const author = String(style.id).toUpperCase();
  const style_dna = resolve_style_dna(style);
  const description = String(style.description || "").trim();
  const elements = Array.isArray(style.elements) ? style.elements.filter(Boolean).join(", ") : "";
  const sovereignty = player_name
    ? render_xml_tag({
        tag: "SOVEREIGNTY",
        attrs: { player: player_name },
        children: [`Never depict or decide internal thoughts, feelings, or involuntary physiological reactions for ${player_name}.`],
        child_indent: 2,
      })
    : "";

  return render_xml_tag({
    tag: "AUTHORIAL_VOICE",
    attrs: { author, internal_ratio: style_dna.internal_ratio || "0.5" },
    children: [
      description ? prompt_escape(description) : "",
      elements ? `<SIGNATURE_ELEMENTS>${prompt_escape(elements)}</SIGNATURE_ELEMENTS>` : "",
      sovereignty,
    ].filter(Boolean),
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
// intelligence-to-media direction).

import { ORDERED_VISUAL_STYLE_KEYS, build_aesthetic_map, flatten_aesthetic_map, resolve_visual_engine_tokens } from "../../media/optics.js";

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

export { ORDERED_VISUAL_STYLE_KEYS, build_aesthetic_map, flatten_aesthetic_map, resolve_visual_engine_tokens };
