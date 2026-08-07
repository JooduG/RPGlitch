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

/** Kokoro voice definitions (sorted: male first, then female, alphabetical within each group). */
const KOKORO_VOICES = [
  // Male voices (am_* / bm_*)
  { uri: "am_adam", name: "Adam" },
  { uri: "bm_daniel", name: "Daniel" },
  { uri: "am_echo", name: "Echo" },
  { uri: "bm_fable", name: "Fable" },
  { uri: "am_fenrir", name: "Fenrir" },
  { uri: "bm_george", name: "George" },
  { uri: "am_liam", name: "Liam" },
  { uri: "bm_lewis", name: "Lewis" },
  { uri: "am_michael", name: "Michael" },
  { uri: "am_onyx", name: "Onyx" },
  { uri: "am_puck", name: "Puck" },
  { uri: "am_santa", name: "Santa" },
  // Female voices (af_* / bf_*)
  { uri: "bf_alice", name: "Alice" },
  { uri: "af_alloy", name: "Alloy" },
  { uri: "af_aoede", name: "Aoede" },
  { uri: "af_bella", name: "Bella" },
  { uri: "bf_emma", name: "Emma" },
  { uri: "af_heart", name: "Heart" },
  { uri: "bf_isabella", name: "Isabella" },
  { uri: "af_jessica", name: "Jessica" },
  { uri: "af_kore", name: "Kore" },
  { uri: "bf_lily", name: "Lily" },
  { uri: "af_nicole", name: "Nicole" },
  { uri: "af_nova", name: "Nova" },
  { uri: "af_river", name: "River" },
  { uri: "af_sarah", name: "Sarah" },
  { uri: "af_sky", name: "Sky" },
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

  // --- PRIVATE ---
  /** @type {any | null} KokoroTTS instance */
  #tts = null;
  /** @type {boolean} */
  #use_fallback = false;
  /** @type {SpeechSynthesis | null} */
  #synth_fallback = null;
  /** @type {Array<{ text: string, voice_id: string|null, message_id: string|null }>} */
  #queue = [];
  /** @type {boolean} */
  #is_processing = false;
  /** @type {AudioContext | null} */
  #audio_context = null;
  /** @type {GainNode | null} */
  #voice_volume = null;
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
      this.selected_voice = "af_heart";
    }
  }

  /**
   * Public method to explicitly trigger model download.
   * Returns a promise that resolves when loading is complete.
   */
  async loadModel() {
    await this.#ensure_model();
  }

  /**
   * Lazily loads the Kokoro TTS model from CDN.
   * Falls back to Web Speech API if loading fails.
   */
  async #ensure_model() {
    if (this.#tts || this.#use_fallback) return;

    this.is_loading = true;
    try {
      const { KokoroTTS } = await import("https://esm.sh/kokoro-js@1.2.1");

      const has_web_gpu = typeof navigator !== "undefined" && Boolean(/** @type {any} */ (navigator).gpu);
      const device = has_web_gpu ? "webgpu" : "wasm";
      const dtype = has_web_gpu ? "fp32" : "q8";

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
    // Load platform voices for fallback
    const load_fallback = () => {
      const raw = this.#synth_fallback.getVoices();
      if (
        raw.length > 0 &&
        !this.voices.some((v) => v.uri.startsWith("af_") || v.uri.startsWith("am_") || v.uri.startsWith("bf_") || v.uri.startsWith("bm_"))
      ) {
        this.voices = raw
          .filter((v) => v.lang.startsWith("en"))
          .map((v) => ({
            name: v.name,
            uri: v.voiceURI,
            _ref: v,
          }));
        if (!this.selected_voice && this.voices.length > 0) {
          this.selected_voice = this.voices[0].uri;
        }
      }
    };
    load_fallback();
    this.#synth_fallback.onvoiceschanged = load_fallback;
  }

  /**
   * Ensures an AudioContext is available for Kokoro playback.
   */
  #create_audio_context() {
    if (this.#audio_context) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.#audio_context = new AudioCtx();
    this.#voice_volume = this.#audio_context.createGain();
    this.#voice_volume.gain.setValueAtTime(this.volume, this.#audio_context.currentTime);
    this.#voice_volume.connect(this.#audio_context.destination);
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
      this.stop();
    }

    const speech_ready_text = strip_cognition_blocks(text)
      .replace(/[*_#`~]/g, "")
      .replace(/\[\[(.*?)\]\]/g, "$1")
      .replace(/<[^>]*>/g, "")
      .trim();

    if (!speech_ready_text) return;

    if (this.#queue.length > 0 && this.#queue[this.#queue.length - 1].text === speech_ready_text) {
      return;
    }

    this.#queue.push({
      text: speech_ready_text,
      voice_id: this.selected_voice,
      message_id: this.active_message_id,
    });

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

    for (const item of this.#queue) {
      if (!item.audioPromise && !item.audioData) {
        const item_msg_id = item.message_id;
        item.audioPromise = (async () => {
          try {
            const res = await this.#tts.generate(item.text, {
              voice: item.voice_id || "am_adam",
              speed: this.rate,
            });
            if (this.active_message_id && item_msg_id && item_msg_id !== this.active_message_id) {
              return null;
            }
            return res;
          } catch (e) {
            console.warn("[VoiceEngine] Background generation error:", e);
            return null;
          }
        })();
      }
    }
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
          : await this.#tts.generate(current_item.text, {
              voice: current_item.voice_id || "am_adam",
              speed: this.rate,
            });

      // Check if we were stopped or active_message_id changed while generating
      if (!this.#is_processing || (current_item.message_id && this.active_message_id && current_item.message_id !== this.active_message_id)) {
        return;
      }

      if (audio?.audio) {
        this.#play_audio(audio.audio, audio.sampling_rate || 24000);

        // Wait for playback to finish
        await new Promise((resolve) => {
          if (!this.#current_audio_source) {
            resolve(undefined);
            return;
          }
          this.#current_audio_source.onended = () => resolve(undefined);
        });
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
   * Plays raw audio data through the AudioContext.
   * @param {Float32Array|number[]} audioData
   * @param {number} sampleRate
   */
  #play_audio(audioData, sampleRate) {
    this.#create_audio_context();
    if (!this.#audio_context) return;

    const ctx = this.#audio_context;
    const buffer = ctx.createBuffer(1, audioData.length, sampleRate);
    buffer.getChannelData(0).set(audioData);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.#voice_volume);

    if (ctx.state === "suspended") ctx.resume();

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
    const voice = this.voices.find((v) => v.uri === current_item.voice_id) || this.voices[0];
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
  async preview(uri, rate = 1.0) {
    this.stop();
    const voice = this.voices.find((v) => v.uri === uri);
    if (!voice) return;

    await this.#ensure_model();

    if (this.#use_fallback) {
      if (!this.#synth_fallback) return;
      this.is_speaking = true;
      const utterance = new SpeechSynthesisUtterance("Previewing voice system.");
      const v = this.voices.find((v) => v.uri === uri) || this.voices[0];
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
      this.#play_audio(audio.audio, audio.sampling_rate || 24000);
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
   * Suspends the AudioContext and flushes all audio resources.
   * Called when components consuming voice playback unmount.
   */
  destroy() {
    this.stop();
    if (this.#audio_context && this.#audio_context.state !== "closed") {
      try {
        this.#audio_context.suspend();
      } catch {
        /* empty */
      }
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
  /** @type {AudioContext | null} */
  #audio_context = null;
  /** @type {GainNode | null} */
  #master_volume = null;
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
          Audio.voice.volume = entry.value.master_volume;
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
    if (this.#master_volume && this.#audio_context) {
      /** @type {GainNode} */ (this.#master_volume).gain.setValueAtTime(volume, /** @type {AudioContext} */ (this.#audio_context).currentTime);
    }
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
      if (!this.#audio_context) {
        const AudioCtx = /** @type {any} */ (window).AudioContext || /** @type {any} */ (window).webkitAudioContext;
        if (!AudioCtx) {
          console.warn("[AudioEngine] AudioContext not supported in this environment.");
          return;
        }
        this.#audio_context = new AudioCtx();

        this.#master_volume = /** @type {AudioContext} */ (this.#audio_context).createGain();
        /** @type {GainNode} */ (this.#master_volume).gain.setValueAtTime(
          Audio.voice.volume,
          /** @type {AudioContext} */ (this.#audio_context).currentTime,
        );
        /** @type {GainNode} */ (this.#master_volume).connect(/** @type {AudioContext} */ (this.#audio_context).destination);
      }
      if (this.#audio_context && /** @type {AudioContext} */ (this.#audio_context).state === "suspended") {
        await /** @type {AudioContext} */ (this.#audio_context).resume();
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
    if (!this.#is_unlocked || !this.#audio_context || !this.#master_volume) return;

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
                const promise = /** @type {AudioContext} */ (this.#audio_context).decodeAudioData(array_buffer, resolve, reject);
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
      const source = /** @type {AudioContext} */ (this.#audio_context).createBufferSource();
      source.buffer = buffer || null;

      source.connect(/** @type {GainNode} */ (this.#master_volume));
      source.start(0);
    } catch (e) {
      console.warn("[AudioEngine] Playback error:", e);
    }
  }

  /**
   * Suspends the AudioContext and flushes buffered audio resources.
   * Called when the host component or application unmounts.
   */
  destroy() {
    if (this.#audio_context && this.#audio_context.state !== "closed") {
      try {
        this.#audio_context.suspend();
      } catch {
        /* empty */
      }
    }
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

  /**
   * Unified master volume interface bridging both vocal streams and sound effect contexts.
   */
  get volume() {
    return this.voice.volume;
  }

  set volume(v) {
    const clean_volume = Math.max(0, Math.min(1, Number(v)));
    this.voice.volume = clean_volume;
    this.#effects.setVolume(clean_volume);
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
   * Toggles a specific entity's voice and persists settings.
   * @param {"ai" | "user" | "fractal"} role
   * @param {boolean} value
   */
  set_entity_voice(role, value) {
    this.voice.entity_voice[role] = !!value;
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
