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
import {
  escape_xml,
  physical_to_xml,
  prompt_escape,
  parse_macros,
  safe_parse_json,
  strip_cognition_blocks,
  detox_prose,
  has_alternations,
  resolve_alternations,
  alternation_field_label,
} from "@utils";
import { sanitize_llm } from "@platform";
import { PROTOCOL_LIBRARY } from "../intelligence/prompts/shared.js";
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

/**
 * Formats recent narrative history for the sensory cortex, stripping dangling think tags and telemetry lines.
 * @param {string} [history_text]
 * @returns {string}
 */
export function format_sensory_history(history_text) {
  if (!history_text || typeof history_text !== "string") return "";
  const cleaned = strip_cognition_blocks(history_text)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      if (/^(system|telemetry):\s*(?:chaos|intensity|openness|affinity|velocity|entropy)\s*[+-]\d+/i.test(line)) return false;
      if (/(?:chaos|intensity|openness|affinity|velocity|entropy)\s*[+-]\d+\s*\|/i.test(line)) return false;
      return true;
    })
    .join("\n")
    .trim();
  return cleaned ? `<HISTORY>\n${prompt_escape(cleaned)}\n</HISTORY>\n` : "";
}

/**
 * Compiles the 5-phase Optics Builder protocol tailored to the active visual style.
 * @param {Record<string, any>} [style_definition={}]
 * @param {Record<string, any>} [engine_tokens={}]
 * @param {string} [input_text=""]
 * @returns {string}
 */
