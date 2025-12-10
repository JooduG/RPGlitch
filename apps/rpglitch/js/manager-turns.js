import { db } from "./core-db.js";
import { state, applyPatch } from "./app-state.js";
import { generateStream } from "./llm-adapter.js";
import { entities } from "./entity-crud.js";
import {
  renderChat, updatePortraits, setGameplayEntities,
  showTypingIndicator, removeTypingIndicator, setSendLock,
  applyWorldAmbience, setChatGeneratingState
} from "./ui-render-chat.js";
import { refreshProfileIfOpen } from "./ui-profile.js";
import { error } from "./core-utils.js";
import { ContextBuilder } from "./engine-prompt-builder.js";
import { analyzeRejection, getDirectorInstruction } from "./engine-variance.js";
import { calculateDynamics } from "./engine-physics.js";

// [UPDATED] Now accepts entityName for clearer logs
function createPhysicsDebugLog(oldDynamics, newDynamics, entityName) {
  const flags = newDynamics._flags || {};
  let debugText = `[PHYSICS LOG] TARGET: ${entityName || 'Unknown'}\n`;
  debugText += `ENTROPY: ${newDynamics.entropy}% (was ${oldDynamics.entropy}%)\n`;
  debugText += `PERMEABILITY: ${newDynamics.permeability}% (was ${oldDynamics.permeability}%)\n`;
  debugText += `VELOCITY: ${newDynamics.velocity}% (was ${oldDynamics.velocity}%)\n`;
  debugText += `RESONANCE: ${newDynamics.resonance}% (was ${oldDynamics.resonance}%)\n\n`;

  if (flags.panicSpiral) debugText += ">> LAW 4: PANIC SPIRAL TRIGGERED (Velocity Forced Up)\n";
  if (flags.fogOfWar) debugText += ">> LAW 2: FOG OF WAR TRIGGERED (Resonance Dampened)\n";
  if (flags.echoChamber) debugText += ">> LAW 5: ECHO CHAMBER ACTIVE (Future Vector Critical)\n";
  if (flags.glassCannon) debugText += ">> LAW 6: GLASS CANNON ACTIVE (Double Impact Gain)\n";

  if (newDynamics.permeability < oldDynamics.permeability && newDynamics.velocity > 80) {
    debugText += ">> LAW 1: ADRENALINE SHIELD (Permeability Penalty)\n";
  }
  if (newDynamics.entropy < oldDynamics.entropy && newDynamics.velocity < 20) {
    debugText += ">> LAW 3: COOL-DOWN (Entropy Reduced)\n";
  }

  return debugText.trim();
}

