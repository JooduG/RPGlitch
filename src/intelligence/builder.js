/**
 * src/intelligence/builder.js
 * ============================================================================
 * 🧠 INTELLIGENCE KERNEL PROMPT BUILDER — Master Prompt Assembly Line
 * ============================================================================
 *
 * Centralized assembly line for the RPGlitch Intelligence Kernel.
 * Consumes the declarative manifest in ./prompts.js and the 5 structural modules
 * (system, constitution, protocols, entities, task) to compile all prompt payloads:
 * 1. Render Accessor Factory & History Formatter (create_render_accessors, render_history)
 * 2. Story Prose Compilers (compile_prompt / compile_pipeline_prompt)
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
  indent_continuation,
  strip_cognition_blocks,
  has_alternations,
  expand_entity_macros,
  wrap_tag,
  resolve_macro_directive,
  parse_relational_vector,
  resolve_alternations,
  alternation_field_label,
  detox_prose,
} from "@utils";
import { get_prompt } from "./prompts.js";
import { resolve_stability_lock, resolve_system_role_line, SYSTEM_CLOSE_TAG, render_system_xml } from "./modules/system.js";
import { render_axiomatic_constitution } from "./modules/constitution.js";
import { render_core_protocols, resolve_pov_protocol, PROTOCOL_LIBRARY } from "./modules/protocols.js";
import {
  render_entity_sheets,
  render_entity_memory_context,
  render_enhancement_field_context,
  render_optics_entities_xml,
} from "./modules/entities/sheets.js";
import { render_nearby_entities_xml, render_present_entities_xml } from "./modules/entities/presence.js";
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
import { render_dynamics_xml, render_dynamics_axes_xml } from "./modules/entities/sheets.js";
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

export const render_builder = {
  /**
   * Creates an accessor bundle for retrieving formatted memories, future agenda, and history.
   * @param {Record<string, any>} [entities={}]
   * @param {string} [input=""]
   * @param {any[]} [raw_messages=[]]
   */
  create_render_accessors(entities = {}, input = "", raw_messages = []) {
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
  },

  /**
   * Collapses and formats turn history into clean XML entries.
   * @param {any[]} simulation_log
   * @param {Object} [options={}]
   * @param {number} [options.limit=10]
   * @param {number} [options.offset=0]
   * @param {number} [options.indent=2]
   */
  render_history(simulation_log, options = {}) {
    return render_history(simulation_log, {
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
      indent: options.indent ?? 2,
      ...options,
    });
  },
};

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
  return render_builder.create_render_accessors(entities, payload?.input || "", messages);
}

/**
 * Packages rendered prompt text into a normalized prompt package with metadata.
 * @param {{ system?: string, task?: string, system_close?: string }} rendered
 * @param {Record<string, any>} [meta]
 * @param {any[]} [messages]
 */
function pack_prompt(rendered, meta = {}, messages = []) {
  return {
    system: clean_prompt_text(rendered?.system),
    task: clean_prompt_text(rendered?.task),
    ...(rendered?.system_close ? { system_close: String(rendered.system_close) } : {}),
    ...(Object.keys(meta).length > 0 ? { meta } : {}),
    ...(Array.isArray(messages) && messages.length > 0 ? { messages } : {}),
  };
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
  const accessors = render_accessors || render_builder.create_render_accessors(scene_entities, input, active_messages);
  const config = get_prompt("director");
  const schema = get_output_format(config.format || config.task?.schema);
  const active_style_keywords = get_style_keywords(resolve_active_style_key());

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
  });

  const core_protocols_xml = render_core_protocols({
    protocols: config.protocols,
    has_alternation: has_alternations(entity_sheets),
  });

  const keyword_directives_xml = render_keyword_directives_xml(render_available_keywords_xml(active_style_keywords, AVAILABLE_KEYWORDS));

  const role_line = resolve_system_role_line({ role: config.system.role });

  const system = render_system_xml({
    mode: "director",
    round,
    children: [
      role_line,
      core_protocols_xml,
      render_dynamics_xml(DYNAMICS_AXES),
      keyword_directives_xml,
      entity_sheets,
      config.entities.present_entities ? render_present_entities_xml({ entities: scene_entities, npc_entities, in_scene_ids }) : null,
    ],
    closed: true,
  });

  const last_ai_message = (active_messages || []).filter((message) => message.role === "model").at(-1);
  const last_ai_text = last_ai_message ? strip_cognition_blocks(last_ai_message.content || last_ai_message.text || "").trim() : "";

  const task = render_task({
    mode: "director",
    round,
    input,
    last_ai_text,
    schema,
  });

  return { system, task };
}

