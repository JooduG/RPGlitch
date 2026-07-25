/**
 * @file src/intelligence/temporal.js
 * ⏳ TEMPORAL ENGINE — Temporal Fabric Coordinator
 * Consolidates Past (Historical Anchors) and Future (Active Impulses) into a unified temporal continuum.
 */

import { llm_service } from "@platform";
import { simulation_log as log_store } from "@state";
import { ensure_embedding, score_by_semantics } from "./embeddings.svelte.js";
import { extract_json_block, merge_prose_into_field } from "./parser.js";
import { prompt_builder } from "./prompts.js";

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
 * @property {number} emotional_weight - Narrative gravity (1-10), defaults to 5.
 * @property {string[]} tags - Semantic keywords for clustering and retrieval.
 * @property {Object} meta - Opaque metadata container.
 * @property {number} [_relevance] - Calculated RAG score (transient).
 * @property {Float32Array} [_embedding] - Semantic embedding vector (transient, not persisted).
 * @property {number} [_recency_factor] - Calculated recency decay (transient).
 */

/**
 * Creates a rich Temporal Log Entry (Vector).
 * @param {string} directive - The narrative payload.
 * @param {string} [type="future"] - "past" | "future".
 * @param {number} [weight=5] - 1-10 priority.
 * @returns {TemporalVector} A strict Temporal Vector.
 */
export function create(directive, type = "future", weight = 5) {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    directive: directive || "",
    type,
    emotional_weight: weight,
    tags: [],
    meta: {},
  };
}

/**
 * Computes a recency decay factor based on turns since the vector was created.
 * Uses logarithmic decay: recent vectors score near 1.0, old vectors fade to ~0.33.
 * @param {TemporalVector} v
 * @param {number} [_current_round]
 * @returns {number}
 */
function recency_factor(v, _current_round) {
  if (!v.timestamp) return 1;
  const age_ms = Date.now() - v.timestamp;
  if (age_ms <= 0) return 1;
  const estimated_turns = Math.max(1, Math.floor(age_ms / 60000));
  return 1 / (1 + Math.log10(estimated_turns + 1));
}

/**
 * Computes the final relevance score for a vector.
 * Formula: emotional_weight × (1 + semantic_match) × recency_factor
 * - emotional_weight is the base (1-10)
 * - semantic_match is 0-1 (cosine similarity from embeddings, 0 if unavailable)
 * - recency_factor is 0.33-1.0 (logarithmic decay)
 * @param {any} v
 * @param {number} semantic_similarity
 * @param {number} current_round
 * @returns {number}
 */
function compute_relevance(v, semantic_similarity, current_round) {
  const weight = v.emotional_weight ?? 5;
  const recency = recency_factor(v, current_round);
  v._recency_factor = recency;
  return weight * (1 + semantic_similarity) * recency;
}

/**
 * RAG Scoring: Ranks a list of vectors based on semantic relevance, emotional weight, and recency.
 * Falls back to weight-only sorting if embeddings are unavailable.
 * @param {TemporalVector[]} vectors
 * @param {string} input
 * @returns {TemporalVector[]}
 */
export function score(vectors, input) {
  if (!Array.isArray(vectors) || !vectors.length) return [];
  if (!input) return [...vectors].sort((a, b) => b.timestamp - a.timestamp);

  const scored = vectors.map((v) => {
    let semantic = 0;
    if (v._embedding) {
      semantic = v._similarity ?? 0;
    } else if (v.tags?.length) {
      const input_lower = input.toLowerCase();
      let tag_hits = 0;
      v.tags.forEach((t) => {
        if (input_lower.includes(t.toLowerCase())) tag_hits++;
      });
      semantic = Math.min(1, tag_hits * 0.15);
    }
    const relevance = compute_relevance(v, semantic, _current_round);
    return { ...v, _relevance: relevance };
  });

  return scored.sort((a, b) => {
    const diff = (b._relevance || 0) - (a._relevance || 0);
    if (diff !== 0) return diff;
    return b.timestamp - a.timestamp;
  });
}

/** @type {number} */
let _current_round = 0;

/**
 * Sets the current round for recency calculations (called from kernel before scoring).
 * @param {number} round
 */
export function set_round(round) {
  _current_round = round || 0;
}

/**
 * Async RAG Scoring: Embeds the context and all vectors, then scores by semantic similarity.
 * This is the primary scoring path — call this when embeddings are available.
 * @param {TemporalVector[]} vectors
 * @param {string} input
 * @param {number} [current_round]
 * @returns {Promise<TemporalVector[]>}
 */
export async function score_async(vectors, input, current_round) {
  if (!Array.isArray(vectors) || !vectors.length) return [];
  if (current_round !== undefined) _current_round = current_round;

  if (!input?.trim()) return [...vectors].sort((a, b) => b.timestamp - a.timestamp);

  const semantic_scores = await score_by_semantics(vectors, input);

  const scored = semantic_scores.map(({ vector: v, similarity }) => {
    v._similarity = similarity;
    v._relevance = compute_relevance(v, similarity, _current_round);
    return { ...v, _relevance: v._relevance, _similarity: similarity };
  });

  return scored.sort((a, b) => {
    const diff = (b._relevance || 0) - (a._relevance || 0);
    if (diff !== 0) return diff;
    return b.timestamp - a.timestamp;
  });
}

/**
 * Word-overlap check for deduplication.
 * @param {string} a
 * @param {string} b
 * @returns {boolean} True if >60% word overlap
 */
