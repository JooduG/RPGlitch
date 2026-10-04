/**
 * src/intelligence/modules/sheets.js
 * ============================================================================
 * 📄 ENTITY SHEETS MODULE — Sheet Specs, Field Renderers & Memory Fragments
 * ============================================================================
 *
 * Renders entity state into prompt XML: physical-state synthesis, declarative
 * sheet blueprints (SHEET_SPECS + universal render_sheet compiler), auxiliary
 * memory contexts (target memory, enhancement field context, chapter
 * milestones), and directed relational dispositions. entities.js owns presence,
 * cast, visibility, and master assembly; it consumes render_sheet and the
 * sheet specs from here.
 *
 * Epistemic rule: veil.js owns secrecy policy; this module only passes
 * owner/non-owner flags into strip_epistemic_secrets.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation over @utils + @data.
 * - Single source of truth for sheet XML shape.
 * ============================================================================
 */

import { escape_xml, prompt_escape, physical_to_xml, strip_leading_key_echo, render_field_value, render_xml_tag, truncate_at_word } from "@utils";
import { PROFILE_FIELD_CATALOG } from "@data";
import { strip_epistemic_secrets, extract_entity_relationships, strip_relational_brackets } from "../veil.js";

// ============================================================================
// [SECTION 1: DIRECTED RELATIONAL DISPOSITIONS]
// ============================================================================

/**
 * Renders directed relational dispositions for an entity toward other active present participants.
 * Sourced 100% from universal bracket predicates via veil.js.
 *
 * @param {any} entity
 * @param {Set<string>} active_names
 * @param {Map<string, string>} name_to_id_map
 * @returns {string}
 */
export function render_dispositions(entity, active_names, name_to_id_map) {
  if (!entity?.name) return "";
  const rows = [];
  const handled_targets = new Set();

  // Build entity objects so extract_entity_relationships can populate id_to_name,
  // enabling resolution of ID-keyed brackets like [@SILVERS: ...] where "SILVERS"
  // is the entity.id rather than the entity.name.
  const active_entity_objects = [];
  for (const [lowercase_name, entity_id] of name_to_id_map) {
    active_entity_objects.push({ id: entity_id, name: lowercase_name });
  }

  const bracket_relationships = extract_entity_relationships(entity, active_entity_objects);

  for (const [target_key, links] of bracket_relationships) {
    const target_normalized = target_key.toLowerCase().trim();
    if (!active_names.has(target_normalized)) continue;

    const dynamic = links.present || links.eternal;
    if (!dynamic) continue;

    const target_id = name_to_id_map.get(target_normalized) || target_key;
    rows.push(
      render_xml_tag({
        tag: "DISPOSITION",
        attrs: { target: target_id },
        children: [prompt_escape(dynamic)],
        inline: true,
      }),
    );
    handled_targets.add(target_normalized);
  }

  if (!rows.length) return "";
  return render_xml_tag({ tag: "DISPOSITIONS", children: rows, child_indent: 2, separator: "\n" });
}

// ============================================================================

// ============================================================================
// [SECTION 2: PHYSICAL STATE SYNTHESIS]
// ============================================================================

/**
 * Resolves the canonical XML tag for an entity profile path from @data's PROFILE_FIELD_CATALOG.
 *
 * @param {"character"|"fractal"} entity_kind
 * @param {string} path - Dot path (e.g., "eternal.non_physical", "future").
 * @param {string} [fallback=""]
 * @returns {string}
 */
export function resolve_profile_field_tag(entity_kind, path, fallback = "") {
  return PROFILE_FIELD_CATALOG[`${entity_kind}.${path}`]?.tag || fallback;
}

/**
 * Resolves a nested dot-notation field value from an entity object.
 *
 * @param {any} entity
 * @param {string} path - Dot-separated field path (e.g. "eternal.physical", "future").
 * @returns {any}
 */
export function resolve_entity_field_value(entity, path) {
  if (!entity || !path) return undefined;
  return path.split(".").reduce((target, key) => (target != null ? target[key] : undefined), entity);
}

