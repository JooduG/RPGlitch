import { db } from "@data/db.js";
import { runtime } from "@state/runtime.svelte.js";
import { simulation_log } from "@state/simulation-log.svelte.js";
import { SESSION_ID_KEY } from "@core/constants.js";

/**
 * SESSION (Simulation & Gamemaster)
 * Handles persistence and state for the active story.
 */

let _active_id = null;

export const session_driver = {
  get active_id() {
    return _active_id;
  },

  /**
   * Get the active story ID or throw.
   */
  require_active: function () {
    if (!_active_id) throw new Error("No active session found.");
    return _active_id;
  },

  /**
   * Set active session ID and persist it.
   */
  set_active: async function (id) {
    _active_id = id;
    runtime.story_id = id;
    if (typeof window !== "undefined") {
      await db.kv_settings.put({ key: SESSION_ID_KEY, value: id });
      // also log to history
      await db.sessions.add({ session_id: id, timestamp: Date.now() });
    }
  },

  /**
   * Create a new session entry from a character/fractal selection
   */
  create_from_selection: async function (selection) {
    const id = await db.stories.add({
      title: selection.story_title || "New Story",
      ai_id: selection.ai_id,
      user_id: selection.user_id,
      fractal_id: selection.fractal_id,
      created_at: Date.now(),
      updated_at: Date.now(),
      round: 0,
    });
    const story_id = id.toString();
    await session_driver.set_active(story_id);

    // Initial system entry
    await db.simulation_log.add({
      story_id,
      role: "system",
      type: "text",
      text: `Story Started: ${selection.story_title}`,
      turn_type: "SYSTEM_TURN",
      round: 0,
      meta: { type: "STORY_START" },
      created_at: Date.now(),
    });

    simulation_log.refresh();
    return story_id;
  },

  /**
   * Create a new session entry (Simple version)
   */
  create_session: async function (title = "New Story") {
    // Legacy support or simplified start
    return await this.create_from_selection({ story_title: title });
  },

  /**
   * Clear active session
   */
  clear_active: async function () {
    _active_id = null;
    runtime.story_id = null;
    if (typeof window !== "undefined") {
      await db.kv_settings.delete(SESSION_ID_KEY);
    }
  },

  /**
   * Send user input (Log it)
   */
  send: async function (text) {
    const character_name = runtime.active_user?.name || "User";
    return await this.log_message(text, "user", character_name, "USER_TURN");
  },

  /**
   * Remove last turn to allow regeneration
   */
  regenerate: async function () {
    const story_id = session_driver.require_active();
    const last = await db.simulation_log.where("story_id").equals(story_id).last();
    if (last && last.role !== "user") {
      await db.simulation_log.delete(last.id);
      simulation_log.refresh();
    }
  },

  /**
   * Delete a log entry
   */
  delete_log_entry: async function (id) {
    await db.simulation_log.delete(Number(id));
    simulation_log.refresh();
  },

  /**
   * Edit a log entry
   */
  edit_log_entry: async function (id, new_text) {
    await db.simulation_log.update(Number(id), { text: new_text });
    simulation_log.refresh();
  },

  /**
   * Add a message to the simulation log
   */
  log_message: async function (text, role, character_name, turn_type = "USER_TURN", meta = {}) {
    const story_id = session_driver.require_active();
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
   * Legacy wrapper for log_message matching Intelligence Kernel's expected signature.
   */
  log_turn: async function (text, character_name, role, meta = {}) {
    return await this.log_message(
      text,
      role,
      character_name,
      meta.turn_type || (role === "user" ? "USER_TURN" : "AI_TURN"),
      meta,
    );
  },

  /**
   * Fetch history for a story.
   */
  load_log: async function (story_id) {
    if (!story_id) return [];
    return await db.simulation_log.where("story_id").equals(story_id).sortBy("created_at");
  },

  /**
   * Add a system/telemetry log entry
   */
  log_system_entry: async function (text, role = "system", meta = {}) {
    const story_id = session_driver.require_active();
    await db.simulation_log.add({
      story_id,
      role,
      type: "text",
      text,
      turn_type: "SYSTEM_TURN",
      round: runtime.round,
      meta: $state.snapshot(meta),
      created_at: Date.now(),
    });
    simulation_log.refresh();
  },

  /**
   * Restore session from DB
   */
  restore_session: async function () {
    if (typeof window === "undefined") return null;
    const entry = await db.kv_settings.get(SESSION_ID_KEY);
    if (entry?.value) {
      _active_id = entry.value;
      runtime.story_id = entry.value;
      return entry.value;
    }
    return null;
  },
};
