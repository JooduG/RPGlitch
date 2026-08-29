/**
 * ============================================================================
 * RPGlitch State Layer: Developer Telemetry Log Store
 * ============================================================================
 *
 * @file src/state/developer-log.svelte.js
 * @description Persistent developer telemetry and console HUD event tracking.
 *
 * Core Responsibilities:
 * - Manages developer-mode telemetry log entries backing `app.log()` and `app.logs` (Console HUD).
 * - Enforces an in-memory cap of MAX_DEVELOPER_LOG_ENTRIES (500) to prevent unbounded memory growth.
 * - Persists log entries into IndexedDB `kv_settings` so diagnostic history survives page reloads.
 * - Generates unique cryptographic UUIDs per telemetry event.
 *
 * Dependencies & Cross-Module Invariants:
 * - `@data` (`db`): Key-value persistence in `db.kv_settings`.
 * - Invariant: Telemetry errors or storage hiccups must never throw or disrupt narrative execution.
 *
 * ============================================================================
 */

import { db } from "@data";

// ============================================================================
// Constants & Identifier Generator
// ============================================================================

export const DEVELOPER_TELEMETRY_STORAGE_KEY = "dev_telemetry";
export const MAX_DEVELOPER_LOG_ENTRIES = 500;

/**
 * Generates an RFC-4122 compliant UUID.
 * Uses native crypto.randomUUID when available, with a pseudo-random fallback.
 * @returns {string}
 */
export function generate_uuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random_value = (Math.random() * 16) | 0;
    const value = character === "x" ? random_value : (random_value & 0x3) | 0x8;
    return value.toString(16);
  });
}

// ============================================================================
// JSDoc Schemas & Type Definitions
// ============================================================================

/**
 * @typedef {Object} DeveloperLogEntry
 * @property {string} id - Unique UUID for the log event.
 * @property {string} message - Telemetry payload or diagnostic text.
 * @property {string} type - Event category (e.g. 'system', 'ai', 'db', 'warn', 'error').
 * @property {number} timestamp - Epoch timestamp in milliseconds.
 */

// ============================================================================
// Developer Log Store Class
// ============================================================================

export class DeveloperLogStore {
  /** @type {DeveloperLogEntry[]} */
  #entries = $state([]);

  /**
   * Current reactive list of telemetry log entries.
   * @returns {DeveloperLogEntry[]}
   */
  get entries() {
    return this.#entries;
  }

  /**
   * Records a developer or system diagnostic event.
   * Capped to MAX_DEVELOPER_LOG_ENTRIES and asynchronously persisted to IndexedDB.
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

    try {
      db?.kv_settings?.put({ key: DEVELOPER_TELEMETRY_STORAGE_KEY, value: this.#entries.slice(-MAX_DEVELOPER_LOG_ENTRIES) })?.catch(() => {});
    } catch {
      /* Persistence errors must never break runtime flow */
    }

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
// Singleton Instance & Export
// ============================================================================

export const developer_log = new DeveloperLogStore();

/**
 * CHANGELOG:
 * - 2026-08-29: Renamed from dev-log.svelte.js to developer-log.svelte.js per Full-Name & Anti-Abbreviation Mandate (/harmonize).
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported constants & generate_uuid helper, typed JSDoc schemas,
 *   and verified test suite.
 * - 2026-08-16: Initial persistent dev telemetry store with bounded capacity.
 */
