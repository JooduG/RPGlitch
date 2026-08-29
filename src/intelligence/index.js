/**
 * ============================================================================
 * RPGlitch Intelligence Layer Sovereign Barrel Export
 * ============================================================================
 *
 * @file src/intelligence/index.js
 * @description Central barrel export providing unified access to turn orchestration,
 * response parsing, prompt synthesis, temporal consolidation (Memory Forge),
 * profile generation, and physics/dynamics engines.
 *
 * Architectural Laws:
 * - Unidirectional layer flow: Intelligence layer may import from Data, Platform,
 *   Media, and Utils. It MUST NEVER import from UI or State.
 * - Single source of truth: All AI compilation pipelines and cognitive drivers
 *   are routed through this barrel.
 *
 * ============================================================================
 */

// ============================================================================
// Story & Narrative Turn Orchestration
// ============================================================================

export { gamemaster, story_pipeline } from "./story-pipeline.js";

// ============================================================================
// Response Parsing, Repair & Cognition Filters
// ============================================================================

export { parse_profile_json, parse_think_block, validate_and_repair_response, is_refusal_response } from "./parser.js";

// ============================================================================
// Prompt Compilation & Template Generators
// ============================================================================

export { prompt_builder } from "./prompts/builder.js";

// ============================================================================
// Temporal Engine & Memory Forge (Shot 2 Consolidation)
// ============================================================================

export { temporal_engine, reconcile_vector_caps } from "./temporal-pipeline.js";

// ============================================================================
// Profile Synthesis & Roster Genesis
// ============================================================================

export { apply_profile_to_entity, structure_profile, spawn_character } from "./profile-pipeline.js";

// ============================================================================
// Simulation Physics & Dynamics Axis Engine
// ============================================================================

export { physics_engine, DYNAMICS_AXES, GLOBAL_TRIGGERS } from "./physics.js";

// ============================================================================
// Telemetry & Turn Summary Generation
// ============================================================================

export { build_turn_summary } from "./telemetry.js";

/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: structured barrel into canonical functional sections with universal header/footer architecture and exported story_pipeline.
 */
