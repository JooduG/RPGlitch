/**
 * src/media/optics.js
 * 👁️ OPTICS LAYER — PROMPT ENGINEERING & VISUAL STYLE ENGINE
 * High-fidelity prompt engineering, dynamic style resolution, and diffusion matrix optics.
 */

import { VISUAL_STYLES } from "@data";
import { escapeXml, PROTOCOL_LIBRARY, safeParsePseudoJson } from "@intelligence";
import { app, runtime } from "@state";
import { get_signature_label } from "./tokens.js";

export const NEGATIVE_PROMPT =
  "low quality, blurry, watermark, text, signature, deformed, mutated, extra limbs, missing limbs, bad anatomy, fused fingers, distorted face, amateur, low resolution, compressed artifacts";

/**
 * Resolves the active visual style key for portrait generation.
 * @param {any} [entity]
 * @returns {string}
 */
export function resolve_portrait_visual_style_key(entity = {}) {
  const entityStyle = entity?.visual_style;
  if (entityStyle && entityStyle !== "default" && entityStyle !== "" && VISUAL_STYLES[entityStyle]) {
    return entityStyle;
  }
  const appStyle = typeof app !== "undefined" ? app.settings?.visual_style : null;
  if (appStyle && appStyle !== "default" && VISUAL_STYLES[appStyle]) {
    return appStyle;
  }
  return "none";
}

/**
 * Resolves the active visual style key for story scene generation.
 * @returns {string}
 */
export function resolve_story_visual_style_key() {
  const fractalStyle = runtime?.active_fractal?.visual_style;
  if (fractalStyle && fractalStyle !== "default" && fractalStyle !== "" && VISUAL_STYLES[fractalStyle]) {
    return fractalStyle;
  }
  const appStyle = typeof app !== "undefined" ? app.settings?.visual_style : null;
  if (appStyle && appStyle !== "default" && VISUAL_STYLES[appStyle]) {
    return appStyle;
  }
  return "none";
}

/**
 * Parses a VISUAL_ENGINE XML block into structured token categories.
 * @param {string} [engineXml]
 * @returns {{ medium: string, palette: string, camera: string, composition: string, texture: string, negative_prompt: string }}
 */
export function parse_visual_engine(engineXml = "") {
  const result = { medium: "", palette: "", camera: "", composition: "", texture: "", negative_prompt: "" };
  if (!engineXml) return result;

  const extractTag = (tag) => {
    const match = engineXml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
    return match ? match[1].trim() : "";
  };

  result.medium = extractTag("medium");
  result.palette = extractTag("palette");
  result.camera = extractTag("camera");
  result.composition = extractTag("composition");
  result.texture = extractTag("texture");
  result.negative_prompt = extractTag("negative_prompt");
  return result;
}

/**
 * Resolves the VISUAL_ENGINE tokens for a given visual style key.
 * @param {string} styleKey
 * @returns {{ medium: string, palette: string, camera: string, composition: string, texture: string, negative_prompt: string }}
 */
export function resolve_visual_engine_tokens(styleKey) {
  const style = VISUAL_STYLES[styleKey] || VISUAL_STYLES.none;
  return parse_visual_engine(style.visual_engine);
}

/**
 * Recursively flattens nested structures into a cohesive text string.
 * @param {any} val
 * @returns {string}
 */
export const flattenToParagraph = (val) => {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    return val
      .map((item) => flattenToParagraph(item))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof val === "object") {
    return Object.entries(val)
      .map(([key, value]) => {
        const flatVal = flattenToParagraph(value);
        if (!flatVal) return "";
        return !isNaN(Number(key)) ? flatVal : `${key}: ${flatVal}`;
      })
      .filter(Boolean)
      .join(" ");
  }
  return String(val);
};

/**
 * Ensures clean spacing after commas in token lists.
 * @param {string} str
 * @returns {string}
 */
const normalize_comma_spacing = (str) => str.replace(/,([^\s])/g, ", $1");

/**
 * Collapses a physical field value into a flat comma-separated token string.
 * @param {string} raw
 * @returns {string}
 */
export const flatten_physical = (raw) => {
  if (!raw) return "";
  const parsed = safeParsePseudoJson(raw);

  if (parsed.__raw_prose__) {
    return normalize_comma_spacing(parsed.__raw_prose__);
  }

  if (Object.keys(parsed).length > 0) {
    return normalize_comma_spacing(
      Object.values(parsed)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .map((v) => String(v).trim())
        .filter(Boolean)
        .join(", "),
    );
  }

  return normalize_comma_spacing(raw.trim());
};

