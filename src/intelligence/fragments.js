/**
 * src/intelligence/fragments.js
 * 📋 ENTITY TAXONOMY — One True Source of Truth for Entity Fields.
 *
 * Defines the canonical schema for all entity fields across the simulation.
 * Every field carries a UI label, an AI directive, and an enhancer tag.
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

/** Shared sorting directive for both character and fractal profile imports. */
const PROFILE_SORTING_DIRECTIVE = `Extract and sort the raw text into a flat JSON object with these keys:
name (string), description (string), signature_color (string), eternal_physical (string), eternal_non_physical (string), present_physical (string), present_non_physical (string), past (array of strings), future (array of strings).

- description: HUMAN EYES ONLY. Never used in simulation. Dump raw instructions or OOC info here.
- signature_color: Pick from: Soft Rose, Crimson Red, Deep Indigo, Electric Cyan, Emerald Green, Forest Green, Adrenaline Pink, Lemon Yellow, Toxic Green, Scientific Teal, Space Blue, Pumpkin Amber, Proud Purple, Rusty Orange, Twilight Violet.
- eternal_physical: Permanent visual features/architecture.
- eternal_non_physical: Core essence/philosophy.
- present_physical: Temporary visual features/current state.
- present_non_physical: Current processing state/mood.
- past: Historical anchors, precedents, lore.
- future: Active impulses, plans, prophecies, intent.`;

/**
 * Canonical taxonomy of all entity fields, grouped by temporal section.
 */
export const ENTITY_FRAGMENTS = {
  name: "Name",
  description: "Summary of the entity's vibe and role.", // HUMAN EYES ONLY
  profile: {
    character: {
      enhancer: "NARRATIVE_STRUCTURER",
      directive: PROFILE_SORTING_DIRECTIVE,
    },
    fractal: {
      enhancer: "NARRATIVE_STRUCTURER",
      directive: PROFILE_SORTING_DIRECTIVE,
    },
  },
  eternal: {
    non_physical: {
      character: {
        sublabel: "Personality, Behaviour & Traits",
        directive:
          "Timeless psychology: core beliefs, personality drivers, cognitive patterns, vocal tone, speech cadence, and communication tics. Must hold true in any scene — if it shifts during play, it belongs in Present. No reactive moments or specific events. Dense, high-fidelity paragraph.",
        enhancer: "COGNITIVE_ARCHITECT",
      },
      fractal: {
        sublabel: "Environmental Physics & Core Laws",
        directive:
          "Timeless metaphysical substrate: governing laws, constant forces, structural atmosphere. Physical constants, ambient rules, defining sensory essence, unbreakable world logic. Must hold true in any scene — if it shifts, it belongs in Present. No moments of observation. Dense, high-fidelity paragraph.",
        enhancer: "METAPHYSICAL_ARCHITECT",
      },
    },
    physical: {
      character: {
        sublabel: "Body & Form",
        directive:
          'Permanent physical features for image generation. No clothing, expressions, or poses. MANDATORY: gender, age_range (or age), ethnicity. Keys: { "gender": "", "age_range": "", "ethnicity": "", "build": "", "face": "", "eyes": "", "skin": "", "hair": "", "height": "" }. Visible body details and identifying skin accents/scars only — no traits, skills, gear, or morality. Max 15 lines.',
        enhancer: "BIOMETRIC_RENDERER",
      },
      fractal: {
        sublabel: "Topography, Geometries & Composition",
        directive:
          'Permanent physical geography for image generation. No weather, lighting, or atmospheric events. Keys: { "terrain": "", "architecture": "", "materials": "", "landmarks": "", "scale": "" }. Concrete visible landscape features only — no lore, history, or background summaries. Max 15 lines.',
        enhancer: "SPATIAL_RENDERER",
      },
    },
  },
  present: {
    non_physical: {
      character: {
        sublabel: "Current State of Mind",
        directive:
          "What's shifted from the eternal baseline right now: immediate emotional pressure, active mental focus, present behavioral drivers. DO NOT restate permanent baseline traits from Eternal. True in THIS moment only — if always true, it belongs in Eternal. Dense, punchy summary.",
        enhancer: "TACTICAL_ANALYZER",
      },
      fractal: {
        sublabel: "Active Anomalies & Volatility",
        directive:
          "What's changed from the eternal baseline right now: active anomaly, current pressure, immediate shift in physics or atmosphere. True RIGHT NOW only — stable conditions belong in Eternal. Short, high-fidelity statement.",
        enhancer: "ECOSYSTEM_ANALYZER",
      },
    },
    physical: {
      character: {
        sublabel: "Outfit, Appearance & Conditions",
        directive:
          'Current physical appearance for image generation, layered over eternal baseline. Keys: { "clothing": "", "colors": "", "expression": "", "skin_exposure": "", "posture": "", "condition": "" }. Use {A|B} syntax for variables. Visible temporary items, expressions, and poses only — no hidden properties or thoughts. Narrative-relevant conditions (e.g. bleeding) must also go in non-physical. Max 15 lines.',
        enhancer: "SOMATIC_TRACKER",
      },
      fractal: {
        sublabel: "Active Weather, Lighting & Overlays",
        directive:
          'Current atmospheric state for image generation, layered over eternal baseline. Keys: { "lighting": "", "weather": "", "atmosphere": "", "events": "" }. Use {A|B} syntax for variables. Momentary sensory elements only. Max 15 lines.',
        enhancer: "ATMOSPHERIC_TRACKER",
      },
    },
  },
  future: {
    sublabel: "Vector",
    enhancer: "TRAJECTORY_SIMULATOR",
    type: "array",
    fields: {
      directive:
        "One active trajectory or narrative impulse: a clear intent, building pressure, or impending event. What drives this entity toward its next state change. Must be distinct from Present. Active future tense — live impulses, not past observations.",
      tags: "3-6 concrete, high-relevance trigger keywords (entity names, key items, specific actions, or locations) used for semantic retrieval matching.",
      emotional_weight: "Narrative importance score (1-10) driving relevance.",
    },
  },
  past: {
    sublabel: "Memory",
    enhancer: "EPISODIC_MEMORY_COMPILER",
    type: "array",
    fields: {
      directive:
        "One formative memory or critical precedent: a specific anchored event or established fact. Capture the residue it exerts on current behavior. Specific over vague. Past tense — anchored historical facts, not active states.",
      tags: "3-6 concrete, high-relevance trigger keywords (entity names, key items, specific actions, or locations) used for semantic retrieval matching.",
      emotional_weight: "Narrative importance score (1-10) driving relevance.",
    },
  },
};

