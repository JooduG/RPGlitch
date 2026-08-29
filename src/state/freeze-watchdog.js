/**
 * src/state/freeze-watchdog.js
 * 🧊 SIMULATION FREEZE WATCHDOG & EMERGENCY RECOVERY
 *
 * Core Responsibilities:
 * - Monitors the simulation state machine and streaming lifecycle for hung or deadlocked states.
 * - Enforces a 3-tier diagnostic recovery policy:
 *     - Tier 1 (No Stream): Generating/Locked for 90s with NO active stream → Force Recovery.
 *     - Tier 2a (Silent Stall): Active stream with NO new chunks received for 90s → Force Recovery.
 *     - Tier 2 (Broad Timeout): Generating/Locked for 5 minutes without content progress → Abort + Force Recovery.
 *     - Tier 3 (Consolidation Grace): Idle phase with intent lock active for >4 minutes → Releases intent lock.
 * - Provides unified `force_recover_simulation(reason)` endpoint shared by automatic watchdog tiers
 *   and the manual UI "Unstick" trigger in `StorymodeBar.svelte`.
 *
 * Dependencies & Cross-Module Invariants:
 * - `interface.svelte.js` (`app`): AbortController access, streaming reset, loading flag reset, and logging.
 * - `status.svelte.js` (`simulation_state`): State machine unlocking, complete signal, and intent release.
 */

import { app } from "./interface.svelte.js";
import { simulation_state } from "./status.svelte.js";

// ============================================================================
// [SECTION 1: CONSTANTS & RECOVERY THRESHOLDS]
// ============================================================================

export const FREEZE_WATCHDOG_INTERVAL_MS = 15000;
export const FREEZE_WATCHDOG_IDLE_GRACE_MS = 90000;
export const FREEZE_WATCHDOG_CHUNK_STALL_MS = 90000;
export const FREEZE_WATCHDOG_MAX_MS = 5 * 60 * 1000;
export const FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS = 4 * 60 * 1000;

let _freeze_watchdog_started = false;

// ============================================================================
// [SECTION 2: FORCE RECOVERY ENGINE]
// ============================================================================

/**
 * Forcefully recovers the simulation state machine from a frozen or hung condition.
 * Unlocks the state machine, clears dead streams, aborts active requests, and resets loading flags.
 * @param {string} reason - Human-readable diagnostic description of why recovery was triggered.
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
  } catch {
    /* Status state store never throws */
  }

  app.simulation.loading = false;
  app.end_stream();
  app.streaming.active = false;
  app.streaming.content = "";
  app.streaming.node_id = null;

  if (app.streaming.abort_controller) {
    try {
      app.streaming.abort_controller.abort();
    } catch {
      /* Request already aborted */
    }
    app.streaming.abort_controller = null;
  }
}

// ============================================================================
// [SECTION 3: FREEZE WATCHDOG TIMER & DIAGNOSTICS]
// ============================================================================

/**
 * Installs the background freeze watchdog timer.
 * Invoked once during app boot (`app.init()`).
 * @returns {number | null} Timer interval identifier, or null in non-browser environments.
 */
export function install_freeze_watchdog() {
  if (_freeze_watchdog_started || typeof window === "undefined") return null;
  _freeze_watchdog_started = true;

  /** @type {number} */
  let stuck_since = 0;
  let last_stream_len = 0;
  let last_chunk_ts = 0;
  let ever_streamed = false;

  const timer_id = window.setInterval(() => {
    const phase = simulation_state.phase;
    const intent_active = simulation_state.intent_active;
    const generating = phase === "generating";
    const locked = phase === "locked";
    const consolidating = phase === "idle" && intent_active;
    const streaming_active = app.streaming.active;

    if (streaming_active) ever_streamed = true;
    const stream_len = app.streaming.content?.length ?? 0;

    const stuck = (generating || locked || consolidating) && (intent_active || ever_streamed);
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
      // Tier 1: Generating/Locked with NO stream after idle grace
      if (!streaming_active && elapsed >= FREEZE_WATCHDOG_IDLE_GRACE_MS) {
        force_recover_simulation(`Simulation stuck ${Math.round(elapsed / 1000)}s with no stream`);
        stuck_since = 0;
        return;
      }

      // Tier 2a: Active stream stalled with no chunks
      if (streaming_active && last_chunk_ts > 0 && Date.now() - last_chunk_ts >= FREEZE_WATCHDOG_CHUNK_STALL_MS) {
        force_recover_simulation(`Stream produced no chunks for ${Math.round((Date.now() - last_chunk_ts) / 1000)}s`);
        stuck_since = 0;
        return;
      }

      // Tier 2: Broad max timeout without content progression
      if (elapsed >= FREEZE_WATCHDOG_MAX_MS && !stream_grew) {
        force_recover_simulation(`Simulation stuck ${Math.round(elapsed / 1000)}s with no progress`);
        stuck_since = 0;
        return;
      }
      return;
    }

    // Tier 3: Memory consolidation overrun grace
    if (elapsed >= FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS) {
      console.warn(`[Watchdog] Post-turn consolidation overran ${Math.round(elapsed / 1000)}s — releasing intent lock.`, { phase, intent_active });
      app.log(`[Watchdog] Post-turn consolidation overran ${Math.round(elapsed / 1000)}s — releasing intent lock.`, "warn");

      try {
        simulation_state.set_intent_active(false);
      } catch {
        /* State store never throws */
      }
      stuck_since = 0;
    }
  }, FREEZE_WATCHDOG_INTERVAL_MS);

  return timer_id;
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported constants for testing, added JSDoc documentation,
 *   and verified test suite.
 * - 2026-08-16: Added 3-tier freeze watchdog with chunk stall detection and consolidation grace.
 */