/**
 * Strips outer <SUBTEXT> wrappers and normalizes inner somatic lines.
 * @param {string} [somatic_signals_xml=""]
 * @returns {string}
 */
function extract_somatic_inner(somatic_signals_xml = "") {
  return String(somatic_signals_xml || "")
    .replace(/^\s*<SUBTEXT>\s*/, "")
    .replace(/\s*<\/SUBTEXT>\s*$/, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
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
 * @returns {{ system: string, task: string, system_close: string }}
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
}) {
  const style = get_narrative_style(resolve_active_style_key());

  const somatic_signals_xml = render_subtext_xml(speaker_dynamics, fractal_dynamics, {
    keywords,
    style: suppress_style_subtext ? null : style,
    physics_protocols: PHYSICS_PROTOCOLS,
    evaluate_dynamics_rules,
    evaluate_subtext_protocols,
  });
  const somatic_inner = extract_somatic_inner(somatic_signals_xml);

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
    role: config.system.role,
    speaker_name,
    listener_name,
    fractal_name,
  });

  const system = render_system_xml({
    round,
    mode: config.system.mode,
    children: [role_line, constitution, core, entities_block],
    closed: false,
  });

  const stability_lock_content = resolve_stability_lock(meta);

  const task = render_task({
    config,
    input,
    input_origin,
    style,
    somatic_inner,
    snapshot: snapshot ? { ...snapshot, style } : { style },
    action_directive,
    stability_lock: stability_lock_content,
  });

  return { system, task, system_close: SYSTEM_CLOSE_TAG };
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
  const active_speaker = speaker || (ghostwrite ? entities?.USER : entities?.AI);
  const active_listener = listener || (ghostwrite ? entities?.AI : entities?.USER);
  const is_npc = !ghostwrite && !!active_speaker && active_speaker !== entities?.AI && active_speaker !== entities?.USER;
  const config = get_prompt(prompt_mode || (ghostwrite ? "ghostwrite" : is_npc ? "npc" : "interaction"));
  const is_ghostwrite = config.system.mode === "ghostwrite";

  const accessors = render_accessors || render_builder.create_render_accessors(entities, input);
  const pov_protocol = resolve_pov_protocol(active_speaker);

  const speaker_name = prompt_escape(active_speaker?.name || (is_npc ? "NPC" : "AI"));
  const listener_name = prompt_escape(active_listener?.name || "Listener");
  const fractal_name = prompt_escape(entities?.FRACTAL?.name || "the setting");

  const speaker_dynamics = is_npc ? active_speaker?.dynamics || {} : compressed_snapshot?.ai?.dynamics || entities?.AI?.dynamics || {};
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

  const is_first_contact =
    !has_prior_relationship &&
    (meta?.is_opening_turn ||
      (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT")) ||
      (Array.isArray(director_data?.keywords) && director_data.keywords.includes("first_contact")));

  const action_directive = resolve_character_action_directive({
    speaker_name,
    is_npc,
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
  });
}

/**
 * Compiles Ghostwriter prompt.
 */
