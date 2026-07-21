/**
 * @file src/core/intelligence/temporal-engine.js
 * @description The RPGlitch Temporal Engine (v1).
 * Consolidates Past (Historical Anchors) and Future (Active Impulses) into a unified temporal continuum.
 *
 * -----------------------------------------------------------------------------
 * THE TEMPORAL FABRIC
 * -----------------------------------------------------------------------------
 * This engine manages "Temporal Log Entries" (Vectors).
 * - Past (Anchors)  : Backstory, Traumas, Education, Session Memories.
 * - Future (Impulses): Prophecies, Curses, Dreams, Impending Doom, Plans.
 */

import { session_driver } from "@engine";
import { prompt_builder } from "./prompts.js";
import { merge_prose_into_field, extract_json_block } from "./parser.js";
import { llm_service } from "@platform";
import { simulation_log as log_store } from "@state";

/**
 * @typedef {import('@state/runtime.svelte.js').SimulationEntity} SimulationEntity
 * @typedef {import('@state/runtime.svelte.js').SimulationState} SimulationState
 * @typedef {import('@engine/session.svelte.js').session_driver} SessionDriver
 * @typedef {typeof import('@data/db.js').db} Database
 * @typedef {import('@data/repository.js').entities} EntityRepository
 */

/**
 * @typedef {Object} TemporalVector
 * @property {string} id - UUID unique identifier.
 * @property {number} timestamp - Epoch timestamp of creation.
 * @property {string} directive - The narrative payload.
 * @property {string} type - "past" | "future".
 * @property {number} base_weight - Narrative gravity (1-10).
 * @property {string[]} tags - Semantic keywords for clustering and retrieval.
 * @property {Object} meta - Opaque metadata container.
 * @property {number} [emotional_weight] - Optional emotional intensity override.
 * @property {number} [_relevance] - Calculated RAG score (transient).
 */

/**
 * Creates a rich Temporal Log Entry (Vector).
 *
 * @param {string} directive - The narrative payload.
 * @param {string} [type="future"] - "past" | "future".
 * @param {number} [weight=5] - 1-10 priority.
 * @returns {TemporalVector} A strict Temporal Vector.
 */
export function create(directive, type = "future", weight = 5) {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    directive,
    type,
    base_weight: weight,
    tags: [],
    meta: {},
  };
}

/**
 * RAG Scoring: Ranks a list of vectors based on relevance and base weight.
 * Symmetric logic for both past and future.
 * @param {TemporalVector[]} vectors
 * @param {string} input
 * @returns {TemporalVector[]}
 */
export function score(vectors, input) {
  if (!Array.isArray(vectors) || !vectors.length) return [];
  if (!input) return [...vectors].sort((a, b) => b.timestamp - a.timestamp);

  const input_lower = input.toLowerCase();

  const scored = vectors.map((v) => {
    // Start with the base weight (narrative gravity)
    let relevance = v.base_weight ?? v.emotional_weight ?? 5;

    // Future enhancements will use Director's historical_search_keys to boost tag relevance.
    v.tags?.forEach((t) => {
      if (input_lower.includes(t.toLowerCase())) {
        relevance += 3;
      }
    });

    return { ...v, _relevance: relevance };
  });

  return scored.sort((a, b) => {
    const diff = (b._relevance || 0) - (a._relevance || 0);
    if (diff !== 0) return diff;
    return b.timestamp - a.timestamp;
  });
}

/**
 * Unified Generator for Prompt formatting.
 * @param {TemporalVector[]} vectors
 * @param {string} input
 * @param {Object} [options]
 * @param {number} [options.limit]
 * @param {boolean} [options.vector_text]
 * @param {number} [options.offset]
 * @returns {string}
 */
export function format(vectors, input, options = {}) {
  const limit = options.limit || 3;
  const show_directive = options.vector_text ?? true;
  const max_chars = options.max_chars || 1500;

  const offset = options.offset || 0;
  const ranked = score(vectors, input).slice(offset);

  let running_chars = 0;
  const selected = [];

  for (const v of ranked) {
    if (selected.length >= limit) break;

    const payload_length = (v.directive || "").length;

    if (running_chars + payload_length > max_chars && selected.length > 0) {
      break;
    }

    selected.push(v);
    running_chars += payload_length;
  }

  // Maintain reverse-chrono order in the prompt (oldest to newest)
  const sorted = [...selected].reverse();

  return sorted
    .map((v) => {
      if (show_directive) return v.directive;
      return "";
    })
    .join("\n");
}

