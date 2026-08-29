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
import { PROFILE_FIELDS } from "@data";
import { temporal_engine, resolve_vector_pool } from "../temporal-pipeline.js";
import { TEMPORAL_PROTOCOLS } from "./temporal-prompts.js";
import { render_protocols, PROTOCOL_LIBRARY } from "./shared.js";

// ── 1. Profile Protocols & Directives ─────────────────────────────────────────

export const PROFILE_PROTOCOLS = {
  SCHEMA: `Extract and sort raw text into a flat JSON object with keys:
name (string), description (string), signature_color (string), appearance (string), personality (string), current_look (string), state_of_mind (string), past (array of strings → become memory vectors), future (string).

- description: HUMAN EYES ONLY. Internal notes/OOC info.
- signature_color: Choose from: Soft Rose, Crimson Red, Deep Indigo, Electric Cyan, Emerald Green, Forest Green, Adrenaline Pink, Lemon Yellow, Toxic Green, Scientific Teal, Space Blue, Pumpkin Amber, Proud Purple, Rusty Orange, Twilight Violet.
- appearance / personality: Permanent form vs Core philosophy.
- current_look / state_of_mind: Temporary visual features vs Current mood/mental state.
- past / future: Historical anchors vs Active impulses/intent (a single standing objective string).

Return a single JSON object starting with { and ending with }. No preamble, no markdown backticks, no external XML tags.

- Field values are CLEAN PROSE ONLY: never embed XML tags (e.g. <ETERNAL>, <NON_PHYSICAL>), markdown-bold labels (e.g. **PRESENT.NON_PHYSICAL**), or structural headers inside any value.`,

  FORMATS: {
    ARRAY_APPEND:
      'Return a JSON array of objects: {"content": string, "emotional_weight": integer (1-10)}. Generate 3-5 NEW distinct memories. Never duplicate a memory already listed in <ENTITY_CONTEXT>.',
    ARRAY_SINGLE:
      'Rewrite exactly this ONE memory. Return either a JSON array containing a single object {"content": string, "emotional_weight": integer (1-10)} or a plain text string. Never return multiple entries.',
  },

  MACROS: {
    CHARACTER: "Use placeholder macros for entities: '{{me}}' (self), '{{you}}' (user persona), '{{fractal}}' (setting). Never hardcode names.",
    FRACTAL:
      "Use placeholder macros for entities: '{{user}}' (user persona), '{{char}}' (AI character), '{{fractal}}' (setting). Never hardcode names.",
  },

  SORTING: {
    REDISTRIBUTE: `REDISTRIBUTE: The source profile may have content in the wrong field. Move each fact to its correct field — e.g. a temporary state written under 'personality' belongs under 'state_of_mind'; a mood written under 'appearance' belongs under 'current_look'. Sort and relocate; do not merely regenerate in place. Never move content into or out of 'description' (internal OOC notes). Preserve the facts; only their location and phrasing may change. Strip any XML tags, markdown-bold field labels, or structural headers from values — they contain only clean prose.`,
    INGESTION: `<INGESTION_DIRECTIVE Authority="L3_HIGH">
  <RULE name="SOURCE_OF_TRUTH">
    Source text details are absolute truth. Map them verbatim into corresponding schema fields.
  </RULE>
  <RULE name="NO_NULL_FABRICATION">
    If a field (e.g., eye color, attire, height, unstated motivations) is absent from the source text:
    - Synthesize a vivid, lore-consistent default.
    - NEVER emit null, undefined, or empty string values.
  </RULE>
</INGESTION_DIRECTIVE>`,
  },

  OUTPUT_RULES: {
    PROSE: `OUTPUT RULES:
- Emit ONLY the field content, as plain prose. No preamble, no commentary.
- Do NOT wrap it in JSON, code fences (e.g. \`\`\`json), XML tags (e.g. <ETERNAL>, <NON_PHYSICAL>), markdown-bold labels (e.g. **PRESENT.NON_PHYSICAL**), backticks, or headers.
- No keys, no labels, no scaffolding — just the text itself.`,
    JSON_ARRAY: `OUTPUT RULES:
- Emit ONLY the requested JSON array. No preamble, no commentary.
- Do NOT wrap it in code fences (e.g. \`\`\`json), XML tags, or markdown.
- Return valid JSON only.`,
    BRACKETS: `OUTPUT RULES:
- Emit ONLY the bracketed [KEY: value] configuration, one bracket per line.
- Do NOT wrap it in JSON, code fences (e.g. \`\`\`json), XML tags, markdown-bold labels, or headers.`,
    JSON_OBJECT: `OUTPUT RULES:
- Emit ONLY the requested JSON object, starting with { and ending with }. No preamble, no commentary.
- Do NOT wrap it in code fences (e.g. \`\`\`json), XML tags, or markdown.
- Return valid JSON only.`,
  },
};

