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

/**
 * 🧠 VECTOR POOL — Unified memory accessor.
 * Entities store memories in the `past` and `future` arrays. `resolve_vector_pool`
 * flattens both into a single normalized pool so every read path shares one
 * consistent shape and no memory is missed because it lived in the other array.
 */

/**
 * Merges an entity's memories into a single normalized array.
 * String items are passed through untouched.
 * @param {any} entity
 * @returns {any[]}
 */
export function resolve_vector_pool(entity) {
  if (!entity || typeof entity !== "object") return [];
  const normalize_item = (v, type) => (v && typeof v === "object" ? { ...v, type, content: v.content || v.directive || "" } : v);
  const pool = [];
  if (Array.isArray(entity.past)) {
    for (const v of entity.past) pool.push(normalize_item(v, v?.type === "future" ? "future" : "past"));
  }
  if (Array.isArray(entity.future)) {
    for (const v of entity.future) pool.push(normalize_item(v, v?.type === "past" ? "past" : "future"));
  }
  return pool;
}

export const TEMPORAL_SCORING = {
  SEMANTIC_GAIN: 3,
  RECENCY_FLOOR: 0.5,
  DECAY_SOFTEN: 0.5,
};

const VALID_FORGED_TYPES = new Set(["past", "future", "present"]);

function normalize_forged_type(value) {
  const type = String(value || "")
    .toLowerCase()
    .trim();
  return VALID_FORGED_TYPES.has(type) ? /** @type {any} */ (type) : "past";
}

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

function compute_relevance(v, semantic_similarity, current_round) {
  const weight = v.emotional_weight ?? 5;
  const { SEMANTIC_GAIN, RECENCY_FLOOR, DECAY_SOFTEN } = TEMPORAL_SCORING;
  const semantic = Math.max(0, Math.min(1, semantic_similarity || 0));
  const raw_recency = recency_factor(v, current_round);
  const recency = Math.max(RECENCY_FLOOR, Math.pow(raw_recency, DECAY_SOFTEN));
  v._recency_factor = recency;
  return weight * (1 + SEMANTIC_GAIN * semantic) * recency;
}

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

export async function precompute_context_embedding(input) {
  if (!input?.trim()) {
    _context_embedding = null;
    return;
  }
  // Cap the embedded context so a huge scoring blob can't stall inference.
  const capped = String(input).slice(0, 3000);
  _context_embedding = await embed(capped);
}

/** @type {number} */
let _current_round = 0;

export function set_round(round) {
  _current_round = round || 0;
}

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

// --- PROFILE HYGIENE (Fix: eternal/present pollution) ---
// ETERNAL is identity: it must not accumulate contradictory mutation lines.
// Appends are deduped (verbatim or near-duplicate lines are skipped) and capped
// from the TAIL so the opening identity block is always preserved.
export const FUTURE_VECTOR_CAP = 30;
const ETERNAL_MAX_CHARS = 1500;
const PRESENT_MAX_SEGMENTS = 3;

function vector_id_exists(entity, id) {
  if (!entity || !id) return false;
  return (
    (Array.isArray(entity.past) && entity.past.some((v) => v && v.id === id)) ||
    (Array.isArray(entity.future) && entity.future.some((v) => v && v.id === id))
  );
}

/** Reassigns a fresh UUID when a vector id collides with an existing one in either pool. */
export function ensure_unique_vector_id(entity, vector) {
  if (!entity || !vector || !vector.id) return vector;
  let attempts = 0;
  while (vector_id_exists(entity, vector.id) && attempts < 5) {
    vector.id = _uuid();
    attempts++;
  }
  return vector;
}

/** Pushes a future vector under a hard cap, logging the oldest eviction. */
export function append_future_vector(entity, vector) {
  if (!entity) return;
  if (!Array.isArray(entity.future)) entity.future = [];
  entity.future.push(vector);
  if (entity.future.length > FUTURE_VECTOR_CAP) {
    const evicted = entity.future.shift();
    const evicted_text = String(evicted?.content || evicted?.directive || "").trim();
    if (evicted_text) {
      console.warn(
        `[TemporalEngine] Future cap (${FUTURE_VECTOR_CAP}) reached — evicting oldest future vector: "${evicted_text.slice(0, 60)}${evicted_text.length > 60 ? "..." : ""}"`,
      );
      try {
        state_bridge.app?.log?.(
          `[TemporalEngine] Evicted oldest future vector (cap ${FUTURE_VECTOR_CAP}): "${evicted_text.slice(0, 40)}..."`,
          "warn",
        );
      } catch (err) {
        /* never let telemetry break the mutation path */
      }
    }
  }
}

