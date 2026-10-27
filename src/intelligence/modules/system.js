/**
 * src/intelligence/modules/system.js
 * ============================================================================
 * 🌐 SYSTEM PROMPT MODULE — Root Envelope & Role Lines
 * ============================================================================
 *
 * Provides root <SYSTEM> XML envelope construction and role line formatting.
 * Stability-lock and truncation recovery copy lives in reflex.js (REFLEX_LIBRARY.RECOVERY).
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation.
 * - Blueprint (system.js): frozen catalog + resolver + pure compiler over @utils `render_xml_tag`.
 * - Single source of truth for <SYSTEM> open tag, closing tag, and role lines.
 * ============================================================================
 */

import { interpolate_tokens, render_xml_tag } from "@utils";

// ============================================================================
// [SECTION 1: ROLE LIBRARY & RESOLUTION]
// ============================================================================

export const ROLE_LIBRARY = Object.freeze({
  INTERACTION: Object.freeze({
    tag: "ROLE",
    body: "You are {speaker_name} within FRACTAL {fractal_name}, interacting with {listener_name}.",
  }),
  NPC: Object.freeze({
    tag: "ROLE",
    body: "You are {speaker_name}, a supporting character within FRACTAL {fractal_name}, interacting with {listener_name}.",
  }),
  NARRATOR: Object.freeze({
    tag: "ROLE",
    body: "You are {speaker_name}, the Fractal itself, narrating the story.",
  }),
  DIRECTOR: Object.freeze({
    tag: "ROLE",
    body: "You are the Director orchestrating simulation mechanics and staging.",
  }),
  CONTINUUM_CARETAKER: Object.freeze({
    tag: "ROLE",
    body: 'You are the Continuum Caretaker for target entity "{target_name}". Consolidate temporal state from recent events.',
  }),
  NARRATIVE_STRUCTURER: Object.freeze({
    tag: "ROLE",
    body: "You are the Narrative Structurer, extracting profile fragments from narrative prose.",
  }),
  ENHANCER: Object.freeze({
    tag: "ROLE",
    body: "You are the {enhancer_name} Profile Enhancer, refining target profile dimensions.",
  }),
  SENSORY_CORTEX: Object.freeze({
    tag: "ROLE",
    body: "You are the Sensory Cortex synthesizing visual staging and descriptive optics.",
  }),
});

/**
 * Per-role placeholder defaults merged under explicit parameters.
 * @type {Readonly<Record<string, Readonly<Record<string, string>>>>}
 */
export const ROLE_DEFAULTS = Object.freeze({
  ENHANCER: Object.freeze({ enhancer_name: "GENERAL" }),
});

/**
 * Compiles one ROLE_LIBRARY atom, interpolating {placeholder} tokens from parameters.
 * Missing slots resolve to "" (never "undefined"); ROLE_DEFAULTS fills defaults only
 * where the caller left the slot undefined (matching legacy destructuring semantics).
 * @param {string} [role_key="INTERACTION"] - Canonical role key (case-insensitive)
 * @param {Record<string, any>} [parameters={}]
 * @returns {string}
 */
export function get_role_atom(role_key = "INTERACTION", parameters = {}) {
  const normalized_key = String(role_key || "INTERACTION").toUpperCase();
  const atom = ROLE_LIBRARY[normalized_key] || ROLE_LIBRARY.INTERACTION;
  const defaults = ROLE_DEFAULTS[normalized_key];
  const defined_parameters = Object.fromEntries(Object.entries(parameters || {}).filter(([, value]) => value !== undefined));
  const bag = defaults ? { ...defaults, ...defined_parameters } : defined_parameters;
  return interpolate_tokens(atom.body, bag);
}

/**
 * Resolves the appropriate system role line from a manifest role key.
 * @param {Object} [parameters]
 * @param {string} [parameters.role="INTERACTION"]
 * @returns {string}
 */
export function resolve_system_role_line({ role = "INTERACTION", ...parameters } = {}) {
  return get_role_atom(role, parameters);
}

// ============================================================================
// [SECTION 2: SYSTEM LAYER TABLE]
// ============================================================================

/**
 * Canonical prose-envelope layer table — the ordered emitters that fill a `<SYSTEM>`.
 * Emitters read from the assembled layer state, so adding/reordering a system layer is a
 * table edit rather than a change to every compiler.
 */
export const PROMPT_LAYERS = Object.freeze([
  { key: "role", emit: (state) => state.role_line },
  { key: "axiomatic_constitution", emit: (state) => state.constitution },
  { key: "core_protocols", emit: (state) => state.core_protocols },
  { key: "dynamic_axes", emit: (state) => state.dynamics },
  { key: "entities", emit: (state) => state.entities_block },
  { key: "target_entity_context", emit: (state) => state.target_context },
  { key: "cast", emit: (state) => state.nearby_cast },
  { key: "entity_context", emit: (state) => state.field_context },
  { key: "chapter_history", emit: (state) => state.chapter_history },
  { key: "memory_advisory", emit: (state) => state.memory_advisory },
  { key: "history", emit: (state) => state.history_block },
]);

