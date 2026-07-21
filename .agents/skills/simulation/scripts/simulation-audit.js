/**
 * @file simulation-audit.js
 * 🏎️ THE DRIVETRAIN: Core Simulation Execution Harness.
 * Handles the linear flow of Hydration -> Simulation -> Synthesis.
 */

import { context_broker } from "../../../../src/intelligence/context.svelte.js";
import { prompt_builder } from "../../../../src/intelligence/prompts.js";
import { premade } from "../../../../src/data/premades.js";

/**
 * HIGH-LEVEL ORCHESTRATOR
 * Designed to be imported by audit scripts or agentic tasks.
 */
export const SimulationAudit = {
  /**
   * Executes a complete intelligence cycle.
   * @param {string} input - The user prompt/action.
   * @param {object} scenario - Metadata containing entities and world state.
   */
  async execute_turn(input, scenario) {
    // 1. PHASE 1: HYDRATION (Context Assembly)
    const raw_entities = await this.resolve_entities(scenario);
    const history = scenario.history || [];

    // Construct the payload as expected by the context_broker
    const payload = await context_broker.hydrate(input, "simulation", history);

    // Map scenario entities to the flattened Kernel structure (Role -> Data)
    for (const [key, data] of Object.entries(raw_entities)) {
      const role = key.toUpperCase();
      // Ensure we have the fragment structure the PromptBuilder expects
      payload.entities[role] = {
        id: data.id,
        name: data.name,
        fragments: {
          present: data.present || { physical: "", non_physical: "" },
          eternal: data.eternal || { physical: "", non_physical: "" },
        },
        past: data.past || [],
        future: data.future || [],
        dynamics: data.dynamics || { chaos: 50, openness: 50, intensity: 50, affinity: 50 },
      };
    }

    // 2. PHASE 2: PHYSICS (Passive)
    // The physics simulation is now triggered by the Director's output via gamemaster.
    // For audit purposes, we skip active mutations and just generate the prompts.
    const snapshot = {
      ai: { dynamics: { chaos: 50, openness: 50, intensity: 50, affinity: 50 } },
      fractal: { dynamics: { velocity: 50, entropy: 50 } },
      flags: [],
      signals: {},
      signal_prompts: [],
    };

    // 3. PHASE 3: SYNTHESIS (Prompt Construction)
    const director_prompt = prompt_builder.build_director_prompt(payload, snapshot);
    const character_prompt = prompt_builder.build_character_prompt(payload, snapshot, null);

    return {
      payload,
      director_prompt: director_prompt.system,
      director_task: director_prompt.task,
      character_prompt: character_prompt.system,
      character_task: character_prompt.task,
    };
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
        // Find in static premades (Audit Baseline)
        const found = premade.entities.find((e) => e.id === entity_id);
        if (found) {
          result[type] = found;
        }
      } else if (scenario[type]) {
        // Direct object pass
        result[type] = scenario[type];
      }
    }

    return result;
  },
};
