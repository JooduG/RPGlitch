/**
 * src/intelligence/modules/entities.js
 * ============================================================================
 * 👥 ENTITIES MODULE — Spatial Entity Architecture & Universal Sheet Compiler
 * ============================================================================
 *
 * Orchestrates entity manifestation, epistemic security, and XML compilation
 * across the intelligence layer, establishing direct symmetrical alignment
 * with the prompt manifest specifications in `prompts.js`:
 *
 * 1. Epistemic Boundary (strip_epistemic_tags, strip_epistemic_secrets)
 * 2. Physical State Synthesis (extract_physical_body, render_appearance)
 * 3. Spatial Presence & Relational Graph (resolve_available_entities, render_dispositions, render_nearby_entities_xml)
 * 4. Declarative Sheet Blueprints & Universal Compiler (SHEET_SPECS, render_sheet)
 * 5. Available Entities Master Assembly (render_entity_sheets)
 * 6. Auxiliary Intelligence Snapshots (render_entity_memory_context, render_enhancement_field_context)
 * 7. Present Entities & Speaker Routing (ROUTING_RULES, render_present_entities_xml)
 *
 * Symmetrical Manifest Mapping:
 * - `config.entities.dispositions`     ➔ `render_dispositions`
 * - `config.entities.dynamic_axes`     ➔ somatic / fractal axes in `render_sheet`
 * - `config.entities.user_agenda`      ➔ gates `include_agenda` on USER_PERSONA
 * - `config.entities.nearby_entities`  ➔ `render_nearby_entities_xml`
 * - `config.entities.present_entities` ➔ `render_present_entities_xml`
 * - `config.entities.target_context`   ➔ `render_entity_memory_context` (render_sheet in "separate" physical mode)
 * - `config.entities.field_context`    ➔ `render_enhancement_field_context`
 *
 * Design Laws:
 * - Single-Source Taxonomy: XML tags originate deterministically from @data's PROFILE_FIELD_CATALOG.
 * - Epistemic Wall Integrity: Private thoughts ([SECRET: ...], [PLAN: ...]) are never leaked across entity boundaries.
 * - Universal Sheet Compiler: Every entity in the simulation compiles through render_sheet.
 * - Zero Backwards Compatibility: Ruthless purity, full domain nomenclature, no legacy shims.
 * ============================================================================
 */

import {
  escape_xml,
  prompt_escape,
  physical_to_xml,
  parse_relational_vector,
  strip_leading_key_echo,
  render_field_value,
  indent_continuation,
  indent_all,
  inline_or_block,
  render_xml_tag,
} from "@utils";
import { PROFILE_FIELD_CATALOG } from "@data";

// ============================================================================
// [SECTION 1: THE EPISTEMIC WALL]
// ============================================================================

/**
 * Strips epistemic [SECRET: ...] and [PLAN: ...] directives from rendered state strings.
 * Enforces the Epistemic Wall so AI models never receive another entity's private knowledge.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function strip_epistemic_tags(text) {
  if (!text) return "";
  return String(text)
    .replace(/\[(?:SECRET|PLAN)\s*:\s*[^\]]*\]/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Conditionally strips epistemic secrets and plans based on entity perspective.
 * When is_owner is true, private state is preserved; when false, state is sanitized.
 *
 * @param {string|null|undefined} state_text
 * @param {boolean} [is_owner=false]
 * @returns {string}
 */
export function strip_epistemic_secrets(state_text, is_owner = false) {
  if (!state_text) return "";
  return is_owner ? String(state_text) : strip_epistemic_tags(state_text);
}

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
function resolve_profile_field_tag(entity_kind, path, fallback = "") {
  return PROFILE_FIELD_CATALOG[`${entity_kind}.${path}`]?.tag || fallback;
}

/**
 * Resolves a nested dot-notation field value from an entity object.
 *
 * @param {any} entity
 * @param {string} path - Dot-separated field path (e.g. "eternal.physical", "future").
 * @returns {any}
 */
function resolve_entity_field_value(entity, path) {
  if (!entity || !path) return undefined;
  return path.split(".").reduce((target, key) => (target != null ? target[key] : undefined), entity);
}

/**
 * Extracts and unboxes inner XML body rows from a physical/topographical definition.
 *
 * @param {string|Record<string, any>|null|undefined} raw_value
 * @param {any} [owner_entity]
 * @param {any} [entities]
 * @returns {string}
 */
