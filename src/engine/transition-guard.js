/**
 * @file transition-guard.js
 * 🔒 THE TRANSITION SENTINEL
 * Centralized singleton guard for the View Transitions API.
 *
 * The browser enforces a global singleton for document.startViewTransition().
 * Firing a second transition while the first is still active causes an
 * InvalidStateError that aborts the first and logs a red error in the console.
 *
 * This guard serializes all calls through a single active-lock flag:
 *   - If the API is unavailable → callback runs synchronously (no animation).
 *   - If a transition is already in progress → callback runs synchronously (no animation).
 *   - Otherwise → callback runs inside a proper startViewTransition() call.
 *
 * The active lock is always released via finished.finally(), ensuring no leak
 * even if the callback throws or the transition is aborted by the browser.
 */

/** @type {{ active: boolean }} */
const state = { active: false };

/**
 * Safely wraps document.startViewTransition with a single-flight guard.
 *
 * If the View Transitions API is unavailable or a transition is already in
 * progress, the callback executes synchronously (instant DOM update, no
 * animation, no error).
 *
 * @param {() => void | Promise<void>} callback - The DOM mutation to animate.
 * @returns {void}
 */
export function guardedTransition(callback) {
  // Graceful fallback: no API or already active → run synchronously, no error
  if (typeof document === "undefined" || !document.startViewTransition || state.active) {
    callback();
    return;
  }

  state.active = true;

  const transition = document.startViewTransition(async () => {
    try {
      await callback();
    } catch (error) {
      console.error("[ViewTransition] Callback failed:", error);
      throw error;
    }
  });

  // Always release the lock when the transition settles, regardless of outcome.
  // finished may reject if the browser aborts the transition (AbortError) —
  // we suppress that too, as it is a normal browser lifecycle event.
  transition.finished
    .finally(() => {
      state.active = false;
    })
    .catch(() => {});
}
