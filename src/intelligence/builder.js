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
 * 2. Declarative Pipeline Runner (MODE_ADAPTERS / assemble_prompt)
 * 3. Director Planning Compiler (render_director)
 * 4. Temporal Continuum Distillation (render_memory)
 * 5. Profile Ingestion & Enhancement Compilers (render_enhancement, render_profile_sorting)
 *
 * Architecture & Purity Invariant:
 * - Pure assembly layer: coordinates structural modules.
 * - Leaves domain engines (director.js, story.js, temporal.js, profile.js) 100% prompt-free.
 * ============================================================================
 */

import {
  VISUAL_STYLES,
  resolve_portrait_visual_style_key,
  resolve_story_visual_style_key,
  get_style_keywords,
  get_narrative_style,
  resolve_active_style_key,
  PROFILE_FIELD_CATALOG,
} from "@data";
import {
  escape_xml,
  prompt_escape,
  parse_macros,
  strip_cognition_blocks,
  has_alternations,
  wrap_tag,
  render_xml_tag,
  resolve_macro_directive,
  parse_relational_vector,
  resolve_alternations,
  alternation_field_label,
  detox_prose,
} from "@utils";
import { get_prompt } from "./prompts.js";
import { resolve_stability_lock, resolve_system_role_line, render_system_xml } from "./modules/system.js";
import { render_axiomatic_constitution } from "./modules/constitution.js";
import { render_core_protocols, resolve_pov_protocol } from "./modules/protocols.js";
import {
  render_entity_sheets,
  resolve_entities,
  render_entity_memory_context,
  render_enhancement_field_context,
  render_optics_entities_xml,
} from "./modules/entities/sheets.js";
import { render_nearby_entities_xml, render_candidate_cast_xml } from "./modules/entities/presence.js";
import { verify_epistemic_integrity } from "./modules/entities/epistemic.js";

import { render_history, render_chapter_history_xml, render_input_history_xml, resolve_history, format_sensory_history } from "./modules/history.js";
import {
  render_task,
  TASK_LIBRARY,
  render_keyword_directives_xml,
  resolve_character_action_directive,
  resolve_scene_action_directive,
  resolve_optics_cinematography,
  render_available_keywords_xml,
  render_subtext_xml,
} from "./modules/task.js";
import { get_output_format } from "./modules/format.js";
import { render_dynamics_axes_xml } from "./modules/entities/sheets.js";
import { DYNAMICS_AXES, PHYSICS_PROTOCOLS, AVAILABLE_KEYWORDS, evaluate_dynamics_rules, evaluate_subtext_protocols } from "./physics.js";
import { temporal_engine, resolve_vector_pool } from "./temporal.js";
import { normalize_image_tier, resolve_visual_engine_tokens } from "@media";

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
      const formatted = temporal_engine.format(resolve_vector_pool(entity), scoring_context, {
        offset: 0,
        max_chars: 1500,
        ...options,
      });
      return parse_macros(formatted, entity, entities);
    },
    future: (reference) => {
      const entity = resolve(reference);
      const raw_future = String(entity?.future || "").trim();
      const extracted_plan = extract_plan_from_state(entity?.present?.non_physical);
      const combined_future = [raw_future, extracted_plan ? `Active Plan: ${extracted_plan}` : ""].filter(Boolean).join("\n");
      return parse_macros(combined_future.trim(), entity, entities);
    },
    simulation_log: (limit = 10, offset = 0) => render_history(raw_messages, { limit, offset, indent: 2 }),
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
 * Trims trailing line whitespace and consolidates excessive newlines.
 * @param {string} [text]
 * @returns {string}
 */
