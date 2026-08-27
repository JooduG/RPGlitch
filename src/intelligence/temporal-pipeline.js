/**
 * @file src/intelligence/temporal.js
 * ⏳ TEMPORAL ENGINE — Memory & Agenda
 * Owns the past vector pool (memories) plus the forged prose agenda (future):
 * scoring, caps, eviction, consolidation, and the read paths that surface them.
 */

import { cosine_similarity, escape_unescaped_json_quotes, generate_uuid as _uuid, state_bridge } from "@utils";
import { llm_service, ensure_embedding, score_by_semantics, embed, is_ready, deserialize_embedding } from "@platform";
import { extract_json_block } from "./parser.js";
import { merge_prose_into_field } from "./payload.js";
import { render_memory } from "./prompts/temporal-prompts.js";

/**
 * @typedef {import('@state/runtime.svelte.js').SimulationEntity} SimulationEntity
 * @typedef {import('@data/sessions.svelte.js').session_driver} SessionDriver
 * @typedef {typeof import('@data/db.js').db} Database
 * @typedef {import('@data/repository.js').entities} EntityRepository
 */

/**
 * @typedef {Object} TemporalVector
 * @property {string} id - UUID unique identifier.
 * @property {number} timestamp - Epoch timestamp of creation.
 * @property {string} content - The narrative payload.
 * @property {string} type - "past".
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
 * Entities store memories in the `past` array (a pool of vectors); `future` is a
 * single consolidated prose field, not a pool. `resolve_vector_pool` flattens
 * past into one normalized shape so every read path shares a consistent
 * interface and no memory is missed.
 */

/**
 * Merges an entity's memories into a single normalized array.
 * String items are passed through untouched.
 * PAST holds the only vector pool (memories). FUTURE is a consolidated prose
 * field, not a pool, so it contributes nothing here.
 * @param {any} entity
 * @returns {any[]}
 */
export function resolve_vector_pool(entity) {
  if (!entity || typeof entity !== "object") return [];
  const normalize_item = (v, type) => (v && typeof v === "object" ? { ...v, type, content: v.content || v.directive || "" } : v);
  const pool = [];
  if (Array.isArray(entity.past)) {
    for (const v of entity.past) pool.push(normalize_item(v, "past"));
  }
  return pool;
}

export const TEMPORAL_SCORING = {
  SEMANTIC_GAIN: 3,
  RECENCY_FLOOR: 0.5,
  DECAY_SOFTEN: 0.5,
  IN_SCENE_SALIENCE_BOOST: 1.3,
};

// FUTURE is a prose field, so the forge only emits "past" (memory) vectors;
// any stray/mislabeled type is normalized to "past" so nothing is dropped.
const VALID_FORGED_TYPES = new Set(["past", "present"]);

function normalize_forged_type(value) {
  const type = String(value || "")
    .toLowerCase()
    .trim();
  return VALID_FORGED_TYPES.has(type) ? /** @type {any} */ (type) : "past";
}

