/**
 * src/media/optics.js
 * 👁️ OPTICS LAYER
 * High-fidelity prompt engineering and aesthetic resolution.
 * Focuses on photorealistic camera specs and cinematic grounding.
 */

export const NEGATIVE_PROMPT =
  "cartoon, anime, 3d render, illustration, painting, drawing, sketch, watermark, text, signature, low quality, blurry, deformed, mutated, extra limbs, missing limbs, fused fingers, distorted face, amateur, grainy, pixelated";

import { themeStore } from "../theme/palette.svelte.js";

/**
 * Resolves camera specs based on character context.
 */
export const AestheticResolver = {
  /**
   * Deterministic extraction of traits from entity fields.
   * EXCLUDES name and description for privacy and precision.
   */
  extract(entity = {}) {
    const present = entity.present?.physical || "";
    const eternal = entity.eternal?.physical || "";
    const colorName = themeStore.get_signature_label(entity);

    /**
     * High-end hardware presets.
     * We keep cinema and macro here for future wiring.
     */
    const presets = {
      portrait:
        "Photorealistic portrait shot on Hasselblad H6D-100c, 80mm f/1.9 lens, vogue magazine cover, shallow depth of field, sharp focus on detailed eyes, hyper-realistic textures, natural skin blemishes, golden ratio composition, cinematic volumetric lighting, 8k resolution.",
      landscape:
        "Photorealistic cinematic landscape shot on Leica M11, 35mm Summilux lens, wide angle, volumetric natural lighting, golden ratio composition, cinematic scope, movie still, 8k resolution.",
      macro:
        "Photorealistic macro shot on Canon EOS R5, 100mm macro lens, extreme detail, sharp focus, beautiful bokeh, scientific precision, 8k resolution.",
    };

    const fragments = [];
    if (present) fragments.push(present);
    if (eternal) fragments.push(eternal);

    if (colorName) {
      fragments.push(`${colorName.toLowerCase()} aesthetic`);
    }

    // Context-Aware Hardware Presets
    if (entity.type === "fractal" || entity.type === "scene") {
      fragments.push(presets.landscape);
    } else {
      fragments.push(presets.portrait);
    }

    return fragments.join(", ");
  },
};

/**
 * Authoritative prompt templates optimized for stable diffusion.
 */
export const PromptTemplates = {
  /**
   * Refines raw description into dense visual tokens.
   */
  ENHANCE: (text) =>
    `
[SYSTEM: CINEMATOGRAPHY_DIRECTOR]
Translate rough character descriptions into a single, cohesive, highly descriptive paragraph formatted for a natural language diffusion model.
<CONSTRAINTS>
- Output EXACTLY ONE continuous, grammatically correct paragraph.
- Use explicit spatial prepositions to anchor attributes (e.g., "A man wearing a crimson coat," NOT "man, crimson coat").
- Exclude first-person language, names, invisible psychological traits, and narrative backstory.
- Group adjectives immediately adjacent to their specific nouns to prevent visual bleeding.
- Sequence the description rigidly: primary subject, physical features, worn garments, environmental setting, and atmospheric lighting.
</CONSTRAINTS>
<DRAFT_DESCRIPTION>
${text}
</DRAFT_DESCRIPTION>
`.trim(),

  /**
   * Builds the final system prompt for context-aware generation.
   */
  BUILDER: (targetType, rawIntent, context) => {
    const { ai, user, fractal, history, mode = "visualize" } = context || {};

    let ctxBlock;
    switch (targetType) {
      case "scene":
        ctxBlock = `[CONTEXT: ENVIRONMENT]\nSetting: ${fractal?.present?.physical || "Unknown"}\n**STRICTLY NO CHARACTERS.** Focus on composition and lighting.`;
        break;
      case "user":
        ctxBlock = `[CONTEXT: USER_PORTRAIT]\nIdentity: ${user?.name || "User"}\nPhysical: ${user?.present?.physical || "Standard"}\n**SOLO PROTOCOL.**`;
        break;
      case "ai":
      default:
        ctxBlock = `[CONTEXT: ENTITY_PORTRAIT]\nIdentity: ${ai?.name || "AI"}\nPhysical: ${ai?.present?.physical || "Standard"}\n**SOLO PROTOCOL.**`;
        break;
    }

    return `
[SYSTEM: SENSORY_CORTEX_V5]
Target: ${targetType}
Mode: ${mode.toUpperCase()}
${history ? `[HISTORY]\n${history}` : ""}
${ctxBlock}
[INSTRUCTIONS]
Convert intent into a single impactful image prompt.
Input Intent: "${rawIntent}"
[PROTOCOL]
1. Start with <think> for composition planning.
2. Output exactly one <image_prompt> tag.
`.trim();
  },
};

/**
 * Standard resolution mapping for different modes.
 */
export const getResolution = (mode) => {
  switch (mode) {
    case "landscape":
    case "scene":
    case "fractal":
      return { width: 768, height: 512 };
    case "portrait":
    case "character":
    case "user":
    case "ai":
      return { width: 512, height: 768 };
    default:
      return { width: 768, height: 768 };
  }
};
