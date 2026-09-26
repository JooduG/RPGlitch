/**
 * ============================================================================
 * RPGlitch Platform Layer Sovereign Barrel Export
 * ============================================================================
 *
 * @file src/platform/index.js
 * @description Central barrel export providing unified access to low-level
 * platform adapters, Perchance iframe transport, DOMPurify security, session
 * storage, network fetch utilities, and neural semantic embeddings.
 *
 * Architectural Laws:
 * - Unidirectional layer flow: Platform layer must never import from higher layers
 *   (Data, Intelligence, State, UI).
 * - Single source of truth: All low-level platform APIs and browser bridges are
 *   routed through this barrel.
 *
 * ============================================================================
 */

// ============================================================================
// Perchance AI Text Transport & LLM Bridge
// ============================================================================

export { llm_service, sanitize_llm, looks_truncated, raw_to_text, raw_stop_reason } from "./transport.js";

// ============================================================================
// Network Fetch & URL Validation
// ============================================================================

export { fetch_web, validate_url, blob_to_data_url } from "./web-fetch.js";

// ============================================================================
// DOMPurify Security, Environment Hardening & Session Checkpointing
// ============================================================================

export {
  sanitize_to_fragment,
  security,
  sanitize,
  escape_html,
  validate_image,
  install_environment_hardening,
  save_session_checkpoint,
  load_session_checkpoint,
  clear_session_checkpoint,
} from "./security.js";

// ============================================================================
// Neural Semantic Embeddings Engine
// ============================================================================

export {
  embeddings_engine,
  ensure_embedding,
  ensure_embeddings,
  score_by_semantics,
  load_model,
  is_ready,
  embed,
  serialize_embedding,
  deserialize_embedding,
  EMBEDDING_DIM,
} from "./embeddings.svelte.js";

export { LLM_PRIORITY, run_llm_job, get_llm_gate_status, merge_abort_signals } from "./llm-gate.js";

/**
 * CHANGELOG:
 * - 2026-09-26: Re-exported the global LLM gate (`LLM_PRIORITY`, `run_llm_job`, `get_llm_gate_status`, `merge_abort_signals`) from `./llm-gate.js` so the state-layer freeze watchdog can read gate back-pressure telemetry.
 * - 2026-08-29: Structured into canonical functional sections with universal header/footer architecture (/harmonize).
 */
