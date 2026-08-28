/**
 * src/state/log.svelte.js
 * 📜 SIMULATION LOG STORE: In-Memory Message Feed & Session Dialogue State
 *
 * Core Responsibilities:
 * - Manages the reactive active session dialogue log entries (`feed`) rendered by the UI message stack.
 * - Maintains an internal ID lookup set to prevent duplicate message ingestion.
 * - Reconciles in-memory message state with IndexedDB persistence via `session_driver`.
 * - Provides live mutation APIs (`add`, `update`, `remove`, `edit_entry`, `delete_entry`, `delete_attachment`, `clear`).
 *
 * Dependencies & Cross-Module Invariants:
 * - `@data` (`session_driver`): Loading, deleting, and editing persisted message records.
 * - `runtime.svelte.js` (`runtime`): Resolving the active `story_id`.
 */

import { session_driver } from "@data";
import { runtime } from "./runtime.svelte.js";

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {Object} LogEntry
 * @property {string | number} [id] - Unique message identifier or database primary key.
 * @property {'user' | 'model' | 'fractal' | 'system' | 'narrator' | string} role - Message sender role.
 * @property {string} [type] - Message category or system event type.
 * @property {string} text - Message body or dialogue prose.
 * @property {string} [turn_type] - Temporal turn category.
 * @property {string} [character_name] - Name of speaking entity.
 * @property {number} [round] - Round number when message was recorded.
 * @property {Record<string, any>} [meta] - Telemetry metadata, tags, dynamics, or prologue/epilogue flags.
 * @property {number} [created_at] - Creation timestamp in milliseconds.
 * @property {string} [story_id] - Associated story identifier.
 * @property {string | Date | number} [timestamp] - Display timestamp.
 * @property {string[]} [attachments] - Array of base64 data URLs or asset paths.
 */

// ============================================================================
// [SECTION 2: SIMULATION LOG STORE CLASS]
// ============================================================================

export class SimulationLogStore {
  /** @type {LogEntry[]} */
  feed = $state([]);

  /** @type {Set<string | number>} */
  #id_set = new Set();

  /**
   * Synchronizes in-memory feed with persistence for the active story.
   */
  async refresh() {
    if (!runtime.story_id) {
      this.clear();
      return;
    }

    const messages = await session_driver.load_log(runtime.story_id);
    this.feed = messages;
    this.#id_set = new Set(messages.filter((m) => m.id != null).map((m) => m.id));
  }

  /**
   * Appends a log entry to the feed if not already present.
   * @param {LogEntry} entry - The log entry to append.
   */
  add(entry) {
    if (entry.id != null && this.#id_set.has(entry.id)) return;
    if (entry.id != null) this.#id_set.add(entry.id);
    this.feed.push(entry);
  }

  /**
   * Updates an existing entry in the in-memory feed.
   * Matches against entry `id` or `meta.id`.
   * @param {string | number} id
   * @param {Partial<LogEntry>} updates
   */
  update(id, updates) {
    const target = this.feed.find((entry) => entry.id === id || entry.meta?.id === id || String(entry.id) === String(id));
    if (target) {
      Object.assign(target, updates);
    }
  }

  /**
   * Removes an entry from the in-memory feed by identifier.
   * @param {string | number} id
   */
  remove(id) {
    const index = this.feed.findIndex((entry) => entry.id === id || entry.meta?.id === id || String(entry.id) === String(id));
    if (index !== -1) {
      const removed_id = this.feed[index].id;
      this.feed.splice(index, 1);
      if (removed_id != null) this.#id_set.delete(removed_id);
    }
  }

  /**
   * Deletes a log entry from persistence and removes it from the in-memory feed.
   * @param {string} id
   */
  async delete_entry(id) {
    await session_driver.delete_log_entry(id);
    this.remove(id);
  }

  /**
   * Deletes a specific image attachment from a persisted log entry.
   * @param {string} id
   * @param {number} attachment_index
   */
  async delete_attachment(id, attachment_index) {
    await session_driver.delete_log_attachment(id, attachment_index);
  }

  /**
   * Edits a log entry's text in persistence and mirrors the change in the in-memory feed.
   * @param {string} id
   * @param {string} new_text
   */
  async edit_entry(id, new_text) {
    await session_driver.edit_log_entry(id, new_text);
    this.update(id, { text: new_text });
  }

  /**
   * Empties the in-memory feed and resets the ID deduplication cache.
   */
  clear() {
    this.feed = [];
    this.#id_set.clear();
  }
}

// ============================================================================
// [SECTION 3: SINGLETON INSTANCE & EXPORT]
// ============================================================================

export const simulation_log = new SimulationLogStore();

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, converted ID cache to private field (#id_set), added clear()
 *   method, aligned JSDoc LogEntry typedef, and verified test suite.
 * - 2026-08-16: Added deduplication ID cache and live attachment/text mutation methods.
 */
