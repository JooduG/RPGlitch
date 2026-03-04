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
 * Every vector follows a strict schema:
 * {
 *   id: uuid,
 *   timestamp: number,
 *   text: string (raw content),
 *   emotional_weight: number (W=1-10, set at write time by SemanticEvaluator),
 *   dynamics_tags: string[] (derived from DynamicsEngine),
 *   vector_tags: string[] (manual/system tags),
 * }
 *
 * ARCHITECTURE
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  create_vector()  : Factory. Turns raw text into enriched metadata.    │
 * │  score_vectors()   : The RAG Brain. Ranks memory by Axis relevance.    │
 * │  format_past/fut() : The Pipe. Turns ranked data into Prompt strings.  │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import { DynamicsEngine } from "./DynamicsEngine.js"

/************************************************************************************
 * 🧩 [SECTION: THE FORGE — Vector Creation]
 * ----------------------------------------------------------------------------------
 * Logic for synthesizing raw data into structured memory vectors.
 ************************************************************************************/

/**
 * Creates a strict, metadata-rich vector object.
 *
 * @param {string} text - Raw content (past) or intent (future).
 * @returns {Object} A strict Vector object.
 */
export function create_vector(text) {
    const reflexes = DynamicsEngine.scan_reflexes(text)

    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        text,
        emotional_weight: DynamicsEngine.evaluate_weight(reflexes),
        dynamics_tags: reflexes.map((r) => r.id),
        vector_tags: [],
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

    const current_reflexes = DynamicsEngine.scan_reflexes(input).map((r) => r.id)
    const input_lower = input.toLowerCase()

    const scored = vectors.map((v) => {
        let score = 0
        // 🛡️ Axis Match: If the memory shares a "vibe" (Reflex id) with the input.
        v.dynamics_tags?.forEach((t) => {
            if (current_reflexes.includes(t)) score += 2
        })
        // 🏷️ Entity Match: If the memory explicitly mentions a relevant subject.
        v.vector_tags?.forEach((t) => {
            if (input_lower.includes(t.toLowerCase())) score += 1
        })
        // ⚖️ Emotional Weight: Flat addend from MNOTION tier (W=3 baseline, W=10 max).
        score += v.emotional_weight ?? 3

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
 * Renders the most relevant past memories (Past Vectors).
 * Reverses order so the "best" match is closest to the AI's current context.
 *
 * @param {Array} vectors
 * @param {string} input
 * @param {number} [limit=3]
 * @param {number} [offset=0]
 * @returns {string} Formatted [PAST_VECTOR] block.
 */
export function format_past(vectors, input, limit = 3, offset = 0) {
    const ranked = score_vectors(vectors, input).slice(offset, offset + limit)
    const reversed = [...ranked].reverse()
    return reversed
        .map((v) => {
            const w = v.emotional_weight ?? 3
            const label = w >= 10 ? "CORE_MEMORY" : w >= 8 ? "MAJOR_MEMORY" : w >= 6 ? "MEMORY" : "ECHO"
            return `        [${label}]: ${v.text}`
        })
        .join("\n")
}

/**
 * Renders the most relevant future vectors.
 * Labels them [STAKE] if they have Axis tags, or [OBJECTIVE] if they are generic.
 *
 * @param {Array} vectors
 * @param {string} input
 * @param {number} [limit=3]
 * @param {number} [offset=0]
 * @returns {string} Formatted future block.
 */
export function format_future(vectors, input, limit = 3, offset = 0) {
    const ranked = score_vectors(vectors, input).slice(offset, offset + limit)
    const reversed = [...ranked].reverse()
    return reversed
        .map((v) => {
            const w = v.emotional_weight ?? 3
            const label = w >= 10 ? "CORE_MEMORY" : w >= 8 ? "MAJOR_MEMORY" : w >= 6 ? "MEMORY" : "ECHO"
            return `        [FUTURE_${label}]: ${v.text}`
        })
        .join("\n")
}

/**
 * Moves a future vector to the past log, optionally with a resolution tag.
 *
 * @param {Object} entity
 * @param {string} vector_id
 * @param {string} [resolution=null]
 */
export function resolve_vector(entity, vector_id, resolution = null) {
    if (!entity.future?.vectors) return

    const index = entity.future.vectors.findIndex((v) => v.id === vector_id)
    if (index === -1) return

    const [vector] = entity.future.vectors.splice(index, 1)

    // Add resolution tag if provided
    if (resolution) {
        if (!vector.vector_tags) vector.vector_tags = []
        vector.vector_tags.push(`RESOLUTION:${resolution.toUpperCase()}`)
    }
    vector.timestamp = Date.now()

    if (!entity.past) entity.past = { vectors: [] }
    if (!entity.past.vectors) entity.past.vectors = []

    entity.past.vectors.push(vector)
}

/**
 * Unified API Export
 */
export const VectorEngine = {
    create_vector,
    score_vectors,
    format_past,
    format_future,
    resolve_vector,
}
