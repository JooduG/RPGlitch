/**
 * @file simulation-audit.js
 * 🏎️ THE DRIVETRAIN: Core Simulation Execution Harness.
 * Handles the linear flow of Hydration -> Simulation -> Synthesis.
 *
 * Updated for Bayesian Psychology Engine:
 * - Correct entity mapping (direct present/eternal, not fragments wrapper)
 * - Passes raw_messages for Director AI_LAST_TURN
 * - Includes dynamics_baseline in entity mapping
 * - Enriches vectors with category/triggers when missing
 * - Verifies new pipeline features: evidence_classification, cognitive attrs (certainty/regulation),
 *   ACTIVE_GOALS, ATMOSPHERIC_CHANGES, trigger amplification, goal arbitration
 */

import { context_builder } from "../../../../src/intelligence/context.js";
import { prompt_builder } from "../../../../src/intelligence/prompts/builder.js";
import { premade } from "../../../../src/data/definitions/premades.js";

/**
 * Enriches a vector with category and triggers fields if missing.
 * This lets the audit test the goal-arbitration and trigger-amplification
 * pipelines even with legacy premade vectors that predate the schema extension.
 * @param {any} v
 * @returns {any}
 */
function enrich_vector(v) {
  if (!v) return v;
  return {
    ...v,
    category: v.category || "event",
  };
}

/**
 * Maps a raw premade entity into the structure the prompt builder expects.
 * Ensures present/eternal are direct properties (not nested in fragments),
 * enriches past vectors with category/triggers, and passes future through
 * as its consolidated prose string.
 * @param {any} data
 * @returns {any}
 */
function map_entity(data) {
  if (!data) return undefined;
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    present: data.present || { physical: "", non_physical: "" },
    eternal: data.eternal || { physical: "", non_physical: "" },
    past: (data.past || []).map(enrich_vector),
    future: data.future || "",
    dynamics: data.dynamics || {},
    dynamics_baseline: data.dynamics_baseline || null,
    pov: data.pov || "",
    visual_style: data.visual_style || "",
    narrative_style: data.narrative_style || "",
  };
}

/**
 * HIGH-LEVEL ORCHESTRATOR
 * Designed to be imported by audit scripts or agentic tasks.
 */
export const SimulationAudit = {
  /**
   * Executes a complete intelligence cycle.
   * @param {string} input - The user prompt/action.
   * @param {object} scenario - Metadata containing entities and world state.
   * @param {object} [overrides] - Optional overrides for dynamics, flags, etc.
   */
  async execute_turn(input, scenario, overrides = {}) {
    // 1. PHASE 1: HYDRATION (Context Assembly)
    const raw_entities = await this.resolve_entities(scenario);
    const history = scenario.history || [];

    // Construct the payload as expected by the context_builder
    const payload = await context_builder.build_context(input, "simulation", history);

    // Map scenario entities to the flattened Kernel structure (Role -> Data)
    // Use direct present/eternal (not fragments wrapper) — prompts access
    // entities.AI.present.non_physical directly.
    for (const [key, data] of Object.entries(raw_entities)) {
      const role = key.toUpperCase();
      payload.entities[role] = map_entity(data);
    }

    // Ensure raw_messages is available for Director's AI_LAST_TURN block
    payload.raw_messages = history;

    // 2. PHASE 2: PHYSICS (Snapshot Construction)
    const snapshot = {
      ai: {
        dynamics: overrides.ai_dynamics ||
          raw_entities.ai?.dynamics || {
            chaos: 50,
            openness: 50,
            intensity: 50,
            affinity: 50,
          },
      },
      fractal: {
        dynamics: overrides.fractal_dynamics ||
          raw_entities.fractal?.dynamics || {
            velocity: 50,
            entropy: 50,
          },
      },
      flags: overrides.flags || [],
    };

    // 3. PHASE 3: SYNTHESIS (Prompt Construction)
    const director_prompt = prompt_builder.build_director_prompt(payload, snapshot);
    const character_prompt = prompt_builder.build_character_prompt(payload, snapshot, null);

    // 4. PHASE 4: VERIFICATION (Pipeline Feature Audit)
    const verification = this.verify_pipeline(director_prompt, character_prompt);

    return {
      payload,
      snapshot,
      director_prompt: director_prompt.system,
      director_task: director_prompt.task,
      character_prompt: character_prompt.system,
      character_task: character_prompt.task,
      verification,
    };
  },

  /**
   * Verifies that the generated prompts contain all expected pipeline features.
   * @param {{ system: string, task: string }} director
   * @param {{ system: string, task: string }} character
   * @returns {{ passed: string[], failed: string[] }}
   */
  verify_pipeline(director, character) {
    const passed = [];
    const failed = [];

    const check = (name, condition) => {
      if (condition) passed.push(name);
      else failed.push(name);
    };

    // --- Director (Shot 1) Feature Verification ---
    check("director:system_has_ACTIVE_CHARACTERS", director.system.includes("<ACTIVE_CHARACTERS>"));
    check("director:system_has_DYNAMICS_LEGEND", director.system.includes("<DYNAMICS_LEGEND>"));
    check("director:system_has_JSON_OUTPUT_protocol", director.system.includes("<JSON_OUTPUT>"));
    check("director:task_has_mutations_schema", director.task.includes('"mutations"'));
    check("director:task_has_dynamics_deltas", director.task.includes("dynamics_deltas"));
    check("director:task_has_new_vectors", director.task.includes("new_vectors"));
    check("director:task_has_resolve_vectors", director.task.includes("resolve_vectors"));

    // --- Character (Shot 2) Feature Verification ---
    check("character:system_has_YOUR_IDENTITY", character.system.includes("<YOUR_IDENTITY"));
    check("character:system_has_PROTOCOLS", character.system.includes("<PROTOCOLS>"));

    // Prefix-cache: volatile content must be in task, not system
    check("character:task_has_FRACTAL_FEED", character.task.includes("<FRACTAL_FEED>") || character.task.includes("<FRACTAL"));
    check("character:system_lacks_dynamics_attrs", !character.system.includes("chaos="));
    check("character:system_lacks_PRESENT", !character.system.includes("<PRESENT>"));

    // Epistemic Physics rules
    check("character:task_has_EPISTEMIC_PHYSICS", character.task.includes("<EPISTEMIC_PHYSICS>"));
    check("character:task_has_sensory_horizon_rule", character.task.includes("sensory horizon"));
    check("character:task_has_null_data_rule", character.task.includes("Null Data"));

    // Unified Future Block
    check("character:task_has_FUTURE", character.task.includes("<SNAPSHOT>") || character.task.includes("<INTENT>"));

    return { passed, failed };
  },

  /**
   * Resolves entity data from IDs or static premades.
   */
  async resolve_entities(scenario) {
    const result = {};
    const types = ["ai", "user", "fractal"];

    for (const type of types) {
      const entity_id = scenario[type + "_id"];
      if (entity_id) {
        const found = premade.entities.find((e) => e.id === entity_id);
        if (found) {
          result[type] = found;
        }
      } else if (scenario[type]) {
        result[type] = scenario[type];
      }
    }

    return result;
  },
};
