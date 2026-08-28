/**
 * src/intelligence/story-pipeline.js
 * 🎬 STORY PIPELINE — Intelligence Kernel Turn Coordinator
 *
 * Unifies the Intelligence Kernel (Context Broker, Dynamics, Prompt Builder) and the
 * Transport Layer (llm_service) into a single execution pipeline for simulation turns:
 * 1. Pipeline Constants & Auxiliary Queues
 * 2. Narrative Turn Orchestration (execute_turn)
 * 3. Story Lifecycles (execute_prologue, execute_epilogue)
 * 4. Persona Ghostwriter (execute_ghostwriter)
 * 5. Network Retry & Resilience (execute_with_retry)
 */

import { db, entities, stories, detox_prose } from "@data";
import { generate_uuid, create_job_queue, state_bridge, strip_cognition_blocks } from "@utils";
import { visual_engine, resolve_image_trigger, spawn_image_beat, sweep_stale_ghosts, IMAGE_RESOLVE_TIMEOUT_MS } from "@media";
import { validate_and_repair_response, force_close_response } from "./parser.js";
import { llm_service, looks_truncated, raw_to_text, raw_stop_reason } from "@platform";
import { physics_engine } from "./physics.js";
import { normalize_director_data, parse_director_json, synthesize_director_fallback, resolve_npc_entity, apply_in_scene_change } from "./director.js";
import { render_terse_director_task } from "./prompts/director-prompts.js";
import { prompt_builder } from "./prompts/builder.js";
import { capture_dynamics_delta } from "./telemetry.js";
import { prune, temporal_engine } from "./temporal-pipeline.js";
import { context_builder } from "./payload.js";
import { spawn_character } from "./profile-pipeline.js";

/**
 * @typedef {Object} GenerationOptions
 * @property {string} [input] - User input that triggered the turn.
 * @property {string} [role] - Role label for the generation phase (ai/fractal/...).
 * @property {AbortSignal} [signal] - Abort signal for streaming/background work.
 * @property {boolean} [is_retry] - Whether this is a regeneration retry.
 * @property {boolean} [is_continue] - Whether this is a continue-in-place turn.
 * @property {boolean} [is_opening_turn] - Whether this is the first turn right after prologue.
 */

// ── 1. Pipeline Constants & Auxiliary Queues ──────────────────────────────────

/** Background queue for non-blocking post-turn tasks (consolidation, ghost sweeps). */
const director_background_queue = create_job_queue({ max_concurrency: 2 });

/** Completion directive appended to prompt when reply was cut off by token limit. */
const TRUNCATION_COMPLETE_NOTE =
  "\n\nIMPORTANT: Your previous reply was cut off mid-sentence. Finish this response IMMEDIATELY: do not repeat any earlier text, do not rehash events, just bring the current moment to a natural close with a complete sentence, then stop.";

/** Minimum narrative prose length before missing punctuation is treated as cut-off. */
const TRUNCATION_MIN_PROSE = 40;

// ── 2. Narrative Turn Orchestration ───────────────────────────────────────────

