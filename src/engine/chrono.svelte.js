// ⏳ CHRONO: The Heartbeat of Time
// Manages the strict turn-based progression of the simulation.
import { session_driver } from "@engine";
import { gamemaster } from "@intelligence";
import { Shield } from "@platform";
import { app, controlState, runtime, simulation_log, simulationState } from "@state"; // [R5] Unified State

export class ChronoStore {
  error = $state(null);

  /**
   * Start a new story from the Lobby.
   * @param {{ ai: any, user: any, fractal: any }} selection - { ai, user, fractal }
   */
  async start(selection) {
    if (app.simulation.loading || controlState.intent_active) return;
    controlState.set_intent_active(true); // Exact sub-millisecond Intent Lock
    app.simulation.loading = true;

    try {
      const story_title = app.story_title || `The Journey of ${selection.ai.name} & ${selection.user.name} in ${selection.fractal.name}`;
      // 1. Create Core Session
      const story_id = await session_driver.create_from_selection({
        ai_id: selection.ai.id,
        user_id: selection.user.id,
        fractal_id: selection.fractal.id,
        story_title,
      });

      // 2. Synchronize Runtime State with the new session
      await runtime.sync(story_id);

      // 3. Switch View (Immediate Feedback)
      app.set_view("storymode");

      // 4. Trigger Prologue Generation
      simulationState.start_generation("fractal");
      try {
        await gamemaster.execute_prologue(story_id);
        app.log("Prologue generated and opening turn executed.", "system");
      } catch (e) {
        console.error("[Chrono] Prologue Failed:", e);
        app.log("Error: Prologue Failed.", "error");
        throw e;
      } finally {
        simulationState.complete();
        app.end_stream();
      }
    } catch (e) {
      console.error("[Chrono] Start Failed:", e);
      this.error = /** @type {Error} */ (e).message;
    } finally {
      app.simulation.loading = false;
      controlState.set_intent_active(false); // Release Intent Lock
    }
  }

  /**
   * Send user input and advance the simulation turn.
   * @param {string} text
   */
  async send(text) {
    if (app.simulation.loading || controlState.intent_active || !text.trim()) return;
    await this.advance_turn(text);
  }

  /**
   * Retry the last AI turn.
   */
  async retry() {
    if (app.simulation.loading || controlState.intent_active) return;
    try {
      await session_driver.regenerate();
      await this.advance_turn(null, { is_retry: true });
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
    }
  }

  /**
   * Continue the story (AI generates next part).
   */
  async continue() {
    if (app.simulation.loading || controlState.intent_active) return;
    try {
      await this.advance_turn(null, { is_continue: true });
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
    }
  }

  /**
   * Delete a log entry by ID
   * @param {string} id
   */
  async delete_log_entry(id) {
    await session_driver.delete_log_entry(id);
  }

  /**
   * Edit a log entry by ID
   * @param {string} id
   * @param {string} new_text
   */
  async edit_log_entry(id, new_text) {
    await session_driver.edit_log_entry(id, new_text);
  }

  /**
   * Update an attachment in a log entry by ID
   * @param {string} id
   * @param {number} attachment_index
   * @param {any} new_attachment
   */
  async update_log_attachment(id, attachment_index, new_attachment) {
    await session_driver.update_log_attachment(id, attachment_index, new_attachment);
  }

  /**
   * 🧪 DEBUG: Inject AI Message
   * @param {string} text
   * @param {string} character_name
   * @param {string} role
   */
  async log_turn(text, character_name, role) {
    await session_driver.log_turn(text, character_name, role);
  }

  /**
   * ADVANCE TURN
   * The ONLY way time moves forward.
   * 1. Locks UI (Loading)
   * 2. Processes Physics (Security)
   * 3. Generates Narrative (Engine)
   * 4. PAST: Commit to Memory (Data)
   * 5. Anchoring State (Runtime)
   * 6. Unlocks UI
   * @param {string|null} input
   * @param {object} options
   */
  async advance_turn(input = null, options = {}) {
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
        shieldContext = await Shield.process(input, runtime.character, runtime.active_fractal || {});
        // 🛑 CAUSALITY CHECK
        if (shieldContext && shieldContext.causality && shieldContext.causality.result === "failure") {
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
    if (!options.is_retry && !options.is_continue) {
      runtime.round = Number(runtime.round || 0) + 1;
    }
    app.log(`LLM synthesizing turn ${runtime.round}...`, "ai");
    const controller = new AbortController();
    app.streaming.abort_controller = controller;
    app.streaming.active = true;

    (async () => {
      try {
        if (finalInput) {
          try {
            await session_driver.send(finalInput);
          } catch (dbErr) {
            console.error("[Chrono] Database write error during send:", dbErr);
            app.log("Failed to persist user message, but generation continues.", "error");
          }
        }

        simulationState.start_generation(options.role || "ai");
        try {
          await gamemaster.execute_turn(story_id, {
            shieldContext,
            input: finalInput ?? undefined,
            signal: controller.signal,
          });
          app.log("Generation complete.", "system");
        } catch (e) {
          console.error("[Chrono] Generation Failed:", e);
          app.log("Error: Generation Failed.", "error");
          throw e;
        } finally {
          simulationState.complete();
          app.end_stream();
        }

        // 4. PAST: Commit to Memory (Echo) - Timeline Safety Lock
        simulationState.lock(); // Phase 3: Database Lock (Post-Generation)
        app.log("Recording memory...", "db");

        // 5. ANCHOR: Persist the timeline
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
