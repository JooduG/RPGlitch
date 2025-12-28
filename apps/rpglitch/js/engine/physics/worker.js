/**
 * RPGlitch WebWorker
 * Handles heavy background simulation logic off the main thread.
 * NOW UPDATED FOR PROMETHEUS V5 (HUD & HUD Parsing)
 */

import { db } from "../../core/db.js";
import { state, applyPatch } from "../../core/state.js";
import { calculateDynamics, parseLlmResponse } from "./main.js";
import { ContextBuilder } from "../prompter.js";
import { entities } from "../../data/repo.js";
import { ENTITY_TYPES } from "../../core/constants.js";
import { error } from "../../core/utils.js";

// --- STATE HYDRATION ---

// --- STATE HYDRATION ---

const hydrateState = async (storyId) => {
  const [settings, story, messages] = await Promise.all([
    db.settings.get("app-settings"),
    db.stories.get(storyId),
    db.messages.where("storyId").equals(storyId).sortBy("createdAt"),
  ]);

  applyPatch({
    settings: settings || state.settings,
    story: {
      activeId: storyId,
      byId: story ? { [storyId]: story } : {},
    },
    messages: {
      byStoryId: { [storyId]: messages || [] },
    },
  });
};

// --- UTILS ---

const createPhysicsDebugLog = (
  oldDynamics,
  newDynamics,
  entityName,
  explanations = {},
) => {
  const flags = newDynamics._flags || {};
  let debugText = `**PHYSICS UPDATE: ${entityName || "Unknown"}**\n`;

  const formatLine = (label, key) => {
    const newVal = newDynamics[key];
    const explain = explanations[key] ? ` ${explanations[key]}` : "";
    return `${label}: ${oldDynamics[key]} -> ${newVal}${explain}\n`;
  };

  ["entropy", "velocity", "permeability", "resonance"].forEach((key) => {
    debugText += formatLine(key.charAt(0).toUpperCase() + key.slice(1), key);
  });

  if (flags.panicSpiral)
    debugText += ">> LAW 4: PANIC SPIRAL (Velocity Forced Up)\n";
  if (flags.fogOfWar)
    debugText += ">> LAW 2: FOG OF WAR (Resonance Dampened)\n";

  return debugText;
};

// --- LOGIC ---

let pendingContext = null;

const handleArchivist = async (entity, storyId) => {
  try {
    const builder = new ContextBuilder(storyId);
    const archPayload = await builder.buildArchivist(entity);

    postMessage({
      type: "CMD_LLM_REQUEST",
      payload: archPayload,
      meta: { isArchivist: true, entityId: entity.id, entityType: entity.type },
    });
  } catch (e) {
    postMessage({ type: "CMD_UPDATE_COMPLETE", payload: { success: true } });
  }
};

const handleArchivistResponse = async ({ text }, meta) => {
  try {
    const summary = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const entity = await entities.get(meta.entityType, meta.entityId);
    if (entity && summary && summary.length < entity.past.length) {
      entity.past = summary;
      await entities.upsert(meta.entityType, entity);
    }
  } catch (e) {
    error("[WORKER] Archivist failed:", e);
  } finally {
    postMessage({ type: "CMD_UPDATE_COMPLETE", payload: { success: true } });
  }
};

const handleStartUpdate = async ({ storyId, targetType, linkedMessageId }) => {
  try {
    await hydrateState(storyId);
    const builder = new ContextBuilder(storyId);
    const story = state.story.byId[storyId];

    if (!story)
      return postMessage({
        type: "CMD_UPDATE_COMPLETE",
        payload: { success: false },
      });

    let entity = await entities.get(
      targetType === ENTITY_TYPES.FRACTAL ? "fractal" : "character",
      targetType === ENTITY_TYPES.AI_CHARACTER
        ? story.aiId
        : targetType === ENTITY_TYPES.USER_CHARACTER
          ? story.userId
          : story.fractalId,
    );

    if (!entity)
      return postMessage({
        type: "CMD_UPDATE_COMPLETE",
        payload: { success: false },
      });

    const oldDynamics = entity.dynamics || {
      entropy: 10,
      permeability: 50,
      velocity: 10,
      resonance: 10,
    };
    const promptPayload = await builder.buildUpdater(targetType, null);

    pendingContext = {
      storyId,
      targetType,
      targetEntityId: entity.id,
      linkedMessageId,
      oldDynamics,
      fallbackDynamics: calculateDynamics(oldDynamics),
      entityName: entity.name,
      entityType: entity.type,
    };

    postMessage({ type: "CMD_LLM_REQUEST", payload: promptPayload });
  } catch (err) {
    error("[WORKER] Error in handleStartUpdate:", err);
    postMessage({
      type: "CMD_UPDATE_COMPLETE",
      payload: { success: false, error: err.message },
    });
  }
};

