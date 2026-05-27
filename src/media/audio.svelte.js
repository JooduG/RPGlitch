/**
 * src/media/audio.svelte.js
 * [**] AUDIO ENGINE
 * The sensory cortex for all things sonic. Handles sound effects,
 * notifications, and text-to-speech with Svelte 5 reactivity.
 */
import { getRpgList } from "@components";
import { db } from "@data";
import { SvelteSet } from "svelte/reactivity";

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
        const msg =
          reason && typeof reason === "object" && reason.message
            ? String(reason.message)
            : reason
              ? String(reason)
              : "";
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
 * Low-level wrapper for window.speechSynthesis with resilient queuing.
 ************************************************************************************/
/**
 * Handles vocal synthesis engine configuration and lifecycle management.
 */
export class VoiceEngine {
  // --- REACTIVE STATE ---
  isSpeaking = $state(false);
  /** @type {any[]} */
  voices = $state([]);
  /** @type {string | null} */
  selectedVoice = $state(null);
  volume = $state(1.0);
  rate = $state(1.0);
  pitch = $state(1.0);
  enabled = $state(false); // Defaulting strictly to off

  // --- PRIVATE TYPE MATRIX ---
  /** @type {SpeechSynthesis | null} */
  _synth = null;
  /** @type {SpeechSynthesisUtterance | null} */
  _utterance = null;
  /** @type {Array<{ text: string, voiceUri: string|null }>} */
  #queue = [];
  /** @type {boolean} */
  #isProcessing = false;

  /**
   * Initializes the speech synthesis interface and binds platform event triggers.
   */
  constructor() {
    if (typeof window !== "undefined") {
      this._synth = window.speechSynthesis;
      this._loadVoices();
      if (this._synth && /** @type {any} */ (this._synth).onvoiceschanged !== undefined) {
        /** @type {any} */ (this._synth).onvoiceschanged = () => this._loadVoices();
      }
    }
  }

  /**
   * Loads, filters, and filters out clone duplicates from the platform voice array.
   */
  _loadVoices() {
    if (!this._synth) return;
    let rawVoices = /** @type {SpeechSynthesis} */ (this._synth).getVoices();

    const seenIdentities = new SvelteSet();

    this.voices = rawVoices
      .filter((v) => v.lang.startsWith("en") || v.lang.startsWith("sv"))
      .map((v) => ({
        name: v.name,
        uri: v.voiceURI,
        lang: v.lang,
        localService: v.localService,
        default: v.default,
        region: this._getRegionLabel(v.lang),
        supportsParams: !v.name.includes("Natural"),
        _ref: v,
      }))
      .filter((v) => {
        const cleanToken = v.name
          .replace(/Microsoft|Google|Desktop|Mobile|Speech|Natural|Voice|Online/gi, "")
          .replace(/\s+-\s+.*/g, "")
          .trim();

        const coreIdentifier = cleanToken.split(/\s+/)[0]?.toLowerCase() || v.name.toLowerCase();

        if (seenIdentities.has(coreIdentifier)) return false;
        seenIdentities.add(coreIdentifier);
        return true;
      })
      .sort((/** @type {any} */ a, /** @type {any} */ b) => {
        const regionSort = a.region.localeCompare(b.region);
        if (regionSort !== 0) return regionSort;
        return a.name.localeCompare(b.name);
      });

    if (!this.selectedVoice && this.voices.length > 0) {
      const preferred =
        this.voices.find((v) => v.name.includes("Google US English")) || this.voices[0];
      this.selectedVoice = preferred.uri;
    }
  }

  /**
   * @param {string} lang
   */
  _getRegionLabel(lang) {
    try {
      const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
      const regionCode = lang.split("-")[1];
      return regionCode ? displayNames.of(regionCode) : "Global";
    } catch {
      return "Global";
    }
  }

  /**
   * Appends sanitized narrative segments to the custom engine execution queue.
   * @param {string} text
   * @param {boolean} [clearQueue=true]
   * @param {boolean} [force=false]
   */
  speak(text, clearQueue = true, force = false) {
    if (!this._synth || !text) return;
    if (!this.enabled && !force) return;

    if (clearQueue) {
      this.stop();
    }

    const speechReadyText = text
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<think>[\s\S]*/gi, "")
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
   * Processes the structured sequential speech array block-by-block.
   */
  #processQueue() {
    if (!this._synth) return;

