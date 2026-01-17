/**
 * src/js/gamemaster/index.js
 * THE GAME MASTER FACADE
 * Orchestrates the "Director" (Logic) and "Session" (State).
 */

import { Session } from "./session.js";
import { events, EVENTS, state as store } from "./bus.js";
import { LlmService, ContextBroker } from "./llm.js";
import { runtime } from "../scholar/runtime.svelte.js"; // Needed for runtime saving?
// Note: runtime.save is usually called by Chrono loop.

// Backward Compatibility Facade
export const GameMaster = {
  // Session Methods
  requireActive: (...args) => Session.requireActive(...args),
  createFromSelection: (...args) => Session.createFromSelection(...args),
  loadMessages: (...args) => Session.loadMessages(...args),
  send: (...args) => Session.send(...args),
  regenerate: (...args) => Session.regenerate(...args),

  // GameMaster Methods Replacement
  generateAiResponse: async (storyId, options = {}) => {
    // 1. SIGNAL START
    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));

    try {
      // 2. ASSEMBLE (Modular Context)
      const payload = await ContextBroker.assemble(
        options.input || "",
        "prose",
      );

      // 3. GENERATE (LLM Service)
      const response = await LlmService.generate(payload);

      // 4. PERSIST (Session)
      // Assume AI character name is in runtime or use default
      const aiName = runtime.aiCharacter?.name || "AI";
      await Session.addAiMessage(response, aiName);
    } catch (e) {
      console.error("Generation Failed", e);
      throw e;
    } finally {
      // 5. NOTIFY COMPLETE
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  generatePrologue: async (storyId) => {
    // Basic Prologue Logic
    // We can use the same pipeline or specialized one
    const { ContextBuilder } = await import("../scholar/index.js");
    const builder = new ContextBuilder(storyId);
    const payload = await builder.buildPrologue();

    if (payload) {
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
      try {
        // Basic generation without full GameMaster overhead
        const result = await LlmService.generate(payload);
        await Session.addAiMessage(result, "Narrator");
      } finally {
        events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
      }
    }
  },

  triggerEpilogue: async () => {
    const storyId = Session.requireActive();
    const { ContextBuilder } = await import("../scholar/index.js");
    const builder = new ContextBuilder(storyId);
    const payload = await builder.buildEpilogue();
    if (payload) {
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
      try {
        const result = await LlmService.generate(payload);
        await Session.addAiMessage(result, "Narrator");
      } finally {
        events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
      }
    }
  },

  // Stubs for visual - if needed, implement similar to text
  requestVisual: () => console.warn("Visuals not fully re-implemented yet."),
  generateVisualFromDraft: () => {},

  // Private helpers
  _runEcho: async () => {
    // Calls Scholar.echo
    // const { Scholar } = await import("../scholar/index.js");
    // Needs target entity... logic usually depends on context.
    // This facade might be deprecated or needed by Chrono.
    // Chrono calls runtime.save() -> Echo logic is internal to Scholar or triggered by Chrono?
    // Chrono loop said: app.log("Echo recording..."), runtime.save()
    // Wait, runtime.save calls DB.
    // Where is Echo.echo called?
    // It seems Chrono does NOT call Echo.echo directly in the loop I saw earlier?
    // Ah, I saw "PHASE 3: ECHO" in `ReactiveSession` (lines 107)
    // but it just LOGGED it.
    // `GameMaster.js` line 63 was `_runEcho: (...args) => Director._runEchoCycle(...args)`.
    // I should probably leave a stub or simple log for now.
    // console.log("Echo cycle triggered");
  },
};

// New API Exports
export { Session, events, EVENTS, store };
