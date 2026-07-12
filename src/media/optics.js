/**
 * src/media/optics.js
 * 👁️ OPTICS LAYER — UPGRADED ENHANCEMENT SCRIBE
 * High-fidelity prompt engineering, dynamic syntax integration, and artistic refinement.
 * Merges photorealistic collection specs with adaptive multi-medium rendering flexibility.
 * NOTE: If a physical condition (e.g. bleeding) carries narrative weight, it MUST be mirrored into the non_physical field for the AI Director.
 */

export const NEGATIVE_PROMPT =
  "low quality, blurry, watermark, text, signature, deformed, mutated, extra limbs, missing limbs, bad anatomy, fused fingers, distorted face, amateur, low resolution, compressed artifacts";

import { LISTS } from "@data";
import { escapeXml, PROTOCOL_LIBRARY } from "@intelligence";
import { get_signature_label } from "@media";

/**
 * High-fidelity parser that safely extracts configurations from fields.
 * Gracefully processes rigid JSON, loose unquoted key-value configurations,
 * and automatically falls back to raw text blocks if no clear parameters are detected.
 * @param {string} raw
 * @returns {Record<string, string>}
 */
export const safeParsePseudoJson = (raw) => {
  if (!raw) return {};
  const cleanRaw = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!cleanRaw) return {};

  // Tier 1: Try parsing standard JSON or braced setups
  try {
    let standardFormat = cleanRaw;
    if (!standardFormat.startsWith("{") && standardFormat.includes(":")) {
      standardFormat = `{ ${standardFormat.replace(/,\s*$/, "")} }`;
    }
    if (standardFormat.startsWith("{")) {
      const parsed = JSON.parse(standardFormat);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
  } catch (_e) {
    /* Structure is unbraced or fractured */
  }

  // Tier 2: Process line-by-line configuration if colons exist
  if (cleanRaw.includes(":")) {
    const extracted = {};
    const lines = cleanRaw.split(/[\n,]+/);
    const propertyRegex = /"([^"]+)"\s*:\s*"([^"]*)"/;
    const looseRegex = /([^:]+)\s*:\s*([^,]+)/;

    lines.forEach((line) => {
      let match = line.match(propertyRegex);
      if (match && match[1]) {
        extracted[match[1]] = match[2].trim();
      } else {
        match = line.match(looseRegex);
        if (match && match[1]) {
          const k = match[1].replace(/["']/g, "").trim();
          const v = match[2].replace(/["']/g, "").trim();
          if (k && v) extracted[k] = v;
        }
      }
    });
    if (Object.keys(extracted).length > 0) return extracted;
  }

  // Tier 3: Complete Fallback — Field holds raw text prose description sentence!
  return { __raw_prose__: cleanRaw };
};

/**
 * Safely parses list tokens, gracefully falling back to raw arrays.
 * @param {string[]|string} items
 * @returns {string[]|string}
 */
const parseListTokens = (items) => {
  if (Array.isArray(items) && items.length === 1 && typeof items[0] === "string" && items[0].startsWith("[")) {
    try {
      return JSON.parse(items[0]);
    } catch {
      return items;
    }
  }
  return items;
};

/**
 * Formats a dimension category for injection into the AI prompt context using clean XML tags.
 * @param {string} label
 * @param {string[]|string} items
 * @returns {string}
 */
const formatDimension = (label, items) => {
  if (!items || items.length === 0) return "";
  const cleanItems = parseListTokens(items);
  const formattedContent = Array.isArray(cleanItems) ? cleanItems.join(", ") : cleanItems;
  return `<DIMENSION category="${escapeXml(label)}">\n  ${formattedContent}\n</DIMENSION>`;
};

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
        if (!isNaN(Number(key))) return flatVal;
        return `${key}: ${flatVal}`;
      })
      .filter(Boolean)
      .join(" ");
  }
  return String(val);
};

/**
 * Collapses a physical field value into a flat comma-separated token string
 * suitable for diffusion model prompts. Transparently handles legacy plain text,
 * standard JSON, and bracketless pseudo-JSON by normalizing on the fly.
 * Enforces a strict space requirement after every comma.
 * @param {string} raw - Raw field value
 * @returns {string}
 */