/**
 * Extracts and unboxes inner XML body rows from a physical definition.
 *
 * @param {string|Record<string, any>|null|undefined} raw_value
 * @param {any} [owner_entity]
 * @param {any} [entities]
 * @param {((value: string) => string)|null} [transform]
 * @returns {string}
 */
export function extract_physical_body(raw_value, owner_entity, entities, transform = null) {
  const resolved_value = owner_entity ? render_field_value(raw_value, owner_entity, entities) : raw_value;
  const final_value = typeof transform === "function" ? transform(String(resolved_value ?? "")) : resolved_value;
  const xml_output = physical_to_xml(final_value, "BODY");
  if (!xml_output) return "";

  const structured_match = xml_output.match(/^ {2}<BODY>\n([\s\S]*?)\n {2}<\/BODY>$/);
  if (structured_match) return structured_match[1];

  const prose_match = xml_output.match(/^ {2}<BODY>([\s\S]*?)<\/BODY>$/);
  return prose_match && prose_match[1].trim() ? prose_match[1].trim() : "";
}

/**
 * Expands physical state into individual trimmed XML child rows.
 *
 * @param {string|null|undefined} raw_value
 * @param {any} owner_entity
 * @param {any} entities
 * @param {((value: string) => string)|null} [transform]
 * @returns {string[]}
 */
export function extract_physical_rows(raw_value, owner_entity, entities, transform = null) {
  const body_content = extract_physical_body(raw_value, owner_entity, entities, transform);
  return body_content
    ? body_content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
}

/**
 * Synthesizes eternal and present into a single unified physical block (<APPEARANCE>).
 *
 * @param {string|null|undefined} eternal_text
 * @param {string|null|undefined} present_text
 * @param {any} owner_entity
 * @param {any} entities
 * @param {string} [tag="APPEARANCE"]
 * @param {((value: string) => string)|null} [transform]
 * @returns {string}
 */
export function render_appearance(eternal_text, present_text, owner_entity, entities, tag = "APPEARANCE", transform = null) {
  const merged_entries = [];
  const index_by_tag = new Map();

  const extract_tag_name = (row_content) => {
    const match = String(row_content).match(/^<([A-Za-z0-9_]+)/);
    return match ? match[1].toUpperCase() : String(row_content);
  };

  const all_rows = [
    ...extract_physical_rows(eternal_text, owner_entity, entities, transform),
    ...extract_physical_rows(present_text, owner_entity, entities, transform),
  ];

  for (const row_content of all_rows) {
    const key = extract_tag_name(row_content);
    if (index_by_tag.has(key)) {
      merged_entries[index_by_tag.get(key)] = row_content;
    } else {
      index_by_tag.set(key, merged_entries.length);
      merged_entries.push(row_content);
    }
  }

  if (!merged_entries.length) return "";
  return render_xml_tag({ tag, children: [merged_entries.join("\n")], child_indent: 2 });
}

// ============================================================================
// [SECTION 3: DECLARATIVE SHEET BLUEPRINTS & UNIVERSAL COMPILER]
// ============================================================================

export const EPISTEMIC_POLICY = Object.freeze({ ALWAYS: "always", OWNER: "owner", NONE: "none" });

const EPISTEMIC_OWNER_STATE = Object.freeze({
  agenda: EPISTEMIC_POLICY.ALWAYS,
  personality: EPISTEMIC_POLICY.ALWAYS,
  state: EPISTEMIC_POLICY.OWNER,
  appearance: EPISTEMIC_POLICY.ALWAYS,
  memory: EPISTEMIC_POLICY.ALWAYS,
});

const EPISTEMIC_ALWAYS = Object.freeze({
  agenda: EPISTEMIC_POLICY.ALWAYS,
  personality: EPISTEMIC_POLICY.ALWAYS,
  state: EPISTEMIC_POLICY.ALWAYS,
  appearance: EPISTEMIC_POLICY.ALWAYS,
  memory: EPISTEMIC_POLICY.ALWAYS,
});

