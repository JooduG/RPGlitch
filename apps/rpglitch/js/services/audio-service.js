import { log } from "../core/utils.js";

class AudioService {
  constructor() {
    console.log("[AudioService] Service instantiated.");
    this.audioContext = null;
    this.buffers = new Map();
    this.unlocked = false;
    this.lastPlayed = 0;
    this.threshold = 500; // debounce in ms (Refined requirement)
  }

  init() {
    console.log("[AudioService] Initializing event listeners...");
    // One-time listener to unlock audio
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
    // 1. Check unlock state
    if (!this.unlocked || !this.audioContext) return;

    // 2. Debounce
    const now = Date.now();
    if (now - this.lastPlayed < this.threshold) {
      return;
    }
    this.lastPlayed = now;

    let url = null;

    // 3. Config Lookup (Robust Parsing)
    if (window.rpgLists?.sounds) {
      try {
        let soundList = window.rpgLists.sounds;

        // Handle Perchance "Array of JSON String" wrapper
        // Example: ['["notification = https://..."]']
        if (Array.isArray(soundList) && soundList.length > 0) {
          // Robust Parse
          try {
            // If it's a string, try to parse it (it might be a JSON array string)
            if (
              typeof soundList[0] === "string" &&
              soundList[0].trim().startsWith("[")
            ) {
              soundList = JSON.parse(soundList[0]);
            }
            // If it turns out not to be an array after parse, reset
            if (!Array.isArray(soundList)) soundList = [];
          } catch (e) {
            console.warn("[AudioService] JSON parse warning:", e);
            soundList = []; // Safe fallback
          }
        } else {
          soundList = [];
        }

        // Now search the list
        if (Array.isArray(soundList)) {
          const soundEntry = soundList.find(
            (s) => typeof s === "string" && s.startsWith(key),
          );
          if (soundEntry) {
            // Extract URL (everything after the first '=')
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

    // 4. Fallback
    if (!url && key === "notification") {
      // console.warn("[AudioService] Config missing/parse error. Using fallback.");
      url =
        "https://user.uploads.dev/file/50dc061d6ed6439719d283d042e9c172.wav";
    }

    if (!url) return;

    // 5. Playback
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
