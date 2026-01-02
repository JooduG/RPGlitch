import { db } from "../core/db.js";
import { state, applyPatch } from "../core/state.js";
import { LlmService } from "../services/llm-service.js";
import { entities } from "../data/repo.js";

import { error, calculateBlendedParams, log } from "../core/utils.js";
import { ContextBuilder } from "./prompter.js";
import { calculateDynamics } from "./physics/main.js";
import { analyzeRejection, getDirectorInstruction } from "./variance.js";
// import { bridge } from "./physics/bridge.js";
import { events, EVENTS } from "../core/events.js";
import { VisualManager } from "../ui/services/visuals.js";
import {
  IMG_RESOLUTION,
  ERROR_MESSAGES,
  ROLES,
  REFUSAL_TRIGGERS,
  DEFAULT_COLORS,
} from "../core/constants.js";

const MAX_STREAM_RETRIES = 3;

// --- INTERNAL HELPERS ---

/**
 * Parses the raw AI response to extract visual prompts and clean technical artifacts.
 */
const parseAiResponse = (response) => {
  let text = response
    .replace(/STOP SEQUENCE.*$/i, "")
    .replace(/STOP PROTOCOL.*$/i, "")
    .replace(/\(Glitch must react\).*$/i, "")
    // Nuclear Option: Strip Meta-Labels from Narrative
    .replace(
      /(?:^|\n)(?:The )?(?:Hook|Result|Scene|Analysis|Meta|Response):\s*/gi,
      "$1",
    )
    .trim();

  let visualPrompt = null;
  let targetType = ROLES.AI;

  const visualMatch = response.match(
    /<image_prompt(?:\s+target="([^"]+)")?>([\s\S]*?)<\/image_prompt>/i,
  );

  if (visualMatch) {
    if (visualMatch[1]) targetType = visualMatch[1].toLowerCase();
    visualPrompt = visualMatch[2].trim();
    text = response.replace(visualMatch[0], "").trim();
    // Inject custom delimiters for UI parsing
    text += `\n\n<image_prompt>${visualPrompt}</image_prompt>`;
  }

  return { text, visualPrompt, targetType };
};

