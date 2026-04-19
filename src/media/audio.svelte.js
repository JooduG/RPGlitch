/**
 * src/media/audio.svelte.js
 * 🎵 AUDIO SERVICE
 * Handles sound effects and text-to-speech with Svelte 5 reactivity.
 */
import { db } from "@data/db.js";
import { textToSpeech } from "./speech-engine.svelte.js";

const STORAGE_KEY = "rpglitch_audio_settings";

class SoundEffectsService {
  // --- PRIVATE STATE ---
  #audioContext = null;
  #buffers = new Map();
  #unlocked = false;
  #lastPlayed = 0;
  #threshold = 500; // debounce in ms

  // --- REACTIVE STATE ---
  notifications_enabled = $state(true);

  constructor() {
    // Initialization of DOM listeners for audio unlocking
    this.#initListeners();
  }

  /**
   * Initialize settings from IndexedDB.
   */
  async initSettings() {
    try {
      const entry = await db.audio_prefs.get(STORAGE_KEY);
      if (entry && entry.value) {
        this.notifications_enabled = !!entry.value.notificationsEnabled;
      }
    } catch (e) {
      console.warn("[Audio] Failed to load settings:", e);
    }
  }

  /**
   * Update notification settings and persist to DB.
   */
  async setNotifications(enabled) {
    this.notifications_enabled = !!enabled;
    try {
      await db.audio_prefs.put({
        key: STORAGE_KEY,
        value: { notificationsEnabled: this.notifications_enabled },
      });
    } catch (e) {
      console.error("[Audio] Failed to save settings:", e);
    }
  }

  #initListeners() {
    if (typeof window === "undefined") return;

    const unlockHandler = () => {
      this.unlock();
      document.body.removeEventListener("click", unlockHandler);
      document.body.removeEventListener("touchstart", unlockHandler);
      document.body.removeEventListener("keydown", unlockHandler);
    };
    document.body.addEventListener("click", unlockHandler);
    document.body.addEventListener("touchstart", unlockHandler);
    document.body.addEventListener("keydown", unlockHandler);
  }

  async unlock() {
    if (this.#unlocked) return;
    try {
      if (!this.#audioContext) {
        this.#audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.#audioContext.state === "suspended") {
        await this.#audioContext.resume();
      }
      this.#unlocked = true;
    } catch (e) {
      console.warn("[Audio] Failed to unlock AudioContext:", e);
    }
  }

  /**
   * Play a sound effect or notification.
   */
  async play(key) {
    if (key === "notification" && !this.notifications_enabled) {
      return;
    }

    if (!this.#unlocked || !this.#audioContext) return;

    const now = Date.now();
    if (now - this.#lastPlayed < this.#threshold) {
      return;
    }
    this.#lastPlayed = now;

    let url = null;
    // Check global rpgLists for sound mappings (Perchance pattern)
    if (window.rpgLists?.sounds) {
      try {
        let soundList = window.rpgLists.sounds;
        if (Array.isArray(soundList) && soundList.length > 0) {
          if (typeof soundList[0] === "string" && soundList[0].trim().startsWith("[")) {
            soundList = JSON.parse(soundList[0]);
          }
        }

        if (Array.isArray(soundList)) {
          const soundEntry = soundList.find((s) => typeof s === "string" && s.startsWith(key));
          if (soundEntry) {
            const parts = soundEntry.split("=");
            if (parts.length > 1) {
              url = parts.slice(1).join("=").trim();
            }
          }
        }
      } catch (e) {
        console.error("[Audio] Config lookup failed:", e);
      }
    }

    // Fallback for primary notification
    if (!url && key === "notification") {
      url = "https://user.uploads.dev/file/50dc061d6ed6439719d283d042e9c172.wav";
    }

    if (!url) return;

    try {
      let buffer = this.#buffers.get(key);
      if (!buffer) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        buffer = await this.#audioContext.decodeAudioData(arrayBuffer);
        this.#buffers.set(key, buffer);
      }
      const source = this.#audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.#audioContext.destination);
      source.start(0);
    } catch (e) {
      console.warn("[Audio] Playback error:", e);
    }
  }
}

// Instantiate the singleton service
export const Audio = new (class {
  #effects = new SoundEffectsService();
  #initPromise = null;

  voice = textToSpeech;

  // Proxy the reactive state and methods
  get notifications_enabled() {
    return this.#effects.notifications_enabled;
  }
  set notifications_enabled(v) {
    this.#effects.setNotifications(v);
  }

  play(soundId) {
    return this.#effects.play(soundId);
  }

  async init() {
    if (this.#initPromise) return this.#initPromise;
    this.#initPromise = this.#effects.initSettings();
    return this.#initPromise;
  }
})();
