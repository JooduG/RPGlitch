/**
 * @file src/engine/index.js
 * Public runtime barrel for `@engine` (Rank 4).
 */

export { ChronoEngine, chrono_engine } from "./chrono.svelte.js";
export {
  capture_story_image,
  create_entity_with_profile,
  generate_closing,
  generate_image_candidates,
  generate_opening,
  generate_user_draft,
  ghostwrite_user_draft,
  import_entities,
  parse_entity_profile,
  refine_image_prompt,
  run_mock,
} from "./lifecycle.js";
export { get_mock_message, get_transport, reset_transport } from "./transport.js";
export { reset_turn_scope_for_testing } from "./turns.js";
export { install_freeze_watchdog, uninstall_freeze_watchdog } from "./watchdog.js";
