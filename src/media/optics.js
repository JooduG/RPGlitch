/**
 * src/media/optics.js
 * 👁️ OPTICS LAYER — PROMPT ENGINEERING & VISUAL STYLE ENGINE
 * Optimized for FLUX.1 (Rectified Flow), T5-XXL text encoders, and Perchance parameter injection.
 */

import { VISUAL_STYLES } from "@data";
import { escape_xml as escapeXml, safeParsePseudoJson, state_bridge } from "@utils";
import { PROTOCOL_LIBRARY } from "@intelligence";
import { get_signature_label } from "./tokens.js";

/**
 * Modern concise fallback negative prompt optimized for T5-XXL text streams.
 * Avoids legacy SD 1.5 word-salad tags that cause lexical contamination in FLUX.
 */
export const NEGATIVE_PROMPT = "blurry, low resolution, compressed artifacts, text, watermark, bad anatomy, distorted features";

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
  const appStyle = state_bridge.app ? state_bridge.app.settings?.visual_style : null;
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
  const fractalStyle = state_bridge.runtime?.active_fractal?.visual_style;
  if (fractalStyle && fractalStyle !== "default" && fractalStyle !== "" && VISUAL_STYLES[fractalStyle]) {
    return fractalStyle;
  }
  const appStyle = state_bridge.app?.settings?.visual_style ?? null;
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
    const match = engineXml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
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
 * Resolves the VISUAL_ENGINE tokens for a given visual style key,
 * handling both XML-embedded tags and isolated schema properties.
 * @param {string} styleKey
 * @returns {{ medium: string, palette: string, camera: string, composition: string, texture: string, negative_prompt: string }}
 */
export function resolve_visual_engine_tokens(styleKey) {
  const style = VISUAL_STYLES[styleKey] || VISUAL_STYLES.none;
  const tokens = parse_visual_engine(style.visual_engine);

  if (style.negative_prompt && typeof style.negative_prompt === "string") {
    tokens.negative_prompt = style.negative_prompt.trim();
  }
  return tokens;
}

/**
 * Ensures clean spacing after commas in token lists.
 * @param {string} str
 * @returns {string}
 */
const normalize_comma_spacing = (str) => str.replace(/,([^\s])/g, ", $1");

/**
 * Collapses physical trait objects into clean, natural language descriptive clauses.
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
    const clauses = Object.entries(parsed)
      .map(([k, v]) => {
        const valStr = Array.isArray(v) ? v.join(", ") : String(v).trim();
        if (!valStr) return "";
        return `${k.replace(/_/g, " ")}: ${valStr}`;
      })
      .filter(Boolean);
    return normalize_comma_spacing(clauses.join(". "));
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
   * Deterministic extraction of traits from entity fields into formatted JSON property lines.
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
   * Deterministic flattening of entity physical traits into continuous descriptive sentences.
   * @param {any} [entity]
   * @returns {string}
   */
  flatten(entity = {}) {
    const merged = build_aesthetic_map(entity);
    const vsValues = VS_ORDERED_KEYS.map((k) => merged[k]).filter(Boolean);
    const otherValues = Object.entries(merged)
      .filter(([k]) => !VS_ORDERED_KEYS.includes(k))
      .map(([k, v]) => {
        const valStr = Array.isArray(v) ? v.join(", ") : String(v).trim();
        return k.startsWith("_vs_") || k === "aesthetic" ? valStr : `${k.replace(/_/g, " ")}: ${valStr}`;
      })
      .filter(Boolean);

    return normalize_comma_spacing([...vsValues, ...otherValues].join(". "));
  },
};

/**
 * Authoritative prompt templates optimized for modern generative diffusion pipelines.
 */
