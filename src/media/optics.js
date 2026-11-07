/**
 * @file src/media/optics.js
 * 👁️ SENSORY CORTEX — VISUAL OPTICS COMPILER, TAXONOMY & TRIGGER ARBITRATION
 */

import { IMAGE_TRIGGER_COOLDOWN_ROUNDS, DYNAMICS_SCALE, IMAGE_RESOLUTIONS, IMAGE_TRIGGER } from "@config";
import { evaluate_image_trigger, normalize_comma_spacing } from "@utils";
import { flatten_aesthetic_map, build_aesthetic_map, ORDERED_VISUAL_STYLE_KEYS } from "../intelligence/modules/style.js";

// ============================================================================
// [SECTION 1: TAXONOMY CONSTANTS & RESOLUTION SPECS]
// ============================================================================

/**
 * The 4 canonical image generation tiers.
 * @type {ReadonlyArray<"story_entities" | "story_character" | "solo_entity" | "story_scene">}
 */
export const IMAGE_TIERS = Object.freeze(["story_entities", "story_character", "solo_entity", "story_scene"]);

/**
 * Default fallback tier for auto-triggered environmental beats.
 * @type {"story_scene"}
 */
export const DEFAULT_IMAGE_TIER = "story_scene";

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
  return normalize_image_tier(mode) === "story_scene" ? 7 : 9;
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

  const is_cooldown_elapsed = (last_round) => last_round < 0 || turn_round >= last_round + IMAGE_TRIGGER_COOLDOWN_ROUNDS;
  const director_cooldown_elapsed = is_cooldown_elapsed(director_last_round);
  const dynamics_cooldown_elapsed = is_cooldown_elapsed(dynamics_last_round);

  // 1. Evaluate Director Explicit Beat (Priority 1)
  const raw_trigger = typeof director_data?.trigger_image === "string" ? director_data.trigger_image.trim() : director_data?.trigger_image;
  const tier_from_string = typeof raw_trigger === "string" && IMAGE_TRIGGER.tiers.includes(raw_trigger) ? raw_trigger : null;
  const tier_from_preference =
    typeof director_data?.image_tier === "string" && IMAGE_TRIGGER.tiers.includes(director_data.image_tier) ? director_data.image_tier : null;
  const raw_staging = typeof director_data?.visual_staging === "string" ? director_data.visual_staging.trim() : "";
  const has_visual_staging = Boolean(raw_staging);
  const director_explicit = raw_trigger === true || raw_trigger === "true" || tier_from_string !== null || has_visual_staging;
  const director_qualifies = director_explicit && director_cooldown_elapsed;

  // 1.1 Character Optics Biasing (Anti-Wide Angle Lock):
  // Check if visual_staging indicates character intimacy/confrontation or if dynamics show extreme intensity/affinity.
  // Environmental/panoramic staging cues explicitly preserve scene tier over character bias.
  const ai_dynamics = snapshot?.ai?.dynamics || {};
  const current_intensity = Number(ai_dynamics.intensity ?? DYNAMICS_SCALE.MID);
  const current_affinity = Number(ai_dynamics.affinity ?? DYNAMICS_SCALE.MID);
  const staging_has_scene_focus =
    has_visual_staging &&
    /\b(?:wide|panoramic|landscape|establishing|environment|aerial|distant|overview|scenery|room|corridor|cityscape|horizon)\b/i.test(raw_staging);
  const staging_has_character_focus =
    has_visual_staging &&
    /\b(?:close-?ups?|portraits?|faces?|eyes?|expressions?|intimate|intimacy|confrontations?|clutch(?:es|ed|ing)?|hold(?:s|ing)?|held|holding|combats?|wounds?|wounded|touch(?:es|ed|ing)?|profiles?|headshots?)\b/i.test(
      raw_staging,
    );
  const dynamics_have_character_focus =
    !staging_has_scene_focus && (current_intensity >= DYNAMICS_SCALE.HIGH || current_affinity >= DYNAMICS_SCALE.HIGH);
  const biased_character_tier = !staging_has_scene_focus && (staging_has_character_focus || dynamics_have_character_focus) ? "story_character" : null;

  // 2. Evaluate Pure-JS Dynamics Gate (Priority 2)
  const image_trigger_evaluation = evaluate_image_trigger({ ai: snapshot?.ai?.dynamics, fractal: snapshot?.fractal?.dynamics }, prev_dynamics, {
    band_high: IMAGE_TRIGGER.band_high,
    band_low: IMAGE_TRIGGER.band_low,
    displacement_threshold: IMAGE_TRIGGER.displacement_threshold,
    default_tier: IMAGE_TRIGGER.default_tier,
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
    tier = tier_from_string || tier_from_preference || biased_character_tier || IMAGE_TRIGGER.default_tier;
    next_director_round = turn_round;
  } else if (dynamics_qualifies) {
    active = true;
    source = "dynamics";
    tier = image_trigger_evaluation.tier || biased_character_tier || IMAGE_TRIGGER.default_tier;
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
