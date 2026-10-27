/**
 * src/intelligence/builder.js
 * ============================================================================
 * 🧠 INTELLIGENCE KERNEL PROMPT BUILDER — Master Prompt Assembly Line
 * ============================================================================
 *
 * Centralized assembly line for the RPGlitch Intelligence Kernel.
 * Consumes the declarative manifest in ./prompts.js and the 5 structural modules
 * (system, constitution, protocols, entities, task) to compile all prompt payloads:
 * 1. Render Accessor Factory (create_render_accessors)
 * 2. Shared Context Normalization (normalize_context)
 * 3. Mode Context Normalizers (per-mode slot-input bags)
 * 4. Mode Adapter Table (MODE_ADAPTERS normalize dispatch)
 *
 * Architecture & Purity Invariant:
 * - Pure normalization layer: prepares slot inputs; prompts.js seals the plan.
 * - Leaves domain engines (director.js, story.js, temporal.js, profile.js) 100% prompt-free.
 * ============================================================================
 */

import { PROFILE_FIELD_CATALOG, VISUAL_STYLES, resolve_portrait_visual_style_key } from "@data";
import {
  prompt_escape,
  strip_cognition_blocks,
  resolve_alternations,
  alternation_field_label,
  state_bridge,
  get_value,
  clean_text,
  create_relational_context,
  has_bracket_bond,
} from "@utils";
import { ensure_embeddings } from "@platform";
import { normalize_image_tier } from "@media";
import { resolve_style_snapshot, resolve_visual_engine_tokens } from "./modules/style.js";
import { resolve_stability_lock } from "./modules/reflex.js";
import {
  resolve_pov_protocol,
  resolve_macro_directive,
  resolve_layer_tense_protocol,
  resolve_somatic_interference_protocol,
} from "./modules/protocols.js";
import { resolve_entities } from "./modules/entities.js";
import { render_dynamics_axes_xml, render_subtext_xml } from "./dynamics.js";

import { render_history, resolve_history, HISTORY_TOKEN_BUDGET } from "./modules/recency.js";
import { resolve_character_action_directive, resolve_scene_action_directive } from "./modules/task.js";
import { extract_spent_ledger, render_constraints_directive, render_director_constraints_directive } from "./modules/reflex.js";
import { resolve_optics_cinematography } from "./modules/style.js";
import { get_output_format } from "./modules/output.js";
import { DYNAMICS_AXES, PHYSICS_PROTOCOLS, evaluate_dynamics_rules, evaluate_subtext_protocols } from "./dynamics.js";
import { temporal_engine, resolve_vector_pool, resolve_settled_facts } from "./temporal.js";

/**
 * Converts entity data into raw statistical data points according to the canonical profile field catalog.
 * @param {any} entity
 * @returns {Array<{ text: string, type: string, enhancer: string, section: string, layer?: string, emotional_weight?: number, density_multiplier?: number }>}
 */
export function to_data_points(entity) {
  if (!entity) return [];
  const entity_type = entity.type === "user" ? "character" : entity.type || "character";
  const prefix = `${entity_type}.`;
  const list = [];

  for (const [field_id, metadata] of Object.entries(PROFILE_FIELD_CATALOG)) {
    if (!field_id.startsWith(prefix)) continue;
    const val = get_value(entity, metadata.path);

    if (val && typeof val === "string") {
      const is_eternal = metadata.layer_key?.toLowerCase() === "eternal";
      const is_physical = metadata.path.endsWith(".physical");
      list.push({
        text: clean_text(val, 2000),
        type: is_physical ? "Physical" : (metadata.label ?? "unknown"),
        enhancer: metadata.enhancer ?? "SYSTEM",
        section: metadata.section_label || "Present",
        layer: metadata.layer_key,
        emotional_weight: metadata.emotional_weight ?? (is_eternal ? 10 : 5),
        density_multiplier: metadata.density_multiplier ?? 1.0,
      });
    }
  }

  return list.filter((item) => item.text.length > 0);
}

