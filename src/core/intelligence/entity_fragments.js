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
 * │                      Consumed by: ContextBroker.js for iteration.       │
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
 *   Past / Future     → each has a single unified field (`vectors`)
 *
 * Note: `physical` fields are excluded from simulation mode prompts by the broker.
 */
export const ENTITY_FRAGMENTS = {
  name: "Name",
  description:
    "Description & Notes - This field is only for you and will NEVER be included in any simulation.", // UI only
  eternal: {
    label: "Eternal",
    sublabel: "Permanent Traits & Features", // UI only
    fields: {
      non_physical: {
        label: "Non-Physical",
        directive:
          "I will define my permanent cognitive baseline here. I will detail my psychological maturity, core archetype, gender identity, speaking style, and verbal tics.",
        enhancer: "CORE_COGNITIVE_ARCHITECT",
      },
      physical: {
        label: "Physical",
        directive:
          "I will define my purely visual, permanent fragments here. I will detail my visual age, biological phenotype, build, and permanent marks like cybernetics or scars. I will strictly exclude clothing or abstract fragments.",
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
          "I will define my immediate psychological state here. I will detail my current focus, emotional volatility, and active memory pressure.",
        enhancer: "TACTICAL_BEHAVIOR_ANALYZER",
      },
      physical: {
        label: "Physical",
        directive:
          "I will define my current physical state, damage, and immediate exhaustion here. I will detail visible wounds, active HUD overlays, and current posture.",
        enhancer: "SOMATIC_STATE_TRACKER",
      },
    },
  },
  future: {
    label: "Future",
    sublabel: "Plans & Prophecies", // UI only
    unit_label: "Vector",
    directive:
      "I will define my self-interest protocol here. I will detail my overarching macro-goals, lateral agendas, and ultimate narrative destiny. Use [CONSEQUENCE: ...] for stakes.",
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
      "I will detail my historical anchors here. I will include my origin story, formative events, and established relationships. If I have repressed trauma or forgotten memories I will note them clearly.",
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
 * // → { label, directive, enhancer, id, section_label: "Eternal", layer_key: "ETERNAL" }
 */
export const ENTITY_CATALOG = build_entity_catalog();
