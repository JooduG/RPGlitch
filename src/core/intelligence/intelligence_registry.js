/**
 * @file src/core/intelligence/intelligence_registry.js
 * @description The One True Source of Truth for Entity Taxonomy.
 * Consolidates UI labels, descriptions, AI directives, and enhancers.
 */

export const ENTITY_DEFINITION = {
    eternal: {
        label: "Eternal",
        sublabel: "Permanent Traits & Features",
        layout: "split",
        fields: {
            physical: {
                label: "Physical",
                description: "User-facing description of physical traits.",
                directive: "I will define my purely visual, permanent traits here. I will detail my visual age, biological phenotype, build, and permanent marks like cybernetics or scars. I will strictly exclude clothing or abstract traits.",
                enhancer: "BIOMETRIC_RENDER_ENGINE",
            },
            non_physical: {
                label: "Non-Physical",
                description: "User-facing description of cognitive baseline.",
                directive: "I will define my permanent cognitive baseline here. I will detail my psychological maturity, core archetype, gender identity, speaking style, and verbal tics.",
                enhancer: "CORE_COGNITIVE_ARCHITECT",
            },
        },
    },
    present: {
        label: "Present",
        sublabel: "Temporary State & Conditions",
        layout: "split",
        fields: {
            physical: {
                label: "Physical",
                description: "User-facing description of current physical state.",
                directive: "I will define my current physical state, damage, and immediate exhaustion here. I will detail visible wounds, active HUD overlays, and current posture.",
                enhancer: "SOMATIC_STATE_TRACKER",
            },
            non_physical: {
                label: "Non-Physical",
                description: "User-facing description of current mental state.",
                directive: "I will define my immediate psychological state here. I will detail my current focus, emotional volatility, and active memory pressure.",
                enhancer: "TACTICAL_BEHAVIOR_ANALYZER",
            },
        },
    },
    past: {
        label: "Past",
        sublabel: "Origin & Backstory",
        description: "User-facing description of history and anchors.",
        layout: "full",
        directive: "I will detail my historical anchors here. I will include my origin story, formative events, and established relationships. If I have repressed trauma or forgotten memories I will note them clearly.",
        enhancer: "EPISODIC_MEMORY_COMPILER",
    },
    future: {
        label: "Future",
        sublabel: "Plans & Prophecies",
        description: "User-facing description of trajectory and goals.",
        layout: "full",
        directive: "I will define my self-interest protocol here. I will detail my overarching macro-goals, lateral agendas, and ultimate narrative destiny.",
        enhancer: "TRAJECTORY_SIMULATOR",
    },
}

/**
 * Flattened registry for efficient engine lookup (dot-notation).
 */
export const ENTITY_CATALOG = Object.entries(ENTITY_DEFINITION).reduce((acc, [sectionKey, section]) => {
    if (section.fields) {
        Object.entries(section.fields).forEach(([fieldKey, field]) => {
            const fullId = `${sectionKey}.${fieldKey}`
            acc[fullId] = {
                ...field,
                id: fullId,
                parent: sectionKey,
            }
        })
    } else {
        acc[sectionKey] = {
            ...section,
            id: sectionKey,
            parent: sectionKey,
        }
    }
    return acc
}, {})
