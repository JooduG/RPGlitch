/**
 * src/intelligence/modules/entities/sheets.js
 * ============================================================================
 * 📋 SHEETS MODULE — Entity Sheet Specifications & Universal XML Compilers
 * ============================================================================
 *
 * Provides physical appearance synthesis, entity sheet specifications (SHEET_SPECS),
 * single-entity sheet compiler (render_sheet), master available entities compiler
 * (render_entity_sheets), and auxiliary snapshot contexts (memory & enhancement).
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string and structured XML compilation.
 * - Single source of truth for entity sheet XML layouts across all simulation modes.
 * - Strict Full-Name domain nomenclature.
 * ============================================================================
 */

import { escape_xml, physical_to_xml, strip_leading_key_echo, render_field_value, indent_continuation, render_xml_tag } from "@utils";
import { PROFILE_FIELD_CATALOG } from "@data";
import { strip_epistemic_secrets, strip_visual_excluded } from "./epistemic.js";
import { resolve_available_entities, render_dispositions, render_nearby_entities_xml, render_cast_xml, CAST_MODES } from "./presence.js";

// ============================================================================
// [SECTION 1: PHYSICAL STATE SYNTHESIS]
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
 * Extracts and unboxes inner XML body rows from a physical/topographical definition.
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
 * Synthesizes eternal (permanent biometric/topographic baseline) and present (active outfit/atmosphere)
 * into a single unified physical block (<APPEARANCE>).
 * Present attributes cleanly overwrite corresponding eternal attributes by XML tag name.
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
// [SECTION 2: DECLARATIVE SHEET BLUEPRINTS & UNIVERSAL COMPILER]
// ============================================================================

/**
 * Named epistemic visibility policies for a sheet field.
 * - `always`  — the field is always shown, with private [SECRET]/[PLAN] directives stripped.
 * - `owner`   — private directives survive only for the owning perspective (`is_owner`).
 * - `none`    — the field bypasses sanitisation entirely.
 * @type {Readonly<{ ALWAYS: "always", OWNER: "owner", NONE: "none" }>}
 */
export const EPISTEMIC_POLICY = Object.freeze({ ALWAYS: "always", OWNER: "owner", NONE: "none" });

/**
 * Visibility declaration for sheets that keep private STATE when they own the sheet.
 * @type {Readonly<Record<string, string>>}
 */
const EPISTEMIC_OWNER_STATE = Object.freeze({
  agenda: EPISTEMIC_POLICY.ALWAYS,
  personality: EPISTEMIC_POLICY.ALWAYS,
  state: EPISTEMIC_POLICY.OWNER,
  appearance: EPISTEMIC_POLICY.ALWAYS,
  memory: EPISTEMIC_POLICY.ALWAYS,
});

/**
 * Visibility declaration for sheets whose fields are never private.
 * @type {Readonly<Record<string, string>>}
 */
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

/**
 * Frozen catalog of entity sheet blueprints driven by PROFILE_FIELD_CATALOG.
 * Each entry is pure vocabulary — structural tags, section name, physical mode,
 * dynamic-axis scope and the epistemic visibility declaration. The grammatical
 * differences between character / fractal / persona sheets live here as data;
 * the emission sequence itself is shared (see SHEET_SECTIONS).
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

/**
 * The one sheet grammar: an ordered list of wrapper sections, each declaring the
 * field emitters it contains. Every entity kind walks this same sequence — the
 * grammatical differences between kinds live in the SHEET_SPECS vocabulary
 * (section tag, field tags, axis scope, physical mode), never in bespoke
 * branches. A wrapper of `null` emits its fields without an enclosing section.
 *
 * @type {ReadonlyArray<{ wrapper: string | null, fields: ReadonlyArray<string> }>}
 */
