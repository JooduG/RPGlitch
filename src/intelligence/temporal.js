/**
 * @file src/intelligence/temporal.js
 * ⏳ TEMPORAL ENGINE — Temporal Fabric Coordinator
 * Consolidates Past (Historical Anchors) and Future (Active Impulses) into a unified temporal continuum.
 */

import { generate_uuid as _uuid, state_bridge, deserialize_embedding } from "@utils";
import { llm_service } from "@platform";
import { ensure_embedding, score_by_semantics, cosine_similarity, embed, is_ready } from "./embeddings.svelte.js";
import { extract_json_block, merge_prose_into_field, escape_unescaped_json_quotes } from "./parser.js";
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
    for (const v of entity.past) pool.push(normalize_item(v, v?.type === "future" ? "future" : "past"));
  }
  return pool;
}

export const TEMPORAL_SCORING = {
  SEMANTIC_GAIN: 3,
  RECENCY_FLOOR: 0.5,
  DECAY_SOFTEN: 0.5,
};

// FUTURE is a prose field now, so the forge may only emit "past" (memory) or
// "present" vectors — any stray "future" type is demoted to a past anchor so
// nothing intended for the future pool is silently dropped.
const VALID_FORGED_TYPES = new Set(["past", "present"]);

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
// PAST vectors are capped per pool and evicted OLDEST-FIRST — but hand-authored
// premade vectors (meta.origin) are never evicted, so the user's curated origin
// past block can never be silently destroyed by a busy forge cycle.
// (FUTURE is a prose field now — it has no pool or cap.)
export const PAST_VECTOR_CAP = 20;
const ETERNAL_MAX_CHARS = 1500;
const PRESENT_MAX_SEGMENTS = 3;

/** True for vectors that were hand-authored (premade stock) and must never be evicted.
 *  Premade vectors are stamped `timestamp: 0`, so that marker also protects stock
 *  vectors inside saved entities that predate the `meta.origin` flag. */
