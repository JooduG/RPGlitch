import { app } from "@state/app.svelte.js";
import { runtime } from "@state/runtime.svelte.js";

/**
 * src/core/engine/Simulation.js
 * ⚙️ SIMULATION (Logic Engine)
 * The "Physics" of the world. Manages Round logic, state seeding, and consistency.
 * Standard term per Rule 03 Lexicon.
 */

export const Simulation = {
  /**
   * UPDATE
   * Ensures narrative state is seeded and vectors are non-empty.
   */
  update: () => {
    // AUTO-SEED: Ensure activeVectors is never empty
    const fractal = runtime.active_fractal;
    if (fractal && (!Array.isArray(fractal.future) || fractal.future.length === 0)) {
      runtime.add_vector("Continue the journey.", "FRACTAL", true);
      app.log("Simulation: Auto-seeded active_vector", "system");
    }
  },
};
