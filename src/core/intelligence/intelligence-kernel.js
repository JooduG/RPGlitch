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
import { context_broker } from "@core/intelligence/context-broker.js";
import { dynamics_engine } from "@core/intelligence/dynamics-engine.js";
import { prompt_builder } from "@core/intelligence/prompt-builder.js";
import { llm_service } from "@core/intelligence/llm-service.js";
import { runtime } from "@state/runtime.svelte.js";
import { app } from "@state/app.svelte.js";
import { temporal_engine } from "@core/intelligence/temporal-engine.js";
import { db } from "@data/db.js";
import { simulationState } from "@state/status.svelte.js";
import { entities } from "@data/repository.js";
import { session_driver } from "@core/engine/session-driver.svelte.js";
/**
 * @typedef {import('@core/engine/engine.js').GenerationOptions} GenerationOptions
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
   * THE MECHANICAL GATE
   * Translates raw dynamical thresholds into narrative directives.
   * @param {{ ai?: any; fractal?: any; flags?: string[]; signals?: Record<string, any>; signal_prompts: any; contributors?: Record<string, string[]>; key?: Record<string, any> | undefined; }} state
   */
  generate_narrative_bridges(state) {
    const bridges = [...(state.signal_prompts || [])];

    // Entropy / Reality Stability
    if (state.fractal?.dynamics?.entropy > 80) {
      bridges.push(
        "The environmental geometry is unstable. Weave sensory descriptions of physical glitches and non-linear decay directly into the background texture.",
      );
    }

    // AI Somatics
    if (state.ai?.dynamics?.intensity > 85) {
      bridges.push(
        "The pacing is high-adrenaline. Express this intensity strictly through short sentences and immediate sensory physics.",
      );
    }

    // Low Openness / Guarded
    if (state.ai?.dynamics?.openness < 20) {
      bridges.push(
        "The character maintains cold distance, naturally deflecting personal inquiries within their dialogue.",
      );
    }

    return bridges;
  },

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
    simulationState.start_generation(role);

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
    // 3. SIMULATION: Resolve physics and behaviors
    const snapshot = dynamics_engine.simulate(payload);

    // 3.1 TELEMETRY: Capture deltas before runtime update
    await this.capture_dynamics_delta(snapshot);

    // 3.5. MECHANICAL GATE: Inject GM bridges
    const gm_bridges = this.generate_narrative_bridges(snapshot);
    snapshot.signal_prompts = [...(snapshot.signal_prompts || []), ...gm_bridges];

    // 4. SYNTHESIS: Build the final prompt
    const { system, meta } = prompt_builder.synthesize(payload, snapshot);
    // 5. UPDATE: Synchronize runtime physics
    runtime.ai = snapshot.ai.dynamics;
    runtime.fractal = snapshot.fractal.dynamics;
    runtime.turn_type = "AI_TURN";
    app.log(
      "gamemaster: Context hydrated. Physics resolved. Entering AI_TURN. Routing to LLM...",
      "system",
    );
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
    // 6.5. POST-GENERATION SCAN: Scan AI response to trigger further physics mutations
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

      // Capture and log the dynamics delta for this post-generation pass
      await this.capture_dynamics_delta(post_snapshot);

      // Sync the post-generation settled physics to runtime
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

    // 9. HOUSEKEEPING: Trigger narrative control (MemoryEngine) if needed
    await temporal_engine.consolidate(session_driver, db, entities, runtime, app);

    return { response: validationResult.text, meta: final_meta };
  },
  /**
   * EXECUTE PROLOGUE
   * Specialized turn for starting a new story.
   * @param {string} story_id
   */
  async execute_prologue(story_id) {
    const payload = await context_broker.hydrate("", "prologue");
    const result = prompt_builder.synthesize(payload, {});
    if (!result.system) return null;
    app.log("gamemaster: Generating prologue...", "system");
    const response = await this.execute_with_retry(async () => {
      return await llm_service.generate({ system: result.system, role: "fractal" });
    });
    const fractal_name = runtime.active_fractal?.name || "Fractal Entity";
    // 1. Save Prologue
    // Prologue stays at Round 0
    runtime.round = 0;
    runtime.turn_type = "SYSTEM_TURN";
    await session_driver.log_turn(response, fractal_name, "fractal", {
      round: 0,
      turn_type: "SYSTEM_TURN",
    });
    app.log("gamemaster: Prologue established (Round 0).", "system");
    // 2. The Hook: Trigger immediate AI follow-up to open the scene.
    // Ensure we transition simulationState to 'ai' role for the hook.
    return await this.execute_turn(story_id, { role: "ai" });
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
    const response = await this.execute_with_retry(async () => {
      return await llm_service.generate({ system, role: "ai" });
    });
    await session_driver.log_turn(response, "Narrator", "ai");
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
