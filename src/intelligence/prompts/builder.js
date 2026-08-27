/**
 * src/intelligence/prompts/builder.js
 * 🧠 INTELLIGENCE KERNEL PROMPT BUILDER
 *
 * Centralized assembly line for the Intelligence Kernel.
 * Aggregates all domain prompt builders into a single, cohesive prompt_builder service.
 */

import { ENTITY_CATALOG } from "@data";
import { temporal_engine } from "../temporal-pipeline.js";
import { parse_macros, render_protocols, render_builder } from "./shared.js";
import {
  render_director,
  render_character,
  render_npc_character,
  render_ghostwriter,
  render_terse_director_task,
  build_narrator,
} from "./story-prompts.js";
import { render_memory } from "./temporal-prompts.js";
import { render_enhancement, render_profile_sorting } from "./profile-prompts.js";

export const prompt_builder = {
  parse_macros(text, owner, entities = {}) {
    return parse_macros(text, owner, entities);
  },
  build_director_prompt(payload, snapshot) {
    const render_accessors = render_builder.create_render_accessors(payload.entities, payload.input, payload.raw_messages);
    const rendered = render_director({
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
      },
    };
  },
  build_character_prompt(payload, snapshot, director_data) {
    const render_accessors = render_builder.create_render_accessors(payload.entities, payload.input, payload.raw_messages);
    const rendered = render_character({
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
      director_data,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
        flags: snapshot.flags,
        memories: temporal_engine.score(payload.entities?.AI?.memories || []).slice(0, 5),
      },
    };
  },
  build_scene_narrator_prompt(payload, snapshot, director_data) {
    const render_accessors = render_builder.create_render_accessors(payload.entities, payload.input, payload.raw_messages);
    const rendered = build_narrator("scene", {
      ...payload,
      render_accessors,
      compressed_snapshot: snapshot,
      director_data,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
        flags: snapshot.flags,
        memories: temporal_engine.score(payload.entities?.FRACTAL?.memories || []).slice(0, 5),
      },
    };
  },
  build_npc_prompt(payload, npc, snapshot, director_data) {
    const entities = { ...(payload.entities || {}), [npc.id]: npc };
    const render_accessors = render_builder.create_render_accessors(entities, payload.input, payload.raw_messages);
    const rendered = render_npc_character({
      ...payload,
      entities,
      npc,
      render_accessors,
      compressed_snapshot: snapshot,
      director_data,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      meta: {
        ai: snapshot.ai?.dynamics,
        fractal: snapshot.fractal?.dynamics,
        role: "npc",
        entity_id: npc?.id,
      },
    };
  },
  build_prologue(payload, snapshot) {
    const render_accessors = render_builder.create_render_accessors(payload.entities, payload.input, payload.raw_messages);
    if (payload.type === "prologue") {
      const rendered = build_narrator("prologue", {
        ...payload,
        render_accessors,
        compressed_snapshot: snapshot,
      });
      return {
        system: prompt_builder.clean_prompt_text(rendered.system),
        task: prompt_builder.clean_prompt_text(rendered.task),
        meta: {},
      };
    }
    return prompt_builder.build_character_prompt(payload, snapshot, {});
  },
  create_render_accessors: render_builder.create_render_accessors,
  render_history: render_builder.render_history,
  build_scoring_context(input = "", simulation_log = []) {
    const recent = (Array.isArray(simulation_log) ? simulation_log : [])
      .slice(-10)
      .map((m) => m.content || m.text || "")
      .join(" ");
    return `${input || ""} ${recent}`.trim();
  },
  render_protocols(selection) {
    return render_protocols(selection);
  },
  clean_prompt_text(str) {
    return typeof str === "string"
      ? str
          .replace(/[ \t]+$/gm, "")
          .replace(/\n{3,}/g, "\n")
          .trim()
      : "";
  },
  build_epilogue(entities, dynamics, recent_history = [], conclusion_status = "CONCLUDED") {
    const safe_entities = {
      AI: entities?.AI || { name: "AI", present: {}, eternal: {} },
      USER: entities?.USER || { name: "USER", present: {}, eternal: {} },
      FRACTAL: entities?.FRACTAL || { name: "FRACTAL", present: {}, eternal: {} },
    };
    const rendered = build_narrator("epilogue", {
      entities: safe_entities,
      render_accessors: render_builder.create_render_accessors(safe_entities, "", recent_history),
      compressed_snapshot: {
        ai: { dynamics: dynamics?.ai },
        fractal: { dynamics: dynamics?.fractal },
      },
      conclusion_status,
    });
    return {
      system: prompt_builder.clean_prompt_text(rendered.system),
      task: prompt_builder.clean_prompt_text(rendered.task),
      messages: [],
    };
  },
  build_memory_prompt(entities_or_target, history = [], options = {}) {
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
    const meta = ENTITY_CATALOG[`${resolved_type}.${field_id}`] ||
      ENTITY_CATALOG[field_id] || {
        directive: "Expand and enrich the fragment.",
        enhancer: "GENERAL",
      };
    const is_array_field = meta.type === "array";
    return {
      system: render_enhancement({
        content,
        label: meta.sublabel || meta.label || entity_name,
        directive: meta.directive,
        enhancer: meta.enhancer,
        is_image_field: is_image_field || field_id.endsWith(".physical"),
        is_array_field,
        array_mode,
        _field_id: field_id,
        layer_key: meta.layer_key || "",
        entity,
        entity_type: resolved_type,
      }),
      messages: [],
    };
  },
  build_profile_sorting_prompt(inputData, entity_type = "character", options = {}) {
    return {
      system: render_profile_sorting(entity_type, options),
      messages: [
        {
          role: "user",
          text: typeof inputData === "string" ? inputData : JSON.stringify(inputData, null, 2),
        },
      ],
    };
  },
  build_ghostwriter(entities, input = "") {
    return render_ghostwriter({ entities, input });
  },
  build_terse_director_task() {
    return render_terse_director_task();
  },
};

if (typeof window !== "undefined") {
  window.prompt_builder = prompt_builder;
}
