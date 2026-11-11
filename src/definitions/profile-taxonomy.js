/**
 * src/definitions/profile-taxonomy.js
 * 📋 PROFILE TAXONOMY — Single Source of Truth for Entity Fields.
 *
 * Defines the canonical schema for all character and fractal fields across the simulation:
 * - Canonical Field Taxonomy (PROFILE_FIELDS — the single home of all words)
 * - Field Atoms & routing/assembly authority (FIELD_ATOMS, canonicalize_field_key,
 *   resolve_entity_type, atom_for, output_key_for_path, caretaker_brief)
 * - Field Catalog (PROFILE_FIELD_CATALOG — derived from atoms, same shape as ever)
 * - Profile Studio UI Layout Sections (PROFILE_SECTIONS_BY_TYPE)
 * - Flat Leaf Map & Ingestion Aliases (FLAT_LEAF_MAP — the alias table)
 * - Caretaker Enhancer Directives (ENHANCER_DIRECTIVES — derived from atoms)
 *
 * Dependencies:
 * - format_key_as_label from @utils
 *
 * Rules:
 * - Pure data definition and layout mapping. No UI or state mutations.
 * - Words live in PROFILE_FIELDS leaves exactly once; everything else derives.
 * - Always maintain symmetrical field structures for character and fractal entity models.
 */

import { format_key_as_label } from "@utils";
import { SIGNATURE_COLORS } from "../media/tokens.js";

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
    directive: "Internal OOC summary notes",
  },
  signature_color: {
    label: "Signature Color",
    description: `Entity signature color name: ${SIGNATURE_COLORS.join(" | ")}`,
    directive: `Entity signature color name: ${SIGNATURE_COLORS.join(" | ")}`,
  },
  pov: {
    label: "Point of View",
    description: "Narrative perspective: 1st_person ('I') vs 3rd_person ('He/She/They')",
    directive: "Narrative perspective: 1st_person vs 3rd_person",
  },
  character: {
    eternal: {
      physical: {
        label: "Physical Appearance",
        description:
          "Permanent visual truth (gender, age, ethnicity, build, face, eyes, hair, scars). Anchors diffusion synthesis without equipment or clothing.",
        directive: `[KEY: value] permanent biometrics (gender, age, ethnicity, build, face, eyes, hair, scars). Visible body details only — no clothing, equipment, or psychological traits.`,
        enhancer: "BIOMETRIC_RENDERER",
      },
      non_physical: {
        label: "Personality",
        description:
          "Timeless cognitive drivers, core beliefs, vocal cadence, and behavioural invariants. Never use keyword dumps — write lived traits.",
        directive: `[KEY: value] core beliefs, personality drivers, cognitive patterns, vocal tone, speech cadence, and communication tics. Bracketed traits only.`,
        enhancer: "COGNITIVE_ARCHITECT",
      },
    },
    present: {
      physical: {
        label: "Current Look",
        description:
          "Immediate physical appearance, active attire, condition, posture, and held items. Use {Option A|Option B} for dynamic variants.",
        directive: `[KEY: value] current appearance (clothing, colors, expression, posture, condition, held). Use {Option A|Option B} for variables. Visible temporary items and poses only.`,
        enhancer: "SOMATIC_TRACKER",
      },
      non_physical: {
        label: "State of Mind",
        description: "Immediate psychological pressure, tactical focus, and present behavioural drivers under current scene tensions.",
        directive: `[KEY: value] immediate emotional pressure, active mental focus, and present behavioral drivers. Bracketed conditions only.`,
        enhancer: "TACTICAL_ANALYZER",
      },
    },
    future: {
      label: "Agenda",
      description: "Active standing agenda, impending choice, or converging tension propelling this entity into the next state change.",
      directive: `[KEY: value] active trajectory or standing agenda: clear intent, building pressure, or impending event driving this entity toward its next state change. Bracketed items only; no story scenes or dialogue.`,
      enhancer: "TRAJECTORY_SIMULATOR",
    },
    past: {
      label: "Past",
      description: "Settled precedents, canon facts, and emotional anchors ([KEY: fact | flags]). Ranked via pure numeric weights (w: 1-10).",
      directive: `Settled historical fact or precedent: [KEY: value | flags] (flags: 'hide' / 'show', 'w: 1-10'). Specific over vague; exclude transient moods or immediate dialogue.`,
      enhancer: "PAST_COMPILER",
    },
  },
  fractal: {
    eternal: {
      physical: {
        label: "Environment",
        description: "Permanent macro-features, landmarks, terrain, architecture, and enduring scale. Governs visual setting synthesis.",
        directive: `[KEY: value] permanent geography (terrain, architecture, materials, landmarks, scale). Concrete visible landscape features only — no transient weather, lighting, or lore.`,
        enhancer: "SPATIAL_RENDERER",
      },
      non_physical: {
        label: "Permanent Truths",
        description: "Enduring physics, cultural taboos, governing laws, and environmental constants. Grounded lore over keyword lists.",
        directive: `[KEY: value] metaphysical substrate: governing laws, constant environmental forces, and physical constants. Bracketed truths only.`,
        enhancer: "METAPHYSICAL_ARCHITECT",
      },
    },
    present: {
      physical: {
        label: "Atmosphere",
        description: "Dynamic atmospheric conditions, lighting, active weather, and sensory ephemera. Use {Option A|Option B} for variations.",
        directive: `[KEY: value] current atmospheric state (lighting, weather, atmosphere, events). Use {Option A|Option B} for variables. Momentary sensory elements only.`,
        enhancer: "ATMOSPHERIC_TRACKER",
      },
      non_physical: {
        label: "Current State",
        description: "Momentary ecosystem shifts, active anomalies, social unrest, and immediate environmental pressures.",
        directive: `[KEY: value] current environmental state: active anomaly, immediate pressure, momentary shifts in physics or atmosphere. Bracketed state only.`,
        enhancer: "ECOSYSTEM_ANALYZER",
      },
    },
    future: {
      label: "Trajectory",
      description: "Brewing cataclysms, impending ecological shifts, or converging anomalies driving the world toward its next epoch.",
      directive: `[KEY: value] environmental trajectory, building atmospheric pressure, impending environmental event, or anomaly apex driving this world toward its next state change. Bracketed items only.`,
      enhancer: "ECOSYSTEM_SIMULATOR",
    },
    past: {
      label: "History",
      description: "Defining historical epochs, mythic origins, and settled cataclysms ([KEY: epoch | flags], w: 1-10).",
      directive: `Settled historical cataclysm, founding myth, or defining epoch: [KEY: value | flags] (flags: 'hide' / 'show', 'w: 1-10'). Specific over vague; exclude active weather or temporary conditions.`,
      enhancer: "HISTORIAN",
    },
  },
};

