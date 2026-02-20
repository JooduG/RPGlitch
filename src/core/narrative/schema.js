/**
 * @file src/core/narrative/schema.js
 * @description Single Source of Truth for Entity Structure.
 * Maps UI Fields -> LLM Directives -> Visual Constraints.
 */

export const ENTITY_SCHEMA = {
    eternal: {
        label: "Eternal",
        description: "Permanent Traits & Features",
        fields: {
            physical: {
                label: "Physical",
                placeholder: "Define permanent physiological traits like height, build and cybernetics. Ignore clothing.",
                enhancer: "PHENOTYPE_EXTRAPOLATOR",
            },
            mental: {
                label: "Mental",
                placeholder: "Define the cognitive baseline, including personality, archetypes, core fears and emotional axioms.",
                enhancer: "PSYCHE_UPSCALER",
            },
        },
    },
    present: {
        label: "Present",
        description: "Temporary State & Conditions",
        fields: {
            physical: {
                label: "Physical",
                placeholder: "Define current physical state, including injuries, fatigue and intoxication.",
                enhancer: "STATE_RENDERER",
            },
            mental: {
                label: "Mental",
                placeholder: "Define current mental state, including mood, emotional state, focus, cognitive load and immediate goals.",
                enhancer: "BEHAVIORAL_AMPLIFIER",
            },
        },
    },
    past: {
        label: "Past",
        description: "Origin & Backstory",
        placeholder: "Summarize key backstory events, origins and trauma that inform current behavior.",
        enhancer: "CAUSALITY_WEAVER",
    },
    future: {
        label: "Future",
        description: "Plans & Prophecies",
        placeholder: "Define long-term objectives, immediate needs and long-term ambitions.",
        enhancer: "TRAJECTORY_SIMULATOR",
    },
}

/**
 * Helper to get a flat list of all fields for iteration.
 * Handles mixed hierarchy:
 * - Nested: section.fields.key -> id = "section.key"
 * - Flat: section -> id = "section"
 */
export const FIELD_REGISTRY = Object.entries(ENTITY_SCHEMA).reduce((acc, [sectionKey, section]) => {
    if (section.fields) {
        // Nested Structure
        Object.entries(section.fields).forEach(([fieldKey, field]) => {
            const fullId = `${sectionKey}.${fieldKey}`
            acc[fullId] = { ...field, id: fullId }
        })
    } else {
        // Flat Structure (The section IS the field)
        acc[sectionKey] = { ...section, id: sectionKey }
    }
    return acc
}, {})

// Legacy helper removed as it is now handled by src/data/config.js logic
