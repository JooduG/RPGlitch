import { log } from "../gamemaster/utils.js";

const STORAGE_KEY = "rpglitch_audio_settings";

class AudioService {
  constructor() {
    log("[AudioService] Service instantiated.");
    this.audioContext = null;
    this.buffers = new Map();
    this.unlocked = false;
    this.lastPlayed = 0;
    this.threshold = 500; // debounce in ms
    this.notificationsEnabled = true;
    this._loadSettings();
  }

  _loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        if (typeof settings.notificationsEnabled === "boolean") {
          this.notificationsEnabled = settings.notificationsEnabled;
        }
      }
    } catch (e) {
      console.warn("[AudioService] Failed to load settings:", e);
    }
  }

  setNotifications(enabled) {
    this.notificationsEnabled = !!enabled;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ notificationsEnabled: this.notificationsEnabled }),
    );
    log("[AudioService] Notifications set to:", this.notificationsEnabled);
  }

  init() {
    log("[AudioService] Initializing event listeners...");
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
    if (this.unlocked) return;

    try {
      if (!this.audioContext) {
        this.audioContext = new (
          window.AudioContext || window.webkitAudioContext
        )();
      }

      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      this.unlocked = true;
      log("🔊 [AUDIO] Context unlocked and ready.");
    } catch (e) {
      log("⚠️ [AUDIO] Failed to unlock AudioContext:", e);
    }
  }

  async play(key) {
    if (key === "notification" && !this.notificationsEnabled) {
      return;
    }

    if (!this.unlocked || !this.audioContext) return;

    const now = Date.now();
    if (now - this.lastPlayed < this.threshold) {
      return;
    }
    this.lastPlayed = now;

    let url = null;

    if (window.rpgLists?.sounds) {
      try {
        let soundList = window.rpgLists.sounds;
        if (Array.isArray(soundList) && soundList.length > 0) {
          try {
            if (
              typeof soundList[0] === "string" &&
              soundList[0].trim().startsWith("[")
            ) {
              soundList = JSON.parse(soundList[0]);
            }
            if (!Array.isArray(soundList)) soundList = [];
          } catch (e) {
            console.warn("[AudioService] JSON parse warning:", e);
            soundList = [];
          }
        } else {
          soundList = [];
        }

        if (Array.isArray(soundList)) {
          const soundEntry = soundList.find(
            (s) => typeof s === "string" && s.startsWith(key),
          );
          if (soundEntry) {
            const parts = soundEntry.split("=");
            if (parts.length > 1) {
              url = parts.slice(1).join("=").trim();
            }
          }
        }
      } catch (e) {
        console.error("[AudioService] Config lookup failed:", e);
      }
    }

    if (!url && key === "notification") {
      url =
        "https://user.uploads.dev/file/50dc061d6ed6439719d283d042e9c172.wav";
    }

    if (!url) return;

    try {
      let buffer = this.buffers.get(key);
      if (!buffer) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        buffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.buffers.set(key, buffer);
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (e) {
      console.warn("[AudioService] Playback error:", e);
    }
  }
}

export const audioService = new AudioService();
