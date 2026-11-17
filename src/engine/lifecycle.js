/**
 * src/engine/lifecycle.js
 * ============================================================================
 * 🌱 ENGINE LIFECYCLE - NON-TURN JOBS
 * ============================================================================
 *
 * Story-lifecycle work that is not a turn: prologue, epilogue, visual
 * envisioning, and profile structuring. Each job brings its own prompt;
 * model contact goes through transport.js, turn mechanics through turns.js,
 * and the opening turn through runs.js.
 */

import { append_ledger_entries, apply_profile_to_entity, create_entity, get_story, normalize_entity, update_cast, update_entity, upsert_entity } from "@data";
import { clean_generated_prose, parse_think_block } from "@simulation";
import { state_bridge } from "@utils";
import { simulation_state } from "./status.svelte.js";
import { execute_turn } from "./runs.js";
import { runtime } from "./runtime.svelte.js";
import { session_driver } from "./sessions.svelte.js";
import { enhance_text, generate_text, get_transport } from "./transport.js";
import { execute_turn_structuring, execute_turn_visualizer } from "./turns.js";

/**
 * Executes visual prompt envisioning/refinement via the visualizer purpose core.
 *
 * @param {string} text - Draft description or camera note
 * @param {string} [type="character"] - Generation mode or kind ("character", "fractal", "story_scene", etc.)
 * @param {object|null} [entity=null] - Target entity snapshot
 * @param {string|null} [app_style=null] - App-level visual style override
 * @param {AbortSignal|null} [signal=null]
 * @returns {Promise<{ prompt: string, negative_prompt: string, resolution?: string }>}
 */
export async function execute_visualizer_envision(text, type = "character", entity = null, app_style = null, signal = null) {
  if (!text || typeof text !== "string") {
    return { prompt: "", negative_prompt: "" };
  }

  const { get_resolution_string } = await import("@simulation");
  const { get_visual_style } = await import("../definitions/visual-styles.js");
  const app = state_bridge.app || {};

  const app_choice = app_style || app.settings?.visual_style;
  let style_key = "none";

  if (app_choice && app_choice !== "none" && app_choice !== "default") {
    style_key = app_choice;
  } else if (entity?.visual_style && entity.visual_style !== "none" && entity.visual_style !== "default") {
    style_key = entity.visual_style;
  } else if (runtime.active_fractal?.visual_style && runtime.active_fractal.visual_style !== "none" && runtime.active_fractal.visual_style !== "default") {
    style_key = runtime.active_fractal.visual_style;
  }

  const style_def = get_visual_style(style_key);
  const tier_resolution = get_resolution_string(type);
  if (style_def && style_def.llm_refine === false) {
    return { prompt: text.trim(), negative_prompt: style_def.negative_prompt || "", resolution: tier_resolution };
  }

  try {
    const target_entity = entity || (type === "fractal" ? runtime.active_fractal : runtime.active_ai);
    const style_cues =
      style_def?.engine ?
        [style_def.engine.medium, style_def.engine.camera, style_def.engine.palette, style_def.engine.texture].filter(Boolean).join("; ")
      : "";
    const trimmed_text = text.trim();
    const camera_note = style_cues ? `${trimmed_text} | Aesthetic Style: ${style_cues}` : trimmed_text;

    let subject_kind = "character";
    if (type === "fractal") {
      subject_kind = "place";
    } else if (type === "story_scene") {
      const active_names = [runtime.active_ai?.name, runtime.active_user?.name, entity?.name].filter(Boolean);
      const mentions_character = active_names.some((name) => trimmed_text.toLowerCase().includes(name.toLowerCase()));
      if (!mentions_character) {
        subject_kind = "place";
      }
    }

    const live_transport = {
      stream: async (compiled_prompt, stream_options = {}) => {
        const response = await generate_text(
          { system: compiled_prompt, role: "model", startWith: stream_options.startWith != null ? String(stream_options.startWith) : "" },
          { silent: true, priority: stream_options.priority || "background", signal: stream_options.signal },
        );
        return typeof response === "string" ? response : response?.text || "";
      },
    };
    const result = await execute_turn_visualizer({
      transport: live_transport,
      round: Number(runtime.round || 1),
      entities: {
        AI: type !== "fractal" ? normalize_entity(target_entity || {}) : null,
        USER: null,
        FRACTAL: type === "fractal" ? normalize_entity(target_entity || {}) : normalize_entity(runtime.active_fractal || {}),
      },
      camera_note,
      subject_kind,
      signal,
    });

    const base_negative = style_def?.negative_prompt || "";
    const prompt = result.prompt || trimmed_text;
    const negative_prompt = [base_negative, result.negative_prompt].filter(Boolean).join(", ");

    return { prompt, negative_prompt, resolution: tier_resolution };
  } catch (err) {
    console.warn("[execute_visualizer_envision] Visualizer refinement failed, using draft:", err);
    return { prompt: text.trim(), negative_prompt: style_def?.negative_prompt || "", resolution: tier_resolution };
  }
}
/**
 * Executes raw prose structuring via the Caretaker purpose core.
 *
 * @param {string} raw - Raw bio, concept, or character prose
 * @param {"character" | "fractal"} [type="character"]
 * @param {AbortSignal|null} [signal=null]
 * @returns {Promise<Record<string, any> | null>}
 */
