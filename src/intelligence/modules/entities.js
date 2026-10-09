/**
 * src/intelligence/modules/entities.js
 * ============================================================================
 * 👥 ENTITIES MODULE — Presence, Cast & Master Assembly
 * ============================================================================
 *
 * Owns entity presence and topology, the canonical cast vocabulary, visibility
 * gating, master <ENTITIES> assembly (render_entity_sheets), and the sensory
 * optics entity block. Sheet rendering (SHEET_SPECS, render_sheet, memory
 * contexts) lives in sheets.js and is consumed here.
 *
 * Two stages: pure-data actor plans (resolve_actor_plan)
 * decide WHO renders with WHICH flags; thin renderer (render_actor_sheets)
 * maps actors to sheet blocks. No epistemic branching lives
 * in the renderers — every owner/bystander/disposition decision is plan data.
 *
 * Architecture & Modification Rules:
 * - Unidirectional layer flow: pure string and structured XML compilation.
 * - Single source of truth for who is present and how the roster assembles.
 * - Strict Full-Name domain nomenclature.
 * ============================================================================
 */

import {
  detox_prose,
  escape_xml,
  render_xml_tag,
  collapse_whitespace,
  truncate_at_word,
  wrap_tag,
  strip_visual_excluded,
  prompt_escape,
} from "@utils";
import { define_sheet, SHEET_SPECS, render_sheet, render_entity_memory_context, render_enhancement_field_context } from "./sheets.js";

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
 * Generates a concise summary for an entity, preferring live state over static copy.
 * @param {any} entity
 * @returns {string}
 */
function summarize_entity(entity) {
  const description = collapse_whitespace(String(entity?.present?.non_physical || entity?.eternal?.non_physical || entity?.description || ""));
  return truncate_at_word(description, 130);
}

/**
 * Renders concise `<ENTITY>` summary rows for nearby secondary entities.
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
// [SECTION 3: VISIBILITY GATES]
// ============================================================================

const blank_visibility = () => ({ dispositions: new Set(), dynamic_axes: new Set(), agendas: new Set() });

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
  target: blank_visibility,
  field: blank_visibility,
  visual: blank_visibility,
  none: blank_visibility,
});

export function resolve_visibility_gates(visibility, speaker) {
  const policy = VISIBILITY_POLICIES[visibility] || VISIBILITY_POLICIES.none;
  return policy(speaker);
}

// ============================================================================
// [SECTION 4: ACTOR PLAN — PURE DATA, NO XML]
// ============================================================================

const TRIO_KEYS = Object.freeze(["AI", "USER", "FRACTAL"]);

/**
 * Compiles the pure-data actor plan for master assembly: gate sets, manifest flags,
 * the ordered sheet-actor list (trio sheets, then NPC sheets), and the nearby list.
 * Every owner/bystander/disposition/dynamics decision is resolved here — renderers
 * map actors to blocks without branching.
 *
 * @param {Object} [parameters]
 * @returns {{ dispositions: string[], dynamic_axes: string[], agendas: string[],
 *   nearby_entities: boolean, candidate_entities: boolean, field_context: boolean,
 *   target_context: boolean, chapter_history: boolean,
 *   sheet_actors: Array<Record<string, any>>, nearby_npcs: any[],
 *   active_names: string[], name_to_id: Map<string, string> }}
 */