// ── 2. Field Atoms (schema authority) ─────────────────────────────────────────
// PROFILE_FIELDS above is the content home. Everything below derives from it:
// the flat atom list, the catalog, the enhancer directives, and the
// routing/assembly helpers consumers call. No words are duplicated below.

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
 * @typedef {Object} FieldAtom
 * @property {string} id - Polymorphic ID, e.g. "character.eternal.non_physical"
 * @property {string} type - Owning entity type ("character" | "fractal")
 * @property {string} path - Dot-notation path within the type, e.g. "eternal.non_physical"
 * @property {string} label - Canonical display label
 * @property {string} description - Human-readable description / tooltip text
 * @property {string} directive - AI instruction (single home of the words)
 * @property {string} enhancer - Semantic enhancer role identifier
 * @property {"replace" | "append"} merge - Write semantics: past appends, everything else replaces
 */

/**
 * Walks PROFILE_FIELDS once and returns the 12 quadrant leaves as flat atoms.
 * Generic over the composite/single distinction: layers with physical/
 * non_physical children yield two atoms, other layers yield one atom per
 * layer. Top-level metadata (name/description/signature_color/pov) are
 * intentionally NOT atoms — not enhanceable, same as before.
 * @param {Record<string, any>} fields
 * @returns {FieldAtom[]}
 */
