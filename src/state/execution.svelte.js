/**
 * @file src/state/execution.svelte.js
 * Unified simulation execution state machine, LLM token streaming + TTS bridge,
 * and freeze watchdog / forced recovery (Rank 3, state).
 */

import { TIMING_MS } from "@config";
import { Audio } from "@media";
import { get_queue_status } from "@utils";

/**
 * @typedef {"idle" | "generating" | "locked"} ExecutionPhase
 */

/**
 * @typedef {"ai" | "system" | "fractal" | "user" | "npc" | string | null} TurnRole
 */

/**
 * @typedef {Object} GeneratingEntity
 * @property {"ai" | "fractal" | "user" | "npc" | "system" | null} [type]
 * @property {string | null} [name]
 * @property {string | null} [avatar]
 * @property {string | null} [color]
 */

export class ExecutionStore {
  /** @type {ExecutionPhase} */
  phase = $state("idle");

  /** @type {TurnRole} */
  role = $state(null);

  intent_active = $state(false);
  loading = $state(false);
  director_thinking = $state(false);
  speaker_thinking = $state(false);
  media_generating = $state(false);

  /** @type {GeneratingEntity} */
  generating_entity = $state({ type: null, name: null, avatar: null, color: null });

  /** @type {{ active: boolean, content: string, node_id: string | null, role: TurnRole, abort_controller: AbortController | null }} */
  stream = $state({ active: false, content: "", node_id: null, role: "ai", abort_controller: null });

  /**
   * True when actively generating, holding an intent lock, or initializing.
   */
  get busy() {
    return this.phase === "generating" || this.intent_active || this.loading;
  }

  /**
   * Transitions state machine to active generation.
   * @param {TurnRole} [role="ai"]
   */
  start_generation(role = "ai") {
    this.phase = "generating";
    this.role = role;
  }

  /**
   * Concludes active generation cycle and returns phase to idle.
   */
  complete() {
    this.phase = "idle";
    this.role = null;
    this.director_thinking = false;
    this.speaker_thinking = false;
    this.media_generating = false;
    this.clear_generating_entity();
  }

  /**
   * Initiates the Director thinking stage (Stage 1 of turn generation).
   */
  start_director_stage() {
    this.phase = "generating";
    this.role = "system";
    this.director_thinking = true;
    this.speaker_thinking = false;
    this.media_generating = false;
    this.set_generating_entity({ type: "system", name: "Director", avatar: null, color: "var(--color-frozen)" });
  }

  /**
   * Transitions from Director thinking to Speaker thinking once delegated (Stage 2).
   * @param {GeneratingEntity} [entity={}]
   */
  set_delegated_speaker(entity = {}) {
    this.director_thinking = false;
    this.speaker_thinking = true;
    this.media_generating = false;
    this.set_generating_entity(entity);
  }

  /**
   * Enters the media-rendering stage (manual photo / portrait generation).
   * @param {GeneratingEntity} [entity={}]
   */
  start_media_stage(entity = {}) {
    this.phase = "generating";
    this.director_thinking = false;
    this.speaker_thinking = false;
    this.media_generating = true;
    this.set_generating_entity(entity);
  }

  /**
   * Transitions from Speaker thinking to active prose streaming (Stage 3).
   */
  start_stream_stage() {
    this.director_thinking = false;
    this.speaker_thinking = false;
    this.media_generating = false;
  }

  lock() {
    this.phase = "locked";
  }

  unlock() {
    this.phase = "idle";
  }

  /** @param {boolean} active */
  set_intent_active(active) {
    this.intent_active = active;
  }

  /** @param {boolean} active */
  set_loading(active) {
    this.loading = active;
  }

  /** @param {GeneratingEntity} [entity={}] */
  set_generating_entity({ type = null, name = null, avatar = null, color = null } = {}) {
    this.generating_entity = { type, name, avatar, color };
  }

  clear_generating_entity() {
    this.generating_entity = { type: null, name: null, avatar: null, color: null };
  }

  /**
   * Initializes an active LLM stream for a node and role.
   * @param {string | null} id
   * @param {TurnRole} [role="ai"]
   */
  start_stream(id, role = "ai") {
    this.stream.active = true;
    this.stream.content = "";
    this.stream.node_id = id;
    this.stream.role = role;
    Audio.voice?.apply_stream_role?.(role, id);
  }

