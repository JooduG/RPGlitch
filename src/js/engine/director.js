import { db } from "../core/db.js";
import { state, applyPatch } from "../core/state.js";
import { LlmService } from "../services/llm-service.js";
import { audioService } from "../services/audio-service.js";
import { entities } from "../data/repo.js";

import { error, calculateBlendedParams, log } from "../core/utils.js";
import { ContextBuilder } from "./prompter.js";
import { calculateDynamics } from "./physics/main.js";
import { PHYSICS_CONSTANTS } from "./physics/config.js";
import { scanReflex, getReflexInstruction } from "./physics/reflex.js";
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

const parseAiResponse = (response) => {
  if (!response) {
    return { text: "", visualPrompts: [], targetType: ROLES.AI, aspect: null };
  }
  let text = String(response)
    .replace(/STOP SEQUENCE.*$/i, "")
    .replace(/STOP PROTOCOL.*$/i, "")
    .replace(/\(Glitch must react\).*$/i, "")
    .replace(
      /(?:^|\n)(?:The )?(?:Hook|Result|Scene|Analysis|Meta|Response):\s*/gi,
      "$1",
    )
    .trim();

  const visualPrompts = [];
  let aspect = null;
  let targetType = ROLES.AI;

  // [MULTI-SHOT] Robust Attribute Parsing
  // We capture attributes (Group 1) and content (Group 2) separately
  const visualMatches = [
    ...response.matchAll(/<image_prompt([^>]*)>([\s\S]*?)<\/image_prompt>/gi),
  ];

  if (visualMatches.length > 0) {
    visualMatches.forEach((match) => {
      // Clean up the text by removing the full tag
      text = text.replace(match[0], "").trim();

      const attrs = match[1]; // e.g. ' target="scene" aspect="landscape"'
      const content = match[2];

      // Extract attributes independently (Order agnostic, handles whitespace)
      const targetMatch = attrs.match(/target=["']([^"']+)["']/i);
      const aspectMatch = attrs.match(/aspect=["']([^"']+)["']/i);

      // Default values
      const pTarget = targetMatch ? targetMatch[1].toLowerCase() : "character";
      const pAspect = aspectMatch ? aspectMatch[1].toLowerCase() : "portrait";

      // Update Top-Level metadata (from last tag found)
      targetType = pTarget;
      aspect = pAspect;

      // Clean thought blocks
      const rawPrompt = content
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();

      if (rawPrompt) {
        visualPrompts.push({
          prompt: rawPrompt,
          target: pTarget,
          aspect: pAspect,
        });
      }
    });

    // Re-inject for UI display
    visualPrompts.forEach((vp) => {
      // [CLEANUP] Ensure the display prompt doesn't have leaked tags
      const displayPrompt = vp.prompt
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<image_prompt[^>]*>|<\/image_prompt>/gi, "")
        .trim();
      text += `\n\n<image_prompt target="${vp.target}" aspect="${vp.aspect}">${displayPrompt}</image_prompt>`;
    });
  }

  return { text, visualPrompts, targetType, aspect };
};

