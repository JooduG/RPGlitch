/**
 * src/intelligence/prompts/builder.js
 * 🧠 INTELLIGENCE KERNEL PROMPT BUILDER
 *
 * Centralized assembly line for the Intelligence Kernel.
 * Aggregates all domain prompt builders into a single, cohesive prompt_builder service.
 */

import { PROFILE_FIELD_CATALOG } from "@data";
import { escape_xml, prompt_escape, collapse_history } from "@utils";
import { temporal_engine, resolve_vector_pool } from "../temporal-pipeline.js";
import { parse_macros, render_protocols, extract_plan_from_state } from "./shared.js";
import { render_director, render_terse_director_task } from "./director-prompts.js";
import { render_story_prose, render_ghostwriter } from "./story-prompts.js";
import { render_memory } from "./temporal-prompts.js";
import { render_enhancement, render_profile_sorting } from "./profile-prompts.js";

// ── 1. Render Builder Accessor Factory ─────────────────────────────────────────

export const render_builder = {
  /**
   * Creates an accessor bundle for retrieving formatted memories, future agenda, and history.
   * @param {Record<string, any>} [entities={}]
   * @param {string} [input=""]
   * @param {any[]} [raw_messages=[]]
   */
  create_render_accessors(entities = {}, input = "", raw_messages = []) {
    const resolve = (ref) => (typeof ref === "string" ? entities[ref] || entities.AI || {} : ref || {});
    const scoring_context = `${input || ""} ${(Array.isArray(raw_messages) ? raw_messages : [])
      .slice(-10)
      .map((m) => m.content || m.text || "")
      .join(" ")}`.trim();

    return {
      _context: scoring_context,
      past: (ref, options = {}) => {
        const entity = resolve(ref);
        const formatted = temporal_engine.format(resolve_vector_pool(entity), scoring_context, {
          offset: 0,
          max_chars: 1500,
          ...options,
        });
        return parse_macros(formatted, entity, entities);
      },
      future: (ref) => {
        const entity = resolve(ref);
        const raw_future = String(entity?.future || "").trim();
        const extracted_plan = extract_plan_from_state(entity?.present?.non_physical);
        const combined_future = [raw_future, extracted_plan ? `Active Plan: ${extracted_plan}` : ""].filter(Boolean).join("\n");
        return parse_macros(combined_future.trim(), entity, entities);
      },
      simulation_log: (limit = 10, offset = 0) => render_builder.render_history(raw_messages, limit, offset),
    };
  },

  /**
   * Collapses and formats turn history into clean XML entries.
   * @param {any[]} simulation_log
   * @param {number} [count=10]
   * @param {number} [offset=0]
   */
  render_history(simulation_log, count = 10, offset = 0) {
    if (!simulation_log || typeof simulation_log === "string") return simulation_log || "";
    const collapsed = collapse_history(simulation_log, { separator: "\n", stripBoldQuotes: true });
    const start = Math.max(0, collapsed.length - (count + offset));
    const end = Math.max(0, collapsed.length - offset);
    return collapsed
      .slice(start, end)
      .map((c, idx) => {
        const turn_num = start + idx + 1;
        const speaker = c.name || (c.role === "USER_PERSONA" ? "User" : c.role === "FRACTAL" ? "Fractal" : "Character");
        const clean_content = String(c.content || "")
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .replace(/<\/?think>/gi, "")
          .trim();
        return `    <turn number="${turn_num}" speaker="${escape_xml(speaker)}">${prompt_escape(clean_content)}</turn>`;
      })
      .join("\n");
  },
};

// ── 2. Internal Helpers ───────────────────────────────────────────────────────

/**
 * Trims trailing line whitespace and consolidates excessive newlines.
 * @param {string} [str]
 * @returns {string}
 */
function clean_prompt_text(str) {
  return typeof str === "string"
    ? str
        .replace(/[ \t]+$/gm, "")
        .replace(/\n{3,}/g, "\n")
        .trim()
    : "";
}

/**
 * Resolves or creates a render_accessors bundle for prompt generation.
 * @param {any} payload
 * @param {any} [override_entities]
 */
function resolve_accessors(payload, override_entities = null) {
  if (payload?.render_accessors) return payload.render_accessors;
  const entities = override_entities || payload?.entities || {};
  return render_builder.create_render_accessors(entities, payload?.input || "", payload?.raw_messages || []);
}

/**
 * Packages rendered prompt text into a normalized prompt package with metadata.
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

// ── 3. Unified Prompt Builder Service ─────────────────────────────────────────

export const prompt_builder = {
  clean_prompt_text,

  parse_macros(text, owner, entities = {}) {
    return parse_macros(text, owner, entities);
  },

  render_protocols,
  create_render_accessors: render_builder.create_render_accessors,
  render_history: render_builder.render_history,

  /**
   * Builds context text for temporal vector relevance scoring.
   * @param {string} [input]
   * @param {any[]} [simulation_log]
   * @returns {string}
   */
  build_scoring_context(input = "", simulation_log = []) {
    const recent = (Array.isArray(simulation_log) ? simulation_log : [])
      .slice(-10)
      .map((m) => m.content || m.text || "")
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
      mode: "character",
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
    const rendered = render_story_prose({
      mode: "scene",
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
      mode: "character",
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
    if (payload.type === "prologue") {
      const render_accessors = resolve_accessors(payload);
      const rendered = render_story_prose({
        mode: "prologue",
        ...payload,
        render_accessors,
        compressed_snapshot: snapshot,
      });
      return pack_prompt(rendered);
    }
    return prompt_builder.build_character(payload, snapshot, {});
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

    const rendered = render_story_prose({
      mode: "epilogue",
      entities: safe_entities,
      render_accessors: render_builder.create_render_accessors(safe_entities, "", recent_history),
      compressed_snapshot: {
        ai: { dynamics: dynamics?.ai },
        fractal: { dynamics: dynamics?.fractal },
      },
      conclusion_status,
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
  window.prompt_builder = prompt_builder;
}

/**
 * CHANGELOG
 * - 2026-08-28: Co-located render_builder directly in builder.js to eliminate circular imports from shared.js.
 */
