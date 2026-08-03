/**
 * @file src/intelligence/temporal.js
 * ⏳ TEMPORAL ENGINE — Temporal Fabric Coordinator
 * Consolidates Past (Historical Anchors) and Future (Active Impulses) into a unified temporal continuum.
 */

import { generate_uuid as _uuid, state_bridge } from "@utils";
import { llm_service } from "@platform";
import { ensure_embedding, score_by_semantics, cosine_similarity, embed, is_ready } from "./embeddings.svelte.js";
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
 * @property {string} content - The narrative payload.
 * @property {string} type - "past" | "future".
 * @property {number} emotional_weight - Narrative gravity (1-10), defaults to 5.
 * @property {Object} meta - Opaque metadata container.
 * @property {number} [_relevance] - Calculated RAG score (transient).
 * @property {Float32Array} [_embedding] - Semantic embedding vector (transient, not persisted).
 * @property {number} [_recency_factor] - Calculated recency decay (transient).
 */

/**
 * @typedef {Object} TemporalScoringConfig
 * @property {number} SEMANTIC_GAIN - How much semantic similarity stretches the score (0-1 similarity → ×1..×1+GAIN).
 * @property {number} RECENCY_FLOOR - Minimum effective recency multiplier, so age can never drown out relevance entirely.
 * @property {number} DECAY_SOFTEN - Exponent applied to the raw decay factor; <1 flattens the decay curve.
 */
/** @type {TemporalScoringConfig} */
export const TEMPORAL_SCORING = {
  SEMANTIC_GAIN: 3,
  RECENCY_FLOOR: 0.5,
  DECAY_SOFTEN: 0.5,
};

/**
 * Valid temporal types a forged memory may originate as.
 * "past" = settled historical anchor, "future" = prophecy/intent to carry
 * forward, "present" = immediate directive enacted onto the entity's present
 * state. Anything else normalizes to "past" (the legacy default).
 */
const VALID_FORGED_TYPES = new Set(["past", "future", "present"]);

/**
 * @param {unknown} value
 * @returns {"past" | "future" | "present"}
 */
function normalize_forged_type(value) {
  const type = String(value || "")
    .toLowerCase()
    .trim();
  return VALID_FORGED_TYPES.has(type) ? /** @type {any} */ (type) : "past";
}

/**
 * Creates a rich Temporal Log Entry (Vector).
 * @param {string} content - The narrative payload.
 * @param {string} [type="future"] - "past" | "future".
 * @param {number} [weight=5] - 1-10 priority.
 * @returns {TemporalVector} A strict Temporal Vector.
 */
