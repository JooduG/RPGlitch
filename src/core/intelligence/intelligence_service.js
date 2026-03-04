/**
 * @file src/core/intelligence/intelligence_service.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔌 LLM SERVICE  —  The Transport Layer
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * LlmService is the single point of contact with the Perchance AI plugin
 * (window.ai). All callers — the engine, the enhancement UI, Echo — route here.
 *
 * RESPONSIBILITIES
 * - Streaming : Connects token output to app.startStream / updateStream / endStream.
 * - Sanitization: Strips quotes, code fences, and conversational filler.
 * - Resilience : Classifies network errors and re-throws typed messages.
 *
 * WHAT IT IS NOT
 * LlmService has no opinion on prompt content. It injects no rules and knows
 * nothing about the narrative. It only sends and receives.
 */

import { ERROR_MESSAGES } from "@core/engine/config.js"
import { app } from "@state/app.svelte.js"

/************************************************************************************
 * 🧩 [SECTION: SANITIZATION]
 * ----------------------------------------------------------------------------------
 * Shared text-cleaning applied post-LLM to ensure clean, diegetic output.
 * Strips artifacts that Perchance AI frequently adds: code fences, filler
 * phrases, and outer quotation marks.
 ************************************************************************************/

/**
 * Strips code fences, outer quotes, and common conversational filler from LLM output.
 * @param {string} text
 * @returns {string}
 */
function sanitize(text) {
    return text
        .replace(/^["']|["']$/g, "")
        .replace(/^(here is|sure|certainly|i can help|enhanced text:|the enhanced text).*?:/i, "")
        .replace(/^```.*?[\r\n]/gm, "")
        .replace(/```$/g, "")
        .trim()
}

/************************************************************************************
 * 🧩 [SECTION: LLM SERVICE]
 * ----------------------------------------------------------------------------------
 * The primary abstraction for window.ai. All prompt execution flows through here.
 ************************************************************************************/

export const LlmService = {
    /**
     * HIGH-FIDELITY PROSE ENHANCER
     * Transforms draft text into visceral, first-person narrative based on
     * field-specific directives from the Entity Definition.
     *
     * @param {Object} payload - The generated enhancement prompt payload.
     * @returns {Promise<string>}
     */
    async enhance(payload) {
        // Use raw: true so generate() returns unprocessed output —
        // enhance() owns its own sanitization pass so it isn't double-stripped.
        const result = await this.generate(payload, { silent: true, raw: true })
        return typeof result === "string" ? sanitize(result) : result
    },

    /**
     * CORE GENERATION
     * The primary abstraction for window.ai. Handles streaming state,
     * network resilience, and raw token orchestration.
     *
     * @param {Object}  payload                       - The prompt payload.
     * @param {string}  payload.system                - The system prompt string.
     * @param {Array}   [payload.messages]            - Conversation history.
     * @param {string}  [payload.startWith]           - Text to prepend to the model response.
     * @param {string}  [payload.nodeId]              - UI node ID for the stream.
     * @param {Object}  [payload.params]              - Generation parameters.
     * @param {Array}   [payload.stopSequences]       - Stop sequences.
     * @param {Object}  [options]                     - Runtime overrides.
     * @param {boolean} [options.silent]              - Suppress streaming UI and console errors.
     * @param {boolean} [options.raw]                 - Skip post-processing sanitization.
     * @param {number}  [options.temperature]         - Override temperature.
     * @param {number}  [options.top_p]               - Override top_p.
     * @param {number}  [options.repetition_penalty]  - Override repetition penalty.
     * @param {number}  [options.max_tokens]           - Override max tokens.
     * @param {string}  [options.model]               - Override model.
     * @param {Function}[options.onToken]             - Per-token streaming callback.
     * @param {boolean} [options.json]               - Request structured JSON output.
     * @param {AbortSignal} [options.signal]          - Abort signal for cancellation.
     * @returns {Promise<string>}
     */
    generate: async (payload, options = {}) => {
        if (!window.ai) {
            const msg = "Perchance AI plugin not available."
            if (!options.silent) console.error(msg)
            throw new Error(msg)
        }

        // 1. Format conversation history into a flat readable string
        const chat_history = LlmService._format_history(payload.messages || [])

        // 2. Assemble the final instruction block
        const instruction = [payload.system || "", chat_history ? `\n\n[CONVERSATION HISTORY]\n${chat_history}` : "", payload.startWith ? `\n\n[START RESPONSE WITH]\n${payload.startWith}` : ""].filter(Boolean).join("\n\n")

        try {
            // 3. Prepare generation parameters
            const gen_options = {
                temperature: options.temperature ?? payload.params?.temperature ?? 0.8,
                top_p: options.top_p ?? payload.params?.top_p,
                repetition_penalty: options.repetition_penalty ?? payload.params?.repetition_penalty,
                max_tokens: options.max_tokens ?? payload.params?.max_tokens,
                model: options.model ?? payload.params?.model,
                stop_sequences: payload.stopSequences || [],
                signal: options.signal,
                silent: options.silent,
            }

            // 4. Wire streaming to the app layer
            const on_token = (chunk) => {
                if (!options.silent) {
                    if (!app.streaming.active) app.startStream(payload.nodeId || "temp")
                    app.updateStream(chunk)
                }
                if (options.onToken) options.onToken(chunk)
            }

            // 5. Execute
            let result = await window.ai(instruction, { ...gen_options, onToken: on_token })

            if (!options.silent) app.endStream()

            // 6. Sanitize unless caller opted out with raw: true
            if (typeof result === "string" && !options.raw) {
                result = sanitize(result)
            }

            return result
        } catch (err) {
            if (!options.silent) app.endStream()

            if (options.silent) {
                console.warn("[LlmService] Silent generation error (suppressed):", err)
                throw err
            }

            const err_string = String(err)
            if (err_string.includes("stream keep alive") || err_string.includes("timeout")) {
                console.error("[LlmService] Network error:", err)
                throw new Error(`${ERROR_MESSAGES.CONNECTION_LOST}`)
            }

            throw err
        }
    },

    /**
     * Formats message history into a plain readable string for the instruction block.
     * @param {Array<{role: string, content?: string, text?: string, character_name?: string}>} messages
     * @returns {string}
     */
    _format_history: (messages) =>
        messages
            .map((m) => {
                const label = m.character_name || (m.role === "user" ? "User" : "Character")
                const text = m.content || m.text || ""
                return `${label}: ${text}`
            })
            .join("\n\n"),
}
