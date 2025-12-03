// apps/rpglitch/js/story-controller.js
import { db } from "./db.js";
import { state, applyPatch } from "./store.js";
import { generateStream } from "./ai-service.js";
import { entities } from "./entities.js";
import { renderMessage, updatePortraits, setGameplayEntities } from "./views.js";
import { error } from "./utils.js";
import { ContextBuilder } from "./context-builder.js";
import { analyzeRejection, getDirectorInstruction } from "./variance.js";
// NEW: Import the Physics Engine
import { calculateDynamics } from "./physics.js";

export const StoryController = {
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

      await StoryController.loadMessages(story.id);

      const [ai, user] = await Promise.all([
        StoryController.getRealEntity(storyId, "character", story.aiCharacterId),
        StoryController.getRealEntity(storyId, "character", story.userCharacterId)
      ]);

      const world = await StoryController.getRealEntity(storyId, "world", story.worldId);

      updatePortraits(ai, user);
      setGameplayEntities(ai, user, world);

      await StoryController.render(story.id);

      if (world && world.signatureColour) {
        const colorMap = {
          pink: "236, 72, 153", emerald: "16, 185, 129", cyan: "6, 182, 212",
          orange: "249, 115, 22", purple: "168, 85, 247", default: "255, 255, 255"
        };
        const rgb = colorMap[world.signatureColour] || colorMap.default;
        document.documentElement.style.setProperty('--world-ambience-rgb', rgb);
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
      StoryController.getRealEntity(storyId, "character", story.aiCharacterId),
      StoryController.getRealEntity(storyId, "character", story.userCharacterId)
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
    const storyId = StoryController.requireActive();
    const story = state.story.byId[storyId];

    await db.messages.add({
      storyId,
      role: "user",
      type: "IC",
      text,
      createdAt: Date.now()
    });

    await StoryController.loadMessages(storyId);
    await StoryController.render(storyId);

    const typing = document.querySelector("#typing-indicator");
    if (typing) typing.hidden = false;

    let payloadMeta = null;

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();
      payloadMeta = payload.meta;

      console.log("[RPGlitch] System Prompt:", payload.system);

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      const response = await generateStream({ payload, signal: ctrl.signal });

      const aiChar = await entities.get("character", story.aiCharacterId);

      const aiMsgId = await db.messages.add({
        storyId,
        role: "ai",
        type: "IC",
        text: response,
        characterName: aiChar?.name || "Narrator",
        createdAt: Date.now()
      });

      await StoryController.loadMessages(storyId);
      await StoryController.render(storyId);
      applyPatch({ ui: { fsm: "done" } });

      if (payloadMeta && payloadMeta.triggerUpdate) {
        console.log(`[PROMETHEUS] Triggering background update linked to msg: ${aiMsgId}`);
        StoryController.runBackgroundUpdate(storyId, payloadMeta.updateTarget, aiMsgId);
      }

    } catch (e) {
      error("AI Error", e);
      applyPatch({ ui: { fsm: "error", lastError: e.message } });
      alert("AI Error: " + e.message);
    } finally {
      if (typing) typing.hidden = true;
    }
  },

  regenerate: async () => {
    const storyId = StoryController.requireActive();
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

    await StoryController.loadMessages(storyId);
    await StoryController.render(storyId);

    const typing = document.querySelector("#typing-indicator");
    if (typing) {
      typing.textContent = `Regenerating (${varianceKey})...`;
      typing.hidden = false;
    }

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildWithVariance(directorNote);

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      const response = await generateStream({ payload, signal: ctrl.signal });

      const aiChar = await entities.get("character", story.aiCharacterId);

      await db.messages.add({
        storyId,
        role: "ai",
        type: "IC",
        text: response,
        characterName: aiChar?.name || "Narrator",
        createdAt: Date.now()
      });

      await StoryController.loadMessages(storyId);
      await StoryController.render(storyId);
      applyPatch({ ui: { fsm: "done" } });

    } catch (e) {
      error("Regen Error", e);
      alert("Regen Failed: " + e.message);
    } finally {
      if (typing) typing.hidden = true;
    }
  },

  // --- UPDATED: BACKGROUND UPDATE LOGIC ---
  runBackgroundUpdate: async (storyId, targetType, linkedMessageId) => {
    try {
      const builder = new ContextBuilder(storyId);

      // 1. Fetch Entity (Explicitly needed here for physics calculation)
      const story = state.story.byId[storyId];
      if (!story) return;

      let entity = null;
      // We resolve the snapshot ID logic quickly here, mimicking getRealEntity logic partially
      // or we just fetch the snapshot directly via entities helper if we knew the ID.
      // Since we only have targetType, we rely on the builder logic or fetch manually:
      if (targetType === 'ai_character') entity = await entities.getSnapshot(storyId, "character", story.aiCharacterId) || await entities.get("character", story.aiCharacterId);
      else if (targetType === 'user_character') entity = await entities.getSnapshot(storyId, "character", story.userCharacterId) || await entities.get("character", story.userCharacterId);
      else if (targetType === 'world') entity = await entities.getSnapshot(storyId, "world", story.worldId) || await entities.get("world", story.worldId);

      if (!entity) return;

      // 2. >>>> RUN THE PHYSICS ENGINE <<<<
      // Calculate new dynamics based on current state + Hard Laws
      const oldDynamics = entity.dynamics || { entropy: 10, permeability: 50, velocity: 10, resonance: 10 };
      const newDynamics = calculateDynamics(oldDynamics);

      // 3. Generate Update Prompt (Passing Forced Dynamics)
      const payload = await builder.buildUpdater(targetType, newDynamics);
      const jsonResponse = await generateStream({ payload, signal: null });

      // 4. Liveness Check
      if (linkedMessageId) {
        const msgExists = await db.messages.get(linkedMessageId);
        if (!msgExists) {
          console.warn(`[PROMETHEUS] Aborting update. Msg ${linkedMessageId} deleted.`);
          return;
        }
      }

      let updates = {};
      try {
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
        // Fetch fresh to ensure no race condition, though we have 'entity' var
        const snapshot = await entities.get(payload.targetType, payload.targetEntityId);

        if (snapshot) {
          // 5. Create Backup for Rollback
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
            // FORCE THE PHYSICS ENGINE VALUES (Ignore LLM drift)
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

          // 6. >>>> THE ARCHIVIST TRIGGER <<<<
          const MAX_PAST_LENGTH = 2000;
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

    } catch (e) {
      console.error("[PROMETHEUS] Background update error:", e);
    }
  },

  generateOpening: async (storyId) => {
    const typing = document.querySelector("#typing-indicator");
    if (typing) { typing.textContent = "Generating opening..."; typing.hidden = false; }

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildOpening();

      console.log("[RPGlitch] Opening Prompt:", payload.system);

      const response = await generateStream({ payload, signal: null });

      await db.messages.add({
        storyId,
        role: "narrator",
        type: "OOC",
        text: response,
        createdAt: Date.now()
      });

      await StoryController.loadMessages(storyId);
      await StoryController.render(storyId);
    } catch (e) {
      error("Opening Gen Failed", e);
      alert("Failed to generate opening: " + e.message);
    } finally {
      if (typing) typing.hidden = true;
    }
  }
};