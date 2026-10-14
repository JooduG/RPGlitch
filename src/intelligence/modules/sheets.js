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
import { strip_epistemic_secrets } from "../veil.js";
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
 * Renders a profile field block (<APPEARANCE>, <PERSONALITY>, <STATE>, etc.) separating compacted
 * attributes from complex child rows. Emits self-closing tag when child rows are empty.
 *
 * @param {string} tag
 * @param {string[]} [rows=[]]
 * @returns {string|null}
 */
export function render_profile_field_block(tag, rows = []) {
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

export const render_physical_block = render_profile_field_block;

/**
 * Parses raw profile state (non-physical or physical) into compacted attributes,
 * child XML elements, or <RELATION target="..."> entity tags.
 *
 * Short entries (<= 40 chars, single line, no quotes) serialize as attributes:
 * `mood="calm"`
 * Complex, multiline, or descriptive entries (> 40 chars) expand into child elements:
 * `<CORE>...</CORE>`
 * Relational brackets ([@TARGET: ...] or [TARGET: ...] matching known entities) expand into:
 * `<RELATION target="slug">...</RELATION>`
 *
 * @param {string|Record<string, any>|null|undefined} raw_value
 * @param {any} [owner_entity=null]
 * @param {any} [entities=null]
 * @param {((value: string) => string)|null} [transform=null]
 * @param {any} [context=null]
 * @param {Map<string, string>|null} [name_to_id_map=null]
 * @returns {string[]}
 */
export function parse_profile_field_rows(raw_value, owner_entity = null, entities = null, transform = null, context = null, name_to_id_map = null) {
  const resolved_value = owner_entity ? render_field_value(raw_value, owner_entity, entities, context) : raw_value;
  const final_value = typeof transform === "function" ? transform(String(resolved_value ?? "")) : resolved_value;
  const parsed = typeof final_value === "string" ? safe_parse_pseudo_json(final_value) : (final_value ?? {});
  if (parsed.__raw_prose__) {
    const prose = prompt_escape(String(parsed.__raw_prose__)).trim();
    return prose ? [prose] : [];
  }

  const known_slugs = new Map();
  if (name_to_id_map instanceof Map) {
    for (const [name, id] of name_to_id_map) {
      known_slugs.set(String(name).toLowerCase().trim(), String(id).toLowerCase().trim());
    }
  }
  if (entities && typeof entities === "object") {
    for (const [entity_role, item] of Object.entries(entities)) {
      if (item?.name) {
        const id_slug = String(item.id || item.name)
          .toLowerCase()
          .trim();
        known_slugs.set(String(item.name).toLowerCase().trim(), id_slug);
        if (item.id) known_slugs.set(String(item.id).toLowerCase().trim(), id_slug);
        if (entity_role) known_slugs.set(String(entity_role).toLowerCase().trim(), id_slug);
      }
    }
  }

  const rows = [];
  if (typeof final_value === "string") {
    const unbracketed = final_value.replace(/\[[^[\]]+\]/g, "").trim();
    if (unbracketed) {
      const prose = prompt_escape(unbracketed).trim();
      if (prose) rows.push(prose);
    }
  }
  for (const [key, raw_entry_val] of Object.entries(parsed)) {
    const clean_key = String(key).trim();
    const entry_values = Array.isArray(raw_entry_val) ? raw_entry_val : [raw_entry_val];

    for (const raw_val of entry_values) {
      const clean_val = String(raw_val ?? "")
        .replace(/\s*\|\s*show\b/gi, "")
        .replace(/\s*\|\s*w:\s*\d+\b/gi, "")
        .trim();
      const string_value = prompt_escape(clean_val).trim();
      if (!string_value) continue;

      const is_explicit_handle = clean_key.startsWith("@");
      const bare_key = clean_key.replace(/^@/, "").trim().toLowerCase();
      const matched_target_id = is_explicit_handle || known_slugs.has(bare_key) ? known_slugs.get(bare_key) || bare_key : null;

      if (matched_target_id) {
        const target_slug = matched_target_id.replace(/\s+/g, "_");
        rows.push(`<RELATION target="${escape_xml(target_slug)}">${string_value}</RELATION>`);
        continue;
      }

      if (string_value.length <= 40 && !string_value.includes("\n") && !string_value.includes('"')) {
        const attr_name = clean_key
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
        if (attr_name) {
          rows.push(`${attr_name}="${string_value}"`);
          continue;
        }
      }

      const tag = clean_key
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, "");
      if (tag) {
        const row = `<${tag}>${string_value}</${tag}>`;
        for (const line of row.split("\n")) {
          const trimmed = line.trim();
          if (trimmed) rows.push(trimmed);
        }
      }
    }
  }
  return rows;
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
  const { is_owner = false, accessors = null, entities = {}, transform_physical = null, relational_context = null, name_to_id = null } = options;
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

  const agenda_rows = parse_profile_field_rows(sanitized_agenda, entity, entities, null, sheet_context, name_to_id);
  const personality_rows = parse_profile_field_rows(personality_raw, entity, entities, null, sheet_context, name_to_id);
  const state_rows = parse_profile_field_rows(state_raw, entity, entities, null, sheet_context, name_to_id);
  const past_rows = parse_profile_field_rows(sanitized_past, entity, entities, null, sheet_context, name_to_id);

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

  return Object.freeze({
    agenda: render_field_value(sanitized_agenda, entity, entities, sheet_context),
    personality: render_field_value(personality_raw, entity, entities, sheet_context),
    state: strip_leading_key_echo(render_field_value(state_raw, entity, entities, sheet_context), specification?.state_strip_keys || []),
    agenda_rows: Object.freeze(agenda_rows),
    personality_rows: Object.freeze(personality_rows),
    state_rows: Object.freeze(state_rows),
    past_rows: Object.freeze(past_rows),
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
    const eternal_block = render_profile_field_block("APPEARANCE", snapshot.eternal_rows);
    if (eternal_block) blocks.push(eternal_block);
    const present_block = render_profile_field_block("CURRENT_LOOK", snapshot.present_rows);
    if (present_block) blocks.push(present_block);
    const attrs = {
      ...(entity.id ? { id: String(entity.id).toUpperCase() } : {}),
      name: entity.name || specification.default_name,
    };
    return render_xml_tag({ tag: specification.tag, attrs, children: blocks, child_indent: 2, separator: "\n" });
  }

  const psychology_blocks = [
    include_agenda ? render_profile_field_block(specification.agenda_key, snapshot.agenda_rows) : null,
    render_profile_field_block(specification.personality_tag, snapshot.personality_rows),
    render_profile_field_block(specification.state_tag, snapshot.state_rows),
    typeof render_axes === "function" && specification.axes_scope ? render_axes(dynamics, specification.axes_scope) : null,
  ].filter(Boolean);

  const section_blocks = [];
  if (psychology_blocks.length) {
    section_blocks.push(render_xml_tag({ tag: specification.psychology_tag, children: psychology_blocks, child_indent: 2, separator: "\n" }));
  }

  if (mode === "separate") {
    const eternal_block = render_profile_field_block("APPEARANCE", snapshot.eternal_rows);
    if (eternal_block) section_blocks.push(eternal_block);
    const present_block = render_profile_field_block("CURRENT_LOOK", snapshot.present_rows);
    if (present_block) section_blocks.push(present_block);
  } else if (snapshot.appearance_rows.length) {
    const appearance_block = render_profile_field_block(specification.appearance_tag, snapshot.appearance_rows);
    if (appearance_block) section_blocks.push(appearance_block);
  }

  if (include_memories) {
    const memory_block = render_profile_field_block(specification.memory_tag, snapshot.past_rows);
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
