/**
 * src/state/streaming.svelte.js
 * 🔊 STREAMING COORDINATOR & LLM TOKEN ACCUMULATOR STORE (Rank 3, state)
 *
 * Owns the live streamed LLM text accumulator during turn generation and
 * bridges stream chunks to the TTS audio pipeline. Imported directly by
 * engine transport and app-level interrupt controls — no callback bridge.
 */
import { Audio } from "@media";

/**
 * @typedef {"ai" | "user" | "fractal" | "system" | "npc" | string | null} StreamingRole
 */

// ============================================================================
// [STREAMING COORDINATOR & LLM TOKEN ACCUMULATOR STORE]
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
    // An interrupted turn must not keep talking: drop any queued speech.
    try {
      Audio.voice?.stop?.();
    } catch {
      /* voice teardown is best-effort */
    }
  }
}

// ============================================================================

// ============================================================================
// [SINGLETON EXPORT]
// ============================================================================

export const streaming = new StreamingStore();
