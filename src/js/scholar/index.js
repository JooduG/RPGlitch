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
   * Refines a specific field using the Scholar's knowledge.
   * Now pure logic (no DOM manipulation).
   */
  consult: async (targetField, contextChar = {}) => {
    try {
      const entityType = contextChar.type || "character";

      // Flatten Context for ContextBuilder
      const contextData = {
        name: contextChar.name || "Subject",
        type: entityType,
        forever_physical: contextChar.eternal?.physical || "",
        forever_mental: contextChar.eternal?.mental || "",
        past: contextChar.timeline?.past || "",
        future: contextChar.timeline?.future || "",
        present_physical: contextChar.present?.physical || "",
        present_mental: contextChar.present?.mental || "",
      };

      // Extract current content
      // Handle nested keys like "eternal.physical"
      const keys = targetField.split(".");
      let currentContent = contextChar;
      for (const k of keys) {
        currentContent = currentContent?.[k];
      }
      if (typeof currentContent !== "string") currentContent = "";

      const builder = new ContextBuilder(null);
      // Map "eternal.physical" -> "forever_physical" for prompt builder if needed?
      // Actually ContextBuilder likely expects specific field names.
      // We'll pass raw targetField and let builder handle or we handle mapping.
      // Looking at legacy _scrapeContext, keys were "input-forever-physical".
      // builder.buildScholarPrompt likely switches on targetField.

      const payload = builder.buildScholarPrompt(
        targetField,
        currentContent,
        contextData,
      );

      log(`[Scholar] Consulting on ${targetField} for ${entityType}...`);

      const result = await LlmService.generate(payload, { temperature: 0.7 });
      audioService.play("notification");
      return result.trim();
    } catch (e) {
      error("[Scholar] Failed:", e);
      throw e;
    }
  },

  /**
   * Enhances a visual prompt using the LLM.
   */
  enhanceVisual: async (currentPrompt, contextChar = {}) => {
    try {
      const builder = new ContextBuilder(null);
      // Delegate to ContextBuilder -> Mesmer.templateVisual
      const payload = await builder.buildMesmerEnhance(
        currentPrompt,
        contextChar,
      );

      const result = await LlmService.generate(payload, { temperature: 0.7 });
      return result.trim();
    } catch (e) {
      error("[Scholar] Visual Enhance Failed:", e);
      throw e;
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