/**
 * Walks the canonical `PROMPT_LAYERS` table and returns the ordered, non-empty `<SYSTEM>` children.
 * Every compiler composes its envelope through this single emitter, so a layer reorder/insert is a
 * table edit, never a change to an individual mode's children array.
 *
 * @param {Partial<Record<"role_line"|"constitution"|"core_protocols"|"dynamics"|"entities_block"|"target_context"|"nearby_cast"|"field_context"|"chapter_history"|"history_block", string|null|undefined>>} state
 * @returns {string[]}
 */
function render_prompt_layers(state, allowed_keys = null) {
  return PROMPT_LAYERS.filter((layer) => !allowed_keys || allowed_keys.includes(layer.key))
    .map((layer) => layer.emit(state))
    .filter(Boolean);
}

// ============================================================================
// [SECTION 3: SYSTEM PLAN & ENVELOPE RENDERER]
// ============================================================================

export const SYSTEM_TAG = "SYSTEM";

/**
 * Compiles a root <SYSTEM> XML envelope as an OPEN fragment (`<SYSTEM …>…`).
 * The universal Task block is NEVER nested here — compilers return it as the
 * package's separate `task` field and pack_prompt seals it inside `</SYSTEM>`.
 * @param {Object} [options]
 * @param {string} [options.tag=null]
 * @param {string} [options.mode=""]
 * @param {number|string|null} [options.round=null]
 * @param {Record<string, any>} [options.attributes={}]
 * @param {string[]} [options.children=[]]
 * @returns {string}
 */
export function render_system_xml({ tag = null, mode = "", round = null, attributes = {}, children = [] } = {}) {
  const attrs = {
    ...(round != null ? { round } : {}),
    ...(mode ? { mode } : {}),
    ...attributes,
  };

  return render_xml_tag({
    tag: tag || SYSTEM_TAG,
    attrs,
    children: Array.isArray(children) ? children : [children],
    closed: false,
    child_indent: 2,
    separator: "\n\n",
  });
}

/**
 * Composes the open envelope for a mode from its manifest record and a layer state
 * bag. The single envelope-assembly surface: every compiler routes through here, so a new
 * envelope attribute or layer change is a one-line edit rather than a seven-site sweep.
 * @param {any} config - Resolved prompt manifest record (carries `system.mode` and `layers.system`).
 * @param {Record<string, any>} [state={}] - Emitter state bag keyed by `PROMPT_LAYERS` slots.
 * @param {{ round?: number|string|null, attributes?: Record<string, any> }} [options={}]
 * @returns {string}
 */
export function compose_system(config, state = {}, { round = null, attributes = {} } = {}) {
  const children = render_prompt_layers(state, config?.layers?.system);
  return render_system_xml({
    mode: config?.system?.mode || "",
    round,
    attributes,
    children,
  });
}

// ============================================================================
// [SECTION 4: PACKAGE SEALER & META]
// ============================================================================

/**
 * Trims trailing line whitespace and consolidates excessive newlines.
 * @param {string} [text]
 * @returns {string}
 */
function clean_prompt_text(text) {
  return typeof text === "string"
    ? text
        .replace(/[ \t]+$/gm, "")
        .replace(/\n{3,}/g, "\n")
        .trim()
    : "";
}

/**
 * Packages rendered prompt text into the single closed-envelope prompt package.
 *
 * The package is always `{ system }` (+ optional `meta`): `system` is the complete
 * closed `<SYSTEM>…</SYSTEM>` envelope with the `<TASK>` block sealed inside.
 *
 * @param {{ system?: string, task?: string }} rendered
 * @param {Record<string, any>} [meta]
 * @returns {{ system: string, meta?: Record<string, any> }}
 */
export function pack_prompt(rendered, meta = {}) {
  const system = clean_prompt_text(rendered?.system);
  const task = clean_prompt_text(rendered?.task);
  const sealed = task ? `${system}\n\n${task}\n</${SYSTEM_TAG}>` : `${system}\n</${SYSTEM_TAG}>`;
  return {
    system: sealed,
    ...(Object.keys(meta).length > 0 ? { meta } : {}),
  };
}

/**
 * Builds the canonical prompt-package `meta` record — one shape for every mode.
 * @param {{ ai?: any, fractal?: any, flags?: any, role?: string|null, entity_id?: string|null }} [parameters={}]
 * @returns {Record<string, any>}
 */
export function resolve_prompt_meta({ ai = null, fractal = null, flags = {}, role = null, entity_id = null } = {}) {
  return {
    ai,
    fractal,
    flags,
    ...(role ? { role } : {}),
    ...(entity_id ? { entity_id } : {}),
  };
}
