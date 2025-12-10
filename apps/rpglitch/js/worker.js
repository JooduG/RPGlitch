/**
 * RPGlitch WebWorker
 * Handles heavy background simulation logic off the main thread.
 * 
 * RESPONSIBILITIES:
 * 1. Narrative Physics (Dynamics Calculation)
 * 2. Database Writes (Entity Updates, Message Logs)
 * 3. Context Building (preparing LLM payloads)
 * 4. Memory Compression (Archivist)
 * 
 * CONSTRAINTS:
 * - No DOM access.
 * - No `window.ai` access (must proxy via Main Thread).
 * - Must hydrate global `state` before running logic.
 */

import { db } from "./core-db.js";
import { state, applyPatch } from "./app-state.js";
import { calculateDynamics } from "./engine-physics.js";
import { ContextBuilder } from "./engine-prompt-builder.js";
import { entities } from "./entity-crud.js";

// --- STATE HYDRATION ---

async function hydrateState(storyId) {
    const [settings, story, messages] = await Promise.all([
        db.settings.get("app-settings"),
        db.stories.get(storyId),
        db.messages.where("storyId").equals(storyId).sortBy("createdAt")
    ]);

    applyPatch({
        settings: settings || state.settings,
        story: {
            activeId: storyId,
            byId: story ? { [storyId]: story } : {}
        },
        messages: {
            byStoryId: { [storyId]: messages || [] }
        }
    });
}

// --- UTILS ---

function createPhysicsDebugLog(oldDynamics, newDynamics, entityName) {
    const flags = newDynamics._flags || {};
    let debugText = `[PHYSICS LOG] TARGET: ${entityName || 'Unknown'}\n`;
    debugText += `ENTROPY: ${newDynamics.entropy}% (was ${oldDynamics.entropy}%)\n`;
    debugText += `PERMEABILITY: ${newDynamics.permeability}% (was ${oldDynamics.permeability}%)\n`;
    debugText += `VELOCITY: ${newDynamics.velocity}% (was ${oldDynamics.velocity}%)\n`;
    debugText += `RESONANCE: ${newDynamics.resonance}% (was ${oldDynamics.resonance}%)\n\n`;

    if (flags.panicSpiral) debugText += ">> LAW 4: PANIC SPIRAL TRIGGERED (Velocity Forced Up)\n";
    if (flags.fogOfWar) debugText += ">> LAW 2: FOG OF WAR TRIGGERED (Resonance Dampened)\n";
    if (flags.echoChamber) debugText += ">> LAW 5: ECHO CHAMBER ACTIVE (Future Vector Critical)\n";
    if (flags.glassCannon) debugText += ">> LAW 6: GLASS CANNON ACTIVE (Double Impact Gain)\n";

    if (newDynamics.permeability < oldDynamics.permeability && newDynamics.velocity > 80) {
        debugText += ">> LAW 1: ADRENALINE SHIELD (Permeability Penalty)\n";
    }
    if (newDynamics.entropy < oldDynamics.entropy && newDynamics.velocity < 20) {
        debugText += ">> LAW 3: COOL-DOWN (Entropy Reduced)\n";
    }

    return debugText.trim();
}

// --- MESSAGE HANDLER ---

self.onmessage = async (e) => {
    const { type, payload, meta } = e.data;

    if (type === 'CMD_START_UPDATE') {
        await handleStartUpdate(payload);
    } else if (type === 'CMD_LLM_RESPONSE') {
        // Check if this was an Archivist response
        if (meta && meta.isArchivist) {
            await handleArchivistResponse(payload, meta);
        } else {
            await handleLlmResponse(payload);
        }
    }
};

// --- LOGIC ---

let pendingContext = null; // Store context between request and response

async function handleStartUpdate({ storyId, targetType, linkedMessageId }) {
    console.log("[WORKER] Starting Background Update...");

    try {
        await hydrateState(storyId);

        const builder = new ContextBuilder(storyId);
        const story = state.story.byId[storyId];

        if (!story) {
            console.error("[WORKER] Story not found");
            postMessage({ type: 'CMD_UPDATE_COMPLETE', payload: { success: false } });
            return;
        }

        let entity = null;
        if (targetType === 'ai_character') entity = await entities.get("character", story.aiCharacterId);
        else if (targetType === 'user_character') entity = await entities.get("character", story.userCharacterId);
        else if (targetType === 'world') entity = await entities.get("world", story.worldId);

        if (!entity) {
            console.warn("[WORKER] Target entity not found");
            postMessage({ type: 'CMD_UPDATE_COMPLETE', payload: { success: false } });
            return;
        }

        // 1. Calculate algorithmic fallback
        const oldDynamics = entity.dynamics || { entropy: 10, permeability: 50, velocity: 10, resonance: 10 };
        const fallbackDynamics = calculateDynamics(oldDynamics);

        // 2. Build Prompt
        const promptPayload = await builder.buildUpdater(targetType, null);

        // Store context for the response phase
        pendingContext = {
            storyId,
            targetType,
            targetEntityId: entity.id, // Store ID directly
            linkedMessageId,
            oldDynamics,
            fallbackDynamics,
            entityName: entity.name,
            entityType: entity.type
        };

        // 3. Request LLM Execution from Main Thread
        postMessage({
            type: 'CMD_LLM_REQUEST',
            payload: promptPayload
        });

    } catch (err) {
        console.error("[WORKER] Error in handleStartUpdate:", err);
        postMessage({ type: 'CMD_UPDATE_COMPLETE', payload: { success: false, error: err.message } });
    }
}

