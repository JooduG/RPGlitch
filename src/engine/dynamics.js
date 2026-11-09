/**
 * src/engine/dynamics.js
 * ============================================================================
 * ⚙️ SOVEREIGN DYNAMICS SIMULATION & REDUCTION ENGINE
 * ============================================================================
 *
 * Owns mathematical physics, delta calculation, and somatic protocol evaluation.
 * Decoupled from declarative registries (which live in src/definitions/dynamics.js):
 * 1. Pure Dynamics Reducer & Baseline Settlement (reduce_dynamics, apply_dynamics_gravity)
 * 2. Dynamics Baseline Extraction (extract_entity_dynamics_baselines)
 * 3. Delta Computation for Telemetry (compute_dynamics_deltas)
 * 4. Subtext Protocol Evaluators (evaluate_subtext_protocols, evaluate_dynamics_rules)
 * ============================================================================
 */

import { clamp } from "../utils/math.js";
import { DYNAMICS_AXES, DYNAMICS_RULES } from "../definitions/dynamics.js";

/**
 * Pure functional dynamics reducer: applies caller-supplied deltas to a
 * dynamics snapshot, then settles every axis toward its baseline by a
 * deterministic gravity pull scaled from `entropy`. No randomness, no
 * mutation: inputs are never touched and the result is a frozen object.
 *
 * @param {Record<string, number>} [current={}] - Live dynamics snapshot
 * @param {Record<string, number>} [deltas={}] - Caller-supplied per-axis deltas
 * @param {Record<string, number>} [baselines={}] - Target baseline dynamics
 * @param {number} [entropy=50] - Environmental entropy level (0-100)
 * @returns {Readonly<Record<string, number>>} Next dynamics, clamped 0-100
 */
export function reduce_dynamics(current = {}, baselines = {}, entropy = 50, deltas = {}) {
  const next = {};
  const axes = new Set([...Object.keys(current || {}), ...Object.keys(deltas || {}), ...Object.keys(baselines || {})]);
  const rate = 0.08 * (1 - clamp(Number(entropy ?? 50), 0, 100) / 200);
  for (const axis of axes) {
    const start = Number(current?.[axis] ?? 50) + Number(deltas?.[axis] ?? 0);
    const target = Number(baselines?.[axis] ?? 50);
    next[axis] = clamp(Math.round(start + (target - start) * rate), 0, 100);
  }
  return Object.freeze(next);
}

/**
 * Applies baseline settlement gravity to an entity's live dynamics.
 * Non-destructive mutation: clamps final dynamic numbers between 0 and 100.
 *
 * @param {Record<string, number>} dynamics - Mutable live dynamics state to settle
 * @param {Record<string, number>} [baselines={}] - Target baseline dynamics
 * @param {number} [active_entropy=50] - Environmental entropy level controlling variance
 * @param {number} [base_gravity=0.08] - Base rate of gravity pull toward baselines
 * @param {Set<string>|null} [skip_axes=null] - Set of axis keys that should not settle
 */
export function apply_dynamics_gravity(dynamics, baselines = {}, active_entropy = 50, base_gravity = 0.08, skip_axes = null) {
  if (!dynamics || typeof dynamics !== "object") return;

  const variance = (active_entropy / 100) * 0.05;

  for (const axis of Object.keys(dynamics)) {
    if (skip_axes && skip_axes.has(axis)) continue;
    const target = baselines[axis] ?? 50;
    const randomized_gravity = base_gravity + (Math.random() * 2 - 1) * variance;
    const applied_gravity = clamp(randomized_gravity, 0, 1);

    const next_val = dynamics[axis] + (target - dynamics[axis]) * applied_gravity;
    dynamics[axis] = clamp(Math.round(next_val), 0, 100);
  }
}

/**
 * Extracts baseline dynamics from an entity.
 * @param {any} entity
 * @returns {Record<string, number>}
 */
export function extract_entity_dynamics_baselines(entity) {
  return entity?.dynamics_baseline || {};
}

