/**
 * src/platform/environment.js
 * 🛡️ ENVIRONMENT HARDENING & PLATFORM RESILIENCE
 *
 * Core Responsibilities:
 * - Installs runtime guards that suppress known benign browser warnings and Perchance sandbox frame errors.
 * - Patches ResizeObserver to execute callbacks inside `requestAnimationFrame` ticks, breaking layout loops.
 * - Intercepts unhandled errors and promise rejections for iframe-specific Perchance internal artifacts.
 *
 * Dependencies & Cross-Module Invariants:
 * - Executed synchronously exactly once at bootstrap in `src/main.js` before any observers or DOM mounting.
 * - Must remain purely self-contained with zero external dependencies to guarantee safe early execution.
 */

// ============================================================================
// [SECTION 1: CONSTANTS & ERROR SIGNATURES]
// ============================================================================

/** Text pattern identifying benign ResizeObserver layout deferral warnings. */
const RESIZE_OBSERVER_LOOP_PATTERN = "ResizeObserver loop";

/** Text patterns identifying benign Perchance iframe sandbox internal artifacts. */
const PERCHANCE_FRAME_ERROR_PATTERNS = ["Symbol", "numActualScriptLines"];

// ============================================================================
// [SECTION 2: RESIZEOBSERVER HARDENING GUARD]
// ============================================================================

/**
 * Suppresses benign "ResizeObserver loop completed with undelivered notifications" errors.
 *
 * Fired when a ResizeObserver callback synchronously alters element geometry, deferring notifications.
 * By wrapping the callback inside a `requestAnimationFrame` tick, synchronous layout-thrashing is broken
 * before it reaches browser dispatch, with fallback filtering on `window.onerror` and `window.addEventListener`.
 */
function install_resize_observer_guard() {
  if (typeof window !== "undefined" && typeof ResizeObserver !== "undefined") {
    const original_resize_observer = ResizeObserver;

    class SafeResizeObserver extends original_resize_observer {
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

    Object.setPrototypeOf(SafeResizeObserver, original_resize_observer);
    Object.defineProperty(window, "ResizeObserver", {
      value: SafeResizeObserver,
      writable: true,
      configurable: true,
    });
  }

  if (typeof window !== "undefined") {
    const original_onerror = window.onerror;
    window.onerror = function (msg, source, lineno, colno, error) {
      if (msg && String(msg).includes(RESIZE_OBSERVER_LOOP_PATTERN)) {
        return true; // Suppress benign loop notification
      }
      return original_onerror ? original_onerror.call(this, msg, source, lineno, colno, error) : false;
    };

    const original_add_event_listener = window.addEventListener;
    window.addEventListener = function (type, listener, options) {
      if (type === "error") {
        const wrapped = (event) => {
          const message = event?.message;
          if (message && String(message).includes(RESIZE_OBSERVER_LOOP_PATTERN)) {
            return;
          }
          return listener.call(this, event);
        };
        return original_add_event_listener.call(this, type, wrapped, options);
      }
      return original_add_event_listener.call(this, type, listener, options);
    };
  }
}

// ============================================================================
// [SECTION 3: PERCHANCE IFRAME FRAME ERROR SUPPRESSION]
// ============================================================================

/**
 * Checks whether an error or rejection payload matches known Perchance sandbox internal errors.
 * @param {any} target
 * @returns {boolean}
 */
function is_perchance_frame_error(target) {
  if (!target) return false;
  try {
    const message = target.message ? String(target.message) : String(target);
    return PERCHANCE_FRAME_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
  } catch {
    return false;
  }
}

/**
 * Silences the Perchance engine's own frame errors ("Symbol", "numActualScriptLines")
 * that surface from the sandbox iframe parent boundaries.
 */
function silence_perchance_frame_errors() {
  if (typeof window === "undefined") return;

  window.addEventListener(
    "error",
    (event) => {
      if (is_perchance_frame_error(event)) {
        event.preventDefault?.();
        event.stopPropagation?.();
      }
    },
    true,
  );

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      if (is_perchance_frame_error(event?.reason)) {
        event.preventDefault?.();
        event.stopPropagation?.();
      }
    },
    true,
  );
}

// ============================================================================
// [SECTION 4: INITIALIZATION ENTRY POINT]
// ============================================================================

/**
 * Installs all environment hardening. Called once from the entry point (`src/main.js`)
 * before any app code creates observers or registers its own error listeners.
 */
export function install_environment_hardening() {
  install_resize_observer_guard();
  silence_perchance_frame_errors();
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, extracted `is_perchance_frame_error` helper, normalized function
 *   declarations, and established dedicated unit test suite.
 * - 2026-08-20: Hardened ResizeObserver wrapping with `requestAnimationFrame` and `Object.setPrototypeOf`
 *   to suppress iframe layout loops. Added Perchance sandbox unhandled rejection filtering.
 */
