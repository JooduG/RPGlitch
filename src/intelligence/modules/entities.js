/**
 * src/intelligence/modules/entities.js
 * ============================================================================
 * 👥 ENTITIES MODULE — Sovereign Cast Architecture & Universal Sheet Compiler
 * ============================================================================
 *
 * Orchestrates entity manifestation, epistemic security, and XML compilation
 * across the intelligence layer, establishing direct symmetrical alignment
 * with the prompt manifest specifications in `prompts.js`:
 *
 * 1. Epistemic Boundary (strip_epistemic_tags, strip_epistemic_secrets)
 * 2. Physical State Synthesis (extract_physical_body, render_appearance)
 * 3. Scene Cast & Relational Graph (build_scene_roster, render_dispositions, render_proximate_npcs)
 * 4. Declarative Sheet Blueprints & Universal Compiler (SHEET_SPECS, render_sheet)
 * 5. Master Story Entities Assembly (render_entity_sheets)
 * 6. Auxiliary Intelligence Snapshots (render_scene_cast_xml, render_entity_memory_context, render_enhancement_field_context)
 *
 * Symmetrical Manifest Mapping:
 * - `config.entities.dispositions`   ➔ `render_dispositions`
 * - `config.entities.dynamic_axes`   ➔ somatic / fractal axes in `render_sheet`
 * - `config.entities.user_agenda`    ➔ gates `include_agenda` on USER_PERSONA
 * - `config.entities.proximate_npcs` ➔ `render_proximate_npcs`
 * - `config.entities.target_context` ➔ `render_entity_memory_context` (render_sheet in "separate" physical mode)
 * - `config.entities.scene_cast`     ➔ `render_scene_cast_xml`
 * - `config.entities.field_context`  ➔ `render_enhancement_field_context`
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
  if (!body_content) return [];
  return body_content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
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
// [SECTION 3: SCENE ROSTER & RELATIONAL TOPOLOGY]
// ============================================================================

/**
 * Compiles a unified scene roster providing fast name-to-identifier lookup
 * and the active presence set for relational vector resolution.
 *
 * @param {Record<string, any>} [entities]
 * @param {any[]} [npc_entities=[]]
 * @param {string[]} [in_scene_ids=[]]
 * @returns {{ name_to_id: Map<string, string>, active_names: Set<string> }}
 */
function build_scene_roster(entities, npc_entities = [], in_scene_ids = []) {
  const name_to_id = new Map();
  const active_names = new Set();
  const in_scene_set = new Set((in_scene_ids || []).map(String));

  const register_entity = (entity, is_active) => {
    if (!entity?.name) return;
    const normalized_name = String(entity.name).toLowerCase().trim();
    name_to_id.set(normalized_name, entity.id || entity.name);
    if (is_active) active_names.add(normalized_name);
  };

  for (const entity of [entities?.AI, entities?.USER, entities?.FRACTAL]) {
    register_entity(entity, true);
  }

  for (const npc_entity of npc_entities || []) {
    register_entity(npc_entity, in_scene_set.has(String(npc_entity?.id)));
  }

  return { name_to_id, active_names };
}

/**
 * Renders directed relational dispositions for an entity toward other active in-scene participants.
 *
 * @param {any} entity
 * @param {Set<string>} active_names
 * @param {Map<string, string>} name_to_id_map
 * @param {number} [indentation_level=8]
 * @returns {string}
 */
function render_dispositions(entity, active_names, name_to_id_map, indentation_level = 8) {
  if (!entity?.name) return "";
  const source_name = String(entity.name).toLowerCase().trim();
  const indentation_padding = " ".repeat(indentation_level);
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
      `${indentation_padding}  <DISPOSITION target="${escape_xml(target_id)}">${prompt_escape(parsed_vector.dynamic || "Relationship")}</DISPOSITION>`,
    );
  }

  if (!rows.length) return "";
  return `${indentation_padding}<DISPOSITIONS>\n${rows.join("\n")}\n${indentation_padding}</DISPOSITIONS>`;
}

/**
 * Renders concise proximate NPC listings for in-scene secondary characters.
 *
 * @param {any[]} [npc_entities=[]]
 * @param {string[]} [in_scene_ids=[]]
 * @returns {string}
 */
