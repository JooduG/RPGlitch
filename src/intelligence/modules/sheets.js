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
  create_relational_context,
} from "@utils";
import { PROFILE_FIELD_CATALOG } from "@data";
import { strip_epistemic_secrets, extract_entity_relationships, strip_relational_brackets } from "../veil.js";
import { whole_vector_slice } from "../temporal.js";

export { whole_vector_slice };

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
    tag: overrides.tag || (kind === "fractal" ? "FRACTAL" : "CHARACTER"),
    default_name: overrides.default_name || (kind === "fractal" ? "the setting" : "Character"),
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
  CHARACTER: define_sheet("character", { tag: "CHARACTER", default_name: "Character", owner_state: true }),
  AI_CHARACTER: define_sheet("character", { tag: "CHARACTER", default_name: "Character", owner_state: true }),
  NPC: define_sheet("character", { tag: "CHARACTER", default_name: "NPC", owner_state: true }),
  USER_PERSONA: define_sheet("character", { tag: "CHARACTER", default_name: "User", memory_tag: "BACKSTORY", owner_state: true }),
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
 * Parses raw physical state directly into compacted attributes or child XML tags —
 * macro-resolved, transformed, then expanded via normalize_physical_entries.
 *
 * Short biometrics (<= 40 chars, no newlines/quotes) serialize as attributes:
 * `build="tall and athletic"`
 * Complex or multiline biometrics (> 40 chars) expand into child elements:
 * `<SCARS>...</SCARS>`
 *
 * @param {string|Record<string, any>|null|undefined} raw_value
 * @param {any} [owner_entity]
 * @param {any} [entities]
 * @param {((value: string) => string)|null} [transform]
 * @returns {string[]}
 */
export function parse_physical_rows(raw_value, owner_entity = null, entities = null, transform = null, context = null) {
  const resolved_value = owner_entity ? render_field_value(raw_value, owner_entity, entities, context) : raw_value;
  const final_value = typeof transform === "function" ? transform(String(resolved_value ?? "")) : resolved_value;
  const parsed = typeof final_value === "string" ? safe_parse_pseudo_json(final_value) : (final_value ?? {});
  if (parsed.__raw_prose__) {
    const prose = prompt_escape(String(parsed.__raw_prose__)).trim();
    return prose ? [prose] : [];
  }
  const rows = [];
  for (const [key, value] of Object.entries(normalize_physical_entries(parsed))) {
    const string_value = prompt_escape(String(value ?? "")).trim();
    const clean_key = String(key).trim();
    if (string_value.length <= 40 && !string_value.includes("\n") && !string_value.includes('"')) {
      const attr_name = clean_key.toLowerCase().replace(/\s+/g, "_");
      rows.push(`${attr_name}="${string_value}"`);
    } else {
      const tag = clean_key.toUpperCase().replace(/\s+/g, "_");
      const row = `<${tag}>${string_value}</${tag}>`;
      for (const line of row.split("\n")) {
        const trimmed = line.trim();
        if (trimmed) rows.push(trimmed);
      }
    }
  }
  return rows;
}

/**
 * Merges eternal and present physical rows with present keys overwriting
 * eternal keys in place. Handles both compacted attributes and tag rows.
 *
 * @param {string[]} [eternal_rows=[]]
 * @param {string[]} [present_rows=[]]
 * @returns {string[]}
 */
