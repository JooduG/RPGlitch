/**
 * src/media/visuals/image_prompts.js
 * 🧩 [COMPONENT: PROMPT INTELLIGENCE]
 * Handles aesthetic routing, semantic matching, and prompt composition.
 */
import { PALETTE } from "@theme/palette.svelte.js";
import { LlmService } from "@core/intelligence/LlmService.js";
/************************************************************************************
 * 🧩 [SECTION: CONSTANTS & GLOBALS]
 ************************************************************************************/
export const NEGATIVE_PROMPT =
  "text, watermark, blurry, low quality, deformed, cartoon, anime, missing limbs, extra limbs, mutated limbs, deformed limbs, fused limbs, missing eyes, extra eyes, fused eyes, missing ears, extra ears, fused ears, missing nose, extra nose, fused nose, missing mouth, extra mouth, fused mouth, missing teeth, extra teeth, fused teeth, missing fingers, extra fingers, fused fingers, missing toes, extra toes, fused toes, missing hands, extra hands, fused hands, missing feet, extra feet, fused feet, missing legs, extra legs, fused legs, missing arms, extra arms, fused arms";
export const VISUAL_CORTEX = `
[VISUAL_CORTEX]
- You have access to a visual generation engine.
- To generate an image, output a separate line: <image_prompt>Description of the image</image_prompt>.
- The description should be visual, detailed and artistic.
- Do NOT include the <image_prompt> block inside the <think> block.
`;
/**
 * Utility to safely access the lists injected from the Left Panel.
 */
const getRpgList = (key) => {
  if (
    typeof window !== "undefined" &&
    window.rpgLists &&
    window.rpgLists[key]
  ) {
    let list = window.rpgLists[key];
    // Adaptive Parsing: Handle the [JSON.stringify(...)] quirk or raw arrays
    if (
      Array.isArray(list) &&
      typeof list[0] === "string" &&
      list[0].startsWith("[")
    ) {
      try {
        return JSON.parse(list[0]);
      } catch (e) {
        return list;
      }
    }
    return Array.isArray(list) ? list : [];
  }
  return [];
};
/************************************************************************************
 * 🧩 [SECTION: AESTHETIC ROUTER]
 ************************************************************************************/
export const AestheticRouter = {
  /**
   * Selects specific aesthetic tokens based on semantic affinity with character data.
   */
  select(characterData = {}) {
    const physical = (characterData.physical || "").toLowerCase();
    const fragments = (characterData.fragments || []).map((f) =>
      f.toLowerCase(),
    );
    const haystack = `${physical} ${fragments.join(" ")}`;
    const lists = {
      styles: getRpgList("styles"),
      lighting: getRpgList("lighting"),
      mood: getRpgList("mood"),
      quality: getRpgList("quality"),
    };
    const pickMatch = (list) => {
      const matches = list.filter((item) =>
        haystack.includes(item.toLowerCase().split(",")[0].trim()),
      );
      return matches.length > 0
        ? matches[Math.floor(Math.random() * matches.length)]
        : null;
    };
    return {
      style: pickMatch(lists.styles),
      lighting: pickMatch(lists.lighting),
      mood: pickMatch(lists.mood),
      quality:
        lists.quality.length > 0
          ? lists.quality[Math.floor(Math.random() * lists.quality.length)]
          : null,
    };
  },
};
/************************************************************************************
 * 🧩 [SECTION: PROMPT TEMPLATES]
 ************************************************************************************/