export const context_builder = {
  /**
   * Pulls and resolves all necessary state for an intelligence turn.
   * Returns a structured IntelligencePayload.
   *
   * @param {string} input - The current user input.
   * @param {"simulation"|"logic"|"image"} [type="simulation"] - Generation mode.
   * @param {any[]} [simulation_log=[]] - Recent message log.
   * @returns {Promise<any>}
   */
  async build_context(input, type = "simulation", simulation_log = []) {
    const round = state_bridge.runtime?.round ?? 1;

    // 1. Resolve Triad Entities (Role -> Data)
    const clean = state_bridge.runtime?.snapshot_entities ?? {};
    const entries = [
      { role: "AI", data: clean.AI },
      { role: "USER", data: clean.USER },
      { role: "FRACTAL", data: clean.FRACTAL },
    ];

    // Pre-embed all temporal vectors for semantic scoring (awaited with timeout fallback)
    const all_vectors = [];
    for (const { data } of entries) {
      const pool = resolve_vector_pool(data);
      if (pool.length) all_vectors.push(...pool);
    }
    for (const raw of Object.values(state_bridge.runtime?.snapshot_npcs ?? {})) {
      const pool = resolve_vector_pool(raw);
      if (pool.length) all_vectors.push(...pool);
    }

    if (all_vectors.length) {
      await Promise.race([ensure_embeddings(all_vectors).catch(() => {}), new Promise((resolve) => setTimeout(resolve, 30000))]);
    }

    const entities = /** @type {Record<string, any>} */ ({});

    // 2. Synchronous hydration of triad entities
    for (const { role, data } of entries) {
      const raw = data || {
        id: null,
        name: role,
        role,
        fragments: [],
        eternal: { physical: "", non_physical: "" },
        present: { physical: "", non_physical: "" },
        future: "",
        past: [],
        dynamics: {},
      };

      const has_content = Boolean(raw.eternal?.physical || raw.eternal?.non_physical || raw.present?.physical || raw.present?.non_physical);

      const eternal = {
        physical: raw.eternal?.physical || "",
        non_physical: raw.eternal?.non_physical || "",
      };

      const present = {
        physical: raw.present?.physical || "",
        non_physical: raw.present?.non_physical || (has_content ? "" : `A nascent ${role.toLowerCase()} entity. State: Initializing.`),
      };

      const fragments = { eternal, present };

      entities[role] = {
        id: raw.id,
        name: raw.name || role,
        _data_points: [],
        fragments,
        eternal,
        present,
        memories: resolve_vector_pool(raw),
        future: typeof raw.future === "string" ? raw.future : "",
        past: Array.isArray(raw.past) ? raw.past : [],
        dynamics: raw.dynamics,
        dynamics_baseline: raw.dynamics_baseline,
        associated_ids: raw.associated_ids || [],
      };
    }

    // 3. NPC World Cast — Hydrate secondary characters for Director choreography
    // (Track 1.3: staging reads presence; Track 1.4: relations are bracket predicates)
    const npc_map = state_bridge.runtime?.snapshot_npcs ?? {};
    const in_scene_ids = Object.values(npc_map)
      .filter(
        (raw) =>
          raw?.presence === "active" || (raw?.presence == null && (state_bridge.runtime?.snapshot_in_scene_npc_ids ?? []).includes(String(raw?.id))),
      )
      .map((raw) => String(raw.id));
    const npc_entities = Object.values(npc_map).map((raw) => ({
      id: raw.id,
      name: raw.name || raw.id,
      type: "character",
      presence: raw.presence ?? "nearby",
      eternal: { physical: raw.eternal?.physical || "", non_physical: raw.eternal?.non_physical || "" },
      present: { physical: raw.present?.physical || "", non_physical: raw.present?.non_physical || "" },
      memories: resolve_vector_pool(raw),
      dynamics: raw.dynamics,
      dynamics_baseline: raw.dynamics_baseline,
      future: raw.future || "",
      past: Array.isArray(raw.past) ? raw.past : [],
      is_wanderer: !!raw.is_wanderer,
      voice: raw.voice,
      speaking_style: raw.speaking_style,
      profile_picture: raw.profile_picture,
      signature_color: raw.signature_color,
    }));

    // 4. Assemble Unified Intelligence Payload
    return {
      input,
      type,
      round,
      entities,
      npc_entities,
      in_scene_ids,
      view_id: "global",
      raw_messages: simulation_log,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  },
};

/**
 * Builds context text for temporal vector relevance scoring.
 * @param {string} [input]
 * @param {any[]} [simulation_log]
 * @returns {string}
 */
export function build_scoring_context(input = "", simulation_log = []) {
  const recent = (Array.isArray(simulation_log) ? simulation_log : [])
    .slice(-10)
    .map((message) => message.content || message.text || "")
    .join(" ");
  return `${input || ""} ${recent}`.trim();
}

/**
 * Creates an accessor bundle for retrieving formatted memories, future agenda, and history.
 * @param {Record<string, any>} [entities={}]
 * @param {string} [input=""]
 * @param {any[]} [raw_messages=[]]
 * @returns {{ _context: string, past: Function, future: Function, simulation_log: Function }}
 */
export function create_render_accessors(entities = {}, input = "", raw_messages = []) {
  const resolve = (reference) => (typeof reference === "string" ? entities[reference] || entities.AI || {} : reference || {});
  const scoring_context = build_scoring_context(input, raw_messages);

  return {
    _context: scoring_context,
    past: (reference, options = {}) => {
      const entity = resolve(reference);
      const formatted = temporal_engine.format_hybrid(resolve_vector_pool(entity), scoring_context, {
        offset: 0,
        max_chars: 1500,
        dynamics: entity?.dynamics,
        ...options,
      });
      return formatted;
    },
    future: (reference) => {
      const entity = resolve(reference);
      const raw_future = String(entity?.future || "").trim();
      const extracted_plan = extract_plan_from_state(entity?.present?.non_physical);
      const combined_future = [raw_future, extracted_plan ? `Active Plan: ${extracted_plan}` : ""].filter(Boolean).join("\n");
      return combined_future.trim();
    },
    simulation_log: (limit = 10, offset = 0, options = {}) =>
      render_history(raw_messages, { limit, offset, indent: 2, token_budget: options?.token_budget ?? Infinity }),
  };
}

// ── 2. Internal Helpers ───────────────────────────────────────────────────────

/**
 * Extracts the content of any [PLAN: ...] brackets from state text.
 * @param {string|null|undefined} text
 * @returns {string}
 */
function extract_plan_from_state(text) {
  if (!text) return "";
  const plans = [];
  const regex = /\[PLAN\s*:\s*([^\]]*)\]/gi;
  let match;
  while ((match = regex.exec(String(text))) !== null) {
    if (match[1] && match[1].trim()) {
      plans.push(match[1].trim());
    }
  }
  return plans.join("; ");
}

