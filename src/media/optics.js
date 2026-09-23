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
 * 2. Dual-Source Trigger Arbitration & Dynamics Gate (IMAGE_TRIGGER,
 *    resolve_image_trigger, evaluate_image_trigger):
 *    - Source A: Pure-JS physical dynamics displacement & extreme band crossings (Signal A & B).
 *    - Source B: LLM Director narrative beat requests (trigger_image / visual_staging).
 *    - Decoupled cooldown timers (2 rounds for Director, 3 rounds for Dynamics).
 * 3. Aesthetic Map Synthesis & Prompt Composition (build_aesthetic_map, compose_visual_generation_prompt, aesthetic_resolver):
 *    - Merges eternal/present physical traits with clothing override protocols.
 *    - Injects resolved visual style tokens (_visual_style_medium, _visual_style_palette, etc.).
 *    - Assembles and deduplicates positive/negative prompt tokens against universal quality floors.
 *
 * Purity: 100% pure deterministic functions and frozen tables. Zero Svelte runes, zero side effects.
 */

import { VISUAL_STYLES, resolve_portrait_visual_style_key } from "@data";
import { CLOTHING_KEYS, safe_parse_pseudo_json, normalize_comma_spacing, VISUAL_EXCLUDED_KEYS } from "@utils";
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
// [SECTION 2: DUAL-SOURCE ARBITRATION & DYNAMICS GATE]
// ============================================================================

/**
 * Image Trigger Engine configuration thresholds and cooldown parameters.
 * @type {Readonly<{
 *   band_high: number,
 *   band_low: number,
 *   displacement_threshold: number,
 *   director_cooldown_rounds: number,
 *   dynamics_cooldown_rounds: number,
 *   default_tier: string,
 *   tiers: ReadonlyArray<string>
 * }>}
 */
export const IMAGE_TRIGGER = Object.freeze({
  band_high: 85,
  band_low: 15,
  displacement_threshold: 60,
  director_cooldown_rounds: 2,
  dynamics_cooldown_rounds: 3,
  default_tier: DEFAULT_IMAGE_TIER,
  tiers: IMAGE_TIERS,
});

/**
 * Entity identifiers that belong to character domain for tier precedence resolution.
 * @type {ReadonlySet<string>}
 */
