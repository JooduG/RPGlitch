import { LlmService } from "../services/llm-service.js";
import { ContextBuilder } from "./prompter.js";
import { log, error } from "../core/utils.js";
import { showAlert } from "../ui/services/modals.js";
import { audioService } from "../services/audio-service.js";

/**
 * The Prometheus Librarian
 * Scrapes the Edit UI, formulates a strategy, and rewrites specific fields.
 */
export const Librarian = {
  /**
   * Scrape the current values from the active Edit Form.
   * NOTE: We intentionally DO NOT scrape the Description field.
   */
  _scrapeContext: () => {
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : "";
    };

    return {
      name: getVal("input-name"),
      // NO DESCRIPTION
      forever_physical: getVal("input-forever-physical"),
      forever_mental: getVal("input-forever-mental"),
      past: getVal("input-past"),
      present_physical: getVal("input-present-physical"),
      present_mental: getVal("input-present-mental"),
      future: getVal("input-future"),
    };
  },

  enhanceField: async (targetField) => {
    const inputId = `input-${targetField.replace(/_/g, "-")}`;
    const inputEl = document.getElementById(inputId);
    const btnId = `btn-magic-${targetField}`;
    const btnEl = document.getElementById(btnId);

    if (!inputEl) {
      console.warn(`[Librarian] Input not found: ${inputId}`);
      return;
    }

    try {
      // 1. UI State: Loading
      if (btnEl) {
        btnEl.dataset.original = btnEl.innerHTML;
        btnEl.innerHTML = "⏳";
        btnEl.disabled = true;
        btnEl.classList.add("animate-pulse");
      }

      // [NEW] Disable Input
      if (inputEl) {
        inputEl.disabled = true;
        inputEl.style.opacity = "0.7";
      }

      // 2. Gather Data
      const currentContent = inputEl.value.trim();
      const contextData = Librarian._scrapeContext();

      // 3. Build Prompt
      const builder = new ContextBuilder(null);
      const payload = await builder.buildLibrarian(
        targetField,
        currentContent,
        contextData,
      );

      log(`[Librarian] Enhancing ${targetField}...`);

      // 4. Generate
      const result = await LlmService.generate(payload);

      // 5. Update UI
      inputEl.value = result.trim();

      // Trigger input event to ensure auto-resize / state capture works
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));

      // [NEW] Completion Sound
      audioService.play("notification");
    } catch (e) {
      error("[Librarian] Failed:", e);
      showAlert("The Librarian is offline.");
    } finally {
      // 6. UI State: Reset
      if (btnEl) {
        btnEl.innerHTML = btnEl.dataset.original || "✨";
        btnEl.disabled = false;
        btnEl.classList.remove("animate-pulse");
      }

      if (inputEl) {
        inputEl.disabled = false;
        inputEl.style.opacity = "1";
        inputEl.focus(); // Return focus to user
      }
    }
  },
};
