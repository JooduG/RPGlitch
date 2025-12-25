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
import { ENTITY_TYPES } from "../../core/constants.js";

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
// V5 UPGRADE: Generates the specific block that bubble.js renders as a UI Bar
// V5 UPGRADE: Generates the specific block that bubble.js renders as a UI Bar
function createPhysicsDebugLog(
  oldDynamics,
  newDynamics,
  entityName,
  explanations = {},
) {
  const flags = newDynamics._flags || {};

  // 1. The Narrative Log (For the Developer)
  let debugText = `**PHYSICS UPDATE: ${entityName || "Unknown"}**\n`;

  const formatLine = (label, key) => {
    const oldVal = oldDynamics[key];
    const newVal = newDynamics[key];
    const explain = explanations[key] ? ` ${explanations[key]}` : "";
    return `${label}: ${oldVal} -> ${newVal}${explain}\n`;
  };

  debugText += formatLine("Entropy", "entropy");
  debugText += formatLine("Velocity", "velocity");
  debugText += formatLine("Permeability", "permeability");
  debugText += formatLine("Resonance", "resonance");

  if (flags.panicSpiral)
    debugText += ">> LAW 4: PANIC SPIRAL (Velocity Forced Up)\n";
  if (flags.fogOfWar)
    debugText += ">> LAW 2: FOG OF WAR (Resonance Dampened)\n";

  return debugText;
}

// ... (skip down to handleLlmResponse, but we can't skip in replace, so we just target the needed part)
// Actually, I can replace the function and the handler call setup.
// Let's do this in two chunks if possible, or one big chunk if they are contiguous.
// They are NOT contiguous (lines 38-56 vs 143-203). replace_file_content works on a single contiguous block.
// I MUST use multi_replace_file_content.

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
    if (targetType === ENTITY_TYPES.AI_CHARACTER)
      entity = await entities.get("character", story.aiId);
    else if (targetType === ENTITY_TYPES.USER_CHARACTER)
      entity = await entities.get("character", story.userId);
    else if (targetType === ENTITY_TYPES.FRACTAL)
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
    const explanations = {};

    try {
      // V5 FIX: Extract Explanations from HUD before cleaning
      const hudMatch = text.match(/\[STATUS_HUD\]([\s\S]*?)\[\/STATUS_HUD\]/);
      if (hudMatch) {
        const hudContent = hudMatch[1];
        const lines = hudContent.split("\n");
        lines.forEach((line) => {
          // Match "Entropy: 85 (Because reasons...)"
          // Capture group 1: Key (Entropy)
          // Capture group 2: Value (85) (ignored)
          // Capture group 3: Explanation ((Because reasons...))
          const match = line.match(/^\s*(\w+):\s*\d+\s*(\(.*?\))/);
          if (match) {
            const key = match[1].toLowerCase(); // entropy
            const explain = match[2]; // (Because reasons...)
            explanations[key] = explain;
          }
        });
      }

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
      explanations,
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
      // [NEXUS FIX] Map 'status' to entity.present.nonPhysical
      let presentState = updates.present || freshEntity.present || {};
      if (updates.status) {
        presentState = { ...presentState, nonPhysical: updates.status };
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
