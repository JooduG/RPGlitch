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
import { IMAGE_TRIGGER } from "@engine/config.js";
import { visual_engine } from "@media";
import { llm_service, Security } from "@platform";
import { context_builder } from "./context.svelte.js";
import { dynamics_engine, evaluate_image_trigger } from "./dynamics.js";
import { escape_unescaped_json_quotes, extract_json_block, parse_think_block, strip_cognition_blocks } from "./parser.js";
import { prompt_builder } from "./prompts.js";
import { temporal_engine } from "./temporal.js";

/**
 * @typedef {import('@engine/kernel.js').GenerationOptions} GenerationOptions
 */

// 🖼️ Image beat queue — bounds concurrent background image generations.
// When the queue reaches capacity the oldest beat is dropped and its placeholder
// is marked failed so evicted beats never leave permanent `src: null` ghost cards.
const IMAGE_GEN_QUEUE_CAPACITY = 3;
export const _image_gen_queue = [];

/**
 * Marks a logged placeholder attachment as failed so it never lingers as a
 * permanent `src: null` ghost card in the chat log.
 * @param {string | number} id
 * @param {Record<string, any>} [metadata]
 * @returns {Promise<void>}
 */
async function mark_placeholder_failed(id, metadata = {}) {
  if (!id) return;
  try {
    await state_bridge.session_driver.update_log_attachment(id, 0, {
      src: null,
      metadata: { ...metadata, failed: true, error: "Image beat was dropped before it could resolve." },
    });
  } catch (err) {
    console.warn("[GameMaster] Failed to mark image placeholder as failed:", err);
  }
}

function _remove_from_image_gen_queue(id) {
  const idx = _image_gen_queue.findIndex((entry) => entry.id === id);
  if (idx !== -1) _image_gen_queue.splice(idx, 1);
}

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
 * Drops `</think>` closing tags that appear while no think block is open
 * (e.g. a model that re-closes the block after the narrative has started).
 * @param {string} text
 * @returns {string}
 */
