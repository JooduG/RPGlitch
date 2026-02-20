/**
 * src/core/llm/service.js
 * Service to abstract the Perchance AI plugin (`window.ai`).
 * Handles formatting, error management, and plugin communication.
 */

import { ERROR_MESSAGES } from "@core/engine/config.js"
import { FIELD_REGISTRY } from "@core/narrative/schema.js"
import { app } from "@state/app.svelte.js"

const utilsError = console.error

export const LlmService = {
    /**
     * Optimizes a text prompt specifically for Stable Diffusion style generation.
     * // [VISUALS HELPER] Prepares prompts for VisualsService
     */
    // The Universal Enhancement Engine
    async enhance(text, fieldKey) {
        // 1. resolve configuration from Schema
        const fieldConfig = FIELD_REGISTRY[fieldKey] || {
            enhancer: "EDITOR",
            placeholder: "Preserve the core meaning but elevate the prose.",
        }

        const role = fieldConfig.enhancer || "EDITOR"
        const instruction = fieldConfig.placeholder

        // 2. Construct System Prompt
        const systemPrompt = `
[SYSTEM: ${role}]
Your objective is to enhance a specific UI text field.

<CRITICAL_DIRECTIVE>
${instruction}
</CRITICAL_DIRECTIVE>

<RULES>
Output ONLY the final enhanced text. No conversational filler, no quotes.
</RULES>`.trim()

        const payload = {
            system: systemPrompt,
            messages: [{ role: "user", content: text }],
        }

        // Ensure this calls the actual underlying generation method used by LlmService
        return await this.generate(payload, { silent: true })
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
                temperature: options.temperature ?? payload.params?.temperature ?? 0.8,
                top_p: options.top_p ?? payload.params?.top_p,
                repetition_penalty: options.repetition_penalty ?? payload.params?.repetition_penalty,
                max_tokens: options.maxTokens ?? payload.params?.maxTokens,
                model: options.model ?? payload.params?.model,
                stop_sequences: payload.stopSequences || [],
                signal: options.signal,
                silent: options.silent,
            }

            // 4. STREAMING HANDLER
            const onToken = (chunk) => {
                if (!app.streaming.active) {
                    app.startStream(payload.nodeId || "temp")
                }
                app.updateStream(chunk)

                if (options.onToken) options.onToken(chunk)
            }

            // 5. Call Plugin
            const result = await window.ai(instruction, {
                ...genOptions,
                onToken,
            })

            app.endStream()

            return result
        } catch (err) {
            app.endStream()

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

    /**
     * Formats the message history for the LLM.
     */
    _formatHistory: (messages) =>
        messages
            .map((m) => {
                let label = m.characterName || (m.role === "user" ? "User" : "Character")
                const text = m.content || m.text || ""
                return `${label}: ${text}`
            })
            .join("\n\n"),
}
