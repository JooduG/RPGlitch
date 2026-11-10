/**
 * src/engine/lifecycle.js
 * ============================================================================
 * 🌱 ENGINE LIFECYCLE — NON-TURN JOBS
 * ============================================================================
 *
 * Story-lifecycle work that is not a turn: prologue, epilogue, visual
 * envisioning, and profile structuring. Each job brings its own prompt;
 * model contact goes through transport.js, turn mechanics through turns.js,
 * and the opening turn through runs.js.
 */

import { normalize_entity } from "../data/entities.js";
import { state_bridge } from "../utils/index.js";
import { get_transport, generate_text, enhance_text } from "./transport.js";
import { execute_turn_visualizer, execute_turn_structuring } from "./turns.js";
import { execute_turn } from "./runs.js";

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

  const { get_resolution_string } = await import("../media/optics.js");
  const { get_visual_style } = await import("../definitions/visual-styles.js");
  const runtime = state_bridge.runtime || {};
  const app = state_bridge.app || {};

  const app_choice = app_style || app.settings?.visual_style;
  let style_key = "none";

  if (app_choice && app_choice !== "none" && app_choice !== "default") {
    style_key = app_choice;
  } else if (entity?.visual_style && entity.visual_style !== "none" && entity.visual_style !== "default") {
    style_key = entity.visual_style;
  } else if (
    runtime.active_fractal?.visual_style &&
    runtime.active_fractal.visual_style !== "none" &&
    runtime.active_fractal.visual_style !== "default"
  ) {
    style_key = runtime.active_fractal.visual_style;
  }

  const style_def = get_visual_style(style_key);
  const tier_resolution = get_resolution_string(type);
  if (style_def && style_def.llm_refine === false) {
    return { prompt: text.trim(), negative_prompt: style_def.negative_prompt || "", resolution: tier_resolution };
  }

  try {
    const target_entity = entity || (type === "fractal" ? runtime.active_fractal : runtime.active_ai);
    const style_cues = style_def?.engine
      ? [style_def.engine.medium, style_def.engine.camera, style_def.engine.palette, style_def.engine.texture].filter(Boolean).join("; ")
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
          {
            system: compiled_prompt,
            role: "model",
            startWith: stream_options.startWith != null ? String(stream_options.startWith) : "",
          },
          {
            silent: true,
            priority: stream_options.priority || "background",
            signal: stream_options.signal,
          },
        );
        return typeof response === "string" ? response : response?.text || "";
      },
    };
    const result = await execute_turn_visualizer({
      transport: live_transport,
      round: Number(runtime.round || 1),
      entities: {
        AI: type !== "fractal" ? normalize_entity(target_entity) : null,
        USER: null,
        FRACTAL: type === "fractal" ? normalize_entity(target_entity) : normalize_entity(runtime.active_fractal),
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
    const parsed = await execute_turn_structuring({
      transport: live_transport,
      input_data,
      type,
      signal,
    });
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
  const runtime = state_bridge.runtime;
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
    await state_bridge.session_driver.log_message("", "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      story_id,
      meta: {
        id: node_id,
        round: 0,
        is_prologue: true,
      },
      attachments: [],
    });

    // 2. Stream Fractal prologue scene setting via Character core (is_character: false)
    const { compile_prompt } = await import("./prompts.js");
    const prologue_prompt = compile_prompt({
      core: "CHARACTER",
      round: 0,
      entities: {
        AI: fractal_quadrant,
        USER: user_quadrant,
        FRACTAL: fractal_quadrant,
      },
      task_options: {
        turn_tempo: 3,
      },
    });

    app.log("Establishing prologue scene (Round 0)...", "system");
    const raw_prologue = await live_transport.stream(prologue_prompt, {
      startWith: "<think>\n",
    });

    const { think: prologue_think, prose: prologue_body } = parse_think_block(raw_prologue);
    const prologue_text = (prologue_body || raw_prologue || "").trim();

    await state_bridge.session_driver.edit_log_entry(node_id, prologue_text, {
      think: prologue_think,
    });
    app.log("Prologue scene established.", "system");

    // 3. Register deferred prologue scene image
    const prologue_image_requested_at = Date.now();
    await state_bridge.session_driver.update_log_attachment(node_id, 0, {
      src: null,
      metadata: { mode: "story_scene", requested_at: prologue_image_requested_at },
    });

    let release_prologue_image = () => {};
    const prologue_image_gate = new Promise((resolve) => {
      release_prologue_image = resolve;
    });

    const { visual_engine } = await import("../media/visual.svelte.js");
    if (visual_engine) {
      (async () => {
        const { mark_generation_in_flight, clear_generation_in_flight } = await import("../media/visual.svelte.js");
        mark_generation_in_flight?.(node_id, 0);
        await prologue_image_gate;
        try {
          const img_result = await visual_engine.visualize(story_id, prologue_text, "story_scene", { silent: true });
          if (img_result?.imageUrl) {
            await state_bridge.session_driver.update_log_attachment(node_id, 0, {
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
    if (typeof state_bridge.simulation_state !== "undefined") {
      state_bridge.simulation_state.phase = "idle";
    }
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
  const runtime = state_bridge.runtime;
  const app = state_bridge.app;

  app.log(`Generating epilogue (${conclusion_status})...`, "system");
  const node_id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`;
  const fractal_name = runtime?.active_fractal?.name || "Fractal Entity";

  const { compile_prompt } = await import("./prompts.js");

  const prompt = compile_prompt({
    core: "CHARACTER",
    round: (Number(runtime?.round) || 1) + 1,
    entities: {
      FRACTAL: runtime?.active_fractal || {},
      AI: runtime?.active_ai || {},
      USER: runtime?.active_user || {},
    },
    task_options: {
      speaker_role: "fractal",
      is_epilogue: true,
      conclusion_status,
    },
  });

  const response = await generate_text({
    system: prompt,
    role: "fractal",
    node_id,
  });

  const { parse_think_block } = await import("../data/parser.js");
  const { detox_prose } = await import("../utils/detox.js");
  const cleaned_prose = detox_prose(parse_think_block(response || "").prose);

  if (state_bridge.session_driver?.log_message) {
    await state_bridge.session_driver.log_message(cleaned_prose, "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      story_id,
      meta: {
        id: node_id,
        is_epilogue: true,
        conclusion_status,
        story_status: conclusion_status,
      },
    });
  }

  app.end_stream?.();
  if (typeof state_bridge.simulation_state !== "undefined") {
    state_bridge.simulation_state.phase = "locked";
  }
  return cleaned_prose;
}
/**
 * CHANGELOG:
 * - 2026-11-10: Created from bridge.js lifecycle atoms (prologue, epilogue,
 *   visualizer envision, profile structuring) unchanged except transport and
 *   opening-turn imports. bridge.js dies.
 */
