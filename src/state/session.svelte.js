import { Engine, session_driver, Chrono } from "@engine";
import { app, controlState, runtime } from "@state"; // [R5] Unified State
import "@state/log.svelte.js";

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
    await Chrono.advance_turn(text);
  }

  /**
   * Retry the last AI turn.
   */
  async retry() {
    if (this.isProcessing) return;
    try {
      await session_driver.regenerate();
      await Chrono.advance_turn(null, { is_retry: true });
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
    }
  }

  /**
   * Continue the story (AI generates next part).
   */
  async continue() {
    if (this.isProcessing) return;
    try {
      await Chrono.advance_turn(null, { is_continue: true });
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
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
