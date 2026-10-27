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
  flatten_markup_to_prose,
} from "./parser.js";

// ============================================================================
// Prompt Compilation & Master Switchboard
// ============================================================================

export { compile_prompt, PROMPTS, get_prompt, resolve_prompt_mode } from "./prompts.js";
export { create_render_accessors, build_scoring_context, context_builder, to_data_points } from "./builder.js";

// ============================================================================
// Temporal Engine & Memory Forge (Shot 2 Consolidation)
// ============================================================================

export { temporal_engine, reconcile_vector_caps } from "./temporal.js";

// ============================================================================
// Profile Synthesis & Roster Genesis
// ============================================================================

export { apply_profile_to_entity, structure_profile, spawn_character, birth_entity_core } from "./profile.js";

// ============================================================================
// Simulation Physics, Dynamics Engine & Telemetry
// ============================================================================

export {
  apply_dynamics_gravity,
  extract_entity_dynamics_baselines,
  compute_dynamics_deltas,
  evaluate_subtext_protocols,
  evaluate_dynamics_rules,
  reduce_dynamics,
  build_turn_summary,
  DYNAMICS_AXES,
  DYNAMICS_RULES,
} from "./dynamics.js";

// ============================================================================
// Optics & Visual Prompt Compilation (Sensory Cortex)
// ============================================================================

export { render_core_protocols } from "./modules/protocols.js";
export {
  render_narrative_style_xml,
  render_visual_style_xml,
  resolve_style_dna,
  resolve_style_snapshot,
  render_optics_fallback,
  compose_visual_generation_prompt,
  resolve_visual_engine_tokens,
} from "./modules/style.js";
export { render_visual_history, format_sensory_history } from "./modules/recency.js";

// ============================================================================
// Veil Engine & Universal Bracket Predicates (Epistemic Wall)
// ============================================================================

export {
  parse_bracket_entries,
  format_bracket_entry,
  apply_bracket_mutation,
  filter_epistemic_brackets,
  extract_entity_relationships,
  strip_epistemic_tags,
  strip_epistemic_secrets,
  verify_epistemic_integrity,
  strip_covert_directives,
  strip_bracket_engine_flags,
} from "./veil.js";
