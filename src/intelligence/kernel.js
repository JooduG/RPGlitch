/**
 * @file src/core/intelligence/intelligence-kernel.js
 *
 * -----------------------------------------------------------------------------
 * gamemaster - The Brain's Core
 * -----------------------------------------------------------------------------
 *
 * PURPOSE
 * This service unifies the Intelligence Kernel (Broker, Dynamics, Builder)
 * and the Transport Layer (llm_service) into a single, cohesive execution flow.
 *
 * RESPONSIBILITIES
 * gamemaster Execution: Hydrate -> Simulate -> Synthesize -> Generate.
 * 2. Persistence  : Automatically logs turns to the Session database.
 * 3. Physics      : Updates global runtime physics based on simulation results.
 */
import { context_broker } from "@intelligence/context.svelte.js";
import { dynamics_engine } from "@intelligence/dynamics.js";
import { prompt_builder } from "@intelligence/prompts.js";
import { llm_service } from "@platform/transport.js";
import { runtime } from "@state/runtime.svelte.js";
import { app } from "@state/app.svelte.js";
import { temporal_engine } from "@intelligence/temporal.js";
import { db } from "@data/db.js";
import { simulationState } from "@state/status.svelte.js";
import { entities, serialize, prune } from "@data/repository.js";
import { session_driver } from "@engine/session.svelte.js";
import { generateUUID } from "@engine/utils.js";
/**
 * @typedef {import('@engine/kernel.js').GenerationOptions} GenerationOptions
 */

/**
 * Synchronous post-turn validation and repair layer.
 * Automatically closes truncated `<think>` blocks and strips Chinese characters from narrative prose
 * without removing spaces, corrupting sentence formatting, or contaminating reactive global app proxies.
 * @param {string} response
 * @returns {{ text: string; violated: boolean }}
 */
function validate_and_repair_response(response) {
  const result = { text: response || "", violated: false };
  try {
    let text = result.text;

    // TAG CLOSURE PASS:
    const thinkOpener = /<think>/i;
    const thinkCloser = /<\/think>/i;
    if (thinkOpener.test(text) && !thinkCloser.test(text)) {
      text += "</think>";
    }

    // CHINESE BLEED PARSING: Isolate narrative prose from think blocks
    const splitRegex = /(<\/think>|<think>)/i;
    const segments = text.split(splitRegex);

    let inThinkBlock = false;
    const processedSegments = segments.map((segment) => {
      const lower = segment.toLowerCase();
      if (lower === "<think>") {
        inThinkBlock = true;
        return segment;
      }
      if (lower === "</think>") {
        inThinkBlock = false;
        return segment;
      }

      // If we are inside think block, do not strip Chinese characters
      if (inThinkBlock) {
        return segment;
      }

      // PROSE STRIPPING: For text chunks determined to be outside the think tags
      const chineseRange = /[\u4e00-\u9fa5]/g;
      if (chineseRange.test(segment)) {
        result.violated = true;
        return segment.replace(chineseRange, "");
      }
      return segment;
    });

    if (result.violated) {
      app.log("SINO_LOGIC bleed intercepted", "warn");
    }

    result.text = processedSegments.join("");
  } catch (err) {
    console.warn("[gamemaster] Validation check failed:", err);
    result.text = response || "";
    result.violated = false;
  }
  return result;
}

