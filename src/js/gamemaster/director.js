// src/js/gamemaster/director.js
import { db } from "../scholar/db.js";
import { state, applyPatch, events, EVENTS } from "./store.js"; // Updated import
import { LlmService } from "./llm.js";
import { entities, ContextBuilder, Scholar } from "../scholar/index.js";
import { Warden } from "../warden/index.js";
import { error, calculateBlendedParams, log } from "./utils.js";
import { Mesmer } from "../mesmer/index.js";
import { CONFIG, ROLES } from "./config.js";
import { Session } from "./session.js"; // For loading messages
import { Parser } from "./parser.js";

const { PHYSICS, MESSAGES: ERROR_MESSAGES } = CONFIG;
const MAX_STREAM_RETRIES = 3;

/**
 * THE DIRECTOR
 * Master of Time (Turns), Flow (Orchestration), and Reality (State).
 * Handles the "Game Loop".
 */
export const Director = {
  /**
   * Public API to start a turn (e.g. after Edit)
   */
  playTurn: async (storyId, options = {}) => {
    const builder = new ContextBuilder(storyId);
    const payload = await builder.build("", options);
    await Director.execute(storyId, payload, { mode: "create" });
  },

  /**
   * Retry logic wrapper for regeneration
   */
  retry: async (storyId, manualInstruction = null) => {
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
      // [VARIANCE] Random Style Injection
      log(`[PROMETHEUS] Regenerating with Random Variance.`);
      note = Warden.instruct({ mode: "random" });
    }

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.build("", { varianceInstruction: note });
      await Director.execute(storyId, payload, { mode: "create" });
    } catch (e) {
      error("Regen Error", e);
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  /**
   * Manual Visual Trigger: Generates a photo based on the current context.
   */
  requestVisual: async (targetType = "scene") => {
    const storyId = state.story.activeId;
    if (!storyId) return;

    log(`[Director] 📸 Manual Visual Request: ${targetType}`);

    try {
      // 1. SIGNAL
      events.dispatchEvent(
        new CustomEvent(EVENTS.TYPING_STARTED, {
          detail: {
            role: ROLES.AI,
            characterId: state.story.byId[storyId].aiId,
          },
        }),
      );

      const result = await Mesmer.visualize(
        storyId,
        "Cinematic high-fidelity photo.",
        targetType,
      );

      if (result.imageUrl) {
        await Director._saveVisualMessage(storyId, result, targetType);
      }
    } catch (e) {
      error("Visual Request Failed", e);
    } finally {
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
    }
  },

  /**
   * Manual Visual Generation: Enhances a draft and generates an image.
   */
  generateVisualFromDraft: async (draft) => {
    const storyId = state.story.activeId;
    if (!storyId) return;

    log(`[Director] 📸 Generating Visual from Draft: ${draft}`);

    try {
      // 1. SIGNAL
      events.dispatchEvent(
        new CustomEvent(EVENTS.TYPING_STARTED, {
          detail: {
            role: ROLES.AI,
            characterId: state.story.byId[storyId].aiId,
          },
        }),
      );

      // 2. VISUALIZE with explicit characteristics enhancement
      const result = await Mesmer.visualize(storyId, draft, "character", {
        mode: "enhance",
        guidanceScale: CONFIG.VISUALS.GUIDANCE_BASE || 8,
      });

      if (result.imageUrl) {
        await Director._saveVisualMessage(storyId, result, "character");
      }
    } catch (e) {
      error("Draft Visual Failed", e);
    } finally {
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
    }
  },

  /**
   * Internal: Save a message containing a generated image.
   */
  _saveVisualMessage: async (storyId, result, targetType) => {
    const characterName =
      targetType === "scene" ? "Narrator" : state.selectedAI?.name || "AI";

    await db.messages.add({
      storyId,
      role: "model",
      type: "IMAGE",
      text: `[Visual: ${targetType.toUpperCase()}]`,
      characterName,
      createdAt: Date.now(),
      attachments: [result.imageUrl],
      attachmentUrl: result.imageUrl,
      metadata: {
        visualPrompts: [{ target: targetType, prompt: result.refinedPrompt }],
        opticsThoughts: result.opticsThoughts ? [result.opticsThoughts] : [],
      },
    });

    await Session.loadMessages(storyId);
    events.dispatchEvent(
      new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
    );
  },

  /**
   * Core Execution Pipeline
   */
  execute: async (storyId, payload, options = {}) => {
    const mode = options.mode || "create";
    const appendTargetId = options.appendTargetId || null;
    const retryCount = options.retryCount || 0;
    const story = state.story.byId[storyId];

    // 1. SIGNAL
    let signalRole = options.ghostwrite ? ROLES.USER : ROLES.AI;
    let signalId = options.ghostwrite ? story.userId : story.aiId;

    if (mode === "prologue" || mode === "epilogue") {
      signalRole = ROLES.FRACTAL;
      signalId = story.fractalId;
    }

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

    const blended = calculateBlendedParams(aiEntity, userEntity, fractalEntity);
    const llmOptions = {
      temperature: blended.temperature,
      repetition_penalty: blended.repetition_penalty,
      top_p: blended.top_p,
      signal: ctrl.signal,
    };

    const visualOptions = blended.visual || {
      guidanceScale: CONFIG.VISUALS.GUIDANCE_BASE,
    };

    // [WARDEN SYSTEM] Physics Scanning & Application
    const lastMsg = state.messages.byStoryId[storyId]?.slice(-1)[0];
    if (lastMsg && lastMsg.role === ROLES.USER) {
      const reflex = Warden.scan(lastMsg.text);
      if (reflex) {
        const newDynamics = await Warden.apply(aiEntity, reflex);
        const validationInstruction = Warden.enforce(newDynamics);
        if (validationInstruction) {
          payload.system += `\n\n${validationInstruction}`;
          log(`[GameMaster] 📝 Warden Instruction Injected`);
        }
      }
    }

    let generatedText = null;

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

          // [WARDEN] Safety Check
          if (Warden.checkRefusal(response)) {
            if (attempts < MAX_ATTEMPTS) {
              log(
                `[GameMaster] ♻️ Refusal Detected. Injecting Variance Reroll.`,
              );
              const lastUserMsg =
                state.messages.byStoryId[storyId]?.slice(-1)[0]?.text || "";
              const varInstr = Warden.instruct({
                mode: "reroll",
                rejectedText: response,
                userLastInput: lastUserMsg,
              });

              if (varInstr) {
                payload.system += `\n\n${varInstr}`;
              }
              continue;
            }
          }

          // 3. PARSE
          const { text, visualPrompts, targetType } = Parser.process(response);
          generatedText = text;

          // 4. VISUALS (MULTI-SHOT)
          let imageUrls = [];

          if (visualPrompts && visualPrompts.length > 0) {
            const primaryPrompt = visualPrompts[0];
            log(`[GameMaster] 📸 Visual Triggered: ${primaryPrompt.target}`);

            const result = await Mesmer.visualize(
              storyId,
              primaryPrompt.prompt,
              primaryPrompt.target,
              {
                aspect: primaryPrompt.aspect,
                guidanceScale: visualOptions.guidanceScale,
              },
            );

            if (result.imageUrl) {
              imageUrls = [result.imageUrl];
              if (result.opticsThoughts) {
                options.opticsThoughts = [result.opticsThoughts];
              }
            }
          }

          // 5. SAVE
          const metadata =
            visualPrompts.length > 0
              ? {
                  visualPrompts,
                  targetType,
                  opticsThoughts: options.opticsThoughts || [],
                }
              : null;

          let role = options.ghostwrite ? ROLES.USER : ROLES.AI;
          let characterName = options.ghostwrite
            ? userEntity?.name || "User"
            : aiEntity?.name || "AI";

          if (mode === "prologue" || mode === "epilogue") {
            role = ROLES.FRACTAL; // Or ROLES.NARRATOR
            characterName = fractalEntity?.name || "Narrator";
          }

          if (mode === "append" && appendTargetId) {
            const original = await db.messages.get(appendTargetId);
            const update = { text: original.text + " " + text };
            if (imageUrls.length > 0) {
              update.attachments = imageUrls;
              update.attachmentUrl = imageUrls[0];
              update.metadata = { ...(original.metadata || {}), ...metadata };
            }
            await db.messages.update(appendTargetId, update);
          } else {
            // [Feature] Support generatedText potentially containing images or other logic
            await db.messages.add({
              storyId,
              role,
              type: "IC",
              text,
              characterName,
              createdAt: Date.now(),
              attachments: imageUrls,
              attachmentUrl: imageUrls[0] || null,
              metadata,
            });
          }

          // 6. PHYSICS & MEMORY LOGIC (Heartbeat)
          // Re-load messages to get accurate count including the one just added
          const msgs = await Session.loadMessages(storyId); // Use Session to refresh Store
          const aiTurns = msgs.filter((m) => m.role === ROLES.AI).length;

          if (aiTurns > 0) {
            // A. FAST LOOP (Warden)
            if (aiTurns % PHYSICS.HEARTBEAT_RATE === 0) {
              // Fire and forget (don't await to block UI)
              Director._runWarden(storyId, story.aiId).catch((e) =>
                error("Warden Pulse Error", e),
              );
            }

            // B. SLOW LOOP (Archivist)
            if (aiTurns % PHYSICS.ARCHIVIST_RATE === 0) {
              // Fire and forget
              Director._runArchivistCycle(storyId, aiTurns, story).catch((e) =>
                error("Archivist Pulse Error", e),
              );
            }
          }

          break; // Success
        } catch (e) {
          if (e.name === "AbortError") throw e;
          if (e.message.includes(ERROR_MESSAGES.CONNECTION_LOST)) {
            if (retryCount < MAX_STREAM_RETRIES) {
              await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
              return Director.execute(storyId, payload, {
                ...options,
                retryCount: retryCount + 1,
              });
            }
            throw e;
          }
          if (attempts >= MAX_ATTEMPTS) throw e;
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        }
      }

      await Session.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );
      applyPatch({ ui: { fsm: "done" } });

      // [PROLOGUE AUTO-START]
      if (mode === "prologue") {
        log("[Director] 🎬 Prologue Complete. Triggering First Turn.");
        setTimeout(() => Director.playTurn(storyId), 250);
      }
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
          detail: {
            role:
              mode === "prologue" || mode === "epilogue"
                ? ROLES.FRACTAL
                : ROLES.AI,
            characterId:
              mode === "prologue" || mode === "epilogue"
                ? story?.fractalId
                : story?.aiId,
            text: generatedText,
          },
        }),
      );
    }
  },

  // --- INTERNAL HELPERS ---

  async _runWarden(storyId, targetId) {
    log(`[Director] ⚖️ Initiating Warden Scan...`);

    const story = await db.stories.get(storyId);
    if (!story) return;

    const allEntities = await Promise.all([
      entities.get("character", story.aiId),
      entities.get("character", story.userId),
      entities.get(ROLES.FRACTAL, story.fractalId),
    ]);
    const validEntities = allEntities.filter((e) => e);
    const targetEntity = validEntities.find((e) => e.id === targetId);
    const others = validEntities.filter((e) => e.id !== targetId);
    if (!targetEntity) return;

    const builder = new ContextBuilder(storyId);
    const msgs = await Session.loadMessages(storyId);
    const pulseHistory = msgs.slice(-15);
    const payload = await builder.buildWardenPrompt(
      targetEntity,
      others,
      pulseHistory,
      targetEntity.customData?.plot?.active || [],
    );

    const response = await LlmService.generate(payload, { json: true });

    let data;
    try {
      let jsonText =
        typeof response === "object"
          ? response.generatedText || response.text || String(response)
          : String(response);
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) jsonText = jsonMatch[0];
      jsonText = jsonText.replace(/:\s*\+(\d+)/g, ": $1");
      data = JSON.parse(jsonText);
    } catch (e) {
      console.warn("Pulse JSON Parse Failed");
      return;
    }

    if (data) {
      let needsSave = false;
      const updates = { customData: { ...targetEntity.customData } };

      if (data.log_entry) {
        const turnCount = msgs.filter((m) => m.role === "model").length;
        updates.past =
          (targetEntity.past || "") + `\n[Turn ${turnCount}] ${data.log_entry}`;
        needsSave = true;
      }

      if (data.dynamics) {
        const {
          updates: dynUpdates,
          ledger: newLedger,
          needsSave: dynNeedsSave,
        } = Warden.reconcile(targetEntity, data.dynamics);
        if (dynNeedsSave) {
          updates.dynamics = dynUpdates.dynamics;
          updates.customData.reflex_ledger = newLedger;
          needsSave = true;
        }
      }

      if (data.state) {
        const currentPresent = targetEntity.present || {
          physical: "",
          mental: "",
        };
        updates.present = {
          ...currentPresent,
          physical: data.state.physical || currentPresent.physical,
          mental: data.state.mental || currentPresent.mental,
        };
        needsSave = true;
      }

      if (data.plot) {
        const currentActive = [...(updates.customData.plot?.active || [])];
        let currentResolved = [...(updates.customData.plot?.resolved || [])];

        if (
          data.plot.resolved_indices &&
          Array.isArray(data.plot.resolved_indices)
        ) {
          const indicesToRemove = data.plot.resolved_indices
            .filter((i) => i >= 0 && i < currentActive.length)
            .sort((a, b) => b - a);

          indicesToRemove.forEach((idx) => {
            const removed = currentActive.splice(idx, 1)[0];
            if (removed) currentResolved.unshift(removed);
          });
        }

        if (data.plot.new_threads && Array.isArray(data.plot.new_threads)) {
          data.plot.new_threads.forEach((t) => {
            if (typeof t === "string" && !currentActive.includes(t)) {
              currentActive.unshift(t);
            }
          });
        }

        updates.customData.plot = {
          active: currentActive,
          resolved: currentResolved,
        };
        needsSave = true;
      }

      if (needsSave) {
        await entities.upsert("character", { ...targetEntity, ...updates });
        events.dispatchEvent(
          new CustomEvent(EVENTS.ENTITY_UPDATED, {
            detail: { id: targetId, ...updates },
          }),
        );

        // Inject Debug Message
        await db.messages.add({
          storyId,
          role: "system",
          type: "DEBUG",
          text: JSON.stringify(data, null, 2),
          characterName: "System",
          createdAt: Date.now(),
          metadata: { debugType: "PULSE HEARTBEAT" },
        });
        events.dispatchEvent(
          new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
        );
      }
    }
  },

  async _runArchivistCycle(storyId, aiTurns, story) {
    const cycleIndex = (aiTurns / PHYSICS.ARCHIVIST_RATE) % 3;
    let targetId = story.aiId;
    let targetRole = ROLES.AI;

    if (cycleIndex === 1) {
      targetId = story.userId;
      targetRole = ROLES.USER;
    } else if (cycleIndex === 2) {
      targetId = story.fractalId;
      targetRole = ROLES.FRACTAL;
    }

    if (targetId) {
      log(`[Director] 📜 Archivist Triggered - Target: ${targetRole}`);
      const targetEntity = await entities.get(
        targetRole === ROLES.FRACTAL ? "fractal" : "character",
        targetId,
      );
      if (!targetEntity) return;

      const msgs = await Session.loadMessages(storyId);
      const recentHistory = msgs.slice(-PHYSICS.ARCHIVIST_RATE * 2);

      const updates = await Scholar.archive(
        targetEntity,
        recentHistory,
        targetRole,
      );

      if (updates) {
        let dirty = false;
        // Apply updates
        const newEntity = { ...targetEntity };
        if (updates.past) {
          // Scholar returns { past, present, forever } keys directly
          newEntity.past = updates.past;
          dirty = true;
        }
        if (updates.present) {
          newEntity.present = updates.present;
          dirty = true;
        }
        if (updates.forever) {
          // If Scholar updates forever
          newEntity.forever = updates.forever;
          dirty = true;
        }

        if (dirty) {
          await entities.upsert(
            targetRole === ROLES.FRACTAL ? "fractal" : "character",
            newEntity,
          );
          log(`[Director] 📜 Archivist Updates Applied for ${targetRole}`);
        }
      }
    }
  },
};