export async function structure_profile(raw, type = "character", signal = null) {
  const input_data = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
  const live_transport = {
    stream: async (compiled_prompt, stream_options = {}) => {
      const response = await enhance_text({
        system: compiled_prompt,
        role: "model",
        startWith: stream_options.startWith != null ? String(stream_options.startWith) : "",
      });
      return typeof response === "string" ? response : response?.text || "";
    },
  };

  try {
    const parsed = await execute_turn_structuring({ transport: live_transport, input_data, type, signal });
    return parsed;
  } catch (err) {
    console.warn("[structure_profile] Structuring failed:", err);
    return null;
  }
}
/**
 * Executes a pure Prologue and opening AI narrative beat for Turn 0.
 *
 * @param {string} story_id
 * @returns {Promise<any>}
 */
export async function execute_prologue(story_id) {
  const app = state_bridge.app;
  if (!runtime || !story_id) return null;

  app.busy = true;

  try {
    const _ai_quadrant = normalize_entity(runtime.active_ai || app.selected_ai || {});
    const user_quadrant = normalize_entity(runtime.active_user || app.selected_user || {});
    const fractal_quadrant = normalize_entity(runtime.active_fractal || app.selected_fractal || {});

    const live_transport = get_transport();
    const node_id = `prologue-${Date.now()}`;
    const fractal_name = fractal_quadrant?.name || "Fractal Entity";

    runtime.round = 0;
    runtime.turn_type = "SYSTEM_TURN";
    runtime.last_director_beat_round = 0;
    runtime.last_dynamics_beat_round = 0;

    // 1. Establish the empty fractal role prologue entry
    await session_driver.log_message("", "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      story_id,
      meta: { id: node_id, round: 0, is_prologue: true },
      attachments: [],
    });

    // 2. Stream Fractal prologue scene setting via Character core (is_character: false)
    const { compile_prompt } = await import("@simulation");
    const prologue_prompt = compile_prompt({
      core: "CHARACTER",
      round: 0,
      entities: { AI: fractal_quadrant, USER: user_quadrant, FRACTAL: fractal_quadrant },
      task_options: { turn_tempo: 3 },
    });

    app.log("Establishing prologue scene (Round 0)...", "system");
    const raw_prologue = await live_transport.stream(prologue_prompt, { startWith: "<think>\n" });

    const { think: prologue_think, prose: prologue_body } = parse_think_block(raw_prologue);
    const prologue_text = (prologue_body || raw_prologue || "").trim();

    await session_driver.edit_log_entry(node_id, prologue_text, { think: prologue_think });
    app.log("Prologue scene established.", "system");

    // 3. Register deferred prologue scene image
    const prologue_image_requested_at = Date.now();
    await session_driver.update_log_attachment(node_id, 0, { src: null, metadata: { mode: "story_scene", requested_at: prologue_image_requested_at } });

    let release_prologue_image = () => {};
    const prologue_image_gate = new Promise((resolve) => {
      release_prologue_image = resolve;
    });

    const { visual_engine } = await import("../media/image-generation.js");
    if (visual_engine) {
      (async () => {
        const { mark_generation_in_flight, clear_generation_in_flight } = await import("../media/image-generation.js");
        mark_generation_in_flight?.(node_id, 0);
        await prologue_image_gate;
        try {
          const img_result = await visual_engine.visualize(prologue_text, "story_scene", { silent: true });
          if (img_result?.imageUrl) {
            await session_driver.update_log_attachment(node_id, 0, {
              src: img_result.imageUrl,
              metadata: {
                ...(img_result.metadata || {}),
                prompt: img_result.refinedPrompt || img_result.metadata?.prompt,
                mode: "story_scene",
                requested_at: prologue_image_requested_at,
              },
            });
          }
        } catch (img_err) {
          console.warn("[Prologue Image Error]", img_err);
        } finally {
          clear_generation_in_flight?.(node_id, 0);
        }
      })().catch(() => {});
    }

    // 4. Execute the opening AI character turn reacting directly to the prologue
    try {
      app.log("Generating opening character turn (Round 1)...", "ai");
      return await execute_turn(prologue_text, { is_opening_turn: true });
    } finally {
      release_prologue_image();
    }
  } catch (e) {
    console.error("Prologue Failed:", e);
    app.log("Error: Prologue Failed.", "error");
    throw e;
  } finally {
    app.busy = false;
    app.end_stream();
    simulation_state.phase = "idle";
  }
}
/**
 * Executes an Epilogue conclusion narrative beat for story conclusion.
 *
 * @param {string | number} story_id
 * @param {"CONCLUDED" | "COLLAPSED"} [conclusion_status="CONCLUDED"]
 * @returns {Promise<string | null>}
 */
