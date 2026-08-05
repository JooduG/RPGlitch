/**
 * @file src/intelligence/kernel.js
 * -----------------------------------------------------------------------------
 * gamemaster — The Intelligence Kernel Coordinator
 * -----------------------------------------------------------------------------
 * Unifies the Intelligence Kernel (Broker, Dynamics, Builder) and the
 * Transport Layer (llm_service) into a single execution pipeline.
 */

import { db, entities, prune } from "@data";
import { generate_uuid as generateUUID, state_bridge } from "@utils";
import { visual_engine } from "@media";
import { llm_service, Security } from "@platform";
import { IMAGE_TRIGGER } from "../engine/config.js";
import { context_broker } from "./context.svelte.js";
import { dynamics_engine, evaluate_image_trigger } from "./dynamics.js";
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
    state_bridge.app.log("[GameMaster] Director JSON missing brackets — using raw prose fallback", "warn");
    const extracted_think = parse_think_block(stripped).think;
    return { internal_monologue: extracted_think || stripped, _parse_error: true };
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
    state_bridge.app.log("[GameMaster] Director JSON parse failed — using raw prose fallback", "warn");
    const stripped = raw_text.replace(/```json\n?|```/g, "").trim();
    const extracted_think = parse_think_block(stripped).think;
    return { internal_monologue: extracted_think || stripped, _parse_error: true };
  }
}

/**
 * Resolves the Director's `trigger_image` value into a concrete visual tier.
 * `true` → "scene" (the general moment); a valid tier string is passed through;
 * anything else → null (no explicit image request).
 * @param {any} val
 * @returns {string | null}
 */
