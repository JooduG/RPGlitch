/**
 * @file src/ui/motion/engine.svelte.js
 * 🌌 MOTION ENGINE — Centralized Svelte 5 native physics and motion configurations.
 * RUTHLESSLY STANDARDIZED: Pure reactive runtimes, zero legacy store dependencies.
 */

// Module scope prefers-reduced-motion query
const media_query = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

let is_reduced_state = $state(!!media_query?.matches);

if (media_query) {
  media_query.addEventListener("change", (e) => {
    is_reduced_state = e.matches;
  });
}

/**
 * Global motion state engine tracking visual intensity and accessibility states.
 * @namespace
 * @property {number} intensity - Global animation speed/play multiplier (0.0 to 1.0).
 * @property {boolean} is_reduced - Evaluates to true if hardware or user requests reduced motion.
 */
export const motion = $state({
  intensity: 1.0,
  get is_reduced() {
    return is_reduced_state;
  },
  set is_reduced(value) {
    is_reduced_state = value;
  },
});
