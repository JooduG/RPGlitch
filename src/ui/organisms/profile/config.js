/**
 * @file src/ui/organisms/profile/config.js
 * @description Configuration for the Profile UI.
 * This file dynamically translates the central ENTITY_FRAGMENTS schema
 * into renderable UI Sections for the ProfileFragments layout.
 */
import { ENTITY_FRAGMENTS } from "@/core/intelligence/entity-fragments.js";
export { ENTITY_FRAGMENTS };
/**
 * Maps the ENTITY_FRAGMENTS into UI section objects.
 * Automatically respects the Twin-Cylinder (eternal/present) schema
 * and Vector Array configurations.
 */
export const PROFILE_SECTIONS = Object.entries(ENTITY_FRAGMENTS)
  // Filter out top-level strings (like 'name' and 'description')
  .filter(([_, section]) => typeof section !== "string" && section !== null)
  .map(([sectionKey, sectionObj]) => {
    /** @type {any} */
    const section = sectionObj;
    const fields =
      section.fields && section.type !== "array"
        ? Object.entries(section.fields).map(([fieldKey, field]) => {
            return {
              key: `${sectionKey}.${fieldKey}`, // e.g. "eternal.physical"
              label: field.label,
              description: field.directive || field.description || "",
              enhancer: field.enhancer,
              type: field.type,
              unitLabel: field.unit_label || section.unit_label || "Vector",
            };
          })
        : [
            {
              key: sectionKey, // e.g. "past" or "future"
              label: section.label,
              description: section.directive || section.description || "",
              enhancer: section.enhancer,
              type: section.type,
              unitLabel: section.unit_label || "Vector",
            },
          ];
    return {
      id: sectionKey,
      label: section.label,
      sublabel: section.sublabel || null,
      fields,
    };
  });