/** Deduplicates an incoming eternal mutation against the existing identity field. */
function eternal_field_dedup(existing, incoming) {
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  const inc = norm(incoming);
  if (!inc) return true;
  const lines = String(existing || "")
    .split("\n")
    .map(norm)
    .filter(Boolean);
  if (lines.includes(inc)) return true;
  for (const line of lines) {
    if (line && is_duplicate(line, inc)) return true;
  }
  return false;
}

/**
 * Merges new prose into an ETERNAL identity field: skips near-duplicates and
 * caps from the tail so the identity opening is never overwritten by pollution.
 */
function merge_eternal_field(current_field_value, new_prose) {
  if (!new_prose || !new_prose.trim()) return current_field_value || "";
  const existing = String(current_field_value || "").trim();
  if (existing && eternal_field_dedup(existing, new_prose)) return existing;
  const combined = existing ? `${existing}\n${new_prose.trim()}` : new_prose.trim();
  return combined.length > ETERNAL_MAX_CHARS ? combined.slice(0, ETERNAL_MAX_CHARS) : combined;
}

/**
 * Decays a PRESENT prose field to its most recent segments so stale snapshots
 * ("standing in the penthouse doorway" + "by the wall of files in B7" at once)
 * can never pile up between consolidations.
 */
function cap_present_prose(current_field_value) {
  const lines = String(current_field_value || "")
    .split("\n")
    .filter((l) => l.trim());
  if (lines.length <= PRESENT_MAX_SEGMENTS) return lines.join("\n");
  return lines.slice(-PRESENT_MAX_SEGMENTS).join("\n");
}

export function format(vectors, input, options = {}) {
  const show_text = options.vector_text ?? true;
  const max_chars = options.max_chars || 1500;
  const offset = options.offset || 0;

  const ranked = score(vectors, input).slice(offset);

  let running_chars = 0;
  const selected = [];
  const selected_texts = [];

  for (const v of ranked) {
    const text = v.content || v.directive || "";
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
      if (show_text) return v.content || v.directive || "";
      return "";
    })
    .join("\n");
}

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
    const text = v.content || v.directive || "";
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
      if (show_text) return v.content || v.directive || "";
      return "";
    })
    .join("\n");
}

export function resolve(entity, vector_id, resolution = null, session = null) {
  if (!entity || typeof entity !== "object") return;
  let vector = null;
  for (const key of ["future", "past"]) {
    const arr = entity[key];
    if (!Array.isArray(arr)) continue;
    const index = arr.findIndex((v) => v.id === vector_id);
    if (index !== -1) {
      [vector] = arr.splice(index, 1);
      break;
    }
  }
  if (!vector) return;

  if (!Array.isArray(entity.past)) entity.past = [];
  vector.type = "past";
  vector.timestamp = Date.now();
  entity.past.push(vector);

  if (session?.log_system_entry) {
    const text = vector.content || "";
    session.log_system_entry(`Vector Resolved: ${text.substring(0, 40)}... [${resolution || "PAST"}]`, "system", {
      type: "VECTOR_RESOLUTION",
      vector,
      resolution,
    });
  }
}

/** Parses an llm_service forge response into a memory JSON object, or null. */
function parse_forge_response(response) {
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
  try {
    return JSON.parse(json_string);
  } catch (e) {
    console.warn("[TemporalEngine] Malformed JSON in memory forge:", e);
    return null;
  }
}

