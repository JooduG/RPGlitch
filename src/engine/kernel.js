import { session_driver } from "@engine";
import { gamemaster } from "@intelligence";
import { app, simulationState } from "@state";
/**
 * @typedef {Object} GenerationOptions
 * @property {string} [role]
 * @property {boolean} [stream]
 * @property {string | null} [input]
 * @property {any} [shieldContext]
 * @property {number} [temperature]
 * @property {number} [top_p]
 * @property {number} [repetition_penalty]
 * @property {number} [max_tokens]
 * @property {string} [model]
 * @property {Function} [onToken]
 * @property {boolean} [json]
 * @property {AbortSignal} [signal]
 * @property {boolean} [silent]
 * @property {boolean} [raw]
 */

/**
 * The Engine provides a unified interface for the high-level simulation logic.
 * It serves as the primary controller for the Perchance narrative flow.
 */
export const Engine = {
  // --- GENERATION ---
  /**
   * @param {string} story_id
   * @param {GenerationOptions} [options]
   */
  generate_ai_response: async (story_id, options = {}) => {
    simulationState.start_generation(options.role || "ai");
    try {
      await gamemaster.execute_turn(story_id, options);
      app.log("Generation complete.", "system");
    } catch (e) {
      console.error("Engine: Generation Failed", e);
      app.log("Error: Generation Failed.", "error");
      throw e;
    } finally {
      simulationState.complete();
      app.end_stream();
    }
  },
  /** @param {string} story_id */
  generate_prologue: async (story_id) => {
    simulationState.start_generation("fractal");
    try {
      await gamemaster.execute_prologue(story_id);
      app.log("Prologue generated and opening turn executed.", "system");
    } catch (e) {
      console.error("Engine: Prologue Failed", e);
      app.log("Error: Prologue Failed.", "error");
      throw e;
    } finally {
      simulationState.complete();
      app.end_stream();
    }
  },
  trigger_epilogue: async () => {
    simulationState.start_generation("ai");
    try {
      await gamemaster.execute_epilogue(session_driver.require_active());
    } catch (e) {
      console.error("Engine: Epilogue Failed", e);
      app.log("Error: Epilogue Failed.", "error");
      throw e;
    } finally {
      simulationState.complete();
      app.end_stream();
    }
  },
};
