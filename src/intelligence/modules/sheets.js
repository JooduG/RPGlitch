/**
 * src/intelligence/modules/sheets.js
 * ============================================================================
 * 📄 ENTITY SHEETS MODULE — Sheet Specs, Snapshots & Unified Renderer
 * ============================================================================
 *
 * Renders entity state into prompt XML through a snapshot-first pipeline:
 *
 * 1. Declarative specs (`define_sheet` + `SHEET_SPECS`) derive every tag from
 *    @data's PROFILE_FIELD_CATALOG. The default epistemic policy is "always";
 *    only "owner" exceptions are written down.
 * 2. `resolve_sheet_snapshot` normalizes one entity once — epistemic
 *    sanitation (via veil.js, driven by the spec's own epistemic map), past
 *    vector joining, disposition resolution, and direct physical row parsing
 *    with no synthetic `<BODY>` round-trip.
 * 3. `render_sheet` maps the frozen snapshot to XML with a single mode axis
 *    (`"full"` | `"physical"` | `"separate"`). No helpers closures, no
 *    stringly section language.
 *
 * entities.js owns presence, cast, visibility, and master assembly; it
 * consumes SHEET_SPECS and render_sheet from here.
 *
 * Epistemic rule: veil.js owns secrecy policy; this module only passes
 * owner/non-owner flags into strip_epistemic_secrets.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation over @utils + @data.
 * - Single source of truth for sheet XML shape.
 * ============================================================================
 */

import {
  escape_xml,
  prompt_escape,
  safe_parse_pseudo_json,
  normalize_physical_entries,
  strip_leading_key_echo,
  render_field_value,
  render_xml_tag,
} from "@utils";
import { PROFILE_FIELD_CATALOG } from "@data";
import { strip_epistemic_secrets, extract_entity_relationships, strip_relational_brackets } from "../veil.js";

// ============================================================================
// [SECTION 1: DECLARATIVE SHEET SPECIFICATIONS]
// ============================================================================

export const EPISTEMIC_POLICY = Object.freeze({ ALWAYS: "always", OWNER: "owner", NONE: "none" });

/**
 * Builds a frozen sheet spec from its taxonomy kind plus sparse overrides.
 * Every tag derives from PROFILE_FIELD_CATALOG; epistemic policy defaults to
 * "always" and only owner-gated fields are declared per spec.
 *
 * @param {"character"|"fractal"} kind
 * @param {Object} [overrides={}]
 * @returns {Object}
 */
export function define_sheet(kind, overrides = {}) {
  const epistemic = {
    agenda: EPISTEMIC_POLICY.ALWAYS,
    personality: EPISTEMIC_POLICY.ALWAYS,
    appearance: EPISTEMIC_POLICY.ALWAYS,
    memory: EPISTEMIC_POLICY.ALWAYS,
    ...(overrides.owner_state === true ? { state: EPISTEMIC_POLICY.OWNER } : {}),
    ...(overrides.epistemic || {}),
  };
  return Object.freeze({
    tag: overrides.tag || "AI_CHARACTER",
    default_name: overrides.default_name || "AI_CHARACTER",
    psychology_tag: "PSYCHOLOGY",
    agenda_key: PROFILE_FIELD_CATALOG[`${kind}.future`].tag,
    personality_tag: PROFILE_FIELD_CATALOG[`${kind}.eternal.non_physical`].tag,
    state_tag: "STATE",
    state_strip_keys: Object.freeze(overrides.state_strip_keys || (kind === "fractal" ? ["CURRENT_STATE", "STATE"] : ["STATE_OF_MIND", "STATE"])),
    appearance_tag: "APPEARANCE",
    memory_tag: overrides.memory_tag || PROFILE_FIELD_CATALOG[`${kind}.past`].tag,
    axes_scope: overrides.axes_scope || (kind === "fractal" ? "fractal" : "somatic"),
    epistemic: Object.freeze(epistemic),
  });
}