function extract_physical_body(raw_value, owner_entity, entities) {
  const resolved_value = owner_entity ? render_field_value(raw_value, owner_entity, entities) : raw_value;
  const xml_output = physical_to_xml(resolved_value, "BODY");
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
 * @returns {string[]}
 */
function extract_physical_rows(raw_value, owner_entity, entities) {
  const body_content = extract_physical_body(raw_value, owner_entity, entities);
  return body_content
    ? body_content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
}

/**
 * Synthesizes eternal (permanent biometric/topographic baseline) and present (active outfit/atmosphere)
 * into a single unified physical block (<APPEARANCE> or <TOPOGRAPHY>).
 * Present attributes cleanly overwrite corresponding eternal attributes by XML tag name.
 *
 * @param {string|null|undefined} eternal_text
 * @param {string|null|undefined} present_text
 * @param {any} owner_entity
 * @param {any} entities
 * @param {string} [tag="APPEARANCE"]
 * @returns {string}
 */
export function render_appearance(eternal_text, present_text, owner_entity, entities, tag = "APPEARANCE") {
  const merged_entries = [];
  const index_by_tag = new Map();

  const extract_tag_name = (row_content) => {
    const match = String(row_content).match(/^<([A-Za-z0-9_]+)/);
    return match ? match[1].toUpperCase() : String(row_content);
  };

  const all_rows = [...extract_physical_rows(eternal_text, owner_entity, entities), ...extract_physical_rows(present_text, owner_entity, entities)];

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
  const inner_content = merged_entries.map((row_content) => `        ${row_content}`).join("\n");
  return `      <${tag}>\n${inner_content}\n      </${tag}>`;
}

// ============================================================================
// [SECTION 3: SPATIAL PRESENCE & RELATIONAL TOPOLOGY]
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
 *
 * @param {any} entity
 * @param {Set<string>} active_names
 * @param {Map<string, string>} name_to_id_map
 * @param {number} [indentation_level=6]
 * @returns {string}
 */
function render_dispositions(entity, active_names, name_to_id_map, indentation_level = 6) {
  if (!entity?.name) return "";
  const source_name = String(entity.name).toLowerCase().trim();
  const rows = [];

  const relationships = Array.isArray(entity?.relationships) ? entity.relationships : [];
  for (const relationship of relationships) {
    const parsed_vector = parse_relational_vector(relationship);
    if (!parsed_vector) continue;
    if (String(parsed_vector.source_name).toLowerCase().trim() !== source_name) continue;

    const target_normalized = String(parsed_vector.target_name).toLowerCase().trim();
    if (!active_names.has(target_normalized)) continue;

    const target_id = name_to_id_map.get(target_normalized) || parsed_vector.target_name;
    rows.push(
      render_xml_tag({
        tag: "DISPOSITION",
        attrs: { target: target_id },
        children: [prompt_escape(parsed_vector.dynamic || "Relationship")],
        inline: true,
      }),
    );
  }

  if (!rows.length) return "";
  return render_xml_tag({
    tag: "DISPOSITIONS",
    children: rows,
    indent: indentation_level,
    child_indent: indentation_level + 2,
    separator: "\n",
  });
}

/**
 * Renders concise entries for nearby secondary entities or ambient participants.
 * Symmetrically activated when `config.entities.nearby_entities` is enabled.
 * Supports both array of entities and record maps of other entities.
 *
 * @param {any[]|Record<string, any>} [entities=[]]
 * @param {Object} [options={}]
 * @param {string} [options.exclude_id=null]
 * @param {string} [options.exclude_key=null]
 * @param {number} [options.indent=4]
 * @returns {string}
 */
export function render_nearby_entities_xml(entities = [], options = {}) {
  const { exclude_id = null, exclude_key = null, indent = 4 } = options;
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
    const pad = " ".repeat(indent + 2);
    if (summary) {
      rows.push(
        render_xml_tag({
          tag: "ENTITY",
          attrs: { id: entity_id, name: String(entity.name), role: entity.role || "NPC" },
          children: [render_xml_tag({ tag: "SUMMARY", children: [escape_xml(String(summary).trim())], inline: true })],
          indent: indent + 2,
        }),
      );
    } else {
      rows.push(
        `${pad}<ENTITY id="${escape_xml(entity_id)}" name="${escape_xml(String(entity.name))}" role="${escape_xml(entity.role || "NPC")}" />`,
      );
    }
  }

  if (!rows.length) return "";
  const outer_pad = " ".repeat(indent);
  return `${outer_pad}<NEARBY_ENTITIES>\n${rows.join("\n")}\n${outer_pad}</NEARBY_ENTITIES>`;
}

