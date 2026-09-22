/**
 * src/intelligence/temporal.js
 * ⏳ TEMPORAL ENGINE & MEMORY FORGE — Vector Math, Relevance Scoring & Prompt Compilers
 *
 * Sovereign domain file owning all temporal operations across Eternal, Present, Future, Past:
 * 1. Vector Pool Access & Creation (resolve_vector_pool, create, prune)
 * 2. Relevance Scoring & Context Embeddings (score, score_async, precompute_context_embedding)
 * 3. Vector Math & Dynamic Retrieval (format, score, score_async, score_by_semantics)
 * 4. Memory Forge Consolidation Prompt Rendering (render_memory; contracts/schemas live in modules/format.js)
 * 5. Deduplication, Caps & Eviction (is_origin, ensure_unique_vector_id, append_past_vector, reconcile_vector_caps)
 * 6. State Mutations & Chapter Archival (archive_chapter)
 * 7. Memory Forge & Consolidation Engine (forge_memory, temporal_engine)
 */

import {
  cosine_similarity,
  generate_uuid as generate_unique_id,
  merge_prose_into_field,
  collapse_whitespace,
  strip_cognition_blocks,
  truncate_at_word,
  is_narrative_role,
  state_bridge,
} from "@utils";
import { llm_service, ensure_embedding, score_by_semantics, embed, is_ready, deserialize_embedding } from "@platform";
import { apply_relationships } from "./director.js";
import { extract_and_repair_json } from "./parser.js";
import { compile_prompt } from "./prompts.js";

/**
 * @typedef {import('@state/runtime.svelte.js').SimulationEntity} SimulationEntity
 * @typedef {import('@data/sessions.svelte.js').session_driver} SessionDriver
 * @typedef {typeof import('@data/db.js').db} Database
 * @typedef {import('@data/repository.js').entities} EntityRepository
 */

/**
 * @typedef {Object} TemporalVector
 * @property {string} id - UUID unique identifier
 * @property {number} timestamp - Epoch timestamp of creation
 * @property {string} content - The narrative payload
 * @property {string} type - "past"
 * @property {number} emotional_weight - Narrative gravity (1-10), defaults to 5
 * @property {Object} meta - Metadata container
 * @property {number} [_relevance] - Calculated RAG score (transient)
 * @property {Float32Array} [_embedding] - Semantic embedding vector (transient)
 * @property {number} [_recency_factor] - Calculated recency decay (transient)
 */

// ── 1. Vector Pool Access & Creation ──────────────────────────────────────────

export const PAST_VECTOR_CAP = 20;
export const MAX_TOTAL_VECTORS = 200;
export const MAX_VECTOR_CHARS = 220;
const ETERNAL_MAX_CHARS = 1500;
const PRESENT_MAX_SEGMENTS = 3;
const FORGE_EMBED_BUDGET_MS = 45000;

export const TEMPORAL_SCORING = {
  SEMANTIC_GAIN: 3,
  RECENCY_FLOOR: 0.5,
  DECAY_SOFTEN: 0.5,
  IN_SCENE_SALIENCE_BOOST: 1.3,
};

const VALID_FORGED_TYPES = new Set(["past", "present"]);

/**
 * Normalizes an arbitrary string type into a valid forged vector type.
 * @param {any} value
 * @returns {'past'|'present'}
 */
function normalize_forged_type(value) {
  const type = String(value || "")
    .toLowerCase()
    .trim();
  return VALID_FORGED_TYPES.has(type) ? /** @type {'past'|'present'} */ (type) : "past";
}

/**
 * Creates a standard past memory vector.
 * @param {string} content
 * @param {string} [type='past']
 * @param {number} [weight=5]
 * @returns {TemporalVector}
 */
function create(content, type = "past", weight = 5) {
  return {
    id: `ai_${generate_unique_id()}`,
    timestamp: Date.now(),
    content: String(content || "").slice(0, MAX_VECTOR_CHARS),
    type,
    emotional_weight: weight,
    meta: {},
  };
}

/**
 * Merges an entity's memories into a single normalized array.
 * @param {any} entity
 * @returns {any[]}
 */
export function resolve_vector_pool(entity) {
  if (!entity || typeof entity !== "object") return [];
  const normalize_item = (vector, type) =>
    vector && typeof vector === "object" ? { ...vector, type, content: vector.content || vector.directive || "" } : vector;
  const pool = [];
  if (Array.isArray(entity.past)) {
    for (const vector of entity.past) pool.push(normalize_item(vector, "past"));
  }
  return pool;
}

/**
 * Prunes a vectors array for a compact snapshot: up to 3 past-type vectors.
 * @param {any[]} vectors
 * @returns {any[]}
 */
