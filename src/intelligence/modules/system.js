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

import { render_xml_tag, resolve_catalog_atom } from "@utils";

// ============================================================================
// [SECTION 1: ROLE LIBRARY & RESOLUTION]
// ============================================================================

export const ROLE_LIBRARY = Object.freeze({
  INTERACTION: Object.freeze({
    body: "You are {speaker_name} within FRACTAL {fractal_name}, interacting with {listener_name}.",
  }),
  NPC: Object.freeze({
    body: "You are {speaker_name}, a supporting character within FRACTAL {fractal_name}, interacting with {listener_name}.",
  }),
  NARRATOR: Object.freeze({
    body: "You are {speaker_name}, the Fractal itself, narrating the story.",
  }),
  DIRECTOR: Object.freeze({
    body: "You are the Director orchestrating simulation mechanics and staging.",
  }),
  CONTINUUM_CARETAKER: Object.freeze({
    body: 'You are the Continuum Caretaker for target entity "{target_name}". Consolidate temporal state from recent events.',
  }),
  NARRATIVE_STRUCTURER: Object.freeze({
    body: "You are the Narrative Structurer, extracting profile fragments from narrative prose.",
  }),
  ENHANCER: Object.freeze({
    body: "You are the {enhancer_name} Profile Enhancer, refining target profile dimensions.",
  }),
  SENSORY_CORTEX: Object.freeze({
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
  const defined_parameters = Object.fromEntries(Object.entries(parameters || {}).filter(([, value]) => value !== undefined));
  const resolved = resolve_catalog_atom(ROLE_LIBRARY, normalized_key, defined_parameters, {
    defaults: ROLE_DEFAULTS[normalized_key] || null,
    fallback_key: "INTERACTION",
  });
  return typeof resolved === "string" ? resolved : (resolved?.body ?? "");
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
  { key: "layer", emit: (state) => state.layer },
  { key: "entity_context", emit: (state) => state.field_context },
  { key: "chapter_history", emit: (state) => state.chapter_history },
  { key: "history", emit: (state) => state.history_block },
]);

/**
 * Walks the canonical `PROMPT_LAYERS` table and returns the ordered, non-empty `<SYSTEM>` children.
 * Every compiler composes its envelope through this single emitter, so a layer reorder/insert is a
 * table edit, never a change to an individual mode's children array.
 *
 * @param {Partial<Record<"role_line"|"constitution"|"core_protocols"|"dynamics"|"entities_block"|"target_context"|"nearby_cast"|"layer"|"field_context"|"chapter_history"|"history_block", string|null|undefined>>} state
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
 * Resolves envelope inputs into a frozen, render-ready plan. Every selection
 * (mode, round, attributes, ordered children) happens here — the renderer maps
 * plan fields to XML without branching.
 * @param {any} config - Resolved prompt manifest record (carries system.mode and layers.system)
 * @param {Record<string, any>} [state={}] - Emitter state bag keyed by PROMPT_LAYERS slots
 * @param {{ round?: number|string|null, attributes?: Record<string, any> }} [options={}]
 * @returns {Readonly<{ tag: string, mode: string, round: number|string|null, attributes: Readonly<Record<string, any>>, children: ReadonlyArray<string> }>}
 */
export function resolve_system_plan(config, state = {}, { round = null, attributes = {} } = {}) {
  return Object.freeze({
    tag: SYSTEM_TAG,
    mode: config.system.mode,
    round,
    attributes: Object.freeze({ ...(attributes || {}) }),
    children: Object.freeze(render_prompt_layers(state, config.layers.system)),
  });
}

/**
 * Maps a system plan to the open <SYSTEM> fragment. The <TASK> block is never
 * nested here — pack_prompt seals it as the package's separate field.
 * @param {ReturnType<typeof resolve_system_plan>|null|undefined} plan
 * @returns {string}
 */
export function render_system_plan(plan) {
  if (!plan) return "";
  return render_system_xml({ mode: plan.mode, round: plan.round, attributes: plan.attributes, children: [...plan.children] });
}

/**
 * Compiles a root <SYSTEM> XML envelope as an OPEN fragment (`<SYSTEM …>…`).
 * The universal Task block is NEVER nested here — compilers return it as the
 * package's separate `task` field and pack_prompt seals it inside `</SYSTEM>`.
 * @param {Object} [options]
 * @param {string} [options.mode=""]
 * @param {number|string|null} [options.round=null]
 * @param {Record<string, any>} [options.attributes={}]
 * @param {string[]} [options.children=[]]
 * @returns {string}
 */
export function render_system_xml({ mode = "", round = null, attributes = {}, children = [] } = {}) {
  const attrs = {
    ...(round != null ? { round } : {}),
    ...(mode ? { mode } : {}),
    ...attributes,
  };

  return render_xml_tag({
    tag: SYSTEM_TAG,
    attrs,
    children: Array.isArray(children) ? children : [children],
    closed: false,
    child_indent: 2,
    separator: "\n\n",
  });
}

/**
 * Composes the open <SYSTEM> envelope for a mode from its manifest record and a layer state
 * bag. The single envelope-assembly surface: every compiler routes through here, so a new
 * `<SYSTEM>` attribute or layer change is a one-line edit rather than a seven-site sweep.
 * @param {any} config - Resolved prompt manifest record (carries `system.mode` and `layers.system`).
 * @param {Record<string, any>} [state={}] - Emitter state bag keyed by `PROMPT_LAYERS` slots.
 * @param {{ round?: number|string|null, attributes?: Record<string, any> }} [options={}]
 * @returns {string}
 */
export function compose_system(config, state = {}, options = {}) {
  return render_system_plan(resolve_system_plan(config, state, options));
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
 * closed `<SYSTEM>…</SYSTEM>` envelope with the `<TASK>` block sealed inside, so what
 * `platform/transport.js` used to fuse at send time is now fixed at compile time.
 *
 * @param {{ system?: string, task?: string }} rendered
 * @param {Record<string, any>} [meta]
 * @returns {{ system: string, meta?: Record<string, any> }}
 */
export function pack_prompt(rendered, meta = {}) {
  const system = clean_prompt_text(rendered?.system);
  const task = clean_prompt_text(rendered?.task);
  const sealed = task ? `${system}\n\n${task}\n</SYSTEM>` : `${system}\n</SYSTEM>`;
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

/**
 * System-layer slot: resolves the mode role line from manifest key plus the
 * normalized role arguments prepared by the mode adapter.
 */
export function resolve_role_slot(config, normalized = {}) {
  return resolve_system_role_line({ role: config.role_line, ...(normalized.role_args || {}) });
}

/**
 * System-layer slot: the enhancement layer key currently seals no block.
 */
export function resolve_layer_slot() {
  return "";
}

/**
 * CHANGELOG
 * - 2026-10-07: Plan Omega for System — SYSTEM_ROLES closures replaced by declarative ROLE_LIBRARY + ROLE_DEFAULTS + get_role_atom; PROMPT_LAYERS/render_prompt_layers/compose_system/pack_prompt/resolve_prompt_meta/clean_prompt_text re-homed from builder.js; plan/render split (resolve_system_plan/render_system_plan) wired through compose_system; purged dead `closed`/`task` options and SYSTEM_TAG now names the plan tag; resolve_stability_lock tests live in reflex.test.js only.
 * - 2026-10-04: Moved stability-lock/truncation recovery copy to recovery.js; system.js owns identity + envelope only.
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
 * Modules Ground Refactor Phase 1 — get_role_atom delegates to utils/catalog.js resolve_catalog_atom (defaults spread + INTERACTION fallback preserved) — prompt bytes byte-identical.
 */