export const SHEET_SPECS = Object.freeze({
  AI_CHARACTER: define_sheet("character", { tag: "AI_CHARACTER", default_name: "AI_CHARACTER", owner_state: true }),
  NPC: define_sheet("character", { tag: "NPC", default_name: "NPC", owner_state: true }),
  USER_PERSONA: define_sheet("character", { tag: "USER_PERSONA", default_name: "User", memory_tag: "BACKSTORY" }),
  FRACTAL: define_sheet("fractal", { tag: "FRACTAL", default_name: "the setting" }),
});

// ============================================================================
// [SECTION 2: PHYSICAL PARSING & SYNTHESIS — DIRECT, NO REGEX]
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
 * Parses raw physical state directly into `<TAG>value</TAG>` child rows —
 * macro-resolved, transformed, then expanded via normalize_physical_entries
 * with no synthetic `<BODY>` XML round-trip.
 *
 * @param {string|Record<string, any>|null|undefined} raw_value
 * @param {any} [owner_entity]
 * @param {any} [entities]
 * @param {((value: string) => string)|null} [transform]
 * @returns {string[]}
 */
export function parse_physical_rows(raw_value, owner_entity = null, entities = null, transform = null) {
  const resolved_value = owner_entity ? render_field_value(raw_value, owner_entity, entities) : raw_value;
  const final_value = typeof transform === "function" ? transform(String(resolved_value ?? "")) : resolved_value;
  const parsed = typeof final_value === "string" ? safe_parse_pseudo_json(final_value) : (final_value ?? {});
  if (parsed.__raw_prose__) {
    const prose = prompt_escape(String(parsed.__raw_prose__)).trim();
    return prose ? [prose] : [];
  }
  const rows = [];
  for (const [key, value] of Object.entries(normalize_physical_entries(parsed))) {
    const tag = String(key).replace(/\s+/g, "_");
    const row = `<${tag}>${prompt_escape(String(value))}</${tag}>`;
    for (const line of row.split("\n")) {
      const trimmed = line.trim();
      if (trimmed) rows.push(trimmed);
    }
  }
  return rows;
}

/**
 * Merges eternal and present physical rows with present keys overwriting
 * eternal keys in place.
 *
 * @param {string[]} [eternal_rows=[]]
 * @param {string[]} [present_rows=[]]
 * @returns {string[]}
 */
export function render_appearance_rows(eternal_rows = [], present_rows = []) {
  const merged_entries = [];
  const index_by_tag = new Map();
  const extract_tag_name = (row_content) => {
    const match = String(row_content).match(/^<([A-Za-z0-9_]+)/);
    return match ? match[1].toUpperCase() : String(row_content);
  };
  for (const row_content of [...(eternal_rows || []), ...(present_rows || [])]) {
    const key = extract_tag_name(row_content);
    if (index_by_tag.has(key)) {
      merged_entries[index_by_tag.get(key)] = row_content;
    } else {
      index_by_tag.set(key, merged_entries.length);
      merged_entries.push(row_content);
    }
  }
  return merged_entries;
}

/**
 * Joins an entity's past memory vectors into one newline-delimited text.
 *
 * @param {any} entity
 * @returns {string}
 */
export function join_past_vectors(entity) {
  return (Array.isArray(entity?.past) ? entity.past : [])
    .map((vector) => vector.content || "")
    .filter(Boolean)
    .join("\n");
}

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
  }

  if (!rows.length) return "";
  return render_xml_tag({ tag: "DISPOSITIONS", children: rows, child_indent: 2, separator: "\n" });
}

// ============================================================================
// [SECTION 3: SPEC-AWARE SNAPSHOT RESOLVER]
// ============================================================================

