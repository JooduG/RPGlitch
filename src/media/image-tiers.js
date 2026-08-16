/**
 * src/media/image-tiers.js
 * 🖼️ IMAGE TIER TAXONOMY
 * The unified 4-tier image taxonomy every generated image belongs to, plus the
 * resolution mapping and tier normalization. Pure vocabulary shared by the
 * trigger (when), prompts (how), engine (render), and beats (log) layers.
 */

export const IMAGE_TIERS = ["story_entities", "story_character", "solo_entity", "story_scene"];

/** The tier auto-triggered image beats fall back to. */
export const DEFAULT_IMAGE_TIER = "story_scene";

export function normalize_image_tier(targetType) {
  if (!targetType) return "story_character";
  const str = String(targetType).trim().toLowerCase();
  if (str === "characters" || str === "prologue" || str === "group" || str === "story_entities") {
    return "story_entities";
  }
  if (IMAGE_TIERS.includes(str)) return str;
  return "story_character";
}

export const get_resolution = (mode) => {
  switch (normalize_image_tier(mode)) {
    case "story_scene":
      return { width: 768, height: 512 };
    case "solo_entity":
    case "story_character":
      return { width: 512, height: 768 };
    case "story_entities":
      return { width: 768, height: 768 };
    default:
      return { width: 768, height: 768 };
  }
};