function is_duplicate(a, b) {
  if (!a || !b) return false;
  const words_a = new Set(
    a
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2),
  );
  const words_b = new Set(
    b
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2),
  );
  if (words_a.size === 0 || words_b.size === 0) return false;
  let shared = 0;
  for (const w of words_a) {
    if (words_b.has(w)) shared++;
  }
  return shared / Math.min(words_a.size, words_b.size) > 0.6;
}

/**
 * Unified Generator for Prompt formatting.
 * Budget-driven selection: fills up to max_chars with the most relevant vectors.
 * No hard count limit — relevance determines inclusion, not an arbitrary cap.
 * Deduplicates near-identical vectors to avoid wasting budget.
 * @param {TemporalVector[]} vectors
 * @param {string} input
 * @param {Object} [options]
 * @param {boolean} [options.vector_text]
 * @param {number} [options.offset]
 * @param {number} [options.max_chars]
 * @returns {string}
 */
export function format(vectors, input, options = {}) {
  const show_directive = options.vector_text ?? true;
  const max_chars = options.max_chars || 1500;
  const offset = options.offset || 0;

  const ranked = score(vectors, input).slice(offset);

  let running_chars = 0;
  const selected = [];
  const selected_directives = [];

  for (const v of ranked) {
    const directive = v.directive || "";
    if (!directive.trim()) continue;

    if (is_duplicate(directive, selected_directives.join(" "))) continue;

    const payload_length = directive.length;
    if (running_chars + payload_length > max_chars && selected.length > 0) {
      break;
    }

    selected.push(v);
    selected_directives.push(directive);
    running_chars += payload_length;
  }

  return selected
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
export function resolve(entity, vector_id, resolution = null, session = null) {
  if (!entity || !Array.isArray(entity.future)) return;
  const index = entity.future.findIndex((v) => v.id === vector_id);
  if (index === -1) return;

  const [vector] = entity.future.splice(index, 1);
  vector.type = "past";
  vector.timestamp = Date.now();

  if (resolution) {
    if (!vector.tags) vector.tags = [];
    vector.tags.push("resolution:" + resolution.toLowerCase());
  }

  if (!Array.isArray(entity.past)) entity.past = [];
  entity.past.push(vector);

  if (session?.log_system_entry) {
    session.log_system_entry(`Vector Resolved: ${vector.directive.substring(0, 40)}... [${resolution || "PAST"}]`, "system", {
      type: "VECTOR_RESOLUTION",
      vector,
      resolution,
    });
  }
}

/**
 * Generates a Memory record (Historical Anchor) from a slice of history.
 * @param {SimulationEntity} target_entity
 * @param {any[]} history_slice
 * @param {string} [role="character"]
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

    const forged = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: (memory.type || "past").toLowerCase(),
      directive: memory.directive || memory.summary || "",
      emotional_weight: memory.emotional_weight ?? memory.base_weight ?? 5,
      tags: (memory.vector_tags || memory.tags || []).map((t) => String(t).toLowerCase()),
      present_summaries: memory.present_summaries || null,
      eternal_mutations: memory.eternal_mutations || null,
      meta: memory.meta || {},
    };

    await ensure_embedding(forged);

    return forged;
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
export function apply_state_mutations(entity, mutations, session = null) {
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
      resolve(entity, v.id, v.resolution_summary || "DIRECTOR_RESOLUTION", session);
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
      ensure_embedding(new_vector).catch(() => {});
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
  score_async,
  format,
  resolve,
  forge_memory,
  apply_state_mutations,
  set_round,
  _is_consolidating: false,

  /**
   * BATCH CONSOLIDATION (The Forging Cycle)
   * Evicts old messages and compresses them into the Temporal Archive.
   * Single-pass: one forge_memory call generates a shared memory that is appended
   * to ALL three entities' past arrays. The LLM already returns present_summaries
   * and eternal_mutations for all three entities in one response.
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
      const unconsolidated = messages.filter((m) => !m.meta?.consolidated && m.role !== "system");

      if (unconsolidated.length >= 8) {
        const slice = unconsolidated.slice(0, 8);

        app.log(`[TemporalEngine] Forging ${slice.length} turns into Historical Archive (all entities)...`, "system");

        const memory = await forge_memory(runtime.active_ai || runtime.active_user || runtime.active_fractal, slice, "character");
        if (memory) {
          const entity_targets = [
            { entity: runtime.active_ai, type: "character" },
            { entity: runtime.active_user, type: "character" },
            { entity: runtime.active_fractal, type: "fractal" },
          ].filter((t) => t.entity);

          for (const { entity, type } of entity_targets) {
            if (!Array.isArray(entity.past)) entity.past = [];
            entity.past = [...entity.past, { ...memory }];
            await runtime.update_entity(type, entity.id, { past: entity.past });
          }

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

            if (memory.tags.includes("eternal-shift")) {
              for (const { entity, type } of entity_targets) {
                const vectorIdx = entity.past.findIndex((v) => v.id === memory.id);
                if (vectorIdx !== -1) {
                  entity.past[vectorIdx] = { ...memory };
                  await runtime.update_entity(type, entity.id, { past: entity.past });
                }
              }
            }
          }

          await Session.log_system_entry(`Memory Forged (all): ${memory.directive.substring(0, 50)}...`, "system", {
            type: "MEMORY_FORMATION",
            target: "ALL",
            vectors: { past: [memory], future: [] },
            turns_count: slice.length,
          });
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