export function resolve_actor_plan({
  config = null,
  entities = {},
  npc_entities = [],
  in_scene_ids = [],
  active_speaker = null,
  is_npc = false,
  speaker_key = "AI",
  speaker_dynamics = null,
  fractal_dynamics = null,
} = {}) {
  const configuration = config?.entities || {};
  const { dispositions, dynamic_axes, agendas } = resolve_visibility_gates(config?.visibility, config?.speaker);
  const dispositions_for = dispositions;
  const axes_for = dynamic_axes;

  const { active_names, name_to_id } = resolve_available_entities({ entities, npc_entities, in_scene_ids });

  const dynamics_for = (key) => {
    if (!axes_for.has(key)) return null;
    if (key === speaker_key) return speaker_dynamics;
    if (key === "FRACTAL") return fractal_dynamics;
    return entities?.[key]?.dynamics || null;
  };

  const sheet_actors = [];
  for (const key of TRIO_KEYS) {
    const entity = entities?.[key];
    if (!entity) continue;
    sheet_actors.push({
      spec: key === "AI" ? SHEET_SPECS.AI_CHARACTER : key === "USER" ? SHEET_SPECS.USER_PERSONA : SHEET_SPECS.FRACTAL,
      entity,
      dynamics: dynamics_for(key),
      is_owner: config?.visibility === "director" ? true : key === "FRACTAL" ? true : speaker_key === key,
      show_dispositions: dispositions_for.has(key),
      include_agenda: agendas.has(key),
      include_memories: undefined,
      with_accessors: true,
    });
  }

  const npc_render_ids = new Set();
  const active_speaker_id = is_npc && active_speaker ? String(active_speaker.id ?? active_speaker.name) : null;
  if (is_npc && active_speaker) {
    npc_render_ids.add(String(active_speaker.id ?? active_speaker.name));
  }
  if (dispositions.has("NPC") || dynamic_axes.has("NPC")) {
    const in_scene_set = new Set((in_scene_ids || []).map(String));
    for (const npc_entity of npc_entities || []) {
      if (npc_entity?.id && in_scene_set.has(String(npc_entity.id))) {
        npc_render_ids.add(String(npc_entity.id));
      }
    }
  }

  const candidate_npcs = [...(npc_entities || [])];
  if (is_npc && active_speaker && active_speaker_id && !candidate_npcs.some((candidate) => String(candidate?.id) === active_speaker_id)) {
    candidate_npcs.push(active_speaker);
  }

  const rendered_npc_ids = new Set();
  for (const npc_entity of candidate_npcs) {
    const npc_id = String(npc_entity?.id);
    if (!npc_render_ids.has(npc_id) || rendered_npc_ids.has(npc_id)) continue;
    rendered_npc_ids.add(npc_id);

    const speaking = is_npc && active_speaker_id === npc_id;
    const bystander = is_npc && !speaking;
    sheet_actors.push({
      spec: SHEET_SPECS.NPC,
      entity: npc_entity,
      dynamics: axes_for.has("NPC") ? (speaking ? npc_entity?.dynamics || speaker_dynamics : npc_entity?.dynamics || null) : null,
      is_owner: !bystander,
      show_dispositions: dispositions_for.has("NPC"),
      include_agenda: !bystander,
      include_memories: !bystander,
      with_accessors: !bystander,
    });
  }

  const nearby_npcs = (npc_entities || []).filter((npc) => (in_scene_ids || []).includes(npc?.id) && !rendered_npc_ids.has(String(npc?.id)));

  return Object.freeze({
    dispositions: Object.freeze([...dispositions]),
    dynamic_axes: Object.freeze([...dynamic_axes]),
    agendas: Object.freeze([...agendas]),
    nearby_entities: Boolean(configuration.nearby_entities),
    candidate_entities: Boolean(configuration.candidate_entities),
    field_context: Boolean(configuration.field_context),
    target_context: Boolean(configuration.target_context),
    chapter_history: Boolean(configuration.chapter_history),
    sheet_actors: Object.freeze(sheet_actors),
    nearby_npcs: Object.freeze(nearby_npcs),
    active_names: Object.freeze([...active_names]),
    name_to_id,
  });
}

/**
 * Manifest gate resolver: gate sets plus entity-layer flags for one prompt manifest record.
 * @param {any} [config=null] - Resolved prompt manifest record
 * @returns {Readonly<{ dispositions: string[], dynamic_axes: string[], agendas: string[],
 *   nearby_entities: boolean, candidate_entities: boolean, field_context: boolean,
 *   target_context: boolean, chapter_history: boolean }>}
 */
