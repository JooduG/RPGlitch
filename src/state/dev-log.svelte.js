/**
 * src/state/dev-log.svelte.js
 * 🧾 DEV LOG STORE
 * The dev-mode telemetry log backing `app.log()` / `app.logs` (the console
 * HUD). Persisted to kv_settings so history survives reloads, and capped so the
 * table never grows unbounded.
 */
import { db } from "@data";

const STORAGE_KEY = "dev_telemetry";
const MAX_ENTRIES = 500;

function fallback_uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class DevLogStore {
  /** @type {Array<{ id: string, message: string, type: string, timestamp: number }>} */
  #entries = $state([]);

  get entries() {
    return this.#entries;
  }

  /**
   * Records a dev/system event.
   * @param {string} message
   * @param {string} [type]
   */
  log(message, type = "system") {
    const entry = {
      id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : fallback_uuid(),
      message: String(message ?? ""),
      type,
      timestamp: Date.now(),
    };
    this.#entries.push(entry);
    if (this.#entries.length > MAX_ENTRIES) {
      this.#entries.splice(0, this.#entries.length - MAX_ENTRIES);
    }
    db?.kv_settings?.put({ key: STORAGE_KEY, value: this.#entries.slice(-MAX_ENTRIES) })?.catch?.(() => {});
    return entry;
  }

  /**
   * Restores the persisted dev log (survives reloads).
   * @returns {Promise<Array<any>>}
   */
  async hydrate() {
    try {
      const entry = await db.kv_settings.get(STORAGE_KEY);
      if (entry?.value && Array.isArray(entry.value)) {
        this.#entries = entry.value;
      }
    } catch (e) {
      console.warn("[DevLog] Hydration failed:", e);
    }
    return this.#entries;
  }

  clear() {
    this.#entries = [];
    db?.kv_settings?.delete?.(STORAGE_KEY)?.catch?.(() => {});
  }
}

export const dev_log = new DevLogStore();