/**
 * Resolves or creates a render_accessors bundle for prompt generation.
 * Accepts either raw_messages or simulation_log from the payload.
 * @param {any} payload
 * @param {any} [override_entities]
 */
function resolve_accessors(payload, override_entities = null) {
  if (payload?.render_accessors) return payload.render_accessors;
  const entities = override_entities || payload?.entities || {};
  const messages = Array.isArray(payload?.raw_messages) && payload.raw_messages.length > 0 ? payload.raw_messages : payload?.simulation_log || [];
  return create_render_accessors(entities, payload?.input || "", messages);
}

// ── 3. Mode Context Normalizers ─────────────────────────────────────────────
// Each normalizer mirrors its retired compiler's data gathering exactly and
// returns a frozen-ready bag of slot inputs; prompts.js resolves + seals.

function create_axes_renderer() {
  return (dynamics, scope) => render_dynamics_axes_xml(dynamics, scope, DYNAMICS_AXES);
}

function resolve_prose_bag(config, context, bag_inputs) {
  const { entities, speaker, listener, accessors, style_snapshot, snapshot, director_data } = bag_inputs;
  const is_ghostwrite = config.speaker === "USER";
  const is_npc = config.speaker === "NPC";
  const active_speaker = speaker || (is_ghostwrite ? entities?.USER : entities?.AI);
  const active_listener = listener || (is_ghostwrite ? entities?.AI : entities?.USER);
  const pov_protocol = resolve_pov_protocol(config.system.pov || active_speaker);
  const speaker_name = prompt_escape(active_speaker?.name || (is_npc ? "NPC" : "AI"));
  const listener_name = prompt_escape(active_listener?.name || "Listener");
  const fractal_name = prompt_escape(entities?.FRACTAL?.name || "the setting");
  const speaker_key = config.speaker || "AI";
  const speaker_dynamics = config.speaker === "AI" ? snapshot?.ai?.dynamics || entities?.AI?.dynamics || {} : active_speaker?.dynamics || {};
  const fractal_dynamics = snapshot?.fractal?.dynamics || entities?.FRACTAL?.dynamics || {};
  const speaker_name_lc = String(active_speaker?.name || "")
    .toLowerCase()
    .trim();
  const listener_name_lc = String(active_listener?.name || "")
    .toLowerCase()
    .trim();
  const has_prior_relationship = Boolean(speaker_name_lc && listener_name_lc && has_bracket_bond(active_speaker, active_listener));
  const is_first_contact = !has_prior_relationship && director_data?.first_contact === true;
  const base_action_directive = resolve_character_action_directive({ speaker_name, is_first_contact, is_ghostwrite });
  const constraints_directive = render_constraints_directive(
    extract_spent_ledger(context.recent_history || context.simulation_log || context.raw_messages || []),
    { include_static: true },
  );
  const action_directive = base_action_directive;
  const input_origin_entity = is_ghostwrite ? active_speaker : entities?.USER;
  const input_origin = input_origin_entity?.id || input_origin_entity?.name || "USER";
  const style = style_snapshot.style;
  const turn_meta = context.meta ?? {};
  const subtext_xml = is_ghostwrite
    ? ""
    : render_subtext_xml(speaker_dynamics, fractal_dynamics, {
        keywords: director_data?.keywords || turn_meta?.keywords || [],
        style,
        physics_protocols: PHYSICS_PROTOCOLS,
        evaluate_dynamics_rules,
        evaluate_subtext_protocols,
      });
  const speaker_slug = String(active_speaker?.id || active_speaker?.name || (is_npc ? "npc" : "companion"))
    .toLowerCase()
    .replace(/\s+/g, "_");
  const listener_slug = String(active_listener?.id || active_listener?.name || "traveler")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const relational_context = create_relational_context({
    me: active_speaker,
    you: active_listener,
    speaker: active_speaker,
    listener: active_listener,
    target: active_listener,
    witnesses: (context.npc_entities || []).filter((npc) => npc?.id !== active_speaker?.id && npc?.id !== active_listener?.id),
  });
  return {
    round: context.round ?? null,
    attributes: {
      speaker: speaker_slug,
      listener: listener_slug,
    },
    role_args: { speaker_name, listener_name, fractal_name },
    core_protocols_args: {
      pov_protocol,
      style,
      alternation_source: "entities",
      player_name: entities.USER?.name || null,
      constraints_xml: constraints_directive,
      protocols: [resolve_somatic_interference_protocol(speaker_dynamics)].filter(Boolean),
    },
    entities_kind: "sheets",
    sheets_args: {
      entities,
      npc_entities: context.npc_entities || [],
      in_scene_ids: context.in_scene_ids || [],
      active_speaker,
      accessors,
      config,
      is_npc,
      render_axes: create_axes_renderer(),
      speaker_dynamics,
      fractal_dynamics,
      speaker_key,
      relational_context,
    },
    history_args: { kind: "simulation_log", accessors },
    task_params: {
      task_state: config.task_state,
      input: context.input ?? "",
      input_origin,
      round: context.round ?? null,
      style,
      subtext_xml,
      snapshot: { dynamics: speaker_dynamics, style, style_dna: style_snapshot.style_dna },
      action_directive,
      stability_lock: resolve_stability_lock(turn_meta),
      stagnation_turns: turn_meta.stagnation_turns ?? context.stagnation_turns ?? 0,
      relational_context,
    },
    meta_args: {
      ai: context.compressed_snapshot?.ai?.dynamics,
      fractal: context.compressed_snapshot?.fractal?.dynamics,
      flags: context.compressed_snapshot?.flags || {},
      ...(context.meta || {}),
    },
  };
}

