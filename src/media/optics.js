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
 * Aesthetic token registry — curated dimensions injected into the Refine
 * prompt for contextual grounding. Ported and adapted from ImageGlitch,
 * tuned for RPGlitch's photorealistic Nordic Collection aesthetic.
 * Each dimension provides a pool of specific tokens the AI selects from.
 */
export const AESTHETICS_REGISTRY = {
  // The fundamental art format — photorealistic always anchored first
  mediums: [
    "RAW photograph",
    "ARRI Alexa 35 cinema camera capture",
    "Hasselblad medium format digital",
    "Leica M11 documentary shot",
    "Fujifilm GFX 100S editorial photograph",
    "vintage 35mm analog film scan",
  ],
  // Physical lens and camera hardware
  camera_and_optics: [
    "85mm Prime f/1.2 lens, creamy bokeh",
    "35mm Summilux wide-angle lens",
    "Hasselblad HC 100mm f/2.2 macro lens",
    "anamorphic lens distortion, cinematic oval bokeh",
    "shallow depth-of-field, sharp focus on subject",
    "long exposure motion blur, environmental movement",
    "wide-angle environmental capture",
    "extreme close-up macro detail shot",
  ],
  // Environmental and artificial light sources
  lighting: [
    "dramatic cinematic chiaroscuro, deep shadow contrast",
    "cold Nordic overcast diffused light",
    "volumetric god rays through mist",
    "backlit silhouette with ice-blue rim lighting",
    "harsh clinical fluorescent studio lighting",
    "subterranean abyssal ambient glow",
    "golden hour warm sidelighting",
    "night photography, practical light sources only",
    "neon sign glow, urban night reflections",
  ],
  // Color science, grading, and film stocks
  colors: [
    "Kodak Vision3 500T desaturated film grain",
    "high-contrast monochrome black and white",
    "cold teal and deep navy cinematic grade",
    "muted desaturated Scandinavian palette",
    "frozen gunmetal and chalk white tones",
    "abyssal deep blue and silver metallic",
    "deep shadow, minimal highlight roll-off",
    "split-toned cyan shadows, warm highlight bleed",
  ],
  // Framing and compositional geometry
  composition: [
    "rule of thirds, intentional negative space",
    "golden ratio spiral composition",
    "symmetrical environmental framing",
    "extreme close-up detail shot",
    "medium portrait 3/4 framing, slight angle",
    "full body environmental context shot",
    "bird's eye overhead perspective",
    "worm's eye dramatic low angle",
    "dutch tilt, tension framing",
  ],
  // Micro-detail, texture fidelity, rendering quality
  fidelity: [
    "8K hyper-realistic micro-detail",
    "subsurface scattering, natural skin translucency",
    "micro-detailed visible skin pores, natural texture",
    "realistic fabric weave and material texture",
    "heavy analog film grain texture overlay",
    "chromatic aberration edge bleed, subtle lens defect",
    "ambient occlusion depth shading",
    "ray-traced surface reflections",
  ],
  // Emotional and atmospheric tone
  moods: [
    "intense and dramatic, high psychological tension",
    "cold and clinical, detached observation",
    "dark and gothic, subterranean atmosphere",
    "melancholic Nordic isolation, quiet desolation",
    "predatory stillness, controlled power",
    "ethereal dreamlike suspension",
    "chaotic and rebellious, unstable energy",
    "serene and contemplative, subdued presence",
  ],
};

/**
 * Shared prompt protocol fragments to ensure standardization.
 */
const PROTOCOL_NO_WEIGHTS =
  'Remove or avoid numerical weighting syntax (e.g. "(masterpiece:1.2)" or "(bokeh:1.3)"). Control emphasis through descriptive adjectives, positioning, and absolute quantities only.';

const PROTOCOL_JSON_OUTPUT = "Return a single JSON object. No conversational preamble, no markdown backticks, no XML tags outside of the JSON block.";

const SHARED_CONSTRAINTS = `<CONSTRAINTS>
- Output MUST be valid JSON starting with '{' and ending with '}'.
- Do not wrap the JSON in markdown code blocks like \`\`\`json.
- No XML tags outside the JSON.
</CONSTRAINTS>`;

/**
 * Formats a dimension category for injection into the AI prompt context.
 * @param {string} label
 * @param {string[]} items
 * @returns {string}
 */
const formatDimension = (label, items) => (items.length > 0 ? `[DIMENSION: ${label}]\n${items.join(", ")}\n` : "");

/**
 * Renders all AESTHETICS_REGISTRY dimensions into a structured context block.
 * @returns {string}
 */
