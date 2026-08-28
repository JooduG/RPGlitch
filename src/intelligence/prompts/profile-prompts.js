/**
 * src/intelligence/prompts/profile-prompts.js
 * ✨ PROFILE STUDIO & FIELD ENHANCEMENT PROMPTS
 *
 * Prompts for authoring and profile tooling:
 * - Field Context Compiler (render_enhancement_field_context)
 * - Field Enhancement / Magic Wand Compiler (render_enhancement)
 * - Profile Ingestion & 4-Quadrant Sorting (render_profile_sorting)
 */

import { ind, escape_xml, physical_to_xml, clean_xml } from "@utils";
import { temporal_engine, resolve_vector_pool } from "../temporal-pipeline.js";
import { TEMPORAL_CONTRACT } from "./temporal-prompts.js";
import { render_protocols } from "./shared.js";

/**
 * Flat JSON schema for raw text sorting and ingestion.
 */
export const PROFILE_SCHEMA = `Extract and sort raw text into a flat JSON object with keys:
name (string), description (string), signature_color (string), appearance (string), personality (string), current_look (string), state_of_mind (string), past (array of strings → become memory vectors), future (string).

- description: HUMAN EYES ONLY. Internal notes/OOC info.
- signature_color: Choose from: Soft Rose, Crimson Red, Deep Indigo, Electric Cyan, Emerald Green, Forest Green, Adrenaline Pink, Lemon Yellow, Toxic Green, Scientific Teal, Space Blue, Pumpkin Amber, Proud Purple, Rusty Orange, Twilight Violet.
- appearance / personality: Permanent form vs Core philosophy.
- current_look / state_of_mind: Temporary visual features vs Current mood/mental state.
- past / future: Historical anchors vs Active impulses/intent (a single standing objective string).`;

/**
 * Compiles specific sub-fragment context for field enhancement.
 * @param {any} entity
 * @param {string} field_id
 * @param {string} [content]
 * @param {string} [entity_type]
 * @returns {string}
 */
export function render_enhancement_field_context(entity, field_id, content = "", entity_type = "character") {
  if (!entity) return "";
  const [section, sub] = String(field_id || "").split(".");
  const is_fractal = entity?.type === "fractal" || entity_type === "fractal";
  const kind = is_fractal ? "fractal" : "character";

  if (section && sub && ["eternal", "present"].includes(section)) {
    const FLAT_TAGS = {
      character: {
        eternal: { physical: "PERMANENT_APPEARANCE", non_physical: "PERSONALITY" },
        present: { physical: "CURRENT_LOOK", non_physical: "STATE_OF_MIND" },
      },
      fractal: {
        eternal: { physical: "ENVIRONMENT", non_physical: "METAPHYSICAL_TRUTHS" },
        present: { physical: "ACTIVE_ATMOSPHERE", non_physical: "CURRENT_STATE" },
      },
    };
    const block_for = (sec, sub_key) => {
      const tag = FLAT_TAGS[kind]?.[sec]?.[sub_key];
      if (!tag) return "";
      const raw = entity?.[sec]?.[sub_key];
      const value =
        sub_key === "physical"
          ? physical_to_xml(raw, "PHYSICAL")
              .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
              .trim()
          : escape_xml(String(raw ?? ""));
      if (!value) return "";
      return `<${tag}>\n${ind(value, 8)}\n    </${tag}>`;
    };

    const blocks = [block_for(section, sub)];
    const sibling = sub === "physical" ? "non_physical" : "physical";
    blocks.push(block_for(section, sibling));
    if (section === "present") blocks.push(block_for("eternal", sub));

    const inner = blocks.filter(Boolean).join("\n    ");
    if (!inner) return "";
    return clean_xml(`\n  <ENTITY_CONTEXT>\n    ${inner}\n  </ENTITY_CONTEXT>\n  `).trim();
  }

  if (field_id === "past") {
    const vectors = resolve_vector_pool(entity);
    const text = vectors.length ? temporal_engine.format(vectors, content || "", { max_chars: 1500 }) : "";
    const tag = is_fractal ? "HISTORY" : entity?.type === "user" ? "BACKSTORY" : "MEMORIES";
    return clean_xml(`
  <ENTITY_CONTEXT>
    <${tag}>
      ${ind(escape_xml(text), 6)}
    </${tag}>
  </ENTITY_CONTEXT>
  `).trim();
  }

  if (field_id === "future") {
    const text = String(entity?.future || "").trim();
    const tag = is_fractal || entity?.type === "user" ? "AGENDA" : "INTENT";
    return clean_xml(`
  <ENTITY_CONTEXT>
    <${tag}>
      ${ind(escape_xml(text), 6)}
    </${tag}>
  </ENTITY_CONTEXT>
  `).trim();
  }

  return "";
}