function create(content, type = "past", weight = 5) {
  return {
    id: `ai_${_uuid()}`,
    timestamp: Date.now(),
    content: String(content || "").slice(0, MAX_VECTOR_CHARS),
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

function compute_relevance(v, semantic_similarity, current_round, in_scene = false) {
  const weight = v.emotional_weight ?? 5;
  const { SEMANTIC_GAIN, RECENCY_FLOOR, DECAY_SOFTEN, IN_SCENE_SALIENCE_BOOST } = TEMPORAL_SCORING;
  const semantic = Math.max(0, Math.min(1, semantic_similarity || 0));
  const raw_recency = recency_factor(v, current_round);
  const recency = Math.max(RECENCY_FLOOR, Math.pow(raw_recency, DECAY_SOFTEN));
  v._recency_factor = recency;
  // Pinned memories (usr_ or hand-authored origin vectors) rank above rolling
  // session memories — core backstory anchors must stay near the top of the
  // character's <MEMORIES> block.
  const pinned_boost = v.id?.startsWith("usr_") || is_origin(v) ? 1.5 : 1.0;
  // Stage Spotlight salience: entities physically present in the room recall
  // with sharper fidelity (+30%) — in-scene NPCs, not the off-screen cast.
  const in_scene_boost = in_scene ? IN_SCENE_SALIENCE_BOOST : 1.0;
  return weight * (1 + SEMANTIC_GAIN * semantic) * recency * pinned_boost * in_scene_boost;
}

export function score(vectors, in_scene = false) {
  if (!Array.isArray(vectors) || !vectors.length) return [];

  const has_embeddings = vectors.some((v) => v._embedding && v._embedding.length);

  const scored = vectors.map((v) => {
    let semantic = 0;
    if (has_embeddings && v._embedding && _context_embedding) {
      semantic = cosine_similarity(_context_embedding, v._embedding);
    }
    const relevance = compute_relevance(v, semantic, _current_round, in_scene);
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

export async function score_async(vectors, input, current_round, in_scene = false) {
  if (!Array.isArray(vectors) || !vectors.length) return [];
  if (current_round !== undefined) _current_round = current_round;

  if (!input?.trim()) return [...vectors].sort((a, b) => b.timestamp - a.timestamp);

  const semantic_scores = await score_by_semantics(vectors, input);

  const scored = semantic_scores.map(({ vector: v, similarity }) => {
    v._similarity = similarity;
    v._relevance = compute_relevance(v, similarity, _current_round, in_scene);
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
// PAST vectors are capped per pool and evicted OLDEST-FIRST — but hand-authored
// premade vectors (meta.origin) are never evicted, so the user's curated origin
// past block can never be silently destroyed by a busy forge cycle.
// (FUTURE is a prose field now — it has no pool or cap.)
export const PAST_VECTOR_CAP = 20;
export const MAX_TOTAL_VECTORS = 200;
export const MAX_VECTOR_CHARS = 220;
const ETERNAL_MAX_CHARS = 1500;
const PRESENT_MAX_SEGMENTS = 3;

/** True for vectors that are hand-authored (premade stock) and must never be evicted.
 *  This includes `usr_`-prefixed pinned memories (user/lore) as well as premade
 *  vectors stamped `timestamp: 0`, which also protects stock vectors inside saved
 *  entities that predate the `meta.origin` flag. */
export function is_origin(v) {
  return !!(v && (v.id?.startsWith("usr_") || v.meta?.origin || v.origin || v.timestamp === 0));
}

/**
 * Load-time reconciliation: trims over-cap past pools down to their caps,
 * oldest-evictable-first, while origin vectors (premade stock) are always kept.
 * Returns true if anything was removed so callers can persist the change.
 */
export function reconcile_vector_caps(entity) {
  if (!entity || typeof entity !== "object") return false;
  let changed = false;
  const bucket = "past";
  if (Array.isArray(entity[bucket])) {
    while (entity[bucket].length > PAST_VECTOR_CAP) {
      const before = entity[bucket].length;
      evict_oldest_evictable(entity, bucket, PAST_VECTOR_CAP);
      if (entity[bucket].length === before) break; // pool fully origin-protected
      changed = true;
    }
    // Absolute safety ceiling: combined usr_ + ai_ records may never exceed 200.
    while (entity[bucket].length > MAX_TOTAL_VECTORS) {
      const before = entity[bucket].length;
      evict_oldest_evictable(entity, bucket, MAX_TOTAL_VECTORS);
      if (entity[bucket].length === before) break; // everything protected
      changed = true;
    }
  }
  return changed;
}

/** True when `content` is a near-duplicate of any existing vector's text. */
function is_near_duplicate(existing_list, content) {
  if (!content || !Array.isArray(existing_list)) return false;
  for (const v of existing_list) {
    const text = v && (v.content || v.directive || "");
    if (text && is_duplicate(text, content)) return true;
  }
  return false;
}

/**
 * True when `vector`'s embedding is near-identical to an existing vector's —
 * catches paraphrased duplicates the lexical check misses (e.g. "shielded Ryker"
 * vs "acted as the wall for Ryker"). Purely a guardrail: vectors without an
 * embedding (or loaded before embeddings existed) are simply skipped.
 */
function is_semantic_duplicate(existing_list, vector) {
  const emb = vector && deserialize_embedding(vector._embedding);
  if (!emb) return false;
  for (const v of existing_list || []) {
    if (!v) continue;
    const vemb = deserialize_embedding(v._embedding);
    if (!vemb) continue;
    if (cosine_similarity(emb, vemb) > 0.92) return true;
  }
  return false;
}

/** Shared eviction: drop the oldest evictable (non-origin) vector, if any. */
function evict_oldest_evictable(entity, bucket, cap) {
  if (!Array.isArray(entity[bucket]) || entity[bucket].length <= cap) return;
  const index = entity[bucket].findIndex((v) => !is_origin(v));
  if (index === -1) return; // all vectors are origin-protected — allow growth
  const [evicted] = entity[bucket].splice(index, 1);
  const evicted_text = String(evicted?.content || evicted?.directive || "").trim();
  if (evicted_text) {
    console.warn(
      `[TemporalEngine] ${bucket} cap (${cap}) reached — evicting oldest evictable vector: "${evicted_text.slice(0, 60)}${evicted_text.length > 60 ? "..." : ""}"`,
    );
    try {
      state_bridge.app?.log?.(`[TemporalEngine] Evicted oldest ${bucket} vector (cap ${cap}): "${evicted_text.slice(0, 40)}..."`, "warn");
    } catch (_err) {
      /* never let telemetry break the mutation path */
    }
  }
}

function vector_id_exists(entity, id) {
  if (!entity || !id) return false;
  return Array.isArray(entity.past) && entity.past.some((v) => v && v.id === id);
}

/** Reassigns a fresh UUID when a vector id collides with an existing one in the past pool. */
export function ensure_unique_vector_id(entity, vector) {
  if (!entity || !vector || !vector.id) return vector;
  let attempts = 0;
  while (vector_id_exists(entity, vector.id) && attempts < 5) {
    const prefix = vector.id?.startsWith("usr_") ? "usr_" : vector.id?.startsWith("ai_") ? "ai_" : "";
    vector.id = `${prefix}${_uuid()}`;
    attempts++;
  }
  return vector;
}

/** Pushes a past vector under a hard cap, skipping near-duplicates and never evicting origin vectors. */
export function append_past_vector(entity, vector) {
  if (!entity) return;
  if (!Array.isArray(entity.past)) entity.past = [];
  const content = vector?.content || vector?.directive || "";
  if (is_near_duplicate(entity.past, content)) return;
  if (is_semantic_duplicate(entity.past, vector)) return;
  entity.past.push(vector);
  evict_oldest_evictable(entity, "past", PAST_VECTOR_CAP);
  // Absolute safety ceiling: never exceed 200 records per entity, evicting
  // oldest evictable (non-origin) records first. If every record is protected,
  // allow growth rather than destroying pinned memory.
  while (entity.past.length > MAX_TOTAL_VECTORS) {
    const before = entity.past.length;
    evict_oldest_evictable(entity, "past", MAX_TOTAL_VECTORS);
    if (entity.past.length === before) break;
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
  const incoming = String(new_prose || "").trim();
  if (!incoming) return current_field_value || "";
  const existing = String(current_field_value || "").trim();
  if (existing && eternal_field_dedup(existing, incoming)) return existing;
  const combined = existing ? `${existing}\n${incoming}` : incoming;
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

  const ranked = score(vectors, options.in_scene).slice(offset);

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

  const ranked = is_ready() ? await score_async(vectors, input, undefined, options.in_scene) : score(vectors, options.in_scene);
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

  const try_parse = (s) => {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  };

  const direct = try_parse(json_string);
  if (direct !== undefined) return direct;

  // LLMs occasionally slip stray characters or unescaped quotes into the forge
  // JSON. Run a chain of conservative repairs — each candidate must still parse
  // cleanly to be used, so a bad repair simply degrades to the existing retry path.
  const repair_chain = [
    (s) => escape_unescaped_json_quotes(s),
    // Unquoted bare keys: { content: "..." -> {"content": "..."
    (s) => s.replace(/([{,[]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3'),
    // Stray bareword fragment directly before a quoted key: { H"content": -> {"content":
    (s) => s.replace(/([{,]\s*)[^"{}[\],]+?(?="[A-Za-z_][^"]*"\s*:)/g, "$1"),
    // Trailing commas before closers: "key": 1, } -> "key": 1 }
    (s) => s.replace(/,\s*(?=\s*[}\]])/g, ""),
  ];

  for (const repair of repair_chain) {
    const repaired = repair(json_string);
    if (repaired === json_string) continue;
    const parsed = try_parse(repaired);
    if (parsed !== undefined) return parsed;
  }

  console.warn("[TemporalEngine] Malformed JSON in memory forge:", new Error("repair chain exhausted"));
  return null;
}

const FORGE_EMBED_BUDGET_MS = 45000;

export async function forge_memory(entity_targets, history_slice, options = {}) {
  if (!Array.isArray(entity_targets) || entity_targets.length === 0) return null;
  try {
    const target_key = options.target_key || entity_targets[0]?.key || "AI_CHARACTER";
    const target_item = entity_targets.find((t) => t.key === target_key) || entity_targets[0];
    const target_entity = target_item?.entity || null;

    const other_entities = {};
    for (const t of entity_targets) {
      if (t.key !== target_key && t.entity) other_entities[t.key] = t.entity;
    }

    const attempt = async () => {
      const payload = {
        system: render_memory({ target_entity, target_key, other_entities, history: history_slice }),
        messages: [],
      };
      const response = await llm_service.generate(payload, {
        json: true,
        silent: true,
        raw: true,
      });
      return parse_forge_response(response);
    };

    let memory = await attempt();
    if (!memory) {
      console.warn("[TemporalEngine] Memory forge returned no JSON — retrying once.");
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

    // Support both single-target format and multi-target format
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
          id: `ai_${_uuid()}`,
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
          Promise.allSettled(pending_embeds.map((v) => ensure_embedding(v))),
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
      const entity_name = String(entity.name || key).toLowerCase();
      // Filter slice facts relevant to this entity
      const relevant = (Array.isArray(slice) ? slice : [])
        .filter((m) => m && (m.role === "ai" || m.role === "fractal" || m.role === "user"))
        .filter((m) => {
          const txt = String(m.text ?? m.content ?? "").toLowerCase();
          const speaker = String(m.character_name || "").toLowerCase();
          return speaker === entity_name || (entity_name.length > 2 && txt.includes(entity_name));
        })
        .map((m) => {
          const speaker = m.character_name || (m.role === "ai" ? "AI" : m.role === "user" ? "User" : "Environment");
          return `${speaker}: ${String(m.text ?? m.content ?? "")
            .replace(/<think>[\s\S]*?<\/think>/gi, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 180)}`;
        })
        .join(" | ");

      // If an NPC or entity had zero involvement or mentions in this batch, skip minting a past vector
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
    // The fallback must never abort slice consolidation (bulkPut marking).
    console.warn("[TemporalEngine] Fallback consolidation incomplete:", err);
  }
}

export function apply_state_mutations(entity, mutations) {
  if (!entity || !mutations || typeof mutations !== "object") return false;
  let changed = false;

  const pres_phys = String(mutations.state_append?.physical || "").trim();
  if (pres_phys) {
    if (!entity.present) entity.present = { physical: "", non_physical: "" };
    entity.present.physical = merge_prose_into_field(entity.present.physical, pres_phys);
    changed = true;
  }

  const pres_non_phys = String(mutations.state_append?.non_physical || "").trim();
  if (pres_non_phys) {
    if (!entity.present) entity.present = { physical: "", non_physical: "" };
    entity.present.non_physical = cap_present_prose(merge_prose_into_field(entity.present.non_physical, pres_non_phys));
    changed = true;
  }

  const new_list = Array.isArray(mutations.past) ? mutations.past : [];
  if (new_list.length > 0) {
    new_list.forEach((v) => {
      if (!v || typeof v !== "object") return;
      const payload = String(v.content || v.directive || "").trim();
      if (!payload) return;
      // FUTURE is prose now — every appended vector is a past anchor.
      const new_vector = create(payload, "past", v.emotional_weight ?? 5);
      ensure_unique_vector_id(entity, new_vector);
      v.id = new_vector.id;
      ensure_embedding(new_vector)
        .then(() => {
          if (entity?.id) {
            const type = entity.type === "fractal" ? "fractal" : "character";
            state_bridge.runtime?.update_entity?.(type, entity.id, { past: entity.past })?.catch(() => {});
          }
        })
        .catch(() => {});
      append_past_vector(entity, new_vector);
      changed = true;
    });
  }

  const eternal_muts = mutations.eternal;
  if (eternal_muts && typeof eternal_muts === "object" && entity.eternal) {
    const e_phys = String(eternal_muts.physical || "").trim();
    if (e_phys) {
      entity.eternal.physical = merge_eternal_field(entity.eternal.physical, e_phys);
      changed = true;
    }
    const e_non_phys = String(eternal_muts.non_physical || "").trim();
    if (e_non_phys) {
      entity.eternal.non_physical = merge_eternal_field(entity.eternal.non_physical, e_non_phys);
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

/**
 * Pure determinism — decides whether a forge rewrite crossed a chapter boundary:
 * the old standing agenda and the new one share less than ~45% of their
 * vocabulary (excluding tiny stopwords). Equal text never triggers a boundary.
 * @param {string} old_future
 * @param {string} new_future
 * @returns {boolean}
 */
function chapter_milestone_crossed(old_future, new_future) {
  if (!old_future || !new_future || old_future === new_future) return false;
  const words = (s) =>
    new Set(
      String(s)
        .toLowerCase()
        .split(/[^a-z']+/)
        .filter((w) => w.length > 3),
    );
  const old_words = words(old_future);
  const new_words = words(new_future);
  if (!old_words.size || !new_words.size) return false;
  const overlap = [...old_words].filter((w) => new_words.has(w)).length / old_words.size;
  return overlap < 0.45;
}

/**
 * Macro-Quest chapter forking (track-director-expansion 4.5): when a forge cycle
 * rewrites the standing agenda past a milestone, close the current chapter and
 * open a fresh one. The archive lives on the entity (`chapters`) and is shown
 * to the Memory Forge as <CHAPTER_HISTORY> so future consolidations never
 * pretend an archived objective is still pending.
 * @param {any} entity
 * @param {string} old_future
 * @param {string} new_future
 * @returns {boolean}
 */
export function archive_chapter(entity, old_future, new_future) {
  if (!entity || !chapter_milestone_crossed(old_future, new_future)) return false;
  if (!Array.isArray(entity.chapters)) entity.chapters = [];
  const prev_open = entity.chapters.find((c) => c?.status === "open");
  if (prev_open) {
    prev_open.status = "closed";
    prev_open.closed_at = Date.now();
  }
  const title = String(new_future).split(/[.!?]/)[0].trim().slice(0, 60) || "New chapter";
  entity.chapters.push({
    id: `ch_${_uuid()}`,
    title,
    summary: String(new_future).slice(0, 400),
    agenda: String(new_future).slice(0, 600),
    status: "open",
    created_at: Date.now(),
  });
  if (entity.chapters.length > 12) entity.chapters = entity.chapters.slice(-12);
  return true;
}

export const temporal_engine = {
  create,
  score,
  score_async,
  format,
  format_async,
  forge_memory,
  apply_state_mutations,
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

      // SKIP_FORGE — when a turn resolves the story (CONCLUDED/COLLAPSED) the
      // post-turn forge is pure cost: nothing durable remains to remember. Keeps
      // the epilogue turn off the heavy consolidation path.
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

      // Determine round-robin target key or honor explicit options.target_key
      let target_key = options.target_key || null;
      let target_item = null;
      let unconsolidated_slice = [];

      if (target_key) {
        target_item = entity_targets.find((t) => t.key === target_key) || entity_targets[0];
        target_key = target_item.key;
        unconsolidated_slice = messages.filter((m) => {
          if (m.role === "system") return false;
          const forged = m.meta?.forged_entities || (m.meta?.consolidated ? entity_targets.map((t) => t.key) : []);
          return !forged.includes(target_key);
        });
      } else {
        // Round-robin traversal: find the next target starting from cursor that has unconsolidated messages
        const cursor_index = Number(runtime.back_shot_cursor || 0) % entity_targets.length;
        for (let i = 0; i < entity_targets.length; i++) {
          const check_idx = (cursor_index + i) % entity_targets.length;
          const candidate = entity_targets[check_idx];
          const uncons = messages.filter((m) => {
            if (m.role === "system") return false;
            const forged = m.meta?.forged_entities || (m.meta?.consolidated ? entity_targets.map((t) => t.key) : []);
            return !forged.includes(candidate.key);
          });
          if (uncons.length > 0 || i === entity_targets.length - 1) {
            target_item = candidate;
            target_key = candidate.key;
            unconsolidated_slice = uncons;
            // Advance cursor to next index for following round
            runtime.back_shot_cursor = (check_idx + 1) % entity_targets.length;
            break;
          }
        }
      }

      if (!target_item || unconsolidated_slice.length === 0) return;

      // Slice up to 8 messages for this entity's Back Shot
      const slice = unconsolidated_slice.slice(0, 8);
      const entity = target_item.entity;
      const type = target_item.type;

      app.log?.(`[TemporalEngine] ⏳ Back Shot forging for ${entity.name || target_key} (${slice.length} turns)...`, "system");

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
            entity.present.non_physical = summary.non_physical;
          }
          await runtime.update_entity(type, entity.id, { present: entity.present });
        }

        const e_mut = forged.eternal?.[target_key];
        if (e_mut && typeof e_mut === "object") {
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

        // Apply outward relational vectors if present
        if (Array.isArray(forged.relationships) && forged.relationships.length > 0 && state_bridge.kernel?._apply_relationships) {
          await state_bridge.kernel._apply_relationships({ runtime, app }, forged.relationships);
        }

        const text = memories.length ? memories.map((v) => v.content || v.directive || "").join(" | ") : "State consolidated.";
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

      // Mark per-entity progress on the slice
      for (const msg of slice) {
        const prev_forged = Array.isArray(msg.meta?.forged_entities)
          ? msg.meta.forged_entities
          : msg.meta?.consolidated
            ? entity_targets.map((t) => t.key)
            : [];
        const next_forged = Array.from(new Set([...prev_forged, target_key]));
        const all_forged = entity_targets.every((t) => next_forged.includes(t.key));
        msg.meta = {
          ...msg.meta,
          forged_entities: next_forged,
          consolidated: all_forged,
        };
      }
      await db.simulation_log.bulkPut(slice);
      state_bridge.simulation_log?.refresh();
    } catch (err) {
      console.error("[TemporalEngine] Consolidation forge failed:", err);
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
 * Prunes a vectors array for a compact snapshot: up to 3 past-type vectors.
 * Content-only, no directive key. (FUTURE is a prose field now, not a pool.)
 * @param {any[]} vectors
 * @returns {any[]}
 */
export function prune(vectors) {
  if (!Array.isArray(vectors)) return [];
  return vectors.slice(0, 3).map((v) => ({
    id: v.id,
    content: v.content || v.directive || v.text || v.summary || "",
    emotional_weight: v.emotional_weight ?? 5,
    type: "past",
    meta: v.meta || {},
  }));
}