export function prune(vectors) {
  if (!Array.isArray(vectors)) return [];
  return vectors.slice(0, 3).map((vector) => ({
    id: vector.id,
    content: vector.content || vector.directive || vector.text || vector.summary || "",
    emotional_weight: vector.emotional_weight ?? 5,
    type: "past",
    meta: vector.meta || {},
  }));
}

// ── 2. Relevance Scoring & Context Embeddings ─────────────────────────────────

/** @type {Float32Array | null} */
let _context_embedding = null;

/** @type {number} */
let _current_round = 0;

/**
 * Sets the active simulation round for recency calculations.
 * @param {number} round
 */
export function set_round(round) {
  _current_round = round || 0;
}

/**
 * Precomputes and caches the context embedding for synchronous vector scoring.
 * @param {string} input
 */
export async function precompute_context_embedding(input) {
  if (!input?.trim()) {
    _context_embedding = null;
    return;
  }
  const capped = String(input).slice(0, 3000);
  _context_embedding = await embed(capped);
}

/**
 * Computes the recency decay multiplier for a vector.
 * @param {any} vector
 * @param {number} current_round
 * @returns {number}
 */
function recency_factor(vector, current_round) {
  const weight = vector.emotional_weight ?? 5;
  if (weight >= 10) return 1.0;

  if (vector.meta?.round != null && current_round != null) {
    const turns_ago = Math.max(0, current_round - vector.meta.round);
    if (turns_ago === 0) return 1;
    const decay_exponent = Math.max(0, (10 - weight) / 5);
    return Math.pow(1 / (1 + Math.log10(turns_ago + 1)), decay_exponent);
  }

  if (!vector.timestamp) return 1;
  const age_ms = Date.now() - vector.timestamp;
  if (age_ms <= 0) return 1;
  const estimated_turns = Math.max(1, Math.floor(age_ms / 60000));
  const decay_exponent = Math.max(0, (10 - weight) / 5);
  return Math.pow(1 / (1 + Math.log10(estimated_turns + 1)), decay_exponent);
}

/**
 * Computes the composite RAG relevance score for a vector.
 * @param {any} vector
 * @param {number} semantic_similarity
 * @param {number} current_round
 * @param {boolean} [in_scene=false]
 * @returns {number}
 */
function compute_relevance(vector, semantic_similarity, current_round, in_scene = false) {
  const weight = vector.emotional_weight ?? 5;
  const { SEMANTIC_GAIN, RECENCY_FLOOR, DECAY_SOFTEN, IN_SCENE_SALIENCE_BOOST } = TEMPORAL_SCORING;
  const semantic = Math.max(0, Math.min(1, semantic_similarity || 0));
  const raw_recency = recency_factor(vector, current_round);
  const recency = Math.max(RECENCY_FLOOR, Math.pow(raw_recency, DECAY_SOFTEN));
  vector._recency_factor = recency;

  // Pinned memories (usr_ or origin-flagged) rank higher
  const pinned_boost = vector.id?.startsWith("usr_") || is_origin(vector) ? 1.5 : 1.0;
  // Stage Spotlight presence gives +30% salience boost
  const in_scene_boost = in_scene ? IN_SCENE_SALIENCE_BOOST : 1.0;

  return weight * (1 + SEMANTIC_GAIN * semantic) * recency * pinned_boost * in_scene_boost;
}

/**
 * Synchronously scores memory vectors using cached context embeddings.
 * @param {any[]} vectors
 * @param {boolean} [in_scene=false]
 * @returns {any[]}
 */
export function score(vectors, in_scene = false) {
  if (!Array.isArray(vectors) || !vectors.length) return [];

  const has_embeddings = vectors.some((vector) => vector._embedding && vector._embedding.length);

  const scored = vectors.map((vector) => {
    let semantic = 0;
    if (has_embeddings && vector._embedding && _context_embedding) {
      semantic = cosine_similarity(_context_embedding, vector._embedding);
    }
    const relevance = compute_relevance(vector, semantic, _current_round, in_scene);
    return { ...vector, _relevance: relevance };
  });

  return scored.sort((a, b) => {
    const diff = (b._relevance || 0) - (a._relevance || 0);
    if (diff !== 0) return diff;
    return b.timestamp - a.timestamp;
  });
}

/**
 * Asynchronously scores memory vectors with real-time semantic embedding comparison.
 * @param {any[]} vectors
 * @param {string} input
 * @param {number} [current_round]
 * @param {boolean} [in_scene=false]
 * @returns {Promise<any[]>}
 */
