/************************************************************************************
 * src/core/llm/service.js
 * Service to abstract the Perchance AI plugin (`window.ai`).
 * Handles formatting, error management, and plugin communication.
 ************************************************************************************/

import { ERROR_MESSAGES } from "@core/engine/config.js"
import { FIELD_REGISTRY } from "@core/narrative/schema.js"
import { app } from "@state/app.svelte.js"

const utilsError = console.error

export const LlmService = {
    /************************************************************************************
     * ✨ ENHANCEMENT
     * ----------------------------------------------------------------------------------
     * The High-Fidelity Prose Enhancer.
     * Transforms draft text into visceral, first-person narrative
     * based on field-specific directives from the Entity Schema.
     ************************************************************************************/

    // Enhancement Engine
    async enhance(text, fieldKey) {
        // 1. resolve configuration from Schema
        const fieldConfig = FIELD_REGISTRY[fieldKey] || {
            enhancer: "EDITOR",
            placeholder: "I will preserve the core meaning while elevating the prose.",
        }

        const rawRole = fieldConfig.enhancer || "EDITOR"
        const role = rawRole
            .toLowerCase()
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")

        const instruction = fieldConfig.placeholder

        // 2. Enhancement Prompt Assembly
        const systemPrompt = `
[SYSTEM: ${rawRole}]
I am the ${role}. I enhance draft text into raw, visceral reality.

<FIELD_DIRECTIVES>
${instruction}
</FIELD_DIRECTIVES>

<POSITIVE_GOVERNANCE>
- I use exclusively affirmative, present-tense language.
- I focus on what IS. I ignore what is not.
- I never mention technical jargon, web design terminology (HTML, CSS, UI), or metadata.
</POSITIVE_GOVERNANCE>

<CONSTRAINTS>
- I output ONLY the final enhanced text.
- I include NO conversational filler or meta-commentary.
- I write in the FIRST PERSON perspective.
- I ALWAYS begin my response with the word "I".
- I use NO markdown, quotation marks, or HTML tags.
</CONSTRAINTS>

<DRAFT_TO_ENHANCE>
${text}
</DRAFT_TO_ENHANCE>`.trim()

        const payload = {
            system: systemPrompt,
            messages: [],
        }

        // Ensure this calls the actual underlying generation method
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

        // 1. Format History (Legacy Adapter)
        const chatHistory = LlmService._formatHistory(payload.messages || [])

        // 2. Construct Final Instruction
        const instruction = [payload.system, chatHistory ? `\n[CONVERSATION HISTORY]\n${chatHistory}` : "", payload.startWith ? `\n${payload.startWith}` : ""].filter(Boolean).join("\n")

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
                if (!options.silent) {
                    if (!app.streaming.active) {
                        app.startStream(payload.nodeId || "temp")
                    }
                    app.updateStream(chunk)
                }

                if (options.onToken) options.onToken(chunk)
            }

            // 5. Call Plugin
            const result = await window.ai(instruction, {
                ...genOptions,
                onToken,
            })

            if (!options.silent) app.endStream()

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
