/**
 * src/media/image-prompts.js
 * 👁️ PROMPT COMPOSITION — IMAGE PROMPT TEMPLATES
 * Authoritative system prompts for image generation (solo portraits, group
 * shots, scenes) plus LLM refine-response parsing. Optimized for FLUX.1
 * (Rectified Flow), T5-XXL text encoders, and Perchance parameter injection.
 * Aesthetic description lives in image-aesthetics.js; the tier taxonomy in
 * image-tiers.js.
 */

import { VISUAL_STYLES, detox_prose } from "@data";
import { escape_xml, physical_to_xml, prompt_escape, strip_cognition_blocks } from "@utils";
import { sanitize_llm } from "@platform";
import { normalize_image_tier } from "./image-tiers.js";
import {
  resolve_portrait_visual_style_key,
  resolve_story_visual_style_key,
  resolve_visual_engine_tokens,
  strip_visual_excluded,
} from "./image-aesthetics.js";

/**
 * Modern concise fallback negative prompt optimized for T5-XXL text streams.
 * Avoids legacy SD 1.5 word-salad tags that cause lexical contamination in FLUX.
 */
export const NEGATIVE_PROMPT = "blurry, low resolution, compressed artifacts, watermark, bad anatomy, distorted features";

const JSON_OUTPUT_PROTOCOL =
  "Return a single JSON object starting with { and ending with }. No preamble, no markdown backticks, no external XML tags.";

export const OPTICS_BUILDER_PROTOCOL = `EXECUTE VISUAL SYNTHESIS IN 5 ORDERED PHASES:

PHASE 1: EXECUTION & OUTPUT STRUCTURE
- Formulate composition strategy inside "_thought_process" key first.
- Output final image prompt inside "prompt" as continuous, fluid prose.
- Output negative tokens inside "negative_prompt". Enforce KEYWORD_INTEGRITY — quality buzzwords ('masterpiece', '8K', 'ultra HD', 'photorealistic', 'digital art') are forbidden in BOTH "prompt" and "negative_prompt". Ground outputs using physical optics and real-world materials.
- Enforce FLUX_T5_WEIGHTING — NEVER emit bracket weight math ('(x:1.3)', '((x))', '[x:0.4]'): FLUX/T5 reads words, not weights. Emphasize via descriptors, varied rephrasing, and attenuation phrasing ('faint', 'subtle touch of', 'barely visible in the distance').
- Enforce POSITIVE_FRAMING — describe what IS physically in frame ('a softly moonlit glade' rather than 'no harsh sunlight'); keep the negative_prompt limited to global quality artifacts.

PHASE 2: SUBJECT & SPATIAL FRAMING (FIRST SENTENCE PRIORITY)
- FIRST SENTENCE MANDATE: Always place main entities and active physical interactions in the VERY FIRST sentence.
- Spatial Geometry: Strictly enforce camera angles, elevations (e.g., balconies), lighting positions, and distance.
- Prologue Priority: In prologue mode, the primary active scene message overrides static lore. Render what is happening NOW.

PHASE 3: CHARACTER SPECIFICATION & OVERRIDES
- Explicit Identifiers: Always explicitly state gender and physical identifiers (e.g., "a handsome young male high-elf man").
- Animal/Creature Disambiguation: Never use bare animal/creature proper names (e.g., "Beast"). Translate to explicit physical traits (e.g., "a massive grey-green male orc warrior").
- Feature Weighting: Dedicate maximum descriptive effort to unique features (scars, glowing eyes, horns); keep common traits brief. Reinforce key subjects through varied rephrasing across clauses rather than numeric weights.
- Lexical Register Preservation: Preserve the specific visceral, crude, or raw vocabulary from the participant's action and character state (e.g. 'cock', 'shaft', 'bulge', 'thong', 'pecs', 'grease-stained') rather than sanitizing into sterile or clinical synonyms ('genitals', 'undergarment'). Diffusion models and T5 text encoders have vastly different training distributions and aesthetic associations for crude/visceral terms versus clinical terms.
- Garment Anatomy & Underwear Specificity: When rendering specialized or revealing garments (e.g., jockstraps, thongs, harnesses), explicitly specify their physical mechanics and bare skin exposure in natural prose. For a jockstrap, describe: 'wearing an athletic jockstrap featuring a supportive front pouch, open sides and back with bare exposed butt cheeks, and dual wide elastic straps circling under the glutes/thighs'. For thongs, describe: 'a narrow string back leaving the rear completely bare'. Never allow jockstraps to collapse into generic briefs or full-coverage shorts.
- Alternation Resolution: If an input attribute contains Perchance alternation syntax '{Option A|Option B}', resolve it to exactly ONE option consistent with the current narrative; never blend options and never echo the braces or pipe.
- Dynamic State Override: Follow a strict bottom-up hierarchy where the most recent (bottom-most) physical condition update ALWAYS overrides preceding static tags like <SHIRT> or <JACKET>. If a conflicting state appears later (e.g. 'no clothes' then later 'shirt: white'), the most recent/latest state wins.

PHASE 4: STYLE & MEDIUM DISCIPLINE
- Medium Authority: Directives in <VISUAL_ENGINE> (e.g., oil painting, pixel art, charcoal) dictate absolute style. Strip out conflicting photorealistic terms.
- Palette Strictness: Strict medium palettes (monochrome, sepia, cyanotype) override conflicting color terms.

PHASE 5: SENSORY & ENVIRONMENTAL GROUNDING
- Ground scenes through real-world light sources, physical textures, and concrete environmental geometry rather than abstract concepts.
- Typography & Signage (OPTIONAL): Render on-screen text ONLY when the scene itself calls for it — signs, graffiti, titles, or UI that are part of the subject matter. Never add text artificially. When text IS present, spell it out exactly and specify placement, font, and color (e.g. "OPEN" in glowing red neon, centered above the doors) — never invent, garble, or approximate lettering, and never output generic placeholders like "text" or "sign".`;

