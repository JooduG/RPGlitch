/**
 * src/engine/index.js
 * ============================================================================
 * 📜 SOVEREIGN NUCLEAR ENGINE — BARREL EXPORTS
 * ============================================================================
 *
 * Public interface for the RPGlitch simulation engine.
 * Downward consumer layers (src/ui/, App.svelte) import cleanly from this entry point.
 * ============================================================================
 */

// Authoritative simulation state class
export { Kernel } from "./kernel.svelte.js";
export { LLM_PRIORITY, resolve_priority, run_llm_job, get_llm_gate_status } from "./gate.js";
export { get_mock_message } from "./bridge.js";

// Pure headless turn orchestration
export {
  calculate_turn_tempo,
  CARETAKER_ROTATION,
  resolve_caretaker_target,
  execute_turn_1_director,
  execute_turn_2_character,
  execute_turn_2_continue,
  execute_turn_3_caretaker,
  execute_turn_visualizer,
  execute_turn_structuring,
  execute_round,
  build_turn_summary,
} from "./turns.js";

// Bridge affordances
export {
  execute_greenfield_turn,
  execute_greenfield_continue,
  execute_greenfield_prologue,
  execute_greenfield_epilogue,
  execute_ghostwriter,
  execute_visualizer_envision,
  structure_profile,
} from "./bridge.js";

// Unified prompt pipeline & 4 Purpose Cores
export { compile_prompt, PURPOSE_CORES } from "./prompts.js";

// Structural verification anchor
export {
  extract_tag_sequence,
  verify_tag_balance,
  verify_system_envelope,
  verify_tag_order,
  verify_prompt_hygiene,
  verify_compiled_prompt,
} from "./verifier.js";

// Two-Tier Sieve RAG & vector math
export { count_text_tokens, cosine_similarity, create_ephemeral_vector_cache, score_and_rank_memories, two_tier_sieve_rag } from "./sieve.js";

// Streaming transport boundary
export { create_transport } from "./transport.js";

// Simulation Runtime & Entity Chronology
export { runtime, RuntimeEngineStore, RuntimeEngineStore as RuntimeEngine } from "./runtime.svelte.js";

// Simulation Phase, UI Locks, Streaming & Stasis Recovery
export { simulation_state, ui_state, streaming, force_recover_simulation, install_freeze_watchdog } from "./status.svelte.js";

// Chrono Engine (Turn Orchestration & Physics Loop)
export { chrono_engine, ChronoEngine } from "./chrono.svelte.js";
