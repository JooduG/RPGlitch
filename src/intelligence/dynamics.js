/**
 * src/intelligence/dynamics.js
 * ⚙️ DYNAMICS ENGINE — Physics engine slider metadata & settlement calculations.
 */

import { IMAGE_TRIGGER } from "../engine/config.js";

/**
 * Evaluates whether a turn's dynamics movement should trigger an automatic
 * image (the pure-JS gate — no LLM call).
 *
 * Signal B (band crossing): fires when an axis *enters* an extreme band this
 * turn — `(old < 85 && new >= 85) || (old > 15 && new <= 15)`. Leaving an
 * extreme band never triggers; a mid-band move like 76→74 triggers nothing.
 * Signal A (movement sum): fires when the sum of all |axis deltas| across the
 * six axes exceeds `sum_threshold` even if no band was entered.
 *
 * @param {Array<{ axis: string, target?: string, old_value?: number, new_value?: number, diff?: number }>} deltas
 * @returns {{ fired: boolean, crossed: boolean, sum: number, reasons: string[] }}
 */
export function evaluate_image_trigger(deltas = []) {
  const { extreme_high, extreme_low, sum_threshold } = IMAGE_TRIGGER;
  const reasons = [];

  if (Array.isArray(deltas)) {
    for (const d of deltas) {
      if (!d || typeof d.old_value !== "number" || typeof d.new_value !== "number") continue;
      const entered_high = d.old_value < extreme_high && d.new_value >= extreme_high;
      const entered_low = d.old_value > extreme_low && d.new_value <= extreme_low;
      if (entered_high || entered_low) {
        reasons.push(`crossed:${d.target ? `${d.target}.` : ""}${d.axis}`);
      }
    }
    const sum = deltas.reduce((acc, d) => acc + Math.abs(Number(d?.diff) || 0), 0);
    if (sum >= sum_threshold) {
      reasons.push(`sum:${Math.round(sum)}`);
    }
    return { fired: reasons.length > 0, crossed: reasons.some((r) => r.startsWith("crossed:")), sum, reasons };
  }
  return { fired: false, crossed: false, sum: 0, reasons };
}

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