export function render_ghostwriter({ entities, input = "" }) {
  const speaker = entities?.USER ? expand_entity_macros(entities.USER, entities) : null;
  const target = entities?.AI ? expand_entity_macros(entities.AI, entities) : null;
  return render_story_prose({
    speaker,
    listener: target,
    entities,
    input,
    ghostwrite: true,
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
}) {
  const is_prologue_beat = is_prologue || scene_template === "PROLOGUE";

  const config = get_prompt("narrator");

  const speaker = entities?.FRACTAL;
  const speaker_name = prompt_escape(speaker?.name || "The Scene");

  const compressed_snapshot = entities?._compressed_dynamics;
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
    accessors: render_builder.create_render_accessors(entities, input, []),
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

export const render_narrator_prose = render_scene_narrator;

/**
 * Continuum prompt compiler (Shot-2 back-shot).
 */
export function render_memory({ target_entity, target_key = "AI_CHARACTER", other_entities = {}, history = [] }) {
  const config = get_prompt("continuum");
  const history_config = resolve_history(config.history);
  const target_name = target_entity?.name || target_key;
  const target_xml = config.entities.target_context ? render_entity_memory_context(target_key, target_entity) : "";
  const nearby_entities_xml = config.entities.nearby_entities
    ? render_nearby_entities_xml(other_entities, { exclude_key: target_key, indent: 2 })
    : "";
  const chapter_xml = config.entities.chapter_history && target_entity ? render_chapter_history_xml(target_entity, 2) : "";

  const target_type = target_entity?.type || (target_key === "FRACTAL" ? "fractal" : "character");
  const task_xml = render_task({
    mode: "continuum",
    target_name,
    schema: get_output_format(config.format, { entity_type: target_type }),
  });

  const history_xml = history_config.enabled
    ? render_input_history_xml(history, {
        limit: history_config.limit,
        max_chars: history_config.max_chars,
      })
    : "";

  return render_system_xml({
    mode: "continuum",
    attributes: { role: "CONTINUUM_CARETAKER", target: target_name },
    children: [
      render_core_protocols({ protocols: config.protocols }),
      wrap_tag("TARGET_ENTITY_CONTEXT", target_xml, 2),
      nearby_entities_xml,
      chapter_xml,
      history_xml,
      task_xml,
    ],
    closed: true,
  });
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
  is_array_field,
  _array_mode = "append_new",
  field_id = "",
  layer_key,
  entity = null,
  entity_type = "character",
}) {
  const config = get_prompt("enhancement");
  const normalized_type = entity_type === "user" ? "character" : entity_type || "character";
  const catalog_meta = field_id ? PROFILE_FIELD_CATALOG[`${normalized_type}.${field_id}`] || PROFILE_FIELD_CATALOG[field_id] : null;

  const resolved_enhancer = enhancer || catalog_meta?.enhancer || config.system.role || "ENHANCER";
  const resolved_label = label || catalog_meta?.label || "";
  const resolved_directive = directive !== undefined ? directive : catalog_meta?.directive || "";
  const resolved_layer_key = layer_key !== undefined ? layer_key : catalog_meta?.layer_key || "";
  const resolved_is_array = is_array_field !== undefined ? is_array_field : catalog_meta?.type === "array";

  const macro_directive = !is_image_field ? resolve_macro_directive(normalized_type) : "";
  const output_rules = resolved_is_array || field_id.endsWith(".physical") || is_image_field ? "" : get_output_format(config.format);

  const task_xml = render_task({
    mode: "enhancement",
    directives: [resolved_directive, macro_directive, output_rules],
  });

  return render_system_xml({
    mode: "enhancement",
    attributes: {
      role: resolved_enhancer,
      enhancing: resolved_label,
      field: field_id,
    },
    children: [
      render_core_protocols({ protocols: config.protocols }),
      resolved_layer_key ? `<LAYER>${escape_xml(resolved_layer_key)}</LAYER>` : null,
      config.entities.field_context
        ? render_enhancement_field_context(entity, field_id, content, normalized_type, (e, c) =>
            temporal_engine.format(resolve_vector_pool(e), c || "", { max_chars: 1500 }),
          )
        : null,
      wrap_tag("INPUT_CONTENT", indent_continuation(escape_xml(content), 4).trim(), 2),
      task_xml,
    ],
    closed: true,
  });
}

/**
 * Profile sorting prompt compiler.
 */
export function render_profile_sorting(entity_type = "character", options = {}) {
  const config = get_prompt("sorting");
  const resolved_type = entity_type === "user" ? "character" : entity_type || "character";
  const macro_rule = resolve_macro_directive(resolved_type);
  const focus_directive =
    resolved_type === "fractal"
      ? `FOCUS: Extracting data for a FRACTAL (scene/setting/environment). Re-contextualize or discard character-specific traits. ${macro_rule}`
      : `FOCUS: Extracting data for an individual CHARACTER. Re-contextualize or discard environmental/setting text. ${macro_rule}`;

  const pov_key =
    config.protocols
      .find((p) => typeof p === "string" && p.includes("POV."))
      ?.split(".")
      .pop() || "THIRD";

  const task_xml = render_task({
    mode: "sorting",
    schema: get_output_format(config.format, { entity_type: resolved_type }),
    directives: [
      PROTOCOL_LIBRARY.CORE_PROTOCOLS.PERSPECTIVE.POV[pov_key] || PROTOCOL_LIBRARY.CORE_PROTOCOLS.PERSPECTIVE.POV.THIRD,
      focus_directive,
      options.ingestion ? TASK_LIBRARY.SORTING.INGESTION : null,
      options.redistribute ? TASK_LIBRARY.SORTING.REDISTRIBUTE : null,
    ],
  });

  return render_system_xml({
    mode: "sorting",
    attributes: {
      role: "NARRATIVE_STRUCTURER",
      enhancing: "Entire Profile",
    },
    children: [render_core_protocols({ protocols: config.protocols }), task_xml],
    closed: true,
  });
}

/**
 * Constructs system prompts for all image generation tasks (solo entity portraits and multi-character scenes).
 * Aligns strictly with scrobbles.md blueprint:
 * <SYSTEM role="SENSORY_CORTEX">
 *   <CORE_PROTOCOLS>
 *   <ENTITIES>
 *   <HISTORY> (optional)
 *   <TASK>
 *     <TARGET>
 *     <INPUT_INTENT>
 *     <OUTPUT_FORMAT mode="json">
 *   </TASK>
 * </SYSTEM>
 *
 * @param {string} target_type_or_intent
 * @param {string|Record<string, any>} [raw_intent_or_options]
 * @param {Record<string, any>} [context={}]
 * @returns {string}
 */
export function render_optics_prompt(target_type_or_intent, raw_intent_or_options, context = {}) {
  let target_type = target_type_or_intent;
  let raw_intent = raw_intent_or_options;
  let options = context;

  if (typeof target_type_or_intent === "object" && target_type_or_intent !== null && !Array.isArray(target_type_or_intent)) {
    options = { ...target_type_or_intent };
    target_type = options.tier || options.target_type || "solo_entity";
    raw_intent = options.raw_intent || options.prompt_context || options.input || "";
  } else if (typeof raw_intent_or_options === "object" && raw_intent_or_options !== null && !Array.isArray(raw_intent_or_options)) {
    if (raw_intent_or_options.tier) {
      target_type = raw_intent_or_options.tier;
      raw_intent = target_type_or_intent;
      options = { ...raw_intent_or_options, ...(raw_intent_or_options.context || {}) };
    }
  }

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
  });

  // Cinematography Resolution (Layer 6 Spatial Framing)
  const cinematography = resolve_optics_cinematography({
    tier,
    solo_subject,
    active_ai_character,
    active_user_persona,
    active_fractal_setting,
    main_entity,
    visual_staging: options?.visual_staging || "",
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
    has_alternation: has_alternations(combined_input_text),
  });

  // Layer 5: Sensory History (<CONVERSATION_HISTORY>)
  const history_xml = format_sensory_history(history);

  // Layer 7: Output Schema Format (<OUTPUT_FORMAT>)
  const resolved_negative_prompt = engine_tokens.negative_prompt || "";
  const schema = get_output_format(config.format, { variant: is_selfie ? "selfie" : variant, negative_prompt: resolved_negative_prompt });

  const rolled_intent = detox_prose(roll(raw_intent || ""));

  // Layer 6: Universal Task (<TASK>)
  const task_xml = render_task({
    mode: "optics",
    target_tier: tier,
    input_intent: rolled_intent,
    think_format: config.task?.think_format || "optics",
    cinematography,
    engine_tokens,
    keywords: valid_keywords,
    is_selfie,
    schema,
  });

  const full_system = render_system_xml({
    mode: "optics",
    attributes: { role: "SENSORY_CORTEX" },
    children: [protocols_xml, entities_xml, history_xml ? history_xml.trim() : null, task_xml],
    closed: true,
  });

  const clean_system = clean_prompt_text(full_system);
  const clean_task = clean_prompt_text(task_xml);

  return Object.assign(new String(clean_system), {
    system: clean_system,
    task: clean_task,
    messages: [],
  });
}

