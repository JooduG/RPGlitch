/**
 * src/state/streaming.svelte.js
 * 🎙️ STREAMING COORDINATOR & LLM TOKEN ACCUMULATOR STORE
 *
 * Core Responsibilities:
 * - Accumulates real-time streamed LLM text chunks (`content`) during turn generation.
 * - Tracks active stream metadata (`active`, `node_id`, `role`, `abort_controller`).
 * - Bridges stream chunks to the Kokoro Neural TTS audio pipeline (`Audio.voice`):
 *   - Applies stream role and entity voice styling on start (`apply_stream_role`).
 *   - Queues completed sentences for speech synthesis during streaming (`queue_stream_sentence`).
 *   - Flushes remaining text and resets stream state on completion (`flush_stream_remainder`, `reset_stream`).
 * - Provides immediate interrupt capability (`trigger_interrupt`) via `AbortController`.
 * - Serves as the reactive text source for UI message typewriter components.
 *
 * Dependencies & Layer Boundaries:
 * - `@media` (`Audio`): Voice pipeline control and role-based audio playback checks.
 */

import { Audio } from "@media";

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {"ai" | "user" | "fractal" | "system" | "npc" | string | null} StreamingRole
 */

// ============================================================================
// [SECTION 2: STREAMING STORE CLASS]
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
// [SECTION 3: SINGLETON EXPORT]
// ============================================================================

export const streaming = new StreamingStore();

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, defined StreamingRole JSDoc schema, added optional chaining
 *   for Audio safety in unit test environments, and added dedicated test suite.
 * - 2026-06-15: Added sentence queueing and speech cadence scaling for Kokoro-82M TTS.
 */