async function handleLlmResponse({ text }) {
    if (!pendingContext) {
        console.error("[WORKER] Received response but no pending context.");
        return;
    }

    const ctx = pendingContext;
    pendingContext = null; // Clear

    try {
        // Validation: Verify linked message still exists (race condition check)
        if (ctx.linkedMessageId) {
            const msgExists = await db.messages.get(ctx.linkedMessageId);
            if (!msgExists) {
                console.warn(`[WORKER] Aborting update. Msg ${ctx.linkedMessageId} deleted.`);
                postMessage({ type: 'CMD_UPDATE_COMPLETE', payload: { success: false } });
                return;
            }
        }

        let updates = {};
        try {
            // [FIX] Strip <think> block first to avoid JSON parse errors
            const cleanJson = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                updates = JSON.parse(jsonMatch[0]);
            } else {
                console.warn("[WORKER] No JSON found in response");
                postMessage({ type: 'CMD_UPDATE_COMPLETE', payload: { success: false } });
                return;
            }
        } catch (jsonErr) {
            console.warn("[WORKER] JSON Parse Error:", jsonErr);
            postMessage({ type: 'CMD_UPDATE_COMPLETE', payload: { success: false } });
            return;
        }

        // Apply Logic
        const aiDynamics = updates.dynamics || {};
        const finalDynamics = {
            entropy: aiDynamics.entropy ?? ctx.fallbackDynamics.entropy,
            permeability: aiDynamics.permeability ?? ctx.fallbackDynamics.permeability,
            velocity: aiDynamics.velocity ?? ctx.fallbackDynamics.velocity,
            resonance: aiDynamics.resonance ?? ctx.fallbackDynamics.resonance
        };

        // Log Debug Message
        const debugText = createPhysicsDebugLog(ctx.oldDynamics, finalDynamics, ctx.entityName);
        await db.messages.add({
            storyId: ctx.storyId,
            role: "system",
            type: "DEBUG",
            text: debugText,
            createdAt: Date.now() + 1
        });

        // Re-get entity to ensure freshness
        const freshEntity = await entities.get(ctx.entityType, ctx.targetEntityId);

        if (freshEntity) {
            const updatedEntity = {
                ...freshEntity,
                forever: updates.forever || freshEntity.forever,
                past: updates.past || freshEntity.past,
                present: updates.present || freshEntity.present,
                future: updates.future || freshEntity.future,
                dynamics: finalDynamics,
                updatedAt: Date.now()
            };

            // Archivist Logic (Memory Compression)
            const MAX_PAST_LENGTH = 2000;
            if (updatedEntity.past && updatedEntity.past.length > MAX_PAST_LENGTH) {
                console.log(`[WORKER] Archivist Triggered for ${ctx.entityName}`);

                // Save first to be safe
                await entities.upsert(ctx.entityType, updatedEntity);

                // Then request Archivist
                await handleArchivist(updatedEntity, ctx.storyId);
            } else {
                await entities.upsert(ctx.entityType, updatedEntity);
                console.log(`[WORKER] Update applied for ${ctx.entityName}`);
                postMessage({ type: 'CMD_UPDATE_COMPLETE', payload: { success: true } });
            }
        } else {
            postMessage({ type: 'CMD_UPDATE_COMPLETE', payload: { success: false } });
        }

    } catch (e) {
        console.error("[WORKER] Error in handleLlmResponse:", e);
        postMessage({ type: 'CMD_UPDATE_COMPLETE', payload: { success: false, error: e.message } });
    }
}

async function handleArchivist(entity, storyId) {
    try {
        const builder = new ContextBuilder(storyId);
        // We might need to refresh state again if we want to be paranoid, 
        // but for Archivist local entity state is the most important.

        const archPayload = await builder.buildArchivist(entity);

        // Request Archivist run with META tag
        postMessage({
            type: 'CMD_LLM_REQUEST',
            payload: archPayload,
            meta: { isArchivist: true, entityId: entity.id, entityType: entity.type }
        });

    } catch (e) {
        console.error("[WORKER] Archivist prep failed:", e);
        postMessage({ type: 'CMD_UPDATE_COMPLETE', payload: { success: true } }); // Still success, just no compression
    }
}

async function handleArchivistResponse({ text }, meta) {
    try {
        // [FIX] Strip <think> block from summary
        const summary = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

        const entity = await entities.get(meta.entityType, meta.entityId);
        if (entity && summary && summary.length < entity.past.length) {
            entity.past = summary;
            await entities.upsert(meta.entityType, entity);
            console.log(`[WORKER] Archivist Compression complete. New Size: ${entity.past.length}`);
        }
    } catch (e) {
        console.warn("[WORKER] Archivist failed:", e);
    } finally {
        postMessage({ type: 'CMD_UPDATE_COMPLETE', payload: { success: true } });
    }
}
