/**
 * src/media/optics.js
 * 👁️ OPTICS LAYER
 * High-fidelity prompt engineering and aesthetic resolution.
 * Focuses on photorealistic camera specs and cinematic grounding.
 */

export const NEGATIVE_PROMPT =
  "anime, manga, cartoon, illustrated, digital painting, concept art, cgi, 3d render, 3d model, stylized, fantasy art, comic book, animated, toon shading, cel shading, furry, anthro, anthropomorphic, unrealistic proportions, doll, figure, toy, drawing, sketch, watercolor, oil painting, low quality, blurry, watermark, text, signature, deformed, mutated, extra limbs, missing limbs, bad anatomy, fused fingers, distorted face, amateur";

import { escapeXml } from "@intelligence/parser.js";
import { get_signature_label } from "@media";

/**
 * Resolves camera specs based on character context.
 */
export const AestheticResolver = {
  /**
   * Deterministic extraction of traits from entity fields.
   * EXCLUDES name and description for privacy and precision.
   * @param {any} entity
   */
  extract(entity = {}) {
    const present = entity.present?.physical || "";
    const eternal = entity.eternal?.physical || "";
    const colorName = get_signature_label(entity);

    /**
     * High-end hardware presets.
     * We keep cinema and macro here for future wiring.
     */
    const presets = {
      portrait:
        "RAW photograph, photorealistic, real person, professional portrait photography, Hasselblad H6D-100c, 85mm f/1.8 lens, natural skin texture, visible skin pores, film grain, shallow depth of field, sharp focus on eyes, dramatic studio lighting, volumetric light, natural color grading, high-end editorial photography",
      landscape:
        "Photorealistic cinematic landscape shot on Leica M11, 35mm Summilux lens, volumetric natural lighting, golden ratio composition, cinematic scope, movie still, 8k resolution, wide angle view, dramatic scope, cinematic atmosphere, high-fidelity textures.",
      macro:
        "Photorealistic macro shot on Canon EOS R5, 100mm macro lens, sharp focus, scientific precision, 8k resolution, extreme detail, beautiful soft bokeh, high-fidelity textures, dramatic lighting, volumetric shadows.",
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
  ENHANCE: (text, type = "character") => {
    if (type === "fractal" || type === "scene") {
      return `You are a professional image prompt engineer. Your task is to convert a visual environment description into an optimized prompt for the FLUX diffusion model.

OUTPUT FORMAT: A single line of comma-separated visual tokens. NOT prose. NOT sentences.

MANDATORY TOKEN SEQUENCE:
1. Planning: Use a <think> block first to analyze the environment's mood, lighting setup, and architectural/natural details.
2. Medium anchor: begin with "RAW photograph of a landscape," or "photorealistic wide shot of an interior,"
3. Core Subject: the primary environment, architecture, or natural feature
3. Lighting & Atmosphere: weather, time of day, fog, atmospheric perspective
4. Key Details: specific materials, architectural elements, or flora
5. Camera: lens type, focal length, color grade
6. Realism anchors: end with "photorealistic, 8k resolution, professional architectural photography"

STRICT RULES:
- NEVER use: anime, illustrated, digital art, painterly, stylized
- NEVER use abstract quality tags: ultra HD, hyperrealistic, masterpiece
- Use only physically grounded, photographable descriptors
- NO characters or people in the focus

Input description:
${escapeXml(text)}

Output only the token string. No preamble, no explanation.`.trim();
    }

    return `You are a professional image prompt engineer. Your task is to convert a visual character description into an optimized prompt for the FLUX diffusion model.

OUTPUT FORMAT: A single line of comma-separated visual tokens. NOT prose. NOT sentences.

MANDATORY TOKEN SEQUENCE:
1. Planning: Use a <think> block first to systematically analyze the entity's physiological traits, material textures, geometric composition, and lighting requirements.
2. Medium anchor: begin with "RAW photograph of a character," or "photorealistic portrait,"
3. Demographics: age, gender, race/ethnicity
4. Physical build: body type, musculature, height impression
5. Face: jaw, brow, eyes (color + shape), nose, lips, stubble/beard if applicable
6. Hair: color, length, cut style
7. Skin: tone, texture (e.g. "olive skin, visible pores, natural sheen")
8. Clothing: each item by name, material, color, fit
9. Setting: minimal background context
10. Camera + lighting: lens type, focal length, lighting setup, color grade
11. Realism anchors: end with "photorealistic, natural skin texture, professional photography"

STRICT RULES:
- NEVER use: anime, illustrated, digital art, painterly, stylized, ethereal, otherworldly, radiant, glowing
- NEVER use abstract quality tags: ultra HD, hyperrealistic, masterpiece, best quality
- Use only physically grounded, photographable descriptors
- If input contains non-photographic language, translate it to its photographic equivalent

Input description:
${escapeXml(text)}

Output only the token string. No preamble, no explanation.`.trim();
  },

  BUILDER: (targetType, rawIntent, context) => {
    const { ai, user, fractal, history, mode = "visualize" } = context || {};

    let ctxBlock;
    let anchor = "RAW photograph of a character";
    let realism = "photorealistic, natural skin texture, professional photography";

    switch (targetType) {
      case "scene":
        ctxBlock = `[CONTEXT: ENVIRONMENT]\nSetting: ${escapeXml(fractal?.present?.physical || "Unknown")}\n**STRICTLY NO CHARACTERS.** Focus on composition and lighting.`;
        anchor = "RAW photograph of a landscape or photorealistic wide shot of an interior";
        realism = "photorealistic, 8k resolution, professional architectural photography";
        break;
      case "user":
        ctxBlock = `[CONTEXT: USER_PORTRAIT]\nIdentity: ${escapeXml(user?.name || "User")}\nPhysical: ${escapeXml(user?.present?.physical || "Standard")}\n**SOLO PROTOCOL.**`;
        break;
      case "selfie":
        ctxBlock = `[CONTEXT: SMARTPHONE_SELFIE]\nSubject Identity: ${escapeXml(ai?.name || "AI")}\nSubject Physical Features: ${escapeXml(ai?.present?.physical || "Standard")}\nBackground Environment Details: ${escapeXml(fractal?.present?.physical || "Standard")}`;
        anchor =
          "RAW photograph, a modern smartphone selfie shot, front-facing wide-angle camera lens distortion, one arm stretched out forward holding the phone into the lower edge of the frame, capturing the character from the chest up while the active environment is fully visible behind them";
        realism = "photorealistic, cinematic selfie framing, lens flare, smartphone camera aesthetic, natural lighting, professional photography";
        break;
      case "ai":
      default:
        ctxBlock = `[CONTEXT: ENTITY_PORTRAIT]\nIdentity: ${escapeXml(ai?.name || "AI")}\nPhysical: ${escapeXml(ai?.present?.physical || "Standard")}\n**SOLO PROTOCOL.**`;
        break;
    }

    return `
[SYSTEM: SENSORY_CORTEX_V5]
Target: ${targetType}
Mode: ${mode.toUpperCase()}
${history ? `[HISTORY]\n${escapeXml(history)}` : ""}
${ctxBlock}
[INSTRUCTIONS]
Convert intent into a single impactful image prompt.
Input Intent: "${escapeXml(rawIntent)}"
[PROTOCOL]
1. Use a <think> block first to systematically analyze the composition, lighting, and textures.
2. Output exactly one <image_prompt> tag containing the final token string.
3. The image_prompt MUST start with "${anchor}" and use comma-separated tokens, NOT prose.
4. NEVER use anime, illustrated, digital art, or painterly language.
5. End every prompt with: "${realism}"
${targetType === "selfie" ? "6. Finally, output a short, in-character <caption>...</caption> tag to accompany the selfie." : ""}
`.trim();
  },
};

/**
 * Standard resolution mapping for different modes.
 */
export const getResolution = (/** @type {any} */ mode) => {
  switch (mode) {
    case "landscape":
    case "scene":
    case "fractal":
      return { width: 768, height: 512 };
    case "portrait":
    case "character":
    case "selfie":
    case "user":
    case "ai":
      return { width: 512, height: 768 };
    default:
      return { width: 768, height: 768 };
  }
};
