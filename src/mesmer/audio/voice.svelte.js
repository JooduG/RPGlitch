/**
 * Native Voice Service (Svelte 5 Edition)
 *
 * A "Native-First" implementation of text-to-speech using Svelte 5 Runes.
 * Utilizes 'window.speechSynthesis' for privacy and reliability.
 */
export class VoiceStore {
  // State
  isSpeaking = $state(false);
  voices = $state([]);
  selectedVoice = $state(null);
  volume = $state(1.0);
  rate = $state(1.0);
  pitch = $state(1.0);

  // Private
  _synth = null;
  _utterance = null;

  constructor() {
    if (typeof window !== "undefined") {
      this._synth = window.speechSynthesis;
      this._loadVoices();

      // Handle async voice loading
      if (this._synth.onvoiceschanged !== undefined) {
        this._synth.onvoiceschanged = () => this._loadVoices();
      }
    }
  }

  _loadVoices() {
    if (!this._synth) return;

    // Get raw voices and filter/sort
    let rawVoices = this._synth.getVoices();

    this.voices = rawVoices
      .map((v) => ({
        name: v.name,
        uri: v.voiceURI,
        lang: v.lang,
        _ref: v,
      }))
      .sort((a, b) => {
        // Prioritize English then others, or alphabetical
        const aEn = a.lang.startsWith("en") ? -1 : 1;
        const bEn = b.lang.startsWith("en") ? -1 : 1;
        return aEn - bEn;
      });

    // Set default if none selected
    if (!this.selectedVoice && this.voices.length > 0) {
      // Try to find a good default (e.g. Google US English, or just first)
      const preferred =
        this.voices.find((v) => v.name.includes("Google US English")) ||
        this.voices[0];
      this.selectedVoice = preferred.uri;
    }
  }

  speak(text) {
    if (!this._synth || !text) return;

    // Cancel current
    this.stop();

    const voice =
      this.voices.find((v) => v.uri === this.selectedVoice) || this.voices[0];
    if (!voice) {
      console.warn("[Voice] No voice available.");
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

    this._utterance.onerror = (e) => {
      console.warn("[Voice] Synthesis error", e);
      this.isSpeaking = false;
      this._utterance = null;
    };

    this._synth.speak(this._utterance);
  }

  stop() {
    if (this._synth) {
      this._synth.cancel();
    }
    this.isSpeaking = false;
    this._utterance = null;
  }
}

export const voiceService = new VoiceStore();
