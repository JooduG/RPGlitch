/**
 * @file src/media/audio.svelte.js
 * 🔊 SENSORY CORTEX — AUDIO & NEURAL VOCAL SYNTHESIS ENGINE
 *
 * Core Architecture & Responsibilities:
 * 1. Kokoro-82M Neural Vocal Synthesis (`VoiceEngine`):
 *    - In-browser neural TTS powered by `kokoro-js` with WebGPU/WASM ONNX runtime backend.
 *    - Seamless sentence streaming chunking (`split_speech_sentences`), background pregeneration, and audio caching.
 *    - Web Speech API fallback when ONNX runtime or Kokoro model download is unavailable.
 * 2. Shared Web Audio Graph (`AudioEffectsEngine`):
 *    - Single hardware `AudioContext` & master `GainNode` shared across voice streaming and SFX.
 *    - First-gesture unlock listeners adhering to browser autoplay policies.
 * 3. Reactive Audio Singleton Facade (`AudioEngine`, `audio_engine`, `Audio`):
 *    - Single-point bridge managing master volume, notification SFX, and per-entity voice toggles.
 *
 * Layer Hierarchy: Downward-only imports from `@data` and `@utils`. No imports from `@ui` or `@state`.
 */

import { state_bridge, strip_cognition_blocks, onnx_mutex, wait_ort_ready } from "@utils";
import { db } from "@data";
import { KOKORO_VOICES, get_cadence_rate, normalize_role, resolve_voice_name, resolve_voice_uri, split_speech_sentences } from "./speech.js";

// ============================================================================
// [SECTION 1: CONSTANTS & GLOBAL AUDIO GRAPH]
// ============================================================================

export const AUDIO_STORAGE_KEY = "rpglitch_audio_settings";
const PREGENERATE_BUDGET = 3;
const AUDIO_CACHE_MAX = 64;
const DEFAULT_NOTIFICATION_SOUND = "https://user.uploads.dev/file/50dc061d6ed6439719d283d042e9c172.wav";

/** @type {AudioContext | null} */
let shared_audio_context = null;
/** @type {GainNode | null} */
let master_gain_node = null;
let current_master_volume = 1.0;

/**
 * Returns the module-wide shared AudioContext, lazily instantiating it on first use.
 * @returns {AudioContext | null}
 */
function get_master_context() {
  if (shared_audio_context) return shared_audio_context;
  if (typeof window === "undefined") return null;

  const AudioContextConstructor = /** @type {any} */ (window).AudioContext || /** @type {any} */ (window).webkitAudioContext;
  if (!AudioContextConstructor) return null;

  shared_audio_context = new AudioContextConstructor();
  master_gain_node = shared_audio_context.createGain();
  master_gain_node.gain.setValueAtTime(current_master_volume, shared_audio_context.currentTime);
  master_gain_node.connect(shared_audio_context.destination);
  return shared_audio_context;
}

/**
 * Returns the master gain node on the shared graph.
 * @returns {GainNode | null}
 */
function get_master_gain() {
  get_master_context();
  return master_gain_node;
}

/**
 * Updates the master volume level across the shared audio graph.
 * @param {number} volume
 */
function set_master_volume(volume) {
  current_master_volume = Math.max(0, Math.min(1, Number(volume)));
  if (master_gain_node && shared_audio_context) {
    master_gain_node.gain.setValueAtTime(current_master_volume, shared_audio_context.currentTime);
  }
}

/**
 * Suspends the shared AudioContext when idle or transitioning.
 */
function suspend_master_context() {
  if (shared_audio_context && shared_audio_context.state !== "closed" && shared_audio_context.state !== "suspended") {
    try {
      shared_audio_context.suspend().catch(() => {});
    } catch {
      /* safe no-op */
    }
  }
}

/**
 * Closes and nullifies the shared AudioContext on teardown.
 */
function close_master_context() {
  if (shared_audio_context) {
    if (shared_audio_context.state !== "closed") {
      try {
        shared_audio_context.close().catch(() => {});
      } catch {
        /* safe no-op */
      }
    }
    shared_audio_context = null;
    master_gain_node = null;
  }
}

/**
 * Reads the Perchance SFX "sounds" list from window.lists.
 * @returns {string[]}
 */
function get_sound_list() {
  const key = "sounds";
  const global_lists = typeof window !== "undefined" && /** @type {any} */ (window).lists ? /** @type {any} */ (window).lists : null;
  if (!global_lists || !global_lists[key]) return [];
  const list = global_lists[key];
  if (Array.isArray(list) && typeof list[0] === "string" && list[0].startsWith("[")) {
    if (list[0].length > 65536) {
      console.warn(`[AudioEngine] get_sound_list: JSON string for '${key}' exceeds 64KB safety limit.`);
      return [];
    }
    try {
      return JSON.parse(list[0]);
    } catch (error) {
      console.warn(`[AudioEngine] get_sound_list: Failed to parse JSON for '${key}'.`, error);
      return list;
    }
  }
  return Array.isArray(list) ? list : [];
}