function strip_unmatched_think_closures(text) {
  if (!text) return text;
  const segments = text.split(/(<\/think>|<think>)/i);
  let in_think = false;
  const kept = [];
  for (const segment of segments) {
    if (/^<think>$/i.test(segment)) {
      in_think = true;
      kept.push(segment);
    } else if (/^<\/think>$/i.test(segment)) {
      if (in_think) {
        in_think = false;
        kept.push(segment);
      }
    } else {
      kept.push(segment);
    }
  }
  return kept.join("");
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
    } else if (think_closers > think_openers) {
      // Stray re-closures after the think block already closed (e.g. "...prose.</think>").
      text = strip_unmatched_think_closures(text);
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
 * @param {any} runtime_target
 * @param {any[]} deltas
 * @param {string[]} log_strings
 */
function compute_deltas(target, dynamics, runtime_target, deltas, log_strings) {
  Object.entries(dynamics).forEach(([axis, val]) => {
    const old_value = /** @type {any} */ (runtime_target)?.[axis] ?? 50;
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
 * are aligned into the display shape: `present_mutations.{physical,non_physical}`
 * and `eternal_mutations.{physical,non_physical}`, `new_vectors` keep `content`/`type`
 * but their `weight` becomes `emotional_weight`, `resolve_vectors` → `vectors.resolved`,
 * `dynamics_deltas` is dropped (the computed `dynamics` array already carries old/new/diff per
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

  const pres = mutations?.present_append || mutations?.present_mutations || {};
  entry.present_mutations = {
    physical: pres.physical || mutations?.present_append_physical || "",
    non_physical: pres.non_physical || mutations?.present_append_non_physical || "",
  };

  const eternal = mutations?.eternal_consolidated || mutations?.eternal_baseline || mutations?.eternal_mutations || {};
  entry.eternal_mutations = {
    physical: eternal.physical || "",
    non_physical: eternal.non_physical || "",
  };

  const resolve_list = Array.isArray(mutations?.vector_resolve)
    ? mutations.vector_resolve
    : Array.isArray(mutations?.resolve_vectors)
      ? mutations.resolve_vectors
      : [];
  const new_list = Array.isArray(mutations?.vector_append)
    ? mutations.vector_append
    : Array.isArray(mutations?.new_vectors)
      ? mutations.new_vectors
      : [];

  entry.vectors = {
    resolved: resolve_list,
    new: new_list.map((v) => {
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
          ...(meta?.image_trigger ? { image_trigger: meta.image_trigger } : {}),
          ...(meta?.image_tier ? { image_tier: meta.image_tier } : {}),
          ...(meta?.image_source ? { image_source: meta.image_source } : {}),
          ...(meta?.image_signals ? { image_signals: meta.image_signals } : {}),
          ...(meta?.thoughts ? { thoughts: meta.thoughts } : {}),
          updates,
        },
      );
    }
  },

  /**
   * 🖼️ FIRE IMAGE TRIGGER
   * Logs a placeholder attachment immediately, then kicks off background image generation
   * against the resolved 4-tier target. Fire-and-forget: the narrative turn is never blocked
   * on image latency; the UI fills the placeholder when the generation resolves.
   * @param {string} tier - One of the 4-tier targets (story_entities | story_character | solo_entity | story_scene).
   * @param {{ explicit?: boolean, source?: string, prompt?: string }} [options]
   * @returns {Promise<void>}
   */
  async fire_image_trigger(tier, options = {}) {
    const { explicit = false, source = "dynamics", prompt = "" } = options;
    if (!tier || !IMAGE_TRIGGER.tiers.includes(tier)) return;

    const runtime_state = state_bridge.runtime;
    const visual_prompt = String(prompt || "").trim() || "A significant narrative moment unfolds.";
    const fractal_name = runtime_state.active_fractal?.name || "Fractal";

    try {
      const placeholder_metadata = { mode: tier, image_source: source, image_explicit: explicit };
      const placeholder_entry = await state_bridge.session_driver.log_message("", "fractal", fractal_name, {
        turn_type: "SYSTEM_TURN",
        attachments: [{ src: null, metadata: placeholder_metadata }],
      });
      if (!placeholder_entry?.id) return;

      // Bounded image beat queue: when at capacity, drop the oldest beat and mark
      // its placeholder failed so evicted beats don't linger as src:null ghosts.
      _image_gen_queue.push({ id: placeholder_entry.id, tier, source, metadata: placeholder_metadata });
      if (_image_gen_queue.length > IMAGE_GEN_QUEUE_CAPACITY) {
        const evicted = _image_gen_queue.shift();
        if (evicted?.id) await mark_placeholder_failed(evicted.id, evicted.metadata);
      }

      const resolve_placeholder = async () => {
        try {
          const result = await visual_engine.visualize(runtime_state.story_id, visual_prompt, tier, { silent: true });
          _remove_from_image_gen_queue(placeholder_entry.id);
          if (result?.imageUrl) {
            await state_bridge.session_driver.update_log_attachment(placeholder_entry.id, 0, {
              src: result.imageUrl,
              metadata: { mode: tier, image_source: source, ...result.metadata, prompt: result.refinedPrompt },
            });
          } else {
            await mark_placeholder_failed(placeholder_entry.id, placeholder_metadata);
            state_bridge.app.log(`[Image Trigger] ${tier} generation returned no image.`, "warn");
          }
        } catch (err) {
          _remove_from_image_gen_queue(placeholder_entry.id);
          await mark_placeholder_failed(placeholder_entry.id, placeholder_metadata);
          throw err;
        }
      };

      resolve_placeholder().catch((err) => {
        console.error(`[GameMaster] Image trigger (${tier}) failed:`, err);
        state_bridge.app.log(`[Image Trigger] ${tier} failed: ${err.message || err}`, "error");
      });
    } catch (err) {
      console.error("[GameMaster] Image trigger placeholder logging failed:", err);
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
    state_bridge.app.busy = true;

    try {
      state_bridge.simulation_state.start_generation(role);
      state_bridge.runtime.story_id = story_id;
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

      const payload = await context_builder.build_context(input || "", "simulation", simulation_log);
      payload.meta = payload.meta || {};
      payload.meta.structural_errors = state_bridge.runtime.structural_errors || 0;

      const scoring_context = prompt_builder.build_scoring_context(input, simulation_log);
      if (scoring_context) {
        await Promise.race([temporal_engine.precompute_context_embedding(scoring_context), new Promise((resolve) => setTimeout(resolve, 30000))]);
      }

      // 3. SIMULATION: Evaluate world physics snapshot prior to generation
      // Pre-turn dynamics snapshot — the baseline for the image trigger engine's
      // displacement & band-entry gate (step 4.6). Captured before settlement mutates the copy.
      const prev_dynamics = {
        ai: { ...(state_bridge.runtime.ai || {}) },
        fractal: { ...(state_bridge.runtime.fractal || {}) },
      };

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
        AI: prune(payload.entities.AI?.memories),
        USER: prune(payload.entities.USER?.memories),
        FRACTAL: prune(payload.entities.FRACTAL?.memories),
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
      const entity_mutations = director_data.mutations || director_data;

      if (entity_mutations.AI_CHARACTER && state_bridge.runtime.active_ai) {
        temporal_engine.apply_state_mutations(state_bridge.runtime.active_ai, entity_mutations.AI_CHARACTER, state_bridge.session_driver);
        if (entity_mutations.AI_CHARACTER.dynamics_deltas) {
          if (!snapshot.ai) snapshot.ai = {};
          if (!snapshot.ai.dynamics) snapshot.ai.dynamics = { ...state_bridge.runtime.ai };
          Object.entries(entity_mutations.AI_CHARACTER.dynamics_deltas).forEach(([k, delta]) => {
            const val = Number(delta);
            if (!isNaN(val)) {
              const current = snapshot.ai.dynamics[k] || 50;
              snapshot.ai.dynamics[k] = Math.max(1, Math.min(100, current + val));
            }
          });
        }
      }

      if (entity_mutations.USER_PERSONA && state_bridge.runtime.active_user) {
        temporal_engine.apply_state_mutations(state_bridge.runtime.active_user, entity_mutations.USER_PERSONA, state_bridge.session_driver);
      }

      if (entity_mutations.FRACTAL && state_bridge.runtime.active_fractal) {
        temporal_engine.apply_state_mutations(state_bridge.runtime.active_fractal, entity_mutations.FRACTAL, state_bridge.session_driver);
        if (entity_mutations.FRACTAL.dynamics_deltas) {
          if (!snapshot.fractal) snapshot.fractal = {};
          if (!snapshot.fractal.dynamics) snapshot.fractal.dynamics = { ...state_bridge.runtime.fractal };
          Object.entries(entity_mutations.FRACTAL.dynamics_deltas).forEach(([k, delta]) => {
            const val = Number(delta);
            if (!isNaN(val)) {
              const current = snapshot.fractal.dynamics[k] || 50;
              snapshot.fractal.dynamics[k] = Math.max(1, Math.min(100, current + val));
            }
          });
        }
      }

      // 4.5. PHYSICS SYNC & TELEMETRY
      const character_prompt = prompt_builder.build_character_prompt(payload, snapshot, director_data);
      const meta = character_prompt.meta;

      let final_meta = { ...meta };
      final_meta.ai = snapshot.ai?.dynamics;
      final_meta.fractal = snapshot.fractal?.dynamics;
      final_meta.mutations = entity_mutations;

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

      // 4.6 IMAGE TRIGGER ENGINE — Dual-Source & Shared Cooldown
      // Source A: pure-JS dynamics gate (band entry + displacement sum), no LLM call.
      // Source B: LLM Director explicit trigger (trigger_image true or a 4-tier string).
      const image_trigger_eval = evaluate_image_trigger({ ai: snapshot.ai?.dynamics, fractal: snapshot.fractal?.dynamics }, prev_dynamics, {
        band_high: IMAGE_TRIGGER.band_high,
        band_low: IMAGE_TRIGGER.band_low,
        displacement_threshold: IMAGE_TRIGGER.displacement_threshold,
        default_tier: IMAGE_TRIGGER.default_tier,
      });

      const turn_round = state_bridge.runtime.round || 0;
      // -1 is the "never triggered" sentinel. A 0 sentinel collided with real round-0
      // (prologue) triggers, permanently opening the shared cooldown gate.
      const last_auto = state_bridge.runtime.last_auto_image_round ?? -1;
      // First auto-trigger is allowed anytime; afterwards enforce the shared cooldown.
      const cooldown_elapsed = last_auto < 0 || turn_round >= last_auto + IMAGE_TRIGGER.cooldown_rounds;

      let auto_image_trigger = null;
      if (image_trigger_eval.triggered && cooldown_elapsed) {
        auto_image_trigger = { tier: image_trigger_eval.tier, source: "dynamics" };
        state_bridge.runtime.last_auto_image_round = turn_round;
      }

      const raw_trigger = typeof director_data.trigger_image === "string" ? director_data.trigger_image.trim() : director_data.trigger_image;
      const tier_from_string = typeof raw_trigger === "string" && IMAGE_TRIGGER.tiers.includes(raw_trigger) ? raw_trigger : null;
      const tier_from_pref =
        typeof director_data.image_tier === "string" && IMAGE_TRIGGER.tiers.includes(director_data.image_tier) ? director_data.image_tier : null;
      const director_explicit = raw_trigger === true || raw_trigger === "true" || tier_from_string !== null;
      // The shared cooldown gates BOTH image sources (dynamics + Director explicit),
      // so consecutive turns can't each fire an image. The prologue's image opens the
      // timer at round 0, so the opening turn is covered too.
      const director_allowed = director_explicit && cooldown_elapsed;
      if (director_allowed) {
        state_bridge.runtime.last_auto_image_round = turn_round;
      }

      const image_trigger_active = director_allowed || auto_image_trigger !== null;
      const image_tier =
        tier_from_string || (director_explicit ? tier_from_pref || IMAGE_TRIGGER.default_tier : auto_image_trigger?.tier || null) || null;

      final_meta.trigger_image = image_trigger_active;
      final_meta.image_trigger = image_trigger_active;
      final_meta.image_tier = image_trigger_active ? image_tier : null;
      if (image_trigger_active) {
        final_meta.image_source = director_explicit ? "director" : "dynamics";
        final_meta.image_signals = image_trigger_eval.signals;
      }

      if (image_trigger_active && image_tier) {
        let trigger_prompt = [input, clean_think(director_data._thought_process), clean_think(director_data.directive)]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (!trigger_prompt) {
          // No in-turn context to draw from (e.g. an opening turn with a silent Director):
          // anchor the visual on the most recent narrative beat so the image LLM is never
          // handed the generic placeholder string.
          const last_beat = [...simulation_log].reverse().find((m) => m.role === "fractal" || m.role === "model");
          if (last_beat?.content) {
            trigger_prompt = strip_cognition_blocks(last_beat.content).slice(0, 700);
          }
        }
        await this.fire_image_trigger(image_tier, {
          explicit: director_explicit,
          source: final_meta.image_source,
          prompt: trigger_prompt,
        });
      }

      await this.capture_dynamics_delta(snapshot, final_meta);

      state_bridge.runtime.ai = snapshot.ai?.dynamics;
      state_bridge.runtime.fractal = snapshot.fractal?.dynamics;

      // 5. TRANSITION & LOGGING
      state_bridge.app.log("[GameMaster] Routing to LLM (Character Pass)...", "system");
      state_bridge.runtime.turn_type = "AI_TURN";

      const director_monologue = think_content ? `<think>\n${think_content}\n</think>\n\n` : "";

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
          const { onToken, json, signal, silent, raw } = llm_options;

          const generated_text = await llm_service.generate(
            {
              system: character_prompt.system,
              task: character_prompt.task,
              messages: simulation_log,
              role,
              node_id: node_id,
            },
            {
              onToken,
              json,
              signal,
              silent,
              raw,
            },
          );

          const full_text = (director_monologue || "") + (generated_text || "");

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

      await state_bridge.session_driver.log_message(validation_result.text, role, character_name, {
        turn_type: "AI_TURN",
        meta: {
          id: node_id,
          round: state_bridge.runtime.round,
          sino_logic_violation: final_meta.sino_logic_violation,
        },
      });

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
      const payload = await context_builder.build_context(prologue_input, "prologue");
      // Semantic RAG: precompute the context embedding from the prologue's own
      // input so the narrator's PAST/FUTURE ranking (sync format → score) is
      // scored against the scene the user requested, not pure weight×recency.
      await Promise.race([temporal_engine.precompute_context_embedding(prologue_input), new Promise((resolve) => setTimeout(resolve, 30000))]);
      const result = prompt_builder.build_prologue(payload, {});
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
      // The prologue's own image (dispatched below) opens the shared cooldown, so
      // the opening turn's dynamics gate can't immediately fire a second image at round 0.
      state_bridge.runtime.last_auto_image_round = 0;

      await state_bridge.session_driver.log_message(response, "fractal", fractal_name, {
        turn_type: "SYSTEM_TURN",
        meta: {
          id: node_id,
          round: 0,
          is_prologue: true,
        },
        attachments: [{ src: null, metadata: { mode: "characters" } }],
      });
      state_bridge.app.log("[GameMaster] Prologue established (Round 0).", "system");

      state_bridge.app.end_stream();

      const image_promise = visual_engine
        ? visual_engine
            .visualize(story_id, strip_cognition_blocks(response), "story_entities", { silent: true })
            .then((img_result) => {
              if (img_result?.imageUrl) {
                state_bridge.session_driver.update_log_attachment(node_id, 0, {
                  src: img_result.imageUrl,
                  metadata: {
                    ...(img_result.metadata || {}),
                    prompt: img_result.refinedPrompt || img_result.metadata?.prompt,
                    mode: "characters",
                  },
                });
              }
            })
            .catch((err) => {
              console.warn("[Prologue Image Error]", err);
            })
        : Promise.resolve();

      // Prime the streaming cursor so the busy placeholder renders during the opening
      // turn's director phase (end_stream() above left streaming inactive; a regular
      // turn gets this from advance_turn). node_id stays null → the "temp" placeholder,
      // and the character pass streams into it since stream_bridge.is_active() is true.
      state_bridge.app.streaming.active = true;
      state_bridge.app.streaming.content = "";
      state_bridge.app.streaming.text = "";
      state_bridge.app.streaming.node_id = null;
      state_bridge.app.streaming.role = "ai";

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
        const img_result = await visual_engine.visualize(story_id, strip_cognition_blocks(response), "story_entities", { silent: true });
        if (img_result?.imageUrl) {
          epilogue_attachments = [
            {
              src: img_result.imageUrl,
              metadata: {
                ...(img_result.metadata || {}),
                prompt: img_result.refinedPrompt || img_result.metadata?.prompt,
                mode: "characters",
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
    const payload = await context_builder.build_context(input_text || "", "simulation", simulation_log);
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
