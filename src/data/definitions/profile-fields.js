/**
 * src/data/definitions/profile-fields.js
 * 📋 PROFILE FIELDS & TAXONOMY — Single Source of Truth for Entity Fields.
 *
 * Defines the canonical schema for all character and fractal fields across the simulation:
 * - Canonical Field Taxonomy & Enhancer Roles (PROFILE_FIELDS)
 * - Field Catalog & Flat Metadata Registry (PROFILE_FIELD_CATALOG)
 * - Dynamic Flat Leaf Map for Ingestion (FLAT_LEAF_MAP)
 * - Profile Studio UI Layout Sections (PROFILE_SECTIONS_BY_TYPE)
 *
 * Dependencies:
 * - format_key_as_label from @utils
 *
 * Rules:
 * - Pure data definition and layout mapping. No UI or state mutations.
 * - Always maintain symmetrical field structures for character and fractal entity models.
 */

import { format_key_as_label } from "@utils";
import { SIGNATURE_COLORS } from "./signature-colors.js";

const HELPERS = Object.freeze({
  BRACKETS: `Return bracketed directives: [KEY: value] — one directive per line, no outer braces, no prose outside brackets. Max 15 lines.`,
});

// ── 1. Canonical Field Taxonomy ───────────────────────────────────────────────

/**
 * Canonical taxonomy of all entity fields, structured by entity type -> temporal layer -> field.
 */
export const PROFILE_FIELDS = {
  name: {
    label: "Name",
    description: "Entity name string",
    directive: "Entity name string",
  },
  description: {
    label: "Description",
    description: "HUMAN EYES ONLY: internal notes / OOC summary (never used in simulation)",
    directive: "HUMAN EYES ONLY: internal notes / OOC summary (never used in simulation)",
  },
  signature_color: {
    label: "Signature Color",
    description: `Entity signature color name: ${SIGNATURE_COLORS.join(" | ")}`,
    directive: `Entity signature color name: ${SIGNATURE_COLORS.join(" | ")}`,
  },
  character: {
    eternal: {
      physical: {
        label: "Physical Appearance",
        description: "Permanent biometric features for image generation (gender, age, ethnicity, build, face, eyes, hair, height).",
        directive: `Permanent physical features for image generation. Mandatory keys: [GENDER: ...], [AGE: ...], [ETHNICITY: ...]. Optional keys: [BUILD: ...], [FACE: ...], [EYES: ...], [SKIN: ...], [HAIR: ...], [EARS: ...], [DENTAL_FEATURES: ...], [HEIGHT: ...]. Visible body details and identifying scars only — no clothing, traits, gear, or morality. ${HELPERS.BRACKETS}`,
        enhancer: "BIOMETRIC_RENDERER",
      },
      non_physical: {
        label: "Personality",
        description: "Timeless psychology: core beliefs, personality drivers, cognitive patterns, vocal tone, and communication tics.",
        directive:
          "Timeless psychology: core beliefs, personality drivers, cognitive patterns, vocal tone, speech cadence, and communication tics. Must hold true in any scene — if it shifts during play, it belongs in Present. No reactive moments or specific events. Dense, high-fidelity paragraph.",
        enhancer: "COGNITIVE_ARCHITECT",
      },
    },
    present: {
      physical: {
        label: "Current Look",
        description:
          "Current physical appearance for image generation (clothing, colors, expression, posture, condition). Use {Option A|Option B} for variables.",
        directive: `Current physical appearance layered over eternal baseline. Keys: [CLOTHING: ...], [COLORS: ...], [EXPRESSION: ...], [POSTURE: ...], [CONDITION: ...], [HELD: ...]. Use {A|B} syntax for option variables. Visible temporary items, expressions, and poses only — no hidden thoughts. ${HELPERS.BRACKETS}`,
        enhancer: "SOMATIC_TRACKER",
      },
      non_physical: {
        label: "State of Mind",
        description: "Current state of mind: immediate emotional pressure, active mental focus, and present behavioral drivers.",
        directive:
          "What's shifted from the eternal baseline right now: immediate emotional pressure, active mental focus, present behavioral drivers. DO NOT restate permanent baseline traits from Eternal. True in THIS moment only — if always true, it belongs in Eternal. Dense, punchy summary.",
        enhancer: "TACTICAL_ANALYZER",
      },
    },
    future: {
      label: "Agenda",
      description:
        "The entity's active trajectory or standing agenda: clear intent, building pressure, or impending event driving the next state change.",
      directive:
        "Rewrite the standing agenda as ONE consolidated block of 2-5 sentences in active future tense: a clear intent, building pressure, or impending event driving this entity toward its next state change. Must be distinct from Present. No story scenes, no dialogue, no tag lists.",
      enhancer: "TRAJECTORY_SIMULATOR",
    },
    past: {
      label: "Memories",
      description: "Formative memories or critical precedents: specific anchored events or established historical facts.",
      directive:
        "Specific historical fact or settled event in past tense exerting lasting behavioral residue. Specific over vague; exclude transient moods or immediate dialogue. Empty list if none.",
      enhancer: "EPISODIC_MEMORY_COMPILER",
      type: "array",
    },
  },
  fractal: {
    eternal: {
      physical: {
        label: "Environment",
        description: "Permanent physical geography for image generation (terrain, architecture, materials, landmarks, scale).",
        directive: `Permanent physical geography for image generation. Keys: [TERRAIN: ...], [ARCHITECTURE: ...], [MATERIALS: ...], [LANDMARKS: ...], [SCALE: ...], [GEOMETRY: ...], [ZONES: ...], [CONNECTION: ...], [VISUAL_THEME: ...]. Concrete visible landscape features only — no weather, lighting, or lore. ${HELPERS.BRACKETS}`,
        enhancer: "SPATIAL_RENDERER",
      },
      non_physical: {
        label: "Permanent Truths",
        description: "Timeless metaphysical substrate: governing laws, constant environmental forces, and physical constants.",
        directive:
          "Timeless metaphysical substrate: governing laws, constant forces, structural atmosphere. Intangible constants, ambient rules, defining sensory essence, unbreakable world logic. Must hold true in any scene — if it shifts, it belongs in Present. No moments of observation. Dense, high-fidelity paragraph.",
        enhancer: "METAPHYSICAL_ARCHITECT",
      },
    },
    present: {
      physical: {
        label: "Atmosphere",
        description: "Current atmospheric state for image generation (lighting, weather, atmosphere, events). Use {Option A|Option B} for variables.",
        directive: `Current atmospheric state layered over eternal baseline. Keys: [LIGHTING: ...], [WEATHER: ...], [ATMOSPHERE: ...], [EVENTS: ...]. Use {A|B} syntax for option variables. Momentary sensory elements only. ${HELPERS.BRACKETS}`,
        enhancer: "ATMOSPHERIC_TRACKER",
      },
      non_physical: {
        label: "Current State",
        description: "Current environmental state: active anomalies, immediate pressure, and momentary shifts in physics or atmosphere.",
        directive:
          "What's changed from the eternal baseline right now: active anomaly, current pressure, immediate shift in physics or atmosphere. True RIGHT NOW only — stable conditions belong in Eternal. Short, high-fidelity statement.",
        enhancer: "ECOSYSTEM_ANALYZER",
      },
    },
    future: {
      label: "Trajectory",
      description: "Environmental trajectory, building anomaly, or converging weather event driving the next scene state change.",
      directive:
        "Rewrite the trajectory as ONE consolidated block of 2-5 sentences in active future tense: building atmospheric pressure, impending environmental event, or anomaly apex driving this world toward its next state change. Must be distinct from Present.",
      enhancer: "ECOSYSTEM_SIMULATOR",
    },
    past: {
      label: "History",
      description: "Historical cataclysms, founding myths, and settled geographic epochs.",
      directive:
        "Settled historical cataclysm, founding myth, or defining epoch in past tense that shaped current world reality. Specific over vague; exclude active weather or temporary conditions. Empty list if none.",
      enhancer: "HISTORIAN",
      type: "array",
    },
  },
};

