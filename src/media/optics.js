/**
 * src/media/optics.js
 * 👁️ OPTICS LAYER
 * High-fidelity prompt engineering and aesthetic resolution.
 * Focuses on photorealistic camera specs and cinematic grounding.
 */

export const NEGATIVE_PROMPT =
  "cartoon, anime, 3d render, illustration, painting, drawing, sketch, watermark, text, signature, low quality, blurry, deformed, mutated, extra limbs, missing limbs, fused fingers, distorted face, amateur, grainy, pixelated";

/**
 * Resolves camera specs and atmospheric grounding based on character context.
 */
export const AestheticResolver = {
  resolve(characterData = {}) {
    const physical = (characterData.physical || "").toLowerCase();

    // High-end Cinematic/Photographic Primitives
    const optics = {
      portrait:
        "Shot on Hasselblad H6D-100c, 80mm f/1.9 lens, shallow depth of field, sharp focus on eyes, hyper-realistic skin texture, 8k resolution.",
      street:
        "Shot on Leica M11, 35mm Summilux lens, street photography style, high contrast, natural grain, cinematic lighting.",
      cinema:
        "Shot on ARRI Alexa 35, anamorphic lenses, cinematic movie still, masterclass lighting, volumetric atmosphere, teal and orange highlights.",
      macro:
        "Shot on Canon EOS R5, 100mm macro lens, extreme detail, sharp focus, beautiful bokeh, scientific precision.",
    };

    // Simple keyword mapping
    if (physical.includes("landscape") || physical.includes("environment")) return optics.street;
    if (physical.includes("machine") || physical.includes("tech")) return optics.macro;
    if (physical.includes("cinematic") || physical.includes("epic")) return optics.cinema;

    // Default to portrait optics for most entities
    return optics.portrait;
  },
};

/**
 * Authoritative prompt templates optimized for stable diffusion.
 */
export const PromptTemplates = {
  /**
   * Refines raw description into dense visual tokens.
   */
  OPTIMIZE: (text, optics) =>
    `
[SYSTEM: OPTICS_REFINER]
Translate rough descriptions into dense, visual-only tokens for stable diffusion.
<CONSTRAINTS>
- Output ONLY a comma-separated list of visual descriptors.
- NO first-person language.
- NO narrative backstory or names.
- Focus on subject, clothing, physical features, and atmospheric lighting.
</CONSTRAINTS>
<OPTICS_GROUNDING>
${optics}
</OPTICS_GROUNDING>
<DRAFT_DESCRIPTION>
${text}
</DRAFT_DESCRIPTION>`.trim(),

  /**
   * Builds the final system prompt for context-aware generation.
   */
  BUILDER: (targetType, rawIntent, context, optics) => {
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
[OPTICS]
${optics}
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
