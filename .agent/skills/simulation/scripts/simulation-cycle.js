/**
 * @file simulation-cycle.js
 * 🕹️ THE PULSE: The Simulation Cycle Orchestrator.
 * Governs Rule 02 and the transition between turns.
 */

import { dynamics_engine } from "../../../src/core/intelligence/dynamics-engine.js";
import { app } from "../../../src/state/app.svelte.js";

/**
 * THE MECHANICAL GATE: Processes a full cycle of cause and effect.
 * 1. User Input (Finalizes User Turn)
 * 2. System Turn (Synchronous Physics)
 * 3. AI Turn (Asynchronous Narrative)
 */
export const SimulationCycle = {
  /**
   * Execute a single tick of the world.
   * @param {string} input - The user's input message.
   * @param {object} entities - Current entities in play.
   */
  async tick(input, entities) {
    console.log("🕹️ [SIM] Tick Initiated: Round", app.runtime.round);

    // 1. SYSTEM TURN: Physics & Mutations
    const payload = {
      input,
      entities,
      history: app.history,
    };

    const next_state = dynamics_engine.simulate(payload);

    // 2. MECHANICAL GATE: Threshold Interventions
    const bridges = SimulationCycle.generate_narrative_bridges(next_state);

    // 3. PERSISTENCE: Update Global State
    SimulationCycle.apply_mutations(next_state);

    // 4. CHRONO KINETICS: Increment Round
    app.runtime.round++;

    return {
      state: next_state,
      bridges,
    };
  },

  /**
   * Translates numerical data into Narrative Bridges for the AI.
   */
  generate_narrative_bridges(state) {
    const bridges = [...state.signal_prompts];

    // Entropy / Reality Stability
    if (state.fractal?.dynamics?.entropy > 80) {
      bridges.push("CRITICAL: Structural reality is collapsing. Describe environmental glitches.");
    }

    // AI Somatics
    if (state.ai?.dynamics?.intensity > 85) {
      bridges.push(
        "CONDITION: The AI Character is hyper-adrenalized. Use short, sharp, sensory-heavy sentences.",
      );
    }

    return bridges;
  },

  /**
   * Update the reactive app state with the results of the physics pass.
   */
  apply_mutations(next_state) {
    if (next_state.ai && app.entities.AI) {
      Object.assign(app.entities.AI.dynamics, next_state.ai.dynamics);
    }
    if (next_state.fractal && app.entities.FRACTAL) {
      Object.assign(app.entities.FRACTAL.dynamics, next_state.fractal.dynamics);
    }
  },
};