/**
 * Builds the merged aesthetic property map shared by extract() and flatten().
 * @param {any} [entity]
 * @returns {Record<string, any>}
 */
function build_aesthetic_map(entity = {}) {
  const eternalObj = safeParsePseudoJson(entity.eternal?.physical || "");
  const presentObj = safeParsePseudoJson(entity.present?.physical || "");

  const merged = {};

  const mergeInputSource = (sourceObj, fallbackLabel) => {
    if (sourceObj.__raw_prose__) {
      merged[fallbackLabel] = sourceObj.__raw_prose__;
    } else {
      Object.entries(sourceObj).forEach(([k, v]) => {
        merged[k] = v;
      });
    }
  };

  mergeInputSource(eternalObj, "eternal");
  mergeInputSource(presentObj, "present");

  const styleKey = resolve_portrait_visual_style_key(entity);
  const engineTokens = resolve_visual_engine_tokens(styleKey);
  if (engineTokens.medium) merged._vs_medium = engineTokens.medium;
  if (engineTokens.palette) merged._vs_palette = engineTokens.palette;
  if (engineTokens.camera) merged._vs_camera = engineTokens.camera;
  if (engineTokens.composition) merged._vs_composition = engineTokens.composition;
  if (engineTokens.texture) merged._vs_texture = engineTokens.texture;

  const colorName = get_signature_label(entity);
  if (colorName) {
    merged.aesthetic = `${colorName.toLowerCase()} aesthetic`;
  }

  return merged;
}

const VS_ORDERED_KEYS = ["_vs_medium", "_vs_palette", "_vs_camera", "_vs_composition", "_vs_texture"];

export const AestheticResolver = {
  /**
   * Deterministic extraction of traits from entity fields into JSON property lines.
   * @param {any} [entity]
   * @returns {string}
   */
  extract(entity = {}) {
    const merged = build_aesthetic_map(entity);
    const orderedKeys = [...VS_ORDERED_KEYS.filter((k) => merged[k]), ...Object.keys(merged).filter((k) => !VS_ORDERED_KEYS.includes(k))];

    return orderedKeys
      .map((k) => {
        const v = merged[k];
        if (v === undefined || v === null) return "";
        const valStr = Array.isArray(v) ? v.join(", ") : String(v).trim();
        if (!valStr) return "";
        const formattedVal = normalize_comma_spacing(valStr);
        const cleanKey = k.replace(/^_vs_/, "");
        return `  "${cleanKey}": "${formattedVal.replace(/"/g, '\\"')}"`;
      })
      .filter(Boolean)
      .join(",\n");
  },

  /**
   * Deterministic flattening of traits from entity fields into plain comma-separated tags.
   * @param {any} [entity]
   * @returns {string}
   */
  flatten(entity = {}) {
    const merged = build_aesthetic_map(entity);
    const vsValues = VS_ORDERED_KEYS.map((k) => merged[k]).filter(Boolean);
    const otherValues = Object.entries(merged)
      .filter(([k]) => !VS_ORDERED_KEYS.includes(k))
      .map(([, v]) => v);

    return normalize_comma_spacing(
      [...vsValues, ...otherValues]
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .map((v) => String(v).trim())
        .filter(Boolean)
        .join(", "),
    );
  },
};

/**
 * Authoritative prompt templates optimized for generative diffusion pipelines.
 */
