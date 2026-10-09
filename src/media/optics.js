/**
 * @file src/media/optics.js
 * 👁️ SENSORY CORTEX — VISUAL OPTICS COMPILER, TAXONOMY & TRIGGER ARBITRATION
 *
 * Core Responsibilities:
 * 1. 4-Tier Image Taxonomy & Resolutions (IMAGE_TIERS, DEFAULT_IMAGE_TIER,
 *    normalize_image_tier, get_resolution, get_tier_guidance_scale):
 *    - story_entities: Multi-character group compositions (768x768).
 *    - story_character: In-story focused character portrayals (512x768).
 *    - solo_entity: Profile and isolated character portraits (512x768).
 *    - story_scene: Environmental, landscape, and establishing scene shots (768x512).
 * 2. Dual-Source Trigger Arbitration (resolve_image_trigger over the
 *    intelligence/physics.js dynamics gate):
 *    - Source A: Pure-JS physical dynamics displacement & extreme band crossings (Signal A & B).
 *    - Source B: LLM Director narrative beat requests (trigger_image / visual_staging).
 *    - Decoupled cooldown timers (2 rounds for Director, 3 rounds for Dynamics).
 * 3. Aesthetic Resolvers + Deterministic Fallback (aesthetic_resolver over the
 *    style.js aesthetic map; render_optics_fallback beside the taxonomy):
 *    - Re-exports the style.js visual payload compilers (build_aesthetic_map,
 *      compose_visual_generation_prompt, resolve_visual_engine_tokens) so media
 *      consumers keep one import surface.
 *
 * Purity: 100% pure deterministic functions and frozen tables. Zero Svelte runes, zero side effects.
 */

import { normalize_comma_spacing } from "@utils";
import { build_aesthetic_map, compose_visual_generation_prompt, resolve_visual_engine_tokens } from "../intelligence/modules/style.js";
import { IMAGE_TRIGGER, evaluate_image_trigger } from "../intelligence/dynamics.js";

// Re-exported so @media consumers (media/index.js, visual.svelte.js) keep one
// import surface while the compilers live in their domain homes.
export { build_aesthetic_map, compose_visual_generation_prompt, resolve_visual_engine_tokens };

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
  story_scene: Object.freeze({ width: 768, height: 512 }),
  solo_entity: Object.freeze({ width: 512, height: 768 }),
  story_character: Object.freeze({ width: 512, height: 768 }),
  story_entities: Object.freeze({ width: 768, height: 768 }),
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
  if (str === "fractal_profile" || str === "prologue" || str === "epilogue") {
    return "story_scene";
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

  const director_cooldown_elapsed = director_last_round < 0 || turn_round >= director_last_round + IMAGE_TRIGGER.director_cooldown_rounds;
  const dynamics_cooldown_elapsed = dynamics_last_round < 0 || turn_round >= dynamics_last_round + IMAGE_TRIGGER.dynamics_cooldown_rounds;

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
  const current_intensity = Number(ai_dynamics.intensity ?? 50);
  const current_affinity = Number(ai_dynamics.affinity ?? 50);
  const staging_has_scene_focus =
    has_visual_staging &&
    /\b(?:wide|panoramic|landscape|establishing|environment|aerial|distant|overview|scenery|room|corridor|cityscape|horizon)\b/i.test(raw_staging);
  const staging_has_character_focus =
    has_visual_staging &&
    /\b(?:close-?ups?|portraits?|faces?|eyes?|expressions?|intimate|intimacy|confrontations?|clutch(?:es|ed|ing)?|hold(?:s|ing)?|held|holding|combats?|wounds?|wounded|touch(?:es|ed|ing)?|profiles?|headshots?)\b/i.test(
      raw_staging,
    );
  const dynamics_have_character_focus = !staging_has_scene_focus && (current_intensity >= 75 || current_affinity >= 75);
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

// [SECTION 3: ORDERED VISUAL STYLE KEYS]
// ============================================================================

/**
 * @typedef {Object} VisualEngineTokens
 * @property {string} [medium]
 * @property {string} [palette]
 * @property {string} [camera]
 * @property {string} [composition]
 * @property {string} [texture]
 * @property {string} [negative_prompt]
 */

/**
 * @typedef {Object} EntityPhysicalFragment
 * @property {string} [physical]
 */

/**
 * @typedef {Object} AestheticEntityInput
 * @property {string} [id]
 * @property {string} [name]
 * @property {string} [type]
 * @property {string} [kind]
 * @property {string[]} [tags]
 * @property {string} [signature_color]
 * @property {string} [visual_style]
 * @property {EntityPhysicalFragment} [eternal]
 * @property {EntityPhysicalFragment} [present]
 */

/**
 * Ordered visual style token keys for deterministic prompt composition.
 * @type {ReadonlyArray<string>}
 */
export const ORDERED_VISUAL_STYLE_KEYS = Object.freeze([
  "_visual_style_medium",
  "_visual_style_palette",
  "_visual_style_camera",
  "_visual_style_composition",
  "_visual_style_texture",
  "_visual_style_tags",
]);

// [SECTION 4: AESTHETIC RESOLVERS]
// ============================================================================

export const aesthetic_resolver = {
  /**
   * Deterministic extraction of traits from entity fields into formatted JSON property lines.
   * @param {AestheticEntityInput} [entity={}]
   * @returns {string}
   */
  extract(entity = {}) {
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
  },

  /**
   * Deterministic flattening of entity physical traits into continuous descriptive sentences.
   * @param {AestheticEntityInput} [entity={}]
   * @returns {string}
   */
  flatten(entity = {}) {
    const merged_aesthetic_map = build_aesthetic_map(entity);
    const visual_style_values = ORDERED_VISUAL_STYLE_KEYS.map((key) => merged_aesthetic_map[key]).filter(Boolean);
    const additional_values = Object.entries(merged_aesthetic_map)
      .filter(([key]) => !ORDERED_VISUAL_STYLE_KEYS.includes(key))
      .map(([key, value]) => {
        const value_string = Array.isArray(value) ? value.join(", ") : String(value).trim();
        return key.startsWith("_visual_style_") || key === "aesthetic" ? value_string : `${key.replace(/_/g, " ")}: ${value_string}`;
      })
      .filter(Boolean);

    return normalize_comma_spacing([...visual_style_values, ...additional_values].join(". "));
  },
};

// ============================================================================
// [SECTION 5: DETERMINISTIC OPTICS FALLBACK]
// ============================================================================
// Track 0.11: moved verbatim from sensory.js - the deterministic
// <image_prompt> fallback lives beside the taxonomy and resolvers it reads.

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
  const fallback_description = aesthetic_resolver.flatten(fallback_entity);
  const fallback_name = fallback_entity?.name || normalized_tier;
  const short_intent = intent && intent.length < 200 ? intent : "";

  if (normalized_tier === "story_character" && fractal) {
    const fractal_description = aesthetic_resolver.flatten(fractal);
    return `<image_prompt>${short_intent ? `${short_intent}, ` : ""}${fallback_name}, ${fallback_description || "detailed character"}, situated within ${fractal.name || "the setting"}, ${fractal_description || "atmospheric environment, dramatic lighting"}</image_prompt>`;
  }
  return `<image_prompt>${short_intent ? `${short_intent}, ` : ""}${fallback_name}, ${fallback_description || "detailed character portrait, dramatic lighting"}</image_prompt>`;
}

