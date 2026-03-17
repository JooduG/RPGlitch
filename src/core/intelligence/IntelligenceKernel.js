/**
 * @file src/core/intelligence/IntelligenceKernel.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🧠 INTELLIGENCE KERNEL  —  The Brain's Orchestrator
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * This service unifies the Intelligence Kernel (Broker, Dynamics, Builder)
 * and the Transport Layer (LlmService) into a single, cohesive execution flow.
 *
 * RESPONSIBILITIES
 * 1. Orchestration: Hydrate -> Simulate -> Synthesize -> Generate.
 * 2. Persistence  : Automatically logs turns to the Session database.
 * 3. Physics      : Updates global runtime physics based on simulation results.
 */

import { ContextBroker } from "./ContextBroker.js"
import { DynamicsEngine } from "./DynamicsEngine.js"
import { PromptBuilder } from "./PromptBuilder.js"
import { LlmService } from "./LlmService.js"
import { runtime } from "@state/runtime.svelte.js"
import { app } from "@state/app.svelte.js"
import { Session } from "@core/engine/SessionDriver.js"

export const IntelligenceKernel = {
    /**
     * EXECUTE TURN
     * The primary simulation loop for a narrative turn.
     *
     * @param {string} story_id
     * @param {Object} options
     * @param {string} [options.input] - User input to react to.
     * @param {string} [options.role="ai"] - Role to generate for.
     */
    async executeTurn(story_id, options = {}) {
        const { input = "", role = "ai", ...llm_options } = options

        // 1. CHRONO: Turn management
        runtime.turn++

        // 2. HYDRATION: Fetch history and hydrate context
        const raw_messages = await Session.load_log(story_id)
        const simulation_log = raw_messages
            .filter((m) => !m.meta?.consolidated)
            .map((m) => ({
                role: m.role === "user" ? "user" : "model",
                content: m.text || m.content || "",
                character_name: m.character_name,
            }))

        const payload = await ContextBroker.hydrate(input, "simulation", simulation_log)

        // 3. SIMULATION: Resolve physics and behaviors
        const snapshot = DynamicsEngine.simulate(payload)
        
        // 4. SYNTHESIS: Build the final prompt
        const { system, meta } = PromptBuilder.synthesize(payload, snapshot)

        // 5. UPDATE: Synchronize runtime physics
        runtime.physics = snapshot.dynamics

        app.log("Intelligence Kernel: Context hydrated. Physics resolved. Routing to LLM...", "system")

        // 6. GENERATION: Call the model with retry logic
        const response = await this._execute_with_retry(async () => {
            return await LlmService.generate({ 
                system, 
                messages: simulation_log 
            }, llm_options)
        })

        // 7. PERSISTENCE: Save the result
        const character_name = role === "ai" ? (runtime.active_ai?.name || "AI") : (runtime.active_fractal?.name || "Fractal")
        
        await Session.log_turn(response, character_name, role, { 
            dynamics: meta.dynamics, 
            flags: meta.flags, 
            signal_prompts: meta.signal_prompts 
        })

        return { response, meta }
    },

    /**
     * EXECUTE PROLOGUE
     * Specialized turn for starting a new story.
     */
    async executePrologue(story_id) {
        const payload = await ContextBroker.hydrate("", "prologue")
        const result = PromptBuilder.synthesize(payload, {})

        if (!result.system) return null

        app.log("Intelligence Kernel: Generating prologue...", "system")

        const response = await this._execute_with_retry(async () => {
            return await LlmService.generate({ system: result.system })
        })

        const fractal_name = runtime.active_fractal?.name || "Fractal Entity"

        // 1. Save Prologue
        await Session.log_turn(response, fractal_name, "fractal")

        // 2. The Hook: Trigger immediate AI follow-up to open the scene.
        // The instruction to proceed is already in the PromptBuilder prologue template.
        return await this.executeTurn(story_id)
    },

    /**
     * EXECUTE EPILOGUE
     * Final summary or conclusion for a story.
     */
    async executeEpilogue(story_id) {
        const { system } = PromptBuilder.build_epilogue()
        if (!system) return null

        app.log("Intelligence Kernel: Generating epilogue...", "system")
        const response = await this._execute_with_retry(async () => {
            return await LlmService.generate({ system })
        })

        await Session.log_turn(response, "Narrator", "ai")
        return response
    },

    /**
     * INTERNAL: Execute with exponential backoff retry.
     */
    async _execute_with_retry(fn, retries = 3, delay = 1000) {
        try {
            return await fn()
        } catch (err) {
            if (retries <= 0) throw err
            
            app.log(`Intelligence Kernel: Connection issue. Retrying in ${delay}ms... (${retries} attempts left)`, "warn")
            await new Promise(resolve => setTimeout(resolve, delay))
            
            return await this._execute_with_retry(fn, retries - 1, delay * 2)
        }
    }
}


