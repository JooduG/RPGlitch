export class VoiceService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.voices = [];
    this.enabled = true; // Default to true, or load from config
    this.usePuter = false; // Flag for Puter.js usage
    this.puterAudio = null; // Track current Puter audio

    // Initialize Native Voices (Handle async loading)
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
    // Check if Puter is already signed in (optional check, but good for UX)
    if (window.puter && window.puter.auth && window.puter.auth.isSignedIn()) {
      this.usePuter = true;
      console.log(
        "[VoiceService] Puter.js detected and signed in. Neural voices enabled.",
      );
    }

    console.error(
      "[VoiceService] Initialized. Enabled:",
      this.enabled,
      "Speech supported:",
      !!this.synth,
      "Puter:",
      this.usePuter,
    );
  }

  async connectPuter() {
    if (!window.puter) {
      console.error("[VoiceService] Puter.js not loaded.");
      return false;
    }
    try {
      console.log("[VoiceService] Attempting Puter Sign In...");
      await window.puter.auth.signIn();
      this.usePuter = true;
      console.log("[VoiceService] Puter Sign In Successful.");
      return true;
    } catch (err) {
      console.error("[VoiceService] Puter Sign In Failed:", err);
      return false;
    }
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

  async speak(text) {
    console.error(
      `🗣️ [VOICE] Request to speak raw length: ${text ? text.length : 0}`,
    );
    this._emitStateChange();

    // 1. Handle Disabled/No-Synth Case
    if (!this.enabled) {
      if (this.callMode) this._restartLoop("Service Disabled");
      return;
    }

    // 2. Cancel previous
    if (this.synth) this.synth.cancel();
    if (this.puterAudio) {
      this.puterAudio.pause();
      this.puterAudio = null;
    }
    if (this._watchdogTimer) clearTimeout(this._watchdogTimer);

    // 3. Clean Text
    let cleanText = text || "";
    // A. Remove <think> blocks entirely (including content)
    cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, "");
    // B. Remove other HTML tags but keep their content
    cleanText = cleanText.replace(/<[^>]*>?/gm, "");
    // C. Remove Markdown (Asterisks, Underscores for bold/italic)
    cleanText = cleanText.replace(/[\*_]{1,3}/g, "");
    // D. Remove parentheticals (OOC content)
    cleanText = cleanText.replace(/\(.*?\)/g, "");
    // E. Final Trim
    cleanText = cleanText.trim();

    // 4. Handle Empty Text (Restart Loop Immediately)
    if (!cleanText) {
      console.error(
        "🗣️ [VOICE] No audible text after cleaning. Restarting loop.",
      );
      if (this.callMode) this._restartLoop("Empty Text");
      return;
    }

    // --- PUTER.JS (High Quality) ---
    if (this.usePuter && window.puter) {
      try {
        console.log(
          "🗣️ [VOICE] Attempting Neural TTS (ElevenLabs via Puter)...",
        );
        const audio = await window.puter.ai.txt2speech(cleanText, {
          provider: "elevenlabs",
          voice: "21m00Tcm4TlvDq8ikWAM", // Rachel
          model: "eleven_turbo_v2_5",
        });

        this.puterAudio = audio;

        // Events for consistent loop handling
        audio.onended = () => {
          console.error("🗣️ [VOICE] Neural TTS Finished.");
          if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
          if (this.callMode) this._restartLoop("Neural TTS Finished");
          this.puterAudio = null;
        };

        audio.onerror = (e) => {
          console.error("🗣️ [VOICE] Neural TTS Error:", e);
          // Fallback will happen? No, we are in async flow. Just force restart loop or fallback logic?
          // If it errors here, we might want to try Native.
          // But for now let's just log and restart loop.
          if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
          if (this.callMode) this._restartLoop("Neural TTS Error");
        };

        // Watchdog for Neural
        const durationEst = cleanText.length * 100 + 5000; // Little more buffer for network
        this._watchdogTimer = setTimeout(() => {
          console.error("🗣️ [VOICE] Neural Watchdog triggered.");
          if (this.puterAudio) this.puterAudio.pause();
          if (this.callMode) this._restartLoop("Neural Watchdog");
        }, durationEst);

        audio.play();
        return; // EXIT FUNCTION, DO NOT RUN NATIVE
      } catch (err) {
        console.error(
          "🗣️ [VOICE] Puter TTS Failed (401? Network?). Falling back to Native.",
          err,
        );
        // Fall through to Native
      }
    }

    // --- NATIVE SPEECH SYNTHESIS (Fallback) ---
    if (!this.synth) return;

    // 5. Build Utterance
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Ensure voices are loaded
    if (this.voices.length === 0) {
      this.voices = this.synth.getVoices();
    }

    // Improved Voice Selection Strategy (Deterministic - Male Preference)
    const preferredVoice =
      this.voices.find((v) => v.name.includes("Microsoft Guy")) ||
      this.voices.find((v) => v.name.includes("Microsoft David")) ||
      this.voices.find((v) => v.name.includes("Microsoft Mark")) ||
      this.voices.find(
        (v) => v.name.toLowerCase().includes("male") && v.lang.startsWith("en"),
      ) ||
      this.voices.find((v) => v.lang === "en-US");

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // 6. Events
    utterance.onend = () => {
      console.error("🗣️ [VOICE] Native TTS Finished.");
      if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
      if (this.callMode) this._restartLoop("TTS Finished");
    };

    utterance.onerror = (e) => {
      console.error("🗣️ [VOICE] Utterance Error:", e);
      if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
      if (this.callMode) this._restartLoop("TTS Error");
    };

    // 7. Watchdog (Force restart if TTS hangs)
    const durationEst = cleanText.length * 100 + 2000;
    this._watchdogTimer = setTimeout(() => {
      console.error("🗣️ [VOICE] Watchdog triggered. Forcing loop restart.");
      this.synth.cancel();
      if (this.callMode) this._restartLoop("Watchdog");
    }, durationEst);

    // 8. Speak
    this.synth.speak(utterance);
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
    if (this.puterAudio) {
      this.puterAudio.pause();
      this.puterAudio = null;
    }
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
