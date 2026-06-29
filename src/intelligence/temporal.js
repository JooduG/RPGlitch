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

import { CONFIG, session_driver, TELEMETRY_TYPES } from "@engine";
import { prompt_builder } from "./prompts.js";
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
 * @property {Array<{id: string, word: string}>} dynamics_tags - Associated dynamics identifiers.
 * @property {string[]} vector_tags - Secondary classification tags.
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
    dynamics_tags: [],
    vector_tags: [],
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

  // dynamics_scan was deprecated. Future enhancements will use Director's historical_search_keys.
  const active_ids = new Set();
  const active_words = new Set();

  const input_lower = input.toLowerCase();

  const scored = vectors.map((v) => {
    // Start with the base weight (narrative gravity)
    let relevance = v.base_weight ?? v.emotional_weight ?? 5;

    v.dynamics_tags?.forEach((tag) => {
      const tag_id = typeof tag === "string" ? tag : tag.id;
      const tag_word = typeof tag === "string" ? null : tag.word?.toLowerCase();

      if (active_ids.has(tag_id)) {
        relevance += CONFIG.DYNAMICS.RELEVANCE_DYNAMICS_BONUS;
      }
      if (tag_word && active_words.has(tag_word)) {
        relevance += CONFIG.DYNAMICS.RELEVANCE_TRIGGER_BONUS;
      }
    });

    v.vector_tags?.forEach((t) => {
      if (input_lower.includes(t)) {
        relevance += CONFIG.DYNAMICS.RELEVANCE_VECTOR_BONUS;
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
 * @param {string} [options.mode]
 * @param {number} [options.limit]
 * @param {boolean} [options.vector_directive]
 * @param {boolean} [options.vector_label]
 * @param {number} [options.offset]
 * @returns {string}
 */
export function format(vectors, input, options = {}) {
  const mode = options.mode || "past";
  const limit = options.limit || 3;
  const show_directive = options.vector_directive ?? true;
  const show_label = options.vector_label ?? true;
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
      const weight = v.emotional_weight ?? v.base_weight ?? 5;
      let label;

      if (mode === "past") {
        if (weight >= 10) label = "CORE_ANCHOR";
        else if (weight >= 8) label = "MAJOR_ANCHOR";
        else if (weight >= 7) label = "ANCHOR";
        else label = "MINOR_ANCHOR";
      } else {
        if (weight >= 10) label = "PIVOTAL_IMPULSE";
        else if (weight >= 8) label = "MAJOR_IMPULSE";
        else if (weight >= 7) label = "IMPULSE";
        else label = "ACTIVE_IMPULSE";
      }

      if (show_label && show_directive) return `[${label}]: ${v.directive}`;
      if (show_label) return `[${label}]`;
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
    if (!vector.vector_tags) vector.vector_tags = [];
    vector.vector_tags.push("resolution:" + resolution.toLowerCase());
    // Optionally update text if resolution brings new clarity
    // vector.directive = `[Fulfilled] ${vector.directive}`;
  }

  if (!Array.isArray(entity.past)) entity.past = [];
  entity.past.push(vector);

  // Telemetry
  session_driver.log_system_entry(`Vector Resolved: ${vector.directive.substring(0, 40)}... [${resolution || "PAST"}]`, "system", {
    type: TELEMETRY_TYPES.VECTOR_RESOLUTION,
    vector,
    resolution,
  });
}

/**
 * Generates a Resonance record (Historical Anchor) from a slice of history.
 * @param {SimulationEntity} target_entity
 * @param {any[]} history_slice
 * @param {string} [role]
 * @returns {Promise<TemporalVector | null>}
 */
export async function weave_resonance(target_entity, history_slice, role = "character") {
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
      console.warn("[TemporalEngine] Skipping resonance weave: payload exceeds 64KB safety limit.");
      return null;
    }

    // Robust JSON extraction for potentially nested structures
    const first_brace = stripped.indexOf("{");
    const last_brace = stripped.lastIndexOf("}");
    if (first_brace === -1 || last_brace === -1) return null;

    const json_string = stripped.substring(first_brace, last_brace + 1);
    let resonance;
    try {
      resonance = JSON.parse(json_string);
    } catch (e) {
      console.warn("[TemporalEngine] Malformed JSON in resonance weave:", e);
      return null;
    }

    if (!resonance || !resonance.summary?.trim()) return null;

    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      directive: resonance.summary,
      type: "past",
      base_weight: 5, // Default for recent session memories
      dynamics_tags: [],
      vector_tags: (resonance.vector_tags || resonance.tags || []).map((t) => String(t).toLowerCase()),
      meta: {},
    };
  } catch (err) {
    console.error("[TemporalEngine] Resonance weave failed.", err);
    return null;
  }
}

export const DYNAMICS_META = {
  // Character (Somatic) axes
  chaos: { label: "Chaos", desc: "Randomness vs Control" },
  intensity: { label: "Intensity", desc: "Internal Energy / Adrenaline" },
  openness: { label: "Openness", desc: "Receptivity vs Guardedness" },
  affinity: { label: "Affinity", desc: "Inter-Entity Bond / Empathy" },

  // Fractal (Environmental) axes
  velocity: { label: "Velocity", desc: "Environmental Pacing / Speed" },
  entropy: { label: "Entropy", desc: "Structural Reality / Weirdness" },
};

export const dynamics_engine = {
  /**
   * Evaluates and settles physics (Gravity & Clamping).
   * Used after the Director applies explicit state mutations to settle the physics before the next turn.
   * @param {Record<string, number>} dynamics - The current dynamics state for an entity
   * @param {Record<string, number>} baselines - The baseline gravitational centers
   * @param {number} active_entropy - The current world entropy (0-100)
   * @param {number} base_gravity - The baseline gravity strength (e.g. 0.1)
   */
  settle_physics(dynamics, baselines, active_entropy = 50, base_gravity = 0.1) {
    if (!dynamics) return;

    // 1. Gravity Pull
    const variance = (active_entropy / 100) * 0.05;

    Object.keys(dynamics).forEach((axis) => {
      const target = baselines[axis] ?? 50;
      const randomized_gravity = base_gravity + (Math.random() * 2 - 1) * variance;
      const applied_gravity = Math.max(0, Math.min(1, randomized_gravity)); // Clamp [0, 1]

      dynamics[axis] += (target - dynamics[axis]) * applied_gravity;
    });

    // 2. Settlement (Clamp to 0-100 bounds)
    Object.keys(dynamics).forEach((axis) => {
      dynamics[axis] = Math.max(0, Math.min(100, Math.round(dynamics[axis])));
    });
  },

  /**
   * @param {any} entity - The entity to extract baselines from.
   * @returns {Record<string, number>} The entity's baseline dynamics.
   */
  _get_baselines(entity) {
    return entity?.dynamics_baseline || {};
  },
};

/**
 * Applies explicit state mutations generated by the Director to an entity.
 * @param {SimulationEntity} entity - The active entity
 * @param {any} mutations - The state_mutations JSON block from the Director
 * @returns {boolean} True if any mutations were applied
 */
export function apply_state_mutations(entity, mutations) {
  if (!entity || !mutations || typeof mutations !== "object") return false;
  let changed = false;

  // 1. Present Append (Psychological/State shifts)
  if (mutations.present_append?.trim()) {
    if (!entity.present) entity.present = { physical: "", non_physical: "" };
    const current = entity.present.non_physical || "";
    entity.present.non_physical = current ? `${current}\n${mutations.present_append.trim()}` : mutations.present_append.trim();
    changed = true;
  }

  // 2. Future to Past shifts (Resolving intent/prophecy)
  if (Array.isArray(mutations.future_to_past) && mutations.future_to_past.length > 0) {
    mutations.future_to_past.forEach((uuid) => {
      resolve(entity, uuid, "DIRECTOR_RESOLUTION");
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
  weave_resonance,
  apply_state_mutations,
  _is_weaving: false,

  /**
   * BATCH CONSOLIDATION (The Weaving Cycle)
   * Evicts old messages and weaves them into the Temporal Fabric.
   * @param {SessionDriver} Session
   * @param {Database} db
   * @param {EntityRepository} entities
   * @param {any} runtime
   * @param {any} app
   * @returns {Promise<void>}
   */
  consolidate: async (Session, db, entities, runtime, app) => {
    if (temporal_engine._is_weaving) return;
    temporal_engine._is_weaving = true;

    try {
      const story_id = Session.require_active();
      const messages = await Session.load_log(story_id);
      const unconsolidated = messages.filter(
        (/** @type {{ role: string; meta: { consolidated: any; }; }} */ m) => !m.meta?.consolidated && m.role !== "system",
      );

      if (unconsolidated.length >= 12) {
        const slice = unconsolidated.slice(0, 10);
        app.log(`Temporal: Weaving ${slice.length} turns into the Historical Fabric...`, "system");

        const ai = runtime.active_ai;
        if (ai) {
          const resonance = await weave_resonance(ai, slice, "character");
          if (resonance) {
            if (!Array.isArray(ai.past)) ai.past = [];
            ai.past = [...ai.past, resonance];
            await runtime.update_entity("character", ai.id, { past: ai.past });

            // Telemetry
            await session_driver.log_system_entry(`Memory Weaved: ${resonance.directive.substring(0, 50)}...`, "system", {
              type: TELEMETRY_TYPES.MEMORY_FORMATION,
              vectors: { past: [resonance], future: [] },
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
      console.error("[TemporalEngine] Consolidation weave failed:", err);
    } finally {
      temporal_engine._is_weaving = false;
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
      runtime.add_vector("Continue the journey.", "FRACTAL", true);
      app?.log("temporal_engine: Seeded momentum impulse", "system");
    }
  },
};
