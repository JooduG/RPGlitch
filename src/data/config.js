/**
 * @file src/data/config.js
 * @description Configuration for the Data module.
 * Profile structure is now derived dynamically from the Narrative Schema.
 */

import { ENTITY_SCHEMA } from "@core/narrative/schema.js"

// UI Layout configuration (Visuals only, not logic)
const LAYOUT_CONFIG = {
    eternal: "split",
    present: "split",
    past: "full",
    future: "full",
}

/**
 * Generates the Profile Sections for the UI.
 * Merges Schema definitions (Logic) with Layout config (UI).
 */
export const PROFILE_SECTIONS = Object.entries(ENTITY_SCHEMA).map(
    ([key, section]) => ({
        id: key,
        label: section.label,
        sublabel: section.description,
        layout: LAYOUT_CONFIG[key] || "full",
        fields: Object.values(section.fields).map((f) => ({
            key: f.id,
            label: f.label,
            placeholder: f.placeholder,
        })),
    })
)