function is_origin(v) {
  return !!(v && (v.meta?.origin || v.origin || v.timestamp === 0));
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
    vector.id = _uuid();
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

const IRREGULAR_PAST = {
  am: "was",
  is: "was",
  are: "were",
  become: "became",
  begin: "began",
  break: "broke",
  bring: "brought",
  build: "built",
  buy: "bought",
  come: "came",
  do: "did",
  eat: "ate",
  fall: "fell",
  feel: "felt",
  find: "found",
  get: "got",
  give: "gave",
  go: "went",
  have: "had",
  hold: "held",
  keep: "kept",
  know: "knew",
  leave: "left",
  lose: "lost",
  make: "made",
  meet: "met",
  pay: "paid",
  run: "ran",
  say: "said",
  see: "saw",
  send: "sent",
  show: "showed",
  speak: "spoke",
  spend: "spent",
  stand: "stood",
  steal: "stole",
  take: "took",
  tell: "told",
  think: "thought",
  throw: "threw",
  wake: "woke",
  win: "won",
  write: "wrote",
  shut: "shut",
  hit: "hit",
  put: "put",
  let: "let",
  cut: "cut",
  set: "set",
  arise: "arose",
  bite: "bit",
  choose: "chose",
  deal: "dealt",
  dig: "dug",
  draw: "drew",
  dream: "dreamt",
  drink: "drank",
  drive: "drove",
  flee: "fled",
  forbid: "forbade",
  forget: "forgot",
  forgive: "forgave",
  freeze: "froze",
  grow: "grew",
  hang: "hung",
  hide: "hid",
  leap: "leapt",
  lend: "lent",
  light: "lit",
  ring: "rang",
  rise: "rose",
  seek: "sought",
  sell: "sold",
  shake: "shook",
  shine: "shone",
  shoot: "shot",
  shrink: "shrank",
  sing: "sang",
  sink: "sank",
  sit: "sat",
  slide: "slid",
  smell: "smelt",
  speed: "sped",
  spin: "spun",
  spring: "sprang",
  stink: "stank",
  strike: "struck",
  swear: "swore",
  swim: "swam",
  swing: "swung",
  teach: "taught",
  tear: "tore",
  tread: "trod",
  wear: "wore",
  weave: "wove",
  weep: "wept",
};

const CLAUSE_PAST = {
  wakes: "woke",
  arrives: "arrived",
  opens: "opened",
  seals: "sealed",
  closes: "closed",
  comes: "came",
  goes: "went",
  does: "did",
  has: "had",
  finds: "found",
  sees: "saw",
  says: "said",
  gets: "got",
  makes: "made",
  takes: "took",
  reaches: "reached",
  returns: "returned",
  emerges: "emerged",
  begins: "began",
  starts: "started",
  turns: "turned",
  breaks: "broke",
  calls: "called",
  leaves: "left",
  loses: "lost",
  runs: "ran",
  sends: "sent",
  shows: "showed",
  speaks: "spoke",
  stands: "stood",
  tells: "told",
  thinks: "thought",
  throws: "threw",
  wins: "won",
  writes: "wrote",
  falls: "fell",
  brings: "brought",
  buys: "bought",
  catches: "caught",
  drinks: "drank",
  drives: "drove",
  eats: "ate",
  feels: "felt",
  fights: "fought",
  flies: "flew",
  gives: "gave",
  grows: "grew",
  hits: "hit",
  holds: "held",
  knows: "knew",
  meets: "met",
  pays: "paid",
  puts: "put",
  reads: "read",
  rides: "rode",
  sings: "sang",
  sleeps: "slept",
  spends: "spent",
  steals: "stole",
  swims: "swam",
  understands: "understood",
  wears: "wore",
  // bare/infinitive forms ("before the guards arrive", "until the sun sets"):
  wake: "woke",
  arrive: "arrived",
  open: "opened",
  seal: "sealed",
  close: "closed",
  come: "came",
  go: "went",
  do: "did",
  have: "had",
  find: "found",
  see: "saw",
  say: "said",
  get: "got",
  make: "made",
  take: "took",
  reach: "reached",
  return: "returned",
  emerge: "emerged",
  begin: "began",
  start: "started",
  turn: "turned",
  break: "broke",
  call: "called",
  leave: "left",
  lose: "lost",
  run: "ran",
  send: "sent",
  show: "showed",
  speak: "spoke",
  stand: "stood",
  tell: "told",
  think: "thought",
  throw: "threw",
  win: "won",
  write: "wrote",
  fall: "fell",
  bring: "brought",
  buy: "bought",
  catch: "caught",
  drink: "drank",
  drive: "drove",
  eat: "ate",
  feel: "felt",
  fight: "fought",
  fly: "flew",
  give: "gave",
  grow: "grew",
  hit: "hit",
  hold: "held",
  know: "knew",
  meet: "met",
  pay: "paid",
  put: "put",
  read: "read",
  ride: "rode",
  sing: "sang",
  sleep: "slept",
  spend: "spent",
  steal: "stole",
  swim: "swam",
  understand: "understood",
  wear: "wore",
  stop: "stopped",
  stops: "stopped",
  exit: "exited",
  exits: "exited",
  enter: "entered",
  enters: "entered",
  rush: "rushed",
  rushes: "rushed",
  abandon: "abandoned",
  abandons: "abandoned",
  activate: "activated",
  activates: "activated",
  trigger: "triggered",
  triggers: "triggered",
  complete: "completed",
  completes: "completed",
  finish: "finished",
  finishes: "finished",
  unlock: "unlocked",
  unlocks: "unlocked",
  reveal: "revealed",
  reveals: "revealed",
  awaken: "awakened",
  awakens: "awakened",
  collapse: "collapsed",
  collapses: "collapsed",
  flood: "flooded",
  floods: "flooded",
  resume: "resumed",
  resumes: "resumed",
  spread: "spread",
  spreads: "spread",
  fail: "failed",
  fails: "failed",
  fade: "faded",
  fades: "faded",
  pass: "passed",
  passes: "passed",
  end: "ended",
  ends: "ended",
  die: "died",
  dies: "died",
  shut: "shut",
  shuts: "shut",
  cut: "cut",
  cuts: "cut",
  rise: "rose",
  rises: "rose",
};

function past_tense_stem(word) {
  const lower = String(word).toLowerCase();
  if (IRREGULAR_PAST[lower]) return IRREGULAR_PAST[lower];
  if (/y$/.test(lower) && !/[aeiou]y$/.test(lower)) return lower.replace(/y$/, "ied");
  if (/e$/.test(lower)) return lower + "d";
  // Double the final consonant only for short single-vowel verbs (rip→ripped,
  // stop→stopped, stab→stabbed); never for want→wanted, turn→turned, open→opened.
  const vowels = (lower.match(/[aeiou]/g) || []).length;
  if (vowels === 1 && lower.length <= 5 && /[aeiou][^aeiouy]$/.test(lower)) {
    return lower + lower[lower.length - 1] + "ed";
  }
  return lower + "ed";
}

const DESIRE_PAST = {
  want: "wanted",
  wants: "wanted",
  wanted: "wanted",
  aim: "aimed",
  aims: "aimed",
  aimed: "aimed",
  hope: "hoped",
  hopes: "hoped",
  hoped: "hoped",
  intend: "intended",
  intends: "intended",
  intended: "intended",
  plan: "planned",
  plans: "planned",
  planned: "planned",
};

const FIRST_WORD_STOPLIST = new Set([
  "the",
  "a",
  "an",
  "he",
  "she",
  "it",
  "they",
  "we",
  "i",
  "you",
  "this",
  "that",
  "these",
  "those",
  "his",
  "her",
  "their",
  "its",
  "our",
  "my",
  "your",
  "one",
  "some",
  "no",
  "every",
  "each",
  "any",
  "all",
  "there",
  "if",
  "when",
  "after",
  "before",
  "until",
  "while",
  "though",
  "as",
  "once",
  "unless",
  "what",
  "who",
  "which",
  "with",
  "under",
  "inside",
  "outside",
  "from",
  "into",
  "within",
  "against",
  "during",
  "through",
  "upon",
  "behind",
  "among",
  "between",
]);

const TIME_SUBORDINATOR = /\b(as soon as|before|until|once|when|after)\b([^.!?]+)/g;

/**
 * Lightweight future→past rewording used when a directive is resolved outside the
 * memory-forge compile pass (the forge emits properly reworded past_content via the
 * LLM; this heuristic is the offline fallback and keeps the tense grammatical).
 */
export function reword_to_past(content, outcome = "neutral") {
  const raw = String(content || "");
  const original = raw.trim().replace(/\.+$/, "");
  if (!original) return raw;

  // Past-tense the deadline verb inside a time subclause — the LAST verb-like
  // word after the subordinator ("before the facility wakes up" -> "woke up",
  // "until the patrol reaches the vault" -> "reached"). Scanning backwards
  // avoids tense-ing common nouns that double as verbs ("before the power
  // returns" keeps "power" and tenses "returns").
  const tense_subclauses = (text) =>
    text.replace(TIME_SUBORDINATOR, (m, sub, clause) => {
      let last = -1;
      let lastRaw = "";
      clause.replace(/\b([a-zA-Z]+)\b/g, (wm, w, off) => {
        if (CLAUSE_PAST[w.toLowerCase()] !== undefined) {
          last = off;
          lastRaw = wm;
        }
        return wm;
      });
      if (last === -1) return m;
      const past = CLAUSE_PAST[lastRaw.toLowerCase()];
      const repl = lastRaw !== lastRaw.toLowerCase() ? past[0].toUpperCase() + past.slice(1) : past;
      return sub + clause.slice(0, last) + repl + clause.slice(last + lastRaw.length);
    });

  const desire = original.match(/^(wants?|wanted|aims?|hopes?|intends?|planned?|plans?)\s+to\s+(.+)$/i);
  if (desire) {
    const prefix = desire[1].toLowerCase();
    const past = DESIRE_PAST[prefix] || prefix;
    const head = past[0].toUpperCase() + past.slice(1);
    if (outcome === "failure") {
      return `${head} to ${desire[2]} but failed.`;
    }
    return `${head} to ${tense_subclauses(desire[2])}.`;
  }

  const text = tense_subclauses(original);

  if (outcome === "failure") {
    // The action never happened: keep the main verb as a bare infinitive
    // after "Failed to" (lowercased), only the subclauses move to past.
    const first = (text.match(/^([A-Za-z]+)/) || ["", ""])[1];
    let rest = text;
    if (first) {
      rest = first[0].toLowerCase() + first.slice(1) + text.slice(first.length);
    }
    return `Failed to ${rest}.`;
  }

  let out = text;
  const first = (out.match(/^([A-Za-z]+)/) || ["", ""])[1];
  if (first && !FIRST_WORD_STOPLIST.has(first.toLowerCase())) {
    const stem = past_tense_stem(first);
    if (stem !== first.toLowerCase()) {
      out = stem[0].toUpperCase() + stem.slice(1) + out.slice(first.length);
    }
  }

  return out.replace(/\.+$/, "") + ".";
}

export function resolve(entity, vector_id, resolution = null, session = null, outcome = null, past_content = null) {
  if (!entity || typeof entity !== "object") return;
  const arr = Array.isArray(entity.past) ? entity.past : [];
  const index = arr.findIndex((v) => v.id === vector_id);
  if (index === -1) return;
  const [vector] = arr.splice(index, 1);
  if (!vector) return;

  vector.type = "past";
  vector.timestamp = Date.now();
  const fresh = past_content && String(past_content).trim();
  if (fresh) {
    // The caller supplied a grammar-corrected account of what actually happened.
    vector.content = String(past_content).trim();
  } else if (outcome != null) {
    // Outcome-bearing resolutions (director/forge) rewrite the directive into a
    // grammatical past memory — success/failure/neutral each tense it properly.
    vector.content = reword_to_past(vector.content, outcome);
  }
  // Otherwise this is a mechanical transition; keep the original content
  // verbatim so plain resolutions never mangle the text.
  vector.meta = {
    ...(vector.meta || {}),
    outcome: outcome || "neutral",
    resolution_summary: resolution && typeof resolution === "string" ? resolution : "DIRECTOR_RESOLUTION",
  };
  entity.past.push(vector);

  if (session?.log_system_entry) {
    const text = vector.content || "";
    session.log_system_entry(`Vector Resolved: ${text.substring(0, 40)}... [${resolution || "PAST"}]`, "system", {
      type: "VECTOR_RESOLUTION",
      vector,
      resolution,
      outcome: outcome || "neutral",
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
      future_consolidated: {},
    };

    for (const { key } of entity_targets) {
      const entity_block = memory?.[key] && typeof memory[key] === "object" ? memory[key] : {};

      // FUTURE is a single consolidated prose field, mirroring present:
      // the forge rewrites the standing agenda wholesale, dropping fulfilled or
      // abandoned goals and keeping/adding what still matters.
      const fut = entity_block.future_consolidated;
      if (typeof fut === "string" && fut.trim()) {
        forged.future_consolidated[key] = fut.trim();
      }

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
      const pending_embeds = [];

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
          pending_embeds.push(vector);
        }

        forged.memories[key].push(vector);
      }

      // Embed every new vector in parallel, but never let ONNX/wasm inference
      // stall the post-turn consolidation indefinitely (it can be slow on the
      // main thread, and a stuck intent-lock froze the UI for 300s+ in the
      // field). Vectors that miss the budget still append — they simply score 0
      // semantically and fall back to lexical ranking; build_context re-embeds
      // with its own bounded race.
      if (pending_embeds.length) {
        await Promise.race([
          Promise.allSettled(pending_embeds.map((v) => ensure_embedding(v))),
          new Promise((resolve) => setTimeout(resolve, FORGE_EMBED_BUDGET_MS)),
        ]);
      }
    }

    const has_memories = Object.values(forged.memories).some((arr) => arr.length > 0);
    const has_present = Object.keys(forged.present_consolidated).length > 0;
    const has_eternal = Object.keys(forged.eternal_consolidated).length > 0;
    const has_future = Object.keys(forged.future_consolidated).length > 0;

    if (!has_memories && !has_present && !has_eternal && !has_future) return null;

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
      append_past_vector(entity, vector);
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
      resolve(entity, v.id, v.resolution_summary || "DIRECTOR_RESOLUTION", session, v.outcome, v.past_content);
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
      // FUTURE is prose now — every appended vector is a past anchor.
      const new_vector = create(payload, "past", v.emotional_weight ?? v.weight ?? 5);
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
  reword_to_past,
  forge_memory,
  apply_state_mutations,
  append_past_vector,
  reconcile_vector_caps,
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

          // FUTURE CONSOLIDATION — the forge rewrites each entity's standing
          // agenda prose wholesale (mirroring present_consolidated): fulfilled
          // or abandoned goals fall away, still-relevant ones are refreshed, and
          // new intents are folded in as one clean block.
          for (const { key, type, entity } of entity_targets) {
            const rewritten = forged.future_consolidated?.[key];
            if (typeof rewritten !== "string" || !rewritten.trim()) continue;
            entity.future = rewritten.trim();
            await runtime.update_entity(type, entity.id, { future: entity.future });
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
    if (fractal && !String(fractal.future || "").trim()) {
      app?.log("[TemporalEngine] Placeholder momentum active (No future agenda set)", "system");
    }
  },
};

if (typeof window !== "undefined") {
  window.temporal_engine = temporal_engine;
}