// ============================================================================
// [SECTION 4: DECLARATIVE SHEET BLUEPRINTS & UNIVERSAL COMPILER]
// ============================================================================

const CHARACTER_SHEET_BASE = Object.freeze({
  psychology_tag: "PSYCHOLOGY",
  agenda_key: PROFILE_FIELD_CATALOG["character.future"].tag,
  personality_tag: PROFILE_FIELD_CATALOG["character.eternal.non_physical"].tag,
  state_tag: "STATE",
  state_strip_keys: Object.freeze(["STATE_OF_MIND", "STATE"]),
  appearance_tag: "APPEARANCE",
  memory_tag: PROFILE_FIELD_CATALOG["character.past"].tag,
  axes_scope: "somatic",
  epistemic: Object.freeze({ state: "owner" }),
});

/**
 * Frozen catalog of entity sheet blueprints driven by PROFILE_FIELD_CATALOG.
 * Defines the structural tags, epistemic policies, and dynamic axes scopes for each entity kind.
 *
 * @type {Readonly<Record<string, any>>}
 */
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
    axes_scope: null,
    epistemic: Object.freeze({
      personality: "always",
      state: "always",
      appearance: "always",
      memory: "always",
    }),
  }),
  FRACTAL: Object.freeze({
    tag: "FRACTAL",
    default_name: "the setting",
    psychology_tag: "ATMOSPHERE",
    agenda_key: PROFILE_FIELD_CATALOG["fractal.future"].tag,
    personality_tag: PROFILE_FIELD_CATALOG["fractal.eternal.non_physical"].tag,
    state_tag: "STATE",
    state_strip_keys: Object.freeze(["CURRENT_STATE", "STATE"]),
    appearance_tag: "TOPOGRAPHY",
    memory_tag: PROFILE_FIELD_CATALOG["fractal.past"].tag,
    axes_scope: "fractal",
    epistemic: Object.freeze({}),
  }),
});

/**
 * Compiles a single entity sheet XML block from its specification blueprint.
 * Supports both "combined" physical synthesis (<APPEARANCE> / <TOPOGRAPHY>)
 * and "separate" physical unboxing (<PHYSICAL_APPEARANCE> / <CURRENT_LOOK>).
 *
 * @param {Object} specification - An entry from SHEET_SPECS.
 * @param {Object} context
 * @param {any} context.entity
 * @param {any} [context.entities]
 * @param {any} [context.accessors]
 * @param {Function} [context.render_axes]
 * @param {any} [context.dynamics]
 * @param {boolean} [context.is_owner=false]
 * @param {boolean} [context.show_dispositions=false]
 * @param {boolean} [context.include_agenda=true]
 * @param {Set<string>} [context.active_names]
 * @param {Map<string, string>} [context.name_to_id]
 * @param {"combined"|"separate"} [context.physical_mode="combined"]
 * @returns {string}
 */