export function build_optics_builder_protocol(style_definition = {}, engine_tokens = {}, input_text = "") {
  const keywords_raw = style_definition.keywords || style_definition.tags || [];
  const keyword_list = Array.isArray(keywords_raw)
    ? keywords_raw
    : typeof keywords_raw === "string"
      ? keywords_raw.split(",").map((s) => s.trim())
      : [];
  const valid_keywords = keyword_list.filter(Boolean);
  const keywords_str = valid_keywords.length ? valid_keywords.join(", ") : "cinematic, atmospheric";
  const style_keywords_xml = `<KEYWORD_DIRECTIVES>Integrate 2-4 appropriate keywords from below.\n<AVAILABLE_KEYWORDS>${prompt_escape(keywords_str)}</AVAILABLE_KEYWORDS>\n</KEYWORD_DIRECTIVES>`;

  const camera_or_composition = engine_tokens.camera
    ? `<CAMERA>Strict camera framing and optical lens specs: ${escape_xml(engine_tokens.camera)}</CAMERA>`
    : engine_tokens.composition
      ? `<COMPOSITION>Mandatory visual layout and perspective: ${escape_xml(engine_tokens.composition)}</COMPOSITION>`
      : "";

  const medium_xml = engine_tokens.medium
    ? `\n<MEDIUM>Specified artistic medium dictates absolute style; strip out conflicting terms: ${escape_xml(engine_tokens.medium)}</MEDIUM>`
    : "";
  const palette_xml = engine_tokens.palette
    ? `\n<PALETTE>Strict palette overrides conflicting color terms: ${escape_xml(engine_tokens.palette)}</PALETTE>`
    : "";

  const texture_xml = engine_tokens.texture ? `<TEXTURES>Include textures such as: ${escape_xml(engine_tokens.texture)}</TEXTURES>` : "";

  const has_alternation = has_alternations(input_text);
  const alternation_xml = has_alternation
    ? "\n<ALTERNATION_RESOLUTION>If an input attribute contains Perchance alternation syntax '{Option A|Option B}', resolve it to exactly ONE option consistent with the current narrative; never blend options and never echo the braces or pipe.</ALTERNATION_RESOLUTION>"
    : "";

  return `<VISUAL_SYNTHESIS>

<PHASE_1 task="COMPOSITION_STRATEGY">
<COGNITIVE_DIRECTIVE>Formulate composition strategy inside "_thought_process" key first.</COGNITIVE_DIRECTIVE>
<PROMPT_PROSE>Output final image prompt inside "prompt" as continuous, fluid prose.</PROMPT_PROSE>
<NEGATIVE_PROMPT>Output negative tokens inside "negative_prompt". Enforce KEYWORD_INTEGRITY — quality buzzwords ('masterpiece', '8K', 'ultra HD', 'photorealistic', 'digital art') are forbidden in BOTH "prompt" and "negative_prompt". Ground outputs using physical optics and real-world materials.</NEGATIVE_PROMPT>
<WEIGHTING_RESTRICTIONS>Enforce FLUX_T5_WEIGHTING — NEVER emit bracket weight math ('(x:1.3)', '((x))', '[x:0.4]'): FLUX/T5 reads words, not weights. Emphasize via descriptors, varied rephrasing, and attenuation phrasing ('faint', 'subtle touch of', 'barely visible in the distance').</WEIGHTING_RESTRICTIONS>
<AFFIRMATIVE_FRAMING>${PROTOCOL_LIBRARY.HYGIENE.AFFIRMATIVE_FRAMING}</AFFIRMATIVE_FRAMING>
${style_keywords_xml}
</PHASE_1>

<PHASE_2 task="SPATIAL_FRAMING">
<FIRST_SENTENCE_MANDATE>Always place main entities and active physical interactions in the VERY FIRST sentence.</FIRST_SENTENCE_MANDATE>
<SPATIAL_GEOMETRY>Spatial orientation: direct depiction of focal elements, absolute geometry, camera angles, elevations, lighting positions, and depth layers without metaphor or narrative scaffolding.</SPATIAL_GEOMETRY>${camera_or_composition ? `\n${camera_or_composition}` : ""}
</PHASE_2>

<PHASE_3 task="SUBJECT_SPECIFICATION">
<IDENTIFIERS>Always explicitly state gender and physical identifiers (e.g., "a handsome young male high-elf man").</IDENTIFIERS>
<CREATURE_DISAMBIGUATION>Never use bare animal/creature proper names (e.g., "Beast"). Translate to explicit physical traits (e.g., "a massive grey-green male orc warrior").</CREATURE_DISAMBIGUATION>
<FEATURE_WEIGHTING>Dedicate maximum descriptive effort to distinguishing features (scars, glowing eyes, horns); keep common traits brief. Reinforce key subjects through varied rephrasing across clauses rather than numeric weights.</FEATURE_WEIGHTING>
<LEXICAL_PRESERVATION>Preserve the specific visceral, crude, or raw vocabulary from the participant's action and character state (e.g. 'cock', 'shaft', 'bulge', 'thong', 'pecs', 'grease-stained') rather than sanitizing into sterile or clinical synonyms ('genitals', 'undergarment'). Diffusion models and T5 text encoders have vastly different training distributions and aesthetic associations for crude/visceral terms versus clinical terms.</LEXICAL_PRESERVATION>
<GARMENT_ANATOMY>When rendering specialized or revealing garments (e.g., jockstraps, thongs, harnesses), explicitly specify their physical mechanics and bare skin exposure in natural prose. For a jockstrap, describe: 'wearing an athletic jockstrap featuring a supportive front pouch, open sides and back with bare exposed butt cheeks, and dual wide elastic straps circling under the glutes/thighs'. For thongs, describe: 'a narrow string back leaving the rear completely bare'. Never allow jockstraps to collapse into generic briefs or full-coverage shorts.</GARMENT_ANATOMY>${alternation_xml}
<DYNAMIC_OVERRIDES>Follow a strict bottom-up hierarchy where the most recent (bottom-most) physical condition update ALWAYS overrides preceding static tags like <SHIRT> or <JACKET>. If a conflicting state appears later (e.g. 'no clothes' then later 'shirt: white'), the most recent/latest state wins.</DYNAMIC_OVERRIDES>
</PHASE_3>

<PHASE_4 task="STYLE_DISCIPLINE">
<STYLE_AUTHORITY>Harmonize optical rendering with designated aesthetic style and medium constraints.</STYLE_AUTHORITY>${medium_xml}${palette_xml}
</PHASE_4>

<PHASE_5 task="SENSORY_GROUNDING">
<ENVIRONMENTAL_GROUNDING>Ground scenes with tangible environmental light fixtures (e.g., flickering cathode tubes, wet pavement reflections, harsh key lamps) and tactile physical surfaces.</ENVIRONMENTAL_GROUNDING>
<TYPOGRAPHY>Render on-screen text ONLY when the scene itself calls for it — signs, graffiti, titles, or UI that are part of the subject matter. Never add text artificially. When text IS present, spell it out exactly and specify placement, font, and color (e.g. "OPEN" in glowing red neon, centered above the doors) — never invent, garble, or approximate lettering, and never output generic placeholders like "text" or "sign".</TYPOGRAPHY>${texture_xml ? `\n${texture_xml}` : ""}
</PHASE_5>

</VISUAL_SYNTHESIS>`;
}