export const gamemaster = {
  /**
   * CAPTURE DYNAMICS DELTA
   * Detects changes in entity dynamics and logs a telemetry entry.
   * @param {{ ai: any; fractal: any; flags?: string[]; signals?: any; signal_prompts?: string[]; contributors?: any; key?: Record<string, any> | undefined; }} snapshot
   */
  async capture_dynamics_delta(snapshot) {
    /**
     * @type {string[]}
     */
    const deltas = [];

    // AI Deltas
    if (snapshot.ai?.dynamics) {
      Object.entries(snapshot.ai.dynamics).forEach(([axis, val]) => {
        const old_val = /** @type {any} */ (runtime.ai)?.[axis] ?? 50;
        const diff = val - old_val;
        if (diff !== 0) {
          const cause = snapshot.contributors?.[`AI.${axis}`]?.join(", ") || "GM";
          deltas.push(`AI.${axis}: ${val} (${diff > 0 ? "+" : ""}${diff}) [${cause}]`);
        }
      });
    }

    // Fractal Deltas
    if (snapshot.fractal?.dynamics) {
      Object.entries(snapshot.fractal.dynamics).forEach(([axis, val]) => {
        const old_val = /** @type {any} */ (runtime.fractal)?.[axis] ?? 50;
        const diff = val - old_val;
        if (diff !== 0) {
          const cause = snapshot.contributors?.[`FRACTAL.${axis}`]?.join(", ") || "GM";
          deltas.push(`World.${axis}: ${val} (${diff > 0 ? "+" : ""}${diff}) [${cause}]`);
        }
      });
    }

    // Signals
    const active_signals = Object.keys(snapshot.signals || {});

    if (deltas.length > 0) {
      await session_driver.log_system_entry(deltas.join(" | "), "system", {
        type: "telemetry",
        deltas,
        signals: active_signals,
        snapshot: {
          ai: snapshot.ai?.dynamics,
          fractal: snapshot.fractal?.dynamics,
        },
      });
    }
  },

  /**
   * EXECUTE TURN
   * The primary simulation loop for a narrative turn.
   *
   * @param {string} story_id
   * @param {GenerationOptions} options
   */
  async execute_turn(story_id, options = {}) {
    const { input = "", role = "ai", ...llm_options } = options;
    app.busy = true;
    try {
      simulationState.start_generation(role);

      const nodeId = generateUUID();

      // 1. CHRONO: Round management
      // Round is managed by Session.send or explicit prologue start.
      // We ensure turn-type consistency here.
      temporal_engine.ensure_momentum(runtime, app);
      runtime.turn_type = "SYSTEM_TURN";
      // 2. HYDRATION: Fetch history and hydrate context
      const raw_messages = await session_driver.load_log(story_id);
      const simulation_log = raw_messages
        .filter((m) => !m.meta?.consolidated && m.role !== "system")
        .map((m) => ({
          role: m.role === "user" ? "user" : "model",
          content: m.text || m.content || "",
          character_name: m.character_name,
        }));
      const payload = await context_broker.hydrate(input || "", "simulation", simulation_log);
      // 3. SIMULATION: Evaluate world physics snapshot prior to generation
      const snapshot = dynamics_engine.simulate(payload);

      // 3.6. COMPRESSION LAYER
      const compressed_entities = {
        AI: serialize(payload.entities.AI),
        USER: serialize(payload.entities.USER),
        FRACTAL: serialize(payload.entities.FRACTAL),
      };
      /** @type {any} */ (snapshot).compressed_entities = compressed_entities;
      /** @type {any} */ (snapshot).pruned_past = {
        AI: prune(payload.entities.AI?.past, "past"),
        USER: prune(payload.entities.USER?.past, "past"),
        FRACTAL: prune(payload.entities.FRACTAL?.past, "past"),
      };
      /** @type {any} */ (snapshot).pruned_future = {
        AI: prune(payload.entities.AI?.future, "future"),
        USER: prune(payload.entities.USER?.future, "future"),
        FRACTAL: prune(payload.entities.FRACTAL?.future, "future"),
      };

      // 4. SYNTHESIS: Build the final prompt
      const { system, meta } = prompt_builder.synthesize(payload, snapshot);

      // 5. TRANSITION & LOGGING: Decoupled from dynamic metric mutations
      app.log(
        "gamemaster: Context hydrated. Physics resolved. Entering AI_TURN. Routing to LLM...",
        "system",
      );
      runtime.turn_type = "AI_TURN";

      // 6. GENERATION: Call the model with retry logic
      const response = await this.execute_with_retry(async () => {
        const {
          temperature,
          top_p,
          repetition_penalty,
          max_tokens,
          model,
          onToken,
          json,
          signal,
          silent,
          raw,
        } = llm_options;

        return await llm_service.generate(
          {
            system,
            messages: simulation_log,
            role,
            node_id: nodeId,
          },
          {
            temperature,
            top_p,
            repetition_penalty,
            max_tokens,
            model,
            onToken,
            json,
            signal,
            silent,
            raw,
          },
        );
      });

      // 6.5. POST-GENERATION PIPELINE: Isolated validation, physics, telemetry, and state sync
      /** @type {any} */
      let final_meta = { ...meta };
      const validationResult = validate_and_repair_response(response || "");

      try {
        const post_payload = {
          input: validationResult.text,
          entities: runtime.snapshot_entities,
          round: runtime.round,
        };
        const post_snapshot = dynamics_engine.simulate(post_payload);

        // Capture and log the dynamics delta for this post-generation pass exactly once
        await this.capture_dynamics_delta(post_snapshot);

        // Sync the post-generation settled physics to runtime exactly once
        runtime.ai = post_snapshot.ai.dynamics;
        runtime.fractal = post_snapshot.fractal.dynamics;

        // Update metadata to be logged in database
        final_meta.ai = post_snapshot.ai.dynamics;
        final_meta.fractal = post_snapshot.fractal.dynamics;
        final_meta.flags = post_snapshot.flags;
        final_meta.signals = post_snapshot.signals;
      } catch (post_err) {
        console.warn("[gamemaster] Post-generation scan failed:", post_err);
      }

      // 7. PERSISTENCE: Save the result
      const character_name =
        role === "ai" ? runtime.active_ai?.name || "AI" : runtime.active_fractal?.name || "Fractal";

      if (validationResult.violated) {
        final_meta.sino_logic_violation = true;
      }

      await session_driver.log_turn(validationResult.text, character_name, role, {
        id: nodeId,
        dynamics: final_meta.ai,
        fractal_dynamics: final_meta.fractal,
        flags: final_meta.flags,
        signal_prompts: final_meta.signal_prompts,
        signals: final_meta.signals,
        vectors: final_meta.vectors,
        round: runtime.round,
        turn_type: "AI_TURN",
        sino_logic_violation: final_meta.sino_logic_violation,
      });
      // 8. TRANSITION: Open the window for User
      runtime.turn_type = "USER_TURN";

      // Cleanly end the active generation stream before we trigger memory consolidation (which takes time)
      app.end_stream();
      simulationState.complete(); // Ensure typing indicator clears instantly before consolidate runs

      // 9. HOUSEKEEPING: Trigger narrative control (MemoryEngine) if needed
      await temporal_engine.consolidate(session_driver, db, entities, runtime, app);

      return { response: validationResult.text, meta: final_meta };
    } finally {
      app.busy = false;
      app.end_stream();
      // CRITICAL OVERRIDE: Unlock engine stasis
      if (typeof simulationState !== "undefined") {
        simulationState.phase = "idle";
      }
    }
  },
  /**
   * EXECUTE PROLOGUE
   * Specialized turn for starting a new story.
   * @param {string} story_id
   */
  async execute_prologue(story_id) {
    app.busy = true;
    try {
      const payload = await context_broker.hydrate("", "prologue");
      const result = prompt_builder.synthesize(payload, {});
      if (!result.system) return null;
      app.log("gamemaster: Generating prologue...", "system");
      const nodeId = generateUUID();
      const response = await this.execute_with_retry(async () => {
        return await llm_service.generate({
          system: result.system,
          role: "fractal",
          node_id: nodeId,
        });
      });
      const fractal_name = runtime.active_fractal?.name || "Fractal Entity";
      // 1. Save Prologue
      // Prologue stays at Round 0
      runtime.round = 0;
      runtime.turn_type = "SYSTEM_TURN";
      await session_driver.log_turn(response, fractal_name, "fractal", {
        id: nodeId,
        round: 0,
        turn_type: "SYSTEM_TURN",
      });
      app.log("gamemaster: Prologue established (Round 0).", "system");

      // Cleanly end the prologue fractal stream before initiating the AI follow-up hook
      app.end_stream();

      // 2. The Hook: Trigger immediate AI follow-up to open the scene.
      // Ensure we transition simulationState to 'ai' role for the hook.
      return await this.execute_turn(story_id, { role: "ai" });
    } finally {
      app.busy = false;
      app.end_stream();
      // CRITICAL OVERRIDE: Unlock engine stasis
      if (typeof simulationState !== "undefined") {
        simulationState.phase = "idle";
      }
    }
  },
  /**
   * EXECUTE EPILOGUE
   * Final summary or conclusion for a story.
   * @param {string} story_id
   */
  async execute_epilogue(story_id) {
    const clean_entities = runtime.snapshot_entities;
    const current_dynamics = {
      ai: runtime.ai || { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
      fractal: runtime.fractal || { velocity: 50, entropy: 50 },
    };
    const raw_messages = await session_driver.load_log(story_id);
    const recent_history = raw_messages.slice(-10);

    const { system } = prompt_builder.build_epilogue(
      clean_entities,
      current_dynamics,
      recent_history,
    );
    if (!system) return null;
    app.log("gamemaster: Generating epilogue...", "system");
    const nodeId = generateUUID();
    const response = await this.execute_with_retry(async () => {
      return await llm_service.generate({ system, role: "ai", node_id: nodeId });
    });
    await session_driver.log_turn(response, "Narrator", "ai", { id: nodeId });
    app.end_stream();
    return response;
  },
  /**
   * INTERNAL: Execute with exponential backoff retry.
   * @param {() => Promise<any>} fn
   * @returns {Promise<any>}
   */
  async execute_with_retry(fn, retries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (err) {
      if (retries <= 0) throw err;
      app.log(
        `gamemaster: Connection issue. Retrying in ${delay}ms... (${retries} attempts left)`,
        "warn",
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return await this.execute_with_retry(fn, retries - 1, delay * 2);
    }
  },
};
