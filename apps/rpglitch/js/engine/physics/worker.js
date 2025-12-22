/**
 * RPGlitch WebWorker
 * Handles heavy background simulation logic off the main thread.
 * NOW UPDATED FOR PROMETHEUS V5 (HUD & HUD Parsing)
 */

import { db } from "../../core/db.js";
import { state, applyPatch } from "../../core/state.js";
import { calculateDynamics } from "./main.js";
import { ContextBuilder } from "../prompter.js";
import { entities } from "../../data/repo.js";

// --- STATE HYDRATION ---

async function hydrateState(storyId) {
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
}

// --- UTILS ---

// V5 UPGRADE: Generates the specific block that bubble.js renders as a UI Bar
function createPhysicsDebugLog(oldDynamics, newDynamics, entityName) {
  const flags = newDynamics._flags || {};

  // 1. The Visual HUD Block (For the UI)
  let debugText = `[STATUS_HUD]
Entropy: ${newDynamics.entropy}
Velocity: ${newDynamics.velocity}
Permeability: ${newDynamics.permeability}
Resonance: ${newDynamics.resonance}
[/STATUS_HUD]`;

  // 2. The Narrative Log (For the Developer)
  debugText += `\n**PHYSICS UPDATE: ${entityName || "Unknown"}**\n`;
  debugText += `Entropy: ${oldDynamics.entropy} -> ${newDynamics.entropy}\n`;
  debugText += `Velocity: ${oldDynamics.velocity} -> ${newDynamics.velocity}\n`;

  if (flags.panicSpiral)
    debugText += ">> LAW 4: PANIC SPIRAL (Velocity Forced Up)\n";
  if (flags.fogOfWar)
    debugText += ">> LAW 2: FOG OF WAR (Resonance Dampened)\n";

  return debugText;
}

// --- MESSAGE HANDLER ---

self.onmessage = async (e) => {
  const { type, payload, meta } = e.data;

  if (type === "CMD_START_UPDATE") {
    await handleStartUpdate(payload);
  } else if (type === "CMD_LLM_RESPONSE") {
    if (meta && meta.isArchivist) {
      await handleArchivistResponse(payload, meta);
    } else {
      await handleLlmResponse(payload);
    }
  }
};

// --- LOGIC ---

let pendingContext = null;

async function handleStartUpdate({ storyId, targetType, linkedMessageId }) {
  // console.log("[WORKER] Starting Background Update...");

  try {
    await hydrateState(storyId);

    const builder = new ContextBuilder(storyId);
    const story = state.story.byId[storyId];

    if (!story) {
      postMessage({ type: "CMD_UPDATE_COMPLETE", payload: { success: false } });
      return;
    }

    let entity = null;
    if (targetType === "ai_character")
      entity = await entities.get("character", story.aiId);
    else if (targetType === "user_character")
      entity = await entities.get("character", story.userId);
    else if (targetType === "fractal")
      entity = await entities.get("fractal", story.fractalId);

    if (!entity) {
      postMessage({ type: "CMD_UPDATE_COMPLETE", payload: { success: false } });
      return;
    }

    // 1. Calculate algorithmic fallback
    const oldDynamics = entity.dynamics || {
      entropy: 10,
      permeability: 50,
      velocity: 10,
      resonance: 10,
    };
    const fallbackDynamics = calculateDynamics(oldDynamics);

    // 2. Build Prompt
    const promptPayload = await builder.buildUpdater(targetType, null);

    // Store context
    pendingContext = {
      storyId,
      targetType,
      targetEntityId: entity.id,
      linkedMessageId,
      oldDynamics,
      fallbackDynamics,
      entityName: entity.name,
      entityType: entity.type,
    };

    // 3. Request LLM Execution
    postMessage({
      type: "CMD_LLM_REQUEST",
      payload: promptPayload,
    });
  } catch (err) {
    console.error("[WORKER] Error in handleStartUpdate:", err);
    postMessage({
      type: "CMD_UPDATE_COMPLETE",
      payload: { success: false, error: err.message },
    });
  }
}