const CHARACTER_SHEET_BASE = Object.freeze({
  psychology_tag: "PSYCHOLOGY",
  agenda_key: PROFILE_FIELD_CATALOG["character.future"].tag,
  personality_tag: PROFILE_FIELD_CATALOG["character.eternal.non_physical"].tag,
  state_tag: "STATE",
  state_strip_keys: Object.freeze(["STATE_OF_MIND", "STATE"]),
  appearance_tag: "APPEARANCE",
  memory_tag: PROFILE_FIELD_CATALOG["character.past"].tag,
  axes_scope: "somatic",
  epistemic: EPISTEMIC_OWNER_STATE,
});

export const SHEET_SPECS = Object.freeze({
  AI_CHARACTER: Object.freeze({
    ...CHARACTER_SHEET_BASE,
    tag: "AI_CHARACTER",
    default_name: "AI_CHARACTER",
  }),
  NPC: Object.freeze({
    ...CHARACTER_SHEET_BASE,
    tag: "NPC",
    default_name: "NPC",
  }),
  USER_PERSONA: Object.freeze({
    ...CHARACTER_SHEET_BASE,
    tag: "USER_PERSONA",
    default_name: "User",
    memory_tag: "BACKSTORY",
    axes_scope: "somatic",
    epistemic: EPISTEMIC_ALWAYS,
  }),
  FRACTAL: Object.freeze({
    tag: "FRACTAL",
    default_name: "the setting",
    psychology_tag: "PSYCHOLOGY",
    agenda_key: PROFILE_FIELD_CATALOG["fractal.future"].tag,
    personality_tag: PROFILE_FIELD_CATALOG["fractal.eternal.non_physical"].tag,
    state_tag: "STATE",
    state_strip_keys: Object.freeze(["CURRENT_STATE", "STATE"]),
    appearance_tag: "APPEARANCE",
    memory_tag: PROFILE_FIELD_CATALOG["fractal.past"].tag,
    axes_scope: "fractal",
    epistemic: EPISTEMIC_ALWAYS,
  }),
});

const SHEET_SECTIONS = Object.freeze([
  Object.freeze({ wrapper: "psychology_tag", fields: Object.freeze(["agenda", "personality", "state", "dispositions", "axes"]) }),
  Object.freeze({ wrapper: null, fields: Object.freeze(["physical"]) }),
  Object.freeze({ wrapper: null, fields: Object.freeze(["memory"]) }),
]);

export const VISUAL_SECTIONS = Object.freeze([Object.freeze({ wrapper: null, fields: Object.freeze(["physical"]) })]);

