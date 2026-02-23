/************************************************************************************
 * src/core/intelligence/intelligence_service.js
 * Service to abstract the Perchance AI plugin (`window.ai`).
 * Handles formatting, error management, and plugin communication.
 ************************************************************************************/

import { ERROR_MESSAGES } from "@core/engine/config.js"
import { RULES, SYSTEM_PROMPTS } from "@core/intelligence/intelligence_logic.js"
import { app } from "@state/app.svelte.js"

const utilsError = console.error

export const LlmService = {
    /************************************************************************************
     * ✨ ENHANCEMENT
     * ----------------------------------------------------------------------------------
     * The High-Fidelity Prose Enhancer.
     * Transforms draft text into visceral, first-person narrative
     * based on field-specific directives from the Entity Definition.
     ************************************************************************************/

    // Enhancement Engine
    async enhance(text, fieldKey) {
        // 1. Resolve prompt payload using the intelligence layer
        const payload = {
            system: SYSTEM_PROMPTS.enhancement({ role: fieldKey, content: text, context: "" }),
            messages: [],
        }

        // 2. Execute generation
        let result = await this.generate(payload, { silent: true })

        if (typeof result === "string") {
            result = result
                .replace(/^["']|["']$/g, "")
                .replace(/^(here is|sure|certainly|i can help|enhanced text:|the enhanced text).*?:/i, "")
                .replace(/^```.*?[\r\n]/gm, "")
                .replace(/```$/g, "")
                .trim()
        }

        return result
    },

    /************************************************************************************
     * 👁️‍🗨️ CORE GENERATION
     * ----------------------------------------------------------------------------------
     * The primary abstraction for `window.ai`. Handles streaming state,
     * network resilience, and raw token orchestration.
     ************************************************************************************/

    generate: async (payload, options = {}) => {
        if (!window.ai) {
            const msg = "Perchance AI plugin not available."
            if (!options.silent) utilsError(msg)
            throw new Error(msg)
        }

        // 1. Pre-flight: Enforce Grounding Rule at the service gate
        let system = payload.system || ""
        if (!system.includes("[RULE: GROUNDING]")) {
            system = `${RULES.GROUNDING}\n\n${system}`.trim()
        }

        // 2. Format History (Legacy Adapter)
        const chatHistory = LlmService._formatHistory(payload.messages || [])

        // 3. Construct Final Instruction
        const instruction = [system, chatHistory ? `\n\n[CONVERSATION HISTORY]\n${chatHistory}` : "", payload.startWith ? `\n\n[START RESPONSE WITH]\n${payload.startWith}` : ""].filter(Boolean).join("\n\n")

        try {
            // 4. Prepare Plugin Options
            const genOptions = {
                temperature: options.temperature ?? payload.params?.temperature ?? 0.8,
                top_p: options.top_p ?? payload.params?.top_p,
                repetition_penalty: options.repetition_penalty ?? payload.params?.repetition_penalty,
                max_tokens: options.maxTokens ?? payload.params?.maxTokens,
                model: options.model ?? payload.params?.model,
                stop_sequences: payload.stopSequences || [],
                signal: options.signal,
                silent: options.silent,
            }

            // 5. STREAMING HANDLER
            const onToken = (chunk) => {
                if (!options.silent) {
                    if (!app.streaming.active) {
                        app.startStream(payload.nodeId || "temp")
                    }
                    app.updateStream(chunk)
                }

                if (options.onToken) options.onToken(chunk)
            }

            // 6. Call Plugin
            let result = await window.ai(instruction, {
                ...genOptions,
                onToken,
            })

            if (!options.silent) app.endStream()

            // 7. Standardized Post-Process (Response Sanitization)
            if (typeof result === "string" && !options.raw) {
                result = result
                    .replace(/^["']|["']$/g, "") // Strip outer quotes
                    .replace(/^(here is|sure|certainly|i can help|enhanced text:|the enhanced text).*?:/i, "") // Strip conversational filler
                    .replace(/^```.*?[\r\n]/gm, "") // Strip code fences
                    .replace(/```$/g, "")
                    .trim()
            }

            return result
        } catch (err) {
            if (!options.silent) app.endStream()

            if (options.silent) {
                console.warn("[LlmService] Silent Generation Error (Suppressed):", err)
                throw err
            }

            const errString = String(err)
            if (errString.includes("stream keep alive") || errString.includes("timeout")) {
                utilsError("[LlmService] Network Error:", err)
                throw new Error(`${ERROR_MESSAGES.CONNECTION_LOST}`)
            }

            throw err
        }
    },

    _formatHistory: (messages) =>
        messages
            .map((m) => {
                let label = m.characterName || (m.role === "user" ? "User" : "Character")
                const text = m.content || m.text || ""
                return `${label}: ${text}`
            })
            .join("\n\n"),
}
