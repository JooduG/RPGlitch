/**
 * src/intelligence/prompts.js
 * ============================================================================
 * 🎭 PROMPTS MANIFEST — Sovereign Module-Keyed Prompt Switchboard
 * ============================================================================
 *
 * Central switchboard declaring the 7-layer declarative blueprint for all 9
 * simulation prompt modes across the RPGlitch Intelligence Kernel.
 *
 * ── Multi-Shot Simulation Lifecycle ─────────────────────────────────────────
 * • Shot 1  (Quick Shot) : director    — Turn staging & mechanical state (+ terse fallback)
 * • Shot 2A (Prose Shot) : interaction — AI character canonical narrative voice
 *                        : ghostwrite  — User persona turn drafter
 *                        : npc         — Supporting stage character
 *                        : narrator    — Fractal environment/world voice
 * • Shot 2B (Back Shot)  : continuum   — Memory Forge temporal consolidation
 *
 * ── Auxiliary Tooling & Sensory Cortex ──────────────────────────────────────
 * • Tool A (Magic Wand)  : enhancement — Single profile field expansion
 * • Tool B (Structurer)  : sorting     — Raw entity ingestion & structuring
 * • Sensory Cortex       : optics      — Diffusion image prompt synthesis
 *
 * ── The 7-Layer Universal Pipeline ──────────────────────────────────────────
 * 1. system       : Root <SYSTEM> envelope mode & ROLE_LIBRARY key
 * 2. constitution : Axiomatic core laws (L1–L4) toggle
 * 3. protocols    : Ordered protocol atoms emitting <CORE_PROTOCOLS>
 * 4. entities     : Entity scoping for sheets, dispositions, dynamic axes, and spotlight
 * 5. history      : Conversation history windowing configuration
 * 6. task         : Think-format calibration, directives, and turn payload
 * 7. format       : Output specification key (PROSE, DIRECTOR, CONTINUUM, PROFILE)
 *
 * Architecture & Purity Invariants:
 * - P4 Zero Backwards Compatibility: Single frozen switchboard catalog.
 * - Imports Hoisted: Clean ESM dependencies hoisted to file top.
 * - Every mode is compiled via `define_mode`, layering deltas over canonical defaults.
 * ============================================================================
 */

import { MODE_ADAPTERS } from "./builder.js";
import { resolve_task_slots, render_task_plan, TASK_LAYERS } from "./modules/task.js";
import { resolve_role_slot, compose_system, pack_prompt, resolve_prompt_meta } from "./modules/system.js";
import { resolve_constitution_slot } from "./modules/constitution.js";
import { resolve_core_protocols_slot } from "./modules/protocols.js";
import { resolve_dynamic_axes_slot } from "./dynamics.js";
import { resolve_entities_slot, resolve_target_context_slot, resolve_cast_slot, resolve_entity_context_slot } from "./modules/entities.js";
import { resolve_history_slot, resolve_chapter_history_slot } from "./modules/history.js";
import { verify_epistemic_integrity } from "./veil.js";
import { resolve_turn_state_plan } from "./modules/reflex.js";

// ============================================================================
// 1. ENVELOPE CONSTANTS & LAYER PRESETS
// ============================================================================

/**
 * Canonical default entity configuration across all 7 layers.
 * (Visibility gates are derived from mode visibility policy).
 */
const DEFAULT_ENTITIES_CONFIG = Object.freeze({
  nearby_entities: false,
  candidate_entities: false,
  field_context: false,
  target_context: false,
  chapter_history: false,
});

/**
 * Director JSON schema for the `director` mode (and its `terse` refusal-recovery fallback).
 * @type {ReadonlyArray<string>}
 */
export const DIRECTOR_SCHEMA = Object.freeze([
  "_thought_process",
  "next_action",
  "keywords",
  "directors_note",
  "dynamics_deltas",
  "visual_staging",
  "spotlight",
]);

/**
 * Temporal composite fragment shared by structured profile schemas
 * (continuum consolidation and profile sorting ingestion).
 * @type {ReadonlyArray<string>}
 */
const TEMPORAL_SCHEMA_FRAGMENT = Object.freeze(["eternal", "present", "past", "future"]);

