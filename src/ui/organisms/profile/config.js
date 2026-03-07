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
export const PROFILE_SECTIONS = Object.entries(ENTITY_FRAGMENTS)
    .filter(([_, section]) => typeof section !== "string" && section !== null)
    .map(([sectionKey, sectionObj]) => {
        /** @type {any} */
        const section = sectionObj
        const fields = section.fields
            ? Object.entries(section.fields).map(([fieldKey, field]) => {
                  return {
                      key: `${sectionKey}.${fieldKey}`,
                      label: field.label,
                      description: field.description || "",
                      enhancer: field.enhancer,
                      type: field.type,
                      unitLabel: field.unit_label || section.unit_label || "Vector",
                  }
              })
            : [
                  {
                      key: sectionKey,
                      label: section.label,
                      description: section.description || "",
                      enhancer: section.enhancer,
                      type: section.type,
                      unitLabel: section.unit_label || "Vector",
                  },
              ]

        return {
            id: sectionKey,
            label: section.label,
            sublabel: section.sublabel || null,
            fields,
        }
    })
