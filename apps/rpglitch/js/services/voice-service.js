import { log, error } from "../core/utils.js";

/**
 * Native Voice Service
 * Relies 100% on browser SpeechSynthesis.
 * Prioritizes "Natural" voices (Edge/Azure) > Google > Microsoft.
 */
export class VoiceService {
  constructor() {
    this.voices = [];
    this.currentVoiceURI = null;
    this.synth = window.speechSynthesis;
    this.isReady = false;
  }

  async init() {
    if (this.isReady) return;

    // Load voices
    await this._loadVoices();

    // Listener for async loading (Chrome/Edge quirks)
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this._loadVoices();
    }

    this.isReady = true;
    log("[VoiceService] Native Service Initialized.");
  }

  _loadVoices() {
    return new Promise((resolve) => {
      let rawVoices = this.synth.getVoices();

      // Retry if empty (common browser race condition)
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

  /**
   * Curates and sorts voices by quality tier.
   * Tier 1: "Natural" (Edge/Azure)
   * Tier 2: "Google" (Chrome)
   * Tier 3: "Microsoft" (Windows Standard)
   */
  _processVoices(rawList) {
    this.voices = rawList
      .filter((v) => v.name.match(/Natural|Google|Microsoft/i)) // Filter for known decent providers
      .map((v) => ({
        name: v.name,
        uri: v.voiceURI,
        lang: v.lang,
        _ref: v, // Keep reference to native object
        tier: this._getTier(v.name),
      }))
      .sort((a, b) => a.tier - b.tier); // Sort by quality (Lower is better)

    log(`[VoiceService] Loaded ${this.voices.length} voices.`);
  }

  _getTier(name) {
    if (name.includes("Natural")) return 1;
    if (name.includes("Google")) return 2;
    if (name.includes("Microsoft")) return 3;
    return 9;
  }

  getVoices() {
    return this.voices;
  }

  /**
   * Speaks the text using the native engine.
   * @param {string} text - The text to speak.
   * @param {string} [voiceURI] - Optional override. Uses currentVoiceURI if null.
   */
  speak(text, voiceURI = null) {
    if (!text) return;

    // 1. The Lobotomy (Clean internal monologues)
    const cleanText = text
      .replace(/<think>[\s\S]*?<\/think>/gi, "") // Remove thought blocks
      .replace(/\*/g, "") // Remove asterisks
      .trim();

    if (!cleanText) return;

    // 2. Cancel current speech
    this.stop();

    // 3. Select Voice
    const targetURI = voiceURI || this.currentVoiceURI;
    const voiceObj = this._findVoice(targetURI);

    if (!voiceObj) {
      console.warn(
        `[VoiceService] Voice not found: ${targetURI}. Using default.`,
      );
    }

    // 4. Create Utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = voiceObj ? voiceObj._ref : null; // Native object
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 5. Speak
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
  }

  _findVoice(uri) {
    if (!uri) return this.voices[0]; // Default to best available
    return this.voices.find((v) => v.uri === uri) || this.voices[0];
  }

  preview(uri) {
    this.speak("Systems nominal. Voice synthesis operational.", uri);
  }
}

export const voiceService = new VoiceService();
