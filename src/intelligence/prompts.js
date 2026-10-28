/**
 * src/intelligence/prompts.js
 * 🎭 PROMPTS MANIFEST — Sovereign Module-Keyed Prompt Switchboard
 * Central switchboard declaring the 7-layer declarative blueprint for all prompt modes.
 */

import { estimate_tokens, state_bridge, wrap_tag, detox_prose, has_alternations } from "@utils";
import { PROMPT_CHAR_ENVELOPE } from "@config";
import { MODE_ADAPTERS } from "./builder.js";
import { render_task } from "./modules/task.js";
import { resolve_system_role_line, render_system_xml, pack_prompt, resolve_prompt_meta } from "./modules/system.js";
import { render_constitution } from "./modules/constitution.js";
import { render_core_protocols } from "./modules/protocols.js";
import { render_dynamics_axes_xml, DYNAMICS_AXES } from "./dynamics.js";
import { render_entity_sheets, render_optics_entities_xml, render_nearby_entities_xml, render_settled_facts_xml } from "./modules/entities.js";
import { render_entity_continuum_context, render_enhancement_field_context } from "./modules/sheets.js";
import { render_input_history_xml, format_sensory_history, render_chapter_history_xml, HISTORY_TOKEN_BUDGET } from "./modules/recency.js";
import { verify_epistemic_integrity } from "./veil.js";
import { resolve_turn_state_plan, render_momentum_directive_xml } from "./modules/reflex.js";

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
  "story_status",
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
  system: Object.freeze(["role", "axiomatic_constitution", "core_protocols", "dynamic_axes", "entities"]),
  task: Object.freeze(["input", "directives", "output_format"]),
});

const TOOL_LAYERS = Object.freeze({
  system: Object.freeze(["role", "core_protocols", "target_entity_context", "cast", "chapter_history", "settled_facts", "history"]),
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
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.TYPOGRAPHY",
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.SCENE_MOMENTUM",
    ...(include_dialogue ? ["CORE_PROTOCOLS.PROSE_DISCIPLINE.NATURAL_DIALOGUE"] : []),
    "CORE_PROTOCOLS.ALTERNATION_OPTIONS",
  ];
}

/**
 * Composes the Director's ordered `<DIRECTIVES>` selections. Turn-state flags
 * arrive pre-resolved on the values bag (resolve_task_values); standalone
 * callers omit them and the plan derives from has_input/round.
 *
 * @param {{ has_input?: boolean, round?: number, has_environmental_hint?: boolean, turn_state?: { first_contact: boolean, round_one: boolean, evaluation: string }, stagnation_turns?: number, has_candidates?: boolean }} [parameters={}]
 * @returns {Array<string | { group: string[] }>}
 */
