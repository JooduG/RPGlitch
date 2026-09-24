/**
 * src/state/status.svelte.js
 * 👑 SIMULATION STATUS & ENGINE STATE STORE: Lifecycle, Streaming, & Freeze Recovery
 *
 * Core Responsibilities:
 * - Tracks macro simulation execution phase (`idle`, `generating`, `locked`).
 * - Manages intent lock (`intent_active`) preventing overlapping turns and protecting memory consolidation.
 * - Tracks Director delegated speaker identity (`generating_entity_type`, `generating_entity_name`,
 *   `generating_entity_avatar`, `generating_entity_color`) for live UI speaker attribution.
 * - Exposes derived state flags (`busy`, `is_consolidating`).
 * - Provides lightweight UI status store (`ui_state.loading`).
 * - Accumulates real-time streamed LLM text chunks (`content`) during turn generation (`streaming`).
 * - Bridges stream chunks to the Kokoro Neural TTS audio pipeline (`Audio.voice`).
 * - Monitors the simulation state machine and streaming lifecycle for hung or deadlocked states (`freeze-watchdog`).
 * - Enforces multi-tier diagnostic freeze recovery and provides unified `force_recover_simulation(reason)`.
 *
 * State Machine Lifecycle:
 * - `idle`: Engine is ready for user actions or silently running background memory consolidation.
 * - `generating`: Foreground stream or prompt turn in flight.
 * - `locked`: System is processing an atomic state transition or awaiting stasis release.
 *
 * Dependencies & Layer Boundaries:
 * - `@media` (`Audio`): Voice pipeline control and role-based audio playback checks.
 * - `log.svelte.js` (`developer_log`): Diagnostic telemetry logging.
 */

import { Audio } from "@media";
import { developer_log } from "./log.svelte.js";

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {"idle" | "generating" | "locked"} SimulationPhase
 */

/**
 * @typedef {"ai" | "system" | "fractal" | "user" | "npc" | string | null} TurnRole
 */

/**
 * @typedef {"ai" | "user" | "fractal" | "system" | "npc" | string | null} StreamingRole
 */

/**
 * @typedef {Object} GeneratingEntity
 * @property {"ai" | "fractal" | "user" | "npc" | null} [type] - Entity category.
 * @property {string | null} [name] - Display name of speaking entity.
 * @property {string | null} [avatar] - Avatar image URL or base64 data.
 * @property {string | null} [color] - Hex or token signature color.
 */

// ============================================================================
// [SECTION 2: SIMULATION STATE STORE]
// ============================================================================

export class SimulationStateStore {
  /** @type {SimulationPhase} */
  #phase = $state("idle");

  /** @type {TurnRole} */
  #role = $state(null);

  /** @type {boolean} */
  #intent_active = $state(false);

  /** @type {"ai" | "fractal" | "user" | "npc" | null} */
  #generating_entity_type = $state(null);

  /** @type {string | null} */
  #generating_entity_name = $state(null);

  /** @type {string | null} */
  #generating_entity_avatar = $state(null);

  /** @type {string | null} */
  #generating_entity_color = $state(null);

  /** @type {boolean} */
  #director_thinking = $state(false);

  /** @type {boolean} */
  #speaker_thinking = $state(false);

  // --- GETTERS & SETTERS ---

  get phase() {
    return this.#phase;
  }
  set phase(value) {
    this.#phase = value;
  }

  get role() {
    return this.#role;
  }
  set role(value) {
    this.#role = value;
  }

  get intent_active() {
    return this.#intent_active;
  }
  set intent_active(value) {
    this.#intent_active = value;
  }

  get generating_entity_type() {
    return this.#generating_entity_type;
  }
  get generating_entity_name() {
    return this.#generating_entity_name;
  }
  get generating_entity_avatar() {
    return this.#generating_entity_avatar;
  }
  get generating_entity_color() {
    return this.#generating_entity_color;
  }

  get director_thinking() {
    return this.#director_thinking;
  }

  get speaker_thinking() {
    return this.#speaker_thinking;
  }

  /**
   * True if the engine is either actively generating a turn or holding an intent lock.
   */
  get busy() {
    return this.#phase === "generating" || this.#intent_active;
  }

  /**
   * True while the engine has finished streaming a turn and is silently
   * consolidating memory in the background (idle phase + intent lock held).
   */
  get is_consolidating() {
    return this.#phase === "idle" && this.#intent_active;
  }

  // --- STATE MUTATORS ---

  /**
   * Transitions state machine to active generation.
   * @param {TurnRole} [role="ai"]
   */
  start_generation(role = "ai") {
    this.#phase = "generating";
    this.#role = role;
  }

  /**
   * Sets typing indicator role.
   * @param {TurnRole} role
   */
  start_typing(role) {
    this.#role = role;
  }

  /**
   * Clears typing indicator and resets delegated speaker metadata.
   */
  stop_typing() {
    this.#role = null;
    this.clear_generating_entity();
  }

