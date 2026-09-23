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

export { get_signature_color, get_signature_label, ensure_theme_tokens, SIGNATURE_COLORS, PALETTE, PALETTE_CSS_VARIABLES } from "./palette.js";

export { TOKENS } from "./tokens.js";

// ============================================================================
// Pure Visual Optics (Taxonomy, Triggers, Aesthetics & Prompts)
// ============================================================================

export {
  IMAGE_TIERS,
  DEFAULT_IMAGE_TIER,
  normalize_image_tier,
  get_resolution,
  get_tier_guidance_scale,
  resolve_image_trigger,
  aesthetic_resolver,
  build_aesthetic_map,
  strip_visual_excluded,
  VISUAL_EXCLUDED_KEYS,
  ORDERED_VISUAL_STYLE_KEYS,
  resolve_visual_engine_tokens,
  compose_visual_generation_prompt,
} from "./optics.js";

// ============================================================================
// Visual Engine Runtime (Svelte 5 Runes) & Image Beats Lifecycle
// ============================================================================

export {
  visual_engine,
  VisualEngine,
  spawn_image_beat,
  sweep_stale_ghosts,
  mark_generation_in_flight,
  clear_generation_in_flight,
  is_generation_in_flight,
  reset_generation_in_flight,
  get_image_generation_queue,
  reset_image_generation_queue,
  _image_generation_queue,
  IMAGE_GENERATION_QUEUE_CAPACITY,
  IMAGE_PLACEHOLDER_HARD_CAP,
  IMAGE_RESOLVE_TIMEOUT_MS,
  IMAGE_GHOST_MAX_AGE_MS,
} from "./visual.svelte.js";

/**
 * CHANGELOG:
 * - 2026-09-24: Media layer consolidation — collapsed image-tiers.js, image-trigger.js, and image-aesthetics.js into optics.js; absorbed image-beats.js into visual.svelte.js; enforced P4 Zero Backwards Compatibility.
 * - 2026-09-24: Folded the visual prompt-token domain out of `visual.svelte.js` — exported `compose_visual_generation_prompt` from image-aesthetics.js.
 * - 2026-09-24: Re-exported the in-flight image generation registry helpers from image-beats.js.
 * - 2026-09-19: Purged cross-layer re-exports `parse_llm_image_prompt_response` and `clean_image_prompt` from intelligence/parser.js under P4 Zero Backwards Compatibility.
 * - 2026-09-19: Purged retired prompt_templates export under P4 Zero Backwards Compatibility.
 * - 2026-09-18: Re-exported image prompt compilers and parsers from @intelligence following prompt pipeline consolidation.
 * - 2026-08-29: Applied /harmonize protocol: structured barrel into canonical functional sections with universal header/footer architecture and exported PALETTE_CSS_VARIABLES / PALETTE_VARIABLES.
 */