export const gamemaster = {
  /**
   * Epilogue presence check.
   * @param {string} story_id
   * @returns {Promise<boolean>}
   */
  async _has_epilogue(story_id) {
    try {
      const entries = await state_bridge.session_driver.load_log(story_id);
      return entries.some((e) => e?.meta?.is_epilogue === true);
    } catch (_err) {
      return false;
    }
  },

  /**
   * EXECUTE TURN
   * The primary simulation loop for a narrative turn:
   * Shot 1: Director Evaluation & Scene Choreography
   * Shot 2: Storyteller (Character / NPC / Scene Narrator) Generation
   *
   * @param {string} story_id
   * @param {GenerationOptions} [options={}]
   * @returns {Promise<{ response: string, meta: any }>}
   */
  async execute_turn(story_id, options = {}) {
    const { input = "", role: _role = "ai", ...llm_options } = options;
    state_bridge.app.busy = true;

    try {
      state_bridge.simulation_state?.start_generation?.("system");
      state_bridge.simulation_state?.set_generating_entity?.({
        type: "system",
        name: "Director",
        avatar: null,
        color: "var(--color-frozen)",
      });
      state_bridge.runtime.story_id = story_id;
      const node_id = generate_uuid();

      // 1. CHRONO: Round management
      temporal_engine.ensure_momentum(state_bridge.runtime, state_bridge.app);
      state_bridge.runtime.turn_type = "SYSTEM_TURN";
      temporal_engine.set_round(state_bridge.runtime.round);

      // 2. HYDRATION: Fetch history and hydrate context
      const raw_messages = await state_bridge.session_driver.load_log(story_id);
      const simulation_log = raw_messages
        .filter((m) => !m.meta?.consolidated && m.role !== "system")
        .map((m) => ({
          role: m.role === "user" ? "user" : m.role === "fractal" ? "fractal" : "model",
          content: m.text || m.content || "",
          character_name: m.character_name,
        }));

      if (input && simulation_log.length > 0) {
        const last = simulation_log[simulation_log.length - 1];
        if (last.role === "user" && last.content.trim() === input.trim()) {
          simulation_log.pop();
        }
      }

      const payload = await context_builder.build_context(input || "", "simulation", simulation_log);
      payload.meta = payload.meta || {};
      payload.meta.structural_errors = state_bridge.runtime.structural_errors || 0;

      const scoring_context = prompt_builder.build_scoring_context(input, simulation_log);
      if (scoring_context) {
        await Promise.race([temporal_engine.precompute_context_embedding(scoring_context), new Promise((resolve) => setTimeout(resolve, 1500))]);
      }

      // 3. SIMULATION: Evaluate world physics snapshot prior to generation
      const prev_dynamics = {
        ai: { ...(state_bridge.runtime.ai || {}) },
        fractal: { ...(state_bridge.runtime.fractal || {}) },
      };

      const snapshot = {
        ai: { dynamics: { ...(state_bridge.runtime.ai || {}) } },
        fractal: { dynamics: { ...(state_bridge.runtime.fractal || {}) } },
        flags: [],
      };

      /** @type {Set<string>} */
      const ai_delta_axes = new Set();
      /** @type {Set<string>} */
      const fractal_delta_axes = new Set();

      snapshot.pruned_vectors = {
        AI: prune(payload.entities.AI?.memories),
        USER: prune(payload.entities.USER?.memories),
        FRACTAL: prune(payload.entities.FRACTAL?.memories),
      };

      // 4. DIRECTOR PASS (Shot 1)
      state_bridge.app.log("[GameMaster] Context hydrated. Physics resolved. Entering DIRECTOR_TURN...", "system");
      const director_prompt = prompt_builder.build_director(payload, snapshot);

      const director_call = async (terse = false) => {
        return await this.execute_with_retry(
          async () => {
            return await llm_service.generate(
              {
                system: director_prompt.system,
                task: terse ? render_terse_director_task() : director_prompt.task,
                messages: [],
                role: "system",
                node_id: `${node_id}-director`,
              },
              {
                ...llm_options,
                json: true,
                silent: true,
                raw: true,
                onToken: null,
              },
            );
          },
          2,
          1000,
        );
      };

      const director_start_time = performance.now();
      const director_raw = await director_call(false);
      let director_text = raw_to_text(director_raw);
      let director_data = parse_director_json(director_text) || {};

      // Truncation recovery
      if (director_data._parse_error) {
        const reason = raw_stop_reason(director_raw);
        state_bridge.app.log(`[GameMaster] Director JSON truncated${reason ? ` (${reason})` : ""} — retrying with terse directive...`, "warn");
        const terse_raw = await director_call(true);
        const terse_text = raw_to_text(terse_raw);
        const retry_data = parse_director_json(terse_text) || {};
        if (!retry_data._parse_error) {
          if (!retry_data._thought_process && director_data?._thought_process) {
            retry_data._thought_process = director_data._thought_process;
          }
          if (!retry_data._thought_process) {
            retry_data._thought_process = "High tension turn evaluation completed.";
          }
          director_data = retry_data;
        }
      }

      const director_duration_ms = Math.round(performance.now() - director_start_time);
      if (typeof state_bridge.runtime?.record_director_latency === "function") {
        state_bridge.runtime.record_director_latency(director_duration_ms);
      }

      if (!director_data || director_data._parse_error) {
        state_bridge.app.log("[GameMaster] Director degraded — applying minimal-mutation fallback.", "warn");
        director_data = synthesize_director_fallback(director_data, input, state_bridge);
      }
      director_data = normalize_director_data(director_data);

      // 3.5. STAGE SPOTLIGHT
      await apply_in_scene_change(state_bridge, director_data.in_scene_change);

      // 3.6. GENESIS DISPATCH
      let genesis_spawned_npc = null;
      if (director_data.next_action === "GENESIS") {
        state_bridge.app.log("[GameMaster] ✨ Genesis triggered by Director Quick Shot. Synthesizing new character...", "system");
        try {
          const scene_context = [
            state_bridge.runtime?.active_fractal?.name ? `Setting: ${state_bridge.runtime.active_fractal.name}` : "",
            state_bridge.runtime?.active_fractal?.present?.physical || "",
            state_bridge.runtime?.active_fractal?.present?.non_physical || "",
          ]
            .filter(Boolean)
            .join(" — ");

          const genesis_name = director_data._thought_process
            ? director_data._thought_process
                .slice(0, 30)
                .replace(/[^a-zA-Z0-9 ]/g, "")
                .trim() || "Stranger"
            : "Stranger";

          const parsed_genesis = typeof director_data.genesis === "object" ? director_data.genesis : null;

          genesis_spawned_npc = await spawn_character(state_bridge, {
            name: parsed_genesis?.name || genesis_name,
            description: parsed_genesis?.description || director_data.directors_note || "A mysterious figure appearing in the scene.",
            signature_color: parsed_genesis?.signature_color || "",
            voice_register: parsed_genesis?.voice_register || "",
            scene_context,
          });
        } catch (err) {
          state_bridge.app.log(`[GameMaster] Genesis synthesis error: ${err?.message || err}`, "warn");
        }
      }

      // 4.1 Apply Dynamics Deltas
      if (director_data.dynamics_deltas && state_bridge.runtime.active_ai) {
        if (!snapshot.ai) snapshot.ai = {};
        if (!snapshot.ai.dynamics) snapshot.ai.dynamics = { ...state_bridge.runtime.ai };
        Object.entries(director_data.dynamics_deltas).forEach(([k, delta]) => {
          const val = Number(delta);
          if (!isNaN(val)) {
            ai_delta_axes.add(k);
            const current = snapshot.ai.dynamics[k] || 50;
            snapshot.ai.dynamics[k] = Math.max(1, Math.min(100, current + val));
          }
        });
      }

      // 4.2. GRAVITY SETTLEMENT
      physics_engine.apply_dynamics_gravity(
        snapshot.ai.dynamics,
        physics_engine.extract_entity_dynamics_baselines(payload.entities.AI),
        snapshot.fractal.dynamics?.entropy || 50,
        0.1,
        ai_delta_axes,
      );
      physics_engine.apply_dynamics_gravity(
        snapshot.fractal.dynamics,
        physics_engine.extract_entity_dynamics_baselines(payload.entities.FRACTAL),
        snapshot.fractal.dynamics?.entropy || 50,
        0.1,
        fractal_delta_axes,
      );

      // 4.4. ACTIVE SPEAKER RESOLUTION
      const current_turn_round = state_bridge.runtime.round || 0;
      let target_action = director_data.next_action || "AI_CHARACTER";
      if (current_turn_round <= 1 && target_action === "FRACTAL") {
        target_action = "AI_CHARACTER";
      }

      let npc_entity = null;
      let is_using_narrator_engine = false;

      if (target_action === "GENESIS" && genesis_spawned_npc) {
        npc_entity = genesis_spawned_npc;
      } else if (target_action === "FRACTAL") {
        is_using_narrator_engine = true;
      } else if (target_action.startsWith("npc")) {
        const npc_id = director_data.npc_id || target_action.replace(/^npc:/i, "");
        npc_entity = resolve_npc_entity(state_bridge, npc_id);
        if (!npc_entity) {
          state_bridge.app.log(`[GameMaster] Director delegated to "${target_action}" but NPC not found — falling back to AI character.`, "warn");
        }
      }

      const generation_role = is_using_narrator_engine ? "fractal" : "ai";
      const generation_entity = npc_entity || (is_using_narrator_engine ? state_bridge.runtime.active_fractal : state_bridge.runtime.active_ai);
      const generation_name = generation_entity?.name || (npc_entity ? "NPC" : is_using_narrator_engine ? "Fractal" : "AI");
      state_bridge.runtime.streaming_entity_id = npc_entity ? npc_entity.id : null;
      state_bridge.simulation_state?.start_generation?.(generation_role);
      state_bridge.simulation_state?.set_generating_entity?.({
        type: npc_entity ? "npc" : is_using_narrator_engine ? "fractal" : "ai",
        name: generation_name,
        avatar: generation_entity?.profile_picture || null,
        color: generation_entity?.signature_color || null,
      });

      // 4.5. PHYSICS SYNC & TELEMETRY
      const character_prompt = is_using_narrator_engine
        ? prompt_builder.build_scene_narrator(payload, snapshot, director_data)
        : npc_entity
          ? prompt_builder.build_npc(payload, npc_entity, snapshot, director_data)
          : prompt_builder.build_character(payload, snapshot, director_data);
      const meta = character_prompt.meta;

      let final_meta = { ...meta };
      final_meta.ai = snapshot.ai?.dynamics;
      final_meta.fractal = snapshot.fractal?.dynamics;
      final_meta.mutations = director_data.dynamics_deltas || {};

      const clean_think = (t) =>
        String(t || "")
          .replace(/<\/?think>/gi, "")
          .trim();
      const think_sections = [];
      if (director_data.internal_monologue) think_sections.push(`**Cognition:** ${clean_think(director_data.internal_monologue)}`);
      if (director_data.intent) think_sections.push(`**Intent:** ${clean_think(director_data.intent)}`);
      if (director_data.somatic_tells) think_sections.push(`**Somatic Tells:** ${clean_think(director_data.somatic_tells)}`);
      if (director_data.dialogue_direction) think_sections.push(`**Dialogue Direction:** ${clean_think(director_data.dialogue_direction)}`);
      if (director_data._thought_process) think_sections.push(clean_think(director_data._thought_process));
      const think_content = think_sections.join("\n\n");
      if (think_content) final_meta.thoughts = think_content;

      // 4.6 IMAGE TRIGGER ENGINE
      const turn_round = state_bridge.runtime.round || 0;
      const last_director_beat_round = state_bridge.runtime.last_director_beat_round ?? -1;
      const last_dynamics_beat_round = state_bridge.runtime.last_dynamics_beat_round ?? -1;
      const resolved_image = resolve_image_trigger({
        snapshot,
        prev_dynamics,
        director_data,
        turn_round,
        last_director_beat_round,
        last_dynamics_beat_round,
      });

      if (resolved_image.next_director_round !== null) {
        state_bridge.runtime.last_director_beat_round = resolved_image.next_director_round;
      }
      if (resolved_image.next_dynamics_round !== null) {
        state_bridge.runtime.last_dynamics_beat_round = resolved_image.next_dynamics_round;
      }

      final_meta.trigger_image = resolved_image.active;
      final_meta.image_trigger = resolved_image.active;
      final_meta.image_tier = resolved_image.tier;
      if (resolved_image.active) {
        final_meta.image_source = resolved_image.source;
        final_meta.image_signals = resolved_image.signals;
      }

      const is_image_trigger_active = resolved_image.active;
      const image_tier = resolved_image.tier;

      if (is_image_trigger_active && image_tier) {
        let trigger_prompt = [input, clean_think(director_data._thought_process), clean_think(director_data.directive)]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (!trigger_prompt) {
          const last_beat = [...simulation_log].reverse().find((m) => m.role === "fractal" || m.role === "model");
          if (last_beat?.content) {
            trigger_prompt = strip_cognition_blocks(last_beat.content).slice(0, 700);
          }
        }
        await spawn_image_beat(image_tier, {
          explicit: resolved_image.director_explicit,
          source: final_meta.image_source,
          prompt: trigger_prompt,
        });
      }

      await capture_dynamics_delta(state_bridge, snapshot, final_meta);

      state_bridge.runtime.ai = snapshot.ai?.dynamics;
      state_bridge.runtime.fractal = snapshot.fractal?.dynamics;

      // 5. TRANSITION & LOGGING
      state_bridge.app.log("[GameMaster] Routing to LLM (Character Pass)...", "system");
      state_bridge.runtime.turn_type = "AI_TURN";

      const director_monologue = think_content ? `<think>\n${think_content}\n</think>\n\n` : "";

      if (director_monologue) {
        state_bridge.app.start_stream(node_id, generation_role);
        state_bridge.app.update_stream(director_monologue);
        if (typeof llm_options.onToken === "function") {
          llm_options.onToken(director_monologue);
        }
      }

      // 6. GENERATION: Character pass with completion retry
      const make_character_try = async (completion_note) => {
        const { onToken, json, signal, silent, raw } = llm_options;

        const task = completion_note ? character_prompt.task + completion_note : character_prompt.task;
        const generated_text = await llm_service.generate(
          {
            system: character_prompt.system,
            task,
            messages: simulation_log,
            role: generation_role,
            node_id: node_id,
          },
          {
            onToken,
            json,
            signal,
            silent,
            raw,
          },
        );

        const full_text = (director_monologue || "") + (generated_text || "");

        const v_result = validate_and_repair_response(full_text);
        if (v_result.is_refused) {
          state_bridge.app.streaming.content = "";
          throw new Error("AI_REFUSAL_DETECTED");
        }
        return v_result;
      };

      let validation_result = await this.execute_with_retry(() => make_character_try(null), 2, 1000);

      if (looks_truncated(validation_result.text)) {
        const prose_only = String(validation_result.text)
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .replace(/<\/?think>/gi, "")
          .trim();
        if (prose_only && prose_only.length >= TRUNCATION_MIN_PROSE) {
          state_bridge.app.log("[GameMaster] Reply truncated — regenerating with completion directive...", "warn");
          state_bridge.app.streaming.content = director_monologue || "";
          validation_result = await this.execute_with_retry(() => make_character_try(TRUNCATION_COMPLETE_NOTE), 1, 500);
          if (looks_truncated(validation_result.text)) {
            validation_result.text = force_close_response(validation_result.text, generation_name);
            validation_result.has_structural_repair = true;
          }
        }
      }

      // 6.5. POST-GENERATION PIPELINE
      if (validation_result.has_structural_repair) {
        state_bridge.runtime.structural_errors = (state_bridge.runtime.structural_errors || 0) + 1;
      } else {
        state_bridge.runtime.structural_errors = Math.max(0, (state_bridge.runtime.structural_errors || 0) - 1);
      }

      // 7. PERSISTENCE: Save the result
      const character_name = generation_name;
      const log_role = npc_entity ? "npc" : generation_role;

      final_meta.structural_errors = state_bridge.runtime.structural_errors;

      const persisted_text = detox_prose(validation_result.text, "plain");

      await state_bridge.session_driver.log_message(persisted_text, log_role, character_name, {
        turn_type: "AI_TURN",
        story_id,
        meta: {
          id: node_id,
          round: state_bridge.runtime.round,
          speaker_type: npc_entity ? "npc" : undefined,
          entity_id: npc_entity ? npc_entity.id : undefined,
        },
      });

      // 8. TRANSITION: Open the window for User
      state_bridge.runtime.turn_type = "USER_TURN";

      state_bridge.app.end_stream();
      state_bridge.simulation_state.complete();
      state_bridge.simulation_state?.clear_generating_entity?.();

      state_bridge.app.busy = false;
      state_bridge.simulation_state.phase = "idle";

      // 8.5a. CONSOLIDATION
      const resolved_status = director_data?.story_status;
      const forge_round = state_bridge.runtime.round;
      director_background_queue
        .run(
          async () => {
            if (state_bridge.runtime.round !== forge_round) return { skipped: true };
            await temporal_engine.consolidate(state_bridge.session_driver, db, entities, state_bridge.runtime, state_bridge.app, {
              skip_forge: resolved_status === "CONCLUDED" || resolved_status === "COLLAPSED",
            });
            return { skipped: false };
          },
          { latest: true },
        )
        .catch((err) => {
          state_bridge.app?.log(`[GameMaster] Background consolidation failed: ${err?.message || err}`, "error");
        });

      // 8.5. AUTO-DISPATCH EPILOGUE
      const story_status = resolved_status;
      if (story_status === "CONCLUDED" || story_status === "COLLAPSED") {
        try {
          if (!(await this._has_epilogue(story_id))) {
            state_bridge.app.log(`[GameMaster] Director marked the story ${story_status} — auto-dispatching epilogue.`, "system");
            await this.execute_epilogue(story_id, story_status);
            await stories.conclude(story_id);
          }
        } catch (err) {
          state_bridge.app.log(`[GameMaster] Auto-epilogue failed: ${err.message || err}`, "error");
        }
      }
      return { response: persisted_text, meta: final_meta };
    } finally {
      state_bridge.app.busy = false;
      state_bridge.app.end_stream();
      if (state_bridge.simulation_state) {
        state_bridge.simulation_state.phase = "idle";
      }
      director_background_queue.run(() => sweep_stale_ghosts()).catch(() => {});
    }
  },

  // ── 3. Story Lifecycles ─────────────────────────────────────────────────────

  /**
   * EXECUTE PROLOGUE
   * Specialized turn for starting a new story.
   * @param {string} story_id
   * @returns {Promise<any>}
   */
  async execute_prologue(story_id) {
    state_bridge.app.busy = true;
    try {
      const prologue_input = state_bridge.app.prologue || "";
      const payload = await context_builder.build_context(prologue_input, "prologue");

      await Promise.race([temporal_engine.precompute_context_embedding(prologue_input), new Promise((resolve) => setTimeout(resolve, 1500))]);
      const result = prompt_builder.build_prologue(payload, {});
      if (!result.system) return null;

      state_bridge.app.log("[GameMaster] Generating prologue...", "system");
      const node_id = generate_uuid();
      const fractal_name = state_bridge.runtime.active_fractal?.name || "Fractal Entity";

      state_bridge.runtime.round = 0;
      state_bridge.runtime.turn_type = "SYSTEM_TURN";
      state_bridge.runtime.last_director_beat_round = 0;
      state_bridge.runtime.last_dynamics_beat_round = 0;

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

      const response = await this.execute_with_retry(async () => {
        const text = await llm_service.generate({
          system: result.system,
          task: result.task,
          role: "fractal",
          node_id: node_id,
        });
        if (!text || !strip_cognition_blocks(text).trim()) {
          throw new Error("EMPTY_PROLOGUE_PROSE");
        }
        return text;
      });

      await state_bridge.session_driver.edit_log_entry(node_id, response);
      state_bridge.app.log("[GameMaster] Prologue established (Round 0).", "system");

      state_bridge.app.end_stream();

      await state_bridge.session_driver.update_log_attachment(node_id, 0, { src: null, metadata: { mode: "story_entities" } });

      const image_promise = visual_engine
        ? Promise.race([
            visual_engine
              .visualize(story_id, strip_cognition_blocks(response), "story_entities", { silent: true })
              .then((img_result) => {
                if (img_result?.imageUrl) {
                  state_bridge.session_driver.update_log_attachment(node_id, 0, {
                    src: img_result.imageUrl,
                    metadata: {
                      ...(img_result.metadata || {}),
                      prompt: img_result.refinedPrompt || img_result.metadata?.prompt,
                      mode: "story_entities",
                    },
                  });
                }
              })
              .catch((err) => {
                console.warn("[Prologue Image Error]", err);
              }),
            new Promise((resolve) =>
              setTimeout(async () => {
                try {
                  const key = isNaN(Number(node_id)) ? node_id : Number(node_id);
                  const entry = await db.simulation_log.get(key);
                  const att = entry?.attachments?.[0];
                  if (att && att.src == null) {
                    await state_bridge.session_driver.update_log_attachment(node_id, 0, {
                      src: null,
                      metadata: { ...(att.metadata || {}), failed: true, image_ghost_swept: true, error: "Prologue image timed out." },
                    });
                  }
                } catch (_err) {
                  /* guard must never break prologue */
                }
                resolve();
              }, IMAGE_RESOLVE_TIMEOUT_MS),
            ),
          ])
        : Promise.resolve();

      state_bridge.app.streaming.active = true;
      state_bridge.app.streaming.content = "";
      state_bridge.app.streaming.node_id = null;
      state_bridge.app.streaming.role = "ai";

      const turn_promise = this.execute_turn(story_id, { role: "ai", is_opening_turn: true });

      await Promise.all([image_promise, turn_promise]);
      return await turn_promise;
    } finally {
      state_bridge.app.busy = false;
      state_bridge.app.end_stream();
      if (typeof state_bridge.simulation_state !== "undefined") {
        state_bridge.simulation_state.phase = "idle";
      }
    }
  },

  /**
   * EXECUTE EPILOGUE
   * Final summary or conclusion for a story.
   * @param {string} story_id
   * @param {"CONCLUDED" | "COLLAPSED" | string} [conclusion_status="CONCLUDED"]
   * @returns {Promise<string | null>}
   */
  async execute_epilogue(story_id, conclusion_status = "CONCLUDED") {
    if (await this._has_epilogue(story_id)) {
      state_bridge.app.log("[GameMaster] Epilogue already present — skipping duplicate dispatch.", "system");
      return null;
    }
    const clean_entities = state_bridge.runtime.snapshot_entities;
    const current_dynamics = {
      ai: state_bridge.runtime.ai || { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
      fractal: state_bridge.runtime.fractal || { velocity: 50, entropy: 50 },
    };
    const raw_messages = await state_bridge.session_driver.load_log(story_id);
    const recent_history = raw_messages.slice(-10);

    const { system, task } = prompt_builder.build_epilogue(clean_entities, current_dynamics, recent_history, conclusion_status);
    if (!system) return null;

    state_bridge.app.log("[GameMaster] Generating epilogue...", "system");
    const node_id = generate_uuid();
    const fractal_name = state_bridge.runtime.active_fractal?.name || "Fractal Entity";

    const response = await this.execute_with_retry(async () => {
      const text = await llm_service.generate({ system, task, role: "fractal", node_id: node_id });
      if (!text || !strip_cognition_blocks(text).trim()) {
        throw new Error("EMPTY_EPILOGUE_PROSE");
      }
      return text;
    });

    let epilogue_attachments = [];
    if (visual_engine) {
      try {
        const img_result = await visual_engine.visualize(story_id, strip_cognition_blocks(response), "story_entities", { silent: true });
        if (img_result?.imageUrl) {
          epilogue_attachments = [
            {
              src: img_result.imageUrl,
              metadata: {
                ...(img_result.metadata || {}),
                prompt: img_result.refinedPrompt || img_result.metadata?.prompt,
                mode: "characters",
              },
            },
          ];
        }
      } catch (err) {
        console.warn("[Epilogue Image Error]", err);
      }
    }

    await state_bridge.session_driver.log_message(detox_prose(response, "plain"), "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      story_id,
      meta: {
        id: node_id,
        is_epilogue: true,
        conclusion_status,
        story_status: conclusion_status,
      },
      attachments: epilogue_attachments,
    });
    state_bridge.app.end_stream();
    return response;
  },

  // ── 4. Persona Ghostwriter ──────────────────────────────────────────────────

  /**
   * EXECUTE GHOSTWRITER
   * Compiles and executes a Ghostwriter prompt on behalf of the User Persona.
   * @param {string} [input_text=""]
   * @param {AbortSignal|null} [signal=null]
   * @param {Function|null} [on_token=null]
   * @returns {Promise<string>}
   */
  async execute_ghostwriter(input_text = "", signal = null, on_token = null) {
    const story_id = state_bridge.runtime.story_id;
    const raw_messages = story_id ? await state_bridge.session_driver.load_log(story_id) : [];
    const simulation_log = raw_messages
      .filter((m) => !m.meta?.consolidated && m.role !== "system")
      .map((m) => ({
        role: m.role === "user" ? "user" : m.role === "fractal" ? "fractal" : "model",
        content: m.text || m.content || "",
        character_name: m.character_name,
      }));
    const payload = await context_builder.build_context(input_text || "", "simulation", simulation_log);
    const ghost_prompt = prompt_builder.build_ghostwriter(payload.entities, input_text);

    let full_accumulated = "";
    let is_inside_think = false;

    const result = await llm_service.generate(
      {
        system: ghost_prompt.system,
        task: ghost_prompt.task,
        messages: [],
        role: "user",
      },
      {
        silent: true,
        signal,
        onToken: (chunk) => {
          full_accumulated += chunk;
          if (typeof on_token === "function") {
            const starts_think = full_accumulated.trimStart().startsWith("<think") || full_accumulated.trimStart() === "<";
            if (starts_think || full_accumulated.includes("<think>")) {
              is_inside_think = !full_accumulated.includes("</think>");
              if (!is_inside_think) {
                const cleaned = strip_cognition_blocks(full_accumulated).trimStart();
                if (cleaned) on_token(cleaned, true);
              }
            } else if (!is_inside_think) {
              on_token(chunk, false);
            }
          }
        },
      },
    );

    const clean_result = strip_cognition_blocks(typeof result === "string" ? result : result?.text || "").trim();
    return clean_result;
  },

  // ── 5. Network Retry & Resilience ───────────────────────────────────────────

  /**
   * Wraps an async function in exponential backoff retry logic.
   * @param {() => Promise<any>} fn
   * @param {number} [retries=3]
   * @param {number} [delay=1000]
   * @returns {Promise<any>}
   */
  async execute_with_retry(fn, retries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (error) {
      const is_abort =
        error?.name === "AbortError" || error?.message?.includes("aborted") || String(error) === "Error: Generation aborted by caller.";
      if (is_abort) throw error;
      if (retries === 0) throw error;
      state_bridge.app.log(`[GameMaster] Connection issue. Retrying in ${delay}ms... (${retries} attempts left)`, "warn");

      if (state_bridge.app.streaming.active) {
        state_bridge.app.streaming.content = "_Network interrupted... Retrying connection..._";
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      const base_delay = delay * 2;
      const jittered_sleep_time = base_delay * (0.75 + Math.random() * 0.5);
      return await this.execute_with_retry(fn, retries - 1, jittered_sleep_time);
    }
  },
};

/**
 * CHANGELOG
 * - 2026-08-28: Reconstructed story-pipeline.js with 5 clean numbered sections, updated header path, and standard JSDoc typings.
 */
