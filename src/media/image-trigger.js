/**
 * @file src/media/image-trigger.js
 * 🖼️ SENSORY CORTEX — IMAGE TRIGGER DECISION ENGINE
 *
 * Core Responsibilities:
 * 1. Dual-Source Trigger Arbitration (`resolve_image_trigger`):
 *    - Source A: Pure-JS physical dynamics displacement & extreme band crossings.
 *    - Source B: LLM Director narrative beat requests (`trigger_image`).
 *    - Strict Priority 1 (Director) > Priority 2 (Dynamics) arbitration with 1-image-per-round ceiling.
 * 2. Decoupled Cooldown Enforcers:
 *    - Independent cooldowns: 2 rounds for Director-explicit beats, 3 rounds for physics dynamics.
 * 3. Pure-JS Dynamics Evaluation (`evaluate_image_trigger`):
 *    - Signal A: Total displacement sum across all axes (`displacement_threshold = 60`).
 *    - Signal B: Band entry transitions into extreme ranges (`<= 15` or `>= 85`).
 *
 * Purity: 100% pure deterministic logic. Zero side effects, zero Svelte runes.
 */

import { DEFAULT_IMAGE_TIER, IMAGE_TIERS } from "./image-tiers.js";

// ============================================================================
// [SECTION 1: TRIGGER ENGINE CONFIGURATION & CONSTANTS]
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
  // Source A — Pure-JS Dynamics Gate thresholds (Signal B extreme band entry)
  band_high: 85,
  band_low: 15,
  // Source A — Signal A: sum of |Δaxis| across all axes
  displacement_threshold: 60,
  // Decoupled cooldowns:
  director_cooldown_rounds: 2,
  dynamics_cooldown_rounds: 3,
  // Default tier for dynamics-gate triggers
  default_tier: DEFAULT_IMAGE_TIER,
  // The unified 4-Tier Image Taxonomy
  tiers: IMAGE_TIERS,
});

/**
 * Entity identifiers that belong to character domain for tier precedence resolution.
 * @type {ReadonlySet<string>}
 */
const CHARACTER_DOMAIN_ENTITIES = Object.freeze(new Set(["ai", "user"]));

// ============================================================================
// [SECTION 2: DUAL-SOURCE ARBITRATION PIPELINE]
// ============================================================================

/**
 * Resolves whether an image beat should trigger with independent cooldown timers and Priority 1 arbitration.
 * @param {Object} params
 * @param {any} [params.snapshot] - Current entity dynamics snapshot
 * @param {any} [params.prev_dynamics] - Previous dynamics state
 * @param {any} [params.director_data] - Parsed Director output
 * @param {number} params.turn_round - Active round number
 * @param {number} [params.last_director_beat_round] - Last round Director triggered an image
 * @param {number} [params.last_dynamics_beat_round] - Last round Dynamics triggered an image
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
  const dir_last = Number.isInteger(last_director_beat_round) ? last_director_beat_round : -1;
  const dyn_last = Number.isInteger(last_dynamics_beat_round) ? last_dynamics_beat_round : -1;

  const director_cooldown_elapsed = dir_last < 0 || turn_round >= dir_last + IMAGE_TRIGGER.director_cooldown_rounds;
  const dynamics_cooldown_elapsed = dyn_last < 0 || turn_round >= dyn_last + IMAGE_TRIGGER.dynamics_cooldown_rounds;

  // 1. Evaluate Director Explicit Beat (Priority 1)
  const raw_trigger = typeof director_data?.trigger_image === "string" ? director_data.trigger_image.trim() : director_data?.trigger_image;
  const tier_from_string = typeof raw_trigger === "string" && IMAGE_TRIGGER.tiers.includes(raw_trigger) ? raw_trigger : null;
  const tier_from_pref =
    typeof director_data?.image_tier === "string" && IMAGE_TRIGGER.tiers.includes(director_data.image_tier) ? director_data.image_tier : null;
  const director_explicit = raw_trigger === true || raw_trigger === "true" || tier_from_string !== null;
  const director_qualifies = director_explicit && director_cooldown_elapsed;

  // 2. Evaluate Pure-JS Dynamics Gate (Priority 2)
  const image_trigger_eval = evaluate_image_trigger({ ai: snapshot?.ai?.dynamics, fractal: snapshot?.fractal?.dynamics }, prev_dynamics, {
    band_high: IMAGE_TRIGGER.band_high,
    band_low: IMAGE_TRIGGER.band_low,
    displacement_threshold: IMAGE_TRIGGER.displacement_threshold,
    default_tier: IMAGE_TRIGGER.default_tier,
  });
  const dynamics_qualifies = image_trigger_eval.triggered && dynamics_cooldown_elapsed;

  // 3. Priority Arbitration & 1-Image-Per-Round Ceiling
  let active = false;
  let tier = null;
  let source = null;
  let next_director_round = null;
  let next_dynamics_round = null;

  if (director_qualifies) {
    active = true;
    source = "director";
    tier = tier_from_string || tier_from_pref || IMAGE_TRIGGER.default_tier;
    next_director_round = turn_round;
  } else if (dynamics_qualifies) {
    active = true;
    source = "dynamics";
    tier = image_trigger_eval.tier || IMAGE_TRIGGER.default_tier;
    next_dynamics_round = turn_round;
  }

  return {
    active,
    tier,
    source,
    signals: image_trigger_eval.signals,
    next_director_round,
    next_dynamics_round,
    director_explicit,
  };
}

// ============================================================================
// [SECTION 3: PURE-JS DYNAMICS GATE EVALUATOR]
// ============================================================================

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
      const p = (previous || {})[entity] || {};
      const c = (current || {})[entity] || {};
      if (from === null && Number.isFinite(p[axis])) {
        from = p[axis];
        from_entity = entity;
      }
      if (to === null && Number.isFinite(c[axis])) {
        to = c[axis];
        to_entity = entity;
      }
    }

    // Guard against NaN poisoning
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

  // Tier precedence: character-domain entries win over environmental scenes
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
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied ground-up /refactor protocol: added Universal File Architecture header block,
 *   structured 3 explicit section dividers, sealed IMAGE_TRIGGER and CHARACTER_DOMAIN_ENTITIES with Object.freeze,
 *   standardized loop parameter identifiers (entities_set, entry), and verified unit test suite.
 * - 2026-08-28: Implemented decoupled cooldowns for Director vs Dynamics triggers and Priority 1 arbitration.
 */
