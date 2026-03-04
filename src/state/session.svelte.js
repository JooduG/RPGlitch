import { Engine } from "@core/engine/engine.js"
import { Session } from "@core/engine/session-driver.js"
import { app } from "@state/app.svelte.js"
import { runtime } from "@state/runtime.svelte.js"
import "@state/simulation_log.svelte.js"
import { engineState } from "@state/status.svelte.js" // [R5] Unified State

/**
 * src/state/session.svelte.js
 * 🕹️ ENGINE / 📚 DATA: Session Management
 * Coordinates active narrative flows and persistence.
 */
export class ReactiveSession {
    loading = $state(false)
    error = $state(null)

    constructor() {}

    /**
     * Start a new story from the Lobby.
     * @param {Object} selection - { ai, user, fractal }
     */
    async start(selection) {
        if (this.loading) return
        this.loading = true
        app.simulation.loading = true

        try {
            const storyTitle = `The Journey of ${selection.ai.name} & ${selection.user.name} in ${selection.fractal.name}`

            // 1. Create Core Session
            const storyId = await Session.createFromSelection({
                aiId: selection.ai.id,
                userId: selection.user.id,
                fractalId: selection.fractal.id,
                storyTitle,
            })

            // 3. Switch View (Immediate Feedback)
            app.setView("game")

            // 4. Trigger Prologue Generation
            // This will run the Engine, hit the API, and stream content to the feed
            await Engine.generatePrologue(storyId)
        } catch (e) {
            console.error("[ReactiveSession] Start Failed:", e)
            this.error = e.message
            // If failed, maybe go back to lobby?
            // app.setView("lobby");
        } finally {
            this.loading = false
            app.simulation.loading = false
        }
    }

    /**
     * Send user input and advance the simulation turn.
     * @param {string} text
     */
    async send(text) {
        if (this.loading || !text.trim()) return
        await this.advanceTurn(text)
    }

    /**
     * The Diagnostic Turn Loop
     * Forces visibility into the internal state transitions.
     */
    async advanceTurn(text) {
        this.loading = true
        app.simulation.loading = true

        try {
            // PHASE 1: WARDEN (Observation)
            app.log("Security checking physics and causality...", "system")
            // Simulate physics update for HUD visibility if needed, or rely on Engine events

            // PHASE 2: GM (Synthesis)
            app.log(`LLM synthesizing prose response for turn ${app.turn}...`, "ai")
            await Session.send(text) // Saves user message

            // TRIGGER AI GENERATION
            const storyId = Session.requireActive()
            await Engine.generateAiResponse(storyId, { input: text })

            // PHASE 3: ECHO (Affinity)
            app.log("Echo recording temporal affinity and syncing database...", "db")

            // Update HUD causality (Example: reading from Security state if available)
            app.causalityReport = {
                chaos: Math.floor(Math.random() * 100), // Placeholder for real physics
                intensity: Math.floor(Math.random() * 100),
                reflex: "Active",
            }

            // PHASE 4: PERSIST (Data)
            await runtime.save(runtime.turn)
        } catch (e) {
            app.log(`Simulation Error: ${e.message}`, "error")
            console.error("[ReactiveSession] AdvanceTurn Failed:", e)
            this.error = e.message
        } finally {
            this.loading = false
            app.simulation.loading = false
        }
    }

    /**
     * Retry the last AI turn.
     */
    async retry() {
        if (this.loading) return
        this.loading = true
        app.simulation.loading = true

        try {
            await Session.regenerate()
            const storyId = Session.requireActive()
            await Engine.generateAiResponse(storyId)
        } catch (e) {
            this.error = e.message
        } finally {
            this.loading = false
            app.simulation.loading = false
            engineState.complete()
        }
    }

    /**
     * Continue the story (AI generates next part).
     */
    async continue() {
        if (this.loading) return
        this.loading = true
        app.simulation.loading = true

        try {
            const storyId = Session.requireActive()
            await Engine.generateAiResponse(storyId)
        } catch (e) {
            this.error = e.message
        } finally {
            this.loading = false
            app.simulation.loading = false
        }
    }

    /**
     * 🧪 DEBUG: Inject AI Message
     */
    async log_turn(text, character_name, role) {
        await Session.log_turn(text, character_name, role)
    }

    /**
     * Delete a log entry by ID
     */
    async delete_entry(id) {
        await Session.delete_entry(id)
    }

    /**
     * Edit a log entry by ID
     */
    async edit_entry(id, new_text) {
        await Session.edit_entry(id, new_text)
    }
}

export const session = new ReactiveSession()
