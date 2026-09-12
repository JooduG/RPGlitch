/**
 * src/intelligence/modules/system.js
 * ============================================================================
 * 🌐 SYSTEM PROMPT MODULE — Root Envelope, Role Lines & Stability Locks
 * ============================================================================
 *
 * Provides root <SYSTEM> XML envelope construction, role line formatting,
 * and structural stability-lock error recovery text.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation.
 * - Single source of truth for <SYSTEM> open tag, closing tag, and role lines.
 * ============================================================================
 */

import { escape_xml } from "@utils";

// ── 1. Role Line Formatter ───────────────────────────────────────────────────

export const SYSTEM_ROLES = Object.freeze({
  DEFAULT: (speaker_name, listener_name, fractal_name) =>
    `You are ${speaker_name} within the FRACTAL ${fractal_name}, interacting with ${listener_name}. Embody this role with uncompromised fidelity under the laws and directives below.`,
  NPC: (speaker_name, listener_name, fractal_name) =>
    `You are ${speaker_name}, a supporting character within the FRACTAL ${fractal_name}, interacting with ${listener_name}. Embody this role with uncompromised fidelity under the laws and directives below.`,
  NARRATOR: (speaker_name) =>
    `You are ${speaker_name}, the Fractal itself, narrating the story. Embody this role with uncompromised fidelity under the laws and directives below.`,
  DIRECTOR: () => "You are the Director — the unseen intelligence orchestrating the mechanical state of the simulation.",
  CONTINUUM_CARETAKER: (target_name) =>
    `You are the Continuum Caretaker for target entity "${target_name}". Analyze recent events and consolidate temporal state under the contract below.`,
  NARRATIVE_STRUCTURER: () => "You are the Narrative Structurer, extracting structured profile fragments from raw narrative prose.",
  ENHANCER: (enhancer_name = "GENERAL") =>
    `You are the ${enhancer_name} Profile Enhancer, refining and expanding targeted entity profile dimensions.`,
});

/**
 * Renders a `<ROLE name="...">...</ROLE>` XML block.
 * @param {string} name
 * @param {string} content
 * @returns {string}
 */
export function render_role_xml(name, content) {
  return `<ROLE name="${escape_xml(name)}">${content}</ROLE>`;
}

/**
 * Resolves the appropriate system role line from a manifest role key.
 * @param {Object} [params]
 * @param {string} [params.role="DEFAULT"] - Key into SYSTEM_ROLES (DEFAULT | NPC | NARRATOR).
 * @param {string} [params.speaker_name=""]
 * @param {string} [params.listener_name=""]
 * @param {string} [params.fractal_name=""]
 * @returns {string}
 */
export function resolve_system_role_line({ role = "DEFAULT", speaker_name = "", listener_name = "", fractal_name = "" } = {}) {
  switch (role) {
    case "NARRATOR":
      return SYSTEM_ROLES.NARRATOR(speaker_name);
    case "NPC":
      return SYSTEM_ROLES.NPC(speaker_name, listener_name, fractal_name);
    default:
      return SYSTEM_ROLES.DEFAULT(speaker_name, listener_name, fractal_name);
  }
}

// ── 2. Stability Lock Messages & Truncation Recovery ─────────────────────────

export const STABILITY_LOCK = Object.freeze({
  WARNING: "WARNING: Structural drift detected. Maintain disciplined XML closures and clean markdown boundaries.",
  CRITICAL: "CRITICAL: Structural collapse. Re-anchor immediately. Every XML tag must close cleanly.",
});

/** Completion directive appended to prompt when reply was cut off by token limit. */
export const TRUNCATION_COMPLETE_NOTE =
  "\n\nIMPORTANT: Your previous reply was cut off mid-sentence. Finish this response IMMEDIATELY: do not repeat any earlier text, do not rehash events, just bring the current moment to a natural close with a complete sentence, then stop.";

/**
 * Resolves the stability-lock warning from transport metadata.
 * @param {any} meta
 * @returns {string}
 */
export function resolve_stability_lock(meta) {
  if (meta?.structural_errors >= 3) return STABILITY_LOCK.CRITICAL;
  if (meta?.structural_errors >= 1) return STABILITY_LOCK.WARNING;
  return "";
}

// ── 3. System Envelope Constructors ──────────────────────────────────────────

/**
 * Builds the opening `<SYSTEM>` XML tag with round and mode attributes.
 * @param {number|string|null} round
 * @param {string} mode
 * @returns {string}
 */
export function open_system_tag(round, mode) {
  const round_val = escape_xml(String(round ?? 0));
  const mode_val = escape_xml(String(mode || "interaction"));
  return `<SYSTEM round="${round_val}" mode="${mode_val}">`;
}

/**
 * The standard closing tag for the system envelope.
 */
export const SYSTEM_CLOSE_TAG = "</SYSTEM>";

/**
 * Builds the complete system envelope for story/narrator prose prompts.
 * @param {Object} params
 * @param {number|string|null} params.round
 * @param {string} params.mode
 * @param {string} params.role_line
 * @param {string} params.constitution
 * @param {string} params.core
 * @param {string} params.entities_block
 * @returns {string}
 */
export function render_prose_system_xml({ round, mode, role_line, constitution, core, entities_block }) {
  const open_tag = open_system_tag(round, mode);
  return `\n${open_tag}\n${role_line}\n${constitution}\n\n${core}\n\n${entities_block}\n`.trim();
}

