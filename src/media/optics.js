/**
 * @file src/media/optics.js
 * 👁️ SENSORY CORTEX — VISUAL OPTICS COMPILER, TAXONOMY & TRIGGER ARBITRATION
 */

import { DYNAMICS, IMAGE_RESOLUTIONS, IMAGE_POLICY } from "@config";
import { evaluate_image_trigger, normalize_comma_spacing, CLOTHING_KEYS, CLEAR_TOKENS, safe_parse_pseudo_json, VISUAL_EXCLUDED_KEYS } from "@utils";
import { resolve_portrait_visual_style_key, VISUAL_STYLES } from "../definitions/visual-styles.js";
import { get_signature_label, PALETTE } from "./palette.js";

// ============================================================================
// [SECTION 1: TAXONOMY CONSTANTS & RESOLUTION SPECS]
// ============================================================================

/**
 * The 4 canonical image generation tiers.
 * @type {ReadonlyArray<"story_entities" | "story_character" | "solo_entity" | "story_scene">}
 */
export const IMAGE_TIERS = Object.freeze(["story_entities", "story_character", "solo_entity", "story_scene"]);

/**
 * Resolution dimensions mapped by canonical tier identifier.
 * @type {Readonly<Record<string, { width: number, height: number }>>}
 */
const TIER_RESOLUTIONS = Object.freeze({
  story_scene: IMAGE_RESOLUTIONS.LANDSCAPE,
  solo_entity: IMAGE_RESOLUTIONS.PORTRAIT,
  story_character: IMAGE_RESOLUTIONS.PORTRAIT,
  story_entities: IMAGE_RESOLUTIONS.SQUARE_LARGE,
});

/**
 * Normalizes input tier keys or colloquial aliases to canonical tier names.
 * @param {string | null | undefined} target_type
 * @returns {"story_entities" | "story_character" | "solo_entity" | "story_scene"}
 */
export function normalize_image_tier(target_type) {
  if (!target_type) return "story_character";
  const str = String(target_type).trim().toLowerCase();

  if (str === "characters" || str === "group" || str === "story_entities") {
    return "story_entities";
  }
  if (str === "fractal_profile" || str === "fractal" || str === "scene" || str === "story_scene" || str === "prologue" || str === "epilogue") {
    return "story_scene";
  }
  if (str === "character" || str === "user" || str === "solo_entity") {
    return "solo_entity";
  }
  if (IMAGE_TIERS.includes(/** @type {any} */ (str))) {
    return /** @type {any} */ (str);
  }
  return "story_character";
}

/**
 * Resolves standard render resolution dimensions { width, height } for a tier mode.
 * @param {string | null | undefined} mode
 * @returns {{ width: number, height: number }}
 */
export function get_resolution(mode) {
  const tier = normalize_image_tier(mode);
  return TIER_RESOLUTIONS[tier] || TIER_RESOLUTIONS.story_entities;
}

/**
 * Resolves standard render resolution string "WIDTHxHEIGHT" for a tier mode or alias.
 * @param {string | null | undefined} mode
 * @returns {string} E.g., "512x768", "768x512", "768x768"
 */
export function get_resolution_string(mode) {
  const dims = get_resolution(mode);
  return `${dims.width}x${dims.height}`;
}

/**
 * Returns the baseline diffusion model guidance scale for a given tier.
 * Environmental scene shots use 7, while character portraits use a tighter baseline of 9.
 * @param {string | null | undefined} mode
 * @returns {number}
 */
export function get_tier_guidance_scale(mode) {
  return normalize_image_tier(mode) === "story_scene" ? IMAGE_POLICY.guidance.SCENE : IMAGE_POLICY.guidance.CHARACTER;
}

// ============================================================================
// [SECTION 2: DUAL-SOURCE TRIGGER ARBITRATION]
// ============================================================================

/**
 * Resolves whether an image beat should trigger with independent cooldown timers and Priority 1 arbitration.
 * @param {object} parameters
 * @param {any} [parameters.snapshot] - Current entity dynamics snapshot
 * @param {any} [parameters.prev_dynamics] - Previous dynamics state
 * @param {any} [parameters.director_data] - Parsed Director output
 * @param {number} parameters.turn_round - Active round number
 * @param {number} [parameters.last_director_beat_round] - Last round Director triggered an image
 * @param {number} [parameters.last_dynamics_beat_round] - Last round Dynamics triggered an image
 * @returns {{
 *   active: boolean,
 *   tier: string | null,
 *   source: "director" | "dynamics" | null,
 *   signals: any,
 *   next_director_round: number | null,
 *   next_dynamics_round: number | null,
 *   director_explicit: boolean
 * }}
 */
