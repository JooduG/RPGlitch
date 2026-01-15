// ⏳ CHRONO: The Heartbeat of Time
// Manages the strict turn-based progression of the simulation.

import { app } from "../artificer/state.svelte.js";
import { runtime } from "../scholar/runtime.svelte.js";
import { Warden } from "../warden/index.js";
import { GameMaster } from "./index.js";
import { state } from "./bus.js"; // Access domain state directly to avoid Session cycle

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

    const storyId = state.story?.activeId;
    if (!storyId) {
      console.error("[Chrono] No active story found.");
      return;
    }

    // 1. STASIS: Lock the Universe
    app.simulation.loading = true;
    app.simulation.status = "scanning reality"; // Phase 1

    try {
      // 2. OBSERVATION: Process Input & Physics (Warden)
      // We pass the current runtime character context to the Warden
      let wardenContext = null;
      if (input && runtime.character) {
        wardenContext = await Warden.process(input, runtime.character);
      }

      // 3. SYNTHESIS: Generate Narrative (GameMaster)
      app.simulation.status = "forecasting"; // Phase 2

      // The GM facade maps generateAiResponse -> Director.playTurn(storyId, options)
      // We pass wardenContext in options if needed, though Warden likely already updated DB.
      await GameMaster.generateAiResponse(storyId, { wardenContext });

      // 4. MEMORY: Commit to Truth (Archivist/Scholar)
      app.simulation.status = "saving"; // Phase 3
      app.simulation.turn += 1;

      // Persist the state
      await runtime.save();
    } catch (error) {
      console.error("[Chrono] 💥 Time Fracture:", error);

      // Push error to feed so user knows what happened
      app.simulation.feed.push({
        nodeId: `err-${Date.now()}`,
        role: "system",
        text: `Simulation Error: ${error.message || "Unknown Time Fracture"}`,
        timestamp: Date.now(),
      });
    } finally {
      // 5. RESURRECTION: Unlock the Universe
      app.simulation.loading = false;
      app.simulation.status = "idle";
    }
  }
}

export const chrono = new ChronoStore();

if (typeof window !== "undefined") {
  window.chrono = chrono;
}
