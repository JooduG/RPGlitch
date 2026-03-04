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
import { DynamicsEngine } from "./DynamicsEngine.js"
import { PromptBuilder } from "./PromptBuilder.js"

/**
 * Condenses a slice of recent history into a structured Resonance record.
 *
 * Called at memory consolidation checkpoints (e.g. every N turns) to keep
 * the entity's long-term profile up to date without bloating the context window.
 *
 * @param {Object}   target_entity - The entity whose memory is being updated.
 * @param {Array}    history_slice - The raw message objects to condense.
 * @param {string}   [role]        - Context role: "character" | "user" | "fractal".
 * @returns {Promise<{summary: string, vector_tags: string[], dynamics_tags: string[], timestamp: number}|null>}
 */
export async function memorize(target_entity, history_slice, role = "character") {
    if (!target_entity) return null

    try {
        // 1. Build the memory condensation prompt.
        const payload = PromptBuilder.build_memory_prompt(role, target_entity, history_slice)

        // 2. Generate a raw Resonance response from the LLM.
        //    Expects: { summary: string, vector_tags: string[] }
        const response = await LlmService.generate(payload, { json: true, silent: true, raw: true })

        // 3. Extract text and parse JSON
        let raw_text = ""
        if (typeof response === "string") {
            raw_text = response.trim()
        } else if (response && typeof response === "object") {
            // Use cast-style access to avoid TS 'never' inference on object check
            const r = /** @type {any} */ (response)
            raw_text = String(r.generatedText ?? r.text ?? "").trim()
        }

        const stripped = raw_text.replace(/```json\n?|```/g, "").trim()
        const object_match = stripped.match(/\{[\s\S]*\}/)

        if (!object_match) {
            console.warn("[Echo] No valid JSON object found in response.")
            return null
        }

        const resonance = JSON.parse(object_match[0])

        // 4. Hybrid Tagging Logic (AXIS TAGS)
        //    Run automated Scan Reflexes on the summary to avoid hallucination.
        const triggered_reflexes = DynamicsEngine.scan_reflexes(resonance.summary)
        const dynamics_tags = triggered_reflexes.map((r) => r.id)

        // 3. Package Return
        return {
            summary: resonance.summary,
            vector_tags: resonance.vector_tags || resonance.tags || [],
            dynamics_tags: dynamics_tags,
            timestamp: Date.now(),
        }
    } catch (err) {
        console.error("[Echo] Resonance condensation failed.", err)
        return null
    }
}
