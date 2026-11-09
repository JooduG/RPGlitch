/**
 * src/engine/bridge.js
 * ============================================================================
 * 🌉 GREENFIELD-TO-LEGACY COEXISTENCE BRIDGE
 * ============================================================================
 *
 * Provides a clean adapter that connects the Greenfield Kernel (src/engine/)
 * to the currently mounted Svelte UI and active story session:
 * - Adapts active legacy entities (AI, User, Fractal) into 4-quadrant format
 * - Directs streaming tokens into the reactive Svelte streaming_store
 * - Synchronizes generated assistant prose into IndexedDB and UI timeline
 * - Writes back updated entity dynamics and Caretaker changes to state and persistence
 * - Preserves complete multi-role history (user, model, fractal, system)
 * ============================================================================
 */

import { get_image_generation_queue, resolve_image_trigger, spawn_image_beat } from "../media/index.js";
import { LLM_PRIORITY, merge_abort_signals, run_llm_job } from "../platform/llm-gate.js";
import { append_ledger_entries, log_message } from "../storage/db.js";
import { normalize_entity } from "../storage/entities.js";
import { apply_bracket_deltas, parse_bracket_entries, parse_think_block } from "../storage/parser.js";
import { state_bridge } from "../utils/index.js";
import { Kernel } from "./kernel.svelte.js";
import {
  execute_turn_2_character,
  execute_turn_3_caretaker,
  execute_turn_structuring,
  execute_turn_visualizer,
  resolve_caretaker_target,
} from "./turns.js";

/**
 * Shared preemptive transport singleton for the active session.
 * Replaces per-turn create_transport instantiation so foreground turns and background
 * Caretaker consolidation share a single-slot preemptible pipeline.
 */
let _shared_transport = null;

export function get_shared_transport() {
  if (!_shared_transport) {
    _shared_transport = {
      stream: (prompt, options = {}) => {
        const stream_fn = create_live_stream_fn();
        return stream_fn(prompt, options);
      },
    };
  }
  return _shared_transport;
}

export function reset_shared_transport() {
  _shared_transport = null;
}

/**
 * Creates a live browser streaming function backed by window.generateText
 * or mock fallback for dev/testing.
 *
 * Resolves Gap 1 (handles both string and function prompt parameters)
 * Resolves Gap 2 (guards accumulator to prevent duplicate tokens if both onToken and onChunk fire)
 */
export function create_live_stream_fn() {
  return async (prompt, options = {}) => {
    const ai_engine = typeof window !== "undefined" ? window.generateText || window.generate_text || window.pluginGenerateText : null;

    if (!ai_engine || typeof ai_engine !== "function") {
      // Dev mock response if running in Vite dev server without Perchance plugin
      const prompt_str = typeof prompt === "function" ? prompt() : String(prompt || "");
      const mock_text = `*Nods thoughtfully.* The greenfield engine receives your message: "${prompt_str.slice(0, 30)}..."`;
      if (options.onChunk) {
        for (const char of mock_text) {
          options.onChunk(char);
          await new Promise((r) => setTimeout(r, 10));
        }
      }
      return mock_text;
    }

    const priority = options.priority === "background" ? LLM_PRIORITY.BACKGROUND : LLM_PRIORITY.FOREGROUND;

    return run_llm_job(
      (gate_signal) =>
        new Promise((resolve, reject) => {
          const effective_signal = merge_abort_signals(options.signal, gate_signal);

          if (effective_signal?.aborted) {
            reject(new Error("Stream aborted by user."));
            return;
          }
          let accumulated = "";

          // Deduplication guard: track characters emitted to prevent double-counting if onToken & onChunk fire
          let token_streamed = false;

          const handle_chunk = (chunk) => {
            const piece = typeof chunk === "string" ? chunk : chunk?.textChunk || "";
            if (!piece) return;
            accumulated += piece;
            if (options.onChunk) {
              options.onChunk(piece);
            }
          };

          try {
            const generation = ai_engine({
              instruction: () => (typeof prompt === "function" ? prompt() : String(prompt || "")),
              startWith: options.startWith != null ? String(options.startWith) : "",
              stopSequences: options.stopSequences || options.stop_sequences || [],
              stop_sequences: options.stopSequences || options.stop_sequences || [],
              signal: effective_signal,
              onToken: (chunk) => {
                token_streamed = true;
                handle_chunk(chunk);
              },
              onChunk: (chunk) => {
                // Only handle if onToken is not actively processing to prevent double-counting
                if (!token_streamed) {
                  handle_chunk(chunk);
                }
              },
            });

            if (effective_signal && typeof generation?.stop === "function") {
              effective_signal.addEventListener("abort", () => generation.stop(), { once: true });
            }

            if (generation && typeof generation.then === "function") {
              generation
                .then((res) => {
                  const text_out = typeof res === "string" ? res : res?.text || res?.generatedText || accumulated;
                  resolve(text_out);
                })
                .catch(reject);
            } else {
              resolve(accumulated);
            }
          } catch (err) {
            reject(err);
          }
        }),
      priority,
    );
  };
}

