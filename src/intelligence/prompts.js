/**
 * src/intelligence/prompts.js
 * ============================================================================
 * 🎭 PROMPTS MANIFEST — Master Module-Keyed Prompt Registry
 * ============================================================================
 *
 * Declarative configuration manifest registering every prompt mode in the simulation:
 * - interaction: The AI character speaks (canonical Shot-2 mode)
 * - ghostwrite: Drafts the player's turn as the User Persona
 * - npc: A stage NPC speaks (routes somatic axes and dispositions to the NPC)
 * - narrator: The world/fractal environment speaks
 * - director: Turn orchestration and staging (Shot-1 mode)
 * - memory_forge: Temporal state consolidation (Shot-2 back-shot)
 * - enhancement: Magic wand single profile field expansion
 * - sorting: Raw ingestion structuring into profile fields
 *
 * Architecture & Module Keys:
 * Each prompt entry declaratively structures what it pulls from the 5 core modules:
 * - system: Root envelope metadata and role line resolver key
 * - constitution: Axiomatic core inclusion
 * - protocols: List of canonical protocol keys
 * - entities: Sheet scoping, dispositions, dynamic axes, and spotlight flags
 * - task: Turn block formatting, think format, directives, schemas, and contracts
 * ============================================================================
 */

/**
 * Master dictionary of simulation prompt configurations.
 */
export const PROMPTS = Object.freeze({
  interaction: Object.freeze({
    system: Object.freeze({
      role: "DEFAULT",
      mode: "interaction",
    }),
    constitution: Object.freeze({
      axiomatic: true,
    }),
    protocols: Object.freeze(["STATE.PSEUDO_JSON", "COGNITION.EPISTEMIC_PHYSICS", "HYGIENE.DATA"]),
    entities: Object.freeze({
      dispositions: Object.freeze(["AI", "FRACTAL"]),
      dynamic_axes: Object.freeze(["AI", "FRACTAL"]),
      user_agenda: false,
      proximate_npcs: true,
      spotlight: false,
    }),
    task: Object.freeze({
      think_format: "character",
      input_tag: "INPUT",
      directive: "ADVANCE",
    }),
  }),

  ghostwrite: Object.freeze({
    system: Object.freeze({
      role: "DEFAULT",
      mode: "ghostwrite",
    }),
    constitution: Object.freeze({
      axiomatic: true,
    }),
    protocols: Object.freeze(["STATE.PSEUDO_JSON", "COGNITION.EPISTEMIC_PHYSICS", "HYGIENE.DATA"]),
    entities: Object.freeze({
      dispositions: Object.freeze(["AI", "FRACTAL"]),
      dynamic_axes: Object.freeze(["AI", "FRACTAL"]),
      user_agenda: false,
      proximate_npcs: true,
      spotlight: false,
    }),
    task: Object.freeze({
      think_format: "character",
      input_tag: "INPUT",
      directive: "GHOSTWRITE",
    }),
  }),

  npc: Object.freeze({
    system: Object.freeze({
      role: "NPC",
      mode: "npc",
    }),
    constitution: Object.freeze({
      axiomatic: true,
    }),
    protocols: Object.freeze(["STATE.PSEUDO_JSON", "COGNITION.EPISTEMIC_PHYSICS", "HYGIENE.DATA"]),
    entities: Object.freeze({
      dispositions: Object.freeze(["FRACTAL", "NPC"]),
      dynamic_axes: Object.freeze(["NPC", "FRACTAL"]),
      user_agenda: false,
      proximate_npcs: true,
      spotlight: false,
    }),
    task: Object.freeze({
      think_format: "character",
      input_tag: "INPUT",
      directive: "ADVANCE",
    }),
  }),

  narrator: Object.freeze({
    system: Object.freeze({
      role: "NARRATOR",
      mode: "narrator",
    }),
    constitution: Object.freeze({
      axiomatic: true,
    }),
    protocols: Object.freeze(["STATE.PSEUDO_JSON", "COGNITION.EPISTEMIC_PHYSICS", "HYGIENE.DATA"]),
    entities: Object.freeze({
      dispositions: Object.freeze(["AI", "USER", "FRACTAL", "NPC"]),
      dynamic_axes: Object.freeze(["FRACTAL"]),
      user_agenda: true,
      proximate_npcs: true,
      spotlight: false,
    }),
    task: Object.freeze({
      think_format: "narrator",
      input_tag: "INPUT",
      directive: "SCENE",
    }),
  }),

  director: Object.freeze({
    system: Object.freeze({
      role: "DIRECTOR",
      mode: "director",
    }),
    constitution: Object.freeze({
      axiomatic: false,
    }),
    protocols: Object.freeze(["STATE.PSEUDO_JSON", "COGNITION.EPISTEMIC_PHYSICS"]),
    entities: Object.freeze({
      dispositions: Object.freeze(["AI", "USER", "FRACTAL", "NPC"]),
      dynamic_axes: Object.freeze(["AI", "FRACTAL"]),
      user_agenda: true,
      proximate_npcs: false,
      spotlight: true,
    }),
    task: Object.freeze({
      schema: "DIRECTOR_SCHEMA",
      input_tag: "USER_ACTION",
      rules: "DIRECTOR_TASK_RULES",
      think_format: null,
    }),
  }),

  memory_forge: Object.freeze({
    system: Object.freeze({
      role: "CONTINUUM_CARETAKER",
      mode: "memory_forge",
    }),
    constitution: Object.freeze({
      axiomatic: false,
    }),
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
    task: Object.freeze({
      contract: "TEMPORAL_CONTRACT",
      schema: "MEMORY_FORGE_SCHEMA",
      input_tag: "INPUT_HISTORY",
      think_format: null,
    }),
  }),

  enhancement: Object.freeze({
    system: Object.freeze({
      role: "ENHANCER",
      mode: "enhancement",
    }),
    constitution: Object.freeze({
      axiomatic: false,
    }),
    protocols: Object.freeze(["HYGIENE.DATA"]),
    entities: Object.freeze({
      field_context: true,
      dispositions: Object.freeze([]),
      dynamic_axes: Object.freeze([]),
      user_agenda: false,
      proximate_npcs: false,
      spotlight: false,
    }),
    task: Object.freeze({
      contract: "TEMPORAL_CONTRACT",
      input_tag: "INPUT_CONTENT",
      think_format: null,
    }),
  }),

  sorting: Object.freeze({
    system: Object.freeze({
      role: "NARRATIVE_STRUCTURER",
      mode: "sorting",
    }),
    constitution: Object.freeze({
      axiomatic: false,
    }),
    protocols: Object.freeze(["HYGIENE.DATA", "POV.THIRD_PERSON"]),
    entities: Object.freeze({
      dispositions: Object.freeze([]),
      dynamic_axes: Object.freeze([]),
      user_agenda: false,
      proximate_npcs: false,
      spotlight: false,
    }),
    task: Object.freeze({
      schema: "PROFILE_SCHEMA",
      directives: "SORTING_DIRECTIVES",
      think_format: null,
    }),
  }),
});

