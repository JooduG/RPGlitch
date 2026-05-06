/**
 * @file src/core/intelligence/entity-fragments.js
 *
 * ⚔️
 * 📋 ENTITY FRAGMENTS    The One True Source of Truth for Entity Taxonomy
 * ⚔️
 *
 * PURPOSE
 * Defines the canonical schema for all entity fields across the simulation.
 * Every field has a UI label, an AI directive, and an enhancer tag.
 *
 * TWO EXPORTS
 * Œ
 *  ENTITY_FRAGMENTS   Nested, section-grouped source of truth.           ‚
 *                      Consumed by: UI components, broker (via CATALOG).  ‚
 *                                                                         ‚
 *  ENTITY_CATALOG     Flat dot-keyed map derived from ENTITY_FRAGMENTS.  ‚
 *                      Consumed by: ContextBroker.js for iteration.       ‚
 *
 *
 * FIELD SCHEMA
 *   label     {string}   Display name for the field (UI + prompt).
 *   directive {string}   Third-person AI writing instruction for the field.
 *   enhancer  {string}   Semantic tag used for LexicalFilter prioritization.
 *
 * SECTION SCHEMA (UI-only additions, not used by engine)
 *   sublabel  {string}   UI subtitle shown beneath the section header.
 *   columns   {number}   UI grid column count for the section's fields.
 */
/************************************************************************************
 * [SECTION: ENTITY FRAGMENTS]
 * ----------------------------------------------------------------------------------
 * Source definition. Nested by temporal section -> field key.
 * Temporal sections: Eternal, Present, Past, Future.
 ************************************************************************************/
/**
 * Canonical taxonomy of all entity fields, grouped by temporal section.
 *
 * ESSENCE TAXONOMY
 *   Eternal / Present -> each has `physical` + `non_physical` fields
 *   Past / Future     -> each has a single unified field (`vectors`)
 *
 * Note: `physical` fields are excluded from simulation mode prompts by the broker.
 */
export const ENTITY_FRAGMENTS = {
  name: "Name",
  description: "Identity Summary  Summary of the entity's vibe and role.",
  eternal: {
    label: "Eternal",
    sublabel: "Permanent Traits & Features", // UI only
    fields: {
      non_physical: {
        label: "Non-Physical",
        directive:
          "Define the entity's baseline psychological architecture or core essence in the **3rd-person affirmative**. Detail fundamental logic, identity markers, and its signature **Narrative Voice** or **Communication Patterns**. Include specific vocabulary, tone, and any desirable linguistic patterns or structural tics. This serves as the foundation for all reactive behavior; avoid narration.",
        enhancer: "CORE_COGNITIVE_ARCHITECT",
      },
      physical: {
        label: "Physical",
        directive:
          "Synthesize the entity's permanent visual fragments for image generation using the **3rd-person affirmative**. Focus on structural composition, material properties, and signature attire/geometry. Detail textures, permanent marks, and lighting-reactive surfaces. For indcreased realism include imperfections.",
        enhancer: "BIOMETRIC_RENDER_ENGINE",
      },
    },
  },
  present: {
    label: "Present",
    sublabel: "Current State & Conditions", // UI only
    fields: {
      non_physical: {
        label: "Non-Physical",
        directive:
          "Capture the entity's current internal volatility or state pressure. Detail mental processing focus, active cognitive triggers, and immediate emotional pressure. This drives reactive behavior in the current moment.",
        enhancer: "TACTICAL_BEHAVIOR_ANALYZER",
      },
      physical: {
        label: "Physical",
        directive:
          "Synthesize the entity's situational physical state for image generation. Focus on active coverage (attire/gear/plates), visible damage, posture, and environmental overlays (e.g., status effects, grime). Detail the immediate presence.",
        enhancer: "SOMATIC_STATE_TRACKER",
      },
    },
  },
  future: {
    label: "Future",
    sublabel: "Plans & Prophecies", // UI only
    unit_label: "Vector",
    directive:
      "Map the entity's active trajectory and narrative impulses. Detail operational objectives, evolving vectors, and impending destiny. Define the stakes driving the next state transition.",
    enhancer: "TRAJECTORY_SIMULATOR",
    type: "array",
    fields: {
      text: "Clear statement of the vector.",
      dynamics_tags: "Automatically extracted thematic triggers (e.g. IMPACT).",
      vector_tags: "Semantic keywords for clustering and retrieval.",
      emotional_weight: "Narrative importance score (1-10) driving relevance.",
    },
  },
  past: {
    label: "Past",
    sublabel: "Memories & History", // UI only
    unit_label: "Memory",
    directive:
      "Anchor the entity in their historical context. Detail formative records, critical precedents, and established resonances. These 'Echoes' provide weight and depth to their current state.",
    enhancer: "EPISODIC_MEMORY_COMPILER",
    type: "array",
    fields: {
      text: "Clear statement of the memory.",
      dynamics_tags: "Automatically extracted thematic triggers (e.g. IMPACT).",
      vector_tags: "Semantic keywords for clustering and retrieval.",
      emotional_weight: "Narrative importance score (1-10) driving relevance.",
    },
  },
};
/************************************************************************************
 * [SECTION: ENGINE CATALOG]
 * ----------------------------------------------------------------------------------
 * Flattened dot-key map derived from ENTITY_FRAGMENTS for efficient broker lookups.
 * Keys use dot notation: "eternal.non_physical", "past.essence", etc.
 ************************************************************************************/
/**
 * Builds a flat `{ [dotKey]: metadata }` map from the nested ENTITY_FRAGMENTS tree.
 * Each entry is enriched with:
 *   - `id`           {string}  Dot-notation key, e.g. "eternal.non_physical"
 *   - `section_label`{string}  Parent section display name, e.g. "Eternal"
 *   - `layer_key`    {string}  Parent section key in uppercase, e.g. "ETERNAL"
 *
 * @returns {Object.<string, Object>} Flat catalog keyed by dot-notation field ID.
 */
function build_entity_catalog() {
  const catalog = {};
  Object.entries(ENTITY_FRAGMENTS).forEach(([section_key, section]) => {
    if (typeof section === "string" || section === null) return;
    // 1. Add sub-fields if they exist
    if (section.fields) {
      Object.entries(section.fields).forEach(([field_key, field]) => {
        const id = `${section_key}.${field_key}`;
        const metadata = typeof field === "string" ? { description: field } : field;
        catalog[id] = {
          ...metadata,
          id,
          section_label: section.label,
          layer_key: section_key.toUpperCase(),
        };
      });
    }
    // 2. Add the section itself if it's not purely a container for fields
    // or if it has special metadata (like array types).
    if (!section.fields || section.type === "array") {
      catalog[section_key] = {
        ...section,
        id: section_key,
        section_label: section.label,
        unit_label: section.unit_label,
        layer_key: section_key.toUpperCase(),
      };
    }
  });
  return catalog;
}
/**
 * Flat registry of all entity fields, keyed by dot-notation ID.
 * Used by `intelligence_broker.js` to iterate fields and resolve entity data.
 *
 * @example
 * ENTITY_CATALOG["eternal.non_physical"]
 * // -> { label, directive, enhancer, id, section_label: "Eternal", layer_key: "ETERNAL" }
 */
export const ENTITY_CATALOG = build_entity_catalog();

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