/**
 * Normalizes one entity into a frozen, render-ready snapshot. Epistemic
 * sanitation runs once up front, driven by the spec's own epistemic map —
 * the OWNER-gated `state` field strips as owner only when the viewer owns the
 * sheet, so Director and character views stay byte-identical to the legacy
 * per-field sanitize pass.
 *
 * @param {any} entity
 * @param {Object} specification - Frozen SHEET_SPECS record.
 * @param {Object} [options={}]
 * @returns {Object}
 */
export function resolve_sheet_snapshot(entity, specification, options = {}) {
  const {
    is_owner = false,
    accessors = null,
    entities = {},
    active_names = null,
    name_to_id = null,
    show_dispositions = false,
    transform_physical = null,
  } = options;
  const epistemic = specification?.epistemic || {};
  const sanitize = (value, policy) => {
    if (!policy || policy === EPISTEMIC_POLICY.NONE) return value;
    return strip_epistemic_secrets(value, policy === EPISTEMIC_POLICY.OWNER ? Boolean(is_owner) : false);
  };

  const agenda_raw = accessors ? accessors.future(entity, { vector_text: true }) : entity?.future;
  const personality_raw = sanitize(entity?.eternal?.non_physical, epistemic.personality);
  const state_raw = sanitize(entity?.present?.non_physical, epistemic.state);
  const state_without_relations = strip_relational_brackets(state_raw);
  const memory_raw = accessors
    ? accessors.past(entity, { vector_text: true })
    : Array.isArray(entity?.past)
      ? join_past_vectors(entity)
      : entity?.past || "";

  const eternal_rows = parse_physical_rows(sanitize(entity?.eternal?.physical, epistemic.appearance), entity, entities, transform_physical);
  const present_rows = parse_physical_rows(sanitize(entity?.present?.physical, epistemic.appearance), entity, entities, transform_physical);

  return Object.freeze({
    agenda: sanitize(agenda_raw, epistemic.agenda),
    personality: render_field_value(personality_raw, entity, entities),
    state: strip_leading_key_echo(render_field_value(state_without_relations, entity, entities), specification?.state_strip_keys || []),
    dispositions: show_dispositions && active_names && name_to_id ? render_dispositions(entity, active_names, name_to_id) : "",
    eternal_rows: Object.freeze(eternal_rows),
    present_rows: Object.freeze(present_rows),
    appearance_rows: Object.freeze(render_appearance_rows(eternal_rows, present_rows)),
    past_text: sanitize(memory_raw, epistemic.memory),
  });
}

// ============================================================================
// [SECTION 4: UNIFIED SHEET RENDERER — ONE MODE AXIS]
// ============================================================================

/**
 * Renders one inline `<TAG>content</TAG>` sheet field, or null when blank.
 *
 * @param {string} tag
 * @param {string|null|undefined} content
 * @returns {string|null}
 */
function render_sheet_field(tag, content) {
  const text = String(content ?? "").trim();
  return text ? render_xml_tag({ tag, children: [text], inline: true, child_indent: 2 }) : null;
}

/**
 * Compiles a single entity sheet XML block from its spec and a frozen snapshot.
 * One mode axis: `"full"` renders the complete envelope with a combined
 * `<APPEARANCE>`; `"physical"` renders visual-only separate blocks; `"separate"`
 * renders the full envelope with separate `<APPEARANCE>` / `<CURRENT_LOOK>`.
 *
 * @param {Object} specification
 * @param {Object} [options={}]
 * @returns {string}
 */
