/**
 * src/js/scholar/archivist.js
 * THE ARCHIVIST (Deep Memory)
 * Handles the consolidation of short-term history into long-term entity profiles.
 */

import { LlmService } from "../../js/gamemaster/llm.js";
import { ContextBuilder } from "./context.js";
import { log, error } from "../../js/gamemaster/utils.js";

/**
 * Condenses recent history into a structured memory update.
 * @param {Object} targetEntity - The entity to update.
 * @param {Array} historySlice - The raw message objects.
 * @param {string} role - "character" or "user" context.
 */
export const archiveMemory = async (
  targetEntity,
  historySlice,
  role = "character",
) => {
  try {
    // 1. Build Prompt
    const builder = new ContextBuilder(null);
    const payload = await builder.buildScholarArchivistPrompt(
      targetEntity,
      historySlice,
      role,
    );

    log(`[Scholar:Archivist] Archiving Memory for ${targetEntity.name}...`);

    // 2. Generate
    const response = await LlmService.generate(payload, { json: true });

    // 3. Parse Result
    let data;
    try {
      let jsonText =
        typeof response === "object"
          ? response.generatedText || response.text
          : String(response);
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonText = jsonMatch[0];
      jsonText = jsonText.replace(/```json\n?|```/g, "").trim();
      data = JSON.parse(jsonText);
    } catch (parseErr) {
      console.warn("[Scholar:Archivist] JSON Parsing Failed", parseErr);
      return null;
    }

    return data;
  } catch (e) {
    error("[Scholar:Archivist] Critical Failure", e);
    return null;
  }
};
