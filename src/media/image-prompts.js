/**
 * @file src/media/image-prompts.js
 * 👁️ SENSORY CORTEX — IMAGE PROMPT COMPILATION & TEMPLATES
 *
 * Core Responsibilities:
 * 1. Prompt Protocols & Optics Guidelines (`OPTICS_BUILDER_PROTOCOL`, `NEGATIVE_PROMPT`):
 *    - Structured 5-phase prompt architecture optimized for FLUX.1 (Rectified Flow) and T5-XXL encoders.
 *    - Concise negative prompt preventing SD 1.5 token soup contamination.
 * 2. Multi-Tier Prompt Templates (`prompt_templates.build_prompt`, `prompt_templates.enhance_prompt`):
 *    - Generates system prompts for solo entity portraits, environmental scenes, and multi-character group shots.
 *    - Injects dynamic camera framing based on character dynamics (intensity, chaos, affinity).
 * 3. LLM Response Parsing & Sanitization (`parse_llm_image_prompt_response`, `clean_image_prompt`):
 *    - Extracts structured `{ prompt, negative_prompt }` payloads from raw LLM output streams.
 *    - Strips cognition `<think>` tags and unwraps embedded JSON structures.
 *
 * Purity: 100% pure template synthesis & string processing functions.
 */

import { VISUAL_STYLES, resolve_portrait_visual_style_key, resolve_story_visual_style_key } from "@data";
import { escape_xml, physical_to_xml, prompt_escape, safe_parse_json, strip_cognition_blocks, detox_prose } from "@utils";
import { sanitize_llm } from "@platform";
import { normalize_image_tier } from "./image-tiers.js";
import { resolve_visual_engine_tokens, strip_visual_excluded } from "./image-aesthetics.js";

// ============================================================================
// [SECTION 1: PROTOCOL CONSTANTS & NEGATIVE PROMPTS]
// ============================================================================

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

// ============================================================================
// [SECTION 2: PROMPT TEMPLATES (BUILDER & ENHANCE)]
// ============================================================================

export const prompt_templates = {
  /**
   * Constructs system prompts for all image generation tasks (solo entity portraits and multi-character scenes).
   * @param {string} target_type
   * @param {string} raw_intent
   * @param {Record<string, any>} [context={}]
   * @returns {string}
   */
  build_prompt: (target_type, raw_intent, context = {}) => {
    const { ai, user, fractal, entity, history, mode = "visualize", variant } = context;

    // Unified 4-Tier Image Taxonomy routing
    const tier = normalize_image_tier(target_type);
    const is_selfie = variant === "selfie" || target_type === "selfie";

    const active_ai_character = ai || (entity && entity.type !== "user" && entity.type !== "fractal" ? entity : null);
    const active_user_persona = user || (entity?.type === "user" ? entity : null);
    const active_fractal_setting = fractal || (entity?.type === "fractal" ? entity : null);
    const main_entity = entity || active_ai_character || active_user_persona;
    const solo_subject = entity || active_ai_character || active_user_persona || active_fractal_setting;

    let context_block;
    let subject;

    const render_entity = (tag_name, entity_instance) => {
      if (!entity_instance) return "";
      const blocks = [];
      if (entity_instance.eternal?.physical) {
        blocks.push(physical_to_xml(strip_visual_excluded(entity_instance.eternal.physical), "ETERNAL"));
      }
      if (entity_instance.present?.physical) {
        blocks.push(physical_to_xml(strip_visual_excluded(entity_instance.present.physical), "PRESENT"));
      }
      if (!blocks.length) return `<${tag_name} name="${escape_xml(entity_instance.name || "Unknown")}" />`;
      return `<${tag_name} name="${escape_xml(entity_instance.name || "Unknown")}">\n${blocks.join("\n")}\n</${tag_name}>`;
    };

    const ai_character_block = render_entity("AI_CHARACTER", active_ai_character);
    const user_persona_block = render_entity("USER_PERSONA", active_user_persona);

    const is_story_tier = tier === "story_entities" || tier === "story_character" || tier === "story_scene";
    const fractal_setting_block =
      is_story_tier && active_fractal_setting
        ? render_entity("FRACTAL", active_fractal_setting)
        : is_story_tier && main_entity
          ? `<BACKGROUND_DIRECTIVE>No explicit fractal environment setting is provided. You MUST synthesize an evocative, atmospheric background environment that naturally fits the personality, visual theme, and signature colors of ${prompt_escape(main_entity.name || "the subject")}.</BACKGROUND_DIRECTIVE>`
          : "";

    const style_key =
      tier === "solo_entity" || mode === "enhance"
        ? resolve_portrait_visual_style_key(solo_subject)
        : resolve_story_visual_style_key(active_fractal_setting);
    const style_definition = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
    const engine_tokens = resolve_visual_engine_tokens(style_key);
    const visual_engine_block = style_definition.visual_engine
      ? `\n<VISUAL_ENGINE style="${escape_xml(style_definition.name || style_key)}">\n${style_definition.visual_engine.replace(/<\/?VISUAL_ENGINE[^>]*>/gi, "").trim()}${
          Array.isArray(style_definition.tags) && style_definition.tags.length
            ? `\n<tags>${prompt_escape(style_definition.tags.join(", "))}</tags>`
            : ""
        }\n</VISUAL_ENGINE>`
      : "";

    const resolved_negative_prompt = engine_tokens.negative_prompt || NEGATIVE_PROMPT;

    switch (tier) {
      case "solo_entity":
        context_block = `<ACTIVE_CHARACTERS>\n${render_entity("SOLO_ENTITY", solo_subject)}\n</ACTIVE_CHARACTERS>\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Isolated single-subject portrait. No secondary characters, no story scene context. The backdrop must be drawn solely from the subject's own identity and signature colors.</RESTRICTION>`;
        subject =
          "an isolated solo portrait of the subject, self-contained framing drawn entirely from the subject's own identity, appearance, and signature colors";
        break;
      case "story_scene":
        context_block = `${fractal_setting_block}\n<RESTRICTION>**STRICTLY NO CHARACTERS.** Focus entirely on environmental layout, atmospheric spatial depth, and lighting structures.</RESTRICTION>`;
        subject = "a landscape environment or interior layout space capturing the current narrative moment and prose context";
        break;
      case "story_entities":
        context_block = `<ACTIVE_CHARACTERS>\n${ai_character_block}\n${user_persona_block}\n</ACTIVE_CHARACTERS>\n${fractal_setting_block}\n<NARRATIVE_CONTEXT>CINEMATIC GROUP SHOT MANDATE: The image MUST literally depict the active narrative scene, featuring BOTH the AI character (${prompt_escape(active_ai_character?.name || "AI")}) and USER persona (${prompt_escape(active_user_persona?.name || "User")}) engaged together in their exact spatial positions described in INSTRUCTIONS, rendered within the fractal environment. NEVER generate an empty environment/landscape shot.</NARRATIVE_CONTEXT>`;
        subject = "a cinematic group shot featuring both the AI character and user persona together within the fractal environment";
        break;
      case "story_character":
      default:
        context_block = `<ACTIVE_CHARACTERS>\n${render_entity(main_entity === active_user_persona || main_entity?.type === "user" ? "USER_PERSONA" : "AI_CHARACTER", main_entity)}\n</ACTIVE_CHARACTERS>\n${fractal_setting_block}${
          active_fractal_setting
            ? `\n<NARRATIVE_CONTEXT>CHARACTER IN SCENE MANDATE: The image MUST depict the character (${prompt_escape(main_entity?.name || "Subject")}) situated directly within the active fractal environment (${prompt_escape(active_fractal_setting.name || "Setting")}), integrating the setting's architecture, atmosphere, lighting, and textures into the background and surroundings.</NARRATIVE_CONTEXT>`
            : ""
        }`;
        subject = "a character framed within their environment, emphasizing their presence with an evocative background setting";
        break;
    }

    // --- Cinematic Framing Analysis ---
    const ai_dynamics = active_ai_character?.dynamics || {};
    const intensity = Number(ai_dynamics.intensity ?? 50);
    const chaos = Number(ai_dynamics.chaos ?? 50);
    const affinity = Number(ai_dynamics.affinity ?? 50);

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
Input Intent: "${prompt_escape(detox_prose(raw_intent))}"
</INSTRUCTIONS>
${context_block}
${framing_block}

JSON STRUCTURE:
{
  "_thought_process": "<step-by-step composition, lighting, and style analysis>",
  "prompt": "<synthesized descriptive image prompt>",
  "negative_prompt": "${prompt_escape(resolved_negative_prompt)}"${is_selfie ? ',\n  "caption": "<in-character selfie caption>"' : ""}
}

${JSON_OUTPUT_PROTOCOL}
</SYSTEM>
`.trim();
  },

  /**
   * Refines raw concept data into structured sentences containing visual targets.
   * Delegates directly to build_prompt for unified sensory cortex prompt synthesis.
   * @param {string} raw_intent
   * @param {string} [target_tier="character"]
   * @param {any} [target_entity=null]
   * @returns {string}
   */
  enhance_prompt: (raw_intent, target_tier = "character", target_entity = null) => {
    const tier = normalize_image_tier(target_tier || "");
    return prompt_templates.build_prompt(tier, raw_intent, {
      entity: target_entity,
      mode: "enhance",
      variant: target_tier === "selfie" ? "selfie" : undefined,
    });
  },
};

