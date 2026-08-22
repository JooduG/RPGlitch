/**
 * src/media/audio.svelte.js
 * [**] AUDIO ENGINE
 * The sensory cortex for all things sonic. Handles sound effects,
 * notifications, and text-to-speech with Svelte 5 reactivity.
 */
import { state_bridge, strip_cognition_blocks, onnx_mutex, wait_ort_ready } from "@utils";
import { db } from "@data";

import { KOKORO_VOICES, get_cadence_rate, normalize_role, resolve_voice_name, resolve_voice_uri, split_speech_sentences } from "./speech.js";

const STORAGE_KEY = "rpglitch_audio_settings";

const PREGENERATE_BUDGET = 3;
const AUDIO_CACHE_MAX = 64;

/**
 * Reads the Perchance "sounds" list from window.lists.
 * Handles both raw arrays and stringified JSON arrays.
 * @returns {string[]}
 */
function get_sound_list() {
  const key = "sounds";
  const global_lists = typeof window !== "undefined" && /** @type {any} */ (window).lists ? /** @type {any} */ (window).lists : null;
  if (!global_lists || !global_lists[key]) return [];
  let list = global_lists[key];
  if (Array.isArray(list) && typeof list[0] === "string" && list[0].startsWith("[")) {
    if (list[0].length > 65536) {
      console.warn(`[AudioEngine] get_sound_list: JSON string for key '${key}' exceeds 64KB safety limit.`);
      return [];
    }
    try {
      return JSON.parse(list[0]);
    } catch (e) {
      console.warn(`[AudioEngine] get_sound_list: Failed to parse JSON for key '${key}'.`, e);
      return list;
    }
  }
  return Array.isArray(list) ? list : [];
}

/************************************************************************************
 * [SECTION: VOICE ENGINE]
 * Kokoro-82M neural TTS powered by kokoro-js (Transformers.js).
 * Runs 100% in-browser via WASM or WebGPU. Falls back to Web Speech API if
 * Kokoro fails to load (e.g. no WebGPU/WASM support or model download blocked).
 ************************************************************************************/

/**
 * Handles vocal synthesis engine configuration and lifecycle management.
 */
export class VoiceEngine {
  // --- REACTIVE STATE ---
  /** @type {string | null | number} */
  active_message_id = $state(null);

  is_speaking = $state(false);
  is_loading = $state(false);
  load_progress = $state(0);
  model_ready = $state(false);
  /** @type {any[]} */
  voices = $state([]);
  /** @type {string | null} */
  selected_voice = $state(null);
  volume = $state(1.0);
  rate = $state(1.0);
  enabled = $state(false); // Master voice switch (default off)
  /** Per-entity voice toggles: { ai: bool, user: bool, fractal: bool }. */
  entity_voice = $state({ ai: false, user: false, fractal: false });
  is_paused = $state(false);
  spoken_character_cursor = $state(0);

  // --- PRIVATE ---
  /** @type {any | null} KokoroTTS instance */
  #tts = null;
  /** @type {boolean} */
  #use_fallback = false;
  /** @type {SpeechSynthesis | null} */
  #synth_fallback = null;
  /** @type {Array<{ name: string, uri: string, _ref: SpeechSynthesisVoice }>} */
  #platform_voices = [];
  /** @type {Array<{ text: string, voice_id: string|null, message_id: string|null }>} */
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
  /** @type {number} Scheduled end timestamp in AudioContext.currentTime for seamless buffer chaining. */
  #next_play_time = 0;
  /** @type {boolean} Flag indicating whether current stream playback has been explicitly stopped by user. */
  #stream_stopped = false;

  /**
   * Initializes the voice engine with Kokoro voice list.
   */
  constructor() {
    this.voices = KOKORO_VOICES.map((v) => ({
      name: v.name,
      uri: v.uri,
    }));

    if (!this.selected_voice) {
      this.selected_voice = "am_adam";
    }
  }

