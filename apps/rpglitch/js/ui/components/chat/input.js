import { TurnManager } from "../../../engine/director.js";

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

  // --- STATE MANAGEMENT ---
  const state = {
    isThinking: false,
    isCallMode: false,
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

    // 2. Logic Definitions
    // Send Button: Disabled if No Text OR Thinking OR Call Mode
    const sendDisabled = !state.hasText || state.isThinking || state.isCallMode;

    // Mic Button: User requested "Enabled same time as send key" roughly.
    // Usually Mic is allowed during "Idle".
    // If Thinking -> Disabled.
    const micDisabled = state.isThinking;

    // Input Field: Disabled ONLY if Call Mode
    const inputDisabled = state.isCallMode;

    // 3. Apply
    _btn.disabled = sendDisabled;
    if (sendDisabled) _btn.classList.add("disabled");
    else _btn.classList.remove("disabled");

    if (_mic) {
      _mic.disabled = micDisabled;
      if (micDisabled)
        _mic.classList.add("disabled"); // Visual Cue
      else _mic.classList.remove("disabled");
    }

    _input.disabled = inputDisabled;
    _form.dataset.busy =
      state.isThinking || state.isCallMode ? "true" : "false";
  };

  if (micBtn) {
    micBtn.addEventListener("click", async () => {
      // Prevent click if effectively disabled by logic
      if (state.isThinking) return;

      const { voiceService } =
        await import("../../../services/voice-service.js");
      await voiceService.init();

      // TOGGLE OFF
      if (voiceService.callMode) {
        voiceService.setCallMode(false);
        voiceService.stopListening();
        micBtn.classList.remove("active", "call-mode-active", "is-call-mode");
        // Update State
        state.isCallMode = false;
        updateUIState();
        return;
      }

      // TOGGLE ON (Manual Listen)
      // [FIX] CAPTURE EXISTING TEXT FOR APPEND MODE
      const prefix = input.value;

      const isListening = await voiceService.toggleListen(
        (text) => {
          // Append with space if needed
          const spacer = prefix && prefix.trim().length > 0 ? " " : "";
          input.value = prefix + spacer + text;
          input.dispatchEvent(new Event("input"));
        },
        (text) => {
          const spacer = prefix && prefix.trim().length > 0 ? " " : "";
          input.value = prefix + spacer + text;
          input.dispatchEvent(new Event("input"));

          // Auto-send if loop logic (Manual click usually doesn't auto-send unless configured)
          if (voiceService.callMode && text.trim().length > 0) {
            // Loop logic handles this usually?
          }
        },
        () => {
          micBtn.classList.remove("active");
          updateUIState();
        },
      );

      if (isListening) micBtn.classList.add("active");
      else micBtn.classList.remove("active");
    });
  }

  // Auto-resize function for textarea
  const adjustHeight = () => {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
  };

  if (input.tagName === "TEXTAREA") {
    adjustHeight();
  }

  // Text Input
  input.addEventListener("input", () => {
    if (input.tagName === "TEXTAREA") adjustHeight();
    updateUIState();
  });

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Logic handled by updateUIState -> disabled check
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

      // User sent message -> Thinking Starts
      state.isThinking = true;
      updateUIState();

      await TurnManager.send(val);
    }
  });

  // Global Event Bindings
  document.addEventListener("generation_started", () => {
    state.isThinking = true;
    updateUIState();
  });

  document.addEventListener("generation_completed", () => {
    state.isThinking = false;
    updateUIState();
  });

  document.addEventListener("call_mode_changed", async () => {
    const { voiceService } = await import("../../../services/voice-service.js");
    state.isCallMode = !!voiceService?.callMode;
    updateUIState();

    // Sync Mic Button Class
    if (micBtn) {
      if (state.isCallMode) micBtn.classList.add("is-call-mode");
      else micBtn.classList.remove("is-call-mode");
    }
  });

  // Init Check
  updateUIState();
}
