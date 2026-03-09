/**
 * @file src/core/intelligence/ContextBroker.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔌 CONTEXT BROKER  —  The State Adapter & Document Assembler
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * ContextBroker is the "Secretary" of the Intelligence Kernel. It handles
 * the Hydration phase: pulling raw state from the runtime and repository,
 * cleaning it, and packaging it into a unified IntelligencePayload.
 *
 * ARCHITECTURE
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  hydrate()           : Primary entry point. Returns IntelligencePayload.│
 * │  Entity Mapping      : Resolves entities by role into a mapped object.  │
 * │  Lexical Filtering   : Sorts fragments by relevance to active objective.│
 * └────────────────────────────────────────────────────────────────────────┘
 */

import { runtime } from "@state/runtime.svelte.js"
import { ENTITY_CATALOG } from "./entity_fragments.js"

/************************************************************************************
 * 🧩 [SECTION: PRIVATE HELPERS]
 ************************************************************************************/

/**
 * Resolves a dot-notation path against a nested object.
 */
function get_path_value(obj, path) {
    const parts = path.split(".")
    let current = obj
    for (const part of parts) {
        if (current && typeof current === "object") {
            current = current[part]
        } else if (typeof current === "string" && parts.indexOf(part) < parts.length - 1) {
            return current
        } else {
            return ""
        }
    }
    return current || ""
}

/**
 * Validates if a field belongs to physical appearance.
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
 * Converts entity data into structured fragments.
 */
function to_fragments(entity, mode = "simulation") {
    if (!entity) return []
    const list = []

    // 1. Schema-defined Catalog
    Object.entries(ENTITY_CATALOG).forEach(([fieldId, metadata]) => {
        if (mode === "image" && !is_physical_field({ fieldId, ...metadata })) return

        let val = get_path_value(entity, fieldId)
        if (!val && fieldId === "present.physical" && entity.description) {
            val = entity.description // Legacy fallback
        }

        if (val && typeof val === "string") {
            list.push({
                text: ContextBroker.clean_text(val),
                type: metadata.label,
                enhancer: metadata.enhancer,
                section: metadata.section_label || "Present",
                layer: metadata.layer_key,
            })
        }
    })

    // 2. Ad-hoc fragments
    if (Array.isArray(entity.fragments)) {
        entity.fragments.forEach((f) => {
            if (mode === "image" && !is_physical_field(f)) return
            const section = f.section || "General"
            list.push({
                text: ContextBroker.clean_text(typeof f === "string" ? f : f.text),
                type: f.type || "General",
                enhancer: f.enhancer || "NONE",
                section,
                layer: f.layer || section.toUpperCase(),
            })
        })
    }

    return list.filter((f) => f.text.length > 0)
}

/**
 * Groups a flat fragment array by layer key into a { LAYER: [...] } map.
 */
function group_by_layer(fragments) {
    const layers = {}
    fragments.forEach((f) => {
        const key = f.layer || "GENERAL"
        if (!layers[key]) layers[key] = []
        layers[key].push(f)
    })
    return layers
}

/************************************************************************************
 * 🧩 [SECTION: CONTEXT BROKER]
 ************************************************************************************/

export class ContextBroker {
    /**
     * HYDRATION PHASE
     * Pulls and resolves all necessary state for an intelligence turn.
     * Returns a frozen IntelligencePayload.
     *
     * @param {string} input - The current user input.
     * @param {string} [type="simulation"] - 'simulation' | 'logic' | 'image'
     * @param {Array} simulation_log - Recent message log.
     */
    static async hydrate(input, type = "simulation", simulation_log = []) {
        const turn = runtime.turn || 1
        const active_vector = runtime.activeVector("FRACTAL") || "EXPLORE"

        // 1. Resolve Entities mapping (Role -> Data)
        const entries = [
            { role: "AI", data: runtime.active_ai },
            { role: "USER", data: runtime.active_user },
            { role: "FRACTAL", data: runtime.active_fractal },
        ]

        const entities = {}
        entries.forEach(({ role, data }) => {
            const raw = data || { name: role, role, fragments: [] }
            const fragments = to_fragments(raw, type)

            // Lexical filtering for AI relevance
            const filtered = role === "AI" ? ContextBroker.lexical_filter(fragments, active_vector) : fragments

            // Safety boot-strap
            if (filtered.length === 0) {
                filtered.push({
                    text: `A nascent ${role.toLowerCase()} entity. State: Initializing.`,
                    type: "Status",
                    enhancer: "SYSTEM",
                    section: "Present",
                })
            }

            // Build a clean properties object for the prompt builder
            const properties = {
                eternal: { physical: "", non_physical: "" },
                present: { physical: "", non_physical: "" },
            }

            filtered.forEach((f) => {
                const layer = f.layer?.toLowerCase()
                const field = f.type === "Physical" ? "physical" : "non_physical"
                if (properties[layer] && properties[layer][field] === "") {
                    properties[layer][field] = f.text
                }
            })

            entities[role] = {
                id: raw.id,
                name: raw.name || role,
                fragments: filtered,
                layers: group_by_layer(filtered),
                properties,
                past: raw.past,
                future: raw.future,
                dynamics: raw.dynamics, // Pass through for physics calculation
                associated_ids: raw.associated_ids || [],
            }
        })

        // 2. Build Unified Payload
        return {
            input,
            type,
            turn,
            entities,
            simulation_log: ContextBroker.assemble_snapshot(simulation_log),
            rawMessages: simulation_log,
            meta: {
                active_vector,
                timestamp: new Date().toISOString(),
            },
        }
    }

    /**
     * Creates a dense beat-map of recent history.
     */
    static assemble_snapshot(history = []) {
        if (!history.length) return null
        return history
            .map((m) => {
                const owner = m.character_name || (m.role === "user" ? "User" : "AI")
                const raw = m.content || ""
                const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
                return `[${owner}]: ${ContextBroker.clean_text(stripped, 500)}`
            })
            .join("\n")
    }

    /**
     * Relevance-based sorting for fragments.
     */
    static lexical_filter(fragments, objective) {
        if (!objective) return fragments
        const keywords = objective
            .toLowerCase()
            .split(/\W+/)
            .filter((w) => w.length > 3)
        const get_text = (f) => (f.text || "").toLowerCase()

        return [...fragments].sort((a, b) => {
            const a_hit = keywords.some((k) => get_text(a).includes(k))
            const b_hit = keywords.some((k) => get_text(b).includes(k))
            return (b_hit ? 1 : 0) - (a_hit ? 1 : 0)
        })
    }

    /**
     * Text sanitization for prompt safety.
     */
    static clean_text(text, limit = 500) {
        if (!text) return ""
        const clean = text
            .replace(/[*_#>`-]/g, "")
            .replace(/\s+/g, " ")
            .trim()
        return clean.length > limit ? clean.substring(0, limit) + "..." : clean
    }
}
