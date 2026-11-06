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
import { normalize_entity } from "../storage/entities.js";
import { apply_bracket_deltas, parse_bracket_entries } from "../storage/parser.js";
import { session_driver } from "../data/index.js";
import { state_bridge } from "../utils/index.js";

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

    return new Promise((resolve, reject) => {
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
          stop_sequences: options.stopSequences || [],
          signal: options.signal,
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

        if (options.signal && typeof generation?.stop === "function") {
          options.signal.addEventListener("abort", () => generation.stop(), { once: true });
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
    });
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
export async function write_back_kernel_state(kernel, outcome, live_transport) {
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
  dispatch_caretaker_consolidation(kernel, live_transport).catch((err) => {
    console.warn("[Bridge] Caretaker background execution error:", err);
  });
}

/**
 * Runs Turn 3 Caretaker maintenance in the background and commits full 4-quadrant bracket updates
 * (present.physical, present.non_physical, future, and past) to active entity state and IndexedDB.
 *
 * @param {Kernel} kernel
 * @param {object} transport
 * @returns {Promise<void>}
 */
export async function dispatch_caretaker_consolidation(kernel, transport) {
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
    await write_back_kernel_state(_active_kernel, outcome, live_transport);

    return outcome;
  } finally {
    app.end_stream();
  }
}
