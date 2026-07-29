import { session_driver } from "@engine";
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

export class SimulationLogStore {
  /** @type {LogEntry[]} */
  feed = $state([]);
  /**
   *
   */
  constructor() {}
  /**
   * Synchronize with persistence.
   */
  async refresh() {
    if (!runtime.story_id) {
      this.feed = [];
      return;
    }
    const msgs = await session_driver.load_log(runtime.story_id);
    this.feed = msgs;
  }
  /**
   * @param {LogEntry} entry - The log entry to add
   */
  add(entry) {
    // Prevent duplicates if ID exists
    if (entry.id && this.feed.some((m) => m.id === entry.id)) return;
    this.feed.push(entry);
  }

  /**
   * @param {string|number} id
   * @param {Partial<LogEntry>} updates
   */
  update(id, updates) {
    const target = this.feed.find((entry) => entry.id === id);
    if (target) {
      Object.assign(target, updates);
    }
  }

  /**
   * @param {string|number} id
   */
  remove(id) {
    const index = this.feed.findIndex((entry) => entry.id === id);
    if (index !== -1) {
      this.feed.splice(index, 1);
    }
  }
}
export const simulation_log = new SimulationLogStore();