/**
 * Canonical system-layer slots shared by the four Shot-2A prose modes.
 * @type {Readonly<{ system: ReadonlyArray<string>, task: ReadonlyArray<string> }>}
 */
const PROSE_LAYERS = Object.freeze({
  system: Object.freeze(["role", "axiomatic_constitution", "core_protocols", "entities", "history"]),
  task: Object.freeze(["think_format", "input", "currents", "directives", "delivery_posture", "stability_lock", "output_format"]),
});

/**
 * Named layer presets — one frozen `{ system, task }` declaration per envelope family.
 * @type {Readonly<{ system: ReadonlyArray<string>, task: ReadonlyArray<string> }>}
 */
export const DIRECTOR_LAYERS = Object.freeze({
  system: Object.freeze(["role", "core_protocols", "dynamic_axes", "entities", "history"]),
  task: Object.freeze(["input", "directives", "output_format"]),
});

const TOOL_LAYERS = Object.freeze({
  system: Object.freeze(["role", "core_protocols", "target_entity_context", "cast", "chapter_history", "history"]),
  task: Object.freeze(["directives", "output_format"]),
});

const ENHANCEMENT_LAYERS = Object.freeze({
  system: Object.freeze(["role", "core_protocols", "entity_context"]),
  task: Object.freeze(["think_format", "input", "directives", "output_format"]),
});

const SORTING_LAYERS = Object.freeze({
  system: Object.freeze(["role", "core_protocols"]),
  task: Object.freeze(["input", "directives", "output_format"]),
});

const OPTICS_LAYERS = Object.freeze({
  system: Object.freeze(["role", "core_protocols", "entities", "history"]),
  task: Object.freeze(["think_format", "input", "target", "spatial_framing", "directives", "output_format"]),
});

// ============================================================================
// 2. PROTOCOL & DIRECTIVE COMPOSERS
// ============================================================================

/**
 * Composes the Shot-2A prose protocol bundle shared by the interaction/ghostwrite/npc/narrator
 * sibling modes: tense → prose discipline → (optional dialogue) → alternation.
 * (Fidelity is constitution axiom L4, not a protocol.)
 *
 * @param {{ include_dialogue?: boolean }} [parameter_options={}]
 * @returns {string[]}
 */
function prose_protocols({ include_dialogue = false } = {}) {
  return [
    "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT",
    "CORE_PROTOCOLS.GROUNDING",
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.TYPOGRAPHY",
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.SENTENCE_FORMULAS",
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.SCENE_MOMENTUM",
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.CLICHES",
    ...(include_dialogue ? ["CORE_PROTOCOLS.PROSE_DISCIPLINE.NATURAL_DIALOGUE"] : []),
    "CORE_PROTOCOLS.ALTERNATION_OPTIONS",
  ];
}

/**
 * Composes the Director's ordered `<DIRECTIVES>` selections. Turn-state flags
 * arrive pre-resolved on the values bag (resolve_task_values); standalone
 * callers omit them and the plan derives from has_input/round.
 *
 * @param {{ has_input?: boolean, round?: number, has_environmental_hint?: boolean, turn_state?: { first_contact: boolean, round_one: boolean, evaluation: string } }} [parameters={}]
 * @returns {Array<string | { group: string[] }>}
 */
export function director_directives({ has_input = false, round = 1, has_environmental_hint = false, turn_state = null } = {}) {
  const situation = turn_state ?? resolve_turn_state_plan({ has_input, round });
  return [
    "DIRECTOR.DYNAMICS_CALIBRATION",
    {
      group: [
        `REFLEX.TURN_STATE.${situation.evaluation}`,
        ...(situation.round_one ? ["REFLEX.TURN_STATE.ROUND_ONE"] : []),
        "DIRECTOR.USER_PERSONA_LOCK",
      ],
    },
    ...(has_environmental_hint ? ["REFLEX.CONDITIONALS.ENVIRONMENTAL_HINT"] : []),
    "DIRECTOR.ROUTING",
    "DIRECTOR.CONVERGENCE",
  ];
}

/**
 * Composes the Continuum Caretaker's `<DIRECTIVES>` selection.
 *
 * @returns {string[]}
 */
function continuum_directives() {
  return ["CONTINUUM.MANDATE"];
}

