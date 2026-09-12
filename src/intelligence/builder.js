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
 * 2. Story Prose Compilers (build_character, build_scene_narrator, build_npc, build_prologue, build_epilogue, build_ghostwriter)
 * 3. Director Planning Compiler (build_director, build_terse_director_task)
 * 4. Temporal Continuum Distillation (build_memory)
 * 5. Profile Ingestion & Enhancement Compilers (build_enhancement, build_profile_sorting)
 *
 * Architecture & Purity Invariant:
 * - Pure assembly layer: coordinates structural modules.
 * - Leaves domain engines (director.js, story.js, temporal.js, profile.js) 100% prompt-free.
 * ============================================================================
 */

import { PROFILE_FIELD_CATALOG, get_style_keywords, get_narrative_style, resolve_active_style_key, render_narrative_style_xml } from "@data";
import {
  escape_xml,
  prompt_escape,
  parse_macros,
  indent_continuation,
  strip_cognition_blocks,
  has_alternations,
  expand_entity_macros,
  wrap_tag,
} from "@utils";
import { get_prompt } from "./prompts.js";
import {
  resolve_stability_lock,
  resolve_system_role_line,
  SYSTEM_CLOSE_TAG,
  render_system_xml,
  render_role_xml,
  SYSTEM_ROLES,
} from "./modules/system.js";
import { render_axiomatic_constitution } from "./modules/constitution.js";
import {
  render_protocols,
  render_core_protocols,
  resolve_pov_protocol,
  render_director_protocols_xml,
  render_keyword_directives_xml,
  resolve_macro_directive,
  PROTOCOL_LIBRARY,
} from "./modules/protocols.js";
import {
  render_entity_sheets,
  render_scene_spotlight_xml,
  render_scene_cast_xml,
  render_entity_memory_context,
  render_enhancement_field_context,
} from "./modules/entities.js";
import { render_history, render_chapter_history_xml, render_input_history_xml } from "./modules/history.js";
import {
  render_task,
  render_director_task,
  render_terse_director_task,
  render_memory_forge_task,
  DIRECTOR_TASK_RULES,
  SORTING_DIRECTIVES,
  SCENE_DIRECTIVES,
  GHOSTWRITE_DIRECTIVES,
  CHARACTER_DIRECTIVES,
  render_enhancement_instructions,
  render_profile_sorting_instructions,
} from "./modules/task.js";
import { OUTPUT_FORMATS, get_output_format, get_profile_schema, get_continuum_schema } from "./modules/format.js";
import {
  render_available_keywords_xml,
  render_dynamics_xml,
  render_subtext_xml,
  resolve_context_directives,
  render_dynamics_axes_xml,
} from "./physics.js";
import { temporal_engine, resolve_vector_pool } from "./temporal.js";

// ── 1. Render Builder Accessor Factory ─────────────────────────────────────────

export const render_builder = {
  /**
   * Creates an accessor bundle for retrieving formatted memories, future agenda, and history.
   * @param {Record<string, any>} [entities={}]
   * @param {string} [input=""]
   * @param {any[]} [raw_messages=[]]
   */
  create_render_accessors(entities = {}, input = "", raw_messages = []) {
    const resolve = (reference) => (typeof reference === "string" ? entities[reference] || entities.AI || {} : reference || {});
    const scoring_context = prompt_builder.build_scoring_context(input, raw_messages);

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
      simulation_log: (limit = 10, offset = 0) => render_history(raw_messages, limit, offset),
    };
  },

  /**
   * Collapses and formats turn history into clean XML entries.
   * @param {any[]} simulation_log
   * @param {number} [count=10]
   * @param {number} [offset=0]
   */
  render_history(simulation_log, count = 10, offset = 0) {
    return render_history(simulation_log, count, offset);
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
  const schema = get_output_format(config.format || config.task?.schema, OUTPUT_FORMATS.DIRECTOR);
  const shared_protocols = render_protocols(config.protocols.join(", "));
  const local_protocols = render_director_protocols_xml(schema);
  const full_protocols = `${shared_protocols}\n\n${local_protocols}`.trim();
  const active_style_keywords = get_style_keywords(resolve_active_style_key());

  const entity_sheets = render_entity_sheets({
    entities: scene_entities,
    npc_entities,
    in_scene_ids,
    accessors,
    config,
    is_npc: false,
    render_axes: render_dynamics_axes_xml,
    speaker_dynamics: compressed_snapshot?.ai?.dynamics,
    fractal_dynamics: compressed_snapshot?.fractal?.dynamics,
  });

  const keyword_directives_xml = render_keyword_directives_xml(
    DIRECTOR_TASK_RULES.KEYWORD_DIRECTIVES,
    render_available_keywords_xml(active_style_keywords),
  );

  const system = render_system_xml({
    mode: "director",
    children: [
      render_role_xml(config.system.role, SYSTEM_ROLES[config.system.role]()),
      render_dynamics_xml(),
      render_narrative_style_xml(),
      entity_sheets,
      keyword_directives_xml,
      wrap_tag("PROTOCOLS", full_protocols, 4),
      config.entities.spotlight ? render_scene_spotlight_xml({ entities: scene_entities, npc_entities, in_scene_ids }) : null,
    ],
    closed: true,
  });

  const last_ai_message = (active_messages || []).filter((message) => message.role === "model").at(-1);
  const last_ai_text = last_ai_message ? strip_cognition_blocks(last_ai_message.content || last_ai_message.text || "").trim() : "";

  const task = render_director_task({
    round,
    input,
    last_ai_text,
    schema,
  });

  return { system, task };
}

