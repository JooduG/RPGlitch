/**
 * @file src/ui/motion/index.js
 * 🌌 MOTION MODULE EXPORT HUB
 * Centralized gateway for all Svelte 5 native kinetic systems, physics wrappers, and stream renderers.
 * RUTHLESSLY STANDARDIZED: Strict ES module topology, fully transparent entry mappings.
 */

export { motion } from "./engine.svelte.js";
export { pulse, roll, shimmy, stab } from "./kinetic.svelte.js";
export { overlay_in, overlay_out, item_in } from "./transitions.svelte.js";
export { fly_card_in, fly_card_out, make_card_clone, rect_of, strip_card_text } from "@entity/EntityCard.svelte.js";
export {
  capture_storyboard_flight,
  fly_storyboard_cards_into_prologue,
  update_card_scrub,
  clear_card_location,
} from "../entity/EntityCard.svelte.js";
export { typewriter } from "./Typewriter.svelte.js";
export { default as Typewriter } from "./Typewriter.svelte";
export { default as Shimmer } from "./Shimmer.svelte";