/**
 * @typedef {Object} CatalogEntry
 * @property {string} id - Dot-notation key, e.g. "eternal.non_physical"
 * @property {string} section_label - Parent section display name, e.g. "Eternal"
 * @property {string} layer_key - Parent section key in uppercase, e.g. "ETERNAL"
 * @property {string} [label] - UI label
 * @property {string} [directive] - AI instruction
 * @property {string} [enhancer] - Semantic tag
 * @property {string} [description] - Fallback description
 * @property {string} [type] - Field type (e.g., "array")
 */

/**
 * Auto-formats object keys into UI labels (e.g. "non_physical" -> "Non-Physical", "future" -> "Future").
 * @param {string} key
 * @returns {string}
 */
export function format_key_as_label(key) {
  if (key === "non_physical") return "Non-Physical";
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Builds a flat `{ [dotKey]: metadata }` map from the nested ENTITY_FRAGMENTS tree.
 * Each entry is enriched with ID and section metadata.
 * @returns {Record<string, CatalogEntry>} Flat catalog keyed by dot-notation field ID.
 */
function build_entity_catalog() {
  /** @type {Record<string, any>} */
  const catalog = {};
  Object.entries(ENTITY_FRAGMENTS).forEach(([section_key, sectionObj]) => {
    if (typeof sectionObj === "string" || sectionObj === null || section_key === "profile") return;
    const section = /** @type {any} */ (sectionObj);

    if (section.fields && section.type !== "array") {
      Object.entries(section.fields).forEach(([field_key, field]) => {
        const id = `${section_key}.${field_key}`;
        const metadata = typeof field === "string" ? { description: field } : field;

        ["character", "fractal"].forEach((type) => {
          const typeKey = `${type}.${id}`;
          catalog[typeKey] = {
            ...metadata,
            id: typeKey,
            section_label: format_key_as_label(section_key),
            layer_key: section_key.toUpperCase(),
          };
        });

        catalog[id] = {
          ...metadata,
          id,
          section_label: format_key_as_label(section_key),
          layer_key: section_key.toUpperCase(),
        };
      });
    } else {
      const fieldKeys = Object.keys(section).filter((k) => !["label", "sublabel", "type", "directive", "enhancer"].includes(k));
      fieldKeys.forEach((field_key) => {
        const id = `${section_key}.${field_key}`;
        const field = section[field_key];

        ["character", "fractal"].forEach((type) => {
          const leaf = field[type] || field;
          const typeKey = `${type}.${id}`;
          catalog[typeKey] = {
            ...leaf,
            id: typeKey,
            section_label: format_key_as_label(section_key),
            layer_key: section_key.toUpperCase(),
          };
        });

        const leafDefault = field.character || field;
        catalog[id] = {
          ...leafDefault,
          id,
          section_label: format_key_as_label(section_key),
          layer_key: section_key.toUpperCase(),
        };
      });
    }

    const hasFields = section.fields || Object.keys(section).some((k) => !["label", "sublabel", "type", "directive", "enhancer"].includes(k));
    if (!hasFields || section.type === "array") {
      ["character", "fractal"].forEach((type) => {
        const typeKey = `${type}.${section_key}`;
        catalog[typeKey] = {
          ...section,
          id: typeKey,
          section_label: format_key_as_label(section_key),
          layer_key: section_key.toUpperCase(),
        };
      });

      catalog[section_key] = {
        ...section,
        id: section_key,
        section_label: format_key_as_label(section_key),
        layer_key: section_key.toUpperCase(),
      };
    }
  });
  return catalog;
}

/**
 * Flat registry of all entity fields, keyed by dot-notation ID.
 * Used by `intelligence_broker.js` to iterate fields and resolve entity data.
 */
export const ENTITY_CATALOG = build_entity_catalog();

/**
 * Builds the profile sections layout dynamically based on entity type.
 * Handles leaf-level polymorphism cleanly.
 * @param {string} [entity_type]
 * @returns {Array<{ id: string, label: string, fields: Array<{ key: string, label: string, sublabel: string | null, description: string, enhancer: string, type?: string, is_physical?: boolean }> }>}
 */
export function build_profile_sections(entity_type = "character") {
  const resolvedType = entity_type === "user" ? "character" : entity_type || "character";

  return Object.entries(ENTITY_FRAGMENTS)
    .filter(([sectionKey, section]) => typeof section !== "string" && section !== null && sectionKey !== "profile")
    .map(([sectionKey, sectionObj]) => {
      const section = /** @type {any} */ (sectionObj);
      const fieldKeys = Object.keys(section).filter((k) => !["label", "sublabel", "type", "directive", "enhancer", "fields"].includes(k));

      const fields =
        fieldKeys.length > 0 && section.type !== "array"
          ? fieldKeys.map((fieldKey) => {
              const field = section[fieldKey];
              const leaf = field[resolvedType] || field;
              return {
                key: `${sectionKey}.${fieldKey}`,
                label: format_key_as_label(fieldKey),
                sublabel: leaf.sublabel || null,
                description: leaf.directive || leaf.description || "",
                enhancer: leaf.enhancer,
                type: field.type,
                is_physical: fieldKey === "physical",
              };
            })
          : [
              {
                key: sectionKey,
                label: format_key_as_label(sectionKey),
                sublabel: section.sublabel || null,
                description: section.directive || "",
                enhancer: section.enhancer,
                type: section.type,
              },
            ];
      return {
        id: sectionKey,
        label: format_key_as_label(sectionKey),
        fields,
      };
    });
}

/**
 * Twin-Cylinder dynamic profile sections map.
 */
export const PROFILE_SECTIONS_BY_TYPE = {
  character: build_profile_sections("character"),
  fractal: build_profile_sections("fractal"),
};
