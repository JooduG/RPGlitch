/**
 * src/engine/runs.js
 * ============================================================================
 * 🏃 ENGINE RUNS - SESSION TURN PIPELINE
 * ============================================================================
 *
 * Session-aware wrappers around the Kernel: opens a turn session (quadrants,
 * transport, history), runs foreground turns and continuations, commits rows,
 * writes back dynamics, and dispatches background maintenance.
 *
 * Owns all state_bridge contact for the turn path; the mechanics in turns.js
 * stay pure (parameters in, outcomes out).
 */

import { IMAGE_POLICY } from "../config.js";
import { append_ledger_entries, db, log_message } from "../data/db.js";
import { normalize_entity } from "../data/entities.js";
import { apply_bracket_deltas, parse_bracket_entries, parse_think_block } from "../data/parser.js";
import { get_image_generation_queue, resolve_image_trigger, spawn_image_beat } from "../media/index.js";
import { state_bridge } from "../utils/index.js";
import { Kernel } from "./kernel.svelte.js";
import { get_transport } from "./transport.js";
import { execute_turn_3_caretaker, reconstruct_history_from_feed, resolve_caretaker_target } from "./turns.js";

/**
 * Opens a turn session: adapts active entities to quadrants, builds a Kernel
 * on the shared transport, and reconstructs multi-role history from a feed.
 */
export function open_turn_session(app, runtime, feed = []) {
  const user_quadrant = normalize_entity(runtime.active_user || app.selected_user || {});
  const ai_quadrant = normalize_entity(runtime.active_ai || app.selected_ai || {});
  const fractal_quadrant = normalize_entity(runtime.active_fractal || app.selected_fractal || {});

  const kernel = new Kernel({
    user: user_quadrant,
    ai: ai_quadrant,
    fractal: fractal_quadrant,
    round: Number(runtime.round || 0),
    transport: get_transport(),
    director_enabled: Boolean(app?.settings?.director_enabled),
  });

  kernel.history = reconstruct_history_from_feed(feed, {
    user: user_quadrant,
    ai: ai_quadrant,
    fractal: fractal_quadrant,
  });

  return { kernel, user_quadrant, ai_quadrant, fractal_quadrant };
}

/**
 * Commits a finished turn to persistence and the reactive feed: the director-turn
 * row first, then the character-turn AI row (chronological cause-before-effect).
 * Caretaker consolidation still appends last via dispatch_caretaker_consolidation.
 */
async function persist_turn_rows({ prose, think, outcome, ai_name, story_id, round, kernel }) {
  if (!prose || !story_id) return;

  // A2: snapshot post-clamp axis levels alongside signed deltas so gauges render
  // true 0..100 fullness + (±delta) badges. Legacy rows without `levels` fall back
  // to delta-magnitude bars in ChatBubble.
  const levels =
    kernel && (kernel.ai?.dynamics || kernel.fractal?.dynamics) ? { ...(kernel.ai?.dynamics || {}), ...(kernel.fractal?.dynamics || {}) } : undefined;

  // Director turn first (C1: chronology over stability - accepted devmode jump on commit).
  let logged_delta = null;
  if (outcome.director_staging?.dynamics_deltas) {
    logged_delta = await log_message("", "system", "Director", {
      turn_type: "SYSTEM_TURN",
      round,
      story_id,
      meta: {
        type: "DYNAMICS_DELTA",
        deltas: outcome.director_staging.dynamics_deltas,
        ...(levels ? { levels } : {}),
        director_note: outcome.director_staging.directors_note,
        camera_note: outcome.director_staging.camera_note,
        thoughts: outcome.director_staging._thought_process || "",
      },
    });
    if (logged_delta && state_bridge.simulation_log?.add) {
      state_bridge.simulation_log.add(logged_delta);
    }
  }

  const logged_entry = await log_message(prose, "ai", ai_name, {
    turn_type: "AI_TURN",
    round,
    story_id,
    meta: {
      think,
      director_staging: outcome.director_staging,
    },
  });
  if (logged_entry && state_bridge.simulation_log?.add) {
    state_bridge.simulation_log.add(logged_entry);
  }

  // Force explicit ordering so same-ms Date.now() ties can't flip on reload
  // (load_log sorts by created_at; live feed already appended delta-first).
  if (logged_delta && logged_entry && logged_delta.created_at >= logged_entry.created_at) {
    try {
      const fixed = logged_entry.created_at - 1;
      await db.simulation_log.update(logged_delta.id, { created_at: fixed });
      logged_delta.created_at = fixed;
      state_bridge.simulation_log?.update?.(logged_delta.id, { created_at: fixed });
    } catch {
      // Ordering is best-effort; insertion order already holds live.
    }
  }
}