// ── 2. Derived Metadata, Catalog & Leaf Models ────────────────────────────────

/**
 * @typedef {Object} CatalogEntry
 * @property {string} id - Polymorphic ID, e.g. "character.eternal.non_physical"
 * @property {string} path - Dot-notation path, e.g. "eternal.non_physical"
 * @property {string} section_label - Parent section display name, e.g. "Eternal"
 * @property {string} layer_key - Parent section key in uppercase, e.g. "ETERNAL"
 * @property {string} label - Canonical display label
 * @property {string} tag - XML tag (derived from label)
 * @property {string} [directive] - AI instruction
 * @property {string} [enhancer] - Semantic tag
 * @property {string} [description] - Human readable description / tooltip text
 * @property {string} [type] - Field type (e.g., "array")
 */

/**
 * @typedef {Object} ProfileFieldItem
 * @property {string} key - Dot-notation field key (e.g., "eternal.non_physical")
 * @property {string} label - Canonical field display label
 * @property {string|null} column_label - Sub-column label if multi-column section
 * @property {string} description - Explanatory tooltip or description
 * @property {string} directive - AI generation directive
 * @property {string|undefined} enhancer - Semantic enhancer role identifier
 * @property {string|undefined} type - Field data type
 * @property {boolean} [is_physical] - Indicates physical image prompt rendering field
 */

/**
 * @typedef {Object} ProfileSection
 * @property {string} id - Section identifier key
 * @property {string} label - Formatted section label
 * @property {ProfileFieldItem[]} fields - Array of field items in section
 */

/**
 * Traverses PROFILE_FIELDS once to build both the flat polymorphic catalog and leaf key map.
 * @param {Record<string, any>} fields
 * @returns {{ catalog: Record<string, CatalogEntry>, leaf_map: Record<string, string> }}
 */
