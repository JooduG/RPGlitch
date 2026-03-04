import { ContextBroker } from "@core/intelligence/ContextBroker.js"
import { DynamicsEngine } from "@core/intelligence/DynamicsEngine.js"
import { PromptBuilder } from "@core/intelligence/PromptBuilder.js"
import { memorize } from "@core/intelligence/intelligence_echo.js"
import { LlmService } from "@core/intelligence/intelligence_service.js"
import { db } from "@data/db.js"
import { entities } from "@data/repository.js"
import { app } from "@state/app.svelte.js" // [R5]
import { runtime } from "@state/runtime.svelte.js"
import { engineState } from "@state/status.svelte.js" // [R5] Unified State
import { Session } from "./session-driver.js"

/**
 * The Engine provides a unified interface for the high-level simulation logic.
 * It serves as the primary controller for the Perchance narrative flow.
 */
export const Engine = {
    // --- SESSION ---
    requireActive: () => Session.requireActive(),
    getActive: () => Session.activeId,
    createFromSelection: (data) => Session.createFromSelection(data),
    loadMessages: (storyId) => Session.load_log(storyId),
    send: async (text) => {
        await Session.send(text)
        await Engine.generateAiResponse(Session.requireActive())
    },
    regenerate: () => Session.regenerate(),

    // --- CHRONO ---
    // tick: (delta) => Chrono.tick(delta), // Removed: Unused/Not Implemented
    // getDuration: () => Chrono.getElapsed(), // Removed: Unused/Not Implemented

    // --- PHYSICS ---
    getPhysics: () => runtime.physics,

    // --- UTILS ---
    log: () => {},

    /**
     * NARRATIVE DIRECTOR
     * Manages the "Story Beats" and Vector synchronization.
     */
    NarrativeDirector: {
        update: () => {
            // [R5] Narrative State is now reactive in runtime.narrative
            // No manual sync required.

            // AUTO-SEED: Ensure activeVector is never empty
            const fractal = runtime.active_fractal
            if (fractal && (!Array.isArray(fractal.future) || fractal.future.length === 0)) {
                runtime.addVector("Continue the journey.", "FRACTAL", true)
                // Optionally log this system action to debug telemetry
                app.log("NarrativeDirector: Auto-seeded activeVector", "system")
            }
        },

        /**
         * L2 CONSOLIDATION (Tiered Memory)
         * Evicts old messages and compresses them into lore "Resonance".
         */
        consolidate: async () => {
            if (Engine.NarrativeDirector._isConsolidating) return
            Engine.NarrativeDirector._isConsolidating = true

            try {
                const storyId = Session.requireActive()
                const messages = await Session.loadMessages(storyId)
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

                    messages.refresh()
                }
            } catch (err) {
                console.error("[Memory Nexus] Consolidation failed:", err)
            } finally {
                Engine.NarrativeDirector._isConsolidating = false
            }
        },
    },

    /**
     * @deprecated Use Engine directly. Legacy bridge for old scripts.
     */
    legacyProxy: () => {
        return Engine
    },

    // Engine Methods Replacement
    generateAiResponse: async (storyId, options = {}) => {
        // [R5] Set Thinking Role & Start
        engineState.startGeneration(options.role || "ai")

        try {
            // 1B. [CHRONO] Increment Step
            runtime.turn++

            // [NEXUS] Update Narrative Chronology before assembly
            Engine.NarrativeDirector.update()

            // [DECOUPLED DATA FLOW] Fetch and format history directly from the DB source
            const rawMessages = await Session.loadMessages(storyId)
            const recentMessages = rawMessages
                .filter((m) => !m.meta?.consolidated)
                .slice(-10)
                .map((m) => ({
                    role: m.role === "user" ? "user" : "model",
                    content: m.text || m.content || "",
                    character_name: m.character_name,
                }))

            // 2. ASSEMBLE (Modular Pipeline: Hydration -> Simulation -> Synthesis)
            const payload = await ContextBroker.hydrate(options.input || "", "simulation", recentMessages)
            const snapshot = DynamicsEngine.simulate(payload)
            const { system, meta } = PromptBuilder.synthesize(payload, snapshot)

            // Update runtime physics with the new simulation state
            runtime.physics = snapshot.dynamics

            // [TELEMETRY] Log cleanly into the DebugPanel, avoiding browser console spam
            app.log("Context Assembled. Dynamics Resolved. Payload routed to LLM.", "system")

            // 3. GENERATE (LLM Service)
            const response = await LlmService.generate({ system, messages: [], ...options }, { ...options })

            // 4. PERSIST (Session)
            // Save metadata from the simulation snapshot
            const aiName = runtime.activeAI?.name || "AI"
            await Session.log_turn(response, aiName, "ai", { dynamics: meta.dynamics, flags: meta.flags, behaviors: meta.behaviors })

            // [NEXUS] Check for L2 Consolidation (Background)
            Engine.NarrativeDirector.consolidate()
        } catch (e) {
            console.error("Generation Failed", e)
            throw e
        } finally {
            // 5. NOTIFY COMPLETE
            engineState.complete()
        }
    },

    generatePrologue: async (storyId) => {
        // [FIX] Pull current entity context before building the prologue payload
        const payload = await ContextBroker.hydrate("", "prologue")
        const { system } = PromptBuilder.synthesize(payload, {})

        if (system) {
            engineState.startGeneration("fractal")
            try {
                const result = await LlmService.generate({ system })
                const fractal_name = runtime.active_fractal?.name || "Fractal Entity"

                // [NEXUS] Action 1: Save Prologue to DB
                await Session.log_turn(result, fractal_name, "fractal")

                // [NEXUS] Action 2: The Hook - Immediate Director Follow-up
                // This prevents the AI from starving and hallucinating user dialogue.
                const directorCommand = "[DIRECTOR: The stage is set and the pieces are on the board, as detailed in the history above. Proceed with the simulation immediately.]"
                await Engine.generateAiResponse(storyId, { input: directorCommand })
            } finally {
                engineState.complete()
            }
        }
    },

    triggerEpilogue: async () => {
        Session.requireActive()
        const { system } = PromptBuilder.build_epilogue()

        if (system) {
            engineState.startGeneration("ai")
            try {
                const result = await LlmService.generate({ system })
                await Session.log_turn(result, "Narrator")
            } finally {
                engineState.complete()
            }
        }
    },

    // Stubs for visual - if needed, implement similar to text
    requestVisual: () => console.warn("Visuals not fully re-implemented yet."),
    generateVisualFromDraft: () => {},

    // Private helpers
    _runEcho: async () => {
        // Calls Scholar.echo
        // const { Scholar } = await import("../scholar/index.js");
    },
}

// New API Exports
export { Session }
