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

import { Kernel } from "./kernel.svelte.js";
import { create_transport } from "./transport.js";
import { execute_turn_3_caretaker } from "./turns.js";
import { extract_think_block } from "./parser.js";
import { normalize_entity } from "../storage/entities.js";
import { apply_bracket_deltas, parse_bracket_entries } from "../storage/parser.js";
import { session_driver } from "../data/index.js";
import { state_bridge } from "../utils/index.js";
import { LLM_PRIORITY, merge_abort_signals, run_llm_job } from "../platform/llm-gate.js";

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
                  // DIAGNOSTIC (resolve-divergence, removable): log which result field won and their lengths.
                  try {
                    const picked =
                      typeof res === "string" ? "string" : res?.text != null ? "text" : res?.generatedText != null ? "generatedText" : "accumulated";
                    console.log(
                      "[resolve-divergence] bridge stream_fn picked=" +
                        picked +
                        " " +
                        JSON.stringify({
                          text: typeof res === "string" ? res.length : typeof res?.text === "string" ? res.text.length : null,
                          generatedText: typeof res?.generatedText === "string" ? res.generatedText.length : null,
                          accumulated: accumulated.length,
                          aborted: !!effective_signal?.aborted,
                          reason: effective_signal?.reason ?? null,
                        }),
                    );
                  } catch {
                    /* diagnostic must never throw */
                  }
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

  // 1. Write back AI dynamics
  if (kernel.ai?.dynamics && runtime.active_ai) {
    runtime.active_ai.dynamics = { ...kernel.ai.dynamics };
    if (runtime.ai_physics) {
      Object.assign(runtime.ai_physics, kernel.ai.dynamics);
    }
  }

  // 2. Write back Fractal dynamics
  if (kernel.fractal?.dynamics && runtime.active_fractal) {
    runtime.active_fractal.dynamics = { ...kernel.fractal.dynamics };
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
    const caretaker_outcome = await execute_turn_3_caretaker({
      transport,
      round: kernel.round,
      entities: {
        AI: kernel.ai,
        USER: kernel.user,
        FRACTAL: kernel.fractal,
      },
      history: kernel.history,
      signal,
    });

    if (!caretaker_outcome?.target) return;

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
          visibility: item.flags.hide ? "hide" : item.flags.show ? "show" : null,
          weight: item.flags.weight ?? null,
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
          const { append_ledger_entries } = await import("../data/ledger.js");
          await append_ledger_entries(ledger_entries);
        } catch (ledger_err) {
          console.warn("[Bridge] Failed to append caretaker ledger entries:", ledger_err);
        }
      }
    }
  } catch (caretaker_err) {
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
  const live_transport = create_transport({
    stream_fn: create_live_stream_fn(),
    max_concurrency: 1,
  });

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

  try {
    const outcome = await _active_kernel.submit_turn(user_input, {
      signal: _options.signal,
      onChunk: (chunk) => {
        app.update_stream(chunk);
      },
    });

    const prose = outcome?.character_turn?.prose || "";
    const think = outcome?.character_turn?.think || "";

    // 5. Commit generated turn to IndexedDB log via session_driver so feed renders it
    if (prose && runtime.story_id) {
      await session_driver.log_message(prose, "ai", ai_quadrant.name || "AI", {
        turn_type: "AI_TURN",
        round: _active_kernel.round,
        meta: {
          think,
          director_staging: outcome.director_staging,
          greenfield: true,
        },
      });

      // Emit a DYNAMICS_DELTA system entry so Quick Shot TelemetryCard stays live on greenfield turns
      if (outcome.director_staging?.dynamics_deltas) {
        await session_driver.log_message("", "system", "Director", {
          turn_type: "SYSTEM_TURN",
          round: _active_kernel.round,
          meta: {
            type: "DYNAMICS_DELTA",
            deltas: outcome.director_staging.dynamics_deltas,
            director_note: outcome.director_staging.directors_note,
            camera_note: outcome.director_staging.camera_note,
            greenfield: true,
          },
        });
      }
    }

    // Resolves Gap 4: Write back updated dynamics, macro round, and caretaker deltas
    await write_back_kernel_state(_active_kernel, outcome, live_transport, _options);

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

  // 2. Instantiate or reuse active transport
  const live_stream_fn = create_live_stream_fn();
  const live_transport = create_transport({
    stream_fn: live_stream_fn,
  });

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
    const extracted = extract_think_block(target_prose);
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
          app.update_stream(chunk);
        },
      },
    );

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
