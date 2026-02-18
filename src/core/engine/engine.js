/**
 * THE ENGINE FACADE
 * Orchestrates the "Engine" (Logic) and "Session" (State).
 */

import { ContextBroker } from "@core/intelligence/broker.js"
import { Echo } from "@core/intelligence/echo.js"
import { LlmService } from "@core/intelligence/service.js"
import { db } from "@data/db.js"
import { entities } from "@data/repository.js"
import { app } from "@state/app.svelte.js" // [R5]
import { runtime } from "@state/runtime.svelte.js"
import { engineState } from "@state/status.svelte.js" // [R5] Unified State
import { events, EVENTS, state as store } from "./bus.js"
import { Session } from "./session.js"

const Resonance = new Echo()

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
    send: async (text) => {
        await Session.send(text)
        await Engine.generateAiResponse(Session.requireActive())
    },
    regenerate: () => Session.regenerate(),

    // --- CHRONO ---
    // --- CHRONO ---
    // tick: (delta) => Chrono.tick(delta), // Removed: Unused/Not Implemented
    // getDuration: () => Chrono.getElapsed(), // Removed: Unused/Not Implemented

    // --- PHYSICS ---
    getPhysics: () => runtime.physics,

    // --- UTILS ---
    log: () => {},

    /**
     * NARRATIVE DIRECTOR
     * Manages the "Story Beats" and Plot Thread synchronization.
     */
    NarrativeDirector: {
        update: () => {
            // [R5] Narrative State is now reactive in runtime.narrative
            // No manual sync required.
            // Future logic for thread promotion/lifecycle goes here.
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
                const unconsolidated = messages.filter(
                    (m) => !m.meta?.consolidated
                )

                // Trigger every 10 unconsolidated messages
                if (unconsolidated.length >= 12) {
                    const slice = unconsolidated.slice(0, 10)
                    app.log(
                        `Memory Nexus: Consolidating ${slice.length} turns into lore...`,
                        "system"
                    )

                    const ai = runtime.aiCharacter
                    if (ai) {
                        const resonance = await Resonance.memorize(
                            ai,
                            slice,
                            "character"
                        )
                        if (resonance?.summary) {
                            // Append to Lore
                            ai.timeline = ai.timeline || {
                                past: "",
                                future: "",
                            }
                            ai.timeline.past = `${ai.timeline.past || ""}\n[RESONANCE]: ${resonance.summary}`
                            await entities.save("character", ai)
                        }
                    }

                    // Mark as consolidated in DB
                    for (const msg of slice) {
                        msg.meta = { ...msg.meta, consolidated: true }
                        await db.messages.update(msg.id, { meta: msg.meta })
                    }

                    events.dispatchEvent(
                        new CustomEvent(EVENTS.CHAT_REFRESH, {
                            detail: { storyId },
                        })
                    )
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

        // 1. SIGNAL START (Legacy Bridge for external listeners if any remain)
        events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED))

        try {
            // 1B. [CHRONO] Increment Step
            app.simulation.turn++

            // [NEXUS] Update Narrative Chronology before assembly
            Engine.NarrativeDirector.update()

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

            // [NEXUS] Check for L2 Consolidation (Background)
            events.dispatchEvent(new CustomEvent(EVENTS.MEMORY_PRESSURE_CHECK))
        } catch (e) {
            console.error("Generation Failed", e)
            throw e
        } finally {
            // 5. NOTIFY COMPLETE
            engineState.complete()
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
            engineState.startGeneration("fractal")
            events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED))
            try {
                // Basic generation without full Engine overhead
                const result = await LlmService.generate(payload)
                const fractalName =
                    runtime.storyFractal?.name || "Fractal Entity"
                await Session.addAiMessage(result, fractalName, "fractal")

                // [FIX] Immediately trigger AI Character follow-up
                await Engine.generateAiResponse(storyId)
            } finally {
                engineState.complete()
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
            engineState.startGeneration("ai")
            events.dispatchEvent(new CustomEvent(EVENTS.GENERATION_STARTED))
            try {
                const result = await LlmService.generate(payload)
                await Session.addAiMessage(result, "Narrator")
            } finally {
                engineState.complete()
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