function normalize_prose_context(config, context) {
  const { render_accessors, style_snapshot } = normalize_context(context);
  return resolve_prose_bag(config, context, {
    entities: context.entities || {},
    speaker: context.speaker ?? null,
    listener: context.listener ?? null,
    accessors: render_accessors,
    style_snapshot,
    snapshot: context.snapshot || context.compressed_snapshot || {},
    director_data: context.director_data || {},
  });
}

function normalize_npc_context(config, context) {
  const npc_entity = context.npc || context.speaker;
  const raw_entities = context.entities || {};
  const combined_entities = npc_entity?.id ? { ...raw_entities, [npc_entity.id]: npc_entity } : raw_entities;
  const { snapshot, render_accessors: npc_accessors, style_snapshot } = normalize_context(context, combined_entities);
  const bag = resolve_prose_bag(config, context, {
    entities: combined_entities,
    speaker: npc_entity,
    listener: context.listener ?? null,
    accessors: npc_accessors,
    style_snapshot,
    snapshot,
    director_data: context.director_data || {},
  });
  return {
    ...bag,
    meta_args: {
      ai: snapshot.ai?.dynamics,
      fractal: snapshot.fractal?.dynamics,
      role: "npc",
      entity_id: npc_entity?.id,
    },
  };
}

function normalize_narrator_context(config, context) {
  const scene_template = context.scene_template || (context.is_prologue ? "PROLOGUE" : context.is_epilogue ? "EPILOGUE" : "CONTINUATION");
  const is_conclusion = scene_template === "EPILOGUE" || scene_template === "COLLAPSE" || Boolean(context.is_epilogue);
  const { entities, snapshot, render_accessors, style_snapshot } = normalize_context(context, null, { require_trio: is_conclusion });
  let resolved_template = scene_template || "CONTINUATION";
  let narrator_snapshot = snapshot;
  if (is_conclusion) {
    const conclusion_status = context.conclusion_status || (scene_template === "COLLAPSE" ? "COLLAPSED" : "EPILOGUE");
    resolved_template = conclusion_status === "COLLAPSED" ? "COLLAPSE" : "EPILOGUE";
    narrator_snapshot = {
      ai: { dynamics: snapshot.ai?.dynamics || context.dynamics?.ai },
      fractal: { dynamics: snapshot.fractal?.dynamics || context.dynamics?.fractal },
    };
  }
  const is_prologue = context.is_prologue ?? false;
  const is_prologue_beat = is_prologue || resolved_template === "PROLOGUE";
  const speaker = entities?.FRACTAL;
  const speaker_name = prompt_escape(speaker?.name || "The Scene");
  const pov_protocol = resolve_pov_protocol(config.system.pov);
  const speaker_dynamics = narrator_snapshot?.ai?.dynamics || null;
  const fractal_dynamics = narrator_snapshot?.fractal?.dynamics || null;
  const base_action_directive = resolve_scene_action_directive({
    scene_template: resolved_template,
    is_prologue,
    conclusion_status: context.conclusion_status ?? null,
    input: context.input ?? "",
  });
  const constraints_directive = render_constraints_directive(
    extract_spent_ledger(context.recent_history || context.simulation_log || context.raw_messages || []),
    { include_static: true },
  );
  const action_directive = base_action_directive;
  const input_origin_entity = entities?.USER;
  const input_origin = input_origin_entity?.id || input_origin_entity?.name || "USER";
  const turn_meta = context.meta ?? {};
  const style = style_snapshot.style;
  const subtext_xml = render_subtext_xml(speaker_dynamics, fractal_dynamics, {
    keywords: turn_meta?.keywords || [],
    style,
    physics_protocols: PHYSICS_PROTOCOLS,
    evaluate_dynamics_rules,
    evaluate_subtext_protocols,
  });
  const beat_input = is_prologue_beat ? "" : (context.input ?? "");
  const narrator_speaker_slug = String(speaker?.id || speaker?.name || "fractal")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const narrator_listener_slug = String(input_origin_entity?.id || input_origin_entity?.name || "traveler")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const narrator_relational_context = create_relational_context({
    me: speaker,
    you: input_origin_entity,
    speaker,
    listener: input_origin_entity,
    target: input_origin_entity,
    witnesses: [],
  });
  return {
    round: context.round ?? 0,
    attributes: {
      speaker: narrator_speaker_slug,
      listener: narrator_listener_slug,
    },
    role_args: { speaker_name, listener_name: "", fractal_name: "" },
    core_protocols_args: {
      pov_protocol,
      style,
      alternation_source: "entities",
      player_name: entities.USER?.name || null,
      constraints_xml: constraints_directive,
      protocols: [resolve_somatic_interference_protocol(speaker_dynamics || fractal_dynamics)].filter(Boolean),
    },
    entities_kind: "sheets",
    sheets_args: {
      entities,
      npc_entities: [],
      in_scene_ids: [],
      active_speaker: null,
      accessors: render_accessors,
      config,
      is_npc: false,
      render_axes: create_axes_renderer(),
      speaker_dynamics,
      fractal_dynamics,
      speaker_key: "AI",
      relational_context: narrator_relational_context,
    },
    history_args: { kind: "simulation_log", accessors: render_accessors },
    task_params: {
      task_state: config.task_state,
      input: beat_input,
      input_origin,
      round: context.round ?? 0,
      style,
      subtext_xml,
      snapshot: { dynamics: fractal_dynamics, style, style_dna: style_snapshot.style_dna },
      action_directive,
      stability_lock: resolve_stability_lock(turn_meta),
      relational_context: narrator_relational_context,
    },
    meta_args: {
      ai: narrator_snapshot.ai?.dynamics,
      fractal: narrator_snapshot.fractal?.dynamics,
      flags: snapshot.flags || {},
    },
  };
}