export const flatten_physical = (raw) => {
  if (!raw) return "";
  const parsed = safeParsePseudoJson(raw);

  if (parsed.__raw_prose__) {
    return parsed.__raw_prose__.replace(/,([^\s])/g, ", $1");
  }

  if (Object.keys(parsed).length > 0) {
    return Object.values(parsed)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(", ")
      .replace(/,([^\s])/g, ", $1");
  }

  return raw.trim().replace(/,([^\s])/g, ", $1");
};

/**
 * Resolves specs based on active character context properties.
 */
export const AestheticResolver = {
  /**
   * Deterministic extraction of traits from entity fields.
   * @param {any} entity
   */
  extract(entity = {}) {
    const eternalObj = safeParsePseudoJson(entity.eternal?.physical || "");
    const presentObj = safeParsePseudoJson(entity.present?.physical || "");

    const merged = {};

    // Map properties sequentially, preserving nested raw streams under descriptive headers
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

    const colorName = get_signature_label(entity);
    if (colorName) {
      merged.aesthetic = `${colorName.toLowerCase()} aesthetic`;
    }

    const isLandscape = entity.type === "fractal" || entity.type === "scene";
    merged.preset = isLandscape
      ? "cinematic wide-angle environmental frame, balanced golden ratio architectural composition, immersive lighting, deep background tracking, atmospheric depth layout"
      : "professional portrait camera configuration, natural lighting, sharp subject focus, fine structural details, high-end studio layout, realistic textures";

    // Map compiled fields out into ultra-clean unbracketed properties
    const cleanLines = Object.entries(merged)
      .map(([k, v]) => {
        const valStr = Array.isArray(v) ? v.join(", ") : String(v).trim();
        if (!valStr) return "";
        const formattedVal = valStr.replace(/,([^\s])/g, ", $1");
        return `  "${k}": "${formattedVal.replace(/"/g, '\\"')}"`;
      })
      .filter(Boolean);

    return cleanLines.join(",\n");
  },
  /**
   * Deterministic flattening of traits from entity fields to plain comma-separated tags
   * suitable for raw stable diffusion prompts (no JSON quotes or syntax).
   * @param {any} entity
   */
  flatten(entity = {}) {
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

    const colorName = get_signature_label(entity);
    if (colorName) {
      merged.aesthetic = `${colorName.toLowerCase()} aesthetic`;
    }

    const isLandscape = entity.type === "fractal" || entity.type === "scene";
    merged.preset = isLandscape
      ? "cinematic wide-angle environmental frame, balanced golden ratio architectural composition, immersive lighting, deep background tracking, atmospheric depth layout"
      : "professional portrait camera configuration, natural lighting, sharp subject focus, fine structural details, high-end studio layout, realistic textures";

    // Flatten values to a comma-separated string
    return Object.values(merged)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(", ")
      .replace(/,([^\s])/g, ", $1");
  },
};

/**
 * Renders select LISTS dimensions into a structured template context block.
 * Automatically handles cleaning up configuration keys and system properties.
 * @returns {string}
 */
const buildDimensionsContext = () => {
  const labelMap = {
    quality: "Quality Presets",
    styles: "Artistic Styles",
    lighting: "Lighting",
    tech: "Technical Setup",
    composition: "Composition",
    artifacts: "Visual Artifacts",
    glitches: "System Glitches",
    mediums: "Mediums",
    camera_and_optics: "Camera & Optics",
    colors: "Colors & Film Stock",
    fidelity: "Fidelity & Texture",
    moods: "Mood & Atmosphere",
  };

  return Object.entries(LISTS)
    .map(([key, items]) => {
      if (key === "settings" || key === "sounds" || key === "mutations" || !items) return "";
      return formatDimension(labelMap[key] || key, items);
    })
    .filter(Boolean)
    .join("\n");
};

/**
 * Authoritative prompt templates optimized for generative diffusion pipelines.
 */
