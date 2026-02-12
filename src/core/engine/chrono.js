// ⏳ CHRONO: The Heartbeat of Time
// Manages the strict turn-based progression of the simulation.

import { Shield } from "@core/security/security.js"
import { app } from "@state/app.svelte.js"
import { messages } from "@state/messages.svelte.js"
import { runtime } from "@state/runtime.svelte.js"
import { state } from "./bus.js"

import { GameMaster } from "./engine.js"

export class ChronoStore {
    // No local state needed, acts as a controller for app.simulation

    /**
     * ADVANCE TURN
     * The ONLY way time moves forward.
     * 1. Locks UI (Loading)
     * 2. Processes Physics (Shield)
     * 3. Generates Narrative (GameMaster)
     * 4. Echo Resonance (Scholar)
     * 5. Anchoring State (Runtime)
     * 6. Unlocks UI
     */
    async advanceTurn(input = null) {
        if (app.simulation.loading) return // Prevent double-clicks

        const storyId = state.story?.activeId
        if (!storyId) {
            console.error("[Chrono] No active story found.")
            return
        }

        // 1. STASIS: Lock the Universe
        app.simulation.loading = true
        app.simulation.status = "scanning reality" // Phase 1
        app.log("Shield scanning causality and physics...", "system")

        try {
            // 2. OBSERVATION: Process Input & Physics (Shield)
            // We pass the current runtime character context to the Shield
            let shieldContext = null
            let finalInput = input

            if (input && runtime.character) {
                // Pass Fractal State for Causality Checks
                shieldContext = await Shield.process(
                    input,
                    runtime.character,
                    runtime.storyFractal || {}
                )

                // 🛑 CAUSALITY CHECK
                if (
                    shieldContext &&
                    shieldContext.causality &&
                    shieldContext.causality.result === "failure"
                ) {
                    app.log(
                        `Causality Violation: ${shieldContext.causality.constraint}`,
                        "error"
                    )
                    // We override the 'Action' to be a System Constraint.
                    // This forces the AI to narrate the failure instead of the action.
                    finalInput = `[SYSTEM]: The user attempted '${input}' but failed because: "${shieldContext.causality.constraint}". Describe this failed attempt briefly and dryly.`

                    // Visual Feedback (Glitch)
                    app.simulation.status = "causality violation"
                }
            }

            // 3. SYNTHESIS: Generate Narrative (GameMaster)
            app.simulation.status = "forecasting" // Phase 2
            app.log(`LLM synthesizing turn ${app.simulation.turn + 1}...`, "ai")

            // The GM facade maps generateAiResponse -> GameMaster.generateAiResponse(storyId, options)
            // We pass shieldContext in options if needed, including reflex deltas for thermodynamics.
            await GameMaster.generateAiResponse(storyId, {
                shieldContext,
                input: finalInput,
            })

            // 4. ECHO: Commit to Resonance (Echo/Scholar)
            app.simulation.status = "echoing" // Phase 3
            app.log("Echo recording temporal resonance...", "db")
            app.simulation.turn += 1

            // 5. ANCHOR: Persist the timeline
            await runtime.save(app.simulation.turn)
        } catch (error) {
            app.log(`Time Fracture: ${error.message}`, "error")
            console.error("[Chrono] 💥 Time Fracture:", error)

            // Push error to feed so user knows what happened
            messages.add({
                id: `err-${Date.now()}`,
                role: "system",
                text: `Simulation Error: ${error.message || "Unknown Time Fracture"}`,
                timestamp: Date.now(),
            })
        } finally {
            // 5. RESURRECTION: Unlock the Universe
            app.simulation.loading = false
            app.simulation.status = "idle"
        }
    }
}

export const chrono = new ChronoStore()

if (typeof window !== "undefined") {
    window.chrono = chrono
}