const buildDimensionsContext = () =>
  Object.entries(AESTHETICS_REGISTRY)
    .map(([key, items]) => {
      const labels = {
        mediums: "Mediums",
        camera_and_optics: "Camera & Optics",
        lighting: "Lighting",
        colors: "Colors & Film Stock",
        composition: "Composition",
        fidelity: "Fidelity & Texture",
        moods: "Mood & Atmosphere",
      };
      return formatDimension(labels[key] || key, items);
    })
    .filter(Boolean)
    .join("\n");

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
   * Refines raw description into structured JSON with positive + negative prompt tokens.
   * Scribe pattern: Lawful Good prompter that enriches intent using the AESTHETICS_REGISTRY
   * dimension matrix and returns { _thought_process, prompt, negativePrompt }.
   *
   * @param {string} text - Raw character or scene description to refine
   * @param {string} [type] - Entity type: "character" | "fractal" | "scene"
   * @returns {string} The complete system prompt string
   */
  ENHANCE: (text, type = "character") => {
    const dimensionsContext = buildDimensionsContext();
    const isScene = type === "fractal" || type === "scene";

    const mediumAnchor = isScene
      ? `begin with "RAW photograph of a landscape," or "photorealistic wide shot of an interior,"`
      : `begin with "RAW photograph of a character," or "photorealistic portrait,"`;

    const tokenSequence = isScene
      ? `1. Planning: Use a <think> block to analyze the environment's mood, lighting, architecture, and atmospheric details.
2. Medium anchor: ${mediumAnchor}
3. Core Subject: the primary environment, architecture, or natural feature
4. Lighting & Atmosphere: weather, time of day, fog, atmospheric perspective
5. Key Details: specific materials, architectural elements, or flora
6. Camera: lens type, focal length, color grade from the DIMENSIONS matrix
7. Realism anchors: end with "photorealistic, 8k resolution, professional architectural photography"`
      : `1. Planning: Use a <think> block to systematically analyze the entity's physiological traits, material textures, geometric composition, and lighting requirements.
2. Medium anchor: ${mediumAnchor}
3. Demographics: age, gender, race/ethnicity
4. Physical build: body type, musculature, height impression
5. Face: jaw, brow, eyes (color + shape), nose, lips, stubble/beard if applicable
6. Hair: color, length, cut style
7. Skin: tone, texture (e.g. "olive skin, visible pores, natural sheen")
8. Clothing: each item by name, material, color, fit
9. Setting: minimal background context
10. Camera + lighting: select from the DIMENSIONS matrix below
11. Realism anchors: end with "photorealistic, natural skin texture, professional photography"`;

    const strictRules = isScene
      ? `- NEVER use: anime, illustrated, digital art, painterly, stylized
- NEVER use abstract quality tags: ultra HD, hyperrealistic, masterpiece
- Use only physically grounded, photographable descriptors
- NO characters or people in the scene focus
- ${PROTOCOL_NO_WEIGHTS}`
      : `- NEVER use: anime, illustrated, digital art, painterly, stylized, ethereal, otherworldly, radiant, glowing
- NEVER use abstract quality tags: ultra HD, hyperrealistic, masterpiece, best quality
- Use only physically grounded, photographable descriptors
- If input contains non-photographic language, translate it to its photographic equivalent
- ${PROTOCOL_NO_WEIGHTS}`;

    return `<OPTICS_REFINE role="SENSORY_CORTEX_SCRIBE">
You are the "Optics Scribe" — a Lawful Good photorealistic prompt engineer for the RPGlitch Nordic Collection.
Your goal is to enrich the input description by selecting and integrating specific aesthetic tokens from the provided <DIMENSIONS> matrix, returning a structured JSON response that is visually precise, photorealistic, and cinematically grounded.

<INPUT_DESCRIPTION>
${escapeXml(text)}
</INPUT_DESCRIPTION>

<DIMENSIONS>
${dimensionsContext}
</DIMENSIONS>

<REFINE_PROTOCOL>
${tokenSequence}

STRICT RULES:
${strictRules}

STRUCTURED THOUGHT PROCESS: In the "_thought_process" field, break down your decisions across: Medium, Camera & Optics, Lighting, Colors & Film Stock, Composition, Fidelity, and Mood. Explain which tokens you selected from the DIMENSIONS and why.

JSON OUTPUT FORMULATION: ${PROTOCOL_JSON_OUTPUT}

JSON STRUCTURE:
{
  "_thought_process": "<your dimensional breakdown: Medium, Camera, Lighting, Colors, Composition, Fidelity, Mood — cite specific tokens selected from DIMENSIONS>",
  "prompt": "<synthesized comma-separated visual tokens integrating input description with selected DIMENSION tokens>",
  "negativePrompt": "<cohesive negative elements preventing style dilution, unrealistic rendering, or Nordic Collection violations>"
}
</REFINE_PROTOCOL>

${SHARED_CONSTRAINTS}
</OPTICS_REFINE>`.trim();
  },

  BUILDER: (targetType, rawIntent, context) => {
    const { ai, user, fractal, history, mode = "visualize" } = context || {};

    // eslint-disable-next-line no-useless-assignment
    let ctxBlock = "";
    let anchor = "RAW photograph of a character";
    let realism = "photorealistic, natural skin texture, professional photography";

    const renderEntity = (tagStr, entity) => {
      if (!entity) return "";
      const p = [entity.eternal?.physical, entity.present?.physical].filter(Boolean);
      if (!p.length) return `<${tagStr} name="${escapeXml(entity.name || "Unknown")}" />`;
      return `<${tagStr} name="${escapeXml(entity.name || "Unknown")}">\n${p.map((txt) => `  <PHYSICAL>${escapeXml(txt)}</PHYSICAL>`).join("\n")}\n</${tagStr}>`;
    };

    const aiBlock = renderEntity("AI_CHARACTER", ai);
    const userBlock = renderEntity("USER_PERSONA", user);
    const fractalBlock = renderEntity("FRACTAL", fractal);

    switch (targetType) {
      case "scene":
        ctxBlock = `${fractalBlock}\n<RESTRICTION>**STRICTLY NO CHARACTERS.** Focus on composition and lighting.</RESTRICTION>`;
        anchor = "RAW photograph of a landscape or photorealistic wide shot of an interior";
        realism = "photorealistic, 8k resolution, professional architectural photography";
        break;
      case "user":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${userBlock}\n</ACTIVE_CHARACTERS>\n<RESTRICTION>**SOLO PROTOCOL.**</RESTRICTION>`;
        break;
      case "selfie":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}`;
        anchor =
          "RAW photograph, a modern smartphone selfie shot, front-facing wide-angle camera lens distortion, one arm stretched out forward holding the phone into the lower edge of the frame, capturing the character from the chest up while the active environment is fully visible behind them";
        realism = "photorealistic, cinematic selfie framing, lens flare, smartphone camera aesthetic, natural lighting, professional photography";
        break;
      case "ai":
      default:
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n</ACTIVE_CHARACTERS>\n<RESTRICTION>**SOLO PROTOCOL.**</RESTRICTION>`;
        break;
    }

    return `
<SYSTEM role="SENSORY_CORTEX_V5">
<TARGET>${targetType}</TARGET>
<MODE>${mode.toUpperCase()}</MODE>
${history ? `<HISTORY>\n${escapeXml(history)}\n</HISTORY>\n` : ""}${ctxBlock}
<INSTRUCTIONS>
Convert intent into a single impactful image prompt.
Input Intent: "${escapeXml(rawIntent)}"
</INSTRUCTIONS>
<PROTOCOL>
1. Use a <think> block first to systematically analyze the composition, lighting, and textures.
2. Output exactly one <image_prompt> tag containing the final token string.
3. The image_prompt MUST start with "${anchor}" and use comma-separated tokens, NOT prose.
4. NEVER use anime, illustrated, digital art, or painterly language.
5. End every prompt with: "${realism}"
${targetType === "selfie" ? "6. Finally, output a short, in-character <caption>...</caption> tag to accompany the selfie." : ""}
</PROTOCOL>
</SYSTEM>
`.trim();
  },
};

/**
 * Parses a structured JSON response from PromptTemplates.ENHANCE.
 * Returns { prompt, negativePrompt } on success, or null on parse failure.
 * @param {string} raw
 * @returns {{ prompt: string, negativePrompt: string } | null}
 */
export const parseRefineResponse = (raw) => {
  if (!raw || typeof raw !== "string") return null;

  let trimmed = raw.trim();

  // Handle Perchance assistant pre-filling: response may start without '{'
  if (!trimmed.startsWith("{") && (trimmed.includes('"prompt"') || trimmed.includes('"_thought_process"'))) {
    trimmed = "{" + trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1));
      if (parsed && typeof parsed.prompt === "string") {
        return {
          prompt: parsed.prompt.trim(),
          negativePrompt: typeof parsed.negativePrompt === "string" ? parsed.negativePrompt.trim() : "",
        };
      }
    } catch {
      // Fall through to null
    }
  }

  return null;
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