  /**
   * Public method to explicitly trigger model download.
   * Returns a promise that resolves when loading is complete.
   */
  async load_model() {
    await this.#ensure_model();
  }

  /**
   * Lazily loads the Kokoro TTS model from CDN.
   * Tries WebGPU first when available, then the WASM backend (a GPU context can
   * exist while onnxruntime-web's WASM init has not completed, which surfaces as
   * "WebAssembly is not initialized yet"), and only then falls back to the Web
   * Speech API.
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
      // Pin STABLE onnxruntime-web (same reason as embeddings.svelte.js): kokoro-js' default
      // esm.sh resolution fails WASM init inside the Perchance iframe, forcing the Web Speech
      // API fallback. The ?deps= override propagates through kokoro-js -> transformers -> ort.
      const { KokoroTTS } = await import("https://esm.sh/kokoro-js@1.2.1?deps=onnxruntime-web@1.22.0");

      // Hold until the embeddings pipeline has configured the shared ort runtime.
      // 10s fallback ensures speech synth never hangs indefinitely if embeddings load is delayed.
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
                if (data.status === "progress" || data.status === "download") {
                  if (data.file && typeof data.progress === "number") {
                    file_progress[data.file] = data.progress;
                    const values = Object.values(file_progress);
                    const avg = values.reduce((a, b) => a + b, 0) / values.length;
                    this.load_progress = Math.round(avg);
                  }
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

      // Every device attempt failed — fall back to the Web Speech API.
      console.warn("[VoiceEngine] Kokoro failed to load, falling back to Web Speech API:", last_error);
      this.#use_fallback = true;
      this.#init_fallback();
      this.model_ready = true;
    } catch (err) {
      console.warn("[VoiceEngine] Kokoro failed to load, falling back to Web Speech API:", err);
      this.#use_fallback = true;
      this.#init_fallback();
      this.model_ready = true;
    } finally {
      this.is_loading = false;
    }
  }

  /**
   * Initializes the Web Speech API fallback.
   */
  #init_fallback() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    this.#synth_fallback = window.speechSynthesis;
    // Platform voices are cached separately — `this.voices` stays the Kokoro
    // catalog so the UI never swaps to arbitrary system voice names.
    const load_fallback = () => {
      const raw = this.#synth_fallback.getVoices();
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
   * Picks the best-matching platform voice for a Kokoro voice id, preferring an
   * exact name match, then a partial name match, then any English voice.
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
   * Pauses ongoing speech synthesis. Suspends the shared AudioContext (or the
   * Web Speech fallback); playback resumes from where it stopped.
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
   * Resumes paused speech synthesis.
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
   * Toggles pause/resume for ongoing speech synthesis.
   */
  toggle_pause() {
    if (this.#paused) this.resume();
    else this.pause();
  }

  /**
   * Public master-volume setter that also live-updates the shared master gain.
   * @param {number} v
   */
  set_volume(v) {
    this.volume = v;
    set_master_volume(v);
  }

  /**
   * Ensures the shared AudioContext exists and is running (unlocked).
   * Invoked from user-gesture handlers to satisfy browser autoplay policies.
   */
  async resume_context() {
    const ctx = get_master_context();
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // Autoplay blocked — will be retried on the next user gesture.
      }
    }
  }

