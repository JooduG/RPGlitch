/**
 * @file src/core/narrative/schema.js
 * @description Single Source of Truth for Entity Structure.
 * Maps UI Fields -> LLM Directives -> Visual Constraints.
 */

export const ENTITY_SCHEMA = {
    eternal: {
        label: "Eternal",
        description: "Permanent traits that define the entity's core.",
        fields: {
            physical: {
                id: "eternal.physical",
                label: "Physical Appearance",
                placeholder: "Height, build, distinguishing marks, cybernetics...",
                llm: {
                    role: "BIOLOGICAL_ARCHITECT",
                    instruction: "Define permanent physiological traits. Ignore clothing.",
                    priority: "HIGH",
                },
                visual: {
                    tag_weight: 1.5,
                    category: "subject",
                },
            },
            mental: {
                id: "eternal.mental",
                label: "Psychological Core",
                placeholder: "Archetype, core fears, deepest desires, neuroses...",
                llm: {
                    role: "PSYCHE_PROFILER",
                    instruction: "Define the cognitive baseline and emotional axioms.",
                    priority: "CRITICAL",
                },
                visual: {
                    tag_weight: 0,
                    category: "abstract",
                },
            },
        },
    },
    present: {
        label: "Present",
        description: "Current state, attire, and equipment.",
        fields: {
            outfit: {
                id: "present.outfit",
                label: "Current Attire",
                placeholder: "Clothing, armor, accessories, style...",
                llm: {
                    role: "COSTUME_DESIGNER",
                    instruction: "Define current worn items and aesthetic style.",
                    priority: "MEDIUM",
                },
                visual: {
                    tag_weight: 1.2,
                    category: "attire",
                },
            },
            inventory: {
                id: "present.inventory",
                label: "Active Inventory",
                placeholder: "Weapons, tools, held items...",
                llm: {
                    role: "QUARTERMASTER",
                    instruction: "Define universally available tools/weapons.",
                    priority: "MEDIUM",
                },
                visual: {
                    tag_weight: 1.0,
                    category: "props",
                },
            },
            status: {
                id: "present.status",
                label: "Physiological Status",
                placeholder: "Injuries, fatigue, intoxication, hunger...",
                llm: {
                    role: "MEDICAL_OFFICER",
                    instruction: "Define current biological deviations from baseline.",
                    priority: "HIGH",
                },
                visual: {
                    tag_weight: 0.8,
                    category: "details",
                },
            },
        },
    },
    past: {
        label: "Past",
        description: "History and formative events.",
        fields: {
            history: {
                id: "past.history",
                label: "Backstory",
                placeholder: "Origin, key events, relationships, trauma...",
                llm: {
                    role: "HISTORIAN",
                    instruction: "Summarize key timeline events that inform current behavior.",
                    priority: "LOW",
                },
                visual: {
                    tag_weight: 0,
                    category: "context",
                },
            },
        },
    },
    future: {
        label: "Future",
        description: "Goals and drives.",
        fields: {
            goals: {
                id: "future.goals",
                label: "Objectives",
                placeholder: "Immediate needs, long-term ambitions...",
                llm: {
                    role: "STRATEGIST",
                    instruction: "Define the vector of user agency and desire.",
                    priority: "MEDIUM",
                },
                visual: {
                    tag_weight: 0,
                    category: "context",
                },
            },
        },
    },
}

/**
 * Helper to get a flat list of all fields for iteration.
 */
export const FIELD_REGISTRY = Object.values(ENTITY_SCHEMA).reduce((acc, section) => {
    Object.values(section.fields).forEach((field) => {
        acc[field.id] = field
    })
    return acc
}, {})

/**
 * Helper to get UI Configuration for the Profile Editor.
 */
export const getProfileSections = () => {
    return Object.entries(ENTITY_SCHEMA).map(([key, section]) => ({
        id: key,
        label: section.label,
        sublabel: section.description,
        fields: Object.values(section.fields).map((f) => ({
            key: f.id,
            label: f.label,
            placeholder: f.placeholder,
        })),
    }))
}