export function resolve_entities(config = null) {
  const plan = resolve_actor_plan({ config });
  return Object.freeze({
    dispositions: plan.dispositions,
    dynamic_axes: plan.dynamic_axes,
    agendas: plan.agendas,
    nearby_entities: plan.nearby_entities,
    candidate_entities: plan.candidate_entities,
    field_context: plan.field_context,
    target_context: plan.target_context,
    chapter_history: plan.chapter_history,
  });
}

// ============================================================================
// [SECTION 5: ACTOR RENDERER — THIN MAPPER, NO DECISIONS]
// ============================================================================

/**
 * Maps plan actors to sheet blocks. Optional keys are only attached when the actor
 * carries them, so each call matches the historical per-role call shape exactly.
 */
export function render_actor_sheets(
  actors = [],
  { entities = {}, npc_entities = [], accessors = null, render_axes = null, active_names = [], name_to_id = new Map() } = {},
) {
  return (actors || []).map((actor) => {
    const sheet_arguments = {
      entity: actor.entity,
      entities,
      npc_entities,
      render_axes,
      dynamics: actor.dynamics,
      is_owner: actor.is_owner,
      show_dispositions: actor.show_dispositions,
      include_agenda: actor.include_agenda,
      active_names,
      name_to_id,
    };
    if (actor.with_accessors !== undefined) {
      sheet_arguments.accessors = actor.with_accessors ? accessors : null;
    }
    if (actor.include_memories !== undefined) {
      sheet_arguments.include_memories = actor.include_memories;
    }
    return render_sheet(actor.spec, sheet_arguments);
  });
}

export function wrap_entities(parts) {
  return render_xml_tag({
    tag: "ENTITIES",
    children: parts,
    indent: 2,
    child_indent: 2,
    separator: "\n\n",
  });
}

// ============================================================================
// [SECTION 6: MASTER ASSEMBLIES]
// ============================================================================

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
}) {
  const plan = resolve_actor_plan({
    config,
    entities,
    npc_entities,
    in_scene_ids,
    active_speaker,
    is_npc,
    speaker_key,
    speaker_dynamics,
    fractal_dynamics,
  });

  const parts = render_actor_sheets(plan.sheet_actors, {
    entities,
    npc_entities,
    accessors,
    render_axes,
    active_names: plan.active_names,
    name_to_id: plan.name_to_id,
  });

  if (plan.nearby_entities) {
    const nearby_xml = render_nearby_entities_xml(plan.nearby_npcs, { indent: 0 });
    if (nearby_xml) parts.push(nearby_xml);
  }

  if (plan.candidate_entities) {
    const candidates_xml = render_candidate_cast_xml({ entities, npc_entities, in_scene_ids });
    if (candidates_xml) parts.push(candidates_xml);
  }

  return wrap_entities(parts);
}

// ============================================================================
// [SECTION 2: OPTICS SUBJECT TIERS, ACTORS & ENTITIES BLOCK]
// ============================================================================
// Track 0.11: moved verbatim from sensory.js Sections 1+4 - subject tiers and
// the optics actor/entities compilers live with presence and assembly; the
// sensory.js double cycles (sensory<->task, sensory<->entities) are gone.

export const SUBJECT_TIERS = Object.freeze({
  solo_entity:
    "an isolated solo portrait of the subject, self-contained framing drawn entirely from the subject's own identity, appearance, and signature colors",
  story_scene: "an expansive landscape environment, architecture, or interior space capturing environmental depth and natural forces",
  story_entities: "a cinematic group shot featuring both the AI character and user persona together within the fractal environment",
  story_character: "a character framed within their environment, emphasizing their presence with an evocative background setting",
});

export function resolve_optics_subject(target_tier = "", subject = "") {
  return subject || SUBJECT_TIERS[target_tier] || SUBJECT_TIERS.story_character;
}

// ============================================================================

