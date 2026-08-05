/**
 * src/intelligence/dynamics.js
 * ⚙️ DYNAMICS ENGINE — Physics engine slider metadata & settlement calculations.
 */

/**
 * @typedef {Object} AxisMeta
 * @property {string} label - UI display label
 * @property {string} desc - Axis description for LLM prompt legend calibration
 */

/** @type {Record<string, AxisMeta>} */
export const DYNAMICS_META = {
  // Character (Somatic) axes
  chaos: { label: "Chaos", desc: "Randomness vs Control" },
  intensity: { label: "Intensity", desc: "Internal Energy / Adrenaline" },
  openness: { label: "Openness", desc: "Receptivity vs Guardedness" },
  affinity: { label: "Affinity", desc: "Inter-Entity Bond / Empathy" },

  // Fractal (Environmental) axes
  velocity: { label: "Velocity", desc: "Environmental Pacing / Speed" },
  entropy: { label: "Entropy", desc: "Structural Reality / Weirdness" },
};

export const dynamics_engine = {
  /**
   * Evaluates and settles physics (Gravity & Clamping).
   * Used after the Director applies explicit state mutations to settle the physics before the next turn.
   * @param {Record<string, number>} dynamics - The current dynamics state for an entity
   * @param {Record<string, number>} [baselines={}] - The baseline gravitational centers
   * @param {number} [active_entropy=50] - The current world entropy (0-100)
   * @param {number} [base_gravity=0.1] - The baseline gravity strength (e.g. 0.1)
   */
  settle_physics(dynamics, baselines = {}, active_entropy = 50, base_gravity = 0.1) {
    if (!dynamics || typeof dynamics !== "object") return;

    // 1. Gravity Pull & Settlement (Clamp to 0-100 bounds)
    const variance = (active_entropy / 100) * 0.05;

    Object.keys(dynamics).forEach((axis) => {
      const target = baselines[axis] ?? 50;
      const randomized_gravity = base_gravity + (Math.random() * 2 - 1) * variance;
      const applied_gravity = Math.max(0, Math.min(1, randomized_gravity)); // Clamp [0, 1]

      const next_val = dynamics[axis] + (target - dynamics[axis]) * applied_gravity;
      dynamics[axis] = Math.max(0, Math.min(100, Math.round(next_val)));
    });
  },

  /**
   * @param {any} entity - The entity to extract baselines from.
   * @returns {Record<string, number>} The entity's baseline dynamics.
   */
  _get_baselines(entity) {
    return entity?.dynamicsBaseline || {};
  },
};

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
  const default_tier = options.default_tier ?? "story_scene";

  const entities = new Set([...Object.keys(current || {}), ...Object.keys(previous || {})]);
  const axis_names = new Set();
  for (const ent of entities) {
    for (const axis of Object.keys((current || {})[ent] || {})) axis_names.add(axis);
    for (const axis of Object.keys((previous || {})[ent] || {})) axis_names.add(axis);
  }

  const deltas = [];
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
      if (from === null && typeof p[axis] === "number") {
        from = p[axis];
        from_entity = ent;
      }
      if (to === null && typeof c[axis] === "number") {
        to = c[axis];
        to_entity = ent;
      }
    }
    if (from === null || to === null) continue;

    const delta = Math.round((to - from) * 10) / 10;
    deltas.push({ axis, from, to, delta, entity: to_entity || from_entity });
    displacement += Math.abs(to - from);

    if (!band_entry) {
      if (to >= band_high && from < band_high) {
        band_entry = { axis, from, to, band: "high" };
      } else if (to <= band_low && from > band_low) {
        band_entry = { axis, from, to, band: "low" };
      }
    }
  }

  displacement = Math.round(displacement * 10) / 10;
  const triggered = band_entry !== null || displacement >= displacement_threshold;

  return {
    triggered,
    signals: {
      band_entry,
      displacement,
      displacement_threshold,
    },
    tier: default_tier,
    deltas,
  };
}