function normalize_director_context(config, context) {
  if (context.terse) {
    return {
      terse: true,
      round: context.round ?? null,
      attributes: {},
      task_params: { schema: context.schema || get_output_format(config.format) },
      meta_args: {
        ai: context.compressed_snapshot?.ai?.dynamics,
        fractal: context.compressed_snapshot?.fractal?.dynamics,
      },
    };
  }
  const { render_accessors } = normalize_context(context);
  const snapshot_bag = context.compressed_snapshot || {};
  const raw_messages = context.raw_messages || [];
  const simulation_log = context.simulation_log || [];
  const active_messages = raw_messages.length > 0 ? raw_messages : simulation_log;
  const schema = get_output_format(config.format);
  const merged_dynamics = { ...(snapshot_bag?.fractal?.dynamics || {}), ...(snapshot_bag?.ai?.dynamics || {}) };
  const last_ai_message = (active_messages || []).filter((message) => message.role === "model").at(-1);
  const last_ai_text = last_ai_message ? strip_cognition_blocks(last_ai_message.content || last_ai_message.text || "").trim() : "";
  const director_speaker = context.entities?.AI || null;
  const director_listener = context.entities?.USER || null;
  const director_relational_context = create_relational_context({
    me: director_speaker,
    you: director_listener,
    speaker: director_speaker,
    listener: director_listener,
    target: director_listener,
    witnesses: context.npc_entities || [],
  });
  return {
    round: context.round ?? null,
    attributes: {},
    role_args: {},
    core_protocols_args: { alternation_source: "entities", constraints_xml: render_director_constraints_directive() },
    merged_dynamics,
    entities_kind: "sheets",
    sheets_args: {
      entities: context.entities || {},
      npc_entities: context.npc_entities || [],
      in_scene_ids: context.in_scene_ids || [],
      active_speaker: null,
      accessors: render_accessors,
      config,
      is_npc: false,
      render_axes: create_axes_renderer(),
      speaker_dynamics: snapshot_bag?.ai?.dynamics,
      fractal_dynamics: snapshot_bag?.fractal?.dynamics,
      speaker_key: "AI",
      relational_context: director_relational_context,
    },
    history_args: { kind: "simulation_log", accessors: render_accessors },
    task_params: {
      task_state: config.task_state,
      entities: context.entities || {},
      round: context.round ?? null,
      input: context.input ?? "",
      last_ai_text,
      schema,
      stagnation_turns: context.stagnation_turns ?? context.meta?.stagnation_turns ?? 0,
      relational_context: director_relational_context,
    },
    meta_args: {
      ai: snapshot_bag?.ai?.dynamics,
      fractal: snapshot_bag?.fractal?.dynamics,
    },
  };
}

