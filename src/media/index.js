/**
 * ============================================================================
 * RPGlitch Media Layer Sovereign Barrel Export
 * ============================================================================
 *
 * @file src/media/index.js
 * @description Central barrel export providing unified access to neural audio
 * synthesis (Kokoro-82M TTS), design token palettes, image generation quality
 * tiers, prompt templates, aesthetic mapping filters, and Svelte 5 visual engine runes.
 *
 * Architectural Laws:
 * - Downward layer flow: Media layer may import from Data, Platform, and Utils.
 *   It MUST NEVER import from UI or State.
 * - Single source of truth: All sensory rendering, voice cadences, and visual
 *   image orchestration services are exposed through this barrel.
 *
 * ============================================================================
 */

// ============================================================================
// Neural Audio & Voice Cadence Engine
// ============================================================================

export { Audio, audio_engine, AudioEngine, VoiceEngine, AUDIO_STORAGE_KEY } from "./audio.svelte.js";

export {
  KOKORO_VOICES,
  CADENCE_RATES,
  VOICE_CADENCES,
  get_cadence_rate,
  resolve_voice_uri,
  resolve_voice_name,
  normalize_role,
  extract_styled_segments,
  split_speech_sentences,
  infer_voice_for_chunk,
  split_speech_by_speaker,
} from "./speech.js";

// ============================================================================
// Visual Color Palettes & Signature Tokens
// ============================================================================

export {
  get_signature_color,
  get_signature_label,
  ensure_theme_tokens,
  SIGNATURE_COLORS,
  PALETTE,
  PALETTE_CSS_VARIABLES,
  PALETTE_VARIABLES,
} from "./palette.js";

export { TOKENS } from "./tokens.js";

// ============================================================================
// Image Generation Quality Tiers & Resolutions
// ============================================================================

export { IMAGE_TIERS, DEFAULT_IMAGE_TIER, normalize_image_tier, get_resolution, get_tier_guidance_scale } from "./image-tiers.js";

// ============================================================================
// Visual Aesthetics & Prompt Compilers
// ============================================================================

export { NEGATIVE_PROMPT, prompt_templates, parse_llm_image_prompt_response, clean_image_prompt } from "./image-prompts.js";

export {
  aesthetic_resolver,
  build_aesthetic_map,
  strip_visual_excluded,
  VISUAL_EXCLUDED_KEYS,
  ORDERED_VISUAL_STYLE_KEYS,
  resolve_visual_engine_tokens,
} from "./image-aesthetics.js";

export { resolve_image_trigger } from "./image-trigger.js";

// ============================================================================
// Visual Engine Runtime (Svelte 5 Runes)
// ============================================================================

export { visual_engine, VisualEngine } from "./visual.svelte.js";

// ============================================================================
// Image Beats & Generation Lifecycle
// ============================================================================

export {
  spawn_image_beat,
  sweep_stale_ghosts,
  get_image_generation_queue,
  reset_image_generation_queue,
  IMAGE_RESOLVE_TIMEOUT_MS,
} from "./image-beats.js";

/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: structured barrel into canonical functional sections with universal header/footer architecture and exported PALETTE_CSS_VARIABLES / PALETTE_VARIABLES.
 */
