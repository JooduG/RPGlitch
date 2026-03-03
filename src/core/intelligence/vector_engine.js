/**
 * @file src/core/intelligence/vector_engine.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🧠 VECTOR ENGINE  —  The Temporal Memory Controller
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * VectorEngine manages the "Temporal Architecture" of entities. It handles
 * the creation, retrieval (RAG), and formatting of Past Vectors and
 * Future Vectors. It is responsible for making the AI "remember" what
 * matters most in the current context.
 *
 * DATA SCHEMA
 * Every vector follows a strict strict schema:
 * {
 *   id: uuid,
 *   text: string (raw content),
 *   summary: string (shortened resonance),
 *   axis_tags: string[] (derived from DynamicsEngine),
 *   entity_tags: string[] (manual/system tags),
 *   timestamp: number
 * }
 *
 * ARCHITECTURE
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  create_vector()  : Factory. Turns raw text into enriched metadata.    │
 * │  score_vectors()   : The RAG Brain. Ranks memory by Axis relevance.    │
 * │  format_past/fut() : The Pipe. Turns ranked data into Prompt strings.  │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import { scan_reflexes } from "./dynamics_engine.js"

/************************************************************************************
 * 🧩 [SECTION: THE FORGE — Vector Creation]
 * ----------------------------------------------------------------------------------
 * Logic for synthesizing raw data into structured memory vectors.
 ************************************************************************************/

/**
 * Creates a strict, metadata-rich vector object.
 *
 * [BRIDGE] Summary Fallback: If no summary is provided (e.g. for future vectors),
 * the raw text is used as the basis for axis scanning.
 *
 * @param {string} text - Raw content (past) or intent (future).
 * @param {string|null} [summary=null] - Compressed version of the text.
 * @returns {Object} A strict Vector object.
 */
export function create_vector(text, summary = null) {
    const final_summary = summary || text
    const reflexes = scan_reflexes(final_summary)

    return {
        id: crypto.randomUUID(),
        text,
        summary: final_summary,
        axis_tags: reflexes.map((r) => r.id),
        entity_tags: [],
        timestamp: Date.now(),
    }
}

/************************************************************************************
 * 🧩 [SECTION: THE BRAIN — RAG Retrieval & Scoring]
 * ----------------------------------------------------------------------------------
 * Ranks a list of vectors based on their relevance to the current input.
 ************************************************************************************/

/**
 * RAG Scoring: Prioritizes thematic alignment over keyword matching.
 *
 * MENTAL MODEL:
 * 1. Convert Input into AI Axis tags (e.g. "danger" -> [DEATH, ENTROPY]).
 * 2. Check overlap between Input Axis and Vector Axis.
 * 3. Priority: Axis Match (+2) > Entity Name Match (+1).
 *
 * @param {Array} vectors - The list of memories to search through.
 * @param {string} input   - The current user input or situation context.
 * @returns {Array} Sorted list of vectors (best match first).
 */
export function score_vectors(vectors, input) {
    if (!Array.isArray(vectors) || !vectors.length) return []
    if (!input) return vectors.slice(-3) // No input? Just give the 3 newest memories

    const current_reflexes = scan_reflexes(input).map((r) => r.id)
    const input_lower = input.toLowerCase()

    const scored = vectors.map((v) => {
        let score = 0
        // 🛡️ Axis Match: If the memory shares a "vibe" (Reflex id) with the input.
        v.axis_tags?.forEach((t) => {
            if (current_reflexes.includes(t)) score += 2
        })
        // 🏷️ Entity Match: If the memory explicitly mentions a relevant subject.
        v.entity_tags?.forEach((t) => {
            if (input_lower.includes(t.toLowerCase())) score += 1
        })
        return { ...v, _score: score }
    })

    return scored.sort((a, b) => b._score - a._score)
}

/************************************************************************************
 * 🧩 [SECTION: THE PIPE — Prompt Formatting]
 * ----------------------------------------------------------------------------------
 * Transforms data objects into formatted text blocks for AI delivery.
 ************************************************************************************/

/**
 * Renders the most relevant 3 past memories (Past Vectors).
 * Reverses order so the "best" match is closest to the AI's current context.
 *
 * @param {Array} vectors
 * @param {string} input
 * @returns {string} Formatted [RESONANCE] block.
 */
export function format_past(vectors, input) {
    const ranked = score_vectors(vectors, input).slice(0, 3)
    const reversed = [...ranked].reverse()
    return reversed.map((v) => `        [RESONANCE]: ${v.summary}`).join("\n")
}

/**
 * Renders the most relevant 3 future vectors.
 * Labels them [STAKE] if they have Axis tags, or [OBJECTIVE] if they are generic.
 *
 * @param {Array} vectors
 * @param {string} input
 * @returns {string} Formatted future block.
 */
export function format_future(vectors, input) {
    const ranked = score_vectors(vectors, input).slice(0, 3)
    const reversed = [...ranked].reverse()
    return reversed
        .map((v) => {
            const label = v.axis_tags?.length > 0 ? "STAKE" : "OBJECTIVE"
            return `        [${label}]: ${v.text}`
        })
        .join("\n")
}

/**
 * Unified API Export
 */
export const VectorEngine = {
    create_vector,
    score_vectors,
    format_past,
    format_future,
}