const SHEET_SECTIONS = Object.freeze([
  Object.freeze({ wrapper: "psychology_tag", fields: Object.freeze(["agenda", "personality", "state", "dispositions", "axes"]) }),
  Object.freeze({ wrapper: null, fields: Object.freeze(["physical"]) }),
  Object.freeze({ wrapper: null, fields: Object.freeze(["memory"]) }),
]);

/**
 * The physical-only section list Sensory Optics uses: an image subject exposes only its
 * physical state (no agenda/personality/memory), while still flowing through the one
 * `render_sheet` grammar (recommendation #2).
 * @type {ReadonlyArray<{ wrapper: string|null, fields: ReadonlyArray<string> }>}
 */
const VISUAL_SECTIONS = Object.freeze([Object.freeze({ wrapper: null, fields: Object.freeze(["physical"]) })]);
/**
 * One emitter per sheet field role — the complete, single authority for how a
 * sheet field becomes XML. Adding or reordering a field is a data edit
 * (SHEET_SECTIONS + this catalog), not a change to `render_sheet`.
 *
 * @type {Readonly<Record<string, (specification: any, context: any, helpers: any) => string>>}
 */
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
    const state_content = strip_leading_key_echo(render_field_value(state_raw, context.entity, context.entities), specification.state_strip_keys);
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
 * Compiles a single entity sheet XML block by walking the shared grammar
 * (SHEET_SECTIONS) over the kind's vocabulary (SHEET_SPECS). All field visibility
 * resolves through one projection: the spec's `epistemic` declaration plus the
 * caller's perspective flags (`is_owner`, `include_agenda`, `include_memories`,
 * `show_dispositions`). Supports both "combined" physical synthesis (one merged
 * <APPEARANCE>) and "separate" physical unboxing (<APPEARANCE> + <CURRENT_LOOK>).
 *
 * Every element is emitted through `render_xml_tag` at a uniform two-space step,
 * so the whole sheet tree is indent-consistent.
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
 * @param {boolean} [context.include_memories=true]
 * @param {Set<string>} [context.active_names]
 * @param {Map<string, string>} [context.name_to_id]
 * @param {"combined"|"separate"} [context.physical_mode="combined"]
 * @param {((value: string) => string)|null} [context.transform_physical=null] - Post-macro transform applied to each physical body (optics: visual-filter strip + alternation roll).
 * @param {ReadonlyArray<{ wrapper: string|null, fields: ReadonlyArray<string> }>} [context.sections] - Section-list override (optics renders the physical section only).
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
// [SECTION 3: MASTER STORY ENTITIES ASSEMBLY]
// ============================================================================

/**
 * Named entity-visibility policies — the ONE place a mode's "who sees what" is decided.
 * Each policy maps the mode's speaker to the three sheet gates (`dispositions`,
 * `dynamic_axes`, `agendas`) the sheet compiler reads, so a mode declares only its policy
 * name + speaker and the sets live here instead of as three parallel arrays per record.
 *
 * Sheet-bearing policies: `default` (speaker + environment fully visible, listener shows
 * personality/state only), `supporting` (default plus the AI companion's agenda), `director`
 * (everyone's agenda/dispositions, no live axes), `omniscient` (narrator). The tool modes
 * (`target`/`field`/`visual`/`none`) expose no core sheets, so their gates are empty.
 *
 * @type {Readonly<Record<string, (speaker: string|null) => { dispositions: Set<string>, dynamic_axes: Set<string>, agendas: Set<string> }>>}
 */
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

/**
 * Resolves one mode's sheet-visibility policy into the three gate sets the sheet compiler reads.
 * @param {string} [visibility]
 * @param {string|null} [speaker]
 * @returns {{ dispositions: Set<string>, dynamic_axes: Set<string>, agendas: Set<string> }}
 */
export function resolve_visibility_gates(visibility, speaker) {
  const policy = VISIBILITY_POLICIES[visibility] || VISIBILITY_POLICIES.none;
  return policy(speaker);
}

