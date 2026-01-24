// Replaced utils import
import { runtime } from "../scholar/runtime.svelte.js"
import { ERROR_MESSAGES } from "./config.js"
import { app } from "./state.svelte.js"

const utilsError = console.error
const log = console.log

/**
 * 🧠 CONTEXT BROKER
 * The "Cortex" that assembles Simulation State into Narrative Context.
 * Modular, Dynamic, and State-Aware.
 */
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
            world: requirements.includes("world") ? this.pullWorld() : null,
            entity: requirements.includes("entity") ? this.pullEntity() : null,
            delta: action,
        }

        // 3. Construct System Prompt
        const system = this.injectLayers(context, type)

        // 4. Format Messages
        // We assume the GameMaster/Session handles the message history loading separately
        // but the payload needs strict structure.
        return {
            system,
            // Messages will be appended by GameMaster usually, but we define the shape here
            messages: [],
            params: {
                temperature: type === "physics" ? 0.3 : 0.8, // Dynamic Temp
            },
        }
    }

    /**
     * Determines what data fragments are needed for a specific phase.
     */
    static getRequiredContext(phase) {
        switch (phase) {
            case "physics":
                return ["kernel", "world"] // Physics only needs rules + environment
            case "visual":
                return ["world", "entity"] // Visuals need description + setting
            case "prose":
            default:
                return ["kernel", "world", "entity"] // Prose needs everything
        }
    }

    // --- LAYER FETCHERS ---

    static pullKernel() {
        return {
            rules: "Release Control. The simulation is live. Output prose directly.",
            // Global simulation constants could go here
        }
    }

    static pullWorld() {
        // Pull from the fractal/world entity in runtime
        const fractal = runtime.storyFractal || {}
        return {
            title: fractal.name || "Unknown World",
            lore: fractal.description || "",
            // Dynamic world state (weather, time) if available
            state: fractal.present || {},
        }
    }

    static pullEntity() {
        // Pull the active entities for this turn
        // In a prose turn, we focus on the AI Character + User Context
        const ai = runtime.aiCharacter || {}
        const user = runtime.userCharacter || {}

        return {
            ai: {
                name: ai.name || "AI",
                role: ai.role || "Assistant",
                // Flattened fragments for injection
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

        // LAYER 1: KERNEL (Simulation Rules)
        if (context.kernel) {
            layers.push(`[SYSTEM_KERNEL]\n${context.kernel.rules}`)
        }

        // LAYER 2: WORLD (Environment)
        if (context.world) {
            layers.push(
                `[WORLD_LAYER]\nLOC: ${context.world.title}\nDAT: ${context.world.lore}`
            )
            if (context.world.state) {
                layers.push(`ENV: ${JSON.stringify(context.world.state)}`)
            }
        }

        // LAYER 3: ENTITY (Persona & State)
        if (context.entity) {
            const { ai, user } = context.entity

            let entityBlock = `[ENTITY_LAYER]\n`
            entityBlock += `ACTOR: ${ai.name} (${ai.role})\n`
            entityBlock += `CONTEXT:\n${ai.fragments.join("\n")}\n`

            entityBlock += `\nINTERACTOR: ${user.name}\n`
            entityBlock += `CONTEXT:\n${user.fragments.join("\n")}`

            layers.push(entityBlock)
        }

        // LAYER 4: DELTA (Action)
        // Note: The actual conversation history is usually appended as messages,
        // only specific override instructions go here.

        return layers.join("\n\n")
    }
}

/**
 * Service to abstract the Perchance AI plugin (`window.ai`).
 * Handles formatting, error management, and plugin communication.
 */
export const LlmService = {
    /**
     * Optimizes a text prompt specifically for Stable Diffusion style generation.
     */
    async optimizeImagePrompt(input) {
        const system =
            "You are a prompt engineering specialist for high-fidelity text-to-image models. Synthesize the user's concepts into a dense, evocative, and technically precise prompt string. Focus on lighting (volumetric, cinematic), texture (4k, detailed), and artistic style. Output ONLY the resulting prompt string, no conversational fluff."
        return this.generate(
            { system, messages: [{ role: "user", content: input }] },
            { silent: true }
        )
    },

    /**
     * Enhances a narrative field for a better RP experience.
     */
    async enhanceStoryField(input, fieldLabel = "context") {
        const system = `You are an elite narrative architect. Enhance the following ${fieldLabel} description to be more atmospheric, detailed, and evocative for a modern high-stakes RPG experience. Preserve the core meaning but elevate the prose. Output ONLY the enhanced text.`
        return this.generate(
            { system, messages: [{ role: "user", content: input }] },
            { silent: true }
        )
    },

    /**
     * Generates text using the AI plugin.
     * Now supports DIRECT STREAMING to app state.
     */
    generate: async (payload, options = {}) => {
        if (!window.ai) {
            const msg = "Perchance AI plugin not available."
            if (!options.silent) utilsError(msg)
            throw new Error(msg)
        }

        // 1. Format History (Legacy Adapter)
        const chatHistory = LlmService._formatHistory(payload.messages || [])

        // 2. Construct Final Instruction
        const instruction = [
            payload.system,
            chatHistory ? `\n[CONVERSATION HISTORY]\n${chatHistory}` : "",
            payload.startWith ? `\n${payload.startWith}` : "",
        ]
            .filter(Boolean)
            .join("\n")

        try {
            // 3. Prepare Plugin Options
            const genOptions = {
                temperature:
                    options.temperature ?? payload.params?.temperature ?? 0.8,
                top_p: options.top_p ?? payload.params?.top_p,
                repetition_penalty:
                    options.repetition_penalty ??
                    payload.params?.repetition_penalty,
                max_tokens: options.maxTokens ?? payload.params?.maxTokens,
                model: options.model ?? payload.params?.model,
                stop_sequences: payload.stopSequences || [],
                signal: options.signal,
                silent: options.silent,
            }

            // 4. STREAMING HANDLER
            // We inject the onToken handler to update the global app state
            const onToken = (chunk) => {
                // Update App Store
                if (!app.streaming.active) {
                    app.startStream(payload.nodeId || "temp")
                }
                app.updateStream(chunk)

                // Call original callback if exists
                if (options.onToken) options.onToken(chunk)
            }

            // 5. Call Plugin
            // Note: window.ai signature is (prompt, options)
            // The 'onToken' callback is passed inside options for the plugin
            const result = await window.ai(instruction, {
                ...genOptions,
                onToken, // Inject our stream handler
            })

            app.endStream() // Ensure stream closes on completion

            return result
        } catch (err) {
            app.endStream() // Safer release

            if (options.silent) {
                log("[LlmService] Silent Generation Error (Suppressed):", err)
                throw err
            }

            const errString = String(err)

            // Basic Error Handling
            if (
                errString.includes("stream keep alive") ||
                errString.includes("timeout")
            ) {
                utilsError("[LlmService] Network Error:", err)
                throw new Error(`${ERROR_MESSAGES.CONNECTION_LOST}`)
            }

            // Re-throw
            throw err
        }
    },

    /**
     * Formats the message history for the LLM.
     */
    _formatHistory: (messages) =>
        messages
            .map((m) => {
                let label =
                    m.characterName ||
                    (m.role === "user" ? "User" : "Character")
                const text = m.content || m.text || ""
                return `${label}: ${text}`
            })
            .join("\n\n"),
}