export async function forge_memory(entity_targets, history_slice) {
  if (!Array.isArray(entity_targets) || entity_targets.length === 0) return null;
  try {
    const entities = {
      AI_CHARACTER: entity_targets.find((t) => t.key === "AI_CHARACTER")?.entity || null,
      USER_PERSONA: entity_targets.find((t) => t.key === "USER_PERSONA")?.entity || null,
      FRACTAL: entity_targets.find((t) => t.key === "FRACTAL")?.entity || null,
    };

    const attempt = async () => {
      const payload = prompt_builder.build_memory_prompt(entities, history_slice);
      const response = await llm_service.generate(payload, {
        json: true,
        silent: true,
        raw: true,
      });
      return parse_forge_response(response);
    };

    let memory = await attempt();
    if (!memory) {
      // Terse retry: the prompt builder compresses the history on rebuild, so a
      // second call usually emits a complete payload.
      console.warn("[TemporalEngine] Memory forge returned no JSON — retrying once.");
      memory = await attempt();
    }
    if (!memory) return null;

    const forged = {
      memories: {},
      present_consolidated: memory?.present_consolidated || {},
      eternal_consolidated: memory?.eternal_consolidated || {},
    };

    for (const { key } of entity_targets) {
      const entity_block = memory?.[key] && typeof memory[key] === "object" ? memory[key] : {};

      const pres = entity_block.present_consolidated;
      if (pres && typeof pres === "object") {
        forged.present_consolidated[key] = pres;
      }

      const et = entity_block.eternal_consolidated;
      if (et && typeof et === "object") {
        forged.eternal_consolidated[key] = et;
      }

      const raw_vectors = Array.isArray(entity_block.vector_append) ? entity_block.vector_append : [];

      forged.memories[key] = [];

      for (const raw of raw_vectors) {
        if (!raw || typeof raw !== "object") continue;
        const content = String(raw.content ?? raw.directive ?? "").trim();
        if (!content) continue;

        const vector = {
          id: _uuid(),
          timestamp: Date.now(),
          type: normalize_forged_type(raw.type),
          content,
          emotional_weight: Number(raw.emotional_weight ?? 5) || 5,
          meta: { ...(memory?.meta || {}), forged_for: key },
        };

        if (vector.type !== "present") {
          await ensure_embedding(vector);
        }

        forged.memories[key].push(vector);
      }
    }

    const has_memories = Object.values(forged.memories).some((arr) => arr.length > 0);
    const has_present = Object.keys(forged.present_consolidated).length > 0;
    const has_eternal = Object.keys(forged.eternal_consolidated).length > 0;

    if (!has_memories && !has_present && !has_eternal) return null;

    return forged;
  } catch (err) {
    console.error("[TemporalEngine] Resonance forge failed.", err);
    return null;
  }
}

/**
 * Deterministic fallback when the LLM memory forge fails twice: derive a "past"
 * vector straight from the slice's beats so temporal memory and the
 * MEMORY_FORMATION card still advance even without a model response.
 * @param {Array<{key:string,type:string,entity:any}>} entity_targets
 * @param {Array<any>} slice
 * @param {any} runtime
 * @param {any} session
 */
async function fallback_consolidate(entity_targets, slice, runtime, session) {
  try {
    const facts = (Array.isArray(slice) ? slice : [])
      .filter((m) => m && (m.role === "ai" || m.role === "fractal" || m.role === "user"))
      .map((m) => {
        const speaker = m.character_name || (m.role === "ai" ? "AI" : m.role === "user" ? "User" : "Environment");
        return `${speaker}: ${String(m.text ?? m.content ?? "")
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 220)}`;
      })
      .join(" ");

    for (const { key, type, entity } of entity_targets) {
      if (!entity) continue;
      const content = facts ? `Past: ${facts.slice(0, 500)}` : `${entity.name || key} carries the last events forward.`;
      const vector = create(content, "past", 5);
      ensure_unique_vector_id(entity, vector);
      entity.past = [...(entity.past || []), vector];
      await runtime.update_entity(type, entity.id, { past: entity.past });
      await session.log_system_entry(`Memory Forged (${key}): ${vector.content.substring(0, 50)}...`, "system", {
        type: "MEMORY_FORMATION",
        target: key,
        memories: [vector],
        turns_count: slice.length,
      });
    }
    state_bridge.app?.log?.("[TemporalEngine] LLM forge unavailable — past vectors derived deterministically.", "warn");
  } catch (err) {
    // The fallback must never abort slice consolidation (bulkPut marking).
    console.warn("[TemporalEngine] Fallback consolidation incomplete:", err);
  }
}