    if (this.#queue.length === 0) {
      this.#isProcessing = false;
      this.isSpeaking = false;
      this._utterance = null;
      return;
    }

    this.#isProcessing = true;
    this.isSpeaking = true;

    const currentItem = this.#queue[0];
    const utterance = new SpeechSynthesisUtterance(currentItem.text);
    this._utterance = utterance;

    const voice = this.voices.find((v) => v.uri === currentItem.voiceUri) || this.voices[0];
    if (voice) {
      utterance.voice = voice._ref;
    }

    utterance.volume = this.volume;
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    let isSettled = false;

    /**
     * Advances the internal execution pointer safely.
     * @param {boolean} wasInterrupted
     */
    const advanceQueue = (wasInterrupted) => {
      if (isSettled) return;
      isSettled = true;

      this.#queue.shift();

      const stepDelay = wasInterrupted ? 250 : 40;
      setTimeout(() => this.#processQueue(), stepDelay);
    };

    utterance.onend = () => {
      advanceQueue(false);
    };

    utterance.onerror = (/** @type {any} */ e) => {
      const isInterrupted = e && (e.error === "interrupted" || e.error === "canceled");
      if (isInterrupted) {
        console.warn(
          "[AudioEngine] System channel reset detected. Applying hardware backoff recovery delay.",
          e,
        );
      } else {
        console.warn("[AudioEngine] Managed synthesis track error:", e);
      }
      advanceQueue(isInterrupted);
    };

    try {
      /** @type {SpeechSynthesis} */ (this._synth).speak(utterance);
    } catch (err) {
      console.warn("[AudioEngine] Native channel speech invocation failed:", err);
      advanceQueue(true);
    }
  }

  /**
   * @param {string} uri
   * @param {number} [rate]
   * @param {number} [pitch]
   */
  preview(uri, rate = 1.0, pitch = 1.0) {
    if (!this._synth) return;
    this.stop();
    const voice = this.voices.find((v) => v.uri === uri) || this.voices[0];
    if (!voice) return;

    this.isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance("Previewing voice system.");
    utterance.voice = voice._ref;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onend = () => (this.isSpeaking = false);
    utterance.onerror = () => (this.isSpeaking = false);
    /** @type {SpeechSynthesis} */ (this._synth).speak(utterance);
  }

  /**
   * Cancels active audio playback streams immediately and flushes memory slots.
   */
  stop() {
    this.#queue = [];
    this.#isProcessing = false;
    if (this._synth) {
      /** @type {SpeechSynthesis} */ (this._synth).cancel();
    }
    this.isSpeaking = false;
    this._utterance = null;
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
      /** @type {GainNode} */ (this.#gainNode).gain.setValueAtTime(
        volume,
        /** @type {AudioContext} */ (this.#audioContext).currentTime,
      );
    }
  }

  /**
   * Intercepts gestures to dynamically prime browser AudioContext properties.
   */
  #initListeners() {
    if (typeof window === "undefined") return;

    const unlockHandler = () => {
      this.unlock();
      ["click", "touchstart", "keydown"].forEach((ev) =>
        document.body.removeEventListener(ev, unlockHandler),
      );
    };
    ["click", "touchstart", "keydown"].forEach((ev) =>
      document.body.addEventListener(ev, unlockHandler),
    );
  }

  /**
   * Awakens the suspended audio landscape context safely.
   */
  async unlock() {
    if (this.#unlocked) return;
    try {
      if (!this.#audioContext) {
        const AudioCtx =
          /** @type {any} */ (window).AudioContext ||
          /** @type {any} */ (window).webkitAudioContext;
        this.#audioContext = new AudioCtx();

        this.#gainNode = /** @type {AudioContext} */ (this.#audioContext).createGain();
        /** @type {GainNode} */ (this.#gainNode).gain.setValueAtTime(
          Audio.voice.volume,
          /** @type {AudioContext} */ (this.#audioContext).currentTime,
        );
        /** @type {GainNode} */ (this.#gainNode).connect(
          /** @type {AudioContext} */ (this.#audioContext).destination,
        );
      }
      if (
        this.#audioContext &&
        /** @type {AudioContext} */ (this.#audioContext).state === "suspended"
      ) {
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
      const entry = soundList.find(
        (/** @type {any} */ s) => typeof s === "string" && s.startsWith(key + "="),
      );
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
                const promise = /** @type {AudioContext} */ (this.#audioContext).decodeAudioData(
                  arrayBuffer,
                  resolve,
                  reject,
                );
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
