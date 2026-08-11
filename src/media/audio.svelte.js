/**
 * src/media/audio.svelte.js
 * [**] AUDIO ENGINE
 * The sensory cortex for all things sonic. Handles sound effects,
 * notifications, and text-to-speech with Svelte 5 reactivity.
 */
import { get_rpg_list, strip_cognition_blocks } from "@utils";
import { db } from "@data";

const STORAGE_KEY = "rpglitch_audio_settings";

// Global Sandbox Interceptor: Deployed at the threshold to silence Perchance engine frame conflicts
if (typeof window !== "undefined") {
  window.addEventListener(
    "error",
    (e) => {
      try {
        const msg = e.message ? String(e.message) : "";
        if (msg.includes("Symbol") || msg.includes("numActualScriptLines")) {
          e.preventDefault();
          e.stopPropagation();
        }
      } catch {
        // Fallback for objects that cannot be converted to string, such as raw symbols
      }
    },
    true,
  );

  window.addEventListener(
    "unhandledrejection",
    (e) => {
      try {
        const reason = e.reason;
        const msg = reason && typeof reason === "object" && reason.message ? String(reason.message) : reason ? String(reason) : "";
        if (msg.includes("Symbol") || msg.includes("numActualScriptLines")) {
          e.preventDefault();
          e.stopPropagation();
        }
      } catch {
        // Fallback for unconvertible reasons
      }
    },
    true,
  );
}

/************************************************************************************
 * [SECTION: VOICE ENGINE]
 * Kokoro-82M neural TTS powered by kokoro-js (Transformers.js).
 * Runs 100% in-browser via WASM or WebGPU. Falls back to Web Speech API if
 * Kokoro fails to load (e.g. no WebGPU/WASM support or model download blocked).
 ************************************************************************************/

export const CADENCE_RATES = {
  drawl: 0.85,
  measured: 0.95,
  standard: 1.0,
  brisk: 1.1,
  rapid: 1.2,
};

/** 5 Symmetrical voice cadences (Standard in center) */
export const VOICE_CADENCES = [
  { id: "drawl", label: "Drawl", rate: 0.85 },
  { id: "measured", label: "Measured", rate: 0.95 },
  { id: "standard", label: "Standard", rate: 1.0 },
  { id: "brisk", label: "Brisk", rate: 1.1 },
  { id: "rapid", label: "Rapid", rate: 1.2 },
];

export function get_cadence_rate(cadence) {
  return CADENCE_RATES[cadence] || 1.0;
}

export function resolve_voice_uri(name_or_uri) {
  if (!name_or_uri) return "am_adam";
  const str = String(name_or_uri).trim().toLowerCase();
  const found = KOKORO_VOICES.find((v) => v.name.toLowerCase() === str || v.uri.toLowerCase() === str);
  return found ? found.uri : "am_adam";
}

export function resolve_voice_name(name_or_uri) {
  if (!name_or_uri) return "Cinematic Narrator";
  const str = String(name_or_uri).trim().toLowerCase();
  const found = KOKORO_VOICES.find((v) => v.name.toLowerCase() === str || v.uri.toLowerCase() === str);
  return found ? found.name : "Cinematic Narrator";
}

const PREGENERATE_BUDGET = 3;
const AUDIO_CACHE_MAX = 64;

/**
 * True when the character is a word character (used by quote-aware sentence
 * splitting to distinguish contractions/apostrophes from quote delimiters).
 * @param {string} ch
 * @returns {boolean}
 */
function is_word_char(ch) {
  return /[A-Za-z0-9]/.test(ch);
}

/**
 * Splits prose into sentences, treating quoted spans as atomic so dialogue
 * stays attached to its attribution. Returns the complete sentences, the
 * character offset up to which the input forms complete sentences, and any
 * trailing (still-incomplete) tail.
 * @param {string} text
 * @returns {{ sentences: string[], committed: number, tail: string }}
 */
export function split_speech_sentences(text) {
  const sentences = [];
  let buffer = "";
  let quote = null;
  let committed = 0;
  const complete_end = /[.!?\u2026]["'\u201d\u2019]*$/;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : " ";
    const next = i < text.length - 1 ? text[i + 1] : " ";
    buffer += ch;

    if (quote === null) {
      if (ch === '"' || ch === "\u201c" || ch === "\u201e") {
        quote = '"';
      } else if ((ch === "'" || ch === "\u2018" || ch === "\u201a") && !is_word_char(prev) && is_word_char(next)) {
        quote = "'";
      }
    } else if (quote === '"') {
      if (ch === '"' || ch === "\u201d") quote = null;
    } else if (quote === "'") {
      if ((ch === "'" || ch === "\u2019") && is_word_char(prev) && !is_word_char(next)) quote = null;
    }

    const is_terminal = quote === null && (/[.!?\u2026]/.test(ch) || ch === '"' || ch === "'" || ch === "\u201d" || ch === "\u2019");
    if (is_terminal) {
      const trimmed = buffer.trim();
      if (complete_end.test(trimmed)) {
        const rest = text.slice(i + 1);
        const next_nonspace = /^\s*(\S)/.exec(rest);
        // At a closing quote, hold the sentence when a lowercase word follows
        // (likely dialogue attribution: "Run!" he shouted.), so the tag stays
        // attached to its quote.
        const is_attribution_follow =
          ch === '"' || ch === "'" || ch === "\u201d" || ch === "\u2019" ? Boolean(next_nonspace && /^[a-z]/.test(next_nonspace[1])) : false;
        if (!is_attribution_follow && (rest.length === 0 || /^\s/.test(rest))) {
          sentences.push(trimmed);
          committed = i + 1;
          buffer = "";
        }
      }
    }
  }

  return { sentences, committed, tail: text.slice(committed).trim() };
}

