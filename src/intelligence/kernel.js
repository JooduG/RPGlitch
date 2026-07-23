/**
 * @file src/intelligence/kernel.js
 * -----------------------------------------------------------------------------
 * gamemaster — The Intelligence Kernel Coordinator
 * -----------------------------------------------------------------------------
 * Unifies the Intelligence Kernel (Broker, Dynamics, Builder) and the
 * Transport Layer (llm_service) into a single execution pipeline.
 */

import { db, entities, prune } from "@data";
import { generateUUID, session_driver } from "@engine";
import { visual_engine } from "@media";
import { llm_service, Security } from "@platform";
import { app, runtime, simulationState } from "@state";
import { context_broker } from "./context.svelte.js";
import { dynamics_engine } from "./dynamics.js";
import { escape_unescaped_json_quotes, extract_json_block, parse_think_block, strip_cognition_blocks } from "./parser.js";
import { prompt_builder } from "./prompts.js";
import { temporal_engine } from "./temporal.js";

/**
 * @typedef {import('@engine/kernel.js').GenerationOptions} GenerationOptions
 */

/**
 * Helper to extract Director's JSON from a raw string.
 * @param {string} raw_text
 * @returns {any}
 */
function parse_director_json(raw_text) {
  if (!raw_text || !raw_text.trim()) return null;

  const json_string = extract_json_block(raw_text);
  if (!json_string) {
    const stripped = raw_text.replace(/```json\n?|```/g, "").trim();
    console.warn("[GameMaster] Director JSON missing brackets, falling back to raw prose.");
    app.log("[GameMaster] Director JSON missing brackets — using raw prose fallback", "warn");
    const extractedThink = parse_think_block(stripped).think;
    return { internal_monologue: extractedThink || stripped, _parse_error: true };
  }

  const cleaned_json = escape_unescaped_json_quotes(json_string);
  const sanitized_json = cleaned_json.replace(/:\s*\+([0-9]+(?:\.[0-9]+)?)/g, ": $1");

  try {
    const payload = JSON.parse(sanitized_json);
    if (payload.prose) {
      delete payload.prose;
    }
    return payload;
  } catch (parse_err) {
    console.warn("[GameMaster] Director JSON invalid, falling back to raw prose:", parse_err);
    app.log("[GameMaster] Director JSON parse failed — using raw prose fallback", "warn");
    const stripped = raw_text.replace(/```json\n?|```/g, "").trim();
    const extractedThink = parse_think_block(stripped).think;
    return { internal_monologue: extractedThink || stripped, _parse_error: true };
  }
}

/**
 * Synchronous post-turn validation and repair layer.
 * Automatically closes truncated `<think>` blocks and strips Chinese characters from narrative prose
 * without removing spaces or corrupting sentence formatting.
 * @param {string} response
 * @returns {{ text: string; violated: boolean; refused: boolean; structural_repair: boolean }}
 */
function validate_and_repair_response(response) {
  const result = { text: response || "", violated: false, refused: false, structural_repair: false };

  if (Security.checkRefusal(response)) {
    result.refused = true;
    return result;
  }

  try {
    let text = result.text;

    // 1. Tag Closure Pass
    const thinkOpeners = (text.match(/<think>/gi) || []).length;
    const thinkClosers = (text.match(/<\/think>/gi) || []).length;
    if (thinkOpeners > thinkClosers) {
      text += "</think>";
      result.structural_repair = true;
    }

    // 2. Chinese Bleed Parsing: Isolate narrative prose from think blocks
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

      if (inThinkBlock) {
        return segment;
      }

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
    console.warn("[GameMaster] Validation check failed:", err);
    result.text = response || "";
    result.violated = false;
  }
  return result;
}

/**
 * Computes dynamics deltas for a single target (ai or fractal) and appends to accumulators.
 * @param {string} target
 * @param {Record<string, number>} dynamics
 * @param {any} runtimeTarget
 * @param {any} contributors
 * @param {string} contributorPrefix
 * @param {any[]} deltas
 * @param {string[]} log_strings
 */
