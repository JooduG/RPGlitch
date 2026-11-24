/**
 * @file src/definitions/styles.js
 * Style tile resolution: maps narrative and visual style choices into
 * unified descriptor tiles for rendering across entity cards, bubbles, and profile.
 */

import { get_narrative_style } from "./narrative-styles.js";
import { get_visual_style } from "./visual-styles.js";

/**
 * @typedef {Object} StyleTileDescriptor
 * @property {string} name - Display name of the style
 * @property {string} portrait - Portrait/thumbnail URL or empty string
 * @property {string} fallback - Short fallback text or acronym
 * @property {string} tooltip - Tooltip description
 * @property {"sm" | "md" | "lg"} [size_tier] - Size tier hint
 */

/**
 * Resolves narrative and visual style descriptor tiles for a given entity.
 *
 * @param {Record<string, any> | null | undefined} entity
 * @param {Object} [options={}]
 * @param {boolean} [options.include_defaults=false]
 * @returns {{ narrative: StyleTileDescriptor | null, visual: StyleTileDescriptor | null }}
 */
export function resolve_entity_style_tiles(entity, options = {}) {
  const { include_defaults = false } = options;
  if (!entity || typeof entity !== "object") {
    return { narrative: null, visual: null };
  }

  let narrative_tile = null;
  const narrative_id = entity.narrative_style;
  if (narrative_id && (include_defaults || narrative_id !== "default")) {
    const style = get_narrative_style(narrative_id);
    if (style && (include_defaults || style.id !== "default")) {
      narrative_tile = {
        name: style.name || narrative_id,
        portrait: style.portrait || "",
        fallback: (style.name || narrative_id).slice(0, 2).toUpperCase(),
        tooltip: style.description || `Narrative style: ${style.name || narrative_id}`,
        size_tier: "sm",
      };
    }
  }

  let visual_tile = null;
  const visual_id = entity.visual_style;
  if (visual_id && (include_defaults || (visual_id !== "default" && visual_id !== "none"))) {
    const style = get_visual_style(visual_id);
    if (style && (include_defaults || (style.id !== "default" && style.id !== "none"))) {
      visual_tile = {
        name: style.name || visual_id,
        portrait: style.portrait || "",
        fallback: (style.name || visual_id).slice(0, 2).toUpperCase(),
        tooltip: style.description || `Visual style: ${style.name || visual_id}`,
        size_tier: "sm",
      };
    }
  }

  return { narrative: narrative_tile, visual: visual_tile };
}