  /**
   * Appends a streamed chunk and queues completed sentences for TTS.
   * @param {string} chunk
   */
  update_stream(chunk) {
    this.stream.content += chunk;
    if (Audio.is_role_enabled?.(this.stream.role)) {
      Audio.voice?.queue_stream_sentence?.(this.stream.content);
    }
  }

  /**
   * Concludes the active stream, flushes trailing TTS audio, and resets stream fields.
   */
  end_stream() {
    if (this.stream.active && Audio.is_role_enabled?.(this.stream.role)) {
      Audio.voice?.flush_stream_remainder?.(this.stream.content);
    }
    this.stream.active = false;
    this.stream.content = "";
    this.stream.node_id = null;
    this.stream.role = "ai";
    Audio.voice?.reset_stream?.();
  }

  /**
   * Aborts the in-flight request via AbortController and stops queued voice speech.
   */
  interrupt() {
    if (this.stream.abort_controller) {
      try {
        this.stream.abort_controller.abort();
      } catch (err) {
        console.error("[ExecutionStore] Failed to abort streaming:", err);
      }
    }
    try {
      Audio.voice?.stop?.();
    } catch {
      /* voice teardown is best-effort */
    }
  }

  /**
   * Forcefully recovers execution state from a frozen or hung condition.
   * @param {string} reason
   */
  recover(reason) {
    console.warn("[Watchdog] Detected frozen simulation state - force-recovering.", {
      reason,
      phase: this.phase,
      intent_active: this.intent_active,
      loading: this.loading,
      streaming_active: this.stream.active,
    });

    this.complete();
    this.unlock();
    this.intent_active = false;
    this.loading = false;
    this.interrupt();
    this.stream.abort_controller = null;
    this.end_stream();
  }
}

export const execution = new ExecutionStore();

let _freeze_watchdog_started = false;
/** @type {number | null} */
let _freeze_watchdog_timer = null;

/**
 * Stops the background freeze watchdog timer.
 */
export function uninstall_freeze_watchdog() {
  if (_freeze_watchdog_timer != null) {
    clearInterval(_freeze_watchdog_timer);
    _freeze_watchdog_timer = null;
  }
  _freeze_watchdog_started = false;
}

/**
 * Installs the background freeze watchdog timer once during app boot.
 * @returns {number | null}
 */
export function install_freeze_watchdog() {
  if (_freeze_watchdog_started || typeof window === "undefined") return null;
  _freeze_watchdog_started = true;

  let stuck_since = 0;
  let last_stream_len = 0;
  let last_chunk_ts = 0;
  let ever_streamed = false;

  _freeze_watchdog_timer = window.setInterval(() => {
    const phase = execution.phase;
    const intent_active = execution.intent_active;
    const generating = phase === "generating";
    const locked = phase === "locked";
    const consolidating = phase === "idle" && intent_active;
    const streaming_active = execution.stream.active;

    if (streaming_active) ever_streamed = true;
    const stream_len = execution.stream.content?.length ?? 0;

    const stuck = (generating || locked || consolidating) && (intent_active || ever_streamed);
    if (!stuck) {
      stuck_since = 0;
      ever_streamed = false;
      last_stream_len = stream_len;
      last_chunk_ts = streaming_active ? Date.now() : 0;
      return;
    }

    if (get_queue_status().foreground_queued > 0) {
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
      if (!streaming_active && elapsed >= TIMING_MS.CEILING) {
        execution.recover(`Simulation stuck ${Math.round(elapsed / 1000)}s with no stream`);
        stuck_since = 0;
        return;
      }

      if (streaming_active && last_chunk_ts > 0 && Date.now() - last_chunk_ts >= TIMING_MS.CEILING) {
        execution.recover(`Stream produced no chunks for ${Math.round((Date.now() - last_chunk_ts) / 1000)}s`);
        stuck_since = 0;
        return;
      }

      if (elapsed >= TIMING_MS.LIFETIME && !stream_grew) {
        execution.recover(`Simulation stuck ${Math.round(elapsed / 1000)}s with no progress`);
        stuck_since = 0;
        return;
      }
      return;
    }

    if (elapsed >= TIMING_MS.LIFETIME) {
      console.warn(`[Watchdog] Post-turn consolidation overran ${Math.round(elapsed / 1000)}s - releasing intent lock.`, { phase, intent_active });
      execution.set_intent_active(false);
      stuck_since = 0;
    }
  }, TIMING_MS.HEARTBEAT);

  return _freeze_watchdog_timer;
}