const CHARACTER_DOMAIN_ENTITIES = Object.freeze(new Set(["ai", "user"]));

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
  const has_visual_staging = typeof director_data?.visual_staging === "string" && Boolean(director_data.visual_staging.trim());
  const director_explicit = raw_trigger === true || raw_trigger === "true" || tier_from_string !== null || has_visual_staging;
  const director_qualifies = director_explicit && director_cooldown_elapsed;

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
    tier = tier_from_string || tier_from_preference || IMAGE_TRIGGER.default_tier;
    next_director_round = turn_round;
  } else if (dynamics_qualifies) {
    active = true;
    source = "dynamics";
    tier = image_trigger_evaluation.tier || IMAGE_TRIGGER.default_tier;
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

/**
 * Runs deterministically to evaluate physics dynamics shifts (Signal A: displacement, Signal B: extreme band entry).
 * @param {Record<string, Record<string, number>>} [current={}]
 * @param {Record<string, Record<string, number>>} [previous={}]
 * @param {object} [options={}]
 * @param {number} [options.band_high=85]
 * @param {number} [options.band_low=15]
 * @param {number} [options.displacement_threshold=60]
 * @param {string} [options.default_tier="story_scene"]
 * @returns {{
 *   triggered: boolean,
 *   signals: {
 *     band_entry: { axis: string, from: number, to: number, band: "high" | "low" } | null,
 *     displacement: number,
 *     displacement_threshold: number
 *   },
 *   tier: string,
 *   deltas: Array<{ axis: string, from: number, to: number, delta: number, entity?: string }>
 * }}
 */
export function evaluate_image_trigger(current = {}, previous = {}, options = {}) {
  const band_high = options.band_high ?? 85;
  const band_low = options.band_low ?? 15;
  const displacement_threshold = options.displacement_threshold ?? 60;
  const default_tier = options.default_tier ?? DEFAULT_IMAGE_TIER;

  const entities_set = new Set([...Object.keys(current || {}), ...Object.keys(previous || {})]);
  const axis_names = new Set();

  for (const entity of entities_set) {
    for (const axis of Object.keys((current || {})[entity] || {})) axis_names.add(axis);
    for (const axis of Object.keys((previous || {})[entity] || {})) axis_names.add(axis);
  }

  const deltas = [];
  const band_entries = [];
  let band_entry = null;
  let displacement = 0;

  for (const axis of axis_names) {
    let from = null;
    let to = null;
    let from_entity = null;
    let to_entity = null;

    for (const entity of entities_set) {
      const previous_entity_dynamics = (previous || {})[entity] || {};
      const current_entity_dynamics = (current || {})[entity] || {};
      if (from === null && Number.isFinite(previous_entity_dynamics[axis])) {
        from = previous_entity_dynamics[axis];
        from_entity = entity;
      }
      if (to === null && Number.isFinite(current_entity_dynamics[axis])) {
        to = current_entity_dynamics[axis];
        to_entity = entity;
      }
    }

    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;

    const delta = Math.round((to - from) * 10) / 10;
    deltas.push({ axis, from, to, delta, entity: to_entity || from_entity });
    displacement += Math.abs(to - from);

    const entry_entity = to_entity || from_entity;
    if (to >= band_high && from < band_high) {
      band_entries.push({ axis, from, to, band: "high", entity: entry_entity });
      if (!band_entry) band_entry = { axis, from, to, band: "high" };
    } else if (to <= band_low && from > band_low) {
      band_entries.push({ axis, from, to, band: "low", entity: entry_entity });
      if (!band_entry) band_entry = { axis, from, to, band: "low" };
    }
  }

  displacement = Math.round(displacement * 10) / 10;
  const triggered = band_entry !== null || displacement >= displacement_threshold;

  const character_band_entry = band_entries.find((entry) => CHARACTER_DOMAIN_ENTITIES.has(entry.entity));
  const tier = character_band_entry ? "story_character" : band_entries.length > 0 ? "story_scene" : default_tier;

  return {
    triggered,
    signals: {
      band_entry,
      displacement,
      displacement_threshold,
    },
    tier,
    deltas,
  };
}

// ============================================================================
// [SECTION 3: VISUAL ENGINE TOKENS & PROMPT COMPOSER]
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

/**
 * Pre-compiled regex matching clothing removal markers in present state strings.
 * @type {RegExp}
 */
const BARE_MARKER_REGEX =
  /\[(?:CLOTHING|SHIRT|PANTS|SUIT|JACKET|DRESS|SKIRT|COAT|ROBE|ROBES|APPAREL|UNDERWEAR|OUTFIT|CLOAK|BOTTOMS|TOPS|ACCESSORIES|HARNESS|SCRUBS|HARDWARE|EQUIPMENT|GEAR)\s*:\s*(?:none|bare|naked|off|removed|disrobed)\s*\]/i;

/**
 * Resolves visual engine medium, palette, camera, and negative prompts for a style key.
 * Directly reads structured tokens from visual_style.engine.
 *
 * @param {string} visual_style_key
 * @returns {VisualEngineTokens}
 */
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
// [SECTION 4: AESTHETIC MAP SYNTHESIS & RESOLVERS]
// ============================================================================

/**
 * Builds a consolidated key-value aesthetic map for an entity combining traits, styles, and signature palette.
 * @param {AestheticEntityInput} [entity={}]
 * @returns {Record<string, any>}
 */
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
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-09-24: Purged redundant re-exports of VISUAL_EXCLUDED_KEYS and strip_visual_excluded under P4 Zero Backwards Compatibility.
 * - 2026-09-24: Imported VISUAL_EXCLUDED_KEYS and strip_visual_excluded from @utils instead of @intelligence, breaking circular media↔intelligence dependency.
 * - 2026-09-24: Consolidated pure visual optics domain (optics.js) absorbing image-tiers.js (taxonomy, resolutions), image-trigger.js (dual-source trigger arbitration, dynamics gate), and image-aesthetics.js (aesthetic map synthesis, prompt composition, resolvers).
 * - 2026-09-24: Added compose_visual_generation_prompt() — positive style-token injection and negative-token assembly/dedup moved out of visual.svelte.js generate() into this pure compiler.
 * - 2026-09-19: Repatriated VISUAL_EXCLUDED_KEYS and strip_visual_excluded to @intelligence/modules/entities/epistemic.js; re-exported from @intelligence for backwards-clean imports.
 */
