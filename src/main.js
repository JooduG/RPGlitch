/**
 * RPGlitch Main Entry Point (Vite)
 * Handles core library exposure and database initialization.
 */
import "@media/design.css";
import Dexie from "dexie";
import DOMPurify from "dompurify";
// Expose core libs to the global scope (Perchance integration).
// Must happen BEFORE any other code runs
Object.assign(window, { Dexie, DOMPurify });

/**
 * Suppress benign "ResizeObserver loop completed with undelivered notifications" errors.
 *
 * This is a well-known browser warning fired when a ResizeObserver callback synchronously
 * resizes an element, causing the browser to defer the notification to the next frame. It is
 * harmless but Perchance's engine surfaces it as a fatal error modal — and because the
 * generator runs inside an iframe, Perchance's parent window can detect the error through
 * mechanisms (cross-window postMessage) that window.onerror cannot intercept.
 *
 * The robust fix: patch the ResizeObserver constructor so every callback runs inside a
 * requestAnimationFrame tick. This breaks the synchronous layout-thrash loop at its source,
 * so the error never fires — regardless of whether it originates from bits-ui, Floating UI,
 * FitText, auto-resize, or any other ResizeObserver consumer. The rAF wrap adds negligible
 * latency (one frame ~16ms) and errors thrown inside callbacks are caught and logged.
 */
if (typeof window !== "undefined" && typeof ResizeObserver !== "undefined") {
  const _orig_ro = ResizeObserver;
  class SafeResizeObserver extends _orig_ro {
    /**
     * @param {ResizeObserverCallback} callback
     */
    constructor(callback) {
      const wrapped = (entries, observer) => {
        requestAnimationFrame(() => {
          try {
            callback(entries, observer);
          } catch (err) {
            console.error("[SafeResizeObserver] callback error:", err);
          }
        });
      };
      super(/** @type {ResizeObserverCallback} */ (wrapped));
    }
  }
  // Preserve static props (e.g. any future browser additions)
  Object.setPrototypeOf(SafeResizeObserver, _orig_ro);
  Object.defineProperty(window, "ResizeObserver", {
    value: SafeResizeObserver,
    writable: true,
    configurable: true,
  });
}

// Belt-and-suspenders: also filter any ResizeObserver loop errors that reach
// window.onerror or error event listeners, in case the rAF wrap is not enough.
if (typeof window !== "undefined") {
  const RO_LOOP = "ResizeObserver loop";
  const _orig_onerror = window.onerror;
  window.onerror = function (msg, source, lineno, colno, error) {
    if (msg && String(msg).includes(RO_LOOP)) return true; // suppress
    return _orig_onerror ? _orig_onerror.call(this, msg, source, lineno, colno, error) : false;
  };
  const _orig_add_event_listener = window.addEventListener;
  window.addEventListener = function (type, listener, options) {
    if (type === "error") {
      const wrapped = (event) => {
        const m = event?.message;
        if (m && String(m).includes(RO_LOOP)) return;
        return listener.call(this, event);
      };
      return _orig_add_event_listener.call(this, type, wrapped, options);
    }
    return _orig_add_event_listener.call(this, type, listener, options);
  };
}

// [DEV] Mock environment setups (if needed in future)
// 🚀 BOOTSTRAP
// Composition root: publish the state layer's accessors and stream handlers into
// the @utils bridges (state_bridge / stream_bridge) so the engine can read state
// without importing @state directly — that preserves the downward import rule
// (engine MUST NOT import from state). Must run before app_bootstrap.init().
import { app, runtime, simulation_state, simulation_log } from "@state";
import { app_bootstrap, session_driver } from "@engine";
import { register_state_accessors, register_stream_handlers } from "@utils";

register_state_accessors({ app, runtime, simulation_state, simulation_log, session_driver });
register_stream_handlers({
  start: (id, role) => app.start_stream(id, role),
  update: (chunk) => app.update_stream(chunk),
  end: () => app.end_stream(),
  error: (node_id) => app.signal_stream_error(node_id),
  is_active: () => app.streaming.active,
});

app_bootstrap.init().then(() => {
  console.info("[Engine] Entry point active. Handing off to Bootstrap.");
});
