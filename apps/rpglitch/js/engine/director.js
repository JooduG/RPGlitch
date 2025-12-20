import { db } from "../core/db.js";
import { state, applyPatch } from "../core/state.js";
import { LlmService } from "../services/llm-service.js"; // [NEW]
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
      events.dispatchEvent(new CustomEvent(EVENTS.STORY_LOADED));
    } catch (e) {
      error("Failed to load story:", e);
      throw e;
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

  // --- THE CORE PIPELINE ---

  /**
   * Centralized Turn Execution Method
   * Encapsulates the entire lifecycle: Signal -> Generate -> Parse -> Save -> Visuals -> Physics.
   */
  _executeTurn: async (storyId, payload, options = {}) => {
    // defaults
    const mode = options.mode || "create"; // 'create' | 'append'
    const appendTargetId = options.appendTargetId || null;

    const story = state.story.byId[storyId];

    // 1. SIGNAL: Typing Started
    // For append mode, we might still want to show typing? Yes.
    // For extend, we use the character ID.
    events.dispatchEvent(
      new CustomEvent(EVENTS.TYPING_STARTED, {
        detail: { role: "ai", characterId: story.aiId },
      }),
    );

    const ctrl = new AbortController();
    applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

    // Calculates generation parameters based on Entity Blending
    // Note: This logic was in generateAiResponse.
    // We assume payload.params covers the basics, but we might want to override with blended params.
    // Let's do blending if options says so, or always?
    // Original code did blending in `generateAiResponse`.
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
    // Explicit overrides from payload/logic take precedence? No, blended params are usually desired.
    // But LlmService priority: options > payload.params.
    // So we pass blended params as options to LlmService.
    const llmOptions = {
      ...genOptions,
      signal: ctrl.signal,
      onToken: () =>
        events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED)), // Stop flicker
    };

    log(
      `[PROMETHEUS] Vibe Check: Temp ${genOptions.temperature} | Speed ${genOptions.repetition_penalty}`,
    );

    try {
      // 2. GENERATE
      const response = await LlmService.generate(payload, llmOptions);

      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));

      // 3. PARSE
      let finalResponseText = response;
      let visualPrompt = null;
      let targetType = "ai"; // default

      // Regex captures: [1] = target (optional), [2] = prompt content
      const visualMatch = response.match(
        /<image_prompt(?:\s+target="([^"]+)")?>(.*?)<\/image_prompt>/i,
      );

      if (visualMatch) {
        if (visualMatch[1]) targetType = visualMatch[1].toLowerCase();
        visualPrompt = visualMatch[2].trim();

        // Clean Text (If NOT Developer Mode)
        if (!state.settings.developerMode) {
          finalResponseText = response.replace(visualMatch[0], "").trim();
        }
      }

      // 4. SAVE
      let aiMsgId;
      const aiChar = await entities.get("character", story.aiId);

      if (mode === "append" && appendTargetId) {
        // Append Logic
        const originalMsg = await db.messages.get(appendTargetId);
        if (!originalMsg) throw new Error("Cannot append: Message not found");

        // We append the new text (already parsed/cleaned)
        const fullText = originalMsg.text + " " + finalResponseText;
        await db.messages.update(appendTargetId, { text: fullText });
        aiMsgId = appendTargetId;

        // Note: If visual prompt detected during append, it updates/overwrites attachment
        if (visualPrompt) {
          // We schedule it for the Visual Step
        }
      } else {
        // Create Logic
        aiMsgId = await db.messages.add({
          storyId,
          role: "ai",
          type: "IC",
          text: finalResponseText,
          characterName: aiChar?.name || "Narrator",
          createdAt: Date.now(),
          attachmentUrl: null, // Placeholder
        });
      }

      // 5. VISUALS
      if (visualPrompt) {
        events.dispatchEvent(
          new CustomEvent(EVENTS.TYPING_STARTED, {
            detail: { role: "ai", characterId: story.aiId },
          }),
        );

        log(
          `[PROMETHEUS] Detected Visual Prompt: ${visualPrompt} (Target: ${targetType})`,
        );

        let targetEntity = aiChar;
        if (targetType === "user") targetEntity = userEntity;
        if (targetType === "fractal") targetEntity = fractalEntity;

        try {
          const fluxPrompt = await VisualManager.composePrompt(
            targetEntity,
            "photorealistic",
            visualPrompt,
            { isMessenger: true },
          );

          const imageUrl = await VisualManager.generate(fluxPrompt, {
            resolution: IMG_RESOLUTION,
          });

          await db.messages.update(aiMsgId, {
            attachmentUrl: imageUrl,
            metadata: { visualPrompt, targetType },
          });
        } catch (visErr) {
          console.error("[PROMETHEUS] Auto-Visual Failed:", visErr);
        } finally {
          events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
        }
      }

      // 6. PHYSICS
      const payloadMeta = payload.meta;
      if (payloadMeta && payloadMeta.triggerUpdate) {
        TurnManager.runBackgroundUpdate(
          storyId,
          payloadMeta.updateTarget,
          aiMsgId,
        );
      }

      // Finish Up
      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );
      applyPatch({ ui: { fsm: "done" } });
    } catch (e) {
      if (e.name === "AbortError") throw e;
      error("Execution Error", e);
      window.dispatchEvent(
        new CustomEvent("app-error", {
          detail: { error: e, type: "generation" },
        }),
      );
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
      applyPatch({ ui: { fsm: "error" } }); // Should we set error state?
    } finally {
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  // --- PUBLIC METHODS REFACTORED ---

  generateAiResponse: async (storyId, options = {}) => {
    options = options || {};
    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();

      // Inject Instruction if provided
      if (options.instruction) {
        payload.system += `\n\n${options.instruction}`;
      }

      await TurnManager._executeTurn(storyId, payload, { mode: "create" });
    } catch (e) {
      error("Context Build Error", e);
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  send: async (text) => {
    if (!text) return;
    const storyId = TurnManager.requireActive();

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));

    // Save User Msg
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

      // Build & Execute
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();

      await TurnManager._executeTurn(storyId, payload, { mode: "create" });
    } catch (e) {
      error("Send Error", e);
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  regenerate: async (manualInstruction = null) => {
    const storyId = TurnManager.requireActive();
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

    let directorNote;
    if (manualInstruction === "VANILLA") {
      log(`[PROMETHEUS] Regenerating with VANILLA strategy (No Variance).`);
      directorNote = null;
    } else if (manualInstruction) {
      log(
        `[PROMETHEUS] Regenerating with Manual Instruction: ${manualInstruction}`,
      );
      directorNote = `[SYSTEM: DIRECTOR_OVERRIDE]\nDirective: ${manualInstruction}`;
    } else {
      const varianceKey = analyzeRejection(lastMsg.text, userText);
      directorNote = getDirectorInstruction(varianceKey);
      log(`[PROMETHEUS] Regenerating with strategy: ${varianceKey}`);
    }

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));

    // Delete Last Msg
    await db.messages.delete(lastMsg.id);
    await TurnManager.loadMessages(storyId);
    events.dispatchEvent(
      new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
    );

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildWithVariance(directorNote);

      await TurnManager._executeTurn(storyId, payload, { mode: "create" });
    } catch (e) {
      error("Regen Setup Error", e);
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  extendAiResponse: async () => {
    const storyId = TurnManager.requireActive();
    const msgs = state.messages.byStoryId[storyId] || [];
    if (msgs.length === 0) return;

    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg.role !== "ai" && lastMsg.role !== "narrator") {
      console.warn("Cannot extend non-AI message.");
      return;
    }

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();

      payload.system +=
        "\n\n[SYSTEM: CONTINUATION_PROTOCOL]\nContinue the narrative immediately from the last sentence. Do not repeat text. Do not generate a <think> block. Just write the next paragraph.";

      await TurnManager._executeTurn(storyId, payload, {
        mode: "append",
        appendTargetId: lastMsg.id,
      });
    } catch (e) {
      error("Extend Error", e);
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

      if (!payload) {
        log("[RPGlitch] No narrator opening. Triggering AI First Message.");
        events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
        await TurnManager.generateAiResponse(storyId);
        return;
      }

      log("[RPGlitch] Opening Prompt:", payload.system);

      // Using LlmService directly here as parsing rules differ for Narrator OOC
      const response = await LlmService.generate(payload, {
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
      window.dispatchEvent(
        new CustomEvent("app-error", {
          detail: { error: e, type: "generation" },
        }),
      );
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  concludeStory: async () => {
    const storyId = TurnManager.requireActive();

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
    events.dispatchEvent(
      new CustomEvent(EVENTS.TYPING_STARTED, { detail: { role: "narrator" } }),
    );

    try {
      // 1. Generate Epilogue
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();

      payload.system += `\n\n[SYSTEM: NARRATIVE_CONCLUSION_PROTOCOL]
<DIRECTIVE>
The user has decided to end the story.
Generate a definitive, narrative epilogue (2-3 paragraphs).
Wrap up loose ends based on the current state.
Do not ask for further input.
Values: Melancholy, hopeful, or dramatic (match the Fractal vibes).
</DIRECTIVE>`;

      const response = await LlmService.generate(payload, {
        onToken: () =>
          events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED)),
      });

      // 2. Save Epilogue
      await db.messages.add({
        storyId,
        role: "narrator",
        type: "OOC",
        text: response,
        createdAt: Date.now(),
        isEpilogue: true,
      });

      // 3. Update Story Body
      const story = state.story.byId[storyId];
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

      const updatedStory = await db.stories.get(storyId);
      applyPatch({ story: { byId: { [storyId]: updatedStory } } });

      // 4. Refresh UI
      await TurnManager.loadMessages(storyId);

      const { renderChat } = await import("../ui/components/chat/feed.js");
      await renderChat(storyId);
    } catch (e) {
      error("Epilogue Failed", e);
      window.dispatchEvent(
        new CustomEvent("app-error", { detail: { error: e, type: "network" } }),
      );
    } finally {
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
    }
  },

  enhanceUserDraft: async (draftText) => {
    const storyId = TurnManager.requireActive();
    if (!storyId) return null;

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildGhostwriter(draftText);

      // Using LlmService directly
      const response = await LlmService.generate(payload, {});

      return response.trim().replace(/^"|"$/g, "");
    } catch (e) {
      error("[TurnManager] Ghostwrite error:", e);
      window.dispatchEvent(
        new CustomEvent("app-error", {
          detail: { error: e, type: "generation" },
        }),
      );
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
      window.dispatchEvent(
        new CustomEvent("app-error", {
          detail: { error: e, type: "generation" },
        }),
      );
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

    if (window.setRerollState) window.setRerollState(messageId, true);
    events.dispatchEvent(
      new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
    );

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

      if (window.setRerollState) window.setRerollState(messageId, false);

      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );
    } catch (e) {
      error("[TurnManager] Reroll Image Failed:", e);
      window.dispatchEvent(
        new CustomEvent("app-error", {
          detail: { error: e, type: "generation" },
        }),
      );
      if (window.setRerollState) window.setRerollState(messageId, false);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );
    } finally {
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  requestVisual: async () => {
    const storyId = TurnManager.requireActive();
    const story = state.story.byId[storyId];
    const fractal = story
      ? await entities.get("fractal", story.fractalId)
      : null;
    const isMessenger =
      fractal &&
      (fractal.name === "Messenger" ||
        (fractal.simulation &&
          fractal.simulation.directorMode === "TEXT_PROTOCOL"));

    if (!isMessenger) {
      window.dispatchEvent(
        new CustomEvent("app-error", {
          detail: {
            error: new Error(
              "Feature unavailable. This feature is only available in Messenger Mode.",
            ),
            type: "feature-unavailable",
          },
        }),
      );
      return;
    }

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

events.addEventListener(EVENTS.DB_UPDATED, async () => {
  const activeId = state.story.activeId;
  if (activeId) {
    await TurnManager.loadMessages(activeId);
  }
});
