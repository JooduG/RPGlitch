/**
 * src/intelligence/modules/format.js
 * ============================================================================
 * 📦 OUTPUT FORMATS, SCHEMAS & STATE CONTRACTS
 * ============================================================================
 *
 * Single source of truth for prompt output specifications, JSON schemas,
 * and state mutation contracts:
 * - SCHEMA_ATOMS: canonical director/task schema atoms
 * - render_json_schema(keys, entity_type): universal schema composer over PROFILE_FIELDS
 * - OUTPUT_FORMATS dictionary with SCREAMING_SNAKE_CASE keys:
 *   PROSE, DIRECTOR, PROFILE, CONTINUUM
 * - get_output_format() resolver for canonical keys
 * - render_output_format_xml() dedicated envelope compiler
 *
 * This module is the reference blueprint for the other `modules/*` files:
 * a frozen catalog + a key resolver + pure string compilers, nothing else.
 *
 * Architecture & Modification Rules:
 * - Zero backward compatibility (P4): single frozen catalog.
 * - Unidirectional layer flow: pure string compilation.
 * - Zero sibling imports: layout utilities imported exclusively from @utils.
 * ============================================================================
 */

import { render_xml_tag } from "@utils";
import { PROFILE_FIELDS } from "@data";

// ── 0. Canonical Schema Atoms & Universal Composer ────────────────────────────

export const SCHEMA_ATOMS = Object.freeze({
  _thought_process: "<ONE short sentence: tactical intent & state delta>",
  next_action: `'AI_CHARACTER' | 'FRACTAL' | 'npc:<id>' | { \\"genesis\\": { \\"name\\": \\"<Name>\\", \\"description\\": \\"<description>\\" } } | 'EPILOGUE_CONCLUDED' | 'EPILOGUE_COLLAPSED'`,
  keywords: ["<1-5 keywords from <AVAILABLE_KEYWORDS>>"],
  directors_note: "<1-5 lines of unseen acting/staging directives for next speaker, or empty string>",
  dynamics_deltas: { chaos: 0, intensity: 0, openness: 0, affinity: 0, velocity: 0, entropy: 0 },
  visual_staging: "<optional: 1 line camera & lighting directive ONLY if triggering scene image shift, else omit>",
  spotlight: { enter: ["npc:<id>"], exit: ["npc:<id>"] },
  target: "'AI_CHARACTER' | 'USER_PERSONA' | 'FRACTAL' | 'NPC_<id>'",
  relationships: ["Source → Target: dynamic description"],
});

/**
 * Universally composes a formatted JSON schema string from canonical PROFILE_FIELDS and SCHEMA_ATOMS.
 * @param {string[]} keys - Ordered array of schema keys to include
 * @param {'character' | 'fractal' | string} [entity_type='character']
 * @returns {string}
 */
export function render_json_schema(keys, entity_type = "character") {
  const resolved_type = entity_type === "fractal" ? "fractal" : "character";
  const model = PROFILE_FIELDS[resolved_type] || PROFILE_FIELDS.character;

  const lines = keys
    .map((key) => {
      // 1. Twin-Cylinder temporal composite layers (eternal, present)
      if (model[key]?.physical && model[key]?.non_physical) {
        return `  "${key}": {\n    "physical": "<${model[key].physical.directive}>",\n    "non_physical": "<${model[key].non_physical.directive}>"\n  }`;
      }

      // 2. Direct model or top-level metadata field (name, description, signature_color, future, past)
      const field = model[key] || PROFILE_FIELDS[key];
      if (field?.directive) {
        if (field.type === "array") {
          return `  "${key}": [{ "content": "<${field.directive}>", "emotional_weight": 1-10 }]`;
        }
        return `  "${key}": "<${field.directive}>"`;
      }

      // 3. Directorial and task atoms from SCHEMA_ATOMS
      if (key in SCHEMA_ATOMS) {
        const atom = SCHEMA_ATOMS[key];
        const val_str = typeof atom === "string" ? `"${atom}"` : JSON.stringify(atom);
        return `  "${key}": ${val_str}`;
      }

      return null;
    })
    .filter(Boolean);

  return `{\n${lines.join(",\n")}\n}`;
}

