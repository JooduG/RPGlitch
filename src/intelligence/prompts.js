/**
 * src/intelligence/prompts.js
 * ============================================================================
 * 🎭 PROMPTS MANIFEST — Master Module-Keyed Switchboard
 * ============================================================================
 *
 * Sovereign switchboard declaring the 7-layer blueprint for all simulation prompts:
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
 * Architecture & Modification Rules:
 * - Zero backward compatibility (P4): single frozen switchboard catalog.
 * - Every key below is read by the assembly line in ./builder.js.
 * ============================================================================
 */

export const PROMPTS = Object.freeze({
  // ── Shot 2A: Prose Shots (Canonical Narrative Voice) ────────────────────────

  interaction: Object.freeze({
    system: Object.freeze({ role: "DEFAULT", mode: "interaction" }),
    constitution: Object.freeze({ axiomatic: true }),
    protocols: Object.freeze([]), // Emits <CORE_PROTOCOLS>
    entities: Object.freeze({
      dispositions: Object.freeze(["AI", "FRACTAL"]),
      dynamic_axes: Object.freeze(["AI", "FRACTAL"]),
      user_agenda: false,
      proximate_npcs: true,
      spotlight: false,
    }),
    history: Object.freeze({ enabled: true, limit: 10 }),
    task: Object.freeze({ input_tag: "INPUT", think_format: "character" }),
    format: "PROSE",
  }),

  ghostwrite: Object.freeze({
    system: Object.freeze({ role: "DEFAULT", mode: "ghostwrite" }),
    constitution: Object.freeze({ axiomatic: true }),
    protocols: Object.freeze([]), // Emits <CORE_PROTOCOLS>
    entities: Object.freeze({
      dispositions: Object.freeze(["AI", "FRACTAL"]),
      dynamic_axes: Object.freeze(["AI", "FRACTAL"]),
      user_agenda: false,
      proximate_npcs: true,
      spotlight: false,
    }),
    history: Object.freeze({ enabled: true, limit: 10 }),
    task: Object.freeze({ input_tag: "INPUT", think_format: "character" }),
    format: "PROSE",
  }),

  npc: Object.freeze({
    system: Object.freeze({ role: "NPC", mode: "npc" }),
    constitution: Object.freeze({ axiomatic: true }),
    protocols: Object.freeze([]), // Emits <CORE_PROTOCOLS>
    entities: Object.freeze({
      dispositions: Object.freeze(["FRACTAL", "NPC"]),
      dynamic_axes: Object.freeze(["NPC", "FRACTAL"]),
      user_agenda: false,
      proximate_npcs: true,
      spotlight: false,
    }),
    history: Object.freeze({ enabled: true, limit: 10 }),
    task: Object.freeze({ input_tag: "INPUT", think_format: "character" }),
    format: "PROSE",
  }),

  narrator: Object.freeze({
    system: Object.freeze({ role: "NARRATOR", mode: "narrator" }),
    constitution: Object.freeze({ axiomatic: true }),
    protocols: Object.freeze([]), // Emits <CORE_PROTOCOLS>
    entities: Object.freeze({
      dispositions: Object.freeze(["AI", "USER", "FRACTAL", "NPC"]),
      dynamic_axes: Object.freeze(["FRACTAL"]),
      user_agenda: true,
      proximate_npcs: true,
      spotlight: false,
    }),
    history: Object.freeze({ enabled: true, limit: 10 }),
    task: Object.freeze({ input_tag: "INPUT", think_format: "narrator" }),
    format: "PROSE",
  }),

  // ── Shot 1: Quick Shot (Directorial Mechanics) ───────────────

  director: Object.freeze({
    system: Object.freeze({ role: "DIRECTOR", mode: "director" }),
    constitution: Object.freeze({ axiomatic: false }),
    protocols: Object.freeze(["STATE.PSEUDO_JSON", "COGNITION.EPISTEMIC_PHYSICS"]),
    entities: Object.freeze({
      dispositions: Object.freeze(["AI", "USER", "FRACTAL", "NPC"]),
      dynamic_axes: Object.freeze(["AI", "FRACTAL"]),
      user_agenda: true,
      proximate_npcs: false,
      spotlight: true,
    }),
    history: Object.freeze({ enabled: true, limit: 10 }),
    task: Object.freeze({ input_tag: "USER_ACTION", think_format: null }),
    format: "DIRECTOR",
  }),

  // ── Shot 2B: Back Shot (Background / Continuum Caretaker) ─────────────────

  continuum: Object.freeze({
    system: Object.freeze({ role: "CONTINUUM_CARETAKER", mode: "continuum" }),
    constitution: Object.freeze({ axiomatic: false }),
    protocols: Object.freeze(["HYGIENE.DATA", "AGENCY.PRESENT_TENSE", "STATE.PSEUDO_JSON"]),
    entities: Object.freeze({
      target_context: true,
      scene_cast: true,
      chapter_history: true,
      dispositions: Object.freeze([]),
      dynamic_axes: Object.freeze([]),
      user_agenda: false,
      proximate_npcs: false,
      spotlight: false,
    }),
    history: Object.freeze({ enabled: true, limit: 10 }),
    task: Object.freeze({ input_tag: "INPUT_HISTORY", think_format: null }),
    format: "CONTINUUM",
  }),

  // ── Profile Enhancement & Ingestion Structuring ──────────────────

  enhancement: Object.freeze({
    system: Object.freeze({ role: "ENHANCER", mode: "enhancement" }),
    constitution: Object.freeze({ axiomatic: false }),
    protocols: Object.freeze(["HYGIENE.DATA"]),
    entities: Object.freeze({
      field_context: true,
      dispositions: Object.freeze([]),
      dynamic_axes: Object.freeze([]),
      user_agenda: false,
      proximate_npcs: false,
      spotlight: false,
    }),
    history: Object.freeze({ enabled: false }),
    task: Object.freeze({ input_tag: "INPUT_CONTENT", think_format: null }),
    format: "PROSE",
  }),

  sorting: Object.freeze({
    system: Object.freeze({ role: "NARRATIVE_STRUCTURER", mode: "sorting" }),
    constitution: Object.freeze({ axiomatic: false }),
    protocols: Object.freeze(["HYGIENE.DATA"]),
    entities: Object.freeze({
      dispositions: Object.freeze([]),
      dynamic_axes: Object.freeze([]),
      user_agenda: false,
      proximate_npcs: false,
      spotlight: false,
    }),
    history: Object.freeze({ enabled: false }),
    task: Object.freeze({ pov: "THIRD_PERSON", think_format: null }),
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
 * - 2026-09-12: Elevated prompts.js into a standardized 7-module switchboard aligning Shot 1 (Quick Shot: director), Shot 2A (Prose Shot: interaction/ghostwrite/npc/narrator), Shot 2B (Back Shot: continuum), and auxiliary tools (enhancement, sorting). Added explicit history configuration to all modes.
 * - 2026-09-11: Wired the manifest to the assembly line — protocol lists, constitution gating, entity context gates, role keys, schema/contract keys and the sorting POV key are now consumed by builder.js. Pruned inert task.directive/task.rules/task.directives keys and reconciled protocol lists with emitted output. Removed the PROMPT_MODES/get_prompt_mode compatibility aliases (P4).
 * - 2026-09-11: Renamed prompt-modes.js -> prompts.js. Elevated to module-keyed manifest registering all 8 prompt modes (system, constitution, protocols, entities, task).
 * - 2026-09-11: Converted prompt-modes.json into canonical ESM module with frozen schemas.
 */
