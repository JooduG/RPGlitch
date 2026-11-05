/**
 * src/engine/kernel.svelte.js
 * ============================================================================
 * 📜 SOVEREIGN SIMULATION KERNEL & REACTIVE CONTROLLER
 * ============================================================================
 *
 * Single authoritative Svelte 5 state class owning:
 * - Active entities: user, ai, fractal
 * - Macro chronological state: round, phase ('idle' | 'generating' | 'locked')
 * - Dialogue transcript history
 * - Turn execution dispatch via pure headless turns.js orchestrator
 * ============================================================================
 */

import { execute_round } from "./turns.js";
import { create_transport } from "./transport.js";
import { dev_log } from "./dev.svelte.js";

export class Kernel {
  user = $state(null);
  ai = $state(null);
  fractal = $state(null);
  round = $state(0);
  phase = $state("idle"); // "idle" | "generating" | "locked"
  history = $state([]);
  error = $state(null);
  director_enabled = $state(false);

  constructor(options = {}) {
    this.user = options.user || null;
    this.ai = options.ai || null;
    this.fractal = options.fractal || null;
    this.round = options.round || 0;
    this.director_enabled = options.director_enabled || false;
    this.transport = options.transport || create_transport();
  }

  /**
   * Submits a user message and executes the next simulation round.
   * Increments the macro round counter upon submission.
   *
   * @param {string} userText
   * @param {object} [options]
   * @param {(chunk: string) => void} [options.onChunk]
   * @returns {Promise<object>} The completed round outcome
   */
  async submit_turn(userText, options = {}) {
    if (!userText || typeof userText !== "string") return null;
    if (this.phase === "locked" || this.phase === "generating") {
      throw new Error("Simulation is locked or actively generating.");
    }

    this.phase = "generating";
    this.error = null;
    const previous_round = this.round;
    const previous_history_length = this.history.length;
    const previous_ai_dynamics = this.ai?.dynamics ? { ...this.ai.dynamics } : null;
    const previous_fractal_dynamics = this.fractal?.dynamics ? { ...this.fractal.dynamics } : null;
    const previous_user_dynamics = this.user?.dynamics ? { ...this.user.dynamics } : null;
    this.round += 1;

    // Append user turn to history
    this.history.push({
      role: "user",
      text: userText.trim(),
      round: this.round,
    });

    try {
      const entities = {
        AI: this.ai,
        USER: this.user,
        FRACTAL: this.fractal,
      };

      const outcome = await execute_round({
        transport: this.transport,
        round: this.round,
        entities,
        history: this.history,
        director_enabled: this.director_enabled,
        onChunk: options.onChunk,
      });

      // Apply director deltas to active entity dynamics with [5, 95] clamping
      if (outcome.director_staging?.dynamics_deltas) {
        const deltas = outcome.director_staging.dynamics_deltas;
        dev_log.record("DYNAMICS_DELTA", deltas);

        if (this.ai && typeof this.ai.dynamics === "object") {
          for (const key of ["chaos", "intensity", "openness", "affinity"]) {
            if (deltas[key] !== undefined && this.ai.dynamics[key] !== undefined) {
              const current = Number(this.ai.dynamics[key]) || 50;
              this.ai.dynamics[key] = Math.max(5, Math.min(95, current + deltas[key]));
            }
          }
        }
        if (this.fractal && typeof this.fractal.dynamics === "object") {
          for (const key of ["velocity", "entropy"]) {
            if (deltas[key] !== undefined && this.fractal.dynamics[key] !== undefined) {
              const current = Number(this.fractal.dynamics[key]) || 50;
              this.fractal.dynamics[key] = Math.max(5, Math.min(95, current + deltas[key]));
            }
          }
        }
      }

      dev_log.record("TURN_TEMPO", { tempo: outcome.character_turn.turn_tempo });

      // Append assistant turn to history
      this.history.push({
        role: "model",
        text: outcome.character_turn.prose,
        think: outcome.character_turn.think,
        round: this.round,
      });

      return outcome;
    } catch (err) {
      // Transactional rollback on mid-stream failure to prevent orphan user turns or partial dynamics
      this.history.length = previous_history_length;
      this.round = previous_round;
      if (previous_ai_dynamics && this.ai?.dynamics) {
        Object.assign(this.ai.dynamics, previous_ai_dynamics);
      }
      if (previous_fractal_dynamics && this.fractal?.dynamics) {
        Object.assign(this.fractal.dynamics, previous_fractal_dynamics);
      }
      if (previous_user_dynamics && this.user?.dynamics) {
        Object.assign(this.user.dynamics, previous_user_dynamics);
      }
      this.error = err.message || String(err);
      dev_log.record("ERROR", { message: this.error, round: this.round });
      throw err;
    } finally {
      this.phase = "idle";
    }
  }

  /**
   * Rewinds simulation to target round.
   *
   * @param {number} targetRound
   */
  rewind_to_round(targetRound) {
    if (targetRound < 0) return;
    this.history = this.history.filter((h) => h.round <= targetRound);
    this.round = targetRound;
    this.phase = "idle";
    this.error = null;
  }
}
