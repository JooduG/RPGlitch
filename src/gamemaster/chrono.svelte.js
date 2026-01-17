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
   * 4. Echo Resonance (Scholar)
   * 5. Anchoring State (Runtime)
   * 6. Unlocks UI
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
    app.log("Warden scanning causality and physics...", "system");

    try {
      // 2. OBSERVATION: Process Input & Physics (Warden)
      // We pass the current runtime character context to the Warden
      let wardenContext = null;
      let finalInput = input;

      if (input && runtime.character) {
        // Pass World State (Fractal) for Causality Checks
        wardenContext = await Warden.process(
          input,
          runtime.character,
          runtime.storyFractal || {},
        );

        // 🛑 CAUSALITY CHECK
        if (
          wardenContext &&
          wardenContext.causality &&
          wardenContext.causality.result === "failure"
        ) {
          app.log(
            `Causality Violation: ${wardenContext.causality.constraint}`,
            "error",
          );
          // We override the 'Action' to be a System Constraint.
          // This forces the AI to narrate the failure instead of the action.
          finalInput = `[SYSTEM]: The user attempted '${input}' but failed because: "${wardenContext.causality.constraint}". Describe this failed attempt briefly and dryly.`;

          // Visual Feedback (Glitch)
          app.simulation.status = "causality violation";
        }
      }

      // 3. SYNTHESIS: Generate Narrative (GameMaster)
      app.simulation.status = "forecasting"; // Phase 2
      app.log(`LLM synthesizing turn ${app.simulation.turn + 1}...`, "ai");

      // The GM facade maps generateAiResponse -> GameMaster.generateAiResponse(storyId, options)
      // We pass wardenContext in options if needed, though Warden likely already updated DB.
      await GameMaster.generateAiResponse(storyId, {
        wardenContext,
        input: finalInput,
      });

      // 4. ECHO: Commit to Resonance (Echo/Scholar)
      app.simulation.status = "echoing"; // Phase 3
      app.log("Echo recording temporal resonance...", "db");
      app.simulation.turn += 1;

      // 5. ANCHOR: Persist the timeline
      await runtime.save(app.simulation.turn);
    } catch (error) {
      app.log(`Time Fracture: ${error.message}`, "error");
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
