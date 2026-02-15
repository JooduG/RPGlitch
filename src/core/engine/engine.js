/**
 * THE ENGINE FACADE
 * Orchestrates the "Engine" (Logic) and "Session" (State).
 */

import { ContextBroker } from "@core/intelligence/broker.js"
import { LlmService } from "@core/intelligence/service.js"
import { runtime } from "@state/runtime.svelte.js"
import { events, EVENTS, state as store } from "./bus.js"
import { Chrono } from "./chrono.js"
import { Session } from "./session.js"

/**
 * The Engine provides a unified interface for the high-level simulation logic.
 * It serves as the primary controller for the Perchance narrative flow.
 */
export const Engine = {
    // --- SESSION ---
    requireActive: () => Session.requireActive(),
    getActive: () => Session.getActive(),
    createFromSelection: (data) => Session.createFromSelection(data),
    loadMessages: (storyId) => Session.loadMessages(storyId),
    send: (text) => Session.send(text),
    regenerate: () => Session.regenerate(),

    // --- CHRONO ---
    tick: (delta) => Chrono.tick(delta),
    getDuration: () => Chrono.getElapsed(),

    // --- PHYSICS ---
    getPhysics: () => runtime.physics,

    // --- UTILS ---
    log: (msg) => console.log(`[Engine] ${msg}`),

    /**
     * @deprecated Use Engine directly. Legacy bridge for old scripts.
     */
    legacyProxy: () => {
        return Engine
    },

    // Engine Methods Replacement
    generateAiResponse: async (storyId, options = {}) => {
        // 1. SIGNAL START
        events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED))

        try {
            // 2. ASSEMBLE (Modular Context)
            const payload = await ContextBroker.assemble(
                options.input || "",
                "prose"
            )

            // 3. GENERATE (LLM Service)
            const response = await LlmService.generate(payload)

            // 4. PERSIST (Session)
            // Assume AI character name is in runtime or use default
            const aiName = runtime.aiCharacter?.name || "AI"
            await Session.addAiMessage(response, aiName)
        } catch (e) {
            console.error("Generation Failed", e)
            throw e
        } finally {
            // 5. NOTIFY COMPLETE
            events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_COMPLETED))
        }
    },

    generatePrologue: async (storyId) => {
        // Basic Prologue Logic
        // We can use the same pipeline or specialized one
        const { ContextBuilder } = await import("@core/intelligence/context.js")
        const builder = new ContextBuilder(storyId)
        const payload = await builder.buildPrologue()

        if (payload) {
            events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED))
            try {
                // Basic generation without full Engine overhead
                const result = await LlmService.generate(payload)
                const fractalName =
                    runtime.storyFractal?.name || "Fractal Entity"
                await Session.addAiMessage(result, fractalName, "fractal")
            } finally {
                events.dispatchEvent(
                    new CustomEvent(EVENTS.GENERATION_COMPLETED)
                )
            }
        }
    },

    triggerEpilogue: async () => {
        const storyId = Session.requireActive()
        const { ContextBuilder } = await import("@core/intelligence/context.js")
        const builder = new ContextBuilder(storyId)
        const payload = await builder.buildEpilogue()
        if (payload) {
            events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED))
            try {
                const result = await LlmService.generate(payload)
                await Session.addAiMessage(result, "Narrator")
            } finally {
                events.dispatchEvent(
                    new CustomEvent(EVENTS.GENERATION_COMPLETED)
                )
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
        // Needs target entity... logic usually depends on context.
        // This facade might be deprecated or needed by Chrono.
        // Chrono calls runtime.save() -> Echo logic is internal to Data or triggered by Chrono?
        // Chrono loop said: app.log("Echo recording..."), runtime.save()
        // Wait, runtime.save calls DB.
        // Where is Echo.echo called?
        // It seems Chrono does NOT call Echo.echo directly in the loop I saw earlier?
        // Ah, I saw "PHASE 3: ECHO" in `ReactiveSession` (lines 107)
        // but it just LOGGED it.
        // `Engine.js` line 63 was `_runEcho: (...args) => Engine._runEchoCycle(...args)`.
        // I should probably leave a stub or simple log for now.
    },
}

// New API Exports
export { events, EVENTS, Session, store }
