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
 * Canonical default entity configuration across all 7 layers.
 */
const DEFAULT_ENTITIES_CONFIG = Object.freeze({
  dispositions: [],
  dynamic_axes: [],
  user_agenda: false,
  nearby_entities: false,
  present_entities: false,
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
 * Builds one frozen mode record from a declarative delta over the 7 canonical layers.
 * Resolves system mode & role cleanly from mode_key or explicit spec.
 *
 * @param {string} mode_key - Canonical key of the prompt mode
 * @param {Object} spec - Mode specification delta
 */
function define_mode(mode_key, spec) {
  const system =
    typeof spec.system === "string"
      ? { mode: mode_key, role: spec.system.toUpperCase() }
      : spec.system || { mode: mode_key, role: mode_key.toUpperCase() };

  return Object.freeze({
    key: mode_key,
    system: Object.freeze(system),
    constitution: spec.constitution ?? true,
    protocols: Object.freeze(spec.protocols || []),
    entities: Object.freeze({
      ...DEFAULT_ENTITIES_CONFIG,
      ...spec.entities,
    }),
    history: spec.history ? Object.freeze({ ...spec.history }) : null,
    task: Object.freeze({ think_format: null, ...spec.task }),
    format:
      typeof spec.format === "object" && spec.format !== null
        ? Object.freeze({ ...spec.format, schema: Object.freeze([...(spec.format.schema || [])]) })
        : spec.format || "PROSE",
  });
}

// ── 2. Master Mode Manifest ──────────────────────────────────────────────────

export const PROMPTS = Object.freeze({
  // ── Shot 1: Quick Shot (Directorial Mechanics) ──────────────────────────────

  director: define_mode("director", {
    system: "DIRECTOR",
    constitution: false,
    protocols: ["CORE_PROTOCOLS.ALTERNATION_OPTIONS"],
    entities: {
      dispositions: ["AI", "USER", "FRACTAL", "NPC"],
      dynamic_axes: ["AI", "FRACTAL"],
      user_agenda: true,
      present_entities: true,
    },
    format: { mode: "json", schema: DIRECTOR_SCHEMA },
  }),

  // ── Shot 2A: Prose Shots (Canonical Narrative Voice) ────────────────────────

  interaction: define_mode("interaction", {
    system: "INTERACTION",
    protocols: prose_protocols({ include_dialogue: true }),
    entities: {
      dispositions: ["AI", "FRACTAL"],
      dynamic_axes: ["AI", "FRACTAL"],
      nearby_entities: true,
    },
    task: { think_format: "character" },
  }),

  ghostwrite: define_mode("ghostwrite", {
    system: { mode: "ghostwrite", role: "INTERACTION" },
    protocols: prose_protocols({ include_dialogue: true }),
    entities: {
      dispositions: ["AI", "FRACTAL"],
      dynamic_axes: ["AI", "FRACTAL"],
      nearby_entities: true,
    },
    task: { think_format: "character" },
  }),

  npc: define_mode("npc", {
    system: "NPC",
    protocols: prose_protocols({ include_dialogue: true }),
    entities: {
      dispositions: ["FRACTAL", "NPC"],
      dynamic_axes: ["NPC", "FRACTAL"],
      nearby_entities: true,
    },
    task: { think_format: "character" },
  }),

  narrator: define_mode("narrator", {
    system: { mode: "narrator", role: "NARRATOR", pov: "NARRATOR" },
    protocols: prose_protocols(),
    entities: {
      dispositions: ["AI", "USER", "FRACTAL", "NPC"],
      dynamic_axes: ["FRACTAL"],
      user_agenda: true,
      nearby_entities: true,
    },
    task: { think_format: "narrator" },
  }),

  // ── Shot 2B: Back Shot (Background / Continuum Caretaker) ──────────────────

  continuum: define_mode("continuum", {
    system: "CONTINUUM_CARETAKER",
    constitution: false,
    protocols: ["HYGIENE.DATA"],
    entities: {
      target_context: true,
      nearby_entities: true,
      chapter_history: true,
    },
    history: { limit: 16 },
    format: {
      mode: "json",
      schema: ["_thought_process", "target", "eternal", "present", "future", "past", "relationships"],
    },
  }),

  // ── Profile Enhancement & Ingestion Structuring ─────────────────────────────

  enhancement: define_mode("enhancement", {
    system: "ENHANCER",
    constitution: false,
    protocols: ["HYGIENE.DATA"],
    entities: { field_context: true },
    format: "PROSE",
  }),

  sorting: define_mode("sorting", {
    system: "NARRATIVE_STRUCTURER",
    constitution: false,
    protocols: ["HYGIENE.DATA"],
    format: {
      mode: "json",
      schema: ["name", "description", "signature_color", "eternal", "present", "past", "future"],
    },
  }),

  // ── Sensory Cortex: Visual Optics Generation ──────────────────────────────

  optics: define_mode("optics", {
    system: { mode: "optics", role: "SENSORY_CORTEX" },
    constitution: false,
    protocols: ["HYGIENE.DATA", "OPTICS.WEIGHTING_RESTRICTIONS", "OPTICS.AFFIRMATIVE_FRAMING", "OPTICS.TYPOGRAPHY", "OPTICS.ENVIRONMENTAL_GROUNDING"],
    task: { think_format: "optics" },
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