export const PROMPT_TEMPLATES = {
  optimize: (text, selections = {}) => {
    const { style, lighting, mood, quality } = selections;
    const grounding = [style, lighting, mood, quality]
      .filter(Boolean)
      .join(", ");
    return `
[SYSTEM: PROMPT_ENGINEER]
I translate rough character descriptions into dense, visual-only tokens optimized for text-to-image stable diffusion models.
<CONSTRAINTS>
- I output ONLY a comma-separated list of visual descriptors.
- I do NOT use first-person language ("I am", "My").
- I exclude abstract concepts, names, or narrative backstory.
- I focus purely on visual elements: subject, clothing, physical features, lighting, camera angle, and aesthetic style.
</CONSTRAINTS>
<AESTHETIC_GROUNDING>
${grounding || "photorealistic, cinematic lighting, 8k resolution, detailed texture"}
</AESTHETIC_GROUNDING>
<DRAFT_DESCRIPTION>
${text}
</DRAFT_DESCRIPTION>`.trim();
  },
  builder: (targetType, rawIntent, context, selections = {}) => {
    const { ai, user, fractal, history, mode = "visualize" } = context || {};
    const { style, lighting, mood, quality } = selections;
    const grounding = [style, lighting, mood, quality]
      .filter(Boolean)
      .join(", ");
    let ctxBlock = "";
    switch (targetType) {
      case "scene":
        ctxBlock = `
[CONTEXT: FRACTAL (ENVIRONMENTAL ONLY)]
Base Physics: ${fractal?.eternal?.physical || "Unknown"}
Current State: ${fractal?.present?.physical || "Standard atmosphere"}
Constraint: **STRICTLY NO CHARACTERS.** This image MUST NOT contain any humans, people, or specific characters. Focus entirely on setting, lighting, and objects.
`;
        break;
      case "user":
        ctxBlock = `
[CONTEXT: USER (Profile Picture)]
Identity: ${user?.name || "User"}
Base Form (Eternal): ${user?.eternal?.physical || "Unknown"}
Dynamic State (Present): ${user?.present?.physical || "Standard outfit"}
Constraint: **SOLO PROTOCOL.** This image MUST feature ONLY the User. Do NOT include backgrounds characters or the AI character.
`;
        break;
      case "ai":
      case "character":
      default:
        ctxBlock = `
[CONTEXT: AI_ENTITY (CHARACTER)]
Identity: ${ai?.name || "AI"}
Base Form (Eternal): ${ai?.eternal?.physical || "Unknown"}
Dynamic State (Present): ${ai?.present?.physical || "Standard outfit"}
Constraint: **SOLO PROTOCOL.** This image MUST feature ONLY the AI. Do NOT include backgrounds characters or the User.
`;
        break;
    }
    return `
[SYSTEM: POLISH_ENGINE_V3.0]
[MODULE: VISUAL_REALITY_ENGINE]
Role: Backend Image Prompt Processor.
Task: Convert the User's intent into a high-fidelity Stable Diffusion prompt.
Target: ${targetType}
[MODE: ${mode.toUpperCase()}]
[VISUALS_AUTHORIZED]
[THINK_AUTHORIZED]
[RECENT CONTEXT]
${history || "No recent history."}
${ctxBlock}
[INSTRUCTIONS: ${mode.toUpperCase()}]
${
  mode === "fetch"
    ? "Objective: Scrape the provided Description/Profile to generate a brand new photorealistic portrait prompt. Focus on physical fragments, lighting, and cinematic composition."
    : mode === "enhance"
      ? "Objective: Refine the User's raw prompt into a high-fidelity visual description. Upgrade lighting, texture, and technical descriptors while preserving original intent."
      : "Objective: Standard operation. Convert the User's intent into a single impactful image prompt."
}
Input Context (Intent): "${rawIntent || "See raw input"}"
[PROTOCOL: OPTICS_BRAIN]
1. **CHAIN_OF_THOUGHT:** You MUST start with a <think> block to plan the composition (Lighting, Angle, Physics, Details) before writing the prompt.
2. **SOLO_SHOT:** You are authorized to generate **EXACTLY ONE** <image_prompt> tag. Do NOT generate multiple images. Pick the single most impactful moment.
[PROTOCOL: GENDER_STRICTNESS]
- **HAMMER DOWN THE GENDER.**
- If the Profile says MALE/MAN/BOY, the image MUST be MALE.
- If the Profile says FEMALE/WOMAN/GIRL, the image MUST be FEMALE.
- Any ambiguity (e.g. "femboy") must lean HEAVILY towards the biological base form defined in [Base Form] unless explicitly overridden by [Dynamic State].
<AESTHETIC_GROUNDING>
${grounding || "photorealistic, cinematic lighting, 8k resolution, detailed texture"}
</AESTHETIC_GROUNDING>
[STRICT_PROTOCOL]
1. **HIERARCHY IS LAW.** If <RAW_INTENT> conflicts with Profile, <RAW_INTENT> wins.
2. **PHYSICAL ONLY.** Do NOT infer non-physical states. Use valid visual descriptors only.
3. **FORMAT:** Output properly formatted prompt text only. No conversational filler.
`;
  },
};
/************************************************************************************
 * 🧩 [SECTION: PROMPT ENGINE]
 ************************************************************************************/
export const PromptEngine = {
  async optimize(text, context = {}) {
    const selections = AestheticRouter.select(context);
    const payload = {
      system: PROMPT_TEMPLATES.optimize(text, selections),
      messages: [],
    };
    let result = await LlmService.generate(payload, { silent: true });
    if (typeof result === "string") {
      result = result
        .replace(/^["']|["']$/g, "")
        .replace(/^(here is|sure|certainly|image prompt:|the prompt).*?:/i, "")
        .replace(/^```.*?[\r\n]/gm, "")
        .replace(/```$/g, "")
        .trim();
    }
    return result;
  },
  composeBase(entity) {
    const present = entity.present?.physical || "";
    const eternal = entity.eternal?.physical || "";
    let semanticColor = entity.visuals?.colorName || "";
    if (
      !semanticColor &&
      (entity.signature_color || entity.visuals?.signature_color)
    ) {
      const rawSigColor =
        entity.signature_color || entity.visuals?.signature_color;
      const sigColor =
        typeof rawSigColor === "string"
          ? rawSigColor.replace(/[^\w# ]/g, "").substring(0, 50)
          : rawSigColor;
      const isHex = /^#[0-9A-F]{6}$/i.test(sigColor);
      if (isHex) {
        const match = Object.entries(PALETTE).find(
          ([, hex]) => hex.toLowerCase() === sigColor.toLowerCase(),
        );
        if (match) {
          semanticColor = match[0];
        }
      } else {
        semanticColor = sigColor;
      }
    }
    const fragments = [];
    if (present) fragments.push(present);
    if (eternal) fragments.push(eternal);
    if (semanticColor)
      fragments.push(
        `integrate ${semanticColor} into the image, potentially as background color`,
      );
    fragments.push(
      "high quality, hyper-realistic, volumetric lighting, 8k resolution",
    );
    return fragments.join(", ");
  },
};
