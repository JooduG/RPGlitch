/**
 * src/engine/kernel.svelte.js
 * ============================================================================
 * 📜 SOVEREIGN SIMULATION KERNEL & REACTIVE CONTROLLER
 * ============================================================================
 *
 * Compat holder for per-turn state (entities, round, history, phase) over the
 * pure turn transactions (create_turn_session / submit_turn_transaction /
 * continue_turn_transaction). The runs.js prod path builds plain sessions via
 * create_turn_session; this class delegates to the same core, so both shapes
 * behave identically and existing tests keep constructing Kernels.
 * ============================================================================
 */

import { execute_round, execute_turn_2_continue } from "./turns.js";

/**
 * Applies Turn 1 director dynamics deltas to entity dynamics with [5, 95] clamping.
 * Pure core shared by the Kernel wrapper and the runs.js turn path (single source).
 *
 * @param {object|null} ai_entity - AI quadrant entity (mutated in place)
 * @param {object|null} fractal_entity - Fractal quadrant entity (mutated in place)
 * @param {object|null} deltas - Director dynamics deltas
 */
export function apply_director_deltas_to_dynamics(ai_entity, fractal_entity, deltas) {
  if (!deltas) return;
  if (ai_entity && typeof ai_entity.dynamics === "object") {
    for (const key of ["chaos", "intensity", "openness", "affinity"]) {
      if (deltas[key] !== undefined && ai_entity.dynamics[key] !== undefined) {
        const current = Number(ai_entity.dynamics[key]) || 50;
        ai_entity.dynamics[key] = Math.max(5, Math.min(95, current + deltas[key]));
      }
    }
  }
  if (fractal_entity && typeof fractal_entity.dynamics === "object") {
    for (const key of ["velocity", "entropy"]) {
      if (deltas[key] !== undefined && fractal_entity.dynamics[key] !== undefined) {
        const current = Number(fractal_entity.dynamics[key]) || 50;
        fractal_entity.dynamics[key] = Math.max(5, Math.min(95, current + deltas[key]));
      }
    }
  }
}

/**
 * Creates a plain turn-session object (the Phase 3 prod path — no class).
 * Field-for-field compatible with Kernel instances: runs.js write-back,
 * caretaker consolidation, and persistence code consume either shape unchanged.
 * The object carries the same submit/continue/retry/rewind methods, all
 * delegating to the pure transactions below.
 */
export function create_turn_session(options = {}) {
  const session = {
    user: options.user || null,
    ai: options.ai || null,
    fractal: options.fractal || null,
    round: Number(options.round || 0),
    history: [],
    phase: "idle",
    error: null,
    director_enabled: options.director_enabled || false,
    transport: options.transport || {
      stream() {
        throw new Error("Kernel requires an injected transport (e.g. get_transport()).");
      },
    },
  };
  session.submit_turn = (user_text, submit_options = {}) => submit_turn_transaction(session, user_text, submit_options);
  session.continue_turn = (turn_params, continue_options = {}) => continue_turn_transaction(session, turn_params, continue_options);
  session.retry = (retry_options = {}) => submit_turn_transaction(session, "", { ...retry_options, is_retry: true });
  session.continue = (continue_options = {}) => submit_turn_transaction(session, "", { ...continue_options, is_continue: true });
  session.rewind_to_round = (target_round) => {
    if (target_round < 0) return;
    session.history = session.history.filter((entry) => entry.round <= target_round);
    session.round = target_round;
    session.phase = "idle";
    session.error = null;
  };
  return session;
}

/**
 * Submits a user message and executes the next simulation round.
 * Pure transaction over the passed session: round increment (unless retry /
 * continue), retry tail-prune, user-tail append, execute_round dispatch,
 * director-delta clamp, history push — with full rollback on failure.
 */