/**
 * Composes Narrative Structurer's `<DIRECTIVES>` selection.
 *
 * @param {{ entity_type?: string, ingestion?: boolean, redistribute?: boolean }} [parameter_options={}]
 * @returns {Array<string | { group: string[] }>}
 */
function sorting_directives({ ingestion = false, redistribute = false } = {}) {
  return ["SORTING.FOCUS", ...(ingestion ? ["SORTING.INGESTION"] : []), ...(redistribute ? ["SORTING.REDISTRIBUTE"] : [])];
}

/**
 * Composes Sensory Cortex Optics `<DIRECTIVES>` selection.
 *
 * @param {{ target_tier?: string, is_selfie?: boolean, has_fractal_setting?: boolean, main_entity_name?: string }} [parameter_options={}]
 * @returns {string[]}
 */
function optics_directives({ target_tier = "", is_selfie = false, has_fractal_setting = false, main_entity_name = "" } = {}) {
  const is_story_tier = target_tier === "story_entities" || target_tier === "story_character" || target_tier === "story_scene";
  return [
    "OPTICS.MANDATE",
    "OPTICS.SUBJECT_RULES.DYNAMIC_OVERRIDES",
    "OPTICS.SUBJECT_RULES.GARMENT_ANATOMY",
    "OPTICS.SUBJECT_RULES.IDENTIFIERS",
    "OPTICS.SUBJECT_RULES.CREATURE_DISAMBIGUATION",
    "OPTICS.SUBJECT_RULES.SIGNATURE_COLORS",
    ...(target_tier === "solo_entity" ? ["OPTICS.SOLO_FRAME"] : target_tier === "story_scene" ? ["OPTICS.ENVIRONMENTAL_SCALE"] : []),
    ...(is_story_tier && !has_fractal_setting && main_entity_name ? ["OPTICS.BACKGROUND"] : []),
    ...(is_selfie ? ["OPTICS.SELFIE_DIRECTIVE"] : []),
  ];
}

/**
 * Composes Optics spatial framing directives based on target tier.
 *
 * @param {{ target_tier?: string }} [parameter_options={}]
 * @returns {string[]}
 */
function optics_spatial_framing({ target_tier = "" } = {}) {
  return [target_tier === "story_scene" ? "OPTICS.FIRST_SENTENCE_MANDATE.SCENE" : "OPTICS.FIRST_SENTENCE_MANDATE.ENTITY", "OPTICS.SPATIAL_GEOMETRY"];
}

// ============================================================================
// 3. MASTER MODE RECORD FACTORY
// ============================================================================

/**
 * Builds one frozen mode record from a declarative delta over canonical layers.
 * The record is the single source of truth for the mode configuration.
 *
 * @param {string} mode_key - Canonical key of the prompt mode
 * @param {Object} specification - Mode specification delta
 * @returns {Readonly<Record<string, any>>}
 */
function define_mode(mode_key, specification) {
  const declared_layers = specification.layers || {};

  return Object.freeze({
    key: mode_key,
    system: Object.freeze({
      mode: mode_key,
      ...(specification.pov ? { pov: specification.pov } : {}),
    }),
    speaker: specification.speaker ?? null,
    visibility: specification.visibility || "default",
    role_line: (specification.role_line || mode_key).toUpperCase(),
    task_state: specification.task_state || "prose",
    layers: Object.freeze({
      system: Object.freeze([...(declared_layers.system || [])]),
      task: Object.freeze([...(declared_layers.task || [])]),
    }),
    variants: specification.variants
      ? Object.freeze(
          Object.fromEntries(
            Object.entries(specification.variants).map(([variant_key, variant_layers]) => [
              variant_key,
              Object.freeze({
                system: Object.freeze([...(variant_layers.system || [])]),
                task: Object.freeze([...(variant_layers.task || [])]),
              }),
            ]),
          ),
        )
      : null,
    constitution: specification.constitution ?? true,
    protocols: Object.freeze(specification.protocols || []),
    entities: Object.freeze({
      ...DEFAULT_ENTITIES_CONFIG,
      ...specification.entities,
    }),
    history: specification.history ? Object.freeze({ ...specification.history }) : null,
    think_format: specification.think_format ?? null,
    directives: specification.directives || null,
    spatial_framing: specification.spatial_framing || null,
    format: Object.freeze(
      typeof specification.format === "object" && specification.format !== null
        ? { ...specification.format, schema: Object.freeze([...(specification.format.schema || [])]) }
        : { mode: String(specification.format || "prose").toLowerCase() },
    ),
  });
}