/**
 * Compatible alias for legacy PROMPT_MODES.
 */
export const PROMPT_MODES = PROMPTS;

/**
 * Resolves a prompt config by key, falling back to `interaction`.
 * Provides both modern and legacy property accessors for sheets and input.
 * @param {string} [key]
 * @returns {typeof PROMPTS[keyof typeof PROMPTS] & {
 *   system_mode: string,
 *   ghostwrite: boolean,
 *   input: { tag: string },
 *   think_format: string | null,
 *   sheets: typeof PROMPTS[keyof typeof PROMPTS]['entities']
 * }}
 */
export function get_prompt(key) {
  const base = (key && PROMPTS[key]) || PROMPTS.interaction;
  return Object.assign({}, base, {
    system_mode: base.system?.mode || "interaction",
    ghostwrite: base.system?.mode === "ghostwrite",
    input: { tag: base.task?.input_tag || "INPUT" },
    think_format: base.task?.think_format || null,
    sheets: base.entities,
  });
}

/**
 * Backward-compatible alias for get_prompt.
 */
export const get_prompt_mode = get_prompt;

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
 * - 2026-09-11: Renamed prompt-modes.js -> prompts.js. Elevated to module-keyed manifest registering all 8 prompt modes (system, constitution, protocols, entities, task).
 * - 2026-09-11: Streamlined PROMPT_MODES to the 5 core simulation turn modes, simplified input schema to { tag }, and pruned dead fields/mock modes.
 * - 2026-09-11: Expanded PROMPT_MODES registry with tooling & state engine modes: enhancement, profile, and temporal.
 * - 2026-09-11: Converted prompt-modes.json into canonical ESM module prompt-modes.js with frozen schemas and Universal File Architecture.
 */
