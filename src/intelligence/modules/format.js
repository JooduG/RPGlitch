/**
 * src/intelligence/modules/format.js
 * ============================================================================
 * 📦 FORMAT MODULE — Output Formats, Schemas & State Contracts (Layer 7)
 * ============================================================================
 *
 * Single source of truth for Layer 7 (<OUTPUT_FORMAT>) prompt specifications,
 * JSON schemas, and state mutation contracts. Symmetrically resonates with the
 * Multi-Shot simulation lifecycle and prompt switchboard in `src/intelligence/prompts.js`:
 *
 * ── Multi-Shot Simulation Lifecycle Mapping ─────────────────────────────────
 * • Section 1: Taxonomy Atoms & Directorial / Continuum Primitives
 *              (Tactical reasoning, directorial staging, and relational graph atoms)
 * • Section 2: Universal Dynamic JSON Schema Composer
 *              (Dynamically compiles structured contracts over PROFILE_FIELDS and SCHEMA_ATOMS)
 * • Section 3: Shot 1 — Directorial State Schema (DIRECTOR)
 *              (State transitions, dynamics deltas, keyword anchors, spotlight, camera staging)
 * • Section 4: Shot 2A & Tool A — Pure Prose Output Format (PROSE)
 *              (Unpadded narrative prose directive for dialogue, action, and field enhancement)
 * • Section 5: Shot 2B — Continuum Caretaker Schema (CONTINUUM)
 *              (Temporal state mutation, memory distillation, and relational vector updates)
 * • Section 6: Tool B — Profile Ingestion Schema (PROFILE)
 *              (Universal 4-quadrant profile extraction for characters and fractals)
 * • Section 7: Master Output Format Registry & XML Envelope Compiler
 *              (OUTPUT_FORMATS dictionary, get_output_format resolver, render_output_format_xml)
 *
 * Architecture & Design Laws:
 * - Layer 7 Sovereignty: Single source of truth for prompt output contracts and schemas.
 * - Symmetrical Manifest Resonance: 1:1 reflection of prompt manifest modes and shots.
 * - Unidirectional Layer Flow: Pure string compilation without boundary bleed.
 * - Zero Sibling Imports: Layout primitives imported exclusively from @utils; taxonomies from @data.
 * - Strict Full-Name Domain Nomenclature: Zero clipped tokens or single-letter identifiers.
 * - Zero Backwards Compatibility (P4): Pure, uncompromising pre-beta architecture.
 * ============================================================================
 */

import { render_xml_tag } from "@utils";
import { PROFILE_FIELDS } from "@data";

// ============================================================================
// [SECTION 1: TAXONOMY ATOMS & DIRECTORIAL / CONTINUUM PRIMITIVES]
// ============================================================================

/**
 * Directorial and continuum schema atoms used to construct structured JSON schemas.
 * Categorized by their lifecycle role while exposed as a single frozen catalog.
 */
export const SCHEMA_ATOMS = Object.freeze({
  // ── 1.1 Shared Tactical & Cognitive Reasoning ──────────────────────────────
  _thought_process: "<Tactical intent & state delta>",

  // ── 1.2 Shot 1: Directorial State & Staging Atoms (director) ────────────────
  next_action: `'AI_CHARACTER' | 'FRACTAL' | 'npc:<id>' | { \\"genesis\\": { \\"name\\": \\"<Name>\\", \\"description\\": \\"<description>\\" } } | 'EPILOGUE_CONCLUDED' | 'EPILOGUE_COLLAPSED'`,
  keywords: ["<1-5 keywords from AVAILABLE_KEYWORDS>"],
  directors_note: "<1-5 lines staging directives for next speaker, or empty string>",
  dynamics_deltas: { chaos: 0, intensity: 0, openness: 0, affinity: 0, velocity: 0, entropy: 0 },
  visual_staging: "<optional: camera & lighting directive if scene image shifts>",
  spotlight: { enter: ["npc:<id>"], exit: ["npc:<id>"] },

  // ── 1.3 Shot 2B: Continuum Caretaker & Relational Graph Atoms (continuum) ───
  target: "'AI_CHARACTER' | 'USER_PERSONA' | 'FRACTAL' | 'NPC_<id>'",
  relationships: ["Source → Target: dynamic description"],
});
// ============================================================================
// [SECTION 2: UNIVERSAL DYNAMIC JSON SCHEMA COMPOSER]
// ============================================================================

/**
 * Universally composes a formatted JSON schema string from canonical PROFILE_FIELDS and SCHEMA_ATOMS.
 *
 * Handles:
 * 1. Twin-cylinder temporal composite layers (eternal, present) split into physical/non_physical directives.
 * 2. Scalar and array profile fields from PROFILE_FIELDS (with array emotional_weight scoring).
 * 3. Directorial and continuum atoms from SCHEMA_ATOMS.
 *
 * @param {string[]} schema_keys - Ordered array of schema keys to compile
 * @param {'character' | 'fractal' | string} [entity_type='character'] - Target entity taxonomy model
 * @returns {string} Formatted JSON schema template string
 */