function normalize_continuum_context(config, context) {
  const target_entity = context.target_entity;
  const target_key = context.target_key || "AI_CHARACTER";
  const other_entities = context.other_entities || {};
  const history = context.history || [];
  const entity_plan = resolve_entities(config);
  const history_config = resolve_history(config.history);
  const target_name = target_entity?.name || target_key;
  const target_type = target_entity?.type || (target_key === "FRACTAL" ? "fractal" : "character");
  return {
    round: null,
    attributes: { target: target_name },
    role_args: { target_name },
    core_protocols_args: {},
    target_context_args: { enabled: entity_plan.target_context, target_key, target_entity },
    cast_args: {
      enabled: entity_plan.nearby_entities,
      other_entities,
      exclude_id: target_entity?.id || target_entity?.name,
    },
    chapter_history_args: { enabled: entity_plan.chapter_history, target_entity },
    memory_advisory_args: { enabled: true, facts: resolve_settled_facts(target_entity) },
    history_args: {
      kind: "input_history",
      enabled: history_config.enabled,
      history,
      limit: history_config.limit,
      max_chars: history_config.max_chars,
      token_budget: HISTORY_TOKEN_BUDGET,
    },
    task_params: {
      task_state: config.task_state,
      target_name,
      target_type,
      schema: get_output_format(config.format, { entity_type: target_type }),
    },
    meta_args: {
      ai: other_entities?.AI?.dynamics,
      fractal: other_entities?.FRACTAL?.dynamics,
    },
  };
}

