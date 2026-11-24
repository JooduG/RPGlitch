/**
 * src/simulation/retrieval.js
 * ============================================================================
 * 📜 TWO-TIER RETRIEVAL & VECTOR MEMORY ENGINE (Rank 1, pure simulation)
 * ============================================================================
 *
 * Algorithmic core for episodic memory retrieval, guaranteed participant
 * floors, and gravity-weighted overflow pools over normalized 384-d vectors.
 *
 * Phase 2 unification: from `src/engine/sieve.js` (`score_and_rank_memories`
 * as `rank_memories`, `two_tier_sieve_rag` as `select_context_memories`,
 * `create_ephemeral_vector_cache` as `create_vector_cache`) +
 * `tags.js#extract_memory_candidates`.
 *
 * The cosine-similarity local re-export and the legacy `count_text_tokens`
 * wrapper are deleted: the canonicals live in `@utils` (`vectors.js`,
 * `text.js`) and every consumer imports them from there.
 *
 * Pure character-based budgeting across the application.
 * Imports only Rank 0 (`@config`, `@utils`).
 * ============================================================================
 */

import { FIELD_FLOORS } from "@config";
import { cosine_similarity } from "@utils";
import { parse_tagged_fields } from "./brackets.js";

/** Origin protection multiplier boosting author canon and immutable memories */
const ORIGIN_SCORE_MULTIPLIER = 1.5;

/** Total guaranteed character floor across all 6 profile fields (sum: 1700 chars) */
export const TOTAL_FIELD_FLOORS_CHARACTERS = Object.values(FIELD_FLOORS).reduce((sum, floor) => sum + floor, 0);

/**
 * Converts a canonical past multiline tagged-field string into candidate memory objects
 * ready for retrieval scoring.
 *
 * @param {string} past_text - multiline [KEY: VALUE | flags] string
 * @returns {Array<{ id: string, text: string, is_origin: boolean, weight: number, key: string }>}
 */
export function extract_memory_candidates(past_text) {
  const entries = parse_tagged_fields(past_text);
  if (!entries || entries.length === 0) return [];

  return entries.map((entry, entry_index) => ({
    id: `mem_${entry_index}_${entry.key.toLowerCase()}`,
    text: entry.value,
    is_origin: Boolean(entry.is_origin),
    weight: typeof entry.weight === "number" ? entry.weight : 5,
    key: entry.key,
  }));
}

/**
 * Creates an in-memory ephemeral vector cache adapter.
 * Evicts the oldest entry (FIFO) when full - including when the write is an
 * update to an existing key (no silent over-capacity growth).
 *
 * @param {number} [max_entries=200] - Memory ceiling
 * @returns {{ get: (id: string) => Promise<Float32Array | null>, set: (id: string, vector: Float32Array) => Promise<void>, clear: () => Promise<void> }}
 */
export function create_vector_cache(max_entries = 200) {
  const store = new Map();

  return {
    async get(id) {
      return store.get(id) || null;
    },
    async set(id, vector) {
      if (!store.has(id) && store.size >= max_entries) {
        // Evict oldest entry (FIFO) to enforce memory ceiling
        const first_key = store.keys().next().value;
        if (first_key !== undefined) {
          store.delete(first_key);
        }
      }
      store.set(id, vector);
    },
    async clear() {
      store.clear();
    },
  };
}

/**
 * Scores candidate memory items against a query vector and applies the
 * `is_origin` protection multiplier.
 *
 * NOTE: Recency decay is handled dynamically during working memory query
 * construction (weighting newer messages over older turns in the active window),
 * so candidate scoring stays clean: pure semantic similarity * origin multiplier.
 *
 * @param {Array<{ id: string, text: string, vector?: number[], is_origin?: boolean }>} candidates
 * @param {number[]} queryVector
 * @returns {Array<{ item: any, score: number, length: number }>}
 */
export function rank_memories(candidates, queryVector) {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];

  const scored = [];

  for (const item of candidates) {
    let similarity = 0.5; // fallback baseline if vector not computed yet
    if (item.vector && queryVector) {
      similarity = cosine_similarity(item.vector, queryVector);
    }

    // Origin protection: author canonical facts receive a multiplier boost
    const origin_multiplier = item.is_origin ? ORIGIN_SCORE_MULTIPLIER : 1.0;

    const final_score = similarity * origin_multiplier;
    const length = (item.text || "").length;

    scored.push({ item, score: final_score, length });
  }

  // Sort descending by score
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Two-Tier context-memory allocation in pure characters:
 * - Tier 1: Guaranteed per-entity character floor for primary participants.
 * - Tier 2: Universal gravity-weighted overflow pool for secondary cast and
 *   world lore, competing via retrieval scoring until the total budget fills.
 *
 * @param {object} params
 * @param {Array<any>} params.primary_memories - Memories / brackets belonging to main character
 * @param {Array<any>} params.lore_memories - World lore / fractal memories / other fields
 * @param {number[]} params.query_vector - 384-d semantic query vector
 * @param {number} [params.total_budget_characters=TOTAL_FIELD_FLOORS_CHARACTERS]
 * @param {number} [params.guaranteed_floor_characters=FIELD_FLOORS.PAST]
 * @returns {{ selected: any[], total_characters: number, tier1_count: number, tier2_count: number }}
 */
export function select_context_memories({
  primary_memories = [],
  lore_memories = [],
  query_vector = null,
  total_budget_characters = TOTAL_FIELD_FLOORS_CHARACTERS,
  guaranteed_floor_characters = FIELD_FLOORS.PAST,
}) {
  const ranked_primary = rank_memories(primary_memories, query_vector);
  const ranked_lore = rank_memories(lore_memories, query_vector);

  const selected = [];
  let current_characters = 0;
  let tier1_count = 0;

  // --- TIER 1: Guaranteed Floor Allocation for Primary Participants ---
  const remaining_primary = [];
  for (const entry of ranked_primary) {
    if (current_characters + entry.length <= guaranteed_floor_characters) {
      selected.push(entry.item);
      current_characters += entry.length;
      tier1_count++;
    } else {
      remaining_primary.push(entry);
    }
  }

  // --- TIER 2: Universal Gravity-Weighted Overflow Pool ---
  // Combine unallocated primary memories with world lore into unified competition
  const overflow_pool = [...remaining_primary, ...ranked_lore].sort((a, b) => b.score - a.score);

  let tier2_count = 0;
  for (const entry of overflow_pool) {
    if (current_characters + entry.length <= total_budget_characters) {
      selected.push(entry.item);
      current_characters += entry.length;
      tier2_count++;
    }
  }

  return { selected, total_characters: current_characters, tier1_count, tier2_count };
}
