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
 * - Blueprint (system.js): frozen catalog + resolver + pure compiler over @utils `render_xml_tag`.
 * - Single source of truth for <SYSTEM> open tag, closing tag, and role lines.
 * ============================================================================
 */

import { render_xml_tag } from "@utils";

// ============================================================================
// [SECTION 1: ROLE LINE FORMATTER]
// ============================================================================

export const SYSTEM_ROLES = Object.freeze({
  INTERACTION: ({ speaker_name = "", listener_name = "", fractal_name = "" } = {}) =>
    `You are ${speaker_name} within the FRACTAL ${fractal_name}, interacting with ${listener_name}. Embody this role with uncompromised fidelity under the laws and directives below.`,
  NPC: ({ speaker_name = "", listener_name = "", fractal_name = "" } = {}) =>
    `You are ${speaker_name}, a supporting character within the FRACTAL ${fractal_name}, interacting with ${listener_name}. Embody this role with uncompromised fidelity under the laws and directives below.`,
  NARRATOR: ({ speaker_name = "" } = {}) =>
    `You are ${speaker_name}, the Fractal itself, narrating the story. Embody this role with uncompromised fidelity under the laws and directives below.`,
  DIRECTOR: () => "You are the Director — the unseen intelligence orchestrating the mechanical state of the simulation.",
  CONTINUUM_CARETAKER: ({ target_name = "" } = {}) =>
    `You are the Continuum Caretaker for target entity "${target_name}". Analyze recent events and consolidate temporal state under the contract below.`,
  NARRATIVE_STRUCTURER: () => "You are the Narrative Structurer, extracting structured profile fragments from raw narrative prose.",
  ENHANCER: ({ enhancer_name = "GENERAL" } = {}) =>
    `You are the ${enhancer_name} Profile Enhancer, refining and expanding targeted entity profile dimensions.`,
});

/**
 * Resolves the appropriate system role line from a manifest role key.
 * @param {Object} [parameters]
 * @param {string} [parameters.role="INTERACTION"]
 * @returns {string}
 */
export function resolve_system_role_line({ role = "INTERACTION", ...parameters } = {}) {
  const role_key = String(role || "INTERACTION").toUpperCase();
  const role_factory = SYSTEM_ROLES[role_key] || SYSTEM_ROLES.INTERACTION;
  return role_factory(parameters);
}

// ============================================================================
// [SECTION 2: STABILITY LOCK MESSAGES & TRUNCATION RECOVERY]
// ============================================================================

export const STABILITY_LOCK = Object.freeze({
  WARNING: "WARNING: Structural drift detected. Maintain disciplined XML closures and clean markdown boundaries.",
  CRITICAL: "CRITICAL: Structural collapse. Re-anchor immediately. Every XML tag must close cleanly.",
});

export const TRUNCATION_COMPLETE_NOTE =
  "\n\nIMPORTANT: Your previous reply was cut off mid-sentence. Finish this response IMMEDIATELY: do not repeat any earlier text, do not rehash events, just bring the current moment to a natural close with a complete sentence, then stop.";

/**
 * Resolves appropriate stability lock escalation message based on recorded structural errors.
 * @param {Object} [metadata]
 * @param {number} [metadata.structural_errors]
 * @returns {string}
 */
export function resolve_stability_lock(metadata) {
  if (metadata?.structural_errors >= 3) return STABILITY_LOCK.CRITICAL;
  if (metadata?.structural_errors >= 1) return STABILITY_LOCK.WARNING;
  return "";
}

// ============================================================================
// [SECTION 3: UNIVERSAL SYSTEM ENVELOPE COMPILER]
// ============================================================================

export const SYSTEM_CLOSE_TAG = "</SYSTEM>";

/**
 * Compiles a root <SYSTEM> XML envelope.
 * @param {Object} [options]
 * @param {string} [options.mode=""]
 * @param {number|string|null} [options.round=null]
 * @param {Record<string, any>} [options.attributes={}]
 * @param {string[]} [options.children=[]]
 * @param {boolean} [options.closed=false]
 * @returns {string}
 */
export function render_system_xml({ mode = "", round = null, attributes = {}, children = [], closed = false } = {}) {
  return render_xml_tag({
    tag: "SYSTEM",
    attrs: {
      ...attributes,
      ...(round != null ? { round } : {}),
      ...(mode && !attributes.mode ? { mode } : {}),
    },
    children,
    closed,
    separator: "\n\n",
  });
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
 * - 2026-09-13: Refactor pass — enforced Full-Name nomenclature (`metadata` over `meta`, `parameters` over `params`, `role_factory` over `factory`); converted `resolve_stability_lock` to standard function declaration with JSDoc; added defensive parameter default to `render_system_xml`; standardized Universal File Architecture section headers.
 * - 2026-09-13: Purged redundant `render_role_xml` abstraction; Director system envelope now consumes raw `role_line` directly, aligning with Story Prose and scrobbles.md blueprint.
 * - 2026-09-12: Standardization pass — render_system_xml now delegates to the shared `render_xml_tag` composer in @utils so envelope layout lives in one place; resolve_system_role_line is a pure SYSTEM_ROLES lookup instead of a duplicated switch; removed the dead `open_system_tag` (superseded by render_system_xml).
 * - 2026-09-12: Unified ground-up rebuild — merged render_prose_system_xml, render_director_system_xml, render_memory_system_xml, render_enhancement_system_xml, and render_sorting_system_xml into a single universal render_system_xml compiler.
 * - 2026-09-11: Purification pass — resolve_system_role_line now resolves from a manifest role key via SYSTEM_ROLES; the director envelope omits the spotlight line when none is supplied.
 * - 2026-09-11: Encapsulated <ROLE> XML format via render_role_xml and added resolve_system_role_line; standardized open_system_tag reuse and SYSTEM_CLOSE_TAG.
 * - 2026-09-11: Added complete XML system envelopes (render_prose_system_xml, render_director_system_xml, render_memory_system_xml, render_enhancement_system_xml, render_sorting_system_xml).
 * - 2026-09-11: Added CONTINUUM_CARETAKER role line and harmonized DEFAULT, NPC, NARRATOR, DIRECTOR role strings.
 * - 2026-09-11: Initial creation of modular system.js extracting root XML envelope, role lines, and stability locks.
 */
