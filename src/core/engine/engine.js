import { IntelligenceKernel } from "@core/intelligence/IntelligenceKernel.js";
import { app } from "@state/app.svelte.js";
import { engineState } from "@state/status.svelte.js";
import { Session } from "./SessionDriver.js";
/**
 * The Engine provides a unified interface for the high-level simulation logic.
 * It serves as the primary controller for the Perchance narrative flow.
 */
export const Engine = {
  // --- SESSION ---
  require_active: () => Session.require_active(),
  get_active: () => Session.active_id,
  create_from_selection: (data) => Session.create_from_selection(data),
  load_messages: (story_id) => Session.load_log(story_id),
  send: async (text) => {
    await Session.send(text);
    await Engine.generate_ai_response(Session.require_active());
  },
  regenerate: () => Session.regenerate(),
  // --- GENERATION ---
  generate_ai_response: async (story_id, options = {}) => {
    engineState.start_generation(options.role || "ai");
    try {
      await IntelligenceKernel.execute_turn(story_id, options);
      app.log("Generation complete.", "system");
    } catch (e) {
      console.error("Engine: Generation Failed", e);
      app.log("Error: Generation Failed.", "error");
      throw e;
    } finally {
      engineState.complete();
    }
  },
  generate_prologue: async (story_id) => {
    engineState.start_generation("fractal");
    try {
      await IntelligenceKernel.execute_prologue(story_id);
      app.log("Prologue generated and opening turn executed.", "system");
    } catch (e) {
      console.error("Engine: Prologue Failed", e);
      app.log("Error: Prologue Failed.", "error");
      throw e;
    } finally {
      engineState.complete();
    }
  },
  trigger_epilogue: async () => {
    engineState.start_generation("ai");
    try {
      await IntelligenceKernel.execute_epilogue(Session.require_active());
    } catch (e) {
      console.error("Engine: Epilogue Failed", e);
      app.log("Error: Epilogue Failed.", "error");
      throw e;
    } finally {
      engineState.complete();
    }
  },
};
// New API Exports
export { Session };