function clean_prompt_text(text) {
  return typeof text === "string"
    ? text
        .replace(/[ \t]+$/gm, "")
        .replace(/\n{3,}/g, "\n")
        .trim()
    : "";
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

/**
 * Packages rendered prompt text into a normalized prompt package with metadata.
 *
 * The package is always `{ system, task }` (+ optional `meta` / `messages`): `system` is an OPEN
 * `<SYSTEM>` fragment and `task` is the separate `<TASK>` block. `transport.js` owns assembling and
 * closing the final envelope, so there is no `system_close` field.
 *
 * @param {{ system?: string, task?: string }} rendered
 * @param {Record<string, any>} [meta]
 * @param {any[]} [messages]
 */
function pack_prompt(rendered, meta = {}, messages = []) {
  return {
    system: clean_prompt_text(rendered?.system),
    task: clean_prompt_text(rendered?.task),
    ...(Object.keys(meta).length > 0 ? { meta } : {}),
    ...(Array.isArray(messages) && messages.length > 0 ? { messages } : {}),
  };
}

/**
 * Builds the canonical prompt-package `meta` record — one shape for every mode.
 * @param {{ ai?: any, fractal?: any, flags?: any, role?: string|null, entity_id?: string|null }} [parameters={}]
 * @returns {Record<string, any>}
 */
function resolve_prompt_meta({ ai = null, fractal = null, flags = {}, role = null, entity_id = null } = {}) {
  return {
    ai,
    fractal,
    flags,
    ...(role ? { role } : {}),
    ...(entity_id ? { entity_id } : {}),
  };
}

/**
 * Canonical prose-envelope layer table — the ordered emitters that fill a `<SYSTEM>`.
 * Emitters read from the assembled layer state, so adding/reordering a system layer is a
 * table edit rather than a change to every compiler.
 */
const PROMPT_LAYERS = Object.freeze([
  { key: "role", emit: (state) => state.role_line },
  { key: "constitution", emit: (state) => state.constitution },
  { key: "protocols", emit: (state) => state.core_protocols },
  { key: "dynamic_axes", emit: (state) => state.dynamics },
  { key: "entities", emit: (state) => state.entities_block },
  { key: "target_context", emit: (state) => state.target_context },
  { key: "nearby_cast", emit: (state) => state.nearby_cast },
  { key: "layer", emit: (state) => state.layer },
  { key: "field_context", emit: (state) => state.field_context },
  { key: "chapter_history", emit: (state) => state.chapter_history },
  { key: "history", emit: (state) => state.history_block },
]);

/**
 * Walks the canonical `PROMPT_LAYERS` table and returns the ordered, non-empty `<SYSTEM>` children.
 * Every compiler composes its envelope through this single emitter, so a layer reorder/insert is a
 * table edit, never a change to an individual mode's children array.
 *
 * @param {Partial<Record<"role_line"|"constitution"|"core_protocols"|"dynamics"|"entities_block"|"target_context"|"nearby_cast"|"layer"|"field_context"|"chapter_history"|"history_block", string|null|undefined>>} state
 * @returns {string[]}
 */
function render_prompt_layers(state, allowed_keys = null) {
  return PROMPT_LAYERS.filter((layer) => !allowed_keys || allowed_keys.includes(layer.key))
    .map((layer) => layer.emit(state))
    .filter(Boolean);
}

/**
 * Composes the open `<SYSTEM>` envelope for a mode from its manifest record and a layer state
 * bag. The single envelope-assembly surface: every compiler routes through here, so a new
 * `<SYSTEM>` attribute or layer change is a one-line edit rather than a seven-site sweep.
 *
 * @param {any} config - Resolved prompt manifest record (carries `system.mode` and `layers.system`).
 * @param {Record<string, any>} [state={}] - Emitter state bag keyed by `PROMPT_LAYERS` slots.
 * @param {{ round?: number|string|null, attributes?: Record<string, any> }} [options={}]
 * @returns {string}
 */
function compose_system(config, state = {}, { round = null, attributes = {} } = {}) {
  return render_system_xml({
    mode: config.system.mode,
    round,
    attributes,
    children: render_prompt_layers(state, config.layers.system),
  });
}

// ── 3. Prompt Compilers ───────────────────────────────────────────────────────

/**
 * Compiles Director prompt (Shot 1).
 */
export function render_director({
  round,
  entities: scene_entities = {},
  input = "",
  render_accessors = null,
  compressed_snapshot = {},
  raw_messages = [],
  simulation_log = [],
  npc_entities = [],
  in_scene_ids = [],
}) {
  const active_messages = raw_messages.length > 0 ? raw_messages : simulation_log;
  const accessors = render_accessors || create_render_accessors(scene_entities, input, active_messages);
  const config = get_prompt("director");
  const entity_plan = resolve_entities(config);
  const schema = get_output_format(config.format);
  const active_style_keywords = get_style_keywords(resolve_active_style_key());

  const merged_dynamics = { ...(compressed_snapshot?.fractal?.dynamics || {}), ...(compressed_snapshot?.ai?.dynamics || {}) };
  const cast_xml = entity_plan.candidate_entities ? render_candidate_cast_xml({ entities: scene_entities, npc_entities, in_scene_ids }) : null;

  const entity_sheets = render_entity_sheets({
    entities: scene_entities,
    npc_entities,
    in_scene_ids,
    accessors,
    config,
    is_npc: false,
    render_axes: (dynamics, scope) => render_dynamics_axes_xml(dynamics, scope, DYNAMICS_AXES),
    speaker_dynamics: compressed_snapshot?.ai?.dynamics,
    fractal_dynamics: compressed_snapshot?.fractal?.dynamics,
    cast_xml,
  });

  const core_protocols_xml = render_core_protocols({
    protocols: config.protocols,
    has_alternation: has_alternations(entity_sheets),
  });

  const keyword_directives_xml = render_keyword_directives_xml(render_available_keywords_xml(active_style_keywords, AVAILABLE_KEYWORDS));

  const role_line = resolve_system_role_line({ role: config.role_line });

  const system = compose_system(
    config,
    {
      role_line,
      core_protocols: core_protocols_xml,
      dynamics: render_dynamics_axes_xml(merged_dynamics, null, DYNAMICS_AXES),
      entities_block: entity_sheets,
    },
    { round },
  );

  const last_ai_message = (active_messages || []).filter((message) => message.role === "model").at(-1);
  const last_ai_text = last_ai_message ? strip_cognition_blocks(last_ai_message.content || last_ai_message.text || "").trim() : "";

  const task = render_task({
    task_state: config.task_state,
    entities: scene_entities,
    round,
    input,
    last_ai_text,
    schema,
    keyword_directives: keyword_directives_xml,
    layers: config.layers.task,
  });

  return { system, task };
}

/**
 * Shared Shot-2A prose compilation core executing the unified 9-step pipeline:
 * style resolution -> subtext parsing -> constitution -> entity sheets ->
 * core protocols -> system envelope -> stability lock -> task compilation.
 *
 * @param {Object} parameters
 * @param {any} parameters.config
 * @param {number|null} [parameters.round=null]
 * @param {Record<string, any>} [parameters.entities={}]
 * @param {any[]} [parameters.npc_entities=[]]
 * @param {string[]} [parameters.in_scene_ids=[]]
 * @param {any} [parameters.active_speaker=null]
 * @param {string} [parameters.speaker_name=""]
 * @param {string} [parameters.listener_name=""]
 * @param {string} [parameters.fractal_name=""]
 * @param {string|null} [parameters.pov_protocol=null]
 * @param {any} parameters.accessors
 * @param {Record<string, any>} [parameters.speaker_dynamics={}]
 * @param {Record<string, any>} [parameters.fractal_dynamics={}]
 * @param {string[]} [parameters.keywords=[]]
 * @param {boolean} [parameters.suppress_style_subtext=false]
 * @param {any} [parameters.meta=null]
 * @param {string} [parameters.input=""]
 * @param {string} [parameters.input_origin="USER"]
 * @param {string} [parameters.action_directive=""]
 * @param {any} [parameters.snapshot=null]
 * @param {boolean} [parameters.is_npc=false]
 * @returns {{ system: string, task: string }}
 */
function render_prose_turn_core({
  config,
  round = null,
  entities = {},
  npc_entities = [],
  in_scene_ids = [],
  active_speaker = null,
  speaker_name = "",
  listener_name = "",
  fractal_name = "",
  pov_protocol = null,
  accessors,
  speaker_dynamics = {},
  fractal_dynamics = {},
  keywords = [],
  suppress_style_subtext = false,
  meta = null,
  input = "",
  input_origin = "USER",
  action_directive = "",
  snapshot = null,
  is_npc = false,
  speaker_key = "AI",
}) {
  const style = get_narrative_style(resolve_active_style_key());

  const subtext_xml = render_subtext_xml(speaker_dynamics, fractal_dynamics, {
    keywords,
    style: suppress_style_subtext ? null : style,
    physics_protocols: PHYSICS_PROTOCOLS,
    evaluate_dynamics_rules,
    evaluate_subtext_protocols,
  });

  const constitution = config.constitution ? render_axiomatic_constitution() : "";

  const entities_block = render_entity_sheets({
    entities,
    npc_entities,
    in_scene_ids,
    active_speaker,
    accessors,
    config,
    is_npc,
    render_axes: (dynamics, scope) => render_dynamics_axes_xml(dynamics, scope, DYNAMICS_AXES),
    speaker_dynamics,
    fractal_dynamics,
    speaker_key,
  });

  if (!verify_epistemic_integrity(entities_block)) {
    console.warn("[builder] Epistemic Wall integrity alert: leaked secrets or plans detected across boundary.");
  }

  const core = render_core_protocols({
    protocols: config.protocols,
    pov_protocol,
    style,
    has_alternation: has_alternations(entities_block),
  });

  const role_line = resolve_system_role_line({
    role: config.role_line,
    speaker_name,
    listener_name,
    fractal_name,
  });

  const system = compose_system(config, { role_line, constitution, core_protocols: core, entities_block }, { round });

  const stability_lock_content = resolve_stability_lock(meta);

  const task = render_task({
    task_state: config.task_state,
    config,
    input,
    input_origin,
    round,
    style,
    subtext_xml,
    snapshot: snapshot ? { ...snapshot, style } : { style },
    action_directive,
    stability_lock: stability_lock_content,
    layers: config.layers.task,
  });

  return { system, task };
}

/**
 * Compiles Story Prose prompt for interaction, npc, or ghostwrite.
 */
export function render_story_prose({
  round = null,
  entities = {},
  speaker = null,
  listener = null,
  input = "",
  compressed_snapshot = {},
  meta = {},
  render_accessors = null,
  ghostwrite = false,
  prompt_mode = null,
  director_data = null,
  npc_entities = [],
  in_scene_ids = [],
}) {
  const is_npc_hint = !ghostwrite && !!speaker && speaker !== entities?.AI && speaker !== entities?.USER;
  const config = get_prompt(prompt_mode || (ghostwrite ? "ghostwrite" : is_npc_hint ? "npc" : "interaction"));
  const is_ghostwrite = config.speaker === "USER";
  const is_npc = config.speaker === "NPC";

  const active_speaker = speaker || (is_ghostwrite ? entities?.USER : entities?.AI);
  const active_listener = listener || (is_ghostwrite ? entities?.AI : entities?.USER);

  const accessors = render_accessors || create_render_accessors(entities, input);
  const pov_protocol = resolve_pov_protocol(config.system.pov || active_speaker);

  const speaker_name = prompt_escape(active_speaker?.name || (is_npc ? "NPC" : "AI"));
  const listener_name = prompt_escape(active_listener?.name || "Listener");
  const fractal_name = prompt_escape(entities?.FRACTAL?.name || "the setting");

  const speaker_key = config.speaker || "AI";
  const speaker_dynamics =
    config.speaker === "AI" ? compressed_snapshot?.ai?.dynamics || entities?.AI?.dynamics || {} : active_speaker?.dynamics || {};
  const fractal_dynamics = compressed_snapshot?.fractal?.dynamics || entities?.FRACTAL?.dynamics || {};

  const speaker_name_lc = String(active_speaker?.name || "")
    .toLowerCase()
    .trim();
  const listener_name_lc = String(active_listener?.name || "")
    .toLowerCase()
    .trim();
  const has_prior_relationship = Boolean(
    speaker_name_lc &&
    listener_name_lc &&
    Array.isArray(active_speaker?.relationships) &&
    active_speaker.relationships.some((r) => {
      const parsed = parse_relational_vector(r);
      return (
        parsed &&
        String(parsed.source_name).toLowerCase().trim() === speaker_name_lc &&
        String(parsed.target_name).toLowerCase().trim() === listener_name_lc
      );
    }),
  );

  const is_first_contact = !has_prior_relationship && director_data?.first_contact === true;

  const action_directive = resolve_character_action_directive({
    speaker_name,
    is_npc,
    is_ghostwrite,
    is_first_contact,
  });

  const input_origin_entity = is_ghostwrite ? active_speaker : entities?.USER;
  const input_origin = input_origin_entity?.id || input_origin_entity?.name || "USER";

  return render_prose_turn_core({
    config,
    round,
    entities,
    npc_entities,
    in_scene_ids,
    active_speaker,
    speaker_name,
    listener_name,
    fractal_name,
    pov_protocol,
    accessors,
    speaker_dynamics,
    fractal_dynamics,
    keywords: director_data?.keywords || [],
    suppress_style_subtext: is_ghostwrite,
    meta,
    input,
    input_origin,
    action_directive,
    snapshot: { dynamics: speaker_dynamics },
    is_npc,
    speaker_key,
  });
}

/**
 * Scene narrator prompt compiler (e.g. for Prologues and Epilogues).
 */
export function render_scene_narrator({
  entities,
  round = 0,
  conclusion_status = null,
  meta = null,
  is_prologue = false,
  scene_template = null,
  input = "",
  compressed_snapshot = {},
}) {
  const is_prologue_beat = is_prologue || scene_template === "PROLOGUE";

  const config = get_prompt("narrator");

  const speaker = entities?.FRACTAL;
  const speaker_name = prompt_escape(speaker?.name || "The Scene");

  const pov_protocol = resolve_pov_protocol(config.system.pov);
  const speaker_dynamics = compressed_snapshot?.ai?.dynamics || null;
  const fractal_dynamics = compressed_snapshot?.fractal?.dynamics || null;

  const action_directive = resolve_scene_action_directive({
    scene_template,
    is_prologue,
    conclusion_status,
    input,
  });

  const input_origin_entity = entities?.USER;
  const input_origin = input_origin_entity?.id || input_origin_entity?.name || "USER";

  return render_prose_turn_core({
    config,
    round,
    entities,
    speaker_name,
    pov_protocol,
    accessors: create_render_accessors(entities, input, []),
    speaker_dynamics,
    fractal_dynamics,
    keywords: meta?.keywords || [],
    meta,
    input: is_prologue_beat ? "" : input,
    input_origin,
    action_directive,
    snapshot: { dynamics: fractal_dynamics },
    is_npc: false,
  });
}

/**
 * Continuum prompt compiler (Shot-2 back-shot).
 */
export function render_memory({ target_entity, target_key = "AI_CHARACTER", other_entities = {}, history = [] }) {
  const config = get_prompt("continuum");
  const entity_plan = resolve_entities(config);
  const history_config = resolve_history(config.history);
  const target_name = target_entity?.name || target_key;
  const target_xml = entity_plan.target_context ? render_entity_memory_context(target_key, target_entity) : "";
  const nearby_entities_xml = entity_plan.nearby_entities
    ? render_nearby_entities_xml(other_entities, { exclude_id: target_entity?.id || target_entity?.name, indent: 2 })
    : "";
  const chapter_xml = entity_plan.chapter_history && target_entity ? render_chapter_history_xml(target_entity, 2) : "";

  const target_type = target_entity?.type || (target_key === "FRACTAL" ? "fractal" : "character");
  const task_xml = render_task({
    task_state: config.task_state,
    target_name,
    schema: get_output_format(config.format, { entity_type: target_type }),
    layers: config.layers.task,
  });

  const history_xml = history_config.enabled
    ? render_input_history_xml(history, {
        limit: history_config.limit,
        max_chars: history_config.max_chars,
      })
    : "";

  const role_line = resolve_system_role_line({ role: config.role_line, target_name });

  const system = compose_system(
    config,
    {
      role_line,
      core_protocols: render_core_protocols({ protocols: config.protocols }),
      target_context: wrap_tag("TARGET_ENTITY_CONTEXT", target_xml, 2),
      nearby_cast: nearby_entities_xml,
      chapter_history: chapter_xml,
      history_block: history_xml,
    },
    { attributes: { target: target_name } },
  );

  return { system, task: task_xml };
}

/**
 * Profile field enhancement prompt compiler.
 */
export function render_enhancement({
  enhancer,
  label,
  directive,
  content,
  is_image_field = false,
  field_id = "",
  layer_key,
  entity = null,
  entity_type = "character",
}) {
  const config = get_prompt("enhancement");
  const entity_plan = resolve_entities(config);
  const normalized_type = entity_type === "user" ? "character" : entity_type || "character";
  const catalog_meta = field_id ? PROFILE_FIELD_CATALOG[`${normalized_type}.${field_id}`] || PROFILE_FIELD_CATALOG[field_id] : null;

  const resolved_enhancer = enhancer || catalog_meta?.enhancer || config.role_line || "ENHANCER";
  const resolved_label = label || catalog_meta?.label || "";
  const resolved_directive = directive ?? catalog_meta?.directive ?? "";
  const resolved_layer_key = layer_key ?? catalog_meta?.layer_key ?? "";

  const macro_directive = !is_image_field ? resolve_macro_directive(normalized_type) : "";

  const task_xml = render_task({
    task_state: config.task_state,
    directives: [resolved_directive, macro_directive],
    input: content,
    input_channel: "content",
    output_format: get_output_format(config.format, { has_think: Boolean(config.think_format) }),
    output_mode: "prose",
    layers: config.layers.task,
  });

  const role_line = resolve_system_role_line({ role: config.role_line, enhancer_name: resolved_enhancer });

  const system = compose_system(
    config,
    {
      role_line,
      core_protocols: render_core_protocols({ protocols: config.protocols }),
      layer: resolved_layer_key ? render_xml_tag({ tag: "LAYER", children: [escape_xml(resolved_layer_key)], inline: true }) : null,
      field_context: entity_plan.field_context
        ? render_enhancement_field_context(entity, field_id, content, normalized_type, (e, c) =>
            temporal_engine.format(resolve_vector_pool(e), c || "", { max_chars: 1500 }),
          )
        : null,
    },
    { attributes: { scope: resolved_label, field: field_id } },
  );

  return { system, task: task_xml };
}

/**
 * Profile sorting prompt compiler.
 */
export function render_profile_sorting(entity_type = "character", options = {}) {
  const config = get_prompt("sorting");
  const resolved_type = entity_type === "user" ? "character" : entity_type || "character";
  const focus_directive = TASK_LIBRARY.SORTING.FOCUS(resolved_type);
  const input_text =
    options.input_data == null ? "" : typeof options.input_data === "string" ? options.input_data : JSON.stringify(options.input_data, null, 2);

  const task_xml = render_task({
    task_state: config.task_state,
    schema: get_output_format(config.format, { entity_type: resolved_type }),
    input: input_text,
    input_channel: "ingestion",
    directives: [
      TASK_LIBRARY.SORTING.POV_THIRD,
      focus_directive,
      options.ingestion ? TASK_LIBRARY.SORTING.INGESTION : null,
      options.redistribute ? TASK_LIBRARY.SORTING.REDISTRIBUTE : null,
    ],
    layers: config.layers.task,
  });

  const role_line = resolve_system_role_line({ role: config.role_line });

  const system = compose_system(
    config,
    {
      role_line,
      core_protocols: render_core_protocols({ protocols: config.protocols }),
    },
    { attributes: { scope: "Entire Profile" } },
  );

  return { system, task: task_xml };
}

/**
 * Compiles the Optics <SYSTEM mode="optics"> envelope for every image-generation task
 * (solo entity portraits and multi-character scenes):
 * <SYSTEM mode="optics">               (open fragment; transport closes it)
 *   <CORE_PROTOCOLS>
 *   <ENTITIES>                         (contains <CAST mode="active">)
 *   <HISTORY>                          (optional)
 * </SYSTEM>
 * <TASK>
 *   <THINK_FORMAT>
 *   <INPUT channel="intent">
 *   <TARGET>
 *   <SPATIAL_FRAMING>
 *   <DIRECTIVES>                      (contains <KEYWORD_DIRECTIVES>)
 *   <OUTPUT_FORMAT mode="json">
 * </TASK>
 *
 * System children are emitted through the shared `PROMPT_LAYERS` table (bounded by the mode's
 * declared `layers.system`); the `<TASK>` is returned as the package's own field, so Optics no
 * longer hand-assembles an envelope or nests a task inside `<SYSTEM>`.
 *
 * @param {Object} [options={}] - Single options object; no positional shuffling.
 * @param {string} [options.tier] - Canonical image tier ("solo_entity" | "story_character" | "story_entities" | "story_scene").
 * @param {string} [options.target_type] - Alias for `tier`.
 * @param {string} [options.raw_intent] - Raw subject/prompt intent (rolled through alternation dice).
 * @param {string} [options.prompt_context] - Alias for `raw_intent`.
 * @param {string} [options.input] - Alias for `raw_intent`.
 * @param {any} [options.ai] - Active AI-character entity.
 * @param {any} [options.user] - Active user-persona entity.
 * @param {any} [options.fractal] - Active fractal/setting entity.
 * @param {any} [options.entity] - Focus entity (tier-derived when ai/user/fractal are omitted).
 * @param {any[]} [options.history] - Sensory conversation history entries.
 * @param {string} [options.mode="visualize"] - "visualize" | "enhance".
 * @param {string} [options.variant] - Variant selector (e.g. "selfie").
 * @param {string} [options.visual_staging] - Staging directive.
 * @param {(picks: any[]) => void} [options.onAlternationPick] - Alternation dice-pick callback.
 * @returns {{ system: string, task: string }}
 */
export function render_optics_prompt(options = {}) {
  const target_type = options.tier || options.target_type || "solo_entity";
  const raw_intent = options.raw_intent || options.prompt_context || options.input || "";

  const { ai, user, fractal, entity, history, mode = "visualize", variant, onAlternationPick } = options;

  const dice_picks = [];
  const roll = (text) => {
    const resolved = resolve_alternations(text, {
      onPick: (pick) => {
        const item = { ...pick, label: alternation_field_label(text, pick.raw) };
        dice_picks.push(item);
        if (typeof onAlternationPick === "function") onAlternationPick([item]);
      },
    });
    return resolved.text;
  };

  const tier = normalize_image_tier(target_type);
  const is_selfie = variant === "selfie" || target_type === "selfie";

  const active_ai_character = ai || (entity && entity.type !== "user" && entity.type !== "fractal" ? entity : null);
  const active_user_persona = user || (entity?.type === "user" ? entity : null);
  const active_fractal_setting = fractal || (entity?.type === "fractal" ? entity : null);
  const main_entity = entity || active_ai_character || active_user_persona;
  const solo_subject = entity || active_ai_character || active_user_persona || active_fractal_setting;
  const macro_entities = { AI: active_ai_character, USER: active_user_persona, FRACTAL: active_fractal_setting };

  const combined_input_text = `${raw_intent || ""} ${main_entity?.present?.physical || ""} ${main_entity?.eternal?.physical || ""}`;
  const style_key =
    tier === "solo_entity" || mode === "enhance"
      ? resolve_portrait_visual_style_key(solo_subject)
      : resolve_story_visual_style_key(active_fractal_setting);
  const style_definition = VISUAL_STYLES[style_key] || VISUAL_STYLES.none;
  const engine_tokens = resolve_visual_engine_tokens(style_key);

  const keywords_raw = style_definition.keywords || style_definition.tags || [];
  const keyword_list = Array.isArray(keywords_raw)
    ? keywords_raw
    : typeof keywords_raw === "string"
      ? keywords_raw.split(",").map((s) => s.trim())
      : [];
  const valid_keywords = keyword_list.filter(Boolean);

  const config = get_prompt("optics");

  // Layer 3: Core Protocols (<CORE_PROTOCOLS>)
  const protocols_xml = render_core_protocols({
    visual_style: style_definition,
    engine_tokens,
    protocols: config.protocols,
    has_alternation: has_alternations(combined_input_text),
  });

  // Cinematography Resolution (Layer 6 Spatial Framing)
  const cinematography = resolve_optics_cinematography({
    tier,
    solo_subject,
    active_ai_character,
    active_user_persona,
    active_fractal_setting,
    main_entity,
    visual_staging: options.visual_staging || "",
  });

  // Layer 4: Entities Context (<ENTITIES>)
  const entities_xml = render_optics_entities_xml({
    tier,
    solo_subject,
    active_ai_character,
    active_user_persona,
    active_fractal_setting,
    main_entity,
    macro_entities,
    roll,
  });

  // Layer 5: Sensory History (<CONVERSATION_HISTORY>)
  const history_xml = format_sensory_history(history);

  // Layer 7: Output Schema Format (<OUTPUT_FORMAT>)
  const resolved_negative_prompt = engine_tokens.negative_prompt || "";
  const schema = get_output_format(config.format, { variant: is_selfie ? "selfie" : variant, negative_prompt: resolved_negative_prompt });

  const rolled_intent = detox_prose(roll(raw_intent || ""));

  // Layer 6: Universal Task (<TASK>)
  const task_xml = render_task({
    task_state: config.task_state,
    target_tier: tier,
    input_intent: rolled_intent,
    think_format: config.think_format || "optics",
    cinematography,
    engine_tokens,
    keywords: valid_keywords,
    is_selfie,
    main_entity_name: main_entity?.name || "",
    has_fractal_setting: Boolean(active_fractal_setting),
    schema,
    layers: config.layers.task,
  });

  const full_system = compose_system(config, {
    role_line: resolve_system_role_line({ role: config.role_line }),
    core_protocols: protocols_xml,
    entities_block: entities_xml,
    history_block: history_xml ? history_xml.trim() : null,
  });

  return pack_prompt(
    { system: full_system, task: task_xml },
    resolve_prompt_meta({
      ai: active_ai_character?.dynamics,
      fractal: active_fractal_setting?.dynamics,
    }),
  );
}

// ── 4. Declarative Pipeline Runner ──────────────────────────────────────────

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
  return {
    entities,
    snapshot: context.snapshot || context.compressed_snapshot || {},
    render_accessors: require_trio ? create_render_accessors(entities, "", recent_history) : resolve_accessors(context, entities),
    director_data: context.director_data || {},
    recent_history,
    npc: context.npc || context.speaker,
  };
}