/**
 * Transitions an Active Impulse (Future) into a Historical Anchor (Past).
 * @param {SimulationEntity} entity
 * @param {string} vector_id
 * @param {string | null} [resolution]
 */
export function resolve(entity, vector_id, resolution = null) {
  if (!Array.isArray(entity.future)) return;
  const index = entity.future.findIndex((v) => v.id === vector_id);
  if (index === -1) return;

  const [vector] = entity.future.splice(index, 1);
  vector.type = "past";
  vector.timestamp = Date.now();

  if (resolution) {
    if (!vector.tags) vector.tags = [];
    vector.tags.push("resolution:" + resolution.toLowerCase());
    // Optionally update text if resolution brings new clarity
    // vector.directive = `[Fulfilled] ${vector.directive}`;
  }

  if (!Array.isArray(entity.past)) entity.past = [];
  entity.past.push(vector);

  // Telemetry
  session_driver.log_system_entry(`Vector Resolved: ${vector.directive.substring(0, 40)}... [${resolution || "PAST"}]`, "system", {
    type: "VECTOR_RESOLUTION",
    vector,
    resolution,
  });
}

/**
 * Generates a Memory record (Historical Anchor) from a slice of history.
 * @param {SimulationEntity} target_entity
 * @param {any[]} history_slice
 * @param {string} [role]
 * @returns {Promise<TemporalVector | null>}
 */
export async function forge_memory(target_entity, history_slice, role = "character") {
  if (!target_entity) return null;
  try {
    const payload = prompt_builder.build_memory_prompt(role, target_entity, history_slice);
    const response = await llm_service.generate(payload, {
      json: true,
      silent: true,
      raw: true,
    });

    let raw_text = "";
    if (typeof response === "string") {
      raw_text = response.trim();
    } else if (response && typeof response === "object") {
      const r = /** @type {any} */ (response);
      raw_text = String(r.generatedText ?? r.text ?? "").trim();
    }

    const stripped = raw_text.replace(/```json\n?|```/g, "").trim();
    if (stripped.length > 65536) {
      console.warn("[TemporalEngine] Skipping memory forge: payload exceeds 64KB safety limit.");
      return null;
    }

    const json_string = extract_json_block(raw_text);
    if (!json_string) return null;
    let memory;
    try {
      memory = JSON.parse(json_string);
    } catch (e) {
      console.warn("[TemporalEngine] Malformed JSON in memory forge:", e);
      return null;
    }

    if (!memory || (!memory.directive?.trim() && !memory.summary?.trim())) return null;

    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: (memory.type || "past").toLowerCase(),
      directive: memory.directive || memory.summary || "",
      base_weight: memory.base_weight ?? 5,
      emotional_weight: memory.emotional_weight ?? 5,
      tags: (memory.vector_tags || memory.tags || []).map((t) => String(t).toLowerCase()),
      present_summaries: memory.present_summaries || null,
      eternal_mutations: memory.eternal_mutations || null,
      meta: memory.meta || {},
    };
  } catch (err) {
    console.error("[TemporalEngine] Resonance forge failed.", err);
    return null;
  }
}

/**
 * Applies explicit state mutations generated by the Director to an entity.
 * @param {SimulationEntity} entity - The active entity
 * @param {any} mutations - The state_mutations JSON block from the Director
 * @returns {boolean} True if any mutations were applied
 */
