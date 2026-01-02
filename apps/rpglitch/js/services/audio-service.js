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
      console.log("[AudioService] Play skipped: Debounced.");
      return;
    }
    this.lastPlayed = now;

    // Parse URL from window.rpgLists.sounds
    // Format: "key = value"
    let url = null;

    // Try Config First
    if (window.rpgLists?.sounds) {
      const soundData = window.rpgLists.sounds.find((s) => s.startsWith(key));
      if (soundData) url = soundData.split("=")[1]?.trim();
    }

    // Fallback for notification if config failed
    if (!url && key === "notification") {
      console.warn("[AudioService] Config missing. Using fallback URL.");
      url =
        "https://user.uploads.dev/file/50dc061d6ed6439719d283d042e9c172.wav";
    }

    if (!url) {
      console.warn(`[AudioService] No URL found for '${key}'.`);
      return;
    }

    try {
      console.log(`[AudioService] Playing sound: ${key}`);
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
      // Fail silently to avoid breaking the app
      console.warn("[AudioService] Playback error:", e);
    }
  }
}

export const audioService = new AudioService();
