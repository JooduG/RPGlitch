/**
 * src/intelligence/prompts.js
 * ============================================================================
 * 🎭 PROMPTS MANIFEST — Master Module-Keyed Switchboard
 * ============================================================================
 *
 * Sovereign switchboard declaring the 7-layer blueprint for all 9 simulation prompt modes.
 *
 * ── Multi-Shot Simulation Cycle ─────────────────────────────────────────────
 * • Shot 1  (Quick Shot) : director    — Turn staging & mechanical state (+ terse fallback)
 * • Shot 2A (Prose Shot) : interaction — AI character voice (canonical)
 *                        : ghostwrite  — User persona turn drafter
 *                        : npc         — Supporting stage character
 *                        : narrator    — Fractal environment/world voice
 * • Shot 2B (Back Shot)  : continuum   — Memory Forge temporal consolidation
 *
 * ── Auxiliary Tooling ───────────────────────────────────────────────────────
 * • Tool A (Magic Wand)  : enhancement — Single profile field expansion
 * • Tool B (Structurer)  : sorting     — Raw ingestion structuring
 * • Sensory Cortex       : optics      — Image prompt synthesis
 *
 * ── The 7-Layer Universal Pipeline ──────────────────────────────────────────
 * 1. system       : Root <SYSTEM> envelope mode & SYSTEM_ROLES factory key
 * 2. constitution : Axiomatic core laws (L1–L5) toggle
 * 3. protocols    : Ordered protocol atoms or empty array (emits <CORE_PROTOCOLS>)
 * 4. entities     : Scoping for sheets, dispositions, dynamic axes, spotlight
 * 5. history      : Conversation history windowing configuration
 * 6. task         : Think-format calibration for the turn payload
 * 7. format       : Output specification key (PROSE, DIRECTOR, CONTINUUM, PROFILE)
 *
 * Every mode is produced by `define_mode`, which layers a mode's deviations over
 * the canonical layer defaults and deep-freezes the result — so a mode reads as a
 * short declarative delta (mirroring the catalog + resolver shape of format.js)
 * instead of repeating the full 7-layer skeleton.
 *
 * Architecture & Modification Rules:
 * - Zero backward compatibility (P4): single frozen switchboard catalog.
 * - Layer keys are consumed by the assembly line and its module emitters:
 *   `assemble_prompt` / `MODE_ADAPTERS` (`./builder.js`) dispatch on the record's stamped
 *   `key`; `protocols` → `modules/protocols.js`, `entities` → `modules/entities/sheets.js`
 *   `resolve_entities`, `history` → `modules/history.js` `resolve_history`, `task` / `format`
 *   → `modules/task.js` and `modules/format.js`.
 * - Declare only live keys: any manifest key with no consumer is pruned (no inert data).
 * ============================================================================
 */

// ── 1. Master Mode Factory ───────────────────────────────────────────────────

/**
 * Canonical default entity configuration across all 7 layers (the visibility gates are
 * derived from a mode's `visibility` policy, not declared here).
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
const DIRECTOR_SCHEMA = Object.freeze([
  "_thought_process",
  "next_action",
  "keywords",
  "directors_note",
  "dynamics_deltas",
  "visual_staging",
  "spotlight",
]);

/**
 * The twin-cylinder temporal composite fragment shared by the two structured profile
 * schemas (continuum consolidation and profile ingestion), so the eternal/present/past/future
 * key order lives in one place (recommendation #8).
 * @type {ReadonlyArray<string>}
 */
const TEMPORAL_SCHEMA_FRAGMENT = Object.freeze(["eternal", "present", "past", "future"]);

/**
 * Canonical system-layer slots shared by the four Shot-2A prose modes.
 * @type {Readonly<{ system: ReadonlyArray<string>, task: ReadonlyArray<string> }>}
 */
const PROSE_LAYERS = Object.freeze({
  system: Object.freeze(["role", "constitution", "protocols", "entities"]),
  task: Object.freeze(["think", "inputs", "currents", "directives", "delivery_posture", "stability_lock", "output_format"]),
});

/**
 * Named layer presets — one frozen `{ system, task }` declaration per envelope family, so a
 * mode's layer knowledge lives here (a named preset) instead of as a literal array in its
 * record. A mode may spread a preset and apply a delta (`{ ...PRESET, task: [...] }`).
 * @type {Readonly<{ system: ReadonlyArray<string>, task: ReadonlyArray<string> }>}
 */
