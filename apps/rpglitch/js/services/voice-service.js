import { log } from "../core/utils.js";

/**
 * Native Voice Service (Biometric Edition)
 * Pure native SpeechSynthesis with dynamic Rate/Pitch modulation.
 */
export class VoiceService {
  constructor() {
    this.voices = [];
    this.currentVoiceURI = null;
    this.baseRate = 1.0;
    this.basePitch = 1.0;
    this.synth = window.speechSynthesis;
    this.isReady = false;
  }

  async init() {
    if (this.isReady) return;

    // Load voices
    await this._loadVoices();

    // Listener for async loading
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this._loadVoices();
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

  /**
   * Speaks text with optional biometric modifiers.
   * @param {string} text
   * @param {string|null} voiceURI - Override voice
   * @param {object} modifiers - { rate: 1.0, pitch: 1.0 } (Multipliers)
   */
  speak(text, voiceURI = null, modifiers = {}) {
    if (!text) return;

    // 1. The Lobotomy
    const cleanText = text
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/\*/g, "")
      .trim();

    if (!cleanText) return;

    // 2. Stop previous
    this.stop();

    // 3. Resolve Voice
    const targetURI = voiceURI || this.currentVoiceURI;
    const voiceObj = this._findVoice(targetURI);

    if (!voiceObj) {
      console.warn(`[VoiceService] Voice missing: ${targetURI}`);
    }

    // 4. Calculate Biometrics
    const modRate = modifiers.rate || 1.0;
    const modPitch = modifiers.pitch || 1.0;

    let finalRate = this.baseRate * modRate;
    let finalPitch = this.basePitch * modPitch;

    // Clamp
    finalRate = Math.max(0.1, Math.min(10.0, finalRate));
    finalPitch = Math.max(0.1, Math.min(2.0, finalPitch)); // Browser limits usually 0-2

    console.log(
      `🗣️ Speaking [${voiceObj?.name || "Default"}] Rate: ${finalRate.toFixed(2)} Pitch: ${finalPitch.toFixed(2)}`,
    );

    // 5. Utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = voiceObj ? voiceObj._ref : null;
    utterance.rate = finalRate;
    utterance.pitch = finalPitch;
    utterance.volume = 1.0;

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
  }

  _findVoice(uri) {
    if (!uri) return this.voices[0];
    return this.voices.find((v) => v.uri === uri) || this.voices[0];
  }

  preview(uri, rate, pitch) {
    // Temp override for preview
    if (rate) this.setRate(rate);
    if (pitch) this.setPitch(pitch);

    this.speak("Audio check. Systems nominal.", uri);

    // Restore logic handled by UI state usually, but strictly `speak` uses instance state
    // so we should reset if this was just a preview?
    // Actually, `preview` usually implies testing current settings.
    // The UI should call setRate/setPitch before previewing.
    // Let's assume UI updates state first.

    // Revert if passed explicitly? No, let's keep it simple.
    // The UI calls setRate/setPitch on input, then calls preview().
  }
}

export const voiceService = new VoiceService();
