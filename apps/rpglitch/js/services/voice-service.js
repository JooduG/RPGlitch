import { log, error } from "../core/utils.js";

/**
 * Native Voice Service (Biometric Edition)
 * Pure native SpeechSynthesis with dynamic Rate/Pitch modulation.
 * Supports "Call Mode" loop via SpeechRecognition.
 */
export class VoiceService {
  constructor() {
    this.voices = [];
    this.currentVoiceURI = null;
    this.baseRate = 1.0;
    this.basePitch = 1.0;
    this.callMode = false;
    this.isSpeaking = false;
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isReady = false;

    // Mic State
    this.isListening = false;
  }

  async init() {
    if (this.isReady) return;

    // Load voices
    await this._loadVoices();

    // Listener for async loading
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this._loadVoices();
    }

    // Init Recognition if supported
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = "en-US";
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    } else {
      log("[VoiceService] SpeechRecognition not supported in this browser.");
    }

    this.isReady = true;
    log("[VoiceService] Native Biometric Service Initialized.");
  }

  _loadVoices() {
    return new Promise((resolve) => {
      let rawVoices = this.synth.getVoices();

      if (rawVoices.length === 0) {
        setTimeout(() => {
          rawVoices = this.synth.getVoices();
          this._processVoices(rawVoices);
          resolve();
        }, 100);
      } else {
        this._processVoices(rawVoices);
        resolve();
      }
    });
  }

  _processVoices(rawList) {
    this.voices = rawList
      .map((v) => ({
        name: v.name,
        uri: v.voiceURI,
        lang: v.lang,
        _ref: v,
        tier: this._getScore(v.name),
      }))
      .sort((a, b) => a.tier - b.tier);

    log(`[VoiceService] Loaded ${this.voices.length} voices.`);
  }

  _getScore(name) {
    if (name.includes("Online (Natural)")) return 1; // Edge Top Tier
    if (name.includes("Natural")) return 2; // Generic Natural
    if (name.includes("Google")) return 3; // Chrome
    if (name.includes("Microsoft")) return 4; // Windows Standard
    return 9;
  }

  getVoices() {
    return this.voices;
  }

  setVoice(uri) {
    this.currentVoiceURI = uri;
  }

  setRate(val) {
    this.baseRate = Math.max(0.5, Math.min(2.0, parseFloat(val) || 1.0));
  }

  setPitch(val) {
    this.basePitch = Math.max(0.1, Math.min(2.0, parseFloat(val) || 1.0));
  }

  setCallMode(enabled) {
    this.callMode = !!enabled;
    log(`[VoiceService] Call Mode: ${this.callMode ? "ON" : "OFF"}`);

    // Dispatch Generic State Change for UI
    this._dispatchStateChange();

    // Dispatch Specific Event for direct listeners
    document.dispatchEvent(
      new CustomEvent("call_mode_changed", { detail: { mode: this.callMode } }),
    );
  }

  _dispatchStateChange() {
    document.dispatchEvent(
      new CustomEvent("voice:state-change", {
        detail: {
          callMode: this.callMode,
          isListening: this.isListening,
          isSpeaking: this.isSpeaking,
        },
      }),
    );
  }

  /**
   * Speaks text with optional biometric modifiers.
   * @param {string} text
   * @param {string|null} voiceURI - Override voice
   * @param {object} modifiers - { rate: 1.0, pitch: 1.0 } (Multipliers)
   * @param {function} onEndCallback - Called when speech finishes
   */
  speak(text, voiceURI = null, modifiers = {}, onEndCallback = null) {
    if (!text) return;

    // 1. The Lobotomy (Clean tags)
    const cleanText = text
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .replace(/\*/g, "")
      .trim();

    if (!cleanText) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // Cancel current
    this.synth.cancel();

    // 2. Utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // 3. Select Voice
    const targetURI = voiceURI || this.currentVoiceURI;
    const voiceObj =
      this.voices.find((v) => v.uri === targetURI) || this.voices[0];
    if (voiceObj) {
      utterance.voice = voiceObj._ref;
    }

    // 4. Biometrics (Modifiers * Base)
    // Rate: Base * Mod. Clamped 0.1 - 10.0
    const modRate = modifiers.rate || 1.0;
    let finalRate = this.baseRate * modRate;
    finalRate = Math.max(0.1, Math.min(10.0, finalRate));

    // Pitch: Base * Mod. Clamped 0.1 - 2.0
    const modPitch = modifiers.pitch || 1.0;
    let finalPitch = this.basePitch * modPitch;
    finalPitch = Math.max(0.1, Math.min(2.0, finalPitch));

    utterance.rate = finalRate;
    utterance.pitch = finalPitch;

    // 5. Events
    utterance.onstart = () => {
      this.isSpeaking = true;
      this._dispatchStateChange();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this._dispatchStateChange();

      // TRIGGER LISTEN (If Call Mode is Active)
      if (this.callMode) {
        // If a specific callback was provided (e.g., from Orchestrator), it handles the logic
        // Otherwise we might trigger strictly here.
        // Current logic: Orchestrator passes a callback that calls .listen().
        // We'll trust the callback.
      }

      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      error("[VoiceService] Speech Error:", e);
      this.isSpeaking = false;
      this._dispatchStateChange();
      if (onEndCallback) onEndCallback();
    };

    this.synth.speak(utterance);
  }

  /**
   * Preview a voice setting
   */
  preview(uri, rate, pitch) {
    // Temporary overrides
    const oldRate = this.baseRate;
    const oldPitch = this.basePitch;

    if (rate) this.setRate(rate);
    if (pitch) this.setPitch(pitch);

    this.speak("Audio check. Systems nominal.", uri, {}, () => {
      // Restore
      this.baseRate = oldRate;
      this.basePitch = oldPitch;
    });
  }

  /**
   * Toggle Listen (Helper)
   */
  async toggleListen(onPartial, onFinal, onEnd) {
    if (this.isListening) {
      this.stopListening();
      if (onEnd) onEnd();
      return false;
    } else {
      this.listen(onPartial, onFinal, onEnd);
      return true;
    }
  }

  /**
   * Listen for speech (Mic)
   * @param {function} onPartial - Real-time transcript
   * @param {function} onFinal - Final result
   * @param {function} onEnd - Called when listening stops (for any reason)
   */
  listen(onPartial, onFinal, onEnd) {
    if (!this.recognition) return;
    if (this.isListening) return;

    this.isListening = true;
    this._dispatchStateChange();

    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");

      // Dispatch generic event for Input to catch
      document.dispatchEvent(
        new CustomEvent("voice:input", {
          detail: { transcript, isFinal: event.results[0].isFinal },
        }),
      );

      if (event.results[0].isFinal) {
        if (onFinal) onFinal(transcript);
      } else {
        if (onPartial) onPartial(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      error("[VoiceService] Mic Error:", event.error);
      this.isListening = false;
      this._dispatchStateChange();
      if (onEnd) onEnd();
    };

    this.recognition.onend = () => {
      // Debounce slightly to prevent state flicker
      setTimeout(() => {
        this.isListening = false;
        this._dispatchStateChange();
        if (onEnd) onEnd();
      }, 100);
    };

    try {
      this.recognition.start();
    } catch (e) {
      error("Mic Start Fail:", e);
      this.isListening = false;
      this._dispatchStateChange();
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      // State change handled in onend
    }
  }
}

export const voiceService = new VoiceService();