export function render_json_schema(schema_keys, entity_type = "character") {
  const resolved_entity_type = entity_type === "fractal" ? "fractal" : "character";
  const entity_model = PROFILE_FIELDS[resolved_entity_type] || PROFILE_FIELDS.character;

  const schema_lines = schema_keys
    .map((schema_key) => {
      // 1. Twin-cylinder temporal composite layers (eternal, present)
      const { physical, non_physical } = entity_model[schema_key] || {};
      if (physical?.directive && non_physical?.directive) {
        return `  "${schema_key}": {\n    "physical": "<${physical.directive}>",\n    "non_physical": "<${non_physical.directive}>"\n  }`;
      }

      // 2. Direct model or top-level metadata field (name, description, signature_color, future, past)
      const field_definition = entity_model[schema_key] || PROFILE_FIELDS[schema_key];
      if (field_definition?.directive) {
        const field_directive = field_definition.directive;
        if (field_definition.type === "array") {
          return `  "${schema_key}": [{ "content": "<${field_directive}>", "emotional_weight": 1-10 }]`;
        }
        return `  "${schema_key}": "<${field_directive}>"`;
      }

      // 3. Directorial and continuum atoms from SCHEMA_ATOMS
      if (schema_key in SCHEMA_ATOMS) {
        const atom_definition = SCHEMA_ATOMS[schema_key];
        const value_string = typeof atom_definition === "string" ? `"${atom_definition}"` : JSON.stringify(atom_definition);
        return `  "${schema_key}": ${value_string}`;
      }

      return null;
    })
    .filter(Boolean);

  return `{\n${schema_lines.join(",\n")}\n}`;
}

// ============================================================================
// [SECTION 3: SHOT 1 — DIRECTORIAL STATE SCHEMA (DIRECTOR)]
// ============================================================================

/**
 * Builds the canonical LLM-optimized JSON schema string for Director turn staging (Shot 1).
 * @returns {string}
 */
export function get_director_schema() {
  return render_json_schema(["_thought_process", "next_action", "keywords", "directors_note", "dynamics_deltas", "visual_staging", "spotlight"]);
}

// ============================================================================
// [SECTION 4: SHOT 2A & TOOL A — PURE PROSE OUTPUT FORMAT (PROSE)]
// ============================================================================

/**
 * Plain prose emission instruction for Story Prose turns (interaction, ghostwrite, npc, narrator)
 * and single profile field expansion (enhancement).
 * @type {string}
 */
export const PROSE_FORMAT = "Emit strictly plain prose. No preamble, commentary, markdown, or structural tags.";

// ============================================================================
// [SECTION 5: SHOT 2B — CONTINUUM CARETAKER SCHEMA (CONTINUUM)]
// ============================================================================

/**
 * Builds the canonical LLM-optimized JSON schema string for the Continuum Caretaker (Shot 2B)
 * based on the target entity taxonomy type.
 * @param {'character' | 'fractal' | string} [entity_type='character']
 * @returns {string}
 */
export function get_continuum_schema(entity_type = "character") {
  return render_json_schema(["_thought_process", "target", "eternal", "present", "future", "past", "relationships"], entity_type);
}

// ============================================================================
// [SECTION 6: TOOL B — PROFILE INGESTION SCHEMA (PROFILE)]
// ============================================================================

/**
 * Builds the canonical LLM-optimized JSON schema string for profile extraction (Tool B: sorting)
 * based on the target entity taxonomy type.
 * @param {'character' | 'fractal' | string} [entity_type='character']
 * @returns {string}
 */
export function get_profile_schema(entity_type = "character") {
  return render_json_schema(["name", "description", "signature_color", "eternal", "present", "past", "future"], entity_type);
}

// ============================================================================
// [SECTION 7: MASTER OUTPUT FORMAT REGISTRY & XML ENVELOPE COMPILER]
// ============================================================================

/**
 * Frozen master registry of all prompt output format specifications.
 * Symmetrically keyed to the format properties in `src/intelligence/prompts.js`:
 * - PROSE: Plain unpadded narrative prose
 * - DIRECTOR: Shot 1 Director Quick Shot JSON schema
 * - PROFILE: Tool B Structurer Profile Ingestion JSON schema
 * - CONTINUUM: Shot 2B Continuum Caretaker JSON schema
 */
export const OUTPUT_FORMATS = Object.freeze({
  PROSE: PROSE_FORMAT,
  DIRECTOR: get_director_schema(),
  PROFILE: get_profile_schema("character"),
  CONTINUUM: get_continuum_schema("character"),
});

const DYNAMIC_SCHEMAS = Object.freeze({
  CONTINUUM: get_continuum_schema,
  PROFILE: get_profile_schema,
});

/**
 * Resolves an output format, schema, or contract string from its canonical format key.
 * Parameter-aware: accepts an entity type or options object to dynamically parameterize CONTINUUM and PROFILE schemas.
 * @param {string} [format_key] - Format key matching OUTPUT_FORMATS ("PROSE", "DIRECTOR", "CONTINUUM", "PROFILE")
 * @param {string|{ entity_type?: string, target_type?: string, resolved_type?: string, fallback?: string }} [options_or_fallback=""]
 * @returns {string}
 */