export function render_sheet(specification, options = {}) {
  const {
    entity = null,
    entities = {},
    accessors = null,
    mode = "full",
    include_agenda = true,
    include_memories = true,
    show_dispositions = false,
    is_owner = false,
    active_names = null,
    name_to_id = null,
    dynamics = null,
    render_axes = null,
    transform_physical = null,
  } = options;
  if (!entity) return "";

  const snapshot = resolve_sheet_snapshot(entity, specification, {
    is_owner,
    accessors,
    entities,
    active_names,
    name_to_id,
    show_dispositions,
    transform_physical,
  });

  if (mode === "physical") {
    const blocks = [];
    if (snapshot.eternal_rows.length) {
      blocks.push(render_xml_tag({ tag: "APPEARANCE", children: [snapshot.eternal_rows.join("\n")], child_indent: 2 }));
    }
    if (snapshot.present_rows.length) {
      blocks.push(render_xml_tag({ tag: "CURRENT_LOOK", children: [snapshot.present_rows.join("\n")], child_indent: 2 }));
    }
    const attrs = {
      ...(entity.id ? { id: String(entity.id) } : {}),
      name: entity.name || specification.default_name,
    };
    return render_xml_tag({ tag: specification.tag, attrs, children: blocks, child_indent: 2, separator: "\n" });
  }

  const psychology_blocks = [
    include_agenda ? render_sheet_field(specification.agenda_key, snapshot.agenda) : null,
    render_sheet_field(specification.personality_tag, snapshot.personality),
    render_sheet_field(specification.state_tag, snapshot.state),
    snapshot.dispositions || null,
    typeof render_axes === "function" && specification.axes_scope ? render_axes(dynamics, specification.axes_scope) : null,
  ].filter(Boolean);

  const section_blocks = [];
  if (psychology_blocks.length) {
    section_blocks.push(render_xml_tag({ tag: specification.psychology_tag, children: psychology_blocks, child_indent: 2, separator: "\n" }));
  }

  if (mode === "separate") {
    if (snapshot.eternal_rows.length) {
      section_blocks.push(render_xml_tag({ tag: "APPEARANCE", children: [snapshot.eternal_rows.join("\n")], child_indent: 2 }));
    }
    if (snapshot.present_rows.length) {
      section_blocks.push(render_xml_tag({ tag: "CURRENT_LOOK", children: [snapshot.present_rows.join("\n")], child_indent: 2 }));
    }
  } else if (snapshot.appearance_rows.length) {
    section_blocks.push(render_xml_tag({ tag: specification.appearance_tag, children: [snapshot.appearance_rows.join("\n")], child_indent: 2 }));
  }

  if (include_memories) {
    const memory_block = render_sheet_field(specification.memory_tag, snapshot.past_text);
    if (memory_block) section_blocks.push(memory_block);
  }

  const attrs = {
    ...(entity.id ? { id: String(entity.id) } : {}),
    name: entity.name || specification.default_name,
  };
  return render_xml_tag({ tag: specification.tag, attrs, children: section_blocks, child_indent: 2, separator: "\n" });
}

// ============================================================================
// [SECTION 5: CONTEXT ADAPTERS]
// ============================================================================

export function render_entity_memory_context(entity_key, entity) {
  if (!entity) return "";
  const specification = SHEET_SPECS[entity_key] || SHEET_SPECS.AI_CHARACTER;
  return render_sheet(specification, {
    entity,
    mode: "separate",
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
        const value = path.endsWith(".physical") ? parse_physical_rows(sanitized_raw_value).join("\n") : escape_xml(sanitized_raw_value.trim());
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
        : join_past_vectors(entity)
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

/**
 * CHANGELOG
 * - 2026-10-06: Plan Omega ground-up rebuild — define_sheet derives all tags from PROFILE_FIELD_CATALOG (epistemic defaults to "always", only owner-state written down); snapshot-first pipeline (resolve_sheet_snapshot normalizes epistemics/vectors/dispositions/physical rows once); direct physical row parsing via normalize_physical_entries (BODY regex round-trip retired); one mode axis (full/physical/separate, VISUAL_SECTIONS retired); render_chapter_history_xml relocated to history.js with structured <CHAPTER> grammar; byte-identical sheet output.
 * - 2026-10-04: Created from entities.js Sections 3-4 + dispositions renderer + Section 6 memory contexts, plus render_chapter_history_xml from history.js — sheet rendering and memory fragments live here; entities.js keeps presence/cast/visibility/assembly.
 */