// ============================================================================
// [SECTION 2: VOICE ENGINE (KOKORO-82M NEURAL TTS)]
// ============================================================================

/**
 * Reactive Neural Vocal Synthesis Engine.
 * Manages Kokoro-82M ONNX model downloading, background audio synthesis,
 * playback queuing, and Web Speech API fallback.
 */
export class VoiceEngine {
  // --- Reactive Svelte 5 State Runes ---
  /** @type {string | null | number} */
  active_message_id = $state(null);
  is_speaking = $state(false);
  is_loading = $state(false);
  load_progress = $state(0);
  is_model_ready = $state(false);
  /** @type {Array<{ name: string, uri: string }>} */
  voices = $state([]);
  /** @type {string | null} */
  selected_voice = $state("am_adam");
  volume = $state(1.0);
  rate = $state(1.0);
  enabled = $state(false);
  /** @type {{ ai: boolean, user: boolean, fractal: boolean }} */
  entity_voice = $state({ ai: false, user: false, fractal: false });
  is_paused = $state(false);
  spoken_character_cursor = $state(0);

  // --- Model Readiness Alias ---
  get model_ready() {
    return this.is_model_ready;
  }
  set model_ready(value) {
    this.is_model_ready = Boolean(value);
  }

  // --- Private Engine State ---
  /** @type {any | null} KokoroTTS model instance */
  #tts_instance = null;
  /** @type {boolean} */
  #use_speech_synthesis_fallback = false;
  /** @type {SpeechSynthesis | null} */
  #speech_synthesis_fallback = null;
  /** @type {Array<{ name: string, uri: string, _ref: SpeechSynthesisVoice }>} */
  #platform_speech_voices = [];
  /** @type {Array<{ text: string, voice_id: string | null, message_id: string | null, audio_promise?: Promise<any>, audio_data?: any }>} */
  #synthesis_queue = [];
  /** @type {boolean} */
  #is_processing_queue = false;
  /** @type {boolean} */
  #is_playback_paused = false;
  /** @type {Promise<void> | null} */
  #model_loading_promise = null;
  /** @type {Map<string, Promise<any>>} */
  #audio_synthesis_cache = new Map();
  /** @type {AudioBufferSourceNode | null} */
  #current_audio_source = null;
  /** @type {number} Scheduled end timestamp in AudioContext.currentTime for seamless buffer chaining */
  #next_playback_time = 0;
  /** @type {boolean} Flag indicating whether current stream playback has been cancelled */
  #is_stream_stopped = false;

  constructor() {
    this.voices = KOKORO_VOICES.map((voice) => ({
      name: voice.name,
      uri: voice.uri,
    }));
  }

  /**
   * Explicitly triggers background model download and compilation.
   * @returns {Promise<void>}
   */
  async load_model() {
    await this.#ensure_model();
  }