export function get_output_format(format_key, options_or_fallback = "") {
  if (!format_key) return typeof options_or_fallback === "string" ? options_or_fallback : "";
  const fallback = typeof options_or_fallback === "string" ? options_or_fallback : options_or_fallback?.fallback || "";
  const entity_type =
    typeof options_or_fallback === "object" && options_or_fallback !== null
      ? options_or_fallback.entity_type || options_or_fallback.target_type || options_or_fallback.resolved_type || "character"
      : "character";

  const dynamic_resolver = DYNAMIC_SCHEMAS[format_key];
  if (dynamic_resolver) return dynamic_resolver(entity_type);

  return OUTPUT_FORMATS[format_key] || fallback;
}

/**
 * Compiles a dedicated <OUTPUT_FORMAT> XML envelope block.
 *
 * @param {Object} parameters
 * @param {string} [parameters.mode=""] - Optional mode attribute (e.g. "json", "prose")
 * @param {string} parameters.content - Body content of the output format directive
 * @param {number} [parameters.indent_level=2] - Indentation spaces
 * @returns {string} Formatted XML block or empty string if content is blank
 */
export function render_output_format_xml({ mode = "", content = "", indent_level = 2 }) {
  const trimmed_content = String(content || "").trim();
  if (!trimmed_content) return "";
  return render_xml_tag({
    tag: "OUTPUT_FORMAT",
    attrs: mode ? { mode } : {},
    children: [trimmed_content],
    child_indent: indent_level,
  });
}

/**
 * CHANGELOG
 * - 2026-09-16: Merged/repatriated SCHEMA_FIELD_DESCRIPTORS directly into PROFILE_FIELDS in src/data/definitions/profile-fields.js. Streamlined render_json_schema to read concise directives directly from PROFILE_FIELDS, eliminating parallel descriptor models and redundant fallback logic.
 * - 2026-09-16: Clarified non_physical field descriptors in SCHEMA_FIELD_DESCRIPTORS to specify prose only (prohibiting bracket-dicts or key-value pairs) to prevent Continuum Caretaker format bleed.
 * - 2026-09-15: Parameter-Aware Layer 7 Resolution — Enhanced get_output_format with entity-type options parameter routing for CONTINUUM, PROFILE, DIRECTOR, and PROSE formats, making manifest Layer 7 fully load-bearing.
 * - 2026-09-13: Token Optimization pass: (1) Streamlined SCHEMA_ATOMS (_thought_process, keywords, directors_note, visual_staging) to eliminate conversational human fluff; (2) Compacted PROSE_FORMAT from 26 words down to 11 words while preserving plain prose contract; (3) Introduced high-density SCHEMA_FIELD_DESCRIPTORS in render_json_schema for character and fractal schemas, cutting CONTINUUM and PROFILE schema tokens by ~68% without impacting UI profile field definitions.
 * - 2026-09-13: Refactor & Symmetrical Harmonization: (1) Rebuilt format.js into 7 cleanly separated sections mirroring the Multi-Shot simulation lifecycle in src/intelligence/prompts.js (Taxonomy Atoms, Universal Composer, Shot 1 Director, Shot 2A Prose, Shot 2B Continuum, Tool B Profile Ingestion, Section 7 Master Registry); (2) Categorized SCHEMA_ATOMS by lifecycle role while preserving unified frozen export; (3) Added dedicated get_director_schema() and PROSE_FORMAT exports; (4) Enforced Full-Name domain nomenclature across all parameters and variables (schema_keys, resolved_entity_type, field_definition, atom_definition, value_string, format_key, fallback_value, trimmed_content); (5) Maintained 100% zero-sibling module purity.
 * - 2026-09-12: Standardization pass — render_output_format_xml now delegates to the shared `render_xml_tag` composer; header + section numbering corrected (CONTINUUM, not MEMORY_FORGE). Positioned as the reference blueprint for the modules/ layer.
 * - 2026-09-12: Introduced `SCHEMA_ATOMS` and universal schema composer `render_json_schema(keys, entity_type)` unifying `DIRECTOR`, `PROFILE`, and `MEMORY_FORGE` schemas directly onto `PROFILE_FIELDS` with zero hardcoding or drift.
 * - 2026-09-12: Added `get_profile_schema(entity_type)` and `get_memory_forge_schema(entity_type)` to dynamically generate entity-type specific JSON schemas for characters and fractals.
 * - 2026-09-12: Deconstructed, merged, and rebuilt OUTPUT_FORMATS into cohesive, purpose-driven keys. Unified BRACKETS with PSEUDO_JSON, and array outputs into MEMORIES. Stripped redundant negative repetition and hardcoded colors from PROFILE schema. Added canonical alias mapping in get_output_format.
 * - 2026-09-12: Converted OUTPUT_FORMATS keys to SCREAMING_SNAKE_CASE. get_output_format normalizes lowercase/kebab keys automatically.
 * - 2026-09-12: Ground-up pure rebuild (P4 Zero Backwards Compatibility). Consolidated all schemas, contracts, and formats into single frozen OUTPUT_FORMATS object. Relocated auxiliary profile instruction renderers to task.js.
 */
