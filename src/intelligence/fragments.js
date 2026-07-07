/**
 * src/intelligence/fragments.js
 * 📋 Entity Taxonomy — One True Source of Truth for Entity Fields.
 *
 * Defines the canonical schema for all entity fields across the simulation.
 * Every field carries a UI label, an AI directive, and an enhancer tag.
 *
 * EXPORTS
 * ENTITY_FRAGMENTS   Nested, section-grouped source of truth.
 * Consumed by: UI components, profile builder.
 *
 * ENTITY_CATALOG     Flat dot-keyed map derived from ENTITY_FRAGMENTS.
 * Consumed by: ContextBroker for field iteration.
 *
 * FIELD SCHEMA
 * label      {string}  Display name (UI + prompt).
 * directive  {string}  AI writing instruction for enhancement prompts.
 * enhancer   {string}  Semantic tag for LexicalFilter prioritization.
 *
 * SECTION SCHEMA (UI-only, not consumed by engine)
 * sublabel   {string}  Subtitle shown beneath the section header.
 */
/**
 * @typedef {Object} EntityField
 * @property {string} [label]
 * @property {string} [directive]
 * @property {string} [enhancer]
 * @property {string} [description]
 * @property {string} [type]
 * @property {string} [sublabel] - Subtitle shown beneath the section header.
 */
/**
 * @typedef {Object} EntitySection
 * @property {string} [label]
 * @property {string} [sublabel]
 * @property {string} [directive]
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
 * Eternal / Present -> each has `physical` + `non_physical` fields
 * Past / Future     -> each has a single unified field (`vectors`)
 *
 * Note: `physical` fields are excluded from simulation mode prompts by the broker.
 */
