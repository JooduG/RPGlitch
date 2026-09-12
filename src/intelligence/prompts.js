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
 * - system: Root envelope metadata and role key (resolved through SYSTEM_ROLES)
 * - constitution: Axiomatic core inclusion
 * - protocols: Ordered protocol keys compiled into the <PROTOCOLS> block
 *   (prose modes emit the structural <CORE_PROTOCOLS> scaffold instead, so their
 *   list is empty)
 * - entities: Sheet scoping, dispositions, dynamic axes, context gates and spotlight
 * - task: Turn block formatting, think format, directives, schemas, and contracts
 *
 * Every key below is read by the assembly line in ./builder.js — this manifest is
 * the control surface, not documentation.
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
    protocols: Object.freeze([]),
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
    protocols: Object.freeze([]),
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
    protocols: Object.freeze([]),
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
    protocols: Object.freeze([]),
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
    protocols: Object.freeze(["HYGIENE.DATA"]),
    entities: Object.freeze({
      dispositions: Object.freeze([]),
      dynamic_axes: Object.freeze([]),
      user_agenda: false,
      proximate_npcs: false,
      spotlight: false,
    }),
    task: Object.freeze({
      schema: "PROFILE_SCHEMA",
      pov: "THIRD_PERSON",
      think_format: null,
    }),
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
 * - 2026-09-11: Wired the manifest to the assembly line — protocol lists, constitution gating, entity context gates, role keys, schema/contract keys and the sorting POV key are now consumed by builder.js. Pruned inert task.directive/task.rules/task.directives keys and reconciled protocol lists with emitted output. Removed the PROMPT_MODES/get_prompt_mode compatibility aliases (P4).
 * - 2026-09-11: Renamed prompt-modes.js -> prompts.js. Elevated to module-keyed manifest registering all 8 prompt modes (system, constitution, protocols, entities, task).
 * - 2026-09-11: Converted prompt-modes.json into canonical ESM module with frozen schemas.
 */