export { render_terse_director_task };

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

  const style = get_narrative_style(resolve_active_style_key());

  const speaker_dynamics = is_npc ? active_speaker?.dynamics || {} : compressed_snapshot?.ai?.dynamics || entities?.AI?.dynamics || {};
  const fractal_dynamics = compressed_snapshot?.fractal?.dynamics || entities?.FRACTAL?.dynamics || {};

  const somatic_signals_xml = render_subtext_xml(speaker_dynamics, fractal_dynamics, {
    keywords: director_data?.keywords || [],
    style: is_ghostwrite ? null : style,
  });
  const somatic_inner = String(somatic_signals_xml || "")
    .replace(/^\s*<SUBTEXT>\s*/, "")
    .replace(/\s*<\/SUBTEXT>\s*$/, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  const is_first_contact =
    meta?.is_opening_turn ||
    (Array.isArray(compressed_snapshot?.flags) && compressed_snapshot.flags.includes("FIRST_CONTACT")) ||
    (Array.isArray(director_data?.keywords) && director_data.keywords.includes("first_contact"));

  const constitution = config.constitution.axiomatic ? render_axiomatic_constitution() : "";

  const entities_block = render_entity_sheets({
    entities,
    npc_entities,
    in_scene_ids,
    active_speaker,
    accessors,
    config,
    is_npc,
    render_axes: render_dynamics_axes_xml,
    speaker_dynamics,
    fractal_dynamics,
  });

  const first_contact_directive = is_first_contact ? (resolve_context_directives(["first_contact"]) || [])[0]?.directive || "" : "";

  const core = render_core_protocols({
    is_narrator: false,
    pov_protocol,
    style,
    first_contact_directive,
    has_alternation: has_alternations(entities_block),
  });

  const fractal_name = prompt_escape(entities?.FRACTAL?.name || "the setting");
  const role_line = resolve_system_role_line({ role: config.system.role, speaker_name, listener_name, fractal_name });

  const system = render_system_xml({
    round,
    mode: config.system.mode,
    children: [role_line, constitution, core, entities_block],
    closed: false,
  });

  const stability_lock_content = resolve_stability_lock(meta);

  const draft_directive = input?.trim()
    ? GHOSTWRITE_DIRECTIVES.ENHANCE(speaker_name, prompt_escape(input.trim()))
    : GHOSTWRITE_DIRECTIVES.DRAFT(speaker_name, listener_name);

  const action_directive = is_npc
    ? CHARACTER_DIRECTIVES.NPC_BOUNDARY(speaker_name)
    : is_ghostwrite
      ? `${draft_directive}\n    ${GHOSTWRITE_DIRECTIVES.META}`
      : input?.trim()
        ? CHARACTER_DIRECTIVES.ADVANCE
        : CHARACTER_DIRECTIVES.INITIATIVE;

  const input_origin_entity = is_ghostwrite ? active_speaker : entities?.USER;
  const input_origin = input_origin_entity?.id || input_origin_entity?.name || "USER";

  const task = render_task({
    config,
    input,
    input_origin,
    style,
    somatic_inner,
    snapshot: { dynamics: speaker_dynamics, style },
    action_directive,
    stability_lock: stability_lock_content,
  });

  return { system, task, system_close: SYSTEM_CLOSE_TAG };
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
  const resolved_scene_template =
    scene_template ||
    (is_prologue_beat
      ? "PROLOGUE"
      : conclusion_status === "collapsed" || conclusion_status === "COLLAPSED"
        ? "COLLAPSE"
        : conclusion_status
          ? "EPILOGUE"
          : "CONTINUATION");
  const config = get_prompt("narrator");

  const speaker = entities?.FRACTAL;
  const speaker_name = prompt_escape(speaker?.name || "The Scene");

  const constitution = config.constitution.axiomatic ? render_axiomatic_constitution() : "";
  const style = resolve_active_style_key();

  const compressed_snapshot = entities?._compressed_dynamics;
  const speaker_dynamics = compressed_snapshot?.ai?.dynamics || null;
  const fractal_dynamics = compressed_snapshot?.fractal?.dynamics || null;

  const entities_block = render_entity_sheets({
    entities,
    accessors: render_builder.create_render_accessors(entities, input, []),
    config,
    render_axes: render_dynamics_axes_xml,
    speaker_dynamics,
    fractal_dynamics,
  });

  const core = render_core_protocols({
    is_narrator: true,
    style,
    first_contact_directive: "",
    has_alternation: has_alternations(entities_block),
  });

  const role_line = resolve_system_role_line({ role: config.system.role, speaker_name });

  const system = render_system_xml({
    round,
    mode: config.system.mode,
    children: [role_line, constitution, core, entities_block],
    closed: false,
  });

  const stability_lock_content = resolve_stability_lock(meta);

  const action_directive = is_prologue_beat
    ? `${SCENE_DIRECTIVES.PROLOGUE}\n    Input: ${prompt_escape(input?.trim() || "The scene begins.")}`
    : resolved_scene_template === "CONTINUATION"
      ? SCENE_DIRECTIVES.CONTINUATION
      : resolved_scene_template === "COLLAPSE"
        ? SCENE_DIRECTIVES.COLLAPSE
        : SCENE_DIRECTIVES.EPILOGUE;

  const somatic_signals_xml = render_subtext_xml(speaker_dynamics, fractal_dynamics, {
    keywords: meta?.keywords || [],
    style,
  });
  const somatic_inner = String(somatic_signals_xml || "")
    .replace(/^\s*<SUBTEXT>\s*/, "")
    .replace(/\s*<\/SUBTEXT>\s*$/, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  const input_origin_entity = entities?.USER;
  const input_origin = input_origin_entity?.id || input_origin_entity?.name || "USER";

  const task = render_task({
    config,
    input: is_prologue_beat ? "" : input,
    input_origin,
    style,
    somatic_inner,
    action_directive,
    stability_lock: stability_lock_content,
  });

  return { system, task, system_close: SYSTEM_CLOSE_TAG };
}

export const render_narrator_prose = render_scene_narrator;

/**
 * Continuum prompt compiler (Shot-2 back-shot).
 */
export function render_memory({ target_entity, target_key = "AI_CHARACTER", other_entities = {}, history = [] }) {
  const config = get_prompt("continuum");
  const target_name = target_entity?.name || target_key;
  const target_xml = config.entities.target_context ? render_entity_memory_context(target_key, target_entity) : "";
  const scene_cast_xml = config.entities.scene_cast ? render_scene_cast_xml(other_entities, target_key) : "";
  const chapter_xml = config.entities.chapter_history && target_entity ? render_chapter_history_xml(target_entity) : "";

  const target_type = target_entity?.type || (target_key === "FRACTAL" ? "fractal" : "character");
  const task_xml = render_memory_forge_task({
    target_name,
    target_key,
    schema: get_continuum_schema(target_type),
  });

  const history_xml = render_input_history_xml(history);

  return render_system_xml({
    attributes: { role: "CONTINUUM_CARETAKER", target: target_name },
    children: [
      wrap_tag("PROTOCOLS", indent_continuation(render_protocols(config.protocols.join(", ")), 4).trim(), 2),
      wrap_tag("TARGET_ENTITY_CONTEXT", target_xml, 2),
      scene_cast_xml,
      chapter_xml ? wrap_tag("CHAPTER_HISTORY", indent_continuation(chapter_xml, 4).trim(), 2) : null,
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
  is_array_field = false,
  _array_mode = "append_new",
  field_id = "",
  layer_key = "",
  entity = null,
  entity_type = "character",
}) {
  const config = get_prompt("enhancement");
  const macro_instruction = !is_image_field ? resolve_macro_directive(entity_type) : "";
  const output_rules = is_array_field || field_id.endsWith(".physical") || is_image_field ? "" : OUTPUT_FORMATS.PROSE;

  const instructions_xml = render_enhancement_instructions({
    directive,
    macro_instruction,
    output_rules,
  });

  return render_system_xml({
    mode: "enhancement",
    attributes: {
      role: enhancer || "GENERAL",
      enhancing: label || "",
      field: field_id,
    },
    children: [
      instructions_xml,
      wrap_tag("PROTOCOLS", indent_continuation(render_protocols(config.protocols.join(", ")), 4).trim(), 2),
      layer_key ? `<LAYER>${escape_xml(layer_key)}</LAYER>` : null,
      config.entities.field_context
        ? render_enhancement_field_context(entity, field_id, content, entity_type, (e, c) =>
            temporal_engine.format(resolve_vector_pool(e), c || "", { max_chars: 1500 }),
          )
        : null,
      wrap_tag("INPUT_CONTENT", indent_continuation(escape_xml(content), 4).trim(), 2),
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

  const ingestion_str = options.ingestion ? `\n\n    ${indent_continuation(SORTING_DIRECTIVES.INGESTION, 4)}` : "";
  const redistribute_str = options.redistribute ? `\n\n    ${indent_continuation(SORTING_DIRECTIVES.REDISTRIBUTE, 4)}` : "";
  const output_rules_str = "";

  const instructions_xml = render_profile_sorting_instructions({
    schema: get_profile_schema(resolved_type),
    pov_instruction: PROTOCOL_LIBRARY.POV[config.task.pov] || PROTOCOL_LIBRARY.POV.THIRD_PERSON,
    focus_directive,
    ingestion_str,
    redistribute_str,
    output_rules_str,
  });

  return render_system_xml({
    mode: "sorting",
    attributes: {
      role: "NARRATIVE_STRUCTURER",
      enhancing: "Entire Profile",
    },
    children: [instructions_xml, wrap_tag("PROTOCOLS", indent_continuation(render_protocols(config.protocols.join(", ")), 4).trim(), 2)],
    closed: true,
  });
}

// ── 4. Unified Prompt Builder Service ─────────────────────────────────────────

export const prompt_builder = {
  clean_prompt_text,

  parse_macros(text, owner, entities = {}) {
    return parse_macros(text, owner, entities);
  },

  create_render_accessors: render_builder.create_render_accessors,
  render_history,

  /**
   * Builds context text for temporal vector relevance scoring.
   * @param {string} [input]
   * @param {any[]} [simulation_log]
   * @returns {string}
   */
  build_scoring_context(input = "", simulation_log = []) {
    const recent = (Array.isArray(simulation_log) ? simulation_log : [])
      .slice(-10)
      .map((message) => message.content || message.text || "")
      .join(" ");
    return `${input || ""} ${recent}`.trim();
  },

  /**
   * Builds the system and task prompts for the Director planning turn.
   * @param {any} payload
   * @param {any} snapshot
   */
  build_director(payload, snapshot = {}) {
    const render_accessors = resolve_accessors(payload);
    const rendered = render_director({
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
    });

    return pack_prompt(rendered, {
      ai: snapshot.ai?.dynamics,
      fractal: snapshot.fractal?.dynamics,
    });
  },

  /**
   * Builds the character prose generator prompt for the primary AI speaker.
   * @param {any} payload
   * @param {any} snapshot
   * @param {any} [director_data]
   */
  build_character(payload, snapshot = {}, director_data = {}) {
    const render_accessors = resolve_accessors(payload);
    const rendered = render_story_prose({
      prompt_mode: "interaction",
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
      director_data,
    });

    return pack_prompt(rendered, {
      ai: snapshot.ai?.dynamics,
      fractal: snapshot.fractal?.dynamics,
      flags: snapshot.flags,
    });
  },

  /**
   * Builds the environmental narrator prompt for scene transitions or fractal prose.
   * @param {any} payload
   * @param {any} snapshot
   * @param {any} [director_data]
   */
  build_scene_narrator(payload, snapshot = {}, director_data = {}) {
    const render_accessors = resolve_accessors(payload);
    const rendered = render_narrator_prose({
      scene_template: "CONTINUATION",
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
      director_data,
    });

    return pack_prompt(rendered, {
      ai: snapshot.ai?.dynamics,
      fractal: snapshot.fractal?.dynamics,
      flags: snapshot.flags,
    });
  },

  /**
   * Builds the character prose generator prompt for an active NPC on stage.
   * @param {any} payload
   * @param {any} npc
   * @param {any} snapshot
   * @param {any} [director_data]
   */
  build_npc(payload, npc, snapshot = {}, director_data = {}) {
    const entities = { ...(payload.entities || {}), [npc.id]: npc };
    const render_accessors = resolve_accessors(payload, entities);
    const rendered = render_story_prose({
      prompt_mode: "npc",
      ...payload,
      entities,
      speaker: npc,
      render_accessors,
      compressed_snapshot: snapshot,
      director_data,
    });

    return pack_prompt(rendered, {
      ai: snapshot.ai?.dynamics,
      fractal: snapshot.fractal?.dynamics,
      role: "npc",
      entity_id: npc?.id,
    });
  },

  /**
   * Builds the initial scene-setting prologue prompt.
   * @param {any} payload
   * @param {any} snapshot
   */
  build_prologue(payload, snapshot = {}) {
    const render_accessors = resolve_accessors(payload);
    const rendered = render_narrator_prose({
      scene_template: "PROLOGUE",
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
    });
    return pack_prompt(rendered);
  },

  /**
   * Builds the concluding epilogue narrator prompt.
   * @param {Record<string, any>} entities
   * @param {any} dynamics
   * @param {any[]} [recent_history]
   * @param {string} [conclusion_status]
   */
  build_epilogue(entities, dynamics, recent_history = [], conclusion_status = "CONCLUDED") {
    const safe_entities = {
      AI: entities?.AI || { name: "AI", present: {}, eternal: {} },
      USER: entities?.USER || { name: "USER", present: {}, eternal: {} },
      FRACTAL: entities?.FRACTAL || { name: "FRACTAL", present: {}, eternal: {} },
    };

    const rendered = render_narrator_prose({
      scene_template: conclusion_status === "COLLAPSED" ? "COLLAPSE" : "EPILOGUE",
      entities: safe_entities,
      render_accessors: render_builder.create_render_accessors(safe_entities, "", recent_history),
      compressed_snapshot: {
        ai: { dynamics: dynamics?.ai },
        fractal: { dynamics: dynamics?.fractal },
      },
    });

    return pack_prompt(rendered, {}, []);
  },

  /**
   * Builds the memory distillation prompt for the background memory forge.
   * @param {any} entities_or_target
   * @param {any[]} [history]
   * @param {any} [options]
   */
  build_memory(entities_or_target, history = [], options = {}) {
    let target_entity = options.target_entity || null;
    let target_key = options.target_key || "AI_CHARACTER";
    let other_entities = options.other_entities && Object.keys(options.other_entities).length ? { ...options.other_entities } : {};

    if (entities_or_target && typeof entities_or_target === "object") {
      if (entities_or_target.AI_CHARACTER || entities_or_target.USER_PERSONA || entities_or_target.FRACTAL) {
        if (!target_entity) target_entity = entities_or_target[target_key] || entities_or_target.AI_CHARACTER;
        if (!Object.keys(other_entities).length) {
          other_entities = { ...entities_or_target };
        }
      } else if (!target_entity) {
        target_entity = entities_or_target;
      }
    }

    return {
      system: render_memory({ target_entity, target_key, other_entities, history }),
      messages: [],
    };
  },

  /**
   * Builds the profile field enhancer prompt.
   */
  build_enhancement(
    field_id,
    content,
    entity_name = "",
    entity_type = "character",
    is_image_field = false,
    entity = null,
    array_mode = "append_new",
  ) {
    const resolved_type = entity_type === "user" ? "character" : entity_type || "character";
    const meta = PROFILE_FIELD_CATALOG[`${resolved_type}.${field_id}`] || {
      directive: "Expand and enrich the fragment.",
      enhancer: "GENERAL",
    };

    const is_array_field = meta.type === "array";
    return {
      system: render_enhancement({
        content,
        label: meta.label || entity_name,
        directive: meta.directive,
        enhancer: meta.enhancer,
        is_image_field: is_image_field || field_id.endsWith(".physical"),
        is_array_field,
        array_mode,
        field_id,
        layer_key: meta.layer_key || "",
        entity,
        entity_type: resolved_type,
      }),
      messages: [],
    };
  },

  /**
   * Builds the character card ingestion and profile extraction prompt.
   * @param {any} input_data
   * @param {string} [entity_type]
   * @param {any} [options]
   */
  build_profile_sorting(input_data, entity_type = "character", options = {}) {
    return {
      system: render_profile_sorting(entity_type, options),
      messages: [
        {
          role: "user",
          text: typeof input_data === "string" ? input_data : JSON.stringify(input_data, null, 2),
        },
      ],
    };
  },

  /**
   * Builds the ghostwriter autocomplete prompt.
   * @param {any} entities
   * @param {string} [input]
   */
  build_ghostwriter(entities, input = "") {
    return render_ghostwriter({ entities, input });
  },

  /**
   * Builds the terse fallback prompt for the Director.
   */
  build_terse_director_task() {
    return render_terse_director_task();
  },
};

if (typeof window !== "undefined") {
  window.exposed = {
    ...window.exposed,
    prompt_builder,
  };
}

/**
 * CHANGELOG
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