export async function score_async(vectors, input, current_round, in_scene = false) {
  if (!Array.isArray(vectors) || !vectors.length) return [];
  if (current_round !== undefined) _current_round = current_round;

  if (!input?.trim()) return [...vectors].sort((a, b) => b.timestamp - a.timestamp);

  const semantic_scores = await score_by_semantics(vectors, input);

  const scored = semantic_scores.map(({ vector, similarity }) => {
    vector._similarity = similarity;
    vector._relevance = compute_relevance(vector, similarity, _current_round, in_scene);
    return { ...vector, _relevance: vector._relevance, _similarity: similarity };
  });

  return scored.sort((a, b) => {
    const diff = (b._relevance || 0) - (a._relevance || 0);
    if (diff !== 0) return diff;
    return b.timestamp - a.timestamp;
  });
}

/**
 * Formats scored vectors into a string block within budget limits.
 * @param {any[]} vectors
 * @param {string} input
 * @param {object} [options={}]
 * @returns {string}
 */
export function format(vectors, input, options = {}) {
  const show_text = options.vector_text ?? true;
  const max_chars = options.max_chars || 1500;
  const offset = options.offset || 0;

  const ranked = score(vectors, options.in_scene).slice(offset);

  let running_chars = 0;
  const selected = [];
  const selected_texts = [];

  for (const vector of ranked) {
    const text = vector.content || vector.directive || "";
    if (!text.trim()) continue;

    if (is_duplicate(text, selected_texts.join(" "))) continue;

    const payload_length = text.length;
    if (running_chars + payload_length > max_chars && selected.length > 0) {
      break;
    }

    selected.push(vector);
    selected_texts.push(text);
    running_chars += payload_length;
  }

  return selected.map((vector) => (show_text ? vector.content || vector.directive || "" : "")).join("\n");
}

/**
 * Asynchronously formats scored vectors into a string block within budget limits.
 * @param {any[]} vectors
 * @param {string} input
 * @param {object} [options={}]
 * @returns {Promise<string>}
 */
export async function format_async(vectors, input, options = {}) {
  const show_text = options.vector_text ?? true;
  const max_chars = options.max_chars || 1500;
  const offset = options.offset || 0;

  const ranked = is_ready() ? await score_async(vectors, input, undefined, options.in_scene) : score(vectors, options.in_scene);
  const sliced = ranked.slice(offset);

  let running_chars = 0;
  const selected = [];
  const selected_texts = [];

  for (const vector of sliced) {
    const text = vector.content || vector.directive || "";
    if (!text.trim()) continue;

    if (is_duplicate(text, selected_texts.join(" "))) continue;

    const payload_length = text.length;
    if (running_chars + payload_length > max_chars && selected.length > 0) {
      break;
    }

    selected.push(vector);
    selected_texts.push(text);
    running_chars += payload_length;
  }

  return selected.map((vector) => (show_text ? vector.content || vector.directive || "" : "")).join("\n");
}

// ── 3. Deduplication, Caps & Eviction ─────────────────────────────────────────

/**
 * Lexical deduplication check: >60% word overlap on words longer than 2 chars.
 * @param {string} first_text
 * @param {string} second_text
 * @returns {boolean}
 */
function is_duplicate(first_text, second_text) {
  if (!first_text || !second_text) return false;
  const words_a = new Set(
    first_text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2),
  );
  const words_b = new Set(
    second_text
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 2),
  );
  if (words_a.size === 0 || words_b.size === 0) return false;
  let shared = 0;
  for (const word of words_a) {
    if (words_b.has(word)) shared++;
  }
  return shared / Math.min(words_a.size, words_b.size) > 0.6;
}

/** True when content is a near-duplicate of any existing vector's text. */
function is_near_duplicate(existing_list, content) {
  if (!content || !Array.isArray(existing_list)) return false;
  for (const vector of existing_list) {
    const text = vector && (vector.content || vector.directive || "");
    if (text && is_duplicate(text, content)) return true;
  }
  return false;
}

/** True when vector embedding is >0.92 cosine similarity with an existing vector. */
function is_semantic_duplicate(existing_list, vector) {
  const embedding = vector && deserialize_embedding(vector._embedding);
  if (!embedding) return false;
  for (const existing_vector of existing_list || []) {
    if (!existing_vector) continue;
    const existing_embedding = deserialize_embedding(existing_vector._embedding);
    if (!existing_embedding) continue;
    if (cosine_similarity(embedding, existing_embedding) > 0.92) return true;
  }
  return false;
}

/** True for vectors that are user-authored or origin-protected (immune to eviction). */
export function is_origin(vector) {
  return Boolean(vector && (vector.id?.startsWith("usr_") || vector.meta?.origin || vector.origin || vector.timestamp === 0));
}

/** Evicts the oldest evictable (non-origin) vector from an entity pool. */
function evict_oldest_evictable(entity, bucket, cap) {
  if (!Array.isArray(entity[bucket]) || entity[bucket].length <= cap) return;
  const index = entity[bucket].findIndex((vector) => !is_origin(vector));
  if (index === -1) return; // all origin-protected

  const [evicted] = entity[bucket].splice(index, 1);
  const evicted_text = String(evicted?.content || evicted?.directive || "").trim();
  if (evicted_text) {
    state_bridge.app?.log?.(`[TemporalEngine] Evicted oldest ${bucket} vector (cap ${cap}): "${evicted_text.slice(0, 40)}..."`, "warn");
  }
}