// ============================================================================
// 4. MASTER MODE MANIFEST (PROMPTS SWITCHBOARD)
// ============================================================================

export const PROMPTS = Object.freeze({
  // ── Shot 1: Quick Shot (Directorial Mechanics) ──────────────────────────────

  director: define_mode("director", {
    speaker: null,
    visibility: "director",
    role_line: "DIRECTOR",
    task_state: "director",
    directives: director_directives,
    constitution: false,
    protocols: ["CORE_PROTOCOLS.ALTERNATION_OPTIONS"],
    entities: { candidate_entities: true },
    layers: DIRECTOR_LAYERS,
    variants: { terse: { system: ["role"], task: ["output_format"] } },
    format: { mode: "json", schema: DIRECTOR_SCHEMA },
  }),

  // ── Shot 2A: Prose Shots (Canonical Narrative Voice) ────────────────────────

  interaction: define_mode("interaction", {
    speaker: "AI",
    visibility: "default",
    role_line: "INTERACTION",
    task_state: "prose",
    protocols: prose_protocols({ include_dialogue: true }),
    entities: { nearby_entities: true },
    layers: PROSE_LAYERS,
    think_format: "character",
  }),

  ghostwrite: define_mode("ghostwrite", {
    speaker: "USER",
    visibility: "default",
    role_line: "INTERACTION",
    task_state: "prose",
    protocols: prose_protocols({ include_dialogue: true }),
    entities: { nearby_entities: true },
    layers: PROSE_LAYERS,
    think_format: "character",
  }),

  npc: define_mode("npc", {
    speaker: "NPC",
    visibility: "supporting",
    role_line: "NPC",
    task_state: "prose",
    protocols: prose_protocols({ include_dialogue: true }),
    entities: { nearby_entities: true },
    layers: PROSE_LAYERS,
    think_format: "character",
  }),

  narrator: define_mode("narrator", {
    speaker: null,
    visibility: "omniscient",
    role_line: "NARRATOR",
    task_state: "prose",
    pov: "THIRD",
    protocols: prose_protocols(),
    entities: { nearby_entities: true },
    layers: PROSE_LAYERS,
    think_format: "narrator",
  }),

  // ── Shot 2B: Back Shot (Continuum Caretaker) ────────────────────────────────

  continuum: define_mode("continuum", {
    speaker: null,
    visibility: "target",
    role_line: "CONTINUUM_CARETAKER",
    task_state: "continuum",
    directives: continuum_directives,
    constitution: false,
    protocols: ["CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT", "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PAST", "CORE_PROTOCOLS.PERSPECTIVE.TENSE.FUTURE"],
    entities: {
      target_context: true,
      nearby_entities: true,
      chapter_history: true,
    },
    history: { limit: 16 },
    layers: TOOL_LAYERS,
    format: {
      mode: "json",
      schema: ["_thought_process", "target", ...TEMPORAL_SCHEMA_FRAGMENT, "relationships"],
    },
  }),

  // ── Auxiliary Tooling: Profile Enhancement & Ingestion Structuring ──────────

  enhancement: define_mode("enhancement", {
    speaker: null,
    visibility: "field",
    role_line: "ENHANCER",
    task_state: "enhancement",
    constitution: false,
    protocols: [],
    entities: { field_context: true },
    layers: ENHANCEMENT_LAYERS,
    think_format: "enhancement",
    format: { mode: "temporal_field" },
  }),

  sorting: define_mode("sorting", {
    speaker: null,
    visibility: "none",
    role_line: "NARRATIVE_STRUCTURER",
    task_state: "sorting",
    directives: sorting_directives,
    constitution: false,
    protocols: ["CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT", "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PAST", "CORE_PROTOCOLS.PERSPECTIVE.TENSE.FUTURE"],
    layers: SORTING_LAYERS,
    format: {
      mode: "json",
      schema: ["_thought_process", "name", "description", "signature_color", ...TEMPORAL_SCHEMA_FRAGMENT],
    },
  }),

  // ── Sensory Cortex: Visual Optics Generation ────────────────────────────────

  optics: define_mode("optics", {
    speaker: null,
    visibility: "visual",
    role_line: "SENSORY_CORTEX",
    task_state: "optics",
    directives: optics_directives,
    spatial_framing: optics_spatial_framing,
    constitution: false,
    protocols: ["CORE_PROTOCOLS.ALTERNATION_OPTIONS", "CORE_PROTOCOLS.GROUNDING", "OPTICS.IMAGE_VOCABULARY", "OPTICS.TEXT_RENDERING"],
    layers: OPTICS_LAYERS,
    think_format: "optics",
    format: {
      mode: "json",
      schema: ["_thought_process", "prompt", "negative_prompt"],
    },
  }),
});