function build_field_atoms(fields) {
  /** @type {FieldAtom[]} */
  const atoms = [];

  for (const entity_type of ["character", "fractal"]) {
    const entity_schema = fields[entity_type];
    if (!entity_schema) continue;

    for (const [layer_key, layer_val] of Object.entries(entity_schema)) {
      const is_composite = Boolean(layer_val && (layer_val.physical || layer_val.non_physical));
      const sub_keys = is_composite ? ["physical", "non_physical"].filter((k) => layer_val[k]) : [null];
      for (const sub_key of sub_keys) {
        const leaf = sub_key ? layer_val[sub_key] : layer_val;
        if (!leaf) continue;
        const path = sub_key ? `${layer_key}.${sub_key}` : layer_key;
        atoms.push({
          id: `${entity_type}.${path}`,
          type: entity_type,
          path,
          merge: layer_key === "past" ? "append" : "replace",
          label: leaf.label || "",
          description: leaf.description || "",
          directive: leaf.directive || "",
          enhancer: leaf.enhancer || "",
        });
      }
    }
  }

  return atoms;
}

export const FIELD_ATOMS = Object.freeze(build_field_atoms(PROFILE_FIELDS));

/** @type {Record<string, FieldAtom>} */
export const ATOM_BY_ID = Object.freeze(Object.fromEntries(FIELD_ATOMS.map((atom) => [atom.id, atom])));

/**
 * Builds the flat polymorphic catalog from atoms. Entry shape is identical to
 * the historical hand-walked catalog (leaf fields + id/path/tag/section_label/
 * layer_key) so existing readers see zero difference.
 * @param {FieldAtom[]} atoms
 * @returns {{ catalog: Record<string, CatalogEntry> }}
 */
function build_profile_catalog(atoms) {
  /** @type {Record<string, CatalogEntry>} */
  const catalog = {};

  for (const atom of atoms) {
    const layer_key = atom.path.split(".")[0];
    const sub_key = atom.path.includes(".") ? atom.path.split(".")[1] : null;
    catalog[atom.id] = {
      label: atom.label,
      description: atom.description,
      directive: atom.directive,
      enhancer: atom.enhancer,
      id: atom.id,
      path: atom.path,
      tag: atom.label ? atom.label.toUpperCase().replace(/\s+/g, "_") : sub_key ? sub_key.toUpperCase() : layer_key.toUpperCase(),
      section_label: format_key_as_label(layer_key),
      layer_key: layer_key.toUpperCase(),
    };
  }

  return { catalog };
}

const { catalog } = build_profile_catalog(FIELD_ATOMS);

/**
 * Flat registry of all entity fields, keyed by dot-notation ID.
 */
export const PROFILE_FIELD_CATALOG = Object.freeze(catalog);

// ── 2b. Flat Leaf Map & Ingestion Aliases (single home; moved from src/data/profile-fields.js) ──

export const FLAT_LEAF_MAP = Object.freeze({
  character: Object.freeze({
    appearance: "eternal.physical",
    "eternal.physical": "eternal.physical",
    personality: "eternal.non_physical",
    "eternal.non_physical": "eternal.non_physical",
    current_look: "present.physical",
    "present.physical": "present.physical",
    state_of_mind: "present.non_physical",
    "present.non_physical": "present.non_physical",
    future: "future",
    agenda: "future",
    past: "past",
    memories: "past",
  }),
  fractal: Object.freeze({
    environment: "eternal.physical",
    "eternal.physical": "eternal.physical",
    permanent_truths: "eternal.non_physical",
    metaphysical_truths: "eternal.non_physical",
    "eternal.non_physical": "eternal.non_physical",
    atmosphere: "present.physical",
    active_atmosphere: "present.physical",
    "present.physical": "present.physical",
    current_state: "present.non_physical",
    "present.non_physical": "present.non_physical",
    future: "future",
    trajectory: "future",
    past: "past",
    history: "past",
  }),
});

/**
 * Single home for entity-type normalization: "user" (and "ai", undefined,
 * anything else) addresses the character schema; only "fractal" is fractal.
 * Replaces the copies that lived in build_profile_sections, Profile.svelte.js
 * and normalize_entity — same mapping, one definition.
 * @param {string} [type]
 * @returns {"character" | "fractal"}
 */
export function resolve_entity_type(type) {
  return type === "fractal" ? "fractal" : "character";
}