export const PromptTemplates = {
  /**
   * Refines raw concept data into structured sentences containing visual targets.
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
${styleObj.tags && styleObj.tags.length ? `<tags>${escapeXml(styleObj.tags.join(", "))}</tags>` : ""}
${styleObj.negative_prompt ? `<negative_prompt>${escapeXml(styleObj.negative_prompt)}</negative_prompt>` : ""}
</ACTIVE_VISUAL_STYLE>`;

    const inputDesc =
      text && text.trim()
        ? text
        : `A detailed ${isPortraitMode ? "character portrait" : "scene"} of ${entity?.name || _type || "a subject"}, ${entity?.description || "with distinctive features and dramatic lighting"}.`;

    return `<OPTICS_REFINE role="SENSORY_CORTEX_SCRIBE">
You are the "Optics Scribe" — a master prompt engineer tasked with establishing structural harmony, stylistic balance, and rendering clarity for modern transformer-based diffusion pipelines (FLUX.1 / T5-XXL).

Your goal is to evaluate the user's initial core concept in <INPUT_DESCRIPTION>, enrich it with vivid physical details, integrate the visual directives from <ACTIVE_VISUAL_STYLE>, and output a validated JSON payload.

${activeStyleBlock}

<REFINE_PROTOCOL>
1. **Concept Enrichment:** Analyze core subjects, clothing, lighting, and environmental setting in INPUT_DESCRIPTION. Enrich them with concrete, tangible physical descriptors.
2. **Visual Style Integration:** Strictly honor <ACTIVE_VISUAL_STYLE>. Seamlessly integrate medium, palette, camera/composition, and texture into natural, cohesive English prose sentences.
3. **Natural Prose Format:** Output continuous descriptive sentences. Avoid compiling comma-separated "booru" keyword tags or fragmented tag soup.
4. **Keyword Integrity Constraints:** NEVER output abstract quality buzzwords like "masterpiece", "ultra HD", "8K resolution", or "best quality". Ground outputs using physical optics and real-world material descriptions.
5. **Perchance Syntax:** ${PROTOCOL_LIBRARY.PERCHANCE_SYNTAX}
6. **Thought of Structure:** Write your internal step-by-step composition reasoning in the "_thought_process" key at the top of the JSON payload before generating final prompt strings.
</REFINE_PROTOCOL>

<INPUT_DESCRIPTION>
${escapeXml(inputDesc)}
</INPUT_DESCRIPTION>

JSON STRUCTURE:
{
  "_thought_process": "<your breakdown planning: Subject features, Active Style integration, Lighting, Colors, Composition, and Textures>",
  "prompt": "<synthesized natural prose sentences merging enriched subject details with active style parameters and optional runtime parameters>",
  "negativePrompt": "<cohesive comma-separated flat tokens to exclude. Use concrete visual attributes only. NEVER use conversational phrases or instructions like 'don't include'>"
}

${PROTOCOL_LIBRARY.JSON_OUTPUT}
</OPTICS_REFINE>`.trim();
  },

  /**
   * Constructs system prompts for narrative image generation tasks using deterministic JSON forcing.
   * @param {string} targetType
   * @param {string} rawIntent
   * @param {any} [context]
   * @returns {string}
   */
  BUILDER: (targetType, rawIntent, context) => {
    const { ai, user, fractal, history, mode = "visualize" } = context || {};

    let ctxBlock;
    let subject;

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
      ? `\n<VISUAL_ENGINE style="${escapeXml(storyStyle.name || storyStyleKey)}">\n${storyStyle.visual_engine}${
          storyStyle.tags && storyStyle.tags.length ? `\n<tags>${escapeXml(storyStyle.tags.join(", "))}</tags>` : ""
        }\n</VISUAL_ENGINE>`
      : "";

    const vsNegPrompt = storyEngineTokens.negative_prompt || NEGATIVE_PROMPT;

    switch (targetType) {
      case "fractal":
        ctxBlock = `${fractalBlock}\n<RESTRICTION>**STRICTLY NO CHARACTERS.** Focus entirely on environmental layout, atmospheric spatial depth, and lighting structures.</RESTRICTION>`;
        subject = "a landscape environment or interior layout space";
        break;
      case "characters":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n${userBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}\n<NARRATIVE_CONTEXT>The image must depict the specific scene or action described in INSTRUCTIONS. Characters must be dynamically engaged in the narrative beat rather than statically posing.</NARRATIVE_CONTEXT>`;
        subject = "a scene featuring the AI character and user persona engaged together within the fractal environment";
        break;
      case "character":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}`;
        subject = "a character framed within their environment, emphasizing their presence with the background fractal setting visible";
        break;
      case "selfie":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}`;
        subject =
          "a modern front-facing wide-angle selfie capture, framing the character from the chest up with one arm reaching toward the lower frame";
        break;
      case "user":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${userBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Focus solely on this persona context.</RESTRICTION>`;
        subject = "a solo character portrait of the user persona";
        break;
      case "ai":
      default:
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Focus solely on this character context.</RESTRICTION>`;
        subject = "a solo character portrait of the AI character";
        break;
    }

    return `
<SYSTEM role="SENSORY_CORTEX_V5">
${ctxBlock}
${visualEngineBlock}
<PROTOCOL>
1. Formulate your internal visual plan inside the "_thought_process" key first.
2. Synthesize the final image prompt inside "prompt" as continuous, descriptive sentences depicting ${subject}.
3. Seamlessly incorporate the medium, palette, camera, and texture directives from <VISUAL_ENGINE>.
4. Pass the designated negative tokens ("${escapeXml(vsNegPrompt)}") inside "negativePrompt".
${targetType === "selfie" ? '5. Generate a short, in-character social media caption inside "caption".' : ""}
</PROTOCOL>
<TARGET>${targetType}</TARGET>
<MODE>${mode.toUpperCase()}</MODE>
${history ? `<HISTORY>\n${escapeXml(history)}\n</HISTORY>\n` : ""}<INSTRUCTIONS>
Convert narrative intent into a structured image prompt payload.
Input Intent: "${escapeXml(rawIntent)}"
</INSTRUCTIONS>

JSON STRUCTURE:
{
  "_thought_process": "<step-by-step composition, lighting, and style analysis>",
  "prompt": "<synthesized descriptive image prompt>",
  "negativePrompt": "${escapeXml(vsNegPrompt)}"${targetType === "selfie" ? ',\n  "caption": "<in-character selfie caption>"' : ""}
}

${PROTOCOL_LIBRARY.JSON_OUTPUT}
</SYSTEM>
`.trim();
  },
};

/**
 * Standard resolution mapping for execution modes.
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

/**
 * Formats Perchance parameter injection blocks for resolution and seed control.
 * @param {string} mode
 * @param {number|string} [seed]
 * @returns {string}
 */
export function format_perchance_params(mode, seed = null) {
  const { width, height } = getResolution(mode);
  const resParam = `(resolution:::${width}x${height})`;
  const seedParam = seed !== null && seed !== undefined ? ` (seed:::${seed})` : "";
  return `${resParam}${seedParam}`;
}