/**
 * Mode adapter table — the single dispatch surface for prompt assembly.
 * Every manifest mode maps to an assembler that returns a normalized prompt package;
 * `prose` is the fallback for interaction/ghostwrite and any unknown key.
 * Adding a mode is a manifest record plus, at most, one entry here — no switch edits.
 *
 * @type {Record<string, (config: any, context: Record<string, any>) => { system: string, task: string, meta?: Record<string, any>, messages?: any[] }>}
 */
export const MODE_ADAPTERS = {
  director: (config, context) => {
    if (context.terse) {
      const schema = context.schema || get_output_format(config.format);
      const task = render_task({ task_state: config.task_state, terse: true, schema, layers: ["output_format"] });
      const system = compose_system(config, { role_line: resolve_system_role_line({ role: config.role_line }) }, { round: context.round });
      return pack_prompt(
        { system, task },
        resolve_prompt_meta({
          ai: context.compressed_snapshot?.ai?.dynamics,
          fractal: context.compressed_snapshot?.fractal?.dynamics,
        }),
      );
    }
    const { render_accessors } = normalize_context(context);
    const rendered = render_director({
      ...context,
      render_accessors,
      compressed_snapshot: context.compressed_snapshot || {},
    });
    return pack_prompt(
      rendered,
      resolve_prompt_meta({
        ai: context.compressed_snapshot?.ai?.dynamics,
        fractal: context.compressed_snapshot?.fractal?.dynamics,
      }),
    );
  },

  continuum: (config, context) =>
    pack_prompt(
      render_memory(context),
      resolve_prompt_meta({
        ai: context.other_entities?.AI?.dynamics,
        fractal: context.other_entities?.FRACTAL?.dynamics,
      }),
    ),

  enhancement: (config, context) =>
    pack_prompt(
      render_enhancement(context),
      resolve_prompt_meta({
        ai: context.entity?.dynamics,
      }),
    ),

  sorting: (config, context) => {
    // Layer-Order Design Intent: the NARRATIVE_STRUCTURER rules, POV, and JSON schema live
    // in <SYSTEM>/<TASK>, and the raw profile text to be sorted is delivered through the
    // single <INPUT channel="ingestion"> channel inside <TASK> (no ad-hoc `messages` payload).
    const { system, task } = render_profile_sorting(context.entity_type, { ...context.options, input_data: context.input_data });
    return pack_prompt({ system, task }, resolve_prompt_meta());
  },

  optics: (config, context) => render_optics_prompt(context),

  narrator: (config, context) => {
    const scene_template = context.scene_template || (context.is_prologue ? "PROLOGUE" : context.is_epilogue ? "EPILOGUE" : "CONTINUATION");
    const is_conclusion = scene_template === "EPILOGUE" || scene_template === "COLLAPSE" || Boolean(context.is_epilogue);
    const { entities, snapshot, render_accessors } = normalize_context(context, null, { require_trio: is_conclusion });

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

    return pack_prompt(
      render_scene_narrator({
        ...context,
        scene_template: resolved_template,
        entities,
        render_accessors,
        compressed_snapshot: narrator_snapshot,
      }),
      resolve_prompt_meta({
        ai: narrator_snapshot.ai?.dynamics,
        fractal: narrator_snapshot.fractal?.dynamics,
        flags: snapshot.flags || {},
      }),
      [],
    );
  },

  npc: (config, context) => {
    const npc_entity = context.npc || context.speaker;
    const raw_entities = context.entities || {};
    const combined_entities = npc_entity?.id ? { ...raw_entities, [npc_entity.id]: npc_entity } : raw_entities;
    const { snapshot, render_accessors: npc_accessors } = normalize_context(context, combined_entities);
    return pack_prompt(
      render_story_prose({
        prompt_mode: "npc",
        ...context,
        entities: combined_entities,
        speaker: npc_entity,
        render_accessors: npc_accessors,
        compressed_snapshot: snapshot,
        director_data: context.director_data || {},
      }),
      resolve_prompt_meta({
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
        role: "npc",
        entity_id: npc_entity?.id,
      }),
    );
  },

  prose: (config, context) => {
    const rendered = render_story_prose({
      ...context,
      prompt_mode: config.key,
    });
    return pack_prompt(
      rendered,
      resolve_prompt_meta({
        ai: context.compressed_snapshot?.ai?.dynamics,
        fractal: context.compressed_snapshot?.fractal?.dynamics,
        flags: context.compressed_snapshot?.flags || {},
        ...(context.meta || {}),
      }),
      context.messages || [],
    );
  },
};

