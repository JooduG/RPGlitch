// apps/rpglitch/js/manager-turns.js
import { db } from "./core-db.js";
import { state, applyPatch } from "./app-state.js";
import { generateStream } from "./llm-adapter.js";
import { entities } from "./entity-crud.js";
import { renderMessage, updatePortraits, setGameplayEntities, showTypingIndicator, removeTypingIndicator, setSendLock, applyWorldAmbience } from "./ui-render-chat.js"; // Renamed imports
import { error } from "./core-utils.js"; // Removed escapeHtml
import { ContextBuilder } from "./engine-prompt-builder.js"; // Renamed import
import { analyzeRejection, getDirectorInstruction } from "./engine-variance.js"; // Renamed import
import { calculateDynamics } from "./engine-physics.js"; // Renamed import

// Helper to create the structured debug log
function createPhysicsDebugLog(oldDynamics, newDynamics) {
  const flags = newDynamics._flags || {};
  let debugText = "[PHYSICS LOG]\n";
  debugText += `ENTROPY: ${newDynamics.entropy}% (was ${oldDynamics.entropy}%)\n`;
  debugText += `PERMEABILITY: ${newDynamics.permeability}% (was ${oldDynamics.permeability}%)\n`;
  debugText += `VELOCITY: ${newDynamics.velocity}% (was ${oldDynamics.velocity}%)\n`;
  debugText += `RESONANCE: ${newDynamics.resonance}% (was ${oldDynamics.resonance}%)\n\n`;

  if (flags.panicSpiral) debugText += ">> LAW 4: PANIC SPIRAL TRIGGERED (Velocity Forced Up)\n";
  if (flags.fogOfWar) debugText += ">> LAW 2: FOG OF WAR TRIGGERED (Resonance Dampened)\n";
  if (flags.echoChamber) debugText += ">> LAW 5: ECHO CHAMBER ACTIVE (Future Vector Critical)\n";
  if (flags.glassCannon) debugText += ">> LAW 6: GLASS CANNON ACTIVE (Double Impact Gain)\n";

  // Check for Adrenaline Shield/Cool-Down logs (from physics.js console.log)
  if (newDynamics.permeability < oldDynamics.permeability && newDynamics.velocity > 80) {
    debugText += ">> LAW 1: ADRENALINE SHIELD (Permeability Penalty)\n";
  }
  if (newDynamics.entropy < oldDynamics.entropy && newDynamics.velocity < 20) {
    debugText += ">> LAW 3: COOL-DOWN (Entropy Reduced)\n";
  }

  // Clean up empty space
  return debugText.trim();
}