const SHEET_FIELD_RENDERERS = Object.freeze({
  agenda(specification, context, helpers) {
    if (!context.include_agenda) return "";
    const agenda_raw = context.accessors ? context.accessors.future(context.entity, { vector_text: true }) : context.entity?.future;
    return helpers.render_sheet_field(specification.agenda_key, helpers.sanitize(agenda_raw, specification.epistemic.agenda)) || "";
  },

  personality(specification, context, helpers) {
    const personality_raw = helpers.sanitize(context.entity.eternal?.non_physical, specification.epistemic.personality);
    return helpers.render_sheet_field(specification.personality_tag, render_field_value(personality_raw, context.entity, context.entities)) || "";
  },

  state(specification, context, helpers) {
    const state_raw = helpers.sanitize(context.entity.present?.non_physical, specification.epistemic.state);
    // Strip @-prefixed relational brackets — those belong exclusively in <DISPOSITIONS>
    // so they never leak across the Epistemic Wall through the STATE field.
    const state_without_relations = strip_relational_brackets(state_raw);
    const state_content = strip_leading_key_echo(
      render_field_value(state_without_relations, context.entity, context.entities),
      specification.state_strip_keys,
    );
    return helpers.render_sheet_field(specification.state_tag, state_content) || "";
  },

  dispositions(specification, context) {
    if (!context.show_dispositions || !context.active_names || !context.name_to_id) return "";
    return render_dispositions(context.entity, context.active_names, context.name_to_id) || "";
  },

  axes(specification, context) {
    if (typeof context.render_axes !== "function" || !specification.axes_scope) return "";
    return context.render_axes(context.dynamics, specification.axes_scope) || "";
  },

  physical(specification, context, helpers) {
    const transform = context.transform_physical;
    if (context.physical_mode === "separate") {
      const blocks = [];
      for (const [field_path, tag] of [
        ["eternal.physical", "APPEARANCE"],
        ["present.physical", "CURRENT_LOOK"],
      ]) {
        const raw_value = helpers.sanitize(resolve_entity_field_value(context.entity, field_path), specification.epistemic.appearance);
        const body = extract_physical_body(raw_value, context.entity, context.entities, transform);
        if (body) blocks.push(render_xml_tag({ tag, children: [body], child_indent: 2 }));
      }
      return blocks.join("\n");
    }

    return render_appearance(
      helpers.sanitize(context.entity.eternal?.physical, specification.epistemic.appearance),
      helpers.sanitize(context.entity.present?.physical, specification.epistemic.appearance),
      context.entity,
      context.entities,
      specification.appearance_tag,
      transform,
    );
  },

  memory(specification, context, helpers) {
    if (!context.include_memories) return "";
    const memory_raw = context.accessors
      ? context.accessors.past(context.entity, { vector_text: true })
      : Array.isArray(context.entity?.past)
        ? context.entity.past
            .map((vector) => vector.content || "")
            .filter(Boolean)
            .join("\n")
        : context.entity?.past || "";
    return helpers.render_sheet_field(specification.memory_tag, helpers.sanitize(memory_raw, specification.epistemic.memory)) || "";
  },
});

/**
 * Compiles a single entity sheet XML block.
 *
 * @param {Object} specification
 * @param {Object} context
 * @returns {string}
 */
export function render_sheet(specification, context) {
  if (!context?.entity) return "";

  const view = {
    include_agenda: true,
    include_memories: true,
    show_dispositions: false,
    physical_mode: "combined",
    is_owner: false,
    ...context,
  };
  const sections = view.sections || SHEET_SECTIONS;
  const sanitize = (value, policy) => {
    if (!policy || policy === EPISTEMIC_POLICY.NONE) return value;
    return strip_epistemic_secrets(value, policy === EPISTEMIC_POLICY.OWNER ? Boolean(view.is_owner) : false);
  };
  const render_sheet_field = (tag, content) => {
    const text = String(content ?? "").trim();
    return text ? render_xml_tag({ tag, children: [text], inline: true, child_indent: 2 }) : null;
  };
  const helpers = { sanitize, render_sheet_field };

  const section_blocks = [];
  for (const section of sections) {
    const field_blocks = section.fields.map((field_name) => SHEET_FIELD_RENDERERS[field_name](specification, view, helpers)).filter(Boolean);
    if (!field_blocks.length) continue;
    if (section.wrapper) {
      section_blocks.push(render_xml_tag({ tag: specification[section.wrapper], children: field_blocks, child_indent: 2, separator: "\n" }));
    } else {
      section_blocks.push(field_blocks.join("\n"));
    }
  }

  const attrs = {
    ...(view.entity.id ? { id: String(view.entity.id) } : {}),
    name: view.entity.name || specification.default_name,
  };
  return render_xml_tag({ tag: specification.tag, attrs, children: section_blocks, child_indent: 2, separator: "\n" });
}
// ============================================================================
// [SECTION 4: AUXILIARY MEMORY CONTEXTS]
// ============================================================================

export function render_entity_memory_context(entity_key, entity) {
  if (!entity) return "";
  const specification = SHEET_SPECS[entity_key] || SHEET_SPECS.AI_CHARACTER;
  return render_sheet(specification, {
    entity,
    physical_mode: "separate",
    is_owner: true,
    include_agenda: true,
  });
}