// ============================================================================
// 5. MANIFEST RESOLVERS & SWITCHBOARD DISPATCHER
// ============================================================================

/**
 * Resolves a prompt manifest record by key, falling back to `interaction`.
 * @param {string} [key]
 * @returns {typeof PROMPTS[keyof typeof PROMPTS]}
 */
export const get_prompt = (key) => (key && PROMPTS[key]) || PROMPTS.interaction;

/**
 * Resolves prompt config according to speaker context and turn flags.
 * @param {{ is_npc?: boolean, ghostwrite?: boolean }} [options]
 */
export const resolve_prompt_mode = ({ is_npc = false, ghostwrite = false } = {}) =>
  PROMPTS[ghostwrite ? "ghostwrite" : is_npc ? "npc" : "interaction"];

// ============================================================================
// 6. UNIVERSAL PROMPT PLAN — DISTRIBUTED SLOTS, MANIFEST ASSEMBLY
// ============================================================================

export const SYSTEM_SLOT_RESOLVERS = Object.freeze({
  role: resolve_role_slot,
  axiomatic_constitution: resolve_constitution_slot,
  core_protocols: resolve_core_protocols_slot,
  dynamic_axes: resolve_dynamic_axes_slot,
  entities: resolve_entities_slot,
  target_entity_context: resolve_target_context_slot,
  cast: resolve_cast_slot,
  entity_context: resolve_entity_context_slot,
  chapter_history: resolve_chapter_history_slot,
  history: resolve_history_slot,
});

const SYSTEM_STATE_KEYS = Object.freeze({
  role: "role_line",
  axiomatic_constitution: "constitution",
  core_protocols: "core_protocols",
  dynamic_axes: "dynamics",
  entities: "entities_block",
  target_entity_context: "target_context",
  cast: "nearby_cast",
  entity_context: "field_context",
  chapter_history: "chapter_history",
  history: "history_block",
});

function resolve_meta_args(normalized = {}) {
  return { ...(normalized.meta_args || {}) };
}

export const PROMPT_META_RESOLVERS = Object.freeze({
  director: resolve_meta_args,
  interaction: resolve_meta_args,
  ghostwrite: resolve_meta_args,
  npc: resolve_meta_args,
  narrator: resolve_meta_args,
  continuum: resolve_meta_args,
  enhancement: resolve_meta_args,
  sorting: resolve_meta_args,
  optics: resolve_meta_args,
});

export function resolve_prompt_plan(config, normalized = {}) {
  const variant = normalized.terse && config.variants?.terse ? config.variants.terse : null;
  const system_order = Object.freeze([...(variant?.system || config.layers.system)]);
  const task_order = Object.freeze([...(variant?.task || config.layers.task)]);
  const system_slots = {};
  for (const slot_key of system_order) {
    if (slot_key === "core_protocols") continue;
    const resolver = SYSTEM_SLOT_RESOLVERS[slot_key];
    if (typeof resolver !== "function") throw new Error(`Unknown system slot: ${slot_key}`);
    system_slots[slot_key] = resolver(config, normalized, system_slots);
  }
  if (system_order.includes("core_protocols")) {
    system_slots.core_protocols = SYSTEM_SLOT_RESOLVERS.core_protocols(config, normalized, system_slots);
  }
  const task_resolved = resolve_task_slots({ ...(normalized.task_params || {}), config, layers: [...task_order] });
  const meta_resolver = PROMPT_META_RESOLVERS[config.key] || resolve_meta_args;
  return Object.freeze({
    tag: "PROMPT",
    mode: config.key,
    layers: Object.freeze({
      system: Object.freeze({ order: system_order, slots: Object.freeze({ ...system_slots }) }),
      task: Object.freeze({ mode: task_resolved.mode, order: task_order, slots: task_resolved.slots }),
    }),
    meta: resolve_prompt_meta(meta_resolver(normalized)),
    round: normalized.round ?? null,
    attributes: Object.freeze({ ...(normalized.attributes || {}) }),
    epistemic_guard: config.task_state === "prose",
  });
}