export const TurnManager = {
  requireActive: () => {
    if (!state.story.activeId) throw new Error("No active story.");
    return state.story.activeId;
  },

  createFromSelection: async (data) => {
    const id = await db.stories.add({
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    const storyWithId = { ...data, id: id };
    applyPatch({ story: { activeId: id, byId: { [id]: storyWithId } } });
    return id;
  },

  getRealEntity: async (storyId, type, masterId) => {
    const snap = await entities.getSnapshot(storyId, type, masterId);
    return snap || await entities.get(type, masterId);
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
        TurnManager.getRealEntity(storyId, "character", story.aiCharacterId),
        TurnManager.getRealEntity(storyId, "character", story.userCharacterId)
      ]);

      const world = await TurnManager.getRealEntity(storyId, "world", story.worldId);

      updatePortraits(ai, user);
      setGameplayEntities(ai, user, world);

      await TurnManager.render(story.id);

      // --- PURIFIED: Ambience logic now uses a helper function (assumed to read CSS) ---
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

  render: async (storyId) => {
    const feed = document.querySelector("#chat-feed");
    if (!feed) return;

    const msgs = state.messages.byStoryId[storyId] || [];
    const story = state.story.byId[storyId];

    let [ai, user] = await Promise.all([
      TurnManager.getRealEntity(storyId, "character", story.aiCharacterId),
      TurnManager.getRealEntity(storyId, "character", story.userCharacterId)
    ]);

    feed.innerHTML = "";
    const noMsg = document.querySelector("#no-messages");

    if (msgs.length === 0) {
      if (noMsg) { noMsg.hidden = false; feed.appendChild(noMsg); }
      return;
    }

    if (noMsg) noMsg.hidden = true;

    msgs.forEach(m => renderMessage(
      feed,
      m.role,
      m.text,
      m.characterName,
      m.type || "IC",
      { aiCharacter: ai, userCharacter: user }
    ));

    feed.scrollTop = feed.scrollHeight;
  },

  send: async (text) => {
    if (!text) return;
    const storyId = TurnManager.requireActive();
    const story = state.story.byId[storyId];

    // 1. LOCK UI immediately
    setSendLock(true);

    try {
      await db.messages.add({
        storyId,
        role: "user",
        type: "IC",
        text,
        createdAt: Date.now()
      });

      await TurnManager.loadMessages(storyId);
      await TurnManager.render(storyId);

      // 2. SHOW TYPING BUBBLE (AI Style)
      const feed = document.querySelector("#chat-feed");
      showTypingIndicator(feed, 'ai', story.aiCharacterId);

      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();
      const payloadMeta = payload.meta;

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      // 3. GENERATE (Stream)
      // Pass onToken to remove bubble instantly when text appears
      const response = await generateStream({
        payload,
        signal: ctrl.signal,
        onToken: () => removeTypingIndicator(feed)
      });

      // Cleanup bubble just in case
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
      await TurnManager.render(storyId);
      applyPatch({ ui: { fsm: "done" } });

      // 4. BACKGROUND PHYSICS (Still Locked!)
      if (payloadMeta && payloadMeta.triggerUpdate) {
        console.log(`[PROMETHEUS] Running Physics... (UI Locked)`);
        // We await this so the lock persists
        await TurnManager.runBackgroundUpdate(storyId, payloadMeta.updateTarget, aiMsgId);
      }

    } catch (e) {
      error("AI Error", e);
      applyPatch({ ui: { fsm: "error", lastError: e.message } });
      alert("AI Error: " + e.message);
      // Clean up visual state on error
      const feed = document.querySelector("#chat-feed");
      if (feed) removeTypingIndicator(feed);
    } finally {
      // 5. UNLOCK UI (Always runs)
      setSendLock(false);
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

    // LOCK UI
    setSendLock(true);

    // === STATE ROLLBACK (Ghost Prevention) ===
    try {
      const allSnapshots = await db.entities.where("storyId").equals(storyId).toArray();

      for (const ent of allSnapshots) {
        if (ent._lastUpdateMsgId === lastMsg.id && ent._backupState) {
          console.log(`[PROMETHEUS] Rolling back state for ${ent.name} to prevent ghost memory.`);

          const restored = {
            ...ent,
            forever: ent._backupState.forever,
            past: ent._backupState.past,
            present: ent._backupState.present,
            future: ent._backupState.future,
            dynamics: ent._backupState.dynamics,
            // Clear backup logic
            _backupState: null,
            _lastUpdateMsgId: null
          };
          await entities.upsert(ent.type, restored);
        }
      }
    } catch (err) {
      console.warn("[PROMETHEUS] Rollback warning:", err);
    }

    await db.messages.delete(lastMsg.id);

    await TurnManager.loadMessages(storyId);
    await TurnManager.render(storyId);

    const feed = document.querySelector("#chat-feed");
    // Show AI bubble
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
      await TurnManager.render(storyId);
      applyPatch({ ui: { fsm: "done" } });

    } catch (e) {
      error("Regen Error", e);
      alert("Regen Failed: " + e.message);
      if (feed) removeTypingIndicator(feed);
    } finally {
      setSendLock(false); // UNLOCK
    }
  },

  runBackgroundUpdate: async (storyId, targetType, linkedMessageId) => {
    try {
      const builder = new ContextBuilder(storyId);

      const story = state.story.byId[storyId];
      if (!story) return;

      let entity = null;
      if (targetType === 'ai_character') entity = await entities.getSnapshot(storyId, "character", story.aiCharacterId) || await entities.get("character", story.aiCharacterId);
      else if (targetType === 'user_character') entity = await entities.getSnapshot(storyId, "character", story.userCharacterId) || await entities.get("character", story.userCharacterId);
      else if (targetType === 'world') entity = await entities.getSnapshot(storyId, "world", story.worldId) || await entities.get("world", story.worldId);

      if (!entity) return;

      // >>>> RUN THE PHYSICS ENGINE <<<<
      const oldDynamics = entity.dynamics || { entropy: 10, permeability: 50, velocity: 10, resonance: 10 };
      const newDynamics = calculateDynamics(oldDynamics);

      // >>> DIRECTOR MODE PHYSICS INJECTION (NEW) <<<
      if (state.settings.directorMode) {
        const debugText = createPhysicsDebugLog(oldDynamics, newDynamics);
        await db.messages.add({
          storyId,
          role: "system",
          type: "DEBUG", // New message type for styling
          text: debugText,
          createdAt: Date.now() + 1 // Ensures log is after the AI response
        });
      }

      const payload = await builder.buildUpdater(targetType, newDynamics);
      const jsonResponse = await generateStream({ payload, signal: null });

      // Liveness Check
      if (linkedMessageId) {
        const msgExists = await db.messages.get(linkedMessageId);
        if (!msgExists) {
          console.warn(`[PROMETHEUS] Aborting update. Msg ${linkedMessageId} deleted.`);
          return;
        }
      }

      let updates = {};
      try {
        // Attempt to parse the JSON. LLMs sometimes wrap it in markdown or text.
        const jsonMatch = jsonResponse.match(/\{[\s\S]*\}/);
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
        const snapshot = await entities.get(payload.targetType, payload.targetEntityId);

        if (snapshot) {
          const backup = {
            forever: snapshot.forever,
            past: snapshot.past,
            present: snapshot.present,
            future: snapshot.future,
            dynamics: snapshot.dynamics
          };

          const updatedSnapshot = {
            ...snapshot,
            forever: updates.forever || snapshot.forever,
            past: updates.past || snapshot.past,
            present: updates.present || snapshot.present,
            future: updates.future || snapshot.future,
            dynamics: {
              entropy: newDynamics.entropy,
              permeability: newDynamics.permeability,
              velocity: newDynamics.velocity,
              resonance: newDynamics.resonance
            },
            updatedAt: Date.now(),
            _backupState: backup,
            _lastUpdateMsgId: linkedMessageId
          };

          const MAX_PAST_LENGTH = 2000; // This should be moved to config.js
          if (updatedSnapshot.past && updatedSnapshot.past.length > MAX_PAST_LENGTH) {
            console.log(`[ARCHIVIST] Triggered for ${entity.name}. Size: ${updatedSnapshot.past.length}`);
            try {
              const archPayload = await builder.buildArchivist(updatedSnapshot);
              const summary = await generateStream({ payload: archPayload, signal: null });

              if (summary && summary.length < updatedSnapshot.past.length) {
                updatedSnapshot.past = summary.trim();
                console.log(`[ARCHIVIST] Compression complete. New Size: ${updatedSnapshot.past.length}`);
              }
            } catch (archErr) {
              console.warn("[ARCHIVIST] Failed:", archErr);
            }
          }

          await entities.upsert(payload.targetType, updatedSnapshot);
          console.log(`[PROMETHEUS] Update applied (Backup saved) for ${snapshot.name}`);
        }
      }

      // We must re-render to show the DEBUG message added above
      await TurnManager.loadMessages(storyId);
      await TurnManager.render(storyId);

    } catch (e) {
      console.error("[PROMETHEUS] Background update error:", e);
    }
  },

  generateOpening: async (storyId) => {
    // LOCK UI
    setSendLock(true);
    const feed = document.querySelector("#chat-feed");

    // Show NARRATOR bubble
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
      await TurnManager.render(storyId);
    } catch (e) {
      error("Opening Gen Failed", e);
      alert("Failed to generate opening: " + e.message);
      if (feed) removeTypingIndicator(feed);
    } finally {
      // UNLOCK UI
      setSendLock(false);
    }
  }
};

// Renaming for the new manager structure
export const StoryController = TurnManager;