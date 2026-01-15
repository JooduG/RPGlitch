/**
 * src/js/gamemaster/index.js
 * THE GAME MASTER FACADE
 * Orchestrates the "Director" (Logic) and "Session" (State).
 */

import { Session } from "./engine/session.js";
import { Director } from "./engine/director.js";
import { events, EVENTS, state as store, applyPatch } from "./bus.js";

// Backward Compatibility Facade
// This object mimics the old "GameMaster" export to minimize breaking changes
export const GameMaster = {
  // Session Methods
  requireActive: (...args) => Session.requireActive(...args),
  createFromSelection: (...args) => Session.createFromSelection(...args),
  load: (...args) => Session.load(...args),
  loadMessages: (...args) => Session.loadMessages(...args),
  editUserMessage: (...args) => Session.editUserMessage(...args),
  editAiMessage: (...args) => Session.editAiMessage(...args),
  send: (...args) => Session.send(...args),
  regenerate: (...args) => Session.regenerate(...args),
  extendAiResponse: (...args) => Session.extendAiResponse(...args),

  // Director Methods
  // Director Methods
  generateAiResponse: async (storyId, options = {}) => {
    // [CONTEXT BROKER] Assemble Dynamic Context
    // This replaces the old Director.playTurn which used the rigid ContextBuilder
    const { LlmService, ContextBroker } = await import("./llm.js");

    // 1. ASSEMBLE (Modular Context)
    // We assume 'options.input' is the user's action or empty for AI turn
    const payload = await ContextBroker.assemble(options.input || "", "prose");

    // 2. EXECUTE (Director Cycle)
    // Director.execute handles the LLM call, visuals, and persistence
    await Director.execute(storyId, payload, {
      ...options,
      mode: "create",
    });
  },
  generatePrologue: async (storyId) => {
    const { ContextBuilder } = await import("../scholar/index.js");
    const builder = new ContextBuilder(storyId);
    const payload = await builder.buildPrologue();
    if (payload) await Director.execute(storyId, payload, { mode: "prologue" });
  },
  triggerEpilogue: async () => {
    const storyId = Session.requireActive();
    const { ContextBuilder } = await import("../scholar/index.js");
    const builder = new ContextBuilder(storyId);
    const payload = await builder.buildEpilogue();
    if (payload) await Director.execute(storyId, payload, { mode: "epilogue" });
  },
  requestVisual: (...args) => Director.requestVisual(...args),
  generateVisualFromDraft: (...args) =>
    Director.generateVisualFromDraft(...args),
  _executeTurn: (...args) => Director.execute(...args),

  // Private helpers potentially used by legacy tests
  _runWarden: (...args) => Director._runWarden(...args),
  _runArchivist: (...args) => Director._runArchivistCycle(...args),
};

// New API Exports
export { Session, Director, events, EVENTS, store, applyPatch };
