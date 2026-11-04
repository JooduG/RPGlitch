/**
 * ============================================================================
 * RPGlitch Media Layer Sovereign Barrel Export
 * ============================================================================
 *
 * @file src/media/index.js
 * Central barrel export providing unified access to procedural audio synthesis,
 * design token palettes, image generation quality tiers, optics taxonomy,
 * Perchance visual dispatch, and transitional facades.
 */

// ============================================================================
// Procedural Audio & Web Speech Fallback Engine
// ============================================================================

export {
  Audio,
  audio_engine,
  AudioEngine,
  VoiceEngine,
  get_audio_context,
  get_master_gain,
  init_audio_on_gesture,
  suspend_audio,
  close_audio_context,
  set_master_volume,
  toggle_mute,
  play_sfx,
  CADENCE_RATES,
  VOICE_CADENCES,
  normalize_role,
  resolve_voice_uri,
  resolve_voice_name,
  get_cadence_rate,
} from "./audio.js";

// ============================================================================
// Visual Color Palettes & Signature Tokens
// ============================================================================

export { get_signature_color, get_signature_label, ensure_theme_tokens } from "./palette.js";
export { SIGNATURE_COLORS, PALETTE, PALETTE_CSS_VARIABLES, TOKENS } from "./tokens.js";

// ============================================================================
// Pure Visual Optics (Taxonomy, Triggers & Guidance Scales)
// ============================================================================

export { IMAGE_TIERS, DEFAULT_IMAGE_TIER, normalize_image_tier, get_resolution, get_tier_guidance_scale, resolve_image_trigger } from "./optics.js";

// ============================================================================
// Stateless Visual Generation & Queue Lifecycle
// ============================================================================

export {
  dispatch_visual_generation,
  find_image_engine,
  reset_cached_image_engine,
  mark_generation_in_flight,
  clear_generation_in_flight,
  is_generation_in_flight,
  reset_generation_in_flight,
  get_image_generation_queue,
  reset_image_generation_queue,
  _image_generation_queue,
  _in_flight_image_generations,
  count_pending_ghosts,
  mark_placeholder_failed,
  sweep_stale_ghosts,
  spawn_image_beat,
  register_default_visual_engine,
  get_default_visual_engine,
  VisualEngine,
  visual_engine,
  IMAGE_GENERATION_QUEUE_CAPACITY,
  IMAGE_PLACEHOLDER_HARD_CAP,
  IMAGE_RESOLVE_TIMEOUT_MS,
  IMAGE_GHOST_MAX_AGE_MS,
} from "./visual.js";
