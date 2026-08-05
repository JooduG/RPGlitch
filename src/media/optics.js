/**
 * src/media/optics.js
 * 👁️ OPTICS LAYER — PROMPT ENGINEERING & VISUAL STYLE ENGINE
 * Optimized for FLUX.1 (Rectified Flow), T5-XXL text encoders, and Perchance parameter injection.
 */

import { VISUAL_STYLES, detox_prose } from "@data";
import { PROTOCOL_LIBRARY, escape_xml, safe_parse_pseudo_json, state_bridge } from "@utils";
import { get_signature_label } from "./tokens.js";

/**
 * Modern concise fallback negative prompt optimized for T5-XXL text streams.
 * Avoids legacy SD 1.5 word-salad tags that cause lexical contamination in FLUX.
 * Sourced from PROTOCOL_LIBRARY.OPTICS.NEGATIVE_PROMPT.
 */
export const NEGATIVE_PROMPT = PROTOCOL_LIBRARY.OPTICS.NEGATIVE_PROMPT;

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

  // CLOTHING OVERRIDE PROTOCOL
  // If present state declares clothing as None or Bare, strip all eternal clothing tags
  const clothing_val = (merged.CLOTHING || merged.SHIRT || "").toString().toLowerCase();
  if (clothing_val === "none" || clothing_val === "bare" || clothing_val === "naked") {
    const clothing_keys = [
      "SHIRT",
      "PANTS",
      "SUIT",
      "JACKET",
      "DRESS",
      "SKIRT",
      "COAT",
      "SHOES",
      "BOOTS",
      "GLOVES",
      "HAT",
      "ARMOR",
      "ROBE",
      "CLOAK",
      "BOTTOMS",
      "TOPS",
      "ACCESSORIES",
    ];
    for (const ck of clothing_keys) {
      if (merged[ck] && merged[ck].toString().toLowerCase() !== clothing_val) {
        // Only strip if this key was NOT explicitly defined in the present state
        if (!(ck in present_obj)) {
          delete merged[ck];
        }
      }
    }
  }

  const style_key = resolve_portrait_visual_style_key(entity);
  const style_obj = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
  const engine_tokens = resolve_visual_engine_tokens(style_key);
  if (engine_tokens.medium) merged._vs_medium = engine_tokens.medium;
  if (engine_tokens.palette) merged._vs_palette = engine_tokens.palette;
  if (engine_tokens.camera) merged._vs_camera = engine_tokens.camera;
  if (engine_tokens.composition) merged._vs_composition = engine_tokens.composition;
  if (engine_tokens.texture) merged._vs_texture = engine_tokens.texture;
  if (style_key && style_key !== "none" && style_obj.tags && style_obj.tags.length) {
    merged._vs_tags = style_obj.tags.join(", ");
  }

  if (Array.isArray(entity.tags) && entity.tags.length) {
    merged.tags = entity.tags.join(", ");
  }

  const color_name = get_signature_label(entity);
  if (color_name) {
    merged.aesthetic = `${color_name.toLowerCase()} aesthetic`;
  }

  return merged;
}

const VS_ORDERED_KEYS = ["_vs_medium", "_vs_palette", "_vs_camera", "_vs_composition", "_vs_texture", "_vs_tags"];

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

// Protocol constants now sourced from @utils/protocols.js (PROTOCOL_LIBRARY)
const JSON_OUTPUT_PROTOCOL = PROTOCOL_LIBRARY.FORMATS.JSON_ONLY;

/**
 * Authoritative prompt templates optimized for modern generative diffusion pipelines.
 */
