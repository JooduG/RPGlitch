/**
 * @file src/ui/organisms/profile/config.js
 * @description Configuration for the Profile UI.
 * This file houses the UI Metadata (labels, sublabels, descriptions) and layout rules.
 */

import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity_fragments.js"

export { ENTITY_FRAGMENTS }

/**
 * Maps the ENTITY_FRAGMENTS into UI section objects for ProfileFragments.svelte.
 */
export const PROFILE_SECTIONS = Object.entries(ENTITY_FRAGMENTS).map(([sectionKey, section]) => {
    const fields = section.fields
        ? Object.entries(section.fields).map(([fieldKey, field]) => {
              return {
                  key: `${sectionKey}.${fieldKey}`,
                  label: field.label,
                  description: field.description || "",
                  enhancer: field.enhancer,
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
        columns: section.columns || 1,
        fields,
    }
})
