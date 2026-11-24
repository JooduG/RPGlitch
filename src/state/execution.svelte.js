/**
 * @file src/state/execution.svelte.js
 * Unified simulation execution state machine, LLM token streaming + TTS bridge,
 * and forced recovery (Rank 3, state).
 */

import { Audio } from "@media";

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
    this.generating_entity = { type: null, name: null, avatar: null, color: null };
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
    Audio.voice.apply_stream_role(role, id);
  }

  /**
   * Appends a streamed chunk and queues completed sentences for TTS.
   * @param {string} chunk
   */
  update_stream(chunk) {
    this.stream.content += chunk;
    if (Audio.is_role_enabled(this.stream.role)) {
      Audio.voice.queue_stream_sentence(this.stream.content);
    }
  }

  /**
   * Concludes the active stream, flushes trailing TTS audio, and resets stream fields.
   */
  end_stream() {
    if (this.stream.active && Audio.is_role_enabled(this.stream.role)) {
      Audio.voice.flush_stream_remainder(this.stream.content);
    }
    this.stream.active = false;
    this.stream.content = "";
    this.stream.node_id = null;
    this.stream.role = "ai";
    Audio.voice.reset_stream();
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
    Audio.voice.stop();
  }

  /**
   * Forcefully recovers execution state from a frozen or hung condition.
   * Resets all synchronous state fields before aborting in-flight work and stopping voice.
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

    const controller = this.stream.abort_controller;
    this.phase = "idle";
    this.role = null;
    this.intent_active = false;
    this.loading = false;
    this.generating_entity = { type: null, name: null, avatar: null, color: null };
    this.stream.active = false;
    this.stream.content = "";
    this.stream.node_id = null;
    this.stream.role = "ai";
    this.stream.abort_controller = null;

    if (controller) {
      try {
        controller.abort();
      } catch (err) {
        console.error("[ExecutionStore] Failed to abort streaming during recover:", err);
      }
    }
    Audio.voice.reset_stream();
    Audio.voice.stop();
  }
}

export const execution = new ExecutionStore();
