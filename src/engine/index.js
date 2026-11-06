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

// Authoritative simulation state class & DevMode log
export { Kernel } from "./kernel.svelte.js";
export { DevLog, dev_log } from "./dev.svelte.js";

// Pure headless turn orchestration
export {
  calculate_turn_tempo,
  TEMPO_OUTPUT_BUDGETS,
  enforce_pacing_backstop,
  CARETAKER_ROTATION,
  resolve_caretaker_target,
  execute_turn_1_director,
  execute_turn_2_character,
  execute_turn_2_continue,
  execute_turn_3_caretaker,
  execute_round,
} from "./turns.js";

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

// Bracket & stream parsing
export { extract_think_block, parse_bracket_token, parse_brackets, format_clean_brackets } from "./parser.js";

// Two-Tier Sieve RAG & vector math
export { count_text_tokens, cosine_similarity, create_ephemeral_vector_cache, score_and_rank_memories, two_tier_sieve_rag } from "./sieve.js";

// Streaming transport boundary
export { create_transport } from "./transport.js";
