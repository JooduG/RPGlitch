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

export { gamemaster, story_pipeline } from "./story.js";
export { execute_director_shot } from "./director.js";

// ============================================================================
// Response Parsing, Repair & Cognition Filters
// ============================================================================

export {
  extract_and_repair_json,
  parse_profile_json,
  parse_think_block,
  balance_think_tags,
  strip_directors_note_seed,
  validate_and_repair_response,
  is_refusal_response,
  parse_llm_image_prompt_response,
  strip_proper_names,
  clean_image_prompt,
} from "./parser.js";

// ============================================================================
// Prompt Compilation & Master Switchboard
// ============================================================================

export { compile_prompt, PROMPTS, get_prompt, resolve_prompt_mode } from "./prompts.js";
export { create_render_accessors, build_scoring_context } from "./builder.js";

// ============================================================================
// Temporal Engine & Memory Forge (Shot 2 Consolidation)
// ============================================================================

export { temporal_engine, reconcile_vector_caps } from "./temporal.js";

// ============================================================================
// Profile Synthesis & Roster Genesis
// ============================================================================

export { apply_profile_to_entity, structure_profile, spawn_character } from "./profile.js";

// ============================================================================
// Simulation Physics & Dynamics Axis Engine
// ============================================================================

export {
  apply_dynamics_gravity,
  extract_entity_dynamics_baselines,
  compute_dynamics_deltas,
  evaluate_subtext_protocols,
  evaluate_dynamics_rules,
  DYNAMICS_AXES,
  DYNAMICS_RULES,
} from "./physics.js";

// ============================================================================
// Telemetry & Turn Summary Generation
// ============================================================================

export { build_turn_summary } from "./telemetry.js";

// ============================================================================
// Optics & Visual Prompt Compilation (Sensory Cortex)
// ============================================================================

export { render_narrative_style_xml, render_visual_style_xml, render_core_protocols } from "./modules/protocols.js";
export { format_sensory_history } from "./modules/history.js";
export { render_optics_prompt } from "./builder.js";
export { VISUAL_EXCLUDED_KEYS, strip_visual_excluded } from "./modules/entities/epistemic.js";

/**
 * CHANGELOG:
 * - 2026-09-19: Re-exported VISUAL_EXCLUDED_KEYS and strip_visual_excluded directly from concrete module epistemic.js under P4 Zero Backwards Compatibility.
 * - 2026-09-19: Exported VISUAL_EXCLUDED_KEYS and strip_visual_excluded from entities module following epistemic prompt filter unification.
 * - 2026-09-18: Exported visual optics pipeline (`optics.js`) and image prompt response parsers (`parser.js`) as part of prompt pipeline standardization.
 * - 2026-09-11: Updated barrel exports to reference consolidated root domain modules: story.js, builder.js, temporal.js, and profile.js.
 * - 2026-08-29: Applied /harmonize protocol: structured barrel into canonical functional sections with universal header/footer architecture and exported story_pipeline.
 */
