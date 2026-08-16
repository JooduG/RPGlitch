/**
 * src/state/telemetry.svelte.js
 * 📊 DEV MODE TELEMETRY LOG
 * System/engine event log for the DevMode HUD. Distinct from simulation_log
 * (the story feed): this records lifecycle events, is capped at 100 entries,
 * and is persisted (debounced) so DevMode history survives reloads.
 */
import { generate_uuid, state_bridge } from "@utils";
import { db } from "@data";

// Static formatter to avoid 'new Date()' mutable instance warnings in reactive contexts
const log_time_formatter = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

class TelemetryStore {
  /** @type {any[]} */
  logs = $state([]);
  /** @type {ReturnType<typeof setTimeout> | null} */
  _log_persist_timer = null;

  /**
   * Records a system event.
   * Uses Intl.format(Date.now()) to satisfy ESLint prefer-svelte-reactivity.
   * @param {string} message
   */
  log(message, type = "system") {
    // Burst dedupe: an identical message arriving within ~2.5s of the previous
    // one is a duplicate (e.g. a re-entrant boot banner), not a legitimately
    // repeated event — real repeats (e.g. consecutive "Generation complete.")
    // are always more than a few seconds apart.
    const prev = this.logs[0];
    if (prev && prev.message === message && Date.now() - (prev.created_at || 0) < 2500) return;

    const entry = {
      id: generate_uuid(),
      timestamp: log_time_formatter.format(Date.now()),
      created_at: Date.now(),
      message,
      type, // 'system' | 'ai' | 'db' | 'error'
    };
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();

    // Persist the telemetry log (capped, debounced) so DevMode history survives
    // reloads instead of being wiped with the session.
    if (typeof db?.kv_settings !== "undefined") {
      clearTimeout(this._log_persist_timer);
      this._log_persist_timer = setTimeout(async () => {
        try {
          await db.kv_settings.put({ key: "rpg_telemetry_logs", value: $state.snapshot(this.logs).slice(0, 100) });
        } catch (_persistErr) {
          /* telemetry persistence must never break the app */
        }
      }, 800);
    }

    // Emit to console when dev_mode is active
    if (state_bridge.app?.settings?.dev_mode) {
      console.info("[Engine]", `[Telemetry:${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Hydrates the persisted DevMode telemetry log so history survives reloads.
   * Called once from app.init() at bootstrap.
   */
  async hydrate() {
    if (typeof db?.kv_settings === "undefined") return;
    try {
      const stored = await db.kv_settings.get("rpg_telemetry_logs");
      if (stored?.value && Array.isArray(stored.value) && stored.value.length > 0) {
        this.logs = $state.snapshot(stored.value).slice(0, 100);
      }
    } catch (e) {
      console.error("[Security] Telemetry Log Hydration Failed:", e);
    }
  }

  /**
   * Clears the in-memory telemetry log. Test/utility isolation hook.
   */
  clear() {
    this.logs = [];
  }
}

export const telemetry_store = new TelemetryStore();
