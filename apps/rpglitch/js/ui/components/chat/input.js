import { TurnManager } from "../../../engine/director.js";
import { voiceService } from "../../../services/voice-service.js";

export const ChatInputController = {
  updateUIState: null,
};

export function initChatInput() {
  const form = document.querySelector("#story-form");
  if (!form) return;

  const input = form.querySelector("textarea[name='message']");
  const btn = form.querySelector('button[type="submit"]');

  // Inject mic button if missing (Fixed SVG)
  let micBtn = form.querySelector("#btn-mic");
  if (!micBtn) {
    const settingsBtn = form.querySelector("#btn-settings-placeholder");
    if (settingsBtn) {
      micBtn = document.createElement("button");
      micBtn.type = "button";
      micBtn.id = "btn-mic";
      micBtn.className = "btn-ghost btn-icon-raise";
      micBtn.style.cssText = "padding: 0 var(--space-sm-md);";
      // Clean, standard Material Mic Icon
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
    isThinking: false,
    isCallMode: false,
    isListening: false,
    isSpeaking: false,
    hasText: false,
    baseText: "",
  };

  const updateUIState = () => {
    const _form = document.querySelector("#story-form");
    if (!_form) return;
    const _btn = _form.querySelector('button[type="submit"]');
    const _input = _form.querySelector('textarea[name="message"]');
    const _mic = _form.querySelector("#btn-mic");

    if (!_btn || !_input) return;

    // Sync State
    state.hasText = _input.value.trim().length > 0;
    state.isCallMode = voiceService.callMode;
    state.isListening = voiceService.isListening;
    state.isSpeaking = voiceService.isSpeaking;

    // Capture base text when listening starts
    if (voiceService.isListening && !state.isListening) {
      state.baseText = _input.value;
    }

    let sendDisabled = false;
    let micDisabled = false;
    let inputDisabled = false;

    // --- LOGIC MATRIX ---
    if (state.isCallMode) {
      // CALL MODE: Hands-free lock
      inputDisabled = true;
      sendDisabled = true; // Auto-sends
      micDisabled = true; // Status light only
    } else if (state.isThinking || state.isSpeaking) {
      // AI BUSY: Queueing allowed, Action blocked
      inputDisabled = false; // ALLOWED: User can type "next" thought
      sendDisabled = true; // BLOCKED: Wait for turn
      micDisabled = true; // BLOCKED: Wait for turn
    } else if (state.isListening) {
      // USER SPEAKING: Live Transcript
      inputDisabled = false; // ALLOWED: See transcript update
      sendDisabled = true; // BLOCKED: Wait for finish
      micDisabled = false; // ALLOWED: Click to Stop
    } else {
      // IDLE
      inputDisabled = false;
      sendDisabled = !state.hasText;
      micDisabled = false;
    }

    // Apply
    _btn.disabled = sendDisabled;
    _btn.classList.toggle("disabled", sendDisabled);
    _input.disabled = inputDisabled;
    _form.dataset.busy = (state.isThinking || state.isCallMode).toString();

    if (_mic) {
      _mic.disabled = micDisabled;
      _mic.classList.remove(
        "status-recording",
        "status-ai-active",
        "is-call-mode",
      );

      if (state.isCallMode) _mic.classList.add("is-call-mode");

      // Status Visuals
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
    micBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      // Manual Toggle (Standard Mode Only)
      if (state.isCallMode) return;

      await voiceService.init();

      if (state.isListening) {
        voiceService.stopListening();
      } else {
        voiceService.toggleListen();
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
      state.baseText = ""; // Reset voice buffer
      if (input.tagName === "TEXTAREA") adjustHeight();

      state.isThinking = true;
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

  document.addEventListener("voice:input", (e) => {
    const { transcript, isFinal } = e.detail;

    // Append Logic
    const separator = state.baseText && state.baseText.length > 0 ? " " : "";
    const newText = state.baseText + separator + transcript;

    input.value = newText;
    if (input.tagName === "TEXTAREA") adjustHeight();

    // CALL MODE AUTO-SEND
    if (state.isCallMode && isFinal && transcript.trim().length > 0) {
      // Tiny delay to ensure UI updates before send
      setTimeout(() => form.requestSubmit(), 50);
      state.baseText = newText; // Sync for safety
    } else if (isFinal) {
      state.baseText = newText;
    }
  });

  updateUIState();
  window._chatInput = ChatInputController;
}
