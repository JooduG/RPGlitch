/**
 * src/media/policy.js
 * ============================================================================
 * 🎚️ IMAGE POLICY SURFACE (Rank 2, media)
 * ============================================================================
 *
 * Media-facing image policy: trigger evaluation plus the tier / resolution /
 * optics vocabulary. The canonical implementations live in `@simulation`
 * (single source of truth); this module is the media-layer surface that
 * re-exports them, alongside the trigger's per-entity axis semantics:
 * each entity's current value is compared against ITS OWN previous value,
 * so cross-entity from/to attribution cannot fabricate phantom deltas.
 *
 * Pure, no Svelte runes, no upward imports.
 * ============================================================================
 */

import {
  IMAGE_TIERS,
  ORDERED_VISUAL_STYLE_KEYS,
  TIER_RESOLUTIONS,
  build_aesthetic_map,
  evaluate_image_trigger,
  extract_aesthetic_traits,
  flatten_aesthetic_map,
  get_resolution,
  get_resolution_string,
  get_tier_guidance_scale,
  normalize_image_tier,
  render_optics_fallback,
  resolve_image_trigger,
  resolve_visual_engine_tokens,
} from "@simulation";

export {
  IMAGE_TIERS,
  ORDERED_VISUAL_STYLE_KEYS,
  TIER_RESOLUTIONS,
  build_aesthetic_map,
  evaluate_image_trigger,
  extract_aesthetic_traits,
  flatten_aesthetic_map,
  get_resolution,
  get_resolution_string,
  get_tier_guidance_scale,
  normalize_image_tier,
  render_optics_fallback,
  resolve_image_trigger,
  resolve_visual_engine_tokens,
};