/**
 * Computes dynamics deltas between turns for telemetry recording.
 * Pure calculation returning structured delta objects and formatted log entries.
 *
 * @param {string} target - Entity target identifier (e.g. "ai", "fractal")
 * @param {Record<string, number>} dynamics - Current turn dynamics
 * @param {any} runtime_target - Prior runtime state containing previous dynamics
 * @returns {{ deltas: Array<{ axis: string, target: string, old_value: number, new_value: number, diff: number }>, log_strings: string[] }}
 */
export function compute_dynamics_deltas(target, dynamics, runtime_target) {
  const deltas = [];
  const log_strings = [];
  const expected_scope = target === "fractal" ? "fractal" : "somatic";

  for (const [axis, val] of Object.entries(dynamics || {})) {
    if (DYNAMICS_AXES[axis]?.scope !== expected_scope) continue;
    const old_value = /** @type {any} */ (runtime_target)?.[axis] ?? 50;
    const diff = val - old_value;
    if (diff !== 0) {
      deltas.push({ axis, target, old_value, new_value: val, diff });
      const axis_label = DYNAMICS_AXES[axis]?.label || axis.charAt(0).toUpperCase() + axis.slice(1);
      log_strings.push(`${axis_label} ${diff > 0 ? "+" : ""}${diff}`);
    }
  }

  return { deltas, log_strings };
}

/**
 * Evaluates active subtext protocols and style triggers for current dynamics state.
 *
 * @param {object} [options={}]
 * @param {Record<string, number>} [options.ai_dynamics={}]
 * @param {Record<string, number>} [options.fractal_dynamics={}]
 * @param {object|null} [options.style=null]
 * @returns {Array<{ id: string, text?: string }>}
 */
export function evaluate_subtext_protocols({ ai_dynamics = {}, fractal_dynamics = {}, style = null } = {}) {
  const active = [];
  const d = { ...(fractal_dynamics || {}), ...(ai_dynamics || {}) };

  for (const rule of DYNAMICS_RULES) {
    if (rule.priority === undefined && typeof rule.when === "function") {
      if (rule.when(d)) {
        active.push({ id: rule.id });
      }
    }
  }

  if (style && typeof style === "object" && Array.isArray(style.triggers) && style.id !== "default") {
    for (const trigger of style.triggers) {
      if (typeof trigger.when === "function") {
        if (trigger.when(ai_dynamics, fractal_dynamics)) {
          active.push({ id: trigger.id, text: trigger.directive });
        }
      }
    }
  }

  return active;
}

/**
 * Evaluates entity dynamics against dynamic somatic rules and merges with manual keywords.
 * Returns up to `max_directives` active uppercase keyword IDs (e.g. `["FEAR", "DYSREGULATION"]`).
 *
 * @param {Record<string, number>} [dynamics={}] - Entity dynamics state
 * @param {string[]} [manual_keywords=[]] - Explicit manual or director keywords
 * @param {number} [max_directives=2] - Maximum number of active rule IDs to return
 * @returns {string[]} Ordered list of uppercase rule/keyword IDs
 */
export function evaluate_dynamics_rules(dynamics = {}, manual_keywords = [], max_directives = 2) {
  const result = [];
  const seen = new Set();

  if (Array.isArray(manual_keywords)) {
    for (const raw_keyword of manual_keywords) {
      if (typeof raw_keyword === "string" && raw_keyword.trim()) {
        const cleaned_keyword = raw_keyword.trim();
        const upper_keyword = cleaned_keyword.toUpperCase();
        if (!seen.has(upper_keyword)) {
          seen.add(upper_keyword);
          result.push(upper_keyword);
          if (result.length >= max_directives) return result;
        }
      }
    }
  }

  if (!dynamics || typeof dynamics !== "object") return result;

  const candidates = [];
  for (const rule of DYNAMICS_RULES) {
    if (rule.priority === undefined || seen.has(rule.id)) continue;
    if (typeof rule.when === "function" && rule.when(dynamics)) {
      candidates.push(rule);
    }
  }

  candidates.sort((first, second) => (second.priority || 0) - (first.priority || 0));

  for (const candidate of candidates) {
    if (!seen.has(candidate.id)) {
      seen.add(candidate.id);
      result.push(candidate.id);
      if (result.length >= max_directives) break;
    }
  }

  return result;
}