/**
 * Resolves the mode's `entities` manifest layer and the active entity roster into one plan.
 * Single source of truth for every entity gate read (`dispositions`, `dynamic_axes`,
 * `agendas`, `nearby_entities`, `candidate_entities`, `field_context`, `target_context`,
 * `chapter_history`) plus the available-entity maps and NPC render list.
 *
 * @param {any} [config=null] - Resolved prompt manifest record containing `.entities`.
 * @param {Object} [context={}]
 * @param {Record<string, any>} [context.entities={}]
 * @param {any[]} [context.npc_entities=[]]
 * @param {string[]} [context.in_scene_ids=[]]
 * @param {any} [context.active_speaker=null]
 * @param {boolean} [context.is_npc=false]
 * @returns {Readonly<{ dispositions: Set<string>, dynamic_axes: Set<string>, agendas: Set<string>, nearby_entities: boolean, candidate_entities: boolean, field_context: boolean, target_context: boolean, chapter_history: boolean, active_names: Set<string>, name_to_id: Map<string, string>, npc_ids_to_render: Set<string> }>}
 */
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
 * All gates resolve through `resolve_entities`.
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
 * @param {string} [parameters.speaker_key="AI"] - Which core entity is speaking ("AI"/"USER"/"NPC"), gating ownership + agenda visibility.
 * @param {string|null} [parameters.cast_xml=null] - Pre-rendered `<CAST>` roster appended as the final `<ENTITIES>` child.
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

  // The speaking entity owns its sheet (private STATE survives) and carries live axes; the
  // listener is gated by `agendas`/`dispositions`. Swapping `speaker_key` (e.g. "USER" for
  // ghostwrite) mirrors the whole sheet-visibility surface — that is the only structural
  // difference between the interaction and ghostwrite envelopes.
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
// [SECTION 4: AUXILIARY INTELLIGENCE SNAPSHOTS]
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
        const tag = path.endsWith(".physical")
          ? path.startsWith("present")
            ? "CURRENT_LOOK"
            : "APPEARANCE"
          : resolve_profile_field_tag(entity_kind, path);
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
// [SECTION 5: SENSORY OPTICS ENTITY COMPILERS]
// ============================================================================

/**
 * Compiles active characters and cinematography blocks for Sensory Cortex image synthesis.
 * @param {Object} [parameters={}]
 * @returns {string} XML formatted ENTITIES envelope content
 */
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

// ============================================================================
// [SECTION 5: DYNAMICS AXES COMPILER]
// ============================================================================