/**
 * Singleton or reusable Kernel instance for live testing.
 * @type {Kernel | null}
 */
let _active_kernel = null;

/**
 * Reconstructs clean Kernel dialogue history from the UI / simulation log feed.
 *
 * Resolves Gap 5: Preserves user, model, fractal (environmental), and system roles
 * along with origin attribution so scene context is never lost.
 *
 * @param {Array<object>} feed
 * @param {object} cast
 * @returns {Array<object>}
 */
export function reconstruct_history_from_feed(feed = [], cast = {}) {
  if (!Array.isArray(feed)) return [];

  const user_name = cast.user?.name || "USER";
  const ai_name = cast.ai?.name || "AI";
  const fractal_name = cast.fractal?.name || "WORLD";

  return feed
    .filter((entry) => entry && entry.text && typeof entry.text === "string" && entry.text.trim())
    .map((entry) => {
      let role;
      let origin = entry.character_name || entry.origin || "";

      if (entry.role === "user") {
        role = "user";
        origin = origin || user_name;
      } else if (entry.role === "fractal") {
        role = "fractal";
        origin = origin || fractal_name;
      } else if (entry.role === "system") {
        role = "system";
        origin = origin || "SYSTEM";
      } else {
        role = "model";
        origin = origin || ai_name;
      }

      return {
        role,
        origin,
        text: entry.text.trim(),
        round: Number(entry.round || 1),
      };
    });
}

/**
 * Writes back Kernel execution outcomes into active legacy stores and IndexedDB.
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

  // 1. Write back AI dynamics (invokes runtime.ai setter -> updates #ai_physics and active_ai.dynamics)
  if (kernel.ai?.dynamics) {
    if ("ai" in runtime) {
      runtime.ai = { ...kernel.ai.dynamics };
    }
    if (runtime.active_ai) {
      runtime.active_ai.dynamics = { ...kernel.ai.dynamics };
    }
    if (runtime.ai_physics) {
      Object.assign(runtime.ai_physics, kernel.ai.dynamics);
    }
  }

  // 2. Write back Fractal dynamics (invokes runtime.fractal setter -> updates #fractal_physics and active_fractal.dynamics)
  if (kernel.fractal?.dynamics) {
    if ("fractal" in runtime) {
      runtime.fractal = { ...kernel.fractal.dynamics };
    }
    if (runtime.active_fractal) {
      runtime.active_fractal.dynamics = { ...kernel.fractal.dynamics };
    }
    if (runtime.fractal_physics) {
      Object.assign(runtime.fractal_physics, kernel.fractal.dynamics);
    }
  }

  // 3. Write back User persona dynamics
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
        `[Caretaker] Caretaker response unparseable after retry for ${caretaker_outcome.target} — keeping cursor on target.`,
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
              greenfield: true,
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
 * Executes a simulation turn via the greenfield Kernel.
 *
 * @param {string} user_input - The submitted user message text.
 * @param {object} options
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<object>} Outcome containing character_turn, director_staging, etc.
 */
