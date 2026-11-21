/**
 * @file src/engine/lifecycle.js
 * Non-turn story lifecycle jobs: visual prompt refinement, profile structuring,
 * prologue/epilogue beats, entity birth, and user draft ghostwriting.
 */

import { apply_profile_to_entity, create_entity, get_story, normalize_entity, update_cast, update_entity, upsert_entity } from "@data";
import { get_visual_style } from "@definitions";
import { clear_generation_in_flight, mark_generation_in_flight, visual_engine } from "@media";
import { clean_generated_prose, compile_prompt, get_resolution_string, parse_think_block, reconstruct_history_from_feed } from "@simulation";
import { app, execution, session } from "@state";
import { run_generation_step, run_image_prompt_step, run_schema_extraction_step } from "./steps.js";
import { get_transport } from "./transport.js";
import { run_turn } from "./turns.js";

/**
 * Refines a draft description or camera note into a visual prompt via the
 * visualizer purpose core.
 *
 * @param {string} text
 * @param {string} [type="character"]
 * @param {object | null} [entity=null]
 * @param {string | null} [app_style=null]
 * @param {AbortSignal | null} [signal=null]
 * @returns {Promise<{ prompt: string, negative_prompt: string, resolution?: string }>}
 */
export async function refine_image_prompt(text, type = "character", entity = null, app_style = null, signal = null) {
  if (!text || typeof text !== "string") {
    return { prompt: "", negative_prompt: "" };
  }

  const app_choice = app_style || app.settings?.visual_style;
  let style_key = "none";

  if (app_choice && app_choice !== "none" && app_choice !== "default") {
    style_key = app_choice;
  } else if (entity?.visual_style && entity.visual_style !== "none" && entity.visual_style !== "default") {
    style_key = entity.visual_style;
  } else if (session.active_fractal?.visual_style && session.active_fractal.visual_style !== "none" && session.active_fractal.visual_style !== "default") {
    style_key = session.active_fractal.visual_style;
  }

  const style_def = get_visual_style(style_key);
  const tier_resolution = get_resolution_string(type);
  if (style_def && style_def.llm_refine === false) {
    return { prompt: text.trim(), negative_prompt: style_def.negative_prompt || "", resolution: tier_resolution };
  }

  try {
    const target_entity = entity || (type === "fractal" ? session.active_fractal : session.active_ai);
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
      const active_names = [session.active_ai?.name, session.active_user?.name, entity?.name].filter(Boolean);
      const mentions_character = active_names.some((name) => trimmed_text.toLowerCase().includes(name.toLowerCase()));
      if (!mentions_character) {
        subject_kind = "place";
      }
    }

    const result = await run_image_prompt_step({
      transport: get_transport(),
      round: Number(session.round || 1),
      entities: {
        AI: type !== "fractal" ? normalize_entity(target_entity || {}) : null,
        USER: null,
        FRACTAL: type === "fractal" ? normalize_entity(target_entity || {}) : normalize_entity(session.active_fractal || {}),
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
    console.warn("[refine_image_prompt] Visualizer refinement failed, using draft:", err);
    return { prompt: text.trim(), negative_prompt: style_def?.negative_prompt || "", resolution: tier_resolution };
  }
}

/**
 * Structures raw prose into 4-quadrant profile fields via the Caretaker core.
 *
 * @param {string} raw
 * @param {"character" | "fractal"} [type="character"]
 * @param {AbortSignal | null} [signal=null]
 * @returns {Promise<Record<string, any> | null>}
 */
export async function parse_entity_profile(raw, type = "character", signal = null) {
  const input_data = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);

  try {
    return await run_schema_extraction_step({ transport: get_transport(), input_data, type, signal });
  } catch (err) {
    console.warn("[parse_entity_profile] Structuring failed:", err);
    return null;
  }
}

/**
 * Executes the Turn 0 Fractal prologue and opening AI character turn.
 *
 * @param {string} story_id
 * @param {{ signal?: AbortSignal | null }} [options={}]
 * @returns {Promise<any>}
 */
export async function generate_opening(story_id, { signal = null } = {}) {
  if (!session || !story_id) return null;

  execution.set_loading(true);

  try {
    const user_quadrant = normalize_entity(session.active_user || app.selected_user || {});
    const fractal_quadrant = normalize_entity(session.active_fractal || app.selected_fractal || {});

    const live_transport = get_transport();
    const node_id = `prologue-${Date.now()}`;
    const fractal_name = fractal_quadrant?.name || "Fractal Entity";

    session.round = 0;
    session.turn_type = "SYSTEM_TURN";
    session.last_director_beat_round = 0;
    session.last_dynamics_beat_round = 0;

    await session.log_message("", "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      story_id,
      meta: { id: node_id, round: 0, is_prologue: true },
      attachments: [],
    });

    const prologue_prompt = compile_prompt({
      core: "CHARACTER",
      round: 0,
      entities: { AI: fractal_quadrant, USER: user_quadrant, FRACTAL: fractal_quadrant },
      task_options: { turn_tempo: 3 },
    });

    const raw_prologue = await live_transport.stream(prologue_prompt, { startWith: "<think>\n", signal });
    const { think: prologue_think, prose: prologue_body } = parse_think_block(raw_prologue);
    const prologue_text = (prologue_body || raw_prologue || "").trim();

    await session.edit_entry(node_id, prologue_text, { think: prologue_think });

    const prologue_image_requested_at = Date.now();
    await session.update_attachment(node_id, 0, { src: null, metadata: { mode: "story_scene", requested_at: prologue_image_requested_at } });

    let release_prologue_image = () => {};
    const prologue_image_gate = new Promise((resolve) => {
      release_prologue_image = resolve;
    });

    if (visual_engine) {
      (async () => {
        mark_generation_in_flight?.(node_id, 0);
        await prologue_image_gate;
        try {
          const img_result = await visual_engine.visualize(
            prologue_text,
            "story_scene",
            { silent: true, refine_prompt: refine_image_prompt },
            { app, session },
          );
          if (img_result?.image_url) {
            await session.update_attachment(node_id, 0, {
              src: img_result.image_url,
              metadata: {
                ...(img_result.metadata || {}),
                prompt: img_result.refined_prompt || img_result.metadata?.prompt,
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

    try {
      return await run_turn(prologue_text, { is_opening_turn: true, signal });
    } finally {
      release_prologue_image();
    }
  } catch (e) {
    console.error("Prologue Failed:", e);
    throw e;
  } finally {
    execution.set_loading(false);
    execution.end_stream();
    execution.complete();
  }
}

/**
 * Executes an Epilogue narrative beat for story conclusion.
 *
 * @param {string | number} story_id
 * @param {"CONCLUDED" | "COLLAPSED"} [conclusion_status="CONCLUDED"]
 * @returns {Promise<string | null>}
 */
export async function generate_closing(story_id, conclusion_status = "CONCLUDED") {
  const node_id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`;
  const fractal_quadrant = normalize_entity(session?.active_fractal || {});
  const ai_quadrant = normalize_entity(session?.active_ai || {});
  const user_quadrant = normalize_entity(session?.active_user || {});
  const fractal_name = fractal_quadrant?.name || "Fractal Entity";

  try {
    const prompt = compile_prompt({
      core: "CHARACTER",
      round: (Number(session?.round) || 1) + 1,
      entities: { FRACTAL: fractal_quadrant, AI: ai_quadrant, USER: user_quadrant },
      task_options: { speaker_role: "fractal", is_epilogue: true, conclusion_status },
    });

    const response = await get_transport().stream(prompt, { role: "fractal", node_id, silent: true });

    const fractal_style = typeof fractal_quadrant?.speaking_style === "string" ? fractal_quadrant.speaking_style : "casual";
    const cleaned_prose = clean_generated_prose(parse_think_block(response || "").prose, fractal_style);

    await session.log_message(cleaned_prose, "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      story_id,
      meta: { id: node_id, is_epilogue: true, conclusion_status, story_status: conclusion_status },
    });

    execution.lock();
    return cleaned_prose;
  } finally {
    execution.end_stream();
  }
}

/**
 * Creates a character or fractal entity, optionally structures raw prose via
 * Caretaker, persists to IndexedDB, and triggers portrait generation.
 *
 * @param {"character" | "fractal"} type
 * @param {Record<string, any>} [draft={}]
 * @param {Record<string, any>} [options={}]
 * @returns {Promise<any>}
 */
export async function create_entity_with_profile(type, draft = {}, options = {}) {
  const entity_type = type === "fractal" ? "fractal" : "character";
  const name = String(draft?.name || "").trim();
  const raw_color = String(draft?.signature_color || "").trim();
  const description = String(draft?.description || "").trim();
  const scene_context = String(draft?.scene_context || "").trim();

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
  entity.dynamics_baseline = { ...entity.dynamics };
  entity.is_wanderer = false;

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

      const rich_profile = await parse_entity_profile(synthesis_source, entity_type);
      if (rich_profile && typeof rich_profile === "object") {
        entity = apply_profile_to_entity(entity, rich_profile);
      }
    } catch (error) {
      console.warn(`[Lifecycle] Genesis synthesis failed for "${name}":`, error?.message || error);
    }
  } else if (draft && typeof draft === "object") {
    entity = apply_profile_to_entity(entity, draft);
  }

  if (name) entity.name = name;
  if (raw_color) entity.signature_color = raw_color;

  const saved_entity = await upsert_entity(entity);

  const story_id = options.story_id ?? session.active_id ?? null;
  if (entity_type === "character" && story_id && story_id !== "debug") {
    try {
      const story = await get_story(story_id);
      const existing_npcs = Array.isArray(story?.npc_ids) ? story.npc_ids : [];
      const updated_npcs = [...new Set([...existing_npcs, saved_entity.id])];
      if (updated_npcs.length !== existing_npcs.length) {
        await update_cast(story_id, updated_npcs);
      }
    } catch (err) {
      console.warn(`[Lifecycle] Failed to register NPC on story ${story_id}:`, err?.message || err);
    }
  }

  if (options.generate_portrait !== false && entity_type === "character") {
    if (typeof visual_engine?.generate === "function" && typeof window !== "undefined") {
      try {
        const portrait_promise = visual_engine
          .generate(saved_entity.id, { mode: "solo_entity", resolution: "512x512", _entity: saved_entity })
          .then(async (image_result) => {
            if (image_result && saved_entity.id) {
              const data_url = typeof image_result === "object" ? image_result.image_url : image_result;
              if (data_url) {
                await update_entity(saved_entity.id, { profile_picture: data_url });
                await session.update_entity?.("character", saved_entity.id, { profile_picture: data_url });
              }
            }
          });
        if (portrait_promise && typeof portrait_promise.catch === "function") {
          portrait_promise.catch((error) => console.warn(`[Lifecycle] Portrait generation for "${name}" failed:`, error?.message || error));
        }
      } catch {
        /* portrait failure must never break genesis */
      }
    }
  }

  return saved_entity;
}

/**
 * Drafts the user's next narrative action or dialogue (ghostwriting).
 * Reuses the Character core with inverted participants (AI: user, USER: ai),
 * streaming prose incrementally once `</think>` closes.
 *
 * @param {string} [input_text=""]
 * @param {{ transport?: object, signal?: AbortSignal | null, on_token?: ((chunk: string, is_full_replace: boolean) => void) | null, session?: object, app?: object, feed?: Array<any> }} [options={}]
 * @returns {Promise<string>}
 */
export async function generate_user_draft(
  input_text = "",
  { transport = get_transport(), signal = null, on_token = null, session: session_source = session, app: app_source = app, feed = session.feed } = {},
) {
  const user_quadrant = normalize_entity(session_source?.active_user || app_source?.selected_user || {});
  const ai_quadrant = normalize_entity(session_source?.active_ai || app_source?.selected_ai || {});
  const fractal_quadrant = normalize_entity(session_source?.active_fractal || app_source?.selected_fractal || {});

  const history = reconstruct_history_from_feed(feed || [], { user: user_quadrant, ai: ai_quadrant, fractal: fractal_quadrant });
  if (input_text && input_text.trim()) {
    history.push({ role: "user", text: input_text.trim() });
  }

  let full_accumulated = "";
  let emitted_len = 0;

  const outcome = await run_generation_step({
    transport,
    round: Number(session_source?.round || 1),
    entities: { AI: user_quadrant, USER: ai_quadrant, FRACTAL: fractal_quadrant },
    history,
    memories: [],
    directors_note: "",
    signal,
    onChunk: (chunk) => {
      full_accumulated += chunk;
      if (typeof on_token !== "function") return;
      const close_match = /<\/think\s*>/i.exec(full_accumulated);
      if (!close_match) {
        const opened =
          /<think[\s>]/i.test(full_accumulated) || full_accumulated.trimStart() === "<" || /<t(?:h(?:i(?:n(?:k)?)?)?)?$/i.test(full_accumulated.trimEnd());
        if (opened) return;
        const cleaned = full_accumulated.trimStart();
        const delta = cleaned.slice(emitted_len);
        if (delta) {
          on_token(delta, emitted_len === 0);
          emitted_len = cleaned.length;
        }
        return;
      }
      const cleaned = full_accumulated.slice(close_match.index + close_match[0].length).trimStart();
      const delta = cleaned.slice(emitted_len);
      if (delta) {
        on_token(delta, emitted_len === 0);
        emitted_len = cleaned.length;
      }
    },
  });

  return (outcome?.prose || "").trim();
}
