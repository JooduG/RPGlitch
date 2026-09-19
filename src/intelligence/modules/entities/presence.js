/**
 * src/intelligence/modules/entities/presence.js
 * ============================================================================
 * 📍 PRESENCE MODULE — Spatial Graph, Relational Dispositions & Cast Presence
 * ============================================================================
 *
 * Orchestrates entity spatial presence, relational dispositions, nearby secondary
 * cast formatting, and Director turn arbitration routing rules across the
 * RPGlitch simulation lifecycle.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string compilation.
 * - Imports layout and parsing primitives exclusively from @utils.
 * - Strict Full-Name domain nomenclature.
 * ============================================================================
 */

import { escape_xml, prompt_escape, parse_relational_vector, render_xml_tag } from "@utils";

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
 *
 * @param {any} entity
 * @param {Set<string>} active_names
 * @param {Map<string, string>} name_to_id_map
 * @returns {string}
 */
export function render_dispositions(entity, active_names, name_to_id_map) {
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
  return render_xml_tag({ tag: "DISPOSITIONS", children: rows, child_indent: 2, separator: "\n" });
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
// [SECTION 2: PRESENT ENTITIES & SPEAKER ROUTING]
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

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-09-21: `render_dispositions` is now offset-free — it takes `(entity, active_names, name_to_id_map)` and emits at indent 0 (the dropped `indent` parameter), letting callers place the block via their own `render_xml_tag` nesting.
 * - 2026-09-18: Extracted spatial presence, nearby cast, and Director present entities routing into dedicated presence.js submodule.
 * ============================================================================
 */
