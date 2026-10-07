/**
 * src/utils/styles.js
 * 🎨 STYLE RESOLUTION ENGINE
 *
 * Core Responsibilities:
 * - Cross-layer resolution of active styles (visual, narrative, speaking) across entity overrides and app settings.
 *   (Prose detox lives in ./detox.js; this module re-exports its VALID_SPEAKING_STYLES.)
 * - Speaking Style Hierarchy Resolution: Entity Speaking Style > Narrative Style Preset > "casual" default.
 * - AI Prose Detoxification (`detox_prose`): Intercepts and scrubs purple prose clichés, overused sensory crutches,
 *   and formulaic LLM sentence structures (denial-then-affirmation, self-answering dialogue, binary comparisons).
 * - Verb Conjugation & Case Preservation: Maps matching grammatical suffixes (-ed, -ing, -s, -es, -ly) and matches source casing.
 * - Decoupled Registry Integration: Rules are registered dynamically via `register_speaking_rules` to prevent circular dependencies.
 *
 * Consumed by:
 * - `src/intelligence/story-pipeline.js` (Prose cleanup before log persistence and streaming).
 * - `src/ui/message/render.js` (Message rendering and display transformations).
 * - `src/media/visual.svelte.js` (Visual style resolution for image generation).
 */

import { state_bridge } from "./bridges.js";
import { VALID_SPEAKING_STYLES } from "./detox.js";

export { VALID_SPEAKING_STYLES };

// ============================================================================
// [SECTION 2: STYLE HIERARCHY RESOLVERS]
// ============================================================================

/**
 * Resolves an active style key across an explicit entity override and global app settings.
 * @param {string | undefined} explicit_style - Explicit style key from entity/fractal.
 * @param {string} app_setting_key - Key in app settings (e.g. "narrative_style" | "visual_style").
 * @param {Record<string, any>} [registry={}] - Registry dictionary for validating key existence.
 * @param {string} [fallback=""] - Fallback key when no active style is found.
 * @returns {string} Resolved style identifier.
 */
export function resolve_style(explicit_style, app_setting_key, registry = {}, fallback = "") {
  if (explicit_style && explicit_style !== "default" && explicit_style !== "" && registry?.[explicit_style]) {
    return explicit_style;
  }

  const app_style = state_bridge.app?.settings?.[app_setting_key];
  if (app_style && app_style !== "default" && registry?.[app_style]) {
    return app_style;
  }

  return fallback;
}

/**
 * Resolves the active speaking style based on entity and narrative style hierarchy.
 * Priority: Entity Speaking Style > Narrative Style Preset > "casual" (default).
 * @param {Record<string, any> | null} [entity=null] - Active character or user entity.
 * @param {string | Record<string, any> | null} [narrative_style=null] - Active narrative style ID or style object.
 * @returns {SpeakingStyleId} Resolved speaking style identifier.
 */
export function resolve_speaking_style(entity = null, narrative_style = null) {
  const entity_style = entity?.speaking_style;
  if (entity_style && VALID_SPEAKING_STYLES.has(entity_style)) {
    return /** @type {SpeakingStyleId} */ (entity_style);
  }

  const style_speaking = typeof narrative_style === "object" && narrative_style !== null ? narrative_style.speaking_style : null;

  if (style_speaking && VALID_SPEAKING_STYLES.has(style_speaking)) {
    return /** @type {SpeakingStyleId} */ (style_speaking);
  }

  return "casual";
}
