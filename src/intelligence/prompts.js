/**
 * src/intelligence/prompts.js
 * ============================================================================
 * 🎭 PROMPTS MANIFEST — Master Module-Keyed Switchboard
 * ============================================================================
 *
 * Sovereign switchboard declaring the 7-layer blueprint for all simulation prompts.
 *
 * ── Multi-Shot Simulation Cycle ─────────────────────────────────────────────
 * • Shot 1  (Quick Shot) : director    — Turn staging & mechanical state
 * • Shot 2A (Prose Shot) : interaction — AI character voice (canonical)
 *                        : ghostwrite  — User persona turn drafter
 *                        : npc         — Supporting stage character
 *                        : narrator    — Fractal environment/world voice
 * • Shot 2B (Back Shot)  : continuum   — Memory Forge temporal consolidation
 *
 * ── Auxiliary Tooling ───────────────────────────────────────────────────────
 * • Tool A (Magic Wand)  : enhancement — Single profile field expansion
 * • Tool B (Structurer)  : sorting     — Raw ingestion structuring
 *
 * ── The 7-Layer Universal Pipeline ──────────────────────────────────────────
 * 1. system       : Root <SYSTEM> envelope mode & SYSTEM_ROLES factory key
 * 2. constitution : Axiomatic core laws (L1–L5) toggle
 * 3. protocols    : Ordered protocol atoms or empty array (emits <CORE_PROTOCOLS>)
 * 4. entities     : Scoping for sheets, dispositions, dynamic axes, spotlight
 * 5. history      : Conversation history windowing configuration
 * 6. task         : Turn payload, input tag, and think format calibration
 * 7. format       : Output specification key (PROSE, DIRECTOR, CONTINUUM, PROFILE)
 *
 * Every mode is produced by `define_mode`, which layers a mode's deviations over
 * the canonical layer defaults and deep-freezes the result — so a mode reads as a
 * short declarative delta (mirroring the catalog + resolver shape of format.js)
 * instead of repeating the full 7-layer skeleton.
 *
 * Architecture & Modification Rules:
 * - Zero backward compatibility (P4): single frozen switchboard catalog.
 * - Every key below is read by the assembly line in ./builder.js.
 * ============================================================================
 */

/**
 * Recursively freezes an object graph (arrays included).
 * @template T
 * @param {T} value
 * @returns {T}
 */
function deep_freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(deep_freeze);
    Object.freeze(value);
  }
  return value;
}

/**
 * Canonical layer defaults — every mode spreads its deviations over these.
 * @type {Readonly<Record<string, any>>}
 */
const MODE_DEFAULTS = Object.freeze({
  system: Object.freeze({ role: "DEFAULT" }),
  constitution: Object.freeze({ axiomatic: true }),
  protocols: Object.freeze([]),
  entities: Object.freeze({
    dispositions: Object.freeze([]),
    dynamic_axes: Object.freeze([]),
    user_agenda: false,
    proximate_npcs: false,
    spotlight: false,
  }),
  history: Object.freeze({ enabled: true, limit: 10 }),
  task: Object.freeze({ input_tag: "INPUT", think_format: null }),
});

/**
 * Builds one frozen mode record from a declarative delta over MODE_DEFAULTS.
 * @param {Object} spec
 * @param {string} spec.mode - <SYSTEM mode="..."> value (and the mode's identity).
 * @param {string} [spec.role="DEFAULT"] - SYSTEM_ROLES factory key.
 * @param {boolean} [spec.axiomatic=true] - Whether to emit the AXIOMATIC_CONSTITUTION.
 * @param {string[]} [spec.protocols=[]] - Ordered protocol keys (dotted) for the <PROTOCOLS> block.
 * @param {Object} [spec.entities={}] - Entity-sheet scoping delta.
 * @param {Object} [spec.history={enabled:true, limit:10}] - History window config.
 * @param {Object} [spec.task={}] - Task-layer delta (input_tag, think_format, pov).
 * @param {string} spec.format - OUTPUT_FORMATS key (PROSE | DIRECTOR | PROFILE | CONTINUUM).
 * @returns {Readonly<Object>}
 */
function define_mode({ mode, role = "DEFAULT", axiomatic = true, protocols = [], entities = {}, history = {}, task = {}, format }) {
  return deep_freeze({
    system: { ...MODE_DEFAULTS.system, role, mode },
    constitution: { ...MODE_DEFAULTS.constitution, axiomatic },
    protocols: [...protocols],
    entities: { ...MODE_DEFAULTS.entities, ...entities },
    history: { ...MODE_DEFAULTS.history, ...history },
    task: { ...MODE_DEFAULTS.task, ...task },
    format,
  });
}

