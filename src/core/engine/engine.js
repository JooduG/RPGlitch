import { ContextBroker } from "@core/intelligence/ContextBroker.js"
import { DynamicsEngine } from "@core/intelligence/DynamicsEngine.js"
import { PromptBuilder } from "@core/intelligence/PromptBuilder.js"
import { LlmService } from "@core/intelligence/intelligence_service.js"
import { app } from "@state/app.svelte.js" // [R5]
import { runtime } from "@state/runtime.svelte.js"
import { engineState } from "@state/status.svelte.js" // [R5] Unified State
import { NarrativeDirector } from "./NarrativeDirector.js"
import { Session } from "./SessionDriver.js"

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

    // Engine Methods Replacement
    generateAiResponse: async (storyId, options = {}) => {
        // [R5] Set Thinking Role & Start
        engineState.startGeneration(options.role || "ai")

        try {
            // 1B. [CHRONO] Increment Step
            runtime.turn++

            // [NEXUS] Update Narrative Chronology before assembly
            NarrativeDirector.update()

            // [DECOUPLED DATA FLOW] Fetch and format history directly from the DB source
            const rawMessages = await Session.load_log(storyId)
            const simulation_log = rawMessages
                .filter((m) => !m.meta?.consolidated)
                .map((m) => ({
                    role: m.role === "user" ? "user" : "model",
                    content: m.text || m.content || "",
                    character_name: m.character_name,
                }))

            // 2. ASSEMBLE (Modular Pipeline: Hydration -> Simulation -> Synthesis)
            const payload = await ContextBroker.hydrate(options.input || "", "simulation", simulation_log)
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
            NarrativeDirector.consolidate()
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
}

// New API Exports
export { Session }