export function director_directives({ has_input = false, round = 1, has_environmental_hint = false, turn_state = null, stagnation_turns = 0 } = {}) {
  const situation = turn_state ?? resolve_turn_state_plan({ has_input, round });
  const momentum = render_momentum_directive_xml(stagnation_turns);
  return [
    {
      group: [`REFLEX.TURN_STATE.${situation.evaluation}`, ...(situation.round_one ? ["REFLEX.TURN_STATE.ROUND_ONE"] : [])],
    },
    ...(has_environmental_hint ? ["REFLEX.CONDITIONALS.ENVIRONMENTAL_HINT"] : []),
    ...(momentum ? [momentum] : []),
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
    constitution: true,
    protocols: ["CORE_PROTOCOLS.GROUNDING", "CORE_PROTOCOLS.ALTERNATION_OPTIONS"],
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
      schema: ["_thought_process", "target", ...TEMPORAL_SCHEMA_FRAGMENT],
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

function render_prompt_history(args = {}) {
  if (args.kind === "input_history") {
    if (!args.enabled) return "";
    return render_input_history_xml(args.history || [], {
      limit: args.limit,
      max_chars: args.max_chars,
      token_budget: args.token_budget ?? Infinity,
      tag: args.tag || "RECENT_ROUNDS",
    });
  }
  if (args.kind === "sensory") {
    const rendered = format_sensory_history(args.history);
    return rendered ? rendered.trim() : "";
  }
  return wrap_tag("RECENT_ROUNDS", args.accessors?.simulation_log(10, 0, { token_budget: HISTORY_TOKEN_BUDGET }), 2);
}

function render_mode_protocols(config, normalized, has_alternation = false) {
  const source = { ...(normalized.core_protocols_args || {}) };
  const alternation_flag =
    source.alternation_source === "entities"
      ? has_alternation
      : source.alternation_source === "text"
        ? has_alternations(source.alternation_text || "")
        : false;
  const constraints_xml = source.constraints_xml || null;
  const extra_protocols = Array.isArray(source.protocols) ? source.protocols : [];
  delete source.alternation_source;
  delete source.alternation_text;
  delete source.constraints_xml;
  delete source.protocols;
  const merged_protocols = [...(config?.protocols || []), ...extra_protocols];
  return render_core_protocols({
    protocols: merged_protocols,
    constraints_xml,
    has_alternation: alternation_flag,
    ...source,
  });
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

  const variant = normalized.terse && config.variants?.terse ? config.variants.terse : null;
  const system_order = variant?.system || config.layers.system;
  const task_order = variant?.task || config.layers.task;

  // 1. Render non-entity, non-protocol system slots
  const role_xml = system_order.includes("role") ? resolve_system_role_line({ role: config.role_line, ...(normalized.role_args || {}) }) : "";
  const constitution_xml = system_order.includes("axiomatic_constitution") && config.constitution ? render_constitution() : "";
  const dynamic_axes_xml = system_order.includes("dynamic_axes") ? render_dynamics_axes_xml(normalized.merged_dynamics, null, DYNAMICS_AXES) : "";
  const target_context_xml =
    system_order.includes("target_entity_context") && normalized.target_context_args?.enabled
      ? wrap_tag(
          "TARGET_ENTITY_CONTEXT",
          render_entity_continuum_context(normalized.target_context_args.target_key, normalized.target_context_args.target_entity),
          2,
        )
      : "";
  const cast_xml =
    system_order.includes("cast") && normalized.cast_args?.enabled
      ? render_nearby_entities_xml(normalized.cast_args.other_entities || {}, {
          exclude_id: normalized.cast_args.exclude_id,
          indent: 2,
        })
      : "";
  const entity_context_xml =
    system_order.includes("entity_context") && normalized.entity_context_args?.enabled
      ? render_enhancement_field_context(
          normalized.entity_context_args.entity,
          normalized.entity_context_args.field_id,
          normalized.entity_context_args.content,
          normalized.entity_context_args.normalized_type,
          normalized.entity_context_args.format_past_function,
        )
      : "";
  const chapter_history_xml =
    system_order.includes("chapter_history") && normalized.chapter_history_args?.enabled && normalized.chapter_history_args?.target_entity
      ? render_chapter_history_xml(normalized.chapter_history_args.target_entity, 2)
      : "";
  const settled_facts_xml =
    system_order.includes("settled_facts") && normalized.settled_facts_args?.enabled
      ? render_settled_facts_xml(normalized.settled_facts_args.facts || [])
      : "";
  const history_xml = system_order.includes("history") ? render_prompt_history(normalized.history_args) : "";

  // 2. Measure initial core_protocols footprint (before entity alternations)
  const initial_core_protocols_xml = system_order.includes("core_protocols") ? render_mode_protocols(config, normalized, false) : "";

  // 3. Render task XML
  if (normalized.entities_kind === "optics" && normalized.task_params && normalized.intent_roll && !normalized.task_params.input_intent) {
    normalized.task_params.input_intent = normalized.intent_roll.roll(normalized.intent_roll.raw_intent);
  }
  const task_xml = render_task({ ...(normalized.task_params || {}), config, layers: [...task_order] });

  // 4. Dynamic turn headroom metering
  const non_entity_system_length = [
    role_xml,
    constitution_xml,
    initial_core_protocols_xml,
    dynamic_axes_xml,
    target_context_xml,
    cast_xml,
    entity_context_xml,
    chapter_history_xml,
    settled_facts_xml,
    history_xml,
  ].reduce((sum, str) => sum + (typeof str === "string" ? str.length : 0), 0);

  const fixed_footprint = non_entity_system_length + task_xml.length + 300;
  const dynamic_headroom = Math.max(0, PROMPT_CHAR_ENVELOPE - fixed_footprint);

  if (normalized.sheets_args && typeof normalized.sheets_args === "object") {
    normalized.sheets_args.headroom = dynamic_headroom;
  }
  normalized.headroom = dynamic_headroom;

  // 5. Render entities with allocated headroom
  let entities_xml = "";
  if (system_order.includes("entities")) {
    if (normalized.entities_kind === "optics") {
      entities_xml = render_optics_entities_xml(normalized.optics_entities_args || {});
      if (normalized.task_params && normalized.intent_roll) {
        normalized.task_params.input_intent = detox_prose(normalized.intent_roll.roll(normalized.intent_roll.raw_intent));
      }
    } else {
      entities_xml = render_entity_sheets(normalized.sheets_args || {});
    }
  }

  // 6. Final core_protocols reflecting entity alternations
  const core_protocols_xml = system_order.includes("core_protocols") ? render_mode_protocols(config, normalized, has_alternations(entities_xml)) : "";

  // 7. Epistemic integrity check across boundary
  if (config.task_state === "prose") {
    const guarded_slots = [entities_xml, cast_xml, target_context_xml].filter((slot) => typeof slot === "string" && slot);
    if (guarded_slots.some((slot) => !verify_epistemic_integrity(slot))) {
      console.warn("[builder] Epistemic Wall integrity alert: leaked secrets or plans detected across boundary.");
    }
  }

  // 8. Assemble system envelope in declared order
  const slot_map = {
    role: role_xml,
    axiomatic_constitution: constitution_xml,
    core_protocols: core_protocols_xml,
    dynamic_axes: dynamic_axes_xml,
    entities: entities_xml,
    target_entity_context: target_context_xml,
    cast: cast_xml,
    entity_context: entity_context_xml,
    chapter_history: chapter_history_xml,
    settled_facts: settled_facts_xml,
    history: history_xml,
  };

  const children = system_order.map((key) => slot_map[key]).filter(Boolean);
  const system_xml = render_system_xml({
    mode: config.system.mode,
    round: normalized.round ?? null,
    attributes: { ...(normalized.attributes || {}) },
    children,
  });

  const meta = resolve_prompt_meta({ ...(normalized.meta_args || {}) });
  const packed = pack_prompt({ system: system_xml, task: task_xml }, meta);

  try {
    const system_text = system_xml || "";
    const task_text = task_xml || "";
    const entities_text = String(entities_xml || cast_xml || target_context_xml || "");
    const history_text = String(history_xml || "");

    const past_matches = entities_text.match(/<PAST>[\s\S]*?<\/PAST>/gi) || [];
    const past_text = past_matches.join("\n");
    const cast_matches = entities_text.match(/<CAST[\s\S]*?<\/CAST>/gi) || [];
    const cast_text = cast_matches.join("\n");
    const actors_text = entities_text.replace(/<PAST>[\s\S]*?<\/PAST>/gi, "").replace(/<CAST[\s\S]*?<\/CAST>/gi, "");

    const token_snapshot = {
      mode: mode_key,
      round: normalized.round ?? 0,
      timestamp: Date.now(),
      total: estimate_tokens(packed.system),
      cliff_limit: 6000,
      layers: {
        system: estimate_tokens(system_text),
        entities: estimate_tokens(entities_text),
        history: estimate_tokens(history_text),
        task: estimate_tokens(task_text),
      },
      entities_breakdown: {
        actors: estimate_tokens(actors_text),
        cast: estimate_tokens(cast_text),
        past: estimate_tokens(past_text),
      },
    };

    state_bridge.record_prompt_token_snapshot?.(token_snapshot);
  } catch (_err) {
    // Non-blocking telemetry
  }

  return packed;
}

export default PROMPTS;