export function resolve_image_trigger({ snapshot, prev_dynamics, director_data, turn_round, last_director_beat_round, last_dynamics_beat_round }) {
  const director_last_round = Number.isInteger(last_director_beat_round) ? last_director_beat_round : -1;
  const dynamics_last_round = Number.isInteger(last_dynamics_beat_round) ? last_dynamics_beat_round : -1;

  const is_cooldown_elapsed = (last_round) => last_round < 0 || turn_round >= last_round + IMAGE_POLICY.cooldown_rounds;
  const director_cooldown_elapsed = is_cooldown_elapsed(director_last_round);
  const dynamics_cooldown_elapsed = is_cooldown_elapsed(dynamics_last_round);

  // 1. Evaluate Director Explicit Beat (Priority 1)
  const raw_trigger = typeof director_data?.trigger_image === "string" ? director_data.trigger_image.trim() : director_data?.trigger_image;
  const tier_from_string = typeof raw_trigger === "string" && IMAGE_TIERS.includes(raw_trigger) ? raw_trigger : null;
  const tier_from_preference =
    typeof director_data?.image_tier === "string" && IMAGE_TIERS.includes(director_data.image_tier) ? director_data.image_tier : null;
  const raw_staging = typeof director_data?.visual_staging === "string" ? director_data.visual_staging.trim() : "";
  const has_visual_staging = Boolean(raw_staging);
  const director_explicit = raw_trigger === true || raw_trigger === "true" || tier_from_string !== null || has_visual_staging;
  const director_qualifies = director_explicit && director_cooldown_elapsed;

  // 1.1 Character Optics Biasing (Anti-Wide Angle Lock):
  // Check if visual_staging indicates character intimacy/confrontation or if dynamics show extreme intensity/affinity.
  // Environmental/panoramic staging cues explicitly preserve scene tier over character bias.
  const ai_dynamics = snapshot?.ai?.dynamics || {};
  const current_intensity = Number(ai_dynamics.intensity ?? DYNAMICS.SCALE.MID);
  const current_affinity = Number(ai_dynamics.affinity ?? DYNAMICS.SCALE.MID);
  const staging_has_scene_focus =
    has_visual_staging &&
    /\b(?:wide|panoramic|landscape|establishing|environment|aerial|distant|overview|scenery|room|corridor|cityscape|horizon)\b/i.test(raw_staging);
  const staging_has_character_focus =
    has_visual_staging &&
    /\b(?:close-?ups?|portraits?|faces?|eyes?|expressions?|intimate|intimacy|confrontations?|clutch(?:es|ed|ing)?|hold(?:s|ing)?|held|holding|combats?|wounds?|wounded|touch(?:es|ed|ing)?|profiles?|headshots?)\b/i.test(
      raw_staging,
    );
  const dynamics_have_character_focus =
    !staging_has_scene_focus && (current_intensity >= DYNAMICS.SCALE.HIGH || current_affinity >= DYNAMICS.SCALE.HIGH);
  const biased_character_tier = !staging_has_scene_focus && (staging_has_character_focus || dynamics_have_character_focus) ? "story_character" : null;

  // 2. Evaluate Pure-JS Dynamics Gate (Priority 2)
  const image_trigger_evaluation = evaluate_image_trigger({ ai: snapshot?.ai?.dynamics, fractal: snapshot?.fractal?.dynamics }, prev_dynamics, {
    band_high: DYNAMICS.SCALE.EXTREME_HIGH,
    band_low: DYNAMICS.SCALE.EXTREME_LOW,
    displacement_threshold: IMAGE_POLICY.displacement_threshold,
    default_tier: IMAGE_POLICY.default_tier,
  });
  const dynamics_qualifies = image_trigger_evaluation.triggered && dynamics_cooldown_elapsed;

  // 3. Priority Arbitration & 1-Image-Per-Round Ceiling
  let active = false;
  let tier = null;
  let source = null;
  let next_director_round = null;
  let next_dynamics_round = null;

  if (director_qualifies) {
    active = true;
    source = "director";
    tier = tier_from_string || tier_from_preference || biased_character_tier || IMAGE_POLICY.default_tier;
    next_director_round = turn_round;
  } else if (dynamics_qualifies) {
    active = true;
    source = "dynamics";
    tier = image_trigger_evaluation.tier || biased_character_tier || IMAGE_POLICY.default_tier;
    next_dynamics_round = turn_round;
  }

  return {
    active,
    tier,
    source,
    signals: image_trigger_evaluation.signals,
    next_director_round,
    next_dynamics_round,
    director_explicit,
  };
}