/** Checks if a vector ID already exists in the entity past pool. */
function has_vector_id(entity, id) {
  if (!entity || !id) return false;
  return Array.isArray(entity.past) && entity.past.some((vector) => vector && vector.id === id);
}

/** Reassigns a fresh UUID when a vector ID collides with an existing one. */
export function ensure_unique_vector_id(entity, vector) {
  if (!entity || !vector || !vector.id) return vector;
  let attempts = 0;
  while (has_vector_id(entity, vector.id) && attempts < 5) {
    const prefix = vector.id?.startsWith("usr_") ? "usr_" : vector.id?.startsWith("ai_") ? "ai_" : "";
    vector.id = `${prefix}${generate_unique_id()}`;
    attempts++;
  }
  return vector;
}

/** Appends a past vector under caps, skipping duplicates and protecting origin records. */
export function append_past_vector(entity, vector) {
  if (!entity) return;
  if (!Array.isArray(entity.past)) entity.past = [];
  const content = vector?.content || vector?.directive || "";
  if (is_near_duplicate(entity.past, content)) return;
  if (is_semantic_duplicate(entity.past, vector)) return;

  entity.past.push(vector);
  evict_oldest_evictable(entity, "past", PAST_VECTOR_CAP);

  while (entity.past.length > MAX_TOTAL_VECTORS) {
    const before = entity.past.length;
    evict_oldest_evictable(entity, "past", MAX_TOTAL_VECTORS);
    if (entity.past.length === before) break;
  }
}

/** Load-time reconciliation: trims over-cap past pools down to caps. */
export function reconcile_vector_caps(entity) {
  if (!entity || typeof entity !== "object") return false;
  let changed = false;
  const bucket = "past";
  if (Array.isArray(entity[bucket])) {
    while (entity[bucket].length > PAST_VECTOR_CAP) {
      const before = entity[bucket].length;
      evict_oldest_evictable(entity, bucket, PAST_VECTOR_CAP);
      if (entity[bucket].length === before) break;
      changed = true;
    }
    while (entity[bucket].length > MAX_TOTAL_VECTORS) {
      const before = entity[bucket].length;
      evict_oldest_evictable(entity, bucket, MAX_TOTAL_VECTORS);
      if (entity[bucket].length === before) break;
      changed = true;
    }
  }
  return changed;
}

// ── 5. State Mutations & Chapter Archival ─────────────────────────────────────

/** Deduplicates an incoming eternal mutation against the existing identity field. */
function eternal_field_dedup(existing, incoming) {
  const normalize = (text) => collapse_whitespace(String(text || "").toLowerCase());
  const incoming_normalized = normalize(incoming);
  if (!incoming_normalized) return true;
  const lines = String(existing || "")
    .split("\n")
    .map(normalize)
    .filter(Boolean);
  if (lines.includes(incoming_normalized)) return true;
  for (const line of lines) {
    if (line && is_duplicate(line, incoming_normalized)) return true;
  }
  return false;
}

/** Merges new prose into an ETERNAL identity field without pollution. */
function merge_eternal_field(current_field_value, new_prose) {
  const incoming = String(new_prose || "").trim();
  if (!incoming) return current_field_value || "";
  const existing = String(current_field_value || "").trim();
  if (existing && eternal_field_dedup(existing, incoming)) return existing;
  const combined = existing ? `${existing}\n${incoming}` : incoming;
  return combined.length > ETERNAL_MAX_CHARS ? combined.slice(0, ETERNAL_MAX_CHARS) : combined;
}

/** Decays a PRESENT prose field to its most recent segments. */
function cap_present_prose(current_field_value) {
  const lines = String(current_field_value || "")
    .split("\n")
    .filter((line) => line.trim());
  if (lines.length <= PRESENT_MAX_SEGMENTS) return lines.join("\n");
  return lines.slice(-PRESENT_MAX_SEGMENTS).join("\n");
}

/** Sanitizes non_physical prose, unwrapping or cleaning accidental bracket-dicts (e.g. "{key: value}" or "[KEY: value]"). */
export function sanitize_non_physical_prose(raw_prose) {
  let text = String(raw_prose || "").trim();
  if (!text) return "";

  // If the model wrapped the prose in curly braces {emotional_pressure: ...} or JSON-like object
  if (text.startsWith("{") && text.endsWith("}")) {
    const inner = text.slice(1, -1).trim();
    // Check if it's key: value format
    const colon_idx = inner.indexOf(":");
    if (colon_idx !== -1 && !inner.slice(0, colon_idx).includes("\n")) {
      text = inner.slice(colon_idx + 1).trim();
    } else {
      text = inner;
    }
  }

  // Strip leading pseudo-bracket if formatted as [KEY: value]
  text = text.replace(/^\[[A-Z_ ]{3,25}:\s*([\s\S]*?)\]$/i, "$1").trim();

  return text;
}