  /**
   * Appends sanitized narrative segments to the voice execution queue.
   * @param {string} text
   * @param {boolean} [clearQueue=true]
   * @param {boolean} [force=false]
   */
  speak(text, clearQueue = true, force = false) {
    if (!text) return;
    if (!this.enabled && !force) return;

    if (clearQueue) {
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

    // Split multi-sentence text into clean chunks (quote-aware, so dialogue
    // stays attached to its attribution) to prevent Kokoro TTS model truncation.
    const { sentences, tail } = split_speech_sentences(speech_ready_text);
    const chunks = tail ? [...sentences, tail] : sentences;

    this.#enqueue_chunks(chunks.map((text) => ({ text, voice_id: this.selected_voice })));
  }

  /** @param {Array<{ text: string, voice_id: string }>} chunks */
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
   * Pre-generates audio for queued items in the background to eliminate playback pauses.
   */
  #pregenerate_queue() {
    if (this.#use_fallback || !this.#tts) return;

    // Pre-generate only the next few chunks so a long message doesn't spike
    // memory by synthesizing every sentence up front.
    let budget = PREGENERATE_BUDGET;
    for (const item of this.#queue) {
      if (budget <= 0) break;
      if (!item.audioPromise && !item.audioData) {
        budget--;
        const item_msg_id = item.message_id;
        item.audioPromise = this.#cached_generate(item.text, item.voice_id || "am_adam", this.rate).then((res) => {
          if (this.active_message_id && item_msg_id && item_msg_id !== this.active_message_id) {
            return null;
          }
          return res;
        });
      }
    }
  }

  /**
   * Generates audio through a (text, voice, speed) keyed cache so repeated
   * lines are never re-synthesized.
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
   * Processes the queue sequentially, generating audio for each chunk.
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

    // Discard chunk if message_id does not match active_message_id
    if (current_item.message_id && this.active_message_id && current_item.message_id !== this.active_message_id) {
      this.#queue.shift();
      this.#process_queue();
      return;
    }

    try {
      const audio = current_item.audioData
        ? current_item.audioData
        : current_item.audioPromise
          ? await current_item.audioPromise
          : await this.#cached_generate(current_item.text, current_item.voice_id || "am_adam", this.rate);

      // Check if we were stopped or active_message_id changed while generating
      if (!this.#is_processing || (current_item.message_id && this.active_message_id && current_item.message_id !== this.active_message_id)) {
        return;
      }

      if (audio?.audio) {
        if (this.#paused) {
          // Hold the rendered chunk until the user resumes.
          current_item.audioData = audio.audio;
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

  /**
   * Polls until playback is unpaused, then resumes queue processing. Used when
   * a pause arrives while a chunk is still being generated.
   */
  #resume_wait() {
    setTimeout(() => {
      if (this.#paused) {
        this.#resume_wait();
      } else if (this.#is_processing) {
        this.#process_queue();
      }
    }, 50);
  }

  /**
   * Waits for the active buffer source to finish playing. Guards against a
   * permanently suspended (autoplay-blocked) AudioContext wedging the queue,
   * and never cuts playback that is intentionally paused.
   */
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
   * Plays raw audio data through the shared AudioContext / master gain.
   * @param {Float32Array|number[]} audioData
   * @param {number} sampleRate
   */
  async #play_audio(audioData, sampleRate) {
    const ctx = get_master_context();
    const gain = get_master_gain();
    if (!ctx || !gain) return;

    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // Autoplay blocked — the gesture unlock listener will resume it.
      }
    }

    const buffer = ctx.createBuffer(1, audioData.length, sampleRate);
    buffer.getChannelData(0).set(audioData);

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
   * Fallback processing using Web Speech API.
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
   * Previews a voice with a short sample phrase.
   * @param {string} uri
   * @param {number} [rate]
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
   * Cancels active audio playback and flushes the queue.
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
   * Cleans up vocal engine queues, cached audio buffers, stops active playback, and suspends master context.
   * Called when components consuming voice playback unmount.
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
   * Prepares the voice engine for a new streaming turn: resets stream
   * bookkeeping, binds the stream's message id, and routes the speaking
   * role's voice (entity → selected voice + cadence-scaled rate). Role
   * normalization keeps "npc" distinct so NPC speech can resolve a voice
   * from the live NPC roster; unvoiced/system roles keep the previous voice.
   * @param {string | null | undefined} role
   * @param {string | null | number} id
   */
  apply_stream_role(role, id) {
    this.reset_stream();
    this.active_message_id = id;
    if (!role || role === "system") return;

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

    const runtime = state_bridge.runtime;
    let entity = null;
    if (norm_role === "ai") entity = runtime?.active_ai;
    else if (norm_role === "user") entity = runtime?.active_user;
    else if (norm_role === "fractal") entity = runtime?.active_fractal;
    else if (norm_role === "npc") entity = runtime?.active_npcs?.[runtime?.streaming_entity_id] || null;

    if (entity && entity.voice) {
      const v_id = entity.voice.name || entity.voice.uri;
      this.selected_voice = resolve_voice_uri(v_id);
      const dyn_val = norm_role === "user" ? 50 : norm_role === "ai" ? (entity.dynamics?.intensity ?? 50) : (entity.dynamics?.velocity ?? 50);
      this.rate = get_cadence_rate(entity.voice.cadence, dyn_val);
    }
  }

  /**
   * Streams live turn text sentence-by-sentence, always using the streaming
   * role's voice (set by apply_stream_role) for every chunk — the whole message
   * stays in the sender's voice.
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

/************************************************************************************
 * [SECTION: SHARED AUDIO GRAPH]
 * A single AudioContext + master gain owned by the whole audio system, so voice
 * and sound effects share one unlock/resume path and one master volume.
 ************************************************************************************/