export const TurnManager = {
  requireActive: () => {
    if (!state.story.activeId) throw new Error("No active story.");
    return state.story.activeId;
  },

  createFromSelection: async (data) => {
    const [startAi, startUser, startWorld] = await Promise.all([
      entities.get("character", data.aiCharacterId),
      entities.get("character", data.userCharacterId),
      entities.get("world", data.worldId)
    ]);

    const id = await db.stories.add({
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isConcluded: 0,
      snapshots: {
        start: {
          ai: startAi,
          user: startUser,
          world: startWorld
        },
        end: null
      }
    });

    const storyWithId = { ...data, id: id };

    applyPatch({
      story: { activeId: id, byId: { [id]: storyWithId } },
      mode: "gameplay"
    });

    // [FIX] Ensure UI is synced immediately upon creation
    updatePortraits(startAi, startUser);
    setGameplayEntities(startAi, startUser, startWorld);
    if (startWorld) applyWorldAmbience(startWorld);

    return id;
  },

  load: async (storyId) => {
    try {
      const story = await db.stories.get(storyId);
      if (!story) throw new Error("Story not found.");

      applyPatch({
        story: { activeId: story.id, byId: { [story.id]: story } },
        storyTitle: story.storyTitle,
        mode: "gameplay"
      });

      await TurnManager.loadMessages(story.id);

      const [ai, user] = await Promise.all([
        entities.get("character", story.aiCharacterId),
        entities.get("character", story.userCharacterId)
      ]);

      const world = await entities.get("world", story.worldId);

      updatePortraits(ai, user);
      setGameplayEntities(ai, user, world);

      await renderChat(story.id);

      if (world) {
        applyWorldAmbience(world);
      }

      document.body.classList.remove("mode-storyboard");
      document.body.classList.add("mode-gameplay");

    } catch (e) {
      error("Failed to load story:", e);
      alert("Could not load story.");
    }
  },

  loadMessages: async (storyId) => {
    const msgs = await db.messages.where("storyId").equals(storyId).sortBy("createdAt");
    applyPatch({ messages: { byStoryId: { [storyId]: msgs } } });
    return msgs;
  },



  editUserMessage: async (messageId, newText) => {
    const storyId = TurnManager.requireActive();
    await db.messages.update(messageId, { text: newText });

    const msgs = await db.messages.where("storyId").equals(storyId).sortBy("createdAt");
    const msgIndex = msgs.findIndex(m => m.id === messageId);

    if (msgIndex !== -1 && msgIndex < msgs.length - 1) {
      const messagesToDelete = msgs.slice(msgIndex + 1);
      for (const msg of messagesToDelete) {
        await db.messages.delete(msg.id);
      }
    }

    await TurnManager.loadMessages(storyId);
    await renderChat(storyId);
    await TurnManager.generateAiResponse(storyId);
  },

  editAiMessage: async (messageId, newText) => {
    const storyId = TurnManager.requireActive();
    await db.messages.update(messageId, { text: newText });
    await TurnManager.loadMessages(storyId);
    await renderChat(storyId);
  },

  generateAiResponse: async (storyId) => {
    const story = state.story.byId[storyId];
    setSendLock(true);
    setChatGeneratingState(true);

    try {
      const feed = document.querySelector("#chat-feed");
      showTypingIndicator(feed, 'ai', story.aiCharacterId);

      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();
      const payloadMeta = payload.meta;

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      const response = await generateStream({
        payload,
        signal: ctrl.signal,
        onToken: () => removeTypingIndicator(feed)
      });

      removeTypingIndicator(feed);

      const aiChar = await entities.get("character", story.aiCharacterId);
      const aiMsgId = await db.messages.add({
        storyId,
        role: "ai",
        type: "IC",
        text: response,
        characterName: aiChar?.name || "Narrator",
        createdAt: Date.now()
      });

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);
      applyPatch({ ui: { fsm: "done" } });

      if (payloadMeta && payloadMeta.triggerUpdate) {
        await TurnManager.runBackgroundUpdate(storyId, payloadMeta.updateTarget, aiMsgId);
      }

    } catch (e) {
      error("AI Gen Error", e);
      alert("AI Generation Failed: " + e.message);
      const feed = document.querySelector("#chat-feed");
      if (feed) removeTypingIndicator(feed);
    } finally {
      setSendLock(false);
      setChatGeneratingState(false);
    }
  },

  send: async (text) => {
    if (!text) return;
    const storyId = TurnManager.requireActive();
    const story = state.story.byId[storyId];

    setSendLock(true);
    setChatGeneratingState(true);

    try {
      await db.messages.add({
        storyId,
        role: "user",
        type: "IC",
        text,
        createdAt: Date.now()
      });

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);

      const feed = document.querySelector("#chat-feed");
      showTypingIndicator(feed, 'ai', story.aiCharacterId);

      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();
      const payloadMeta = payload.meta;

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      const response = await generateStream({
        payload,
        signal: ctrl.signal,
        onToken: () => removeTypingIndicator(feed)
      });

      removeTypingIndicator(feed);

      const aiChar = await entities.get("character", story.aiCharacterId);
      const aiMsgId = await db.messages.add({
        storyId,
        role: "ai",
        type: "IC",
        text: response,
        characterName: aiChar?.name || "Narrator",
        createdAt: Date.now()
      });

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);
      applyPatch({ ui: { fsm: "done" } });

      if (payloadMeta && payloadMeta.triggerUpdate) {
        console.log(`[PROMETHEUS] Running Physics... (UI Locked)`);
        await TurnManager.runBackgroundUpdate(storyId, payloadMeta.updateTarget, aiMsgId);
      }

    } catch (e) {
      error("AI Error", e);
      applyPatch({ ui: { fsm: "error", lastError: e.message } });
      alert("AI Error: " + e.message);
      const feed = document.querySelector("#chat-feed");
      if (feed) removeTypingIndicator(feed);
    } finally {
      setSendLock(false);
      setChatGeneratingState(false);
    }
  },

  regenerate: async () => {
    const storyId = TurnManager.requireActive();
    const story = state.story.byId[storyId];

    const msgs = state.messages.byStoryId[storyId] || [];
    if (msgs.length === 0) return;

    const lastMsg = msgs[msgs.length - 1];

    if (lastMsg.role !== "ai" && lastMsg.role !== "narrator") {
      console.warn("Cannot regenerate user message.");
      return;
    }

    const lastUserMsg = msgs.slice().reverse().find(m => m.role === "user");
    const userText = lastUserMsg ? lastUserMsg.text : "";

    const varianceKey = analyzeRejection(lastMsg.text, userText);
    const directorNote = getDirectorInstruction(varianceKey);

    console.log(`[PROMETHEUS] Regenerating with strategy: ${varianceKey}`);

    setSendLock(true);
    setChatGeneratingState(true);

    await db.messages.delete(lastMsg.id);

    await TurnManager.loadMessages(storyId);
    await renderChat(storyId);

    const feed = document.querySelector("#chat-feed");
    showTypingIndicator(feed, 'ai', story.aiCharacterId);

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildWithVariance(directorNote);

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      const response = await generateStream({
        payload,
        signal: ctrl.signal,
        onToken: () => removeTypingIndicator(feed)
      });
      removeTypingIndicator(feed);

      const aiChar = await entities.get("character", story.aiCharacterId);

      await db.messages.add({
        storyId,
        role: "ai",
        type: "IC",
        text: response,
        characterName: aiChar?.name || "Narrator",
        createdAt: Date.now()
      });

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);
      applyPatch({ ui: { fsm: "done" } });

    } catch (e) {
      error("Regen Error", e);
      alert("Regen Failed: " + e.message);
      if (feed) removeTypingIndicator(feed);
    } finally {
      setSendLock(false);
      setChatGeneratingState(false);
    }
  },

  runBackgroundUpdate: async (storyId, targetType, linkedMessageId) => {
    try {
      const builder = new ContextBuilder(storyId);
      const story = state.story.byId[storyId];
      if (!story) return;

      let entity = null;
      if (targetType === 'ai_character') entity = await entities.get("character", story.aiCharacterId);
      else if (targetType === 'user_character') entity = await entities.get("character", story.userCharacterId);
      else if (targetType === 'world') entity = await entities.get("world", story.worldId);

      if (!entity) return;

      const oldDynamics = entity.dynamics || { entropy: 10, permeability: 50, velocity: 10, resonance: 10 };
      const newDynamics = calculateDynamics(oldDynamics);

      // [FIX] Pass entity.name to the log generator
      const debugText = createPhysicsDebugLog(oldDynamics, newDynamics, entity.name);
      await db.messages.add({
        storyId,
        role: "system",
        type: "DEBUG",
        text: debugText,
        createdAt: Date.now() + 1
      });

      const payload = await builder.buildUpdater(targetType, newDynamics);
      const jsonResponse = await generateStream({ payload, signal: null });

      if (linkedMessageId) {
        const msgExists = await db.messages.get(linkedMessageId);
        if (!msgExists) {
          console.warn(`[PROMETHEUS] Aborting update. Msg ${linkedMessageId} deleted.`);
          return;
        }
      }

      let updates = {};
      try {
        // [FIX] Strip <think> block first to avoid JSON parse errors
        const cleanJson = jsonResponse.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          updates = JSON.parse(jsonMatch[0]);
        } else {
          return;
        }
      } catch (jsonErr) {
        console.warn("[PROMETHEUS] JSON Parse Error:", jsonErr);
        return;
      }

      if (updates && payload.targetEntityId) {
        const freshEntity = await entities.get(payload.targetType, payload.targetEntityId);

        if (freshEntity) {
          const updatedEntity = {
            ...freshEntity,
            forever: updates.forever || freshEntity.forever,
            past: updates.past || freshEntity.past,
            present: updates.present || freshEntity.present,
            future: updates.future || freshEntity.future,
            dynamics: {
              entropy: newDynamics.entropy,
              permeability: newDynamics.permeability,
              velocity: newDynamics.velocity,
              resonance: newDynamics.resonance
            },
            updatedAt: Date.now()
          };

          const MAX_PAST_LENGTH = 2000;
          if (updatedEntity.past && updatedEntity.past.length > MAX_PAST_LENGTH) {
            console.log(`[ARCHIVIST] Triggered for ${entity.name}. Size: ${updatedEntity.past.length}`);
            try {
              const archPayload = await builder.buildArchivist(updatedEntity);
              const summaryRaw = await generateStream({ payload: archPayload, signal: null });

              // [FIX] Strip <think> block from summary
              const summary = summaryRaw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

              if (summary && summary.length < updatedEntity.past.length) {
                updatedEntity.past = summary;
                console.log(`[ARCHIVIST] Compression complete. New Size: ${updatedEntity.past.length}`);
              }
            } catch (archErr) {
              console.warn("[ARCHIVIST] Failed:", archErr);
            }
          }

          await entities.upsert(payload.targetType, updatedEntity);
          console.log(`[PROMETHEUS] Real-time mutation applied to ${freshEntity.name}`);

          // [FIX] Refresh UI if open
          await refreshProfileIfOpen();
        }
      }

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);

    } catch (e) {
      console.error("[PROMETHEUS] Background update error:", e);
    }
  },

  generateOpening: async (storyId) => {
    setSendLock(true);
    const feed = document.querySelector("#chat-feed");
    showTypingIndicator(feed, 'narrator');

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildOpening();

      console.log("[RPGlitch] Opening Prompt:", payload.system);

      const response = await generateStream({
        payload,
        signal: null,
        onToken: () => removeTypingIndicator(feed)
      });
      removeTypingIndicator(feed);

      await db.messages.add({
        storyId,
        role: "narrator",
        type: "OOC",
        text: response,
        createdAt: Date.now()
      });

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);

      // [NEW] Chain: AI Character reacts immediately to the opening
      await TurnManager.generateAiResponse(storyId);

    } catch (e) {
      error("Opening Gen Failed", e);
      alert("Failed to generate opening: " + e.message);
      if (feed) removeTypingIndicator(feed);
      setSendLock(false); // Only unlock explicitly on error (otherwise generateAiResponse handles it)
    }
  },

  concludeStory: async () => {
    const storyId = TurnManager.requireActive();
    const story = state.story.byId[storyId];

    if (!confirm("Conclude this story? The current state of your entities will be saved to the library.")) return;

    const [endAi, endUser, endWorld] = await Promise.all([
      entities.get("character", story.aiCharacterId),
      entities.get("character", story.userCharacterId),
      entities.get("world", story.worldId)
    ]);

    await db.stories.update(storyId, {
      isConcluded: 1,
      concludedAt: Date.now(),
      "snapshots.end": {
        ai: endAi,
        user: endUser,
        world: endWorld
      }
    });

    document.body.classList.remove("mode-gameplay");
    document.body.classList.add("mode-storyboard");
    applyPatch({ story: { activeId: null } });

    location.hash = "#storyboard";

    const optionsModal = document.getElementById("settings");
    if (optionsModal) optionsModal.setAttribute("hidden", "");
  },

  enhanceUserDraft: async (draftText) => {
    if (!draftText) return null;
    const storyId = TurnManager.requireActive();

    // UI Feedback
    const submitBtn = document.querySelector("#story-form button[type='submit']");
    const inputField = document.querySelector("#story-form [name='message']");
    const originalText = inputField.value;

    if (submitBtn) submitBtn.disabled = true;
    inputField.disabled = true;
    inputField.value = "Ghostwriting...";

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildGhostwriter(draftText);

      const response = await generateStream({
        payload,
        signal: null
      });

      // Return full response including <think> block
      return response.trim();

    } catch (e) {
      console.error("Ghostwriter failed:", e);
      alert("Ghostwriter failed: " + e.message);
      return originalText; // Revert on failure
    } finally {
      inputField.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  }
};

export const StoryController = TurnManager;