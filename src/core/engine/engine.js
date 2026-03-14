import { IntelligenceService } from "@core/intelligence/IntelligenceService.js"
import { app } from "@state/app.svelte.js"
import { engineState } from "@state/status.svelte.js"
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

    // --- GENERATION ---
    generateAiResponse: async (storyId, options = {}) => {
        engineState.startGeneration(options.role || "ai")

        try {
            await IntelligenceService.executeTurn(storyId, options)
            app.log("Generation complete.", "system")
        } catch (e) {
            console.error("Engine: Generation Failed", e)
            app.log("Error: Generation Failed.", "error")
            throw e
        } finally {
            engineState.complete()
        }
    },

    generatePrologue: async (storyId) => {
        engineState.startGeneration("fractal")
        try {
            await IntelligenceService.executePrologue(storyId)
            app.log("Prologue generated and opening turn executed.", "system")
        } catch (e) {
            console.error("Engine: Prologue Failed", e)
            app.log("Error: Prologue Failed.", "error")
            throw e
        } finally {
            engineState.complete()
        }
    },

    triggerEpilogue: async () => {
        engineState.startGeneration("ai")
        try {
            await IntelligenceService.executeEpilogue(Session.requireActive())
        } catch (e) {
            console.error("Engine: Epilogue Failed", e)
            app.log("Error: Epilogue Failed.", "error")
            throw e
        } finally {
            engineState.complete()
        }
    },

}

// New API Exports
export { Session }