function normalize_enhancement_context(config, context) {
  const entity_plan = resolve_entities(config);
  const entity_type = context.entity_type || "character";
  const normalized_type = entity_type === "user" ? "character" : entity_type || "character";
  const field_id = context.field_id || "";
  const content = context.content;
  const catalog_meta = field_id ? PROFILE_FIELD_CATALOG[`${normalized_type}.${field_id}`] || PROFILE_FIELD_CATALOG[field_id] : null;
  const resolved_enhancer = catalog_meta?.enhancer || context.enhancer || config.role_line || "ENHANCER";
  const resolved_label = context.label || catalog_meta?.label || "";
  const resolved_directive = context.directive ?? catalog_meta?.directive ?? "";
  const macro_directive = !context.is_image_field ? resolve_macro_directive(normalized_type) : "";
  const is_temporal_field =
    field_id === "past" ||
    field_id === "future" ||
    field_id.startsWith("eternal.") ||
    field_id.startsWith("present.") ||
    Boolean(catalog_meta?.layer_key);
  const layer_tense_protocol = resolve_layer_tense_protocol(field_id, catalog_meta?.layer_key ?? context.layer_key);
  return {
    round: null,
    attributes: { scope: resolved_label, field: field_id },
    role_args: { enhancer_name: resolved_enhancer },
    core_protocols_args: {
      protocols: [...(config.protocols || []), layer_tense_protocol, resolve_somatic_interference_protocol(context.entity?.dynamics)].filter(Boolean),
    },
    entity_context_args: {
      enabled: entity_plan.field_context,
      entity: context.entity,
      field_id,
      content,
      normalized_type,
      format_past_function: (entry, entry_content) =>
        temporal_engine.format_hybrid(resolve_vector_pool(entry), entry_content || "", {
          max_chars: 1500,
          dynamics: entry?.dynamics,
        }),
    },
    task_params: {
      task_state: config.task_state,
      directives: [resolved_directive, macro_directive],
      input: content,
      input_channel: "content",
      output_format: get_output_format(config.format, {
        has_think: Boolean(config.think_format),
        ...(is_temporal_field ? { is_temporal: true } : {}),
        entity_type: normalized_type,
      }),
      output_mode: "prose",
    },
    meta_args: { ai: context.entity?.dynamics },
  };
}

function normalize_sorting_context(config, context) {
  const merged_options = { ...(context.options || {}), input_data: context.input_data };
  const resolved_type = context.entity_type === "user" ? "character" : context.entity_type || "character";
  const input_text =
    merged_options.input_data == null
      ? ""
      : typeof merged_options.input_data === "string"
        ? merged_options.input_data
        : JSON.stringify(merged_options.input_data, null, 2);
  return {
    round: null,
    attributes: { scope: "Entire Profile" },
    role_args: {},
    core_protocols_args: { pov_protocol: resolve_pov_protocol("THIRD") },
    task_params: {
      task_state: config.task_state,
      schema: get_output_format(config.format, { entity_type: resolved_type }),
      input: input_text,
      input_channel: "ingestion",
      entity_type: resolved_type,
      ingestion: Boolean(merged_options.ingestion),
      redistribute: Boolean(merged_options.redistribute),
    },
    meta_args: {},
  };
}

function normalize_optics_context(config, context) {
  const target_type = context.tier || context.target_type || "solo_entity";
  const raw_intent = context.raw_intent || context.prompt_context || context.input || "";
  const mode = context.mode || "visualize";
  const variant = context.variant;
  const onAlternationPick = context.onAlternationPick;
  const roll = (text) => {
    const resolved = resolve_alternations(text, {
      onPick: (pick) => {
        const item = { ...pick, label: alternation_field_label(text, pick.raw) };
        if (typeof onAlternationPick === "function") onAlternationPick([item]);
      },
    });
    return resolved.text;
  };
  const tier = normalize_image_tier(target_type);
  const is_selfie = variant === "selfie" || target_type === "selfie";
  const active_ai_character =
    context.ai || (context.entity && context.entity.type !== "user" && context.entity.type !== "fractal" ? context.entity : null);
  const active_user_persona = context.user || (context.entity?.type === "user" ? context.entity : null);
  const active_fractal_setting = context.fractal || (context.entity?.type === "fractal" ? context.entity : null);
  const main_entity = context.entity || active_ai_character || active_user_persona;
  const solo_subject = context.entity || active_ai_character || active_user_persona || active_fractal_setting;
  const macro_entities = { AI: active_ai_character, USER: active_user_persona, FRACTAL: active_fractal_setting };
  const combined_input_text = `${raw_intent || ""} ${main_entity?.present?.physical || ""} ${main_entity?.eternal?.physical || ""}`;
  const { style_snapshot } = normalize_context(context);
  const resolved_style_snapshot = style_snapshot ?? resolve_builder_style_snapshot({ fractal: active_fractal_setting });
  const style_key =
    tier === "solo_entity" || mode === "enhance" ? resolve_portrait_visual_style_key(solo_subject) : resolved_style_snapshot.visual_key;
  const style_definition = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
  const engine_tokens = resolve_visual_engine_tokens(style_key);
  const keywords_raw = style_definition.keywords || style_definition.tags || [];
  const keyword_list = Array.isArray(keywords_raw)
    ? keywords_raw
    : typeof keywords_raw === "string"
      ? keywords_raw.split(",").map((entry) => entry.trim())
      : [];
  const valid_keywords = keyword_list.filter(Boolean);
  const cinematography = resolve_optics_cinematography({
    tier,
    solo_subject,
    active_ai_character,
    active_user_persona,
    active_fractal_setting,
    main_entity,
    visual_staging: context.visual_staging || "",
  });
  const schema = get_output_format(config.format, {
    variant: is_selfie ? "selfie" : variant,
    negative_prompt: engine_tokens.negative_prompt || "",
  });
  return {
    round: null,
    attributes: {},
    role_args: {},
    core_protocols_args: { visual_style: style_definition, engine_tokens, alternation_source: "text", alternation_text: combined_input_text },
    entities_kind: "optics",
    optics_entities_args: {
      tier,
      solo_subject,
      active_ai_character,
      active_user_persona,
      active_fractal_setting,
      main_entity,
      macro_entities,
      roll,
    },
    history_args: { kind: "sensory", history: context.history },
    intent_roll: { roll, raw_intent: raw_intent || "" },
    task_params: {
      task_state: config.task_state,
      target_tier: tier,
      cinematography,
      engine_tokens,
      keywords: valid_keywords,
      is_selfie,
      main_entity_name: main_entity?.name || "",
      has_fractal_setting: Boolean(active_fractal_setting),
      schema,
    },
    meta_args: {
      ai: active_ai_character?.dynamics,
      fractal: active_fractal_setting?.dynamics,
    },
  };
}

