/**
 * src/data/definitions/profile-fields.js
 * 📋 PROFILE FIELDS & TAXONOMY — Single Source of Truth for Entity Fields.
 *
 * Defines the canonical schema for all character and fractal fields across the simulation:
 * - Canonical Field Taxonomy & Enhancer Roles (PROFILE_FIELDS)
 * - Field Catalog & Flat Metadata Registry (PROFILE_FIELD_CATALOG)
 * - Profile Studio UI Layout Sections (PROFILE_SECTIONS_BY_TYPE)
 */

import { format_key_as_label } from "@utils";

// ── 1. Canonical Field Taxonomy ───────────────────────────────────────────────

/**
 * Canonical taxonomy of all entity fields, grouped by temporal section.
 */
export const PROFILE_FIELDS = {
  name: "Name",
  description: "Summary of the entity's vibe and role (Human eyes only — never used in simulation).",
  eternal: {
    non_physical: {
      character: {
        tag: "PERSONALITY",
        sublabel: "Personality",
        description: "Timeless psychology: core beliefs, personality drivers, cognitive patterns, vocal tone, and communication tics.",
        directive:
          "Timeless psychology: core beliefs, personality drivers, cognitive patterns, vocal tone, speech cadence, and communication tics. Must hold true in any scene — if it shifts during play, it belongs in Present. No reactive moments or specific events. Dense, high-fidelity paragraph.",
        enhancer: "COGNITIVE_ARCHITECT",
      },
      fractal: {
        tag: "METAPHYSICAL_TRUTHS",
        sublabel: "Metaphysical Truths",
        description: "Timeless metaphysical substrate: governing laws, constant environmental forces, and physical constants.",
        directive:
          "Timeless metaphysical substrate: governing laws, constant forces, structural atmosphere. Physical constants, ambient rules, defining sensory essence, unbreakable world logic. Must hold true in any scene — if it shifts, it belongs in Present. No moments of observation. Dense, high-fidelity paragraph.",
        enhancer: "METAPHYSICAL_ARCHITECT",
      },
    },
    physical: {
      character: {
        tag: "PERMANENT_APPEARANCE",
        sublabel: "Permanent Appearance",
        description: "Permanent biometric features for image generation (gender, age, ethnicity, build, face, eyes, hair, height).",
        directive:
          "Permanent physical features for image generation. Return bracketed configuration: [KEY: value] — one bracket per line, no outer braces, no prose outside the brackets. No clothing, expressions, or poses. Mandatory keys: [GENDER: ...], [AGE: ...], [ETHNICITY: ...]. Optional keys: [BUILD: ...], [FACE: ...], [EYES: ...], [SKIN: ...], [HAIR: ...], [EARS: ...], [DENTAL_FEATURES: ...], [HEIGHT: ...]. Visible body details and identifying skin accents/scars only — no traits, skills, gear, or morality. Max 15 lines.",
        enhancer: "BIOMETRIC_RENDERER",
      },
      fractal: {
        tag: "ENVIRONMENT",
        sublabel: "Environment",
        description: "Permanent physical geography for image generation (terrain, architecture, materials, landmarks, scale).",
        directive:
          "Permanent physical geography for image generation. Return bracketed configuration: [KEY: value] — one bracket per line, no outer braces, no prose outside the brackets. No weather, lighting, or atmospheric events. Keys: [TERRAIN: ...], [ARCHITECTURE: ...], [MATERIALS: ...], [LANDMARKS: ...], [SCALE: ...], [UPPER_CITY: ...], [LOWER_CITY: ...], [CONNECTION: ...], [VISUAL_THEME: ...]. Concrete visible landscape features only — no lore, history, or background summaries. Max 15 lines.",
        enhancer: "SPATIAL_RENDERER",
      },
    },
  },
  present: {
    non_physical: {
      character: {
        tag: "STATE_OF_MIND",
        sublabel: "State of Mind",
        description: "Current state of mind: immediate emotional pressure, active mental focus, and present behavioral drivers.",
        directive:
          "What's shifted from the eternal baseline right now: immediate emotional pressure, active mental focus, present behavioral drivers. DO NOT restate permanent baseline traits from Eternal. True in THIS moment only — if always true, it belongs in Eternal. Dense, punchy summary.",
        enhancer: "TACTICAL_ANALYZER",
      },
      fractal: {
        tag: "CURRENT_STATE",
        sublabel: "Current State",
        description: "Current environmental state: active anomalies, immediate pressure, and momentary shifts in physics or atmosphere.",
        directive:
          "What's changed from the eternal baseline right now: active anomaly, current pressure, immediate shift in physics or atmosphere. True RIGHT NOW only — stable conditions belong in Eternal. Short, high-fidelity statement.",
        enhancer: "ECOSYSTEM_ANALYZER",
      },
    },
    physical: {
      character: {
        tag: "CURRENT_LOOK",
        sublabel: "Current Look",
        description:
          "Current physical appearance for image generation (clothing, colors, expression, posture, condition). Use {Option A|Option B} for variables.",
        directive:
          "Current physical appearance for image generation, layered over eternal baseline. Return bracketed configuration: [KEY: value] — one bracket per line, no outer braces, no prose outside the brackets. Keys: [CLOTHING: ...], [COLORS: ...], [EXPRESSION: ...], [POSTURE: ...], [CONDITION: ...]. Use {A|B} syntax for option variables. Visible temporary items, expressions, and poses only — no hidden properties or thoughts. Narrative-relevant conditions (e.g. bleeding) must also go in non-physical. Max 15 lines.",
        enhancer: "SOMATIC_TRACKER",
      },
      fractal: {
        tag: "ACTIVE_ATMOSPHERE",
        sublabel: "Active Atmosphere",
        description: "Current atmospheric state for image generation (lighting, weather, atmosphere, events). Use {Option A|Option B} for variables.",
        directive:
          "Current atmospheric state for image generation, layered over eternal baseline. Return bracketed configuration: [KEY: value] — one bracket per line, no outer braces, no prose outside the brackets. Keys: [LIGHTING: ...], [WEATHER: ...], [ATMOSPHERE: ...], [EVENTS: ...]. Use {A|B} syntax for option variables. Momentary sensory elements only. Max 15 lines.",
        enhancer: "ATMOSPHERIC_TRACKER",
      },
    },
  },
  future: {
    tag: "AGENDA",
    sublabel: "Standing Agenda",
    description:
      "The entity's active trajectory or standing agenda: clear intent, building pressure, or impending event driving the next state change.",
    directive:
      "Rewrite the standing agenda as ONE consolidated block of 2-5 sentences in active future tense: a clear intent, building pressure, or impending event. What drives this entity toward its next state change. Must be distinct from Present. No story scenes, no dialogue, no past observations, no tag lists.",
    enhancer: "TRAJECTORY_SIMULATOR",
  },
  past: {
    tag: "MEMORIES",
    sublabel: "Memories",
    description: "Formative memories or critical precedents: specific anchored events or established historical facts.",
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

// ── 2. Schema Mapping & Flat Conversions ──────────────────────────────────────

/**
 * Maps flat LLM / card ingestion keys to nested Twin-Cylinder schema paths.
 */
export const FLAT_LEAF_MAP = {
  appearance: "eternal.physical",
  personality: "eternal.non_physical",
  current_look: "present.physical",
  state_of_mind: "present.non_physical",
};

// ── 3. Derived Metadata & UI Models ──────────────────────────────────────────

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
 * Builds a flat `{ [dotKey]: metadata }` map from the nested PROFILE_FIELDS tree.
 * Each entry is enriched with ID and section metadata for both polymorphic entity types.
 * @param {Record<string, any>} fields
 * @returns {Record<string, CatalogEntry>} Flat catalog keyed by dot-notation field ID.
 */
function build_field_catalog(fields) {
  /** @type {Record<string, any>} */
  const catalog = {};
  const types = ["character", "fractal"];

  Object.entries(fields).forEach(([section_key, section_obj]) => {
    if (typeof section_obj === "string" || section_obj === null || section_key === "profile") return;
    const section = /** @type {any} */ (section_obj);
    const section_label = format_key_as_label(section_key);
    const layer_key = section_key.toUpperCase();

    if (section.type === "array" || section.directive) {
      // Single-leaf section (e.g., future, past)
      types.forEach((type) => {
        catalog[`${type}.${section_key}`] = { ...section, id: `${type}.${section_key}`, section_label, layer_key };
      });
      catalog[section_key] = { ...section, id: section_key, section_label, layer_key };
    } else {
      // Multi-leaf section (e.g., eternal, present)
      Object.entries(section).forEach(([field_key, field_val]) => {
        const id = `${section_key}.${field_key}`;
        types.forEach((type) => {
          const leaf = field_val[type] || field_val;
          catalog[`${type}.${id}`] = { ...leaf, id: `${type}.${id}`, section_label, layer_key };
        });
        catalog[id] = { ...(field_val.character || field_val), id, section_label, layer_key };
      });
    }
  });

  return catalog;
}

/**
 * Flat registry of all entity fields, keyed by dot-notation ID.
 * Used by intelligence and UI layers to look up field rules and enhancer roles.
 */
export const PROFILE_FIELD_CATALOG = build_field_catalog(PROFILE_FIELDS);

/**
 * Builds the profile sections layout dynamically based on entity type.
 * Handles leaf-level polymorphism cleanly.
 * @param {string} [entity_type]
 * @returns {Array<{ id: string, label: string, fields: Array<{ key: string, label: string, sublabel: string | null, description: string, directive: string, enhancer: string, type?: string, is_physical?: boolean }> }>}
 */
export function build_profile_sections(entity_type = "character") {
  const resolved_type = entity_type === "user" ? "character" : entity_type || "character";

  return Object.entries(PROFILE_FIELDS)
    .filter(([section_key, section]) => typeof section !== "string" && section !== null && section_key !== "profile")
    .map(([section_key, section_obj]) => {
      const section = /** @type {any} */ (section_obj);
      const field_keys = Object.keys(section).filter(
        (k) => !["label", "sublabel", "type", "directive", "description", "enhancer", "fields"].includes(k),
      );

      const fields =
        field_keys.length > 0 && section.type !== "array"
          ? field_keys.map((field_key) => {
              const field = section[field_key];
              const leaf = field[resolved_type] || field;
              return {
                key: `${section_key}.${field_key}`,
                label: format_key_as_label(field_key),
                sublabel: leaf.sublabel || null,
                description: leaf.description || leaf.directive || "",
                directive: leaf.directive || "",
                enhancer: leaf.enhancer,
                type: field.type,
                is_physical: field_key === "physical",
              };
            })
          : [
              {
                key: section_key,
                label: null,
                sublabel: section.sublabel || null,
                description: section.description || section.directive || "",
                directive: section.directive || "",
                enhancer: section.enhancer,
                type: section.type,
              },
            ];
      return {
        id: section_key,
        label: format_key_as_label(section_key),
        fields,
      };
    });
}

/**
 * Dynamic profile sections map for Profile modal tabs.
 */
export const PROFILE_SECTIONS_BY_TYPE = {
  character: build_profile_sections("character"),
  fractal: build_profile_sections("fractal"),
};
