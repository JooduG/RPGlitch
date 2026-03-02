/**
 * @file src/core/intelligence/entity_fragments.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 📋 ENTITY FRAGMENTS  —  The One True Source of Truth for Entity Taxonomy
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PURPOSE
 * Defines the canonical schema for all entity fields across the simulation.
 * Every field has a UI label, an AI directive, and an enhancer tag.
 *
 * TWO EXPORTS
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ENTITY_FRAGMENTS  — Nested, section-grouped source of truth.           │
 * │                      Consumed by: UI components, broker (via CATALOG).  │
 * │                                                                         │
 * │  ENTITY_CATALOG    — Flat dot-keyed map derived from ENTITY_FRAGMENTS.  │
 * │                      Consumed by: intelligence_broker.js for iteration. │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * FIELD SCHEMA
 *   label     {string}  — Display name for the field (UI + prompt).
 *   directive {string}  — First-person AI writing instruction for the field.
 *   enhancer  {string}  — Semantic tag used for LexicalFilter prioritization.
 *
 * SECTION SCHEMA (UI-only additions, not used by engine)
 *   sublabel  {string}  — UI subtitle shown beneath the section header.
 *   columns   {number}  — UI grid column count for the section's fields.
 */

/************************************************************************************
 * 🧩 [SECTION: ENTITY FRAGMENTS]
 * ----------------------------------------------------------------------------------
 * Source definition. Nested by temporal section → field key.
 * Temporal sections: Eternal, Present, Past, Future.
 ************************************************************************************/

/**
 * Canonical taxonomy of all entity fields, grouped by temporal section.
 *
 * ESSENCE TAXONOMY
 *   Eternal / Present → each has `physical` + `non_physical` fields
 *   Past / Future     → each has a single unified `essence` field
 *
 * Note: `physical` fields are excluded from simulation mode prompts by the broker.
 */
export const ENTITY_FRAGMENTS = {
    eternal: {
        label: "Eternal",
        sublabel: "Permanent Fragments & Features", // UI only
        columns: 2, // UI only
        fields: {
            physical: {
                label: "Physical",
                directive: "I will define my purely visual, permanent fragments here. I will detail my visual age, biological phenotype, build, and permanent marks like cybernetics or scars. I will strictly exclude clothing or abstract fragments.",
                enhancer: "BIOMETRIC_RENDER_ENGINE",
            },
            non_physical: {
                label: "Non-Physical",
                directive: "I will define my permanent cognitive baseline here. I will detail my psychological maturity, core archetype, gender identity, speaking style, and verbal tics.",
                enhancer: "CORE_COGNITIVE_ARCHITECT",
            },
        },
    },
    present: {
        label: "Present",
        sublabel: "Temporary State & Conditions", // UI only
        columns: 2, // UI only
        fields: {
            physical: {
                label: "Physical",
                directive: "I will define my current physical state, damage, and immediate exhaustion here. I will detail visible wounds, active HUD overlays, and current posture.",
                enhancer: "SOMATIC_STATE_TRACKER",
            },
            non_physical: {
                label: "Non-Physical",
                directive: "I will define my immediate psychological state here. I will detail my current focus, emotional volatility, and active memory pressure.",
                enhancer: "TACTICAL_BEHAVIOR_ANALYZER",
            },
        },
    },
    past: {
        label: "Past",
        sublabel: "Origin & Backstory", // UI only
        columns: 1, // UI only
        fields: {
            essence: {
                label: "Essence",
                directive: "I will detail my historical anchors here. I will include my origin story, formative events, and established relationships. If I have repressed trauma or forgotten memories I will note them clearly.",
                enhancer: "EPISODIC_MEMORY_COMPILER",
                type: "array", // Metadata for the structured format
            },
        },
    },
    future: {
        label: "Future",
        sublabel: "Plans & Prophecies", // UI only
        columns: 1, // UI only
        fields: {
            essence: {
                label: "Essence",
                directive: "I will define my self-interest protocol here. I will detail my overarching macro-goals, lateral agendas, and ultimate narrative destiny. Use [CONSEQUENCE: ...] for stakes.",
                enhancer: "TRAJECTORY_SIMULATOR",
                type: "array", // Metadata for the structured format
            },
        },
    },
}

/************************************************************************************
 * 🧩 [SECTION: ENGINE CATALOG]
 * ----------------------------------------------------------------------------------
 * Flattened dot-key map derived from ENTITY_FRAGMENTS for efficient broker lookups.
 * Keys use dot notation: "eternal.non_physical", "past.essence", etc.
 ************************************************************************************/

/**
 * Builds a flat `{ [dotKey]: metadata }` map from the nested ENTITY_FRAGMENTS tree.
 * Each entry is enriched with:
 *   - `id`           {string} — Dot-notation key, e.g. "eternal.non_physical"
 *   - `section_label`{string} — Parent section display name, e.g. "Eternal"
 *   - `layer_key`    {string} — Parent section key in uppercase, e.g. "ETERNAL"
 *
 * @returns {Object.<string, Object>} Flat catalog keyed by dot-notation field ID.
 */
function build_entity_catalog() {
    const catalog = {}

    Object.entries(ENTITY_FRAGMENTS).forEach(([section_key, section]) => {
        Object.entries(section.fields).forEach(([field_key, field]) => {
            const id = `${section_key}.${field_key}`
            catalog[id] = {
                ...field,
                id,
                section_label: section.label,
                layer_key: section_key.toUpperCase(),
            }
        })
    })

    return catalog
}

/**
 * Flat registry of all entity fields, keyed by dot-notation ID.
 * Used by `intelligence_broker.js` to iterate fields and resolve entity data.
 *
 * @example
 * ENTITY_CATALOG["eternal.non_physical"]
 * // → { label, directive, enhancer, id, section_label: "Eternal", layer_key: "ETERNAL" }
 */
export const ENTITY_CATALOG = build_entity_catalog()
