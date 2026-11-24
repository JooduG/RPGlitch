/**
 * @file src/engine/lifecycle.js
 * Non-turn story lifecycle jobs: visual prompt refinement, profile structuring,
 * prologue/epilogue beats, entity birth, and user draft ghostwriting.
 */

import {
  apply_profile_to_entity,
  create_entity,
  detect_card_format,
  get_story,
  normalize_entity,
  parse_character_card,
  update_cast,
  update_entity,
  upsert_entity,
} from "@data";
import { get_visual_style } from "@definitions";
import { clear_generation_in_flight, mark_generation_in_flight, visual_engine } from "@media";
import {
  clean_generated_prose,
  compile_prompt,
  extract_aesthetic_traits,
  get_resolution_string,
  parse_think_block,
  reconstruct_history_from_feed,
  render_optics_fallback,
  rescue_visual_prose,
  sanitize_visual_text,
} from "@simulation";
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

    const raw_prologue = await live_transport.stream(prologue_prompt, { role: "fractal", node_id, startWith: "<think>\n", signal });
    const { think: prologue_think, prose: prologue_body } = parse_think_block(raw_prologue);
    const prologue_text = (prologue_body || raw_prologue || "").trim();

    await session.edit_entry(node_id, prologue_text, { think: prologue_think });

    const prologue_image_id = `prologue-img-${Date.now()}`;
    const prologue_image_requested_at = Date.now();
    await session.log_message("", "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      story_id,
      meta: { id: prologue_image_id, round: 0, is_prologue_image: true },
      attachments: [{ src: null, metadata: { mode: "story_scene", requested_at: prologue_image_requested_at } }],
    });

    let release_prologue_image = () => {};
    const prologue_image_gate = new Promise((resolve) => {
      release_prologue_image = resolve;
    });

    if (visual_engine) {
      (async () => {
        mark_generation_in_flight?.(prologue_image_id, 0);
        await prologue_image_gate;
        try {
          const img_result = await visual_engine.visualize(
            prologue_text,
            "story_scene",
            { silent: true, refine_prompt: refine_image_prompt },
            { app, session },
          );
          if (img_result?.image_url && session.active_id === story_id) {
            await session.update_attachment(prologue_image_id, 0, {
              src: img_result.image_url,
              metadata: {
                ...(img_result.metadata || {}),
                prompt: img_result.refined_prompt || img_result.metadata?.prompt,
                mode: "story_scene",
                requested_at: prologue_image_requested_at,
              },
            });
          } else if (!img_result?.image_url && session.active_id === story_id) {
            await session.update_attachment(prologue_image_id, 0, {
              src: null,
              metadata: { mode: "story_scene", requested_at: prologue_image_requested_at, failed: true, error: "Image generation returned no image" },
            });
          }
        } catch (img_err) {
          console.warn("[Prologue Image Error]", img_err);
          if (session.active_id === story_id) {
            await session.update_attachment(prologue_image_id, 0, {
              src: null,
              metadata: {
                mode: "story_scene",
                requested_at: prologue_image_requested_at,
                failed: true,
                error: img_err?.message || "Prologue image generation failed",
              },
            });
          }
        } finally {
          clear_generation_in_flight?.(prologue_image_id, 0);
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

    if (cleaned_prose && cleaned_prose.trim()) {
      await session.log_message(cleaned_prose, "fractal", fractal_name, {
        turn_type: "SYSTEM_TURN",
        story_id,
        meta: { id: node_id, is_epilogue: true, conclusion_status, story_status: conclusion_status },
      });
    }

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
  // Backstop: the sorter must never wipe an explicitly provided description.
  // Only fills when the profile step left it empty, so enriched sorter
  // output is never clobbered with the raw draft text.
  if (description && !entity.description) entity.description = description;
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

/**
 * Triggers draft ghostwriting directly into interface store composer_draft.
 * @returns {Promise<string>}
 */
export async function ghostwrite_user_draft() {
  if (execution.busy) return "";
  const draft = await generate_user_draft(app.composer_draft);
  if (draft) {
    app.composer_draft = draft;
  }
  return draft;
}

/**
 * Unified story-image capture helper across solo entities and group scene shots.
 *
 * @param {Object} options
 * @param {"ai" | "user" | "fractal" | "npc"} [options.subject="ai"]
 * @param {string} [options.prompt=""]
 * @param {string} [options.kind]
 * @param {any} [options.target_entity=null]
 * @param {boolean} [options.background=false]
 * @returns {Promise<any>}
 */
export async function capture_story_image({ subject = "ai", prompt = "", kind = "", target_entity = null, background = false } = {}) {
  if (execution.busy && !background) return null;

  const story_id = session.active_id;
  if (!story_id) return null;

  const entity_map = {
    ai: session.active_ai || app.selected_ai,
    user: session.active_user || app.selected_user,
    fractal: session.active_fractal || app.selected_fractal,
  };
  const label_map = { ai: "AI", user: "User", fractal: "Fractal", npc: "NPC" };
  const turn_map = { ai: "AI_TURN", user: "USER_TURN", fractal: "SYSTEM_TURN", npc: "AI_TURN" };

  const entity = target_entity || entity_map[subject];
  const role_label = entity?.name || label_map[subject] || subject;
  const turn_type = turn_map[subject] || "AI_TURN";
  const target_mode = kind || (subject === "fractal" ? "story_scene" : "story_character");

  let placeholder_entry = null;
  const attach_idx = 0;

  // Owns an AbortController so Interrupt/Unstick can cancel BOTH legs below
  // (the visualizer LLM refine + the diffusion dispatch). Stored on the shared
  // execution stream, which is what interrupt()/recover() abort.
  const controller = new AbortController();
  const signal = controller.signal;
  let owned_controller = false;
  let refined_prompt = prompt;

  try {
    if (!background) {
      execution.role = subject;
      execution.start_generation(subject);
      execution.start_media_stage({
        type: subject,
        name: role_label,
        avatar: entity?.profile_picture || entity?.avatar || null,
        color: entity?.signature_color || entity?.color || null,
      });
      execution.stream.abort_controller = controller;
      owned_controller = true;
    }

    // The context-menu picture items must hit BOTH the visualizer LLM and the
    // image engine. The menu passes no prompt for solo portraits, so derive an
    // envision draft from the entity itself instead of skipping the LLM leg.
    let envision_source = prompt;
    if (!envision_source || !envision_source.trim()) {
      try {
        const traits = extract_aesthetic_traits(entity || {});
        envision_source = (traits && traits.trim()) || entity?.description || entity?.name || "";
      } catch {
        envision_source = entity?.description || entity?.name || "";
      }
    }

    // Show the "image is generating" visual RIGHT AWAY, before the (slow)
    // visualizer LLM leg runs. The placeholder row renders a Shimmer while
    // src is null, so creating it first covers both the prompt-refinement
    // phase and the diffusion phase with a visible busy state.
    const requested_at = Date.now();
    placeholder_entry = await session.log_message("", subject, role_label, {
      turn_type,
      story_id,
      attachments: [{ src: null, metadata: { mode: target_mode, prompt: envision_source || prompt, requested_at } }],
    });
    if (placeholder_entry?.id) mark_generation_in_flight?.(placeholder_entry.id, attach_idx);

    let enhanced_negative = "";
    try {
      const configured_style = app.settings?.visual_style;
      const story_style = session.active_fractal?.visual_style;
      const app_style = configured_style && configured_style !== "none" && configured_style !== "default" ? configured_style : story_style || null;
      const enhanced = await refine_image_prompt(envision_source, subject, entity, app_style, signal);
      if (enhanced?.prompt) refined_prompt = enhanced.prompt;
      if (enhanced?.negative_prompt) enhanced_negative = enhanced.negative_prompt;
    } catch (envision_err) {
      console.warn("[capture_story_image] Envision failed, falling back to draft prompt:", envision_err);
    }

    if (!refined_prompt && !prompt) {
      refined_prompt = render_optics_fallback({
        tier: target_mode,
        subject,
        ai: session.active_ai,
        user: session.active_user,
        fractal: session.active_fractal,
      });
    }

    // Keep the placeholder metadata honest once the LLM leg settles, so the
    // Shimmer row already shows the refined prompt before diffusion starts.
    if (placeholder_entry?.id && refined_prompt && refined_prompt !== (envision_source || prompt)) {
      try {
        await session.update_attachment(placeholder_entry.id, attach_idx, { src: null, metadata: { mode: target_mode, prompt: refined_prompt, requested_at } });
      } catch {
        /* placeholder metadata sync is best-effort; diffusion still proceeds */
      }
    }

    const result = await visual_engine.visualize(
      refined_prompt,
      target_mode,
      { subject, entity, negative_prompt: enhanced_negative, signal },
      { app, session },
    );

    if (session.active_id === story_id && placeholder_entry?.id) {
      if (result?.image_url) {
        await session.update_attachment(placeholder_entry.id, attach_idx, {
          src: result.image_url,
          metadata: { mode: target_mode, ...(result.metadata || {}), prompt: result.refined_prompt || refined_prompt },
        });
      } else {
        await session.update_attachment(placeholder_entry.id, attach_idx, {
          src: null,
          metadata: { mode: target_mode, prompt: refined_prompt, failed: true, error: "Image generation returned no image" },
        });
      }
    }
    return result;
  } catch (err) {
    const aborted = signal?.aborted || err?.name === "AbortError" || String(err?.message || "").includes("aborted");
    if (aborted) {
      console.warn(`[capture_story_image: ${subject}] Interrupted by user.`);
    } else {
      console.error(`[capture_story_image: ${subject}]`, err);
    }
    if (session.active_id === story_id && placeholder_entry?.id) {
      await session.update_attachment(placeholder_entry.id, attach_idx, {
        src: null,
        metadata: {
          mode: target_mode,
          prompt: refined_prompt || prompt,
          failed: true,
          error: aborted ? "Interrupted by user." : err?.message || "Image generation failed",
        },
      });
    }
    if (aborted) {
      const abort_err = new Error("Image capture aborted by user.");
      abort_err.name = "AbortError";
      throw abort_err;
    }
    throw err;
  } finally {
    if (placeholder_entry?.id) clear_generation_in_flight?.(placeholder_entry.id, attach_idx);
    if (owned_controller && execution.stream.abort_controller === controller) {
      execution.stream.abort_controller = null;
    }
    if (!background) {
      execution.complete();
    }
  }
}

/**
 * Generates image candidates using visual engine and prompt recovery helpers.
 *
 * @param {string} prompt
 * @param {Object} [options={}]
 * @returns {Promise<Array<any>>}
 */
export async function generate_image_candidates(prompt, options = {}) {
  const { mode = "story_character", negative_prompt = "", count = 3, min_success = 2 } = options;
  let final_prompt = rescue_visual_prose(prompt) || prompt;
  let final_negative = negative_prompt;

  if (final_prompt.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(final_prompt.trim());
      if (parsed.prompt && typeof parsed.prompt === "string") {
        final_prompt = parsed.prompt;
        if (parsed.negative_prompt) final_negative = parsed.negative_prompt;
      }
    } catch {
      /* Prose or partial JSON falls through */
    }
  }

  final_prompt = sanitize_visual_text(final_prompt);
  final_negative = sanitize_visual_text(final_negative);

  return await visual_engine.generate_candidates(final_prompt, { mode, negative_prompt: final_negative, count, min_success });
}

/**
 * Imports entities from native JSON, character card formats, or raw text descriptions.
 *
 * @param {string} raw_text
 * @param {Object} options
 * @param {boolean} [options.import_character=true]
 * @param {boolean} [options.import_fractal=false]
 * @param {string | null} [options.image_data=null]
 * @returns {Promise<{ character: any | null, fractal: any | null }>} the created entities (null per skipped target)
 */
export async function import_entities(raw_text, options = {}) {
  const { import_character = true, import_fractal = false, image_data = null } = options;
  if (!raw_text || !raw_text.trim()) {
    throw new Error("Please provide raw text to import.");
  }
  if (!import_character && !import_fractal) {
    throw new Error("Please select at least one target to import (Character or Fractal).");
  }

  let parsed = null;
  try {
    parsed = JSON.parse(raw_text);
  } catch {
    /* Prose falls through */
  }

  const format = parsed && typeof parsed === "object" ? detect_card_format(parsed) : "unknown";
  const is_structured = format !== "unknown";

  const targets = [];
  if (import_character) targets.push("character");
  if (import_fractal) targets.push("fractal");

  const created = { character: null, fractal: null };
  for (const type of targets) {
    if (is_structured) {
      if (format === "rpglitch") {
        const merged = { ...parsed };
        if (image_data) merged.profile_picture = image_data;
        created[type] = await create_entity_with_profile(type, merged, { run_sorter: false, generate_portrait: false });
      } else {
        const flat = parse_character_card(parsed);
        if (image_data) flat.profile_picture = image_data;
        created[type] = await create_entity_with_profile(type, flat, { generate_portrait: !image_data });
      }
    } else {
      const draft = { description: raw_text };
      if (image_data) draft.profile_picture = image_data;
      created[type] = await create_entity_with_profile(type, draft, { run_sorter: true, generate_portrait: !image_data });
    }
  }

  await app.load_entities();
  return created;
}

/**
 * Dev-mode mock turn runner.
 * @param {string} role
 * @returns {Promise<void>}
 */
export async function run_mock(role) {
  if (execution.busy) return;
  execution.role = role;
  execution.start_generation(role);
  try {
    const node_id = `mock-${Date.now()}`;
    await get_transport().stream("", { role, node_id, is_mock: true });
  } finally {
    execution.complete();
  }
}
