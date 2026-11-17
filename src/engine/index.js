/**
 * src/engine/index.js
 * ============================================================================
 * 📜 SOVEREIGN NUCLEAR ENGINE - BARREL EXPORTS (PHASE 5)
 * ============================================================================
 *
 * Public interface for the RPGlitch simulation engine.
 * Downward consumer layers (src/ui/, App.svelte) import cleanly from this entry point.
 *
 * Pure side-effect-free barrel, except the visualizer delegation below: the
 * engine registers its visualizer turn into media at boot, so media never
 * imports @engine — not even lazily — and audit-layers stays clean in both
 * directions. (Kept deliberately: removing it reintroduces the media→engine
 * edge and breaks the visual boot path. See record.)
 * ============================================================================
 */

// Visualizer delegation (media -> engine inversion): the engine registers its
// visualizer turn into media at boot, so media never imports @engine — not
// even lazily — and audit-layers stays clean in both directions.
import { set_visualizer_envision_impl } from "@media";
import { refine_image_prompt as _refine_image_prompt } from "./lifecycle.js";
set_visualizer_envision_impl(_refine_image_prompt);

// Authoritative simulation state class
export { LLM_PRIORITY, enqueue_llm_job, get_queue_status, resolve_priority } from "@utils";
// Unified streaming & direct LLM transport (Phase 5: single run_completion core)
export { get_mock_message, get_transport } from "./transport.js";

// Turn orchestration (Phase 5: turns.js + runs.js merged into runner.js)
export {
  apply_dynamics_step,
  continue_generation_step,
  continue_turn,
  dispatch_consolidation,
  extract_think_and_body,
  generate_user_draft,
  maybe_spawn_turn_image,
  persist_turn_rows,
  reset_turn_scope_for_testing,
  run_generation_step,
  run_image_prompt_step,
  run_memory_consolidation_step,
  run_planner_step,
  run_round,
  run_schema_extraction_step,
  run_turn,
  write_back_turn_state,
} from "./runner.js";

// Canonical turn physics/history re-exported from @simulation (single home)
export { build_turn_summary, calculate_turn_tempo, CARETAKER_ROTATION, resolve_caretaker_target } from "@simulation";

// Lifecycle jobs (Rank 4 verbs)
export { create_entity_with_profile, generate_closing, generate_opening, parse_entity_profile, refine_image_prompt } from "./lifecycle.js";

// Session driver & simulation/developer logs (moved in from src/data/)
export { match_speaker_snapshots, resolve_log_entity_id } from "@data";
export { session_driver } from "../state/chat.svelte.js";
export { DEVELOPER_TELEMETRY_STORAGE_KEY, developer_log } from "../state/devlog.svelte.js";
export { resolve_entity_id_by_name, simulation_log } from "../state/chat.svelte.js";

// Unified prompt pipeline & 4 Purpose Cores
export { PURPOSE_CORES, compile_prompt } from "@simulation";

// Structural verification anchor
export { extract_tag_sequence, verify_compiled_prompt, verify_prompt_hygiene, verify_system_envelope, verify_tag_balance, verify_tag_order } from "@simulation";

// Two-Tier Sieve RAG & vector math
export { cosine_similarity, count_text_tokens } from "@utils";
export {
  create_vector_cache as create_ephemeral_vector_cache,
  rank_memories as score_and_rank_memories,
  select_context_memories as two_tier_sieve_rag,
} from "@simulation";

// Simulation Runtime & Entity Chronology
export { RuntimeEngineStore as RuntimeEngine, RuntimeEngineStore, runtime } from "../state/runtime.svelte.js";

// Simulation Phase, UI Locks, Streaming & Stasis Recovery
export { force_recover_simulation, install_freeze_watchdog, simulation_state, ui_state } from "../state/status.svelte.js";
export { streaming, StreamingStore } from "../state/streaming.svelte.js";

// Chrono Engine (Turn Orchestration & Physics Loop)
export { ChronoEngine, chrono_engine } from "./chrono.svelte.js";