function resolve_director_image_tier(val) {
  if (val === true || val === "true" || val === 1) return "scene";
  if (typeof val === "string" && IMAGE_TRIGGER.tiers.includes(val.trim())) return val.trim();
  return null;
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

  if (Security.check_refusal(response)) {
    result.refused = true;
    return result;
  }

  try {
    let text = result.text;

    // 1. Tag Closure Pass
    const think_openers = (text.match(/<think>/gi) || []).length;
    const think_closers = (text.match(/<\/think>/gi) || []).length;
    if (think_openers > think_closers) {
      text += "</think>";
      result.structural_repair = true;
    }

    // 2. Chinese Bleed Parsing: Isolate narrative prose from think blocks
    const split_regex = /(<\/think>|<think>)/i;
    const segments = text.split(split_regex);

    let in_think_block = false;
    const processed_segments = segments.map((segment) => {
      const lower = segment.toLowerCase();
      if (lower === "<think>") {
        in_think_block = true;
        return segment;
      }
      if (lower === "</think>") {
        in_think_block = false;
        return segment;
      }

      if (in_think_block) {
        return segment;
      }

      const chinese_range = /[\u4e00-\u9fa5]/g;
      if (chinese_range.test(segment)) {
        result.violated = true;
        return segment.replace(chinese_range, "");
      }
      return segment;
    });

    if (result.violated) {
      state_bridge.app.log("SINO_LOGIC bleed intercepted", "warn");
    }

    result.text = processed_segments.join("");
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
 * @param {any[]} deltas
 * @param {string[]} log_strings
 */
function compute_deltas(target, dynamics, runtimeTarget, deltas, log_strings) {
  Object.entries(dynamics).forEach(([axis, val]) => {
    const old_value = /** @type {any} */ (runtimeTarget)?.[axis] ?? 50;
    const diff = val - old_value;
    if (diff !== 0) {
      deltas.push({ axis, target, old_value, new_value: val, diff });

      const capitalized_axis = axis.charAt(0).toUpperCase() + axis.slice(1);
      log_strings.push(`${capitalized_axis} ${diff > 0 ? "+" : ""}${diff}`);
    }
  });
}

/**
 * Builds one entity's normalized `updates` block for telemetry. Director fields
 * are renamed/merged into the display shape: `present_append_physical` /
 * `present_append_non_physical` → `present_mutations.{physical,non_physical}`,
 * `new_vectors` keep `content`/`type` but their `weight` becomes
 * `emotional_weight`, `resolve_vectors` → `vectors.resolved`, `dynamics_deltas`
 * is dropped (the computed `dynamics` array already carries old/new/diff per
 * axis). Returns null when the entity carries no content so the dump stays lean.
 * @param {string|null} name
 * @param {any} mutations
 * @param {any[]} dynamics
 * @param {any[]} retrieval
 * @returns {any}
 */
function build_update_entry(name, mutations, dynamics, retrieval) {
  const entry = {};
  if (name) entry.name = name;
  entry.present_mutations = {
    physical: mutations?.present_append_physical || "",
    non_physical: mutations?.present_append_non_physical || "",
  };
  entry.eternal_mutations = {
    physical: mutations?.eternal_mutations?.physical || "",
    non_physical: mutations?.eternal_mutations?.non_physical || "",
  };
  entry.vectors = {
    resolved: Array.isArray(mutations?.resolve_vectors) ? mutations.resolve_vectors : [],
    new: (Array.isArray(mutations?.new_vectors) ? mutations.new_vectors : []).map((v) => {
      const copy = { ...(v || {}) };
      copy.content = (copy.content || copy.directive || "").trim();
      delete copy.directive;
      copy.emotional_weight = copy.emotional_weight ?? copy.weight ?? 5;
      delete copy.weight;
      return copy;
    }),
  };
  if (retrieval?.length) entry.vectors.retrieval = retrieval;
  if (dynamics?.length) entry.dynamics = dynamics;

  const has_content =
    (dynamics?.length || 0) > 0 ||
    entry.present_mutations.physical.trim() ||
    entry.present_mutations.non_physical.trim() ||
    entry.eternal_mutations.physical.trim() ||
    entry.eternal_mutations.non_physical.trim() ||
    entry.vectors.resolved.length > 0 ||
    entry.vectors.new.length > 0 ||
    (entry.vectors.retrieval?.length || 0) > 0;
  return has_content ? entry : null;
}

/**
 * Normalizes scored retrieval vectors into the telemetry shape: single vectors
 * array, sorted by `_relevance` descending, internal embedding/scoring fields
 * stripped so the raw-meta dump stays readable (embeddings are 384-dim
 * Float32Arrays that JSON.stringify would expand into thousands of keys).
 * @param {any} vectors
 * @returns {any[]}
 */
function build_retrieval(vectors) {
  const clean = (v) => {
    if (!v || typeof v !== "object") return null;
    const copy = { ...v };
    delete copy._embedding;
    delete copy._semantic_score;
    delete copy._recency_factor;
    copy.type = copy.type || "past";
    copy.content = (copy.content || copy.directive || "").trim();
    delete copy.directive;
    copy.emotional_weight = copy.emotional_weight ?? copy.weight ?? 5;
    delete copy.weight;
    return copy;
  };
  return (Array.isArray(vectors) ? vectors : [])
    .map(clean)
    .filter(Boolean)
    .sort((a, b) => (b._relevance ?? -Infinity) - (a._relevance ?? -Infinity));
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
      compute_deltas("ai", snapshot.ai.dynamics, state_bridge.runtime.ai, deltas, log_strings);
    }

    if (snapshot.fractal?.dynamics) {
      compute_deltas("fractal", snapshot.fractal.dynamics, state_bridge.runtime.fractal, deltas, log_strings);
    }

    if (deltas.length > 0 || meta) {
      const mutations = meta?.mutations || {};
      const retrieval = build_retrieval(meta?.vectors);
      const dynamics_for = (target) =>
        deltas.filter((d) => d.target === target).map(({ axis, old_value, new_value, diff }) => ({ axis, old_value, new_value, diff }));

      const updates = {};

      const ai_entry = build_update_entry(
        snapshot.ai?.name || state_bridge.runtime.active_ai?.name,
        mutations.AI_CHARACTER,
        dynamics_for("ai"),
        retrieval,
      );
      if (ai_entry) updates.AI_CHARACTER = ai_entry;

      const user_entry = build_update_entry(state_bridge.runtime.active_user?.name, mutations.USER_PERSONA, [], []);
      if (user_entry) updates.USER_PERSONA = user_entry;

      const fractal_entry = build_update_entry(
        snapshot.fractal?.name || state_bridge.runtime.active_fractal?.name,
        mutations.FRACTAL,
        dynamics_for("fractal"),
        [],
      );
      if (fractal_entry) updates.FRACTAL = fractal_entry;

      await state_bridge.session_driver.log_system_entry(
        log_strings.length > 0 ? log_strings.join(" | ") : "Simulation Telemetry Snapshot",
        "system",
        {
          type: "DYNAMICS_DELTA",
          trigger_image: meta?.trigger_image === true,
          ...(meta?.auto_image ? { auto_image: meta.auto_image } : {}),
          ...(meta?.thoughts ? { thoughts: meta.thoughts } : {}),
          updates,
        },
      );
    }

    // Expose the raw deltas + the pure-JS image gate result so the kernel can
    // decide whether the dynamics movement warrants an automatic image.
    const image_signal = evaluate_image_trigger(deltas);
    return { deltas, image_signal };
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
    state_bridge.app.busy = true;

    try {
      state_bridge.simulation_state.start_generation(role);
      const node_id = generateUUID();

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

      const payload = await context_broker.hydrate(input || "", "simulation", simulation_log);
      payload.meta = payload.meta || {};
      payload.meta.structural_errors = state_bridge.runtime.structural_errors || 0;

      const scoring_context = prompt_builder.build_scoring_context(input, simulation_log);
      if (scoring_context) {
        await Promise.race([temporal_engine.precompute_context_embedding(scoring_context), new Promise((resolve) => setTimeout(resolve, 30000))]);
      }

      // 3. SIMULATION: Evaluate world physics snapshot prior to generation
      const snapshot = {
        ai: { dynamics: { ...(state_bridge.runtime.ai || {}) } },
        fractal: { dynamics: { ...(state_bridge.runtime.fractal || {}) } },
        flags: [],
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

      snapshot.pruned_vectors = {
        AI: prune(payload.entities.AI?.vectors),
        USER: prune(payload.entities.USER?.vectors),
        FRACTAL: prune(payload.entities.FRACTAL?.vectors),
      };

      // 4. DIRECTOR PASS (Shot 1)
      state_bridge.app.log("[GameMaster] Context hydrated. Physics resolved. Entering DIRECTOR_TURN...", "system");
      const director_prompt = prompt_builder.build_director_prompt(payload, snapshot);

      const director_raw = await this.execute_with_retry(
        async () => {
          return await llm_service.generate(
            {
              system: director_prompt.system,
              task: director_prompt.task,
              messages: [],
              role: "system",
              node_id: node_id + "-director",
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

      let director_text = "";
      if (typeof director_raw === "string") {
        director_text = director_raw.trim();
      } else if (director_raw && typeof director_raw === "object") {
        director_text = String(director_raw.generatedText ?? director_raw.text ?? "").trim();
      }

      const director_data = parse_director_json(director_text) || {};

      // 4.1 Apply State Mutations
      if (director_data.mutations) {
        if (director_data.mutations.AI_CHARACTER && state_bridge.runtime.active_ai) {
          temporal_engine.apply_state_mutations(state_bridge.runtime.active_ai, director_data.mutations.AI_CHARACTER, state_bridge.session_driver);
          if (director_data.mutations.AI_CHARACTER.dynamics_deltas) {
            if (!snapshot.ai) snapshot.ai = {};
            if (!snapshot.ai.dynamics) snapshot.ai.dynamics = { ...state_bridge.runtime.ai };
            Object.entries(director_data.mutations.AI_CHARACTER.dynamics_deltas).forEach(([k, delta]) => {
              const val = Number(delta);
              if (!isNaN(val)) {
                const current = snapshot.ai.dynamics[k] || 50;
                snapshot.ai.dynamics[k] = Math.max(1, Math.min(100, current + val));
              }
            });
          }
        }

        if (director_data.mutations.USER_PERSONA && state_bridge.runtime.active_user) {
          temporal_engine.apply_state_mutations(state_bridge.runtime.active_user, director_data.mutations.USER_PERSONA, state_bridge.session_driver);
        }

        if (director_data.mutations.FRACTAL && state_bridge.runtime.active_fractal) {
          temporal_engine.apply_state_mutations(state_bridge.runtime.active_fractal, director_data.mutations.FRACTAL, state_bridge.session_driver);
          if (director_data.mutations.FRACTAL.dynamics_deltas) {
            if (!snapshot.fractal) snapshot.fractal = {};
            if (!snapshot.fractal.dynamics) snapshot.fractal.dynamics = { ...state_bridge.runtime.fractal };
            Object.entries(director_data.mutations.FRACTAL.dynamics_deltas).forEach(([k, delta]) => {
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
      const character_prompt = prompt_builder.build_character_prompt(payload, snapshot, director_data);
      const meta = character_prompt.meta;

      let final_meta = { ...meta };
      final_meta.ai = snapshot.ai?.dynamics;
      final_meta.fractal = snapshot.fractal?.dynamics;
      final_meta.mutations = director_data.mutations;
      const director_tier = resolve_director_image_tier(director_data.trigger_image);
      final_meta.trigger_image = director_tier !== null;
      final_meta.auto_image = director_tier;

      const clean_think = (t) =>
        String(t || "")
          .replace(/<\/?think>/gi, "")
          .trim();
      const think_sections = [];
      if (director_data.internal_monologue) think_sections.push(`## Cognition\n${clean_think(director_data.internal_monologue)}`);
      if (director_data.intent) think_sections.push(`## Intent\n${clean_think(director_data.intent)}`);
      if (director_data.somatic_tells) think_sections.push(`## Somatic Tells\n${clean_think(director_data.somatic_tells)}`);
      if (director_data.dialogue_direction) think_sections.push(`## Dialogue Direction\n${clean_think(director_data.dialogue_direction)}`);
      if (director_data._thought_process) think_sections.push(`## Reasoning\n${clean_think(director_data._thought_process)}`);
      const think_content = think_sections.join("\n\n");
      if (think_content) final_meta.thoughts = think_content;

      // 4.6. AUTO IMAGE TRIGGER (Signal A + Signal B)
      // One shared cooldown for both sources: `last_auto_image_round` is
      // updated by whichever fires. The Director's explicit trigger may
      // bypass the cooldown (it is a deliberate call), but still resets it.
      // The pure-JS dynamics gate never bypasses it.
      const current_round = state_bridge.runtime.round ?? 0;
      const last_auto = state_bridge.runtime.last_auto_image_round ?? null;
      const cooldown_ok = last_auto == null || current_round - last_auto >= IMAGE_TRIGGER.cooldown_rounds;
      const telemetry = await this.capture_dynamics_delta(snapshot, final_meta);
      let auto_tier = director_tier;
      if (!auto_tier && cooldown_ok && telemetry?.image_signal?.fired) {
        auto_tier = "scene";
      }
      if (auto_tier) {
        state_bridge.runtime.last_auto_image_round = current_round;
      }
      final_meta.auto_image = auto_tier;

      state_bridge.runtime.ai = snapshot.ai?.dynamics;
      state_bridge.runtime.fractal = snapshot.fractal?.dynamics;

      // 5. TRANSITION & LOGGING
      state_bridge.app.log("[GameMaster] Routing to LLM (Character Pass)...", "system");
      state_bridge.runtime.turn_type = "AI_TURN";

      let director_monologue = director_data.internal_monologue && think_content ? `<think>\n${think_content}\n</think>\n\n` : "";

      if (director_monologue) {
        state_bridge.app.streaming.content = director_monologue;
        state_bridge.app.streaming.text = director_monologue;
        if (typeof llm_options.onToken === "function") {
          llm_options.onToken(director_monologue);
        }
      }

      // 6. GENERATION: Call the model with retry logic
      const validation_result = await this.execute_with_retry(
        async () => {
          const { top_p, repetition_penalty, max_tokens, model, onToken, json, signal, silent, raw } = llm_options;
          let temperature = llm_options.temperature || 0.8;

          const raw_chaos = payload.entities.AI?.dynamics?.chaos;
          if (typeof raw_chaos === "number" && !isNaN(raw_chaos)) {
            const chaos = Math.max(0, Math.min(100, raw_chaos));
            temperature = 0.4 + chaos * 0.008;
          }

          const generated_text = await llm_service.generate(
            {
              system: character_prompt.system,
              task: character_prompt.task,
              messages: simulation_log,
              role,
              node_id: node_id,
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
          if (director_monologue && clean_generated.trim().startsWith("<think>")) {
            clean_generated = clean_generated.replace(/^<think>[\s\S]*?<\/think>\s*/i, "");
          }
          const full_text = director_monologue + clean_generated;

          const v_result = validate_and_repair_response(full_text);
          if (v_result.refused) {
            state_bridge.app.streaming.content = "";
            state_bridge.app.streaming.text = "";
            throw new Error("AI_REFUSAL_DETECTED");
          }
          return v_result;
        },
        2,
        1000,
      );

      // 6.5. POST-GENERATION PIPELINE
      if (validation_result.violated || validation_result.structural_repair) {
        state_bridge.runtime.structural_errors = (state_bridge.runtime.structural_errors || 0) + 1;
      } else {
        state_bridge.runtime.structural_errors = Math.max(0, (state_bridge.runtime.structural_errors || 0) - 1);
      }

      // 7. PERSISTENCE: Save the result
      const character_name = role === "ai" ? state_bridge.runtime.active_ai?.name || "AI" : state_bridge.runtime.active_fractal?.name || "Fractal";

      if (validation_result.violated) {
        final_meta.sino_logic_violation = true;
      }
      final_meta.structural_errors = state_bridge.runtime.structural_errors;

      const log_entry = await state_bridge.session_driver.log_message(validation_result.text, role, character_name, {
        turn_type: "AI_TURN",
        meta: {
          id: node_id,
          round: state_bridge.runtime.round,
          sino_logic_violation: final_meta.sino_logic_violation,
        },
        ...(auto_tier
          ? {
              attachments: [{ src: null, metadata: { mode: auto_tier, auto: true } }],
            }
          : {}),
      });

      // 7.5. AUTO IMAGE GENERATION
      // Fire-and-forget: the null-src placeholder is already attached above;
      // let the image fill in asynchronously so the turn returns immediately.
      if (auto_tier && log_entry?.id && typeof visual_engine?.visualize === "function") {
        const auto_intent = strip_cognition_blocks(validation_result.text).trim() || input;
        visual_engine
          .visualize(story_id, auto_intent, auto_tier, { silent: true })
          .then((img_result) => {
            if (img_result?.imageUrl) {
              return state_bridge.session_driver.update_log_attachment(log_entry.id, 0, {
                src: img_result.imageUrl,
                metadata: {
                  ...(img_result.metadata || {}),
                  prompt: img_result.refinedPrompt || img_result.metadata?.prompt,
                  mode: auto_tier,
                  auto: true,
                },
              });
            }
            return null;
          })
          .catch((err) => {
            console.warn("[Auto Image Error]", err);
          });
      }

      // 8. TRANSITION: Open the window for User
      state_bridge.runtime.turn_type = "USER_TURN";

      state_bridge.app.end_stream();
      state_bridge.simulation_state.complete();

      state_bridge.app.busy = false;
      state_bridge.simulation_state.phase = "idle";

      await temporal_engine.consolidate(state_bridge.session_driver, db, entities, state_bridge.runtime, state_bridge.app);
      return { response: validation_result.text, meta: final_meta };
    } finally {
      state_bridge.app.busy = false;
      state_bridge.app.end_stream();
      if (state_bridge.simulation_state) {
        state_bridge.simulation_state.phase = "idle";
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
    state_bridge.app.busy = true;
    try {
      const prologue_input = state_bridge.app.prologue || "";
      const payload = await context_broker.hydrate(prologue_input, "prologue");
      // Semantic RAG: precompute the context embedding from the prologue's own
      // input so the narrator's PAST/FUTURE ranking (sync format → score) is
      // scored against the scene the user requested, not pure weight×recency.
      await Promise.race([temporal_engine.precompute_context_embedding(prologue_input), new Promise((resolve) => setTimeout(resolve, 30000))]);
      const result = prompt_builder.synthesize(payload, {});
      if (!result.system) return null;

      state_bridge.app.log("[GameMaster] Generating prologue...", "system");
      const node_id = generateUUID();

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

      const fractal_name = state_bridge.runtime.active_fractal?.name || "Fractal Entity";

      state_bridge.runtime.round = 0;
      state_bridge.runtime.turn_type = "SYSTEM_TURN";

      await state_bridge.session_driver.log_message(response, "fractal", fractal_name, {
        turn_type: "SYSTEM_TURN",
        meta: {
          id: node_id,
          round: 0,
          is_prologue: true,
        },
        attachments: [{ src: null, metadata: { mode: "story" } }],
      });
      state_bridge.app.log("[GameMaster] Prologue established (Round 0).", "system");

      state_bridge.app.end_stream();

      const image_promise = visual_engine
        ? visual_engine
            .visualize(story_id, strip_cognition_blocks(response), "story", { silent: true })
            .then((img_result) => {
              if (img_result?.imageUrl) {
                state_bridge.session_driver.update_log_attachment(node_id, 0, {
                  src: img_result.imageUrl,
                  metadata: {
                    ...(img_result.metadata || {}),
                    prompt: img_result.refinedPrompt || img_result.metadata?.prompt,
                    mode: "story",
                  },
                });
              }
            })
            .catch((err) => {
              console.warn("[Prologue Image Error]", err);
            })
        : Promise.resolve();

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
   * @returns {Promise<string | null>}
   */
  async execute_epilogue(story_id) {
    const clean_entities = state_bridge.runtime.snapshot_entities;
    const current_dynamics = {
      ai: state_bridge.runtime.ai || { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
      fractal: state_bridge.runtime.fractal || { velocity: 50, entropy: 50 },
    };
    const raw_messages = await state_bridge.session_driver.load_log(story_id);
    const recent_history = raw_messages.slice(-10);

    const { system, task } = prompt_builder.build_epilogue(clean_entities, current_dynamics, recent_history);
    if (!system) return null;

    state_bridge.app.log("[GameMaster] Generating epilogue...", "system");
    const node_id = generateUUID();
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
        const img_result = await visual_engine.visualize(story_id, strip_cognition_blocks(response), "story", { silent: true });
        if (img_result?.imageUrl) {
          epilogue_attachments = [
            {
              src: img_result.imageUrl,
              metadata: {
                ...(img_result.metadata || {}),
                prompt: img_result.refinedPrompt || img_result.metadata?.prompt,
                mode: "story",
              },
            },
          ];
        }
      } catch (err) {
        console.warn("[Epilogue Image Error]", err);
      }
    }

    await state_bridge.session_driver.log_message(response, "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      meta: {
        id: node_id,
        is_epilogue: true,
      },
      attachments: epilogue_attachments,
    });
    state_bridge.app.end_stream();
    return response;
  },

  /**
   * EXECUTE GHOSTWRITER
   * Compiles and executes a Ghostwriter prompt on behalf of the User Persona.
   * @param {string} [input_text=""]
   * @param {AbortSignal} [signal]
   * @returns {Promise<string>}
   */
  async execute_ghostwriter(input_text = "", signal = null) {
    const story_id = state_bridge.runtime.story_id;
    const raw_messages = story_id ? await state_bridge.session_driver.load_log(story_id) : [];
    const simulation_log = raw_messages
      .filter((m) => !m.meta?.consolidated && m.role !== "system")
      .map((m) => ({
        role: m.role === "user" ? "user" : m.role === "fractal" ? "fractal" : "model",
        content: m.text || m.content || "",
        character_name: m.character_name,
      }));
    const payload = await context_broker.hydrate(input_text || "", "simulation", simulation_log);
    const ghost_prompt = prompt_builder.build_ghostwriter(payload.entities, input_text);

    const result = await llm_service.generate(
      {
        system: ghost_prompt.system,
        task: ghost_prompt.task,
        messages: [],
        role: "user",
      },
      { silent: true, signal },
    );

    const clean_result = strip_cognition_blocks(typeof result === "string" ? result : result?.text || "").trim();
    return clean_result;
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
      // Never retry user-initiated interrupts — let them bubble up immediately.
      const is_abort =
        error?.name === "AbortError" || error?.message?.includes("aborted") || String(error) === "Error: Generation aborted by caller.";
      if (is_abort) throw error;
      if (retries === 0) throw error;
      state_bridge.app.log(`[GameMaster] Connection issue. Retrying in ${delay}ms... (${retries} attempts left)`, "warn");

      if (state_bridge.app.streaming.active) {
        state_bridge.app.streaming.content = "";
        state_bridge.app.streaming.text = "_Network interrupted... Retrying connection..._";
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      const base_delay = delay * 2;
      const jittered_sleep_time = base_delay * (0.75 + Math.random() * 0.5);
      return await this.execute_with_retry(fn, retries - 1, jittered_sleep_time);
    }
  },
};