const PROFILE_FORMATS = {
  JSON_ONLY: "Return a single JSON object starting with { and ending with }. No preamble, no markdown backticks, no external XML tags.",
  ENHANCE_IMAGE:
    "Return bracketed configuration: [KEY: value] — one bracket per line, no outer braces, no prose outside the brackets, no code blocks.",
  ENHANCE_ARRAY:
    'Return a JSON array of objects: {"content": string, "emotional_weight": integer (1-10)}. Generate 3-5 NEW distinct memories. Never duplicate a memory already listed in <ENTITY_CONTEXT>.',
  ENHANCE_ARRAY_SINGLE:
    'Rewrite exactly this ONE memory. Return either a JSON array containing a single object {"content": string, "emotional_weight": integer (1-10)} or a plain text string. Never return multiple entries.',
  ENHANCE_AGENDA:
    "Rewrite the standing agenda as ONE consolidated block of 2-5 sentences in active future tense: a clear intent, building pressure, or impending event. Distinct from Present. No story scenes, no dialogue, no past observations, no tag lists.",
  ENHANCE_PROSE: "Write dense profile summary in third-person. Describe traits and drivers. NO story scenes, dialogue, or tag lists.",
};

const PROFILE_MACROS = {
  CHARACTER: "Use placeholder macros for entities: '{{me}}' (self), '{{you}}' (user persona), '{{fractal}}' (setting). Never hardcode names.",
  FRACTAL:
    "Use placeholder macros for entities: '{{user}}' (user persona), '{{char}}' (AI character), '{{fractal}}' (setting). Never hardcode names.",
};

const SORT_CHARACTER = `FOCUS: Extracting data for an individual CHARACTER. Re-contextualize or discard environmental/setting text. ${PROFILE_MACROS.CHARACTER}`;
const SORT_FRACTAL = `FOCUS: Extracting data for a FRACTAL (scene/setting/environment). Re-contextualize or discard character-specific traits. ${PROFILE_MACROS.FRACTAL}`;

const REDISTRIBUTE_DIRECTIVE = `REDISTRIBUTE: The source profile may have content in the wrong field. Move each fact to its correct field — e.g. a temporary state written under 'personality' belongs under 'state_of_mind'; a mood written under 'appearance' belongs under 'current_look'. Sort and relocate; do not merely regenerate in place. Never move content into or out of 'description' (internal OOC notes). Preserve the facts; only their location and phrasing may change.`;

const INGESTION_DIRECTIVE = `<INGESTION_DIRECTIVE Authority="L3_HIGH">
  <RULE name="SOURCE_OF_TRUTH">
    Source text details are absolute truth. Map them verbatim into corresponding schema fields.
  </RULE>
  <RULE name="NO_NULL_FABRICATION">
    If a field (e.g., eye color, attire, height, unstated motivations) is absent from the source text:
    - Synthesize a vivid, lore-consistent default.
    - NEVER emit null, undefined, or empty string values.
  </RULE>
</INGESTION_DIRECTIVE>`;

