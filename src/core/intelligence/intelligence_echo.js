/**
 * @file src/core/intelligence/intelligence_echo.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 📚 ECHO  —  Temporal Resonance & Memory Condensation
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * Echo is the long-term memory writer. At consolidation checkpoints, it takes
 * a raw slice of recent message history and converts it into a structured
 * Resonance object — a compact summary the entity carries across sessions.
 *
 * DATA FLOW
 *   history_slice (Array of messages)
 *     └─→ build_memory_prompt()      (formats the MEMORY_PROTOCOL XML)
 *         └─→ LlmService.generate()  (sends to Perchance AI, raw response)
 *             └─→ extract JSON       (strip code fences → isolate { } block)
 *                 └─→ Resonance: { summary, tags }
 *
 * RESONANCE SCHEMA
 *   { summary: string, tags: string[] }
 *   - summary : A single sentence capturing the most meaningful shift.
 *   - tags    : Categorical labels for search/retrieval (e.g. "trauma", "alliance").
 */

import { LlmService } from "@core/intelligence/intelligence_service.js"
import { PromptBuilder } from "./prompt_builder.js"

/**
 * Condenses a slice of recent history into a structured Resonance record.
 *
 * Called at memory consolidation checkpoints (e.g. every N turns) to keep
 * the entity's long-term profile up to date without bloating the context window.
 *
 * @param {Object}   target_entity - The entity whose memory is being updated.
 * @param {Array}    history_slice - The raw message objects to condense.
 * @param {string}   [role]        - Context role: "character" | "user" | "fractal".
 * @returns {Promise<{summary: string, tags: string[]}|null>}
 */
export async function memorize(target_entity, history_slice, role = "character") {
    if (!target_entity) return null

    try {
        // 1. Build the memory condensation prompt.
        //    Pass null as storyId — Echo operates on entity data directly,
        //    not on a live story session.
        const builder = new PromptBuilder()
        const payload = builder.build_memory_prompt(target_entity, history_slice, role)

        // 2. Generate a raw Resonance response from the LLM.
        //    raw: true — we parse JSON ourselves, don't want sanitize() to mangle it.
        /** @type {any} */
        const response = await LlmService.generate(payload, { json: true, silent: true, raw: true })

        // 3. Extract text — LLM may return a string or an object with generatedText.
        const raw_text = String(response?.generatedText ?? response?.text ?? response ?? "").trim()

        // 4. Strip any markdown code fences (```json … ```) then isolate the JSON object.
        const stripped = raw_text.replace(/```json\n?|```/g, "").trim()
        const object_match = stripped.match(/\{[\s\S]*\}/)

        if (!object_match) {
            console.warn("[Echo] No valid JSON object found in response.")
            return null
        }

        return JSON.parse(object_match[0])
    } catch (err) {
        console.error("[Echo] Resonance condensation failed.", err)
        return null
    }
}
