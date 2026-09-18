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

// ── 1. Master Mode Factory ───────────────────────────────────────────────────

/**
 * Builds one frozen mode record from a declarative delta over the 7 canonical layers.
 */
function define_mode(spec) {
  const system =
    typeof spec.system === "string"
      ? { mode: spec.system.toLowerCase(), role: spec.system.toUpperCase() }
      : spec.system || { mode: "interaction", role: "INTERACTION" };

  return Object.freeze({
    system,
    constitution: spec.constitution ?? true,
    protocols: spec.protocols || [],
    entities: {
      dispositions: [],
      dynamic_axes: [],
      user_agenda: false,
      nearby_entities: false,
      present_entities: false,
      ...spec.entities,
    },
    history: { enabled: true, limit: 10, ...spec.history },
    task: { input_tag: "INPUT", think_format: null, ...spec.task },
    format: spec.format || "PROSE",
  });
}

// ── 2. Master Mode Manifest ──────────────────────────────────────────────────

export const PROMPTS = Object.freeze({
  // ── Shot 1: Quick Shot (Directorial Mechanics) ──────────────────────────────

  director: define_mode({
    system: "DIRECTOR",
    constitution: false,
    protocols: ["CORE_PROTOCOLS.ALTERNATION_OPTIONS"],
    entities: {
      dispositions: ["AI", "USER", "FRACTAL", "NPC"],
      dynamic_axes: ["AI", "FRACTAL"],
      user_agenda: true,
      present_entities: true,
    },
    format: "DIRECTOR",
  }),

  director_terse: define_mode({
    system: { mode: "director", role: "DIRECTOR" },
    constitution: false,
    protocols: [],
    entities: {
      dispositions: [],
      dynamic_axes: [],
    },
    history: { enabled: false },
    task: { terse: true },
    format: "DIRECTOR",
  }),

  // ── Shot 2A: Prose Shots (Canonical Narrative Voice) ────────────────────────

  interaction: define_mode({
    system: "INTERACTION",
    protocols: [
      "CORE_PROTOCOLS.SIMULATION_FIDELITY",
      "CORE_PROTOCOLS.PERSPECTIVE.POV.FIRST",
      "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.TYPOGRAPHY",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.PHYSICALITY",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.ANTI_TROPES",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.BANNED_CLICHES",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.NATURAL_DIALOGUE",
      "CORE_PROTOCOLS.ALTERNATION_OPTIONS",
    ],
    entities: {
      dispositions: ["AI", "FRACTAL"],
      dynamic_axes: ["AI", "FRACTAL"],
      nearby_entities: true,
    },
    history: { limit: 16 },
    task: { think_format: "character" },
  }),

  ghostwrite: define_mode({
    system: { mode: "ghostwrite", role: "INTERACTION" },
    protocols: [
      "CORE_PROTOCOLS.SIMULATION_FIDELITY",
      "CORE_PROTOCOLS.PERSPECTIVE.POV.FIRST",
      "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.TYPOGRAPHY",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.PHYSICALITY",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.ANTI_TROPES",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.BANNED_CLICHES",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.NATURAL_DIALOGUE",
      "CORE_PROTOCOLS.ALTERNATION_OPTIONS",
    ],
    entities: {
      dispositions: ["AI", "FRACTAL"],
      dynamic_axes: ["AI", "FRACTAL"],
      nearby_entities: true,
    },
    history: { limit: 16 },
    task: { think_format: "character" },
  }),

  npc: define_mode({
    system: "NPC",
    protocols: [
      "CORE_PROTOCOLS.SIMULATION_FIDELITY",
      "CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD",
      "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.TYPOGRAPHY",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.PHYSICALITY",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.ANTI_TROPES",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.BANNED_CLICHES",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.NATURAL_DIALOGUE",
      "CORE_PROTOCOLS.ALTERNATION_OPTIONS",
    ],
    entities: {
      dispositions: ["FRACTAL", "NPC"],
      dynamic_axes: ["NPC", "FRACTAL"],
      nearby_entities: true,
    },
    history: { limit: 16 },
    task: { think_format: "character" },
  }),

  narrator: define_mode({
    system: "NARRATOR",
    protocols: [
      "CORE_PROTOCOLS.SIMULATION_FIDELITY",
      "CORE_PROTOCOLS.PERSPECTIVE.POV.NARRATOR",
      "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.TYPOGRAPHY",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.PHYSICALITY",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.ANTI_TROPES",
      "CORE_PROTOCOLS.PROSE_DISCIPLINE.BANNED_CLICHES",
      "CORE_PROTOCOLS.ALTERNATION_OPTIONS",
    ],
    entities: {
      dispositions: ["AI", "USER", "FRACTAL", "NPC"],
      dynamic_axes: ["FRACTAL"],
      user_agenda: true,
      nearby_entities: true,
    },
    history: { limit: 16 },
    task: { think_format: "narrator" },
  }),

  // ── Shot 2B: Back Shot (Background / Continuum Caretaker) ──────────────────

  continuum: define_mode({
    system: "CONTINUUM_CARETAKER",
    constitution: false,
    protocols: ["HYGIENE.DATA", "CORE_PROTOCOLS.PERSPECTIVE.TENSE.PRESENT"],
    entities: {
      target_context: true,
      nearby_entities: true,
      chapter_history: true,
    },
    history: { limit: 16 },
    format: "CONTINUUM",
  }),

  // ── Profile Enhancement & Ingestion Structuring ─────────────────────────────

  enhancement: define_mode({
    system: "ENHANCER",
    constitution: false,
    protocols: ["HYGIENE.DATA"],
    entities: { field_context: true },
    history: { enabled: false },
  }),

  sorting: define_mode({
    system: "NARRATIVE_STRUCTURER",
    constitution: false,
    protocols: ["HYGIENE.DATA", "CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD"],
    history: { enabled: false },
    format: "PROFILE",
  }),

  // ── Sensory Cortex: Visual Optics Generation ──────────────────────────────

  optics: define_mode({
    system: { mode: "optics", role: "SENSORY_CORTEX" },
    constitution: false,
    protocols: ["HYGIENE.DATA"],
    entities: {
      dispositions: ["AI", "USER", "FRACTAL", "NPC"],
    },
    history: { enabled: false },
    format: "OPTICS",
  }),
});

// ── 3. Manifest Resolvers ────────────────────────────────────────────────────

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

export default PROMPTS;

/**
 * CHANGELOG
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
