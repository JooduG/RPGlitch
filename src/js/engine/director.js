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
  let text = response
    .replace(/STOP SEQUENCE.*$/i, "")
    .replace(/STOP PROTOCOL.*$/i, "")
    .replace(/\(Glitch must react\).*$/i, "")
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
        temperature: PHYSICS_CONSTANTS.VISUAL_TEMP_DEFAULT,
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
          const { text, visualPrompt, targetType } = parseAiResponse(response);
          generatedText = text;

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
          const metadata = visualPrompt
            ? { visualPrompt, targetType, refinedPrompt: visuals.refinedPrompt }
            : null;

          const role = options.ghostwrite ? ROLES.USER : ROLES.AI;
          const characterName = options.ghostwrite
            ? userEntity?.name || "User"
            : aiEntity?.name || "AI";

          if (mode === "append" && appendTargetId) {
            const original = await db.messages.get(appendTargetId);
            const update = { text: original.text + " " + text };
            if (visuals.imageUrl) {
              update.attachmentUrl = visuals.imageUrl;
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
              attachmentUrl: visuals.imageUrl,
              metadata,
            });
          }

          // 6. PHYSICS (HEARTBEAT LOGIC)
          // We check the history length to determine the heartbeat.
          const msgs = await TurnManager.loadMessages(storyId);
          // Filter only IC messages to count "Turns"
          const aiTurns = msgs.filter((m) => m.role === ROLES.AI).length;

          // If turn count is a multiple of the rate (and not 0), PULSE.
          // ROTATION: Turn 3 (AI) -> Turn 6 (User) -> Turn 9 (Fractal)
          if (aiTurns > 0 && aiTurns % PHYSICS_CONSTANTS.HEARTBEAT_RATE === 0) {
            const cycleIndex = (aiTurns / PHYSICS_CONSTANTS.HEARTBEAT_RATE) % 3;
            let targetId = story.aiId; // Default (Index 1 or 0 if math weird/modulo 1)
            let targetType = "AI";

            // Turn 3 (3/3 = 1 % 3 = 1) -> AI
            // Turn 6 (6/3 = 2 % 3 = 2) -> USER
            // Turn 9 (9/3 = 3 % 3 = 0) -> FRACTAL

            if (cycleIndex === 2) {
              targetId = story.userId;
              targetType = "USER";
            } else if (cycleIndex === 0) {
              targetId = story.fractalId;
              targetType = "FRACTAL";
            } else {
              targetType = "AI";
            }

            if (targetId) {
              log(
                `[Director] ❤️ Heartbeat Triggered (Turn ${aiTurns}) - Target: ${targetType} (${targetId})`,
              );
              TurnManager._runPulse(storyId, targetId);
            }
          }

          break;
        } catch (e) {
          if (e.name === "AbortError") throw e;
          if (e.message.includes(ERROR_MESSAGES.CONNECTION_LOST)) {
            if (retryCount < MAX_STREAM_RETRIES) {
              await new Promise((r) => setTimeout(r, 1000 * (retryCount + 1)));
              return TurnManager._executeTurn(storyId, payload, {
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
  _runPulse: async (storyId, targetId) => {
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

      // Window = Heartbeat Rate (3) * Approx Msgs Per Turn (3: AI, User, Fractal?) = 9
      const pulseHistory = msgs.slice(-9);

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
        const jsonText = response.replace(/```json\n|```/g, "").trim();
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
          const entry = `\n[Turn ${state.turnCount || history.length}] ${data.log_entry}`;
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
          response = await LlmService.generate(payload);
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
        temperature: 0.3,
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