/**
 * Authoritative prompt templates optimized for modern generative diffusion pipelines.
 */
export const prompt_templates = {
  /**
   * Constructs system prompts for all image generation tasks (solo entity portraits and multi-character scenes).
   * @param {string} targetType
   * @param {string} rawIntent
   * @param {any} [context]
   * @returns {string}
   */
  BUILDER: (targetType, rawIntent, context) => {
    const { ai, user, fractal, entity, history, mode = "visualize", variant } = context || {};

    // Unified 4-Tier Image Taxonomy routing.
    const tier = normalize_image_tier(targetType);
    const is_selfie = variant === "selfie" || targetType === "selfie";

    const active_ai = ai || (entity && entity.type !== "user" && entity.type !== "fractal" ? entity : null);
    const active_user = user || (entity?.type === "user" ? entity : null);
    const active_fractal = fractal || (entity?.type === "fractal" ? entity : null);
    const main_entity = entity || active_ai || active_user;
    const solo_subject = entity || active_ai || active_user || active_fractal;

    let ctxBlock;
    let subject;

    const render_entity = (tagStr, ent) => {
      if (!ent) return "";
      const blocks = [];
      if (ent.eternal?.physical) {
        blocks.push(physical_to_xml(strip_visual_excluded(ent.eternal.physical), "ETERNAL"));
      }
      if (ent.present?.physical) {
        blocks.push(physical_to_xml(strip_visual_excluded(ent.present.physical), "PRESENT"));
      }
      if (!blocks.length) return `<${tagStr} name="${escape_xml(ent.name || "Unknown")}" />`;
      return `<${tagStr} name="${escape_xml(ent.name || "Unknown")}">\n${blocks.join("\n")}\n</${tagStr}>`;
    };

    const ai_block = render_entity("AI_CHARACTER", active_ai);
    const user_block = render_entity("USER_PERSONA", active_user);

    const story_tier = tier === "story_entities" || tier === "story_character" || tier === "story_scene";
    const fractal_block =
      story_tier && active_fractal
        ? render_entity("FRACTAL", active_fractal)
        : story_tier && main_entity
          ? `<BACKGROUND_DIRECTIVE>No explicit fractal environment setting is provided. You MUST synthesize an evocative, atmospheric background environment that naturally fits the personality, visual theme, and signature colors of ${prompt_escape(main_entity.name || "the subject")}.</BACKGROUND_DIRECTIVE>`
          : "";

    const style_key =
      tier === "solo_entity" || mode === "enhance" ? resolve_portrait_visual_style_key(solo_subject) : resolve_story_visual_style_key(active_fractal);
    const style_obj = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
    const engine_tokens = resolve_visual_engine_tokens(style_key);
    const visual_engine_block = style_obj.visual_engine
      ? `\n<VISUAL_ENGINE style="${escape_xml(style_obj.name || style_key)}">\n${style_obj.visual_engine.replace(/<\/?VISUAL_ENGINE[^>]*>/gi, "").trim()}${
          style_obj.tags && style_obj.tags.length ? `\n<tags>${prompt_escape(style_obj.tags.join(", "))}</tags>` : ""
        }\n</VISUAL_ENGINE>`
      : "";

    const vs_neg_prompt = engine_tokens.negative_prompt || NEGATIVE_PROMPT;

    switch (tier) {
      case "solo_entity":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${render_entity("SOLO_ENTITY", solo_subject)}\n</ACTIVE_CHARACTERS>\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Isolated single-subject portrait. No secondary characters, no story scene context. The backdrop must be drawn solely from the subject's own identity and signature colors.</RESTRICTION>`;
        subject =
          "an isolated solo portrait of the subject, self-contained framing drawn entirely from the subject's own identity, appearance, and signature colors";
        break;
      case "story_scene":
        ctxBlock = `${fractal_block}\n<RESTRICTION>**STRICTLY NO CHARACTERS.** Focus entirely on environmental layout, atmospheric spatial depth, and lighting structures.</RESTRICTION>`;
        subject = "a landscape environment or interior layout space capturing the current narrative moment and prose context";
        break;
      case "story_entities":
        ctxBlock = `<ACTIVE_CHARACTERS>\n${ai_block}\n${user_block}\n</ACTIVE_CHARACTERS>\n${fractal_block}\n<NARRATIVE_CONTEXT>CINEMATIC GROUP SHOT MANDATE: The image MUST literally depict the active narrative scene, featuring BOTH the AI character (${prompt_escape(active_ai?.name || "AI")}) and USER persona (${prompt_escape(active_user?.name || "User")}) engaged together in their exact spatial positions described in INSTRUCTIONS, rendered within the fractal environment. NEVER generate an empty environment/landscape shot.</NARRATIVE_CONTEXT>`;
        subject = "a cinematic group shot featuring both the AI character and user persona together within the fractal environment";
        break;
      case "story_character":
      default:
        ctxBlock = `<ACTIVE_CHARACTERS>\n${render_entity(main_entity === active_user || main_entity?.type === "user" ? "USER_PERSONA" : "AI_CHARACTER", main_entity)}\n</ACTIVE_CHARACTERS>\n${fractal_block}${
          active_fractal
            ? `\n<NARRATIVE_CONTEXT>CHARACTER IN SCENE MANDATE: The image MUST depict the character (${prompt_escape(main_entity?.name || "Subject")}) situated directly within the active fractal environment (${prompt_escape(active_fractal.name || "Setting")}), integrating the setting's architecture, atmosphere, lighting, and textures into the background and surroundings.</NARRATIVE_CONTEXT>`
            : ""
        }`;
        subject = "a character framed within their environment, emphasizing their presence with an evocative background setting";
        break;
    }

    // 🎬 Cinematic Photographic Framing Modes
    const ai_dyn = active_ai?.dynamics || {};
    const intensity = Number(ai_dyn.intensity ?? 50);
    const chaos = Number(ai_dyn.chaos ?? 50);
    const affinity = Number(ai_dyn.affinity ?? 50);

    let framing_mode = "Medium Action";
    let framing_tokens = "medium shot, waist-up framing, dynamic posture, clear wardrobe & prop details";

    if (tier === "story_scene") {
      framing_mode = "Wide Environmental";
      framing_tokens = "wide-angle environmental shot, deep spatial composition, atmospheric scale, full silhouette";
    } else if (chaos >= 75) {
      framing_mode = "Dutch / Low-Angle";
      framing_tokens = "dutch angle composition, low-angle perspective, imposing scale, dramatic lighting contrast";
    } else if (intensity >= 75 || affinity >= 75) {
      framing_mode = "Intimate Close-Up";
      framing_tokens = "tight close-up portrait, shallow depth of field, sharp focus on eyes, macro expression detail";
    } else if (tier === "solo_entity") {
      framing_mode = "Medium Action";
      framing_tokens = "medium portrait framing, waist-up composition, distinctive wardrobe, signature atmospheric backdrop";
    }

    const framing_block = `\n<CINEMATIC_FRAMING mode="${framing_mode}">\n  ${framing_tokens}\n</CINEMATIC_FRAMING>`;

    return `
<SYSTEM role="SENSORY_CORTEX_V5">
${visual_engine_block}
<PROTOCOL>
${OPTICS_BUILDER_PROTOCOL}
${is_selfie ? '\nPHASE 6: SELFIE MODE EXTENSION\n- Generate a short, in-character social media caption inside "caption".' : ""}
</PROTOCOL>
<TARGET>${tier}</TARGET>
<MODE>${mode.toUpperCase()}</MODE>
${history ? `<HISTORY>\n${prompt_escape(history)}\n</HISTORY>\n` : ""}<INSTRUCTIONS>
Convert narrative intent into a structured image prompt payload depicting ${subject}.
Input Intent: "${prompt_escape(detox_prose(rawIntent))}"
</INSTRUCTIONS>
${ctxBlock}
${framing_block}

JSON STRUCTURE:
{
  "_thought_process": "<step-by-step composition, lighting, and style analysis>",
  "prompt": "<synthesized descriptive image prompt>",
  "negative_prompt": "${prompt_escape(vs_neg_prompt)}"${is_selfie ? ',\n  "caption": "<in-character selfie caption>"' : ""}
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
    const tier = normalize_image_tier(_type || "");
    return prompt_templates.BUILDER(tier, text, {
      entity,
      mode: "enhance",
      variant: _type === "selfie" ? "selfie" : undefined,
    });
  },
};

/**
 * Extracts the first JSON payload ({prompt, negative_prompt}) from an LLM
 * response stream, tolerating prose and markdown around the JSON block.
 * @param {string} raw
 * @returns {{ prompt: string, negative_prompt: string } | null}
 */
export function parse_llm_refine_response(raw) {
  if (!raw || typeof raw !== "string") return null;

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    try {
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (parsed && typeof parsed.prompt === "string") {
        return {
          prompt: parsed.prompt.trim(),
          negative_prompt: typeof parsed.negative_prompt === "string" ? parsed.negative_prompt.trim() : "",
        };
      }
    } catch (parseErr) {
      console.warn(
        "[ImagePrompts.parse_llm_refine_response] JSON.parse failed:",
        parseErr.message,
        "raw slice:",
        raw.slice(start, Math.min(start + 200, end + 1)),
      );
    }
  }
  return null;
}

/**
 * Sanitizes a raw LLM image prompt: strips cognition blocks, un-wraps an
 * embedded "prompt" JSON field, and detoxes the prose.
 * @param {string} raw
 * @returns {string}
 */
export function clean_image_prompt(raw) {
  if (typeof raw !== "string") return raw;
  let cleaned = sanitize_llm(strip_cognition_blocks(raw));
  if (cleaned.includes("{")) {
    const prompt_match = cleaned.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
    if (prompt_match && prompt_match[1]) {
      cleaned = prompt_match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    } else {
      cleaned = cleaned.replace(/[{}]/g, "");
    }
  }
  return detox_prose(cleaned);
}
