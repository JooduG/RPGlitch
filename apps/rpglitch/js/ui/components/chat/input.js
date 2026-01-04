import { TurnManager } from "../../../engine/director.js";
import { voiceService } from "../../../services/voice-service.js"; // Direct import for state checking

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
      // Insert before settings button for visual balance
      settingsBtn.parentNode.insertBefore(micBtn, settingsBtn);
    }
  }

  if (!input || !btn) return;

  // --- STRICT STATE MANAGEMENT ---
  const state = {
    isThinking: false, // Orchestrator isGenerating
    isCallMode: false, // VoiceService.callMode
    isListening: false, // VoiceService.isListening
    isSpeaking: false, // AudioService/VoiceService isPlaying (for status light)
    hasText: false,
  };

  const updateUIState = () => {
    // 1. Re-query Elements (Safety)
    const _form = document.querySelector("#story-form");
    if (!_form) return;
    const _btn = _form.querySelector('button[type="submit"]');
    const _input = _form.querySelector('textarea[name="message"]');
    const _mic = _form.querySelector("#btn-mic");

    if (!_btn || !_input) return;

    state.hasText = _input.value.trim().length > 0;

    // Sync with global voice service state for accuracy
    state.isCallMode = voiceService.callMode;
    state.isListening = voiceService.isListening;
    state.isSpeaking = voiceService.isSpeaking;

    // --- LOGIC RULES ---

    let sendDisabled = false;
    let micDisabled = false;
    let inputDisabled = false;

    // RULE A: Standard Mode (!callMode)
    if (!state.isCallMode) {
      // Condition 1: AI Busy -> DISABLE ALL
      if (state.isThinking) {
        sendDisabled = true;
        micDisabled = true;
      }
      // Condition 2: User Speaking -> DISABLE ALL (Wait for finish)
      else if (state.isListening) {
        sendDisabled = true;
        micDisabled = true;
      }
      // Condition 3: No Text -> Send Disabled (Mic usually enabled)
      else if (!state.hasText) {
        sendDisabled = true;
      }

      // Input enabled usually
      inputDisabled = false;
    }
    // RULE B: Call Mode (callMode)
    else {
      // Global Lock: Input and Send are ALWAYS DISABLED
      inputDisabled = true;
      sendDisabled = true;

      // Mic Button is DISABLED for interaction (acts as status light)
      micDisabled = true;
    }

    // --- APPLY STATE ---

    // 1. Send Button
    _btn.disabled = sendDisabled;
    if (sendDisabled) _btn.classList.add("disabled");
    else _btn.classList.remove("disabled");

    // 2. Input Field
    _input.disabled = inputDisabled;
    _form.dataset.busy = (state.isThinking || state.isCallMode).toString();

    // 3. Mic Button & Status Lights
    if (_mic) {
      // Interaction State
      _mic.disabled = micDisabled;
      // Note: For Status Lights to be visible on disabled buttons, CSS must override opacity.

      // Visual State Reset
      _mic.classList.remove(
        "disabled",
        "status-recording",
        "status-ai-active",
        "is-call-mode",
      );

      if (micDisabled) _mic.classList.add("disabled");

      if (state.isCallMode) {
        _mic.classList.add("is-call-mode");

        // STATUS LIGHTS
        if (state.isListening) {
          // RED (Pulse) - User Speaking
          _mic.classList.add("status-recording");
          _mic.classList.remove("disabled"); // Ensure visible
        } else if (state.isThinking || state.isSpeaking) {
          // BLUE (Glow) - AI Active
          _mic.classList.add("status-ai-active");
          _mic.classList.remove("disabled"); // Ensure visible
        } else {
          // GREY (Idle) - Handled by default disabled state or custom class
        }
      } else {
        // Standard Mode Visuals
        if (state.isListening) {
          _mic.classList.add("status-recording");
        }
      }
    }
  };

  // Export for external calls if needed
  ChatInputController.updateUIState = updateUIState;

  // --- EVENT LISTENERS ---

  if (micBtn) {
    micBtn.addEventListener("click", async () => {
      // Prevent click if locked (Call Mode locks interaction)
      if (state.isCallMode || state.isThinking) return;

      // Standard Mode: Manual Toggle
      await voiceService.init();

      if (state.isListening) {
        voiceService.stopListening();
      } else {
        // Manual Listen
        voiceService.toggleListen(
          (text) => {
            // Append
            const old = input.value;
            const spacer = old && old.trim().length > 0 ? " " : "";
            input.value = old + spacer + text;
            input.dispatchEvent(new Event("input"));
          },
          (finalText) => {
            // Final
            const old = input.value;
            const spacer = old && old.trim().length > 0 ? " " : "";
            input.value = old + spacer + finalText;
            input.dispatchEvent(new Event("input"));
            updateUIState();
          },
          () => {
            updateUIState();
          },
        );
        updateUIState();
      }
    });
  }

  const adjustHeight = () => {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
  };

  if (input.tagName === "TEXTAREA") {
    adjustHeight();
  }

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

  document.addEventListener("call_mode_changed", (e) => {
    // Event detail might have mode, but updateUIState checks service directly too
    updateUIState();
  });

  // Polling / Periodic Check for Voice Status (optional but good for syncing specific flags)
  // Or rely on voiceService dispatching events (which we should add if missing)
  // For now, let's assume updateUIState is called often enough or we add a listener for voice state?
  // We added `call_mode_changed`. We might need `voice_state_changed`?
  // For now, the prompt implies relying on specific triggers.

  updateUIState();

  // Expose to window for debugging or strict orchestrator calls
  window._chatInput = ChatInputController;
}
