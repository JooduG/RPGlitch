/**
 * src/media/audio.svelte.js
 * [**] AUDIO ENGINE
 * The sensory cortex for all things sonic. Handles sound effects,
 * notifications, and text-to-speech with Svelte 5 reactivity.
 */
import { getRpgList } from "@utils";
import { db } from "@data";
import { strip_cognition_blocks } from "@intelligence";

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
  activeMessageId = $state(null);

  isSpeaking = $state(false);
  isLoading = $state(false);
  loadProgress = $state(0);
  modelReady = $state(false);
  /** @type {any[]} */
  voices = $state([]);
  /** @type {string | null} */
  selectedVoice = $state(null);
  volume = $state(1.0);
  rate = $state(1.0);
  pitch = $state(1.0);
  enabled = $state(false); // Defaulting strictly to off

  // --- PRIVATE ---
  /** @type {any | null} KokoroTTS instance */
  #tts = null;
  /** @type {boolean} */
  #useFallback = false;
  /** @type {SpeechSynthesis | null} */
  #fallbackSynth = null;
  /** @type {Array<{ text: string, voiceUri: string|null }>} */
  #queue = [];
  /** @type {boolean} */
  #isProcessing = false;
  /** @type {AudioContext | null} */
  #audioContext = null;
  /** @type {GainNode | null} */
  #gainNode = null;
  /** @type {AudioBufferSourceNode | null} */
  #currentSource = null;

  /**
   * Initializes the voice engine with Kokoro voice list.
   */
  constructor() {
    this.voices = KOKORO_VOICES.map((v) => ({
      name: v.name,
      uri: v.uri,
      supportsParams: true,
    }));

    if (!this.selectedVoice) {
      this.selectedVoice = "af_heart";
    }
  }

  /**
   * Public method to explicitly trigger model download.
   * Returns a promise that resolves when loading is complete.
   */
  async loadModel() {
    await this.#ensureModel();
  }

  /**
   * Lazily loads the Kokoro TTS model from CDN.
   * Falls back to Web Speech API if loading fails.
   */
  async #ensureModel() {
    if (this.#tts || this.#useFallback) return;

    this.isLoading = true;
    try {
      const { KokoroTTS } = await import("https://esm.sh/kokoro-js@1.2.1");

      const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator;
      const device = hasWebGPU ? "webgpu" : "wasm";
      const dtype = hasWebGPU ? "fp32" : "q8";

      /** @type {Record<string, number>} */
      const fileProgress = {};

      this.#tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
        dtype,
        device,
        progress_callback: (/** @type {any} */ data) => {
          if (data.status === "progress" || data.status === "download") {
            if (data.file && typeof data.progress === "number") {
              fileProgress[data.file] = data.progress;
              const values = Object.values(fileProgress);
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              this.loadProgress = Math.round(avg);
            }
          }
        },
      });
      this.loadProgress = 100;
      this.modelReady = true;
    } catch (err) {
      console.warn("[VoiceEngine] Kokoro failed to load, falling back to Web Speech API:", err);
      this.#useFallback = true;
      this.#initFallback();
      this.modelReady = true;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Initializes the Web Speech API fallback.
   */
  #initFallback() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    this.#fallbackSynth = window.speechSynthesis;
    // Load platform voices for fallback
    const loadFallback = () => {
      const raw = this.#fallbackSynth.getVoices();
      if (
        raw.length > 0 &&
        !this.voices.some((v) => v.uri.startsWith("af_") || v.uri.startsWith("am_") || v.uri.startsWith("bf_") || v.uri.startsWith("bm_"))
      ) {
        this.voices = raw
          .filter((v) => v.lang.startsWith("en"))
          .map((v) => ({
            name: v.name,
            uri: v.voiceURI,
            supportsParams: !v.name.includes("Natural"),
            _ref: v,
          }));
        if (!this.selectedVoice && this.voices.length > 0) {
          this.selectedVoice = this.voices[0].uri;
        }
      }
    };
    loadFallback();
    this.#fallbackSynth.onvoiceschanged = loadFallback;
  }

  /**
   * Ensures an AudioContext is available for Kokoro playback.
   */
  #ensureAudioContext() {
    if (this.#audioContext) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.#audioContext = new AudioCtx();
    this.#gainNode = this.#audioContext.createGain();
    this.#gainNode.gain.setValueAtTime(this.volume, this.#audioContext.currentTime);
    this.#gainNode.connect(this.#audioContext.destination);
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

    const speechReadyText = strip_cognition_blocks(text)
      .replace(/[*_#`~]/g, "")
      .replace(/\[\[(.*?)\]\]/g, "$1")
      .replace(/<[^>]*>/g, "")
      .trim();

    if (!speechReadyText) return;

    if (this.#queue.length > 0 && this.#queue[this.#queue.length - 1].text === speechReadyText) {
      return;
    }

    this.#queue.push({
      text: speechReadyText,
      voiceUri: this.selectedVoice,
    });

    if (!this.#isProcessing) {
      this.#processQueue();
    }
  }

  /**
   * Processes the queue sequentially, generating audio for each chunk.
   */
  async #processQueue() {
    if (this.#queue.length === 0) {
      this.#isProcessing = false;
      this.isSpeaking = false;
      this.activeMessageId = null;
      return;
    }

    this.#isProcessing = true;
    this.isSpeaking = true;

    await this.#ensureModel();

    if (this.#useFallback) {
      this.#processFallback();
      return;
    }

    const currentItem = this.#queue[0];

    try {
      const audio = await this.#tts.generate(currentItem.text, {
        voice: currentItem.voiceUri || "af_heart",
        speed: this.rate,
      });

      // Check if we were stopped while generating
      if (!this.#isProcessing) return;

      this.#playAudio(audio.audio, audio.sampling_rate || 24000);

      // Wait for playback to finish
      await new Promise((resolve) => {
        if (!this.#currentSource) {
          resolve(undefined);
          return;
        }
        this.#currentSource.onended = () => resolve(undefined);
      });
    } catch (err) {
      console.warn("[VoiceEngine] Kokoro generation error:", err);
    }

    this.#queue.shift();
    setTimeout(() => this.#processQueue(), 40);
  }

  /**
   * Plays raw audio data through the AudioContext.
   * @param {Float32Array|number[]} audioData
   * @param {number} sampleRate
   */
  #playAudio(audioData, sampleRate) {
    this.#ensureAudioContext();
    if (!this.#audioContext) return;

    const ctx = this.#audioContext;
    const buffer = ctx.createBuffer(1, audioData.length, sampleRate);
    buffer.getChannelData(0).set(audioData);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.#gainNode);

    if (ctx.state === "suspended") ctx.resume();

    source.start(0);
    this.#currentSource = source;
  }

  /**
   * Fallback processing using Web Speech API.
   */
  #processFallback() {
    if (!this.#fallbackSynth) {
      this.#isProcessing = false;
      this.isSpeaking = false;
      return;
    }

    if (this.#queue.length === 0) {
      this.#isProcessing = false;
      this.isSpeaking = false;
      this.activeMessageId = null;
      return;
    }

    const currentItem = this.#queue[0];
    const utterance = new SpeechSynthesisUtterance(currentItem.text);
    const voice = this.voices.find((v) => v.uri === currentItem.voiceUri) || this.voices[0];
    if (voice?._ref) utterance.voice = voice._ref;
    utterance.volume = this.volume;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    let settled = false;
    const advance = (interrupted) => {
      if (settled) return;
      settled = true;
      this.#queue.shift();
      setTimeout(() => this.#processFallback(), interrupted ? 250 : 40);
    };

    utterance.onend = () => advance(false);
    utterance.onerror = (e) => advance(e?.error === "interrupted" || e?.error === "canceled");
    this.#fallbackSynth.speak(utterance);
  }

  /**
   * Previews a voice with a short sample phrase.
   * @param {string} uri
   * @param {number} [rate]
   * @param {number} [pitch]
   */
  async preview(uri, rate = 1.0, pitch = 1.0) {
    this.stop();
    const voice = this.voices.find((v) => v.uri === uri);
    if (!voice) return;

    await this.#ensureModel();

    if (this.#useFallback) {
      if (!this.#fallbackSynth) return;
      this.isSpeaking = true;
      const utterance = new SpeechSynthesisUtterance("Previewing voice system.");
      const v = this.voices.find((v) => v.uri === uri) || this.voices[0];
      if (v?._ref) utterance.voice = v._ref;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.onend = () => (this.isSpeaking = false);
      utterance.onerror = () => (this.isSpeaking = false);
      this.#fallbackSynth.speak(utterance);
      return;
    }

    this.isSpeaking = true;
    try {
      const audio = await this.#tts.generate("Previewing voice system.", {
        voice: uri,
        speed: rate,
      });
      this.#playAudio(audio.audio, audio.sampling_rate || 24000);
      if (this.#currentSource) {
        this.#currentSource.onended = () => (this.isSpeaking = false);
      }
    } catch (err) {
      console.warn("[VoiceEngine] Preview failed:", err);
      this.isSpeaking = false;
    }
  }

  /**
   * Cancels active audio playback and flushes the queue.
   */
  stop() {
    this.#queue = [];
    this.#isProcessing = false;

    if (this.#currentSource) {
      try {
        this.#currentSource.onended = null;
        this.#currentSource.stop();
      } catch {
        /* empty */
      }
      this.#currentSource = null;
    }

    if (this.#fallbackSynth) {
      this.#fallbackSynth.cancel();
    }

    this.isSpeaking = false;
    this.activeMessageId = null;
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
  #audioContext = null;
  /** @type {GainNode | null} */
  #gainNode = null;
  /** @type {Map<string, AudioBuffer>} */
  #buffers = new Map();
  /** @type {Map<string, Promise<AudioBuffer>>} */
  #pendingBuffers = new Map();
  /** @type {boolean} */
  #unlocked = false;
  /** @type {number} */
  #lastPlayed = 0;
  /** @type {number} */
  #threshold = 500; // debounce in ms

  // --- REACTIVE STATE ---
  notifications_enabled = $state(false); // Defaulting strictly to off

  /**
   * Initializes browser window interaction listeners.
   */
  constructor() {
    this.#initListeners();
  }

  /**
   * Syncs internal configuration from client storage space.
   */
  async initSettings() {
    try {
      const entry = await db.audio_prefs.get(STORAGE_KEY);
      if (entry && entry.value) {
        this.notifications_enabled = entry.value.notificationsEnabled === true;
        Audio.voice.enabled = entry.value.voiceEnabled === true;
        if (entry.value.masterVolume !== undefined) {
          Audio.voice.volume = entry.value.masterVolume;
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
          notificationsEnabled: this.notifications_enabled,
          voiceEnabled: Audio.voice.enabled,
          masterVolume: Audio.voice.volume,
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
    if (this.#gainNode && this.#audioContext) {
      /** @type {GainNode} */ (this.#gainNode).gain.setValueAtTime(volume, /** @type {AudioContext} */ (this.#audioContext).currentTime);
    }
  }

  /**
   * Intercepts gestures to dynamically prime browser AudioContext properties.
   */
  #initListeners() {
    if (typeof window === "undefined") return;

    const unlockHandler = () => {
      this.unlock();
      ["click", "touchstart", "keydown"].forEach((ev) => document.body.removeEventListener(ev, unlockHandler));
    };
    ["click", "touchstart", "keydown"].forEach((ev) => document.body.addEventListener(ev, unlockHandler));
  }

  /**
   * Awakens the suspended audio landscape context safely.
   */
  async unlock() {
    if (this.#unlocked) return;
    try {
      if (!this.#audioContext) {
        const AudioCtx = /** @type {any} */ (window).AudioContext || /** @type {any} */ (window).webkitAudioContext;
        if (!AudioCtx) {
          console.warn("[AudioEngine] AudioContext not supported in this environment.");
          return;
        }
        this.#audioContext = new AudioCtx();

        this.#gainNode = /** @type {AudioContext} */ (this.#audioContext).createGain();
        /** @type {GainNode} */ (this.#gainNode).gain.setValueAtTime(
          Audio.voice.volume,
          /** @type {AudioContext} */ (this.#audioContext).currentTime,
        );
        /** @type {GainNode} */ (this.#gainNode).connect(/** @type {AudioContext} */ (this.#audioContext).destination);
      }
      if (this.#audioContext && /** @type {AudioContext} */ (this.#audioContext).state === "suspended") {
        await /** @type {AudioContext} */ (this.#audioContext).resume();
      }
      this.#unlocked = true;
    } catch (e) {
      console.warn("[AudioEngine] Failed to unlock AudioContext:", e);
    }
  }

  /**
   * @param {string} key
   */
  async play(key) {
    if (key === "notification" && !this.notifications_enabled) return;
    if (!this.#unlocked || !this.#audioContext || !this.#gainNode) return;

    const now = Date.now();
    if (now - this.#lastPlayed < this.#threshold) return;
    this.#lastPlayed = now;

    let url = null;
    const soundList = getRpgList("sounds");
    if (soundList.length > 0) {
      const entry = soundList.find((/** @type {any} */ s) => typeof s === "string" && s.startsWith(key + "="));
      if (entry) url = entry.split("=").slice(1).join("=").trim();
    }

    if (!url && key === "notification") {
      url = "https://user.uploads.dev/file/50dc061d6ed6439719d283d042e9c172.wav";
    }

    if (!url) return;

    try {
      let buffer = this.#buffers.get(key);
      if (!buffer) {
        if (this.#pendingBuffers.has(key)) {
          buffer = await this.#pendingBuffers.get(key);
        } else {
          const fetchPromise = (async () => {
            try {
              const response = await fetch(url);
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              const arrayBuffer = await response.arrayBuffer();
              const decoded = await new Promise((resolve, reject) => {
                const promise = /** @type {AudioContext} */ (this.#audioContext).decodeAudioData(arrayBuffer, resolve, reject);
                if (promise) promise.then(resolve).catch(reject);
              });
              this.#buffers.set(key, decoded);
              return decoded;
            } finally {
              this.#pendingBuffers.delete(key);
            }
          })();

          this.#pendingBuffers.set(key, fetchPromise);
          buffer = await fetchPromise;
        }
      }
      const source = /** @type {AudioContext} */ (this.#audioContext).createBufferSource();
      source.buffer = buffer || null;

      source.connect(/** @type {GainNode} */ (this.#gainNode));
      source.start(0);
    } catch (e) {
      console.warn("[AudioEngine] Playback error:", e);
    }
  }
}

/************************************************************************************
 * [SECTION: THE AUDIO SINGLETON]
 * Primary interface for the rest of the application.
 ************************************************************************************/
export const Audio = new (class {
  #effects = new AudioEffectsEngine();
  /** @type {Promise<void> | null} */
  #initPromise = null;

  voice = new VoiceEngine();

  /**
   * Unified master volume interface bridging both vocal streams and sound effect contexts.
   */
  get volume() {
    return this.voice.volume;
  }

  set volume(v) {
    const cleanVolume = Math.max(0, Math.min(1, Number(v)));
    this.voice.volume = cleanVolume;
    this.#effects.setVolume(cleanVolume);
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
   * @param {string} soundId
   */
  play(soundId) {
    return this.#effects.play(soundId);
  }

  /**
   * Pre-loads configurations and states safely before interface assembly.
   */
  async init() {
    if (this.#initPromise) return this.#initPromise;
    this.#initPromise = this.#effects.initSettings();
    return this.#initPromise;
  }
})();
