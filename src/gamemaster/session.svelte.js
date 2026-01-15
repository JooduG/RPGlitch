import { Session } from "./engine/session.js";
import { app } from "../artificer/state.svelte.js";

/**
 * 🎬 REACTIVE SESSION MANAGER
 * Bridges the imperative Session/Director engine with Svelte 5 Reactivity.
 * Replaces the old "director.svelte.js" store.
 */
export class ReactiveSession {
  loading = $state(false);
  error = $state(null);

  /**
   * Start a new story from the Lobby.
   * @param {Object} selection - { ai, user, fractal }
   */
  async start(selection) {
    if (this.loading) return;
    this.loading = true;
    app.simulation.loading = true;

    try {
      const storyTitle = `The Journey of ${selection.ai.name} & ${selection.user.name} in ${selection.fractal.name}`;

      // 1. Create Core Session
      const storyId = await Session.createFromSelection({
        aiId: selection.ai.id,
        userId: selection.user.id,
        fractalId: selection.fractal.id,
        storyTitle,
      });

      // 2. Sync Runtime (This might also be handled by the Session internals, but explicit is good)
      // Note: Session.createFromSelection already dispatches events, but we want to be sure.

      // 3. Switch View
      app.setView("game");
    } catch (e) {
      console.error("[ReactiveSession] Start Failed:", e);
      this.error = e.message;
    } finally {
      this.loading = false;
      app.simulation.loading = false;
    }
  }

  /**
   * Send user input to the active story.
   * @param {string} text
   */
  async send(text) {
    if (this.loading || !text.trim()) return;

    this.loading = true;
    app.simulation.loading = true;

    try {
      await Session.send(text);
    } catch (e) {
      console.error("[ReactiveSession] Send Failed:", e);
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
    if (this.loading) return;
    this.loading = true;
    app.simulation.loading = true;

    try {
      await Session.regenerate();
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
      app.simulation.loading = false;
    }
  }
}

export const session = new ReactiveSession();
