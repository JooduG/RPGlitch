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
 * 3. Reactive Audio Singleton (`Audio`):
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
let shared_context = null;
/** @type {GainNode | null} */
let master_gain = null;
let current_master_volume = 1.0;

/**
 * Returns the module-wide shared AudioContext, lazily instantiating it on first use.
 * @returns {AudioContext | null}
 */
function get_master_context() {
  if (shared_context) return shared_context;
  if (typeof window === "undefined") return null;

  const AudioCtx = /** @type {any} */ (window).AudioContext || /** @type {any} */ (window).webkitAudioContext;
  if (!AudioCtx) return null;

  shared_context = new AudioCtx();
  master_gain = shared_context.createGain();
  master_gain.gain.setValueAtTime(current_master_volume, shared_context.currentTime);
  master_gain.connect(shared_context.destination);
  return shared_context;
}

/**
 * Returns the master gain node on the shared graph.
 * @returns {GainNode | null}
 */
function get_master_gain() {
  get_master_context();
  return master_gain;
}

/**
 * Updates the master volume level across the shared audio graph.
 * @param {number} volume
 */
function set_master_volume(volume) {
  current_master_volume = Math.max(0, Math.min(1, Number(volume)));
  if (master_gain && shared_context) {
    master_gain.gain.setValueAtTime(current_master_volume, shared_context.currentTime);
  }
}

/**
 * Suspends the shared AudioContext when idle or transitioning.
 */
function suspend_master_context() {
  if (shared_context && shared_context.state !== "closed" && shared_context.state !== "suspended") {
    try {
      shared_context.suspend().catch(() => {});
    } catch {
      /* safe no-op */
    }
  }
}

/**
 * Closes and nullifies the shared AudioContext on teardown.
 */
