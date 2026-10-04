/**
 * src/intelligence/modules/output.js
 * ============================================================================
 * 📤 OUTPUT CONTRACT MODULE — Emission Formats, Schemas & Return Shapes
 * ============================================================================
 *
 * Owns the exact return shape of every prompt: emission-format strings,
 * schema atoms, JSON-schema composition, format routing, and the
 * `<OUTPUT_FORMAT>` envelope. task.js keeps the turn-assembly machinery and
 * consumes this module; TASK_LIBRARY keeps its FORMATS key wired to
 * OUTPUT_FORMATS so directive resolution is unchanged.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation over @utils + @data.
 * - Single source of truth for output shapes; no turn logic here.
 * ============================================================================
 */

import { render_xml_tag } from "@utils";
import { PROFILE_FIELDS } from "@data";

export const OUTPUT_FORMATS = Object.freeze({
  PROSE: "After closing </THINK>, emit strictly plain prose: no preamble, commentary, markdown, or structural tags.",
  PLAIN_PROSE: "Emit strictly plain prose: no preamble, commentary, markdown, or structural tags.",
  BRACKET:
    "After closing </THINK>, emit strictly bracketed directives: [KEY: value] — one per line, no outer braces, no conversational prose outside brackets. Keys support natural spaces. Relational brackets targeting other entities or active roles MUST begin with '@': [@TARGET_ENTITY: relationship dynamic | flags] (flags: 'hide' for covert items / 'show', 'w: 1-10' importance weight). Atomic clearing: [KEY: none].",
  PLAIN_BRACKET:
    "Emit strictly bracketed directives: [KEY: value] — one per line, no outer braces, no conversational prose outside brackets. Keys support natural spaces. Relational brackets targeting other entities or active roles MUST begin with '@': [@TARGET_ENTITY: relationship dynamic | flags] (flags: 'hide' for covert items / 'show', 'w: 1-10' importance weight). Atomic clearing: [KEY: none].",
  PLAIN_TEXT: "After closing </THINK>, emit clean text: no preamble, commentary, markdown, or structural tags.",
  JSON_RETURN:
    "Return a single, COMPLETE, VALID JSON object matching this schema:\n{schema}\n\nNo preamble, no markdown backticks, no external XML tags. Output must start with { and end with }.",
});

// ============================================================================
// [SECTION 1: OUTPUT FORMATS, SCHEMAS & STATE CONTRACTS (LAYER 7)]
// ============================================================================

/**
 * Directorial and continuum schema atoms used to construct structured JSON schemas.
 * Categorized by their lifecycle role while exposed as a single frozen catalog.
 * Atoms may be a literal value or a function of the optional schema baseline.
 */