/**
 * CHANGELOG:
 * - Track 0.11: Sensory dissolution - IMAGE_TRIGGER + evaluate_image_trigger move to intelligence/physics.js (imported back for resolve_image_trigger, which stays); visual payload compilers move to style.js (re-exported for @media consumers); render_optics_fallback absorbed from sensory.js (new Section 5).
 * - 2026-10-04: Reverted OPTICS_INVARIANTS to intelligence protocols.js and sensory/visual history shaping to intelligence history.js — optics.js owns taxonomy/triggers/aesthetics only.
 * - 2026-10-04: Added OPTICS_INVARIANTS — single source of the sensory-optics protocol texts (consumed by intelligence protocols.js).
 * - 2026-10-04: Absorbed optics history shaping (format_sensory_history, render_visual_history) from intelligence history.js.
 * - 2026-10-03: Environmental scene framing preservation — staging_has_scene_focus now checks for wide/landscape/environmental cues and preserves story_scene tier even under high intensity/affinity dynamics.
 * - 2026-09-24: Purged redundant re-exports of VISUAL_EXCLUDED_KEYS and strip_visual_excluded under P4 Zero Backwards Compatibility.
 * - 2026-09-24: Imported VISUAL_EXCLUDED_KEYS and strip_visual_excluded from @utils instead of @intelligence, breaking circular media↔intelligence dependency.
 * - 2026-09-24: Consolidated pure visual optics domain (optics.js) absorbing image-tiers.js (taxonomy, resolutions), image-trigger.js (dual-source trigger arbitration, dynamics gate), and image-aesthetics.js (aesthetic map synthesis, prompt composition, resolvers).
 * - 2026-09-24: Added compose_visual_generation_prompt() — positive style-token injection and negative-token assembly/dedup moved out of visual.svelte.js generate() into this pure compiler.
 * - 2026-09-19: Repatriated VISUAL_EXCLUDED_KEYS and strip_visual_excluded to @intelligence/modules/entities/epistemic.js; re-exported from @intelligence for backwards-clean imports.
 */
