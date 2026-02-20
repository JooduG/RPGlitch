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
 * Handles Mixed Hierarchy (Nested Fields vs Flat Sections).
 */
export const PROFILE_SECTIONS = Object.entries(ENTITY_SCHEMA).map(([sectionKey, section]) => {
    // base section config
    const uiSection = {
        id: sectionKey,
        label: section.label,
        sublabel: section.description, // For flat sections, this might be redundant with placeholder?
        layout: LAYOUT_CONFIG[sectionKey] || "full",
        fields: [],
    }

    if (section.fields) {
        // Nested Structure (e.g. Eternal -> Physical/Mental)
        uiSection.fields = Object.entries(section.fields).map(([fieldKey, field]) => ({
            key: `${sectionKey}.${fieldKey}`, // ID generation
            label: field.label,
            placeholder: field.placeholder,
        }))
    } else {
        // Flat Structure (e.g. Past)
        // The section itself is the field.
        uiSection.fields = [
            {
                key: sectionKey, // ID is just the section key
                label: null, // No sub-label needed if it's the whole section
                placeholder: section.placeholder,
            },
        ]
    }

    return uiSection
})
