export class VoiceService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.voices = [];
    this.enabled = true;
    this.usePuter = false;
    this.puterAudio = null;
    this.currentVoiceId = "Rachel"; // Default Neural Voice

    // VOICE ROSTER (Neural -> Native Fallback Mappings)
    this.ROSTER = {
      Rachel: {
        id: "21m00Tcm4TlvDq8ikWAM",
        name: "Rachel (Female)",
        fallback: ["female", "woman", "zira", "google us english"],
      },
      Adam: {
        id: "pNInz6obpgDQGcFmaJgB",
        name: "Adam (Male)",
        fallback: ["male", "man", "david", "guy"],
      },
      Antoni: {
        id: "ErXwobaYiN019PkySvjV",
        name: "Antoni (Male)",
        fallback: ["male", "man", "david", "mark"],
      },
      Elli: {
        id: "MF3mGyEYCl7XYWlgE9yC",
        name: "Elli (Female)",
        fallback: ["female", "woman", "zira"],
      },
      Josh: {
        id: "TxGEqnHWrfWFTfGW9XjX",
        name: "Josh (Deep)",
        fallback: ["male", "man", "david"],
      },
    };

    if (this.synth) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
      this.voices = this.synth.getVoices();
    }
  }

  init() {
    if (window.rpgLists?.settings?.voiceEnabled !== undefined) {
      this.enabled = window.rpgLists.settings.voiceEnabled;
    }
    if (window.puter?.auth?.isSignedIn()) {
      this.usePuter = true;
      console.log("[VoiceService] Puter signed in.");
    }
  }

  getVoices() {
    return Object.keys(this.ROSTER).map((key) => ({
      id: key, // Use Key as ID for internal tracking
      name: this.ROSTER[key].name,
    }));
  }

  setVoice(voiceKey) {
    if (this.ROSTER[voiceKey]) {
      this.currentVoiceId = voiceKey;
      console.log(`[VoiceService] Voice set to: ${voiceKey}`);
    }
  }

  async connectPuter() {
    if (!window.puter) return false;
    try {
      await window.puter.auth.signIn();
      this.usePuter = true;
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  toggleListen(onPartial, onFinal) {
    if (this.isListening || this.callMode) {
      this.stop();
    } else {
      this.callMode = true;
      this.listen(onPartial, onFinal);
    }
    this._emitStateChange();
  }

  listen(onPartial, onFinal) {
    if (!("webkitSpeechRecognition" in window)) return;

    this._savedPartial = onPartial;
    this._savedFinal = onFinal;

    if (this.recognition)
      try {
        this.recognition.abort();
      } catch (e) {}

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
    };

    this.recognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }

      if (onPartial && interim) onPartial(interim);
      if (onFinal && final) {
        if (this.recognition)
          try {
            this.recognition.stop();
          } catch (e) {}
        onFinal(final);
      }
    };

    try {
      this.recognition.start();
    } catch (err) {}
  }

  async speak(text) {
    this._emitStateChange();
    if (!this.enabled) {
      if (this.callMode) this._restartLoop("Disabled");
      return;
    }

    // Reset Audio
    if (this.synth) this.synth.cancel();
    if (this.puterAudio) {
      this.puterAudio.pause();
      this.puterAudio = null;
    }
    if (this._watchdogTimer) clearTimeout(this._watchdogTimer);

    // Clean Text
    let cleanText = (text || "")
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<[^>]*>?/gm, "")
      .replace(/[\*_]{1,3}/g, "")
      .replace(/\(.*?\)/g, "")
      .trim();

    if (!cleanText) {
      if (this.callMode) this._restartLoop("Empty");
      return;
    }

    const voiceConfig =
      this.ROSTER[this.currentVoiceId] || this.ROSTER["Rachel"];

    // --- NEURAL TTS ---
    if (this.usePuter && window.puter) {
      try {
        console.log(`[VOICE] Neural: ${voiceConfig.name}`);
        const audio = await window.puter.ai.txt2speech(cleanText, {
          provider: "elevenlabs",
          voice: voiceConfig.id,
          model: "eleven_turbo_v2_5",
        });

        this.puterAudio = audio;
        audio.onended = () => {
          if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
          if (this.callMode) this._restartLoop("Done");
          this.puterAudio = null;
        };

        // Watchdog
        this._watchdogTimer = setTimeout(
          () => {
            if (this.puterAudio) this.puterAudio.pause();
            if (this.callMode) this._restartLoop("Watchdog");
          },
          cleanText.length * 100 + 5000,
        );

        audio.play();
        return;
      } catch (err) {
        console.error("Neural failed, falling back.", err);
      }
    }

    // --- NATIVE FALLBACK ---
    if (!this.synth) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Smart Fallback Selection
    if (this.voices.length === 0) this.voices = this.synth.getVoices();

    let chosenVoice = null;
    const keywords = voiceConfig.fallback || [];

    // 1. Try exact keyword match
    for (const word of keywords) {
      chosenVoice = this.voices.find((v) =>
        v.name.toLowerCase().includes(word.toLowerCase()),
      );
      if (chosenVoice) break;
    }

    // 2. Default to any English
    if (!chosenVoice)
      chosenVoice = this.voices.find((v) => v.lang.startsWith("en"));

    if (chosenVoice) utterance.voice = chosenVoice;

    utterance.onend = () => {
      if (this._watchdogTimer) clearTimeout(this._watchdogTimer);
      if (this.callMode) this._restartLoop("Done");
    };

    this._watchdogTimer = setTimeout(
      () => {
        this.synth.cancel();
        if (this.callMode) this._restartLoop("Watchdog");
      },
      cleanText.length * 100 + 2000,
    );

    this.synth.speak(utterance);
  }

  _restartLoop(reason) {
    if (!this.callMode || !this._savedFinal) return;
    setTimeout(() => this.listen(this._savedPartial, this._savedFinal), 200);
  }

  stop() {
    this.callMode = false;
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
    if (!btn) return;
    btn.style = ""; // Reset inline
    btn.classList.remove("listening", "call-active");

    if (this.isListening) {
      btn.classList.add("listening", "call-active");
    } else if (this.callMode) {
      btn.classList.add("call-active");
    }
  }
}

export const voiceService = new VoiceService();
