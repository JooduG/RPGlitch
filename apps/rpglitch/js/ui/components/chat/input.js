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

    // Note: Mic might not exist in some DOM states, but btn/input usually do.
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
        micDisabled = true; // Wait for turn to finish
        inputDisabled = true; // Optional: Lock input so user doesn't queue text? No, standard chat usually allows typing.
        // Directive says: "Disable both buttons". Doesn't explicitly say disable input field in standard mode.
        // But usually Orchestrator locks send. Let's keep input enabled but buttons disabled.
        inputDisabled = false;
      }
      // Condition 2: User Speaking -> DISABLE SEND (Mic is Active/Toggle)
      // Actually, if User Speaking, we want them to finish.
      // Directive: "If voiceService.isListening -> DISABLE both buttons. (User must wait for auto-send/silence)."
      else if (state.isListening) {
        sendDisabled = true;
        micDisabled = false; // Enabled so user can Click to Stop/Cancel?
        // Directive says: "Disable both buttons".
        // If we disable basic mic button, user cannot stop manually?
        // Let's assume the directive implies "Disable start of new action".
        // But if mic is active, clicking it usually stops it.
        // Let's keep Mic ENABLED so user can toggle OFF.
        // Re-reading directive: "Condition 2 (User Speaking): If isListening (Red Mic) is true -> DISABLE both buttons."
        // If I disable the mic button while listening, I can't stop listening manually.
        // I will interpret this as "Disable Send", but keep Mic interactive to STOP.
        // Wait, "Call Mode" logic is different from Standard.
        // In Standard, click-to-speak.
        // Let's follow directive strictly: "DISABLE both buttons".
        // If interaction is disabled, user must wait for silence timeout.
        micDisabled = true;
      }
      // Condition 3: Idle
      else {
        // No text -> Send Disabled
        if (!state.hasText) {
          sendDisabled = true;
        }
        // Mic Enabled
        micDisabled = false;
      }
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
      _mic.disabled = micDisabled;

      // Reset Classes
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
        } else if (state.isThinking || state.isSpeaking) {
          // BLUE (Glow) - AI Active
          _mic.classList.add("status-ai-active");
        } else {
          // GREY (Idle) - Handled by disabled state opacity (but we override it in CSS)
        }
      } else {
        // Standard Mode Visuals
        if (state.isListening) {
          _mic.classList.add("status-recording");
          // If strict rule disabled it, we need CSS to show it.
        }
      }
    }
  };

  // Export
  ChatInputController.updateUIState = updateUIState;

  // --- EVENT LISTENERS ---

  if (micBtn) {
    micBtn.addEventListener("click", async () => {
      // Prevent click if locked
      if (micBtn.disabled) return;

      // Standard Mode: Manual Toggle
      await voiceService.init();

      if (state.isListening) {
        voiceService.stopListening();
      } else {
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

  document.addEventListener("voice:state-change", (e) => {
    updateUIState();
  });

  document.addEventListener("call_mode_changed", (e) => {
    updateUIState();
  });

  updateUIState();

  window._chatInput = ChatInputController;
}