/**
 * Master prompt assembler: resolves a mode record and dispatches to its adapter.
 *
 * @param {any} config - Resolved prompt manifest record (carries its canonical `key`).
 * @param {Object} [context={}] - Dynamic runtime context, entities, dynamics, and options
 * @returns {{ system: string, task: string, meta?: Record<string, any>, messages?: any[] }}
 */
export function assemble_prompt(config, context = {}) {
  const adapter = MODE_ADAPTERS[config.key] || MODE_ADAPTERS.prose;
  return adapter(config, context);
}

// ── 5. Module Changelog ──────────────────────────────────────────────────────

/**
 * CHANGELOG
 * - 2026-09-24: Cast/input de-duplication — `render_director` now passes its entity bag into `render_task` (so the Director's `<INPUT>` origins are real entity ids) and mounts the renamed `render_candidate_cast_xml` behind the renamed `candidate_entities` gate; `render_enhancement` resolves its prose `<OUTPUT_FORMAT>` with `has_think: false` so it never references an unopened `</THINK>`.
 * - 2026-09-23: Prompt-grammar harmonization (phases 0–3) — the Director composes its six axes through the shared `render_dynamics_axes_xml` (dropping `render_dynamics_xml`/`<DYNAMICS>`); optics passes `has_alternation` to `render_core_protocols` and drops its entity-block rules; enhancement routes its content `<INPUT>` through `<TASK>`; the retired `input_content` system layer is pruned.
 * - 2026-09-23: Pipeline consolidation (R1–R7) — added `compose_system(config, state, { round, attributes })` and routed all seven `<SYSTEM>` assembly sites through it; compilers now read `config.role_line` (was `config.system.role`), `config.think_format`, and dispatch `render_task` via `config.task_state`; `render_story_prose` reads `config.speaker` (no more identity inference), and the narrator adapter's three branches collapse into one path via `normalize_context(context, override, { require_trio })`. Output bytes unchanged.
 * - 2026-09-23: Envelope harmonization + ghostwrite mirror — dropped the `<SYSTEM role>` attribute (single `mode`), folded `<KEYWORD_DIRECTIVES>` into `<DIRECTIVES>`, moved the `<CAST>` roster inside `<ENTITIES>` (via `render_entity_sheets`), consolidated all six dynamics axes into the Director's one `<DYNAMICS>` block, routed `render_prose_turn_core`/`render_story_prose` through `speaker_key` so ghostwrite is interaction with AI↔USER visibility swapped, and retired the now-dead `present_cast`/`keyword_directives` system layers.
 * - 2026-09-22: Recommendations 1–9 wiring — `render_prompt_layers(state, allowed_keys)` and `render_task({ layers })` now honor each mode's declared `config.layers`; continuum/enhancement/optics route through the shared `<APPEARANCE>`/`<CURRENT_LOOK>` sheet grammar, the single `<CAST mode>` block (continuum excludes its target entity), the single `<INPUT kind>` channel, and universal `<DIRECTIVES>`; `render_enhancement` emits `<OUTPUT_FORMAT>` for its prose fields; every package carries the full `{ ai, fractal, flags }` meta (recommendation #6).
 * - 2026-09-21: Standardization pass — Director keyword directives moved from `<SYSTEM>` into the `<TASK>` envelope; the `director_terse` adapter collapsed into the `director` adapter (`context.terse`); `render_story_prose` resolves POV through `resolve_pov_protocol(config.system.pov || active_speaker)`; `render_scene_narrator` now accepts `compressed_snapshot`/`pov_protocol` (the `entities._compressed_dynamics` side-channel is gone) so the narrator receives its dynamics; the `enhancing` attribute is renamed `scope`; sorting reads `TASK_LIBRARY.SORTING.POV_THIRD`; `resolve_prompt_meta` normalizes package meta; the `PROTOCOL_LIBRARY` import was retired.
 * - 2026-09-20: Universal envelope (`{ system, task }`) — every compiler (`render_director`, the prose core, `render_memory`, `render_enhancement`, `render_profile_sorting`, `render_optics_prompt`, `director_terse`) now composes through the extended `PROMPT_LAYERS` table via `render_prompt_layers`, returns the `<TASK>` as its own package field (fixing the Optics double-task regression), and emits a `SYSTEM_ROLES` role line + `role="…"` attribute; `pack_prompt` dropped the retired `system_close` field.
 * - 2026-09-19: Collapsed facades (P7) — the public chain is now `compile_prompt` (prompts.js) → `assemble_prompt`; retired `compile_pipeline_prompt`, the `render_builder` wrapper object (now the standalone `create_render_accessors`, and the test-only `render_history` passthrough deleted), the `render_narrator_prose` alias (callers use `render_scene_narrator`), and the `render_ghostwriter` wrapper (the production ghostwrite path is `MODE_ADAPTERS.prose`); added `normalize_context(context)` so the entity / snapshot / accessor / history fallbacks live in one place.
 * - 2026-09-19: Unified Optics (P6) — `render_optics_prompt` takes a single options object (dropped the 3-positional-arg shuffling) and emits its `<SYSTEM role="SENSORY_CORTEX">` envelope through the shared `PROMPT_LAYERS` table with the Task nested via `render_system_xml`'s `task` parameter; `PROMPT_LAYERS` gains a `history` layer (protocols → entities → history). Media callers already pass one options object, so no call-site change was required.
 * - 2026-09-19: Table-driven assembler (P4) — the `compile_pipeline_prompt` switch is replaced by `MODE_ADAPTERS` (one assembler per mode + a `prose` fallback) dispatched through `assemble_prompt(config, context)`; the prose envelope is emitted from the `PROMPT_LAYERS` table. Adding a mode no longer edits a switch.
 * - 2026-09-19: Entity gate consolidation (P2) — `render_director`/`render_memory`/`render_enhancement` read their `config.entities` gates through `resolve_entities(config)` (the single resolver in sheets.js); the dead `config.task?.schema` fallback was pruned from `get_output_format`.
 * - 2026-09-19: Package-contract unification (P1) — `continuum`, `enhancement`, and `sorting` now return through `pack_prompt` (no hand-rolled package shapes); `render_optics_prompt` drops its `new String()` subclass and returns a plain `{ system, task }` package; `extract_somatic_inner` deleted — the `<SUBTEXT>` block is composed once by `render_subtext_xml` and passed whole to `render_task`; `<LAYER>` emits through `render_xml_tag`.
 * - 2026-09-19: First-contact now derives solely from `director_data.first_contact` (dropped the dead `meta.is_opening_turn` and empty `snapshot.flags` checks and the synthetic "first_contact" keyword); it maps to the single TASK_LIBRARY.PROSE.CHARACTER.FIRST_CONTACT directive.
 * - 2026-09-19: Moved the profile-sorting FOCUS directive into TASK_LIBRARY.SORTING.FOCUS(entity_type) (task.js), folding in the macro rule; render_profile_sorting now simply calls it.
 * - 2026-09-19: Fix pass — render_enhancement treats explicit `null` directive/layer_key as missing (nullish coalescing) and dropped the dead `_array_mode` parameter; Profile enhancement callers now rely solely on catalog hydration (single source of truth).
 * - 2026-09-19: Replaced intermediate `modules/entities/index.js` aggregator with direct concrete imports from `sheets.js`, `presence.js`, and `epistemic.js` under P4 Zero Backwards Compatibility.
 * - 2026-09-19: Fixed E1 (Profile Field Enhancement Metadata): render_enhancement now defensively hydrates missing enhancer, label, directive, layer_key, and is_array_field from PROFILE_FIELD_CATALOG, and updated header to reflect modern compile_prompt architecture.
 * - 2026-09-19: Fixed Director alternation protocol resolution (R1): reordered render_entity_sheets before render_core_protocols and passed has_alternations(entity_sheets).
 * - 2026-09-18: Consolidated Optics keyword directives through render_keyword_directives_xml(..., "OPTICS") supplied to build_optics_builder_protocol.
 * - 2026-09-18: Promoted prompts.js as sovereign prompt switchboard; streamlined builder.js assembly line and unified story prose compilation facades.
 * - 2026-09-18: Absorbed render_optics_prompt from deconstructed optics.js, coordinating visual prompt synthesis through modules per scrobbles.md blueprint.
 * - 2026-09-18: Standardized <PROTOCOLS> to <CORE_PROTOCOLS> across Director, Continuum, Enhancement, Sorting, and Optics; ordered <CORE_PROTOCOLS> before entities and moved <TASK> to bottom in enhancement and profile sorting per scrobbles.md blueprint.
 * - 2026-09-18: Master Prompt Pipeline Standardization: (1) Added `compile_pipeline_prompt(mode_key, context)` implementing the 7-layer pipeline runner; (2) Added `build_story_prose` unifying character, npc, narrator, prologue, epilogue, and ghostwriter prose generation; (3) Added `build_continuum` and `build_sorting` unified facade methods; (4) Added Epistemic Wall verification guard via `verify_epistemic_integrity`; (5) Pruned duplicate schema from Director protocols.
 * - 2026-09-16: Spatial Architecture Standardization & Non-Theater Integration: (1) Connected `render_present_entities_xml` to `config.entities.present_entities` in Director compilation; (2) Connected `render_nearby_entities_xml` to `config.entities.nearby_entities` in Continuum memory compilation; (3) Pruned dead `render_scene_spotlight_xml` and `render_scene_cast_xml` imports.
 * - 2026-09-16: Task Simplification & Action Directive Repatriation — Delegated character and scene action directive assembly to `resolve_character_action_directive` and `resolve_scene_action_directive` from `task.js`; simplified `render_keyword_directives_xml` call.
 * - 2026-09-16: Task Nomenclature Standardization — Standardized prompt task compiler variables (`task_xml`) and `directives` parameters across `render_enhancement` and `render_profile_sorting`.
 * - 2026-09-16: Standardized Director system envelope with `round` attribute on `<SYSTEM mode="director" round="...">`, removing redundant `<ROUND>` child from Director task. Repatriated `render_scene_spotlight_xml` from `entities.js`.
 * - 2026-09-16: Switched task directive imports from loose constants to unified `TASK_LIBRARY` (`TASK_LIBRARY.DIRECTOR`, `TASK_LIBRARY.PROSE`, `TASK_LIBRARY.SORTING`), aligning with PROTOCOL_LIBRARY architecture.
 * - 2026-09-16: Task Compiler Standardization — Updated render_continuum_task, render_enhancement_instructions, and render_profile_sorting_instructions calls to render_task with mode parameter.
 * - 2026-09-15: Prompt Pipeline Symmetrical Consolidation — (1) Extracted shared `render_prose_turn_core` and `extract_somatic_inner` unifying `render_story_prose` and `render_scene_narrator` by construction; (2) Fixed live narrator style regression by resolving full NarrativeStyle objects and passing recency dynamics snapshots; (3) Routed CONTINUUM, PROFILE, and PROSE formats through parameter-aware `get_output_format(config.format, ...)`.
 * - 2026-09-13: Synchronized render_profile_sorting_instructions call with Full-Name nomenclature (`ingestion_instruction`, `redistribute_instruction`, `output_rules_instruction`).
 * - 2026-09-13: Inlined Director role line directly into render_system_xml; purged render_role_xml import.
 * - 2026-09-12: Standardization pass — render_memory resolves its history window via history.js `resolve_history(config.history)` and gates <INPUT_HISTORY> on `history_config.enabled`; fixed a double <CHAPTER_HISTORY> wrap; imported render_continuum_task following the task.js rename.
 * - 2026-09-12: Switched format references to unified OUTPUT_FORMATS.MEMORIES in render_enhancement and cleaned up output_rules_str in render_profile_sorting.
 * - 2026-09-12: Zero backwards compatibility pass — consumed OUTPUT_FORMATS with kebab-case keys and get_output_format from format.js. Relocated instruction renderers to task.js.
 * - 2026-09-12: Modularization pass — imported schemas (DIRECTOR_SCHEMA, PROFILE_SCHEMA, MEMORY_FORGE_SCHEMA), contracts (TEMPORAL_CONTRACT), OUTPUT_FORMATS, and instruction renderers from format.js.
 * - 2026-09-11: Purification pass — the prompts.js manifest now drives compilation (protocol lists, constitution gate, role keys, schema/contract/pov keys, and the entity context/spotlight gates); render_dynamics_axes_xml is injected into render_entity_sheets and resolve_context_directives is computed here, breaking the modules→physics imports; ind renamed to indent_continuation; render_history hop collapsed.
 * - 2026-09-11: Updated import of CHARACTER_DIRECTIVES from modules/task.js following modular boundary alignment.
 * - 2026-09-11: Standardized system prompt envelope imports: consuming resolve_system_role_line, default render_director_system_xml role_xml, and SYSTEM_CLOSE_TAG.
 * - 2026-09-11: Extracted raw XML formatting into modular Lego blocks in modules/ (history.js, system.js, protocols.js, entities.js, task.js), transforming builder.js into a pure coordinator.
 * - 2026-09-11: Grand Intelligence Purification: Consolidated all prompt compilation (Director, Story Prose, Ghostwriter, Narrator, Memory Forge, Enhancement, Sorting) into builder.js driven by prompts.js and modules/, freeing domain engines completely.
 * - 2026-09-10: Redundancy sweep. Dropped the unconsumed prompt_builder.render_protocols passthrough; extract_plan_from_state is module-private.
 * - 2026-09-06: Deduplicated scoring context assembly in create_render_accessors(); standardized nomenclature; purged fallback in build_prologue(); standardized window.exposed bridge.
 * - 2026-08-28: Co-located render_builder directly in builder.js to eliminate circular imports from shared.js.
 */
