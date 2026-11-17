/**
 * src/engine/index.js
 * ============================================================================
 * 📜 SOVEREIGN NUCLEAR ENGINE - BARREL EXPORTS
 * ============================================================================
 *
 * Public interface for the RPGlitch simulation engine.
 * Downward consumer layers (src/ui/, App.svelte) import cleanly from this entry point.
 * ============================================================================
 */

// Visualizer delegation (media -> engine inversion): the engine registers its
// visualizer turn into media at boot, so media never imports @engine — not
// even lazily — and audit-layers stays clean in both directions.
import { set_visualizer_envision_impl } from "@media";
import { execute_visualizer_envision as _execute_visualizer_envision } from "./lifecycle.js";
set_visualizer_envision_impl(_execute_visualizer_envision);

// Authoritative simulation state class
export { LLM_PRIORITY, get_llm_gate_status, resolve_priority, run_llm_job } from "./gate.js";
// Turn-session core (Phase 3 prod path) + Kernel compat holder over the same transactions
export { apply_director_deltas_to_dynamics, continue_turn_transaction, create_turn_session, Kernel, submit_turn_transaction } from "./kernel.svelte.js";
export { get_mock_message, get_transport } from "./transport.js";

// Pure headless turn orchestration
export {
  CARETAKER_ROTATION,
  build_turn_summary,
  calculate_turn_tempo,
  execute_ghostwriter,
  execute_round,
  execute_turn_1_director,
  execute_turn_2_character,
  execute_turn_2_continue,
  execute_turn_3_caretaker,
  execute_turn_structuring,
  execute_turn_visualizer,
  resolve_caretaker_target,
} from "./turns.js";

// Bridge affordances
export { birth_entity_core, execute_epilogue, execute_prologue, execute_visualizer_envision, structure_profile } from "./lifecycle.js";
export { execute_continue, execute_turn } from "./runs.js";
// Session driver & simulation/developer logs (moved in from src/data/)
export { bind_session_driver, match_speaker_snapshots, resolve_log_entity_id, session_driver } from "./sessions.svelte.js";
export { DEVELOPER_TELEMETRY_STORAGE_KEY, developer_log, resolve_entity_id_by_name, simulation_log } from "./log.svelte.js";

// Unified prompt pipeline & 4 Purpose Cores
export { PURPOSE_CORES, compile_prompt } from "./prompts.js";

// Structural verification anchor
export {
  extract_tag_sequence,
  verify_compiled_prompt,
  verify_prompt_hygiene,
  verify_system_envelope,
  verify_tag_balance,
  verify_tag_order,
} from "./verifier.js";

// Two-Tier Sieve RAG & vector math
export { cosine_similarity, count_text_tokens, create_ephemeral_vector_cache, score_and_rank_memories, two_tier_sieve_rag } from "./sieve.js";

// Simulation Runtime & Entity Chronology
export { RuntimeEngineStore as RuntimeEngine, RuntimeEngineStore, runtime } from "./runtime.svelte.js";

// Simulation Phase, UI Locks, Streaming & Stasis Recovery
export { force_recover_simulation, install_freeze_watchdog, simulation_state, streaming, ui_state } from "./status.svelte.js";

// Chrono Engine (Turn Orchestration & Physics Loop)
export { ChronoEngine, chrono_engine } from "./chrono.svelte.js";
