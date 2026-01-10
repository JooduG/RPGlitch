/**
 * src/js/scholar/index.js
 * THE SCHOLAR (Global Knowledge Overseer)
 *
 * The Scholar manages the acquisition and refinement of truth (Lore) and memory (History).
 * It delegates to:
 * - Library: Static knowledge & rules.
 * - Repository: Database access.
 * - Context (Tactician): Prompt assembly.
 * - Archivist: Deep memory processing.
 */

import { LlmService } from "../gamemaster/llm.js";
import { log, error } from "../gamemaster/utils.js";
import { showAlert } from "../mesmer/ui/core/modal.js";
import { audioService } from "../mesmer/audio/service.js";

// Sub-Modules
import { ContextBuilder } from "./context.js";
import { archiveMemory } from "./archivist.js";

// Re-Exports for Convenience
export { ContextBuilder } from "./context.js";
export { entities, stories, seedPremades } from "./repository.js";
export { premade } from "./library.js";

export const Scholar = {
  // =========================================================================
  // 1. THE LIBRARIAN (UI Assistance)
  // =========================================================================

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

  /**
   * Refines a specific field using the Scholar's knowledge.
   * Used by the "Magic Sparkle" buttons in the Profile Editor.
   */
  consult: async (targetField, entityType = "character") => {
    const inputId = `input-${targetField.replace(/_/g, "-")}`;
    const inputEl = document.getElementById(inputId);
    const btnId = `btn-magic-${targetField}`;
    const btnEl = document.getElementById(btnId);

    if (!inputEl) {
      console.warn(`[Scholar] Input not found: ${inputId}`);
      return;
    }

    try {
      // A. UI State: Loading
      if (btnEl) {
        btnEl.dataset.original = btnEl.innerHTML;
        btnEl.innerHTML = "⏳";
        btnEl.disabled = true;
        btnEl.classList.add("animate-pulse");
      }

      if (inputEl) {
        inputEl.disabled = true;
        inputEl.style.opacity = "0.7";
      }

      // B. Build Context & Prompt
      const currentContent = inputEl.value.trim();
      const contextData = Scholar._scrapeContext();
      contextData.type = entityType;

      const builder = new ContextBuilder(null);
      const payload = builder.buildScholarPrompt(
        targetField,
        currentContent,
        contextData,
      ); // Not async

      log(`[Scholar] Consulting on ${targetField} for ${entityType}...`);

      // C. Generate
      const result = await LlmService.generate(payload, { temperature: 0.6 });

      // D. Apply Result
      inputEl.value = result.trim();
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));

      audioService.play("notification");
    } catch (e) {
      error("[Scholar] Failed:", e);
      showAlert("The Scholar is offline.");
    } finally {
      // E. UI State: Reset
      if (btnEl) {
        btnEl.innerHTML = btnEl.dataset.original || "✨";
        btnEl.disabled = false;
        btnEl.classList.remove("animate-pulse");
      }

      if (inputEl) {
        inputEl.disabled = false;
        inputEl.style.opacity = "1";
        inputEl.focus();
      }
    }
  },

  // =========================================================================
  // 2. THE ARCHIVIST (Deep Memory)
  // =========================================================================

  /**
   * Compresses recent history into the entity's long-term memory.
   */
  archive: async (targetEntity, historySlice, role = "character") => {
    return await archiveMemory(targetEntity, historySlice, role);
  },
};