export const PROMPTS = Object.freeze({
  // ── Shot 2A: Prose Shots (Canonical Narrative Voice) ────────────────────────

  interaction: define_mode({
    mode: "interaction",
    role: "DEFAULT",
    entities: { dispositions: ["AI", "FRACTAL"], dynamic_axes: ["AI", "FRACTAL"], proximate_npcs: true },
    task: { think_format: "character" },
    format: "PROSE",
  }),

  ghostwrite: define_mode({
    mode: "ghostwrite",
    role: "DEFAULT",
    entities: { dispositions: ["AI", "FRACTAL"], dynamic_axes: ["AI", "FRACTAL"], proximate_npcs: true },
    task: { think_format: "character" },
    format: "PROSE",
  }),

  npc: define_mode({
    mode: "npc",
    role: "NPC",
    entities: { dispositions: ["FRACTAL", "NPC"], dynamic_axes: ["NPC", "FRACTAL"], proximate_npcs: true },
    task: { think_format: "character" },
    format: "PROSE",
  }),

  narrator: define_mode({
    mode: "narrator",
    role: "NARRATOR",
    entities: { dispositions: ["AI", "USER", "FRACTAL", "NPC"], dynamic_axes: ["FRACTAL"], user_agenda: true, proximate_npcs: true },
    task: { think_format: "narrator" },
    format: "PROSE",
  }),

  // ── Shot 1: Quick Shot (Directorial Mechanics) ──────────────────────────────

  director: define_mode({
    mode: "director",
    role: "DIRECTOR",
    axiomatic: false,
    protocols: ["STATE.PSEUDO_JSON", "COGNITION.EPISTEMIC_PHYSICS"],
    entities: { dispositions: ["AI", "USER", "FRACTAL", "NPC"], dynamic_axes: ["AI", "FRACTAL"], user_agenda: true, spotlight: true },
    task: { input_tag: "USER_ACTION" },
    format: "DIRECTOR",
  }),

  // ── Shot 2B: Back Shot (Background / Continuum Caretaker) ──────────────────

  continuum: define_mode({
    mode: "continuum",
    role: "CONTINUUM_CARETAKER",
    axiomatic: false,
    protocols: ["HYGIENE.DATA", "AGENCY.PRESENT_TENSE", "STATE.PSEUDO_JSON"],
    entities: { target_context: true, scene_cast: true, chapter_history: true },
    history: { limit: 16 },
    task: { input_tag: "INPUT_HISTORY" },
    format: "CONTINUUM",
  }),

  // ── Profile Enhancement & Ingestion Structuring ─────────────────────────────

  enhancement: define_mode({
    mode: "enhancement",
    role: "ENHANCER",
    axiomatic: false,
    protocols: ["HYGIENE.DATA"],
    entities: { field_context: true },
    history: { enabled: false },
    task: { input_tag: "INPUT_CONTENT" },
    format: "PROSE",
  }),

  sorting: define_mode({
    mode: "sorting",
    role: "NARRATIVE_STRUCTURER",
    axiomatic: false,
    protocols: ["HYGIENE.DATA"],
    history: { enabled: false },
    task: { pov: "THIRD_PERSON" },
    format: "PROFILE",
  }),
});

/**
 * Resolves a prompt manifest record by key, falling back to `interaction`.
 * @param {string} [key]
 * @returns {typeof PROMPTS[keyof typeof PROMPTS]}
 */
export function get_prompt(key) {
  return (key && PROMPTS[key]) || PROMPTS.interaction;
}

/**
 * Resolves prompt config according to speaker context and turn flags.
 * @param {{ is_npc?: boolean, ghostwrite?: boolean }} [options]
 */
export function resolve_prompt_mode({ is_npc = false, ghostwrite = false } = {}) {
  if (ghostwrite) return get_prompt("ghostwrite");
  if (is_npc) return get_prompt("npc");
  return get_prompt("interaction");
}

export default PROMPTS;

/**
 * CHANGELOG
 * - 2026-09-12: Standardization pass — the `continuum` mode declares its history window (`history.limit`), now consumed by builder.js via history.js `resolve_history` (the window was previously hardcoded at the call site).
 * - 2026-09-12: Standardization pass — replaced the repeated 7-layer skeleton with a declarative `define_mode` factory (MODE_DEFAULTS + per-mode delta + deep-freeze), so each mode is a short data record and the layer defaults live in one place. Values are unchanged.
 * - 2026-09-12: Elevated prompts.js into a standardized 7-module switchboard aligning Shot 1 (Quick Shot: director), Shot 2A (Prose Shot: interaction/ghostwrite/npc/narrator), Shot 2B (Back Shot: continuum), and auxiliary tools (enhancement, sorting). Added explicit history configuration to all modes.
 * - 2026-09-11: Wired the manifest to the assembly line — protocol lists, constitution gating, entity context gates, role keys, schema/contract keys and the sorting POV key are now consumed by builder.js. Pruned inert task.directive/task.rules/task.directives keys and reconciled protocol lists with emitted output. Removed the PROMPT_MODES/get_prompt_mode compatibility aliases (P4).
 * - 2026-09-11: Renamed prompt-modes.js -> prompts.js. Elevated to module-keyed manifest registering all 8 prompt modes (system, constitution, protocols, entities, task).
 * - 2026-09-11: Converted prompt-modes.json into canonical ESM module with frozen schemas.
 */
