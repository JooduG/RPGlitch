/**
 * src/state/dev-log.svelte.js
 * 🧾 DEV LOG STORE: Persistent Developer Telemetry & Console HUD
 *
 * Core Responsibilities:
 * - Manages the dev-mode telemetry log entries backing `app.log()` and `app.logs` (Console HUD).
 * - Enforces an in-memory cap of MAX_DEV_LOG_ENTRIES (500) to prevent unbounded memory growth.
 * - Persists log entries into IndexedDB `kv_settings` so diagnostic history survives page reloads.
 * - Generates unique cryptographic UUIDs per telemetry event.
 *
 * Dependencies & Cross-Module Invariants:
 * - `@data` (`db`): Key-value persistence in `db.kv_settings`.
 * - Invariant: Telemetry errors or storage hiccups must never throw or disrupt narrative execution.
 */

import { db } from "@data";

// ============================================================================
// [SECTION 1: CONSTANTS & IDENTIFIER GENERATOR]
// ============================================================================

export const DEV_TELEMETRY_STORAGE_KEY = "dev_telemetry";
export const MAX_DEV_LOG_ENTRIES = 500;

/**
 * Generates a RFC-4122 compliant UUID.
 * Uses native crypto.randomUUID when available, with a pseudo-random fallback.
 * @returns {string}
 */
export function generate_uuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// [SECTION 2: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {Object} DevLogEntry
 * @property {string} id - Unique UUID for the log event.
 * @property {string} message - Telemetry payload or diagnostic text.
 * @property {string} type - Event category (e.g. 'system', 'ai', 'db', 'warn', 'error').
 * @property {number} timestamp - Epoch timestamp in milliseconds.
 */

// ============================================================================
// [SECTION 3: DEV LOG STORE CLASS]
// ============================================================================

export class DevLogStore {
  /** @type {DevLogEntry[]} */
  #entries = $state([]);

  /**
   * Current reactive list of telemetry log entries.
   * @returns {DevLogEntry[]}
   */
  get entries() {
    return this.#entries;
  }

  /**
   * Records a developer or system diagnostic event.
   * Capped to MAX_DEV_LOG_ENTRIES and asynchronously persisted to IndexedDB.
   * @param {string} message
   * @param {string} [type='system']
   * @returns {DevLogEntry}
   */
  log(message, type = "system") {
    const entry = {
      id: generate_uuid(),
      message: String(message ?? ""),
      type,
      timestamp: Date.now(),
    };

    this.#entries.push(entry);
    if (this.#entries.length > MAX_DEV_LOG_ENTRIES) {
      this.#entries.splice(0, this.#entries.length - MAX_DEV_LOG_ENTRIES);
    }

    try {
      db?.kv_settings?.put({ key: DEV_TELEMETRY_STORAGE_KEY, value: this.#entries.slice(-MAX_DEV_LOG_ENTRIES) })?.catch(() => {});
    } catch {
      /* Persistence errors must never break runtime flow */
    }

    return entry;
  }

  /**
   * Restores persisted developer logs from IndexedDB.
   * @returns {Promise<DevLogEntry[]>}
   */
  async hydrate() {
    try {
      const entry = await db?.kv_settings?.get(DEV_TELEMETRY_STORAGE_KEY);
      if (entry?.value && Array.isArray(entry.value)) {
        this.#entries = entry.value;
      }
    } catch (e) {
      console.warn("[DevLog] Hydration failed:", e);
    }
    return this.#entries;
  }

  /**
   * Clears all in-memory telemetry logs and deletes persisted storage.
   */
  clear() {
    this.#entries = [];
    try {
      db?.kv_settings?.delete?.(DEV_TELEMETRY_STORAGE_KEY)?.catch(() => {});
    } catch {
      /* Ignore cleanup failures */
    }
  }
}

// ============================================================================
// [SECTION 4: SINGLETON INSTANCE & EXPORT]
// ============================================================================

export const dev_log = new DevLogStore();

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported constants & generate_uuid helper, typed JSDoc schemas,
 *   and verified test suite.
 * - 2026-08-16: Initial persistent dev telemetry store with bounded capacity.
 */