// ── 2. Field Context Compiler ────────────────────────────────────────────────

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
    const block_for = (sec, sub_key) => {
      const field_def = PROFILE_FIELDS[sec]?.[sub_key]?.[kind];
      const tag = field_def?.label ? field_def.label.toUpperCase().replace(/\s+/g, "_") : "";
      if (!tag) return "";
      const raw = entity?.[sec]?.[sub_key];
      const value =
        sub_key === "physical"
          ? physical_to_xml(raw, "PHYSICAL")
              .replace(/<PHYSICAL>|<\/PHYSICAL>/g, "")
              .trim()
          : escape_xml(String(raw ?? "").trim());
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

  if (field_id === "past" || field_id === "future") {
    const is_past = field_id === "past";
    const tag = is_past ? PROFILE_FIELDS.past.label.toUpperCase() : "AGENDA";
    const text = is_past
      ? resolve_vector_pool(entity).length
        ? temporal_engine.format(resolve_vector_pool(entity), content || "", { max_chars: 1500 })
        : ""
      : String(entity?.future || "").trim();
    if (!text) return "";
    return clean_xml(`\n  <ENTITY_CONTEXT>\n    <${tag}>\n      ${ind(escape_xml(text), 6)}\n    </${tag}>\n  </ENTITY_CONTEXT>\n  `).trim();
  }

  return "";
}

// ── 3. Prompt Compilers ──────────────────────────────────────────────────────

/**
 * Compiles a field enhancement prompt for the profile editor magic wand.
 * @param {Object} params
 * @param {string} [params.enhancer]
 * @param {string} [params.label]
 * @param {string} [params.directive]
 * @param {string} [params.content]
 * @param {boolean} [params.is_image_field]
 * @param {boolean} [params.is_array_field]
 * @param {string} [params.array_mode]
 * @param {string} [params.field_id]
 * @param {string} [params.layer_key]
 * @param {any} [params.entity]
 * @param {string} [params.entity_type]
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
  field_id = "",
  layer_key = "",
  entity = null,
  entity_type = "character",
}) {
  const format_instruction = is_array_field
    ? array_mode === "patch_single"
      ? PROFILE_PROTOCOLS.FORMATS.ARRAY_SINGLE
      : PROFILE_PROTOCOLS.FORMATS.ARRAY_APPEND
    : "";
  const macro_instruction = !is_image_field
    ? entity_type === "fractal"
      ? PROFILE_PROTOCOLS.MACROS.FRACTAL
      : PROFILE_PROTOCOLS.MACROS.CHARACTER
    : "";
  const output_rules = is_array_field
    ? PROFILE_PROTOCOLS.OUTPUT_RULES.JSON_ARRAY
    : field_id.endsWith(".physical") || is_image_field
      ? PROFILE_PROTOCOLS.OUTPUT_RULES.BRACKETS
      : PROFILE_PROTOCOLS.OUTPUT_RULES.PROSE;

  return clean_xml(`
<SYSTEM role="${escape_xml(enhancer || "GENERAL")}" enhancing="${escape_xml(label || "")}" field="${escape_xml(field_id)}">
  <INSTRUCTIONS>
    ${ind(escape_xml(directive), 4)}
    ${format_instruction ? `\n\n    ${ind(format_instruction, 4)}` : ""}
    ${macro_instruction ? `\n\n    ${ind(macro_instruction, 4)}` : ""}
    ${output_rules ? `\n\n    ${ind(output_rules, 4)}` : ""}
  </INSTRUCTIONS>
  <PROTOCOLS>
    ${ind(render_protocols("HYGIENE.DATA"), 4)}
  </PROTOCOLS>
  <CONTRACT>
    ${ind(escape_xml(TEMPORAL_PROTOCOLS.CONTRACT), 4)}
  </CONTRACT>
  ${layer_key ? `<LAYER>${escape_xml(layer_key)}</LAYER>\n` : ""}
  ${render_enhancement_field_context(entity, field_id, content, entity_type) || ""}
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
  const focus_directive =
    resolved_type === "fractal"
      ? `FOCUS: Extracting data for a FRACTAL (scene/setting/environment). Re-contextualize or discard character-specific traits. ${PROFILE_PROTOCOLS.MACROS.FRACTAL}`
      : `FOCUS: Extracting data for an individual CHARACTER. Re-contextualize or discard environmental/setting text. ${PROFILE_PROTOCOLS.MACROS.CHARACTER}`;
  const ingestion_str = options.ingestion ? `\n\n    ${ind(PROFILE_PROTOCOLS.SORTING.INGESTION, 4)}` : "";
  const redistribute_str = options.redistribute ? `\n\n    ${ind(PROFILE_PROTOCOLS.SORTING.REDISTRIBUTE, 4)}` : "";
  const output_rules_str = `\n\n    ${ind(PROFILE_PROTOCOLS.OUTPUT_RULES.JSON_OBJECT, 4)}`;

  return clean_xml(`
<SYSTEM role="NARRATIVE_STRUCTURER" enhancing="Entire Profile">
  <INSTRUCTIONS>
    ${ind(escape_xml(PROFILE_PROTOCOLS.SCHEMA), 4)}

    ${ind(escape_xml(PROTOCOL_LIBRARY.POV.THIRD_PERSON), 4)}

    ${ind(focus_directive, 4)}${ingestion_str}${redistribute_str}${output_rules_str}
  </INSTRUCTIONS>
  <PROTOCOLS>
    ${ind(render_protocols("HYGIENE.DATA"), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();
}

/**
 * CHANGELOG
 * - 2026-08-28: Ground-up deconstruct & refactor: streamlined field context rendering, standardized parameter naming, and removed redundant string/regex wrappers.
 */
