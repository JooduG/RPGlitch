/**
 * @file src/core/intelligence/intelligence_broker.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔌 CONTEXT BROKER  —  The State Adapter & Document Assembler
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * ContextBroker is the "Secretary" of the Intelligence Kernel. It knows
 * exactly where every piece of game state lives and how to pull it, clean it,
 * and package it into a structured payload for the LLM.
 *
 * ARCHITECTURE
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  assemble()          : Primary entry point. Orchestrates the full pull. │
 * │  State Adapters      : pull_entities, pull_history, assemble_snapshot.  │
 * │  Logic Filters       : lexical_filter, clean_text (pure transformers).  │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * DATA FLOW
 *   Svelte State (runtime, bus)
 *     └─→ ContextBroker (Assembly)
 *         └─→ Engine.compose() (Dynamics + Prompt Composition)
 *             └─→ narrative_logic (System Prompt Templates)
 *                 └─→ narrative_atoms (XML Generation)
 */

import { state } from "@core/engine/bus.svelte.js"
import { runtime } from "@state/runtime.svelte.js"
import { Engine } from "./dynamics_engine.js"
import { ENTITY_CATALOG } from "./entity_fragments.js"

/************************************************************************************
 * 🧩 [SECTION: PRIVATE HELPERS]
 * ----------------------------------------------------------------------------------
 * Module-level helpers used by the adapters. Not exported — internal use only.
 ************************************************************************************/

/**
 * Resolves a dot-notation path against a nested object (e.g. "eternal.physical").
 * Returns "" if the path doesn't resolve or if an intermediate node is missing.
 *
 * [BRIDGE] Resilience: if an intermediate node is a plain string (legacy fractal
 * data), the string is returned as-is rather than failing silently.
 *
 * @param {Object} obj  - The root data object.
 * @param {string} path - Dot-delimited field key.
 * @returns {string}
 */
function get_path_value(obj, path) {
    const parts = path.split(".")
    let current = obj
    for (const part of parts) {
        if (current && typeof current === "object") {
            current = current[part]
        } else if (typeof current === "string" && parts.indexOf(part) < parts.length - 1) {
            return current // [BRIDGE] Legacy string field — return as-is
        } else {
            return ""
        }
    }
    return current || ""
}

/**
 * Returns true if a field or fragment represents physical appearance data.
 * Physical fields are excluded from simulation prompts; they are reserved for Image mode.
 *
 * @param {{ fieldId?: string, label?: string, enhancer?: string, is_physical?: boolean, type?: string, section?: string }} field
 * @returns {boolean}
 */
function is_physical_field(field) {
    return (
        field.fieldId?.endsWith(".physical") ||
        field.label === "Physical" ||
        field.is_physical === true ||
        field.type?.includes("Physical") ||
        field.section?.includes("Physical") ||
        field.type?.includes("Visual") ||
        field.section?.includes("Visual") ||
        field.enhancer?.includes("BIOMETRIC") ||
        field.enhancer?.includes("VISUAL")
    )
}

/**
 * Converts a raw entity object into an array of enriched Fragment records.
 * Draws from two sources:
 *   1. ENTITY_CATALOG fields (schema-defined, resolved via dot-notation paths)
 *   2. entity.fragments  (ad-hoc / manual overrides)
 *
 * @param {Object} entity - Character or entity data object.
 * @param {string} mode   - 'simulation' | 'image'. Controls physical field filtering.
 * @returns {Array<{text: string, type: string, enhancer: string, layer?: string, section?: string}>}
 */
function to_fragments(entity, mode) {
    if (!entity) return []
    const list = []

    // 1. Catalog-driven fields
    Object.entries(ENTITY_CATALOG).forEach(([fieldId, metadata]) => {
        if (mode === "simulation" && is_physical_field({ fieldId, ...metadata })) return

        let val = get_path_value(entity, fieldId)

        // [BRIDGE] Fallback for legacy fractals that store appearance in a root 'description' string
        if (!val && fieldId === "present.physical" && entity.description) {
            val = entity.description
        }

        if (val && typeof val === "string") {
            list.push({
                text: val,
                type: metadata.label,
                enhancer: metadata.enhancer,
                // [R8] Do not leak field directives into simulation prompts
                directive: mode === "simulation" ? undefined : metadata.directive,
                layer: metadata.layer_key,
                section: metadata.section_label,
            })
        }
    })

    // 2. Ad-hoc / manual fragments
    if (Array.isArray(entity.fragments)) {
        entity.fragments.forEach((f) => {
            if (mode === "simulation" && is_physical_field(f)) return
            list.push({
                text: typeof f === "string" ? f : f.text,
                type: f.type || "General",
                enhancer: f.enhancer || "NONE",
                section: f.section || "General",
            })
        })
    }

    // 3. Clean and filter empty entries
    return list.map((f) => ({ ...f, text: ContextBroker.clean_text(f.text) })).filter((f) => f.text?.length > 0)
}

/**
 * Internal resolver: returns the context layers required for the given phase.
 * @param {string} phase
 * @returns {string[]}
 */
function _required_context(phase) {
    switch (phase) {
        case "logic":
            return [] // Logic prompts need no entity context
        case "image":
            return ["entity"]
        default:
            return ["snapshot", "entity"] // simulation
    }
}