export async function submit_turn_transaction(session, user_text, options = {}) {
  const resubmitting = Boolean(options.is_retry || options.is_continue);
  if (!resubmitting && (!user_text || typeof user_text !== "string")) return null;
  if (session.phase === "locked" || session.phase === "generating") {
    throw new Error("Simulation is locked or actively generating.");
  }

  session.phase = "generating";
  session.error = null;
  const previous_round = session.round;
  const previous_history_length = session.history.length;
  const previous_ai_dynamics = session.ai?.dynamics ? { ...session.ai.dynamics } : null;
  const previous_fractal_dynamics = session.fractal?.dynamics ? { ...session.fractal.dynamics } : null;
  const previous_user_dynamics = session.user?.dynamics ? { ...session.user.dynamics } : null;

  if (!options.is_retry && !options.is_continue) {
    session.round += 1;
  }

  // On retry, prune trailing model entries for the active round so the retry replaces previous reply
  if (options.is_retry) {
    while (
      session.history.length > 0 &&
      session.history[session.history.length - 1].role === "ai" &&
      session.history[session.history.length - 1].round === session.round
    ) {
      session.history.pop();
    }
  }

  // Append user turn to history if provided and not already present at the tail
  const trimmed_user_text = typeof user_text === "string" ? user_text.trim() : "";
  if (trimmed_user_text) {
    const last_entry = session.history[session.history.length - 1];
    const already_at_tail = last_entry && last_entry.role === "user" && last_entry.text === trimmed_user_text;
    if (!already_at_tail) {
      session.history.push({ role: "user", text: trimmed_user_text, round: session.round });
    }
  }

  try {
    const entities = { AI: session.ai, USER: session.user, FRACTAL: session.fractal };

    const outcome = await execute_round({
      transport: session.transport,
      round: session.round,
      entities,
      history: session.history,
      director_enabled: session.director_enabled,
      onChunk: options.onChunk,
      signal: options.signal,
    });

    // Apply director deltas to active entity dynamics with [5, 95] clamping
    apply_director_deltas_to_dynamics(session.ai, session.fractal, outcome.director_staging?.dynamics_deltas);

    // Append assistant turn to history
    session.history.push({ role: "ai", text: outcome.character_turn.prose, think: outcome.character_turn.think, round: session.round });

    return outcome;
  } catch (err) {
    // Transactional rollback on mid-stream failure to prevent orphan user turns or partial dynamics
    session.history.length = previous_history_length;
    session.round = previous_round;
    if (previous_ai_dynamics && session.ai?.dynamics) {
      Object.assign(session.ai.dynamics, previous_ai_dynamics);
    }
    if (previous_fractal_dynamics && session.fractal?.dynamics) {
      Object.assign(session.fractal.dynamics, previous_fractal_dynamics);
    }
    if (previous_user_dynamics && session.user?.dynamics) {
      Object.assign(session.user.dynamics, previous_user_dynamics);
    }
    session.error = err.message || String(err);
    throw err;
  } finally {
    session.phase = "idle";
  }
}

/**
 * Continues an existing AI turn in-place by pre-filling startWith with existing think/prose.
 * Pure transaction over the passed session; history fuse applies to the indexed entry.
 */
export async function continue_turn_transaction(
  session,
  { target_prose = "", target_think = "", target_round = null, target_history_index = null } = {},
  options = {},
) {
  if (session.phase === "locked" || session.phase === "generating") {
    throw new Error("Simulation is locked or actively generating.");
  }

  session.phase = "generating";
  session.error = null;

  try {
    const entities = { AI: session.ai, USER: session.user, FRACTAL: session.fractal };

    // If target_history_index is provided, scope dialogue history up to that point
    let contextual_history = session.history;
    if (typeof target_history_index === "number" && target_history_index >= 0) {
      contextual_history = session.history.slice(0, target_history_index);
    }

    const active_round = typeof target_round === "number" ? target_round : session.round;

    const outcome = await execute_turn_2_continue({
      transport: session.transport,
      round: active_round,
      entities,
      history: contextual_history,
      target_prose,
      target_think,
      onChunk: options.onChunk,
      signal: options.signal,
    });

    // If updating the latest model turn in history, fuse the prose
    if (typeof target_history_index === "number" && target_history_index >= 0 && session.history[target_history_index]) {
      session.history[target_history_index].text = outcome.prose;
      if (outcome.think) {
        session.history[target_history_index].think = outcome.think;
      }
    }

    return outcome;
  } catch (err) {
    session.error = err.message || String(err);
    throw err;
  } finally {
    session.phase = "idle";
  }
}

export class Kernel {
  user = null;
  ai = null;
  fractal = null;
  round = 0;
  phase = "idle"; // "idle" | "generating" | "locked"
  history = [];
  error = null;
  director_enabled = false;

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
   * Compat wrapper: delegates to submit_turn_transaction (the runs.js path calls it directly).
   */
  async submit_turn(userText, options = {}) {
    return submit_turn_transaction(this, userText, options);
  }

  /**
   * Continues an existing AI turn in-place by pre-filling startWith with existing think/prose.
   *
   * Compat wrapper: delegates to continue_turn_transaction.
   */
  async continue_turn({ target_prose = "", target_think = "", target_round = null, target_history_index = null } = {}, options = {}) {
    return continue_turn_transaction(this, { target_prose, target_think, target_round, target_history_index }, options);
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
