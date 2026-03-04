import { memorize } from "@core/intelligence/intelligence_echo.js"
import { db } from "@data/db.js"
import { entities } from "@data/repository.js"
import { app } from "@state/app.svelte.js"
import { runtime } from "@state/runtime.svelte.js"
import { simulation_log } from "@state/simulation_log.svelte.js"
import { Session } from "./session-driver.js"

/**
 * src/core/engine/NarrativeDirector.js
 * 🎬 NARRATIVE DIRECTOR
 * Manages Story Beats, Vector synchronization, and L2 Memory Consolidation.
 * Extracted from engine.js to enforce SRP.
 */

/************************************************************************************
 * 🧩 [SECTION: NARRATIVE DIRECTOR]
 * ----------------------------------------------------------------------------------
 * Coordinates narrative state updates and tiered memory consolidation.
 ************************************************************************************/

export const NarrativeDirector = {
    _isConsolidating: false,

    /**
     * UPDATE
     * Ensures narrative state is seeded and vectors are non-empty.
     */
    update: () => {
        // [R5] Narrative State is now reactive in runtime.narrative
        // No manual sync required.

        // AUTO-SEED: Ensure activeVector is never empty
        const fractal = runtime.active_fractal
        if (fractal && (!Array.isArray(fractal.future) || fractal.future.length === 0)) {
            runtime.addVector("Continue the journey.", "FRACTAL", true)
            app.log("NarrativeDirector: Auto-seeded activeVector", "system")
        }
    },

    /**
     * L2 CONSOLIDATION (Tiered Memory)
     * Evicts old messages and compresses them into lore "Resonance".
     */
    consolidate: async () => {
        if (NarrativeDirector._isConsolidating) return
        NarrativeDirector._isConsolidating = true

        try {
            const story_id = Session.requireActive()
            const messages = await Session.load_log(story_id)
            const unconsolidated = messages.filter((m) => !m.meta?.consolidated)

            // Trigger every 10 unconsolidated messages
            if (unconsolidated.length >= 12) {
                const slice = unconsolidated.slice(0, 10)
                app.log(`Memory Nexus: Consolidating ${slice.length} turns into lore...`, "system")

                const ai = runtime.activeAI
                if (ai) {
                    const resonance = await memorize(ai, slice, "character")
                    if (resonance) {
                        if (!ai.past) ai.past = { vectors: [] }
                        if (!Array.isArray(ai.past.vectors)) ai.past.vectors = []
                        ai.past.vectors.push(resonance)
                        await entities.save("character", ai)
                    }
                }

                // Mark as consolidated in DB
                for (const msg of slice) {
                    msg.meta = { ...msg.meta, consolidated: true }
                    await db.messages.update(msg.id, { meta: msg.meta })
                }

                simulation_log.refresh()
            }
        } catch (err) {
            console.error("[Memory Nexus] Consolidation failed:", err)
        } finally {
            NarrativeDirector._isConsolidating = false
        }
    },

    /**
     * PERSIST BACKGROUND
     * Saves off-screen dynamics momentum updates to the entity store.
     * @param {Array} updates - Array of entity objects with updated dynamics.
     */
    persist_background: async (updates) => {
        if (!updates || updates.length === 0) return

        for (const update of updates) {
            await entities.upsert("character", update)
        }
        app.log(`Dynamics Engine: Persisted momentum for ${updates.length} background entities.`, "system")
    },
}
