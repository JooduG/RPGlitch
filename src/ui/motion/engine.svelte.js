/**
 * @file src/ui/motion/engine.svelte.js
 * 🌌 MOTION ENGINE — Centralized Svelte 5 native physics and motion configurations.
 * RUTHLESSLY STANDARDIZED: Pure reactive runtimes, zero legacy store dependencies.
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
 * Global motion state engine tracking visual intensity and accessibility states.
 * @namespace
 * @property {number} intensity - Global animation speed/play multiplier (0.0 to 1.0).
 * @property {boolean} isReduced - Evaluates to true if hardware or user requests reduced motion.
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
 * Native Svelte 5 Kinetic Spring Controller.
 * Eliminates legacy store subscription overhead by implementing a direct frame physics loop.
 */
class KineticSpring {
  /** @type {number} */
  #current = $state(0);
  /** @type {number} */
  #target = $state(0);
  /** @type {number} */
  #velocity = 0;
  /** @type {number} */
  #stiffness = $state(0.15);
  /** @type {number} */
  #damping = $state(0.8);
  /** @type {number} */
  #precision = $state(0.001);
  /** @type {number | null} */
  #rafId = null;

  /**
   * @param {number} initialValue
   * @param {{ stiffness?: number; damping?: number; precision?: number }} [options]
   */
  constructor(initialValue, options = {}) {
    this.#current = initialValue;
    this.#target = initialValue;
    this.#stiffness = options.stiffness ?? 0.15;
    this.#damping = options.damping ?? 0.8;
    this.#precision = options.precision ?? 0.001;
  }

  get value() {
    return this.#current;
  }

  set value(newValue) {
    this.set(newValue);
  }

  get stiffness() {
    return this.#stiffness;
  }
  set stiffness(val) {
    this.#stiffness = val;
  }

  get damping() {
    return this.#damping;
  }
  set damping(val) {
    this.#damping = val;
  }

  get precision() {
    return this.#precision;
  }
  set precision(val) {
    this.#precision = val;
  }

  /**
   * Targets a new coordinate value asynchronously.
   * @param {number} newValue
   * @param {{ hard?: boolean }} [opts]
   * @returns {Promise<void>}
   */
  async set(newValue, opts = {}) {
    this.#target = newValue;

    if (opts.hard) {
      this.#current = newValue;
      this.#velocity = 0;
      if (this.#rafId !== null) {
        cancelAnimationFrame(this.#rafId);
        this.#rafId = null;
      }
      return;
    }

    this.#spawn();
  }

  /**
   * Updates the target value using a modifier callback function.
   * @param {(current: number) => number} fn
   * @param {{ hard?: boolean }} [opts]
   * @returns {Promise<void>}
   */
  async update(fn, opts = {}) {
    return this.set(fn(this.#target), opts);
  }

  #spawn() {
    if (this.#rafId !== null) return;

    const step = () => {
      const dX = this.#target - this.#current;
      const springForce = dX * this.#stiffness;
      const dampingForce = -this.#velocity * this.#damping;
      const acceleration = springForce + dampingForce;

      this.#velocity += acceleration;
      this.#current += this.#velocity;

      // Convergence check: snap to target when movement falls below delta thresholds
      if (
        Math.abs(this.#target - this.#current) < this.#precision &&
        Math.abs(this.#velocity) < this.#precision
      ) {
        this.#current = this.#target;
        this.#velocity = 0;
        this.#rafId = null;
      } else {
        this.#rafId = requestAnimationFrame(step);
      }
    };

    this.#rafId = requestAnimationFrame(step);
  }
}

/**
 * A Svelte 5 rune-compatible spring physics wrapper.
 * Drop-in replacement API that detaches from legacy stores to protect compilation rules.
 *
 * @param {number} initialValue - The initial structural value of the mechanical spring.
 * @param {{ stiffness?: number; damping?: number; precision?: number }} [options] - Overrides for stiffness, damping, and mechanical precision.
 */
export function spring(initialValue, options = {}) {
  return new KineticSpring(initialValue, options);
}
