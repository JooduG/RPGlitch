import { db } from "@data";
import { SESSION_ID_KEY } from "./config.js";
import { state_bridge, stories_bridge } from "@utils";

/**
 * SESSION (Simulation & Gamemaster)
 * Handles persistence and state for the active story.
 */

/** @type {string | null} */
let _active_id = null;

export const session_driver = {
  get active_id() {
    return _active_id;
  },

  /**
   * Get the active story ID or throw.
   * @returns {string}
   */
  require_active: function () {
    if (!_active_id) throw new Error("No active session found.");
    return _active_id;
  },

  /**
   * Set active session ID and persist it.
   * @param {string} id
   */
  set_active: async function (id) {
    _active_id = id;
    state_bridge.runtime.story_id = id;
    if (typeof window !== "undefined") {
      await db.kv_settings.put({ key: SESSION_ID_KEY, value: id });
      // also log to history
      await db.sessions.add({ session_id: id, timestamp: Date.now() });
    }
    await state_bridge.simulation_log.refresh();
  },

  /**
   * Restore active session ID without redundant persistence writes (e.g. on app reload sync).
   * @param {string} id
   */
  restore_active: function (id) {
    _active_id = id;
  },

  /**
   * Clear active session state.
   */
  clear_active: async function () {
    _active_id = null;
    state_bridge.simulation_state.unlock();
    state_bridge.runtime.story_id = null;
    state_bridge.runtime.round = 0;
    if (typeof window !== "undefined") {
      await db.kv_settings.put({ key: SESSION_ID_KEY, value: null });
    }
    await state_bridge.simulation_log.refresh();
  },

  /**
   * Create a new session entry from a character/fractal selection
   * @param {any} selection
   * @returns {Promise<string>}
   */
  create_from_selection: async function (selection) {
    const ai_entity = selection.ai_id ? await db.entities.get(selection.ai_id) : null;
    const fractal_entity = selection.fractal_id ? await db.entities.get(selection.fractal_id) : null;

    const visual_style = selection.visual_style || selection.fractal?.visual_style || fractal_entity?.visual_style;
    const narrative_style = selection.narrative_style || selection.fractal?.narrative_style || fractal_entity?.narrative_style;

    const id = await db.stories.add({
      title: selection.story_title || "New Story",
      ai_id: selection.ai_id,
      user_id: selection.user_id,
      fractal_id: selection.fractal_id,
      visual_style,
      narrative_style,
      entity_snapshots: {
        ai: { dynamics: ai_entity?.dynamics || {} },
        fractal: {
          dynamics: fractal_entity?.dynamics || {},
          visual_style,
          narrative_style,
        },
      },
      created_at: Date.now(),
      updated_at: Date.now(),
      round: 0,
    });
    const story_id = id.toString();
    stories_bridge.bump();
    await session_driver.set_active(story_id);

    // Initial system entry
    const entry = {
      story_id,
      role: "system",
      type: "text",
      text: `Story Started: ${selection.story_title}`,
      turn_type: "SYSTEM_TURN",
      round: 0,
      meta: { type: "STORY_START" },
      created_at: Date.now(),
    };
    entry.id = await db.simulation_log.add(entry);
    state_bridge.simulation_log.add(entry);

    return story_id;
  },

  /**
   * Send user input (Log it)
   * @param {string} text
   * @returns {Promise<void>}
   */
  send: async function (text) {
    const character_name = state_bridge.runtime.active_user?.name || "User";
    return await this.log_message(text, "user", character_name, { turn_type: "USER_TURN" });
  },

  /**
   * Remove last turn to allow regeneration
   */
  regenerate: async function () {
    const story_id = session_driver.require_active();
    const logs = await db.simulation_log.where("story_id").equals(story_id).sortBy("created_at");
    for (let i = logs.length - 1; i >= 0; i--) {
      const entry = logs[i];
      if (entry.role === "user") break;
      await db.simulation_log.delete(entry.id);
      state_bridge.simulation_log.remove(entry.id);
    }
  },

  /**
   * Delete a log entry
   * @param {string | number} id
   */
  delete_log_entry: async function (id) {
    const key = isNaN(Number(id)) ? id : Number(id);
    await db.simulation_log.delete(key);
    state_bridge.simulation_log.remove(key);
  },

  /**
   * Edit a log entry
   * @param {string | number} id
   * @param {string} new_text
   */
  edit_log_entry: async function (id, new_text) {
    let key = isNaN(Number(id)) ? id : Number(id);
    let entry = await db.simulation_log.get(key);
    if (!entry) {
      const match = state_bridge.simulation_log?.feed?.find((m) => m.id === id || m.meta?.id === id || String(m.id) === String(id));
      if (match) key = match.id;
    }
    await db.simulation_log.update(key, { text: new_text });
    state_bridge.simulation_log.update(id, { text: new_text });
  },

  /**
   * Update an attachment in a log entry
   * @param {string | number} id
   * @param {number} attachment_index
   * @param {any} new_attachment
   */
  update_log_attachment: async function (id, attachment_index, new_attachment) {
    const numeric_key = isNaN(Number(id)) ? null : Number(id);
    let entry = numeric_key ? await db.simulation_log.get(numeric_key) : null;
    if (!entry) {
      const feed_match = state_bridge.simulation_log?.feed?.find((m) => m.id === id || m.meta?.id === id || String(m.id) === String(id));
      if (feed_match) {
        entry = await db.simulation_log.get(feed_match.id);
      }
    }
    if (!entry) {
      entry = await db.simulation_log.filter((m) => m.meta?.id === id).first();
    }
    if (entry) {
      if (!Array.isArray(entry.attachments)) {
        entry.attachments = [];
      }
      entry.attachments[attachment_index] = $state.snapshot(new_attachment);
      const plain_entry = $state.snapshot(entry);
      await db.simulation_log.put(plain_entry);
      state_bridge.simulation_log.update(id, { attachments: plain_entry.attachments });
    }
  },

  /**
   * Add a message to the simulation log
   * @param {string} text
   * @param {string} role
   * @param {string} character_name
   * @param {string} [turn_type]
   * @param {any} [meta]
   */
  log_message: async function (text, role, character_name, { turn_type = "USER_TURN", meta = {}, attachments = [] } = {}) {
    const story_id = session_driver.require_active();
    /** @type {any} */
    const entry = {
      story_id,
      role,
      type: "text",
      character_name,
      text,
      turn_type,
      round: state_bridge.runtime.round,
      meta: $state.snapshot(meta),
      created_at: Date.now(),
    };
    if (attachments && attachments.length > 0) {
      entry.attachments = $state.snapshot(attachments);
    }
    if (meta && meta.id) {
      entry.id = meta.id;
      await db.simulation_log.put(entry);
    } else {
      entry.id = await db.simulation_log.add(entry);
    }
    state_bridge.simulation_log.add(entry);
    return entry;
  },

  /**
   * Fetch history for a story.
   * @param {string} story_id
   * @returns {Promise<any[]>}
   */
  load_log: async function (story_id) {
    if (!story_id) return [];
    return await db.simulation_log.where("story_id").equals(story_id).sortBy("created_at");
  },

  /**
   * Add a system/telemetry log entry
   * @param {string} text
   * @param {string} [role]
   * @param {any} [meta]
   */
  log_system_entry: async function (text, role = "system", meta = {}) {
    const story_id = session_driver.require_active();
    const entry = {
      story_id,
      role,
      type: "text",
      text,
      turn_type: "SYSTEM_TURN",
      round: state_bridge.runtime.round,
      meta: $state.snapshot(meta),
      created_at: Date.now(),
    };
    entry.id = await db.simulation_log.add(entry);
    state_bridge.simulation_log.add(entry);
  },
};