const DIRECTOR_LAYERS = Object.freeze({
  system: Object.freeze(["role", "protocols", "dynamic_axes", "entities"]),
  task: Object.freeze(["inputs", "directives", "output_format"]),
});

const TOOL_LAYERS = Object.freeze({
  system: Object.freeze(["role", "protocols", "target_context", "nearby_cast", "chapter_history", "history"]),
  task: Object.freeze(["directives", "output_format"]),
});

const ENHANCEMENT_LAYERS = Object.freeze({
  system: Object.freeze(["role", "protocols", "layer", "field_context"]),
  task: Object.freeze(["inputs", "directives", "output_format"]),
});

const SORTING_LAYERS = Object.freeze({
  system: Object.freeze(["role", "protocols"]),
  task: Object.freeze(["inputs", "directives", "output_format"]),
});

const OPTICS_LAYERS = Object.freeze({
  system: Object.freeze(["role", "protocols", "entities", "history"]),
  task: Object.freeze(["think", "inputs", "target", "spatial_framing", "directives", "output_format"]),
});

/**
 * The one map from an envelope layer key to the tag it emits (recommendation #4). A mode's
 * declared `layers` are validated against this by `prompt-verification.test.js`, so the
 * declaration is load-bearing rather than documentation. `role`/`stability_lock` emit no tag.
 * @type {Readonly<Record<string, string>>}
 */
export const ENVELOPE_LAYER_TAGS = Object.freeze({
  constitution: "AXIOMATIC_CONSTITUTION",
  protocols: "CORE_PROTOCOLS",
  dynamic_axes: "DYNAMIC_AXES",
  entities: "ENTITIES",
  target_context: "TARGET_ENTITY_CONTEXT",
  nearby_cast: "CAST",
  layer: "LAYER",
  field_context: "ENTITY_CONTEXT",
  chapter_history: "CHAPTER_HISTORY",
  history: "HISTORY",
  think: "THINK_FORMAT",
  inputs: "INPUT",
  currents: "CURRENTS",
  target: "TARGET",
  spatial_framing: "SPATIAL_FRAMING",
  directives: "DIRECTIVES",
  delivery_posture: "DELIVERY_POSTURE",
  output_format: "OUTPUT_FORMAT",
});

/**
 * Composes the Shot-2A prose protocol bundle shared by the interaction/ghostwrite/npc/narrator
 * sibling modes: fidelity → tense → prose discipline → (optional dialogue) → alternation.
 * POV is intentionally NOT declared here — perspective is resolved by the single
 * `resolve_pov_protocol` resolver (entity profile or the mode's `system.pov` override).
 *
 * @param {{ include_dialogue?: boolean }} [options={}]
 * @returns {string[]}
 */
function prose_protocols({ include_dialogue = false } = {}) {
  return [
    "CORE_PROTOCOLS.SIMULATION_FIDELITY",
    "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT",
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.TYPOGRAPHY",
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.PHYSICALITY",
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.ANTI_TROPES",
    "CORE_PROTOCOLS.PROSE_DISCIPLINE.BANNED_CLICHES",
    ...(include_dialogue ? ["CORE_PROTOCOLS.PROSE_DISCIPLINE.NATURAL_DIALOGUE"] : []),
    "CORE_PROTOCOLS.ALTERNATION_OPTIONS",
  ];
}

/**
 * Builds one frozen mode record from a declarative delta over the canonical layers.
 * The record is the single source of truth for the mode: its envelope discriminator
 * (`system.mode`), its speaker, its entity-visibility policy, its role line, its task
 * state builder, its declared layers, and its output format all live here — so adding a
 * mode is one record (plus, at most, one task-state factory) and nothing else moves.
 *
 * @param {string} mode_key - Canonical key of the prompt mode
 * @param {Object} spec - Mode specification delta
 */
