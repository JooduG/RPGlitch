/**
 * Native Voice Service
 *
 * A "Native-First" implementation of text-to-speech and speech-to-text.
 * Utilizes 'window.speechSynthesis' and 'window.webkitSpeechRecognition'.
 * Designed for privacy (zero-knowledge) and reliability (no cloud APIs).
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
    this._loopTimeout = null; // Prevent double-triggering logic
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
        langScore: this._getLangScore(v.lang),
        qualityScore: this._getQualityScore(v.name),
      }))
      .sort((a, b) => {
        // Primary Sort: Language Preference
        if (a.langScore !== b.langScore) return a.langScore - b.langScore;
        // Secondary Sort: Voice Quality
        return a.qualityScore - b.qualityScore;
      });
  }

  _getLangScore(lang) {
    if (!lang) return 9;
    const l = lang.toLowerCase();
    if (l.startsWith("en")) return 0; // English First
    if (l.startsWith("sv")) return 1; // Swedish Second
    return 9; // Others
  }

  _getQualityScore(name) {
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
    if (this.callMode) {
      if (!this.isSpeaking && !this.isListening) this.listen();
    } else {
      if (this.isListening) this.stopListening();
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

  preview(voiceURI, rate, pitch) {
    if (this.isSpeaking) {
      this.stop(); // Use new stop method
      return;
    }
    const text = "System online. Voice calibrated.";
    this.speak(text, voiceURI, { rate, pitch });
  }

  // [NEW] Explicit Stop Command
  stop() {
    this.synth.cancel();
    this.isSpeaking = false;
    this._currentUtterance = null;
    if (this._loopTimeout) clearTimeout(this._loopTimeout);
    this._dispatchStateChange();
  }

  speak(text, voiceURI = null, modifiers = {}, onEndCallback = null) {
    if (!text) return;

    // 1. Force Stop Listening (Closes mic, resets state)
    if (this.isListening) {
      this.stopListening();
    }

    // Stop any current speech
    this.synth.cancel();

    // Aggressive cleanup
    const cleanText = text
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\*/g, "")
      .trim();

    if (!cleanText) {
      if (onEndCallback) onEndCallback();
      return;
    }

    // ENSURE ENGINE IS AWAKE
    if (this.synth.paused) {
      this.synth.resume();
    }

    // Strategy:
    // 1. Try Full Text (Preferred Voice) -> Delivers best quality/continuity.
    // 2. If 'synthesis-failed' or 'error', Switch to CHUNKED method.
    // 3. If Chunked fails, Switch to System Voice.

    const attemptSpeak = (textToSpeak, mode = "FULL", retryCount = 0) => {
      // Delay slightly to let synth.cancel() flush
      setTimeout(() => {
        // Guard: If stop() was called during timeout, abort
        if (this.synth.speaking && mode !== "FULL") return;

        if (mode === "FULL") {
          this._speakFull(textToSpeak, voiceURI, modifiers, (success) => {
            if (success) {
              handleFinish();
            } else {
              console.warn("Full Text Failed. Switching to Chunking...");
              attemptSpeak(textToSpeak, "CHUNKED", 0);
            }
          });
        } else {
          // Chunked Mode (Robust)
          this._speakChunked(
            textToSpeak,
            voiceURI,
            modifiers,
            retryCount,
            () => {
              handleFinish();
            },
          );
        }
      }, 50);
    };

    const handleFinish = () => {
      // Check if we were manually stopped to avoid ghost triggers
      // if (!this.isSpeaking) return;

      this.isSpeaking = false;
      this._currentUtterance = null;
      this._dispatchStateChange();

      if (this._loopTimeout) clearTimeout(this._loopTimeout);
      if (onEndCallback) onEndCallback();

      // Loop Logic
      if (this.callMode) {
        this._loopTimeout = setTimeout(() => {
          if (!this.isSpeaking && !this.isListening && this.callMode) {
            this.listen();
          } else {
            // Force recovery if we are stuck
            if (this.callMode && !this.isListening) this.listen();
          }
        }, 300);
      }
    };

    try {
      this.isSpeaking = true;
      this._dispatchStateChange();
      attemptSpeak(cleanText, "FULL");
    } catch (e) {
      this.isSpeaking = false;
      this._dispatchStateChange();
      console.error("Speak start failed", e);
    }
  }

  // Helper: Get Fresh Voice Object (prevents Stale Reference Bug)
  _getFreshVoice(uri) {
    const freshList = this.synth.getVoices();

    // 1. Exact URI Match
    let match = freshList.find((v) => v.voiceURI === uri);

    // 2. Fuzzy Name Match (Case-insensitive)
    if (!match && uri) {
      match = freshList.find((v) =>
        v.name.toLowerCase().includes(uri.toLowerCase()),
      );
    }

    // 3. Fallbacks
    return match || freshList.find((v) => v.default) || freshList[0];
  }

  _speakFull(text, voiceURI, modifiers, doneCallback) {
    const utterance = new SpeechSynthesisUtterance(text);
    this._currentUtterance = utterance; // GC Fix

    const targetURI = voiceURI || this.currentVoiceURI;

    // DYNAMIC FETCH: Do not use cached objects
    const voiceObj = this._getFreshVoice(targetURI);
    if (voiceObj) utterance.voice = voiceObj;

    const modRate = modifiers.rate || 1.0;
    utterance.rate = Math.max(0.5, Math.min(2.0, this.baseRate * modRate));
    utterance.pitch = this.basePitch;

    let hasError = false;

    utterance.onend = () => {
      if (!hasError) doneCallback(true);
    };

    utterance.onerror = (e) => {
      if (e.error === "interrupted") {
        // Normal interruption (stop button)
        return;
      }

      console.warn("Full Speak Error:", e);

      // We still fall back for *this* attempt (via doneCallback(false)),
      // but we do not permanently blacklist the voice for the session.

      hasError = true;
      doneCallback(false);
    };

    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.error("Synth Exception:", e);
      doneCallback(false);
    }
  }

  _speakChunked(text, voiceURI, modifiers, startRetryLevel, doneCallback) {
    const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    let chunkIndex = 0;
    // STICKY FALLBACK: If we fallback, we stay fallen back for this specific utterance loop
    let currentStickyLevel = startRetryLevel;

    const speakNext = (retryLevel) => {
      // Guard against manual stop
      if (!this.isSpeaking) return;

      if (chunkIndex >= chunks.length) {
        doneCallback();
        return;
      }

      const chunkText = chunks[chunkIndex].trim();
      if (!chunkText) {
        chunkIndex++;
        speakNext(retryLevel);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunkText);
      this._currentUtterance = utterance;

      // UPDATE STICKY LEVEL if retry is higher
      if (retryLevel > currentStickyLevel) {
        currentStickyLevel = retryLevel;
      }

      // Level 0: Preferred, Level 1: System
      if (currentStickyLevel === 0) {
        const targetURI = voiceURI || this.currentVoiceURI;
        // The _getFreshVoice helper will handle blacklisted voices automatically
        const voiceObj = this._getFreshVoice(targetURI);

        if (voiceObj) utterance.voice = voiceObj;
        // Reset rates for stability in chunked mode
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
      } else {
        // System Fallback
        utterance.voice = null;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
      }

      utterance.onend = () => {
        chunkIndex++;
        // Maintain the current sticky level for the next chunk
        speakNext(currentStickyLevel);
      };

      utterance.onerror = (e) => {
        if (e.error === "interrupted") return;
        console.warn(
          `Chunk ${chunkIndex} failed (Level ${currentStickyLevel}):`,
          e.error,
        );

        // We log the error but do not add to blacklist.
        if (e.error === "synthesis-failed" && utterance.voice) {
          console.warn(
            `Voice failed (Chunk): ${utterance.voice.voiceURI}. Retrying chunk with fallback...`,
          );
        }

        if (currentStickyLevel < 1) {
          // Bump level and retry SAME chunk
          speakNext(currentStickyLevel + 1);
        } else {
          console.warn(`Chunk ${chunkIndex} failed all retries. Skipping.`);
          chunkIndex++;
          speakNext(currentStickyLevel); // Keep sticky level, skip chunk
        }
      };

      try {
        this.synth.speak(utterance);
      } catch (e) {
        if (currentStickyLevel < 1) speakNext(currentStickyLevel + 1);
        else {
          chunkIndex++;
          speakNext(currentStickyLevel);
        }
      }
    };

    speakNext(currentStickyLevel);
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