export function render_sheet(specification, context) {
  const {
    entity,
    entities,
    accessors,
    render_axes,
    dynamics,
    is_owner = false,
    show_dispositions = false,
    include_agenda = true,
    include_memories = true,
    active_names,
    name_to_id,
    physical_mode = "combined",
  } = context;

  if (!entity) return "";

  const epistemic = specification.epistemic || {};
  const sanitize_by_epistemic_policy = (value, policy) => {
    if (!policy || policy === "none") return value;
    return strip_epistemic_secrets(value, policy === "owner" ? is_owner : false);
  };

  const id_attribute = entity.id ? ` id="${escape_xml(String(entity.id))}"` : "";
  const rows = [];
  rows.push(`    <${specification.tag}${id_attribute} name="${escape_xml(entity.name || specification.default_name)}">`);
  rows.push(`      <${specification.psychology_tag}>`);

  const render_sheet_field = (tag, content, indent = 8) => {
    const text = String(content || "").trim();
    return text ? `        <${tag}>${inline_or_block(text, indent)}</${tag}>` : null;
  };

  if (include_agenda) {
    const agenda_raw = accessors ? accessors.future(entity, { vector_text: true }) : entity?.future;
    const row = render_sheet_field(specification.agenda_key, agenda_raw, 8);
    if (row) rows.push(row);
  }

  const personality_raw = sanitize_by_epistemic_policy(entity.eternal?.non_physical, epistemic.personality);
  const personality_content = render_field_value(personality_raw, entity, entities);
  const personality_row = render_sheet_field(specification.personality_tag, personality_content, 10);
  if (personality_row) rows.push(personality_row);

  const state_raw = sanitize_by_epistemic_policy(entity.present?.non_physical, epistemic.state);
  const state_rendered = render_field_value(state_raw, entity, entities);
  const state_content = strip_leading_key_echo(state_rendered, specification.state_strip_keys);
  const state_row = render_sheet_field(specification.state_tag, state_content, 10);
  if (state_row) rows.push(state_row);

  if (show_dispositions && active_names && name_to_id) {
    const dispositions_xml = render_dispositions(entity, active_names, name_to_id, 6);
    if (dispositions_xml) rows.push(dispositions_xml);
  }

  const axes_xml = render_axes && specification.axes_scope ? render_axes(dynamics, specification.axes_scope) : "";
  if (axes_xml) rows.push(indent_all(axes_xml, 6));

  rows.push(`      </${specification.psychology_tag}>`);

  if (physical_mode === "separate") {
    const entity_kind = specification.tag === "FRACTAL" || entity?.type === "fractal" ? "fractal" : "character";
    const physical_parts = [
      {
        tag: resolve_profile_field_tag(entity_kind, "eternal.physical", "PHYSICAL_APPEARANCE"),
        raw: sanitize_by_epistemic_policy(entity.eternal?.physical, epistemic.appearance),
      },
      {
        tag: resolve_profile_field_tag(entity_kind, "present.physical", "CURRENT_LOOK"),
        raw: sanitize_by_epistemic_policy(entity.present?.physical, epistemic.appearance),
      },
    ];

    for (const { tag, raw } of physical_parts) {
      const body = extract_physical_body(raw, entity, entities);
      if (body) {
        rows.push(`      <${tag}>\n${indent_all(body, 8)}\n      </${tag}>`);
      }
    }
  } else {
    const appearance_xml = render_appearance(
      sanitize_by_epistemic_policy(entity.eternal?.physical, epistemic.appearance),
      sanitize_by_epistemic_policy(entity.present?.physical, epistemic.appearance),
      entity,
      entities,
      specification.appearance_tag,
    );
    if (appearance_xml) rows.push(appearance_xml);
  }

  if (include_memories) {
    const memory_raw = accessors
      ? accessors.past(entity, { vector_text: true })
      : Array.isArray(entity?.past)
        ? entity.past
            .map((vector) => vector.content || "")
            .filter(Boolean)
            .join("\n")
        : entity?.past || "";
    const memory_content = sanitize_by_epistemic_policy(memory_raw, epistemic.memory);
    const memory_row = render_sheet_field(specification.memory_tag, memory_content, 8);
    if (memory_row) {
      rows.push(`  ${memory_row}`);
    }
  }

  rows.push(`    </${specification.tag}>`);
  return rows.join("\n");
}

// ============================================================================
// [SECTION 5: MASTER STORY ENTITIES ASSEMBLY]
// ============================================================================

