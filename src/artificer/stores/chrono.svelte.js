// ⏳ CHRONO: The Heartbeat of Time
// Manages the strict turn-based progression of the simulation.

import { app } from "../state.svelte.js";
import { runtime } from "../../scholar/runtime.svelte.js";

export class ChronoStore {
  // No local state needed, acts as a controller for app.simulation

  /**
   * ADVANCE TURN
   * The ONLY way time moves forward.
   * 1. Locks UI (Loading)
   * 2. Processes Physics (Warden)
   * 3. Generates Narrative (GameMaster)
   * 4. Saves State (Scholar)
   * 5. Unlocks UI
   */
  async advanceTurn(input = null) {
    if (app.simulation.loading) return; // Prevent double-clicks

    console.log(`[Chrono] ⏳ Advancing to Turn ${app.simulation.turn + 1}...`);

    // 1. STASIS: Lock the Universe
    app.simulation.loading = true;
    app.simulation.status = "generating";

    try {
      // 2. OBSERVATION: Process Input & Physics
      // TODO: Connect to Warden.process(input)

      // 3. SYNTHESIS: Generate Narrative
      // TODO: Connect to GameMaster.narrate()

      // Simulate processing time for now (Skeleton Shimmer Check)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 4. MEMORY: Commit to Truth
      app.simulation.turn += 1;

      // TODO: runtime.save()
    } catch (error) {
      console.error("[Chrono] 💥 Time Fracture:", error);
      // TODO: Handle error state in UI
    } finally {
      // 5. RESURRECTION: Unlock the Universe
      app.simulation.loading = false;
      app.simulation.status = "idle";
      console.log(`[Chrono] ✅ Turn Complete.`);
    }
  }
}

export const chrono = new ChronoStore();

if (typeof window !== "undefined") {
  window.chrono = chrono;
}