export function render_prompt_plan(plan) {
  if (!plan) return { system: "", task: "" };
  const config = get_prompt(plan.mode);
  if (plan.epistemic_guard) {
    if (!verify_epistemic_integrity(plan.layers.system.slots.entities)) {
      console.warn("[builder] Epistemic Wall integrity alert: leaked secrets or plans detected across boundary.");
    }
  }
  const seal_config = { ...config, layers: { system: [...plan.layers.system.order], task: [...plan.layers.task.order] } };
  const state = {};
  for (const slot_key of plan.layers.system.order) {
    state[SYSTEM_STATE_KEYS[slot_key]] = plan.layers.system.slots[slot_key];
  }
  const system = compose_system(seal_config, state, { round: plan.round, attributes: { ...plan.attributes } });
  const task_children = TASK_LAYERS.filter((layer) => plan.layers.task.order.includes(layer.key))
    .map((layer) => layer.emit(plan.layers.task.slots))
    .filter(Boolean);
  const task = render_task_plan({ tag: "TASK", children: task_children });
  return { system, task };
}

/**
 * Master Switchboard Compiler.
 * Compiles a normalized prompt package for any registered simulation mode.
 *
 * @param {string} mode_key - Manifest key from PROMPTS catalog
 * @param {Object} [context={}] - Dynamic runtime context, entities, dynamics, and options
 * @returns {{ system: string, meta?: Record<string, any> }}
 */
export function compile_prompt(mode_key, context = {}) {
  const config = get_prompt(mode_key);
  const adapter = MODE_ADAPTERS[mode_key] || MODE_ADAPTERS.prose;
  const normalized = adapter.normalize(config, context);
  const plan = resolve_prompt_plan(config, normalized);
  return pack_prompt(render_prompt_plan(plan), plan.meta);
}

export default PROMPTS;

