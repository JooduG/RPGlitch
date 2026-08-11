/**
 * src/data/definitions/fragments.js
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

/** Shared sorting directive — now sourced from @data/definitions/protocols.js (PROTOCOL_LIBRARY.PROFILE.SCHEMA). */
import { PROTOCOL_LIBRARY } from "@data";

/**
 * Canonical taxonomy of all entity fields, grouped by temporal section.
 */
export const ENTITY_FRAGMENTS = {
  name: "Name",
  description: "Summary of the entity's vibe and role (Human eyes only — never used in simulation).",
  profile: {
    character: {
      enhancer: "NARRATIVE_STRUCTURER",
      directive: PROTOCOL_LIBRARY.PROFILE.SCHEMA,
    },
    fractal: {
      enhancer: "NARRATIVE_STRUCTURER",
      directive: PROTOCOL_LIBRARY.PROFILE.SCHEMA,
    },
  },
  eternal: {
    non_physical: {
      character: {
        sublabel: "Personality, Behaviour & Traits",
        description:
          "Timeless psychology: core beliefs, personality drivers, cognitive patterns, vocal tone, speech cadence, and communication tics.",
        directive:
          "Timeless psychology: core beliefs, personality drivers, cognitive patterns, vocal tone, speech cadence, and communication tics. Must hold true in any scene — if it shifts during play, it belongs in Present. No reactive moments or specific events. Dense, high-fidelity paragraph.",
        enhancer: "COGNITIVE_ARCHITECT",
      },
      fractal: {
        sublabel: "Environmental Physics & Core Laws",
        description: "Timeless metaphysical substrate: governing laws, constant environmental forces, and structural world atmosphere.",
        directive:
          "Timeless metaphysical substrate: governing laws, constant forces, structural atmosphere. Physical constants, ambient rules, defining sensory essence, unbreakable world logic. Must hold true in any scene — if it shifts, it belongs in Present. No moments of observation. Dense, high-fidelity paragraph.",
        enhancer: "METAPHYSICAL_ARCHITECT",
      },
    },
    physical: {
      character: {
        sublabel: "Body & Form",
        description: "Permanent physical features for image generation (gender, age, ethnicity, build, face, eyes, hair, height).",
        directive:
          "Permanent physical features for image generation. No clothing, expressions, or poses. Mandatory keys: [GENDER: ...], [AGE: ...], [ETHNICITY: ...]. Optional keys: [BUILD: ...], [FACE: ...], [EYES: ...], [SKIN: ...], [HAIR: ...], [EARS: ...], [DENTAL_FEATURES: ...], [HEIGHT: ...]. Visible body details and identifying skin accents/scars only — no traits, skills, gear, or morality. Max 15 lines.",
        enhancer: "BIOMETRIC_RENDERER",
      },
      fractal: {
        sublabel: "Topography, Geometries & Composition",
        description: "Permanent physical geography for image generation (terrain, architecture, materials, landmarks, scale).",
        directive:
          "Permanent physical geography for image generation. No weather, lighting, or atmospheric events. Keys: [TERRAIN: ...], [ARCHITECTURE: ...], [MATERIALS: ...], [LANDMARKS: ...], [SCALE: ...], [UPPER_CITY: ...], [LOWER_CITY: ...], [CONNECTION: ...], [VISUAL_THEME: ...]. Concrete visible landscape features only — no lore, history, or background summaries. Max 15 lines.",
        enhancer: "SPATIAL_RENDERER",
      },
    },
  },
  present: {
    non_physical: {
      character: {
        sublabel: "Current State of Mind",
        description: "Current state of mind: immediate emotional pressure, active mental focus, and present behavioral drivers.",
        directive:
          "What's shifted from the eternal baseline right now: immediate emotional pressure, active mental focus, present behavioral drivers. DO NOT restate permanent baseline traits from Eternal. True in THIS moment only — if always true, it belongs in Eternal. Dense, punchy summary.",
        enhancer: "TACTICAL_ANALYZER",
      },
      fractal: {
        sublabel: "Active Anomalies & Volatility",
        description: "Current environmental state: active anomalies, immediate pressure, and momentary shifts in physics or atmosphere.",
        directive:
          "What's changed from the eternal baseline right now: active anomaly, current pressure, immediate shift in physics or atmosphere. True RIGHT NOW only — stable conditions belong in Eternal. Short, high-fidelity statement.",
        enhancer: "ECOSYSTEM_ANALYZER",
      },
    },
    physical: {
      character: {
        sublabel: "Outfit, Appearance & Conditions",
        description:
          "Current physical appearance for image generation (clothing, colors, expression, posture, condition). Use {Option A|Option B} for variables.",
        directive:
          "Current physical appearance for image generation, layered over eternal baseline. Keys: [CLOTHING: ...], [COLORS: ...], [EXPRESSION: ...], [POSTURE: ...], [CONDITION: ...]. Use {A|B} syntax for option variables. Visible temporary items, expressions, and poses only — no hidden properties or thoughts. Narrative-relevant conditions (e.g. bleeding) must also go in non-physical. Max 15 lines.",
        enhancer: "SOMATIC_TRACKER",
      },
      fractal: {
        sublabel: "Active Weather, Lighting & Overlays",
        description: "Current atmospheric state for image generation (lighting, weather, atmosphere, events). Use {Option A|Option B} for variables.",
        directive:
          "Current atmospheric state for image generation, layered over eternal baseline. Keys: [LIGHTING: ...], [WEATHER: ...], [ATMOSPHERE: ...], [EVENTS: ...]. Use {A|B} syntax for option variables. Momentary sensory elements only. Max 15 lines.",
        enhancer: "ATMOSPHERIC_TRACKER",
      },
    },
  },
  future: {
    sublabel: "Standing Agenda",
    description:
      "The entity's active trajectory or standing agenda: clear intent, building pressure, or impending event driving the next state change. A single consolidated block, rewritten by the memory forge each cycle.",
    directive:
      "One active trajectory or narrative impulse: a clear intent, building pressure, or impending event. What drives this entity toward its next state change. Must be distinct from Present. Active future tense — live impulses, not past observations.",
    enhancer: "TRAJECTORY_SIMULATOR",
  },
  past: {
    sublabel: "Memory",
    description: "Formative memory or critical precedent: specific anchored event or established historical fact.",
    directive:
      "One formative memory or critical precedent: a specific anchored event or established fact. Capture the residue it exerts on current behavior. Specific over vague. Past tense — anchored historical facts, not active states.",
    enhancer: "EPISODIC_MEMORY_COMPILER",
    type: "array",
    fields: {
      directive:
        "One formative memory or critical precedent: a specific anchored event or established fact. Capture the residue it exerts on current behavior. Specific over vague. Past tense — anchored historical facts, not active states.",
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
 * @property {string} [description] - Human readable description / tooltip text
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
          const type_key = `${type}.${id}`;
          catalog[type_key] = {
            ...metadata,
            id: type_key,
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
      const field_keys = Object.keys(section).filter((k) => !["label", "sublabel", "type", "directive", "description", "enhancer"].includes(k));
      field_keys.forEach((field_key) => {
        const id = `${section_key}.${field_key}`;
        const field = section[field_key];

        ["character", "fractal"].forEach((type) => {
          const leaf = field[type] || field;
          const type_key = `${type}.${id}`;
          catalog[type_key] = {
            ...leaf,
            id: type_key,
            section_label: format_key_as_label(section_key),
            layer_key: section_key.toUpperCase(),
          };
        });

        const leaf_default = field.character || field;
        catalog[id] = {
          ...leaf_default,
          id,
          section_label: format_key_as_label(section_key),
          layer_key: section_key.toUpperCase(),
        };
      });
    }

    const has_fields =
      section.fields || Object.keys(section).some((k) => !["label", "sublabel", "type", "directive", "description", "enhancer"].includes(k));
    if (!has_fields || section.type === "array") {
      ["character", "fractal"].forEach((type) => {
        const type_key = `${type}.${section_key}`;
        catalog[type_key] = {
          ...section,
          id: type_key,
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
 * @returns {Array<{ id: string, label: string, fields: Array<{ key: string, label: string, sublabel: string | null, description: string, directive: string, enhancer: string, type?: string, is_physical?: boolean }> }>}
 */
export function build_profile_sections(entity_type = "character") {
  const resolved_type = entity_type === "user" ? "character" : entity_type || "character";

  return Object.entries(ENTITY_FRAGMENTS)
    .filter(([sectionKey, section]) => typeof section !== "string" && section !== null && sectionKey !== "profile")
    .map(([sectionKey, sectionObj]) => {
      const section = /** @type {any} */ (sectionObj);
      const field_keys = Object.keys(section).filter(
        (k) => !["label", "sublabel", "type", "directive", "description", "enhancer", "fields"].includes(k),
      );

      const fields =
        field_keys.length > 0 && section.type !== "array"
          ? field_keys.map((fieldKey) => {
              const field = section[fieldKey];
              const leaf = field[resolved_type] || field;
              return {
                key: `${sectionKey}.${fieldKey}`,
                label: format_key_as_label(fieldKey),
                sublabel: leaf.sublabel || null,
                description: leaf.description || leaf.directive || "",
                directive: leaf.directive || "",
                enhancer: leaf.enhancer,
                type: field.type,
                is_physical: fieldKey === "physical",
              };
            })
          : [
              {
                key: sectionKey,
                label: null,
                sublabel: section.sublabel || null,
                description: section.description || section.directive || "",
                directive: section.directive || "",
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
