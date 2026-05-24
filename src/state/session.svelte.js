import { Engine } from "@engine/kernel.js";
import { session_driver } from "@engine/session.svelte.js";
import { app } from "@state/app.svelte.js";
import { runtime } from "@state/runtime.svelte.js";
import "@state/log.svelte.js";
import { simulationState } from "@state/status.svelte.js"; // [R5] Unified State
import { controlState } from "@state/control.svelte.js";

/**
 * src/state/session.svelte.js
 * 🕹️ ENGINE / 📚 DATA: Session Management
 * Coordinates active narrative flows and persistence.
 */
export class ReactiveSession {
  isProcessing = $state(false);
  /** @type {string | null} */
  error = $state(null);

  /**
   *
   */
  constructor() {}

  /**
   * Increments the global simulation round.
   * Centralized here to ensure atomicity.
   */
  incrementRound() {
    runtime.round = Number(runtime.round || 0) + 1;
  }

  /**
   * Releases the processing lock and resets application loading states.
   */
  releaseLock() {
    this.isProcessing = false;
    app.simulation.loading = false;
    controlState.set_intent_active(false); // Release Intent Lock
  }

  /**
   * Start a new story from the Lobby.
   * @param {{ ai: any, user: any, fractal: any }} selection - { ai, user, fractal }
   */
  async start(selection) {
    if (this.isProcessing) return;
    controlState.set_intent_active(true); // Exact sub-millisecond Intent Lock
    this.isProcessing = true;
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

      // 2. Synchronize Runtime State with the new session
      await runtime.sync(story_id);

      // 3. Switch View (Immediate Feedback)
      app.set_view("storymode");

      // 4. Trigger Prologue Generation
      await Engine.generate_prologue(story_id);
    } catch (e) {
      console.error("[Session] Start Failed:", e);
      this.error = /** @type {Error} */ (e).message;
    } finally {
      this.releaseLock();
    }
  }

  /**
   * Send user input and advance the simulation turn.
   * @param {string} text
   */
  async send(text) {
    if (this.isProcessing || !text.trim()) return;
    await this.advance_turn(text);
  }

  /**
   * The Diagnostic Turn Loop
   * Forces visibility into the internal state transitions.
   * @param {string} text
   */
  async advance_turn(text) {
    if (this.isProcessing) return;
    controlState.set_intent_active(true); // Exact sub-millisecond Intent Lock
    this.isProcessing = true;
    app.simulation.loading = true;

    try {
      // 1. ATOMIC CHRONO: Increment round before we send/generate to sync prompts & history
      this.incrementRound();
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
      await runtime.save(runtime.round);
    } catch (e) {
      app.log(`Simulation Error: ${/** @type {Error} */ (e).message}`, "error");
      console.error("[Session] advance_turn Failed:", e);
      this.error = /** @type {Error} */ (e).message;
    } finally {
      this.releaseLock();
    }
  }

  /**
   * Retry the last AI turn.
   */
  async retry() {
    if (this.isProcessing) return;
    controlState.set_intent_active(true); // Exact sub-millisecond Intent Lock
    this.isProcessing = true;
    app.simulation.loading = true;

    try {
      await runtime.save(runtime.round);
      await session_driver.regenerate();
      const story_id = session_driver.require_active();
      await Engine.generate_ai_response(story_id);
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
    } finally {
      this.releaseLock();
      simulationState.complete();
    }
  }

  /**
   * Continue the story (AI generates next part).
   */
  async continue() {
    if (this.isProcessing) return;
    controlState.set_intent_active(true); // Exact sub-millisecond Intent Lock
    this.isProcessing = true;
    app.simulation.loading = true;

    try {
      const story_id = session_driver.require_active();
      await Engine.generate_ai_response(story_id);
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
    } finally {
      this.releaseLock();
    }
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
}

export const session = new ReactiveSession();
