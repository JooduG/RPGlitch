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

// ── 3. Universal System Envelope Compiler ────────────────────────────────────

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
 * Universally compiles the root `<SYSTEM>` XML envelope across all simulation modes.
 *
 * @param {Object} params
 * @param {string} [params.mode=""] - Prompt mode attribute (e.g. "interaction", "director", "continuum")
 * @param {number|string|null} [params.round=null] - Active simulation round
 * @param {Record<string, string|number|null|undefined>} [params.attributes={}] - Custom attributes (e.g. role, target, field)
 * @param {Array<string|null|undefined>} [params.children=[]] - Ordered array of content blocks
 * @param {boolean} [params.closed=false] - Whether to close the envelope with </SYSTEM>
 * @returns {string}
 */
export function render_system_xml({ mode = "", round = null, attributes = {}, children = [], closed = false }) {
  const merged_attributes = {
    ...attributes,
    ...(round != null ? { round } : {}),
    ...(mode && !attributes.mode ? { mode } : {}),
  };

  const formatted_attributes = Object.entries(merged_attributes)
    .filter(([_, value]) => value != null && value !== "")
    .map(([key, value]) => `${key}="${escape_xml(String(value))}"`)
    .join(" ");

  const open_tag = formatted_attributes ? `<SYSTEM ${formatted_attributes}>` : "<SYSTEM>";

  const content = (Array.isArray(children) ? children : [children])
    .filter((item) => item != null && String(item).trim().length > 0)
    .map((item) => String(item).trim())
    .join("\n\n");

  if (!content) {
    return closed ? `${open_tag}\n${SYSTEM_CLOSE_TAG}` : open_tag;
  }

  return closed ? `${open_tag}\n${content}\n${SYSTEM_CLOSE_TAG}` : `${open_tag}\n${content}`;
}

/**
 * CHANGELOG
 * - 2026-09-12: Unified ground-up rebuild — merged render_prose_system_xml, render_director_system_xml, render_memory_system_xml, render_enhancement_system_xml, and render_sorting_system_xml into a single universal render_system_xml compiler.
 * - 2026-09-11: Purification pass — resolve_system_role_line now resolves from a manifest role key via SYSTEM_ROLES; the director envelope omits the spotlight line when none is supplied.
 * - 2026-09-11: Encapsulated <ROLE> XML format via render_role_xml and added resolve_system_role_line; standardized open_system_tag reuse and SYSTEM_CLOSE_TAG.
 * - 2026-09-11: Added complete XML system envelopes (render_prose_system_xml, render_director_system_xml, render_memory_system_xml, render_enhancement_system_xml, render_sorting_system_xml).
 * - 2026-09-11: Added CONTINUUM_CARETAKER role line and harmonized DEFAULT, NPC, NARRATOR, DIRECTOR role strings.
 * - 2026-09-11: Initial creation of modular system.js extracting root XML envelope, role lines, and stability locks.
 */
