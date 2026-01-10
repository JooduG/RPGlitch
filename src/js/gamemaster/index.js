/**
 * src/js/gamemaster/index.js
 * THE GAME MASTER FACADE
 * Orchestrates the "Director" (Logic) and "Session" (State).
 */

import { Session } from "./session.js";
import { Director } from "./director.js";
import { events, EVENTS, state as store, applyPatch } from "./store.js";

// Backward Compatibility Facade
// This object mimics the old "GameMaster" export to minimize breaking changes
export const GameMaster = {
  // Session Methods
  requireActive: Session.requireActive,
  createFromSelection: Session.createFromSelection,
  load: Session.load,
  loadMessages: Session.loadMessages,
  editUserMessage: Session.editUserMessage,
  editAiMessage: Session.editAiMessage,
  send: Session.send,
  regenerate: Session.regenerate,
  extendAiResponse: Session.extendAiResponse,

  // Director Methods
  generateAiResponse: Director.playTurn,
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
  requestVisual: Director.requestVisual,
  generateVisualFromDraft: Director.generateVisualFromDraft,
  _executeTurn: Director.execute,

  // Private helpers potentially used by legacy tests
  _runWarden: Director._runWarden,
  _runArchivist: Director._runArchivistCycle,
};

// New API Exports
export { Session, Director, events, EVENTS, store, applyPatch };
