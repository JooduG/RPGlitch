import { app } from "./app-store.svelte.js";
import { simulation_state } from "./status.svelte.js";

/************************************************************************************
 * 🧊 FREEZE WATCHDOG (composer-freeze recovery)
 * ----------------------------------------------------------------------------------
 * The composer can only die if the simulation state machine gets stuck
 * (phase generating/locked or intent_active stuck true) with no live turn.
 * Three tiers:
 *   - Tier 1 (fast & safe): busy/locked with NO active stream for 90s → force unlock.
 *   - Tier 2a (silent stream): an ACTIVE stream with NO new chunk for 90s → the
 *     generator hung after its first flush → force unlock.
 *   - Tier 2 (broad): busy/locked for 5 min regardless of streaming, with no
 *     streaming progress (content growing / heartbeat) → abort + force unlock.
 * A live stream with growing content extends the window, so slow-but-healthy
 * generations are never interrupted.
 ************************************************************************************/
let _freeze_watchdog_started = false;
const FREEZE_WATCHDOG_INTERVAL_MS = 15000;
const FREEZE_WATCHDOG_IDLE_GRACE_MS = 90000;
const FREEZE_WATCHDOG_CHUNK_STALL_MS = 90000;
const FREEZE_WATCHDOG_MAX_MS = 5 * 60 * 1000;
// Idle-phase consolidation (phase==="idle" while intent_active) runs a separate,
// generous LLM forge that can legitimately take minutes — it must never trip the
// tier-1 no-stream error path. Guard it with its own longer window.
const FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS = 4 * 60 * 1000;

/**
 * Forcefully recovers the simulation from a frozen state. Exported so the
 * composer's manual "Unstick" button and the watchdog tiers share one recovery
 * path: unlock the state machine, drop any dead stream, and abort its request.
 */
export function force_recover_simulation(reason) {
  console.warn("[Watchdog] Detected frozen simulation state — force-recovering.", {
    reason,
    phase: simulation_state.phase,
    intent_active: simulation_state.intent_active,
    loading: app.simulation.loading,
    streaming_active: app.streaming.active,
  });
  app.log(`[Watchdog] ${reason} — force-recovering the simulation.`, "error");
  try {
    simulation_state.complete();
    simulation_state.unlock();
    simulation_state.set_intent_active(false);
  } catch (_err) {
    /* state store never throws */
  }
  app.simulation.loading = false;
  app.end_stream();
  app.streaming.active = false;
  app.streaming.content = "";
  app.streaming.node_id = null;
  if (app.streaming.abort_controller) {
    try {
      app.streaming.abort_controller.abort();
    } catch (_err) {
      /* already aborted */
    }
    app.streaming.abort_controller = null;
  }
}

/**
 * Installs the freeze watchdog. Called once from app.init() so it only runs in
 * the browser after the real bootstrap, never in tests or SSR.
 */
export function install_freeze_watchdog() {
  if (_freeze_watchdog_started || typeof window === "undefined") return;
  _freeze_watchdog_started = true;

  /** @type {number} */
  let stuck_since = 0;
  let last_stream_len = 0;
  let last_chunk_ts = 0;

  setInterval(() => {
    const phase = simulation_state.phase;
    const intent_active = simulation_state.intent_active;
    const generating = phase === "generating";
    const locked = phase === "locked";
    const consolidating = phase === "idle" && intent_active;
    const streaming_active = app.streaming.active;
    const stream_len = app.streaming.content?.length ?? 0;

    // The watchdog only arms on the phases it can actually diagnose. A plain
    // idle phase (no generation in flight) is healthy even if a stale intent
    // flag is stuck on — arming there caused the tier-1 false positives that
    // interrupted legitimate post-turn consolidation. Idle+intent gets its own
    // generous consolidation window below instead.
    const stuck = generating || locked || consolidating;
    if (!stuck) {
      stuck_since = 0;
      last_stream_len = stream_len;
      last_chunk_ts = streaming_active ? Date.now() : 0;
      return;
    }

    if (stuck_since === 0) {
      stuck_since = Date.now();
      last_stream_len = stream_len;
      last_chunk_ts = streaming_active ? Date.now() : 0;
      return;
    }

    const elapsed = Date.now() - stuck_since;
    const stream_grew = stream_len > last_stream_len;
    if (stream_grew) last_chunk_ts = Date.now();
    last_stream_len = stream_len;

    if (generating || locked) {
      if (!streaming_active && elapsed >= FREEZE_WATCHDOG_IDLE_GRACE_MS) {
        force_recover_simulation(`Simulation stuck ${Math.round(elapsed / 1000)}s with no stream`);
        stuck_since = 0;
        return;
      }
      // Tier 2a: an ACTIVE stream that hasn't produced a chunk in a long time
      // is dead — the generator hung silently after its first flush.
      if (streaming_active && last_chunk_ts > 0 && Date.now() - last_chunk_ts >= FREEZE_WATCHDOG_CHUNK_STALL_MS) {
        force_recover_simulation(`Stream produced no chunks for ${Math.round((Date.now() - last_chunk_ts) / 1000)}s`);
        stuck_since = 0;
        return;
      }
      if (elapsed >= FREEZE_WATCHDOG_MAX_MS && !stream_grew) {
        force_recover_simulation(`Simulation stuck ${Math.round(elapsed / 1000)}s with no progress`);
        stuck_since = 0;
        return;
      }
      return;
    }

    // Consolidation window: LLM forges are slow and silent by design. If one
    // overruns, release the intent lock with a warning instead of a full
    // force-recovery (the forge is guarded against double-consolidation, so the
    // only real failure mode is the lock being held too long).
    if (elapsed >= FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS) {
      console.warn(`[Watchdog] Post-turn consolidation overran ${Math.round(elapsed / 1000)}s — releasing intent lock.`, {
        phase,
        intent_active,
      });
      app.log(`[Watchdog] Post-turn consolidation overran ${Math.round(elapsed / 1000)}s — releasing intent lock.`, "warn");
      try {
        simulation_state.set_intent_active(false);
      } catch (_err) {
        /* state store never throws */
      }
      stuck_since = 0;
    }
  }, FREEZE_WATCHDOG_INTERVAL_MS);
}
