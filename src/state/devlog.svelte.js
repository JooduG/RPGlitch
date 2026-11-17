/**
 * src/state/devlog.svelte.js
 * 🧪 DEVELOPER TELEMETRY LOG STORE (Rank 3, state)
 *
 * In-memory diagnostic telemetry ring buffer with debounced IndexedDB
 * persistence. Imported directly by the app store and watchdog recovery —
 * no callback bridge.
 */
import { db } from "@data";
import { generate_uuid } from "@utils";
import { TELEMETRY_CAPS } from "@config";

export const DEVELOPER_TELEMETRY_STORAGE_KEY = "dev_telemetry";

// ============================================================================
// [DEVELOPER TELEMETRY LOG STORE CLASS]
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
   * Shared IndexedDB persistence write (single home for flush + debounce).
   */
  #persist() {
    try {
      db?.kv_settings?.put({ key: DEVELOPER_TELEMETRY_STORAGE_KEY, value: this.#entries.slice(-TELEMETRY_CAPS.DEVELOPER_LOG_ENTRIES) })?.catch(() => {});
    } catch {
      /* Persistence errors must never break runtime flow */
    }
  }

  /**
   * Immediately flushes any pending debounced telemetry writes to IndexedDB kv_settings.
   */
  flush() {
    if (this.#persist_timer) {
      clearTimeout(this.#persist_timer);
      this.#persist_timer = null;
    }
    this.#persist();
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
      this.#persist();
    }, 500);
  }

  /**
   * Records a developer or system diagnostic event.
   * Capped to TELEMETRY_CAPS.DEVELOPER_LOG_ENTRIES and asynchronously persisted to IndexedDB (debounced).
   * @param {string} message
   * @param {string} [type='system']
   * @returns {DeveloperLogEntry}
   */
  log(message, type = "system") {
    const entry = { id: generate_uuid(), message: String(message ?? ""), type, timestamp: Date.now() };

    this.#entries.push(entry);
    if (this.#entries.length > TELEMETRY_CAPS.DEVELOPER_LOG_ENTRIES) {
      this.#entries.splice(0, this.#entries.length - TELEMETRY_CAPS.DEVELOPER_LOG_ENTRIES);
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
    if (this.#persist_timer) {
      clearTimeout(this.#persist_timer);
      this.#persist_timer = null;
    }
    try {
      db?.kv_settings?.delete?.(DEVELOPER_TELEMETRY_STORAGE_KEY)?.catch(() => {});
    } catch {
      /* Ignore cleanup failures */
    }
  }
}
// ============================================================================
// [SINGLETON EXPORT & PAGE-LIFECYCLE FLUSH]
// ============================================================================

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
