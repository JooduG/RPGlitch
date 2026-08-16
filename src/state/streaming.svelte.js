/**
 * src/state/streaming.svelte.js
 * 🎙️ STREAMING COORDINATOR
 * Accumulates streamed LLM chunks, tracks the active stream (node/role/abort),
 * and drives the TTS voice pipeline (selected_voice, cadence-scaled rate,
 * sentence queueing). The engine (kernel, chrono) and the platform stream
 * bridge write here; the UI (Message, Storymode) reads `streaming.content` as
 * the text source for the Typewriter component.
 */
import { Audio } from "@media";

class StreamingStore {
  /** @type {boolean} */
  active = $state(false);
  /** @type {string} */
  content = $state("");
  /** @type {string | null} */
  node_id = $state(null);
  /** @type {"ai" | "user" | "fractal" | "system" | null} */
  role = $state("ai");
  /** @type {AbortController | null} */
  abort_controller = $state(null);

  /**
   * @param {string | null} id
   * @param {"ai" | "user" | "fractal" | "system" | null} role
   */
  start_stream = (id, role = "ai") => {
    this.active = true;
    this.content = "";
    this.node_id = id;
    this.role = role;

    Audio.voice.apply_stream_role(role, id);
  };
  update_stream = (/** @type {string} */ chunk) => {
    this.content += chunk;

    if (Audio.is_role_enabled(this.role)) {
      Audio.voice.queue_stream_sentence(this.content);
    }
  };
  end_stream = () => {
    if (this.active && Audio.is_role_enabled(this.role)) {
      Audio.voice.flush_stream_remainder(this.content);
    }

    this.active = false;
    this.content = "";
    this.node_id = null;
    this.role = "ai";
    Audio.voice.reset_stream();
  };
  trigger_interrupt = () => {
    if (this.abort_controller) {
      try {
        this.abort_controller.abort();
      } catch (e) {
        console.error("[StreamingStore] Failed to abort streaming:", e);
      }
    }
  };
}

export const streaming = new StreamingStore();
