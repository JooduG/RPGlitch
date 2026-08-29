/**
 * ============================================================================
 * RPGlitch Shared Utilities Layer Sovereign Barrel Export
 * ============================================================================
 *
 * @file src/utils/index.js
 * @description Central barrel export providing unified access to cross-layer
 * state bridges, mathematical & cryptographic algorithms, string/prose codecs,
 * Markdown/XML parsers, DOM/HTML helpers, resilient async runners, and CSS resolvers.
 *
 * Architectural Laws:
 * - Pure and portable: All utilities are stateless or encapsulate self-contained
 *   primitives, safe for ANY layer (@ui, @state, @intelligence, @data, @platform, @media) to import.
 * - Downward layer independence: Utilities MUST NEVER import upward from @ui, @state,
 *   @intelligence, @data, @platform, or @media.
 *
 * ============================================================================
 */

// ============================================================================
// UI Resolution, View Transitions & Blob Codecs
// ============================================================================

export * from "./ui-helpers.js";

// ============================================================================
// Safe Deep Object Path Traversal
// ============================================================================

export * from "./field-path.js";

// ============================================================================
// HTML Entity Decoding & Text Stripping
// ============================================================================

export * from "./html.js";

// ============================================================================
// Markdown Tokenizer & Formatter
// ============================================================================

export * from "./markdown.js";

// ============================================================================
// Mathematics, Cryptographic RNG & Deterministic Hashing
// ============================================================================

export * from "./math.js";

// ============================================================================
// Shared ONNX WASM Mutex & Readiness Signals
// ============================================================================

export * from "./onnx.js";

// ============================================================================
// XML Escaping, Prompt Serialization & Bracket Transforms
// ============================================================================

export * from "./xml.js";

// ============================================================================
// Cross-Layer State & Streaming Bridges
// ============================================================================

export * from "./bridges.js";

// ============================================================================
// Text, Cognition Stripping & Relational Graph Codecs
// ============================================================================

export * from "./text.js";

// ============================================================================
// Circuit Breaker & Exponential Backoff Resilience
// ============================================================================

export * from "./resilience.js";

// ============================================================================
// Story Transcript & Markdown Export Serializer
// ============================================================================

export * from "./story-export.js";

// ============================================================================
// Sequential Job Queue & Cancellation Pipeline
// ============================================================================

export * from "./job-queue.js";

// ============================================================================
// Style Hierarchy Resolution & AI Prose Detoxification
// ============================================================================

export * from "./styles.js";

/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   categorized functional section dividers, and changelog footer.
 */
