// ⏳ CHRONO: The Heartbeat of Time
// Manages the strict turn-based progression of the simulation.
import { Engine } from "@engine";
import { Shield } from "@platform";
import { app, controlState, runtime, simulation_log, simulationState } from "@state"; // [R5] Unified State
/**
 *
 */
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
   * @param {string|null} input
   */
  async advance_turn(input = null) {
    if (app.simulation.loading || controlState.intent_active) return; // Prevent double-clicks
    const story_id = runtime.story_id;
    if (!story_id) {
      console.error("[Chrono] No active story found.");
      return;
    }
    // 1. STASIS: Lock the Universe
    controlState.set_intent_active(true); // Exact sub-millisecond Intent Lock
    app.simulation.loading = true;
    simulationState.lock(); // Phase 1: System Lock
    app.log("Shield scanning causality and physics...", "system");

    /** @type {any} */
    let shieldContext = null;
    let finalInput = input;

    try {
      // 2. OBSERVATION: Process Input & Physics (Shield)
      // We pass the current runtime character context to the Shield
      if (input && runtime.character) {
        // Pass Fractal State for Causality Checks
        shieldContext = await Shield.process(
          input,
          runtime.character,
          runtime.active_fractal || {},
        );
        // 🛑 CAUSALITY CHECK
        if (
          shieldContext &&
          shieldContext.causality &&
          shieldContext.causality.result === "failure"
        ) {
          app.log(`Causality Violation: ${shieldContext.causality.constraint}`, "error");
          // We override the 'Action' to be a System Constraint.
          // This forces the AI to narrate the failure instead of the action.
          finalInput = `[SYSTEM]: The user attempted '${input}' but failed because: "${shieldContext.causality.constraint}". Describe this failed attempt briefly and dryly.`;
        }
      }
    } catch (err) {
      const error = /** @type {any} */ (err);
      app.log(`Time Fracture during Shield: ${error.message}`, "error");
      console.error("[Chrono] 💥 Shield Failure:", error);
      simulation_log.add({
        id: `err-${Date.now()}`,
        role: "system",
        text: `Simulation Error: ${error.message || "Shield Scan Failure"}`,
        timestamp: Date.now(),
      });
      app.simulation.loading = false;
      simulationState.unlock();
      controlState.set_intent_active(false); // Release Intent Lock
      return;
    }

    // 3. SYNTHESIS: Generate Narrative (Engine) - Runs in background, non-blocking
    app.log(`LLM synthesizing turn ${app.round + 1}...`, "ai");
    const controller = new AbortController();
    app.streaming.abort_controller = controller;

    (async () => {
      try {
        await Engine.generate_ai_response(story_id, {
          shieldContext,
          input: finalInput ?? undefined,
          signal: controller.signal,
        });

        // 4. ECHO: Commit to Resonance (Echo/Scholar) - Timeline Safety Lock
        simulationState.lock(); // Phase 3: Database Lock (Post-Generation)
        app.log("Echo recording temporal resonance...", "db");

        // 5. ANCHOR: Persist the timeline
        runtime.round = Number(runtime.round || 0) + 1;
        await runtime.save(runtime.round);
      } catch (err) {
        const error = /** @type {any} */ (err);
        if (error.name === "AbortError" || error.message?.includes("aborted")) {
          app.log("Generation interrupted cleanly.", "system");
        } else {
          app.log(`Time Fracture: ${error.message}`, "error");
          console.error("[Chrono] 💥 Time Fracture:", error);
          // Push error to feed so user knows what happened
          simulation_log.add({
            id: `err-${Date.now()}`,
            role: "system",
            text: `Simulation Error: ${error.message || "Unknown Time Fracture"}`,
            timestamp: Date.now(),
          });
        }
      } finally {
        // Unified Cleanup Framework
        if (app.streaming.abort_controller === controller) {
          app.streaming.abort_controller = null;
        }
        app.streaming.active = false;
        app.streaming.content = "";
        app.streaming.node_id = null;
        app.streaming.role = "ai";
        app.simulation.loading = false;
        simulationState.unlock();
        controlState.set_intent_active(false); // Release Intent Lock
      }
    })();
  }
}
export const Chrono = new ChronoStore();
if (typeof window !== "undefined") {
  window.chrono = Chrono;
}
