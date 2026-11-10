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

import { execute_round, execute_turn_2_continue } from "./turns.js";

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
    // Transport is always injected live (gate-backed adapter from transport.js);
    // this stub only throws a legible error if a bare Kernel ever streams.
    this.transport = options.transport || {
      stream() {
        throw new Error("Kernel requires an injected transport (e.g. get_transport()).");
      },
    };
  }

  /**
   * Submits a user message and executes the next simulation round.
   * Increments the macro round counter upon submission (unless options.is_retry is set).
   * Accepts empty string or omitted userText when options.is_retry or options.is_continue is set.
   *
   * @param {string} userText
   * @param {object} [options]
   * @param {(chunk: string) => void} [options.onChunk]
   * @param {AbortSignal} [options.signal]
   * @param {boolean} [options.is_retry]
   * @param {boolean} [options.is_continue]
   * @returns {Promise<object>} The completed round outcome
   */
  async submit_turn(userText, options = {}) {
    const is_resubmit = Boolean(options.is_retry || options.is_continue);
    if (!is_resubmit && (!userText || typeof userText !== "string")) return null;
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

    if (!options.is_retry && !options.is_continue) {
      this.round += 1;
    }

    // On retry, prune trailing model entries for the active round so the retry replaces previous reply
    if (options.is_retry) {
      while (
        this.history.length > 0 &&
        this.history[this.history.length - 1].role === "ai" &&
        this.history[this.history.length - 1].round === this.round
      ) {
        this.history.pop();
      }
    }

    // Append user turn to history if provided and not already present at the tail
    const trimmed_user_text = typeof userText === "string" ? userText.trim() : "";
    if (trimmed_user_text) {
      const last_entry = this.history[this.history.length - 1];
      const is_already_at_tail = last_entry && last_entry.role === "user" && last_entry.text === trimmed_user_text;
      if (!is_already_at_tail) {
        this.history.push({
          role: "user",
          text: trimmed_user_text,
          round: this.round,
        });
      }
    }

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
        signal: options.signal,
      });

      // Apply director deltas to active entity dynamics with [5, 95] clamping
      if (outcome.director_staging?.dynamics_deltas) {
        const deltas = outcome.director_staging.dynamics_deltas;

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

      // Append assistant turn to history
      this.history.push({
        role: "ai",
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
      throw err;
    } finally {
      this.phase = "idle";
    }
  }

  /**
   * Continues an existing AI turn in-place by pre-filling startWith with existing think/prose.
   *
   * @param {object} params
   * @param {string} params.target_prose - Existing prose of the message to continue
   * @param {string} [params.target_think] - Existing think block (if any)
   * @param {number} [params.target_round] - Target message round
   * @param {number} [params.target_history_index] - Truncation index for history context
   * @param {object} [options={}]
   * @param {(chunk: string) => void} [options.onChunk]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} The continuation outcome
   */
  async continue_turn({ target_prose = "", target_think = "", target_round = null, target_history_index = null }, options = {}) {
    if (this.phase === "locked" || this.phase === "generating") {
      throw new Error("Simulation is locked or actively generating.");
    }

    this.phase = "generating";
    this.error = null;

    try {
      const entities = {
        AI: this.ai,
        USER: this.user,
        FRACTAL: this.fractal,
      };

      // If target_history_index is provided, scope dialogue history up to that point
      let contextual_history = this.history;
      if (typeof target_history_index === "number" && target_history_index >= 0) {
        contextual_history = this.history.slice(0, target_history_index);
      }

      const active_round = typeof target_round === "number" ? target_round : this.round;

      const outcome = await execute_turn_2_continue({
        transport: this.transport,
        round: active_round,
        entities,
        history: contextual_history,
        target_prose,
        target_think,
        onChunk: options.onChunk,
        signal: options.signal,
      });

      // If updating the latest model turn in history, fuse the prose
      if (typeof target_history_index === "number" && target_history_index >= 0 && this.history[target_history_index]) {
        this.history[target_history_index].text = outcome.prose;
        if (outcome.think) {
          this.history[target_history_index].think = outcome.think;
        }
      }

      return outcome;
    } catch (err) {
      this.error = err.message || String(err);
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

  /**
   * Retries the previous AI turn by resubmitting without user input or round increment.
   *
   * @param {object} [options={}]
   * @param {(chunk: string) => void} [options.onChunk]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} The completed round outcome
   */
  async retry(options = {}) {
    return await this.submit_turn("", { ...options, is_retry: true });
  }

  /**
   * Continues the narrative without new user input.
   *
   * @param {object} [options={}]
   * @param {(chunk: string) => void} [options.onChunk]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<object>} The completed round outcome
   */
  async continue(options = {}) {
    return await this.submit_turn("", { ...options, is_continue: true });
  }
}
