/**
 * src/intelligence/modules/output.js
 * ============================================================================
 * 📤 OUTPUT CONTRACT MODULE — Output Plans, Schemas & Return Shapes
 * ============================================================================
 *
 * Owns the exact return shape of every prompt. Two stages, mirroring the
 * entities.js / history.js plan split:
 *
 * 1. Pure-data plans (`resolve_output_plan`) decide WHAT the output shape is:
 *    prose, bracket, or json — plus the compiled body, the schema keys
 *    behind it, and the keys that rendered nothing (`warnings`). Every routing
 *    decision is plan data.
 * 2. Thin renderers (`render_output_plan`, `render_json_return`) map plans to
 *    strings and the `<OUTPUT_FORMAT>` envelope without branching.
 *
 * `get_output_format` is a one-line body reader over the plan (existing
 * builder call sites unchanged). task.js collapses its three output slots
 * into one `output_format` resolver over the same plan vocabulary.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation over @utils + @data.
 * - Single source of truth for output shapes; no turn logic here.
 * - Close-and-conceal contract: every prose/bracket body assumes the mode's think block (or
 *   optics calibration) is sealed and invisible before the output starts — bodies never
 *   re-open, reference, or leak think content (Track 0.5).
 * ============================================================================
 */

import { render_xml_tag } from "@utils";
import { PROFILE_FIELDS } from "@data";