  /**
   * Concludes active generation cycle and returns phase to idle.
   */
  complete() {
    this.#phase = "idle";
    this.#role = null;
    this.#director_thinking = false;
    this.#speaker_thinking = false;
    this.clear_generating_entity();
  }

  /**
   * Initiates the Director thinking stage (Stage 1 of turn generation).
   */
  start_director_stage() {
    this.#phase = "generating";
    this.#role = "system";
    this.#director_thinking = true;
    this.#speaker_thinking = false;
    this.set_generating_entity({
      type: "system",
      name: "Director",
      avatar: null,
      color: "var(--color-frozen)",
    });
  }

  /**
   * Transitions from Director thinking to Speaker thinking once the next speaker
   * is delegated by the Director (Stage 2 of turn generation).
   * @param {GeneratingEntity} entity
   */
  set_delegated_speaker(entity = {}) {
    this.#director_thinking = false;
    this.#speaker_thinking = true;
    this.set_generating_entity(entity);
  }

  /**
   * Transitions from Speaker thinking to active prose streaming (Stage 3 of turn generation).
   */
  start_stream_stage() {
    this.#director_thinking = false;
    this.#speaker_thinking = false;
  }

  /**
   * Locks the simulation state machine.
   */
  lock() {
    this.#phase = "locked";
  }

  /**
   * Unlocks the simulation state machine to idle.
   */
  unlock() {
    this.#phase = "idle";
  }

  /**
   * Sets the intent lock flag.
   * @param {boolean} active
   */
  set_intent_active(active) {
    this.#intent_active = active;
  }

  /**
   * Marks which entity the Director delegated the current turn to, so the UI
   * can mirror avatar/badge/color to whoever is actively speaking.
   * @param {GeneratingEntity} [entity={}]
   */
  set_generating_entity({ type = null, name = null, avatar = null, color = null } = {}) {
    this.#generating_entity_type = type;
    this.#generating_entity_name = name;
    this.#generating_entity_avatar = avatar;
    this.#generating_entity_color = color;
  }

  /**
   * Clears delegated speaker attribution.
   */
  clear_generating_entity() {
    this.#generating_entity_type = null;
    this.#generating_entity_name = null;
    this.#generating_entity_avatar = null;
    this.#generating_entity_color = null;
  }
}

// ============================================================================
// [SECTION 3: UI STATE STORE]
// ============================================================================

export class UIStateStore {
  #loading = $state(false);

  get loading() {
    return this.#loading;
  }

  /**
   * Sets global loading spinner state.
   * @param {boolean} value
   */
  set_loading(value) {
    this.#loading = value;
  }
}

// ============================================================================
// [SECTION 4: STREAMING COORDINATOR & LLM TOKEN ACCUMULATOR STORE]
// ============================================================================

export class StreamingStore {
  /** @type {boolean} */
  active = $state(false);

  /** @type {string} */
  content = $state("");

  /** @type {string | null} */
  node_id = $state(null);

  /** @type {StreamingRole} */
  role = $state("ai");

  /** @type {AbortController | null} */
  abort_controller = $state(null);

  /**
   * Initializes an active stream for a specific node and role.
   * @param {string | null} id - Node identifier or message target ID.
   * @param {StreamingRole} [role="ai"] - Role of the speaking entity.
   */
  start_stream(id, role = "ai") {
    this.active = true;
    this.content = "";
    this.node_id = id;
    this.role = role;

    Audio.voice?.apply_stream_role?.(role, id);
  }

  /**
   * Appends an incoming text chunk to the accumulator and queues completed sentences for TTS.
   * @param {string} chunk - Text delta from the LLM stream.
   */
  update_stream(chunk) {
    this.content += chunk;

    if (Audio.is_role_enabled?.(this.role)) {
      Audio.voice?.queue_stream_sentence?.(this.content);
    }
  }

  /**
   * Concludes the active stream, flushes trailing TTS audio sentences, and resets state.
   */
  end_stream() {
    if (this.active && Audio.is_role_enabled?.(this.role)) {
      Audio.voice?.flush_stream_remainder?.(this.content);
    }

    this.active = false;
    this.content = "";
    this.node_id = null;
    this.role = "ai";
    Audio.voice?.reset_stream?.();
  }

  /**
   * Aborts the in-flight HTTP request or worker stream via the active AbortController.
   */
  trigger_interrupt() {
    if (this.abort_controller) {
      try {
        this.abort_controller.abort();
      } catch (err) {
        console.error("[StreamingStore] Failed to abort streaming:", err);
      }
    }
  }
}

// ============================================================================
// [SECTION 5: FREEZE WATCHDOG CONSTANTS & FORCE RECOVERY ENGINE]
// ============================================================================

export const FREEZE_WATCHDOG_INTERVAL_MS = 15000;
export const FREEZE_WATCHDOG_IDLE_GRACE_MS = 90000;
export const FREEZE_WATCHDOG_CHUNK_STALL_MS = 90000;
export const FREEZE_WATCHDOG_MAX_MS = 5 * 60 * 1000;
export const FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS = 4 * 60 * 1000;

let _freeze_watchdog_started = false;