export const ENTITY_FRAGMENTS = {
  name: "Name",
  description: "Summary of the entity's vibe and role.", // HUMAN EYES ONLY!!
  profile: {
    character: {
      enhancer: "NARRATIVE_STRUCTURER",
      directive:
        "You are an expert narrative structurer. Extract and sort the raw text below into a flat entity JSON schema.\n\nReturn a single flat JSON object matching the exact keys required for the schema: name (string), description (string), signature_color (string), eternal_physical (string), eternal_non_physical (string), present_physical (string), present_non_physical (string), past (array of strings), future (array of strings).\n\nSCHEMA DEFINITIONS:\n- description: This field is strictly for HUMAN EYES ONLY (metadata, creator notes, etc). It is NEVER used in the simulation. Feel free to dump unformatted raw instructions or OOC info here.\n- signature_color: Choose the most fitting color from: Coral Rose, Crimson Red, Deep Indigo, Electric Cyan, Emerald Green, Forest Green, Hot Pink, Lemon Yellow, Lime Green, Neon Teal, Ocean Blue, Pumpkin Amber, Royal Purple, Sunset Orange, Twilight Violet.\n- eternal_physical: Baseline traits. Permanent visual features/architecture.\n- eternal_non_physical: Baseline traits. Core essence/philosophy.\n- present_physical: Immediate conditions. Temporary visual features/current state.\n- present_non_physical: Immediate conditions. Current processing state/mood.\n- past: Historical anchors, critical precedents, and lore. (Array of strings).\n- future: Active impulses, plans, prophecies, and impending intent. (Array of strings).",
    },
    fractal: {
      enhancer: "NARRATIVE_STRUCTURER",
      directive:
        "You are an expert narrative structurer. Extract and sort the raw text below into a flat entity JSON schema.\n\nReturn a single flat JSON object matching the exact keys required for the schema: name (string), description (string), signature_color (string), eternal_physical (string), eternal_non_physical (string), present_physical (string), present_non_physical (string), past (array of strings), future (array of strings).\n\nSCHEMA DEFINITIONS:\n- description: This field is strictly for HUMAN EYES ONLY (metadata, creator notes, etc). It is NEVER used in the simulation. Feel free to dump unformatted raw instructions or OOC info here.\n- signature_color: Choose the most fitting color from: Coral Rose, Crimson Red, Deep Indigo, Electric Cyan, Emerald Green, Forest Green, Hot Pink, Lemon Yellow, Lime Green, Neon Teal, Ocean Blue, Pumpkin Amber, Royal Purple, Sunset Orange, Twilight Violet.\n- eternal_physical: Baseline traits. Permanent visual features/architecture.\n- eternal_non_physical: Baseline traits. Core essence/philosophy.\n- present_physical: Immediate conditions. Temporary visual features/current state.\n- present_non_physical: Immediate conditions. Current processing state/mood.\n- past: Historical anchors, critical precedents, and lore. (Array of strings).\n- future: Active impulses, plans, prophecies, and impending intent. (Array of strings).",
    },
  },
  eternal: {
    non_physical: {
      character: {
        sublabel: "Personality, Behaviour & Traits",
        directive:
          "Define this character's timeless psychology using present-tense state declarations: core beliefs, personality drivers, cognitive patterns, and communication tics. TEMPORAL LAW: Every statement must hold true in any scene at any time — if a condition shifts during play, it belongs in Present. Never describe reactive moments or specific events. Provide a dense, high-fidelity paragraph.",
        enhancer: "COGNITIVE_ARCHITECT",
      },
      fractal: {
        sublabel: "Environmental Physics & Core Laws",
        directive:
          "Define this environment as a timeless metaphysical substrate. Use present-tense state declarations: what laws govern this world, what forces are always in play, what atmosphere is structurally constant. Cover: physical constants, ambient metaphysical rules, defining sensory essence, and unbreakable world logic. TEMPORAL LAW: Every statement must hold true in any scene at any time — if a condition shifts during play, it belongs in Present. Never describe a moment of observation. Provide a dense, high-fidelity paragraph outlining these baseline constants.",
        enhancer: "METAPHYSICAL_ARCHITECT",
      },
    },
    physical: {
      character: {
        sublabel: "Body & Form",
        directive:
          'Output a list describing this character\'s permanent physical features for photorealistic image generation. PERMANENT FEATURES ONLY — no clothing, expressions, or poses. MANDATORY: specify gender, age_range, and ethnicity. Baseline keys to include: { "gender": "", "age_range": "", "ethnicity": "", "build": "", "face": "", "eyes": "", "skin": "", "hair": "", "height": "" }. CRITICAL BOUNDARY: Focus exclusively on immediate, visible physical body details. You are strictly forbidden from inventing attributes, qualities, character traits, or non-visual RPG sheet parameters (e.g., intelligence, skills, gear, mood, morality). Hard cap at 15 lines maximum.',
        enhancer: "BIOMETRIC_RENDERER",
      },
      fractal: {
        sublabel: "Topography, Geometries & Composition",
        directive:
          'Output a list describing this environment\'s permanent physical geography for photorealistic image generation. PERMANENT GEOGRAPHY ONLY — no weather, lighting, or atmospheric events. Baseline keys to include: { "terrain": "", "architecture": "", "materials": "", "landmarks": "", "scale": "" }. CRITICAL BOUNDARY: Focus exclusively on concrete, visible physical features of the landscape. Do not invent lore notes, invisible parameters, historical logs, or background summaries. Hard cap at 15 lines maximum.',
        enhancer: "SPATIAL_RENDERER",
      },
    },
  },
  present: {
    non_physical: {
      character: {
        sublabel: "Current State of Mind",
        directive:
          "Capture what has shifted from this character's eternal baseline in this specific moment. State the immediate emotional pressure, active mental focus, and what is driving behavior right now. TEMPORAL LAW: Only write what is true in THIS moment — if it is always true, it belongs in Eternal. Anchor in specific behavioral signals where possible. Provide a dense, punchy summary snippet.",
        enhancer: "TACTICAL_ANALYZER",
      },
      fractal: {
        sublabel: "Active Anomalies & Volatility",
        directive:
          "Capture what has changed from this environment's eternal baseline in this specific moment. State the active anomaly, current pressure, or immediate shift in the world's physics or atmosphere. TEMPORAL LAW: Only write what is true RIGHT NOW — stable conditions belong in Eternal. Provide a short, high-fidelity statement of immediate fluctuations.",
        enhancer: "ECOSYSTEM_ANALYZER",
      },
    },
    physical: {
      character: {
        sublabel: "Outfit, Appearance & Conditions",
        directive:
          'Output a list describing this character\'s current physical appearance for image generation. CURRENT STATE ONLY — layered over the eternal physical baseline. Baseline keys to include: { "clothing": "", "colors": "", "skin_exposure": "", "posture": "", "condition": "" }. Use Perchance dynamic syntax {A|B} for variable features. CRITICAL BOUNDARY: Focus exclusively on immediate, visible temporary items, layers, and expressions. Do not include hidden status properties or psychological thoughts. Hard cap at 15 lines maximum.',
        enhancer: "SOMATIC_TRACKER",
      },
      fractal: {
        sublabel: "Active Weather, Lighting & Overlays",
        directive:
          'Output a list describing this environment\'s current atmospheric state for image generation. TRANSIENT CONDITIONS ONLY — layered over the eternal physical baseline. Baseline keys to include: { "lighting": "", "weather": "", "atmosphere": "", "events": "" }. Use Perchance dynamic syntax {A|B} for variable features. CRITICAL BOUNDARY: Focus exclusively on momentary sensory environmental elements visible right now. Hard cap at 15 lines maximum.',
        enhancer: "ATMOSPHERIC_TRACKER",
      },
    },
  },
  future: {
    sublabel: "Vector", // Serves as subtitle and array item label
    enhancer: "TRAJECTORY_SIMULATOR",
    type: "array",
    fields: {
      directive:
        "State one active trajectory or narrative impulse. Express as a clear, specific intent, building pressure, or impending event. Define what drives this entity toward its next significant state change. One vector per entry — must be distinct from the Present state. Write in active future tense. These are live impulses, not past observations.",
      tags: "Semantic keywords for clustering and retrieval.",
      emotional_weight: "Narrative importance score (1-10) driving relevance.",
    },
  },
  past: {
    sublabel: "Memory", // Serves as subtitle and array item label
    enhancer: "EPISODIC_MEMORY_COMPILER",
    type: "array",
    fields: {
      directive:
        "State one formative memory or critical precedent. Express as a specific, anchored event or established fact from history. Capture what this memory left behind — the residue it exerts on current behavior. One memory per entry — specific over vague. Write in past tense. These are anchored historical facts, not active states.",
      tags: "Semantic keywords for clustering and retrieval.",
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
 * @property {string} [type] - Field type (e.g., "array").
 */

/**
 * Builds a flat `{ [dotKey]: metadata }` map from the nested ENTITY_FRAGMENTS tree.
 * Each entry is enriched with ID and section metadata.
 *
 * @returns {Record<string, CatalogEntry>} Flat catalog keyed by dot-notation field ID.
 */
/**
 * Auto-formats object keys into UI labels (e.g. "non_physical" -> "Non-Physical", "future" -> "Future")
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

function build_entity_catalog() {
  /** @type {Record<string, any>} */
  const catalog = {};
  Object.entries(ENTITY_FRAGMENTS).forEach(([section_key, sectionObj]) => {
    if (typeof sectionObj === "string" || sectionObj === null || section_key === "profile") return;
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
      // 2. Process flattened fields directly on the section
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

        // Default fallback (character)
        const leafDefault = field.character || field;
        catalog[id] = {
          ...leafDefault,
          id,
          section_label: format_key_as_label(section_key),
          layer_key: section_key.toUpperCase(),
        };
      });
    }

    // 3. Add the section itself if it's an array type or has no explicit sub-fields
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
      // Filter out top-level strings (like 'name' and 'description') and the internal 'profile' prompt directive
      .filter(([sectionKey, section]) => typeof section !== "string" && section !== null && sectionKey !== "profile")
      .map(([sectionKey, sectionObj]) => {
        const section = /** @type {any} */ (sectionObj);
        const fieldKeys = Object.keys(section).filter((k) => !["label", "sublabel", "type", "directive", "enhancer", "fields"].includes(k));

        const fields =
          fieldKeys.length > 0 && section.type !== "array"
            ? fieldKeys.map((fieldKey) => {
                const field = section[fieldKey];
                // Resolve leaf-level character/fractal properties
                const leaf = field[resolvedType] || field;
                return {
                  key: `${sectionKey}.${fieldKey}`, // e.g. "eternal.physical"
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
                  key: sectionKey, // e.g. "past" or "future"
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
