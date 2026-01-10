/**
 * apps/rpglitch/js/ui-handlers.js
 * Centralized UI event handlers.
 * NOW FEATURING: The Reflex Brain (Zero Latency Input Scanning)
 */
import { GameMaster } from "../../gamemaster/index.js";
import { log } from "../../gamemaster/utils.js";
import { Warden } from "../../warden/index.js";

// Prevent duplicate listeners during hot-reload
if (window.__RPGLITCH_UI_HANDLERS_INIT) {
  // console.warn("[UI Handlers] Re-init prevented. Listeners already active.");
}

export function initUIHandlers() {
  if (window.__RPGLITCH_UI_HANDLERS_INIT) return;
  window.__RPGLITCH_UI_HANDLERS_INIT = true;

  log("[UI] Initializing Handlers (Warden Active)...");

  // --- GLOBAL CLICK DELEGATION ---
  document.body.addEventListener(
    "click",
    async (e) => {
      const target = e.target.closest("button, .clickable, a");
      if (!target) return;

      // 1. REGENERATE (REROLL)
      if (target.matches(".btn-regenerate, [data-action='regenerate']")) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        let note = null;
        if (e.shiftKey) {
          note = prompt("Developer Note (Optional override):");
        }

        log(`[UI] Regenerate clicked. Note: ${note || "None"}`);
        await GameMaster.regenerate(note);
        return;
      }

      // 2. SEND VISUAL REQUEST (FORCE)
      if (target.matches("#btn-request-visual")) {
        e.preventDefault();
        e.stopPropagation();
        await GameMaster.requestVisual();
        return;
      }

      // 3. EDIT MESSAGE
      if (target.matches(".btn-edit-msg")) {
        e.preventDefault();
        const msgId = target.dataset.id;
        const content = decodeURIComponent(target.dataset.content);
        const newText = prompt("Edit message:", content);

        if (newText !== null && newText !== content) {
          const role = target.dataset.role;
          if (role === "user") {
            await GameMaster.editUserMessage(msgId, newText);
          } else {
            await GameMaster.editAiMessage(msgId, newText);
          }
        }
        return;
      }

      // 4. CONTINUE
      if (target.matches(".btn-continue")) {
        e.preventDefault();
        await GameMaster.extendAiResponse();
        return;
      }

      // 5. REROLL IMAGE
      if (target.matches(".btn-reroll-image")) {
        e.preventDefault();
        const msgId = target.dataset.id;
        await GameMaster.regenerateMessageImage(msgId);
        return;
      }

      // 6. GHOSTWRITE
      if (target.matches("#btn-ghostwrite")) {
        e.preventDefault();

        const inputField = document.querySelector(
          "#story-form textarea[name='message']",
        );
        const draft = inputField ? inputField.value : "";

        if (!draft || !draft.trim()) {
          const { showAlert } = await import("./orchestrator.js");
          showAlert(
            "Ghostwriter",
            "Please type a rough draft in the chat box first!",
          );
          return;
        }

        const { StoryOptionsController } =
          await import("./components/settings.js");
        StoryOptionsController.close();

        if (inputField) {
          inputField.disabled = true;
          inputField.dataset.original = inputField.value; // Backup
          inputField.value = "Ghostwriting..."; // Visual Feedback
          inputField.style.opacity = "0.5";
        }

        try {
          if (GameMaster.ghostwrite) {
            // Updated: Returns text, does NOT send.
            const result = await GameMaster.ghostwrite(draft);

            if (result && inputField) {
              inputField.value = result;
              // Manually triggering input event to resize if needed
              inputField.dispatchEvent(new Event("input", { bubbles: true }));
              inputField.focus();
            } else if (inputField) {
              inputField.value = draft; // Restore on empty result
            }
          } else {
            console.error("GameMaster.ghostwrite not implemented yet");
            if (inputField) inputField.value = draft;
          }
        } catch (err) {
          console.error("[Ghostwrite] Error:", err);
          const { showAlert } = await import("./orchestrator.js");
          showAlert("Ghostwrite Error", `Failed to execute: ${err.message}`);
          if (inputField) inputField.value = draft;
        } finally {
          if (inputField) {
            inputField.disabled = false;
            inputField.style.opacity = "1";
            inputField.focus();
          }
        }
        return;
      }
    },
    true,
  );

  // --- INPUT HANDLING ---
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");

  if (chatInput && sendBtn) {
    // Clone to strip old listeners
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);

    const newChatInput = chatInput.cloneNode(true);
    chatInput.parentNode.replaceChild(newChatInput, chatInput);

    const sendMessage = async () => {
      const text = newChatInput.value.trim();
      if (!text) return;

      // --- WARDEN SCANNER ---
      const reflexInstruction = Warden.scan(text);
      if (reflexInstruction) {
        log("[Warden] Injection Triggered:", reflexInstruction.type);
      }

      newChatInput.value = "";
      newChatInput.style.height = "auto";

      // Pass the reflex instruction as a variance override
      await GameMaster.send(text, { varianceInstruction: reflexInstruction });
    };

    newSendBtn.addEventListener("click", sendMessage);

    newChatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    newChatInput.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });
  }

  // --- SETTINGS & DRAWER ---
  const btnSettings = document.getElementById("btn-settings");
  if (btnSettings) {
    const newBtn = btnSettings.cloneNode(true);
    btnSettings.parentNode.replaceChild(newBtn, btnSettings);

    newBtn.addEventListener("click", () => {
      document.body.classList.toggle("settings-open");
    });
  }
}