function build_profile_catalog(fields) {
  /** @type {Record<string, CatalogEntry>} */
  const catalog = {};
  /** @type {Record<string, string>} */
  const leaf_map = {
    appearance: "eternal.physical",
    personality: "eternal.non_physical",
    current_look: "present.physical",
    state_of_mind: "present.non_physical",
    environment: "eternal.physical",
    active_atmosphere: "present.physical",
    current_state: "present.non_physical",
    metaphysical_truths: "eternal.non_physical",
  };
  const entity_types = ["character", "fractal"];

  entity_types.forEach((entity_type) => {
    const entity_schema = fields[entity_type];
    if (!entity_schema) return;

    Object.entries(entity_schema).forEach(([layer_key, layer_val]) => {
      const section_label = format_key_as_label(layer_key);
      const layer_uppercase = layer_key.toUpperCase();

      if (layer_val.type === "array" || layer_val.directive) {
        const tag = layer_val.label ? layer_val.label.toUpperCase().replace(/\s+/g, "_") : layer_key.toUpperCase();
        catalog[`${entity_type}.${layer_key}`] = {
          ...layer_val,
          id: `${entity_type}.${layer_key}`,
          path: layer_key,
          tag,
          section_label,
          layer_key: layer_uppercase,
        };
        leaf_map[layer_key] = layer_key;
        if (layer_val.label) {
          leaf_map[layer_val.label.toLowerCase().replace(/\s+/g, "_")] = layer_key;
          leaf_map[tag.toLowerCase()] = layer_key;
        }
      } else {
        Object.entries(layer_val).forEach(([sub_key, leaf]) => {
          const path = `${layer_key}.${sub_key}`;
          const tag = leaf.label ? leaf.label.toUpperCase().replace(/\s+/g, "_") : sub_key.toUpperCase();
          catalog[`${entity_type}.${path}`] = {
            ...leaf,
            id: `${entity_type}.${path}`,
            path,
            tag,
            section_label,
            layer_key: layer_uppercase,
          };
          if (leaf.label) {
            leaf_map[leaf.label.toLowerCase().replace(/\s+/g, "_")] = path;
            leaf_map[tag.toLowerCase()] = path;
          }
        });
      }
    });
  });

  return { catalog, leaf_map };
}

const { catalog, leaf_map } = build_profile_catalog(PROFILE_FIELDS);

/**
 * Flat registry of all entity fields, keyed by dot-notation ID.
 */
export const PROFILE_FIELD_CATALOG = Object.freeze(catalog);

/**
 * Dynamic flat LLM / card ingestion keys to nested Twin-Cylinder schema paths.
 */
export const FLAT_LEAF_MAP = Object.freeze(leaf_map);

// ── 3. Profile Section Layout Model ──────────────────────────────────────────

/**
 * Dynamic profile sections map for Profile modal tabs.
 */
export const PROFILE_SECTIONS_BY_TYPE = Object.freeze({
  character: Object.freeze(build_profile_sections("character")),
  fractal: Object.freeze(build_profile_sections("fractal")),
});

/**
 * Builds the profile sections layout dynamically based on entity type.
 * @param {string} [entity_type]
 * @returns {ProfileSection[]}
 */
export function build_profile_sections(entity_type = "character") {
  const resolved_entity_type = entity_type === "user" ? "character" : entity_type || "character";
  const entity_schema = PROFILE_FIELDS[resolved_entity_type] || PROFILE_FIELDS.character;

  const section_keys = ["eternal", "present", "future", "past"];

  return section_keys.map((section_key) => {
    const layer = entity_schema[section_key];
    const is_composite_section = Boolean(layer && (layer.physical || layer.non_physical));

    const fields = is_composite_section
      ? ["physical", "non_physical"]
          .filter((field_key) => field_key in layer)
          .map((field_key) => {
            const leaf = layer[field_key];
            return {
              key: `${section_key}.${field_key}`,
              label: leaf.label || format_key_as_label(field_key),
              column_label: format_key_as_label(field_key),
              description: leaf.description || leaf.directive || "",
              directive: leaf.directive || "",
              enhancer: leaf.enhancer,
              type: leaf.type,
              is_physical: field_key === "physical",
            };
          })
      : [
          {
            key: section_key,
            label: layer.label || format_key_as_label(section_key),
            column_label: null,
            description: layer.description || layer.directive || "",
            directive: layer.directive || "",
            enhancer: layer.enhancer,
            type: layer.type,
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
 * CHANGELOG:
 * - 2026-09-12: Added `signature_color` to `PROFILE_FIELDS`.
 * - 2026-09-12: Redesigned taxonomy hierarchy to entity_type -> temporal layer -> field (character -> eternal -> physical). Added distinct fractal models for future (Impending Shift) and past (World History). Simplified build_profile_catalog and build_profile_sections.
 * - 2026-09-06: Standardized field taxonomy:
 *   (1) Renamed character eternal.physical label from "Permanent Appearance" to "Physical Appearance";
 *   (2) Pruned legacy `appearance` alias from FLAT_LEAF_MAP per P4 Zero Backwards Compatibility;
 *   (3) Hardened section detection in build_profile_sections using explicit composite checks;
 *   (4) Object.freeze exported collections (PROFILE_FIELD_CATALOG, FLAT_LEAF_MAP, PROFILE_SECTIONS_BY_TYPE).
 * - 2026-08-29: Harmonized profile-fields module — enforced full-name variable nomenclature, enriched JSDoc types, and aligned universal file architecture.
 */