export const PromptTemplates = {
  /**
   * Refines raw concept data into balanced sentences containing target vocabulary arrays.
   * Unlocks complete freedom across stylistic mediums (anime, digital painting, photography).
   *
   * @param {string} text - Raw content description to enrich
   * @param {string} [type] - Entity type: "character" | "fractal" | "scene"
   * @returns {string} The formatted system instruction prompt payload string
   */
  ENHANCE: (text, _type = "character") => {
    const dimensionsContext = buildDimensionsContext();

    return `<OPTICS_REFINE role="SENSORY_CORTEX_SCRIBE">
You are the "Optics Scribe" — a master prompt engineer tasked with establishing structural harmony, stylistic balance, and pristine rendering clarity for the generation matrix.

Your goal is to evaluate the user's initial core concept, enrich it by selecting and integrating highly compatible aesthetic tokens from the provided <DIMENSIONS> matrix, and return an optimized JSON data block.

<INPUT_DESCRIPTION>
${escapeXml(text)}
</INPUT_DESCRIPTION>

<DIMENSIONS>
${dimensionsContext}
</DIMENSIONS>

<REFINE_PROTOCOL>
1. **Aesthetic Ingestion:** Analyze the core thematic style, subjects, and implied format requirements inside the INPUT_DESCRIPTION.
2. **Dimensional Integration:** Blend the root concept with specific properties drawn from the matching <DIMENSION category="..."> tags. Use these matrix properties to establish the concrete rendering rules of the asset.
3. **Synthesized Descriptive Sentences:** Synthesize your chosen dimensions and the user's core concepts into natural, continuous descriptive sentences. Avoid compiling fragmented keyword strings or unorganized keyword soup.
4. **Style Flexibility Rule:** Embrace the user's requested medium choice completely. If the user requests illustration, anime, cgi, pixel art, or photography, adjust your selected lighting and fidelity options to match that chosen artistic format seamlessly.
5. **Keyword Integrity Constraints:** NEVER output abstract quality buzzwords like "masterpiece", "ultra HD", "8K resolution", or "best quality". Ground your descriptions using concrete, physical details, textures, or stylistic equivalents instead.
6. **Perchance Syntax:** ${PROTOCOL_LIBRARY.PERCHANCE_SYNTAX}
7. **Structured Thought Process:** In the "_thought_process" field, record your internal breakdown planning how the selected elements, lighting styles, color sciences, and mediums marry together.
</REFINE_PROTOCOL>

JSON STRUCTURE:
{
  "_thought_process": "<your dimensional breakdown planning: Medium, Camera/Optics style, Lighting approach, Colors, Composition grid, Textures, and Mood environment>",
  "prompt": "<synthesized descriptive sentences merging the core input elements with target matrix tokens and optional runtime dynamic blocks>",
  "negativePrompt": "<cohesive comma-separated flat tokens to repel, preventing style dilution or contradictions. Use direct visual features only (e.g., 'bright daylight', 'blurry text'). STRICT MANDATE: Never use conversational verbs, instructions, or phrases like 'avoid', 'don't', 'free of', or 'no characters'>"
}

${PROTOCOL_LIBRARY.JSON_OUTPUT}
</OPTICS_REFINE>`.trim();
  },

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

    switch (targetType) {
      case "scene":
        ctxBlock = `${fractalBlock}\n<RESTRICTION>**STRICTLY NO CHARACTERS.** Focus entirely on environmental layout, medium context, and background lighting structures.</RESTRICTION>`;
        anchor = "RAW photograph or structured artistic rendering of an landscape environment or interior layout space";
        realism = "high architectural definition, crisp spatial depth details, professional landscape layout alignment";
        break;
      case "user":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${userBlock}\n</ACTIVE_CHARACTERS>\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Focus solely on this persona profile context.</RESTRICTION>`;
        break;
      case "selfie":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n</ACTIVE_CHARACTERS>\n${fractalBlock}`;
        anchor =
          "RAW photograph, a modern front-facing wide-angle camera selfie shot layout, capturing the primary character from the chest up with one arm stretched out forward toward the lower frame edge, while the environment is fully mapped in the background space";
        realism = "cinematic framing, clear focus distribution, naturalistic lightning features, smartphone camera simulation layer";
        break;
      case "ai":
      default:
        ctxBlock = `<ACTIVE_CHARACTERS>\n${aiBlock}\n</ACTIVE_CHARACTERS>\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Focus solely on this character profile context.</RESTRICTION>`;
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
3. The image_prompt MUST start with "${anchor}" and use continuous, descriptive details or tokens.
4. Allow alternative artistic formats (like anime or illustrations) to map cleanly if requested by the input intent context.
5. End every prompt with: "${realism}"
${targetType === "selfie" ? "6. Finally, output a short, in-character <caption>...</caption> tag to accompany the selfie." : ""}
</PROTOCOL>
</SYSTEM>
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