export function create(content, type = "future", weight = 5) {
  return {
    id: _uuid(),
    timestamp: Date.now(),
    content: content || "",
    type,
    emotional_weight: weight,
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
function recency_factor(v, current_round) {
  const weight = v.emotional_weight ?? 5;
  if (weight >= 10) return 1.0;

  if (v.meta?.round != null && current_round != null) {
    const turns_ago = Math.max(0, current_round - v.meta.round);
    if (turns_ago === 0) return 1;
    const decay_exponent = Math.max(0, (10 - weight) / 5);
    return Math.pow(1 / (1 + Math.log10(turns_ago + 1)), decay_exponent);
  }

  if (!v.timestamp) return 1;
  const age_ms = Date.now() - v.timestamp;
  if (age_ms <= 0) return 1;
  const estimated_turns = Math.max(1, Math.floor(age_ms / 60000));
  const decay_exponent = Math.max(0, (10 - weight) / 5);
  return Math.pow(1 / (1 + Math.log10(estimated_turns + 1)), decay_exponent);
}

/**
 * Computes the final relevance score for a vector.
 * Formula: emotional_weight × (1 + SEMANTIC_GAIN × semantic) × effective_recency
 * - emotional_weight is the base (1-10)
 * - semantic_match is 0-1 (cosine similarity from embeddings, clamped; 0 if unavailable)
 * - effective_recency is the raw logarithmic decay factor, softened (^DECAY_SOFTEN)
 *   and floored at RECENCY_FLOOR so age biases but never dominates semantics.
 * @param {any} v
 * @param {number} semantic_similarity
 * @param {number} current_round
 * @returns {number}
 */
function compute_relevance(v, semantic_similarity, current_round) {
  const weight = v.emotional_weight ?? 5;
  const { SEMANTIC_GAIN, RECENCY_FLOOR, DECAY_SOFTEN } = TEMPORAL_SCORING;
  const semantic = Math.max(0, Math.min(1, semantic_similarity || 0));
  const raw_recency = recency_factor(v, current_round);
  const recency = Math.max(RECENCY_FLOOR, Math.pow(raw_recency, DECAY_SOFTEN));
  v._recency_factor = recency;
  return weight * (1 + SEMANTIC_GAIN * semantic) * recency;
}

/**
 * Scores a collection of Temporal Vectors against an input query context.
 * Performs linear weighted calculation taking into account emotional_weight and recency.
 * @param {TemporalVector[]} vectors
 * @param {string} input
 * @returns {TemporalVector[]} Sorted array of vectors (highest relevance first)
 */
export function score(vectors) {
  if (!Array.isArray(vectors) || !vectors.length) return [];

  const has_embeddings = vectors.some((v) => v._embedding && v._embedding.length);

  const scored = vectors.map((v) => {
    let semantic = 0;
    if (has_embeddings && v._embedding && _context_embedding) {
      semantic = cosine_similarity(_context_embedding, v._embedding);
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

/** @type {Float32Array | null} */
let _context_embedding = null;

/**
 * Pre-computes and caches the context embedding for synchronous score() calls.
 * Call this before score() when you have the input text and want semantic scoring
 * without going fully async.
 * @param {string} input
 */
export async function precompute_context_embedding(input) {
  if (!input?.trim()) {
    _context_embedding = null;
    return;
  }
  _context_embedding = await embed(input);
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
  const show_text = options.vector_text ?? true;
  const max_chars = options.max_chars || 1500;
  const offset = options.offset || 0;

  const ranked = score(vectors, input).slice(offset);

  let running_chars = 0;
  const selected = [];
  const selected_texts = [];

  for (const v of ranked) {
    const text = v.content || "";
    if (!text.trim()) continue;

    if (is_duplicate(text, selected_texts.join(" "))) continue;

    const payload_length = text.length;
    if (running_chars + payload_length > max_chars && selected.length > 0) {
      break;
    }

    selected.push(v);
    selected_texts.push(text);
    running_chars += payload_length;
  }

  return selected
    .map((v) => {
      if (show_text) return v.content || "";
      return "";
    })
    .join("\n");
}

/**
 * Async semantic variant of format(). Uses score_async (embeddings-based RAG)
 * when the embeddings model is ready, falling back to synchronous score() otherwise.
 * @param {TemporalVector[]} vectors
 * @param {string} input
 * @param {Object} [options]
 * @param {boolean} [options.vector_text]
 * @param {number} [options.offset]
 * @param {number} [options.max_chars]
 * @returns {Promise<string>}
 */
export async function format_async(vectors, input, options = {}) {
  const show_text = options.vector_text ?? true;
  const max_chars = options.max_chars || 1500;
  const offset = options.offset || 0;

  const ranked = is_ready() ? await score_async(vectors, input) : score(vectors, input);
  const sliced = ranked.slice(offset);

  let running_chars = 0;
  const selected = [];
  const selected_texts = [];

  for (const v of sliced) {
    const text = v.content || "";
    if (!text.trim()) continue;

    if (is_duplicate(text, selected_texts.join(" "))) continue;

    const payload_length = text.length;
    if (running_chars + payload_length > max_chars && selected.length > 0) {
      break;
    }

    selected.push(v);
    selected_texts.push(text);
    running_chars += payload_length;
  }

  return selected
    .map((v) => {
      if (show_text) return v.content || "";
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
  if (!entity || !Array.isArray(entity.vectors)) return;
  const index = entity.vectors.findIndex((v) => v.id === vector_id);
  if (index === -1) return;

  const [vector] = entity.vectors.splice(index, 1);
  vector.type = "past";
  vector.timestamp = Date.now();
  entity.vectors.push(vector);

  if (session?.log_system_entry) {
    const text = vector.content || "";
    session.log_system_entry(`Vector Resolved: ${text.substring(0, 40)}... [${resolution || "PAST"}]`, "system", {
      type: "VECTOR_RESOLUTION",
      vector,
      resolution,
    });
  }
}

/**
 * Generates entity-specific Memory records from a slice of history.
 * One forged vector per active entity (AI Character, User Persona, Fractal),
 * each written from that entity's own perspective, with an explicit type
 * ("past" | "future" | "present") so consolidated memories can become
 * historical anchors, forward prophecies, or immediate present directives
 * instead of defaulting strictly to "past".
 *
 * Legacy fallback: if the LLM returns the old single-`directive` shape, the
 * shared directive is replicated into every active entity's memory, preserving
 * the previous behavior.
 *
 * @param {Array<{key: string, type: string, entity: SimulationEntity}>} entity_targets
 * @param {any[]} history_slice
 * @returns {Promise<{memories: Record<string, any|null>, present_summaries: any, eternal_mutations: any} | null>}
 */
export async function forge_memory(entity_targets, history_slice) {
  if (!Array.isArray(entity_targets) || entity_targets.length === 0) return null;
  try {
    const entities = {
      AI_CHARACTER: entity_targets.find((t) => t.key === "AI_CHARACTER")?.entity || null,
      USER_PERSONA: entity_targets.find((t) => t.key === "USER_PERSONA")?.entity || null,
      FRACTAL: entity_targets.find((t) => t.key === "FRACTAL")?.entity || null,
    };

    const payload = prompt_builder.build_memory_prompt(entities, history_slice);
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

    const raw_memories = memory?.memories && typeof memory.memories === "object" ? memory.memories : null;
    const legacy_directive = String(memory?.directive || memory?.summary || "").trim();
    if (!raw_memories && !legacy_directive) return null;

    const forged = {
      memories: {},
      present_summaries: memory?.present_summaries || null,
      eternal_mutations: memory?.eternal_mutations || null,
    };

    for (const { key } of entity_targets) {
      const raw = raw_memories?.[key] && typeof raw_memories[key] === "object" ? raw_memories[key] : {};
      const content = String(raw.content ?? raw.directive ?? raw.summary ?? "").trim() || legacy_directive;
      if (!content) continue;

      const vector = {
        id: _uuid(),
        timestamp: Date.now(),
        type: normalize_forged_type(raw.type),
        content,
        emotional_weight: Number(raw.emotional_weight ?? raw.base_weight ?? memory?.emotional_weight ?? memory?.base_weight ?? 5) || 5,
        tags: (raw.vector_tags || raw.tags || memory?.tags || []).map((t) => String(t).toLowerCase()).filter(Boolean),
        meta: { ...(memory?.meta || {}), forged_for: key },
      };

      // Present directives merge straight into the entity's present state and
      // never enter the vector arrays, so only past/future need embeddings.
      if (vector.type !== "present") {
        await ensure_embedding(vector);
      }

      forged.memories[key] = vector;
    }

    const has_any = Object.values(forged.memories).some(Boolean);
    if (!has_any) return null;

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
 * @param {SessionDriver|null} [session=null]
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
    if (!Array.isArray(entity.vectors)) entity.vectors = [];
    mutations.new_vectors.forEach((v) => {
      const payload = (v.content || v.directive || "").trim();
      if (!payload) return;
      const new_vector = create(payload, v.type || "future", v.weight || 5);
      v.id = new_vector.id;
      ensure_embedding(new_vector)
        .then(() => {
          if (entity?.id) {
            const type = entity.type === "fractal" ? "fractal" : "character";
            state_bridge.runtime?.update_entity?.(type, entity.id, { vectors: entity.vectors })?.catch(() => {});
          }
        })
        .catch(() => {});
      entity.vectors.push(new_vector);
      changed = true;
    });
  }

  // 5. Eternal Mutations (permanent shifts)
  if (mutations.eternal_mutations && entity.eternal) {
    if (mutations.eternal_mutations.physical?.trim()) {
      entity.eternal.physical = merge_prose_into_field(entity.eternal.physical, mutations.eternal_mutations.physical);
      changed = true;
    }
    if (mutations.eternal_mutations.non_physical?.trim()) {
      entity.eternal.non_physical = merge_prose_into_field(entity.eternal.non_physical, mutations.eternal_mutations.non_physical);
      changed = true;
    }
  }

  // FIX #2: Immediately flush the mutated present state back to Dexie so that
  // any code path that reads from the DB (e.g. _resolveEntity fallback in
  // visual.svelte.js) also sees the updated clothing/condition state.
  // Fire-and-forget: keep this function synchronous for callers.
  if (changed && entity.id) {
    const type = entity.type === "fractal" ? "fractal" : "character";
    state_bridge.runtime
      ?.update_entity?.(type, entity.id, {
        present: entity.present,
        vectors: entity.vectors,
        eternal: entity.eternal,
      })
      ?.catch((err) => {
        console.warn("[TemporalEngine] Failed to flush present state to DB:", err);
      });
  }

  return changed;
}

/**
 * Neuroplasticity pass: after memory forge, positive memories decay high-weight
 * trauma vectors; high-chaos turns can relapse them. Modifies the AI entity's
 * past-type vectors in-place and persists via runtime.update_entity.
 * @param {Array<{entity: any, type: string}>} entity_targets
 * @param {any} memory - The forged memory object.
 * @param {any} runtime - Runtime state with update_entity and dynamics access.
 */
export function apply_neuroplasticity(entity_targets, memory, runtime) {
  try {
    const chaos = runtime?.active_ai?.dynamics?.chaos ?? 50;
    const mem_text = String(memory?.content || "").toLowerCase();
    const is_reconciliation = mem_text.includes("reconciliation") || mem_text.includes("healing");
    const is_positive = (memory?.emotional_weight ?? 5) <= 4 || is_reconciliation;

    const ai_target = entity_targets.find((t) => t.entity === runtime?.active_ai);
    if (!ai_target || !Array.isArray(ai_target.entity.vectors)) return;

    let changed = false;
    for (const v of ai_target.entity.vectors) {
      if (v.type === "future") continue;
      if (v.emotional_weight >= 8) {
        if (is_positive && chaos < 80) {
          v.emotional_weight = Math.max(1, v.emotional_weight - 1);
          changed = true;
        } else if (chaos > 80) {
          v.emotional_weight = Math.min(10, v.emotional_weight + 1);
          changed = true;
        }
      }
    }
    if (changed) {
      runtime?.update_entity?.(ai_target.type, ai_target.entity.id, { vectors: ai_target.entity.vectors });
    }
  } catch (err) {
    console.error("[TemporalEngine] Neuroplasticity pass failed:", err);
  }
}

export const temporal_engine = {
  create,
  score,
  score_async,
  format,
  format_async,
  resolve,
  forge_memory,
  apply_state_mutations,
  set_round,
  precompute_context_embedding,
  _is_consolidating: false,

  /**
   * BATCH CONSOLIDATION (The Forging Cycle)
   * Evicts old messages and compresses them into the Temporal Archive.
   * Single-pass: one forge_memory call generates an ENTITY-SPECIFIC memory
   * for each active entity (AI Character, User Persona, Fractal), written
   * from that entity's own perspective — no more duplicating one shared
   * character vector across all three. Each memory is routed by its forged
   * type: "past"/"future" → entity.vectors, "present" → merged into the
   * entity's present state as an immediate directive.
   * The LLM also returns per-entity present_summaries and eternal_mutations
   * in the same single response.
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

        app.log(`[TemporalEngine] Forging ${slice.length} turns into Historical Archive...`, "system");

        const entity_targets = [
          { key: "AI_CHARACTER", type: "character", entity: runtime.active_ai },
          { key: "USER_PERSONA", type: "character", entity: runtime.active_user },
          { key: "FRACTAL", type: "fractal", entity: runtime.active_fractal },
        ].filter((t) => t.entity);

        const forged = await forge_memory(entity_targets, slice);
        if (forged) {
          // 1. Route each entity's OWN memory by its forged type.
          for (const { key, type, entity } of entity_targets) {
            const memory = forged.memories?.[key];
            if (!memory) continue;

            if (memory.type === "future") {
              if (!Array.isArray(entity.vectors)) entity.vectors = [];
              entity.vectors = [...entity.vectors, memory];
              await runtime.update_entity(type, entity.id, { vectors: entity.vectors });
            } else if (memory.type === "present") {
              if (!entity.present) entity.present = { physical: "", non_physical: "" };
              entity.present.non_physical = merge_prose_into_field(entity.present.non_physical, memory.content || memory.directive || "");
              await runtime.update_entity(type, entity.id, { present: entity.present });
            } else {
              if (!Array.isArray(entity.vectors)) entity.vectors = [];
              entity.vectors = [...entity.vectors, memory];
              await runtime.update_entity(type, entity.id, { vectors: entity.vectors });
            }
          }

          if (forged.memories?.AI_CHARACTER) {
            apply_neuroplasticity(entity_targets, forged.memories.AI_CHARACTER, runtime);
          }

          // 2. Present summaries (per entity).
          if (forged.present_summaries) {
            const summaries = forged.present_summaries;
            for (const { key, type, entity } of entity_targets) {
              const summary = summaries[key];
              if (!summary) continue;
              if (!entity.present) entity.present = { physical: "", non_physical: "" };
              if (summary.physical) entity.present.physical = summary.physical;
              if (summary.non_physical) entity.present.non_physical = summary.non_physical;
              await runtime.update_entity(type, entity.id, { present: entity.present });
            }
          }

          // 3. Eternal mutations (per entity) — tag the entity's OWN memory.
          if (forged.eternal_mutations) {
            const e_muts = forged.eternal_mutations;
            for (const { key, type, entity } of entity_targets) {
              const e_mut = e_muts[key];
              if (!e_mut) continue;
              if (!entity.eternal) entity.eternal = { physical: "", non_physical: "" };
              let eternal_changed = false;
              if (e_mut.physical?.trim()) {
                entity.eternal.physical = merge_prose_into_field(entity.eternal.physical, e_mut.physical);
                eternal_changed = true;
              }
              if (e_mut.non_physical?.trim()) {
                entity.eternal.non_physical = merge_prose_into_field(entity.eternal.non_physical, e_mut.non_physical);
                eternal_changed = true;
              }
              if (eternal_changed) {
                await runtime.update_entity(type, entity.id, { eternal: entity.eternal });
                const memory = forged.memories?.[key];
                if (memory && memory.type !== "present" && !memory.tags.includes("eternal-shift")) {
                  memory.tags.push("eternal-shift");
                  const payload = {};
                  if (Array.isArray(entity.vectors)) payload.vectors = entity.vectors;
                  await runtime.update_entity(type, entity.id, payload);
                }
              }
            }
          }

          // 4. Log one MEMORY_FORMATION per entity.
          for (const { key } of entity_targets) {
            const memory = forged.memories?.[key];
            if (!memory) continue;
            const text = memory.content || memory.directive || "";
            await Session.log_system_entry(`Memory Forged (${key}): ${text.substring(0, 50)}...`, "system", {
              type: "MEMORY_FORMATION",
              target: key,
              vectors: [memory],
              turns_count: slice.length,
            });
          }
        }

        for (const msg of slice) {
          msg.meta = { ...msg.meta, consolidated: true };
        }
        await db.simulation_log.bulkPut(slice);
        state_bridge.simulation_log?.refresh();
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
    if (fractal && (!Array.isArray(fractal.vectors) || !fractal.vectors.some((v) => v.type === "future"))) {
      app?.log("[TemporalEngine] Placeholder momentum active (No vectors found)", "system");
    }
  },
};