export const PromptTemplates = {
  /**
   * Constructs system prompts for all image generation tasks (solo entity portraits and multi-character scenes).
   * @param {string} targetType
   * @param {string} rawIntent
   * @param {any} [context]
   * @returns {string}
   */
  BUILDER: (targetType, rawIntent, context) => {
    const { ai, user, fractal, entity, history, mode = "visualize" } = context || {};

    // Legacy aliases → the 4-tier taxonomy:
    //   story     = all three entities (AI + USER + FRACTAL) in one frame
    //   character = one character inside the fractal world (fractal's style)
    //   entity    = solo character OR fractal, independent of the selected
    //               fractal world (the entity's OWN visual style)
    //   scene     = depict whatever the narrative intent describes
    const TARGET_ALIASES = {
      ai: "entity",
      user: "entity",
      selfie: "entity",
      portrait: "entity",
      fractal: "entity",
      characters: "story",
      prologue: "story",
      landscape: "scene",
      setting: "scene",
    };
    targetType = TARGET_ALIASES[targetType] || targetType;

    const active_ai = ai;
    const active_user = user;
    const active_fractal = fractal;
    const main_entity = active_ai || active_user;

    // Solo tiers frame exactly one subject. An explicit `entity` context wins;
    // otherwise default to the AI character (the star of the scene).
    const is_solo = targetType === "character" || targetType === "entity";
    const subject_entity = is_solo ? entity || active_ai : null;
    const subject_is_fractal = !!subject_entity && (subject_entity.type === "fractal" || (active_fractal && subject_entity.id === active_fractal.id));
    const subject_is_user = !!subject_entity && !subject_is_fractal && !!active_user && subject_entity.id === active_user.id;

    let ctxBlock;
    let subject;

    const physical_to_xml = (raw, tagName) => {
      if (!raw) return "";
      const parsed = safe_parse_pseudo_json(raw);
      if (parsed.__raw_prose__) {
        return `  <${tagName}>${escape_xml(parsed.__raw_prose__)}</${tagName}>`;
      }
      const children = Object.entries(parsed)
        .map(([k, v]) => {
          const tag = k.replace(/\s+/g, "_");
          return `    <${tag}>${escape_xml(String(v))}</${tag}>`;
        })
        .join("\n");
      return `  <${tagName}>\n${children}\n  </${tagName}>`;
    };

    const render_entity = (tagStr, ent) => {
      if (!ent) return "";
      const blocks = [];
      if (ent.eternal?.physical) {
        blocks.push(physical_to_xml(ent.eternal.physical, "ETERNAL"));
      }
      if (ent.present?.physical) {
        blocks.push(physical_to_xml(ent.present.physical, "PRESENT"));
      }
      if (!blocks.length) return `<${tagStr} name="${escape_xml(ent.name || "Unknown")}" />`;
      return `<${tagStr} name="${escape_xml(ent.name || "Unknown")}">\n${blocks.join("\n")}\n</${tagStr}>`;
    };

    const ai_block = render_entity("AI_CHARACTER", active_ai);
    const user_block = render_entity("USER_PERSONA", active_user);
    const subject_block = render_entity(subject_is_fractal ? "FRACTAL" : subject_is_user ? "USER_PERSONA" : "AI_CHARACTER", subject_entity);

    const fractal_block =
      targetType === "entity"
        ? `<BACKGROUND_DIRECTIVE>Solo portrait backdrop: a clean, subdued environment that complements the subject's visual theme and signature colors. The environment is secondary — the subject fills the frame.</BACKGROUND_DIRECTIVE>`
        : active_fractal
          ? render_entity("FRACTAL", active_fractal)
          : main_entity
            ? `<BACKGROUND_DIRECTIVE>No explicit fractal environment setting is provided. You MUST synthesize an evocative, atmospheric background environment that naturally fits the personality, visual theme, and signature colors of ${escape_xml(main_entity.name || "the subject")}.</BACKGROUND_DIRECTIVE>`
            : "";

    // entity tier renders in the subject's OWN visual style (independent of any
    // selected fractal). Every other tier speaks the fractal's visual language.
    const style_key = targetType === "entity" ? resolve_portrait_visual_style_key(subject_entity) : resolve_story_visual_style_key();
    const style_obj = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
    const engine_tokens = resolve_visual_engine_tokens(style_key);
    const visual_engine_block = style_obj.visual_engine
      ? `\n<VISUAL_ENGINE style="${escape_xml(style_obj.name || style_key)}">\n${style_obj.visual_engine.replace(/<\/?VISUAL_ENGINE[^>]*>/gi, "").trim()}${
          style_obj.tags && style_obj.tags.length ? `\n<tags>${escape_xml(style_obj.tags.join(", "))}</tags>` : ""
        }\n</VISUAL_ENGINE>`
      : "";

    const vs_neg_prompt = engine_tokens.negative_prompt || NEGATIVE_PROMPT;

    switch (targetType) {
      case "story":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${ai_block}\n${user_block}\n</ACTIVE_CHARACTERS>\n${fractal_block}\n<NARRATIVE_CONTEXT>STORY SHOT MANDATE: The image MUST depict ALL THREE entities together in a single composition — the AI character (${escape_xml(active_ai?.name || "AI")}), the USER persona (${escape_xml(active_user?.name || "User")}), and the fractal environment (${escape_xml(active_fractal?.name || "the world")}). NEVER generate an empty environment and NEVER omit an entity.</NARRATIVE_CONTEXT>`;
        subject = "a cinematic story shot featuring the AI character, the user persona, and the fractal environment together in one frame";
        break;
      case "character":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${subject_block}\n</ACTIVE_CHARACTERS>\n${fractal_block}\n<NARRATIVE_CONTEXT>IN-SCENE MANDATE: Depict ${escape_xml(subject_entity?.name || "the character")} physically present WITHIN the fractal world, engaged with the environment around them. Wide or medium framing that places the character in their world, rendered in the fractal's visual style. NEVER an empty landscape without the character.</NARRATIVE_CONTEXT>`;
        subject = `${escape_xml(subject_entity?.name || "the character")}, seen inside the world of the fractal, in the fractal's visual style`;
        break;
      case "entity":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${subject_block}\n</ACTIVE_CHARACTERS>\n${fractal_block}\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Tight portrait framing — the subject fills most of the frame and the environment is a subdued backdrop only. Focus solely on this subject, rendered in the subject's OWN visual style, independent of any selected fractal world.</RESTRICTION>`;
        subject = `a solo portrait of ${escape_xml(subject_entity?.name || "the subject")}, tight framing, in the subject's own visual style`;
        break;
      case "scene":
      default:
        ctxBlock = `${fractal_block}\n<NARRATIVE_CONTEXT>SCENE FOCUS MANDATE: Depict whatever the narrative intent describes — characters, environment, or both — choosing the framing that best serves the moment. Do not force entities into the frame if the intent is about the setting itself.</NARRATIVE_CONTEXT>`;
        subject = "the scene described in the narrative intent";
        break;
    }

    return `
<SYSTEM role="SENSORY_CORTEX_V5">
${visual_engine_block}
<PROTOCOL>
${PROTOCOL_LIBRARY.OPTICS.BUILDER_PROTOCOL}
</PROTOCOL>
<TARGET>${targetType}</TARGET>
<MODE>${mode.toUpperCase()}</MODE>
${history ? `<HISTORY>\n${escape_xml(history)}\n</HISTORY>\n` : ""}<INSTRUCTIONS>
Convert narrative intent into a structured image prompt payload depicting ${subject}.
Input Intent: "${escape_xml(detox_prose(rawIntent))}"
</INSTRUCTIONS>
${ctxBlock}

JSON STRUCTURE:
{
  "_thought_process": "<step-by-step composition, lighting, and style analysis>",
  "prompt": "<synthesized descriptive image prompt>",
  "negative_prompt": "${escape_xml(vs_neg_prompt)}"
}

${JSON_OUTPUT_PROTOCOL}
</SYSTEM>
`.trim();
  },

  /**
   * Refines raw concept data into structured sentences containing visual targets.
   * Delegates directly to BUILDER for unified sensory cortex prompt synthesis.
   * @param {string} text
   * @param {string} [_type]
   * @param {any} [entity]
   * @returns {string}
   */
  ENHANCE: (text, _type = "character", entity = null) => {
    const is_fractal = entity?.type === "fractal" || _type === "fractal";
    // Enhancement always refines a solo entity's prompt → the `entity` tier,
    // rendered in the subject's OWN visual style (portrait resolver).
    return PromptTemplates.BUILDER("entity", text, {
      entity,
      ai: is_fractal ? null : entity,
      user: null,
      fractal: is_fractal ? entity : null,
      mode: "enhance",
    });
  },
};

/**
 * Standard resolution mapping for execution modes.
 * @param {"story" | "character" | "entity" | "scene" | "landscape" | "fractal" | "portrait" | "selfie" | "user" | "ai" | "characters" | string} mode
 * @returns {{ width: number, height: number }}
 */
export const get_resolution = (mode) => {
  switch (mode) {
    case "landscape":
    case "fractal":
    case "scene":
      return { width: 768, height: 512 };
    case "portrait":
    case "entity":
    case "selfie":
    case "user":
    case "ai":
      return { width: 512, height: 768 };
    case "character":
    case "prologue":
      return { width: 768, height: 512 };
    case "characters":
    case "story":
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