export function apply_state_mutations(entity, mutations, session = null) {
  if (!entity || !mutations || typeof mutations !== "object") return false;
  let changed = false;

  const pres_phys = mutations.present_append?.physical || mutations.present_mutations?.physical || mutations.present_append_physical || "";
  if (pres_phys.trim()) {
    if (!entity.present) entity.present = { physical: "", non_physical: "" };
    entity.present.physical = merge_prose_into_field(entity.present.physical, pres_phys);
    changed = true;
  }

  const pres_non_phys =
    mutations.present_append?.non_physical || mutations.present_mutations?.non_physical || mutations.present_append_non_physical || "";
  if (pres_non_phys.trim()) {
    if (!entity.present) entity.present = { physical: "", non_physical: "" };
    entity.present.non_physical = cap_present_prose(merge_prose_into_field(entity.present.non_physical, pres_non_phys));
    changed = true;
  }

  const resolve_list = Array.isArray(mutations.vector_resolve)
    ? mutations.vector_resolve
    : Array.isArray(mutations.resolve_vectors)
      ? mutations.resolve_vectors
      : [];
  if (resolve_list.length > 0) {
    resolve_list.forEach((v) => {
      resolve(entity, v.id, v.resolution_summary || "DIRECTOR_RESOLUTION", session);
      changed = true;
    });
  }

  const new_list = Array.isArray(mutations.vector_append)
    ? mutations.vector_append
    : Array.isArray(mutations.new_vectors)
      ? mutations.new_vectors
      : [];
  if (new_list.length > 0) {
    new_list.forEach((v) => {
      const payload = (v.content || v.directive || "").trim();
      if (!payload) return;
      const new_vector = create(payload, v.type === "past" ? "past" : "future", v.emotional_weight ?? v.weight ?? 5);
      const bucket = new_vector.type === "future" ? "future" : "past";
      if (!Array.isArray(entity[bucket])) entity[bucket] = [];
      ensure_unique_vector_id(entity, new_vector);
      v.id = new_vector.id;
      ensure_embedding(new_vector)
        .then(() => {
          if (entity?.id) {
            const type = entity.type === "fractal" ? "fractal" : "character";
            state_bridge.runtime?.update_entity?.(type, entity.id, { past: entity.past, future: entity.future })?.catch(() => {});
          }
        })
        .catch(() => {});
      if (new_vector.type === "future") {
        append_future_vector(entity, new_vector);
      } else {
        entity[bucket].push(new_vector);
      }
      changed = true;
    });
  }

  const eternal_muts = mutations.eternal_consolidated || mutations.eternal_baseline || mutations.eternal_mutations;
  if (eternal_muts && entity.eternal) {
    if (eternal_muts.physical?.trim()) {
      entity.eternal.physical = merge_eternal_field(entity.eternal.physical, eternal_muts.physical);
      changed = true;
    }
    if (eternal_muts.non_physical?.trim()) {
      entity.eternal.non_physical = merge_eternal_field(entity.eternal.non_physical, eternal_muts.non_physical);
      changed = true;
    }
  }

  if (changed && entity.id) {
    const type = entity.type === "fractal" ? "fractal" : "character";
    state_bridge.runtime
      ?.update_entity?.(type, entity.id, {
        present: entity.present,
        past: entity.past,
        future: entity.future,
        eternal: entity.eternal,
      })
      ?.catch((err) => {
        console.warn("[TemporalEngine] Failed to flush present state to DB:", err);
      });
  }

  return changed;
}