/**
 * Resolves a flat leaf or alias key into a canonical dot-notation path.
 * Lookup order preserves the historical behavior exactly: the entity type's
 * own map first, then the character map as fallback (so fractal ingestion
 * keeps its tolerance for character-shaped aliases). Exact alias hits first,
 * then a separator-insensitive compact fallback so human-shaped input
 * ("Eternal Physical", "eternalPhysical") and structuring underscore keys
 * ("eternal_physical") route to the nested schema instead of resolving null
 * (the old direct-index gap in apply_profile_to_entity, which stored such
 * keys as flat junk props that normalize_entity later dropped).
 * @param {string} field_name
 * @param {"character" | "fractal"} [entity_type="character"]
 * @returns {string | null}
 */
export function canonicalize_field_key(field_name, entity_type = "character") {
  if (!field_name || typeof field_name !== "string") return null;
  const type = resolve_entity_type(entity_type);
  const maps = type === "fractal" ? [FLAT_LEAF_MAP.fractal, FLAT_LEAF_MAP.character] : [FLAT_LEAF_MAP.character];

  const normalized = field_name.trim().toLowerCase().replace(/\s+/g, "_");
  for (const type_map of maps) {
    const hit = type_map && type_map[normalized];
    if (hit) return hit;
  }

  const compact = normalized.replace(/[^a-z0-9]/g, "");
  if (!compact) return null;
  for (const type_map of maps) {
    if (!type_map) continue;
    for (const [alias, path] of Object.entries(type_map)) {
      if (alias.replace(/[^a-z0-9]/g, "") === compact) return path;
    }
  }
  return null;
}

/**
 * Historical entry point, kept for compatibility. Delegates to
 * canonicalize_field_key (superset: exotic-but-valid keys now resolve).
 * @param {string} field_name
 * @param {"character" | "fractal"} [entity_type="character"]
 * @returns {string | null}
 */
export function resolve_flat_path(field_name, entity_type = "character") {
  return canonicalize_field_key(field_name, entity_type);
}

/**
 * Returns the field atom for a (possibly alias, possibly human-shaped) key,
 * or null when the key addresses nothing enhanceable.
 * @param {string} entity_type
 * @param {string} key
 * @returns {FieldAtom | null}
 */
export function atom_for(entity_type, key) {
  const type = resolve_entity_type(entity_type);
  const path = canonicalize_field_key(key, type);
  if (!path) return null;
  return ATOM_BY_ID[`${type}.${path}`] || null;
}

/**
 * Maps a canonical dot-path to its Caretaker structured-output key:
 * "eternal.physical" -> "eternal_physical", "future" -> "future".
 * @param {string} path
 * @returns {string | null}
 */
export function output_key_for_path(path) {
  if (!path || typeof path !== "string") return null;
  return path.replace(/\./g, "_");
}

/**
 * Assembles the six Caretaker quadrant directives for an entity type.
 * Single home of the brief assembly prompts.js used to hand-roll with
 * per-type ternaries (whose missing fractal branch left ECOSYSTEM_SIMULATOR
 * and HISTORIAN dead). Fractal briefs now carry the fractal words.
 * @param {string} [entity_type="character"]
 * @returns {{ eternal_physical: string, eternal_non_physical: string, present_physical: string, present_non_physical: string, future: string, past: string }}
 */
export function caretaker_brief(entity_type = "character") {
  const type = resolve_entity_type(entity_type);
  const directive_for = (path) => ATOM_BY_ID[`${type}.${path}`]?.directive || "";
  return {
    eternal_physical: directive_for("eternal.physical"),
    eternal_non_physical: directive_for("eternal.non_physical"),
    present_physical: directive_for("present.physical"),
    present_non_physical: directive_for("present.non_physical"),
    future: directive_for("future"),
    past: directive_for("past"),
  };
}

// ── 2c. Caretaker Enhancer Directives (derived — single home is the leaves) ──

/**
 * Directives keyed by enhancer role, derived from FIELD_ATOMS so the words
 * exist in exactly one place (PROFILE_FIELDS leaves). Same 12 keys, same
 * strings, same order as the historical literal. Exported for Caretaker Core
 * in prompts and Profile Studio.
 */
