// src/js/gamemaster/session.js
import { db } from "../scholar/db.js";
import { state, applyPatch, events, EVENTS } from "./store.js";
import { entities } from "../scholar/index.js";
import { Director } from "./director.js";
import { ContextBuilder } from "../scholar/index.js";
import { error } from "./utils.js";
import { ROLES } from "./config.js";

// --- INTERNAL HELPERS ---
async function _refreshUI(storyId) {
  await Session.loadMessages(storyId);
  events.dispatchEvent(
    new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
  );
}

function _startGen() {
  events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
}

function _getLastAiMsg(storyId) {
  const msgs = state.messages.byStoryId[storyId] || [];
  const last = msgs[msgs.length - 1];
  return last?.role === ROLES.AI || last?.role === ROLES.FRACTAL ? last : null;
}

/**
 * THE SESSION MANAGER
 * Handles the State Lifecycle (CRUD) of Stories and Messages.
 * Delegates the "Action" to the Director.
 */
export const Session = {
  /**
   * Ensures an active story is selected in State.
   */
  requireActive() {
    if (!state.story.activeId) {
      console.error("[Session] requireActive failed. Current state:", state);
      throw new Error("No active story.");
    }
    return state.story.activeId;
  },

  /**
   * Creates a new Story from the selected entities.
   */
  createFromSelection: async (data) => {
    const [startAi, startUser, startFractal] = await Promise.all([
      entities.get("character", data.aiId),
      entities.get("character", data.userId),
      entities.get(ROLES.FRACTAL, data.fractalId),
    ]);

    const id = await db.stories.add({
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isConcluded: 0,
      snapshots: {
        start: { ai: startAi, user: startUser, fractal: startFractal },
        end: null,
      },
    });

    const storyWithId = { ...data, id };

    applyPatch({
      story: { activeId: id, byId: { [id]: storyWithId } },
      mode: "storymode",
    });

    await db.settings.put({ id: "active_story", value: id });
    events.dispatchEvent(new CustomEvent(EVENTS.STORY_LOADED));
    return id;
  },

  /**
   * Loads an existing story.
   */
  load: async (storyId) => {
    try {
      const story = await db.stories.get(storyId);
      if (!story) throw new Error("Story not found.");

      applyPatch({
        story: { activeId: story.id, byId: { [story.id]: story } },
        storyTitle: story.storyTitle,
        mode: "storymode",
      });

      await db.settings.put({ id: "active_story", value: story.id });
      await Session.loadMessages(story.id);
      events.dispatchEvent(new CustomEvent(EVENTS.STORY_LOADED));
    } catch (e) {
      error("Failed to load story:", e);
      throw e;
    }
  },

  /**
   * Hydrates the message store for a story.
   */
  loadMessages: async (storyId) => {
    const msgs = await db.messages
      .where("storyId")
      .equals(storyId)
      .sortBy("createdAt");
    applyPatch({ messages: { byStoryId: { [storyId]: msgs } } });
    return msgs;
  },

  /**
   * User Action: Edit a User message (rewind time).
   */
  editUserMessage: async (messageId, newText) => {
    const storyId = Session.requireActive();
    await db.messages.update(messageId, { text: newText });

    // Sync state and find deletion point
    const msgs = await Session.loadMessages(storyId);
    const msgIndex = msgs.findIndex((m) => m.id === messageId);

    // Delete forwarding history (Rewind Time Protocol)
    if (msgIndex !== -1 && msgIndex < msgs.length - 1) {
      const idsToDelete = msgs.slice(msgIndex + 1).map((m) => m.id);
      await db.messages.bulkDelete(idsToDelete);
    }

    await _refreshUI(storyId);
    await Director.playTurn(storyId);
  },

  /**
   * User Action: Edit an AI message (correction).
   */
  editAiMessage: async (messageId, newText) => {
    const storyId = Session.requireActive();
    await db.messages.update(messageId, { text: newText });
    await _refreshUI(storyId);
  },

  /**
   * User Action: Send a message.
   */
  send: async (text, options = {}) => {
    if (!text) return;
    const storyId = Session.requireActive();
    _startGen();

    try {
      const story = state.story.byId[storyId];
      const user = await entities.get("character", story.userId);

      // 1. Commit User Message
      await db.messages.add({
        storyId,
        role: ROLES.USER,
        type: "IC",
        text,
        characterName: user?.name || "User",
        createdAt: Date.now(),
      });

      await _refreshUI(storyId);

      // 2. Build Context & Execute
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build(text, options);

      // Delegate to Director
      await Director.execute(storyId, payload, { mode: "create" });
    } catch (e) {
      error("Send Error", e);
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  /**
   * User Action: Regenerate the last AI response.
   */
  regenerate: async (manualInstruction = null) => {
    const storyId = Session.requireActive();
    const last = _getLastAiMsg(storyId);
    if (!last) return;

    _startGen();
    await db.messages.delete(last.id);
    await _refreshUI(storyId);

    await Director.retry(storyId, manualInstruction);
  },

  /**
   * User Action: Extend the last AI response.
   */
  extendAiResponse: async () => {
    const storyId = Session.requireActive();
    const last = _getLastAiMsg(storyId);
    if (!last) return;

    _startGen();
    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();
      payload.system +=
        "\n\n[SYSTEM: CONTINUATION_PROTOCOL]\nContinue immediately. Do not repeat. No <think> tags. Do not produce an image.";

      await Director.execute(storyId, payload, {
        mode: "append",
        appendTargetId: last.id,
      });
    } catch (e) {
      error("Extend Error", e);
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },
};