export const TurnManager = {
  requireActive() {
    if (!state.story.activeId) {
      console.error(
        "[TurnManager] requireActive failed. Current state:",
        state,
      );
      throw new Error("No active story.");
    }
    return state.story.activeId;
  },

  _checkRefusal(text) {
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

    await db.settings.put({ id: "active_story", value: id });
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

      await db.settings.put({ id: "active_story", value: story.id });
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

  _handleVisuals: async (storyId, visualPrompt, targetType, options = {}) => {
    const story = state.story.byId[storyId];
    let targetRole = ROLES.AI;
    let targetId = story.aiId;

    if (targetType === ROLES.FRACTAL || targetType === "scene") {
      targetRole = ROLES.FRACTAL;
      targetId = story.fractalId;
    } else if (targetType === ROLES.USER) {
      targetRole = ROLES.USER;
      targetId = story.userId;
    }

    events.dispatchEvent(
      new CustomEvent(EVENTS.TYPING_STARTED, {
        detail: { role: targetRole, characterId: targetId },
      }),
    );

    try {
      const builder = new ContextBuilder(storyId);
      let vTarget = targetType || "character";
      if (targetType === ROLES.FRACTAL) vTarget = "scene";

      const vPayload = await builder.buildVisualizer(vTarget);
      vPayload.system += `\n<RAW_INTENT>\n${visualPrompt}\n</RAW_INTENT>`;

      const refinedPrompt = await LlmService.generate(vPayload, {
        maxTokens: 300,
        temperature: PHYSICS_CONSTANTS.VISUAL_TEMP_DEFAULT,
      });

      // [FEATURE] Extract Optics Thoughts for UI
      const thinkMatch = refinedPrompt.match(/<think>([\s\S]*?)<\/think>/i);
      const opticsThoughts = thinkMatch ? thinkMatch[1].trim() : null;

      // [HARDEN] Strip any leaked Narrative tags from the Refined Prompt
      const cleanRefinedPrompt = refinedPrompt
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<image_prompt[^>]*>|<\/image_prompt>/gi, "")
        .trim();

      const resolution = VisualManager.getResolutionForMode(
        options.aspect || vTarget,
      );

      const imageUrl = await VisualManager.generate(cleanRefinedPrompt, {
        resolution,
        guidanceScale: options.guidanceScale,
      });

      return { imageUrl, refinedPrompt: cleanRefinedPrompt, opticsThoughts };
    } catch (visErr) {
      error("[PROMETHEUS] Auto-Visual Failed:", visErr);
      return { imageUrl: null, refinedPrompt: null, opticsThoughts: null };
    } finally {
      events.dispatchEvent(
        new CustomEvent(EVENTS.TYPING_STOPPED, {
          detail: { role: targetRole, characterId: targetId },
        }),
      );
    }
  },

  async _executeTurn(storyId, payload, options = {}) {
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

    const blended = calculateBlendedParams(aiEntity, userEntity, fractalEntity);
    const llmOptions = {
      temperature: blended.temperature,
      repetition_penalty: blended.repetition_penalty,
      top_p: blended.top_p,
      signal: ctrl.signal,
    };

    const visualOptions = blended.visual || {
      guidanceScale: PHYSICS_CONSTANTS.GUIDANCE_BASE,
    };

    // [REFLEX SYSTEM] Scan User Input for Physics Triggers
    // Always check the last message for triggers if it was from the User.
    // We do this before generating the AI response.
    const lastMsg = state.messages.byStoryId[storyId]?.slice(-1)[0];
    if (lastMsg && lastMsg.role === ROLES.USER) {
      const reflex = scanReflex(lastMsg.text);
      if (reflex) {
        log(`[TurnManager] ⚡ Reflex Triggered: ${reflex.type}`, reflex.deltas);

        // 1. Apply Immediate Physics Update
        const currentDynamics = aiEntity.dynamics || {};
        const newDynamics = { ...currentDynamics };
        const ledger = aiEntity.customData?.reflex_ledger || {
          velocity: 0,
          entropy: 0,
          resonance: 0,
          permeability: 0,
        };

        Object.entries(reflex.deltas).forEach(([key, value]) => {
          let finalValue = value;

          // [LAW] GLASS CANNON (Perm > 90): Double Incoming Entropy
          if (
            key === "entropy" &&
            currentDynamics.permeability > PHYSICS_CONSTANTS.LAW_HIGH
          ) {
            finalValue *= PHYSICS_CONSTANTS.GLASS_ENT_MULT;
            log(`[PHYSICS] 💎 Glass Cannon: Entropy Doubled!`);
          }

          // [LAW] IRON BUNKER (Perm < 10): Halve Incoming Resonance
          if (
            key === "resonance" &&
            currentDynamics.permeability < PHYSICS_CONSTANTS.LAW_LOW
          ) {
            finalValue *= PHYSICS_CONSTANTS.BUNKER_RES_MULT;
            log(`[PHYSICS] 🛡️ Iron Bunker: Resonance Resisted (0.5x)`);
          }

          // [SPECIAL] ECHO CHAMBER (Res > 80, Ent < 20): Zero Incoming Entropy
          if (
            key === "entropy" &&
            currentDynamics.resonance > PHYSICS_CONSTANTS.ECHO_THRESHOLD_RES &&
            currentDynamics.entropy < PHYSICS_CONSTANTS.ECHO_THRESHOLD_ENT
          ) {
            finalValue = 0;
            log(`[PHYSICS] 🕸️ Echo Chamber: Entropy Rejected (0x)`);
          }

          // [SPECIAL] THE VENUS (Vel < 20, Perm > 80): Double Gain, Zero Loss
          if (
            key === "resonance" &&
            currentDynamics.velocity < PHYSICS_CONSTANTS.VENUS_THRESHOLD_VEL &&
            currentDynamics.permeability >
              PHYSICS_CONSTANTS.VENUS_THRESHOLD_PERM
          ) {
            if (finalValue > 0) {
              finalValue *= 2;
              log(`[PHYSICS] 🌺 The Venus: Resonance Absorbed (2x)`);
            } else {
              finalValue = 0;
              log(`[PHYSICS] 🌺 The Venus: Resonance Loss Ignored`);
            }
          }

          newDynamics[key] = (newDynamics[key] || 0) + finalValue;
          ledger[key] = (ledger[key] || 0) + finalValue; // Track for Pulse Audit
        });

        // Save Reflex Update
        await entities.upsert("character", {
          ...aiEntity,
          dynamics: newDynamics,
          customData: {
            ...aiEntity.customData,
            reflex_ledger: ledger,
          },
        });

        // [PHYSICS] Apply Laws of Physics Immediately (Real-Time)
        // We run calculateDynamics here to ensure thresholds (e.g. Adrenaline Shield) apply instantly,
        // rather than waiting for the Pulse (which might be 9 turns away).
        const lawsAppliedDynamics = calculateDynamics(
          newDynamics,
          aiEntity.baseline || aiEntity.dynamics || {},
        );

        // If Laws caused changes, update again
        if (
          JSON.stringify(lawsAppliedDynamics) !== JSON.stringify(newDynamics)
        ) {
          log(`[TurnManager] ⚖️ Physics Laws Applied Immediately`);
          await entities.upsert("character", {
            ...aiEntity,
            dynamics: lawsAppliedDynamics,
            customData: {
              ...aiEntity.customData,
              reflex_ledger: ledger, // Ledger stays same, as Laws are "System" changes, not "Reflex" changes
            },
          });
          // We use the post-laws dynamics for the instruction check below
          Object.assign(newDynamics, lawsAppliedDynamics);
        }

        // 2. Inject Instruction (If Laws Validation Passes)
        // We check the NEW dynamics state. If it crosses the threshold, we inject.
        const validationInstruction = getReflexInstruction(newDynamics);
        if (validationInstruction) {
          payload.system += `\n\n${validationInstruction}`;
          log(`[TurnManager] 📝 Reflex Instruction Injected (Threshold Met)`);
        } else {
          log(
            `[TurnManager] 🤫 Reflex Instruction Skipped (Threshold Not Met)`,
          );
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

          if (TurnManager._checkRefusal(response)) {
            if (attempts < MAX_ATTEMPTS) continue;
          }

          // 3. PARSE
          const { text, visualPrompts, targetType } = parseAiResponse(response);
          generatedText = text;

          // 4. VISUALS (MULTI-SHOT)
          let imageUrls = [];
          let refinedPrompts = [];

          if (visualPrompts && visualPrompts.length > 0) {
            // [RESTRICTION] Single-Shot Protocol Enforced
            const primaryPrompt = visualPrompts[0];

            log(`[TurnManager] 📸 Visual Triggered: ${primaryPrompt.target}`);

            // Generate single image
            const result = await TurnManager._handleVisuals(
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
              refinedPrompts = [result.refinedPrompt];
              // [FEATURE] Store thoughts for UI
              if (result.opticsThoughts) {
                // We'll store this as a parallel array or just a property if we enforce single-shot
                // Since we are enforcing single-shot at line 446, let's just make it an array to be safe
                options.opticsThoughts = [result.opticsThoughts];
              }
            }
          }

          // 5. SAVE
          const metadata =
            visualPrompts.length > 0
              ? {
                  visualPrompts, // Store raw array
                  targetType,
                  refinedPrompts, // Store refined array
                  opticsThoughts: options.opticsThoughts || [], // [FEATURE] Add to metadata
                }
              : null;

          const role = options.ghostwrite ? ROLES.USER : ROLES.AI;
          const characterName = options.ghostwrite
            ? userEntity?.name || "User"
            : aiEntity?.name || "AI";

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

          // 6. PHYSICS & MEMORY LOGIC (The Split-Brain Heartbeat)
          const msgs = await this.loadMessages(storyId);
          // Filter only IC messages to count "Turns"
          const aiTurns = msgs.filter((m) => m.role === ROLES.AI).length;

          if (aiTurns > 0) {
            // A. FAST LOOP: AI HEARTBEAT (Every 5 Turns)
            // Focus: Physics, Internal State, Immediate Logic
            if (aiTurns % PHYSICS_CONSTANTS.HEARTBEAT_RATE === 0) {
              log(
                `[Director] ❤️ Heartbeat Triggered (Turn ${aiTurns}) - Target: AI`,
              );
              this._runPulse(storyId, story.aiId);
            }

            // B. SLOW LOOP: ARCHIVIST (Every 10 Turns)
            // Focus: Deep Memory, Profile Evolution, Long-term Changes
            if (aiTurns % PHYSICS_CONSTANTS.ARCHIVIST_RATE === 0) {
              const cycleIndex =
                (aiTurns / PHYSICS_CONSTANTS.ARCHIVIST_RATE) % 3;
              let targetId = story.aiId;
              let targetRole = ROLES.AI;

              // Turn 10 (10/10 = 1 % 3 = 1) -> USER
              // Turn 20 (20/10 = 2 % 3 = 2) -> FRACTAL
              // Turn 30 (30/10 = 3 % 3 = 0) -> AI

              if (cycleIndex === 1) {
                targetId = story.userId;
                targetRole = ROLES.USER;
              } else if (cycleIndex === 2) {
                targetId = story.fractalId;
                targetRole = ROLES.FRACTAL;
              } else {
                targetId = story.aiId;
                targetRole = ROLES.AI;
              }

              if (targetId) {
                log(
                  `[Director] 📜 Archivist Triggered (Turn ${aiTurns}) - Target: ${targetRole}`,
                );
                this._runArchivist(storyId, targetId, targetRole);
              }
            }
          }

          break;
        } catch (e) {
          if (e.name === "AbortError") throw e;
          if (e.message.includes(ERROR_MESSAGES.CONNECTION_LOST)) {
            if (retryCount < MAX_STREAM_RETRIES) {
              await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
              return this._executeTurn(storyId, payload, {
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

      await this.loadMessages(storyId);
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
          detail: {
            role: ROLES.AI,
            characterId: story?.aiId,
            text: generatedText,
          },
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
    // [FIX] Crash Prevention: Check state before requiring strict ID
    if (!state.story.activeId) {
      console.warn("[TurnManager] Regenerate ignored: No active story.");
      return;
    }

    const storyId = TurnManager.requireActive();
    const msgs = state.messages.byStoryId[storyId] || [];
    if (msgs.length === 0) return;

    const last = msgs[msgs.length - 1];
    if (last.role !== ROLES.AI && last.role !== ROLES.FRACTAL) return;

    let note;
    if (manualInstruction === "VANILLA") {
      log(`[PROMETHEUS] Regenerating with VANILLA strategy (No Variance).`);
      note = null;
    } else if (manualInstruction) {
      log(
        `[PROMETHEUS] Regenerating with Manual Instruction: ${manualInstruction}`,
      );
      note = `[SYSTEM: DIRECTOR_OVERRIDE]\nDirective: ${manualInstruction}`;
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
    if (last.role !== ROLES.AI && last.role !== ROLES.FRACTAL) return;

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

  // CENTRALIZED PULSE LOGIC (Migrated from Worker)
  async _runPulse(storyId, targetId) {
    try {
      log(`[TurnManager] ✨ Initiating Simulation Pulse...`);

      const story = await db.stories.get(storyId);
      if (!story) {
        console.warn(`[TurnManager] Pulse Story Not Found: ${storyId}`);
        return;
      }

      // 0. Fetch All Actors for Context
      const allEntities = await Promise.all([
        entities.get("character", story.aiId),
        entities.get("character", story.userId),
        entities.get(ROLES.FRACTAL, story.fractalId),
      ]);
      // Filter out nulls (e.g. if Fractal doesn't exist yet)
      const validEntities = allEntities.filter((e) => e);

      // Identify Target & Others
      const targetEntity = validEntities.find((e) => e.id === targetId);
      const others = validEntities.filter((e) => e.id !== targetId);

      if (!targetEntity) {
        console.warn(`[TurnManager] Pulse Target Not Found: ${targetId}`);
        return;
      }

      // 1. Build Pulse Pulse
      const builder = new ContextBuilder(storyId);
      const activeThreads = targetEntity.customData?.plot?.active || [];

      // Fetch history for context
      const msgs = await TurnManager.loadMessages(storyId);

      // Window = Heartbeat Rate (5) * Approx Msgs Per Turn (3: AI, User, Fractal?) = 15
      const pulseHistory = msgs.slice(-15);

      const payload = await builder.buildPulse(
        targetEntity,
        others,
        pulseHistory,
        activeThreads,
      );

      // 2. Execute LLM Request
      const response = await LlmService.generate(payload, {
        json: true,
      });

      // 3. Parse JSON
      let data;
      try {
        let jsonText = "";
        // [RESILIENCE] Handle String Objects / Text Plugin Wrappers
        if (typeof response === "object" && response !== null) {
          jsonText =
            response.generatedText ||
            response.text ||
            (response.toString ? response.toString() : String(response));
        } else {
          jsonText = String(response);
        }

        // Extract JSON block (greedy match for outer braces)
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        } else {
          // Fallback: strip markdown if regex failed
          jsonText = jsonText.replace(/```json\n?|```/g, "").trim();
        }

        // [FIX] Strip explicit plus signs (e.g., "val": +15) which break JSON
        jsonText = jsonText.replace(/:\s*\+(\d+)/g, ": $1");

        data = JSON.parse(jsonText);
      } catch (parseErr) {
        console.warn("[TurnManager] Pulse JSON Parse Failed:", response);
        return;
      }

      // 4. Apply Updates
      if (data) {
        let needsSave = false;
        const updates = { customData: { ...targetEntity.customData } };

        // 4.1 LOG ENTRY (Long Term Memory)
        if (data.log_entry && typeof data.log_entry === "string") {
          // [FIX] Calculate logical turn count from history
          const turnCount = msgs.filter((m) => m.role === "model").length;
          const entry = `\n[Turn ${turnCount}] ${data.log_entry}`;
          updates.past = (targetEntity.past || "") + entry;
          needsSave = true;
          log(`[TurnManager] 🧠 New Memory Engram:`, entry);
        }

        // Apply Dynamics (RECONCILIATION LOGIC)
        if (data.dynamics) {
          const currentDynamics = targetEntity.dynamics || {
            entropy: 50,
            velocity: 50,
            resonance: 50,
            permeability: 50,
          };
          const ledger = targetEntity.customData?.reflex_ledger || {
            entropy: 0,
            velocity: 0,
            resonance: 0,
            permeability: 0,
          };
          const finalDynamics = { ...currentDynamics };

          Object.keys(currentDynamics).forEach((key) => {
            // 1. Get AI's "Total Delta" assessment (e.g. +15)
            const aiDelta = parseInt(data.dynamics[key]) || 0;

            // 2. Subtract what Reflex already did (e.g. +10)
            const reflexAlreadyApplied = ledger[key] || 0;

            // 3. Determine remaining correction needed
            const correction = aiDelta - reflexAlreadyApplied;

            // 4. Apply Correction
            // Note: We clamp here to ensure safety, but logic is primarily additive
            let newVal = (currentDynamics[key] || 0) + correction;
            newVal = Math.max(0, Math.min(100, newVal));

            finalDynamics[key] = newVal;
          });

          // Apply Gravity & Config Rules via Main Physics Engine
          const processedDynamics = calculateDynamics(
            finalDynamics,
            targetEntity.baseline || targetEntity.dynamics || {},
          );

          updates.dynamics = {
            entropy: processedDynamics.entropy,
            velocity: processedDynamics.velocity,
            permeability: processedDynamics.permeability,
            resonance: processedDynamics.resonance,
          };

          // debug flags from physics engine
          if (processedDynamics._flags) {
            const flags = processedDynamics._flags;
            let debugMsg = "";
            if (flags.panicSpiral) debugMsg += ">> PANIC SPIRAL ACTIVE\n";
            if (flags.fogOfWar) debugMsg += ">> FOG OF WAR ACTIVE\n";
            if (debugMsg) log(debugMsg);
          }

          // CLEAR LEDGER AFTER RECONCILIATION
          updates.customData.reflex_ledger = {
            entropy: 0,
            velocity: 0,
            resonance: 0,
            permeability: 0,
          };

          needsSave = true;
          log("[TurnManager] Dynamics Reconciled:", updates.dynamics);
        }

        // Apply Present State
        if (data.state) {
          const currentPresent =
            typeof targetEntity.present === "object" &&
            targetEntity.present !== null
              ? targetEntity.present
              : { physical: String(targetEntity.present || ""), mental: "" };

          updates.present = {
            ...currentPresent,
            physical: data.state.physical || currentPresent.physical || "",
            mental: data.state.mental || currentPresent.mental || "",
          };
          needsSave = true;
          log("[TurnManager] State Updated:", updates.present);
        } else if (data.present && typeof data.present === "string") {
          updates.present = {
            ...targetEntity.present,
            physical: data.present,
          };
          needsSave = true;
        }

        // Apply Plot Logic
        if (data.plot) {
          const currentActive = [...(updates.customData.plot.active || [])];
          let currentResolved = [...(updates.customData.plot.resolved || [])];

          if (
            data.plot.resolved_indices &&
            Array.isArray(data.plot.resolved_indices)
          ) {
            const indicesToRemove = data.plot.resolved_indices
              .filter((i) => i >= 0 && i < currentActive.length)
              .sort((a, b) => b - a);

            // [DEBUG] Capture resolved strings for UI
            data.plot.resolved_debug = [];

            indicesToRemove.forEach((idx) => {
              const removed = currentActive.splice(idx, 1)[0];
              if (removed) {
                currentResolved.unshift(removed);
                data.plot.resolved_debug.push(removed);
              }
            });
          }

          if (data.plot.new_threads && Array.isArray(data.plot.new_threads)) {
            const newThreads = data.plot.new_threads.filter(
              (t) => typeof t === "string" && !currentActive.includes(t),
            );
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
            ...targetEntity,
            ...updates,
          });

          events.dispatchEvent(
            new CustomEvent(EVENTS.ENTITY_UPDATED, {
              detail: { id: targetId, ...updates },
            }),
          );
        }

        // [LOG] Inject Pulse into Chat (Visible only in Dev Mode)

        // [CONTEXT] Add entity name for UI display
        data.entity = targetEntity.name || "Unknown Entity";

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
    } catch (e) {
      error("Pulse Error", e);
    }
  },

  // ARCHIVIST LOGIC (Slow Loop - Memory & Profile)
  async _runArchivist(storyId, targetId, role) {
    try {
      log(`[TurnManager] 📜 Initiating Archivist Protocol for ${role}...`);

      const targetEntity = await entities.get(
        role === ROLES.FRACTAL ? "fractal" : "character",
        targetId,
      );
      if (!targetEntity) {
        console.warn(`[TurnManager] Archivist Target Not Found: ${targetId}`);
        return;
      }

      // 1. Context Build
      const builder = new ContextBuilder(storyId);
      const msgs = await this.loadMessages(storyId);
      // Deep History (Last ~30 turns for context)
      const historySlice = msgs.slice(-30);

      const payload = await builder.buildArchivist(
        targetEntity,
        historySlice,
        role,
      );

      // 2. LLM Gen
      const response = await LlmService.generate(payload, { json: true });

      // 3. Parse and Apply
      let data;
      try {
        let jsonText =
          typeof response === "object"
            ? response.generatedText || response.text
            : String(response);
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonText = jsonMatch[0];
        jsonText = jsonText.replace(/```json\n?|```/g, "").trim();
        data = JSON.parse(jsonText);
      } catch (parseErr) {
        console.warn("[TurnManager] Archivist JSON Parse Failed", parseErr);
        return;
      }

      if (data) {
        const updates = {};
        let needsSave = false;

        // Update Past (Append)
        if (data.past_update) {
          const entry = `\n[Archivist Entry] ${data.past_update}`;
          updates.past = (targetEntity.past || "") + entry;
          needsSave = true;
          log(`[TurnManager] 📜 Archived Memory for ${targetEntity.name}`);
        }

        // Update Present State
        if (data.state) {
          updates.present = {
            ...(targetEntity.present || {}),
            ...data.state,
          };
          needsSave = true;
        }

        // Update Forever (Evolution)
        if (data.forever_update) {
          updates.forever = {
            ...(targetEntity.forever || {}),
            ...data.forever_update,
          };
          needsSave = true;
          log(
            `[TurnManager] 🧬 FRACTAL EVOLUTION DETECTED for ${targetEntity.name}`,
          );
        }

        if (needsSave) {
          await entities.upsert(
            role === ROLES.FRACTAL ? "fractal" : "character",
            {
              ...targetEntity,
              ...updates,
            },
          );
          events.dispatchEvent(
            new CustomEvent(EVENTS.ENTITY_UPDATED, {
              detail: { id: targetId, ...updates },
            }),
          );
        }
      }
    } catch (e) {
      error("Archivist Error", e);
    }
  },

  generatePrologue: async (storyId) => {
    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
    const story = state.story.byId[storyId];
    events.dispatchEvent(
      new CustomEvent(EVENTS.TYPING_STARTED, {
        detail: { role: ROLES.FRACTAL, characterId: story.fractalId },
      }),
    );

    try {
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildPrologue();

      if (!payload) {
        log("[RPGlitch] No prologue strategy. Triggering AI First Message.");
        events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
        await TurnManager.generateAiResponse(storyId);
        return;
      }

      log("[RPGlitch] Prologue Prompt:", payload.system);

      let response;
      let attempts = 0;
      const MAX_ATTEMPTS = 3;

      while (attempts < MAX_ATTEMPTS) {
        attempts++;
        try {
          response = await LlmService.generate({
            ...payload,
            temperature: 0.2,
          });
          break;
        } catch (e) {
          if (e.name === "AbortError") throw e;
          if (attempts >= MAX_ATTEMPTS) throw e;
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        }
      }

      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));

      const fractalEntity = await entities.get(ROLES.FRACTAL, story.fractalId);
      const characterName = fractalEntity?.name || "Fractal";

      await db.messages.add({
        storyId,
        role: ROLES.FRACTAL,
        type: "OOC",
        text: response,
        characterName: characterName,
        createdAt: Date.now(),
        metadata: { phase: "prologue" },
      });

      await TurnManager.loadMessages(storyId);
      events.dispatchEvent(
        new CustomEvent(EVENTS.CHAT_REFRESH, { detail: { storyId } }),
      );

      audioService.play("notification");

      await TurnManager.generateAiResponse(storyId);
    } catch (e) {
      error("Prologue Gen Error", e);
      window.dispatchEvent(
        new CustomEvent("app-error", {
          detail: { error: e, type: "generation" },
        }),
      );
      events.dispatchEvent(new CustomEvent(EVENTS.TYPING_STOPPED));
      events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED));
    }
  },

  triggerEpilogue: async () => {
    const storyId = TurnManager.requireActive();
    const story = state.story.byId[storyId];

    let signatureColor = DEFAULT_COLORS.FRACTAL;
    try {
      const fractal = await entities.get(ROLES.FRACTAL, story.fractalId);
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
      const builder = new ContextBuilder(storyId);
      const payload = await builder.buildEpilogue();

      if (!payload) throw new Error("Epilogue strategy not supported.");

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
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        }
      }

      const fractalEntity = await entities.get(ROLES.FRACTAL, story.fractalId);
      const characterName = fractalEntity?.name || "Fractal";

      await db.messages.add({
        storyId,
        role: ROLES.FRACTAL,
        type: "OOC",
        text: response,
        characterName: characterName,
        createdAt: Date.now(),
        isEpilogue: true,
        metadata: { phase: "epilogue" },
      });

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

      await TurnManager.loadMessages(storyId);

      const { renderChat } = await import("../ui/components/chat/feed.js");
      await renderChat(storyId);

      audioService.play("notification");
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
    if (!storyId) return null;

    const builder = new ContextBuilder(storyId);
    const payload = await builder.buildGhostwriter(text);

    const response = await LlmService.generate(payload, {
      maxTokens: 300,
      temperature: 0.7,
    });

    const { text: cleanText } = parseAiResponse(response);
    return cleanText;
  },

  generateVisualFromDraft: async (draftText) => {
    const storyId = TurnManager.requireActive();
    if (!storyId) return;

    events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED));
    try {
      log("[TurnManager] Generating visual from draft:", draftText);

      const story = state.story.byId[storyId];
      const [aiEntity, userEntity, fractalEntity] = await Promise.all([
        entities.get("character", story.aiId),
        entities.get("character", story.userId),
        entities.get(ROLES.FRACTAL, story.fractalId),
      ]);

      const blended = calculateBlendedParams(
        aiEntity,
        userEntity,
        fractalEntity,
      );
      const visualOptions = blended.visual || {
        guidanceScale: PHYSICS_CONSTANTS.GUIDANCE_BASE,
      };

      const imageUrl = await VisualManager.generate(draftText, {
        resolution: IMG_RESOLUTION,
        guidanceScale: visualOptions.guidanceScale,
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

      let vTarget = targetType || "character";
      if (targetType === ROLES.FRACTAL) vTarget = "scene";

      const vPayload = await builder.buildMaestroPrompt(vTarget);
      vPayload.system += `\n<RAW_INTENT>\n${visualPrompt}\n</RAW_INTENT>`;

      const refinedPrompt = await LlmService.generate(vPayload, {
        maxTokens: 300,
        temperature: 0.3,
      });

      const story = state.story.byId[storyId];
      const [aiEntity, userEntity, fractalEntity] = await Promise.all([
        entities.get("character", story.aiId),
        entities.get("character", story.userId),
        entities.get(ROLES.FRACTAL, story.fractalId),
      ]);

      const blended = calculateBlendedParams(
        aiEntity,
        userEntity,
        fractalEntity,
      );
      const visualOptions = blended.visual || {
        guidanceScale: PHYSICS_CONSTANTS.GUIDANCE_BASE,
      };

      const resolution = VisualManager.getResolutionForMode(
        message.aspect || vTarget,
      );

      const imageUrl = await VisualManager.generate(refinedPrompt, {
        resolution,
        guidanceScale: visualOptions.guidanceScale,
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
[VISUALS_AUTHORIZED]
</DIRECTOR_OVERRIDE>`;

    await TurnManager.generateAiResponse(storyId, { instruction });
  },
};

events.addEventListener(EVENTS.DB_UPDATED, async () => {
  const activeId = state.story.activeId;
  if (activeId) await TurnManager.loadMessages(activeId);
});