export const ENHANCER_DIRECTIVES = Object.freeze(Object.fromEntries(FIELD_ATOMS.map((atom) => [atom.enhancer, atom.directive])));

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
 * - 2026-11-11: Schema-authority rework. PROFILE_FIELDS leaves are now the single home of
 *   all words: FIELD_ATOMS (12 quadrant atoms with per-leaf merge semantics) derive from
 *   them; PROFILE_FIELD_CATALOG and ENHANCER_DIRECTIVES are derived (same shapes/strings,
 *   zero duplication). New authority helpers: resolve_entity_type (single home of the
 *   user->character mapping), canonicalize_field_key (alias + separator-insensitive routing;
 *   resolve_flat_path now delegates), atom_for, output_key_for_path, caretaker_brief
 *   (single home of Caretaker brief assembly — wires the fractal future/past directives
 *   that prompts.js never sent). No exports removed; orphans (name/description/
 *   signature_color/pov) and tag derivation kept as-is.
 * - 2026-11-10: Folded src/data/profile-fields.js back in — FLAT_LEAF_MAP + resolve_flat_path + ENHANCER_DIRECTIVES now live here verbatim; storage/entities.js + engine/prompts.js re-pointed, storage barrel line retired, file deleted. Removed dead leaf_map inside build_profile_catalog.
 * - 2026-11-10: Renamed from profile-fields.js to profile-taxonomy.js (the storage-side
 *   profile-fields.js owned ingestion at the time: FLAT_LEAF_MAP + resolve_flat_path + ENHANCER_DIRECTIVES).
 *   Removed the unused derived leaf_map inside build_profile_catalog (computed and discarded, zero importers).
 * - 2026-10-18: Phase V Sub-item 5.4 — Enriched character and fractal 4-quadrant field descriptions with educational lorebook guidance, establishing each quadrant as an active vector slice of the world lorebook without keyword dumps.
 * - 2026-10-14: Phase IV Sub-item 4.2 — Formally registered canonical top-level pov metadata field in PROFILE_FIELDS taxonomy.
 * - 2026-10-04: Stripped per-field tense clauses from the temporal layer directives (tense now stated once via TASK_LIBRARY.TEMPORAL.TENSE); field text is pure content guidance.
 * - 2026-10-03: Instructed and preferred bracket directives across all fields (eternal/present non_physical and future) using HELPERS.BRACKETS, allowing prose while documenting bracket syntax.
 * - 2026-10-03: Consolidated HELPERS.BRACKETS and HELPERS.RELATIONAL_BRACKETS into unified BRACKETS helper documenting both standard and relational bracket syntax.
 * - 2026-10-01: Symmetrically authorized bracket directives across fractal eternal and present non_physical layers in PROFILE_FIELDS, harmonizing bracket predicate architecture.
 * - 2026-09-30: Updated non_physical field directives in PROFILE_FIELDS to document support for targeted bracket predicates and relational edges ([TARGET: dynamic | flags]) alongside natural prose, aligning with Synaptic Bracket Engine and RelationalGraph synchronization.
 * - 2026-09-16: Streamlined all entity field directives in PROFILE_FIELDS into high-density LLM instructions, eliminating conversational filler and tutorial text while preserving imperative schema contracts. Dynamic SIGNATURE_COLORS interpolation preserved.
 * - 2026-09-12: Added `signature_color` to `PROFILE_FIELDS`.
 * - 2026-09-12: Redesigned taxonomy hierarchy to entity_type -> temporal layer -> field (character -> eternal -> physical). Added distinct fractal models for future (Impending Shift) and past (World History). Simplified build_profile_catalog and build_profile_sections.
 * - 2026-09-06: Standardized field taxonomy:
 *   (1) Renamed character eternal.physical label from "Permanent Appearance" to "Physical Appearance";
 *   (2) Pruned legacy `appearance` alias from FLAT_LEAF_MAP per P4 Zero Backwards Compatibility;
 *   (3) Hardened section detection in build_profile_sections using explicit composite checks;
 *   (4) Object.freeze exported collections (PROFILE_FIELD_CATALOG, FLAT_LEAF_MAP, PROFILE_SECTIONS_BY_TYPE).
 * - 2026-08-29: Harmonized profile-fields module — enforced full-name variable nomenclature, enriched JSDoc types, and aligned universal file architecture.
 */
