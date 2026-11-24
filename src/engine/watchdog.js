/**
 * @file src/engine/watchdog.js
 * Background freeze watchdog timer that detects hung simulation turns and
 * triggers forced recovery on `execution`.
 */

import { TIMING_MS } from "@config";
import { execution } from "@state";
import { get_queue_status } from "@utils";

let _freeze_watchdog_started = false;
/** @type {number | null} */
let _freeze_watchdog_timer = null;

/**
 * Stops the background freeze watchdog timer.
 */
export function uninstall_freeze_watchdog() {
  if (_freeze_watchdog_timer != null) {
    clearInterval(_freeze_watchdog_timer);
    _freeze_watchdog_timer = null;
  }
  _freeze_watchdog_started = false;
}

/**
 * Installs the background freeze watchdog timer once during app boot.
 * @returns {number | null}
 */
export function install_freeze_watchdog() {
  if (_freeze_watchdog_started) return null;
  _freeze_watchdog_started = true;

  let stuck_since = 0;
  let last_stream_len = 0;
  let last_chunk_ts = 0;
  let ever_streamed = false;

  _freeze_watchdog_timer = window.setInterval(() => {
    const phase = execution.phase;
    const intent_active = execution.intent_active;
    const generating = phase === "generating";
    const locked = phase === "locked";
    const consolidating = phase === "idle" && intent_active;
    const streaming_active = execution.stream.active;

    if (streaming_active) ever_streamed = true;
    const stream_len = execution.stream.content?.length ?? 0;

    const stuck = (generating || locked || consolidating) && (intent_active || ever_streamed);
    if (!stuck) {
      stuck_since = 0;
      ever_streamed = false;
      last_stream_len = stream_len;
      last_chunk_ts = streaming_active ? Date.now() : 0;
      return;
    }

    if (get_queue_status().foreground_queued > 0) {
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
      if (!streaming_active && elapsed >= TIMING_MS.CEILING) {
        execution.recover(`Simulation stuck ${Math.round(elapsed / 1000)}s with no stream`);
        stuck_since = 0;
        return;
      }

      if (streaming_active && last_chunk_ts > 0 && Date.now() - last_chunk_ts >= TIMING_MS.CEILING) {
        execution.recover(`Stream produced no chunks for ${Math.round((Date.now() - last_chunk_ts) / 1000)}s`);
        stuck_since = 0;
        return;
      }

      if (elapsed >= TIMING_MS.LIFETIME && !stream_grew) {
        execution.recover(`Simulation stuck ${Math.round(elapsed / 1000)}s with no progress`);
        stuck_since = 0;
        return;
      }
      return;
    }

    if (elapsed >= TIMING_MS.LIFETIME) {
      console.warn(`[Watchdog] Post-turn consolidation overran ${Math.round(elapsed / 1000)}s - releasing intent lock.`, { phase, intent_active });
      execution.set_intent_active(false);
      stuck_since = 0;
    }
  }, TIMING_MS.HEARTBEAT);

  return _freeze_watchdog_timer;
}