/**
 * Compiles live dynamics into a <DYNAMIC_AXES> axis-entity block for the story sheet.
 * Each active axis becomes its own named tag (`<CHAOS value="44" low="Order" high="Volatility" />`).
 *
 * @param {Record<string, number>|null} [live_dynamics=null]
 * @param {"somatic" | "fractal" | null} [scope=null] - Restrict to one axis group
 * @param {Record<string, { label: string, low: string, high: string, scope?: string }>} [axes_registry={}]
 * @returns {string} XML block string or "" if no dynamics are active.
 */
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
 * - 2026-09-24: `resolve_entities` gate renamed `present_entities` → `candidate_entities`, matching the cast block's refined role (off-stage reuse candidates only, never a restatement of sheeted participants).
 * - 2026-09-23: Prompt-grammar harmonization (phases 0–3) — deleted `render_dynamics_xml` (the Director now uses the shared `render_dynamics_axes_xml`) and `render_optics_subject_rules`; `<ENTITIES>` is now pure data (the SOLO FRAME / AFFIRMATIVE ENVIRONMENTAL SCALE / background directives and the subject rules moved into `<DIRECTIVES>`), and `prompt_escape` is no longer imported.
 * - 2026-09-23: Visibility policy (R3) — added the exported `VISIBILITY_POLICIES` table and `resolve_visibility_gates(visibility, speaker)`; `resolve_entities` now derives the `dispositions`/`dynamic_axes`/`agendas` sheet gates from the mode's `visibility` + `speaker` instead of reading three parallel `config.entities` arrays. Output bytes unchanged.
 * - 2026-09-23: Entity-visibility mirror + cast nesting — the agenda gate is now the `agendas` list (replacing `user_agenda`) and sheet ownership/axes flow from a single `speaker_key`, so ghostwrite is interaction with `speaker_key="USER"` (AI↔USER visibility swapped); `<ENTITIES>` accepts a `cast_xml` roster appended as its final child. `USER_PERSONA.axes_scope` is now `"somatic"` so the player sheet can carry its own axes when it is the speaker (ghostwrite), completing the mirror — the manifest's `dynamic_axes` gate still keeps those axes hidden in every listener position.
 * - 2026-09-22: One entity-sheet grammar (recommendation #2) — the fractal sheet now uses `PSYCHOLOGY`/`APPEARANCE`, every physical sheet uses one `APPEARANCE`/`CURRENT_LOOK` vocabulary for all kinds (retiring `ESSENCE`/`TOPOGRAPHY`/`PHYSICAL_APPEARANCE`/`ENVIRONMENT`/`ATMOSPHERE`), and optics' blocks route through the shared `render_sheet` path via `VISUAL_SECTIONS` + `context.transform_physical`.
 * - 2026-09-21: Tag nomenclature pass — the fractal psychology wrapper is now `ESSENCE` (was the ambiguous `ATMOSPHERE`, which collided with the physical `<ATMOSPHERE>` weather key) and the optics present-look wrapper is `CURRENT_LOOK` (was `CURRENT_IMPRESSION`); sheet field indentation now composes through nested `render_xml_tag` calls for uniform 2-space steps.
 * - 2026-09-20: Sheet-grammar unification — `SHEET_SPECS` is now pure vocabulary (tags, section name, axis scope, physical mode, `epistemic`) walked by one shared `SHEET_SECTIONS` sequence + `SHEET_FIELD_RENDERERS` catalog; named `EPISTEMIC_POLICY` constants and `EPISTEMIC_ALWAYS` / `EPISTEMIC_OWNER_STATE` bundles replace the duplicated visibility literals, and `render_sheet` resolves every field through one projection. Intentional grammatical differences (PSYCHOLOGY/ATMOSPHERE, APPEARANCE/TOPOGRAPHY, combined vs separate physical) remain declared per-kind data. Also «SHIRT»/«JACKET» metasyntax in `render_optics_subject_rules`.
 * - 2026-09-19: Added `resolve_entities(config, context)` as the single resolver for every `config.entities` gate plus the available-entity maps and NPC render list; `render_entity_sheets` now consumes that plan instead of reading `.entities` directly.
 * - 2026-09-19: Layer boundary purification: Replaced `@media` import of `strip_visual_excluded` with sibling import from `./epistemic.js`, restoring unidirectional downward layer flow.
 * - 2026-09-19: Added <SIGNATURE_COLORS> directive in render_optics_subject_rules mandating verbatim preservation of hair, eyes, and distinctive accent colors in generated prompt prose (F1).
 * - 2026-09-19: Architectural boundary purification: Relocated `resolve_optics_cinematography` to Layer 6 `src/intelligence/modules/task.js`; `sheets.js` now exclusively governs Layer 4 (<ENTITIES>) physical appearance synthesis, entity specs, and subject rules.
 * - 2026-09-18: Absorbed render_optics_entities_xml from deconstructed optics.js unifying visual entity sheets and cinematography into canonical <ENTITIES> envelope.
 * - 2026-09-18: Standardized master entity sheet envelope tag from <AVAILABLE_ENTITIES> to canonical <ENTITIES> per scrobbles.md blueprint.
 * - 2026-09-18: Extracted sheet specifications, physical synthesis, and universal sheet compilation into dedicated sheets.js submodule.
 * ============================================================================
 */