export function apply_state_mutations(entity, mutations) {
  if (!entity || !mutations || typeof mutations !== "object") return false;
  let changed = false;

  // 1. Present Append (Physical)
  if (mutations.present_append_physical?.trim()) {
    if (!entity.present) entity.present = { physical: "", non_physical: "" };
    entity.present.physical = merge_prose_into_field(entity.present.physical, mutations.present_append_physical);
    changed = true;
  }

  // 2. Present Append (Non-Physical)
  if (mutations.present_append_non_physical?.trim()) {
    if (!entity.present) entity.present = { physical: "", non_physical: "" };
    entity.present.non_physical = merge_prose_into_field(entity.present.non_physical, mutations.present_append_non_physical);
    changed = true;
  }

  // 3. Resolve Vectors (Future to Past shifts)
  if (Array.isArray(mutations.resolve_vectors) && mutations.resolve_vectors.length > 0) {
    mutations.resolve_vectors.forEach((v) => {
      resolve(entity, v.id, v.resolution_summary || "DIRECTOR_RESOLUTION");
      changed = true;
    });
  }

  // 4. New Vectors (Future or Past)
  if (Array.isArray(mutations.new_vectors) && mutations.new_vectors.length > 0) {
    if (!Array.isArray(entity.future)) entity.future = [];
    if (!Array.isArray(entity.past)) entity.past = [];
    mutations.new_vectors.forEach((v) => {
      if (!v.directive?.trim()) return;
      const new_vector = create(v.directive, v.type || "future", v.weight || 5);
      new_vector.tags = v.tags || [];
      if (new_vector.type === "past") {
        entity.past.push(new_vector);
      } else {
        entity.future.push(new_vector);
      }
      changed = true;
    });
  }

  return changed;
}