export const PromptTemplates = {
  /**
   * Refines raw concept data into balanced sentences containing target vocabulary.
   * @param {string} text
   * @param {string} [_type]
   * @param {any} [entity]
   * @returns {string}
   */
  ENHANCE: (text, _type = "character", entity = null) => {
    const isPortraitMode = ["character", "ai", "user", "selfie", "portrait"].includes(_type || "");
    const styleKey = isPortraitMode ? resolve_portrait_visual_style_key(entity || {}) : resolve_story_visual_style_key();
    const styleObj = VISUAL_STYLES[styleKey] || VISUAL_STYLES.none;
    const activeStyleBlock = `<ACTIVE_VISUAL_STYLE key="${styleKey}" name="${escapeXml(styleObj.name || styleKey)}">
${styleObj.visual_engine || "<VISUAL_ENGINE>No automatic visual style tokens forced.</VISUAL_ENGINE>"}
</ACTIVE_VISUAL_STYLE>`;

    return `<OPTICS_REFINE role="SENSORY_CORTEX_SCRIBE">
You are the "Optics Scribe" — a master prompt engineer tasked with establishing structural harmony, stylistic balance, and pristine rendering clarity for the generation matrix.

Your goal is to evaluate the user's initial core concept in <INPUT_DESCRIPTION>, enrich it with vivid sensory, physical, and atmospheric details, integrate the visual properties from <ACTIVE_VISUAL_STYLE>, and return an optimized JSON data block.

${activeStyleBlock}

<REFINE_PROTOCOL>
1. **Concept Enrichment:** Analyze the core subjects, features, clothing, expressions, and environmental setting described in INPUT_DESCRIPTION. Enrich them with vivid, tangible physical details.
2. **Visual Style Integration & Sovereignty:** You MUST strictly incorporate and honor the provided <ACTIVE_VISUAL_STYLE>.
   - Seamlessly blend the medium, palette, camera/composition, and texture from <ACTIVE_VISUAL_STYLE> directly into your synthesized descriptive sentences.
   - Output any negative_prompt tokens defined in <ACTIVE_VISUAL_STYLE> inside your JSON 'negativePrompt' output field.
   - If <ACTIVE_VISUAL_STYLE> is 'none' (No Visual Style), do NOT force any camera or artistic medium tags onto the prompt. Enrich the prompt using neutral and flexible descriptive language.
3. **Synthesized Descriptive Sentences:** Synthesize your enriched concepts and active style into natural, continuous descriptive sentences. Avoid compiling fragmented keyword strings or unorganized keyword soup.
4. **Keyword Integrity Constraints:** NEVER output abstract quality buzzwords like "masterpiece", "ultra HD", "8K resolution", or "best quality". Ground your descriptions using concrete, physical details, textures, or stylistic equivalents instead.
5. **Perchance Syntax:** ${PROTOCOL_LIBRARY.PERCHANCE_SYNTAX}
6. **Structured Thought Process:** In the "_thought_process" field, record your internal breakdown planning how the subject details, active style, lighting, colors, and composition marry together.
</REFINE_PROTOCOL>

<INPUT_DESCRIPTION>
${escapeXml(text)}
</INPUT_DESCRIPTION>

JSON STRUCTURE:
{
  "_thought_process": "<your breakdown planning: Subject features, Active Style integration, Lighting, Colors, Composition, and Textures>",
  "prompt": "<synthesized descriptive sentences merging the enriched subject details with active style parameters and optional runtime dynamic blocks>",
  "negativePrompt": "<cohesive comma-separated flat tokens to repel, preventing style dilution or contradictions. Use direct visual features only (e.g., 'bright daylight', 'blurry text'). STRICT MANDATE: Never use conversational verbs, instructions, or phrases like 'avoid', 'don't', 'free of', or 'no characters'>"
}

${PROTOCOL_LIBRARY.JSON_OUTPUT}
</OPTICS_REFINE>`.trim();
  },

  /**
   * Constructs system prompts for image generation tasks.
   * @param {string} targetType
   * @param {string} rawIntent
   * @param {any} [context]
   * @returns {string}
   */
  BUILDER: (targetType, rawIntent, context) => {
    const { ai, user, fractal, history, mode = "visualize" } = context || {};

    let ctxBlock;
    let anchor = "RAW photograph or structured visual rendering of a character";
    let realism = "clear focus, defined textures, professional aesthetic layout";

    const physical_to_xml = (raw, tagName) => {
      if (!raw) return "";
      const parsed = safeParsePseudoJson(raw);
      if (parsed.__raw_prose__) {
        return `  <${tagName}>${escapeXml(parsed.__raw_prose__)}</${tagName}>`;
      }
      const children = Object.entries(parsed)
        .map(([k, v]) => `    <${k}>${escapeXml(String(v))}</${k}>`)
        .join("\n");
      return `  <${tagName}>\n${children}\n  </${tagName}>`;
    };

    const renderEntity = (tagStr, entity) => {
      if (!entity) return "";
      const blocks = [];
      if (entity.eternal?.physical) {
        blocks.push(physical_to_xml(entity.eternal.physical, "ETERNAL"));
      }
      if (entity.present?.physical) {
        blocks.push(physical_to_xml(entity.present.physical, "PRESENT"));
      }
      if (!blocks.length) return `<${tagStr} name="${escapeXml(entity.name || "Unknown")}" />`;
      return `<${tagStr} name="${escapeXml(entity.name || "Unknown")}">\n${blocks.join("\n")}\n</${tagStr}>`;
    };

    const aiBlock = renderEntity("AI_CHARACTER", ai);
    const userBlock = renderEntity("USER_PERSONA", user);
    const fractalBlock = renderEntity("FRACTAL", fractal);

    const storyStyleKey = resolve_story_visual_style_key();
    const storyStyle = VISUAL_STYLES[storyStyleKey] || VISUAL_STYLES.none;
    const storyEngineTokens = resolve_visual_engine_tokens(storyStyleKey);
    const visualEngineBlock = storyStyle.visual_engine
      ? `\n<VISUAL_ENGINE style="${escapeXml(storyStyle.name || storyStyleKey)}">${storyStyle.visual_engine}</VISUAL_ENGINE>`
      : "";

    const vsNegPrompt = storyEngineTokens.negative_prompt;

    switch (targetType) {
      case "fractal":
        ctxBlock = `${fractalBlock}\n<RESTRICTION>**STRICTLY NO CHARACTERS.** Focus entirely on environmental layout, medium context, and background lighting structures.</RESTRICTION>`;
        anchor = "RAW photograph or structured artistic rendering of an landscape environment or interior layout space";
        realism = "high architectural definition, crisp spatial depth details, professional landscape layout alignment";
        break;
      case "characters":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n${userBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}\n<NARRATIVE_CONTEXT>The image must depict the specific scene, action, or moment described in the INSTRUCTIONS. The characters should be engaged in the narrative situation — not simply standing or posing. Use their physical descriptions to render their appearance, but compose them into the dramatic or emotional beat of the scene.</NARRATIVE_CONTEXT>`;
        anchor =
          "RAW photograph or structured artistic rendering of a scene featuring the AI character and the user persona together within the fractal environment, depicted in the specific moment and action described by the narrative intent";
        realism =
          "balanced composition with clear character placement, environmental depth, professional cinematic staging, dramatic lighting matching the scene's mood, natural interaction between characters";
        break;
      case "character":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}`;
        anchor =
          "RAW photograph or structured visual rendering of a character within their environment, framed to emphasize the character with the fractal setting visible in the background";
        realism = "cinematic framing, clear focus distribution, naturalistic lighting features, professional portrait composition";
        break;
      case "selfie":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}`;
        anchor =
          "RAW photograph, a modern front-facing wide-angle camera selfie shot layout, capturing the primary character from the chest up with one arm stretched out forward toward the lower frame edge, while the environment is fully mapped in the background space";
        realism = "cinematic framing, clear focus distribution, naturalistic lightning features, smartphone camera simulation layer";
        break;
      case "user":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${userBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Focus solely on this persona profile context.</RESTRICTION>`;
        break;
      case "ai":
      default:
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Focus solely on this character profile context.</RESTRICTION>`;
        break;
    }

    return `
<SYSTEM role="SENSORY_CORTEX_V5">
${ctxBlock}
${visualEngineBlock}
<PROTOCOL>
1. Use a <think> block first to systematically analyze the composition, lighting, and textures.
2. Output exactly one <image_prompt> tag containing the final token string.
3. The image_prompt MUST start with "${anchor}" and use continuous, descriptive details or tokens.
4. Allow alternative artistic formats (like anime or illustrations) to map cleanly if requested by the input intent context.
5. End every prompt with: "${realism}"
6. The <VISUAL_ENGINE> block defines the exclusive aesthetic style for this image. You MUST incorporate its medium, palette, camera, and texture directives into the image prompt to ensure stylistic cohesion.${vsNegPrompt ? `\n7. You MUST include the visual engine's negative prompt tokens ("${escapeXml(vsNegPrompt)}") in your negativePrompt output.` : ""}
${targetType === "selfie" ? `${vsNegPrompt ? "8" : "6"}. Finally, output a short, in-character <caption>...</caption> tag to accompany the selfie.` : ""}
</PROTOCOL>
<TARGET>${targetType}</TARGET>
<MODE>${mode.toUpperCase()}</MODE>
${history ? `<HISTORY>\n${escapeXml(history)}\n</HISTORY>\n` : ""}<INSTRUCTIONS>
Convert intent into a single impactful image prompt.
Input Intent: "${escapeXml(rawIntent)}"
</INSTRUCTIONS>
</SYSTEM>
`.trim();
  },
};

/**
 * Standard resolution mapping for different modes.
 * @param {"landscape" | "fractal" | "portrait" | "character" | "selfie" | "user" | "ai" | "characters" | string} mode
 * @returns {{ width: number, height: number }}
 */
export const getResolution = (mode) => {
  switch (mode) {
    case "landscape":
    case "fractal":
      return { width: 768, height: 512 };
    case "portrait":
    case "character":
    case "selfie":
    case "user":
    case "ai":
      return { width: 512, height: 768 };
    case "characters":
      return { width: 768, height: 768 };
    default:
      return { width: 768, height: 768 };
  }
};