/************************************************************************************
 * 🧩 [SECTION: CONTEXT BROKER]
 * ----------------------------------------------------------------------------------
 * The primary API for assembling LLM payloads from live application state.
 * All methods are pure functions over Svelte state — no instance required.
 ************************************************************************************/

export const ContextBroker = {
    /**
     * ORCHESTRATOR
     * Assembles a complete LLM payload for the given action and narrative phase.
     *
     * @param {string} action              - The user's input or triggered action string.
     * @param {string} [type="simulation"] - 'simulation' | 'logic' | 'image'
     * @returns {Promise<Object>} The full payload for LlmService.generate().
     */
    async assemble(action, type = "simulation") {
        // 1. Determine which context layers this phase requires
        const needs = _required_context(type)

        // 2. Pull each required layer from live application state
        const state_data = {
            snapshot: needs.includes("snapshot") ? ContextBroker.assemble_snapshot() : null,
            entity: needs.includes("entity") ? ContextBroker.pull_entities(type) : null,
        }

        // 3. Delegate prompt composition to the Dynamics Engine
        const result = await Engine.compose({
            input: action,
            state: state_data,
            type,
        })

        // 4. Attach L1 short-term history for dialogue continuity
        const messages = ContextBroker.pull_history()
        return {
            system: result.system,
            messages,
            meta: result.meta,
            params: {
                temperature: type === "logic" ? 0.3 : 0.8,
            },
        }
    },

    /**
     * ENTITY ADAPTER
     * Pulls the AI, User, and Fractal entities and processes their fields into
     * enriched Fragment records. All three are mapped to a uniform structure:
     * { role, name, fragments }.
     *
     * @param {string} [mode="simulation"] - 'simulation' | 'image'
     * @returns {{ list: Array, turn: number, objective: string }}
     */
    pull_entities(mode = "simulation") {
        const turn = runtime.turn || 1
        const objective = runtime.activeObjective || "EXPLORE"

        const sources = [
            { role: "AI", data: runtime.activeAI, name: runtime.activeAI?.name || "AI" },
            { role: "USER", data: runtime.activeUser, name: runtime.activeUser?.name || "User" },
            { role: "FRACTAL", data: runtime.activeFractal, name: runtime.activeFractal?.name || "Environment" },
        ]

        const list = sources
            .filter((s) => s.data)
            .map((s) => {
                const fragments = to_fragments(s.data, mode)
                // AI fragments are priority-sorted by the active objective
                const final_fragments = s.role === "AI" ? ContextBroker.lexical_filter(fragments, objective) : fragments
                return { role: s.role, name: s.name, fragments: final_fragments }
            })

        return { list, turn, objective }
    },

    /**
     * L1 HISTORY ADAPTER
     * Pulls the 10 most recent unconsolidated messages for dialogue continuity.
     *
     * @returns {Array<{role: string, content: string, characterName?: string}>}
     */
    pull_history() {
        const active_id = state.story?.activeId
        if (!active_id) return []

        return (state.messages?.byStoryId[active_id] || [])
            .filter((m) => !m.meta?.consolidated)
            .slice(-10)
            .map((m) => ({
                role: m.role === "user" ? "user" : "model",
                content: m.text,
                characterName: m.characterName,
            }))
    },

    /**
     * NARRATIVE SNAPSHOT ADAPTER
     * Concatenates the last 3 messages into a dense beat-map string.
     * Gives the LLM short-term scene awareness without consuming history slots.
     *
     * @returns {string|null}
     */
    assemble_snapshot() {
        const active_id = state.story?.activeId
        if (!active_id) return null

        const messages = (state.messages?.byStoryId[active_id] || []).slice(-3)
        if (!messages.length) return null

        return messages
            .map((m) => {
                const owner = m.characterName || (m.role === "user" ? "User" : "AI")
                return `[${owner}]: ${ContextBroker.clean_text(m.text, 120)}`
            })
            .join("\n")
    },

    // ─── Logic Filters (also exported for direct test access) ─────────────────

    /**
     * Sorts fragments by relevance to the current objective.
     * Fragments whose text contains objective keywords float to the top.
     * Handles both plain strings and enriched fragment objects.
     *
     * @param {Array<string|Object>} fragments
     * @param {string} objective
     * @returns {Array}
     */
    lexical_filter(fragments, objective) {
        if (!objective) return fragments

        const keywords = objective
            .toLowerCase()
            .split(/\W+/)
            .filter((w) => w.length > 3)

        const get_text = (f) => (typeof f === "string" ? f : f.text || "").toLowerCase()

        return [...fragments].sort((a, b) => {
            const a_hit = keywords.some((k) => get_text(a).includes(k))
            const b_hit = keywords.some((k) => get_text(b).includes(k))
            return (b_hit ? 1 : 0) - (a_hit ? 1 : 0)
        })
    },

    /**
     * Sanitizes raw text into dense, prompt-safe content.
     * Strips markdown symbols, collapses whitespace, and truncates to `limit` chars.
     *
     * @param {string} text
     * @param {number} [limit=500]
     * @returns {string}
     */
    clean_text(text, limit = 500) {
        if (!text) return ""
        const clean = text
            .replace(/[*_#>`-]/g, "") // Strip markdown
            .replace(/\s+/g, " ") // Collapse whitespace
            .trim()
        return clean.length > limit ? clean.substring(0, limit) + "..." : clean
    },
}