/**
 * Normalizes the recurring runtime-context fallbacks shared by the mode adapters — the entity
 * bag, dynamics snapshot, render accessors, director data, and the history transport window —
 * so no adapter re-derives them ad hoc. `require_trio` fills a missing AI/USER/FRACTAL entity
 * with an empty shell (used by the narrator's conclusion beats) and builds the accessors over
 * that safe trio.
 *
 * @param {Record<string, any>} [context={}]
 * @param {Record<string, any>} [entities_override] - Explicit entity bag (e.g. npc-augmented).
 * @param {{ require_trio?: boolean }} [options={}]
 * @returns {{ entities: Record<string, any>, snapshot: Record<string, any>, render_accessors: any, director_data: Record<string, any>, recent_history: any[], npc: any }}
 */
/**
 * Builder-owned style resolution: the single place allowed to read global
 * runtime style state. Mirrors the retired style.js fallback chain exactly,
 * so pure resolve_style_snapshot receives pre-resolved explicit values and
 * each compile parses its style record once (via normalize_context).
 * @param {Object} [parameters={}]
 * @returns {ReturnType<typeof resolve_style_snapshot>}
 */
export function resolve_builder_style_snapshot({ explicit_narrative_style, fractal = null, fallback_fractal } = {}) {
  return resolve_style_snapshot({
    explicit_narrative_style: explicit_narrative_style ?? state_bridge.runtime?.active_fractal?.narrative_style,
    fractal,
    fallback_fractal: fallback_fractal ?? state_bridge.runtime?.active_fractal ?? state_bridge.app?.selected_fractal ?? null,
  });
}

function normalize_context(context = {}, entities_override = null, { require_trio = false } = {}) {
  const recent_history = context.recent_history || context.simulation_log || context.raw_messages || [];
  let entities = entities_override || context.entities || {};
  if (require_trio) {
    entities = {
      AI: entities?.AI || { name: "AI", present: {}, eternal: {} },
      USER: entities?.USER || { name: "USER", present: {}, eternal: {} },
      FRACTAL: entities?.FRACTAL || { name: "FRACTAL", present: {}, eternal: {} },
    };
  }
  const resolved_fractal = context.fractal ?? entities?.FRACTAL ?? null;
  return {
    entities,
    snapshot: context.snapshot || context.compressed_snapshot || {},
    render_accessors: require_trio ? create_render_accessors(entities, "", recent_history) : resolve_accessors(context, entities),
    style_snapshot: resolve_builder_style_snapshot({
      explicit_narrative_style: context.explicit_narrative_style || resolved_fractal?.narrative_style,
      fractal: resolved_fractal,
      fallback_fractal: context.fallback_fractal,
    }),
    director_data: context.director_data || {},
    recent_history,
    npc: context.npc || context.speaker,
  };
}

// ── 4. Mode Adapter Table ───────────────────────────────────────────────────
// Mode-specific normalization only; prompts.js owns plan resolution + sealing.

export const MODE_ADAPTERS = {
  director: { normalize: normalize_director_context },
  continuum: { normalize: normalize_continuum_context },
  enhancement: { normalize: normalize_enhancement_context },
  sorting: { normalize: normalize_sorting_context },
  optics: { normalize: normalize_optics_context },
  narrator: { normalize: normalize_narrator_context },
  npc: { normalize: normalize_npc_context },
  prose: { normalize: normalize_prose_context },
};
