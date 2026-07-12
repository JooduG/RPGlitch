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
import { prompt_builder } from "@intelligence";
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
 * @param {boolean} [options.vector_directive]
 * @param {number} [options.offset]
 * @returns {string}
 */
export function format(vectors, input, options = {}) {
  const limit = options.limit || 3;
  const show_directive = options.vector_directive ?? true;
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

    // Robust JSON extraction for potentially nested structures
    const first_brace = stripped.indexOf("{");
    const last_brace = stripped.lastIndexOf("}");
    if (first_brace === -1 || last_brace === -1) return null;

    const json_string = stripped.substring(first_brace, last_brace + 1);
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
    const current = entity.present.physical || "";
    entity.present.physical = current ? `${current}\n${mutations.present_append_physical.trim()}` : mutations.present_append_physical.trim();
    changed = true;
  }

  // 2. Present Append (Non-Physical)
  if (mutations.present_append_non_physical?.trim()) {
    if (!entity.present) entity.present = { physical: "", non_physical: "" };
    const current = entity.present.non_physical || "";
    entity.present.non_physical = current
      ? `${current}\n${mutations.present_append_non_physical.trim()}`
      : mutations.present_append_non_physical.trim();
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

  /**
   * BATCH CONSOLIDATION (The Forging Cycle)
   * Evicts old messages and compresses them into the Temporal Archive.
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
        app.log(`[TemporalEngine] Forging ${slice.length} turns into the Historical Archive...`, "system");

        const ai = runtime.active_ai;
        if (ai) {
          const memory = await forge_memory(ai, slice, "character");
          if (memory) {
            // Push Memory Vector to AI's past
            if (!Array.isArray(ai.past)) ai.past = [];
            ai.past = [...ai.past, memory];
            await runtime.update_entity("character", ai.id, { past: ai.past });

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

            // Telemetry
            await session_driver.log_system_entry(`Memory Forged: ${memory.directive.substring(0, 50)}...`, "system", {
              type: "MEMORY_FORMATION",
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
