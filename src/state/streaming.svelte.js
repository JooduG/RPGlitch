/**
 * src/state/streaming.svelte.js
 * 🎙️ STREAMING COORDINATOR
 * Accumulates streamed LLM chunks, tracks the active stream (node/role/abort),
 * and drives the TTS voice pipeline (selected_voice, cadence-scaled rate,
 * sentence queueing). The engine (kernel, chrono) and the platform stream
 * bridge write here; the UI (Message, Storymode) reads `streaming.text` as the
 * text source for the Typewriter component.
 */
import { Audio, get_cadence_rate, resolve_voice_uri } from "@media";
import { runtime } from "./runtime.svelte.js";

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
  /** @type {boolean} */
  errored = $state(false);
  /** @type {string | null} */
  errored_node_id = $state(null);

  get text() {
    return this.content;
  }
  set text(val) {
    this.content = val;
  }

  /**
   * @param {string | null} id
   * @param {"ai" | "user" | "fractal" | "system" | null} role
   */
  start_stream = (id, role = "ai") => {
    this.active = true;
    this.content = "";
    this.text = "";
    this.node_id = id;
    this.role = role;
    this.errored = false;
    this.errored_node_id = null;

    Audio.voice.reset_stream();
    Audio.voice.active_message_id = id;

    if (role && role !== "system") {
      const clean_role = String(role).toLowerCase();
      const norm_role = clean_role.includes("user")
        ? "user"
        : clean_role.includes("fractal")
          ? "fractal"
          : clean_role.includes("npc")
            ? "npc"
            : clean_role.includes("ai") || clean_role.includes("character") || clean_role === "model"
              ? "ai"
              : null;

      let entity = null;
      if (norm_role === "ai") entity = runtime.active_ai;
      else if (norm_role === "user") entity = runtime.active_user;
      else if (norm_role === "fractal") entity = runtime.active_fractal;
      else if (norm_role === "npc") entity = runtime.active_npcs?.[runtime.streaming_entity_id] || null;

      if (entity && entity.voice) {
        const v_id = entity.voice.name || entity.voice.uri;
        Audio.voice.selected_voice = resolve_voice_uri(v_id);
        const dyn_val = norm_role === "user" ? 50 : norm_role === "ai" ? (entity.dynamics?.intensity ?? 50) : (entity.dynamics?.velocity ?? 50);
        Audio.voice.rate = get_cadence_rate(entity.voice.cadence, dyn_val);
      }
    }
  };
  update_stream = (/** @type {string} */ chunk) => {
    this.content += chunk;
    this.text = this.content;

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
    this.text = "";
    this.node_id = null;
    this.role = "ai";
    Audio.voice.reset_stream();
  };
  signal_stream_error = (node_id) => {
    this.errored = true;
    this.errored_node_id = node_id;
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