// ============================================================================
// [SECTION 3: AESTHETIC TRAIT EXTRACTOR & DETERMINISTIC OPTICS FALLBACK]
// ============================================================================

export const ORDERED_VISUAL_STYLE_KEYS = Object.freeze([
  "_visual_style_medium",
  "_visual_style_palette",
  "_visual_style_camera",
  "_visual_style_composition",
  "_visual_style_texture",
  "_visual_style_tags",
]);

/**
 * Pre-compiled regex matching clothing removal markers in present state strings.
 * Built dynamically from shared canonical CLOTHING_KEYS and CLEAR_TOKENS sets.
 * @type {RegExp}
 */
const BARE_MARKER_REGEX = new RegExp(`\\[(?:${CLOTHING_KEYS.join("|")})\\s*:\\s*(?:${[...CLEAR_TOKENS].join("|")})\\s*\\]`, "i");

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

export function flatten_aesthetic_map(entity = {}) {
  if (!entity) return "";
  const map = build_aesthetic_map(entity);
  const style_keys = [
    "_visual_style_medium",
    "_visual_style_palette",
    "_visual_style_camera",
    "_visual_style_composition",
    "_visual_style_texture",
    "_visual_style_tags",
  ];
  const visual_values = style_keys.map((k) => map[k]).filter(Boolean);
  const additional = Object.entries(map)
    .filter(([k]) => !style_keys.includes(k))
    .map(([k, v]) => {
      const val_str = Array.isArray(v) ? v.join(", ") : String(v).trim();
      return k.startsWith("_visual_style_") || k === "aesthetic" ? val_str : `${k.replace(/_/g, " ")}: ${val_str}`;
    })
    .filter(Boolean);
  return normalize_comma_spacing([...visual_values, ...additional].join(". "));
}

export function extract_aesthetic_traits(entity = {}) {
  const merged_aesthetic_map = build_aesthetic_map(entity);
  const ordered_aesthetic_keys = [
    ...ORDERED_VISUAL_STYLE_KEYS.filter((key) => merged_aesthetic_map[key]),
    ...Object.keys(merged_aesthetic_map).filter((key) => !ORDERED_VISUAL_STYLE_KEYS.includes(key)),
  ];

  return ordered_aesthetic_keys
    .map((key) => {
      const value = merged_aesthetic_map[key];
      if (value === undefined || value === null) return "";
      const value_string = Array.isArray(value) ? value.join(", ") : String(value).trim();
      if (!value_string) return "";
      const formatted_value = normalize_comma_spacing(value_string);
      const cleaned_key = key.replace(/^_visual_style_/, "");
      return `  "${cleaned_key}": "${formatted_value.replace(/"/g, '\\"')}"`;
    })
    .filter(Boolean)
    .join(",\n");
}

/**
 * Deterministically compiles a fallback <image_prompt> block for an entity when
 * LLM prompt extraction fails or returns empty.
 *
 * @param {Object} [parameters={}]
 * @param {string} [parameters.tier="solo_entity"]
 * @param {"ai" | "user" | "fractal"} [parameters.subject="ai"]
 * @param {any} [parameters.ai]
 * @param {any} [parameters.user]
 * @param {any} [parameters.fractal]
 * @param {string} [parameters.intent=""]
 * @returns {string}
 */
export function render_optics_fallback({ tier = "solo_entity", subject = "ai", ai, user, fractal, intent = "" } = {}) {
  const normalized_tier = normalize_image_tier(tier);
  const fallback_entity =
    normalized_tier === "solo_entity"
      ? subject === "user"
        ? user
        : subject === "fractal"
          ? fractal
          : ai
      : normalized_tier === "story_scene" || normalized_tier === "story_entities"
        ? fractal
        : subject === "user"
          ? user
          : ai;

  const fallback_description = flatten_aesthetic_map(fallback_entity);
  const fallback_name = fallback_entity?.name || normalized_tier;
  const short_intent = intent && intent.length < 200 ? intent : "";

  if (normalized_tier === "story_character" && fractal) {
    const fractal_description = flatten_aesthetic_map(fractal);
    return `<image_prompt>${short_intent ? `${short_intent}, ` : ""}${fallback_name}, ${fallback_description || "detailed character"}, situated within ${fractal.name || "the setting"}, ${fractal_description || "atmospheric environment, dramatic lighting"}</image_prompt>`;
  }
  return `<image_prompt>${short_intent ? `${short_intent}, ` : ""}${fallback_name}, ${fallback_description || "detailed character portrait, dramatic lighting"}</image_prompt>`;
}