// ── 4. Declarative Pipeline Runner ──────────────────────────────────────────

/**
 * Master 7-layer declarative pipeline compiler.
 * Executes the 7 canonical manifest layers in strict sequential order:
 * 1. System/Role -> 2. Constitution -> 3. Protocols -> 4. Entities -> 5. History -> 6. Task -> 7. Output Format
 *
 * Symmetrically compiles prompt payloads into normalized prompt packages.
 *
 * @param {string} mode_key - Manifest key from PROMPTS catalog
 * @param {Object} [context={}] - Dynamic runtime context, entities, dynamics, and options
 * @returns {{ system: string, task: string, system_close?: string, meta?: Record<string, any>, messages?: any[] }}
 */
export function compile_pipeline_prompt(mode_key, context = {}) {
  const config = get_prompt(mode_key);

  switch (mode_key) {
    case "director": {
      const render_accessors = resolve_accessors(context);
      const rendered = render_director({
        ...context,
        render_accessors,
        compressed_snapshot: context.compressed_snapshot || {},
      });
      return pack_prompt(rendered, {
        ai: context.compressed_snapshot?.ai?.dynamics,
        fractal: context.compressed_snapshot?.fractal?.dynamics,
      });
    }

    case "director_terse": {
      const schema = context.schema || get_output_format(config.format);
      const task = render_task({ mode: "director", terse: true, schema });
      const system = render_system_xml({
        mode: "director",
        round: context.round,
        children: [resolve_system_role_line({ role: config.system.role })],
        closed: true,
      });
      return pack_prompt({ system, task });
    }

    case "continuum": {
      const system = render_memory(context);
      return {
        system: clean_prompt_text(system),
        task: "",
        messages: [],
      };
    }

    case "enhancement": {
      const system = render_enhancement(context);
      return {
        system: clean_prompt_text(system),
        task: "",
        messages: [],
      };
    }

    case "sorting": {
      // NOTE: Layer-Order Design Intent:
      // Mode "sorting" (NARRATIVE_STRUCTURER) encapsulates the structural profile rules and schema
      // within <SYSTEM>, while injecting the raw profile text to be sorted via messages (which the
      // transport layer serializes into <HISTORY> appended after <TASK>). This ensures the model reads
      // the extraction rules, POV, and JSON schema directive before consuming the unstructured raw text.
      const system = render_profile_sorting(context.entity_type, context.options);
      return {
        system: clean_prompt_text(system),
        task: "",
        messages: [
          {
            role: "user",
            text: typeof context.input_data === "string" ? context.input_data : JSON.stringify(context.input_data || {}, null, 2),
          },
        ],
      };
    }

    case "optics": {
      return render_optics_prompt(context);
    }

    case "narrator": {
      const scene_template = context.scene_template || (context.is_prologue ? "PROLOGUE" : context.is_epilogue ? "EPILOGUE" : "CONTINUATION");
      if (scene_template === "PROLOGUE") {
        const entities = context.entities || {};
        const snapshot = context.snapshot || context.compressed_snapshot || {};
        const render_accessors = resolve_accessors(context, entities);
        return pack_prompt(
          render_narrator_prose({
            scene_template: "PROLOGUE",
            ...context,
            entities,
            render_accessors,
            compressed_snapshot: snapshot,
          }),
        );
      }

      if (scene_template === "EPILOGUE" || scene_template === "COLLAPSE" || context.is_epilogue) {
        const conclusion_status = context.conclusion_status || (scene_template === "COLLAPSE" ? "COLLAPSED" : "EPILOGUE");
        const raw_entities = context.entities || {};
        const safe_entities = {
          AI: raw_entities?.AI || { name: "AI", present: {}, eternal: {} },
          USER: raw_entities?.USER || { name: "USER", present: {}, eternal: {} },
          FRACTAL: raw_entities?.FRACTAL || { name: "FRACTAL", present: {}, eternal: {} },
        };
        const snapshot = context.snapshot || context.compressed_snapshot || {};
        const recent_history = context.recent_history || context.simulation_log || context.raw_messages || [];
        return pack_prompt(
          render_narrator_prose({
            scene_template: conclusion_status === "COLLAPSED" ? "COLLAPSE" : "EPILOGUE",
            entities: safe_entities,
            render_accessors: render_builder.create_render_accessors(safe_entities, "", recent_history),
            compressed_snapshot: {
              ai: { dynamics: snapshot.ai?.dynamics || context.dynamics?.ai },
              fractal: { dynamics: snapshot.fractal?.dynamics || context.dynamics?.fractal },
            },
          }),
          {},
          [],
        );
      }

      const entities = context.entities || {};
      const snapshot = context.snapshot || context.compressed_snapshot || {};
      const render_accessors = resolve_accessors(context, entities);
      return pack_prompt(
        render_narrator_prose({
          scene_template: scene_template || "CONTINUATION",
          ...context,
          entities,
          render_accessors,
          compressed_snapshot: snapshot,
          director_data: context.director_data || {},
        }),
        {
          ai: snapshot.ai?.dynamics,
          fractal: snapshot.fractal?.dynamics,
          flags: snapshot.flags,
        },
      );
    }

    case "npc": {
      const npc_entity = context.npc || context.speaker;
      const raw_entities = context.entities || {};
      const combined_entities = npc_entity?.id ? { ...raw_entities, [npc_entity.id]: npc_entity } : raw_entities;
      const snapshot = context.snapshot || context.compressed_snapshot || {};
      const npc_accessors = resolve_accessors(context, combined_entities);
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
        {
          ai: snapshot.ai?.dynamics,
          fractal: snapshot.fractal?.dynamics,
          role: "npc",
          entity_id: npc_entity?.id,
        },
      );
    }

    default: {
      const rendered = render_story_prose({
        ...context,
        prompt_mode: mode_key,
      });
      return pack_prompt(
        rendered,
        {
          ai: context.compressed_snapshot?.ai?.dynamics,
          fractal: context.compressed_snapshot?.fractal?.dynamics,
          flags: context.compressed_snapshot?.flags,
          ...(context.meta || {}),
        },
        context.messages || [],
      );
    }
  }
}

// ── 5. Universal Accessors & Exports ─────────────────────────────────────────

export const create_render_accessors = render_builder.create_render_accessors;

/**
 * CHANGELOG
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
