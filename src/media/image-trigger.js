/**
 * @file src/media/image-trigger.js
 * 🖼️ IMAGE TRIGGER ENGINE
 * Decides WHEN an image beat fires: pure-JS dynamics gate + LLM director
 * intent, gated by a shared cooldown. Pure — no reactivity or state.
 */

import { DEFAULT_IMAGE_TIER, IMAGE_TIERS } from "./image-tiers.js";

/**
 * 🖼️ IMAGE TRIGGER ENGINE CONFIG
 * Dual-source automatic image generation (pure-JS dynamics gate + LLM director),
 * with decoupled cooldowns and strict Priority 1 (Director) > Priority 2 (Dynamics) arbitration.
 */
export const IMAGE_TRIGGER = {
  // Source A — Pure-JS Dynamics Gate thresholds (Signal B band entry)
  band_high: 85,
  band_low: 15,
  // Source A — Signal A: sum of |Δaxis| across all six axes
  displacement_threshold: 60,
  // Decoupled cooldowns:
  // Director-explicit narrative beats: 2 rounds
  director_cooldown_rounds: 2,
  // Physics / dynamics displacement & band crossings: 3 rounds
  dynamics_cooldown_rounds: 3,
  // Default tier for dynamics-gate triggers.
  default_tier: DEFAULT_IMAGE_TIER,
  // The unified 4-Tier Image Taxonomy.
  tiers: IMAGE_TIERS,
};

/**
 * Resolves whether an image beat should trigger (Dual-source: Dynamics Gate + LLM Director)
 * with independent cooldown timers, Priority 1 (Director) arbitration, and a 1-image-per-round ceiling.
 * @param {Object} params
 * @param {any} params.snapshot - Current entity dynamics snapshot
 * @param {any} params.prev_dynamics - Previous dynamics state
 * @param {any} params.director_data - Parsed Director output
 * @param {number} params.turn_round - Active round number
 * @param {number} [params.last_director_beat_round] - Last round Director triggered an image
 * @param {number} [params.last_dynamics_beat_round] - Last round Dynamics triggered an image
 * @param {number} [params.last_auto] - Backwards-compatible single cooldown timestamp fallback
 * @returns {{ active: boolean, tier: string|null, source: 'director'|'dynamics'|null, signals: any, next_director_round: number|null, next_dynamics_round: number|null, director_explicit: boolean }}
 */
export function resolve_image_trigger({
  snapshot,
  prev_dynamics,
  director_data,
  turn_round,
  last_director_beat_round,
  last_dynamics_beat_round,
  last_auto,
}) {
  const dir_last = Number.isInteger(last_director_beat_round) ? last_director_beat_round : (last_auto ?? -1);
  const dyn_last = Number.isInteger(last_dynamics_beat_round) ? last_dynamics_beat_round : (last_auto ?? -1);

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
    // Priority 1 wins — dynamics timer is NOT consumed
    active = true;
    source = "director";
    tier = tier_from_string || tier_from_pref || IMAGE_TRIGGER.default_tier;
    next_director_round = turn_round;
  } else if (dynamics_qualifies) {
    // Priority 2 triggers
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

/**
 * 🖼️ EVALUATE IMAGE TRIGGER — Source A: Pure-JS Dynamics Gate.
 *
 * Runs deterministically (no LLM call) after director settlement to decide whether
 * an automatic image beat should fire this round.
 *
 * Signals:
 *  - Signal B (Band Entry): any axis ENTERS an extreme band (>= band_high or <= band_low).
 *    Transitioning INTO the band triggers (82 -> 88, 18 -> 12). Leaving the band
 *    (88 -> 74) or moving within the band (76 -> 74) never triggers.
 *  - Signal A (Movement Displacement): the sum of |Δaxis| across all six axes
 *    exceeds `displacement_threshold`.
 *
 * @param {Record<string, Record<string, number>>} current - Post-director-settlement dynamics, keyed by entity (`ai` / `fractal`), each an axis map.
 * @param {Record<string, Record<string, number>>} previous - Pre-turn dynamics (last settled state), same nested shape.
 * @param {object} [options]
 * @param {number} [options.band_high=85]
 * @param {number} [options.band_low=15]
 * @param {number} [options.displacement_threshold=60]
 * @param {string} [options.default_tier="story_scene"]
 * @returns {{ triggered: boolean, signals: { band_entry: { axis: string, from: number, to: number, band: "high"|"low" } | null, displacement: number, displacement_threshold: number }, tier: string, deltas: Array<{ axis: string, from: number, to: number, delta: number }> }}
 */
export function evaluate_image_trigger(current = {}, previous = {}, options = {}) {
  const band_high = options.band_high ?? 85;
  const band_low = options.band_low ?? 15;
  const displacement_threshold = options.displacement_threshold ?? 60;
  const default_tier = options.default_tier ?? DEFAULT_IMAGE_TIER;

  // Entity keys that belong to the character domain (portraits) rather than the
  // environmental domain (scenes). Used to break multi-axis band-entry ties.
  const CHARACTER_DOMAIN_ENTITIES = new Set(["ai", "user"]);

  const entities = new Set([...Object.keys(current || {}), ...Object.keys(previous || {})]);
  const axis_names = new Set();
  for (const ent of entities) {
    for (const axis of Object.keys((current || {})[ent] || {})) axis_names.add(axis);
    for (const axis of Object.keys((previous || {})[ent] || {})) axis_names.add(axis);
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
    for (const ent of entities) {
      const p = (previous || {})[ent] || {};
      const c = (current || {})[ent] || {};
      if (from === null && Number.isFinite(p[axis])) {
        from = p[axis];
        from_entity = ent;
      }
      if (to === null && Number.isFinite(c[axis])) {
        to = c[axis];
        to_entity = ent;
      }
    }
    // Guard against NaN poisoning: any non-finite axis value is skipped entirely
    // so it can't corrupt the displacement sum or band-entry math.
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

  // Tier precedence when multiple axes cross extreme bands in one turn:
  // character-domain entries (story_character) win over environmental (story_scene);
  // plain displacement triggers fall through to the configured default tier.
  const character_band_entry = band_entries.find((be) => CHARACTER_DOMAIN_ENTITIES.has(be.entity));
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