function compute_deltas(target, dynamics, runtimeTarget, contributors, contributorPrefix, deltas, log_strings) {
  Object.entries(dynamics).forEach(([axis, val]) => {
    const old_val = /** @type {any} */ (runtimeTarget)?.[axis] ?? 50;
    const diff = val - old_val;
    if (diff !== 0) {
      let cause = contributors?.[`${contributorPrefix}.${axis}`]?.join(", ") || "GM";
      if (cause === "GM") cause = null;

      deltas.push({ axis, target, old_val, new_val: val, diff, cause });

      const capitalizedAxis = axis.charAt(0).toUpperCase() + axis.slice(1);
      log_strings.push(`${capitalizedAxis} ${diff > 0 ? "+" : ""}${diff}`);
    }
  });
}

export const gamemaster = {
  /**
   * CAPTURE DYNAMICS DELTA
   * Detects changes in entity dynamics and logs a telemetry entry.
   * @param {any} snapshot
   * @param {any} [meta]
   */
  async capture_dynamics_delta(snapshot, meta = null) {
    const deltas = [];
    const log_strings = [];

    if (snapshot.ai?.dynamics) {
      compute_deltas("ai", snapshot.ai.dynamics, runtime.ai, snapshot.contributors, "AI", deltas, log_strings);
    }

    if (snapshot.fractal?.dynamics) {
      compute_deltas("fractal", snapshot.fractal.dynamics, runtime.fractal, snapshot.contributors, "FRACTAL", deltas, log_strings);
    }

    const active_signals = Object.keys(snapshot.signals || {});

    if (deltas.length > 0 || meta) {
      await session_driver.log_system_entry(log_strings.length > 0 ? log_strings.join(" | ") : "Simulation Telemetry Snapshot", "system", {
        type: "DYNAMICS_DELTA",
        deltas,
        ai: snapshot.ai?.dynamics,
        ai_name: snapshot.ai?.name || runtime.active_ai?.name,
        fractal: snapshot.fractal?.dynamics,
        fractal_name: snapshot.fractal?.name || runtime.active_fractal?.name,
        vectors: meta?.vectors,
        mutations: meta?.mutations,
        signals: active_signals,
        signal_prompts: meta?.signal_prompts,
        flags: meta?.flags,
      });
    }
  },

  /**
   * EXECUTE TURN
   * The primary simulation loop for a narrative turn.
   * @param {string} story_id
   * @param {GenerationOptions} [options]
   * @returns {Promise<{ response: string, meta: any }>}
   */
  async execute_turn(story_id, options = {}) {
    const { input = "", role = "ai", ...llm_options } = options;
    app.busy = true;

    try {
      simulationState.start_generation(role);
      const nodeId = generateUUID();

      // 1. CHRONO: Round management
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

      if (input && simulation_log.length > 0) {
        const last = simulation_log[simulation_log.length - 1];
        if (last.role === "user" && last.content.trim() === input.trim()) {
          simulation_log.pop();
        }
      }

      const payload = await context_broker.hydrate(input || "", "simulation", simulation_log);
      payload.meta = payload.meta || {};
      payload.meta.structural_errors = runtime.structural_errors || 0;

      // 3. SIMULATION: Evaluate world physics snapshot prior to generation
      const snapshot = {
        ai: { dynamics: { ...(runtime.ai || {}) } },
        fractal: { dynamics: { ...(runtime.fractal || {}) } },
        flags: [],
        signals: {},
        signal_prompts: [],
      };

      dynamics_engine.settle_physics(
        snapshot.ai.dynamics,
        dynamics_engine._get_baselines(payload.entities.AI),
        snapshot.fractal.dynamics?.entropy || 50,
      );
      dynamics_engine.settle_physics(
        snapshot.fractal.dynamics,
        dynamics_engine._get_baselines(payload.entities.FRACTAL),
        snapshot.fractal.dynamics?.entropy || 50,
      );

      snapshot.pruned_past = {
        AI: prune(payload.entities.AI?.past, "past"),
        USER: prune(payload.entities.USER?.past, "past"),
        FRACTAL: prune(payload.entities.FRACTAL?.past, "past"),
      };
      snapshot.pruned_future = {
        AI: prune(payload.entities.AI?.future, "future"),
        USER: prune(payload.entities.USER?.future, "future"),
        FRACTAL: prune(payload.entities.FRACTAL?.future, "future"),
      };

      // 4. DIRECTOR PASS (Shot 1)
      app.log("[GameMaster] Context hydrated. Physics resolved. Entering DIRECTOR_TURN...", "system");
      const directorPrompt = prompt_builder.build_director_prompt(payload, snapshot);

      const directorRaw = await this.execute_with_retry(
        async () => {
          return await llm_service.generate(
            {
              system: directorPrompt.system,
              task: directorPrompt.task,
              messages: [],
              role: "system",
              node_id: nodeId + "-director",
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

      let directorText = "";
      if (typeof directorRaw === "string") {
        directorText = directorRaw.trim();
      } else if (directorRaw && typeof directorRaw === "object") {
        directorText = String(directorRaw.generatedText ?? directorRaw.text ?? "").trim();
      }

      const directorData = parse_director_json(directorText) || {};

      // 4.1 Apply State Mutations
      if (directorData.mutations) {
        if (directorData.mutations.AI_CHARACTER && runtime.active_ai) {
          temporal_engine.apply_state_mutations(runtime.active_ai, directorData.mutations.AI_CHARACTER);
          if (directorData.mutations.AI_CHARACTER.dynamics_deltas) {
            if (!snapshot.ai) snapshot.ai = {};
            if (!snapshot.ai.dynamics) snapshot.ai.dynamics = { ...runtime.ai };
            Object.entries(directorData.mutations.AI_CHARACTER.dynamics_deltas).forEach(([k, delta]) => {
              const val = Number(delta);
              if (!isNaN(val)) {
                const current = snapshot.ai.dynamics[k] || 50;
                snapshot.ai.dynamics[k] = Math.max(1, Math.min(100, current + val));
              }
            });
          }
        }

        if (directorData.mutations.USER_PERSONA && runtime.active_user) {
          temporal_engine.apply_state_mutations(runtime.active_user, directorData.mutations.USER_PERSONA);
        }

        if (directorData.mutations.FRACTAL && runtime.active_fractal) {
          temporal_engine.apply_state_mutations(runtime.active_fractal, directorData.mutations.FRACTAL);
          if (directorData.mutations.FRACTAL.dynamics_deltas) {
            if (!snapshot.fractal) snapshot.fractal = {};
            if (!snapshot.fractal.dynamics) snapshot.fractal.dynamics = { ...runtime.fractal };
            Object.entries(directorData.mutations.FRACTAL.dynamics_deltas).forEach(([k, delta]) => {
              const val = Number(delta);
              if (!isNaN(val)) {
                const current = snapshot.fractal.dynamics[k] || 50;
                snapshot.fractal.dynamics[k] = Math.max(1, Math.min(100, current + val));
              }
            });
          }
        }
      }

      // 4.5. PHYSICS SYNC & TELEMETRY
      const characterPrompt = prompt_builder.build_character_prompt(payload, snapshot, directorData);
      const meta = characterPrompt.meta;

      let final_meta = { ...meta };
      final_meta.ai = snapshot.ai?.dynamics;
      final_meta.fractal = snapshot.fractal?.dynamics;
      final_meta.flags = snapshot.flags;
      final_meta.signals = snapshot.signals;
      final_meta.mutations = directorData.mutations;

      await this.capture_dynamics_delta(snapshot, final_meta);

      runtime.ai = snapshot.ai?.dynamics;
      runtime.fractal = snapshot.fractal?.dynamics;

      // 5. TRANSITION & LOGGING
      app.log("[GameMaster] Routing to LLM (Character Pass)...", "system");
      runtime.turn_type = "AI_TURN";

      let directorMonologue = "";
      if (directorData.internal_monologue) {
        const cleanMonologue = String(directorData.internal_monologue)
          .replace(/<\/?think>/gi, "")
          .trim();
        let thinkContent = `## Cognition\n${cleanMonologue}`;
        if (directorData.intent)
          thinkContent += `\n\n## Intent\n${String(directorData.intent)
            .replace(/<\/?think>/gi, "")
            .trim()}`;
        if (directorData.somatic_tells)
          thinkContent += `\n\n## Somatic Tells\n${String(directorData.somatic_tells)
            .replace(/<\/?think>/gi, "")
            .trim()}`;
        if (directorData.dialogue_direction)
          thinkContent += `\n\n## Dialogue Direction\n${String(directorData.dialogue_direction)
            .replace(/<\/?think>/gi, "")
            .trim()}`;
        directorMonologue = `<think>\n${thinkContent}\n</think>\n\n`;
      }

      if (directorMonologue) {
        app.streaming.content = directorMonologue;
        app.streaming.text = directorMonologue;
        if (typeof llm_options.onToken === "function") {
          llm_options.onToken(directorMonologue);
        }
      }

      // 6. GENERATION: Call the model with retry logic
      const validationResult = await this.execute_with_retry(
        async () => {
          const { top_p, repetition_penalty, max_tokens, model, onToken, json, signal, silent, raw } = llm_options;
          let temperature = llm_options.temperature || 0.8;

          const rawChaos = payload.entities.AI?.dynamics?.chaos;
          if (typeof rawChaos === "number" && !isNaN(rawChaos)) {
            const chaos = Math.max(0, Math.min(100, rawChaos));
            temperature = 0.4 + chaos * 0.008;
          }

          const generated_text = await llm_service.generate(
            {
              system: characterPrompt.system,
              task: characterPrompt.task,
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

          let clean_generated = generated_text || "";
          if (directorMonologue && clean_generated.trim().startsWith("<think>")) {
            clean_generated = clean_generated.replace(/^<think>[\s\S]*?<\/think>\s*/i, "");
          }
          const full_text = directorMonologue + clean_generated;

          const vResult = validate_and_repair_response(full_text);
          if (vResult.refused) {
            app.streaming.content = "";
            app.streaming.text = "";
            throw new Error("AI_REFUSAL_DETECTED");
          }
          return vResult;
        },
        2,
        1000,
      );

      // 6.5. POST-GENERATION PIPELINE
      if (validationResult.violated || validationResult.structural_repair) {
        runtime.structural_errors = (runtime.structural_errors || 0) + 1;
      } else {
        runtime.structural_errors = Math.max(0, (runtime.structural_errors || 0) - 1);
      }

      // 7. PERSISTENCE: Save the result
      const character_name = role === "ai" ? runtime.active_ai?.name || "AI" : runtime.active_fractal?.name || "Fractal";

      if (validationResult.violated) {
        final_meta.sino_logic_violation = true;
      }
      final_meta.structural_errors = runtime.structural_errors;

      await session_driver.log_message(validationResult.text, role, character_name, "AI_TURN", {
        id: nodeId,
        round: runtime.round,
        sino_logic_violation: final_meta.sino_logic_violation,
      });

      // 8. TRANSITION: Open the window for User
      runtime.turn_type = "USER_TURN";

      app.end_stream();
      simulationState.complete();

      app.busy = false;
      simulationState.phase = "idle";

      await temporal_engine.consolidate(session_driver, db, entities, runtime, app);
      return { response: validationResult.text, meta: final_meta };
    } finally {
      app.busy = false;
      app.end_stream();
      if (typeof simulationState !== "undefined") {
        simulationState.phase = "idle";
      }
    }
  },

  /**
   * EXECUTE PROLOGUE
   * Specialized turn for starting a new story.
   * @param {string} story_id
   * @returns {Promise<any>}
   */
  async execute_prologue(story_id) {
    app.busy = true;
    try {
      const payload = await context_broker.hydrate(app.prologue || "", "prologue");
      const result = prompt_builder.synthesize(payload, {});
      if (!result.system) return null;

      app.log("[GameMaster] Generating prologue...", "system");
      const nodeId = generateUUID();

      const response = await this.execute_with_retry(async () => {
        return await llm_service.generate({
          system: result.system,
          task: result.task,
          role: "fractal",
          node_id: nodeId,
        });
      });

      const fractal_name = runtime.active_fractal?.name || "Fractal Entity";

      runtime.round = 0;
      runtime.turn_type = "SYSTEM_TURN";

      await session_driver.log_message(
        response,
        "fractal",
        fractal_name,
        "SYSTEM_TURN",
        {
          id: nodeId,
          round: 0,
          is_prologue: true,
        },
        [{ src: null, metadata: {} }],
      );
      app.log("[GameMaster] Prologue established (Round 0).", "system");

      app.end_stream();

      const imagePromise = visual_engine
        ? visual_engine
            .visualize(story_id, response, "characters", { silent: true })
            .then((imgResult) => {
              if (imgResult?.imageUrl) {
                session_driver.update_log_attachment(nodeId, 0, {
                  src: imgResult.imageUrl,
                  metadata: imgResult.metadata,
                });
              }
            })
            .catch((err) => {
              console.warn("[Prologue Image Error]", err);
            })
        : Promise.resolve();

      const turnPromise = this.execute_turn(story_id, { role: "ai", is_opening_turn: true });

      await Promise.all([imagePromise, turnPromise]);
      return await turnPromise;
    } finally {
      app.busy = false;
      app.end_stream();
      if (typeof simulationState !== "undefined") {
        simulationState.phase = "idle";
      }
    }
  },

  /**
   * EXECUTE EPILOGUE
   * Final summary or conclusion for a story.
   * @param {string} story_id
   * @returns {Promise<string | null>}
   */
  async execute_epilogue(story_id) {
    const clean_entities = runtime.snapshot_entities;
    const current_dynamics = {
      ai: runtime.ai || { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
      fractal: runtime.fractal || { velocity: 50, entropy: 50 },
    };
    const raw_messages = await session_driver.load_log(story_id);
    const recent_history = raw_messages.slice(-10);

    const { system, task } = prompt_builder.build_epilogue(clean_entities, current_dynamics, recent_history);
    if (!system) return null;

    app.log("[GameMaster] Generating epilogue...", "system");
    const nodeId = generateUUID();
    const fractal_name = runtime.active_fractal?.name || "Fractal Entity";

    const response = await this.execute_with_retry(async () => {
      return await llm_service.generate({ system, task, role: "fractal", node_id: nodeId });
    });

    let epilogueAttachments = [];
    if (visual_engine) {
      try {
        const imgResult = await visual_engine.visualize(story_id, response, "fractal");
        if (imgResult?.imageUrl) {
          epilogueAttachments = [{ src: imgResult.imageUrl, metadata: imgResult.metadata }];
        }
      } catch (err) {
        console.warn("[Epilogue Image Error]", err);
      }
    }

    await session_driver.log_message(
      response,
      "fractal",
      fractal_name,
      "SYSTEM_TURN",
      {
        id: nodeId,
        is_epilogue: true,
      },
      epilogueAttachments,
    );
    app.end_stream();
    return response;
  },

  /**
   * EXECUTE GHOSTWRITER
   * Compiles and executes a Ghostwriter prompt on behalf of the User Persona.
   * @param {string} [input_text=""]
   * @returns {Promise<string>}
   */
  async execute_ghostwriter(input_text = "") {
    const story_id = runtime.story_id;
    const raw_messages = story_id ? await session_driver.load_log(story_id) : [];
    const simulation_log = raw_messages
      .filter((m) => !m.meta?.consolidated && m.role !== "system")
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        content: m.text || m.content || "",
        character_name: m.character_name,
      }));
    const payload = await context_broker.hydrate(input_text || "", "simulation", simulation_log);
    const ghostPrompt = prompt_builder.build_ghostwriter(payload.entities, input_text);

    const result = await llm_service.generate(
      {
        system: ghostPrompt.system,
        task: ghostPrompt.task,
        messages: [],
        role: "user",
      },
      { silent: true },
    );

    const cleanResult = strip_cognition_blocks(typeof result === "string" ? result : result?.text || "").trim();
    return cleanResult;
  },

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
      if (retries === 0) throw error;
      app.log(`[GameMaster] Connection issue. Retrying in ${delay}ms... (${retries} attempts left)`, "warn");

      if (app.streaming.active) {
        app.streaming.content = "";
        app.streaming.text = "_Network interrupted... Retrying connection..._";
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      const baseDelay = delay * 2;
      const jitteredSleepTime = baseDelay * (0.75 + Math.random() * 0.5);
      return await this.execute_with_retry(fn, retries - 1, jitteredSleepTime);
    }
  },
};