export function apply_neuroplasticity(entity_targets, memory, runtime) {
  try {
    const chaos = runtime?.active_ai?.dynamics?.chaos ?? 50;
    const mem_text = String(memory?.content || "").toLowerCase();
    const is_reconciliation = mem_text.includes("reconciliation") || mem_text.includes("healing");
    const is_positive = (memory?.emotional_weight ?? 5) <= 4 || is_reconciliation;

    const ai_target = entity_targets.find((t) => t.entity === runtime?.active_ai);
    if (!ai_target || !Array.isArray(ai_target.entity.past)) return;

    let changed = false;
    for (const v of ai_target.entity.past) {
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
      runtime?.update_entity?.(ai_target.type, ai_target.entity.id, { past: ai_target.entity.past });
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
  append_future_vector,
  ensure_unique_vector_id,
  set_round,
  precompute_context_embedding,
  _is_consolidating: false,

  consolidate: async (session, db, entities, runtime, app) => {
    if (temporal_engine._is_consolidating) return;
    temporal_engine._is_consolidating = true;

    try {
      const story_id = session.require_active();
      const messages = await session.load_log(story_id);
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
          for (const { key, type, entity } of entity_targets) {
            const memories = forged.memories?.[key] || [];
            for (const memory of memories) {
              if (memory.type === "future") {
                ensure_unique_vector_id(entity, memory);
                append_future_vector(entity, memory);
                await runtime.update_entity(type, entity.id, { future: entity.future });
              } else if (memory.type === "present") {
                if (!entity.present) entity.present = { physical: "", non_physical: "" };
                entity.present.non_physical = cap_present_prose(
                  merge_prose_into_field(entity.present.non_physical, memory.content || memory.directive || ""),
                );
                await runtime.update_entity(type, entity.id, { present: entity.present });
              } else {
                ensure_unique_vector_id(entity, memory);
                entity.past = [...(entity.past || []), memory];
                await runtime.update_entity(type, entity.id, { past: entity.past });
              }
            }
          }

          if (forged.memories?.AI_CHARACTER?.length) {
            const primary_mem = forged.memories.AI_CHARACTER[0];
            if (primary_mem) {
              apply_neuroplasticity(entity_targets, primary_mem, runtime);
            }
          }

          if (forged.present_consolidated) {
            const summaries = forged.present_consolidated;
            for (const { key, type, entity } of entity_targets) {
              const summary = summaries[key];
              if (summary && typeof summary === "object") {
                if (!entity.present) entity.present = { physical: "", non_physical: "" };
                if (summary.physical !== undefined) entity.present.physical = summary.physical;
                if (summary.non_physical !== undefined) entity.present.non_physical = summary.non_physical;
              } else {
                // No fresh replacement this batch: decay the accumulated prose so
                // stale snapshots (conflicting locations/situations) can't pile up.
                if (entity.present && entity.present.non_physical) {
                  entity.present.non_physical = cap_present_prose(entity.present.non_physical);
                }
              }
              await runtime.update_entity(type, entity.id, { present: entity.present });
            }
          }

          if (forged.eternal_consolidated) {
            const e_muts = forged.eternal_consolidated;
            for (const { key, type, entity } of entity_targets) {
              const e_mut = e_muts[key];
              if (!e_mut || typeof e_mut !== "object") continue;
              if (!entity.eternal) entity.eternal = { physical: "", non_physical: "" };
              let eternal_changed = false;
              if (e_mut.physical?.trim()) {
                entity.eternal.physical = merge_eternal_field(entity.eternal.physical, e_mut.physical);
                eternal_changed = true;
              }
              if (e_mut.non_physical?.trim()) {
                entity.eternal.non_physical = merge_eternal_field(entity.eternal.non_physical, e_mut.non_physical);
                eternal_changed = true;
              }
              if (eternal_changed) {
                await runtime.update_entity(type, entity.id, { eternal: entity.eternal });
                const primary_vector = forged.memories?.[key]?.[0];
                if (primary_vector && primary_vector.type !== "present" && !primary_vector.meta?.eternal_shift) {
                  primary_vector.meta = { ...(primary_vector.meta || {}), eternal_shift: true };
                  await runtime.update_entity(type, entity.id, { past: entity.past, future: entity.future });
                }
              }
            }
          }

          for (const { key } of entity_targets) {
            const memories = forged.memories?.[key] || [];
            if (!memories.length) continue;
            const text = memories.map((v) => v.content || v.directive || "").join(" | ");
            await session.log_system_entry(`Memory Forged (${key}): ${text.substring(0, 50)}...`, "system", {
              type: "MEMORY_FORMATION",
              target: key,
              memories,
              turns_count: slice.length,
            });
          }
        } else {
          // LLM forge failed both attempts — derive past vectors deterministically
          // so memory and the formation card still advance.
          await fallback_consolidate(entity_targets, slice, runtime, session);
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

  ensure_momentum: (runtime, app) => {
    const fractal = runtime.active_fractal;
    if (fractal && !resolve_vector_pool(fractal).some((v) => v?.type === "future")) {
      app?.log("[TemporalEngine] Placeholder momentum active (No vectors found)", "system");
    }
  },
};
