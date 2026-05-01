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
export const gamemaster = {
  /**
   * THE MECHANICAL GATE
   * Translates raw dynamical thresholds into narrative directives.
   */
  generate_narrative_bridges(state) {
    const bridges = [...(state.signal_prompts || [])];

    // Entropy / Reality Stability
    if (state.fractal?.dynamics?.entropy > 80) {
      bridges.push(
        "CRITICAL: Structural reality is collapsing. Describe environmental glitches and non-linear decay.",
      );
    }

    // AI Somatics
    if (state.ai?.dynamics?.intensity > 85) {
      bridges.push(
        "CONDITION: The AI Character is hyper-adrenalized. Use short, sharp, sensory-heavy sentences.",
      );
    }

    // Low Openness / Guarded
    if (state.ai?.dynamics?.openness < 20) {
      bridges.push(
        "MECHANIC: The character is emotionally sealed. Deflect personal questions and maintain cold distance.",
      );
    }

    return bridges;
  },

  /**
   * CAPTURE DYNAMICS DELTA
   * Detects changes in entity dynamics and logs a telemetry entry.
   */
  async capture_dynamics_delta(snapshot) {
    const deltas = [];

    // AI Deltas
    if (snapshot.ai?.dynamics) {
      Object.entries(snapshot.ai.dynamics).forEach(([axis, val]) => {
        const old_val = runtime.ai[axis] ?? 50;
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
        const old_val = runtime.fractal[axis] ?? 50;
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
   * @param {Object} options
   * @param {string} [options.input] - User input to react to.
   * @param {string} [options.role="ai"] - Role to generate for.
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
    const payload = await context_broker.hydrate(input, "simulation", simulation_log);
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
    const response = await this._execute_with_retry(async () => {
      return await llm_service.generate(
        {
          system,
          messages: simulation_log,
          role,
        },
        llm_options,
      );
    });
    // 7. PERSISTENCE: Save the result
    const character_name =
      role === "ai" ? runtime.active_ai?.name || "AI" : runtime.active_fractal?.name || "Fractal";

    await session_driver.log_turn(response, character_name, role, {
      dynamics: meta.ai,
      fractal_dynamics: meta.fractal,
      flags: meta.flags,
      signal_prompts: meta.signal_prompts,
      signals: meta.signals,
      vectors: meta.vectors,
      round: runtime.round,
      turn_type: "AI_TURN",
    });
    // 8. TRANSITION: Open the window for User
    runtime.turn_type = "USER_TURN";

    // 9. HOUSEKEEPING: Trigger narrative control (MemoryEngine) if needed
    await temporal_engine.consolidate(session_driver, db, entities, runtime, app);

    return { response, meta };
  },
  /**
   * EXECUTE PROLOGUE
   * Specialized turn for starting a new story.
   */
  async execute_prologue(story_id) {
    const payload = await context_broker.hydrate("", "prologue");
    const result = prompt_builder.synthesize(payload, {});
    if (!result.system) return null;
    app.log("gamemaster: Generating prologue...", "system");
    const response = await this._execute_with_retry(async () => {
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
   */
  async execute_epilogue(story_id) {
    const { system } = prompt_builder.build_epilogue();
    if (!system) return null;
    app.log("gamemaster: Generating epilogue...", "system");
    const response = await this._execute_with_retry(async () => {
      return await llm_service.generate({ system, role: "ai" });
    });
    await session_driver.log_turn(response, "Narrator", "ai");
    return response;
  },
  /**
   * INTERNAL: Execute with exponential backoff retry.
   */
  async _execute_with_retry(fn, retries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (err) {
      if (retries <= 0) throw err;
      app.log(
        `gamemaster: Connection issue. Retrying in ${delay}ms... (${retries} attempts left)`,
        "warn",
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return await this._execute_with_retry(fn, retries - 1, delay * 2);
    }
  },
};
