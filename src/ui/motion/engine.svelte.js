import { spring as svelteSpring } from "svelte/motion";

/**
 * @file src/ui/motion/engine.svelte.js
 * 🌌 MOTION ENGINE — Centralized Svelte 5 rune-based physics and motion configurations.
 */

// Module scope prefers-reduced-motion query
const mediaQuery =
  typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

let isReducedState = $state(!!mediaQuery?.matches);

if (mediaQuery) {
  mediaQuery.addEventListener("change", (e) => {
    isReducedState = e.matches;
  });
}

/**
 * Global motion state engine.
 * @namespace
 * @property {number} intensity - Global animation intensity multiplier (0.0 to 1.0).
 * @property {boolean} isReduced - Evaluates to true if reduced motion is requested.
 */
export const motion = $state({
  intensity: 1.0,
  get isReduced() {
    return isReducedState;
  },
  set isReduced(value) {
    isReducedState = value;
  },
});

/**
 * A Svelte 5 rune-compatible spring physics wrapper.
 * Enables declarative binding of spring physics to DOM styles.
 *
 * @template T
 * @param {T} initialValue - The initial value of the spring.
 * @param {import("svelte/motion").SpringOptions} [options] - Overrides for stiffness, damping, precision, etc.
 * @returns {{
 *   value: T;
 *   set: (value: T, opts?: Parameters<ReturnType<typeof svelteSpring>["set"]>[1]) => Promise<void>;
 *   update: (fn: (current: T) => T, opts?: Parameters<ReturnType<typeof svelteSpring>["update"]>[1]) => Promise<void>;
 *   stiffness: number;
 *   damping: number;
 *   precision: number;
 * }}
 */
export function spring(initialValue, options = {}) {
  // Use Svelte's core spring store
  const store = svelteSpring(initialValue, options);

  // Reactive state to expose to Svelte 5 runes
  let currentValue = $state(initialValue);

  // Keep internal state synchronized with store emissions
  store.subscribe((v) => {
    currentValue = v;
  });

  return {
    get value() {
      return currentValue;
    },
    set value(newValue) {
      store.set(newValue);
    },
    set(newValue, opts) {
      return store.set(newValue, opts);
    },
    update(fn, opts) {
      return store.update(fn, opts);
    },
    get stiffness() {
      return store.stiffness;
    },
    set stiffness(val) {
      store.stiffness = val;
    },
    get damping() {
      return store.damping;
    },
    set damping(val) {
      store.damping = val;
    },
    get precision() {
      return store.precision;
    },
    set precision(val) {
      store.precision = val;
    },
  };
}
