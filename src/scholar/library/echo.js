/**
 * src/js/scholar/library/echo.js
 * THE ECHO (Temporal Resonance)
 * Handles the consolidation of short-term history into long-term entity profiles.
 */

import { LlmService } from "../../gamemaster/llm.js";
import { ContextBuilder } from "./context.js";
const log = console.log;
const error = console.error;

export class Echo {
  constructor() {
    this.name = "Echo";
  }

  /**
   * Condenses recent history into a structured memory update.
   * @param {Object} targetEntity - The entity to update.
   * @param {Array} historySlice - The raw message objects.
   * @param {string} role - "character", "user", or "fractal" context.
   */
  async memorize(targetEntity, historySlice, role = "character") {
    try {
      if (!targetEntity) return null;

      // 1. Build Prompt
      const builder = new ContextBuilder(null);
      const payload = await builder.buildScholarEchoPrompt(
        targetEntity,
        historySlice,
        role,
      );

      log(
        `[Scholar:Echo] Recording Temporal Resonance for ${targetEntity.name}...`,
      );

      // 2. Generate
      const response = await LlmService.generate(payload, { json: true });

      // 3. Parse Result
      let data;
      try {
        let jsonText =
          typeof response === "object"
            ? response.generatedText || response.text
            : String(response);

        // Clean markdown/formatting
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonText = jsonMatch[0];
        jsonText = jsonText.replace(/```json\n?|```/g, "").trim();

        data = JSON.parse(jsonText);
      } catch (parseErr) {
        console.warn("[Scholar:Echo] Resonance Parsing Failed", parseErr);
        return null;
      }

      return data;
    } catch (e) {
      error("[Scholar:Echo] Critical Resonance Failure", e);
      return null;
    }
  }
}