/**
 * Builds a clean, LLM-optimized JSON schema string for profile extraction based on entity type.
 * @param {'character' | 'fractal' | string} [entity_type='character']
 * @returns {string}
 */
export function get_profile_schema(entity_type = "character") {
  return render_json_schema(["name", "description", "signature_color", "eternal", "present", "past", "future"], entity_type);
}

/**
 * Builds a clean, LLM-optimized JSON schema string for the Continuum Caretaker based on target entity type.
 * @param {'character' | 'fractal' | string} [entity_type='character']
 * @returns {string}
 */
export function get_continuum_schema(entity_type = "character") {
  return render_json_schema(["_thought_process", "target", "eternal", "present", "future", "past", "relationships"], entity_type);
}

// ── 1. Consolidated Output Formats, Schemas & State Contracts ─────────────────

export const OUTPUT_FORMATS = Object.freeze({
  // --- 1. Primitive Output Rules ---

  PROSE: `Emit ONLY the field content as plain prose. No preamble, no commentary, no markdown labels or structural tags. Return the text itself.`,

  // --- 2. Specialized Task Schemas ---

  DIRECTOR: render_json_schema(["_thought_process", "next_action", "keywords", "directors_note", "dynamics_deltas", "visual_staging", "spotlight"]),

  PROFILE: get_profile_schema("character"),

  CONTINUUM: get_continuum_schema("character"),
});

// ── 2. Resolvers & Helpers ───────────────────────────────────────────────────

/**
 * Resolves an output format, schema, or contract string from its key.
 * @param {string} key
 * @param {string} [fallback=""]
 * @returns {string}
 */
export function get_output_format(key, fallback = "") {
  return OUTPUT_FORMATS[key] || fallback;
}

// ── 3. Output Format XML Renderers ───────────────────────────────────────────

/**
 * Compiles a dedicated <OUTPUT_FORMAT> XML block.
 * @param {Object} params
 * @param {string} [params.mode] - Optional mode attribute (e.g. "json", "prose", "brackets")
 * @param {string} params.content - Body text of the output format directive
 * @param {number} [params.indent_level=2] - Indentation spaces
 * @returns {string}
 */
export function render_output_format_xml({ mode = "", content = "", indent_level = 2 }) {
  const trimmed = String(content || "").trim();
  if (!trimmed) return "";
  return render_xml_tag({ tag: "OUTPUT_FORMAT", attrs: { mode }, children: [trimmed], child_indent: indent_level });
}

/**
 * CHANGELOG
 * - 2026-09-12: Standardization pass — render_output_format_xml now delegates to the shared `render_xml_tag` composer; header + section numbering corrected (CONTINUUM, not MEMORY_FORGE). Positioned as the reference blueprint for the modules/ layer.
 * - 2026-09-12: Introduced `SCHEMA_ATOMS` and universal schema composer `render_json_schema(keys, entity_type)` unifying `DIRECTOR`, `PROFILE`, and `MEMORY_FORGE` schemas directly onto `PROFILE_FIELDS` with zero hardcoding or drift.
 * - 2026-09-12: Added `get_profile_schema(entity_type)` and `get_memory_forge_schema(entity_type)` to dynamically generate entity-type specific JSON schemas for characters and fractals.
 * - 2026-09-12: Deconstructed, merged, and rebuilt OUTPUT_FORMATS into cohesive, purpose-driven keys. Unified BRACKETS with PSEUDO_JSON, and array outputs into MEMORIES. Stripped redundant negative repetition and hardcoded colors from PROFILE schema. Added canonical alias mapping in get_output_format.
 * - 2026-09-12: Converted OUTPUT_FORMATS keys to SCREAMING_SNAKE_CASE. get_output_format normalizes lowercase/kebab keys automatically.
 * - 2026-09-12: Ground-up pure rebuild (P4 Zero Backwards Compatibility). Consolidated all schemas, contracts, and formats into single frozen OUTPUT_FORMATS object. Relocated auxiliary profile instruction renderers to task.js.
 */
