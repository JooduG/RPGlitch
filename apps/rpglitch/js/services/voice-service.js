// Imports removed (unused)

class VoiceService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.voices = [];
    this.enabled = true; // Default to true, or load from config

    // Initialize Voices (Handle async loading)
    if (this.synth) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
      // Attempt initial fetch
      this.voices = this.synth.getVoices();
    }
  }

  init() {
    if (window.rpgLists?.settings?.voiceEnabled !== undefined) {
      this.enabled = window.rpgLists.settings.voiceEnabled;
    }
    // Force logs to console.error for visibility during debug
    console.error(
      "[VoiceService] Initialized. Enabled:",
      this.enabled,
      "Speech supported:",
      !!this.synth,
    );
  }

  toggleListen(onPartial, onFinal) {
    if (this.isListening || this.callMode) {
      this.stop();
    } else {
      this.callMode = true; // Activate Loop
      this.listen(onPartial, onFinal);
    }
    this._emitStateChange();
  }

  listen(onPartial, onFinal) {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("[VoiceService] Speech Recognition not supported.");
      return;
    }

    // Save callbacks for re-activation in loop
    this._savedPartial = onPartial;
    this._savedFinal = onFinal;

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }

    this.recognition = new window.webkitSpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.recognition.onstart = () => {
      this.isListening = true;
      this._emitStateChange();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this._emitStateChange();
      // NOTE: We do NOT auto-restart here. We wait for Speak to finish or manual restart.
      // If we simply stopped listening without speaking (silence), we might want to re-listen?
      // For now, let's assume 'silence' -> 'send empty' -> 'no response' -> 'silence'.
      // Preventing infinite loops requires care.
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (onPartial && interimTranscript) onPartial(interimTranscript);
      if (onFinal && finalTranscript) {
        // Stop recognition (handled by continuous=false usually, but be safe)
        if (this.recognition)
          try {
            this.recognition.stop();
          } catch (e) {}
        onFinal(finalTranscript);
        // Do NOT stop callMode here. We wait for speak().
      }
    };

    this.recognition.onerror = (event) => {
      console.error(`[VOICE] Error: ${event.error}`);
      this.isListening = false;
      this._emitStateChange();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.error("[VOICE] Start failed:", err);
    }
  }

  speak(text) {
    console.error(
      `🗣️ [VOICE] Request to speak: "${(text || "").substring(0, 50)}..."`,
    );
    this._emitStateChange();

    // 1. Handle Disabled/No-Synth Case (Still maintain Loop if active)
    if (!this.enabled || !this.synth) {
      if (this.callMode) this._restartLoop("Service Disabled");
      return;
    }

    // 2. Cancel previous
    this.synth.cancel();
    if (this._watchdogTimer) clearTimeout(this._watchdogTimer);

    // 3. Clean Text
    const cleanText = (text || "")
      .replace(/<[^>]*>?/gm, "")
      .replace(/\(.*?\)/g, "")
      .trim();

    // 4. Handle Empty Text (Restart Loop Immediately)
    if (!cleanText) {
      console.error("🗣️ [VOICE] No audible text. Restarting loop.");
      if (this.callMode) this._restartLoop("Empty Text");
      return;
    }

    // 5. Build Utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.name.includes("Google US English") ||
        v.name.includes("Zira") ||
        (v.lang === "en-US" && v.name.includes("Natural")),
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    // 6. Events
    utterance.onend = () => {
      console.error("🗣️ [VOICE] Finished speaking.");
      if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
      if (this.callMode) this._restartLoop("TTS Finished");
    };

    utterance.onerror = (e) => {
      console.error("🗣️ [VOICE] Utterance Error:", e);
      if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
      if (this.callMode) this._restartLoop("TTS Error");
    };

    // 7. Watchdog (Force restart if TTS hangs)
    // Estimate duration: 100ms per character + 2000ms buffer
    const durationEst = cleanText.length * 100 + 2000;
    this._watchdogTimer = setTimeout(() => {
      console.error(
        "🗣️ [VOICE] Watchdog triggered (TTS hung). Forcing loop restart.",
      );
      this.synth.cancel(); // Kill stuck TTS
      if (this.callMode) this._restartLoop("Watchdog");
    }, durationEst);

    // 8. Speak
    this.synth.speak(utterance);
    // Note: State change emitted at start of function
  }

  _restartLoop(reason) {
    if (!this.callMode || !this._savedFinal) return;
    console.error(`🗣️ [VOICE] Restarting listener (${reason})...`);
    // Small delay to prevent mic echo
    setTimeout(() => this.listen(this._savedPartial, this._savedFinal), 200);
  }

  stop() {
    this.callMode = false; // Kill the loop
    if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
    if (this.synth) this.synth.cancel();
    if (this.recognition)
      try {
        this.recognition.stop();
      } catch (e) {}
    this.isListening = false;
    this._emitStateChange();
  }

  _emitStateChange() {
    const btn = document.querySelector("#btn-mic");
    if (btn) {
      // RESET INLINE STYLES that interfere with classes
      btn.style.color = "";
      btn.style.animation = "";
      btn.style.background = "";
      btn.style.boxShadow = "";
      btn.style.borderColor = "";

      // CLASS LOGIC
      if (this.isListening) {
        btn.classList.add("listening");
        btn.classList.add("call-active"); // It is technically active too
      } else if (this.callMode) {
        // Loop active, but AI is likely speaking or we are processing
        btn.classList.remove("listening");
        btn.classList.add("call-active");
      } else {
        btn.classList.remove("listening");
        btn.classList.remove("call-active");
      }
    }
  }
}

export const voiceService = new VoiceService();
