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
      if (this._synth && this._synth.onvoiceschanged !== undefined) {
        this._synth.onvoiceschanged = () => this._loadVoices();
      }
    }
  }
  _loadVoices() {
    if (!this._synth) return;
    // Get raw voices and filter/sort
    let rawVoices = this._synth.getVoices();
    this.voices = rawVoices
      .filter((v) => v.lang.startsWith("en") || v.lang.startsWith("sv"))
      .map((v) => ({
        name: v.name,
        uri: v.voiceURI,
        lang: v.lang,
        localService: v.localService,
        default: v.default,
        region: this._getRegionLabel(v.lang),
        supportsParams: !v.name.includes("Natural"), // Heuristic: Natural voices ignore params
        _ref: v,
      }))
      .sort((a, b) => {
        // 1st by region (alphabetical)
        const regionSort = a.region.localeCompare(b.region);
        if (regionSort !== 0) return regionSort;
        // 2nd by name (alphabetical)
        return a.name.localeCompare(b.name);
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
  _getRegionLabel(lang) {
    try {
      const displayNames = new Intl.DisplayNames(["en"], {
        type: "region",
      });
      const regionCode = lang.split("-")[1];
      return regionCode ? displayNames.of(regionCode) : "Global";
    } catch {
      return "Global";
    }
  }
  speak(text) {
    if (!this._synth || !text) return;
    // Cancel current
    this.stop();
    const voice =
      this.voices.find((v) => v.uri === this.selectedVoice) || this.voices[0];
    if (!voice) {
      console.warn("[Polish] No voice available.");
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
      console.warn("[Polish] Synthesis error", e);
      this.isSpeaking = false;
      this._utterance = null;
    };
    this._synth.speak(this._utterance);
  }
  preview(uri, rate = 1.0, pitch = 1.0) {
    if (!this._synth) return;
    this.stop();
    const voice = this.voices.find((v) => v.uri === uri) || this.voices[0];
    if (!voice) return;
    this.isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance("Previewing voice system.");
    utterance.voice = voice._ref;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onend = () => (this.isSpeaking = false);
    utterance.onerror = () => (this.isSpeaking = false);
    this._synth.speak(utterance);
  }
  stop() {
    if (this._synth) {
      this._synth.cancel();
    }
    this.isSpeaking = false;
    this._utterance = null;
  }
}
export const textToSpeech = new VoiceStore();
