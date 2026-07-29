/**
 * src/media/optics.js
 * 👁️ OPTICS LAYER — PROMPT ENGINEERING & VISUAL STYLE ENGINE
 * Optimized for FLUX.1 (Rectified Flow), T5-XXL text encoders, and Perchance parameter injection.
 */

import { VISUAL_STYLES } from "@data";
import { escape_xml as escape_xml, safe_parse_pseudo_json, state_bridge } from "@utils";
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
  const entity_style = entity?.visual_style;
  if (entity_style && entity_style !== "default" && entity_style !== "" && VISUAL_STYLES[entity_style]) {
    return entity_style;
  }
  const app_style = state_bridge.app ? state_bridge.app.settings?.visual_style : null;
  if (app_style && app_style !== "default" && VISUAL_STYLES[app_style]) {
    return app_style;
  }
  return "none";
}

/**
 * Resolves the active visual style key for story scene generation.
 * @returns {string}
 */
export function resolve_story_visual_style_key() {
  const fractal_style = state_bridge.runtime?.active_fractal?.visual_style;
  if (fractal_style && fractal_style !== "default" && fractal_style !== "" && VISUAL_STYLES[fractal_style]) {
    return fractal_style;
  }
  const app_style = state_bridge.app?.settings?.visual_style ?? null;
  if (app_style && app_style !== "default" && VISUAL_STYLES[app_style]) {
    return app_style;
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

  const extract_tag = (tag) => {
    const match = engineXml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
    return match ? match[1].trim() : "";
  };

  result.medium = extract_tag("medium");
  result.palette = extract_tag("palette");
  result.camera = extract_tag("camera");
  result.composition = extract_tag("composition");
  result.texture = extract_tag("texture");
  result.negative_prompt = extract_tag("negative_prompt");
  return result;
}

/**
 * Resolves the VISUAL_ENGINE tokens for a given visual style key,
 * handling both XML-embedded tags and isolated schema properties.
 * @param {string} style_key
 * @returns {{ medium: string, palette: string, camera: string, composition: string, texture: string, negative_prompt: string }}
 */
export function resolve_visual_engine_tokens(style_key) {
  const style = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
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
  const parsed = safe_parse_pseudo_json(raw);

  if (parsed.__raw_prose__) {
    return normalize_comma_spacing(parsed.__raw_prose__);
  }

  if (Object.keys(parsed).length > 0) {
    const clauses = Object.entries(parsed)
      .map(([k, v]) => {
        const val_str = Array.isArray(v) ? v.join(", ") : String(v).trim();
        if (!val_str) return "";
        return `${k.replace(/_/g, " ")}: ${val_str}`;
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
  const eternal_obj = safe_parse_pseudo_json(entity.eternal?.physical || "");
  const present_obj = safe_parse_pseudo_json(entity.present?.physical || "");

  const merged = {};

  const merge_input_source = (sourceObj, fallbackLabel) => {
    if (sourceObj.__raw_prose__) {
      merged[fallbackLabel] = sourceObj.__raw_prose__;
    } else {
      Object.entries(sourceObj).forEach(([k, v]) => {
        merged[k] = v;
      });
    }
  };

  merge_input_source(eternal_obj, "eternal");
  merge_input_source(present_obj, "present");

  const style_key = resolve_portrait_visual_style_key(entity);
  const engine_tokens = resolve_visual_engine_tokens(style_key);
  if (engine_tokens.medium) merged._vs_medium = engine_tokens.medium;
  if (engine_tokens.palette) merged._vs_palette = engine_tokens.palette;
  if (engine_tokens.camera) merged._vs_camera = engine_tokens.camera;
  if (engine_tokens.composition) merged._vs_composition = engine_tokens.composition;
  if (engine_tokens.texture) merged._vs_texture = engine_tokens.texture;

  const color_name = get_signature_label(entity);
  if (color_name) {
    merged.aesthetic = `${color_name.toLowerCase()} aesthetic`;
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
    const ordered_keys = [...VS_ORDERED_KEYS.filter((k) => merged[k]), ...Object.keys(merged).filter((k) => !VS_ORDERED_KEYS.includes(k))];

    return ordered_keys
      .map((k) => {
        const v = merged[k];
        if (v === undefined || v === null) return "";
        const val_str = Array.isArray(v) ? v.join(", ") : String(v).trim();
        if (!val_str) return "";
        const formatted_val = normalize_comma_spacing(val_str);
        const clean_key = k.replace(/^_vs_/, "");
        return `  "${clean_key}": "${formatted_val.replace(/"/g, '\\"')}"`;
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
    const vs_values = VS_ORDERED_KEYS.map((k) => merged[k]).filter(Boolean);
    const other_values = Object.entries(merged)
      .filter(([k]) => !VS_ORDERED_KEYS.includes(k))
      .map(([k, v]) => {
        const val_str = Array.isArray(v) ? v.join(", ") : String(v).trim();
        return k.startsWith("_vs_") || k === "aesthetic" ? val_str : `${k.replace(/_/g, " ")}: ${val_str}`;
      })
      .filter(Boolean);

    return normalize_comma_spacing([...vs_values, ...other_values].join(". "));
  },
};

const JSON_OUTPUT_PROTOCOL = "Return a single JSON object. No preamble, no markdown backticks, no XML tags outside the JSON.";
const PERCHANCE_SYNTAX_PROTOCOL =
  "You MAY use Perchance inline dynamic selection syntax '{Option A|Option B|Option C}' for variable features (colors, micro-details, backgrounds) to ensure variation.";

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
    const is_portrait_mode = ["character", "ai", "user", "selfie", "portrait"].includes(_type || "");
    const style_key = is_portrait_mode ? resolve_portrait_visual_style_key(entity || {}) : resolve_story_visual_style_key();
    const style_obj = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
    const active_style_block = `<ACTIVE_VISUAL_STYLE key="${style_key}" name="${escape_xml(style_obj.name || style_key)}">
${style_obj.visual_engine || "<VISUAL_ENGINE>No automatic visual style tokens forced.</VISUAL_ENGINE>"}
${style_obj.tags && style_obj.tags.length ? `<tags>${escape_xml(style_obj.tags.join(", "))}</tags>` : ""}
${style_obj.negative_prompt ? `<negative_prompt>${escape_xml(style_obj.negative_prompt)}</negative_prompt>` : ""}
</ACTIVE_VISUAL_STYLE>`;

    const input_desc =
      text && text.trim()
        ? text
        : `A detailed ${is_portrait_mode ? "character portrait" : "scene"} of ${entity?.name || _type || "a subject"}, ${entity?.description || "with distinctive features and dramatic lighting"}.`;

    return `<OPTICS_REFINE role="SENSORY_CORTEX_SCRIBE">
You are the "Optics Scribe" — a master prompt engineer tasked with establishing structural harmony, stylistic balance, and rendering clarity for modern transformer-based diffusion pipelines (FLUX.1 / T5-XXL).

Your goal is to evaluate the user's initial core concept in <INPUT_DESCRIPTION>, enrich it with vivid physical details, integrate the visual directives from <ACTIVE_VISUAL_STYLE>, and output a validated JSON payload.

${active_style_block}

<REFINE_PROTOCOL>
1. **Concept Enrichment:** Analyze core subjects, clothing, lighting, and environmental setting in INPUT_DESCRIPTION. Enrich them with concrete, tangible physical descriptors.
2. **Visual Style Integration:** Strictly honor <ACTIVE_VISUAL_STYLE>. Seamlessly integrate medium, palette, camera/composition, and texture into natural, cohesive English prose sentences.
3. **Natural Prose Format:** Output continuous descriptive sentences. Avoid compiling comma-separated "booru" keyword tags or fragmented tag soup.
4. **Keyword Integrity Constraints:** NEVER output abstract quality buzzwords like "masterpiece", "ultra HD", "8K resolution", or "best quality". Ground outputs using physical optics and real-world material descriptions.
5. **Perchance Syntax:** ${PERCHANCE_SYNTAX_PROTOCOL}
6. **Thought of Structure:** Write your internal step-by-step composition reasoning in the "_thought_process" key at the top of the JSON payload before generating final prompt strings.
</REFINE_PROTOCOL>

<INPUT_DESCRIPTION>
${escape_xml(input_desc)}
</INPUT_DESCRIPTION>

JSON STRUCTURE:
{
  "_thought_process": "<your breakdown planning: Subject features, Active Style integration, Lighting, Colors, Composition, and Textures>",
  "prompt": "<synthesized natural prose sentences merging enriched subject details with active style parameters and optional runtime parameters>",
  "negative_prompt": "<cohesive comma-separated flat tokens to exclude. Use concrete visual attributes only. NEVER use conversational phrases or instructions like 'don't include'>"
}

${JSON_OUTPUT_PROTOCOL}
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
      const parsed = safe_parse_pseudo_json(raw);
      if (parsed.__raw_prose__) {
        return `  <${tagName}>${escape_xml(parsed.__raw_prose__)}</${tagName}>`;
      }
      const children = Object.entries(parsed)
        .map(([k, v]) => `    <${k}>${escape_xml(String(v))}</${k}>`)
        .join("\n");
      return `  <${tagName}>\n${children}\n  </${tagName}>`;
    };

    const render_entity = (tagStr, entity) => {
      if (!entity) return "";
      const blocks = [];
      if (entity.eternal?.physical) {
        blocks.push(physical_to_xml(entity.eternal.physical, "ETERNAL"));
      }
      if (entity.present?.physical) {
        blocks.push(physical_to_xml(entity.present.physical, "PRESENT"));
      }
      if (!blocks.length) return `<${tagStr} name="${escape_xml(entity.name || "Unknown")}" />`;
      return `<${tagStr} name="${escape_xml(entity.name || "Unknown")}">\n${blocks.join("\n")}\n</${tagStr}>`;
    };

    const ai_block = render_entity("AI_CHARACTER", ai);
    const user_block = render_entity("USER_PERSONA", user);
    const fractal_block = render_entity("FRACTAL", fractal);

    const story_style_key = resolve_story_visual_style_key();
    const story_style = VISUAL_STYLES[story_style_key] || VISUAL_STYLES.none;
    const story_engine_tokens = resolve_visual_engine_tokens(story_style_key);
    const visual_engine_block = story_style.visual_engine
      ? `\n<VISUAL_ENGINE style="${escape_xml(story_style.name || story_style_key)}">\n${story_style.visual_engine}${
          story_style.tags && story_style.tags.length ? `\n<tags>${escape_xml(story_style.tags.join(", "))}</tags>` : ""
        }\n</VISUAL_ENGINE>`
      : "";

    const vs_neg_prompt = story_engine_tokens.negative_prompt || NEGATIVE_PROMPT;

    switch (targetType) {
      case "fractal":
        ctxBlock = `${fractal_block}\n<RESTRICTION>**STRICTLY NO CHARACTERS.** Focus entirely on environmental layout, atmospheric spatial depth, and lighting structures.</RESTRICTION>`;
        subject = "a landscape environment or interior layout space";
        break;
      case "characters":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${ai_block}\n${user_block}\n</ACTIVE_CHARACTERS>\n${fractal_block}\n<NARRATIVE_CONTEXT>The image must depict the specific scene or action described in INSTRUCTIONS. Characters must be dynamically engaged in the narrative beat rather than statically posing.</NARRATIVE_CONTEXT>`;
        subject = "a scene featuring the AI character and user persona engaged together within the fractal environment";
        break;
      case "character":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${ai_block}\n</ACTIVE_CHARACTERS>\n${fractal_block}`;
        subject = "a character framed within their environment, emphasizing their presence with the background fractal setting visible";
        break;
      case "selfie":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${ai_block}\n</ACTIVE_CHARACTERS>\n${fractal_block}`;
        subject =
          "a modern front-facing wide-angle selfie capture, framing the character from the chest up with one arm reaching toward the lower frame";
        break;
      case "user":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${user_block}\n</ACTIVE_CHARACTERS>\n${fractal_block}\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Focus solely on this persona context.</RESTRICTION>`;
        subject = "a solo character portrait of the user persona";
        break;
      case "ai":
      default:
        ctxBlock = `<ACTIVE_CHARACTERS>\n${ai_block}\n</ACTIVE_CHARACTERS>\n${fractal_block}\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Focus solely on this character context.</RESTRICTION>`;
        subject = "a solo character portrait of the AI character";
        break;
    }

    return `
<SYSTEM role="SENSORY_CORTEX_V5">
${ctxBlock}
${visual_engine_block}
<PROTOCOL>
1. Formulate your internal visual plan inside the "_thought_process" key first.
2. Synthesize the final image prompt inside "prompt" as continuous, descriptive sentences depicting ${subject}.
3. Seamlessly incorporate the medium, palette, camera, and texture directives from <VISUAL_ENGINE>.
4. Pass the designated negative tokens ("${escape_xml(vs_neg_prompt)}") inside "negative_prompt".
${targetType === "selfie" ? '5. Generate a short, in-character social media caption inside "caption".' : ""}
</PROTOCOL>
<TARGET>${targetType}</TARGET>
<MODE>${mode.toUpperCase()}</MODE>
${history ? `<HISTORY>\n${escape_xml(history)}\n</HISTORY>\n` : ""}<INSTRUCTIONS>
Convert narrative intent into a structured image prompt payload.
Input Intent: "${escape_xml(rawIntent)}"
</INSTRUCTIONS>

JSON STRUCTURE:
{
  "_thought_process": "<step-by-step composition, lighting, and style analysis>",
  "prompt": "<synthesized descriptive image prompt>",
  "negative_prompt": "${escape_xml(vs_neg_prompt)}"${targetType === "selfie" ? ',\n  "caption": "<in-character selfie caption>"' : ""}
}

${JSON_OUTPUT_PROTOCOL}
</SYSTEM>
`.trim();
  },
};

/**
 * Standard resolution mapping for execution modes.
 * @param {"landscape" | "fractal" | "portrait" | "character" | "selfie" | "user" | "ai" | "characters" | string} mode
 * @returns {{ width: number, height: number }}
 */
export const get_resolution = (mode) => {
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
  const { width, height } = get_resolution(mode);
  const res_param = `(resolution:::${width}x${height})`;
  const seed_param = seed !== null && seed !== undefined ? ` (seed:::${seed})` : "";
  return `${res_param}${seed_param}`;
}