/** Decides whether a forge rewrite crossed a chapter milestone (<45% vocabulary overlap). */
function has_crossed_chapter_milestone(old_future, new_future) {
  if (!old_future || !new_future || old_future === new_future) return false;
  const extract_words = (text) =>
    new Set(
      String(text)
        .toLowerCase()
        .split(/[^a-z']+/)
        .filter((word) => word.length > 3),
    );
  const old_words = extract_words(old_future);
  const new_words = extract_words(new_future);
  if (!old_words.size || !new_words.size) return false;
  const overlap = [...old_words].filter((word) => new_words.has(word)).length / old_words.size;
  return overlap < 0.45;
}

/** Macro-Quest chapter archival when standing agenda crosses a major narrative milestone. */
export function archive_chapter(entity, old_future, new_future) {
  if (!entity || !has_crossed_chapter_milestone(old_future, new_future)) return false;
  if (!Array.isArray(entity.chapters)) entity.chapters = [];
  const previous_open_chapter = entity.chapters.find((chapter) => chapter?.status === "open");
  if (previous_open_chapter) {
    previous_open_chapter.status = "closed";
    previous_open_chapter.closed_at = Date.now();
  }
  const title = String(new_future).split(/[.!?]/)[0].trim().slice(0, 60) || "New chapter";
  entity.chapters.push({
    id: `ch_${generate_unique_id()}`,
    title,
    summary: String(new_future).slice(0, 400),
    agenda: String(new_future).slice(0, 600),
    status: "open",
    created_at: Date.now(),
  });
  if (entity.chapters.length > 12) entity.chapters = entity.chapters.slice(-12);
  return true;
}

// ── 6. Memory Forge & Consolidation Engine ────────────────────────────────────

/** Parses an LLM forge response with conservative repair fallbacks. */
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
    state_bridge.app?.log?.("[TemporalEngine] Skipping memory forge: payload exceeds 64KB safety limit.", "warn");
    return null;
  }

  const parsed = extract_and_repair_json(raw_text, null);
  if (!parsed) {
    state_bridge.app?.log?.("[TemporalEngine] Malformed JSON in memory forge: repair chain exhausted.", "warn");
    return null;
  }
  return parsed;
}

/** Synthesizes memories and rewrites agenda for target entities using the LLM. */
export async function forge_memory(entity_targets, history_slice, options = {}) {
  if (!Array.isArray(entity_targets) || entity_targets.length === 0) return null;
  try {
    const target_key = options.target_key || entity_targets[0]?.key || "AI_CHARACTER";
    const target_item = entity_targets.find((target) => target.key === target_key) || entity_targets[0];
    const target_entity = target_item?.entity || null;

    const other_entities = {};
    for (const target of entity_targets) {
      if (target.key !== target_key && target.entity) other_entities[target.key] = target.entity;
    }

    const attempt = async () => {
      const payload = compile_prompt("continuum", { target_entity, target_key, other_entities, history: history_slice });
      const response = await llm_service.generate(payload, {
        json: true,
        silent: true,
        raw: true,
      });
      return parse_forge_response(response);
    };

    let memory = await attempt();
    if (!memory) {
      state_bridge.app?.log?.("[TemporalEngine] Memory forge returned no JSON — retrying once.", "warn");
      memory = await attempt();
    }
    if (!memory) return null;

    const forged = {
      _thought_process: memory?._thought_process || "",
      target: memory?.target || target_key,
      memories: {},
      present: {},
      eternal: {},
      future: {},
      relationships: Array.isArray(memory?.relationships) ? memory.relationships : [],
    };

    for (const { key } of entity_targets) {
      let entity_block = memory?.[key] && typeof memory[key] === "object" ? memory[key] : null;
      if (!entity_block && (memory?.target === key || key === target_key)) {
        entity_block = memory;
      }
      if (!entity_block) continue;

      if (entity_block.future && typeof entity_block.future === "string") {
        forged.future[key] = entity_block.future.trim();
      }

      if (entity_block.present && typeof entity_block.present === "object") {
        forged.present[key] = entity_block.present;
      }

      if (entity_block.eternal && typeof entity_block.eternal === "object") {
        forged.eternal[key] = entity_block.eternal;
      }

      const raw_vectors = Array.isArray(entity_block.past) ? entity_block.past : [];
      forged.memories[key] = [];
      const pending_embeds = [];

      for (const raw of raw_vectors) {
        if (!raw || typeof raw !== "object") continue;
        const content = String(raw.content ?? raw.directive ?? "").trim();
        if (!content) continue;

        const vector = {
          id: `ai_${generate_unique_id()}`,
          timestamp: Date.now(),
          type: normalize_forged_type(raw.type),
          content,
          emotional_weight: Number(raw.emotional_weight ?? 5) || 5,
          meta: { ...(memory?.meta || {}), forged_for: key },
        };

        if (vector.type !== "present") {
          pending_embeds.push(vector);
        }

        forged.memories[key].push(vector);
      }

      if (pending_embeds.length) {
        await Promise.race([
          Promise.allSettled(pending_embeds.map((vector) => ensure_embedding(vector))),
          new Promise((resolve) => setTimeout(resolve, FORGE_EMBED_BUDGET_MS)),
        ]);
      }
    }

    const has_memories = Object.values(forged.memories).some((arr) => arr.length > 0);
    const has_present = Object.keys(forged.present).length > 0;
    const has_eternal = Object.keys(forged.eternal).length > 0;
    const has_future = Object.keys(forged.future).length > 0;
    const has_rels = forged.relationships.length > 0;

    if (!has_memories && !has_present && !has_eternal && !has_future && !has_rels) return null;

    return forged;
  } catch (err) {
    console.error("[TemporalEngine] Resonance forge failed.", err);
    state_bridge.app?.log?.(`[TemporalEngine] Resonance forge failed: ${err?.message || err}`, "error");
    return null;
  }
}