function render_proximate_npcs(npc_entities = [], in_scene_ids = []) {
  const in_scene_set = new Set((in_scene_ids || []).map(String));
  const rows = [];

  for (const npc_entity of npc_entities || []) {
    if (!npc_entity?.name || !in_scene_set.has(String(npc_entity.id))) continue;
    rows.push(`      <NPC id="${escape_xml(String(npc_entity.id))}" name="${escape_xml(String(npc_entity.name))}" />`);
  }

  if (!rows.length) return "";
  return `    <PROXIMATE_NPCS>\n${rows.join("\n")}\n    </PROXIMATE_NPCS>`;
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
    agenda_gate: "user_agenda",
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

  if (!specification.agenda_gate || include_agenda) {
    const agenda_raw = accessors ? accessors.future(entity, { vector_text: true }) : entity?.future;
    const agenda_content = String(agenda_raw || "").trim();
    if (agenda_content) {
      rows.push(`        <${specification.agenda_key}>${inline_or_block(agenda_content, 10)}</${specification.agenda_key}>`);
    }
  }

  const personality_raw = sanitize_by_epistemic_policy(entity.eternal?.non_physical, epistemic.personality);
  const personality_content = render_field_value(personality_raw, entity, entities);
  if (String(personality_content || "").trim()) {
    rows.push(`        <${specification.personality_tag}>${inline_or_block(personality_content, 10)}</${specification.personality_tag}>`);
  }

  const state_raw = sanitize_by_epistemic_policy(entity.present?.non_physical, epistemic.state);
  const state_rendered = render_field_value(state_raw, entity, entities);
  const state_content = strip_leading_key_echo(state_rendered, specification.state_strip_keys);
  if (String(state_content || "").trim()) {
    rows.push(`        <${specification.state_tag}>${inline_or_block(state_content, 10)}</${specification.state_tag}>`);
  }

  if (show_dispositions && active_names && name_to_id) {
    const dispositions_xml = render_dispositions(entity, active_names, name_to_id, 8);
    if (dispositions_xml) rows.push(dispositions_xml);
  }

  const axes_xml = render_axes && specification.axes_scope ? render_axes(dynamics, specification.axes_scope) : "";
  if (axes_xml) rows.push(indent_all(axes_xml, 8));

  rows.push(`      </${specification.psychology_tag}>`);

  if (physical_mode === "separate") {
    const entity_kind = specification.tag === "FRACTAL" || entity?.type === "fractal" ? "fractal" : "character";
    const eternal_tag = resolve_profile_field_tag(entity_kind, "eternal.physical", "PHYSICAL_APPEARANCE");
    const present_tag = resolve_profile_field_tag(entity_kind, "present.physical", "CURRENT_LOOK");

    const eternal_raw = sanitize_by_epistemic_policy(entity.eternal?.physical, epistemic.appearance);
    const eternal_body = extract_physical_body(eternal_raw, entity, entities);
    if (eternal_body) {
      rows.push(`      <${eternal_tag}>\n${indent_all(eternal_body, 8)}\n      </${eternal_tag}>`);
    }

    const present_raw = sanitize_by_epistemic_policy(entity.present?.physical, epistemic.appearance);
    const present_body = extract_physical_body(present_raw, entity, entities);
    if (present_body) {
      rows.push(`      <${present_tag}>\n${indent_all(present_body, 8)}\n      </${present_tag}>`);
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

  const memory_raw = accessors
    ? accessors.past(entity, { vector_text: true })
    : Array.isArray(entity?.past)
      ? entity.past
          .map((vector) => vector.content || "")
          .filter(Boolean)
          .join("\n")
      : entity?.past || "";
  const memory_content = sanitize_by_epistemic_policy(memory_raw, epistemic.memory);
  if (String(memory_content || "").trim()) {
    rows.push(`      <${specification.memory_tag}>${inline_or_block(memory_content, 8)}</${specification.memory_tag}>`);
  }

  rows.push(`    </${specification.tag}>`);
  return rows.join("\n");
}

// ============================================================================
// [SECTION 5: MASTER STORY ENTITIES ASSEMBLY]
// ============================================================================

/**
 * Compiles the master <STORY_ENTITIES> XML block configured by the active prompt manifest.
 * Symmetrically reads dispositions, dynamic_axes, user_agenda, and proximate_npcs from config.entities.
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

  const { active_names, name_to_id } = build_scene_roster(entities, npc_entities, in_scene_ids);
  const parts = [];

  if (entities?.AI) {
    parts.push(
      render_sheet(SHEET_SPECS.AI_CHARACTER, {
        entity: entities.AI,
        entities,
        npc_entities,
        accessors,
        render_axes,
        dynamics: axes_for.has("AI") ? speaker_dynamics : null,
        is_owner: !is_npc,
        show_dispositions: dispositions_for.has("AI"),
        include_agenda: true,
        active_names,
        name_to_id,
      }),
    );
  }

  if (entities?.USER) {
    parts.push(
      render_sheet(SHEET_SPECS.USER_PERSONA, {
        entity: entities.USER,
        entities,
        npc_entities,
        accessors,
        render_axes,
        dynamics: null,
        is_owner: false,
        show_dispositions: dispositions_for.has("USER"),
        include_agenda: Boolean(entities_configuration.user_agenda),
        active_names,
        name_to_id,
      }),
    );
  }

  if (entities?.FRACTAL) {
    parts.push(
      render_sheet(SHEET_SPECS.FRACTAL, {
        entity: entities.FRACTAL,
        entities,
        npc_entities,
        accessors,
        render_axes,
        dynamics: axes_for.has("FRACTAL") ? fractal_dynamics : null,
        is_owner: true,
        show_dispositions: dispositions_for.has("FRACTAL"),
        include_agenda: true,
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
  for (const npc_entity of npc_entities || []) {
    const npc_id = String(npc_entity?.id);
    if (!npc_ids_to_render.has(npc_id)) continue;
    rendered_npc_ids.add(npc_id);

    parts.push(
      render_sheet(SHEET_SPECS.NPC, {
        entity: npc_entity,
        entities,
        npc_entities,
        accessors,
        render_axes,
        dynamics: axes_for.has("NPC") ? speaker_dynamics || npc_entity?.dynamics : null,
        is_owner: true,
        show_dispositions: dispositions_for.has("NPC"),
        include_agenda: true,
        active_names,
        name_to_id,
      }),
    );
  }

  if (is_npc && active_speaker) {
    const active_speaker_id = String(active_speaker.id ?? active_speaker.name);
    if (!rendered_npc_ids.has(active_speaker_id)) {
      parts.push(
        render_sheet(SHEET_SPECS.NPC, {
          entity: active_speaker,
          entities,
          npc_entities,
          accessors,
          render_axes,
          dynamics: axes_for.has("NPC") ? speaker_dynamics : null,
          is_owner: true,
          show_dispositions: dispositions_for.has("NPC"),
          include_agenda: true,
          active_names,
          name_to_id,
        }),
      );
    }
  }

  if (entities_configuration.proximate_npcs) {
    const proximate_npcs = render_proximate_npcs(npc_entities, in_scene_ids);
    if (proximate_npcs) parts.push(proximate_npcs);
  }

  return `  <STORY_ENTITIES>\n${parts.join("\n\n")}\n  </STORY_ENTITIES>`;
}

// ============================================================================
// [SECTION 6: AUXILIARY INTELLIGENCE SNAPSHOTS]
// ============================================================================

/**
 * Renders other in-scene participants into an auxiliary <SCENE_CAST> block for Continuum memory passes.
 * Symmetrically activated when `config.entities.scene_cast` is enabled.
 *
 * @param {Record<string, any>} [other_entities={}]
 * @param {string} [target_key=""]
 * @returns {string}
 */
export function render_scene_cast_xml(other_entities = {}, target_key = "") {
  const participant_blocks = Object.entries(other_entities)
    .filter(([entity_key, entity]) => entity && entity_key !== target_key)
    .map(([entity_key, entity]) => {
      const summary = entity.present?.non_physical || entity.eternal?.non_physical || "Active in scene";
      return `  <IN_SCENE_PARTICIPANT name="${escape_xml(entity.name || entity_key)}" role="${escape_xml(entity_key)}">\n    <SUMMARY>${escape_xml(summary)}</SUMMARY>\n  </IN_SCENE_PARTICIPANT>`;
    });

  return participant_blocks.length ? `  <SCENE_CAST>\n${participant_blocks.join("\n")}\n  </SCENE_CAST>\n` : "";
}

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
    return `  <ENTITY_CONTEXT>\n    ${inner_content}\n  </ENTITY_CONTEXT>`;
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
    return `  <ENTITY_CONTEXT>\n    <${tag}>\n      ${indent_continuation(escape_xml(text), 6)}\n    </${tag}>\n  </ENTITY_CONTEXT>`;
  }

  return "";
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG
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
