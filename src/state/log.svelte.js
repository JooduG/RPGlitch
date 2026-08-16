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
  constructor() {}
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
}
export const simulation_log = new SimulationLogStore();
