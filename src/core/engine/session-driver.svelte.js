import { db } from "../../data/db.js";
import { runtime } from "../../state/runtime.svelte.js";
import { simulation_log } from "../../state/simulation-log.svelte.js";

/**
 * 🕹️ SESSION (Simulation & Gamemaster)
 * Handles persistence and state for the active story.
 */
export const session_driver = {
  active_id: null,

  /**
   * Get the active story ID or throw.
   */
  require_active: function () {
    if (!this.active_id) throw new Error("No active session found.");
    return this.active_id;
  },

  /**
   * Set active session ID and persist it.
   */
  set_active: async function (id) {
    this.active_id = id;
    runtime.story_id = id;
    if (typeof window !== "undefined") {
      const { SESSION_ID_KEY } = await import("../constants.js");
      await db.kv_settings.put({ key: SESSION_ID_KEY, value: id });
      // also log to history
      await db.sessions.add({ session_id: id, timestamp: Date.now() });
    }
  },

  /**
   * Initialize session from DB.
   */
  init: async function () {
    if (typeof window === "undefined") return;
    const { SESSION_ID_KEY } = await import("../constants.js");
    const entry = await db.kv_settings.get(SESSION_ID_KEY);
    if (entry) {
      this.active_id = entry.value;
      runtime.story_id = entry.value;
    }
  },

  /**
   * Create a new story from lobby selection
   */
  create_from_selection: async function ({ ai_id, user_id, fractal_id, story_title }) {
    const ai_snapshot = runtime.active_ai ? $state.snapshot(runtime.active_ai) : null;
    const fractal_snapshot = runtime.active_fractal
      ? $state.snapshot(runtime.active_fractal)
      : null;
    const user_snapshot = runtime.active_user ? $state.snapshot(runtime.active_user) : null;

    const story_data = {
      title: story_title,
      ai_id: ai_id,
      user_id: user_id,
      fractal_id: fractal_id,
      created_at: Date.now(),
      updated_at: Date.now(),
      entity_snapshots: {
        ai: ai_snapshot,
        fractal: fractal_snapshot,
        user: user_snapshot,
      },
    };

    const id = await db.stories.add(story_data);
    story_data.id = id;
    runtime.simulation.story.by_id[id] = story_data;
    runtime.simulation.story.active_id = id;
    await this.set_active(id);
    await runtime.sync(id);
    return id;
  },

  /**
   * Load log entries for a story
   */
  load_log: async (story_id) => {
    return await db.simulation_log.where("story_id").equals(story_id).toArray();
  },

  /**
   * Send a user log entry (Action)
   */
  send: async function (text) {
    const story_id = this.require_active();
    await db.simulation_log.add({
      story_id,
      role: "user",
      type: "text",
      text,
      turn_type: "USER_TURN",
      round: runtime.round,
      created_at: Date.now(),
    });
    simulation_log.refresh();
  },

  /**
   * Add a simulation log entry (Response)
   */
  log_turn: async function (text, character_name, role = "assistant", meta = {}) {
    const story_id = this.require_active();
    const turn_type = meta.turn_type || (role === "user" ? "USER_TURN" : "AI_TURN");
    await db.simulation_log.add({
      story_id,
      role,
      type: "text",
      character_name,
      text,
      turn_type,
      round: runtime.round,
      meta: $state.snapshot(meta),
      created_at: Date.now(),
    });
    simulation_log.refresh();
  },

  /**
   * Regenerate: Delete last simulation turn
   */
  regenerate: async function () {
    const story_id = this.require_active();
    const last_entry = await db.simulation_log.where("story_id").equals(story_id).last();
    if (last_entry && (last_entry.role === "assistant" || last_entry.role === "ai")) {
      await db.simulation_log.delete(last_entry.id);
      simulation_log.refresh();
    }
  },

  /**
   * Delete a specific log entry by ID
   */
  delete_log_entry: async function (id) {
    this.require_active();
    await db.simulation_log.delete(id);
    simulation_log.refresh();
  },

  /**
   * Edit a specific log entry text
   */
  edit_log_entry: async function (id, new_text) {
    this.require_active();
    await db.simulation_log.update(id, { text: new_text });
    simulation_log.refresh();
  },
};