export function render_enhancement_field_context(entity, field_identifier, content = "", entity_type = "character", format_past_function = null) {
  if (!entity) return "";
  const [section_name, subsection_name] = String(field_identifier || "").split(".");
  const is_fractal = entity?.type === "fractal" || entity_type === "fractal";
  const entity_kind = is_fractal ? "fractal" : "character";

  if (section_name && subsection_name && ["eternal", "present"].includes(section_name)) {
    const sibling_subsection = subsection_name === "physical" ? "non_physical" : "physical";
    const target_paths = [`${section_name}.${sibling_subsection}`, ...(section_name === "present" ? [`eternal.${subsection_name}`] : [])];

    const inner_blocks = target_paths
      .map((path) => {
        const tag = path.endsWith(".physical")
          ? path.startsWith("present")
            ? "CURRENT_LOOK"
            : "APPEARANCE"
          : resolve_profile_field_tag(entity_kind, path);
        if (!tag) return "";
        const raw_value = resolve_entity_field_value(entity, path);
        const sanitized_raw_value = strip_epistemic_secrets(String(raw_value ?? ""));
        const value = path.endsWith(".physical") ? extract_physical_body(sanitized_raw_value) : escape_xml(sanitized_raw_value.trim());
        if (!value) return "";
        return render_xml_tag({ tag, children: [value], child_indent: 2 });
      })
      .filter(Boolean);

    if (!inner_blocks.length) return "";
    return render_xml_tag({
      tag: "ENTITY_CONTEXT",
      children: [inner_blocks.join("\n")],
      indent: 2,
      child_indent: 2,
    });
  }

  if (field_identifier === "past" || field_identifier === "future") {
    const is_past = field_identifier === "past";
    const tag = resolve_profile_field_tag(entity_kind, field_identifier, is_past ? "MEMORIES" : "AGENDA");
    const text = is_past
      ? typeof format_past_function === "function"
        ? format_past_function(entity, content)
        : (Array.isArray(entity?.past) ? entity.past : [])
            .map((vector) => vector.content || "")
            .filter(Boolean)
            .join("\n")
      : String(entity?.future || "").trim();

    if (!text) return "";
    return render_xml_tag({
      tag: "ENTITY_CONTEXT",
      children: [render_xml_tag({ tag, children: [escape_xml(text)], child_indent: 6 })],
      indent: 2,
      child_indent: 4,
    });
  }

  return "";
}
// ============================================================================
// ============================================================================
// [SECTION 5: EPISODIC CHAPTER MILESTONES]
// ============================================================================

/**
 * Renders an entity's closed-chapter milestone boundaries into a structured <CHAPTER_HISTORY> XML block.
 * Symmetrically activated when `config.entities.chapter_history` is enabled.
 *
 * @param {any} target_entity
 * @param {number} [indentation_level=0]
 * @returns {string}
 */
export function render_chapter_history_xml(target_entity, indentation_level = 0) {
  const chapters = Array.isArray(target_entity?.chapters) ? target_entity.chapters : [];
  const closed_chapters = chapters.filter((chapter) => chapter?.status === "closed");
  if (!closed_chapters.length) return "";

  const chapter_rows = closed_chapters.slice(-6).map((chapter) => {
    const raw_title = String(chapter.title || "Untitled").trim();
    const normalized_title = raw_title.replace(/^Chapter\s+/i, "");
    const clean_summary = truncate_at_word(String(chapter.summary || ""), 220);
    return `- Chapter ${escape_xml(normalized_title)}: ${escape_xml(clean_summary)}`;
  });

  return render_xml_tag({
    tag: "CHAPTER_HISTORY",
    children: chapter_rows,
    indent: indentation_level,
    separator: "\n",
  });
}

/**
 * CHANGELOG
 * - 2026-10-04: Created from entities.js Sections 3-4 + dispositions renderer + Section 6 memory contexts, plus render_chapter_history_xml from history.js — sheet rendering and memory fragments live here; entities.js keeps presence/cast/visibility/assembly.
 */