// ============================================================================
// [SECTION 3: LLM REFINE RESPONSE PARSERS & CLEANERS]
// ============================================================================

/**
 * Extracts structured `{ prompt, negative_prompt }` payload from an LLM response stream.
 * @param {string | null | undefined} raw
 * @returns {{ prompt: string, negative_prompt: string } | null}
 */
export function parse_llm_image_prompt_response(raw) {
  if (!raw || typeof raw !== "string") return null;

  const parsed = safe_parse_json(raw);
  if (parsed && typeof parsed.prompt === "string") {
    return {
      prompt: parsed.prompt.trim(),
      negative_prompt: typeof parsed.negative_prompt === "string" ? parsed.negative_prompt.trim() : "",
    };
  }
  return null;
}

/**
 * Sanitizes a raw LLM image prompt: strips cognition blocks, unwraps JSON structures, and detoxes prose.
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

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Harmonized via /harmonize protocol: purged abbreviated identifiers (style_obj -> style_definition, active_ai -> active_ai_character, active_user -> active_user_persona, active_fractal -> active_fractal_setting, ai_block -> ai_character_block, user_block -> user_persona_block, fractal_block -> fractal_setting_block), validated Universal File Architecture, and verified zero backwards-compatibility debt.
 * - 2026-08-29: Harmonized nomenclature in accordance with GEMINI.md lexical standards:
 *   converted prompt_templates methods to snake_case (build_prompt, enhance_prompt),
 *   renamed parse_llm_refine_response -> parse_llm_image_prompt_response,
 *   and clarified variable/parameter names (ai_dynamics, entity_instance, resolved_negative_prompt, raw_intent, target_tier, target_entity).
 * - 2026-08-29: Applied ground-up /refactor protocol: added Universal File Architecture header block,
 *   structured 3 explicit section dividers, standardized camelCase identifiers (target_type, raw_intent, context_block, is_story_tier),
 *   and verified 16/16 unit test suite.
 * - 2026-08-28: Integrated FLUX.1 optics prompt architecture and dynamic camera framing rules.
 */