/** Fallback memory extraction when LLM forge fails. */
async function fallback_consolidate(entity_targets, slice, runtime, session) {
  try {
    const speaker_label = (message) =>
      message.character_name || (message.role === "ai" ? "AI" : message.role === "user" ? "User" : message.role === "npc" ? "NPC" : "Environment");
    const facts = (Array.isArray(slice) ? slice : [])
      .filter((message) => message && is_narrative_role(message.role))
      .map((message) => {
        const speaker = speaker_label(message);
        return `${speaker}: ${truncate_at_word(collapse_whitespace(strip_cognition_blocks(message.text ?? message.content ?? "")), 220)}`;
      })
      .join(" ");

    for (const { key, type, entity } of entity_targets) {
      if (!entity) continue;
      const entity_name = String(entity.name || key).toLowerCase();
      const relevant = (Array.isArray(slice) ? slice : [])
        .filter((message) => message && is_narrative_role(message.role))
        .filter((message) => {
          const text = String(message.text ?? message.content ?? "").toLowerCase();
          const speaker = String(message.character_name || "").toLowerCase();
          return speaker === entity_name || (entity_name.length > 2 && text.includes(entity_name));
        })
        .map((message) => {
          const speaker = speaker_label(message);
          return `${speaker}: ${truncate_at_word(collapse_whitespace(strip_cognition_blocks(message.text ?? message.content ?? "")), 180)}`;
        })
        .join(" | ");

      if (!relevant && key.startsWith("NPC_")) continue;

      const content = relevant ? relevant.slice(0, 250) : facts ? facts.slice(0, 250) : `${entity.name || key} carries the recent events forward.`;

      const vector = create(content, "past", 5);
      ensure_unique_vector_id(entity, vector);
      append_past_vector(entity, vector);
      await runtime.update_entity(type, entity.id, { past: entity.past });
      await session.log_system_entry(`Memory Forged (${key}): ${vector.content.substring(0, 50)}...`, "system", {
        type: "MEMORY_FORMATION",
        target: key,
        memories: [vector],
        vectors: [vector],
        future: entity.future || "",
        present: entity.present || null,
        turns_count: slice.length,
      });
    }
    state_bridge.app?.log?.("[TemporalEngine] LLM forge unavailable — past vectors derived deterministically.", "warn");
  } catch (err) {
    state_bridge.app?.log?.(`[TemporalEngine] Fallback consolidation incomplete: ${err?.message || err}`, "warn");
  }
}