function close_master_context() {
  if (shared_context) {
    if (shared_context.state !== "closed") {
      try {
        shared_context.close().catch(() => {});
      } catch {
        /* safe no-op */
      }
    }
    shared_context = null;
    master_gain = null;
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
    } catch (e) {
      console.warn(`[AudioEngine] get_sound_list: Failed to parse JSON for '${key}'.`, e);
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
  model_ready = $state(false);
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

  // --- Private Engine State ---
  /** @type {any | null} KokoroTTS model instance */
  #tts = null;
  /** @type {boolean} */
  #use_fallback = false;
  /** @type {SpeechSynthesis | null} */
  #synth_fallback = null;
  /** @type {Array<{ name: string, uri: string, _ref: SpeechSynthesisVoice }>} */
  #platform_voices = [];
  /** @type {Array<{ text: string, voice_id: string | null, message_id: string | null, audio_promise?: Promise<any>, audio_data?: any }>} */
  #queue = [];
  /** @type {boolean} */
  #is_processing = false;
  /** @type {boolean} */
  #paused = false;
  /** @type {Promise<void> | null} */
  #model_promise = null;
  /** @type {Map<string, Promise<any>>} */
  #audio_cache = new Map();
  /** @type {AudioBufferSourceNode | null} */
  #current_audio_source = null;
  /** @type {number} Scheduled end timestamp in AudioContext.currentTime for seamless buffer chaining */
  #next_play_time = 0;
  /** @type {boolean} Flag indicating whether current stream playback has been cancelled */
  #stream_stopped = false;

  constructor() {
    this.voices = KOKORO_VOICES.map((v) => ({
      name: v.name,
      uri: v.uri,
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
    if (this.#tts || this.#use_fallback) return;
    if (this.#model_promise) return this.#model_promise;
    this.#model_promise = this.#load_model_inner();
    try {
      return await this.#model_promise;
    } finally {
      this.#model_promise = null;
    }
  }

  async #load_model_inner() {
    this.is_loading = true;
    try {
      const { KokoroTTS } = await import("https://esm.sh/kokoro-js@1.2.1?deps=onnxruntime-web@1.22.0");
      await wait_ort_ready(10000);

      const has_web_gpu = typeof navigator !== "undefined" && Boolean(/** @type {any} */ (navigator).gpu);
      const candidates = has_web_gpu
        ? [
            { device: "webgpu", dtype: "fp32" },
            { device: "wasm", dtype: "q8" },
          ]
        : [{ device: "wasm", dtype: "q8" }];

      let last_error = null;
      for (const { device, dtype } of candidates) {
        try {
          /** @type {Record<string, number>} */
          const file_progress = {};

          this.#tts = await onnx_mutex.run(async () => {
            return await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
              dtype,
              device,
              progress_callback: (/** @type {any} */ data) => {
                if ((data.status === "progress" || data.status === "download") && data.file && typeof data.progress === "number") {
                  file_progress[data.file] = data.progress;
                  const values = Object.values(file_progress);
                  const avg = values.reduce((a, b) => a + b, 0) / values.length;
                  this.load_progress = Math.round(avg);
                }
              },
            });
          });
          this.load_progress = 100;
          this.model_ready = true;
          return;
        } catch (err) {
          last_error = err;
          this.#tts = null;
          this.load_progress = 0;
        }
      }

      console.warn("[VoiceEngine] Kokoro failed to load, falling back to Web Speech API:", last_error);
      this.#use_fallback = true;
      this.#init_fallback();
      this.model_ready = true;
    } catch (err) {
      console.warn("[VoiceEngine] Kokoro initialization error, falling back to Web Speech API:", err);
      this.#use_fallback = true;
      this.#init_fallback();
      this.model_ready = true;
    } finally {
      this.is_loading = false;
    }
  }

  /**
   * Initializes the Web Speech API fallback provider.
   */
  #init_fallback() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    this.#synth_fallback = window.speechSynthesis;
    const load_fallback = () => {
      const raw = this.#synth_fallback?.getVoices() || [];
      if (raw.length === 0) return;
      this.#platform_voices = raw
        .filter((v) => v.lang && String(v.lang).toLowerCase().startsWith("en"))
        .map((v) => ({
          name: v.name,
          uri: v.voiceURI,
          _ref: v,
        }));
    };
    load_fallback();
    this.#synth_fallback.onvoiceschanged = load_fallback;
  }

  /**
   * Picks the closest platform fallback voice matching a requested voice id.
   * @param {string | null} voice_id
   * @returns {any | null}
   */
  #pick_fallback_voice(voice_id) {
    if (this.#platform_voices.length === 0) return null;
    const kokoro_name = resolve_voice_name(voice_id).toLowerCase();
    const by_exact = this.#platform_voices.find((v) => v.name.toLowerCase() === kokoro_name);
    if (by_exact) return by_exact;
    const by_partial = this.#platform_voices.find((v) => v.name.toLowerCase().includes(kokoro_name));
    return by_partial || this.#platform_voices[0];
  }

  /**
   * Pauses vocal synthesis and suspends the shared audio graph.
   */
  pause() {
    if (this.#paused) return;
    this.#paused = true;
    this.is_paused = true;
    const ctx = get_master_context();
    if (ctx && ctx.state === "running") {
      ctx.suspend().catch(() => {});
    }
    if (this.#synth_fallback) {
      try {
        this.#synth_fallback.pause();
      } catch {
        /* empty */
      }
    }
  }

  /**
   * Resumes paused vocal synthesis.
   */
  resume() {
    if (!this.#paused) return;
    this.#paused = false;
    this.is_paused = false;
    const ctx = get_master_context();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    if (this.#synth_fallback) {
      try {
        this.#synth_fallback.resume();
      } catch {
        /* empty */
      }
    }
  }

  /**
   * Toggles pause/resume state for speech playback.
   */
  toggle_pause() {
    if (this.#paused) this.resume();
    else this.pause();
  }

  /**
   * Updates master voice volume and coordinates shared master gain.
   * @param {number} v
   */
  set_volume(v) {
    this.volume = v;
    set_master_volume(v);
  }

  /**
   * Resumes the shared AudioContext on user interaction to clear autoplay blocks.
   */
  async resume_context() {
    const ctx = get_master_context();
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
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
      this.#stream_stopped = false;
    }

    const speech_ready_text = strip_cognition_blocks(text)
      .replace(/[*_#`~]/g, "")
      .replace(/\[\[(.*?)\]\]/g, "$1")
      .replace(/<[^>]*>/g, "")
      .trim();

    if (!speech_ready_text) return;

    const { sentences, tail } = split_speech_sentences(speech_ready_text);
    const chunks = tail ? [...sentences, tail] : sentences;
    this.#enqueue_chunks(chunks.map((t) => ({ text: t, voice_id: this.selected_voice })));
  }

  /**
   * @param {Array<{ text: string, voice_id: string | null }>} chunks
   */
  #enqueue_chunks(chunks) {
    for (const chunk of chunks) {
      const text = String(chunk.text || "").trim();
      if (!text) continue;
      if (this.#queue.length > 0 && this.#queue[this.#queue.length - 1].text === text) {
        continue;
      }

      this.#queue.push({
        text,
        voice_id: chunk.voice_id || this.selected_voice,
        message_id: this.active_message_id,
      });
    }

    if (!this.#is_processing) {
      this.#process_queue();
    } else {
      this.#pregenerate_queue();
    }
  }

  /**
   * Pre-generates subsequent queued chunks in the background.
   */
  #pregenerate_queue() {
    if (this.#use_fallback || !this.#tts) return;

    let budget = PREGENERATE_BUDGET;
    for (const item of this.#queue) {
      if (budget <= 0) break;
      if (!item.audio_promise && !item.audio_data) {
        budget--;
        const item_msg_id = item.message_id;
        item.audio_promise = this.#cached_generate(item.text, item.voice_id || "am_adam", this.rate).then((res) => {
          if (this.active_message_id && item_msg_id && item_msg_id !== this.active_message_id) {
            return null;
          }
          return res;
        });
      }
    }
  }

  /**
   * Synthesizes audio through an LRU-bounded synthesis cache.
   * @param {string} text
   * @param {string} voice_id
   * @param {number} speed
   * @returns {Promise<any>}
   */
  #cached_generate(text, voice_id, speed) {
    const key = `${voice_id}\u0000${speed}\u0000${text}`;
    const existing = this.#audio_cache.get(key);
    if (existing) return existing;

    const promise = onnx_mutex
      .run(() => this.#tts.generate(text, { voice: voice_id, speed }))
      .catch((err) => {
        this.#audio_cache.delete(key);
        throw err;
      });

    if (this.#audio_cache.size >= AUDIO_CACHE_MAX) {
      this.#audio_cache.delete(this.#audio_cache.keys().next().value);
    }
    this.#audio_cache.set(key, promise);
    return promise;
  }

  /**
   * Processes speech queue sequentially.
   */
  async #process_queue() {
    if (this.#queue.length === 0) {
      this.#is_processing = false;
      this.is_speaking = false;
      this.active_message_id = null;
      return;
    }

    this.#is_processing = true;
    this.is_speaking = true;

    await this.#ensure_model();

    if (this.#use_fallback) {
      this.#process_fallback();
      return;
    }

    this.#pregenerate_queue();

    const current_item = this.#queue[0];
    if (!current_item) {
      this.#is_processing = false;
      this.is_speaking = false;
      return;
    }

    if (current_item.message_id && this.active_message_id && current_item.message_id !== this.active_message_id) {
      this.#queue.shift();
      this.#process_queue();
      return;
    }

    try {
      const audio = current_item.audio_data
        ? current_item.audio_data
        : current_item.audio_promise
          ? await current_item.audio_promise
          : await this.#cached_generate(current_item.text, current_item.voice_id || "am_adam", this.rate);

      if (!this.#is_processing || (current_item.message_id && this.active_message_id && current_item.message_id !== this.active_message_id)) {
        return;
      }

      if (audio?.audio) {
        if (this.#paused) {
          current_item.audio_data = audio.audio;
          this.#resume_wait();
          return;
        }
        await this.#play_audio(audio.audio, audio.sampling_rate || 24000);
        await this.#wait_for_playback();
      }
    } catch (err) {
      console.warn("[VoiceEngine] Kokoro generation error:", err);
    }

    if (this.#is_processing) {
      this.#queue.shift();
      if (this.#queue.length > 0) {
        const ctx = get_master_context();
        const lead_time = ctx ? (this.#next_play_time - ctx.currentTime) * 1000 : 0;
        if (lead_time > 2000) {
          setTimeout(() => this.#process_queue(), Math.max(50, Math.round(lead_time - 1000)));
        } else {
          setTimeout(() => this.#process_queue(), 0);
        }
      } else {
        await this.#wait_for_playback();
        if (this.#queue.length === 0) {
          this.#is_processing = false;
          this.is_speaking = false;
          this.#next_play_time = 0;
        } else {
          setTimeout(() => this.#process_queue(), 0);
        }
      }
    }
  }

  #resume_wait() {
    setTimeout(() => {
      if (this.#paused) {
        this.#resume_wait();
      } else if (this.#is_processing) {
        this.#process_queue();
      }
    }, 50);
  }

  #wait_for_playback() {
    return new Promise((resolve) => {
      const source = this.#current_audio_source;
      if (!source) {
        resolve();
        return;
      }
      const done = () => {
        if (this.#current_audio_source === source) this.#current_audio_source = null;
        resolve();
      };
      source.onended = done;
      const guard = () => {
        if (this.#current_audio_source === source) {
          if (this.#paused) {
            setTimeout(guard, 5000);
            return;
          }
          try {
            source.stop();
          } catch {
            /* empty */
          }
        }
        done();
      };
      setTimeout(guard, 30000);
    });
  }

  /**
   * Plays PCM audio through the shared AudioContext buffer graph.
   * @param {Float32Array | number[]} audio_data
   * @param {number} sample_rate
   */
  async #play_audio(audio_data, sample_rate) {
    const ctx = get_master_context();
    const gain = get_master_gain();
    if (!ctx || !gain) return;

    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        /* Autoplay blocked */
      }
    }

    const buffer = ctx.createBuffer(1, audio_data.length, sample_rate);
    buffer.getChannelData(0).set(audio_data);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);

    const now = ctx.currentTime;
    const start_time = Math.max(now, this.#next_play_time);
    source.start(start_time);
    this.#next_play_time = start_time + buffer.duration;
    this.#current_audio_source = source;
  }

  /**
   * Processes speech chunks using Web Speech API fallback.
   */
  #process_fallback() {
    if (!this.#synth_fallback) {
      this.#is_processing = false;
      this.is_speaking = false;
      return;
    }

    if (this.#queue.length === 0) {
      this.#is_processing = false;
      this.is_speaking = false;
      this.active_message_id = null;
      return;
    }

    const current_item = this.#queue[0];
    const utterance = new SpeechSynthesisUtterance(current_item.text);
    const voice = this.#pick_fallback_voice(current_item.voice_id) || this.voices[0];
    if (voice?._ref) utterance.voice = voice._ref;
    utterance.volume = this.volume;
    utterance.rate = this.rate;

    let settled = false;
    const advance = (interrupted) => {
      if (settled) return;
      settled = true;
      this.#queue.shift();
      setTimeout(() => this.#process_fallback(), interrupted ? 250 : 40);
    };

    utterance.onend = () => advance(false);
    utterance.onerror = (e) => advance(e?.error === "interrupted" || e?.error === "canceled");
    this.#synth_fallback.speak(utterance);
  }

  /**
   * Previews a voice with a sample phrase.
   * @param {string} name_or_uri
   * @param {number} [rate=1.0]
   */
  async preview(name_or_uri, rate = 1.0) {
    this.stop();
    const uri = resolve_voice_uri(name_or_uri);
    const voice = this.voices.find((v) => v.uri === uri || v.name === name_or_uri);
    if (!voice) return;

    await this.#ensure_model();

    if (this.#use_fallback) {
      if (!this.#synth_fallback) return;
      this.is_speaking = true;
      const utterance = new SpeechSynthesisUtterance("Previewing voice system.");
      const v = this.#pick_fallback_voice(uri);
      if (v?._ref) utterance.voice = v._ref;
      utterance.rate = rate;
      utterance.onend = () => (this.is_speaking = false);
      utterance.onerror = () => (this.is_speaking = false);
      this.#synth_fallback.speak(utterance);
      return;
    }

    this.is_speaking = true;
    try {
      const audio = await this.#tts.generate("Previewing voice system.", {
        voice: uri,
        speed: rate,
      });
      await this.#play_audio(audio.audio, audio.sampling_rate || 24000);
      if (this.#current_audio_source) {
        this.#current_audio_source.onended = () => (this.is_speaking = false);
      }
    } catch (err) {
      console.warn("[VoiceEngine] Preview failed:", err);
      this.is_speaking = false;
    }
  }

  /**
   * Stops active speech playback and flushes synthesis queues.
   */
  stop() {
    this.#stream_stopped = true;
    this.#queue = [];
    this.#is_processing = false;
    this.#paused = false;
    this.is_paused = false;
    this.#next_play_time = 0;

    const ctx = get_master_context();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    if (this.#current_audio_source) {
      try {
        this.#current_audio_source.onended = null;
        this.#current_audio_source.stop();
      } catch {
        /* empty */
      }
      this.#current_audio_source = null;
    }

    if (this.#synth_fallback) {
      this.#synth_fallback.cancel();
    }

    this.is_speaking = false;
    this.active_message_id = null;
  }

  /**
   * Cleans up vocal engine resources and flushes memory.
   */
  destroy() {
    this.stop();
    this.#audio_cache.clear();
    this.#queue = [];
    this.#tts = null;
    this.spoken_character_cursor = 0;
    suspend_master_context();
  }

  reset_stream() {
    this.#stream_stopped = false;
    this.spoken_character_cursor = 0;
    this.#next_play_time = 0;
  }

  /**
   * Configures voice parameters for a streaming message.
   * @param {string | null | undefined} role
   * @param {string | null | number} id
   */
  apply_stream_role(role, id) {
    this.reset_stream();
    this.active_message_id = id;
    if (!role || role === "system") return;

    const norm_role = normalize_role(role, { preserve_npc: true });
    if (!norm_role) return;

    const runtime = state_bridge.runtime;
    let entity = null;
    if (norm_role === "ai") entity = runtime?.active_ai;
    else if (norm_role === "user") entity = runtime?.active_user;
    else if (norm_role === "fractal") entity = runtime?.active_fractal;
    else if (norm_role === "npc") entity = runtime?.active_npcs?.[runtime?.streaming_entity_id] || null;

    if (entity?.voice) {
      const v_id = entity.voice.name || entity.voice.uri;
      this.selected_voice = resolve_voice_uri(v_id);
      const dyn_val = norm_role === "user" ? 50 : norm_role === "ai" ? (entity.dynamics?.intensity ?? 50) : (entity.dynamics?.velocity ?? 50);
      this.rate = get_cadence_rate(entity.voice.cadence, dyn_val);
    }
  }

  /**
   * Streams progressive turn prose sentence-by-sentence.
   * @param {string} current_raw_text
   */
  queue_stream_sentence(current_raw_text) {
    if (this.#stream_stopped) return;
    const sanitized_stream_track = current_raw_text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "");
    const fresh_buffer = sanitized_stream_track.slice(this.spoken_character_cursor);

    const { sentences, committed } = split_speech_sentences(fresh_buffer);
    const prep = (s) =>
      strip_cognition_blocks(s)
        .replace(/[*_#`~]/g, "")
        .replace(/\[\[(.*?)\]\]/g, "$1")
        .replace(/<[^>]*>/g, "")
        .trim();

    for (const clean_sentence of sentences) {
      if (!clean_sentence) continue;
      try {
        const clean_text = prep(clean_sentence);
        if (clean_text) this.#enqueue_chunks([{ text: clean_text, voice_id: this.selected_voice }]);
      } catch (tts_err) {
        console.warn("[VoiceEngine] TTS speak error during streaming:", tts_err);
      }
    }

    this.spoken_character_cursor += committed;
  }

  /**
   * Flushes remaining streaming text buffer upon stream completion.
   * @param {string} current_raw_text
   */
  flush_stream_remainder(current_raw_text) {
    if (this.#stream_stopped) return;
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

/**
 * Manages UI sound effects and audio buffer caching.
 */
class AudioEffectsEngine {
  /** @type {Map<string, AudioBuffer>} */
  #sound_cache = new Map();
  /** @type {Map<string, Promise<AudioBuffer>>} */
  #pending_fetches = new Map();
  /** @type {boolean} */
  #is_unlocked = false;
  /** @type {number} */
  #last_played = 0;
  /** @type {number} */
  #threshold_ms = 500;

  notifications_enabled = $state(false);

  constructor() {
    this.#init_listeners();
  }

  async init_settings() {
    try {
      const entry = await db.audio_prefs.get(AUDIO_STORAGE_KEY);
      if (entry?.value) {
        this.notifications_enabled = entry.value.notifications_enabled === true;
        Audio.voice.enabled = entry.value.voice_enabled === true;
        if (entry.value.entity_voice && typeof entry.value.entity_voice === "object") {
          Audio.voice.entity_voice = {
            ai: entry.value.entity_voice.ai === true,
            user: entry.value.entity_voice.user === true,
            fractal: entry.value.entity_voice.fractal === true,
          };
        }
        if (entry.value.master_volume !== undefined) {
          Audio.voice.set_volume(entry.value.master_volume);
        }
      } else {
        this.notifications_enabled = false;
        Audio.voice.enabled = false;
      }
    } catch (e) {
      console.warn("[AudioEngine] Failed to load settings:", e);
    }
  }

  async save_all_settings() {
    try {
      await db.audio_prefs.put({
        key: AUDIO_STORAGE_KEY,
        value: {
          notifications_enabled: this.notifications_enabled,
          voice_enabled: Audio.voice.enabled,
          entity_voice: {
            ai: Boolean(Audio.voice.entity_voice?.ai),
            user: Boolean(Audio.voice.entity_voice?.user),
            fractal: Boolean(Audio.voice.entity_voice?.fractal),
          },
          master_volume: Audio.voice.volume,
        },
      });
    } catch (e) {
      console.error("[AudioEngine] Failed to save settings:", e);
    }
  }

  /**
   * @param {number} volume
   */
  set_volume(volume) {
    set_master_volume(volume);
  }

  #init_listeners() {
    if (typeof window === "undefined") return;

    const unlock_handler = () => {
      this.unlock();
      ["click", "touchstart", "keydown"].forEach((ev) => document.body.removeEventListener(ev, unlock_handler));
    };
    ["click", "touchstart", "keydown"].forEach((ev) => document.body.addEventListener(ev, unlock_handler));
  }

  async unlock() {
    if (this.#is_unlocked) return;
    try {
      const ctx = get_master_context();
      if (!ctx) {
        console.warn("[AudioEngine] AudioContext not supported in this environment.");
        return;
      }
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      this.#is_unlocked = true;
    } catch (e) {
      console.warn("[AudioEngine] Failed to unlock AudioContext:", e);
    }
  }

  /**
   * Plays a requested sound effect key.
   * @param {string} key
   */
  async play(key) {
    if (key === "notification" && !this.notifications_enabled) return;

    const ctx = get_master_context();
    const gain = get_master_gain();
    if (!this.#is_unlocked || !ctx || !gain) return;

    const now = Date.now();
    if (now - this.#last_played < this.#threshold_ms) return;
    this.#last_played = now;

    let url = null;
    const sound_list = get_sound_list();
    if (sound_list.length > 0) {
      const entry = sound_list.find((/** @type {any} */ s) => typeof s === "string" && s.startsWith(key + "="));
      if (entry) url = entry.split("=").slice(1).join("=").trim();
    }

    if (!url && key === "notification") {
      url = DEFAULT_NOTIFICATION_SOUND;
    }

    if (!url) return;

    try {
      let buffer = this.#sound_cache.get(key);
      if (!buffer) {
        if (this.#pending_fetches.has(key)) {
          buffer = await this.#pending_fetches.get(key);
        } else {
          const fetch_promise = (async () => {
            try {
              const response = await fetch(url);
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              const array_buffer = await response.arrayBuffer();
              const decoded = await new Promise((resolve, reject) => {
                const promise = ctx.decodeAudioData(array_buffer, resolve, reject);
                if (promise) promise.then(resolve).catch(reject);
              });
              this.#sound_cache.set(key, decoded);
              return decoded;
            } finally {
              this.#pending_fetches.delete(key);
            }
          })();

          this.#pending_fetches.set(key, fetch_promise);
          buffer = await fetch_promise;
        }
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer || null;
      source.connect(gain);
      source.start(0);
    } catch (e) {
      console.warn("[AudioEngine] Playback error:", e);
    }
  }

  destroy() {
    close_master_context();
    this.#sound_cache.clear();
    this.#pending_fetches.clear();
  }
}

// ============================================================================
// [SECTION 4: AUDIO SINGLETON FACADE]
// ============================================================================

/**
 * Unified Audio Singleton Facade.
 */
export const Audio = new (class {
  #effects = new AudioEffectsEngine();
  /** @type {Promise<void> | null} */
  #init_promise = null;

  voice = new VoiceEngine();

  constructor() {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const unlock_voice = () => {
      this.voice.resume_context().catch(() => {});
    };
    ["click", "touchstart", "keydown"].forEach((ev) => document.addEventListener(ev, unlock_voice, { once: true }));
  }

  get volume() {
    return this.voice.volume;
  }

  set volume(v) {
    const clean_volume = Math.max(0, Math.min(1, Number(v)));
    this.voice.set_volume(clean_volume);
    this.#effects.save_all_settings();
  }

  get notifications_enabled() {
    return this.#effects.notifications_enabled;
  }

  set notifications_enabled(v) {
    this.#effects.notifications_enabled = !!v;
    this.#effects.save_all_settings();
  }

  get voice_enabled() {
    return this.voice.enabled;
  }

  set voice_enabled(v) {
    this.voice.enabled = !!v;
    this.#effects.save_all_settings();
  }

  get entity_voice() {
    return this.voice.entity_voice;
  }

  /**
   * @param {string | null} role
   * @returns {boolean}
   */
  is_role_enabled(role) {
    const norm = normalize_role(role);
    if (!norm) return false;
    return this.voice_enabled && Boolean(this.voice.entity_voice[norm]);
  }

  /**
   * @param {string} role
   * @param {boolean} value
   */
  set_entity_voice(role, value) {
    const norm = normalize_role(role);
    if (!norm) return;
    const val = Boolean(value);
    if (val) {
      this.voice_enabled = true;
    }
    this.voice.entity_voice[norm] = val;
    this.#effects.save_all_settings();
  }

  /**
   * @param {string} role
   * @returns {boolean}
   */
  toggle_entity_voice(role) {
    const norm = normalize_role(role);
    if (!norm) return false;
    const next = !this.voice.entity_voice[norm];
    this.set_entity_voice(norm, next);
    if (!next) this.voice.stop();
    return next;
  }

  /**
   * @param {string} soundId
   */
  play(soundId) {
    return this.#effects.play(soundId);
  }

  async init() {
    if (this.#init_promise) return this.#init_promise;
    this.#init_promise = this.#effects.init_settings();
    return this.#init_promise;
  }

  destroy() {
    this.voice.destroy();
    this.#effects.destroy();
  }
})();

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied ground-up /refactor protocol: added Universal File Architecture header block,
 *   structured 4 explicit section dividers, streamlined runes, encapsulated constants, and verified test suite.
 * - 2026-08-28: Integrated Kokoro-82M ONNX model loading via WebGPU/WASM and Web Speech API fallback.
 * - 2026-06-15: Initial audio effects and notification sound manager.
 */