async function handleLlmResponse({ text }) {
  if (!pendingContext) return;

  const ctx = pendingContext;
  pendingContext = null;

  try {
    // Race Condition Check
    if (ctx.linkedMessageId) {
      const msgExists = await db.messages.get(ctx.linkedMessageId);
      if (!msgExists) {
        console.warn("[WORKER] Aborting update. Msg deleted.");
        postMessage({
          type: "CMD_UPDATE_COMPLETE",
          payload: { success: false },
        });
        return;
      }
    }

    let updates = {};
    try {
      // V5 FIX: Clean the text of <think> AND [STATUS_HUD] before parsing JSON
      let cleanJson = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      cleanJson = cleanJson
        .replace(/\[STATUS_HUD\][\s\S]*?\[\/STATUS_HUD\]/g, "")
        .trim();

      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        updates = JSON.parse(jsonMatch[0]);
      } else {
        console.warn("[WORKER] No JSON found in response");
        postMessage({
          type: "CMD_UPDATE_COMPLETE",
          payload: { success: false },
        });
        return;
      }
    } catch (jsonErr) {
      console.warn("[WORKER] JSON Parse Error:", jsonErr);
      postMessage({ type: "CMD_UPDATE_COMPLETE", payload: { success: false } });
      return;
    }

    // Apply Logic
    const aiDynamics = updates.dynamics || {};
    const finalDynamics = {
      entropy: aiDynamics.entropy ?? ctx.fallbackDynamics.entropy,
      permeability:
        aiDynamics.permeability ?? ctx.fallbackDynamics.permeability,
      velocity: aiDynamics.velocity ?? ctx.fallbackDynamics.velocity,
      resonance: aiDynamics.resonance ?? ctx.fallbackDynamics.resonance,
    };

    // Log Debug Message with HUD Block
    const debugText = createPhysicsDebugLog(
      ctx.oldDynamics,
      finalDynamics,
      ctx.entityName,
    );

    await db.messages.add({
      storyId: ctx.storyId,
      role: "system",
      type: "DEBUG",
      text: debugText,
      createdAt: Date.now() + 1,
    });

    // Update Entity
    const freshEntity = await entities.get(ctx.entityType, ctx.targetEntityId);

    if (freshEntity) {
      const updatedEntity = {
        ...freshEntity,
        forever: updates.forever || freshEntity.forever,
        past: updates.past || freshEntity.past,
        present: updates.present || freshEntity.present,
        future: updates.future || freshEntity.future,
        dynamics: finalDynamics,
        updatedAt: Date.now(),
      };

      // Archivist Logic
      const MAX_PAST_LENGTH = 2000;
      if (updatedEntity.past && updatedEntity.past.length > MAX_PAST_LENGTH) {
        await entities.upsert(ctx.entityType, updatedEntity);
        await handleArchivist(updatedEntity, ctx.storyId);
      } else {
        await entities.upsert(ctx.entityType, updatedEntity);
        postMessage({
          type: "CMD_UPDATE_COMPLETE",
          payload: { success: true },
        });
      }
    } else {
      postMessage({ type: "CMD_UPDATE_COMPLETE", payload: { success: false } });
    }
  } catch (e) {
    console.error("[WORKER] Error in handleLlmResponse:", e);
    postMessage({
      type: "CMD_UPDATE_COMPLETE",
      payload: { success: false, error: e.message },
    });
  }
}

async function handleArchivist(entity, storyId) {
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
}

async function handleArchivistResponse({ text }, meta) {
  try {
    const summary = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    const entity = await entities.get(meta.entityType, meta.entityId);
    if (entity && summary && summary.length < entity.past.length) {
      entity.past = summary;
      await entities.upsert(meta.entityType, entity);
    }
  } catch (e) {
    console.warn("[WORKER] Archivist failed:", e);
  } finally {
    postMessage({ type: "CMD_UPDATE_COMPLETE", payload: { success: true } });
  }
}
