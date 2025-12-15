import { db } from "./core-db.js";
import { state, applyPatch } from "./app-state.js";
import { generateStream } from "./llm-adapter.js";
import { entities } from "./entity-crud.js";
import {
  renderChat,
  setGameplayEntities,
  showTypingIndicator,
  removeTypingIndicator,
  setSendLock,
  setChatGeneratingState,
} from "./ui-chat-feed.js";
import { updatePortraits, applyFractalAmbience } from "./ui-chat-visuals.js";

import { error, calculateBlendedParams, log } from "./core-utils.js";
import { ContextBuilder } from "./engine-prompt-builder.js";
import { analyzeRejection, getDirectorInstruction } from "./engine-variance.js";
import { bridge } from "./worker-bridge.js";
import { events, EVENTS } from "./core-events.js";
import { VisualManager } from "./manager-visuals.js";

export const TurnManager = {
  requireActive: () => {
    if (!state.story.activeId) throw new Error("No active story.");
    return state.story.activeId;
  },

  createFromSelection: async (data) => {
    const [startAi, startUser, startFractal] = await Promise.all([
      entities.get("character", data.aiCharacterId),
      entities.get("character", data.userCharacterId),
      entities.get("fractal", data.fractalId),
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
          fractal: startFractal,
        },
        end: null,
      },
    });

    const storyWithId = { ...data, id: id };

    applyPatch({
      story: { activeId: id, byId: { [id]: storyWithId } },
      mode: "gameplay",
    });

    updatePortraits(startAi, startUser);
    setGameplayEntities(startAi, startUser, startFractal);
    if (startFractal) applyFractalAmbience(startFractal);

    return id;
  },

  load: async (storyId) => {
    try {
      const story = await db.stories.get(storyId);
      if (!story) throw new Error("Story not found.");

      applyPatch({
        story: { activeId: story.id, byId: { [story.id]: story } },
        storyTitle: story.storyTitle,
        mode: "gameplay",
      });

      await TurnManager.loadMessages(story.id);

      const [ai, user] = await Promise.all([
        entities.get("character", story.aiCharacterId),
        entities.get("character", story.userCharacterId),
      ]);

      let fractal = await entities.get("fractal", story.fractalId);
      // Fallback removed for strict mode

      updatePortraits(ai, user);
      setGameplayEntities(ai, user, fractal);

      events.dispatchEvent(new CustomEvent(EVENTS.STORY_LOADED));

      if (fractal) {
        applyFractalAmbience(fractal);
      }

      document.body.classList.remove("mode-storyboard");
      document.body.classList.add("mode-gameplay");
    } catch (e) {
      error("Failed to load story:", e);
      alert("Could not load story.");
    }
  },

  loadMessages: async (storyId) => {
    const msgs = await db.messages
      .where("storyId")
      .equals(storyId)
      .sortBy("createdAt");
    applyPatch({ messages: { byStoryId: { [storyId]: msgs } } });
    return msgs;
  },

  editUserMessage: async (messageId, newText) => {
    const storyId = TurnManager.requireActive();
    await db.messages.update(messageId, { text: newText });

    const msgs = await db.messages
      .where("storyId")
      .equals(storyId)
      .sortBy("createdAt");
    const msgIndex = msgs.findIndex((m) => m.id === messageId);

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

  generateAiResponse: async (storyId, options = {}) => {
    const story = state.story.byId[storyId];
    setSendLock(true);
    setChatGeneratingState(true);

    try {
      const feed = document.querySelector("#chat-feed");
      showTypingIndicator(feed, "ai", story.aiCharacterId);

      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();

      // [NEW] Inject Instruction if provided (e.g. Request Photo)
      if (options.instruction) {
        payload.system += `\n\n${options.instruction}`;
      }

      const payloadMeta = payload.meta;

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      const [aiEntity, userEntity, fractalEntity] = await Promise.all([
        entities.get("character", story.aiCharacterId),
        entities.get("character", story.userCharacterId),
        entities.get("fractal", story.fractalId),
      ]);

      const genOptions = calculateBlendedParams(
        aiEntity,
        userEntity,
        fractalEntity,
      );
      log(
        `[PROMETHEUS] Vibe Check: Temp ${genOptions.temperature} | Speed ${genOptions.repetition_penalty} | Focus ${genOptions.top_p}`,
      );

      let response;
      try {
        response = await generateStream({
          payload,
          options: genOptions,
          signal: ctrl.signal,
          onToken: () => removeTypingIndicator(feed),
        });
      } catch (streamErr) {
        if (streamErr.name === "AbortError") throw streamErr;
        console.error("[TURN] Network/Gen Error:", streamErr);
        alert("Connection Error: The AI could not respond. Please try again.");
        throw streamErr;
      }

      removeTypingIndicator(feed);

      // --- [NEW] ATTACHMENT PIPELINE ---
      let finalResponseText = response;
      let visualPrompt = null;

      // 1. Detect Tag (Supported: <image_prompt target="USER">...)
      // Regex captures: [1] = target (optional), [2] = prompt content
      const visualMatch = response.match(
        /<image_prompt(?:\s+target="([^"]+)")?>(.*?)<\/image_prompt>/i,
      );

      let targetType = "ai"; // Default

      if (visualMatch) {
        if (visualMatch[1]) targetType = visualMatch[1].toLowerCase();
        visualPrompt = visualMatch[2].trim();

        // 2. Clean Text (If NOT Director Mode)
        if (!state.settings.directorMode) {
          finalResponseText = response.replace(visualMatch[0], "").trim();
        }
      }

      const aiChar = await entities.get("character", story.aiCharacterId);
      const userChar = await entities.get("character", story.userCharacterId);
      const fractal = await entities.get("fractal", story.fractalId);

      // 3. Save Message (Cleaned)
      const aiMsgId = await db.messages.add({
        storyId,
        role: "ai",
        type: "IC",
        text: finalResponseText,
        characterName: aiChar?.name || "Narrator",
        createdAt: Date.now(),
        attachmentUrl: null, // Placeholder
      });

      // 4. Generate & Attach (Async, post-save)
      if (visualPrompt) {
        // [UX] Show busy indicator for visual generation
        showTypingIndicator(feed, "ai", story.aiCharacterId);

        log(
          `[PROMETHEUS] Detected Visual Prompt: ${visualPrompt} (Target: ${targetType})`,
        );

        // Determine Entity
        let targetEntity = aiChar;
        if (targetType === "user") targetEntity = userChar;
        if (targetType === "fractal") targetEntity = fractal;

        try {
          // A. Compose Flux Prompt (Messenger Style)
          const fluxPrompt = await VisualManager.composePrompt(
            targetEntity,
            "photorealistic",
            visualPrompt,
            { isMessenger: true },
          );

          // B. Generate Image
          const imageUrl = await VisualManager.generate(fluxPrompt, {
            resolution: "512x768",
          });

          // C. Update DB
          await db.messages.update(aiMsgId, {
            attachmentUrl: imageUrl,
            metadata: { visualPrompt, targetType },
          });
        } catch (visErr) {
          console.error("[PROMETHEUS] Auto-Visual Failed:", visErr);
          // We fail silently on the image, the text is already saved.
        } finally {
          removeTypingIndicator(feed);
        }
      }

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);
      applyPatch({ ui: { fsm: "done" } });

      if (payloadMeta && payloadMeta.triggerUpdate) {
        TurnManager.runBackgroundUpdate(
          storyId,
          payloadMeta.updateTarget,
          aiMsgId,
        );
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
        createdAt: Date.now(),
      });

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);

      const feed = document.querySelector("#chat-feed");
      showTypingIndicator(feed, "ai", story.aiCharacterId);

      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();
      const payloadMeta = payload.meta;

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      const response = await generateStream({
        payload,
        signal: ctrl.signal,
        onToken: () => removeTypingIndicator(feed),
      });

      removeTypingIndicator(feed);

      const aiChar = await entities.get("character", story.aiCharacterId);
      const aiMsgId = await db.messages.add({
        storyId,
        role: "ai",
        type: "IC",
        text: response,
        characterName: aiChar?.name || "Narrator",
        createdAt: Date.now(),
      });

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);
      applyPatch({ ui: { fsm: "done" } });

      if (payloadMeta && payloadMeta.triggerUpdate) {
        log(`[PROMETHEUS] Running Physics... (Background)`);
        TurnManager.runBackgroundUpdate(
          storyId,
          payloadMeta.updateTarget,
          aiMsgId,
        );
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

    const lastUserMsg = msgs
      .slice()
      .reverse()
      .find((m) => m.role === "user");
    const userText = lastUserMsg ? lastUserMsg.text : "";

    const varianceKey = analyzeRejection(lastMsg.text, userText);
    const directorNote = getDirectorInstruction(varianceKey);

    log(`[PROMETHEUS] Regenerating with strategy: ${varianceKey}`);

    setSendLock(true);
    setChatGeneratingState(true);

    await db.messages.delete(lastMsg.id);

    await TurnManager.loadMessages(storyId);
    await renderChat(storyId);

    const feed = document.querySelector("#chat-feed");
    showTypingIndicator(feed, "ai", story.aiCharacterId);

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildWithVariance(directorNote);

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      let response;
      try {
        response = await generateStream({
          payload,
          signal: ctrl.signal,
          onToken: () => removeTypingIndicator(feed),
        });
      } catch (streamErr) {
        if (streamErr.name === "AbortError") throw streamErr;
        console.error("[TURN] Regen Network Error:", streamErr);
        alert("Connection Error: Could not regenerate message.");
        throw streamErr;
      }
      removeTypingIndicator(feed);

      const aiChar = await entities.get("character", story.aiCharacterId);

      await db.messages.add({
        storyId,
        role: "ai",
        type: "IC",
        text: response,
        characterName: aiChar?.name || "Narrator",
        createdAt: Date.now(),
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
      log(`[PROMETHEUS] Offloading update to Worker...`);
      await bridge.runBackgroundUpdate(storyId, targetType, linkedMessageId);
    } catch (e) {
      console.error("[PROMETHEUS] Background update error:", e);
    }
  },

  generateOpening: async (storyId) => {
    setChatGeneratingState(true);
    setSendLock(true);
    const feed = document.querySelector("#chat-feed");
    showTypingIndicator(feed, "narrator");

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildOpening();

      // [FIX] Handling for Null Payload (Text Protocol / Messenger)
      if (!payload) {
        console.log(
          "[RPGlitch] No narrator opening. Triggering AI First Message.",
        );
        removeTypingIndicator(feed);
        // DO NOT UNLOCK YET.
        // Immediately trigger the AI character to write the first text.
        await TurnManager.generateAiResponse(storyId);
        return;
      }

      log("[RPGlitch] Opening Prompt:", payload.system);

      const response = await generateStream({
        payload,
        signal: null,
        onToken: () => removeTypingIndicator(feed),
      });
      removeTypingIndicator(feed);

      await db.messages.add({
        storyId,
        role: "narrator",
        type: "OOC",
        text: response,
        createdAt: Date.now(),
      });

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);

      await TurnManager.generateAiResponse(storyId);
    } catch (e) {
      error("Opening Gen Failed", e);
      alert("Failed to generate opening: " + e.message);
      if (feed) removeTypingIndicator(feed);
      setSendLock(false);
    }
  },

  concludeStory: async () => {
    const storyId = TurnManager.requireActive();
    const story = state.story.byId[storyId];

    if (
      !confirm(
        "Conclude this story? The current state of your entities will be saved to the library.",
      )
    )
      return;

    const [endAi, endUser, endFractal] = await Promise.all([
      entities.get("character", story.aiCharacterId),
      entities.get("character", story.userCharacterId),
      entities.get("fractal", story.fractalId),
    ]);

    await db.stories.update(storyId, {
      isConcluded: 1,
      concludedAt: Date.now(),
      "snapshots.end": {
        ai: endAi,
        user: endUser,
        fractal: endFractal,
      },
    });

    document.body.classList.remove("mode-gameplay");
    document.body.classList.add("mode-storyboard");
    applyPatch({ story: { activeId: null } });

    location.hash = "#storyboard";

    const optionsModal = document.getElementById("settings");
    if (optionsModal) optionsModal.setAttribute("hidden", "");
  },

  enhanceUserDraft: async (draftText) => {
    const storyId = TurnManager.requireActive();
    if (!storyId) return null;

    setChatGeneratingState(true);
    setSendLock(true, true);
    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildGhostwriter(draftText);

      const response = await generateStream({
        payload,
        onChunk: () => {},
      });

      return response.trim().replace(/^"|"$/g, "");
    } catch (e) {
      error("[TurnManager] Ghostwrite error:", e);
      alert("Ghostwriter failed. Please try again.");
      return null;
    } finally {
      setChatGeneratingState(false);
      setSendLock(false);
    }
  },

  generateVisualFromDraft: async (draftText) => {
    const storyId = TurnManager.requireActive();
    if (!storyId) return;

    setChatGeneratingState(true);
    setSendLock(true);

    try {
      log("[TurnManager] Generating visual from draft:", draftText);

      const imageUrl = await VisualManager.generate(draftText, {
        resolution: "512x768",
      });

      await db.messages.add({
        storyId,
        role: "narrator",
        type: "IMAGE",
        text: imageUrl,
        metadata: { prompt: draftText },
        timestamp: Date.now(),
      });

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);
    } catch (e) {
      error("[TurnManager] Image Gen failed:", e);
      alert("Failed to generate image. " + e.message);
    } finally {
      setChatGeneratingState(false);
      setSendLock(false);
    }
  },

  regenerateMessageImage: async (messageId) => {
    const storyId = TurnManager.requireActive();
    const message = await db.messages.get(messageId);
    if (!message || !message.metadata || !message.metadata.visualPrompt) {
      console.warn("[TurnManager] Cannot reroll image: missing metadata.");
      return;
    }

    setChatGeneratingState(true);
    setSendLock(true);

    // [UI] Set specific reroll state for visual feedback
    if (window.setRerollState) window.setRerollState(messageId, true);
    await renderChat(storyId); // Trigger re-render to show blur/spinner

    try {
      const { visualPrompt, targetType } = message.metadata;
      log(`[TurnManager] Rerolling Image: ${visualPrompt}`);

      const [aiChar, userChar, fractal] = await Promise.all([
        entities.get("character", state.story.byId[storyId].aiCharacterId),
        entities.get("character", state.story.byId[storyId].userCharacterId),
        entities.get("fractal", state.story.byId[storyId].fractalId),
      ]);

      let targetEntity = aiChar;
      if (targetType === "user") targetEntity = userChar;
      if (targetType === "fractal") targetEntity = fractal;

      const fluxPrompt = await VisualManager.composePrompt(
        targetEntity,
        "photorealistic",
        visualPrompt,
        { isMessenger: true },
      );

      const imageUrl = await VisualManager.generate(fluxPrompt, {
        resolution: "512x768",
      });

      await db.messages.update(messageId, { attachmentUrl: imageUrl });

      // Clear reroll state before final render
      if (window.setRerollState) window.setRerollState(messageId, false);

      await TurnManager.loadMessages(storyId);
      await renderChat(storyId);
    } catch (e) {
      error("[TurnManager] Reroll Image Failed:", e);
      alert("Failed to reroll image.");
      if (window.setRerollState) window.setRerollState(messageId, false);
      await renderChat(storyId); // Re-render to remove busy state on error
    } finally {
      setChatGeneratingState(false);
      setSendLock(false);
    }
  },

  requestVisual: async () => {
    const storyId = TurnManager.requireActive();
    const story = state.story.byId[storyId];
    // [FIX] Fetch entity to verify mode
    const fractal = story
      ? await entities.get("fractal", story.fractalId)
      : null;
    const isMessenger =
      fractal &&
      (fractal.name === "Messenger" ||
        (fractal.simulation &&
          fractal.simulation.directorMode === "TEXT_PROTOCOL"));

    if (!isMessenger) {
      alert("This feature is only available in Messenger Mode.");
      return;
    }

    // [UX] Insert Generic User Message
    const prompts = [
      "Send me a pic!",
      "Show me.",
      "Send a photo?",
      "Can I see?",
      "Pics or it didn't happen.",
    ];
    const text = prompts[Math.floor(Math.random() * prompts.length)];

    await db.messages.add({
      storyId,
      role: "user",
      type: "IC",
      text,
      createdAt: Date.now(),
    });

    await TurnManager.loadMessages(storyId);
    await renderChat(storyId);

    // [LOGIC] Dynamic Permeability Check
    // For now we assume the engine handles the "willingness" via personality,
    // but we inject the constraint that they MUST send one.
    const instruction = `
<DIRECTOR_OVERRIDE>
ACTION: Send a photo now.
FORMAT: Write the message text, then include <image_prompt target="AI|USER|FRACTAL">Description of the photo</image_prompt>.
Use target="AI" for yourself, "USER" for the other person, or "FRACTAL" for the environment.
EXAMPLE: "Here it is! <image_prompt target="AI">Selfie in the mirror, holding phone, flash on</image_prompt>"
</DIRECTOR_OVERRIDE>`;

    await TurnManager.generateAiResponse(storyId, { instruction });
  },
};

export const StoryController = TurnManager;

events.addEventListener(EVENTS.DB_UPDATED, async () => {
  const activeId = state.story.activeId;
  if (activeId) {
    await TurnManager.loadMessages(activeId);
  }
});
