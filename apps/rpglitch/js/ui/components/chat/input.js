import { TurnManager } from "../../../engine/director.js";

export function initChatInput() {
  const form = document.querySelector("#story-form");
  if (!form) return;

  const input = form.querySelector("textarea[name='message']"); // Can be input or textarea
  const btn = form.querySelector('button[type="submit"]');

  if (!input || !btn) return;

  // Auto-resize function for textarea
  const adjustHeight = () => {
    input.style.height = "auto";
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