export const SCHEMA_ATOMS = Object.freeze({
  _thought_process: "<Tactical intent & state delta>",
  next_action: `'AI_CHARACTER' | 'FRACTAL' | 'npc:<id>' | { \\"genesis\\": { \\"name\\": \\"<Name>\\", \\"description\\": \\"<description>\\" } } | 'EPILOGUE_CONCLUDED' | 'EPILOGUE_COLLAPSED'`,
  keywords: ["<1-5 keywords from AVAILABLE_KEYWORDS>"],
  directors_note: "<1-5 lines staging directives ONLY for the next_action speaker (never for player/user_persona), or empty string>",
  dynamics_deltas: { chaos: 0, intensity: 0, openness: 0, affinity: 0, velocity: 0, entropy: 0 },
  visual_staging: "<optional: camera & lighting directive if scene image shifts>",
  spotlight: { enter: ["npc:<id>"], exit: ["npc:<id>"] },
  target: "'AI_CHARACTER' | 'USER_PERSONA' | 'FRACTAL' | 'NPC_<id>'",
  relationships: ["Source → Target: dynamic description"],
  prompt:
    "<Final image prompt as continuous fluid prose. Ground outputs using physical optics and real-world materials; zero quality buzzwords ('masterpiece', '8K', 'photorealistic').>",
  negative_prompt: (style_baseline = "") =>
    `<Negative tokens avoiding quality buzzwords; ground using physical artifacts and flaws.${style_baseline ? ` Style baseline: ${String(style_baseline).replace(/"/g, '\\"')}` : ""}>`,
  caption: "<in-character selfie caption>",
});

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
 * @param {{ negative_baseline?: string }} [options={}] - Optional style baseline injected into the negative_prompt atom
 * @returns {string} Formatted JSON schema template string
 */
export function render_json_schema(schema_keys, entity_type = "character", { negative_baseline = "" } = {}) {
  const resolved_entity_type = entity_type === "fractal" ? "fractal" : "character";
  const entity_model = PROFILE_FIELDS[resolved_entity_type] || PROFILE_FIELDS.character;

  const schema_lines = schema_keys
    .map((schema_key) => {
      const field_definition = entity_model[schema_key] || PROFILE_FIELDS[schema_key];

      // 1. Twin-cylinder temporal composite layers (eternal, present)
      if (field_definition?.physical?.directive && field_definition?.non_physical?.directive) {
        return `  "${schema_key}": {\n    "physical": "<${field_definition.physical.directive}>",\n    "non_physical": "<${field_definition.non_physical.directive}>"\n  }`;
      }

      // 2. Direct model or top-level metadata field (name, description, signature_color, future, past)
      if (field_definition?.directive) {
        if (field_definition.type === "array") {
          return `  "${schema_key}": [{ "content": "<${field_definition.directive}>", "emotional_weight": 1-10 }]`;
        }
        return `  "${schema_key}": "<${field_definition.directive}>"`;
      }

      // 3. Directorial and continuum atoms from SCHEMA_ATOMS
      if (schema_key in SCHEMA_ATOMS) {
        const atom_definition = SCHEMA_ATOMS[schema_key];
        const resolved_atom = typeof atom_definition === "function" ? atom_definition(negative_baseline) : atom_definition;
        const value_string = typeof resolved_atom === "string" ? `"${resolved_atom}"` : JSON.stringify(resolved_atom);
        return `  "${schema_key}": ${value_string}`;
      }

      return null;
    })
    .filter(Boolean);

  return `{\n${schema_lines.join(",\n")}\n}`;
}

/**
 * Resolves an output format directive or schema from its canonical format specification.
 * Parameter-aware: accepts an options object to dynamically parameterize CONTINUUM, PROFILE, DIRECTOR, and OPTICS schemas.
 *
 * @param {string|{ mode?: string, schema?: string[] }} [format_spec={ mode: "prose" }] - Format spec object from the PROMPTS manifest (normalized at `define_mode`).
 * @param {{ entity_type?: string, variant?: string, is_selfie?: boolean, negative_prompt?: string, fallback?: string, has_think?: boolean, is_temporal?: boolean }} [options={}]
 * @returns {string} Compiled output format directive or schema
 */
export function get_output_format(format_spec, options = {}) {
  if (!format_spec) return options.fallback || "";

  // 1. Single profile field enhancement format routing
  if (format_spec.mode === "temporal_field" || options.is_temporal !== undefined) {
    if (options.is_temporal) {
      return options.has_think !== false ? OUTPUT_FORMATS.BRACKET : OUTPUT_FORMATS.PLAIN_BRACKET;
    }
    return options.has_think !== false ? OUTPUT_FORMATS.PLAIN_TEXT : OUTPUT_FORMATS.PLAIN_PROSE;
  }

  // 2. Plain narrative prose directive (think-free variant for modes that open no <THINK> block)
  if (format_spec.mode === "prose") {
    return options.has_think === false ? OUTPUT_FORMATS.PLAIN_PROSE : OUTPUT_FORMATS.PROSE;
  }

  // 3. Structured JSON schema specification from PROMPTS manifest: { mode: "json", schema: [...] }
  if (Array.isArray(format_spec.schema)) {
    const schema_keys = [...format_spec.schema];

    if ((options.variant === "selfie" || options.is_selfie) && !schema_keys.includes("caption")) {
      schema_keys.push("caption");
    }

    return render_json_schema(schema_keys, options.entity_type || "character", {
      negative_baseline: options.negative_prompt || "",
    });
  }

  return options.fallback || "";
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
 * - 2026-10-04: Created from task.js — output emission formats, schema atoms, JSON-schema composer, format router, and `<OUTPUT_FORMAT>` envelope move here; task.js keeps turn assembly and wires FORMATS to OUTPUT_FORMATS.
 */
