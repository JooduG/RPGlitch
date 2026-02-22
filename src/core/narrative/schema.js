/**
 * @file src/core/narrative/schema.js
 * @description Master Entity Schema. Placeholders act as in-character directives,
 * priming both the human user and the LLM for First-Person POV generation while
 * strictly isolating visual renders from cognitive architecture.
 */

export const ENTITY_SCHEMA = {
    eternal: {
        label: "Eternal",
        description: "Permanent Traits & Features",
        fields: {
            physical: {
                label: "Physical",
                placeholder: "I will define my purely visual, permanent traits here. I will detail my visual age (e.g., weathered skin, silver hair), biological phenotype, build, and permanent marks like cybernetics or scars. I will strictly exclude clothing, mental maturity, or abstract traits.",
                enhancer: "BIOMETRIC_RENDER_ENGINE",
            },
            mental: {
                label: "Mental",
                placeholder:
                    "I will define my permanent cognitive baseline here. I will detail my psychological maturity, core archetype, gender identity, sexuality, speaking style, and verbal tics. If I have subconscious fears or hidden friction I am unaware of, I will wrap them in <SUBCONSCIOUS> tags.",
                enhancer: "CORE_COGNITIVE_ARCHITECT",
            },
        },
    },
    present: {
        label: "Present",
        description: "Temporary State & Conditions",
        fields: {
            physical: {
                label: "Physical",
                placeholder: "I will define my immediate, transitory visual state here. I will detail my current outfit, hairstyle, held inventory, and active somatic tells like sweating, bleeding, or intoxication.",
                enhancer: "SOMATIC_STATE_TRACKER",
            },
            mental: {
                label: "Mental",
                placeholder: "I will define my fluid cognitive load here. I will detail my current mood, my immediate tactical objectives for the scene, and my active domain beliefs regarding trust or suspicion.",
                enhancer: "TACTICAL_BEHAVIOR_ANALYZER",
            },
        },
    },
    past: {
        label: "Past",
        description: "Origin & Backstory",
        placeholder:
            "I will detail my historical anchors here. I will include my origin story, episodic memory, and established relationships. If I have repressed trauma or forgotten memories, I will define them strictly inside a <SUBCONSCIOUS> XML block so the system knows, but my conscious mind does not.",
        enhancer: "EPISODIC_MEMORY_COMPILER",
    },
    future: {
        label: "Future",
        description: "Plans & Prophecies",
        placeholder: "I will define my self-interest protocol here. I will detail my overarching macro-goals, lateral agendas, and ultimate narrative destiny.",
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
