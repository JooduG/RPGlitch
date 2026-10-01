/**
 * src/intelligence/modules/entities.js
 * ============================================================================
 * 👥 CONSOLIDATED ENTITIES MODULE — Spatial Presence, Cast Sheets & Dispositions
 * ============================================================================
 *
 * Single authoritative module orchestrating entity spatial presence, relational
 * dispositions, cast formatting, entity sheet specifications (SHEET_SPECS),
 * single-entity sheet compilation (render_sheet), master entities assembly
 * (render_entity_sheets), and auxiliary snapshot contexts (memory & enhancement).
 *
 * Formed by consolidating `presence.js` and `sheets.js` under P4 Zero Backwards
 * Compatibility.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string and structured XML compilation.
 * - Single source of truth for entity XML layouts across all simulation modes.
 * - Relational dispositions harvested 100% from universal bracket predicates
 *   via veil.js (`extract_entity_relationships`).
 * - Strict Full-Name domain nomenclature.
 * ============================================================================
 */

import {
  escape_xml,
  prompt_escape,
  physical_to_xml,
  strip_leading_key_echo,
  render_field_value,
  indent_continuation,
  render_xml_tag,
  strip_visual_excluded,
  collapse_whitespace,
  truncate_at_word,
} from "@utils";
import { PROFILE_FIELD_CATALOG } from "@data";
import { strip_epistemic_secrets, extract_entity_relationships, strip_relational_brackets } from "../veil.js";

// ============================================================================
// [SECTION 1: SPATIAL PRESENCE & RELATIONAL TOPOLOGY]
// ============================================================================

/**
 * Resolves simulation entities into active present participants, dormant candidates,
 * and relational lookup indices.
 *
 * @param {Object} [parameters]
 * @param {Record<string, any>} [parameters.entities={}]
 * @param {any[]} [parameters.npc_entities=[]]
 * @param {string[]} [parameters.in_scene_ids=[]]
 * @returns {{
 *   present: any[],
 *   dormant: any[],
 *   name_to_id: Map<string, string>,
 *   active_names: Set<string>
 * }}
 */
