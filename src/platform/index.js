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
// DOMPurify Security & Content Sanitization
// ============================================================================

export { sanitize_to_fragment, security, sanitize, escape_html, validate_image } from "./security.js";

// ============================================================================
// Browser Environment Hardening
// ============================================================================

export { install_environment_hardening } from "./environment.js";

// ============================================================================
// Session Checkpoint Persistence
// ============================================================================

export { save_session_checkpoint, load_session_checkpoint, clear_session_checkpoint } from "./session-storage.js";

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

/**
 * CHANGELOG:
 * - 2026-08-29: Structured into canonical functional sections with universal header/footer architecture (/harmonize).
 */
