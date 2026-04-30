// â³ CHRONO: The Heartbeat of Time
// Manages the strict turn-based progression of the simulation.
import { Shield } from "../security.js";
import { app } from "../../state/app.svelte.js";
import { runtime } from "../../state/runtime.svelte.js";
import { simulation_log } from "../../state/simulation-log.svelte.js";
import { simulationState } from "../../state/status.svelte.js"; // [R5] Unified State
import { Engine } from "./engine.js";
export class ChronoStore {
  // No local state needed, acts as a controller for app.simulation
  /**
   * ADVANCE TURN
   * The ONLY way time moves forward.
   * 1. Locks UI (Loading)
   * 2. Processes Physics (Security)
   * 3. Generates Narrative (Engine)
   * 4. Echo Resonance (Data)
   * 5. Anchoring State (Runtime)
   * 6. Unlocks UI
   */
  async advance_turn(input = null) {
    if (app.simulation.loading) return; // Prevent double-clicks
    const storyId = runtime.storyId;
    if (!storyId) {
      console.error("[Chrono] No active story found.");
      return;
    }
    // 1. STASIS: Lock the Universe
    app.simulation.loading = true;
    simulationState.lock(); // Phase 1: System Lock
    app.log("Shield scanning causality and physics...", "system");
    try {
      // 2. OBSERVATION: Process Input & Physics (Shield)
      // We pass the current runtime character context to the Shield
      let shieldContext = null;
      let finalInput = input;
      if (input && runtime.character) {
        // Pass Fractal State for Causality Checks
        shieldContext = await Shield.process(
          input,
          runtime.character,
          runtime.active_fractal || {},
        );
        // ðŸ›‘ CAUSALITY CHECK
        if (
          shieldContext &&
          shieldContext.causality &&
          shieldContext.causality.result === "failure"
        ) {
          app.log(`Causality Violation: ${shieldContext.causality.constraint}`, "error");
          // We override the 'Action' to be a System Constraint.
          // This forces the AI to narrate the failure instead of the action.
          finalInput = `[SYSTEM]: The user attempted '${input}' but failed because: "${shieldContext.causality.constraint}". Describe this failed attempt briefly and dryly.`;
          // Visual Feedback (Glitch)
          // app.simulation.status = "causality violation" // [R5] Removed detailed status
        }
      }
      // 3. SYNTHESIS: Generate Narrative (Engine)
      // simulationState.start_generation('ai') will be called by Engine.generate_ai_response
      app.log(`LLM synthesizing turn ${app.round + 1}...`, "ai");
      // The GM facade maps generateAiResponse -> Engine.generateAiResponse(storyId, options)
      // We pass shieldContext in options if needed, including reflex deltas for thermodynamics.
      await Engine.generate_ai_response(storyId, {
        shieldContext,
        input: finalInput,
      });
      // 4. ECHO: Commit to Resonance (Echo/Scholar)
      simulationState.lock(); // Phase 3: Database Lock (Post-Generation)
      app.log("Echo recording temporal resonance...", "db");
      // 5. ANCHOR: Persist the timeline
      await runtime.save(runtime.round);
    } catch (error) {
      app.log(`Time Fracture: ${error.message}`, "error");
      console.error("[Chrono] ðŸ’¥ Time Fracture:", error);
      // Push error to feed so user knows what happened
      simulation_log.add({
        id: `err-${Date.now()}`,
        role: "system",
        text: `Simulation Error: ${error.message || "Unknown Time Fracture"}`,
        timestamp: Date.now(),
      });
    } finally {
      // 5. RESURRECTION: Unlock the Universe
      app.simulation.loading = false;
      simulationState.unlock();
    }
  }
}
export const Chrono = new ChronoStore();
if (typeof window !== "undefined") {
  window.chrono = Chrono;
}