export function render_appearance_rows(eternal_rows = [], present_rows = []) {
  const merged_entries = [];
  const index_by_key = new Map();
  const extract_key = (row_content) => {
    const attr_match = String(row_content).match(/^([a-z0-9_]+)="/);
    if (attr_match) return attr_match[1].toUpperCase();
    const tag_match = String(row_content).match(/^<([A-Za-z0-9_]+)/);
    if (tag_match) return tag_match[1].toUpperCase();
    return String(row_content);
  };
  for (const row_content of [...(eternal_rows || []), ...(present_rows || [])]) {
    const key = extract_key(row_content);
    if (index_by_key.has(key)) {
      merged_entries[index_by_key.get(key)] = row_content;
    } else {
      index_by_key.set(key, merged_entries.length);
      merged_entries.push(row_content);
    }
  }
  return merged_entries;
}

/**
 * Renders a physical block (<APPEARANCE> or <CURRENT_LOOK>) separating compacted
 * biometric attributes from complex child rows. Emits self-closing tag when child rows are empty.
 *
 * @param {string} tag
 * @param {string[]} [rows=[]]
 * @returns {string|null}
 */
export function render_physical_block(tag, rows = []) {
  if (!rows || !rows.length) return null;
  const attrs = {};
  const children = [];
  for (const row of rows) {
    const attr_match = String(row).match(/^([a-z0-9_]+)="([\s\S]*)"$/);
    if (attr_match) {
      attrs[attr_match[1]] = attr_match[2];
    } else {
      children.push(row);
    }
  }
  const attr_keys = Object.keys(attrs);
  const attr_str = attr_keys.map((k) => `${k}="${attrs[k]}"`).join(" ");
  if (!children.length) {
    return attr_str ? `<${tag} ${attr_str} />` : `<${tag} />`;
  }
  const open = attr_str ? `<${tag} ${attr_str}>` : `<${tag}>`;
  return `${open}\n${children.map((c) => `  ${c}`).join("\n")}\n</${tag}>`;
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
 * Renders directed relational dispositions for an entity toward active scene participants.
 * Sourced primarily from present.non_physical, falling back to eternal.non_physical.
 * Emits individual <DISPOSITION target="slug">dynamic</DISPOSITION> tags without legacy wrappers.
 *
 * @param {any} entity
 * @param {string[]} [active_names=[]]
 * @param {Map<string, string>} [name_to_id_map=null]
 * @param {boolean} [is_owner=false]
 * @param {Record<string, any>} [entities={}]
 * @returns {string[]}
 */
export function render_dispositions(entity, active_names = [], name_to_id_map = null, is_owner = false, entities = {}) {
  if (!entity?.name) return [];
  const rows = [];

  const known_entities = [];
  if (name_to_id_map instanceof Map) {
    for (const [lowercase_name, entity_id] of name_to_id_map) {
      known_entities.push({ id: entity_id, name: lowercase_name });
    }
  } else if (entities && typeof entities === "object") {
    for (const item of Object.values(entities)) {
      if (item?.name) {
        known_entities.push({ id: item.id || item.name, name: item.name });
      }
    }
  }

  const perspective = is_owner ? "owner" : "other";
  const bracket_relationships = extract_entity_relationships(entity, known_entities, perspective, entities);

  const active_names_lc = Array.isArray(active_names) ? active_names.map((n) => String(n).toLowerCase().trim()) : [];

  for (const [target_key, links] of bracket_relationships) {
    const target_normalized = String(target_key).toLowerCase().trim();
    if (
      active_names_lc.length > 0 &&
      !active_names_lc.includes(target_normalized) &&
      !active_names_lc.includes(
        String(links.target_name || "")
          .toLowerCase()
          .trim(),
      )
    ) {
      continue;
    }

    // Phase III 3.9: Present dynamic is the primary source, falling back to eternal
    const dynamic = links.present || links.eternal;
    if (!dynamic || typeof dynamic !== "string" || !dynamic.trim()) continue;

    const target_id = (name_to_id_map instanceof Map && name_to_id_map.get(target_normalized)) || links.target_id || target_key;
    const target_slug = String(target_id).toLowerCase().replace(/\s+/g, "_");

    rows.push(
      render_xml_tag({
        tag: "DISPOSITION",
        attrs: { target: target_slug },
        children: [prompt_escape(dynamic.trim())],
        inline: true,
      }),
    );
  }

  return rows;
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
 * Relational brackets [@TARGET: dynamic | flags] reside natively in state and
 * personality without redundant <DISPOSITIONS> extraction.
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
    transform_physical = null,
    relational_context = null,
    show_dispositions = false,
    active_names = null,
    name_to_id = null,
  } = options;
  const epistemic = specification?.epistemic || {};
  const sanitize = (value, policy) => {
    if (!policy || policy === EPISTEMIC_POLICY.NONE) return value;
    return strip_epistemic_secrets(value, Boolean(is_owner));
  };

  const sheet_context = relational_context?.is_relational_context
    ? create_relational_context({
        owner: entity,
        me: entity,
        you: relational_context.you || (entity?.id === entities.USER?.id ? entities.AI : entities.USER),
        speaker: relational_context.speaker,
        listener: relational_context.listener,
        target: relational_context.target,
        witnesses: relational_context.witnesses,
      })
    : create_relational_context({
        owner: entity,
        me: entity,
        you: entity?.id === entities.USER?.id ? entities.AI : entities.USER,
        speaker: null,
        listener: null,
        target: null,
        witnesses: [],
      });

  const agenda_raw = accessors ? accessors.future(entity, { vector_text: true }) : entity?.future;
  const personality_raw = sanitize(entity?.eternal?.non_physical, epistemic.personality);
  const state_raw = sanitize(entity?.present?.non_physical, epistemic.state);
  const memory_raw = accessors
    ? accessors.past(entity, { vector_text: true })
    : Array.isArray(entity?.past)
      ? join_past_vectors(entity)
      : entity?.past || "";

  const sanitized_agenda = sanitize(agenda_raw, epistemic.agenda);
  const sanitized_past = sanitize(memory_raw, epistemic.memory);
  const eternal_rows = parse_physical_rows(
    sanitize(entity?.eternal?.physical, epistemic.appearance),
    entity,
    entities,
    transform_physical,
    sheet_context,
  );
  const present_rows = parse_physical_rows(
    sanitize(entity?.present?.physical, epistemic.appearance),
    entity,
    entities,
    transform_physical,
    sheet_context,
  );

  const disposition_rows = show_dispositions ? render_dispositions(entity, active_names, name_to_id, is_owner, entities) : [];
  const state_clean = show_dispositions ? strip_relational_brackets(state_raw) : state_raw;

  return Object.freeze({
    agenda: render_field_value(sanitized_agenda, entity, entities, sheet_context),
    personality: render_field_value(personality_raw, entity, entities, sheet_context),
    state: strip_leading_key_echo(render_field_value(state_clean, entity, entities, sheet_context), specification?.state_strip_keys || []),
    disposition_rows: Object.freeze(disposition_rows),
    dispositions: disposition_rows.join("\n"),
    eternal_rows: Object.freeze(eternal_rows),
    present_rows: Object.freeze(present_rows),
    appearance_rows: Object.freeze(render_appearance_rows(eternal_rows, present_rows)),
    past_text: render_field_value(sanitized_past, entity, entities, sheet_context),
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
 * Universal Egalitarian <CHARACTER> envelope unifies all character entities with
 * uppercase canonical id attributes.
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
    relational_context = null,
  } = options;
  if (!entity) return "";

  const snapshot = resolve_sheet_snapshot(entity, specification, {
    is_owner,
    accessors,
    entities,
    transform_physical,
    relational_context,
    show_dispositions,
    active_names,
    name_to_id,
  });

  if (mode === "physical") {
    const blocks = [];
    const eternal_block = render_physical_block("APPEARANCE", snapshot.eternal_rows);
    if (eternal_block) blocks.push(eternal_block);
    const present_block = render_physical_block("CURRENT_LOOK", snapshot.present_rows);
    if (present_block) blocks.push(present_block);
    const attrs = {
      ...(entity.id ? { id: String(entity.id).toUpperCase() } : {}),
      name: entity.name || specification.default_name,
    };
    return render_xml_tag({ tag: specification.tag, attrs, children: blocks, child_indent: 2, separator: "\n" });
  }

  const psychology_blocks = [
    include_agenda ? render_sheet_field(specification.agenda_key, snapshot.agenda) : null,
    render_sheet_field(specification.personality_tag, snapshot.personality),
    render_sheet_field(specification.state_tag, snapshot.state),
    ...(snapshot.disposition_rows || []),
    typeof render_axes === "function" && specification.axes_scope ? render_axes(dynamics, specification.axes_scope) : null,
  ].filter(Boolean);

  const section_blocks = [];
  if (psychology_blocks.length) {
    section_blocks.push(render_xml_tag({ tag: specification.psychology_tag, children: psychology_blocks, child_indent: 2, separator: "\n" }));
  }

  if (mode === "separate") {
    const eternal_block = render_physical_block("APPEARANCE", snapshot.eternal_rows);
    if (eternal_block) section_blocks.push(eternal_block);
    const present_block = render_physical_block("CURRENT_LOOK", snapshot.present_rows);
    if (present_block) section_blocks.push(present_block);
  } else if (snapshot.appearance_rows.length) {
    const appearance_block = render_physical_block(specification.appearance_tag, snapshot.appearance_rows);
    if (appearance_block) section_blocks.push(appearance_block);
  }

  if (include_memories) {
    const memory_block = render_sheet_field(specification.memory_tag, snapshot.past_text);
    if (memory_block) section_blocks.push(memory_block);
  }

  const attrs = {
    ...(entity.id ? { id: String(entity.id).toUpperCase() } : {}),
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
        if (path.endsWith(".physical")) {
          const physical_block = render_physical_block(tag, parse_physical_rows(sanitized_raw_value));
          return physical_block || "";
        }
        const value = escape_xml(sanitized_raw_value.trim());
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
 * - 2026-10-14: Phase C — Task C.1 (Phase III 3.9 LLM Epistemic Dispositions): Implemented render_dispositions and integrated disposition_rows inside psychology_blocks when show_dispositions is enabled; stripped relational brackets from STATE to prevent redundant leakage across the Epistemic Wall; set owner_state on SHEET_SPECS.USER_PERSONA.
 * - 2026-10-14: Phase B — Atom 3.3 RelationalContext tuple wiring: sheets.js forwards relational_context into resolve_sheet_snapshot and parse_physical_rows to resolve live scene participants across @SPEAKER, @LISTENER, @TARGET, and @YOU.
 * - 2026-10-14: Atom 3.4 — Universal <CHARACTER> Envelope & Biometric Compaction (Sub-items 6.5, 6.10, Issues 13 & 2.5). Unifies character sheets to <CHARACTER id="..." name="...">; composes short physical traits (<= 40 chars) into attributes on <APPEARANCE> and <CURRENT_LOOK>; purges redundant <DISPOSITIONS> envelope in favor of native directed relational brackets within state.
 * - 2026-10-14: Atom 3.1 — Epistemic-First Sequencing Invariant (Issue 20). resolve_sheet_snapshot sanitizes past memories and future agendas prior to render_field_value macro expansion with proper owner gating.
 * - 2026-10-06: Plan Omega ground-up rebuild — define_sheet derives all tags from PROFILE_FIELD_CATALOG (epistemic defaults to "always", only owner-state written down); snapshot-first pipeline (resolve_sheet_snapshot normalizes epistemics/vectors/dispositions/physical rows once); direct physical row parsing via normalize_physical_entries (BODY regex round-trip retired); one mode axis (full/physical/separate, VISUAL_SECTIONS retired); render_chapter_history_xml relocated to history.js with structured <CHAPTER> grammar; byte-identical sheet output.
 * - 2026-10-04: Created from entities.js Sections 3-4 + dispositions renderer + Section 6 memory contexts, plus render_chapter_history_xml from history.js — sheet rendering and memory fragments live here; entities.js keeps presence/cast/visibility/assembly.
 * Modules Ground Refactor Phase 1 — render_dispositions reads the frozen active_names array (.includes) — prompt bytes byte-identical.
 */
