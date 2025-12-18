import { db } from "../core/db.js";
import { state, applyPatch } from "../core/state.js";
import { generateStream } from "./llm.js";
import { entities } from "../data/repo.js";

import { error, calculateBlendedParams, log } from "../core/utils.js";
import { ContextBuilder } from "./prompter.js";
import { analyzeRejection, getDirectorInstruction } from "./variance.js";
import { bridge } from "./physics/bridge.js";
import { events, EVENTS } from "../core/events.js";
import { VisualManager } from "../ui/services/visuals.js";
import { IMG_RESOLUTION } from "../core/constants.js";

export const TurnManager = {
  requireActive: () => {
    if (!state.story.activeId) throw new Error("No active story.");
    return state.story.activeId;
  },

  createFromSelection: async (data) => {
    const [startAi, startUser, startFractal] = await Promise.all([
      entities.get("character", data.aiId),
      entities.get("character", data.userId),
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
      mode: "storymode",
    });

    events.dispatchEvent(new CustomEvent(EVENTS.STORY_LOADED));

    return id;
  },

  load: async (storyId) => {
    try {
      const story = await db.stories.get(storyId);
      if (!story) throw new Error("Story not found.");

      applyPatch({
        story: { activeId: story.id, byId: { [story.id]: story } },
        storyTitle: story.storyTitle,
        mode: "storymode",
      });

      await TurnManager.loadMessages(story.id);
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

    events.dispatchEvent(
      new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
    );
    await TurnManager.generateAiResponse(storyId);
  },

  editAiMessage: async (messageId, newText) => {
    const storyId = TurnManager.requireActive();
    await db.messages.update(messageId, { text: newText });
    await TurnManager.loadMessages(storyId);
    events.dispatchEvent(
      new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
    );
  },

  generateAiResponse: async (storyId, options = {}) => {
    options = options || {};
    const story = state.story.byId[storyId];
    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));

    try {
      events.dispatchEvent(
        new CustomEvent(EVENTS.TYPING_STARTED, {
          detail: { role: "ai", characterId: story.aiId },
        }),
      );

      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();

      // Inject Instruction if provided
      if (options.instruction) {
        payload.system += `\n\n${options.instruction}`;
      }

      const payloadMeta = payload.meta;

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      const [aiEntity, userEntity, fractalEntity] = await Promise.all([
        entities.get("character", story.aiId),
        entities.get("character", story.userId),
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
          onToken: () =>
            events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED)),
        });
      } catch (streamErr) {
        if (streamErr.name === "AbortError") throw streamErr;
        console.error("[TURN] Network/Gen Error:", streamErr);
        alert("Connection Error: The AI could not respond. Please try again.");
        throw streamErr;
      }

      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));

      // --- ATTACHMENT PIPELINE ---
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

        // 2. Clean Text (If NOT Developer Mode)
        if (!state.settings.developerMode) {
          finalResponseText = response.replace(visualMatch[0], "").trim();
        }
      }

      const aiChar = await entities.get("character", story.aiId);
      const userChar = await entities.get("character", story.userId);
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
        events.dispatchEvent(
          new CustomEvent(EVENTS.TYPING_STARTED, {
            detail: { role: "ai", characterId: story.aiId },
          }),
        );

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
            resolution: IMG_RESOLUTION,
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
          events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
        }
      }

      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );
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

      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
    } finally {
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  send: async (text) => {
    if (!text) return;
    const storyId = TurnManager.requireActive();
    const story = state.story.byId[storyId];

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));

    try {
      await db.messages.add({
        storyId,
        role: "user",
        type: "IC",
        text,
        createdAt: Date.now(),
      });

      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );

      events.dispatchEvent(
        new CustomEvent(EVENTS.TYPING_STARTED, {
          detail: { role: "ai", characterId: story.aiId },
        }),
      );

      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();
      const payloadMeta = payload.meta;

      const ctrl = new AbortController();
      applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

      const response = await generateStream({
        payload,
        signal: ctrl.signal,
        onToken: () =>
          events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED)),
      });

      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));

      const aiChar = await entities.get("character", story.aiId);
      const aiMsgId = await db.messages.add({
        storyId,
        role: "ai",
        type: "IC",
        text: response,
        characterName: aiChar?.name || "Narrator",
        createdAt: Date.now(),
      });

      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );
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

      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
    } finally {
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
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

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));

    await db.messages.delete(lastMsg.id);

    await TurnManager.loadMessages(storyId);
    events.dispatchEvent(
      new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
    );

    events.dispatchEvent(
      new CustomEvent(EVENTS.TYPING_STARTED, {
        detail: { role: "ai", characterId: story.aiId },
      }),
    );

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
          onToken: () =>
            events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED)),
        });
      } catch (streamErr) {
        if (streamErr.name === "AbortError") throw streamErr;
        console.error("[TURN] Regen Network Error:", streamErr);
        alert("Connection Error: Could not regenerate message.");
        throw streamErr;
      }
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));

      const aiChar = await entities.get("character", story.aiId);

      await db.messages.add({
        storyId,
        role: "ai",
        type: "IC",
        text: response,
        characterName: aiChar?.name || "Narrator",
        createdAt: Date.now(),
      });

      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );
      applyPatch({ ui: { fsm: "done" } });
    } catch (e) {
      error("Regen Error", e);
      alert("Regen Failed: " + e.message);
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
    } finally {
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
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
    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
    events.dispatchEvent(
      new CustomEvent(EVENTS.TYPING_STARTED, { detail: { role: "narrator" } }),
    );

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildOpening();

      // Handling for Null Payload (Text Protocol / Messenger)
      if (!payload) {
        log("[RPGlitch] No narrator opening. Triggering AI First Message.");
        events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
        // DO NOT UNLOCK YET.
        // Immediately trigger the AI character to write the first text.
        await TurnManager.generateAiResponse(storyId);
        return;
      }

      log("[RPGlitch] Opening Prompt:", payload.system);

      const response = await generateStream({
        payload,
        signal: null,
        onToken: () =>
          events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED)),
      });
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));

      await db.messages.add({
        storyId,
        role: "narrator",
        type: "OOC",
        text: response,
        createdAt: Date.now(),
      });

      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );

      await TurnManager.generateAiResponse(storyId);
    } catch (e) {
      error("Opening Gen Failed", e);
      alert("Failed to generate opening: " + e.message);
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
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
      entities.get("character", story.aiId),
      entities.get("character", story.userId),
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

    document.body.classList.remove("storymode");
    document.body.classList.add("mode-storyboard");
    applyPatch({ story: { activeId: null } });

    location.hash = "#storyboard";

    const optionsModal = document.getElementById("settings");
    if (optionsModal) optionsModal.setAttribute("hidden", "");
  },

  enhanceUserDraft: async (draftText) => {
    const storyId = TurnManager.requireActive();
    if (!storyId) return null;

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
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
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  generateVisualFromDraft: async (draftText) => {
    const storyId = TurnManager.requireActive();
    if (!storyId) return;

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));

    try {
      log("[TurnManager] Generating visual from draft:", draftText);

      const imageUrl = await VisualManager.generate(draftText, {
        resolution: IMG_RESOLUTION,
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
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );
    } catch (e) {
      error("[TurnManager] Image Gen failed:", e);
      alert("Failed to generate image. " + e.message);
    } finally {
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  regenerateMessageImage: async (messageId) => {
    const storyId = TurnManager.requireActive();
    const message = await db.messages.get(messageId);
    if (!message || !message.metadata || !message.metadata.visualPrompt) {
      console.warn("[TurnManager] Cannot reroll image: missing metadata.");
      return;
    }

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));

    // [UI] Set specific reroll state for visual feedback
    if (window.setRerollState) window.setRerollState(messageId, true);
    events.dispatchEvent(
      new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
    ); // Trigger re-render to show blur/spinner

    try {
      const { visualPrompt, targetType } = message.metadata;
      log(`[TurnManager] Rerolling Image: ${visualPrompt}`);

      const [aiChar, userChar, fractal] = await Promise.all([
        entities.get("character", state.story.byId[storyId].aiId),
        entities.get("character", state.story.byId[storyId].userId),
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
        resolution: IMG_RESOLUTION,
      });

      await db.messages.update(messageId, { attachmentUrl: imageUrl });

      // Clear reroll state before final render
      if (window.setRerollState) window.setRerollState(messageId, false);

      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );
    } catch (e) {
      error("[TurnManager] Reroll Image Failed:", e);
      alert("Failed to reroll image.");
      if (window.setRerollState) window.setRerollState(messageId, false);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      ); // Re-render to remove busy state on error
    } finally {
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  requestVisual: async () => {
    const storyId = TurnManager.requireActive();
    const story = state.story.byId[storyId];
    // Fetch entity to verify mode
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
    events.dispatchEvent(
      new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
    );

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

// End of Director

events.addEventListener(EVENTS.DB_UPDATED, async () => {
  const activeId = state.story.activeId;
  if (activeId) {
    await TurnManager.loadMessages(activeId);
  }
});
