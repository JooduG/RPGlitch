import { TurnManager } from "../../../engine/director.js";
import { voiceService } from "../../../services/voice-service.js";

export const ChatInputController = {
  updateUIState: null, // Will be assigned during init
};

export function initChatInput() {
  const form = document.querySelector("#story-form");
  if (!form) return;

  const input = form.querySelector("textarea[name='message']");
  const btn = form.querySelector('button[type="submit"]');

  // Inject mic button if missing
  let micBtn = form.querySelector("#btn-mic");
  if (!micBtn) {
    const settingsBtn = form.querySelector("#btn-settings-placeholder");
    if (settingsBtn) {
      micBtn = document.createElement("button");
      micBtn.type = "button";
      micBtn.id = "btn-mic";
      micBtn.className = "btn-ghost btn-icon-raise";
      micBtn.style.cssText = "padding: 0 var(--space-sm-md);";
      micBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon" style="width: 1.25em; height: 1.25em;">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      `;
      micBtn.title = "Voice Input";
      settingsBtn.parentNode.insertBefore(micBtn, settingsBtn);
    }
  }

  if (!input || !btn) return;

  // --- STRICT STATE MANAGEMENT ---
  const state = {
    isThinking: false, // Orchestrator isGenerating
    isCallMode: false, // VoiceService.callMode
    isListening: false, // VoiceService.isListening
    isSpeaking: false, // VoiceService.isSpeaking
    hasText: false,
  };

  const updateUIState = () => {
    const _form = document.querySelector("#story-form");
    if (!_form) return;
    const _btn = _form.querySelector('button[type="submit"]');
    const _input = _form.querySelector('textarea[name="message"]');
    const _mic = _form.querySelector("#btn-mic");

    if (!_btn || !_input) return;

    state.hasText = _input.value.trim().length > 0;
    state.isCallMode = voiceService.callMode;
    state.isListening = voiceService.isListening;
    state.isSpeaking = voiceService.isSpeaking;

    let sendDisabled = false;
    let micDisabled = false;
    let inputDisabled = false;

    // RULE SET
    if (state.isCallMode) {
      // [CALL MODE]
      // ABSOLUTE LOCK: Input is ALWAYS disabled. User speaks, AI speaks. No typing.
      inputDisabled = true;
      sendDisabled = true;

      // Mic Button is a STATUS LIGHT only. Locked to prevent manual interference.
      micDisabled = true;
    } else {
      // [STANDARD MODE]

      if (state.isThinking || state.isSpeaking) {
        // AI BUSY -> LOCK ALL
        inputDisabled = true; // No queuing
        sendDisabled = true;
        micDisabled = true; // Wait your turn
      } else if (state.isListening) {
        // USER SPEAKING -> LOCK SEND, INPUT (Focus on voice)
        // Keep Mic Enabled so they can click to Stop if needed?
        // Logic: If I click mic to stop, I want to edit.
        inputDisabled = false; // Allow editing while speaking? No, usually replaces text.
        inputDisabled = true; // Lock while recording
        sendDisabled = true;
        micDisabled = false; // ENABLED to allow STOP toggle
      } else {
        // IDLE -> OPEN
        inputDisabled = false;
        // Send depends on text
        sendDisabled = !state.hasText;
        micDisabled = false;
      }
    }

    // APPLY
    _btn.disabled = sendDisabled;
    if (sendDisabled) _btn.classList.add("disabled");
    else _btn.classList.remove("disabled");

    _input.disabled = inputDisabled;
    _form.dataset.busy = (state.isThinking || state.isCallMode).toString();

    if (_mic) {
      _mic.disabled = micDisabled;

      // Cleanup Classes
      _mic.classList.remove(
        "disabled",
        "status-recording",
        "status-ai-active",
        "is-call-mode",
      );

      if (micDisabled) _mic.classList.add("disabled");
      if (state.isCallMode) _mic.classList.add("is-call-mode");

      // STATUS LIGHTS (Override disabled opacity)
      if (state.isListening) {
        _mic.classList.add("status-recording");
      } else if (state.isThinking || state.isSpeaking) {
        _mic.classList.add("status-ai-active");
      }
    }
  };

  ChatInputController.updateUIState = updateUIState;

  // --- LISTENERS ---

  if (micBtn) {
    micBtn.addEventListener("click", async () => {
      if (micBtn.disabled) return;

      await voiceService.init();

      if (state.isListening) {
        voiceService.stopListening();
      } else {
        voiceService.toggleListen(); // Events handle the rest
      }
    });
  }

  const adjustHeight = () => {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
  };

  input.addEventListener("input", () => {
    if (input.tagName === "TEXTAREA") adjustHeight();
    updateUIState();
  });

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (btn.disabled) return;
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn.disabled) return;

    const val = input.value.trim();
    if (val) {
      input.value = "";
      if (input.tagName === "TEXTAREA") adjustHeight();

      state.isThinking = true; // Optimistic update
      updateUIState();

      await TurnManager.send(val);
    }
  });

  // --- GLOBAL EVENTS ---
  document.addEventListener("generation_started", () => {
    state.isThinking = true;
    updateUIState();
  });

  document.addEventListener("generation_completed", () => {
    state.isThinking = false;
    updateUIState();
  });

  document.addEventListener("voice:state-change", () => {
    updateUIState();
  });

  // Handle Transcript Updates
  document.addEventListener("voice:input", (e) => {
    const { transcript, isFinal } = e.detail;

    // Update Text Area
    input.value = transcript;
    if (input.tagName === "TEXTAREA") adjustHeight();
    input.dispatchEvent(new Event("input"));

    // AUTO-SEND (Call Mode Only) on Final
    if (state.isCallMode && isFinal && transcript.trim().length > 0) {
      form.requestSubmit();
    }
  });

  updateUIState();
  window._chatInput = ChatInputController;
}
