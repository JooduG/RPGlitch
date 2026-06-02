/**
 * @file transition-guard.test.js
 * Tests for the centralized View Transition singleton guard.
 * Ensures serialized execution and graceful fallback under concurrency.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// NOTE: We must mock the module under test before importing it,
// as the guard uses a module-level singleton state object.
/** @type {(cb: () => void | Promise<void>) => void} */
let guardedTransition;

describe("transition-guard", () => {
  beforeEach(async () => {
    // Reset module registry to get a fresh singleton each test
    vi.resetModules();
    // @ts-ignore - IDE struggles to resolve this module in the dynamic import
    const mod = await import("./transition-guard.js");
    guardedTransition = mod.guardedTransition;
    // Reset mocks on document — cast via any to bypass TS non-optional property check
    /** @type {any} */ (document).startViewTransition = undefined;
  });

  describe("when document.startViewTransition is NOT available", () => {
    it("calls the callback synchronously without animation", () => {
      const cb = vi.fn();
      guardedTransition(cb);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("does not throw", () => {
      expect(() => guardedTransition(() => {})).not.toThrow();
    });
  });

  describe("when document.startViewTransition IS available", () => {
    /** @type {() => void} */
    let resolveTransition;
    /** @type {any} */
    let transitionMock;

    beforeEach(() => {
      // Build a controllable mock for startViewTransition
      const finishedPromise = new Promise((resolve) => {
        resolveTransition = /** @type {() => void} */ (resolve);
      });
      transitionMock = {
        ready: Promise.resolve(),
        finished: finishedPromise,
        updateCallbackDone: Promise.resolve(),
        skipTransition: vi.fn(),
        types: [],
      };
      /** @type {any} */ (document).startViewTransition = vi.fn((cb) => {
        // Execute the callback immediately like the real API does
        Promise.resolve().then(cb);
        return transitionMock;
      });
    });

    it("calls document.startViewTransition with the callback", async () => {
      const cb = vi.fn();
      guardedTransition(cb);
      await vi.waitFor(() => expect(cb).toHaveBeenCalledTimes(1));
      expect(document.startViewTransition).toHaveBeenCalledTimes(1);
    });

    it("sets active=true while transition runs, active=false after finished resolves", async () => {
      const cb = vi.fn();
      guardedTransition(cb);

      // Before finished resolves, a second call must bypass the API
      const cb2 = vi.fn();
      guardedTransition(cb2);

      // cb2 should run synchronously (fallback) — not through startViewTransition
      expect(cb2).toHaveBeenCalledTimes(1);
      // startViewTransition should only have been called once (for cb1)
      expect(document.startViewTransition).toHaveBeenCalledTimes(1);

      // Resolve the first transition, which should clear the active lock
      resolveTransition();
      await vi.waitFor(() => {
        // After the lock clears, a fresh call should go through the API again
        const cb3 = vi.fn();
        guardedTransition(cb3);
        expect(document.startViewTransition).toHaveBeenCalledTimes(2);
      });
    });

    it("releases the active lock after the transition's finished promise settles", async () => {
      // Use a deferred promise so we control exactly when the transition finishes
      /** @type {() => void} */
      let resolveFinished = () => {};
      const finishedPromise = new Promise((res) => {
        resolveFinished = /** @type {() => void} */ (res);
      });

      /** @type {any} */ (document).startViewTransition = vi.fn((cb) => {
        Promise.resolve().then(cb);
        return {
          ready: Promise.resolve(),
          finished: finishedPromise,
          updateCallbackDone: Promise.resolve(),
          skipTransition: vi.fn(),
          types: [],
        };
      });

      const cb = vi.fn();
      guardedTransition(cb);

      // Lock is held — a concurrent call must bypass the API (synchronous fallback)
      const cb2 = vi.fn();
      guardedTransition(cb2);
      expect(cb2).toHaveBeenCalledTimes(1);
      expect(document.startViewTransition).toHaveBeenCalledTimes(1);

      // Release the lock by settling the first transition
      resolveFinished();

      // After settled, the lock must be cleared — a new call must go through the API
      await vi.waitFor(() => {
        const cb3 = vi.fn();
        guardedTransition(cb3);
        expect(document.startViewTransition).toHaveBeenCalledTimes(2);
      });
    });
  });
});
