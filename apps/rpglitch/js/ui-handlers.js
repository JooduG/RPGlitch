/**
 * apps/rpglitch/js/ui-handlers.js
 * Centralized UI event handlers.
 * NOW FEATURING: The Reflex Brain (Zero Latency Input Scanning)
 */
import { TurnManager } from "./engine/director.js";
import { log } from "./core/utils.js";

// Prevent duplicate listeners during hot-reload
if (window.__RPGLITCH_UI_HANDLERS_INIT) {
  // console.warn("[UI Handlers] Re-init prevented. Listeners already active.");
}

// --- THE REFLEX BRAIN (Heuristics) ---
// Scans input for high-signal keywords to inject instant physics overrides.
function scanReflex(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  // 1. COMBAT (Velocity Spike)
  const combatRegex =
    /kill|shoot|stab|punch|hit|fight|attack|gun|weapon|blood|hurt|destroy|break|smash|burn|explosion|die/i;
  if (combatRegex.test(lower)) {
    return `
<REFLEX_TRIGGER>
INPUT SIGNAL: VIOLENCE DETECTED.
PHYSICS OVERRIDE: Velocity +20 (Adrenaline Spike).
INSTRUCTION: Pacing must be fast. Sentences must be short. Actions must be brutal.
</REFLEX_TRIGGER>`;
  }

  // 2. INTIMACY (Permeability Spike)
  const intimacyRegex =
    /kiss|love|hold|hug|touch|gentle|soft|warm|caress|cheek|hand|finger|whisper|close|safe|trust|heart|blush/i;
  if (intimacyRegex.test(lower)) {
    return `
<REFLEX_TRIGGER>
INPUT SIGNAL: INTIMACY DETECTED.
PHYSICS OVERRIDE: Permeability +20 (Vulnerability Spike).
INSTRUCTION: Focus on somatic details (skin temperature, texture, heartbeat). Be vulnerable.
</REFLEX_TRIGGER>`;
  }

  // 3. HORROR (Entropy Spike)
  const horrorRegex =
    /scream|run|hide|fear|scared|dark|shadow|weird|glitch|wrong|monster|ghost|dead|rot|decay|cold|shiver|nightmare/i;
  if (horrorRegex.test(lower)) {
    return `
<REFLEX_TRIGGER>
INPUT SIGNAL: FEAR DETECTED.
PHYSICS OVERRIDE: Entropy +20 (Reality Distortion).
INSTRUCTION: The simulation is degrading. Describe hallucinations, visual artifacts, or sensory errors.
</REFLEX_TRIGGER>`;
  }

  return null;
}

export function initUIHandlers() {
  if (window.__RPGLITCH_UI_HANDLERS_INIT) return;
  window.__RPGLITCH_UI_HANDLERS_INIT = true;

  log("[UI] Initializing Handlers (Reflex Active)...");

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
        await TurnManager.regenerate(note);
        return;
      }

      // 2. SEND VISUAL REQUEST (FORCE)
      if (target.matches("#btn-request-visual")) {
        e.preventDefault();
        e.stopPropagation();
        await TurnManager.requestVisual();
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
            await TurnManager.editUserMessage(msgId, newText);
          } else {
            await TurnManager.editAiMessage(msgId, newText);
          }
        }
        return;
      }

      // 4. CONTINUE
      if (target.matches(".btn-continue")) {
        e.preventDefault();
        await TurnManager.extendAiResponse();
        return;
      }

      // 5. REROLL IMAGE
      if (target.matches(".btn-reroll-image")) {
        e.preventDefault();
        const msgId = target.dataset.id;
        await TurnManager.regenerateMessageImage(msgId);
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

      // --- REFLEX SCANNER ---
      const reflexInstruction = scanReflex(text);
      if (reflexInstruction) {
        log("[Reflex] Injection Triggered:", reflexInstruction.split("\n")[2]);
      }

      newChatInput.value = "";
      newChatInput.style.height = "auto";

      // Pass the reflex instruction as a variance override
      await TurnManager.send(text, { varianceInstruction: reflexInstruction });
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
