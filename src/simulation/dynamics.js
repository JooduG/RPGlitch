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
 * 2. Subtext/dynamic directive evaluation (`evaluate_dynamics_directives`)
 * 3. Caretaker rotation (`CARETAKER_ROTATION`, `resolve_caretaker_target`)
 * 4. Image trigger evaluation (`resolve_image_trigger`)
 *
 * Pure, stateless, deterministic.
 * Imports only Rank 0 (`@config`, `@definitions`, `@utils`).
 * ============================================================================
 */

import { DYNAMICS, IMAGE_POLICY, TEMPO_ROUNDS } from "@config";
import { DYNAMICS_RULES, default_dynamics_for_scope } from "@definitions";
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
 * @param {string|null} [options.scope=null] - Restrict settlement to a DYNAMICS scope ("character"|"fractal")
 * @returns {Readonly<Record<string, number>>}
 */
export function step_dynamics(current = {}, baselines = {}, deltas = {}, { entropy = 50, scope = null } = {}) {
  const next = {};
  const axes = new Set([...Object.keys(current), ...Object.keys(deltas), ...Object.keys(baselines)]);
  const rate = DYNAMICS.PHYSICS.GRAVITY * (1 - clamp(Number(entropy), 0, 100) / 200);

  for (const axis of axes) {
    if (scope && DYNAMICS.AXES[axis]?.scope !== scope) continue;
    const start = Number(current[axis] ?? 50) + Number(deltas[axis] ?? 0);
    const baseline = Number(baselines[axis] ?? 50);
    const settled = start + (baseline - start) * rate;
    next[axis] = clamp(Math.round(settled), 5, 95);
  }

  return Object.freeze(next);
}

/**
 * Evaluates all active dynamics rules for the current dynamics state.
 *
 * @param {object} [options={}]
 * @param {Record<string, number>} [options.ai_dynamics={}]
 * @param {Record<string, number>} [options.fractal_dynamics={}]
 * @returns {Array<{ id: string, text?: string }>}
 */
export function evaluate_dynamics_directives({ ai_dynamics = {}, fractal_dynamics = {} } = {}) {
  const merged = { ...default_dynamics_for_scope("fractal"), ...default_dynamics_for_scope("character"), ...fractal_dynamics, ...ai_dynamics };
  const protocols = [];

  for (const rule of DYNAMICS_RULES) {
    if (rule.when(merged)) {
      protocols.push({ id: rule.id, text: rule.directive });
    }
  }

  return protocols;
}

/** Default round-robin entity rotation for Turn 3 Caretaker consolidation */
const CARETAKER_ROTATION = Object.freeze(["AI", "USER", "FRACTAL"]);

/**
 * Resolves which entity key is targeted for Caretaker consolidation.
 * Rotates sequentially across AI -> USER -> FRACTAL by 0-indexed cursor.
 *
 * @param {number} [cursor=0] - 0-indexed Caretaker rotation cursor
 * @returns {string} Target entity key ('AI', 'USER', or 'FRACTAL')
 */
export function resolve_caretaker_target(cursor = 0) {
  const index = Math.abs(Math.floor(Number(cursor) || 0)) % CARETAKER_ROTATION.length;
  return CARETAKER_ROTATION[index];
}

/**
 * Resolves whether an image beat should trigger under a single shared cooldown
 * across all image-beat sources, biasing tier selection from `camera_note`
 * and current somatic dynamics.
 *
 * @param {object} parameters
 * @param {any} [parameters.snapshot] - Current entity dynamics snapshot
 * @param {any} [parameters.prev_dynamics] - Previous dynamics state
 * @param {object} [parameters.director_data] - Parsed Director output
 * @param {number} parameters.turn_round - Active round number
 * @param {number} [parameters.last_image_beat_round] - Last round any image beat triggered
 * @returns {{ active: boolean, tier: string | null, next_image_beat_round: number | null }}
 */
export function resolve_image_trigger({ snapshot, prev_dynamics, director_data, turn_round, last_image_beat_round }) {
  const last_round = Number.isInteger(last_image_beat_round) ? last_image_beat_round : -1;
  const cooldown_elapsed = last_round < 0 || turn_round >= last_round + TEMPO_ROUNDS.FAST;

  const band_high = DYNAMICS.SCALE.EXTREME_HIGH;
  const band_low = DYNAMICS.SCALE.EXTREME_LOW;
  let displacement = 0;
  let ai_band_crossed = false;
  let fractal_band_crossed = false;

  for (const [entity_key, current_entity_dynamics] of [
    ["ai", snapshot?.ai?.dynamics],
    ["fractal", snapshot?.fractal?.dynamics],
  ]) {
    const prev_entity_dynamics = prev_dynamics?.[entity_key] || {};
    const curr_entity_dynamics = current_entity_dynamics || {};
    for (const axis of new Set([...Object.keys(prev_entity_dynamics), ...Object.keys(curr_entity_dynamics)])) {
      const from = prev_entity_dynamics[axis];
      const to = curr_entity_dynamics[axis];
      if (!Number.isFinite(from) || !Number.isFinite(to)) continue;

      displacement += Math.abs(to - from);
      const crossed = (to >= band_high && from < band_high) || (to <= band_low && from > band_low);
      if (crossed) {
        if (entity_key === "ai") ai_band_crossed = true;
        else fractal_band_crossed = true;
      }
    }
  }

  const triggered = ai_band_crossed || fractal_band_crossed || displacement >= IMAGE_POLICY.DISPLACEMENT_THRESHOLD;
  const active = triggered && cooldown_elapsed;
  if (!active) {
    return { active: false, tier: null, next_image_beat_round: null };
  }

  const raw_camera_note = typeof director_data?.camera_note === "string" ? director_data.camera_note.trim() : "";
  const has_camera_note = Boolean(raw_camera_note);

  // Character Optics Biasing (Anti-Wide Angle Lock):
  // Environmental/panoramic camera_note cues preserve scene tier over character bias.
  const ai_dynamics = snapshot?.ai?.dynamics || {};
  const current_intensity = Number(ai_dynamics.intensity ?? DYNAMICS.SCALE.MID);
  const current_affinity = Number(ai_dynamics.affinity ?? DYNAMICS.SCALE.MID);
  const staging_has_scene_focus =
    has_camera_note &&
    /\b(?:wide|panoramic|landscape|establishing|environment|aerial|distant|overview|scenery|room|corridor|cityscape|horizon)\b/i.test(raw_camera_note);
  const staging_has_character_focus =
    has_camera_note &&
    /\b(?:close-?ups?|portraits?|faces?|eyes?|expressions?|intimate|intimacy|confrontations?|clutch(?:es|ed|ing)?|hold(?:s|ing)?|held|holding|combats?|wounds?|wounded|touch(?:es|ed|ing)?|profiles?|headshots?)\b/i.test(
      raw_camera_note,
    );
  const dynamics_have_character_focus = current_intensity >= DYNAMICS.SCALE.HIGH || current_affinity >= DYNAMICS.SCALE.HIGH;
  const biased_character_tier = !staging_has_scene_focus && (staging_has_character_focus || dynamics_have_character_focus) ? "story_character" : null;

  const band_tier =
    ai_band_crossed ? "story_character"
    : fractal_band_crossed ? "story_scene"
    : null;
  const tier = band_tier || biased_character_tier || IMAGE_POLICY.DEFAULT_TIER;

  return { active: true, tier, next_image_beat_round: turn_round };
}