export async function execute_greenfield_turn(user_input, _options = {}) {
  const runtime = state_bridge.runtime;
  const app = state_bridge.app;

  // 1. Adapt active entities from legacy runtime to greenfield 4-quadrant format
  const ai_quadrant = normalize_entity(runtime.active_ai || app.selected_ai || {});
  const user_quadrant = normalize_entity(runtime.active_user || app.selected_user || {});
  const fractal_quadrant = normalize_entity(runtime.active_fractal || app.selected_fractal || {});

  // 2. Initialize or reconfigure Kernel with live streaming transport
  const live_transport = get_shared_transport();

  // Resolves Gap 3: Read director_enabled dynamically from app settings rather than hardcoding true
  const director_enabled = Boolean(app?.settings?.director_enabled);

  _active_kernel = new Kernel({
    user: user_quadrant,
    ai: ai_quadrant,
    fractal: fractal_quadrant,
    round: Number(runtime.round || 0),
    transport: live_transport,
    director_enabled,
  });

  // 3. Reconstruct history from existing simulation log
  // Resolves Gap 5: Reconstruct multi-role history (user, model, fractal, system)
  const feed = state_bridge.simulation_log?.feed || [];
  _active_kernel.history = reconstruct_history_from_feed(feed, {
    user: user_quadrant,
    ai: ai_quadrant,
    fractal: fractal_quadrant,
  });

  // 4. Begin UI streaming indicator
  const message_node_id = `msg-${Date.now()}`;
  app.start_stream(message_node_id, "ai");

  let first_chunk = true;

  try {
    const outcome = await _active_kernel.submit_turn(user_input, {
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

    // 5. Commit generated turn to IndexedDB log via log_message so feed renders it
    if (prose && runtime.story_id) {
      const logged_entry = await log_message(prose, "ai", ai_quadrant.name || "AI", {
        turn_type: "AI_TURN",
        round: _active_kernel.round,
        story_id: runtime.story_id,
        meta: {
          think,
          director_staging: outcome.director_staging,
          greenfield: true,
        },
      });
      if (logged_entry && state_bridge.simulation_log?.add) {
        state_bridge.simulation_log.add(logged_entry);
      }

      // Emit a DYNAMICS_DELTA system entry so Quick Shot TelemetryCard stays live on greenfield turns
      if (outcome.director_staging?.dynamics_deltas) {
        const logged_delta = await log_message("", "system", "Director", {
          turn_type: "SYSTEM_TURN",
          round: _active_kernel.round,
          story_id: runtime.story_id,
          meta: {
            type: "DYNAMICS_DELTA",
            deltas: outcome.director_staging.dynamics_deltas,
            director_note: outcome.director_staging.directors_note,
            camera_note: outcome.director_staging.camera_note,
            thoughts: outcome.director_staging._thought_process || "",
            greenfield: true,
          },
        });
        if (logged_delta && state_bridge.simulation_log?.add) {
          state_bridge.simulation_log.add(logged_delta);
        }
      }
    }

    // Resolves Gap 4: Write back updated dynamics, macro round, and caretaker deltas
    await write_back_kernel_state(_active_kernel, outcome, live_transport, _options);

    // B19: Wire automatic visual synthesis into greenfield turn (fire-and-forget, non-blocking)
    if (prose && runtime.story_id) {
      try {
        const turn_round = Number(_active_kernel.round || 0);
        const last_director_beat_round = runtime.last_director_beat_round ?? -1;
        const last_dynamics_beat_round = runtime.last_dynamics_beat_round ?? -1;
        const resolved_image = resolve_image_trigger({
          snapshot: {
            ai: ai_quadrant,
            fractal: fractal_quadrant,
          },
          prev_dynamics: _active_kernel.ai?.dynamics ? { ..._active_kernel.ai.dynamics } : null,
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
          if (Array.isArray(queue) && queue.length < 5) {
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

    return outcome;
  } finally {
    app.end_stream();
  }
}

/**
 * Continues an existing message using the Sovereign Greenfield Engine Kernel.
 * Formulates startWith from the target message's think-block and prose, streams
 * the continuation, and fuses the result directly onto the target message.
 *
 * @param {object} target_entry - Message entry to continue
 * @param {object} [_options={}]
 * @param {AbortSignal} [_options.signal]
 * @returns {Promise<object>} The continuation outcome
 */
export async function execute_greenfield_continue(target_entry, _options = {}) {
  const { app, runtime } = state_bridge;

  if (!target_entry || !target_entry.id) {
    throw new Error("Target message entry required for continuation.");
  }

  // 1. Build 4-quadrant character entities
  const user_quadrant = normalize_entity(runtime.active_user || app.selected_user || {});
  const ai_quadrant = normalize_entity(runtime.active_ai || app.selected_ai || {});
  const fractal_quadrant = normalize_entity(runtime.active_fractal || app.selected_fractal || {});

  // 2. Reuse shared preemptive transport singleton
  const live_transport = get_shared_transport();

  const director_enabled = Boolean(app?.settings?.director_enabled);

  _active_kernel = new Kernel({
    user: user_quadrant,
    ai: ai_quadrant,
    fractal: fractal_quadrant,
    round: Number(runtime.round || 0),
    transport: live_transport,
    director_enabled,
  });

  // 3. Reconstruct history strictly up to the target message to prevent off-by-one or leaking future turns
  const feed = state_bridge.simulation_log?.feed || [];
  const target_index_in_feed = feed.findIndex((e) => String(e.id) === String(target_entry.id));

  // Slice raw feed before target message so telemetry/empty entries don't skew index alignment
  const prior_feed = target_index_in_feed >= 0 ? feed.slice(0, target_index_in_feed) : feed;
  const contextual_history = reconstruct_history_from_feed(prior_feed, {
    user: user_quadrant,
    ai: ai_quadrant,
    fractal: fractal_quadrant,
  });

  _active_kernel.history = contextual_history;

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
    const outcome = await _active_kernel.continue_turn(
      {
        target_prose,
        target_think,
        target_round: target_entry.round || _active_kernel.round,
        target_history_index: null, // Context is already cleanly scoped in _active_kernel.history
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
 * Executes a ghostwriting stream to draft the user's next narrative action or dialogue.
 * Reuses execute_turn_2_character with inverted participants (AI: user, USER: ai).
 * Suppresses thought blocks during live token streaming to the composer callback.
 *
 * @param {string} [input_text=""] - Context/seed text to continue or draft
 * @param {AbortSignal} [signal=null] - Optional abort signal
 * @param {((chunk: string, is_full_replace: boolean) => void) | null} [on_token=null] - Live token callback
 * @returns {Promise<string>} Cleaned narrative prose
 */
export async function execute_ghostwriter(input_text = "", signal = null, on_token = null) {
  const runtime = state_bridge.runtime || {};
  const app = state_bridge.app || {};

  const user_quadrant = normalize_entity(runtime.active_user || app.selected_user || {});
  const ai_quadrant = normalize_entity(runtime.active_ai || app.selected_ai || {});
  const fractal_quadrant = normalize_entity(runtime.active_fractal || app.selected_fractal || {});

  const feed = state_bridge.simulation_log?.feed || [];
  const history = reconstruct_history_from_feed(feed, {
    user: user_quadrant,
    ai: ai_quadrant,
    fractal: fractal_quadrant,
  });

  if (input_text && input_text.trim()) {
    history.push({
      role: "user",
      content: input_text.trim(),
    });
  }

  const live_transport = get_shared_transport();

  let full_accumulated = "";
  let is_inside_think = false;

  const outcome = await execute_turn_2_character({
    transport: live_transport,
    round: Number(runtime.round || 1),
    entities: {
      AI: user_quadrant,
      USER: ai_quadrant,
      FRACTAL: fractal_quadrant,
    },
    history,
    memories: [],
    directors_note: "",
    signal,
    onChunk: (chunk) => {
      full_accumulated += chunk;
      if (typeof on_token === "function") {
        const lower = full_accumulated.toLowerCase();
        if (lower.includes("<think>") || lower.startsWith("<think") || full_accumulated.trimStart() === "<") {
          is_inside_think = !lower.includes("</think>");
          if (!is_inside_think) {
            const extracted = parse_think_block(full_accumulated);
            const cleaned = (extracted.prose || "").trimStart();
            if (cleaned) on_token(cleaned, true);
          }
        } else if (!is_inside_think) {
          on_token(chunk, false);
        }
      }
    },
  });

  return (outcome?.prose || "").trim();
}

/**
 * Executes visual prompt envisioning/refinement via the greenfield visualizer purpose core.
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
        const { llm_service } = await import("../platform/transport.js");
        const response = await llm_service.generate(
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
 * Executes raw prose structuring via the greenfield Caretaker purpose core.
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
      const { llm_service } = await import("../platform/transport.js");
      const response = await llm_service.enhance({
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
 * Executes a pure Greenfield Prologue and opening AI narrative beat for Turn 0.
 *
 * @param {string} story_id
 * @returns {Promise<any>}
 */
export async function execute_greenfield_prologue(story_id) {
  const runtime = state_bridge.runtime;
  const app = state_bridge.app;
  if (!runtime || !story_id) return null;

  app.busy = true;

  try {
    const _ai_quadrant = normalize_entity(runtime.active_ai || app.selected_ai || {});
    const user_quadrant = normalize_entity(runtime.active_user || app.selected_user || {});
    const fractal_quadrant = normalize_entity(runtime.active_fractal || app.selected_fractal || {});

    const live_transport = get_shared_transport();
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
        greenfield: true,
      },
      attachments: [],
    });

    // 2. Stream Fractal prologue scene setting via Character core (is_character: false)
    const { compile_prompt } = await import("./prompts.js");
    const prologue_prompt = compile_prompt({
      core: "character",
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

    app.log("[Greenfield] Establishing prologue scene (Round 0)...", "system");
    const raw_prologue = await live_transport.stream(prologue_prompt, {
      startWith: "<think>\n",
    });

    const { think: prologue_think, body: prologue_body } = parse_think_block(raw_prologue);
    const prologue_text = (prologue_body || raw_prologue || "").trim();

    await state_bridge.session_driver.edit_log_entry(node_id, prologue_text, {
      think: prologue_think,
      greenfield: true,
    });
    app.log("[Greenfield] Prologue scene established.", "system");

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

    const { visual_engine } = await import("../media/visual.js");
    if (visual_engine) {
      (async () => {
        const { mark_generation_in_flight, clear_generation_in_flight } = await import("../media/visual.js");
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
          console.warn("[Greenfield Prologue Image Error]", img_err);
        } finally {
          clear_generation_in_flight?.(node_id, 0);
        }
      })().catch(() => {});
    }

    // 4. Execute the opening AI character turn reacting directly to the prologue
    try {
      app.log("[Greenfield] Generating opening character turn (Round 1)...", "ai");
      return await execute_greenfield_turn(prologue_text, { is_opening_turn: true });
    } finally {
      release_prologue_image();
    }
  } catch (e) {
    console.error("[Greenfield] Prologue Failed:", e);
    app.log("Error: Greenfield Prologue Failed.", "error");
    throw e;
  } finally {
    app.busy = false;
    app.end_stream();
    if (typeof state_bridge.simulation_state !== "undefined") {
      state_bridge.simulation_state.phase = "idle";
    }
  }
}
