/**
 * src/intelligence/prompts/profile-prompts.js
 * ✨ PROFILE STUDIO & FIELD ENHANCEMENT PROMPTS
 *
 * Prompts for authoring and profile tooling:
 * - Field Context Compiler (render_enhancement_field_context)
 * - Field Enhancement / Magic Wand Compiler (render_enhancement)
 * - Profile Ingestion & 4-Quadrant Sorting (render_profile_sorting)
 */

import { ind, escape_xml, physical_to_xml } from "@utils";
import { PROTOCOL_LIBRARY, ENTITY_FRAGMENTS, TEMPORAL_CONTRACT } from "@data";
import { clean_xml } from "../parser.js";
import { temporal_engine, resolve_vector_pool } from "../temporal-pipeline.js";
import { render_protocols } from "./shared.js";

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

/**
 * Field Enhancement prompt compiler.
 * @param {any} params
 * @returns {string}
 */
export function render_enhancement({
  label,
  directive,
  enhancer,
  content,
  is_image_field = false,
  is_array_field = false,
  array_mode = "append_new",
  _field_id = "",
  layer_key = "",
  entity = null,
  entity_type = "character",
}) {
  const protocols = ["HYGIENE.DATA", "HYGIENE.AFFIRMATIVE"].filter(Boolean).join(", ");
  const format_instruction = is_image_field
    ? PROTOCOL_LIBRARY.FORMATS.ENHANCE_IMAGE
    : is_array_field
      ? array_mode === "patch_single"
        ? PROTOCOL_LIBRARY.FORMATS.ENHANCE_ARRAY_SINGLE
        : PROTOCOL_LIBRARY.FORMATS.ENHANCE_ARRAY
      : _field_id === "future"
        ? PROTOCOL_LIBRARY.FORMATS.ENHANCE_AGENDA
        : PROTOCOL_LIBRARY.FORMATS.ENHANCE_PROSE;
  const macro_instruction = !is_image_field
    ? entity_type === "fractal"
      ? PROTOCOL_LIBRARY.PROFILE.MACROS.FRACTAL
      : PROTOCOL_LIBRARY.PROFILE.MACROS.CHARACTER
    : "";

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
  const protocols = ["HYGIENE.DATA", "HYGIENE.AFFIRMATIVE", "FORMATS.JSON_ONLY"].filter(Boolean).join(", ");
  const sorting_instruction = resolved_type === "fractal" ? PROTOCOL_LIBRARY.PROFILE.SORT_FRACTAL : PROTOCOL_LIBRARY.PROFILE.SORT_CHARACTER;
  const ingestion_directive = options.ingestion ? `\n\n    ${ind(PROTOCOL_LIBRARY.PROFILE.INGESTION_DIRECTIVE, 4)}` : "";
  const redistribute_directive = options.redistribute ? `\n\n    ${ind(PROTOCOL_LIBRARY.PROFILE.REDISTRIBUTE, 4)}` : "";

  return clean_xml(`
<SYSTEM role="${ENTITY_FRAGMENTS.profile[resolved_type]?.enhancer || "ENHANCER"}" enhancing="Entire Profile">
  <INSTRUCTIONS>
    ${ind(escape_xml(PROTOCOL_LIBRARY.PROFILE.SCHEMA), 4)}

    ${ind(escape_xml(PROTOCOL_LIBRARY.POV.THIRD_PERSON), 4)}

    ${ind(sorting_instruction, 4)}${ingestion_directive}${redistribute_directive}
  </INSTRUCTIONS>
  <PROTOCOLS>
    ${ind(render_protocols(protocols), 4)}
  </PROTOCOLS>
</SYSTEM>
  `).trim();
}