let shared_context = null;
let master_gain = null;
let current_master_volume = 1.0;

/**
 * Returns the module-wide AudioContext, creating it on first use.
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
 * @returns {GainNode | null}
 */
function get_master_gain() {
  get_master_context();
  return master_gain;
}

/**
 * Updates the master volume on the shared graph, and the value applied when the
 * graph is created later.
 * @param {number} v
 */
function set_master_volume(v) {
  current_master_volume = v;
  if (master_gain && shared_context) {
    master_gain.gain.setValueAtTime(v, shared_context.currentTime);
  }
}

/**
 * Suspends the shared AudioContext (safe no-op when absent or not running).
 */
function suspend_master_context() {
  if (shared_context && shared_context.state !== "closed" && shared_context.state !== "suspended") {
    try {
      shared_context.suspend();
    } catch {
      /* empty */
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
        shared_context.close();
      } catch {
        /* empty */
      }
    }
    shared_context = null;
    master_gain = null;
  }
}

/************************************************************************************
 * [SECTION: AUDIO EFFECTS ENGINE]
 * Handles sound effects and browser AudioContext state.
 ************************************************************************************/
/**
 * Tracks hardware context unlocking steps and raw master Gain Node attenuation processing.
 */
class AudioEffectsEngine {
  // --- PRIVATE TYPED PROPERTIES ---
  /** @type {Map<string, AudioBuffer>} */
  #sound_cache = new Map();
  /** @type {Map<string, Promise<AudioBuffer>>} */
  #pending_fetches = new Map();
  /** @type {boolean} */
  #is_unlocked = false;
  /** @type {number} */
  #last_played = 0;
  /** @type {number} */
  #threshold_ms = 500; // debounce in ms

  // --- REACTIVE STATE ---
  notifications_enabled = $state(false); // Defaulting strictly to off

  /**
   * Initializes browser window interaction listeners.
   */
  constructor() {
    this.#init_listeners();
  }