function define_mode(mode_key, spec) {
  const declared_layers = spec.layers || {};

  return Object.freeze({
    key: mode_key,
    system: Object.freeze({
      mode: mode_key,
      ...(spec.pov ? { pov: spec.pov } : {}),
    }),
    speaker: spec.speaker ?? null,
    visibility: spec.visibility || "default",
    role_line: (spec.role_line || mode_key).toUpperCase(),
    task_state: spec.task_state || "prose",
    layers: Object.freeze({
      system: Object.freeze([...(declared_layers.system || [])]),
      task: Object.freeze([...(declared_layers.task || [])]),
    }),
    constitution: spec.constitution ?? true,
    protocols: Object.freeze(spec.protocols || []),
    entities: Object.freeze({
      ...DEFAULT_ENTITIES_CONFIG,
      ...spec.entities,
    }),
    history: spec.history ? Object.freeze({ ...spec.history }) : null,
    think_format: spec.think_format ?? null,
    format: Object.freeze(
      typeof spec.format === "object" && spec.format !== null
        ? { ...spec.format, schema: Object.freeze([...(spec.format.schema || [])]) }
        : { mode: String(spec.format || "prose").toLowerCase() },
    ),
  });
}

// ── 2. Master Mode Manifest ──────────────────────────────────────────────────

export const PROMPTS = Object.freeze({
  // ── Shot 1: Quick Shot (Directorial Mechanics) ──────────────────────────────

  director: define_mode("director", {
    speaker: null,
    visibility: "director",
    role_line: "DIRECTOR",
    task_state: "director",
    constitution: false,
    protocols: ["CORE_PROTOCOLS.ALTERNATION_OPTIONS"],
    entities: { candidate_entities: true },
    layers: DIRECTOR_LAYERS,
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
    pov: "NARRATOR",
    protocols: prose_protocols(),
    entities: { nearby_entities: true },
    layers: PROSE_LAYERS,
    think_format: "narrator",
  }),

  // ── Shot 2B: Back Shot (Background / Continuum Caretaker) ──────────────────

  continuum: define_mode("continuum", {
    speaker: null,
    visibility: "target",
    role_line: "CONTINUUM_CARETAKER",
    task_state: "continuum",
    constitution: false,
    protocols: ["CORE_PROTOCOLS.DATA"],
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

  // ── Profile Enhancement & Ingestion Structuring ─────────────────────────────

  enhancement: define_mode("enhancement", {
    speaker: null,
    visibility: "field",
    role_line: "ENHANCER",
    task_state: "enhancement",
    constitution: false,
    protocols: ["CORE_PROTOCOLS.DATA"],
    entities: { field_context: true },
    layers: ENHANCEMENT_LAYERS,
    format: "PROSE",
  }),

  sorting: define_mode("sorting", {
    speaker: null,
    visibility: "none",
    role_line: "NARRATIVE_STRUCTURER",
    task_state: "sorting",
    constitution: false,
    protocols: ["CORE_PROTOCOLS.DATA"],
    layers: SORTING_LAYERS,
    format: {
      mode: "json",
      schema: ["_thought_process", "name", "description", "signature_color", ...TEMPORAL_SCHEMA_FRAGMENT],
    },
  }),

  // ── Sensory Cortex: Visual Optics Generation ──────────────────────────────

  optics: define_mode("optics", {
    speaker: null,
    visibility: "visual",
    role_line: "SENSORY_CORTEX",
    task_state: "optics",
    constitution: false,
    protocols: [
      "CORE_PROTOCOLS.DATA",
      "CORE_PROTOCOLS.ALTERNATION_OPTIONS",
      "OPTICS.WEIGHTING_RESTRICTIONS",
      "OPTICS.AFFIRMATIVE_FRAMING",
      "OPTICS.TYPOGRAPHY",
      "OPTICS.ENVIRONMENTAL_GROUNDING",
    ],
    layers: OPTICS_LAYERS,
    think_format: "optics",
    format: {
      mode: "json",
      schema: ["_thought_process", "prompt", "negative_prompt"],
    },
  }),
});

import { assemble_prompt } from "./builder.js";

// ── 3. Manifest Resolvers & Switchboard Dispatcher ───────────────────────────

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

/**
 * Master Switchboard Compiler.
 * Compiles a normalized prompt package for any registered simulation mode.
 *
 * @param {string} mode_key - Manifest key from PROMPTS catalog
 * @param {Object} [context={}] - Dynamic runtime context, entities, dynamics, and options
 * @returns {{ system: string, task: string, meta?: Record<string, any>, messages?: any[] }}
 */
export function compile_prompt(mode_key, context = {}) {
  return assemble_prompt(get_prompt(mode_key), context);
}

export default PROMPTS;

/**
 * CHANGELOG
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
