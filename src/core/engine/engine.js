import { gamemaster } from "@core/intelligence/intelligence-kernel.js";
import { app } from "@state/app.svelte.js";
import { simulationState } from "@state/status.svelte.js";
import { session_driver } from "./session-driver.js";
/**
 * The Engine provides a unified interface for the high-level simulation logic.
 * It serves as the primary controller for the Perchance narrative flow.
 */
export const Engine = {
  // --- SESSION ---
  require_active: () => session_driver.require_active(),
  get_active: () => session_driver.active_id,
  create_from_selection: (data) => session_driver.create_from_selection(data),
  load_messages: (story_id) => session_driver.load_log(story_id),
  send: async (text) => {
    await session_driver.send(text);
    await Engine.generate_ai_response(session_driver.require_active());
  },
  regenerate: () => session_driver.regenerate(),
  // --- GENERATION ---
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
    }
  },
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
    }
  },
};
// New API Exports
export { session_driver as Session };