  /**
   * Syncs internal configuration from client storage space.
   */
  async initSettings() {
    try {
      const entry = await db.audio_prefs.get(STORAGE_KEY);
      if (entry && entry.value) {
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

  /**
   * Commits the expanded preference layout options back to client databases.
   */
  async saveAllSettings() {
    try {
      await db.audio_prefs.put({
        key: STORAGE_KEY,
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
   * Updates the volume multiplier parameter across active processing channels.
   * @param {number} volume
   */
  setVolume(volume) {
    set_master_volume(volume);
  }

  /**
   * Intercepts gestures to dynamically prime browser AudioContext properties.
   */
  #init_listeners() {
    if (typeof window === "undefined") return;

    const unlock_handler = () => {
      this.unlock();
      ["click", "touchstart", "keydown"].forEach((ev) => document.body.removeEventListener(ev, unlock_handler));
    };
    ["click", "touchstart", "keydown"].forEach((ev) => document.body.addEventListener(ev, unlock_handler));
  }

  /**
   * Awakens the suspended audio landscape context safely.
   */
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
      url = "https://user.uploads.dev/file/50dc061d6ed6439719d283d042e9c172.wav";
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

  /**
   * Closes the shared AudioContext and flushes buffered audio resources.
   * Called when the host component or application unmounts or on teardown.
   */
  destroy() {
    close_master_context();
    this.#sound_cache.clear();
    this.#pending_fetches.clear();
  }
}

/************************************************************************************
 * [SECTION: THE AUDIO SINGLETON]
 * Primary interface for the rest of the application.
 ************************************************************************************/
export const Audio = new (class {
  #effects = new AudioEffectsEngine();
  /** @type {Promise<void> | null} */
  #init_promise = null;

  voice = new VoiceEngine();

  constructor() {
    // Unlock the voice AudioContext on the first user gesture so streaming
    // (non-gesture) playback is never silently blocked by autoplay policy.
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const unlock_voice = () => {
      this.voice.resume_context().catch(() => {});
    };
    ["click", "touchstart", "keydown"].forEach((ev) => document.addEventListener(ev, unlock_voice, { once: true }));
  }

  /**
   * Unified master volume interface bridging both vocal streams and sound effect contexts.
   */
  get volume() {
    return this.voice.volume;
  }

  set volume(v) {
    const clean_volume = Math.max(0, Math.min(1, Number(v)));
    this.voice.set_volume(clean_volume);
    this.#effects.saveAllSettings();
  }

  /**
   * Returns whether UI sensory sound feedback is enabled globally.
   */
  get notifications_enabled() {
    return this.#effects.notifications_enabled;
  }

  /**
   * Modifies and saves settings changes into local databases.
   */
  set notifications_enabled(v) {
    this.#effects.notifications_enabled = !!v;
    this.#effects.saveAllSettings();
  }

  /**
   * Returns whether character voice synthesis features are enabled.
   */
  get voice_enabled() {
    return this.voice.enabled;
  }

  /**
   * Swaps character activation parameters and serializes the update.
   */
  set voice_enabled(v) {
    this.voice.enabled = !!v;
    this.#effects.saveAllSettings();
  }

  /**
   * Returns per-entity voice activation state ({ ai, user, fractal }).
   */
  get entity_voice() {
    return this.voice.entity_voice;
  }

  /**
   * Returns whether voice playback is active for a specific entity role.
   * Handles role string variations like "AI_CHARACTER", "ai", "USER_PERSONA", "user", "FRACTAL", "fractal".
   * @param {string | null} role
   * @returns {boolean}
   */
  is_role_enabled(role) {
    const norm = normalize_role(role);
    if (!norm) return false;
    return this.voice_enabled && !!this.voice.entity_voice[norm];
  }

  /**
   * Toggles a specific entity's voice and persists settings.
   * @param {string} role
   * @param {boolean} value
   */
  set_entity_voice(role, value) {
    const norm = normalize_role(role);
    if (!norm) return;
    const val = !!value;
    if (val) {
      this.voice_enabled = true;
    }
    this.voice.entity_voice[norm] = val;
    this.#effects.saveAllSettings();
  }

  /**
   * Toggles a specific entity's voice and persists settings.
   * @param {string} role
   * @returns {boolean} the new value
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

  /**
   * Pre-loads configurations and states safely before interface assembly.
   */
  async init() {
    if (this.#init_promise) return this.#init_promise;
    this.#init_promise = this.#effects.initSettings();
    return this.#init_promise;
  }

  /**
   * Suspends and closes all AudioContexts and flushes audio resources.
   * Called on application unmount, story reset, or pagehide to prevent context leaks.
   */
  destroy() {
    this.voice.destroy();
    this.#effects.destroy();
  }

  /**
   * Alias for destroy() matching the standard lifecycle teardown signature.
   */
  teardown() {
    this.destroy();
  }
})();
