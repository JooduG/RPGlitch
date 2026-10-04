/**
 * src/intelligence/modules/entities.js
 * ============================================================================
 * 👥 ENTITIES MODULE — Spatial Presence, Cast & Master Assembly
 * ============================================================================
 *
 * Owns entity presence and topology, the canonical cast vocabulary, visibility
 * gating, master <ENTITIES> assembly (render_entity_sheets), and the sensory
 * optics entity block. Sheet rendering (SHEET_SPECS, render_sheet, memory
 * contexts) lives in sheets.js and is consumed here.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string and structured XML compilation.
 * - Single source of truth for who is present and how the roster assembles.
 * - Strict Full-Name domain nomenclature.
 * ============================================================================
 */

import { escape_xml, render_xml_tag, strip_visual_excluded, collapse_whitespace, truncate_at_word } from "@utils";
import { SHEET_SPECS, VISUAL_SECTIONS, render_sheet } from "./sheets.js";

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
// [SECTION 3: MASTER STORY ENTITIES ASSEMBLY]
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
// [SECTION 4: SENSORY OPTICS ENTITIES]
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

/**
 * CHANGELOG
 * - 2026-10-04: Split sheet rendering out to sheets.js (specs, field renderers, memory/enhancement contexts, dispositions); dynamics axes move to physics.js. This module keeps presence, cast, visibility, assembly, and optics entities.
 * - 2026-10-04: Fixed `render_enhancement_field_context` ragged indentation — sibling blocks now compose through `render_xml_tag` (uniform depth) instead of hand-rolled strings with mismatched hardcoded indents; dropped the now-unused `indent_continuation` import.
 * ============================================================================
 * - 2026-10-01: Consolidated presence.js and sheets.js into single src/intelligence/modules/entities.js module under P4 Zero Backwards Compatibility. Relational dispositions now harvest 100% from universal bracket predicates via veil.js.
 * ============================================================================
 */
