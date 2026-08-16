/**
 * src/platform/environment.js
 * 🛡️ ENVIRONMENT HARDENING
 * Install-time guards that suppress known-benign browser and Perchance engine
 * errors before any app code runs. Pure platform concern — wired in exactly
 * once from the entry point (src/main.js) via install_environment_hardening().
 */

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
 *
 * Belt-and-suspenders: also filter any "ResizeObserver loop" errors that reach
 * window.onerror or error event listeners, in case the rAF wrap is not enough.
 */
function install_resize_observer_guard() {
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
}

/**
 * Silences the Perchance engine's own frame errors ("Symbol",
 * "numActualScriptLines") that surface from the sandbox iframe.
 */
function silence_perchance_frame_errors() {
  if (typeof window !== "undefined") {
    window.addEventListener(
      "error",
      (e) => {
        try {
          const msg = e.message ? String(e.message) : "";
          if (msg.includes("Symbol") || msg.includes("numActualScriptLines")) {
            e.preventDefault();
            e.stopPropagation();
          }
        } catch {
          // Fallback for objects that cannot be converted to string, such as raw symbols
        }
      },
      true,
    );

    window.addEventListener(
      "unhandledrejection",
      (e) => {
        try {
          const reason = e.reason;
          const msg = reason && typeof reason === "object" && reason.message ? String(reason.message) : reason ? String(reason) : "";
          if (msg.includes("Symbol") || msg.includes("numActualScriptLines")) {
            e.preventDefault();
            e.stopPropagation();
          }
        } catch {
          // Fallback for unconvertible reasons
        }
      },
      true,
    );
  }
}

/**
 * Installs all environment hardening. Called once from the entry point before
 * any app code creates observers or registers its own error listeners.
 */
export const install_environment_hardening = () => {
  install_resize_observer_guard();
  silence_perchance_frame_errors();
};