export const OPTICS_BUILDER_PROTOCOL = build_optics_builder_protocol();

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

    const dice_picks = [];
    const roll = (text) => {
      const resolved = resolve_alternations(text, {
        onPick: (pick) => dice_picks.push({ ...pick, label: alternation_field_label(text, pick.raw) }),
      });
      return resolved.text;
    };

    // Unified 4-Tier Image Taxonomy routing
    const tier = normalize_image_tier(target_type);
    const is_selfie = variant === "selfie" || target_type === "selfie";

    const active_ai_character = ai || (entity && entity.type !== "user" && entity.type !== "fractal" ? entity : null);
    const active_user_persona = user || (entity?.type === "user" ? entity : null);
    const active_fractal_setting = fractal || (entity?.type === "fractal" ? entity : null);
    const main_entity = entity || active_ai_character || active_user_persona;
    const solo_subject = entity || active_ai_character || active_user_persona || active_fractal_setting;
    const macro_entities = { AI: active_ai_character, USER: active_user_persona, FRACTAL: active_fractal_setting };

    let context_block;
    let subject;

    const render_entity = (tag_name, entity_instance) => {
      if (!entity_instance) return "";
      const blocks = [];
      if (entity_instance.eternal?.physical) {
        blocks.push(
          physical_to_xml(
            roll(strip_visual_excluded(parse_macros(String(entity_instance.eternal.physical).trim(), entity_instance, macro_entities))),
            "PHYSICAL_APPEARANCE",
          ),
        );
      }
      if (entity_instance.present?.physical) {
        blocks.push(
          physical_to_xml(
            roll(strip_visual_excluded(parse_macros(String(entity_instance.present.physical).trim(), entity_instance, macro_entities))),
            "CURRENT_IMPRESSION",
          ),
        );
      }
      if (!blocks.length) return "";
      return `<${tag_name} name="${escape_xml(entity_instance.name || tag_name)}">\n${blocks.join("\n")}\n</${tag_name}>`;
    };

    const ai_character_block = render_entity("AI_CHARACTER", active_ai_character);
    const user_persona_block = render_entity("USER_PERSONA", active_user_persona);

    const is_story_tier = tier === "story_entities" || tier === "story_character" || tier === "story_scene";
    const fractal_setting_block =
      is_story_tier && active_fractal_setting
        ? render_entity("FRACTAL", active_fractal_setting)
        : is_story_tier && main_entity
          ? `<BACKGROUND_DIRECTIVE>You MUST synthesize an evocative, atmospheric background environment that naturally fits the personality, visual theme, and signature colors of ${prompt_escape(main_entity.name || "the subject")}.</BACKGROUND_DIRECTIVE>`
          : "";

    const combined_input_text = `${raw_intent || ""} ${main_entity?.present?.physical || ""} ${main_entity?.eternal?.physical || ""}`;
    const style_key =
      tier === "solo_entity" || mode === "enhance"
        ? resolve_portrait_visual_style_key(solo_subject)
        : resolve_story_visual_style_key(active_fractal_setting);
    const style_definition = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
    const engine_tokens = resolve_visual_engine_tokens(style_key);
    const protocol_text = build_optics_builder_protocol(style_definition, engine_tokens, combined_input_text);

    const resolved_negative_prompt = engine_tokens.negative_prompt || NEGATIVE_PROMPT;

    switch (tier) {
      case "solo_entity":
        context_block = `<ACTIVE_CHARACTERS>\n${render_entity("SOLO_ENTITY", solo_subject)}\n</ACTIVE_CHARACTERS>\n<RESTRICTION>**SOLO FRAME PROTOCOL.** Isolated single-subject portrait. No secondary characters, no story scene context. The backdrop must be drawn solely from the subject's own identity and signature colors.</RESTRICTION>`;
        subject =
          "an isolated solo portrait of the subject, self-contained framing drawn entirely from the subject's own identity, appearance, and signature colors";
        break;
      case "story_scene":
        context_block = `${fractal_setting_block}\n<ENVIRONMENTAL_SCALING>**AFFIRMATIVE ENVIRONMENTAL SCALE.** Focus completely on vast landscape architecture, atmospheric density, weather effects, and physical spatial structures.</ENVIRONMENTAL_SCALING>`;
        subject = "an expansive landscape environment, architecture, or interior space capturing environmental depth and natural forces";
        break;
      case "story_entities":
        context_block = `<ACTIVE_CHARACTERS>\n${ai_character_block}\n${user_persona_block}\n</ACTIVE_CHARACTERS>\n${fractal_setting_block}`;
        subject = "a cinematic group shot featuring both the AI character and user persona together within the fractal environment";
        break;
      case "story_character":
      default:
        context_block = `<ACTIVE_CHARACTERS>\n${render_entity(main_entity === active_user_persona || main_entity?.type === "user" ? "USER_PERSONA" : main_entity?.type === "fractal" ? "FRACTAL" : "AI_CHARACTER", main_entity)}\n</ACTIVE_CHARACTERS>\n${fractal_setting_block}`;
        subject = "a character framed within their environment, emphasizing their presence with an evocative background setting";
        break;
    }

    // --- Cinematic Framing Analysis ---
    const is_fractal_target = tier === "story_scene" || solo_subject?.type === "fractal";
    const ai_dynamics = active_ai_character?.dynamics || {};
    const intensity = Number(ai_dynamics.intensity ?? 50);
    const chaos = Number(ai_dynamics.chaos ?? 50);
    const affinity = Number(ai_dynamics.affinity ?? 50);

    let framing_mode = "Medium Action";
    let framing_tokens = "medium shot, waist-up framing, dynamic posture, clear wardrobe & prop details";

    if (is_fractal_target) {
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

    const visual_staging_directive = context?.visual_staging ? `\n  Staging Directive: ${prompt_escape(context.visual_staging)}` : "";
    const narrative_context_desc =
      tier === "story_entities"
        ? `\n  Group Mandate: Feature both ${prompt_escape(active_ai_character?.name || "AI")} and ${prompt_escape(active_user_persona?.name || "User")} engaged together in their active positions within the fractal environment.`
        : tier === "story_character" && active_fractal_setting && main_entity?.type !== "fractal" && main_entity !== active_fractal_setting
          ? `\n  Character In Scene: Depict ${prompt_escape(main_entity?.name || "Subject")} situated directly within ${prompt_escape(active_fractal_setting.name || "Setting")}.`
          : "";

    const framing_block = `\n<CINEMATOGRAPHY mode="${framing_mode}">\n  ${framing_tokens}${narrative_context_desc}${visual_staging_directive}\n</CINEMATOGRAPHY>`;

    const history_xml = format_sensory_history(history);

    return `
<SYSTEM role="SENSORY_CORTEX">
${protocol_text}
${is_selfie ? '\nPHASE 6: SELFIE MODE EXTENSION\n- Generate a short, in-character social media caption inside "caption".' : ""}
<TARGET>${tier}</TARGET>
${history_xml}<INSTRUCTIONS>
Convert narrative intent into a structured image prompt payload depicting ${subject}.
</INSTRUCTIONS>
<INPUT_INTENT>${prompt_escape(detox_prose(roll(raw_intent)))}</INPUT_INTENT>
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

const NAME_TOKEN_STOPWORDS = new Set([
  "lord",
  "lady",
  "king",
  "queen",
  "prince",
  "princess",
  "sir",
  "dame",
  "dr",
  "doctor",
  "mr",
  "mrs",
  "ms",
  "miss",
  "the",
  "of",
  "and",
  "from",
  "with",
  "von",
  "van",
  "de",
  "la",
  "project",
]);

/**
 * Strips entity proper names from a synthesized diffusion prompt — whole-word,
 * case-insensitive, with possessive handling. Each full name plus its
 * significant capitalized tokens (so a surname like "Silvers" is caught even
 * when the model drops the title), so character names never leak into the
 * image prompt. Only physical descriptions should survive.
 * @param {string} text
 * @param {string[]} [names]
 * @returns {string}
 */
export function strip_proper_names(text, names = []) {
  const set = new Set();
  for (const raw of Array.isArray(names) ? names : []) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const full = raw.trim();
    set.add(full);
    for (const token of full.split(/[^\p{L}\p{N}'\u2019-]+/u)) {
      const t = token.replace(/^['\u2019-]+|['\u2019-]+$/g, "");
      if (t.length < 4 || !/^\p{Lu}/u.test(t) || NAME_TOKEN_STOPWORDS.has(t.toLowerCase())) continue;
      set.add(t);
    }
  }
  const list = [...set].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!list.length) return text;
  const escaped = list.map((n) => n.replace(/[.*+?^$()|[\]\\]/g, "\\$&"));
  const re = new RegExp("\\b(?:" + escaped.join("|") + ")(?:['\u2019]s|['\u2019])?\\b", "gi");
  return text
    .replace(re, "")
    .replace(/\s*,\s*,+/g, ", ")
    .replace(/,\s*([,.;])/g, "$1")
    .replace(/^[\s,;]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Sanitizes a raw LLM image prompt: strips cognition blocks, unwraps JSON structures,
 * detoxes prose, and removes entity proper names (whole-word, possessive-aware).
 * @param {string} raw
 * @param {{ names?: string[] }} [options]
 * @returns {string}
 */
export function clean_image_prompt(raw, options = {}) {
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
  return strip_proper_names(detox_prose(cleaned), options?.names);
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-09-10: clean_image_prompt now accepts { names } and strips entity proper names
 *   (whole-word, possessive-aware) from synthesized diffusion prompts; added strip_proper_names.
 * - 2026-09-04: render_entity now resolves {{...}} macros ({{char}}/{{user}}/{{me}}/{{fractal}}) against each entity's stable identity before compiling PRESENT/ETERNAL blocks, so image prompts never receive raw macro tokens or inverted names.
 * - 2026-09-06: Suppressed empty fallback entity tags in render_entity to avoid generating "Unknown" subjects.
 * - 2026-09-06: Upgraded Optics Builder protocol: affirmative framing, cognitive directive, style keywords, merged spatial geometry, dynamic alternation resolution, and removed outer PROTOCOL wrapper. Fixed fractal recursion and framing.
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
