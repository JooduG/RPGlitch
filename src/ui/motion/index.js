/**
 * @file src/ui/motion/index.js
 * 🌌 MOTION MODULE EXPORT HUB
 * Centralized gateway for all Svelte 5 native kinetic systems, physics wrappers, and stream renderers.
 * RUTHLESSLY STANDARDIZED: Strict ES module topology, fully transparent entry mappings.
 */

export { motion, spring } from "./engine.svelte.js";
export { pulse, roll, shimmy, stab } from "./kinetic.svelte.js";
export { overlay_in, overlay_out, item_in } from "./transitions.svelte.js";
export { typewriter } from "./Typewriter.svelte.js";
export { default as Typewriter } from "./Typewriter.svelte";