function plan_optics_actor(tag_name, entity_instance) {
  if (!entity_instance) return null;
  const spec_kind = tag_name === "FRACTAL" || entity_instance.type === "fractal" ? "fractal" : "character";
  return {
    spec: define_sheet(spec_kind, { tag: tag_name, default_name: tag_name, ...(spec_kind === "character" ? { owner_state: true } : {}) }),
    entity: entity_instance,
  };
}
/**
 * Compiles the pure-data segment plan for optics tiers: ordered
 * `{ cast, actors }` segments where `cast` wraps its actors in `<CAST mode="active">`.
 */
function resolve_optics_segments({
  tier = "solo_entity",
  solo_subject = null,
  active_ai_character = null,
  active_user_persona = null,
  active_fractal_setting = null,
  main_entity = null,
} = {}) {
  const is_story_tier = tier === "story_entities" || tier === "story_character" || tier === "story_scene";
  const fractal_actor = is_story_tier && active_fractal_setting ? plan_optics_actor("FRACTAL", active_fractal_setting) : null;

  switch (tier) {
    case "solo_entity":
      return [{ cast: true, actors: [plan_optics_actor("SOLO_ENTITY", solo_subject)] }];
    case "story_scene":
      return [{ cast: false, actors: [fractal_actor] }];
    case "story_entities":
      return [
        {
          cast: true,
          actors: [plan_optics_actor("AI_CHARACTER", active_ai_character), plan_optics_actor("USER_PERSONA", active_user_persona)],
        },
        { cast: false, actors: [fractal_actor] },
      ];
    case "story_character":
    default: {
      const main_tag =
        main_entity === active_user_persona || main_entity?.type === "user"
          ? "USER_PERSONA"
          : main_entity?.type === "fractal"
            ? "FRACTAL"
            : "AI_CHARACTER";
      return [
        { cast: true, actors: [plan_optics_actor(main_tag, main_entity)] },
        { cast: false, actors: [fractal_actor] },
      ];
    }
  }
}

/**
 * Maps one optics actor to its sheet block with the exact visual call shape.
 */
function render_optics_actor(actor, { macro_entities = {}, roll = (text) => text } = {}) {
  if (!actor) return "";
  return render_sheet(actor.spec, {
    entity: actor.entity,
    entities: macro_entities,
    mode: "physical",
    include_agenda: false,
    include_memories: false,
    is_owner: true,
    transform_physical: (value) => roll(strip_visual_excluded(value)),
  });
}

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
  const context_block = resolve_optics_segments({
    tier,
    solo_subject,
    active_ai_character,
    active_user_persona,
    active_fractal_setting,
    main_entity,
  })
    .map((segment) => {
      const blocks = segment.actors.map((actor) => render_optics_actor(actor, { macro_entities, roll }));
      return segment.cast ? render_cast_xml({ mode: CAST_MODES.ACTIVE, children: blocks }) : blocks.join("\n");
    })
    .join("\n");

  return wrap_entities([context_block.trim()].filter(Boolean));
}

// ============================================================================

// ── Universal Prompt Plan slot resolvers ────────────────────────────────────
/**
 * System-layer slot: seals the entities block. Sheets modes render through
 * render_entity_sheets; the optics kind compiles locally in Section 2.
 */
export function resolve_entities_slot(config, normalized = {}) {
  if (normalized.entities_kind === "optics") {
    const rendered = render_optics_entities_xml(normalized.optics_entities_args || {});
    if (normalized.task_params && normalized.intent_roll) {
      normalized.task_params.input_intent = detox_prose(normalized.intent_roll.roll(normalized.intent_roll.raw_intent));
    }
    return rendered;
  }
  return render_entity_sheets(normalized.sheets_args || {});
}

/**
 * System-layer slot: seals the continuum target-entity memory context.
 */
export function resolve_target_context_slot(config, normalized = {}) {
  const args = normalized.target_context_args || {};
  if (!args.enabled) return "";
  const target_xml = render_entity_memory_context(args.target_key, args.target_entity);
  return wrap_tag("TARGET_ENTITY_CONTEXT", target_xml, 2);
}

/**
 * System-layer slot: seals the continuum nearby cast roster.
 */
