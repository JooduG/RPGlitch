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
 * Renders concise entries for nearby secondary entities or ambient participants as a
 * `<CAST mode="nearby">` block.
 * Symmetrically activated when `config.entities.nearby_entities` is enabled.
 * Supports both array of entities and record maps of other entities.
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
// [SECTION 2: THE ONE CAST BLOCK]
// ============================================================================

export const CAST_TAG = "CAST";

/**
 * The single cast-block vocabulary. Every roster in every mode emits one `<CAST mode="…">`
 * envelope, so director present-participants, prose nearby-entities, and optics active
 * characters share one schema (recommendation #9).
 * @type {Readonly<{ PRESENT: "present", NEARBY: "nearby", ACTIVE: "active" }>}
 */
export const CAST_MODES = Object.freeze({ PRESENT: "present", NEARBY: "nearby", ACTIVE: "active" });

/**
 * Emits the one canonical `<CAST mode="…">` envelope.
 * @param {Object} [parameters]
 * @param {string} [parameters.mode=CAST_MODES.NEARBY] - One of CAST_MODES.
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

export const CAST_HEADERS = Object.freeze({
  PRESENT: "ACTIVE PRESENT PARTICIPANTS:",
  DORMANT: "DORMANT CANDIDATE ENTITIES (STASIS):",
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
 * Renders the Director's `<CAST mode="present">` roster (active present participants + dormant
 * candidates) for turn arbitration. Symmetrically activated when `config.entities.present_entities`
 * is enabled. The speaker-routing and convergence rules live in `<DIRECTIVES>` (`TASK_LIBRARY.DIRECTOR`),
 * not in this data block.
 *
 * @param {Object} [parameters]
 * @param {Record<string, any>} [parameters.entities={}]
 * @param {any[]} [parameters.npc_entities=[]]
 * @param {string[]} [parameters.in_scene_ids=[]]
 * @returns {string}
 */
export function render_present_cast_xml({ entities = {}, npc_entities = [], in_scene_ids = [] } = {}) {
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

  const { DORMANT, PRESENT } = CAST_HEADERS;
  const sections = [
    `${PRESENT}\n${active_participants.join("\n")}`,
    candidate_dormant.length > 0 ? `${DORMANT}\n${candidate_dormant.join("\n")}` : null,
  ].filter(Boolean);

  return render_cast_xml({ mode: CAST_MODES.PRESENT, children: sections });
}

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-09-22: One cast block (recommendation #9) — `PRESENT_ENTITIES` / `NEARBY_ENTITIES` collapse into the single `<CAST mode="present|nearby">` envelope (`render_cast_xml`, `CAST_MODES`); the Director's speaker-routing and convergence prose moved out of the data block into `<DIRECTIVES>` (`TASK_LIBRARY.DIRECTOR`, recommendation #3); `render_present_entities_xml` → `render_present_cast_xml`.
 * - 2026-09-21: `render_dispositions` is now offset-free — it takes `(entity, active_names, name_to_id_map)` and emits at indent 0 (the dropped `indent` parameter), letting callers place the block via their own `render_xml_tag` nesting.
 * - 2026-09-18: Extracted spatial presence, nearby cast, and Director present entities routing into dedicated presence.js submodule.
 * ============================================================================
 */
