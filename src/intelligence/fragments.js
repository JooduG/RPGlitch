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
/**
 * @typedef {Object} EntityField
 * @property {string} [label]
 * @property {string} [directive]
 * @property {string} [enhancer]
 * @property {string} [description]
 * @property {string} [type]
 * @property {string} [unit_label]
 */
/**
 * @typedef {Object} EntitySection
 * @property {string} [label]
 * @property {string} [sublabel]
 * @property {string} [unit_label]
 * @property {string} [directive]
 * @property {string} [enhancer]
 * @property {string} [type]
 * @property {Record<string, EntityField | string>} [fields]
 */
/**
 * @typedef {Object} EntityFragmentRoot
 * @property {string} name
 * @property {string} description
 * @property {EntitySection} eternal
 * @property {EntitySection} present
 * @property {EntitySection} future
 * @property {EntitySection} past
 */
/**
 * Shared entity name stop words and title prefixes for visual initials calculations
 * and prefix-aware name formatting breaks.
 */
export const NAME_PREFIXES = [
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "sir",
  "lady",
  "lord",
  "the",
  "a",
  "an",
  "of",
  "in",
  "and",
  "or",
  "for",
  "to",
  "at",
  "by",
  "with",
  "mr.",
  "mrs.",
  "ms.",
  "dr.",
  "prof.",
];

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
  description: "Summary of the entity's vibe and role.", // HUMAN EYES ONLY!!
  eternal: {
    label: "Eternal",
    non_physical: {
      label: "Non-Physical",
      character: {
        sublabel: "Personality, Behaviour & Traits",
        directive:
          "Define baseline psychology and core identity. Detail fundamental logic, narrative voice, and communication tics. Avoid narration. (Target: 150-400 words).",
        enhancer: "COGNITIVE_ARCHITECT",
        emotional_weight: 10,
        density_multiplier: 1,
      },
      fractal: {
        sublabel: "Environmental Physics & Core Laws",
        directive:
          "Define baseline metaphysical rules, structural constants, and ambient physics. Detail gravity and temporal flow rates. (Target: 150-400 words).",
        enhancer: "METAPHYSICAL_ARCHITECT",
        emotional_weight: 10,
        density_multiplier: 1,
      },
    },
    physical: {
      label: "Physical",
      character: {
        sublabel: "Body & Form",
        directive:
          "Write comma-separated visual descriptors optimized for photorealistic image generation. MANDATORY: explicitly specify gender presentation, age range, and race/ethnicity. Describe: body type (e.g. 'muscular athletic build, broad shoulders, defined chest'), facial features (jaw shape, brow, nose, lips), eye color and shape, skin tone and texture, hair color/length/cut, height impression, any distinctive permanent markings. Use concrete adjectives only. DO NOT write sentences or prose — output comma-separated tokens only. 40-80 words.",
        enhancer: "BIOMETRIC_RENDERER",
      },
      fractal: {
        sublabel: "Topography, Geometries & Composition",
        directive:
          "Focus exclusively on unalterable environmental architecture: permanent topography, geological or urban layouts, structural constants, and raw material textures. Convey spatial styling through permanent physical fixtures. Target length: 50-150 words.",
        enhancer: "SPATIAL_RENDERER",
      },
    },
  },
  present: {
    label: "Present",
    non_physical: {
      label: "Non-Physical",
      character: {
        sublabel: "Current State of Mind",
        directive:
          "Capture current internal volatility and state pressure. Detail mental focus, active triggers, and immediate emotional state. (Target: 30-80 words).",
        enhancer: "TACTICAL_ANALYZER",
        emotional_weight: 5,
        density_multiplier: 1.5,
      },
      fractal: {
        sublabel: "Active Anomalies & Volatility",
        directive:
          "Capture immediate atmospheric shifts, state volatility, or anomalous events. Detail immediate environmental and temporal pressure. (Target: 30-80 words).",
        enhancer: "ECOSYSTEM_ANALYZER",
        emotional_weight: 5,
        density_multiplier: 1.5,
      },
    },
    physical: {
      label: "Physical",
      character: {
        sublabel: "Outfit, Appearance & Conditions",
        directive:
          "Write comma-separated visual tokens describing current appearance for image generation. Specify: each clothing item by name and material (e.g. 'unbuttoned dark denim shirt, white cotton undershirt'), colors, fit (tight/loose/open), visible skin exposure, and current physical posture. Use specific material names. DO NOT write sentences. Output comma-separated tokens only. 30-60 words.",
        enhancer: "SOMATIC_TRACKER",
      },
      fractal: {
        sublabel: "Active Weather, Lighting & Overlays",
        directive:
          "Focus exclusively on transient environmental layers: immediate lighting conditions, active weather, precipitation, shifting sensory elements, and ephemeral atmospheric moods. Target length: 30-80 words.",
        enhancer: "ATMOSPHERIC_TRACKER",
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
    sublabel: "Memories & Backstory", // UI only
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
 * @typedef {Object} CatalogEntry
 * @property {string} id - Dot-notation key, e.g. "eternal.non_physical"
 * @property {string} section_label - Parent section display name, e.g. "Eternal"
 * @property {string} layer_key - Parent section key in uppercase, e.g. "ETERNAL"
 * @property {string} [label] - UI label.
 * @property {string} [directive] - AI instruction.
 * @property {string} [enhancer] - Semantic tag.
 * @property {string} [description] - Fallback description.
 * @property {string} [unit_label] - Label for individual items (for arrays).
 * @property {string} [type] - Field type (e.g., "array").
 */

/**
 * Builds a flat `{ [dotKey]: metadata }` map from the nested ENTITY_FRAGMENTS tree.
 * Each entry is enriched with ID and section metadata.
 *
 * @returns {Record<string, CatalogEntry>} Flat catalog keyed by dot-notation field ID.
 */
function build_entity_catalog() {
  /** @type {Record<string, any>} */
  const catalog = {};
  Object.entries(ENTITY_FRAGMENTS).forEach(([section_key, sectionObj]) => {
    if (typeof sectionObj === "string" || sectionObj === null) return;
    const section = /** @type {any} */ (sectionObj);

    // 1. Process array-type nested fields (if section has explicit fields property)
    if (section.fields && section.type !== "array") {
      Object.entries(section.fields).forEach(([field_key, field]) => {
        const id = `${section_key}.${field_key}`;
        const metadata = typeof field === "string" ? { description: field } : field;

        ["character", "fractal"].forEach((type) => {
          const typeKey = `${type}.${id}`;
          catalog[typeKey] = {
            ...metadata,
            id: typeKey,
            section_label: section.label,
            layer_key: section_key.toUpperCase(),
          };
        });

        catalog[id] = {
          ...metadata,
          id,
          section_label: section.label,
          layer_key: section_key.toUpperCase(),
        };
      });
    } else {
      // 2. Process flattened fields directly on the section
      const fieldKeys = Object.keys(section).filter((k) => !["label", "sublabel", "type", "unit_label", "directive", "enhancer"].includes(k));
      fieldKeys.forEach((field_key) => {
        const id = `${section_key}.${field_key}`;
        const field = section[field_key];

        ["character", "fractal"].forEach((type) => {
          const leaf = field[type] || field;
          const typeKey = `${type}.${id}`;
          catalog[typeKey] = {
            ...leaf,
            id: typeKey,
            section_label: section.label,
            layer_key: section_key.toUpperCase(),
          };
        });

        // Default fallback (character)
        const leafDefault = field.character || field;
        catalog[id] = {
          ...leafDefault,
          id,
          section_label: section.label,
          layer_key: section_key.toUpperCase(),
        };
      });
    }

    // 3. Add the section itself if it's an array type or has no explicit sub-fields
    const hasFields =
      section.fields || Object.keys(section).some((k) => !["label", "sublabel", "type", "unit_label", "directive", "enhancer"].includes(k));
    if (!hasFields || section.type === "array") {
      ["character", "fractal"].forEach((type) => {
        const typeKey = `${type}.${section_key}`;
        catalog[typeKey] = {
          ...section,
          id: typeKey,
          section_label: section.label,
          unit_label: section.unit_label,
          layer_key: section_key.toUpperCase(),
        };
      });

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
 * Builds the profile sections layout dynamically based on entity type.
 * Handles leaf-level polymorphism cleanly.
 * @param {string} [entity_type]
 */
export function build_profile_sections(entity_type = "character") {
  const resolvedType = entity_type === "user" ? "character" : entity_type || "character";

  return (
    Object.entries(ENTITY_FRAGMENTS)
      // Filter out top-level strings (like 'name' and 'description')
      .filter(([_, section]) => typeof section !== "string" && section !== null)
      .map(([sectionKey, sectionObj]) => {
        const section = /** @type {any} */ (sectionObj);
        const fieldKeys = Object.keys(section).filter(
          (k) => !["label", "sublabel", "type", "unit_label", "directive", "enhancer", "fields"].includes(k),
        );

        const fields =
          fieldKeys.length > 0 && section.type !== "array"
            ? fieldKeys.map((fieldKey) => {
                const field = section[fieldKey];
                // Resolve leaf-level character/fractal properties
                const leaf = field[resolvedType] || field;
                return {
                  key: `${sectionKey}.${fieldKey}`, // e.g. "eternal.physical"
                  label: field.label || fieldKey,
                  sublabel: leaf.sublabel || null,
                  description: leaf.directive || leaf.description || "",
                  enhancer: leaf.enhancer,
                  type: field.type,
                  unitLabel: field.unit_label || section.unit_label || "Vector",
                };
              })
            : [
                {
                  key: sectionKey, // e.g. "past" or "future"
                  label: section.label,
                  sublabel: section.sublabel || null,
                  description: section.directive || "",
                  enhancer: section.enhancer,
                  type: section.type,
                  unitLabel: section.unit_label || "Vector",
                },
              ];
        return {
          id: sectionKey,
          label: section.label,
          fields,
        };
      })
  );
}

/**
 * Twin-Cylinder dynamic profile sections map.
 */
export const PROFILE_SECTIONS_BY_TYPE = {
  character: build_profile_sections("character"),
  fractal: build_profile_sections("fractal"),
};