/** Kokoro voice definitions (sorted: male voices first, then female voices, alphabetical by name within group). */
const KOKORO_VOICES = [
  // Male Voices (American & British, alphabetical by name)
  { uri: "am_eric", name: "Animated Sidekick" },
  { uri: "bm_lewis", name: "Aristocratic Benefactor" },
  { uri: "am_adam", name: "Cinematic Narrator" },
  { uri: "am_fenrir", name: "Cyber Handler" },
  { uri: "am_liam", name: "Everyday Companion" },
  { uri: "am_puck", name: "Gentle Devotee" },
  { uri: "am_michael", name: "Grizzled Veteran" },
  { uri: "am_echo", name: "Late-Night Host" },
  { uri: "am_onyx", name: "Low-Resonance Shadow" },
  { uri: "bm_fable", name: "Modern Presenter" },
  { uri: "bm_george", name: "Refined Scholar" },
  { uri: "bm_daniel", name: "Seasoned Veteran" },
  { uri: "am_santa", name: "Theatrical Showman" },

  // Female Voices (American & British, alphabetical by name)
  { uri: "af_aoede", name: "Bardic Muse" },
  { uri: "af_kore", name: "Celestial Oracle" },
  { uri: "af_alloy", name: "Cyber Interface" },
  { uri: "af_nova", name: "Energetic Spark" },
  { uri: "af_sky", name: "Ethereal Wanderer" },
  { uri: "af_river", name: "Frontier Wanderer" },
  { uri: "bf_lily", name: "Gentle Seraph" },
  { uri: "af_sarah", name: "Guild Sovereign" },
  { uri: "af_bella", name: "Imperial Leader" },
  { uri: "bf_alice", name: "Refined Aristocrat" },
  { uri: "bf_isabella", name: "Royal Matriarch" },
  { uri: "bf_emma", name: "Scholarly Duchess" },
  { uri: "af_jessica", name: "Tactical Sentinel" },
  { uri: "af_nicole", name: "Velvet Whisper" },
  { uri: "af_heart", name: "Warm Anchor" },
];
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
      const { KokoroTTS } = await import("https://esm.sh/kokoro-js@1.2.1");

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

          this.#tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
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

    for (const chunk of chunks) {
      if (this.#queue.length > 0 && this.#queue[this.#queue.length - 1].text === chunk) {
        continue;
      }

      this.#queue.push({
        text: chunk,
        voice_id: this.selected_voice,
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
    const promise = this.#tts.generate(text, { voice: voice_id, speed }).catch((err) => {
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
      setTimeout(() => this.#process_queue(), 5);
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

    source.start(0);
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
    this.#queue = [];
    this.#is_processing = false;
    this.#paused = false;
    this.is_paused = false;

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
   * Suspends the shared AudioContext and flushes all audio resources.
   * Called when components consuming voice playback unmount.
   */
  destroy() {
    this.stop();
    this.#audio_cache.clear();
    suspend_master_context();
  }

  reset_stream() {
    this.spoken_character_cursor = 0;
  }

  queue_stream_sentence(current_raw_text) {
    const sanitized_stream_track = current_raw_text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "");
    const fresh_buffer = sanitized_stream_track.slice(this.spoken_character_cursor);

    const { sentences, committed } = split_speech_sentences(fresh_buffer);

    for (const clean_sentence of sentences) {
      if (clean_sentence) {
        try {
          this.speak(clean_sentence, false);
        } catch (tts_err) {
          console.warn("[VoiceEngine] TTS speak error during streaming:", tts_err);
        }
      }
    }

    this.spoken_character_cursor += committed;
  }

  flush_stream_remainder(current_raw_text) {
    const sanitized_stream_track = current_raw_text.replace(/<think>[\s\S]*?<\/think>/gi, "").replace(/<think>[\s\S]*/gi, "");
    const remaining_text = sanitized_stream_track.slice(this.spoken_character_cursor);
    const clean_remainder = strip_cognition_blocks(remaining_text).trim();

    if (clean_remainder) {
      this.speak(clean_remainder, false);
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
          entity_voice: Audio.voice.entity_voice,
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
    const sound_list = get_rpg_list("sounds");
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
   * Suspends the shared AudioContext and flushes buffered audio resources.
   * Called when the host component or application unmounts.
   */
  destroy() {
    suspend_master_context();
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
   * @param {"ai" | "user" | "fractal" | "system" | null} role
   * @returns {boolean}
   */
  is_role_enabled(role) {
    if (!role || role === "system") return false;
    return this.voice_enabled && !!this.voice.entity_voice[role];
  }

  /**
   * Toggles a specific entity's voice and persists settings.
   * @param {"ai" | "user" | "fractal"} role
   * @param {boolean} value
   */
  set_entity_voice(role, value) {
    const val = !!value;
    if (val) {
      this.voice_enabled = true;
    }
    this.voice.entity_voice[role] = val;
    this.#effects.saveAllSettings();
  }

  /**
   * Toggles a specific entity's voice and persists settings.
   * @param {"ai" | "user" | "fractal"} role
   * @returns {boolean} the new value
   */
  toggle_entity_voice(role) {
    const next = !this.voice.entity_voice[role];
    this.set_entity_voice(role, next);
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
   * Suspends all AudioContexts and flushes audio resources.
   * Called on application unmount or pagehide to prevent context leaks.
   */
  destroy() {
    this.voice.destroy();
    this.#effects.destroy();
  }
})();
