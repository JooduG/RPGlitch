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
      micBtn.className = "btn-ghost";
      // Style EXACTLY like the settings placeholder for alignment
      micBtn.style.cssText =
        "padding: 0 var(--space-sm-md); width: auto; flex: 0 0 auto; min-height: 2.25rem; height: auto; display: flex; align-items: center; justify-content: center; margin-bottom: 0;";
      micBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon" style="width: 1.25em; height: 1.25em;">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      `;
      micBtn.title = "Call Mode";
      // Insert before settings button for visual balance
      settingsBtn.parentNode.insertBefore(micBtn, settingsBtn);
    }
  }

  if (!input || !btn) return;

  if (micBtn) {
    micBtn.addEventListener("click", async () => {
      const { voiceService } =
        await import("../../../services/voice-service.js");

      // Init only if needed (check if internal state flag exists, or just rely on init being idempotent -
      // but in this case init() logs error every time, so let's check a flag)
      if (!voiceService._initialized) {
        voiceService.init();
        voiceService._initialized = true;
      }

      voiceService.toggleListen(
        // onPartial
        (text) => {
          input.value = text;
          if (input.tagName === "TEXTAREA") {
            input.style.height = "auto";
            input.style.height = input.scrollHeight + "px";
          }
          input.dispatchEvent(new Event("input"));
        },
        // onFinal (Call Mode Loop)
        async (text) => {
          input.value = text;
          input.dispatchEvent(new Event("input"));

          if (text && text.trim().length > 0) {
            btn.disabled = true;

            // CLEAR INSTANTLY
            input.value = "";
            if (input.tagName === "TEXTAREA") input.style.height = "auto";
            input.dispatchEvent(new Event("input"));

            await TurnManager.send(text);
          }
        },
      );
    });
  }

  // Auto-resize function for textarea
  const adjustHeight = () => {
    input.style.height = "auto"; // Reset to shrink if needed
    input.style.height = input.scrollHeight + "px";
  };

  if (input.tagName === "TEXTAREA") {
    adjustHeight();
  }

  input.addEventListener("input", () => {
    if (input.tagName === "TEXTAREA") {
      adjustHeight();
    }
    if (btn.dataset.locked === "true") return;

    btn.disabled = input.value.trim().length === 0;
  });

  // Handle Enter key (Submit) vs Shift+Enter (Newline)
  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!input.value.trim()) return;
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (val) {
      input.value = "";
      if (input.tagName === "TEXTAREA") {
        adjustHeight();
      }
      btn.disabled = true;
      await TurnManager.send(val);
    }
  });
}
