/**
 * src/media/audio-engine.svelte.js
 * [**] AUDIO ENGINE
 * The sensory cortex for all things sonic. Handles sound effects,
 * notifications, and text-to-speech with Svelte 5 reactivity.
 */
import { db } from "@data/db.js";
import { getRpgList } from "@utils/helpers.js";

const STORAGE_KEY = "rpglitch_audio_settings";

/************************************************************************************
 * [SECTION: VOICE ENGINE]
 * Low-level wrapper for window.speechSynthesis.
 ************************************************************************************/
/**
 *
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

  // --- PRIVATE ---
  /** @type {SpeechSynthesis | null} */
  _synth = null;
  /** @type {SpeechSynthesisUtterance | null} */
  _utterance = null;

  /**
   *
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
   *
   */
  _loadVoices() {
    if (!this._synth) return;
    let rawVoices = /** @type {SpeechSynthesis} */ (this._synth).getVoices();
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
   * @param {string} text
   */
  speak(text) {
    if (!this._synth || !text) return;
    this.stop();

    const voice = this.voices.find((v) => v.uri === this.selectedVoice) || this.voices[0];
    if (!voice) {
      console.warn("[AudioEngine] No voice available.");
      return;
    }

    this.isSpeaking = true;
    this._utterance = new SpeechSynthesisUtterance(text);
    this._utterance.voice = voice._ref;
    this._utterance.volume = this.volume;
    this._utterance.rate = this.rate;
    this._utterance.pitch = this.pitch;

    this._utterance.onend = () => {
      this.isSpeaking = false;
      this._utterance = null;
    };
    this._utterance.onerror = (/** @type {any} */ e) => {
      console.warn("[AudioEngine] Synthesis error", e);
      this.isSpeaking = false;
      this._utterance = null;
    };
    /** @type {SpeechSynthesis} */ (this._synth).speak(this._utterance);
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
   *
   */
  stop() {
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
 *
 */
class AudioEffectsEngine {
  // --- PRIVATE STATE ---
  /** @type {AudioContext | null} */
  #audioContext = null;
  /** @type {Map<string, AudioBuffer>} */
  #buffers = new Map();
  /** @type {Map<string, Promise<AudioBuffer>>} */
  #pendingBuffers = new Map();
  #unlocked = false;
  #lastPlayed = 0;
  #threshold = 500; // debounce in ms

  // --- REACTIVE STATE ---
  notifications_enabled = $state(true);

  /**
   *
   */
  constructor() {
    this.#initListeners();
  }

  /**
   *
   */
  async initSettings() {
    try {
      const entry = await db.audio_prefs.get(STORAGE_KEY);
      if (entry && entry.value) {
        this.notifications_enabled = !!entry.value.notificationsEnabled;
      }
    } catch (e) {
      console.warn("[AudioEngine] Failed to load settings:", e);
    }
  }

  /**
   * @param {any} enabled
   */
  async setNotifications(enabled) {
    this.notifications_enabled = !!enabled;
    try {
      await db.audio_prefs.put({
        key: STORAGE_KEY,
        value: { notificationsEnabled: this.notifications_enabled },
      });
    } catch (e) {
      console.error("[AudioEngine] Failed to save settings:", e);
    }
  }

  /**
   *
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
   *
   */
  async unlock() {
    if (this.#unlocked) return;
    try {
      if (!this.#audioContext) {
        const AudioCtx =
          /** @type {any} */ (window).AudioContext ||
          /** @type {any} */ (window).webkitAudioContext;
        this.#audioContext = new AudioCtx();
      }
      if (this.#audioContext && this.#audioContext.state === "suspended") {
        await this.#audioContext.resume();
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
    if (!this.#unlocked || !this.#audioContext) return;

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
        // Handle concurrent requests for the same key
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
      source.connect(/** @type {AudioContext} */ (this.#audioContext).destination);
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
  #initPromise = null;

  voice = new VoiceEngine();

  /**
   *
   */
  get notifications_enabled() {
    return this.#effects.notifications_enabled;
  }
  /**
   *
   */
  set notifications_enabled(v) {
    this.#effects.setNotifications(v);
  }

  /**
   * @param {string} soundId
   */
  play(soundId) {
    return this.#effects.play(soundId);
  }

  /**
   *
   */
  async init() {
    if (this.#initPromise) return this.#initPromise;
    this.#initPromise = /** @type {any} */ (this.#effects).initSettings();
    return this.#initPromise;
  }
})();
