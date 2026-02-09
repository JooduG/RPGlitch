/**
 * src/core/llm/broker.js
 * 🧠 CONTEXT BROKER
 * The "Cortex" that assembles Simulation State into Narrative Context.
 * Modular, Dynamic, and State-Aware.
 */

import { runtime } from "@state/runtime.svelte.js"

export class ContextBroker {
    /**
     * Assembles a context payload for the LLM based on the current phase.
     * @param {string} action - The user's input or triggered action.
     * @param {string} type - 'prose' | 'physics' | 'visual'
     * @returns {Promise<Object>} The payload { system, messages, ... }
     */
    static async assemble(action, type = "prose") {
        // 1. Identify Requirements
        const requirements = this.getRequiredContext(type)

        // 2. Fetch Modular Data from Runtime (Single Source of Truth)
        const context = {
            kernel: requirements.includes("kernel") ? this.pullKernel() : null,
            fractal: requirements.includes("fractal")
                ? this.pullFractal()
                : null,
            entity: requirements.includes("entity") ? this.pullEntity() : null,
            delta: action,
        }

        // 3. Construct System Prompt
        const system = this.injectLayers(context)

        // 4. Format Messages
        return {
            system,
            messages: [],
            params: {
                temperature: type === "physics" ? 0.3 : 0.8,
            },
        }
    }

    /**
     * Determines what data fragments are needed for a specific phase.
     */
    static getRequiredContext(phase) {
        switch (phase) {
            case "physics":
                return ["kernel", "fractal"]
            case "visual":
                return ["fractal", "entity"]
            case "prose":
            default:
                return ["kernel", "fractal", "entity"]
        }
    }

    // --- LAYER FETCHERS ---

    static pullKernel() {
        return {
            rules: "Release Control. The simulation is live. Output prose directly.",
        }
    }

    static pullFractal() {
        const fractal = runtime.storyFractal || {}
        return {
            title: fractal.name || "Unknown Fractal",
            lore: fractal.description || "",
            state: fractal.present || {},
        }
    }

    static pullEntity() {
        const ai = runtime.aiCharacter || {}
        const user = runtime.userCharacter || {}

        return {
            ai: {
                name: ai.name || "AI",
                role: ai.role || "Assistant",
                fragments: [
                    ai.past,
                    ai.present?.physical,
                    ai.present?.mental,
                    ai.eternal?.physical,
                    ai.eternal?.mental,
                ].filter(Boolean),
            },
            user: {
                name: user.name || "User",
                fragments: [user.description, user.present?.physical].filter(
                    Boolean
                ),
            },
        }
    }

    // --- INJECTION ENGINE ---

    static injectLayers(context) {
        const layers = []

        if (context.kernel) {
            layers.push(`[SYSTEM_KERNEL]\n${context.kernel.rules}`)
        }

        if (context.fractal) {
            layers.push(
                `[FRACTAL_LAYER]\nLOC: ${context.fractal.title}\nDAT: ${context.fractal.lore}`
            )
            if (context.fractal.state) {
                layers.push(`ENV: ${JSON.stringify(context.fractal.state)}`)
            }
        }

        if (context.entity) {
            const { ai, user } = context.entity

            let entityBlock = `[ENTITY_LAYER]\n`
            entityBlock += `ACTOR: ${ai.name} (${ai.role})\n`
            entityBlock += `CONTEXT:\n${ai.fragments.join("\n")}\n`

            entityBlock += `\nINTERACTOR: ${user.name}\n`
            entityBlock += `CONTEXT:\n${user.fragments.join("\n")}`

            layers.push(entityBlock)
        }

        return layers.join("\n\n")
    }
}
