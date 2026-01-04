// import { log, error } from "../core/utils.js"; // Unused

/**
 * Native Voice Service (Biometric Edition)
 * Pure native SpeechSynthesis with dynamic Rate.
 * Pitch Modulation DISABLED for stability.
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
    this.isListening = false;
    this.STORAGE_KEY = "rpglitch_voice_settings";
  }

  async init() {
    if (this.isReady) return;

    this._loadSettings(); // Restore user prefs
    await this._loadVoices();

    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this._loadVoices();
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = "en-US";
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (e) => this._handleRecognitionResult(e);
      this.recognition.onerror = (e) => this._handleRecognitionError(e);
      this.recognition.onend = () => this._handleRecognitionEnd();
    }

    this.isReady = true;
  }

  _loadSettings() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.uri) this.currentVoiceURI = data.uri;
        if (data.rate) this.baseRate = data.rate;
        if (data.pitch) this.basePitch = data.pitch;
      }
    } catch (e) {
      console.warn("Failed to load voice settings", e);
    }
  }

  _saveSettings() {
    try {
      const data = {
        uri: this.currentVoiceURI,
        rate: this.baseRate,
        pitch: this.basePitch,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save voice settings", e);
    }
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
  }

  _getScore(name) {
    if (name.includes("Online (Natural)")) return 1;
    if (name.includes("Natural")) return 2;
    if (name.includes("Google")) return 3;
    if (name.includes("Microsoft")) return 4;
    return 9;
  }

  getVoices() {
    return this.voices;
  }

  setVoice(uri) {
    this.currentVoiceURI = uri;
    this._saveSettings();
  }

  setRate(val) {
    this.baseRate = Math.max(0.5, Math.min(2.0, parseFloat(val) || 1.0));
    this._saveSettings();
  }

  setPitch(val) {
    this.basePitch = Math.max(0.1, Math.min(2.0, parseFloat(val) || 1.0));
    this._saveSettings();
  }

  setCallMode(enabled) {
    this.callMode = !!enabled;
    this._dispatchStateChange();
    if (this.callMode && !this.isSpeaking && !this.isListening) {
      this.listen();
    }
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

  speak(text, voiceURI = null, modifiers = {}, onEndCallback = null) {
    if (!text) return;
    const cleanText = text
      .replace(/<[^>]*>/g, "")
      .replace(/\*/g, "")
      .trim();
    if (!cleanText) {
      if (onEndCallback) onEndCallback();
      return;
    }

    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const targetURI = voiceURI || this.currentVoiceURI;
    const voiceObj =
      this.voices.find((v) => v.uri === targetURI) || this.voices[0];
    if (voiceObj) utterance.voice = voiceObj._ref;

    // RATE: Dynamic
    const modRate = modifiers.rate || 1.0;
    utterance.rate = Math.max(0.1, Math.min(10.0, this.baseRate * modRate));

    // PITCH: LOCKED (Stability Fix)
    // We ignore modifiers.pitch to prevent browser crashes
    utterance.pitch = this.basePitch;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this._dispatchStateChange();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this._dispatchStateChange();

      // LOOP LOGIC
      if (this.callMode) {
        setTimeout(() => this.listen(), 200); // Brief pause before listening
      }

      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.error("Speech Error:", e);
      this.isSpeaking = false;
      this._dispatchStateChange();
      if (onEndCallback) onEndCallback();
    };

    this.synth.speak(utterance);
  }

  async toggleListen() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.listen();
    }
  }

  listen() {
    if (!this.recognition || this.isListening) return;
    try {
      this.recognition.start();
      this.isListening = true;
      this._dispatchStateChange();
    } catch (e) {
      console.error("Mic Start Fail:", e);
      this.isListening = false;
      this._dispatchStateChange();
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  _handleRecognitionResult(event) {
    const transcript = Array.from(event.results)
      .map((r) => r[0].transcript)
      .join("");
    const isFinal = event.results[0].isFinal;
    document.dispatchEvent(
      new CustomEvent("voice:input", { detail: { transcript, isFinal } }),
    );
  }

  _handleRecognitionError(event) {
    console.warn("Mic Error:", event.error);
  }

  _handleRecognitionEnd() {
    this.isListening = false;
    this._dispatchStateChange();
  }
}

export const voiceService = new VoiceService();
