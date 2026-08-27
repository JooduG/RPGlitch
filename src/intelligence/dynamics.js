/**
 * src/intelligence/dynamics.js
 * ⚙️ DYNAMICS ENGINE — Physics engine slider metadata, settlement calculations,
 * and the DYNAMICS_SIGNALS prompt-directive registry.
 */

import { GLOBAL_TRIGGERS, evaluate_automatic_somatics, DYNAMICS_META } from "@data";
export { evaluate_automatic_somatics, DYNAMICS_META };

export const dynamics_engine = {
  /**
   * Evaluates and settles physics (Gravity & Clamping).
   * Used after the Director applies explicit state mutations to settle the physics before the next turn.
   * @param {Record<string, number>} dynamics - The current dynamics state for an entity
   * @param {Record<string, number>} [baselines={}] - The baseline gravitational centers
   * @param {number} [active_entropy=50] - The current world entropy (0-100)
   * @param {number} [base_gravity=0.1] - The baseline gravity strength (e.g. 0.1)
   * @param {Set<string>|null} [skip_axes=null] - Axes the Director explicitly calibrated this turn; they are exempt from gravity so its deltas stay authoritative.
   */
  settle_physics(dynamics, baselines = {}, active_entropy = 50, base_gravity = 0.1, skip_axes = null) {
    if (!dynamics || typeof dynamics !== "object") return;

    // 1. Gravity Pull & Settlement (Clamp to 0-100 bounds)
    const variance = (active_entropy / 100) * 0.05;

    Object.keys(dynamics).forEach((axis) => {
      if (skip_axes && skip_axes.has(axis)) return;
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
    return entity?.dynamics_baseline || {};
  },
};

/**
 * Computes dynamics deltas for a single target (ai or fractal) and appends to accumulators.
 * @param {string} target
 * @param {Record<string, number>} dynamics
 * @param {any} runtime_target
 * @param {any[]} deltas
 * @param {string[]} log_strings
 */
export function compute_deltas(target, dynamics, runtime_target, deltas, log_strings) {
  Object.entries(dynamics).forEach(([axis, val]) => {
    const old_value = /** @type {any} */ (runtime_target)?.[axis] ?? 50;
    const diff = val - old_value;
    if (diff !== 0) {
      deltas.push({ axis, target, old_value, new_value: val, diff });

      const capitalized_axis = axis.charAt(0).toUpperCase() + axis.slice(1);
      log_strings.push(`${capitalized_axis} ${diff > 0 ? "+" : ""}${diff}`);
    }
  });
}

/**
 * Evaluates active physics signals and style triggers for current dynamics.
 * Single-pass evaluator for both baseline global signals and narrative style triggers.
 *
 * @param {Record<string, number>|{ ai_dynamics?: Record<string, number>, fractal_dynamics?: Record<string, number>, style?: object }} [ai_dynamics={}]
 * @param {Record<string, number>} [fractal_dynamics={}]
 * @param {object|null} [style=null]
 * @returns {Array<{ id: string, text: string }>}
 */
export function evaluate_dynamics_signals(ai_dynamics = {}, fractal_dynamics = {}, style = null) {
  let ai = ai_dynamics || {};
  let fractal = fractal_dynamics || {};
  let active_style = style;

  if (
    ai_dynamics &&
    typeof ai_dynamics === "object" &&
    (ai_dynamics.ai_dynamics || ai_dynamics.fractal_dynamics || ai_dynamics.style !== undefined)
  ) {
    ai = ai_dynamics.ai_dynamics || {};
    fractal = ai_dynamics.fractal_dynamics || {};
    active_style = ai_dynamics.style || null;
  }

  const active = [];

  for (const trigger of GLOBAL_TRIGGERS) {
    if (typeof trigger.when === "function") {
      try {
        if (trigger.when(ai, fractal)) {
          active.push({ id: trigger.id, text: trigger.directive });
        }
      } catch (_err) {
        /* ignore error */
      }
    }
  }

  if (active_style && typeof active_style === "object" && Array.isArray(active_style.triggers) && active_style.id !== "default") {
    for (const trigger of active_style.triggers) {
      if (typeof trigger.when === "function") {
        try {
          if (trigger.when(ai, fractal)) {
            active.push({ id: trigger.id, text: trigger.directive });
          }
        } catch (_err) {
          /* ignore error */
        }
      }
    }
  }

  return active;
}

/**
 * Renders the active narrative signals as a <DYNAMICS_SIGNALS> XML block.
 * @param {Record<string, number>} [ai_dynamics]
 * @param {Record<string, number>} [fractal_dynamics]
 * @param {{ style?: object }} [options]
 * @returns {string} XML block string, or "" when no signals are active.
 */
export function build_signals_xml(ai_dynamics = {}, fractal_dynamics = {}, options = {}) {
  const active = evaluate_dynamics_signals(ai_dynamics, fractal_dynamics, options?.style);
  if (active.length === 0) return "";
  const inner = active.map((s) => `      • ${s.text}`).join("\n");
  return `    <DYNAMICS_SIGNALS>\n${inner}\n    </DYNAMICS_SIGNALS>`;
}