  /**
   * Lazily loads the Kokoro TTS model from CDN, falling back to Web Speech on failure.
   */
  async #ensure_model() {
    if (this.#tts_instance || this.#use_speech_synthesis_fallback) return;
    if (this.#model_loading_promise) return this.#model_loading_promise;
    this.#model_loading_promise = this.#load_model_inner();
    try {
      return await this.#model_loading_promise;
    } finally {
      this.#model_loading_promise = null;
    }
  }

  async #load_model_inner() {
    this.is_loading = true;
    try {
      const { KokoroTTS } = await import("https://esm.sh/kokoro-js@1.2.1?deps=onnxruntime-web@1.22.0");
      await wait_ort_ready(10000);

      const has_web_gpu = typeof navigator !== "undefined" && Boolean(/** @type {any} */ (navigator).gpu);
      const execution_candidates = has_web_gpu
        ? [
            { device: "webgpu", dtype: "fp32" },
            { device: "wasm", dtype: "q8" },
          ]
        : [{ device: "wasm", dtype: "q8" }];

      let last_execution_error = null;
      for (const { device, dtype } of execution_candidates) {
        try {
          /** @type {Record<string, number>} */
          const file_progress_map = {};

          this.#tts_instance = await onnx_mutex.run(async () => {
            return await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
              dtype,
              device,
              progress_callback: (/** @type {any} */ progress_event) => {
                if (
                  (progress_event.status === "progress" || progress_event.status === "download") &&
                  progress_event.file &&
                  typeof progress_event.progress === "number"
                ) {
                  file_progress_map[progress_event.file] = progress_event.progress;
                  const progress_values = Object.values(file_progress_map);
                  const average_progress = progress_values.reduce((sum, item) => sum + item, 0) / progress_values.length;
                  this.load_progress = Math.round(average_progress);
                }
              },
            });
          });
          this.load_progress = 100;
          this.is_model_ready = true;
          return;
        } catch (candidate_error) {
          last_execution_error = candidate_error;
          this.#tts_instance = null;
          this.load_progress = 0;
        }
      }

      console.warn("[VoiceEngine] Kokoro failed to load, falling back to Web Speech API:", last_execution_error);
      this.#use_speech_synthesis_fallback = true;
      this.#init_speech_synthesis_fallback();
      this.is_model_ready = true;
    } catch (initialization_error) {
      console.warn("[VoiceEngine] Kokoro initialization error, falling back to Web Speech API:", initialization_error);
      this.#use_speech_synthesis_fallback = true;
      this.#init_speech_synthesis_fallback();
      this.is_model_ready = true;
    } finally {
      this.is_loading = false;
    }
  }

  /**
   * Initializes the Web Speech API fallback provider.
   */
  #init_speech_synthesis_fallback() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    this.#speech_synthesis_fallback = window.speechSynthesis;
    const load_fallback_voices = () => {
      const raw_voices = this.#speech_synthesis_fallback?.getVoices() || [];
      if (raw_voices.length === 0) return;
      this.#platform_speech_voices = raw_voices
        .filter((voice_item) => voice_item.lang && String(voice_item.lang).toLowerCase().startsWith("en"))
        .map((voice_item) => ({
          name: voice_item.name,
          uri: voice_item.voiceURI,
          _ref: voice_item,
        }));
    };
    load_fallback_voices();
    this.#speech_synthesis_fallback.onvoiceschanged = load_fallback_voices;
  }

  /**
   * Picks the closest platform fallback voice matching a requested voice id.
   * @param {string | null} voice_identifier
   * @returns {any | null}
   */
  #pick_fallback_voice(voice_identifier) {
    if (this.#platform_speech_voices.length === 0) return null;
    const kokoro_voice_name = resolve_voice_name(voice_identifier).toLowerCase();
    const exact_match = this.#platform_speech_voices.find((voice_item) => voice_item.name.toLowerCase() === kokoro_voice_name);
    if (exact_match) return exact_match;
    const partial_match = this.#platform_speech_voices.find((voice_item) => voice_item.name.toLowerCase().includes(kokoro_voice_name));
    return partial_match || this.#platform_speech_voices[0];
  }

  /**
   * Pauses vocal synthesis and suspends the shared audio graph.
   */
  pause() {
    if (this.#is_playback_paused) return;
    this.#is_playback_paused = true;
    this.is_paused = true;
    const audio_context = get_master_context();
    if (audio_context && audio_context.state === "running") {
      audio_context.suspend().catch(() => {});
    }
    if (this.#speech_synthesis_fallback) {
      try {
        this.#speech_synthesis_fallback.pause();
      } catch {
        /* safe no-op */
      }
    }
  }

  /**
   * Resumes paused vocal synthesis.
   */
  resume() {
    if (!this.#is_playback_paused) return;
    this.#is_playback_paused = false;
    this.is_paused = false;
    const audio_context = get_master_context();
    if (audio_context && audio_context.state === "suspended") {
      audio_context.resume().catch(() => {});
    }
    if (this.#speech_synthesis_fallback) {
      try {
        this.#speech_synthesis_fallback.resume();
      } catch {
        /* safe no-op */
      }
    }
  }

  /**
   * Toggles pause/resume state for speech playback.
   */
  toggle_pause() {
    if (this.#is_playback_paused) this.resume();
    else this.pause();
  }

  /**
   * Updates master voice volume and coordinates shared master gain.
   * @param {number} volume_level
   */
  set_volume(volume_level) {
    this.volume = volume_level;
    set_master_volume(volume_level);
  }

  /**
   * Resumes the shared AudioContext on user interaction to clear autoplay blocks.
   */
  async resume_context() {
    const audio_context = get_master_context();
    if (audio_context && audio_context.state === "suspended") {
      try {
        await audio_context.resume();
      } catch {
        /* Autoplay blocked — retried on next user gesture */
      }
    }
  }

  /**
   * Synthesizes and plays a narrative block of text.
   * @param {string} text
   * @param {boolean} [should_clear_queue=true]
   * @param {boolean} [force=false]
   */
  speak(text, should_clear_queue = true, force = false) {
    if (!text) return;
    if (!this.enabled && !force) return;

    if (should_clear_queue) {
      const pending_message_id = this.active_message_id;
      this.stop();
      this.active_message_id = pending_message_id;
      this.#is_stream_stopped = false;
    }

    const speech_ready_text = strip_cognition_blocks(text)
      .replace(/[*_#`~]/g, "")
      .replace(/\[\[(.*?)\]\]/g, "$1")
      .replace(/<[^>]*>/g, "")
      .trim();

    if (!speech_ready_text) return;

    const { sentences, tail } = split_speech_sentences(speech_ready_text);
    const text_chunks = tail ? [...sentences, tail] : sentences;
    this.#enqueue_chunks(text_chunks.map((sentence_text) => ({ text: sentence_text, voice_id: this.selected_voice })));
  }

  /**
   * @param {Array<{ text: string, voice_id: string | null }>} text_chunks
   */
  #enqueue_chunks(text_chunks) {
    for (const chunk of text_chunks) {
      const text_content = String(chunk.text || "").trim();
      if (!text_content) continue;
      if (this.#synthesis_queue.length > 0 && this.#synthesis_queue[this.#synthesis_queue.length - 1].text === text_content) {
        continue;
      }

      this.#synthesis_queue.push({
        text: text_content,
        voice_id: chunk.voice_id || this.selected_voice,
        message_id: this.active_message_id,
      });
    }

    if (!this.#is_processing_queue) {
      this.#process_queue();
    } else {
      this.#pregenerate_queue();
    }
  }

  /**
   * Pre-generates subsequent queued chunks in the background.
   */
  #pregenerate_queue() {
    if (this.#use_speech_synthesis_fallback || !this.#tts_instance) return;

    let pregeneration_budget = PREGENERATE_BUDGET;
    for (const queue_item of this.#synthesis_queue) {
      if (pregeneration_budget <= 0) break;
      if (!queue_item.audio_promise && !queue_item.audio_data) {
        pregeneration_budget--;
        const item_message_id = queue_item.message_id;
        queue_item.audio_promise = this.#cached_generate(queue_item.text, queue_item.voice_id || "am_adam", this.rate).then((generation_result) => {
          if (this.active_message_id && item_message_id && item_message_id !== this.active_message_id) {
            return null;
          }
          return generation_result;
        });
      }
    }
  }

  /**
   * Synthesizes audio through an LRU-bounded synthesis cache.
   * @param {string} text
   * @param {string} voice_identifier
   * @param {number} speech_rate
   * @returns {Promise<any>}
   */
  #cached_generate(text, voice_identifier, speech_rate) {
    const cache_key = `${voice_identifier}\u0000${speech_rate}\u0000${text}`;
    const existing_promise = this.#audio_synthesis_cache.get(cache_key);
    if (existing_promise) return existing_promise;

    const synthesis_promise = onnx_mutex
      .run(() => this.#tts_instance.generate(text, { voice: voice_identifier, speed: speech_rate }))
      .catch((synthesis_error) => {
        this.#audio_synthesis_cache.delete(cache_key);
        throw synthesis_error;
      });

    if (this.#audio_synthesis_cache.size >= AUDIO_CACHE_MAX) {
      this.#audio_synthesis_cache.delete(this.#audio_synthesis_cache.keys().next().value);
    }
    this.#audio_synthesis_cache.set(cache_key, synthesis_promise);
    return synthesis_promise;
  }

  /**
   * Processes speech queue sequentially.
   */
  async #process_queue() {
    if (this.#synthesis_queue.length === 0) {
      this.#is_processing_queue = false;
      this.is_speaking = false;
      this.active_message_id = null;
      return;
    }

    this.#is_processing_queue = true;
    this.is_speaking = true;

    await this.#ensure_model();

    if (this.#use_speech_synthesis_fallback) {
      this.#process_fallback();
      return;
    }

    this.#pregenerate_queue();

    const current_item = this.#synthesis_queue[0];
    if (!current_item) {
      this.#is_processing_queue = false;
      this.is_speaking = false;
      return;
    }

    if (current_item.message_id && this.active_message_id && current_item.message_id !== this.active_message_id) {
      this.#synthesis_queue.shift();
      this.#process_queue();
      return;
    }

    try {
      const audio = current_item.audio_data
        ? current_item.audio_data
        : current_item.audio_promise
          ? await current_item.audio_promise
          : await this.#cached_generate(current_item.text, current_item.voice_id || "am_adam", this.rate);

      if (!this.#is_processing_queue || (current_item.message_id && this.active_message_id && current_item.message_id !== this.active_message_id)) {
        return;
      }

      if (audio?.audio) {
        if (this.#is_playback_paused) {
          current_item.audio_data = audio.audio;
          this.#resume_wait();
          return;
        }
        await this.#play_audio(audio.audio, audio.sampling_rate || 24000);
        await this.#wait_for_playback();
      }
    } catch (generation_error) {
      console.warn("[VoiceEngine] Kokoro generation error:", generation_error);
    }

    if (this.#is_processing_queue) {
      this.#synthesis_queue.shift();
      if (this.#synthesis_queue.length > 0) {
        const audio_context = get_master_context();
        const lead_time_ms = audio_context ? (this.#next_playback_time - audio_context.currentTime) * 1000 : 0;
        if (lead_time_ms > 2000) {
          setTimeout(() => this.#process_queue(), Math.max(50, Math.round(lead_time_ms - 1000)));
        } else {
          setTimeout(() => this.#process_queue(), 0);
        }
      } else {
        await this.#wait_for_playback();
        if (this.#synthesis_queue.length === 0) {
          this.#is_processing_queue = false;
          this.is_speaking = false;
          this.#next_playback_time = 0;
        } else {
          setTimeout(() => this.#process_queue(), 0);
        }
      }
    }
  }

  #resume_wait() {
    setTimeout(() => {
      if (this.#is_playback_paused) {
        this.#resume_wait();
      } else if (this.#is_processing_queue) {
        this.#process_queue();
      }
    }, 50);
  }

  #wait_for_playback() {
    return new Promise((resolve) => {
      const audio_source = this.#current_audio_source;
      if (!audio_source) {
        resolve();
        return;
      }
      const mark_done = () => {
        if (this.#current_audio_source === audio_source) this.#current_audio_source = null;
        resolve();
      };
      audio_source.onended = mark_done;
      const watchdog_guard = () => {
        if (this.#current_audio_source === audio_source) {
          if (this.#is_playback_paused) {
            setTimeout(watchdog_guard, 5000);
            return;
          }
          try {
            audio_source.stop();
          } catch {
            /* safe no-op */
          }
        }
        mark_done();
      };
      setTimeout(watchdog_guard, 30000);
    });
  }

  /**
   * Plays PCM audio through the shared AudioContext buffer graph.
   * @param {Float32Array | number[]} audio_data
   * @param {number} sample_rate
   */
  async #play_audio(audio_data, sample_rate) {
    const audio_context = get_master_context();
    const gain_node = get_master_gain();
    if (!audio_context || !gain_node) return;

    if (audio_context.state === "suspended") {
      try {
        await audio_context.resume();
      } catch {
        /* Autoplay blocked */
      }
    }

    const audio_buffer = audio_context.createBuffer(1, audio_data.length, sample_rate);
    audio_buffer.getChannelData(0).set(audio_data);

    const source_node = audio_context.createBufferSource();
    source_node.buffer = audio_buffer;
    source_node.connect(gain_node);

    const now_time = audio_context.currentTime;
    const scheduled_start_time = Math.max(now_time, this.#next_playback_time);
    source_node.start(scheduled_start_time);
    this.#next_playback_time = scheduled_start_time + audio_buffer.duration;
    this.#current_audio_source = source_node;
  }

  /**
   * Processes speech chunks using Web Speech API fallback.
   */
  #process_fallback() {
    if (!this.#speech_synthesis_fallback) {
      this.#is_processing_queue = false;
      this.is_speaking = false;
      return;
    }

    if (this.#synthesis_queue.length === 0) {
      this.#is_processing_queue = false;
      this.is_speaking = false;
      this.active_message_id = null;
      return;
    }

    const current_item = this.#synthesis_queue[0];
    const utterance = new SpeechSynthesisUtterance(current_item.text);
    const matched_voice = this.#pick_fallback_voice(current_item.voice_id) || this.voices[0];
    if (matched_voice?._ref) utterance.voice = matched_voice._ref;
    utterance.volume = this.volume;
    utterance.rate = this.rate;

    let is_settled = false;
    const advance_queue = (is_interrupted) => {
      if (is_settled) return;
      is_settled = true;
      this.#synthesis_queue.shift();
      setTimeout(() => this.#process_fallback(), is_interrupted ? 250 : 40);
    };

    utterance.onend = () => advance_queue(false);
    utterance.onerror = (error_event) => advance_queue(error_event?.error === "interrupted" || error_event?.error === "canceled");
    this.#speech_synthesis_fallback.speak(utterance);
  }

  /**
   * Previews a voice with a sample phrase.
   * @param {string} name_or_uri
   * @param {number} [cadence_rate=1.0]
   */
  async preview(name_or_uri, cadence_rate = 1.0) {
    this.stop();
    const resolved_uri = resolve_voice_uri(name_or_uri);
    const target_voice = this.voices.find((voice) => voice.uri === resolved_uri || voice.name === name_or_uri);
    if (!target_voice) return;

    await this.#ensure_model();

    if (this.#use_speech_synthesis_fallback) {
      if (!this.#speech_synthesis_fallback) return;
      this.is_speaking = true;
      const utterance = new SpeechSynthesisUtterance("Previewing voice system.");
      const fallback_voice = this.#pick_fallback_voice(resolved_uri);
      if (fallback_voice?._ref) utterance.voice = fallback_voice._ref;
      utterance.rate = cadence_rate;
      utterance.onend = () => (this.is_speaking = false);
      utterance.onerror = () => (this.is_speaking = false);
      this.#speech_synthesis_fallback.speak(utterance);
      return;
    }

    this.is_speaking = true;
    try {
      const audio_result = await this.#tts_instance.generate("Previewing voice system.", {
        voice: resolved_uri,
        speed: cadence_rate,
      });
      await this.#play_audio(audio_result.audio, audio_result.sampling_rate || 24000);
      if (this.#current_audio_source) {
        this.#current_audio_source.onended = () => (this.is_speaking = false);
      }
    } catch (preview_error) {
      console.warn("[VoiceEngine] Preview failed:", preview_error);
      this.is_speaking = false;
    }
  }

  /**
   * Stops active speech playback and flushes synthesis queues.
   */
  stop() {
    this.#is_stream_stopped = true;
    this.#synthesis_queue = [];
    this.#is_processing_queue = false;
    this.#is_playback_paused = false;
    this.is_paused = false;
    this.#next_playback_time = 0;

    const audio_context = get_master_context();
    if (audio_context && audio_context.state === "suspended") {
      audio_context.resume().catch(() => {});
    }

    if (this.#current_audio_source) {
      try {
        this.#current_audio_source.onended = null;
        this.#current_audio_source.stop();
      } catch {
        /* safe no-op */
      }
      this.#current_audio_source = null;
    }

    if (this.#speech_synthesis_fallback) {
      this.#speech_synthesis_fallback.cancel();
    }

    this.is_speaking = false;
    this.active_message_id = null;
  }

  /**
   * Cleans up vocal engine resources and flushes memory.
   */
  destroy() {
    this.stop();
    this.#audio_synthesis_cache.clear();
    this.#synthesis_queue = [];
    this.#tts_instance = null;
    this.spoken_character_cursor = 0;
    suspend_master_context();
  }

  reset_stream() {
    this.#is_stream_stopped = false;
    this.spoken_character_cursor = 0;
    this.#next_playback_time = 0;
  }

  /**
   * Configures voice parameters for a streaming message.
   * @param {string | null | undefined} role
   * @param {string | null | number} message_id
   */
  apply_stream_role(role, message_id) {
    this.reset_stream();
    this.active_message_id = message_id;
    if (!role || role === "system") return;

    const normalized_role = normalize_role(role, { preserve_npc: true });
    if (!normalized_role) return;

    const runtime_instance = state_bridge.runtime;
    let speaking_entity = null;
    if (normalized_role === "ai") speaking_entity = runtime_instance?.active_ai;
    else if (normalized_role === "user") speaking_entity = runtime_instance?.active_user;
    else if (normalized_role === "fractal") speaking_entity = runtime_instance?.active_fractal;
    else if (normalized_role === "npc") {
      speaking_entity = runtime_instance?.active_npcs?.[runtime_instance?.streaming_entity_id] || null;
    }

    if (speaking_entity?.voice) {
      const voice_identifier = speaking_entity.voice.name || speaking_entity.voice.uri;
      this.selected_voice = resolve_voice_uri(voice_identifier);
      const dynamics_value =
        normalized_role === "user"
          ? 50
          : normalized_role === "ai"
            ? (speaking_entity.dynamics?.intensity ?? 50)
            : (speaking_entity.dynamics?.velocity ?? 50);
      this.rate = get_cadence_rate(speaking_entity.voice.cadence, dynamics_value);
    }
  }

  /**
   * Streams progressive turn prose sentence-by-sentence.
   * @param {string} current_raw_text
   */
  queue_stream_sentence(current_raw_text) {
    if (this.#is_stream_stopped) return;
    const sanitized_stream_track = current_raw_text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "");
    const fresh_buffer = sanitized_stream_track.slice(this.spoken_character_cursor);

    const { sentences, committed } = split_speech_sentences(fresh_buffer);
    const sanitize_sentence_text = (raw_sentence) =>
      strip_cognition_blocks(raw_sentence)
        .replace(/[*_#`~]/g, "")
        .replace(/\[\[(.*?)\]\]/g, "$1")
        .replace(/<[^>]*>/g, "")
        .trim();

    for (const raw_sentence of sentences) {
      if (!raw_sentence) continue;
      try {
        const clean_sentence_text = sanitize_sentence_text(raw_sentence);
        if (clean_sentence_text) {
          this.#enqueue_chunks([{ text: clean_sentence_text, voice_id: this.selected_voice }]);
        }
      } catch (synthesis_error) {
        console.warn("[VoiceEngine] TTS speak error during streaming:", synthesis_error);
      }
    }

    this.spoken_character_cursor += committed;
  }

  /**
   * Flushes remaining streaming text buffer upon stream completion.
   * @param {string} current_raw_text
   */
  flush_stream_remainder(current_raw_text) {
    if (this.#is_stream_stopped) return;
    const sanitized_stream_track = current_raw_text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "");
    const remaining_text = sanitized_stream_track.slice(this.spoken_character_cursor);
    const clean_remainder = strip_cognition_blocks(remaining_text).trim();

    if (clean_remainder) {
      this.#enqueue_chunks([{ text: clean_remainder, voice_id: this.selected_voice }]);
    }
  }
}

// ============================================================================
// [SECTION 3: SOUND EFFECTS ENGINE]
// ============================================================================

const SOUND_CACHE_MAX = 32;

/**
 * Manages UI sound effects and audio buffer caching.
 */
class AudioEffectsEngine {
  /** @type {Map<string, AudioBuffer>} */
  #sound_buffer_cache = new Map();
  /** @type {Map<string, Promise<AudioBuffer>>} */
  #pending_sound_fetches = new Map();
  /** @type {boolean} */
  #is_unlocked = false;
  /** @type {number} */
  #last_played_timestamp = 0;
  /** @type {number} */
  #playback_threshold_ms = 500;

  notifications_enabled = $state(false);

  constructor() {
    this.#init_interaction_listeners();
  }

  async init_settings() {
    try {
      if (typeof window === "undefined" || !window.indexedDB || !db?.audio_prefs) return;
      const saved_entry = await db.audio_prefs.get(AUDIO_STORAGE_KEY);
      if (saved_entry?.value) {
        this.notifications_enabled = saved_entry.value.notifications_enabled === true;
        audio_engine.voice.enabled = saved_entry.value.voice_enabled === true;
        if (saved_entry.value.entity_voice && typeof saved_entry.value.entity_voice === "object") {
          audio_engine.voice.entity_voice = {
            ai: saved_entry.value.entity_voice.ai === true,
            user: saved_entry.value.entity_voice.user === true,
            fractal: saved_entry.value.entity_voice.fractal === true,
          };
        }
        if (saved_entry.value.master_volume !== undefined) {
          audio_engine.voice.set_volume(saved_entry.value.master_volume);
        }
      } else {
        this.notifications_enabled = false;
        audio_engine.voice.enabled = false;
      }
    } catch (load_error) {
      if (typeof window !== "undefined") {
        console.warn("[AudioEngine] Failed to load settings:", load_error);
      }
    }
  }

  async save_all_settings() {
    try {
      if (typeof window === "undefined" || !window.indexedDB || !db?.audio_prefs) return;
      await db.audio_prefs.put({
        key: AUDIO_STORAGE_KEY,
        value: {
          notifications_enabled: this.notifications_enabled,
          voice_enabled: audio_engine.voice.enabled,
          entity_voice: {
            ai: Boolean(audio_engine.voice.entity_voice?.ai),
            user: Boolean(audio_engine.voice.entity_voice?.user),
            fractal: Boolean(audio_engine.voice.entity_voice?.fractal),
          },
          master_volume: audio_engine.voice.volume,
        },
      });
    } catch (save_error) {
      if (typeof window !== "undefined") {
        console.error("[AudioEngine] Failed to save settings:", save_error);
      }
    }
  }

  /**
   * @param {number} volume_level
   */
  set_volume(volume_level) {
    set_master_volume(volume_level);
  }

  #init_interaction_listeners() {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const unlock_handler = () => {
      this.unlock();
      ["click", "touchstart", "keydown"].forEach((event_type) => document.body?.removeEventListener(event_type, unlock_handler));
    };
    ["click", "touchstart", "keydown"].forEach((event_type) => document.body?.addEventListener(event_type, unlock_handler));
  }

  async unlock() {
    if (this.#is_unlocked) return;
    try {
      const audio_context = get_master_context();
      if (!audio_context) {
        console.warn("[AudioEngine] AudioContext not supported in this environment.");
        return;
      }
      if (audio_context.state === "suspended") {
        await audio_context.resume();
      }
      this.#is_unlocked = true;
    } catch (unlock_error) {
      console.warn("[AudioEngine] Failed to unlock AudioContext:", unlock_error);
    }
  }

  /**
   * Plays a requested sound effect key.
   * @param {string} sound_key
   */
  async play(sound_key) {
    if (sound_key === "notification" && !this.notifications_enabled) return;

    const audio_context = get_master_context();
    const gain_node = get_master_gain();
    if (!this.#is_unlocked || !audio_context || !gain_node) return;

    const current_timestamp = Date.now();
    if (current_timestamp - this.#last_played_timestamp < this.#playback_threshold_ms) return;
    this.#last_played_timestamp = current_timestamp;

    let sound_url = null;
    const sound_list = get_sound_list();
    if (sound_list.length > 0) {
      const matched_entry = sound_list.find(
        (/** @type {any} */ sound_entry) => typeof sound_entry === "string" && sound_entry.startsWith(sound_key + "="),
      );
      if (matched_entry) sound_url = matched_entry.split("=").slice(1).join("=").trim();
    }

    if (!sound_url && sound_key === "notification") {
      sound_url = DEFAULT_NOTIFICATION_SOUND;
    }

    if (!sound_url) return;

    try {
      let cached_buffer = this.#sound_buffer_cache.get(sound_key);
      if (!cached_buffer) {
        if (this.#pending_sound_fetches.has(sound_key)) {
          cached_buffer = await this.#pending_sound_fetches.get(sound_key);
        } else {
          const fetch_promise = (async () => {
            try {
              const response = await fetch(sound_url);
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              const raw_array_buffer = await response.arrayBuffer();
              const decoded_buffer = await new Promise((resolve, reject) => {
                const decode_promise = audio_context.decodeAudioData(raw_array_buffer, resolve, reject);
                if (decode_promise) decode_promise.then(resolve).catch(reject);
              });
              if (this.#sound_buffer_cache.size >= SOUND_CACHE_MAX) {
                const oldest_key = this.#sound_buffer_cache.keys().next().value;
                if (oldest_key) this.#sound_buffer_cache.delete(oldest_key);
              }
              this.#sound_buffer_cache.set(sound_key, decoded_buffer);
              return decoded_buffer;
            } finally {
              this.#pending_sound_fetches.delete(sound_key);
            }
          })();

          this.#pending_sound_fetches.set(sound_key, fetch_promise);
          cached_buffer = await fetch_promise;
        }
      }
      const buffer_source = audio_context.createBufferSource();
      buffer_source.buffer = cached_buffer || null;
      buffer_source.connect(gain_node);
      buffer_source.start(0);
    } catch (playback_error) {
      console.warn("[AudioEngine] Playback error:", playback_error);
    }
  }

  destroy() {
    close_master_context();
    this.#sound_buffer_cache.clear();
    this.#pending_sound_fetches.clear();
  }
}

// ============================================================================
// [SECTION 4: AUDIO SINGLETON FACADE]
// ============================================================================

/**
 * Unified Audio Singleton Facade Engine.
 */
export class AudioEngine {
  #effects_engine = new AudioEffectsEngine();
  /** @type {Promise<void> | null} */
  #initialization_promise = null;

  voice = new VoiceEngine();

  constructor() {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const unlock_voice_handler = () => {
      this.voice.resume_context().catch(() => {});
    };
    ["click", "touchstart", "keydown"].forEach((event_type) => document.addEventListener(event_type, unlock_voice_handler, { once: true }));
  }

  get volume() {
    return this.voice.volume;
  }

  set volume(volume_level) {
    const clean_volume = Math.max(0, Math.min(1, Number(volume_level)));
    this.voice.set_volume(clean_volume);
    this.#effects_engine.save_all_settings();
  }

  get notifications_enabled() {
    return this.#effects_engine.notifications_enabled;
  }

  set notifications_enabled(is_enabled) {
    this.#effects_engine.notifications_enabled = Boolean(is_enabled);
    this.#effects_engine.save_all_settings();
  }

  get voice_enabled() {
    return this.voice.enabled;
  }

  set voice_enabled(is_enabled) {
    this.voice.enabled = Boolean(is_enabled);
    this.#effects_engine.save_all_settings();
  }

  get entity_voice() {
    return this.voice.entity_voice;
  }

  /**
   * @param {string | null} role
   * @returns {boolean}
   */
  is_role_enabled(role) {
    const normalized_role = normalize_role(role);
    if (!normalized_role) return false;
    return this.voice_enabled && Boolean(this.voice.entity_voice[normalized_role]);
  }

  /**
   * @param {string} role
   * @param {boolean} is_enabled
   */
  set_entity_voice(role, is_enabled) {
    const normalized_role = normalize_role(role);
    if (!normalized_role) return;
    const boolean_value = Boolean(is_enabled);
    if (boolean_value) {
      this.voice_enabled = true;
    }
    this.voice.entity_voice[normalized_role] = boolean_value;
    this.#effects_engine.save_all_settings();
  }

  /**
   * @param {string} role
   * @returns {boolean}
   */
  toggle_entity_voice(role) {
    const normalized_role = normalize_role(role);
    if (!normalized_role) return false;
    const next_value = !this.voice.entity_voice[normalized_role];
    this.set_entity_voice(normalized_role, next_value);
    if (!next_value) this.voice.stop();
    return next_value;
  }

  /**
   * @param {string} sound_key
   */
  play(sound_key) {
    return this.#effects_engine.play(sound_key);
  }

  async init() {
    if (this.#initialization_promise) return this.#initialization_promise;
    this.#initialization_promise = this.#effects_engine.init_settings();
    return this.#initialization_promise;
  }

  destroy() {
    this.voice.destroy();
    this.#effects_engine.destroy();
  }
}

export const audio_engine = new AudioEngine();
export const Audio = audio_engine;

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured 4 explicit section dividers, converted anonymous class singleton into named AudioEngine
 *   class exporting audio_engine & Audio, standardized anti-abbreviation nomenclature across private/public
 *   identifiers, and unified lifecycle resource teardown.
 * - 2026-08-28: Integrated Kokoro-82M ONNX model loading via WebGPU/WASM and Web Speech API fallback.
 * - 2026-06-15: Initial audio effects and notification sound manager.
 */
