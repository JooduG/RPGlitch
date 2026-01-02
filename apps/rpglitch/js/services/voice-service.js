import { log, error } from "../core/utils.js";

class VoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.useHighQuality = true; // Use Puter/ElevenLabs by default
    this.currentAudio = null; // Track Puter audio instance
    this.enabled = false;

    // Initialize Recognition
    if ("webkitSpeechRecognition" in window) {
      this.recognition = new window.webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = "en-US";

      this.recognition.onstart = () => {
        this.isListening = true;
        this._emitStateChange();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this._emitStateChange();
      };

      this.recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        log(`🎤 [VOICE] Heard: "${text}"`);
        this.stop(); // Stop any playback

        // Populate chat and send
        const input = document.querySelector(
          "#story-form textarea[name='message']",
        );
        if (input) {
          input.value = text;
          // Trigger auto-resize if needed
          input.dispatchEvent(new Event("input"));
          // Submit
          const form = document.querySelector("#story-form");
          if (form) form.requestSubmit();
        }
      };

      this.recognition.onerror = (event) => {
        error(`[VOICE] Error: ${event.error}`);
        this.isListening = false;
        this._emitStateChange();
      };
    } else {
      console.warn("[VoiceService] webkitSpeechRecognition not supported.");
    }
  }

  init() {
    // Sync with config if needed
    if (window.rpgLists?.settings) {
      const vSetting = window.rpgLists.settings.find((s) =>
        s.startsWith("voiceEnabled"),
      );
      if (vSetting) {
        this.enabled = vSetting.split("=")[1]?.trim() === "true";
      }
    }
    log("[VoiceService] Initialized. Enabled:", this.enabled);
  }

  toggleListen() {
    if (!this.recognition) return;
    if (this.isListening) {
      this.recognition.stop();
    } else {
      // If speaking, stop speaking first
      this.stop();
      this.recognition.start();
    }
  }

  listen() {
    if (!this.recognition) return;
    this.stop();
    this.recognition.start();
  }

  stop() {
    // 1. Stop Native TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // 2. Stop Puter Audio
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.currentAudio = null;
    }
  }

  async speak(text) {
    if (!this.enabled) return;

    // Clean text (remove HTML, specific markers)
    const cleanText = text
      .replace(/<[^>]*>?/gm, "")
      .replace(/\(.*?\)/g, "")
      .trim();

    if (this.useHighQuality && window.puter) {
      try {
        log("🗣️ [VOICE] Attempting Puter TTS...");
        // Rachel: 21m00Tcm4TlvDq8ikWAM
        // Domi: Domi
        // Bella: EXAVITQu4vr4xnSDxMaL
        const audio = await window.puter.ai.txt2speech(cleanText, {
          provider: "elevenlabs",
          voice: "21m00Tcm4TlvDq8ikWAM",
          model: "eleven_turbo_v2_5",
        });

        this.stop(); // Ensure clear channel
        this.currentAudio = audio;
        audio.play();
        return;
      } catch (err) {
        console.warn(
          "Puter TTS failed/dismissed, falling back to native:",
          err,
        );
      }
    }

    // Fallback Code
    log("🗣️ [VOICE] Using Native TTS fallback.");
    this.stop();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice =
      window.speechSynthesis.getVoices().find((v) => v.lang.includes("en")) ||
      null;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  _emitStateChange() {
    const btn = document.querySelector("#btn-mic");
    if (btn) {
      if (this.isListening) {
        btn.classList.add("listening");
        btn.style.color = "var(--pico-primary)";
      } else {
        btn.classList.remove("listening");
        btn.style.removeProperty("color");
      }
    }
  }
}

export const voiceService = new VoiceService();
