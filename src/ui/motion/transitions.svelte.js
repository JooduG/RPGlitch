/**
 * @file src/ui/motion/transitions.svelte.js
 * 🎬 UNIFIED TRANSITIONS — Shared enter/exit choreography.
 * Every overlay (modal/dialog/lightbox) and list-item lifecycle animation routes
 * through these helpers so timing, easing, and reduced-motion behavior stay
 * consistent across the app. All durations honor `motion.is_reduced` by snapping
 * to zero, so accessibility preferences are respected everywhere automatically.
 */
import { quartOut } from "svelte/easing";
import { motion } from "./engine.svelte.js";

const RISE_DISTANCE = 10; // px — matches --spacing-unit * 2.5 gesture
const SETTLE_SCALE = 0.97; // entrance starts slightly smaller than rest

/**
 * Standard overlay (modal / dialog / lightbox) entrance:
 * fade + rise 10px + settle from 97% scale.
 * @param {HTMLElement} _node
 * @param {{ duration?: number }} [opts]
 * @returns {import('svelte/transition').TransitionConfig}
 */
export function overlay_in(_node, { duration = 300 } = {}) {
  const d = motion.is_reduced ? 0 : duration;
  return {
    duration: d,
    easing: quartOut,
    css: (t) => `opacity: ${t}; transform: translateY(${(1 - t) * RISE_DISTANCE}px) scale(${SETTLE_SCALE + (1 - SETTLE_SCALE) * t});`,
  };
}

/**
 * Standard overlay exit: quick fade + settle down to 97% scale.
 * @param {HTMLElement} _node
 * @param {{ duration?: number }} [opts]
 * @returns {import('svelte/transition').TransitionConfig}
 */
export function overlay_out(_node, { duration = 160 } = {}) {
  const d = motion.is_reduced ? 0 : duration;
  return {
    duration: d,
    easing: quartOut,
    css: (t) => `opacity: ${t}; transform: scale(${SETTLE_SCALE + (1 - SETTLE_SCALE) * t});`,
  };
}

/**
 * Feed / library item entrance: gentle rise, no scale (keeps text crisp).
 * @param {HTMLElement} _node
 * @param {{ duration?: number }} [opts]
 * @returns {import('svelte/transition').TransitionConfig}
 */
export function item_in(_node, { duration = 300 } = {}) {
  const d = motion.is_reduced ? 0 : duration;
  return {
    duration: d,
    easing: quartOut,
    css: (t) => `opacity: ${t}; transform: translateY(${(1 - t) * RISE_DISTANCE}px);`,
  };
}