/**
 * Compiles the master <AVAILABLE_ENTITIES> XML block configured by the active prompt manifest.
 * Symmetrically reads dispositions, dynamic_axes, user_agenda, and nearby_entities from config.entities.
 *
 * @param {Object} [parameters]
 * @param {Record<string, any>} [parameters.entities={}]
 * @param {any[]} [parameters.npc_entities=[]]
 * @param {string[]} [parameters.in_scene_ids=[]]
 * @param {any} [parameters.active_speaker=null]
 * @param {any} [parameters.accessors=null]
 * @param {any} [parameters.config=null] - Resolved prompt manifest record containing `.entities`.
 * @param {Function} [parameters.render_axes=null]
 * @param {boolean} [parameters.is_npc=false]
 * @param {any} [parameters.speaker_dynamics=null]
 * @param {any} [parameters.fractal_dynamics=null]
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
}) {
  const entities_configuration = config?.entities || {};
  const dispositions_for = new Set(entities_configuration.dispositions || []);
  const axes_for = new Set(entities_configuration.dynamic_axes || []);

  const {
    present: _present,
    dormant: _dormant,
    active_names,
    name_to_id,
  } = resolve_available_entities({
    entities,
    npc_entities,
    in_scene_ids,
  });
  const parts = [];

  const core_trio = [
    {
      key: "AI",
      specification: SHEET_SPECS.AI_CHARACTER,
      dynamics: axes_for.has("AI") ? speaker_dynamics : null,
      is_owner: !is_npc,
      include_agenda: true,
    },
    {
      key: "USER",
      specification: SHEET_SPECS.USER_PERSONA,
      dynamics: null,
      is_owner: false,
      include_agenda: Boolean(entities_configuration.user_agenda),
    },
    {
      key: "FRACTAL",
      specification: SHEET_SPECS.FRACTAL,
      dynamics: axes_for.has("FRACTAL") ? fractal_dynamics : null,
      is_owner: true,
      include_agenda: true,
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

  const npc_ids_to_render = new Set();
  if (is_npc && active_speaker) {
    npc_ids_to_render.add(String(active_speaker.id ?? active_speaker.name));
  }
  if (dispositions_for.has("NPC") || axes_for.has("NPC")) {
    const in_scene_set = new Set((in_scene_ids || []).map(String));
    for (const npc_entity of npc_entities || []) {
      if (npc_entity?.id && in_scene_set.has(String(npc_entity.id))) {
        npc_ids_to_render.add(String(npc_entity.id));
      }
    }
  }

  const rendered_npc_ids = new Set();
  const active_speaker_id = is_npc && active_speaker ? String(active_speaker.id ?? active_speaker.name) : null;

  // Combine npc_entities and fallback active_speaker to eliminate duplicate sheet assembly
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

  if (entities_configuration.nearby_entities) {
    const nearby_candidates = (npc_entities || []).filter((npc) => (in_scene_ids || []).includes(npc?.id) && !rendered_npc_ids.has(String(npc?.id)));
    const nearby_xml = render_nearby_entities_xml(nearby_candidates, { indent: 4 });
    if (nearby_xml) parts.push(nearby_xml);
  }

  return render_xml_tag({
    tag: "AVAILABLE_ENTITIES",
    children: parts,
    indent: 2,
    child_indent: 2,
    separator: "\n\n",
  });
}

// ============================================================================
// [SECTION 6: AUXILIARY INTELLIGENCE SNAPSHOTS]
// ============================================================================

/**
 * Compiles a structured memory snapshot of an entity's complete state fragments for memory consolidation.
 * Symmetrically activated when `config.entities.target_context` is enabled.
 * Delegates directly to the universal render_sheet compiler with physical_mode: "separate".
 *
 * @param {string} entity_key
 * @param {any} entity
 * @returns {string}
 */
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

/**
 * Compiles contextual sibling and temporal baseline blocks for profile field enhancement tasks.
 * Symmetrically activated when `config.entities.field_context` is enabled.
 *
 * @param {any} entity
 * @param {string} field_identifier - Dot-notation field key (e.g. "present.physical", "future").
 * @param {string} [content=""] - Current content being enhanced.
 * @param {string} [entity_type="character"]
 * @param {Function} [format_past_function=null] - Optional past vector formatter.
 * @returns {string}
 */
