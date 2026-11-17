/**
 * src/state/index.js
 * ============================================================================
 * 🌐 REACTIVE STATE CONTROLLERS BARREL (@state)
 * ============================================================================
 *
 * Svelte 5 runes state ownership and session lifecycle controllers.
 * Rank 3 layer in the 6-Rank architectural DAG.
 * ============================================================================
 */

// Application interface & image lightbox/picker state
export {
  app,
  begin_picker_regeneration,
  close_image_preview,
  close_picker,
  close_regenerate,
  deliver_candidates,
  get_persisted_meta,
  image_picker,
  image_preview,
  InterfaceStore,
  open_image_preview,
  open_picker,
  run_image_regeneration,
  select_candidate,
  set_regenerate_error,
  start_regenerate,
} from "./app.svelte.js";

// Chat log feed & session driver facade
export { ChatLogStore, match_speaker_snapshots, resolve_entity_id_by_name, resolve_log_entity_id, session_driver, simulation_log } from "./chat.svelte.js";

// Developer telemetry log
export { DEVELOPER_TELEMETRY_STORAGE_KEY, developer_log, DeveloperLogStore } from "./devlog.svelte.js";

// Streaming buffer lifecycle
export { streaming, StreamingStore } from "./streaming.svelte.js";

// Simulation phase, UI locks & freeze recovery
export {
  force_recover_simulation,
  install_freeze_watchdog,
  simulation_state,
  SimulationStateStore,
  ui_state,
  UIStateStore,
  uninstall_freeze_watchdog,
} from "./status.svelte.js";

// Runtime entity kernel & chronology
export { runtime, RuntimeEngineStore } from "./runtime.svelte.js";
