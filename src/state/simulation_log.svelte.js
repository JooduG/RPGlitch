import { Session } from "@core/engine/SessionDriver.js";
import { runtime } from "@state/runtime.svelte.js";
// 📜 SCRIBE: Simulation Log State GameMaster
export class SimulationLogStore {
  feed = $state([]);
  constructor() {}
  /**
   * Synchronize with persistence.
   */
  async refresh() {
    if (!runtime.story_id) return;
    const msgs = await Session.load_log(runtime.story_id);
    this.feed = msgs;
  }
  /**
   * @param {Object} entry - The log entry to add
   */
  add(entry) {
    // Prevent duplicates if ID exists
    if (entry.id && this.feed.some((m) => m.id === entry.id)) return;
    this.feed.push(entry);
  }
  /**
   * @param {string} id - Entry ID to remove
   */
  remove(id) {
    this.feed = this.feed.filter((m) => m.id !== id);
  }
  /**
   * Clear all entries (e.g. on story switch if not handled by refresh)
   */
  clear() {
    this.feed = [];
  }
}
export const simulation_log = new SimulationLogStore();
