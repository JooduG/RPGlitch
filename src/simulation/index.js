/**
 * src/simulation/index.js
 * ============================================================================
 * 🧬 SIMULATION ENGINE BARREL (@simulation)
 * ============================================================================
 *
 * Deterministic simulation physics, prompt assembly, and turn orchestration.
 * Rank 1 layer in the 6-Rank architectural DAG.
 *
 * Layer rules (repo layers.js): Rank 1 may import only @config / @definitions /
 * @utils + in-folder siblings. Rank 0 (@utils) must NEVER import this barrel;
 * Rank 2+ (engine, media, data, ui) may re-export downward.
 * ============================================================================
 */

// Bracket engine: tagged-field parsing, epistemic formatting, delta merges,
// relational harvesting, pseudo-JSON recovery, token constants.
export {
  AGGREGATE_KEYS,
  CLEAR_TOKENS,
  CLOTHING_KEYS,
  PHYSICAL_KEY_ALIASES,
  VISUAL_EXCLUDED_KEYS,
  apply_tagged_field_deltas,
  balance_brackets,
  derive_vector_title,
  extract_entity_relationships,
  format_relational_vector,
  format_tagged_fields,
  has_bracket_bond,
  normalize_physical_entries,
  parse_relational_vector,
  parse_tagged_fields,
  safe_parse_pseudo_json,
  strip_leading_key_echo,
} from "./brackets.js";

// LLM transport output: cognition stripping, JSON recovery, sanitization,
// prose detox, style resolution, slop linting, macro auditing.
export {
  SLOP_PATTERNS,
  audit_macro_shape,
  cap_somatic_markers,
  clean_generated_prose,
  first_sentence,
  lint_narrative_slop,
  parse_think_block,
  resolve_speaking_style,
  safe_parse_json,
  sanitize_llm,
  strip_cognition_blocks,
  strip_covert_directives,
} from "./llm-output.js";

// Style-key hierarchy resolver: Rank 0 leaf in `@utils` (re-exported here so
// existing `@simulation` consumers keep a single import surface).
export { resolve_style } from "../utils/style-resolve.js";

// Turn history: role canonicalization, beat normalization, collapse/filter/
// format, speaker matching, write-guard predicates, turn tempo + summaries.
export {
  build_turn_summary,
  calculate_turn_tempo,
  canonicalize_role,
  collapse_history,
  decompose_story_title,
  filter_narrative_messages,
  format_history_entries,
  is_empty_narrative_message,
  is_narrative_role,
  is_telemetry_meta,
  match_speaker_snapshots,
  normalize_history_beat,
  reconstruct_history_from_feed,
  resolve_entity_id_by_name,
  role_display_label,
} from "./history.js";

// Turn physics: pure reducer, baselines, directive evaluation, caretaker rotation.
export {
  CARETAKER_ROTATION,
  evaluate_dynamics_directives,
  evaluate_image_trigger,
  extract_metric_baselines,
  resolve_caretaker_target,
  step_dynamics,
} from "./dynamics.js";

// Retrieval: memory candidates, origin-weighted ranking, two-tier sieve,
// ephemeral vector cache.
export { TOTAL_FIELD_FLOORS_CHARACTERS, create_vector_cache, extract_memory_candidates, rank_memories, select_context_memories } from "./retrieval.js";

// Prompts + verifier + optics: purpose cores, XML compiler, tag gates,
// visual hygiene, tier taxonomy, trigger arbitration, aesthetic maps,
// beat composition.
export {
  IMAGE_TIERS,
  ORDERED_VISUAL_STYLE_KEYS,
  PURPOSE_CORES,
  TIER_RESOLUTIONS,
  build_aesthetic_map,
  clean_image_prompts,
  compile_prompt,
  compose_story_beat_prompt,
  extract_aesthetic_traits,
  extract_tag_sequence,
  flatten_aesthetic_map,
  get_resolution,
  get_resolution_string,
  get_tier_guidance_scale,
  normalize_image_tier,
  render_optics_fallback,
  render_thinking_mode,
  rescue_visual_prose,
  resolve_image_trigger,
  resolve_portrait_visual_style_key,
  resolve_story_beat_style,
  resolve_visual_engine_tokens,
  sanitize_visual_text,
  verify_compiled_prompt,
  verify_prompt_hygiene,
  verify_system_envelope,
  verify_tag_balance,
  verify_tag_order,
} from "./prompts.js";

/**
 * CHANGELOG
 * ----------------------------------------------------------------------------
 * 2026-11-17: Full Rank-1 public surface (Phase 2). Downward consumers
 *   (engine, media) re-export from here; Rank 0 never imports this barrel.
 */
