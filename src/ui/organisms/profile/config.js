/**
 * @file src/ui/organisms/profile/config.js
 * @description Configuration for the Profile UI.
 * This file houses the UI Metadata (labels, sublabels, descriptions) and layout rules.
 */

import { ENTITY_DEFINITION } from "@core/intelligence/intelligence_registry.js"

export { ENTITY_DEFINITION }

// UI Layout configuration (visuals only, not logic)
const LAYOUT_CONFIG = {
    eternal: "split",
    present: "split",
    past: "full",
    future: "full",
}

/**
 * Maps the ENTITY_DEFINITION into UI section objects for ProfileTraits.svelte.
 */
export const PROFILE_SECTIONS = Object.entries(ENTITY_DEFINITION).map(([sectionKey, section]) => {
    const fields = section.fields
        ? Object.entries(section.fields).map(([fieldKey, field]) => {
              return {
                  key: `${sectionKey}.${fieldKey}`,
                  label: field.label,
                  description: field.description || "",
              }
          })
        : [
              {
                  key: sectionKey,
                  label: null,
                  description: section.description || "",
              },
          ]

    return {
        id: sectionKey,
        label: section.label,
        sublabel: section.sublabel || null,
        layout: section.layout || LAYOUT_CONFIG[sectionKey] || "full",
        fields,
    }
})
