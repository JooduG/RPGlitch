import { session_driver } from "@data";
import { runtime } from "./runtime.svelte.js";
/**
 * @typedef {Object} LogEntry
 * @property {string|number} [id]
 * @property {string} role
 * @property {string} [type]
 * @property {string} text
 * @property {string} [turn_type]
 * @property {string} [character_name]
 * @property {number} [round]
 * @property {any} [meta]
 * @property {number} [created_at]
 * @property {string} [story_id]
 * @property {string|Date|number} [timestamp]
 * @property {string[]} [attachments]
 */

class SimulationLogStore {
  /** @type {LogEntry[]} */
  feed = $state([]);
  /** @type {Set<string|number>} */
  _id_set = new Set();
  /**
   * Synchronize with persistence.
   */
  async refresh() {
    if (!runtime.story_id) {
      this.feed = [];
      this._id_set.clear();
      return;
    }
    const msgs = await session_driver.load_log(runtime.story_id);
    this.feed = msgs;
    this._id_set = new Set(msgs.filter((m) => m.id != null).map((m) => m.id));
  }
  /**
   * @param {LogEntry} entry - The log entry to add
   */
  add(entry) {
    // Prevent duplicates if ID exists
    if (entry.id && this._id_set.has(entry.id)) return;
    if (entry.id) this._id_set.add(entry.id);
    this.feed.push(entry);
  }

  /**
   * @param {string|number} id
   * @param {Partial<LogEntry>} updates
   */
  update(id, updates) {
    const target = this.feed.find((entry) => entry.id === id || entry.meta?.id === id || String(entry.id) === String(id));
    if (target) {
      Object.assign(target, updates);
    }
  }

  /**
   * @param {string|number} id
   */
  remove(id) {
    const index = this.feed.findIndex((entry) => entry.id === id || entry.meta?.id === id || String(entry.id) === String(id));
    if (index !== -1) {
      const removed_id = this.feed[index].id;
      this.feed.splice(index, 1);
      if (removed_id != null) this._id_set.delete(removed_id);
    }
  }

  /**
   * Delete a log entry by ID: persists via session_driver and removes it from
   * the in-memory feed so the UI stays consistent without a refresh.
   * @param {string} id
   */
  async delete_entry(id) {
    await session_driver.delete_log_entry(id);
    this.remove(id);
  }

  /**
   * Delete a specific attachment from a log entry.
   * @param {string} id
   * @param {number} attachment_index
   */
  async delete_attachment(id, attachment_index) {
    await session_driver.delete_log_attachment(id, attachment_index);
  }

  /**
   * Edit a log entry's text by ID: persists via session_driver and mirrors the
   * change into the in-memory feed so the UI stays consistent without a refresh.
   * @param {string} id
   * @param {string} new_text
   */
  async edit_entry(id, new_text) {
    await session_driver.edit_log_entry(id, new_text);
    this.update(id, { text: new_text });
  }
}
export const simulation_log = new SimulationLogStore();