export const TurnManager = {
  requireActive: () => {
    if (!state.story.activeId) {
      console.error(
        "[TurnManager] requireActive failed. Current state:",
        state,
      );
      throw new Error("No active story.");
    }
    return state.story.activeId;
  },

  _checkRefusal: (text) => {
    if (!text || text.length < 15) return true;
    const clean = text.toLowerCase();
    return REFUSAL_TRIGGERS.some((m) => clean.includes(m)) && text.length < 300;
  },

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

    localStorage.setItem("rpglitch_active_story", id);
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

      localStorage.setItem("rpglitch_active_story", story.id);
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
  _handleVisuals: async (storyId, visualPrompt, targetType) => {
    const story = state.story.byId[storyId];
    let targetRole = ROLES.AI;
    let targetId = story.aiId;

    if (targetType === ROLES.FRACTAL) {
      targetRole = ROLES.FRACTAL;
      targetId = story.fractalId;
    }

    events.dispatchEvent(
      new CustomEvent(EVENTS.TYPING_STARTED, {
        detail: { role: targetRole, characterId: targetId },
      }),
    );

    try {
      const builder = new ContextBuilder(storyId);
      let vTarget = "character";
      if (targetType === ROLES.FRACTAL || targetType === "scene")
        vTarget = "scene";

      const vPayload = await builder.buildVisualizer(vTarget);
      vPayload.system += `\n<RAW_INTENT>\n${visualPrompt}\n</RAW_INTENT>`;

      const refinedPrompt = await LlmService.generate(vPayload, {
        maxTokens: 300,
        temperature: 0.7,
      });

      const imageUrl = await VisualManager.generate(refinedPrompt, {
        resolution: IMG_RESOLUTION,
      });

      return { imageUrl, refinedPrompt };
    } catch (visErr) {
      error("[PROMETHEUS] Auto-Visual Failed:", visErr);
      return { imageUrl: null, refinedPrompt: null };
    } finally {
      events.dispatchEvent(
        new CustomEvent(EVENTS.TYPING_STOPPED, {
          detail: { role: targetRole, characterId: targetId },
        }),
      );
    }
  },

  _executeTurn: async (storyId, payload, options = {}) => {
    const mode = options.mode || "create";
    const appendTargetId = options.appendTargetId || null;
    const retryCount = options.retryCount || 0;
    const story = state.story.byId[storyId];

    // 1. SIGNAL
    const signalRole = options.ghostwrite ? ROLES.USER : ROLES.AI;
    const signalId = options.ghostwrite ? story.userId : story.aiId;

    events.dispatchEvent(
      new CustomEvent(EVENTS.TYPING_STARTED, {
        detail: { role: signalRole, characterId: signalId },
      }),
    );

    const ctrl = new AbortController();
    applyPatch({ ui: { fsm: "sending", abortController: ctrl } });

    const [aiEntity, userEntity, fractalEntity] = await Promise.all([
      entities.get("character", story.aiId),
      entities.get("character", story.userId),
      entities.get(ROLES.FRACTAL, story.fractalId),
    ]);

    const llmOptions = {
      ...calculateBlendedParams(aiEntity, userEntity, fractalEntity),
      signal: ctrl.signal,
    };

    try {
      let attempts = 0;
      const MAX_ATTEMPTS = 3;

      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        try {
          // 2. GENERATE
          const response = await LlmService.generate(payload, llmOptions);
          events.dispatchEvent(
            new CustomEvent(EVENTS.TYPING_STOPPED, {
              detail: { role: ROLES.AI, characterId: story.aiId },
            }),
          );

          // 2.1 REFUSAL CHECK
          if (TurnManager._checkRefusal(response)) {
            const lastUserMsg = (payload.messages || []).findLast(
              (m) => m.role === ROLES.USER,
            );
            const varianceKey = analyzeRejection(response, lastUserMsg?.text);
            payload.system += `\n\n${getDirectorInstruction(varianceKey)}`;

            log(`[PROMETHEUS] Refusal detected. Retrying with ${varianceKey}`);
            if (attempts < MAX_ATTEMPTS) continue;
          }

          // 3. PARSE
          const { text, visualPrompt, targetType } = parseAiResponse(response);

          // 4. VISUALS
          let visuals = { imageUrl: null, refinedPrompt: null };
          if (visualPrompt) {
            visuals = await TurnManager._handleVisuals(
              storyId,
              visualPrompt,
              targetType,
            );
          }

          // 5. SAVE
          // let aiMsgId; // Unused
          const metadata = visualPrompt
            ? { visualPrompt, targetType, refinedPrompt: visuals.refinedPrompt }
            : null;

          const role = options.ghostwrite ? ROLES.USER : ROLES.AI;
          const characterName = options.ghostwrite
            ? userEntity?.name || "User"
            : aiEntity?.name || "Narrator";

          if (mode === "append" && appendTargetId) {
            const original = await db.messages.get(appendTargetId);
            const update = { text: original.text + " " + text };
            if (visuals.imageUrl) {
              update.attachmentUrl = visuals.imageUrl;
              update.metadata = { ...(original.metadata || {}), ...metadata };
            }
            await db.messages.update(appendTargetId, update);
            // aiMsgId = appendTargetId; // Unused
          } else {
            await db.messages.add({
              storyId,
              role,
              type: "IC",
              text,
              characterName,
              createdAt: Date.now(),
              attachmentUrl: visuals.imageUrl,
              metadata,
            });
          }

          // 6. PHYSICS
          if (payload.meta?.triggerUpdate) {
            // Non-blocking Pulse
            TurnManager._runPulse(storyId, story.aiId);
          }
          break;
        } catch (e) {
          if (e.name === "AbortError") throw e;
          if (e.message.includes(ERROR_MESSAGES.CONNECTION_LOST)) {
            if (retryCount < MAX_STREAM_RETRIES) {
              console.warn(
                `⚠️ [TEXT-GEN] Stream interrupted. Triggering Auto-Reroll... (Attempt ${retryCount + 1}/${MAX_STREAM_RETRIES})`,
              );
              await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
              return TurnManager._executeTurn(storyId, payload, {
                ...options,
                retryCount: retryCount + 1,
              });
            }
            console.error("❌ [TEXT-GEN] Max Auto-Rerolls exceeded.");
            throw e;
          }
          if (attempts >= MAX_ATTEMPTS) throw e;
          log(
            `[PROMETHEUS] Generation Glitch. Retrying ${attempts + 1}/${MAX_ATTEMPTS}...`,
          );
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        }
      }

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
      applyPatch({ ui: { fsm: "error" } });
    } finally {
      events.dispatchEvent(
        new CustomEvent(EVENTS.GENERATION_COMPLETED, {
          detail: { role: ROLES.AI, characterId: story?.aiId },
        }),
      );
    }
  },

  // --- PUBLIC METHODS ---

  generateAiResponse: async (storyId, options = {}) => {
    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build("", options);
      if (options.instruction) payload.system += `\n\n${options.instruction}`;
      await TurnManager._executeTurn(storyId, payload, { mode: "create" });
    } catch (e) {
      error("Response Gen Error", e);
      events.dispatchEvent(
        new CustomEvent(EVENTS.GENERATION_COMPLETED, {
          detail: { role: ROLES.AI },
        }),
      );
    }
  },

  send: async (text, options = {}) => {
    if (!text) return;
    const storyId = TurnManager.requireActive();
    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));

    try {
      const story = state.story.byId[storyId];
      const user = await entities.get("character", story.userId);

      await db.messages.add({
        storyId,
        role: ROLES.USER,
        type: "IC",
        text,
        characterName: user?.name || "User",
        createdAt: Date.now(),
      });

      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );

      const builder = new ContextBuilder(storyId);
      const payload = await builder.build(text, options);
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

    const last = msgs[msgs.length - 1];
    if (last.role !== ROLES.AI && last.role !== ROLES.NARRATOR) return;

    let note;
    if (manualInstruction === "VANILLA") {
      log(`[PROMETHEUS] Regenerating with VANILLA strategy (No Variance).`);
      note = null;
    } else if (manualInstruction) {
      log(
        `[PROMETHEUS] Regenerating with Manual Instruction: ${manualInstruction}`,
      );
      note = `[SYSTEM: DIRECTOR_OVERRIDE]\nDirective: ${manualInstruction}`;
    } else {
      const lastUser = msgs.findLast((m) => m.role === ROLES.USER);
      const key = analyzeRejection(last.text, lastUser?.text || "");
      note = getDirectorInstruction(key);
      log(`[PROMETHEUS] Regenerating with strategy: ${key}`);
    }

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
    await db.messages.delete(last.id);
    await TurnManager.loadMessages(storyId);
    events.dispatchEvent(
      new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
    );

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build("", { varianceInstruction: note });
      await TurnManager._executeTurn(storyId, payload, { mode: "create" });
    } catch (e) {
      error("Regen Error", e);
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  extendAiResponse: async () => {
    const storyId = TurnManager.requireActive();
    const msgs = state.messages.byStoryId[storyId] || [];
    if (msgs.length === 0) return;

    const last = msgs[msgs.length - 1];
    if (last.role !== ROLES.AI && last.role !== ROLES.NARRATOR) return;

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build();
      payload.system +=
        "\n\n[SYSTEM: CONTINUATION_PROTOCOL]\nContinue immediately. Do not repeat. No <think> tags.";
      await TurnManager._executeTurn(storyId, payload, {
        mode: "append",
        appendTargetId: last.id,
      });
    } catch (e) {
      error("Extend Error", e);
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  _runPulse: async (storyId, aiId) => {
    try {
      log(`[TurnManager] ✨ Initiating Simulation Pulse...`);
      // const story = state.story.byId[storyId]; // Unused
      const aiEntity = await entities.get("character", aiId);
      const history = await TurnManager.loadMessages(storyId);

      // 1. Build Pulse Prompt
      const builder = new ContextBuilder(storyId);
      const activeThreads = aiEntity.customData?.plot?.active || [];
      // Use last ~15 messages (Modulo 5 * 3) for context
      const pulseHistory = history.slice(-15);

      const payload = await builder.buildPulse(
        aiEntity,
        pulseHistory,
        activeThreads,
      );

      // 2. Execute LLM Request
      const response = await LlmService.generate(payload, {
        json: true,
      });

      // 3. Parse CSS/JSON
      let data;
      try {
        // Attempt to clean markdown code blocks if present
        const jsonText = response.replace(/```json\n|```/g, "").trim();
        data = JSON.parse(jsonText);
      } catch (parseErr) {
        console.warn("[TurnManager] Pulse JSON Parse Failed:", response);
        return; // Abort if invalid
      }

      // 4. Apply Updates
      if (data) {
        let needsSave = false;
        const updates = { customData: { ...aiEntity.customData } };

        // Apply Dynamics
        if (data.dynamics) {
          const newDynamics = calculateDynamics(
            data.dynamics,
            // Fallback: If no baseline, use current dynamics as the anchor (Assumed Normality)
            aiEntity.baseline || aiEntity.dynamics || {},
          );
          updates.dynamics = {
            entropy: newDynamics.entropy,
            velocity: newDynamics.velocity,
            permeability: newDynamics.permeability,
            resonance: newDynamics.resonance,
          };
          needsSave = true;
          log("[TurnManager] Dynamics Updated (Physics V5):", updates.dynamics);
        }

        // Apply Present State (Split Physical/Mental)
        if (data.state) {
          const currentPresent =
            typeof aiEntity.present === "object" && aiEntity.present !== null
              ? aiEntity.present
              : { physical: String(aiEntity.present || ""), mental: "" };

          updates.present = {
            ...currentPresent,
            physical: data.state.physical || currentPresent.physical || "",
            mental: data.state.mental || currentPresent.mental || "",
          };
          needsSave = true;
          log("[TurnManager] State Updated:", updates.present);
        } else if (data.present && typeof data.present === "string") {
          // Fallback for legacy schema
          updates.present = {
            ...aiEntity.present,
            physical: data.present,
          };
          needsSave = true;
        }

        // Apply Plot Logic
        if (data.plot) {
          const currentActive = [...(updates.customData.plot.active || [])];
          let currentResolved = [...(updates.customData.plot.resolved || [])];

          // Move resolved indices
          if (
            data.plot.resolved_indices &&
            Array.isArray(data.plot.resolved_indices)
          ) {
            // Sort descending to remove without index shift issues
            const indicesToRemove = data.plot.resolved_indices
              .filter((i) => i >= 0 && i < currentActive.length)
              .sort((a, b) => b - a);

            indicesToRemove.forEach((idx) => {
              const removed = currentActive.splice(idx, 1)[0];
              if (removed) currentResolved.unshift(removed);
            });
          }

          // Add new threads (LIFO: Add to Top)
          if (data.plot.new_threads && Array.isArray(data.plot.new_threads)) {
            const newThreads = data.plot.new_threads.filter(
              (t) => typeof t === "string" && !currentActive.includes(t),
            );
            // Do NOT reverse. Unshifting in chronological order (A, B) results in (B, A, ...Old).
            // This places the MOST RECENT event (B) at the top of the stack (Index 0).
            newThreads.forEach((t) => {
              currentActive.unshift(t);
            });
          }

          updates.customData.plot = {
            active: currentActive,
            resolved: currentResolved,
          };
          needsSave = true;
          log("[TurnManager] Plot Updated:", updates.customData.plot);
        }

        // 5. Persist
        if (needsSave) {
          await entities.upsert("character", {
            ...aiEntity,
            ...updates,
          });

          // Dispatch Event for UI Refresh
          events.dispatchEvent(
            new CustomEvent(EVENTS.ENTITY_UPDATED, {
              detail: { id: aiId, ...updates },
            }),
          );
        }
      }
    } catch (e) {
      error("Pulse Error", e);
    }
  },

  generateOpening: async (storyId) => {
    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
    const story = state.story.byId[storyId];
    events.dispatchEvent(
      new CustomEvent(EVENTS.TYPING_STARTED, {
        detail: { role: ROLES.FRACTAL, characterId: story.fractalId },
      }),
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

      let response;
      let attempts = 0;
      const MAX_ATTEMPTS = 3;

      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        try {
          response = await LlmService.generate(payload);
          break;
        } catch (e) {
          if (e.name === "AbortError") throw e;
          if (attempts >= MAX_ATTEMPTS) throw e;
          log(
            `[PROMETHEUS] Opening Gen Glitch. Retrying ${attempts + 1}/${MAX_ATTEMPTS}...`,
          );
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        }
      }

      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));

      await db.messages.add({
        storyId,
        role: "fractal",
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
      error("Opening Gen Error", e);
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
    const story = state.story.byId[storyId];

    // Ensure UI has the correct color by fetching the entity first
    let signatureColor = DEFAULT_COLORS.FRACTAL;
    try {
      const fractal = await entities.get(ROLES.FRACTAL, story.fractalId);
      // Prefer pink over default purple for Fractals unless explicit overrides exist
      if (
        fractal &&
        fractal.signatureColor &&
        fractal.signatureColor !== "default"
      ) {
        signatureColor = fractal.signatureColor;
      }
    } catch (e) {
      console.warn("Could not fetch fractal for typing color", e);
    }

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
    events.dispatchEvent(
      new CustomEvent(EVENTS.TYPING_STARTED, {
        detail: {
          role: ROLES.FRACTAL,
          characterId: story.fractalId,
          signatureColor: signatureColor,
        },
      }),
    );

    try {
      // 1. Generate Epilogue
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildConclusion();

      if (!payload)
        throw new Error("Conclusion strategy not supported for this fractal.");

      let response;
      let attempts = 0;
      const MAX_ATTEMPTS = 3;

      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        try {
          response = await LlmService.generate(payload);
          break; // Success
        } catch (e) {
          if (e.name === "AbortError") throw e;
          if (attempts >= MAX_ATTEMPTS) throw e;
          log(
            `[PROMETHEUS] Epilogue Gen Glitch. Retrying ${attempts + 1}/${MAX_ATTEMPTS}...`,
          );
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        }
      }

      // 2. Save Epilogue
      await db.messages.add({
        storyId,
        role: ROLES.FRACTAL,
        type: "OOC",
        text: response,
        createdAt: Date.now(),
        isEpilogue: true,
      });

      // 3. Update Story Body
      const [endAi, endUser, endFractal] = await Promise.all([
        entities.get("character", story.aiId),
        entities.get("character", story.userId),
        entities.get(ROLES.FRACTAL, story.fractalId),
      ]);

      await db.stories.update(storyId, {
        isConcluded: 1,
        concludedAt: Date.now(),
        "snapshots.end": { ai: endAi, user: endUser, fractal: endFractal },
      });

      const updated = await db.stories.get(storyId);
      applyPatch({ story: { byId: { [storyId]: updated } } });

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
      const response = await LlmService.generate(payload, {});
      return response.trim().replace(/^"|"$/g, "");
    } catch (e) {
      error("Ghostwrite error:", e);
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

  ghostwrite: async (text) => {
    const storyId = TurnManager.requireActive();
    if (!storyId) return;

    // 1. Build Payload (User Logic)
    const builder = new ContextBuilder(storyId);
    const payload = await builder.buildGhostwriter(text);

    // 2. Execute Turn (Saves as User Message)
    await TurnManager._executeTurn(storyId, payload, { ghostwrite: true });

    // 3. Trigger Active AI Response (The Consequence)
    await TurnManager.generateAiResponse(storyId);
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
        role: ROLES.NARRATOR,
        type: "IMAGE",
        text: imageUrl,
        metadata: { prompt: draftText },
        createdAt: Date.now(),
      });

      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );
    } catch (e) {
      error("Image Gen failed:", e);
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
    if (!message?.metadata?.visualPrompt) {
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

      const builder = new ContextBuilder(storyId);

      let vTarget = "character";
      if (targetType === ROLES.FRACTAL || targetType === "scene")
        vTarget = "scene";

      const vPayload = await builder.buildVisualizer(vTarget);
      vPayload.system += `\n<RAW_INTENT>\n${visualPrompt}\n</RAW_INTENT>`;

      const refinedPrompt = await LlmService.generate(vPayload, {
        maxTokens: 300,
        temperature: 0.7,
      });

      const imageUrl = await VisualManager.generate(refinedPrompt, {
        resolution: IMG_RESOLUTION,
      });

      await db.messages.update(messageId, {
        attachmentUrl: imageUrl,
        metadata: { ...message.metadata, refinedPrompt },
      });
    } catch (e) {
      error("Reroll Image Failed:", e);
      window.dispatchEvent(
        new CustomEvent("app-error", {
          detail: { error: e, type: "generation" },
        }),
      );
    } finally {
      if (window.setRerollState) window.setRerollState(messageId, false);
      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  requestVisual: async () => {
    const storyId = TurnManager.requireActive();
    const story = state.story.byId[storyId];
    const fractal = story
      ? await entities.get(ROLES.FRACTAL, story.fractalId)
      : null;
    const isMessenger =
      fractal &&
      (fractal.name === "Messenger" ||
        fractal.simulation?.directorMode === "TEXT_PROTOCOL");

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

    const prompts = ["Pic!", "Show me.", "Photo?", "See?", "Pics!"];
    const text = prompts[Math.floor(Math.random() * prompts.length)];

    await db.messages.add({
      storyId,
      role: ROLES.USER,
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
FORMAT: Text + <image_prompt target="AI|USER|FRACTAL">Description</image_prompt>.
</DIRECTOR_OVERRIDE>`;

    await TurnManager.generateAiResponse(storyId, { instruction });
  },
};

events.addEventListener(EVENTS.DB_UPDATED, async () => {
  const activeId = state.story.activeId;
  if (activeId) await TurnManager.loadMessages(activeId);
});
