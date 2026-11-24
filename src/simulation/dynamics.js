/**
 * src/simulation/dynamics.js
 * ============================================================================
 * ⚙️ SOVEREIGN DYNAMICS SIMULATION (Rank 1, pure simulation)
 * ============================================================================
 *
 * Canonical home for mathematical physics, delta calculation, and somatic
 * protocol evaluation. Decoupled from the declarative registries (which live
 * in `src/definitions/dynamics-registry.js`):
 * 1. Pure turn-step reducer (`step_dynamics`)
 * 2. Dynamics baseline extraction (`extract_metric_baselines`)
 * 3. Subtext/dynamic directive evaluation (`evaluate_dynamics_directives`)
 * 4. Caretaker rotation (`CARETAKER_ROTATION`, `resolve_caretaker_target`)
 *
 * Phase 2 unification: `reduce_dynamics` + `apply_dynamics_gravity` +
 * `apply_director_deltas_to_dynamics` + `compute_dynamics_deltas` into
 * `step_dynamics`; `evaluate_subtext_protocols` + `evaluate_dynamics_rules`
 * into `evaluate_dynamics_directives`.
 *
 * Pure, stateless, deterministic (no randomness unless `jitter: true`).
 * Imports only Rank 0 (`@config`, `@definitions`, `@utils`).
 * ============================================================================
 */

import { DYNAMICS } from "@config";
import { DYNAMICS_RULES } from "@definitions";
import { clamp } from "@utils";

/**
 * Pure functional turn-step reducer: applies caller-supplied deltas to a
 * dynamics snapshot, then settles every axis toward its baseline by a
 * deterministic gravity pull scaled from `entropy`. Inputs are never touched
 * and the result is a frozen object.
 *
 * @param {Record<string, number>} [current={}] - Live dynamics snapshot
 * @param {Record<string, number>} [baselines={}] - Target baseline dynamics
 * @param {Record<string, number>} [deltas={}] - Caller-supplied per-axis deltas
 * @param {object} [options={}]
 * @param {number} [options.entropy=50] - Environmental entropy level (0-100)
 * @param {number} [options.min=5] - Lower clamp bound for the turn pipeline band
 * @param {number} [options.max=95] - Upper clamp bound for the turn pipeline band
 * @param {boolean} [options.jitter=false] - Randomize gravity per axis (legacy gravity path)
 * @param {string|null} [options.scope=null] - Restrict settlement to a DYNAMICS scope ("somatic"|"fractal")
 * @param {string|null} [options.target=null] - Label used for the returned diff records
 * @returns {{ next: Readonly<Record<string, number>>, diffs: Array<{ axis: string, target: string|null, old_value: number, new_value: number, diff: number }>, log_strings: string[] }}
 */
export function step_dynamics(
  current = {},
  baselines = {},
  deltas = {},
  { entropy = 50, min = 5, max = 95, jitter = false, scope = null, target = null } = {},
) {
  const next = {};
  const diffs = [];
  const log_strings = [];
  const axes = new Set([...Object.keys(current || {}), ...Object.keys(deltas || {}), ...Object.keys(baselines || {})]);
  const active_entropy = Number(entropy ?? 50);
  const rate = DYNAMICS.PHYSICS.GRAVITY * (1 - clamp(active_entropy, 0, 100) / 200);
  const variance = (active_entropy / 100) * DYNAMICS.PHYSICS.VARIANCE;

  for (const axis of axes) {
    if (scope && DYNAMICS[axis.toUpperCase()]?.scope !== scope) continue;
    const start = Number(current?.[axis] ?? 50) + Number(deltas?.[axis] ?? 0);
    const baseline = Number(baselines?.[axis] ?? 50);
    const axis_rate = jitter ? clamp(DYNAMICS.PHYSICS.GRAVITY + (Math.random() * 2 - 1) * variance, 0, 1) : rate;
    const settled = start + (baseline - start) * axis_rate;
    const value = clamp(Math.round(settled), min, max);
    next[axis] = value;

    const old_value = Number(current?.[axis] ?? 50);
    const diff = value - old_value;
    if (diff !== 0) {
      diffs.push({ axis, target, old_value, new_value: value, diff });
      const axis_label = DYNAMICS[axis.toUpperCase()]?.label || axis.charAt(0).toUpperCase() + axis.slice(1);
      log_strings.push(`${axis_label} ${diff > 0 ? "+" : ""}${diff}`);
    }
  }

  return { next: Object.freeze(next), diffs, log_strings };
}

/**
 * Evaluates active subtext protocols and dynamic somatic rules for the current
 * dynamics state, merged with manual/director keywords. Returns up to
 * `max_directives` ordered directive IDs plus any style-triggered protocol
 * texts.
 *
 * @param {object} [options={}]
 * @param {Record<string, number>} [options.ai_dynamics={}]
 * @param {Record<string, number>} [options.fractal_dynamics={}]
 * @param {object|null} [options.style=null]
 * @param {string[]} [options.manual_keywords=[]]
 * @param {number} [options.max_directives=2]
 * @returns {{ directives: string[], protocols: Array<{ id: string, text?: string }> }}
 */