/**
 * Evaluates the automatic image trigger after a turn and spawns the beat
 * without ever blocking the turn. Honors the configured pending cap.
 */
async function maybe_spawn_turn_image({ prose, outcome, kernel, ai_quadrant, fractal_quadrant, runtime }) {
  // B19: Wire automatic visual synthesis into turn (fire-and-forget, non-blocking)
  if (prose && runtime.story_id) {
    try {
      const turn_round = Number(kernel.round || 0);
      const last_director_beat_round = runtime.last_director_beat_round ?? -1;
      const last_dynamics_beat_round = runtime.last_dynamics_beat_round ?? -1;
      const resolved_image = resolve_image_trigger({
        snapshot: {
          ai: ai_quadrant,
          fractal: fractal_quadrant,
        },
        prev_dynamics: kernel.ai?.dynamics ? { ...kernel.ai.dynamics } : null,
        director_data: outcome.director_staging || {},
        turn_round,
        last_director_beat_round,
        last_dynamics_beat_round,
      });

      if (resolved_image?.next_director_round != null) {
        runtime.last_director_beat_round = resolved_image.next_director_round;
      }
      if (resolved_image?.next_dynamics_round != null) {
        runtime.last_dynamics_beat_round = resolved_image.next_dynamics_round;
      }

      const is_image_trigger_active = Boolean(resolved_image?.active);
      const image_tier = resolved_image?.tier;

      if (is_image_trigger_active && image_tier) {
        const queue = get_image_generation_queue();
        if (Array.isArray(queue) && queue.length < IMAGE_POLICY.MAX_PENDING_IMAGES) {
          spawn_image_beat(image_tier, {
            explicit: resolved_image.director_explicit,
            source: resolved_image.source || "dynamics",
            prompt: prose,
            visual_staging: outcome.director_staging?.camera_note || "",
          }).catch((image_err) => {
            console.warn("[Bridge] Automatic image beat dispatch error:", image_err);
          });
        }
      }
    } catch (trigger_err) {
      console.warn("[Bridge] Image trigger evaluation non-fatal warning:", trigger_err);
    }
  }
}

/**
 * Executes a simulation turn via the Kernel.
 *
 * @param {string} user_input - The submitted user message text.
 * @param {object} options
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<object>} Outcome containing character_turn, director_staging, etc.
 */
export async function execute_turn(user_input, _options = {}) {
  const runtime = state_bridge.runtime;
  const app = state_bridge.app;

  // 1-3. Quadrants, shared transport, Kernel, and multi-role history in one session
  const live_transport = get_transport();
  const { kernel, ai_quadrant, fractal_quadrant } = open_turn_session(app, runtime, state_bridge.simulation_log?.feed || []);

  // 4. Begin UI streaming indicator
  const message_node_id = `msg-${Date.now()}`;
  app.start_stream(message_node_id, "ai");

  let first_chunk = true;

  try {
    const outcome = await kernel.submit_turn(user_input, {
      signal: _options.signal,
      is_retry: _options.is_retry,
      is_continue: _options.is_continue,
      onChunk: (chunk) => {
        if (first_chunk) {
          first_chunk = false;
          state_bridge.simulation_state?.set_delegated_speaker?.({
            type: "ai",
            name: ai_quadrant.name || "AI",
            avatar: ai_quadrant.profile_picture || null,
            color: ai_quadrant.signature_color || null,
          });
          state_bridge.simulation_state?.start_stream_stage?.();
        }
        app.update_stream(chunk);
      },
    });

    // If onChunk never fired (e.g. non-streaming transport or mock without chunks), ensure stages transition cleanly
    if (first_chunk) {
      state_bridge.simulation_state?.set_delegated_speaker?.({
        type: "ai",
        name: ai_quadrant.name || "AI",
        avatar: ai_quadrant.profile_picture || null,
        color: ai_quadrant.signature_color || null,
      });
      state_bridge.simulation_state?.start_stream_stage?.();
    }

    const prose = outcome?.character_turn?.prose || "";
    const think = outcome?.character_turn?.think || "";

    // 5. Commit generated turn to IndexedDB log and reactive feed
    await persist_turn_rows({
      prose,
      think,
      outcome,
      ai_name: ai_quadrant.name || "AI",
      story_id: runtime.story_id,
      round: kernel.round,
      kernel,
    });

    // Resolves Gap 4: Write back updated dynamics, macro round, and caretaker deltas
    await write_back_kernel_state(kernel, outcome, live_transport, _options);

    await maybe_spawn_turn_image({ prose, outcome, kernel, ai_quadrant, fractal_quadrant, runtime });

    return outcome;
  } finally {
    app.end_stream();
  }
}
/**
 * Continues an existing message using the Sovereign Engine Kernel.
 * Formulates startWith from the target message's think-block and prose, streams
 * the continuation, and fuses the result directly onto the target message.
 *
 * @param {object} target_entry - Message entry to continue
 * @param {object} [_options={}]
 * @param {AbortSignal} [_options.signal]
 * @returns {Promise<object>} The continuation outcome
 */
