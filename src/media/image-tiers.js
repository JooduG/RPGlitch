/**
 * @file src/media/image-tiers.js
 * 🖼️ SENSORY CORTEX — IMAGE TIER TAXONOMY & RESOLUTION MAPPING
 *
 * Core Responsibilities:
 * 1. 4-Tier Image Taxonomy (`IMAGE_TIERS`):
 *    - `story_entities`: Multi-character group compositions (768x768).
 *    - `story_character`: In-story focused character portrayals (512x768).
 *    - `solo_entity`: Profile and isolated character portraits (512x768).
 *    - `story_scene`: Environmental, landscape, and establishing scene shots (768x512).
 * 2. Tier Normalization (`normalize_image_tier`):
 *    - Robust normalization mapping legacy or colloquial aliases to standard tier keys.
 * 3. Generation Parameters (`get_resolution`, `get_tier_guidance_scale`):
 *    - Width/height dimensions and CFG guidance scale baselines per shot type.
 *
 * Purity: 100% pure frozen tables & deterministic resolution functions.
 */

// ============================================================================
// [SECTION 1: TAXONOMY CONSTANTS & RESOLUTION SPECS]
// ============================================================================

/**
 * The 4 canonical image generation tiers.
 * @type {ReadonlyArray<"story_entities" | "story_character" | "solo_entity" | "story_scene">}
 */
export const IMAGE_TIERS = Object.freeze(["story_entities", "story_character", "solo_entity", "story_scene"]);

/**
 * Default fallback tier for auto-triggered environmental beats.
 * @type {"story_scene"}
 */
export const DEFAULT_IMAGE_TIER = "story_scene";

/**
 * Resolution dimensions mapped by canonical tier identifier.
 * @type {Readonly<Record<string, { width: number, height: number }>>}
 */
const TIER_RESOLUTIONS = Object.freeze({
  story_scene: Object.freeze({ width: 768, height: 512 }),
  solo_entity: Object.freeze({ width: 512, height: 768 }),
  story_character: Object.freeze({ width: 512, height: 768 }),
  story_entities: Object.freeze({ width: 768, height: 768 }),
});

// ============================================================================
// [SECTION 2: NORMALIZATION & PARAMETER RESOLVERS]
// ============================================================================

/**
 * Normalizes input tier keys or colloquial aliases to canonical tier names.
 * @param {string | null | undefined} target_type
 * @returns {"story_entities" | "story_character" | "solo_entity" | "story_scene"}
 */
export function normalize_image_tier(target_type) {
  if (!target_type) return "story_character";
  const str = String(target_type).trim().toLowerCase();

  if (str === "characters" || str === "prologue" || str === "group" || str === "story_entities") {
    return "story_entities";
  }
  if (str === "fractal_profile") {
    return "story_scene";
  }
  if (IMAGE_TIERS.includes(/** @type {any} */ (str))) {
    return /** @type {any} */ (str);
  }
  return "story_character";
}

/**
 * Resolves standard render resolution dimensions `{ width, height }` for a tier mode.
 * @param {string | null | undefined} mode
 * @returns {{ width: number, height: number }}
 */
export function get_resolution(mode) {
  const tier = normalize_image_tier(mode);
  return TIER_RESOLUTIONS[tier] || TIER_RESOLUTIONS.story_entities;
}

/**
 * Returns the baseline diffusion model guidance scale for a given tier.
 * Environmental scene shots use 7, while character portraits use a tighter baseline of 9.
 * @param {string | null | undefined} mode
 * @returns {number}
 */
export function get_tier_guidance_scale(mode) {
  return normalize_image_tier(mode) === "story_scene" ? 7 : 9;
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Verified 4-step /harmonize protocol: confirmed pristine layer boundaries, deeply frozen taxonomy tables, 100% pure deterministic resolvers, strict full-name nomenclature compliance, zero dead shims, and 10/10 passing tests.
 * - 2026-08-29: Applied ground-up /refactor protocol: added Universal File Architecture header block,
 *   structured 2 explicit section dividers, sealed IMAGE_TIERS and TIER_RESOLUTIONS tables,
 *   standardized camelCase parameters to snake_case (target_type), and verified 10/10 test suite.
 * - 2026-08-29: Centralized get_tier_guidance_scale and created dedicated image-tiers.test.js.
 * - 2026-08-28: Established unified 4-tier image taxonomy and aspect ratio mappings.
 */
