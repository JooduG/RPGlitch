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
 * ============================================================================
 */

import { Kernel } from "./kernel.svelte.js";
import { create_transport } from "./transport.js";
import { normalize_entity } from "../storage/entities.js";
import { session_driver } from "../data/index.js";
import { state_bridge } from "../utils/index.js";

/**
 * Creates a live browser streaming function backed by window.generateText
 * or mock fallback for dev/testing.
 */
function create_live_stream_fn() {
  return async (prompt, options = {}) => {
    const ai_engine = typeof window !== "undefined" ? window.generateText || window.generate_text || window.pluginGenerateText : null;

    if (!ai_engine || typeof ai_engine !== "function") {
      // Dev mock response if running in Vite dev server without Perchance plugin
      const mock_text = `*Nods thoughtfully.* The greenfield engine receives your message: "${prompt.slice(0, 30)}..."`;
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

      const on_token = (chunk) => {
        const piece = typeof chunk === "string" ? chunk : chunk?.textChunk || "";
        accumulated += piece;
        if (options.onChunk) {
          options.onChunk(piece);
        }
      };

      try {
        const generation = ai_engine({
          instruction: () => prompt,
          stop_sequences: options.stopSequences || [],
          signal: options.signal,
          onToken: on_token,
          onChunk: on_token,
        });

        if (options.signal && typeof generation?.stop === "function") {
          options.signal.addEventListener("abort", () => generation.stop(), { once: true });
        }

        if (generation && typeof generation.then === "function") {
          generation.then((res) => resolve(typeof res === "string" ? res : accumulated)).catch(reject);
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
 * Executes a simulation turn via the greenfield Kernel.
 *
 * @param {string} user_input - The submitted user message text.
 * @param {object} options
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<object>} Outcome containing character_turn, director_staging, etc.
 */
export async function execute_greenfield_turn(user_input, options = {}) {
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

  _active_kernel = new Kernel({
    user: user_quadrant,
    ai: ai_quadrant,
    fractal: fractal_quadrant,
    round: Number(runtime.round || 0),
    transport: live_transport,
    director_enabled: true,
  });

  // 3. Reconstruct history from existing simulation log
  const feed = state_bridge.simulation_log?.feed || [];
  _active_kernel.history = feed
    .filter((entry) => entry.text && (entry.role === "user" || entry.role === "ai" || entry.role === "model"))
    .map((entry) => ({
      role: entry.role === "user" ? "user" : "model",
      text: entry.text,
      round: entry.round || 1,
    }));

  // 4. Begin UI streaming indicator
  const message_node_id = `msg-${Date.now()}`;
  app.start_stream(message_node_id, "ai");

  try {
    const outcome = await _active_kernel.submit_turn(user_input, {
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
        meta: {
          think,
          director_staging: outcome.director_staging,
          greenfield: true,
        },
      });
    }

    return outcome;
  } finally {
    app.end_stream();
  }
}