export const OUTPUT_FORMATS = Object.freeze({
  PROSE: "After closing </THINK>, emit strictly plain prose: no preamble, commentary, markdown, or structural tags.",
  PLAIN_PROSE: "Emit strictly plain prose: no preamble, commentary, markdown, or structural tags.",
  BRACKET:
    "After closing </THINK>, emit strictly bracketed directives: [KEY: value] — one per line, no outer braces, no conversational prose outside brackets. Keys support natural spaces. Relational brackets targeting other entities or active roles MUST begin with '@': [@TARGET_ENTITY: relationship dynamic | flags] (flags: 'hide' for covert items / 'show', 'w: 1-10' importance weight). Atomic clearing: [KEY: none].",
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
  alternative_branches: [{ label: "<branch label>", dialogue: "<alternative dialogue line for user-guided exploration, or empty>" }],
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
 * Resolves one schema key to its formatted `"key": value` line, or null when
 * the key names nothing renderable. Single home of the per-key dispatch so the
 * composer and the plan warnings below can never disagree.
 *
 * @param {string} schema_key
 * @param {Record<string, any>} entity_model - PROFILE_FIELDS taxonomy model
 * @param {string} [negative_baseline=""]
 * @returns {string|null}
 */
function render_schema_key_line(schema_key, entity_model, negative_baseline = "") {
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
}

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

  const schema_lines = schema_keys.map((schema_key) => render_schema_key_line(schema_key, entity_model, negative_baseline)).filter(Boolean);

  return `{\n${schema_lines.join(",\n")}\n}`;
}

// ============================================================================
// [SECTION 2: OUTPUT PLANS — PURE DATA, NO XML]
// ============================================================================

/**
 * Resolves a format specification plus turn flags into a frozen output plan.
 * Every routing decision (temporal vs prose vs json, think-aware emission
 * variant, schema keys, silent-drop warnings) is plan data — renderers below
 * map plans to strings without branching.
 *
 * Stage order:
 * 1. Empty spec → `empty` plan carrying the fallback body.
 * 2. Temporal-field routing — explicit `is_temporal: true` or a
 *    `temporal_field` manifest mode. (The old `is_temporal !== undefined`
 *    tripwire is retired: an explicit `false` now routes by mode.)
 * 3. Plain narrative prose directive.
 * 4. Structured JSON schema from the manifest `schema` key list (selfie
 *    variants gain `caption`); keys rendering nothing land in `warnings`.
 * 5. Anything else → `empty` plan carrying the fallback body.
 *
 * @param {Object} [parameters={}]
 * @param {string|{ mode?: string, schema?: string[] }|null} [parameters.format_spec={ mode: "prose" }] - Format spec from the PROMPTS manifest.
 * @param {boolean} [parameters.has_think=true] - Whether the mode opens a `<THINK>` block (selects think-aware emission variants).
 * @param {string} [parameters.entity_type="character"] - Target entity taxonomy model.
 * @param {string} [parameters.variant] - Schema variant (`"selfie"` gains a caption key).
 * @param {boolean} [parameters.is_selfie=false] - Selfie alias for the caption variant.
 * @param {string} [parameters.negative_baseline=""] - Style baseline injected into the negative_prompt atom.
 * @param {boolean} [parameters.is_temporal] - Explicit temporal-field routing (builder passes it only when true).
 * @param {string} [parameters.fallback=""] - Body for unroutable specs.
 * @returns {Readonly<{ kind: "prose"|"bracket"|"json"|"empty", body: string,
 *   schema_keys: ReadonlyArray<string>, warnings: ReadonlyArray<string> }>}
 */
export function resolve_output_plan({
  format_spec = { mode: "prose" },
  has_think = true,
  entity_type = "character",
  variant,
  is_selfie = false,
  negative_baseline = "",
  is_temporal,
  fallback = "",
} = {}) {
  if (!format_spec) {
    // 1. Empty spec → `empty` plan carrying the fallback body.
    return Object.freeze({ kind: "empty", body: fallback, schema_keys: Object.freeze([]), warnings: Object.freeze([]) });
  }

  // 2. Single profile field enhancement format routing: temporal fields emit
  //    bracketed directives; non-temporal fields fall through to the prose directive.
  if ((format_spec.mode === "temporal_field" || is_temporal === true) && is_temporal) {
    return Object.freeze({ kind: "bracket", body: OUTPUT_FORMATS.BRACKET, schema_keys: Object.freeze([]), warnings: Object.freeze([]) });
  }

  // 3. Plain narrative prose directive (think-free variant for modes that open no <THINK> block)
  if (format_spec.mode === "prose" || format_spec.mode === "temporal_field") {
    const body = has_think === false ? OUTPUT_FORMATS.PLAIN_PROSE : OUTPUT_FORMATS.PROSE;
    return Object.freeze({ kind: "prose", body, schema_keys: Object.freeze([]), warnings: Object.freeze([]) });
  }

  // 4. Structured JSON schema specification from PROMPTS manifest: { mode: "json", schema: [...] }
  if (Array.isArray(format_spec.schema)) {
    const schema_keys = [...format_spec.schema];
    if ((variant === "selfie" || is_selfie) && !schema_keys.includes("caption")) {
      schema_keys.push("caption");
    }
    const resolved_entity_type = entity_type || "character";
    const entity_model = PROFILE_FIELDS[resolved_entity_type] || PROFILE_FIELDS.character;
    const warnings = schema_keys.filter((schema_key) => render_schema_key_line(schema_key, entity_model, negative_baseline) == null);
    const body = render_json_schema(schema_keys, resolved_entity_type, { negative_baseline });
    return Object.freeze({ kind: "json", body, schema_keys: Object.freeze(schema_keys), warnings: Object.freeze(warnings) });
  }

  // 5. Anything else → `empty` plan carrying the fallback body.
  return Object.freeze({ kind: "empty", body: fallback, schema_keys: Object.freeze([]), warnings: Object.freeze([]) });
}

// ============================================================================
// [SECTION 3: THIN PLAN RENDERERS — NO DECISIONS, ONLY STRINGS]
// ============================================================================

/**
 * Interpolates a compiled schema string into the JSON-return emission template.
 *
 * @param {string|null|undefined} schema - Compiled JSON schema (or pre-rendered schema text)
 * @returns {string}
 */
export function render_json_return(schema) {
  return OUTPUT_FORMATS.JSON_RETURN.replace("{schema}", schema != null ? String(schema) : "");
}

/**
 * Maps an output plan to its body string (pre-routed `external` bodies pass through verbatim).
 *
 * @param {{ kind: string, body: string }|null|undefined} plan
 * @returns {string}
 */
export function render_output_plan_body(plan) {
  return plan ? String(plan.body ?? "") : "";
}

/**
 * Maps an output plan to the `<OUTPUT_FORMAT>` envelope block.
 *
 * @param {{ kind: string, body: string }|null|undefined} plan - Resolved plan, or an ad-hoc `{ kind: "external", body }` pre-routed body.
 * @param {Object} [options={}]
 * @param {string} [options.mode="prose"] - Envelope mode attribute.
 * @param {number} [options.indent=2] - Indentation spaces.
 * @returns {string} Formatted XML block or empty string if the body is blank.
 */
export function render_output_plan(plan, { mode = "prose", indent = 2 } = {}) {
  return render_output_format_xml({ mode, content: render_output_plan_body(plan), indent });
}

/**
 * Resolves an output format directive or schema from its canonical format specification.
 * Thin body reader over `resolve_output_plan` — all routing decisions are plan data.
 *
 * @param {string|{ mode?: string, schema?: string[] }} [format_spec={ mode: "prose" }] - Format spec object from the PROMPTS manifest (normalized at `define_mode`).
 * @param {{ entity_type?: string, variant?: string, is_selfie?: boolean, negative_prompt?: string, fallback?: string, has_think?: boolean, is_temporal?: boolean }} [options={}]
 * @returns {string} Compiled output format directive or schema
 */
export function get_output_format(format_spec, options = {}) {
  return resolve_output_plan({
    format_spec,
    has_think: options.has_think ?? true,
    entity_type: options.entity_type,
    variant: options.variant,
    is_selfie: options.is_selfie,
    negative_baseline: options.negative_prompt || "",
    is_temporal: options.is_temporal,
    fallback: options.fallback || "",
  }).body;
}

/**
 * Compiles a dedicated <OUTPUT_FORMAT> XML envelope block.
 *
 * @param {Object} parameters
 * @param {string} [parameters.mode=""] - Optional mode attribute (e.g. "json", "prose")
 * @param {string} parameters.content - Body content of the output format directive
 * @param {number} [parameters.indent=2] - Indentation spaces
 * @returns {string} Formatted XML block or empty string if content is blank
 */
export function render_output_format_xml({ mode = "", content = "", indent = 2 }) {
  const trimmed_content = String(content || "").trim();
  if (!trimmed_content) return "";
  return render_xml_tag({
    tag: "OUTPUT_FORMAT",
    attrs: mode ? { mode } : {},
    children: [trimmed_content],
    child_indent: indent,
  });
}

/**
 * CHANGELOG
 * - Track 0.5: Documented the close-and-conceal contract (output bodies assume a sealed, invisible think block).
 * - 2026-10-04: Added OUTPUT_DIRECTIVES (DATA return-shape directive, new home for the ex-protocol DATA atom).
 * - 2026-10-04: Plan/render split (Plan 2) — `resolve_output_plan` owns all routing as frozen pure data (kind/body/schema_keys/warnings), `render_output_plan` maps plans to the envelope without branching; `render_json_return` owns the schema interpolation; per-key dispatch factored into `render_schema_key_line` so composer and warnings agree; `get_output_format` is a thin body reader; retired the `is_temporal !== undefined` tripwire (explicit false now routes by mode); `render_output_format_xml` uses canonical `indent`.
 * - 2026-10-04: Created from task.js — output emission formats, schema atoms, JSON-schema composer, format router, and `<OUTPUT_FORMAT>` envelope move here; task.js keeps turn assembly and wires FORMATS to OUTPUT_FORMATS.
 */
