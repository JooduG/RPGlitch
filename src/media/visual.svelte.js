/**
 * @file src/media/visual.svelte.js
 * 🎨 SENSORY CORTEX — TRANSITIONAL FACADE SHIM
 *
 * Forwards to src/media/index.js to preserve parallel coexistence with legacy consumers
 * (such as src/intelligence/story.test.js:207-223).
 */

export {
  visual_engine,
  VisualEngine,
  dispatch_visual_generation,
  find_image_engine,
  reset_cached_image_engine,
  mark_generation_in_flight,
  clear_generation_in_flight,
  is_generation_in_flight,
  reset_generation_in_flight,
  get_image_generation_queue,
  reset_image_generation_queue,
  _image_generation_queue,
  _in_flight_image_generations,
  count_pending_ghosts,
  mark_placeholder_failed,
  sweep_stale_ghosts,
  spawn_image_beat,
  IMAGE_GENERATION_QUEUE_CAPACITY,
  IMAGE_PLACEHOLDER_HARD_CAP,
  IMAGE_RESOLVE_TIMEOUT_MS,
  IMAGE_GHOST_MAX_AGE_MS,
} from "./index.js";
