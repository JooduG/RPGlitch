import { db } from "../../data/db.js";
import { runtime } from "../../state/runtime.svelte.js";
import { simulation_log } from "../../state/simulation-log.svelte.js";
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
  set active_id(val) {
    _active_id = val;
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
   * Create a new session entry
   */
  create_session: async function (title = "New Story") {
    const id = await db.simulation_log.add({
      story_id: "init", // temporary
      role: "system",
      type: "text",
      text: `Story Started: ${title}`,
      turn_type: "SYSTEM_TURN",
      round: 0,
      meta: { type: "STORY_START" },
      created_at: Date.now(),
    });
    // Update the story_id to match its own row ID (standard for local-first root)
    await db.simulation_log.update(id, { story_id: id.toString() });
    await session_driver.set_active(id.toString());
    return id.toString();
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