export async function execute_continue(target_entry, _options = {}) {
  const { app, runtime } = state_bridge;

  if (!target_entry || !target_entry.id) {
    throw new Error("Target message entry required for continuation.");
  }

  // 1-3. Quadrants, shared transport, Kernel, history scoped to the target message
  const feed = state_bridge.simulation_log?.feed || [];
  const target_index_in_feed = feed.findIndex((e) => String(e.id) === String(target_entry.id));

  // Slice raw feed before target message so telemetry/empty entries don't skew index alignment
  const prior_feed = target_index_in_feed >= 0 ? feed.slice(0, target_index_in_feed) : feed;
  const { kernel, ai_quadrant } = open_turn_session(app, runtime, prior_feed);

  // Extract existing think and prose from target entry, robustly handling embedded <think>/<THINK> blocks
  let target_prose = target_entry.text || "";
  let target_think = target_entry.meta?.think || "";

  if (target_prose.includes("<think>") || target_prose.includes("<THINK>")) {
    const extracted = parse_think_block(target_prose);
    target_prose = extracted.prose;
    if (!target_think && extracted.think) {
      target_think = extracted.think;
    }
  }

  // 4. Begin UI streaming indicator targeting this message, seeded with existing prose so continuation appends smoothly
  app.start_stream(target_entry.id, "ai");
  const clean_target_prose = target_prose.trim();
  const ends_with_terminal = /[.!?…"”'’*)\]]$/.test(clean_target_prose);
  const stream_seed_separator = ends_with_terminal ? "\n\n" : " ";
  if (clean_target_prose) {
    app.update_stream(`${clean_target_prose}${stream_seed_separator}`);
  }

  let first_chunk = true;

  try {
    const outcome = await kernel.continue_turn(
      {
        target_prose,
        target_think,
        target_round: target_entry.round || kernel.round,
        target_history_index: null, // Context is already cleanly scoped in kernel.history
      },
      {
        signal: _options.signal,
        onChunk: (chunk) => {
          if (!chunk) return;
          // Ignore echoed startWith chunk from Perchance ai-text-plugin so pre-seeded target_prose is never duplicated
          if (clean_target_prose && (chunk.includes(clean_target_prose) || (target_think && chunk.includes(target_think)))) {
            return;
          }
          if (first_chunk) {
            first_chunk = false;
            state_bridge.simulation_state?.set_delegated_speaker?.({
              type: "ai",
              name: ai_quadrant.name || "AI",
              avatar: ai_quadrant.profile_picture || null,
              color: ai_quadrant.signature_color || null,
            });
            state_bridge.simulation_state?.start_stream_stage?.();
          }
          app.update_stream(chunk);
        },
      },
    );

    // If onChunk never fired (e.g. non-streaming or mock without chunks), ensure stages transition cleanly
    if (first_chunk) {
      state_bridge.simulation_state?.set_delegated_speaker?.({
        type: "ai",
        name: ai_quadrant.name || "AI",
        avatar: ai_quadrant.profile_picture || null,
        color: ai_quadrant.signature_color || null,
      });
      state_bridge.simulation_state?.start_stream_stage?.();
    }

    const fused_prose = outcome?.prose || target_prose;
    const fused_think = outcome?.think || target_think;

    // 5. Commit fused continuation to persistence and active feed
    if (state_bridge.simulation_log && typeof state_bridge.simulation_log.edit_entry === "function") {
      await state_bridge.simulation_log.edit_entry(target_entry.id, fused_prose);
      // Update entry meta think in-memory if present
      const entry = feed.find((e) => String(e.id) === String(target_entry.id));
      if (entry) {
        entry.meta = entry.meta || {};
        entry.meta.think = fused_think;
      }
    }

    return outcome;
  } finally {
    app.end_stream();
  }
}
/**
 * Writes back Kernel execution outcomes into active stores and IndexedDB.
 *
 * Resolves Gap 4:
 * 1. Synchronizes updated AI dynamics into runtime.active_ai and runtime.ai_physics.
 * 2. Synchronizes updated Fractal dynamics into runtime.active_fractal and runtime.fractal_physics.
 * 3. Advances runtime.round to match Kernel.round.
 * 4. Persists the updated entities and story round into IndexedDB via runtime.save_entity and runtime.save.
 * 5. Runs Turn 3 Caretaker background consolidation and records state diffs.
 *
 * @param {Kernel} kernel
 * @param {object} outcome
 * @param {object} live_transport
 * @returns {Promise<void>}
 */
export async function write_back_kernel_state(kernel, outcome, live_transport, options = {}) {
  const runtime = state_bridge.runtime;
  if (!runtime) return;

  // 1-3. Write back quadrant dynamics (AI/Fractal mirror into setter, active, and physics; User writes active only)
  for (const role of ["ai", "fractal"]) {
    const dynamics = kernel[role]?.dynamics;
    if (!dynamics) continue;
    if (role in runtime) {
      runtime[role] = { ...dynamics };
    }
    const active = role === "ai" ? runtime.active_ai : runtime.active_fractal;
    if (active) {
      active.dynamics = { ...dynamics };
    }
    const physics = role === "ai" ? runtime.ai_physics : runtime.fractal_physics;
    if (physics) {
      Object.assign(physics, dynamics);
    }
  }
  if (kernel.user?.dynamics && runtime.active_user) {
    runtime.active_user.dynamics = { ...kernel.user.dynamics };
  }

  // 4. Synchronize macro round counter
  runtime.round = kernel.round;

  // 5. Persist updated entities & story round into IndexedDB
  const save_promises = [];
  if (runtime.active_ai) {
    save_promises.push(runtime.save_entity("character", runtime.active_ai));
  }
  if (runtime.active_fractal) {
    save_promises.push(runtime.save_entity("fractal", runtime.active_fractal));
  }
  if (runtime.active_user) {
    save_promises.push(runtime.save_entity("character", runtime.active_user));
  }
  save_promises.push(runtime.save(runtime.round));

  await Promise.allSettled(save_promises);

  // 6. Turn 3: Caretaker background maintenance (dispatched un-awaited to free UI turn latency)
  // Gate execution on non-empty character prose and non-aborted signal (fizzle-path hygiene)
  const prose = outcome?.character_turn?.prose || "";
  if (prose.trim() && !options.signal?.aborted) {
    dispatch_caretaker_consolidation(kernel, live_transport, options.signal).catch((err) => {
      console.warn("[Bridge] Caretaker background execution error:", err);
    });
  }
}
/**
 * Runs Turn 3 Caretaker maintenance in the background and commits full 4-quadrant bracket updates
 * (present.physical, present.non_physical, future, and past) to active entity state and IndexedDB.
 *
 * @param {Kernel} kernel
 * @param {object} transport
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
export async function dispatch_caretaker_consolidation(kernel, transport, signal = null) {
  if (signal?.aborted) return;
  const runtime = state_bridge.runtime;
  if (!runtime) return;

  try {
    const target_entity_key = resolve_caretaker_target(
      runtime.back_shot_cursor ?? 0,
      {
        AI: kernel.ai,
        USER: kernel.user,
        FRACTAL: kernel.fractal,
      },
      true,
    );

    const caretaker_outcome = await execute_turn_3_caretaker({
      transport,
      round: kernel.round,
      entities: {
        AI: kernel.ai,
        USER: kernel.user,
        FRACTAL: kernel.fractal,
      },
      history: kernel.history,
      target_entity_key,
      signal,
    });

    if (!caretaker_outcome?.target) return;

    if (!caretaker_outcome.parse_succeeded) {
      state_bridge.app?.log?.(
        `[Caretaker] Caretaker response unparseable after retry for ${caretaker_outcome.target} - keeping cursor on target.`,
        "warn",
      );
      return;
    }

    const target_key = caretaker_outcome.target.toUpperCase();
    const target_entity = target_key === "USER" ? runtime.active_user : target_key === "FRACTAL" ? runtime.active_fractal : runtime.active_ai;

    if (!target_entity) return;

    let has_changes = false;
    const ledger_entries = [];
    const story_id = runtime.story_id ?? null;
    const round = Number(kernel.round ?? 0);
    const entity_id = String(target_entity.id || target_key.toLowerCase());

    const helper_record_ledger = (field, delta_text) => {
      if (!delta_text) return;
      const parsed_items = parse_bracket_entries(delta_text);
      for (const item of parsed_items) {
        ledger_entries.push({
          story_id,
          round,
          seq: 3, // Caretaker continuum phase
          entity_id,
          field,
          key: item.key,
          new_value: item.value,
          visibility: item.flags ? (item.flags.hide ? "hide" : item.flags.show ? "show" : null) : item.visibility || null,
          weight: item.flags ? (item.flags.weight ?? null) : (item.weight ?? null),
          writer: "caretaker",
          decider: "caretaker",
        });
      }
    };

    // 1. Present physical
    if (caretaker_outcome.present_physical) {
      target_entity.present = target_entity.present || { physical: "", non_physical: "" };
      const current_phys = typeof target_entity.present.physical === "string" ? target_entity.present.physical : "";
      target_entity.present.physical = apply_bracket_deltas(current_phys, caretaker_outcome.present_physical);
      helper_record_ledger("present.physical", caretaker_outcome.present_physical);
      has_changes = true;
    }

    // 2. Present non-physical
    if (caretaker_outcome.present_non_physical) {
      target_entity.present = target_entity.present || { physical: "", non_physical: "" };
      const current_non = typeof target_entity.present.non_physical === "string" ? target_entity.present.non_physical : "";
      target_entity.present.non_physical = apply_bracket_deltas(current_non, caretaker_outcome.present_non_physical);
      helper_record_ledger("present.non_physical", caretaker_outcome.present_non_physical);
      has_changes = true;
    }

    // 3. Future (standing agenda)
    if (caretaker_outcome.future_text) {
      const current_future = typeof target_entity.future === "string" ? target_entity.future : "";
      target_entity.future = apply_bracket_deltas(current_future, caretaker_outcome.future_text);
      helper_record_ledger("future", caretaker_outcome.future_text);
      has_changes = true;
    }

    // 4. Past (semantic memories)
    if (caretaker_outcome.past_text) {
      const current_past = typeof target_entity.past === "string" ? target_entity.past : "";
      target_entity.past = apply_bracket_deltas(current_past, caretaker_outcome.past_text);
      helper_record_ledger("past", caretaker_outcome.past_text);
      has_changes = true;
    }

    if (has_changes) {
      const entity_type = target_key === "FRACTAL" ? "fractal" : "character";
      await runtime.save_entity(entity_type, target_entity);

      if (ledger_entries.length > 0) {
        try {
          await append_ledger_entries(ledger_entries);
        } catch (ledger_err) {
          console.warn("[Bridge] Failed to append caretaker ledger entries:", ledger_err);
        }
      }

      // Emit CONTINUUM_FORMATION telemetry card so Caretaker consolidation appears in the timeline
      if (runtime.story_id) {
        try {
          const present_combined = [caretaker_outcome.present_physical, caretaker_outcome.present_non_physical].filter(Boolean).join(" ");
          const logged_continuum = await log_message("", "system", "Caretaker", {
            turn_type: "SYSTEM_TURN",
            round,
            story_id: runtime.story_id,
            meta: {
              type: "CONTINUUM_FORMATION",
              target: target_key,
              present: present_combined,
              future: caretaker_outcome.future_text || "",
              past: caretaker_outcome.past_text || "",
              thought_process: caretaker_outcome._thought_process || "",
            },
          });
          if (logged_continuum && state_bridge.simulation_log?.add) {
            state_bridge.simulation_log.add(logged_continuum);
          }
        } catch (card_err) {
          console.warn("[Bridge] Failed to emit caretaker telemetry card:", card_err);
        }
      }
      // Advance completion-driven cursor only after state write-back succeeds
      runtime.back_shot_cursor = (Number(runtime.back_shot_cursor) || 0) + 1;
    } else {
      // If no changes were needed, still advance cursor as target was successfully processed
      runtime.back_shot_cursor = (Number(runtime.back_shot_cursor) || 0) + 1;
    }
  } catch (caretaker_err) {
    state_bridge.app?.log?.(`[Caretaker] Caretaker execution warning: ${caretaker_err?.message || caretaker_err}`, "warn");
    console.warn("[Bridge] Caretaker write-back non-fatal warning:", caretaker_err);
  }
}
/**
 * CHANGELOG:
 * - 2026-11-10: Created from bridge.js run atoms: open_turn_session owns the
 *   quadrant/Kernel/history preamble; persist_turn_rows owns row commits;
 *   maybe_spawn_turn_image owns the visual beat (cap via IMAGE_POLICY);
 *   write_back folds the three dynamics mirrors into one loop. bridge.js dies.
 */