export const temporal_engine = {
  create,
  score,
  format,
  resolve,
  forge_memory,
  apply_state_mutations,
  _is_consolidating: false,
  _consolidation_rotation_index: 0,
  _consolidation_targets: ["AI_CHARACTER", "USER_PERSONA", "FRACTAL"],

  /**
   * BATCH CONSOLIDATION (The Forging Cycle)
   * Evicts old messages and compresses them into the Temporal Archive.
   * Rotates through AI → User → Fractal on each cycle so each entity gets
   * memory vectors at a staggered cadence.
   * @param {SessionDriver} Session
   * @param {Database} db
   * @param {EntityRepository} entities
   * @param {any} runtime
   * @param {any} app
   * @returns {Promise<void>}
   */
  consolidate: async (Session, db, entities, runtime, app) => {
    if (temporal_engine._is_consolidating) return;
    temporal_engine._is_consolidating = true;

    try {
      const story_id = Session.require_active();
      const messages = await Session.load_log(story_id);
      const unconsolidated = messages.filter(
        (/** @type {{ role: string; meta: { consolidated: any; }; }} */ m) => !m.meta?.consolidated && m.role !== "system",
      );

      if (unconsolidated.length >= 12) {
        const slice = unconsolidated.slice(0, 8);

        // Determine which entity gets the memory vector this cycle
        const target_key =
          temporal_engine._consolidation_targets[temporal_engine._consolidation_rotation_index % temporal_engine._consolidation_targets.length];
        temporal_engine._consolidation_rotation_index++;

        const targetMap = {
          AI_CHARACTER: { entity: runtime.active_ai, role: "character", type: "character" },
          USER_PERSONA: { entity: runtime.active_user, role: "user", type: "character" },
          FRACTAL: { entity: runtime.active_fractal, role: "fractal", type: "fractal" },
        };
        const target = targetMap[target_key];

        app.log(`[TemporalEngine] Forging ${slice.length} turns into ${target_key}'s Historical Archive...`, "system");

        if (target.entity) {
          const memory = await forge_memory(target.entity, slice, target.role);
          if (memory) {
            // Push Memory Vector to target's past
            if (!Array.isArray(target.entity.past)) target.entity.past = [];
            target.entity.past = [...target.entity.past, memory];
            await runtime.update_entity(target.type, target.entity.id, { past: target.entity.past });

            // Apply Present Summaries to ALL entities
            if (memory.present_summaries) {
              const summaries = memory.present_summaries;

              if (summaries.AI_CHARACTER && runtime.active_ai) {
                if (summaries.AI_CHARACTER.physical) runtime.active_ai.present.physical = summaries.AI_CHARACTER.physical;
                if (summaries.AI_CHARACTER.non_physical) runtime.active_ai.present.non_physical = summaries.AI_CHARACTER.non_physical;
                await runtime.update_entity("character", runtime.active_ai.id, { present: runtime.active_ai.present });
              }

              if (summaries.USER_PERSONA && runtime.active_user) {
                if (summaries.USER_PERSONA.physical) runtime.active_user.present.physical = summaries.USER_PERSONA.physical;
                if (summaries.USER_PERSONA.non_physical) runtime.active_user.present.non_physical = summaries.USER_PERSONA.non_physical;
                await runtime.update_entity("character", runtime.active_user.id, { present: runtime.active_user.present });
              }

              if (summaries.FRACTAL && runtime.active_fractal) {
                if (summaries.FRACTAL.physical) runtime.active_fractal.present.physical = summaries.FRACTAL.physical;
                if (summaries.FRACTAL.non_physical) runtime.active_fractal.present.non_physical = summaries.FRACTAL.non_physical;
                await runtime.update_entity("fractal", runtime.active_fractal.id, { present: runtime.active_fractal.present });
              }
            }

            // Apply Eternal Mutations to ALL entities
            if (memory.eternal_mutations) {
              const e_muts = memory.eternal_mutations;

              if (e_muts.AI_CHARACTER && runtime.active_ai) {
                let eternalChanged = false;
                if (e_muts.AI_CHARACTER.physical) {
                  runtime.active_ai.eternal.physical = merge_prose_into_field(runtime.active_ai.eternal.physical, e_muts.AI_CHARACTER.physical);
                  eternalChanged = true;
                }
                if (e_muts.AI_CHARACTER.non_physical) {
                  runtime.active_ai.eternal.non_physical = merge_prose_into_field(
                    runtime.active_ai.eternal.non_physical,
                    e_muts.AI_CHARACTER.non_physical,
                  );
                  eternalChanged = true;
                }
                if (eternalChanged) {
                  await runtime.update_entity("character", runtime.active_ai.id, { eternal: runtime.active_ai.eternal });
                  if (!memory.tags.includes("eternal-shift")) memory.tags.push("eternal-shift");
                }
              }

              if (e_muts.USER_PERSONA && runtime.active_user) {
                let eternalChanged = false;
                if (e_muts.USER_PERSONA.physical) {
                  runtime.active_user.eternal.physical = merge_prose_into_field(runtime.active_user.eternal.physical, e_muts.USER_PERSONA.physical);
                  eternalChanged = true;
                }
                if (e_muts.USER_PERSONA.non_physical) {
                  runtime.active_user.eternal.non_physical = merge_prose_into_field(
                    runtime.active_user.eternal.non_physical,
                    e_muts.USER_PERSONA.non_physical,
                  );
                  eternalChanged = true;
                }
                if (eternalChanged) {
                  await runtime.update_entity("character", runtime.active_user.id, { eternal: runtime.active_user.eternal });
                  if (!memory.tags.includes("eternal-shift")) memory.tags.push("eternal-shift");
                }
              }

              // Update the memory vector in the target's past if the tag was added
              if (memory.tags.includes("eternal-shift")) {
                const vectorIdx = target.entity.past.findIndex((v) => v.id === memory.id);
                if (vectorIdx !== -1) {
                  target.entity.past[vectorIdx] = memory;
                  await runtime.update_entity(target.type, target.entity.id, { past: target.entity.past });
                }
              }
            }

            // Telemetry
            await session_driver.log_system_entry(`Memory Forged (${target_key}): ${memory.directive.substring(0, 50)}...`, "system", {
              type: "MEMORY_FORMATION",
              target: target_key,
              vectors: { past: [memory], future: [] },
              turns_count: slice.length,
            });
          }
        }

        for (const msg of slice) {
          msg.meta = { ...msg.meta, consolidated: true };
        }
        await db.simulation_log.bulkPut(slice);
        log_store?.refresh();
      }
    } catch (err) {
      console.error("[TemporalEngine] Consolidation forge failed:", err);
    } finally {
      temporal_engine._is_consolidating = false;
    }
  },

  /**
   * ENSURE MOMENTUM
   * @param {any} runtime
   * @param {any} [app]
   */
  ensure_momentum: (runtime, app) => {
    const fractal = runtime.active_fractal;
    if (fractal && (!Array.isArray(fractal.future) || fractal.future.length === 0)) {
      app?.log("[TemporalEngine] Placeholder momentum active (No vectors found)", "system");
    }
  },
};