export const temporal_engine = {
  create,
  score,
  score_async,
  format,
  format_async,
  forge_memory,
  append_past_vector,
  reconcile_vector_caps,
  ensure_unique_vector_id,
  set_round,
  precompute_context_embedding,
  _is_consolidating: false,

  consolidate: async (session, db, entities, runtime, app, options = {}) => {
    if (temporal_engine._is_consolidating) return;
    temporal_engine._is_consolidating = true;

    try {
      const story_id = session.require_active();

      if (options.skip_forge) return;

      const in_scene_ids = new Set((runtime.snapshot_in_scene_npc_ids || runtime.in_scene_npc_ids || []).map(String));
      const active_npcs = Object.values(runtime.active_npcs || {}).filter((npc) => npc && in_scene_ids.has(String(npc.id)));

      const entity_targets = [
        { key: "AI_CHARACTER", type: "character", entity: runtime.active_ai },
        { key: "USER_PERSONA", type: "character", entity: runtime.active_user },
        { key: "FRACTAL", type: "fractal", entity: runtime.active_fractal },
        ...active_npcs.map((npc) => ({ key: `NPC_${npc.id}`, type: "character", entity: npc, is_npc: true })),
      ].filter((t) => t.entity);

      if (!entity_targets.length) return;

      const messages = await session.load_log(story_id);

      let target_key = options.target_key || null;
      let target_item = null;
      let unconsolidated_slice = [];

      if (target_key) {
        target_item = entity_targets.find((target) => target.key === target_key) || entity_targets[0];
        target_key = target_item.key;
        unconsolidated_slice = messages.filter((message) => {
          if (message.role === "system") return false;
          const forged = message.meta?.forged_entities || (message.meta?.consolidated ? entity_targets.map((target) => target.key) : []);
          return !forged.includes(target_key);
        });
      } else {
        const cursor_index = Number(runtime.back_shot_cursor || 0) % entity_targets.length;
        for (let i = 0; i < entity_targets.length; i++) {
          const check_idx = (cursor_index + i) % entity_targets.length;
          const candidate = entity_targets[check_idx];
          const candidate_unconsolidated = messages.filter((message) => {
            if (message.role === "system") return false;
            const forged = message.meta?.forged_entities || (message.meta?.consolidated ? entity_targets.map((target) => target.key) : []);
            return !forged.includes(candidate.key);
          });
          if (candidate_unconsolidated.length > 0 || i === entity_targets.length - 1) {
            target_item = candidate;
            target_key = candidate.key;
            unconsolidated_slice = candidate_unconsolidated;
            runtime.back_shot_cursor = (check_idx + 1) % entity_targets.length;
            break;
          }
        }
      }

      if (!target_item || unconsolidated_slice.length === 0) return;

      const slice = unconsolidated_slice.slice(0, 16);
      const entity = target_item.entity;
      const type = target_item.type;

      app.log?.(`[TemporalEngine] ⏳ Memory Forge cycling for ${entity.name || target_key} (${slice.length} turns)...`, "system");

      const forged = await forge_memory(entity_targets, slice, { target_key });
      if (forged) {
        const memories = forged.memories?.[target_key] || [];
        for (const memory of memories) {
          if (memory.type === "present") {
            if (!entity.present) entity.present = { physical: "", non_physical: "" };
            entity.present.non_physical = cap_present_prose(
              merge_prose_into_field(entity.present.non_physical, memory.content || memory.directive || ""),
            );
            await runtime.update_entity(type, entity.id, { present: entity.present });
          } else {
            ensure_unique_vector_id(entity, memory);
            append_past_vector(entity, memory);
            await runtime.update_entity(type, entity.id, { past: entity.past });
          }
        }

        const summary = forged.present?.[target_key];
        if (summary && typeof summary === "object") {
          if (!entity.present) entity.present = { physical: "", non_physical: "" };
          if (summary.physical !== undefined && summary.physical.trim()) {
            entity.present.physical = merge_prose_into_field(entity.present.physical, summary.physical);
          }
          if (summary.non_physical !== undefined && summary.non_physical.trim()) {
            entity.present.non_physical = sanitize_non_physical_prose(summary.non_physical);
          }
          await runtime.update_entity(type, entity.id, { present: entity.present });
        }

        const eternal_mutation = forged.eternal?.[target_key];
        if (eternal_mutation && typeof eternal_mutation === "object") {
          if (!entity.eternal) entity.eternal = { physical: "", non_physical: "" };
          let eternal_changed = false;
          if (eternal_mutation.physical?.trim()) {
            entity.eternal.physical = merge_eternal_field(entity.eternal.physical, eternal_mutation.physical);
            eternal_changed = true;
          }
          if (eternal_mutation.non_physical?.trim()) {
            entity.eternal.non_physical = merge_eternal_field(
              entity.eternal.non_physical,
              sanitize_non_physical_prose(eternal_mutation.non_physical),
            );
            eternal_changed = true;
          }
          if (eternal_changed) {
            await runtime.update_entity(type, entity.id, { eternal: entity.eternal });
          }
        }

        let rewritten = forged.future?.[target_key];
        if (typeof rewritten === "string" && rewritten.trim()) {
          const old_future = typeof entity.future === "string" ? entity.future : "";
          entity.future = rewritten.trim();
          const chapter_forked = archive_chapter(entity, old_future, entity.future);
          await runtime.update_entity(type, entity.id, { future: entity.future, ...(chapter_forked ? { chapters: entity.chapters } : {}) });
          if (chapter_forked) {
            app.log?.(`[TemporalEngine] 📜 Chapter archived for ${entity.name || target_key} — milestone crossed.`, "system");
          }
        }

        if (Array.isArray(forged.relationships) && forged.relationships.length > 0) {
          await apply_relationships({ runtime, app }, forged.relationships);
        }

        const text = memories.length ? memories.map((vector) => vector.content || vector.directive || "").join(" | ") : "State consolidated.";
        await session.log_system_entry(`Memory Forged (${target_key}): ${text.substring(0, 50)}...`, "system", {
          type: "MEMORY_FORMATION",
          target: target_key,
          memories,
          vectors: memories,
          future: entity?.future || forged.future?.[target_key] || "",
          present: entity?.present || forged.present?.[target_key] || null,
          eternal: forged.eternal?.[target_key] || null,
          thought_process: forged._thought_process || "",
          relationships: forged.relationships || [],
          turns_count: slice.length,
        });
      } else {
        await fallback_consolidate([target_item], slice, runtime, session);
      }

      // Persist ONLY the consolidation marker (`meta`) for each turn. A whole-row
      // `bulkPut(slice)` here would clobber fields written by other pipelines during
      // the forge's LLM latency (the slice was loaded *before* the forge ran) — e.g.
      // an image beat that resolved onto one of these turns while the forge was
      // working, silently reverting a finished prologue/story image back to its
      // loading placeholder with no path to ever resolve again.
      const meta_persistence = [];
      for (const message of slice) {
        const prev_forged = Array.isArray(message.meta?.forged_entities)
          ? message.meta.forged_entities
          : message.meta?.consolidated
            ? entity_targets.map((target) => target.key)
            : [];
        const next_forged = Array.from(new Set([...prev_forged, target_key]));
        const all_forged = entity_targets.every((target) => next_forged.includes(target.key));
        message.meta = {
          ...message.meta,
          forged_entities: next_forged,
          consolidated: all_forged,
        };
        if (message.id !== undefined && message.id !== null) {
          meta_persistence.push(db.simulation_log.update(message.id, { meta: message.meta }));
        }
      }
      await Promise.all(meta_persistence);
      state_bridge.simulation_log?.refresh();
    } catch (err) {
      state_bridge.app?.log?.(`[TemporalEngine] Consolidation forge failed: ${err?.message || err}`, "error");
    } finally {
      temporal_engine._is_consolidating = false;
    }
  },

  ensure_momentum: (runtime, app) => {
    const fractal = runtime.active_fractal;
    if (fractal && !String(fractal.future || "").trim()) {
      app?.log("[TemporalEngine] Placeholder momentum active (No future agenda set)", "system");
    }
  },
};

