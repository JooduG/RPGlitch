import { TurnManager } from "../../../engine/director.js";
import { voiceService } from "../../../services/voice-service.js";
import { events, EVENTS } from "../../../core/events.js";

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
      // CALL MODE: Complete Lockout (Hands-free)
      inputDisabled = true;
      sendDisabled = true; // Auto-sends via script
      micDisabled = true; // Visual status only
    } else if (state.isThinking || state.isSpeaking) {
      // AI BUSY: Queueing Allowed, Actions Blocked
      inputDisabled = false; // User can type next message
      sendDisabled = true; // STRICT DISABLE
      micDisabled = true; // STRICT DISABLE
    } else if (state.isListening) {
      // USER SPEAKING: Focus on Voice
      inputDisabled = true; // STRICT DISABLE (User Request)
      sendDisabled = true; // Wait for finish
      micDisabled = false; // Allowed: Click to Stop
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
      if (state.isCallMode || micBtn.disabled) return;

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

    // [CRITICAL FIX] Allow submission if Call Mode is active, bypassing the disabled button check
    if (btn.disabled && !state.isCallMode) return;

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
  events.addEventListener(EVENTS.GENERATION_STARTED, () => {
    state.isThinking = true;
    updateUIState();
  });

  events.addEventListener(EVENTS.GENERATION_COMPLETED, () => {
    state.isThinking = false;
    updateUIState();
  });

  // Fallback (If strictly needed, though GENERATION_COMPLETED should cover it)
  // Director generally doesn't emit 'generation:ended', assuming typo in previous thought, relying on CONSTANTS
  // Checking CONSTANTS: GENERATION_COMPLETED is the key.

  document.addEventListener("voice:state-change", () => {
    // [UX] Clear Input on Call Mode Activation
    if (voiceService.callMode && !state.isCallMode) {
      input.value = "";
      state.baseText = "";
      if (input.tagName === "TEXTAREA") adjustHeight();
    }
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
      state.baseText = newText;
      // Slight delay to ensure DOM update, then Force Submit
      setTimeout(() => {
        form.requestSubmit();
      }, 50);
    } else if (isFinal) {
      state.baseText = newText;
    }
  });

  updateUIState();
  window._chatInput = ChatInputController;
}