export function resolve_cast_slot(config, normalized = {}) {
  const args = normalized.cast_args || {};
  if (!args.enabled) return "";
  return render_nearby_entities_xml(args.other_entities || {}, { exclude_id: args.exclude_id, indent: 2 });
}

/**
 * Renders settled memory facts into the extraction advisory block
 * (Track 2.4): the `# ALREADY REMEMBERED` register that stops the forge
 * from re-extracting known history. Empty fact lists render "" so modes
 * without settled memory compile byte-identical output.
 * @param {Array<{ text: string, source: string }>} facts
 * @param {number} [indentation_level=2]
 * @returns {string}
 */
export function render_memory_advisory_xml(facts, indentation_level = 2) {
  if (!Array.isArray(facts) || facts.length === 0) return "";
  const numbered = facts
    .slice(0, 12)
    .map((fact, position) => {
      const clean = truncate_at_word(collapse_whitespace(String(fact?.text || "")).trim(), 260);
      return `${position + 1}. ${prompt_escape(clean)}`;
    })
    .filter((line) => line.replace(/^\d+\.\s*/, "").trim().length > 0);
  if (!numbered.length) return "";
  return render_xml_tag({
    tag: "MEMORY_ADVISORY",
    children: ["# ALREADY REMEMBERED", ...numbered, "Treat these as settled — consolidate only genuinely new developments."],
    indent: indentation_level,
    separator: "\n",
  });
}

/**
 * System-layer slot: seals the continuum extraction advisory.
 */
export function resolve_memory_advisory_slot(config, normalized = {}) {
  const args = normalized.memory_advisory_args || {};
  if (!args.enabled) return "";
  return render_memory_advisory_xml(args.facts || []);
}

/**
 * System-layer slot: seals the enhancement field context.
 */
export function resolve_entity_context_slot(config, normalized = {}) {
  const args = normalized.entity_context_args || {};
  if (!args.enabled) return null;
  return render_enhancement_field_context(args.entity, args.field_id, args.content, args.normalized_type, args.format_past_function);
}

/**
 * CHANGELOG
 * - Track 2.4: Extraction advisory — render_memory_advisory_xml + resolve_memory_advisory_slot (MEMORY_ADVISORY block with # ALREADY REMEMBERED; empty facts render "" for byte-identical compiles).
 * - Track 0.11: Absorbed optics subject tiers + actors/entities block from sensory.js (new Section 2; define_sheet + strip_visual_excluded imports added; sensory import dropped). Prompt bytes byte-identical.
 * - 2026-10-04: C rebuild — data-first split: resolve_actor_plan (pure gates + ordered sheet actors + nearby list) feeds thin render_actor_sheets; optics tiers compile through resolve_optics_segments into the shared wrap_entities; four empty visibility policies collapse into one blank policy; candidate summary precedence unified to present → eternal → description; render_entity_sheets renders candidates internally (cast_xml string param retired).
 * - 2026-10-04: Split sheet rendering out to sheets.js (specs, field renderers, memory/enhancement contexts, dispositions); dynamics axes move to physics.js. This module keeps presence, cast, visibility, assembly, and optics entities.
 * - 2026-10-04: Fixed `render_enhancement_field_context` ragged indentation — sibling blocks now compose through `render_xml_tag` (uniform depth) instead of hand-rolled strings with mismatched hardcoded indents; dropped the now-unused `indent_continuation` import.
 * ============================================================================
 * - 2026-10-01: Consolidated presence.js and sheets.js into single src/intelligence/modules/entities.js module under P4 Zero Backwards Compatibility. Relational dispositions now harvest 100% from universal bracket predicates via veil.js.
 * ============================================================================
 * Modules Ground Refactor Phase 1 — actor plans frozen at the boundary (gate Sets become frozen arrays; name_to_id stays a Map) — prompt bytes byte-identical.
 * - 2026-10-07: Modules Ground Refactor Phase 3 — optics actors re-cut to sensory.js (wrap_entities exported; Section 7 moved; dead actor.mode branch retired) — prompt bytes byte-identical.
 */
