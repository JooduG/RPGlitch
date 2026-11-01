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
        input: userText.trim(),
        director_enabled: this.director_enabled,
        onChunk: options.onChunk,
      });

      // Record director deltas in DevMode log if present
      if (outcome.director_staging) {
        dev_log.record("DYNAMICS_DELTA", outcome.director_staging.dynamics_deltas);
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