if (typeof window !== "undefined") {
  window.temporal_engine = temporal_engine;
}

/**
 * CHANGELOG
 * - 2026-09-25: DRY pass — `fallback_consolidate` now filters with the shared `is_narrative_role` and builds speaker labels through one local `speaker_label` helper.
 * - 2026-09-25: Stripping standardization — the deterministic memory-snippet builders now compose `strip_cognition_blocks` + `collapse_whitespace` + `truncate_at_word` instead of inline regex/slice chains, and `eternal_field_dedup` reuses `collapse_whitespace`.
 * - 2026-09-24: Consolidation persists the `meta` marker per-turn via `db.simulation_log.update(id, { meta })` instead of a whole-row `bulkPut(slice)`. The slice is loaded before the (slow) forge LLM call, so bulk-writing it clobbered any attachment resolved onto those turns during the forge — reverting a finished prologue/story image to a permanently stuck loading placeholder.
 * - 2026-09-18: Routed forge_memory directly through switchboard `compile_prompt("continuum")`, removing builder.js render_memory coupling.
 * - 2026-09-16: Added sanitize_non_physical_prose to sanitize and unwrap accidental bracket-dicts or pseudo-json key-value strings from LLM non_physical mutations.
 * - 2026-09-12: Header correction — contracts/schemas relocated to modules/format.js.
 * - 2026-09-11: Header correction — TEMPORAL_PROTOCOLS bundle pruned; memory-forge prompt rendering still via render_memory.
 * - 2026-09-11: Grand Purification: prompt compilation moved to builder.js, leaving temporal.js a 100% pure vector math, scoring, and persistence engine.
 * - 2026-09-11: Modularized TEMPORAL_PROTOCOLS: bound CONTRACT and SCHEMA to modular imports in modules/.
 * - 2026-09-11: Consolidated temporal-pipeline.js and temporal-prompt.js into temporal.js, absorbing TEMPORAL_PROTOCOLS and render_memory into a unified temporal domain module.
 * - 2026-09-06: Expanded Memory Forge unconsolidated slice from 8 to 16 turns per consolidation cycle.
 * - 2026-08-28: Reconstructed temporal-pipeline.js with 5 clean domain sections, robust state logging, safe error wrappers, and full JSDoc typings.
 */