const THIRD_PERSON_POV =
  "CRITICAL POV MANDATE: Write strictly in third-person limited ('he', 'she', 'they', or entity name). NEVER use first-person pronouns for narrative prose.";

/**
 * Compiles a field enhancement prompt for the profile editor magic wand.
 * @param {any} params
 * @returns {string}
 */
export function render_enhancement({
  enhancer,
  label,
  directive,
  content,
  is_image_field = false,
  is_array_field = false,
  array_mode = "append_new",
  _field_id = "",
  layer_key = "",
  entity = null,
  entity_type = "character",
}) {
  const protocols = ["HYGIENE.DATA"].filter(Boolean).join(", ");
  const format_instruction = is_image_field
    ? PROFILE_FORMATS.ENHANCE_IMAGE
    : is_array_field
      ? array_mode === "patch_single"
        ? PROFILE_FORMATS.ENHANCE_ARRAY_SINGLE
        : PROFILE_FORMATS.ENHANCE_ARRAY
      : _field_id === "future"
        ? PROFILE_FORMATS.ENHANCE_AGENDA
        : PROFILE_FORMATS.ENHANCE_PROSE;
  const macro_instruction = !is_image_field ? (entity_type === "fractal" ? PROFILE_MACROS.FRACTAL : PROFILE_MACROS.CHARACTER) : "";

  return clean_xml(`
<SYSTEM role="${escape_xml(enhancer || "GENERAL")}" enhancing="${escape_xml(label || "")}" field="${escape_xml(_field_id || "")}">
  <INSTRUCTIONS>
    ${ind(escape_xml(directive), 4)}

    ${ind(format_instruction, 4)}
    ${macro_instruction ? `${ind(macro_instruction, 4)}\n` : ""}
  </INSTRUCTIONS>
  <PROTOCOLS>
    ${ind(render_protocols(protocols), 4)}
  </PROTOCOLS>
  <CONTRACT>
    ${ind(escape_xml(TEMPORAL_CONTRACT), 4)}
  </CONTRACT>
  ${layer_key ? `<LAYER>${escape_xml(layer_key)}</LAYER>\n` : ""}
  ${render_enhancement_field_context(entity, _field_id, content, entity_type) || ""}
  <INPUT_CONTENT>
    ${ind(escape_xml(content), 4)}
  </INPUT_CONTENT>
</SYSTEM>
  `).trim();
}

/**
 * Profile Sorting prompt compiler for raw ingested text.
 * @param {'character' | 'fractal' | 'user'} [entity_type]
 * @param {{ ingestion?: boolean, redistribute?: boolean }} [options]
 * @returns {string}
 */
export function render_profile_sorting(entity_type = "character", options = {}) {
  const resolved_type = entity_type === "user" ? "character" : entity_type || "character";
  const protocols = ["HYGIENE.DATA"].filter(Boolean).join(", ");
  const sorting_instruction = resolved_type === "fractal" ? SORT_FRACTAL : SORT_CHARACTER;
  const ingestion_str = options.ingestion ? `\n\n    ${ind(INGESTION_DIRECTIVE, 4)}` : "";
  const redistribute_str = options.redistribute ? `\n\n    ${ind(REDISTRIBUTE_DIRECTIVE, 4)}` : "";

  return clean_xml(`
<SYSTEM role="NARRATIVE_STRUCTURER" enhancing="Entire Profile">
  <INSTRUCTIONS>
    ${ind(escape_xml(PROFILE_SCHEMA), 4)}

    ${ind(escape_xml(THIRD_PERSON_POV), 4)}

    ${ind(sorting_instruction, 4)}${ingestion_str}${redistribute_str}

    ${ind(PROFILE_FORMATS.JSON_ONLY, 4)}
  </INSTRUCTIONS>
  <PROTOCOLS>
    ${ind(render_protocols(protocols), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();
}
