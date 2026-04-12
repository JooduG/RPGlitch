import { Engine } from "@core/engine/engine.js";
import { session_driver } from "@core/engine/session-driver.svelte.js";
import { app } from "@state/app.svelte.js";
import { runtime } from "@state/runtime.svelte.js";
import "@state/simulation-log.svelte.js";
import { simulationState } from "@state/status.svelte.js"; // [R5] Unified State
/**
 * src/state/session.svelte.js
 * 🕹️ ENGINE / 📚 DATA: Session Management
 * Coordinates active narrative flows and persistence.
 */
export class ReactiveSession {
  loading = $state(false);
  error = $state(null);
  constructor() {}
  /**
   * Start a new story from the Lobby.
   * @param {Object} selection - { ai, user, fractal }
   */
  async start(selection) {
    if (this.loading) return;
    this.loading = true;
    app.simulation.loading = true;
    try {
      const story_title = `The Journey of ${selection.ai.name} & ${selection.user.name} in ${selection.fractal.name}`;
      // 1. Create Core Session
      const story_id = await session_driver.create_from_selection({
        ai_id: selection.ai.id,
        user_id: selection.user.id,
        fractal_id: selection.fractal.id,
        story_title,
      });
      // 3. Switch View (Immediate Feedback)
      app.set_view("storymode");
      // 4. Trigger Prologue Generation
      // This will run the Engine, hit the API, and stream content to the feed
      await Engine.generate_prologue(story_id);
    } catch (e) {
      console.error("[Session] Start Failed:", e);
      this.error = e.message;
      // If failed, maybe go back to lobby?
      // app.setView("lobby");
    } finally {
      this.loading = false;
      app.simulation.loading = false;
    }
  }
  /**
   * Send user input and advance the simulation turn.
   * @param {string} text
   */
  async send(text) {
    if (this.loading || !text.trim()) return;
    await this.advance_turn(text);
  }
  /**
   * The Diagnostic Turn Loop
   * Forces visibility into the internal state transitions.
   */
  async advance_turn(text) {
    if (this.loading) return;
    this.loading = true;
    app.simulation.loading = true;

    try {
      // 1. ATOMIC CHRONO: Only increment once per interaction loop
      runtime.round++;
      app.log(`Simulation entering Round ${runtime.round}...`, "system");

      // PHASE 1: WARDEN (Observation)
      app.log("Security checking physics and causality...", "system");

      // PHASE 2: GM (Synthesis)
      await session_driver.send(text);
      const story_id = session_driver.require_active();
      await Engine.generate_ai_response(story_id, { input: text });
      // PHASE 3: ECHO (Affinity)
      app.log("Echo recording temporal affinity and syncing database...", "db");
      // PHASE 4: PERSIST (Data)
      await runtime.save(runtime.turn);
    } catch (e) {
      app.log(`Simulation Error: ${e.message}`, "error");
      console.error("[Session] advance_turn Failed:", e);
      this.error = e.message;
    } finally {
      this.loading = false;
      app.simulation.loading = false;
    }
  }
  /**
   * Retry the last AI turn.
   */
  async retry() {
    await runtime.save(runtime.round);
    this.loading = true;
    app.simulation.loading = true;
    try {
      await session_driver.regenerate();
      const story_id = session_driver.require_active();
      await Engine.generate_ai_response(story_id);
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
      app.simulation.loading = false;
      simulationState.complete();
    }
  }
  /**
   * Continue the story (AI generates next part).
   */
  async continue() {
    if (this.loading) return;
    this.loading = true;
    app.simulation.loading = true;
    try {
      const story_id = session_driver.require_active();
      await Engine.generate_ai_response(story_id);
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
      app.simulation.loading = false;
    }
  }
  /**
   * 🧪 DEBUG: Inject AI Message
   */
  async log_turn(text, character_name, role) {
    await session_driver.log_turn(text, character_name, role);
  }
  /**
   * Delete a log entry by ID
   */
  async delete_log_entry(id) {
    await session_driver.delete_log_entry(id);
  }
  /**
   * Edit a log entry by ID
   */
  async edit_log_entry(id, new_text) {
    await session_driver.edit_log_entry(id, new_text);
  }
}
export const session = new ReactiveSession();