export function evaluate_dynamics_directives({ ai_dynamics = {}, fractal_dynamics = {}, style = null, manual_keywords = [], max_directives = 2 } = {}) {
  const directives = [];
  const seen = new Set();
  const protocols = [];

  if (Array.isArray(manual_keywords)) {
    for (const raw_keyword of manual_keywords) {
      if (typeof raw_keyword === "string" && raw_keyword.trim()) {
        const upper_keyword = raw_keyword.trim().toUpperCase();
        if (!seen.has(upper_keyword)) {
          seen.add(upper_keyword);
          directives.push(upper_keyword);
          if (directives.length >= max_directives) return { directives, protocols };
        }
      }
    }
  }

  const merged = { ...(fractal_dynamics || {}), ...(ai_dynamics || {}) };

  for (const rule of DYNAMICS_RULES) {
    if (rule.priority === undefined && typeof rule.when === "function") {
      if (rule.when(merged)) {
        protocols.push({ id: rule.id });
      }
    }
  }

  if (style && typeof style === "object" && Array.isArray(style.triggers) && style.id !== "default") {
    for (const trigger of style.triggers) {
      if (typeof trigger.when === "function") {
        if (trigger.when(ai_dynamics, fractal_dynamics)) {
          protocols.push({ id: trigger.id, text: trigger.directive });
        }
      }
    }
  }

  const candidates = [];
  for (const rule of DYNAMICS_RULES) {
    if (rule.priority === undefined || seen.has(rule.id)) continue;
    if (typeof rule.when === "function" && rule.when(merged)) {
      candidates.push(rule);
    }
  }

  candidates.sort((first, second) => (second.priority || 0) - (first.priority || 0));

  for (const candidate of candidates) {
    if (!seen.has(candidate.id)) {
      seen.add(candidate.id);
      directives.push(candidate.id);
      if (directives.length >= max_directives) break;
    }
  }

  return { directives, protocols };
}

/** Default round-robin entity rotation for Turn 3 Caretaker consolidation */
const CARETAKER_ROTATION = Object.freeze(["AI", "USER", "FRACTAL"]);

/**
 * Resolves which entity key is targeted for Caretaker consolidation.
 * Rotates sequentially across AI -> USER -> FRACTAL (+ any active NPC).
 *
 * @param {number} cursor_or_round - Active cursor index or round number
 * @param {object} [entities={}]
 * @param {boolean} [use_cursor=false] - Whether cursor_or_round is an absolute 0-indexed cursor
 * @returns {string} Target entity key (e.g., 'AI', 'USER', 'FRACTAL', 'NPC')
 */
export function resolve_caretaker_target(cursor_or_round, entities = {}, use_cursor = false) {
  const cast = [...CARETAKER_ROTATION];
  if (entities.NPC && entities.NPC.id) {
    cast.push("NPC");
  }
  const index =
    use_cursor ? Math.abs(Math.floor(Number(cursor_or_round) || 0)) % cast.length : Math.abs(Math.floor(Number(cursor_or_round) || 1) - 1) % cast.length;
  return cast[index];
}

/**
 * Evaluates whether dynamics deltas or band crossings trigger an image beat.
 * Pure per-entity axis comparison: each entity's current value is compared
 * against ITS OWN previous value (never against another entity's band), so
 * cross-entity from/to attribution cannot fabricate phantom deltas.
 * @param {Record<string, any>} [current={}]
 * @param {Record<string, any>} [previous={}]
 * @param {Record<string, any>} [options={}]
 * @returns {{ triggered: boolean, signals: any, tier: string, deltas: any[] }}
 */
export function evaluate_image_trigger(current = {}, previous = {}, options = {}) {
  const band_high = options.BAND_HIGH ?? 85;
  const band_low = options.BAND_LOW ?? 15;
  const displacement_threshold = options.DISPLACEMENT_THRESHOLD ?? 50;
  const default_tier = options.DEFAULT_TIER ?? "story_scene";

  const entities_set = new Set([...Object.keys(current || {}), ...Object.keys(previous || {})]);
  const character_domain_entities = new Set(["ai", "user"]);

  const deltas = [];
  const band_entries = [];
  let band_entry = null;
  let displacement = 0;

  for (const entity of entities_set) {
    const previous_entity_dynamics = (previous || {})[entity] || {};
    const current_entity_dynamics = (current || {})[entity] || {};
    const axis_names = new Set([...Object.keys(previous_entity_dynamics), ...Object.keys(current_entity_dynamics)]);

    for (const axis of axis_names) {
      const from = previous_entity_dynamics[axis];
      const to = current_entity_dynamics[axis];
      if (!Number.isFinite(from) || !Number.isFinite(to)) continue;

      const delta = Math.round((to - from) * 10) / 10;
      deltas.push({ axis, from, to, delta, entity });
      displacement += Math.abs(to - from);

      if (to >= band_high && from < band_high) {
        band_entries.push({ axis, from, to, band: "high", entity });
        if (!band_entry) band_entry = { axis, from, to, band: "high" };
      } else if (to <= band_low && from > band_low) {
        band_entries.push({ axis, from, to, band: "low", entity });
        if (!band_entry) band_entry = { axis, from, to, band: "low" };
      }
    }
  }

  displacement = Math.round(displacement * 10) / 10;
  const triggered = band_entry !== null || displacement >= displacement_threshold;

  const character_band_entry = band_entries.find((entry) => character_domain_entities.has(entry.entity));
  const tier =
    character_band_entry ? "story_character"
    : band_entries.length > 0 ? "story_scene"
    : default_tier;

  return { triggered, signals: { band_entry, displacement, displacement_threshold }, tier, deltas };
}
