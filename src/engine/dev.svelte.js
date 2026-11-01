/**
 * src/engine/dev.svelte.js
 * ============================================================================
 * 📜 IN-GAME DEVMODE EVENT LOG
 * ============================================================================
 *
 * Lightweight Svelte 5 runes-based event sink powering the in-game DevMode HUD.
 * Captures non-diegetic diagnostic events: dynamics shifts, response turn tempo,
 * retrieved memory formations, and error states.
 * ============================================================================
 */

export class DevLog {
  events = $state([]);

  /**
   * Appends an event entry to the reactive in-game DevMode log.
   *
   * @param {string} type - e.g. "DYNAMICS_DELTA", "TURN_TEMPO", "MEMORY_FORMATION"
   * @param {object} payload
   */
  record(type, payload = {}) {
    const entry = {
      id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      type,
      payload,
    };
    this.events.push(entry);
    return entry;
  }

  /**
   * Clears all DevMode entries.
   */
  clear() {
    this.events = [];
  }

  /**
   * Retrieves events matching a specific diagnostic type.
   *
   * @param {string} type
   */
  get_by_type(type) {
    return this.events.filter((e) => e.type === type);
  }
}

export const dev_log = new DevLog();
