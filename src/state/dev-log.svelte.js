/**
 * src/state/dev-log.svelte.js
 * 📓 DEV MODE EVENT LOG
 * The DevMode HUD's lifecycle event log: boot banners, import results,
 * generation events. DISTINCT from per-turn simulation telemetry — the kernel
 * builds the per-turn physics/delta/vector payload in @intelligence/telemetry.js,
 * and the message feed renders it via @ui/message/telemetry-format.js. This
 * store records simple timestamped messages, capped at 100 entries and
 * persisted (debounced) so DevMode history survives reloads.
 */
import { generate_uuid, state_bridge } from "@utils";
import { db } from "@data";

// Static formatter to avoid 'new Date()' mutable instance warnings in reactive contexts
const log_time_formatter = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

class DevLog {
  /** @type {any[]} */
  entries = $state([]);
  /** @type {ReturnType<typeof setTimeout> | null} */
  _persist_timer = null;

  /**
   * Records a system event.
   * Uses Intl.format(Date.now()) to satisfy ESLint prefer-svelte-reactivity.
   * @param {string} message
   * @param {string} [type]
   */
  log(message, type = "system") {
    // Burst dedupe: an identical message arriving within ~2.5s of the previous
    // one is a duplicate (e.g. a re-entrant boot banner), not a legitimately
    // repeated event — real repeats (e.g. consecutive "Generation complete.")
    // are always more than a few seconds apart.
    const prev = this.entries[0];
    if (prev && prev.message === message && Date.now() - (prev.created_at || 0) < 2500) return;

    const entry = {
      id: generate_uuid(),
      timestamp: log_time_formatter.format(Date.now()),
      created_at: Date.now(),
      message,
      type, // 'system' | 'ai' | 'db' | 'error'
    };
    this.entries.unshift(entry);
    if (this.entries.length > 100) this.entries.pop();

    // Persist the event log (capped, debounced) so DevMode history survives
    // reloads instead of being wiped with the session.
    if (typeof db?.kv_settings !== "undefined") {
      clearTimeout(this._persist_timer);
      this._persist_timer = setTimeout(async () => {
        try {
          await db.kv_settings.put({ key: "rpg_telemetry_logs", value: $state.snapshot(this.entries).slice(0, 100) });
        } catch (_persistErr) {
          /* log persistence must never break the app */
        }
      }, 800);
    }

    // Emit to console when dev_mode is active
    if (state_bridge.app?.settings?.dev_mode) {
      console.info("[Engine]", `[Telemetry:${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Hydrates the persisted DevMode log so history survives reloads.
   * Called once from app.init() at bootstrap.
   */
  async hydrate() {
    if (typeof db?.kv_settings === "undefined") return;
    try {
      const stored = await db.kv_settings.get("rpg_telemetry_logs");
      if (stored?.value && Array.isArray(stored.value) && stored.value.length > 0) {
        this.entries = $state.snapshot(stored.value).slice(0, 100);
      }
    } catch (e) {
      console.error("[Security] Dev Log Hydration Failed:", e);
    }
  }

  /**
   * Clears the in-memory log. Test/utility isolation hook.
   */
  clear() {
    this.entries = [];
  }
}

export const dev_log = new DevLog();