/**
 * Forcefully recovers the simulation state machine from a frozen or hung condition.
 * Unlocks the state machine, clears dead streams, aborts active requests, and resets loading flags.
 * @param {string} reason - Human-readable diagnostic description of why recovery was triggered.
 */
export function force_recover_simulation(reason) {
  console.warn("[Watchdog] Detected frozen simulation state — force-recovering.", {
    reason,
    phase: simulation_state.phase,
    intent_active: simulation_state.intent_active,
    loading: ui_state.loading,
    streaming_active: streaming.active,
  });

  developer_log.log(`[Watchdog] ${reason} — force-recovering the simulation.`, "error");

  try {
    simulation_state.complete();
    simulation_state.unlock();
    simulation_state.set_intent_active(false);
  } catch {
    /* Status state store never throws */
  }

  ui_state.set_loading(false);
  streaming.end_stream();
  streaming.active = false;
  streaming.content = "";
  streaming.node_id = null;

  if (streaming.abort_controller) {
    try {
      streaming.abort_controller.abort();
    } catch {
      /* Request already aborted */
    }
    streaming.abort_controller = null;
  }
}

/**
 * Installs the background freeze watchdog timer.
 * Invoked once during app boot (`app.init()`).
 * @returns {number | null} Timer interval identifier, or null in non-browser environments.
 */
export function install_freeze_watchdog() {
  if (_freeze_watchdog_started || typeof window === "undefined") return null;
  _freeze_watchdog_started = true;

  /** @type {number} */
  let stuck_since = 0;
  let last_stream_len = 0;
  let last_chunk_ts = 0;
  let ever_streamed = false;

  const timer_id = window.setInterval(() => {
    const phase = simulation_state.phase;
    const intent_active = simulation_state.intent_active;
    const generating = phase === "generating";
    const locked = phase === "locked";
    const consolidating = phase === "idle" && intent_active;
    const streaming_active = streaming.active;

    if (streaming_active) ever_streamed = true;
    const stream_len = streaming.content?.length ?? 0;

    const stuck = (generating || locked || consolidating) && (intent_active || ever_streamed);
    if (!stuck) {
      stuck_since = 0;
      last_stream_len = stream_len;
      last_chunk_ts = streaming_active ? Date.now() : 0;
      return;
    }

    if (stuck_since === 0) {
      stuck_since = Date.now();
      last_stream_len = stream_len;
      last_chunk_ts = streaming_active ? Date.now() : 0;
      return;
    }

    const elapsed = Date.now() - stuck_since;
    const stream_grew = stream_len > last_stream_len;
    if (stream_grew) last_chunk_ts = Date.now();
    last_stream_len = stream_len;

    if (generating || locked) {
      // Tier 1: Generating/Locked with NO stream after idle grace
      if (!streaming_active && elapsed >= FREEZE_WATCHDOG_IDLE_GRACE_MS) {
        force_recover_simulation(`Simulation stuck ${Math.round(elapsed / 1000)}s with no stream`);
        stuck_since = 0;
        return;
      }

      // Tier 2a: Active stream stalled with no chunks
      if (streaming_active && last_chunk_ts > 0 && Date.now() - last_chunk_ts >= FREEZE_WATCHDOG_CHUNK_STALL_MS) {
        force_recover_simulation(`Stream produced no chunks for ${Math.round((Date.now() - last_chunk_ts) / 1000)}s`);
        stuck_since = 0;
        return;
      }

      // Tier 2: Broad max timeout without content progression
      if (elapsed >= FREEZE_WATCHDOG_MAX_MS && !stream_grew) {
        force_recover_simulation(`Simulation stuck ${Math.round(elapsed / 1000)}s with no progress`);
        stuck_since = 0;
        return;
      }
      return;
    }

    // Tier 3: Memory consolidation overrun grace
    if (elapsed >= FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS) {
      console.warn(`[Watchdog] Post-turn consolidation overran ${Math.round(elapsed / 1000)}s — releasing intent lock.`, { phase, intent_active });
      developer_log.log(`[Watchdog] Post-turn consolidation overran ${Math.round(elapsed / 1000)}s — releasing intent lock.`, "warn");

      try {
        simulation_state.set_intent_active(false);
      } catch {
        /* State store never throws */
      }
      stuck_since = 0;
    }
  }, FREEZE_WATCHDOG_INTERVAL_MS);

  return timer_id;
}

// ============================================================================
// [SECTION 6: SINGLETON EXPORTS]
// ============================================================================

export const simulation_state = new SimulationStateStore();
export const ui_state = new UIStateStore();
export const streaming = new StreamingStore();

/**
 * CHANGELOG:
 * - 2026-09-23: Consolidated streaming accumulator (`streaming.svelte.js`) and freeze watchdog
 *   recovery engine (`freeze-watchdog.js`) directly into status.svelte.js under P4 Zero Backwards Compatibility.
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, defined JSDoc schemas (SimulationPhase, TurnRole, GeneratingEntity),
 *   exported store classes, and verified 100% test coverage.
 * - 2026-06-15: Added Director delegated speaker state (generating_entity_type, name, avatar, color).
 */