/**
 * Builds the complete system envelope for Director prompts.
 * @param {Object} params
 * @param {string} [params.role_xml]
 * @param {string} params.dynamics_xml
 * @param {string} params.style_xml
 * @param {string} params.entity_sheets
 * @param {string} params.keyword_directives_xml
 * @param {string} params.protocols_xml
 * @param {string} params.spotlight_xml
 * @returns {string}
 */
export function render_director_system_xml({
  role_xml,
  dynamics_xml,
  style_xml,
  entity_sheets,
  keyword_directives_xml,
  protocols_xml,
  spotlight_xml,
}) {
  const resolved_role_xml = role_xml || render_role_xml("DIRECTOR", SYSTEM_ROLES.DIRECTOR());
  const parts = [
    '<SYSTEM mode="director">',
    `  ${resolved_role_xml}`,
    `  ${dynamics_xml}`,
    `  ${style_xml}`,
    entity_sheets,
    "",
    keyword_directives_xml,
    "",
    "  <PROTOCOLS>",
    `    ${protocols_xml}`,
    "  </PROTOCOLS>",
    "",
    spotlight_xml ? `  ${spotlight_xml}` : null,
    SYSTEM_CLOSE_TAG,
  ];
  return parts
    .filter((p) => p != null)
    .join("\n")
    .trim();
}

/**
 * Builds the complete system envelope for Memory Forge prompts.
 * @param {Object} params
 * @param {string} params.target_name
 * @param {string} params.protocols_xml
 * @param {string} params.target_xml
 * @param {string} [params.scene_cast_xml]
 * @param {string} [params.chapter_xml]
 * @param {string} params.history_xml
 * @param {string} params.task_xml
 * @returns {string}
 */
export function render_memory_system_xml({ target_name, protocols_xml, target_xml, scene_cast_xml = "", chapter_xml = "", history_xml, task_xml }) {
  return `
<SYSTEM role="CONTINUUM_CARETAKER" target="${escape_xml(target_name)}">
  <PROTOCOLS>
    ${protocols_xml}
  </PROTOCOLS>
  <TARGET_ENTITY_CONTEXT>
${target_xml}
  </TARGET_ENTITY_CONTEXT>
${scene_cast_xml}${chapter_xml ? `  <CHAPTER_HISTORY>\n    ${chapter_xml}\n  </CHAPTER_HISTORY>\n` : ""}${history_xml}
${task_xml}
</SYSTEM>
  `.trim();
}

/**
 * Builds the complete system envelope for Profile Enhancement prompts.
 * @param {Object} params
 * @param {string} params.role
 * @param {string} params.enhancing
 * @param {string} params.field
 * @param {string} params.instructions_xml
 * @param {string} params.protocols_xml
 * @param {string} params.contract_xml
 * @param {string} [params.layer_key]
 * @param {string} [params.field_context_xml]
 * @param {string} params.input_content
 * @returns {string}
 */
export function render_enhancement_system_xml({
  role,
  enhancing,
  field,
  instructions_xml,
  protocols_xml,
  contract_xml,
  layer_key = "",
  field_context_xml = "",
  input_content,
}) {
  const layer_line = layer_key ? `<LAYER>${escape_xml(layer_key)}</LAYER>\n  ` : "";
  const context_line = field_context_xml ? `${field_context_xml}\n  ` : "";
  return `
<SYSTEM role="${escape_xml(role || "GENERAL")}" enhancing="${escape_xml(enhancing || "")}" field="${escape_xml(field)}">
${instructions_xml}
  <PROTOCOLS>
    ${protocols_xml}
  </PROTOCOLS>
  <CONTRACT>
    ${contract_xml}
  </CONTRACT>
  ${layer_line}${context_line}<INPUT_CONTENT>
    ${input_content}
  </INPUT_CONTENT>
</SYSTEM>
  `.trim();
}

/**
 * Builds the complete system envelope for Profile Sorting prompts.
 * @param {Object} params
 * @param {string} params.instructions_xml
 * @param {string} params.protocols_xml
 * @returns {string}
 */
export function render_sorting_system_xml({ instructions_xml, protocols_xml }) {
  return `
<SYSTEM role="NARRATIVE_STRUCTURER" enhancing="Entire Profile">
${instructions_xml}
  <PROTOCOLS>
    ${protocols_xml}
  </PROTOCOLS>
</SYSTEM>
  `.trim();
}

/**
 * CHANGELOG
 * - 2026-09-11: Purification pass — resolve_system_role_line now resolves from a manifest role key via SYSTEM_ROLES; the director envelope omits the spotlight line when none is supplied.
 * - 2026-09-11: Encapsulated <ROLE> XML format via render_role_xml and added resolve_system_role_line; standardized open_system_tag reuse and SYSTEM_CLOSE_TAG.
 * - 2026-09-11: Added complete XML system envelopes (render_prose_system_xml, render_director_system_xml, render_memory_system_xml, render_enhancement_system_xml, render_sorting_system_xml).
 * - 2026-09-11: Added CONTINUUM_CARETAKER role line and harmonized DEFAULT, NPC, NARRATOR, DIRECTOR role strings.
 * - 2026-09-11: Initial creation of modular system.js extracting root XML envelope, role lines, and stability locks.
 */