export function render_enhancement_field_context(entity, field_identifier, content = "", entity_type = "character", format_past_function = null) {
  if (!entity) return "";
  const [section_name, subsection_name] = String(field_identifier || "").split(".");
  const is_fractal = entity?.type === "fractal" || entity_type === "fractal";
  const entity_kind = is_fractal ? "fractal" : "character";

  if (section_name && subsection_name && ["eternal", "present"].includes(section_name)) {
    const sibling_subsection = subsection_name === "physical" ? "non_physical" : "physical";
    const target_paths = [
      `${section_name}.${subsection_name}`,
      `${section_name}.${sibling_subsection}`,
      ...(section_name === "present" ? [`eternal.${subsection_name}`] : []),
    ];

    const inner_content = target_paths
      .map((path) => {
        const tag = resolve_profile_field_tag(entity_kind, path);
        if (!tag) return "";
        const raw_value = resolve_entity_field_value(entity, path);
        const value = path.endsWith(".physical") ? extract_physical_body(raw_value) : escape_xml(String(raw_value ?? "").trim());
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
// [SECTION 7: PRESENT ENTITIES & SPEAKER ROUTING]
// ============================================================================

export const ROUTING_RULES = Object.freeze({
  ROUTING: `SPEAKER ROUTING RULES:
- "AI_CHARACTER": (Default) AI companion reacts to protagonist.
- "FRACTAL": Environmental action (exploring atmosphere, architecture, weather, objects without dialogue) or breaking long AI speech streaks.
- "npc:<id>": Present secondary character takes action.
- "GENESIS": Mint a new character only if no candidate below applies.`,

  CONVERGENCE_LAW: `CONVERGENCE & ENTITY REUSE:
Inspect candidate secondary characters below before minting. If an existing entity matches the role or location (medical, security, merchant), you MUST reuse that entity rather than creating a duplicate.`,

  PRESENT_HEADER: "ACTIVE PRESENT PARTICIPANTS:",
  DORMANT_HEADER: "DORMANT CANDIDATE ENTITIES (STASIS):",
});

/**
 * Generates a concise summary for candidate entities.
 * @param {any} entity
 * @returns {string}
 */
function summarize_entity(entity) {
  const description = String(entity?.description || entity?.eternal?.non_physical || entity?.present?.non_physical || "")
    .replace(/\s+/g, " ")
    .trim();
  return description.length > 130 ? `${description.slice(0, 130).trim()}…` : description;
}

/**
 * Renders the Present Entities XML block for Director turn arbitration.
 * Symmetrically activated when `config.entities.present_entities` is enabled.
 *
 * @param {Object} [parameters]
 * @param {Record<string, any>} [parameters.entities={}]
 * @param {any[]} [parameters.npc_entities=[]]
 * @param {string[]} [parameters.in_scene_ids=[]]
 * @returns {string}
 */
export function render_present_entities_xml({ entities = {}, npc_entities = [], in_scene_ids = [] } = {}) {
  const { present, dormant } = resolve_available_entities({ entities, npc_entities, in_scene_ids });
  const active_trio_ids = new Set([entities?.AI?.id, entities?.USER?.id, entities?.FRACTAL?.id].filter(Boolean).map(String));

  const active_participants = [];
  if (entities?.AI?.name) active_participants.push(`- ${escape_xml(entities.AI.name)}: Primary Companion (Present)`);
  if (entities?.USER?.name) active_participants.push(`- ${escape_xml(entities.USER.name)}: Protagonist (Present)`);

  for (const entity of present) {
    if (active_trio_ids.has(String(entity.id)) || entity === entities?.AI || entity === entities?.USER || entity === entities?.FRACTAL) {
      continue;
    }
    const summary = summarize_entity(entity);
    const summary_suffix = summary ? `: ${escape_xml(summary)}` : "";
    active_participants.push(`- ${escape_xml(entity.name)} (id: ${escape_xml(String(entity.id))}) [Present]${summary_suffix}`);
  }

  const candidate_dormant = [];
  for (const entity of dormant) {
    if (active_trio_ids.has(String(entity.id))) continue;
    const summary = summarize_entity(entity);
    const summary_suffix = summary ? `: ${escape_xml(summary)}` : "";
    candidate_dormant.push(`- ${escape_xml(entity.name)} (id: ${escape_xml(String(entity.id))}) [Dormant (Stasis)]${summary_suffix}`);
  }

  const { DORMANT_HEADER, ROUTING, CONVERGENCE_LAW, PRESENT_HEADER } = ROUTING_RULES;
  const sections = [
    ROUTING,
    CONVERGENCE_LAW,
    `${PRESENT_HEADER}\n${active_participants.join("\n")}`,
    candidate_dormant.length > 0 ? `${DORMANT_HEADER}\n${candidate_dormant.join("\n")}` : null,
  ].filter(Boolean);

  return render_xml_tag({
    tag: "PRESENT_ENTITIES",
    children: sections,
    indent: 0,
    child_indent: 0,
    separator: "\n\n",
  });
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
 * - 2026-09-16: Spatial Architecture Standardization & Non-Theater Harmonization: (1) Swapped and standardized spatial XML structures: replaced <STORY_ENTITIES> with <AVAILABLE_ENTITIES>, merged <PROXIMATE_NPCS> and <SCENE_CAST> into <NEARBY_ENTITIES>, and replaced <SCENE_SPOTLIGHT> with <PRESENT_ENTITIES>; (2) Purged all theater/stage metaphors in favor of spatial/systems taxonomy (resolve_available_entities, ROUTING_RULES, render_present_entities_xml); (3) Pruned dead legacy functions under P4 Zero Backwards Compatibility.
 * - 2026-09-16: Comprehensive simplification and consolidation: (1) Consolidated core trio (AI, USER, FRACTAL) assembly in render_entity_sheets into declarative loop, slashing repetitive boilerplate; (2) Extracted render_sheet_field helper in render_sheet and unified separate physical block compilation; (3) Inlined and simplified extract_physical_rows; (4) Verified 100% test pass across entities, builder, and story suites.
 * - 2026-09-16: Refactored `entities.js`: standardized `STORY_ENTITIES`, `ENTITY_CONTEXT`, and `SCENE_SPOTLIGHT` XML assembly via `render_xml_tag`; consolidated NPC sheet compilation into unified candidate loop; pruned duplicate changelog line.
 * - 2026-09-16: Repatriated `render_scene_spotlight_xml` and `SPOTLIGHT_RULES` back to `entities.js` (Layer 4 entity/cast management sovereignty). Merged headers into single directive blocks.
 * - 2026-09-14: Purged dead `agenda_gate` configuration property from `SHEET_SPECS.USER_PERSONA` per P4 pre-beta purity.
 * - 2026-09-13: Token optimization & epistemic reinforcement: (1) Enforced Bystander NPC Diet where non-speaking in-scene NPCs omit private standing agendas and deep memory vectors while stripping secrets/plans across the Epistemic Wall; (2) Compressed nested whitespace across dispositions and dynamic axes to 6-space hierarchy, trimming whitespace tokens.
 * - 2026-09-13: Fixed NPC dynamic axes crosstalk by isolating bystander NPC axes from active speaker dynamics; deduplicated in-scene NPCs in proximate roster to eliminate redundant <NPC> tags when full sheets are already rendered.
 * - 2026-09-13: Full architectural symmetry with prompts.js — established 1-to-1 parity between config.entities manifest keys and entities.js renderers; unified TARGET into render_sheet via physical_mode ("combined" vs "separate"); exported render_sheet as sovereign universal compiler; pruned redundant dictionaries; enforced Full-Name domain nomenclature throughout.
 * - 2026-09-13: Streamlined render_entity_memory_context and render_enhancement_field_context — replaced manual tag variables with declarative PROFILE_FIELD_CATALOG path iteration via resolve_entity_field_value, slashing boilerplate and eliminating linter warnings.
 * - 2026-09-13: Deconstruction and first-principles architectural rebuild — established sovereign red thread across 6 symmetrical sections; unified scene presence and name-to-id indexing into build_scene_roster; derived XML tags cleanly via resolve_profile_field_tag; pruned dead loop branches in NPC sheet assembly.
 * - 2026-09-13: Comprehensive refactor — enforced Full-Name nomenclature (CHARACTER_FIELDS, context, source_name, indentation_padding, entity loop variables); unified physical body extraction via _extract_physical_body; modernized render_entity_sheets to consume entities_configuration directly; pruned stale spotlight doc drift in header; purged dead clean_xml import.
 * - 2026-09-13: Purified `SHEET_SPECS` by directly deriving field XML tags from `PROFILE_FIELD_CATALOG`; relocated `SPOTLIGHT_RULES` and `render_scene_spotlight_xml` to `task.js` under Director turn choreography.
 * - 2026-09-12: Standardization pass — the three near-duplicate sheet compilers (speaker/user/fractal) were collapsed into one data-driven `render_sheet` reading a frozen `SHEET_SPECS` catalog; every field XML tag now derives from the canonical `PROFILE_FIELD_CATALOG` in @data (no local label→tag duplication); banner corrected (chapter/recent-history functions live in history.js).
 * - 2026-09-11: Delegated format_recent_history and render_chapter_history_xml to history.js, and added render_scene_cast_xml.
 * - 2026-09-11: Renamed module to entities.js. Absorbed format_recent_history, render_chapter_history_xml, render_entity_memory_context, and render_enhancement_field_context.
 * - 2026-09-11: Added SPOTLIGHT_RULES and render_scene_spotlight_xml for Stage Spotlight orchestration.
 * - 2026-09-11: Initial creation of modular story-entities.js extracting sheet compilation and epistemic boundaries.
 */