const handleLlmResponse = async ({ text }) => {
  if (!pendingContext) return;
  const ctx = pendingContext;
  pendingContext = null;

  try {
    if (ctx.linkedMessageId && !(await db.messages.get(ctx.linkedMessageId))) {
      return postMessage({
        type: "CMD_UPDATE_COMPLETE",
        payload: { success: false },
      });
    }

    const { updates, explanations, error: parseError } = parseLlmResponse(text);
    if (parseError) {
      error("[WORKER] Logic Parse Error:", parseError);
      return postMessage({
        type: "CMD_UPDATE_COMPLETE",
        payload: { success: false, error: parseError },
      });
    }

    const aiD = updates.dynamics || {};
    const finalDynamics = {
      entropy: aiD.entropy ?? ctx.fallbackDynamics.entropy,
      permeability: aiD.permeability ?? ctx.fallbackDynamics.permeability,
      velocity: aiD.velocity ?? ctx.fallbackDynamics.velocity,
      resonance: aiD.resonance ?? ctx.fallbackDynamics.resonance,
    };

    await db.messages.add({
      storyId: ctx.storyId,
      role: "system",
      type: "DEBUG",
      text: createPhysicsDebugLog(
        ctx.oldDynamics,
        finalDynamics,
        ctx.entityName,
        explanations,
      ),
      createdAt: Date.now() + 1,
    });

    const freshEntity = await entities.get(ctx.entityType, ctx.targetEntityId);
    if (!freshEntity)
      return postMessage({
        type: "CMD_UPDATE_COMPLETE",
        payload: { success: false },
      });

    // [FIX] Deep Merge for Present State to prevent overwriting existing keys
    const currentPresent = freshEntity.present || {};
    let incomingPresent = updates.present || {};

    // Handle legacy string output from LLM
    if (typeof incomingPresent === "string") {
      incomingPresent = { physical: incomingPresent };
    }

    // MERGE: Spread existing first, then override with new data
    const presentState = {
      ...currentPresent,
      ...incomingPresent,
    };

    // Legacy Status Support (merges into nonPhysical)
    if (updates.status) {
      presentState.nonPhysical = updates.status;
    }

    const updatedEntity = {
      ...freshEntity,
      forever: updates.forever || freshEntity.forever,
      past: updates.past || freshEntity.past,
      present: presentState,
      future: updates.future || freshEntity.future,
      dynamics: finalDynamics,
      updatedAt: Date.now(),
    };

    if (updates.status && freshEntity.status !== undefined)
      updatedEntity.status = updates.status;

    if (updatedEntity.past?.length > 2000) {
      await entities.upsert(ctx.entityType, updatedEntity);
      await handleArchivist(updatedEntity, ctx.storyId);
    } else {
      await entities.upsert(ctx.entityType, updatedEntity);
      postMessage({
        type: "CMD_UPDATE_COMPLETE",
        payload: {
          success: true,
          dynamics: finalDynamics,
          entity: updatedEntity,
        },
      });
    }
  } catch (e) {
    error("[WORKER] Error in handleLlmResponse:", e);
    postMessage({
      type: "CMD_UPDATE_COMPLETE",
      payload: { success: false, error: e.message },
    });
  }
};

// --- MESSAGE HANDLER ---

self.onmessage = async (e) => {
  const { type, payload, meta } = e.data;
  if (type === "CMD_START_UPDATE") await handleStartUpdate(payload);
  else if (type === "CMD_LLM_RESPONSE") {
    if (meta?.isArchivist) await handleArchivistResponse(payload, meta);
    else await handleLlmResponse(payload);
  }
};