export async function execute_epilogue(story_id, conclusion_status = "CONCLUDED") {
  const app = state_bridge.app;

  app.log(`Generating epilogue (${conclusion_status})...`, "system");
  const node_id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`;
  const fractal_name = runtime?.active_fractal?.name || "Fractal Entity";

  const { compile_prompt } = await import("@simulation");

  const prompt = compile_prompt({
    core: "CHARACTER",
    round: (Number(runtime?.round) || 1) + 1,
    entities: { FRACTAL: runtime?.active_fractal || {}, AI: runtime?.active_ai || {}, USER: runtime?.active_user || {} },
    task_options: { speaker_role: "fractal", is_epilogue: true, conclusion_status },
  });

  const response = await generate_text({ system: prompt, role: "fractal", node_id });

  const cleaned_prose = clean_generated_prose(parse_think_block(response || "").prose);

  await session_driver.log_message(cleaned_prose, "fractal", fractal_name, {
    turn_type: "SYSTEM_TURN",
    story_id,
    meta: { id: node_id, is_epilogue: true, conclusion_status, story_status: conclusion_status },
  });

  app.end_stream?.();
  simulation_state.phase = "locked";
  return cleaned_prose;
}
/**
 * Common birth core shared across spawn paths and ImportModal.
 * Runs structuring (if prose), maps profile leaves, saves to DB,
 * writes genesis ledger entries, and chains post-save portrait generation.
 *
 * @param {'character' | 'fractal'} type
 * @param {Object} draft
 * @param {Object} [options]
 * @returns {Promise<any>}
 */
export async function birth_entity_core(type, draft = {}, options = {}) {
  const entity_type = type === "fractal" ? "fractal" : "character";
  const name = String(draft?.name || "").trim();
  const raw_color = String(draft?.signature_color || "").trim();
  const description = String(draft?.description || "").trim();
  const scene_context = String(draft?.scene_context || "").trim();

  // Canonical init: fractals get velocity/entropy dynamics and "" past via
  // create_entity; the description seeds the quadrant prefill (overwritten
  // below when the draft already carries quadrants).
  let entity = create_entity(entity_type, {
    ...(name ? { name } : {}),
    ...(description ? { description } : {}),
    ...(raw_color ? { signature_color: raw_color } : {}),
    ...(draft?.speaking_style ? { speaking_style: draft.speaking_style } : {}),
    eternal: { physical: description, non_physical: "" },
    present: { physical: description, non_physical: "" },
    future: "",
    past: "",
  });
  // Orchestration-only extras the normalizer drops (same as pre-move behavior).
  entity.dynamics_baseline = { ...entity.dynamics };
  entity.is_wanderer = false;

  // Run structuring if rich synthesis text is provided
  if (options.run_sorter || (!draft?.eternal && !draft?.present && (name || description))) {
    try {
      const synthesis_source = [
        `Entity Name: ${entity.name}`,
        description ? `Core Concept: ${description}` : "",
        raw_color ? `Signature Color: ${raw_color}` : "",
        scene_context ? `Scene Context & Atmosphere: ${scene_context}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const rich_profile = await structure_profile(synthesis_source, entity_type);
      if (rich_profile && typeof rich_profile === "object") {
        entity = apply_profile_to_entity(entity, rich_profile);
      }
    } catch (error) {
      state_bridge.app?.log?.(`[GameMaster] Genesis rich synthesis failed for "${name}": ${error?.message || error}`, "warn");
    }
  } else if (draft && typeof draft === "object") {
    entity = apply_profile_to_entity(entity, draft);
  }

  if (name) entity.name = name;
  if (raw_color) entity.signature_color = raw_color;

  const saved_entity = await upsert_entity(entity);

  // Write Genesis Ledger Entries for all populated quadrant fields
  const story_id = options.story_id ?? runtime.story_id ?? null;
  const ledger_lines = [];

  const record_genesis_field = (field_path, value) => {
    if (!value) return;
    const string_value =
      Array.isArray(value) ? JSON.stringify(value)
      : typeof value === "object" ? JSON.stringify(value)
      : String(value);
    if (!string_value.trim()) return;
    ledger_lines.push({
      story_id,
      round: 0,
      seq: 0,
      entity_id: saved_entity.id,
      field: field_path,
      new_value: string_value,
      writer: "genesis",
      decider: "genesis",
    });
  };

  record_genesis_field("eternal.physical", saved_entity.eternal?.physical);
  record_genesis_field("eternal.non_physical", saved_entity.eternal?.non_physical);
  record_genesis_field("present.physical", saved_entity.present?.physical);
  record_genesis_field("present.non_physical", saved_entity.present?.non_physical);
  if (Array.isArray(saved_entity.past) ? saved_entity.past.length > 0 : saved_entity.past) {
    record_genesis_field("past", saved_entity.past);
  }
  record_genesis_field("future", saved_entity.future);

  if (ledger_lines.length > 0) {
    try {
      await append_ledger_entries(ledger_lines);
    } catch (err) {
      void err;
    }
  }

  // Register NPC on active story if spawned during a story session
  if (entity_type === "character" && story_id && story_id !== "debug") {
    try {
      const story = await get_story(story_id);
      const existing_npcs = Array.isArray(story?.npc_ids) ? story.npc_ids : [];
      const updated_npcs = [...new Set([...existing_npcs, saved_entity.id])];
      if (updated_npcs.length !== existing_npcs.length) {
        await update_cast(story_id, updated_npcs);
      }
    } catch (err) {
      state_bridge.app?.log?.(`[Storage] Failed to register NPC on story ${story_id}: ${err?.message || err}`, "warn");
    }
  }

  // Chained post-save portrait generation (fire-and-forget)
  if (options.generate_portrait !== false && entity_type === "character") {
    const { visual_engine } = await import("@media");
    if (typeof visual_engine?.generate === "function" && typeof window !== "undefined") {
      try {
        const portrait_promise = visual_engine
          .generate(saved_entity.id, { mode: "solo_entity", resolution: "512x512", _entity: saved_entity })
          .then(async (image_url) => {
            if (image_url && saved_entity.id) {
              const data_url = typeof image_url === "object" && image_url?.url ? image_url.url : image_url;
              await update_entity(saved_entity.id, { profile_picture: data_url });
              await runtime.update_entity?.("character", saved_entity.id, { profile_picture: data_url });
            }
          });
        if (portrait_promise && typeof portrait_promise.catch === "function") {
          portrait_promise.catch((error) =>
            state_bridge.app?.log?.(`[GameMaster] Portrait generation for "${name}" failed: ${error?.message || error}`, "warn"),
          );
        }
      } catch (_error) {
        /* portrait failure must never break genesis */
      }
    }
  }

  return saved_entity;
}
/**
 * CHANGELOG:
 * - 2026-11-10: Created from bridge.js lifecycle atoms (prologue, epilogue,
 *   visualizer envision, profile structuring) unchanged except transport and
 *   opening-turn imports. bridge.js dies.
 */
