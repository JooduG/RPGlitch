/**
 * src/core/llm/service.js
 * Service to abstract the Perchance AI plugin (`window.ai`).
 * Handles formatting, error management, and plugin communication.
 */

import { ERROR_MESSAGES } from "@core/engine/config.js"
import { app } from "@state/app.svelte.js"

const utilsError = console.error

export const LlmService = {
    /**
     * Optimizes a text prompt specifically for Stable Diffusion style generation.
     */
    async optimizeImagePrompt(basePrompt) {
        let availableTags = "No external tags loaded."

        // 1. Pull the Perchance lists from the global bridge
        if (typeof window !== "undefined" && window.rpgLists) {
            try {
                // Ensure lists exist before parsing
                const lists = window.rpgLists
                if (
                    lists.styles &&
                    lists.lighting &&
                    lists.tech &&
                    lists.composition &&
                    lists.mood
                ) {
                    availableTags = JSON.stringify({
                        styles: JSON.parse(lists.styles[0] || "[]"),
                        lighting: JSON.parse(lists.lighting[0] || "[]"),
                        tech: JSON.parse(lists.tech[0] || "[]"),
                        composition: JSON.parse(lists.composition[0] || "[]"),
                        mood: JSON.parse(lists.mood[0] || "[]"),
                    })
                }
            } catch (e) {
                console.warn("[LlmService] Failed to parse Perchance lists:", e)
            }
        }

        // 2. The System Payload
        const systemPrompt = `
[SYSTEM: VISUAL_DIRECTOR_V3.0]
You are a precision Image State Editor optimizing a prompt for a diffusion model.

<CORE_DIRECTIVE>
1. Analyze the User's Base Prompt.
2. Select 1-2 matching tags from EACH category in the provided AVAILABLE_TAGS JSON based on the implicit vibe.
3. Resolve conflicts: If the base prompt implies "anime", DO NOT select "photorealism". Choose holistic, cohesive modifiers.
4. Maintain STRICT Primacy Hierarchy: You must keep the user's base physical description at the very front of the prompt. Append your selected tags to the end.

<AVAILABLE_TAGS>
${availableTags}

<OUTPUT_FORMAT>
Return ONLY the finalized, comma-separated prompt string. Do not alter the subject's core physical description, only append your selected, matching technical and atmospheric tags. No quotes. No conversational text.
        `.trim()

        const payload = {
            system: systemPrompt, // Mapping to existing generic 'system' param
            messages: [
                { role: "user", content: `Base Prompt: "${basePrompt}"` },
            ],
        }

        return this.generate(payload, { silent: true })
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
                console.warn(
                    "[LlmService] Silent Generation Error (Suppressed):",
                    err
                )
                throw err
            }

            const errString = String(err)

            if (
                errString.includes("stream keep alive") ||
                errString.includes("timeout")
            ) {
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
                let label =
                    m.characterName ||
                    (m.role === "user" ? "User" : "Character")
                const text = m.content || m.text || ""
                return `${label}: ${text}`
            })
            .join("\n\n"),
}
