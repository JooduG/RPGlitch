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
    `You are ${speaker_name} within FRACTAL ${fractal_name}, interacting with ${listener_name}.`,
  NPC: ({ speaker_name = "", listener_name = "", fractal_name = "" } = {}) =>
    `You are ${speaker_name}, a supporting character within FRACTAL ${fractal_name}, interacting with ${listener_name}.`,
  NARRATOR: ({ speaker_name = "" } = {}) => `You are ${speaker_name}, the Fractal itself, narrating the story.`,
  DIRECTOR: () => "You are the Director orchestrating simulation mechanics and staging.",
  CONTINUUM_CARETAKER: ({ target_name = "" } = {}) =>
    `You are the Continuum Caretaker for target entity "${target_name}". Consolidate temporal state from recent events.`,
  NARRATIVE_STRUCTURER: () => "You are the Narrative Structurer, extracting profile fragments from narrative prose.",
  ENHANCER: ({ enhancer_name = "GENERAL" } = {}) => `You are the ${enhancer_name} Profile Enhancer, refining target profile dimensions.`,
  SENSORY_CORTEX: () => "You are the Sensory Cortex synthesizing visual staging and descriptive optics.",
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
  WARNING: "WARNING: Structural drift detected. Ensure all XML tags close cleanly.",
  CRITICAL: "CRITICAL: Structural collapse. Every XML tag must close cleanly.",
});

export const TRUNCATION_COMPLETE_NOTE =
  "\n\nIMPORTANT: Previous reply cut off mid-sentence. Complete the response directly without repeating earlier text or rehashing events. Conclude on a complete sentence.";

/**
 * Resolves appropriate stability lock escalation message based on recorded structural errors.
 * @param {Object} [metadata]
 * @param {number} [metadata.structural_errors]
 * @returns {string}
 */
export function resolve_stability_lock(metadata) {
  const errors = Number(metadata?.structural_errors) || 0;
  if (errors >= 3) return STABILITY_LOCK.CRITICAL;
  if (errors >= 1) return STABILITY_LOCK.WARNING;
  return "";
}

// ============================================================================
// [SECTION 3: UNIVERSAL SYSTEM ENVELOPE COMPILER]
// ============================================================================

export const SYSTEM_TAG = "SYSTEM";

/**
 * Compiles a root <SYSTEM> XML envelope.
 *
 * The envelope is an OPEN fragment (`<SYSTEM …>…`) unless `closed` is explicitly set true.
 * The universal Task block is NEVER nested here — compilers return it as the package's separate
 * `task` field and `transport.js` appends history + task and emits the single `<SYSTEM>` close.
 *
 * @param {Object} [options]
 * @param {string} [options.mode=""]
 * @param {number|string|null} [options.round=null]
 * @param {Record<string, any>} [options.attributes={}]
 * @param {string[]} [options.children=[]]
 * @param {boolean} [options.closed=false]
 * @returns {string}
 */
export function render_system_xml({ mode = "", round = null, attributes = {}, children = [], closed = false } = {}) {
  const attrs = {
    ...(round != null ? { round } : {}),
    ...(mode ? { mode } : {}),
    ...attributes,
  };

  return render_xml_tag({
    tag: SYSTEM_TAG,
    attrs,
    children: Array.isArray(children) ? children : [children],
    closed,
    child_indent: 2,
    separator: "\n\n",
  });
}

/**
 * CHANGELOG
 * - 2026-09-22: `render_system_xml` passes `child_indent: 2` so every `<SYSTEM>` child (role line, protocols, entities, cast, history) sits at one uniform depth (recommendation #1).
 * - 2026-09-20: Universal envelope — `render_system_xml` now emits an OPEN `<SYSTEM role="…">` fragment only (dropped the `task` parameter and `SYSTEM_CLOSE_TAG`); `platform/transport.js` appends history + task and owns the single `</SYSTEM>` close, so every mode packages `{ system, task }`.
 * - 2026-09-18: Added SENSORY_CORTEX role and task parameter to render_system_xml for universal nested envelope compilation.
 * - 2026-09-13: Token Optimization Pass — Streamlined SYSTEM_ROLES definitions (INTERACTION, NPC, NARRATOR, DIRECTOR, CONTINUUM_CARETAKER, NARRATIVE_STRUCTURER, ENHANCER), STABILITY_LOCK strings, and TRUNCATION_COMPLETE_NOTE to remove redundant human conversational boilerplate while keeping sharp LLM steering; strictly adhered to zero new test file creation.
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