export function resolve_available_entities({ entities = {}, npc_entities = [], in_scene_ids = [] } = {}) {
  const in_scene_set = new Set((in_scene_ids || []).filter(Boolean).map(String));
  const active_trio_ids = new Set([entities.AI?.id, entities.USER?.id, entities.FRACTAL?.id].filter(Boolean).map(String));

  const present = [];
  const dormant = [];
  const name_to_id = new Map();
  const active_names = new Set();

  const register_entity = (entity, is_present) => {
    if (!entity?.name) return;
    const normalized_name = String(entity.name).toLowerCase().trim();
    name_to_id.set(normalized_name, entity.id || entity.name);
    if (is_present) {
      active_names.add(normalized_name);
      present.push(entity);
    } else {
      dormant.push(entity);
    }
  };

  for (const entity of [entities.AI, entities.USER, entities.FRACTAL]) {
    if (entity) register_entity(entity, true);
  }

  for (const npc_entity of npc_entities || []) {
    if (!npc_entity || active_trio_ids.has(String(npc_entity.id))) continue;
    register_entity(npc_entity, in_scene_set.has(String(npc_entity.id)));
  }

  return { present, dormant, name_to_id, active_names };
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

/**
 * Renders concise entries for nearby secondary entities or ambient participants as a
 * `<CAST mode="nearby">` block.
 *
 * @param {any[]|Record<string, any>} [entities=[]]
 * @param {Object} [options={}]
 * @param {string} [options.exclude_id=null]
 * @param {string} [options.exclude_key=null]
 * @param {number} [options.indent=0]
 * @returns {string}
 */
export function render_nearby_entities_xml(entities = [], options = {}) {
  const { exclude_id = null, exclude_key = null, indent = 0 } = options;
  const entity_list = Array.isArray(entities)
    ? entities
    : Object.entries(entities || {}).map(([key, entity]) => ({
        ...entity,
        role: entity?.role || key,
        _key: key,
      }));

  const rows = [];

  for (const entity of entity_list) {
    if (!entity?.name) continue;
    const entity_id = String(entity.id || entity.name);
    if (exclude_id && (entity_id === exclude_id || String(entity.name) === exclude_id)) continue;
    if (exclude_key && (entity._key === exclude_key || entity.role === exclude_key)) continue;

    const summary = entity.present?.non_physical || entity.eternal?.non_physical || entity.description || "";
    const attrs = { id: entity_id, name: String(entity.name), role: entity.role || "NPC" };
    rows.push(
      summary
        ? render_xml_tag({
            tag: "ENTITY",
            attrs,
            children: [render_xml_tag({ tag: "SUMMARY", children: [escape_xml(String(summary).trim())], inline: true })],
          })
        : `<ENTITY id="${escape_xml(attrs.id)}" name="${escape_xml(attrs.name)}" role="${escape_xml(attrs.role)}" />`,
    );
  }

  if (!rows.length) return "";
  return render_cast_xml({ mode: CAST_MODES.NEARBY, children: [rows.join("\n")], indent, child_indent: 2 });
}

// ============================================================================
// [SECTION 2: CANONICAL CAST BLOCK]
// ============================================================================

export const CAST_TAG = "CAST";

/**
 * The single cast-block vocabulary.
 * @type {Readonly<{ CANDIDATES: "candidates", NEARBY: "nearby", ACTIVE: "active" }>}
 */
export const CAST_MODES = Object.freeze({ CANDIDATES: "candidates", NEARBY: "nearby", ACTIVE: "active" });

/**
 * Emits the one canonical `<CAST mode="…">` envelope.
 * @param {Object} [parameters]
 * @param {string} [parameters.mode=CAST_MODES.NEARBY]
 * @param {Array<string|null|undefined>} [parameters.children=[]]
 * @param {number} [parameters.indent=0]
 * @param {number} [parameters.child_indent=2]
 * @returns {string}
 */
export function render_cast_xml({ mode = CAST_MODES.NEARBY, children = [], indent = 0, child_indent = 2 } = {}) {
  const blocks = (Array.isArray(children) ? children : [children]).filter((child) => child != null && String(child).trim());
  if (!blocks.length) return "";
  return render_xml_tag({ tag: CAST_TAG, attrs: { mode }, children: blocks, indent, child_indent, separator: "\n\n" });
}

/**
 * Generates a concise summary for candidate entities.
 * @param {any} entity
 * @returns {string}
 */
function summarize_entity(entity) {
  const description = collapse_whitespace(String(entity?.description || entity?.eternal?.non_physical || entity?.present?.non_physical || ""));
  return truncate_at_word(description, 130);
}

/**
 * Renders the Director's reuse roster as one `<CAST mode="candidates">` block of off-stage secondary characters.
 *
 * @param {Object} [parameters]
 * @param {Record<string, any>} [parameters.entities={}]
 * @param {any[]} [parameters.npc_entities=[]]
 * @param {string[]} [parameters.in_scene_ids=[]]
 * @returns {string}
 */
export function render_candidate_cast_xml({ entities = {}, npc_entities = [], in_scene_ids = [] } = {}) {
  const { dormant } = resolve_available_entities({ entities, npc_entities, in_scene_ids });
  if (!dormant.length) return "";

  const rows = dormant.map((entity) => {
    const summary = summarize_entity(entity);
    return `- ${escape_xml(entity.name)} (id: ${escape_xml(String(entity.id))})${summary ? `: ${escape_xml(summary)}` : ""}`;
  });

  return render_cast_xml({ mode: CAST_MODES.CANDIDATES, children: [rows.join("\n")] });
}

// ============================================================================
// [SECTION 3: PHYSICAL STATE SYNTHESIS]
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
// [SECTION 4: DECLARATIVE SHEET BLUEPRINTS & UNIVERSAL COMPILER]
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

const VISUAL_SECTIONS = Object.freeze([Object.freeze({ wrapper: null, fields: Object.freeze(["physical"]) })]);

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
    const state_content = strip_leading_key_echo(render_field_value(state_without_relations, context.entity, context.entities), specification.state_strip_keys);
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
// [SECTION 5: MASTER STORY ENTITIES ASSEMBLY]
// ============================================================================

export const VISIBILITY_POLICIES = Object.freeze({
  default: (speaker) => {
    const visible = new Set([speaker, "FRACTAL"].filter(Boolean));
    return { dispositions: visible, dynamic_axes: new Set(visible), agendas: new Set(visible) };
  },
  supporting: (speaker) => ({
    dispositions: new Set([speaker, "FRACTAL"].filter(Boolean)),
    dynamic_axes: new Set([speaker, "FRACTAL"].filter(Boolean)),
    agendas: new Set(["AI", "FRACTAL"]),
  }),
  director: () => ({
    dispositions: new Set(["AI", "USER", "FRACTAL", "NPC"]),
    dynamic_axes: new Set(),
    agendas: new Set(["AI", "USER", "FRACTAL"]),
  }),
  omniscient: () => ({
    dispositions: new Set(["AI", "USER", "FRACTAL", "NPC"]),
    dynamic_axes: new Set(["FRACTAL"]),
    agendas: new Set(["AI", "USER", "FRACTAL"]),
  }),
  target: () => ({ dispositions: new Set(), dynamic_axes: new Set(), agendas: new Set() }),
  field: () => ({ dispositions: new Set(), dynamic_axes: new Set(), agendas: new Set() }),
  visual: () => ({ dispositions: new Set(), dynamic_axes: new Set(), agendas: new Set() }),
  none: () => ({ dispositions: new Set(), dynamic_axes: new Set(), agendas: new Set() }),
});

export function resolve_visibility_gates(visibility, speaker) {
  const policy = VISIBILITY_POLICIES[visibility] || VISIBILITY_POLICIES.none;
  return policy(speaker);
}

export function resolve_entities(config = null, context = {}) {
  const configuration = config?.entities || {};
  const { dispositions, dynamic_axes, agendas } = resolve_visibility_gates(config?.visibility, config?.speaker);

  const { active_names, name_to_id } = resolve_available_entities({
    entities: context.entities || {},
    npc_entities: context.npc_entities || [],
    in_scene_ids: context.in_scene_ids || [],
  });

  const npc_ids_to_render = new Set();
  const active_speaker = context.active_speaker || null;
  if (context.is_npc && active_speaker) {
    npc_ids_to_render.add(String(active_speaker.id ?? active_speaker.name));
  }
  if (dispositions.has("NPC") || dynamic_axes.has("NPC")) {
    const in_scene_set = new Set((context.in_scene_ids || []).map(String));
    for (const npc_entity of context.npc_entities || []) {
      if (npc_entity?.id && in_scene_set.has(String(npc_entity.id))) {
        npc_ids_to_render.add(String(npc_entity.id));
      }
    }
  }

  return Object.freeze({
    dispositions,
    dynamic_axes,
    agendas,
    nearby_entities: Boolean(configuration.nearby_entities),
    candidate_entities: Boolean(configuration.candidate_entities),
    field_context: Boolean(configuration.field_context),
    target_context: Boolean(configuration.target_context),
    chapter_history: Boolean(configuration.chapter_history),
    active_names,
    name_to_id,
    npc_ids_to_render,
  });
}

/**
 * Compiles the master <ENTITIES> XML block configured by the active prompt manifest.
 *
 * @param {Object} [parameters]
 * @returns {string}
 */
export function render_entity_sheets({
  entities = {},
  npc_entities = [],
  in_scene_ids = [],
  active_speaker = null,
  accessors = null,
  config = null,
  render_axes = null,
  is_npc = false,
  speaker_dynamics = null,
  fractal_dynamics = null,
  speaker_key = "AI",
  cast_xml = null,
}) {
  const entity_plan = resolve_entities(config, { entities, npc_entities, in_scene_ids, active_speaker, is_npc });
  const dispositions_for = entity_plan.dispositions;
  const axes_for = entity_plan.dynamic_axes;
  const agendas = entity_plan.agendas;
  const { active_names, name_to_id } = entity_plan;
  const parts = [];

  const dynamics_for = (key) => {
    if (!axes_for.has(key)) return null;
    if (key === speaker_key) return speaker_dynamics;
    if (key === "FRACTAL") return fractal_dynamics;
    return entities?.[key]?.dynamics || null;
  };

  const core_trio = [
    {
      key: "AI",
      specification: SHEET_SPECS.AI_CHARACTER,
      dynamics: dynamics_for("AI"),
      is_owner: speaker_key === "AI",
      include_agenda: agendas.has("AI"),
    },
    {
      key: "USER",
      specification: SHEET_SPECS.USER_PERSONA,
      dynamics: dynamics_for("USER"),
      is_owner: speaker_key === "USER",
      include_agenda: agendas.has("USER"),
    },
    {
      key: "FRACTAL",
      specification: SHEET_SPECS.FRACTAL,
      dynamics: dynamics_for("FRACTAL"),
      is_owner: true,
      include_agenda: agendas.has("FRACTAL"),
    },
  ];

  for (const { key, specification, dynamics, is_owner, include_agenda } of core_trio) {
    const entity = entities?.[key];
    if (!entity) continue;
    parts.push(
      render_sheet(specification, {
        entity,
        entities,
        npc_entities,
        accessors,
        render_axes,
        dynamics,
        is_owner,
        show_dispositions: dispositions_for.has(key),
        include_agenda,
        active_names,
        name_to_id,
      }),
    );
  }

  const npc_ids_to_render = entity_plan.npc_ids_to_render;
  const rendered_npc_ids = new Set();
  const active_speaker_id = is_npc && active_speaker ? String(active_speaker.id ?? active_speaker.name) : null;

  const candidate_npcs = [...(npc_entities || [])];
  if (is_npc && active_speaker && active_speaker_id && !candidate_npcs.some((candidate) => String(candidate?.id) === active_speaker_id)) {
    candidate_npcs.push(active_speaker);
  }

  for (const npc_entity of candidate_npcs) {
    const npc_id = String(npc_entity?.id);
    if (!npc_ids_to_render.has(npc_id) || rendered_npc_ids.has(npc_id)) continue;
    rendered_npc_ids.add(npc_id);

    const is_active_speaker = is_npc && active_speaker_id === npc_id;
    const is_bystander_npc = is_npc && !is_active_speaker;
    const resolved_npc_dynamics = is_active_speaker ? npc_entity?.dynamics || speaker_dynamics : npc_entity?.dynamics || null;

    parts.push(
      render_sheet(SHEET_SPECS.NPC, {
        entity: npc_entity,
        entities,
        npc_entities,
        accessors: is_bystander_npc ? null : accessors,
        render_axes,
        dynamics: axes_for.has("NPC") ? resolved_npc_dynamics : null,
        is_owner: !is_bystander_npc,
        show_dispositions: dispositions_for.has("NPC"),
        include_agenda: !is_bystander_npc,
        include_memories: !is_bystander_npc,
        active_names,
        name_to_id,
      }),
    );
  }

  if (entity_plan.nearby_entities) {
    const nearby_candidates = (npc_entities || []).filter((npc) => (in_scene_ids || []).includes(npc?.id) && !rendered_npc_ids.has(String(npc?.id)));
    const nearby_xml = render_nearby_entities_xml(nearby_candidates, { indent: 0 });
    if (nearby_xml) parts.push(nearby_xml);
  }

  if (cast_xml) parts.push(cast_xml);

  return render_xml_tag({
    tag: "ENTITIES",
    children: parts,
    indent: 2,
    child_indent: 2,
    separator: "\n\n",
  });
}

// ============================================================================
// [SECTION 6: AUXILIARY INTELLIGENCE SNAPSHOTS]
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

    const inner_content = target_paths
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
        return `<${tag}>\n${indent_continuation(value, 8)}\n    </${tag}>`;
      })
      .filter(Boolean)
      .join("\n    ");

    if (!inner_content) return "";
    return render_xml_tag({
      tag: "ENTITY_CONTEXT",
      children: [inner_content],
      indent: 2,
      child_indent: 4,
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
// [SECTION 7: SENSORY OPTICS & DYNAMICS AXES]
// ============================================================================

export function render_optics_entities_xml({
  tier = "solo_entity",
  solo_subject = null,
  active_ai_character = null,
  active_user_persona = null,
  active_fractal_setting = null,
  main_entity = null,
  macro_entities = {},
  roll = (text) => text,
} = {}) {
  const render_entity_block = (tag_name, entity_instance) => {
    if (!entity_instance) return "";
    const base_specification = tag_name === "FRACTAL" || entity_instance.type === "fractal" ? SHEET_SPECS.FRACTAL : SHEET_SPECS.AI_CHARACTER;
    return render_sheet(
      { ...base_specification, tag: tag_name, default_name: tag_name },
      {
        entity: entity_instance,
        entities: macro_entities,
        physical_mode: "separate",
        sections: VISUAL_SECTIONS,
        include_agenda: false,
        include_memories: false,
        is_owner: true,
        transform_physical: (value) => roll(strip_visual_excluded(value)),
      },
    );
  };

  const ai_character_block = render_entity_block("AI_CHARACTER", active_ai_character);
  const user_persona_block = render_entity_block("USER_PERSONA", active_user_persona);

  const is_story_tier = tier === "story_entities" || tier === "story_character" || tier === "story_scene";
  const fractal_setting_block = is_story_tier && active_fractal_setting ? render_entity_block("FRACTAL", active_fractal_setting) : "";

  const context_block = (() => {
    switch (tier) {
      case "solo_entity":
        return render_cast_xml({ mode: CAST_MODES.ACTIVE, children: [render_entity_block("SOLO_ENTITY", solo_subject)] });
      case "story_scene":
        return fractal_setting_block;
      case "story_entities":
        return `${render_cast_xml({ mode: CAST_MODES.ACTIVE, children: [ai_character_block, user_persona_block] })}\n${fractal_setting_block}`;
      case "story_character":
      default:
        return `${render_cast_xml({
          mode: CAST_MODES.ACTIVE,
          children: [
            render_entity_block(
              main_entity === active_user_persona || main_entity?.type === "user"
                ? "USER_PERSONA"
                : main_entity?.type === "fractal"
                  ? "FRACTAL"
                  : "AI_CHARACTER",
              main_entity,
            ),
          ],
        })}\n${fractal_setting_block}`;
    }
  })();

  return render_xml_tag({
    tag: "ENTITIES",
    children: [context_block.trim()].filter(Boolean),
    indent: 2,
    child_indent: 2,
    separator: "\n\n",
  });
}

export function render_dynamics_axes_xml(live_dynamics = null, scope = null, axes_registry = {}) {
  if (!live_dynamics || typeof live_dynamics !== "object") return "";

  const tags = Object.entries(axes_registry)
    .filter(([key, meta]) => (!scope || meta.scope === scope) && live_dynamics[key] !== undefined && live_dynamics[key] !== null)
    .map(([key, meta]) => {
      const value = Math.round(Number(live_dynamics[key]));
      const tag = key.toUpperCase();
      return `  <${tag} value="${value}" low="${escape_xml(meta.low)}" high="${escape_xml(meta.high)}" />`;
    });

  return tags.length > 0 ? `<DYNAMIC_AXES scale="0-100">\n${tags.join("\n")}\n</DYNAMIC_AXES>` : "";
}

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-10-01: Consolidated presence.js and sheets.js into single src/intelligence/modules/entities.js module under P4 Zero Backwards Compatibility. Relational dispositions now harvest 100% from universal bracket predicates via veil.js.
 * ============================================================================
 */