/**
 * CHANGELOG
 * - Track 0.10: Purged dead layer system slot (resolver import, SYSTEM_SLOT_RESOLVERS/SYSTEM_STATE_KEYS entries, ENHANCEMENT_LAYERS key).
 * - Track 0.8/0.9: continuum_directives selects the folded MANDATE alone; sorting_directives selects the single generated SORTING.FOCUS (macro rides the values bag; entity_type branching retired).
 * - 2026-10-08: Modules Ground Refactor Phase 4 — universal prompt plan (distributed slot registries, terse variant, plan pipeline; assemble_prompt retired).
 * - 2026-10-04: director_directives prefers the pre-resolved values.turn_state (single has_input resolution) — prompt bytes byte-identical.
 * - 2026-10-04: Director environmental-hint key follows the normalized reflex catalog (REFLEX.CONDITIONALS.ENVIRONMENTAL_HINT).
 * - 2026-10-04: director_directives reads the reflex turn-state plan (evaluation/round-one fire from TURN_STATE atoms).
 * - 2026-10-04: Catalog restructure — prose bundles declare GROUNDING + split disciplines (SENTENCE_FORMULAS/SCENE_MOMENTUM/CLICHES/CONSENT), data modes declare OUTPUT.DATA, optics declares GROUNDING + IMAGE_VOCABULARY + TEXT_RENDERING.
 * - 2026-10-04: Narrator manifest declares normal `pov: "THIRD"` (`POV.NARRATOR` retired).
 * - 2026-10-04: sorting/continuum manifests declare `PERSPECTIVE.TENSE.*` (`LAYER_TENSE` folded into `TENSE`).
 * - 2026-10-04: sorting/continuum records declare three layer-tense keys (ETERNAL merged into PRESENT).
 * - 2026-10-04: sorting/continuum DIRECTIVES no longer carry person/tense (now SYSTEM protocols); both records declare the four LAYER_TENSE keys and sorting resolves POV.THIRD via pov_protocol; leads reverted accordingly.
 * - 2026-10-04: sorting_directives and continuum_directives now append TEMPORAL.TENSE (order pinned in MODE_DIRECTIVE_LEADS); field tense stated once per prompt instead of per schema value.
 * - 2026-10-01: Added think_format: "enhancement" and temporal_field format contract to enhancement mode, enabling cognitive thinking blocks for single profile field refinement.
 * - 2026-09-24: Ground-Up Refactor & Harmonization — (1) Hoisted `assemble_prompt` import to file top to establish clean ESM dependency hygiene; (2) Reconstructed module body into 6 cleanly sequenced sections following the simulation lifecycle (Envelope Presets, Protocol/Directive Composers, Mode Factory, Manifest Switchboard, Resolvers/Dispatcher, and Changelog); (3) Standardized Full-Name domain nomenclature across composers and factory options; (4) Preserved 100% contract invariance across all 100 unit and verification test cases.
 * - 2026-09-25: Task directive selection moved into the manifest — every mode now declares its Layer-6 `<DIRECTIVES>` key selection (`director_directives` / `continuum_directives` / `sorting_directives` / `optics_directives`) plus optics' `spatial_framing`; `define_mode` carries `directives` + `spatial_framing` through, so `modules/task.js` compiles selection instead of owning it.
 * - 2026-09-24: Director entity gate renamed `present_entities` → `candidate_entities` (the cast block now carries only off-stage reuse candidates); `TOOL_LAYERS.task` drops its never-filled `inputs` slot, so continuum's task declares only `directives` + `output_format`.
 * - 2026-09-23: Prompt-grammar harmonization (phases 0–3) — layer presets renamed (`dynamics`→`dynamic_axes`) and the task layer list collapsed to one `inputs` slot (retiring `last_turn`); `ENVELOPE_LAYER_TAGS` follows (`DYNAMIC_AXES`, `INPUT`, `input_content` pruned); enhancement moved its `<INPUT>` from `<SYSTEM>` to `<TASK>`; optics added `CORE_PROTOCOLS.ALTERNATION_OPTIONS` so its alternation protocol lives in `<CORE_PROTOCOLS>` (not `<SUBJECT_RULES>`).
 * - 2026-09-23: Pipeline consolidation (R1/R3/R5/R7) — the mode record is now the single source of truth: each mode declares `speaker`, `visibility`, `role_line`, `task_state`, `think_format`, a named layer preset (`DIRECTOR_LAYERS`/`TOOL_LAYERS`/`ENHANCEMENT_LAYERS`/`SORTING_LAYERS`/`OPTICS_LAYERS` alongside `PROSE_LAYERS`), and its format; `config.system.role` is retired (the `role_line` key indexes SYSTEM_ROLES), `config.task` collapses to a top-level `think_format`, `format` normalizes to `{ mode, schema? }` at `define_mode`, and the three per-mode visibility arrays (`dispositions`/`dynamic_axes`/`agendas`) are replaced by the `visibility` policy resolved in `sheets.js`. Output bytes unchanged.
 * - 2026-09-23: Envelope harmonization — dropped the `present_cast` system layer (the `<CAST>` roster now nests inside `<ENTITIES>`) and the `keyword_directives` task layer (the block now nests inside `<DIRECTIVES>`); the `user_agenda` boolean became an `agendas` list, the Director's `dynamic_axes` gate was removed (all six axes gather in the one `<DYNAMICS>` block), and ghostwrite's entity gates mirror interaction's with AI↔USER swapped.
 * - 2026-09-22: Declared envelope shape (recommendation #4) — every mode now carries a frozen `layers: { system, task }` manifest consumed by the `PROMPT_LAYERS`/`TASK_LAYERS` walkers and validated against `ENVELOPE_LAYER_TAGS`; the sorting schema gained `_thought_process` and the continuum/sorting schemas share `TEMPORAL_SCHEMA_FRAGMENT` (recommendation #8).
 * - 2026-09-22: One protocol namespace (recommendation #7) — the data-mode protocol lists now declare `CORE_PROTOCOLS.DATA` instead of the retired `HYGIENE.DATA` namespace.
 * - 2026-09-21: Standardization pass — retired the `director_terse` mode (now `compile_prompt("director", { terse: true })`), so the registry declares 9 modes; `prose_protocols({ include_dialogue })` no longer takes a POV key (resolved by `resolve_pov_protocol`), the continuum/sorting protocol lists dropped POV/TENSE, and the narrator declares `system.pov = "NARRATOR"` for the single POV resolver.
 * - 2026-09-19: Collapsed the facade chain (P7) — `compile_prompt` now calls `assemble_prompt(get_prompt(mode_key), context)` directly; the intermediate `compile_pipeline_prompt` facade was retired. `compile_prompt` remains the single public entry point.
 * - 2026-09-19: Table-driven assembler (P4) — `define_mode` now stamps each record with its canonical `key`, which `assemble_prompt` uses to select a `MODE_ADAPTERS` entry (needed because `director_terse` shares `system.mode = "director"`).
 * - 2026-09-19: Manifest DRY (P3) — the four Shot-2A prose modes now compose their protocol lists from one `prose_protocols(pov, { include_dialogue })` bundle, and `director`/`director_terse` share the `DIRECTOR_SCHEMA` constant (no duplicated key lists).
 * - 2026-09-19: Retired inert manifest data (P2) — `define_mode` no longer injects `history`/`input_tag` defaults; history is declared by continuum alone (its only `resolve_history` consumer), the inert `task.terse` override and optics' unconsumed `entities` gate are pruned, and `task` now only carries `think_format`.
 * - 2026-09-18: Repatriated output schema definitions from format.js into prompts.js: declared explicit { mode: "json", schema: [...] } arrays for director, director_terse, continuum, sorting, and optics.
 * - 2026-09-18: Purified define_mode and PROMPTS catalog: bound mode_key to system.mode, declared canonical DEFAULT_ENTITIES_CONFIG, and explicitly typed enhancement format as PROSE.
 * - 2026-09-18: Registered `director_terse` and `optics` modes in PROMPTS master manifest.
 * - 2026-09-16: Pruned inert `task.input_tag` overrides from `continuum` and `enhancement` modes under P4 Zero Backwards Compatibility.
 * - 2026-09-16: Standardized Director `input_tag` to canonical default `"INPUT"`, purging legacy `"USER_ACTION"` tag override under P4 Zero Backwards Compatibility.
 * - 2026-09-15: History Limit Harmonization — Explicitly harmonized history window to limit: 16 across all four Shot-2A prose sibling modes (interaction, ghostwrite, npc, narrator).
 * - 2026-09-12: Standardization pass — the `continuum` mode declares its history window (`history.limit`), now consumed by builder.js via history.js `resolve_history` (the window was previously hardcoded at the call site).
 * - 2026-09-12: Standardization pass — replaced the repeated 7-layer skeleton with a declarative `define_mode` factory (MODE_DEFAULTS + per-mode delta + deep-freeze), so each mode is a short data record and the layer defaults live in one place. Values are unchanged.
 * - 2026-09-12: Elevated prompts.js into a standardized 7-module switchboard aligning Shot 1 (Quick Shot: director), Shot 2A (Prose Shot: interaction/ghostwrite/npc/narrator), Shot 2B (Back Shot: continuum), and auxiliary tools (enhancement, sorting). Added explicit history configuration to all modes.
 * - 2026-09-11: Wired the manifest to the assembly line — protocol lists, constitution gating, entity context gates, role keys, schema/contract keys and the sorting POV key are now consumed by builder.js. Pruned inert task.directive/task.rules/task.directives keys and reconciled protocol lists with emitted output. Removed the PROMPT_MODES/get_prompt_mode compatibility aliases (P4).
 * - 2026-09-11: Renamed prompt-modes.js -> prompts.js. Elevated to module-keyed manifest registering all 8 prompt modes (system, constitution, protocols, entities, task).
 * - 2026-09-11: Converted prompt-modes.json into canonical ESM module with frozen schemas.
 */
