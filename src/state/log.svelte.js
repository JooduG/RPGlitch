/**
 * src/state/log.svelte.js
 * 📜 SIMULATION & DEVELOPER LOG STORES: In-Memory Message Feed & Diagnostic Telemetry
 *
 * Core Responsibilities:
 * - Manages the reactive active session dialogue log entries (`feed`) rendered by the UI message stack (`simulation_log`).
 * - Maintains an internal ID lookup set to prevent duplicate message ingestion.
 * - Reconciles in-memory message state with IndexedDB persistence via `session_driver`.
 * - Provides live mutation APIs (`add`, `update`, `remove`, `edit_entry`, `delete_entry`, `delete_attachment`, `clear`).
 * - Manages developer-mode telemetry log entries backing `app.log()` and `app.logs` (Console HUD) (`developer_log`).
 * - Enforces an in-memory cap of MAX_DEVELOPER_LOG_ENTRIES (500) to prevent unbounded memory growth.
 * - Persists developer log entries into IndexedDB `kv_settings` so diagnostic history survives page reloads.
 *
 * Dependencies & Cross-Module Invariants:
 * - `@data` (`session_driver`, `db`): Loading, deleting, and editing persisted message records, and kv_settings persistence.
 * - `@utils` (`generate_uuid`): Generating unique cryptographic UUIDs per telemetry event.
 * - `runtime.svelte.js` (`runtime`): Resolving the active `story_id`.
 * - Invariant: Telemetry errors or storage hiccups must never throw or disrupt narrative execution.
 */

import { SvelteSet } from "svelte/reactivity";
import { db, session_driver } from "@data";
import { generate_uuid } from "@utils";
import { runtime } from "./runtime.svelte.js";

// ============================================================================
// [SECTION 1: CONSTANTS & IDENTIFIERS]
// ============================================================================

export const DEVELOPER_TELEMETRY_STORAGE_KEY = "dev_telemetry";
export const MAX_DEVELOPER_LOG_ENTRIES = 500;

export { generate_uuid };

// ============================================================================
// [SECTION 2: JSDOC SCHEMAS & TYPE DEFINITIONS]
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

/**
 * @typedef {Object} DeveloperLogEntry
 * @property {string} id - Unique UUID for the log event.
 * @property {string} message - Telemetry payload or diagnostic text.
 * @property {string} type - Event category (e.g. 'system', 'ai', 'db', 'warn', 'error').
 * @property {number} timestamp - Epoch timestamp in milliseconds.
 */

// ============================================================================
// [SECTION 3: SIMULATION LOG STORE CLASS]
// ============================================================================

export class SimulationLogStore {
  /** @type {LogEntry[]} */
  feed = $state([]);

  /** @type {SvelteSet<string | number>} */
  #id_set = new SvelteSet();

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
    this.#id_set = new SvelteSet(messages.filter((m) => m.id != null).map((m) => m.id));
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
// [SECTION 4: DEVELOPER TELEMETRY LOG STORE CLASS]
// ============================================================================

export class DeveloperLogStore {
  /** @type {DeveloperLogEntry[]} */
  #entries = $state([]);

  /** @type {any} */
  #persist_timer = null;

  /**
   * Current reactive list of telemetry log entries.
   * @returns {DeveloperLogEntry[]}
   */
  get entries() {
    return this.#entries;
  }

  /**
   * Immediately flushes any pending debounced telemetry writes to IndexedDB kv_settings.
   */
  flush() {
    if (this.#persist_timer) {
      clearTimeout(this.#persist_timer);
      this.#persist_timer = null;
    }
    try {
      db?.kv_settings?.put({ key: DEVELOPER_TELEMETRY_STORAGE_KEY, value: this.#entries.slice(-MAX_DEVELOPER_LOG_ENTRIES) })?.catch(() => {});
    } catch {
      /* Persistence errors must never break runtime flow */
    }
  }

  /**
   * Schedules a debounced write to IndexedDB kv_settings.
   */
  #schedule_persist() {
    if (this.#persist_timer) {
      clearTimeout(this.#persist_timer);
    }
    this.#persist_timer = setTimeout(() => {
      this.#persist_timer = null;
      try {
        db?.kv_settings?.put({ key: DEVELOPER_TELEMETRY_STORAGE_KEY, value: this.#entries.slice(-MAX_DEVELOPER_LOG_ENTRIES) })?.catch(() => {});
      } catch {
        /* Persistence errors must never break runtime flow */
      }
    }, 500);
  }

  /**
   * Records a developer or system diagnostic event.
   * Capped to MAX_DEVELOPER_LOG_ENTRIES and asynchronously persisted to IndexedDB (debounced).
   * @param {string} message
   * @param {string} [type='system']
   * @returns {DeveloperLogEntry}
   */
  log(message, type = "system") {
    const entry = {
      id: generate_uuid(),
      message: String(message ?? ""),
      type,
      timestamp: Date.now(),
    };

    this.#entries.push(entry);
    if (this.#entries.length > MAX_DEVELOPER_LOG_ENTRIES) {
      this.#entries.splice(0, this.#entries.length - MAX_DEVELOPER_LOG_ENTRIES);
    }

    this.#schedule_persist();

    return entry;
  }

  /**
   * Restores persisted developer logs from IndexedDB.
   * @returns {Promise<DeveloperLogEntry[]>}
   */
  async hydrate() {
    try {
      const entry = await db?.kv_settings?.get(DEVELOPER_TELEMETRY_STORAGE_KEY);
      if (entry?.value && Array.isArray(entry.value)) {
        this.#entries = entry.value;
      }
    } catch (error) {
      console.warn("[DeveloperLog] Hydration failed:", error);
    }
    return this.#entries;
  }

  /**
   * Clears all in-memory telemetry logs and deletes persisted storage.
   */
  clear() {
    this.#entries = [];
    try {
      db?.kv_settings?.delete?.(DEVELOPER_TELEMETRY_STORAGE_KEY)?.catch(() => {});
    } catch {
      /* Ignore cleanup failures */
    }
  }
}

// ============================================================================
// [SECTION 5: SINGLETON INSTANCES & EXPORTS]
// ============================================================================

export const simulation_log = new SimulationLogStore();
export const developer_log = new DeveloperLogStore();

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    developer_log.flush();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      developer_log.flush();
    }
  });
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-09-23: Consolidated developer telemetry store (`developer-log.svelte.js`) directly
 *   into log.svelte.js under P4 Zero Backwards Compatibility.
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, converted ID cache to private field (#id_set), added clear()
 *   method, aligned JSDoc LogEntry typedef, and verified test suite.
 * - 2026-08-16: Added deduplication ID cache and live attachment/text mutation methods.
 */
