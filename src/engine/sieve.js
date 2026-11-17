/**
 * src/engine/sieve.js
 * ============================================================================
 * 📜 TWO-TIER SIEVE RAG & VECTOR RETRIEVAL ENGINE
 * ============================================================================
 *
 * Algorithmic core for episodic memory retrieval, guaranteed participant floors,
 * and gravity-weighted overflow pools over normalized 384-d vectors.
 *
 * Architecture:
 * - Pure character-based budgeting across the application.
 * - Tier 1: Guaranteed per-entity character floor (5,000 characters per primary participant).
 * - Tier 2: Universal gravity-weighted overflow pool for secondary cast and world lore.
 * - Ephemeral Vector Cache Adapter interface (in-memory Map by default).
 * ============================================================================
 */

import { EMBEDDING_SPECS, FIELD_FLOORS } from "@config";
import { count_tokens, cosine_similarity } from "@utils";

/** Origin protection multiplier boosting author canon and immutable memories (single consumer - lives here, not on the dashboard) */
const ORIGIN_SCORE_MULTIPLIER = 1.5;

/** Total guaranteed character floor across all 6 profile fields (sum: 1700 chars) */
export const TOTAL_FIELD_FLOORS_CHARACTERS = Object.values(FIELD_FLOORS).reduce((sum, floor) => sum + floor, 0);

/**
 * Native Perchance tokenizer with headless character-ratio fallback.
 * Delegates to the unified `@utils` token counter (single implementation).
 *
 * @param {string} text
 * @returns {number}
 */
export function count_text_tokens(text) {
  return count_tokens(text);
}

/**
 * Cosine similarity re-exported from the unified `@utils` vector home.
 * Kept here so the engine barrel surface is unchanged.
 */
export { cosine_similarity };

/**
 * Creates an in-memory ephemeral vector cache adapter for Gate 1.
 * Pluggable interface to be swapped with Dexie IndexedDB in Gate 2.
 *
 * NOTE: This is an in-memory development adapter only. Gate 2 replaces this
 * with persistent Dexie.js IndexedDB tables for long-term vector storage.
 *
 * @returns {{ get: (id: string) => Promise<Float32Array | null>, set: (id: string, vector: Float32Array) => Promise<void>, clear: () => Promise<void> }}
 */
export function create_ephemeral_vector_cache() {
  const store = new Map();

  return {
    async get(id) {
      return store.get(id) || null;
    },
    async set(id, vector) {
      if (store.size >= EMBEDDING_SPECS.MAX_EPHEMERAL_VECTORS) {
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
 * Scores candidate memory items against a query vector and applies
 * origin-protection multiplier.
 *
 * NOTE: Recency decay is handled dynamically during working memory query
 * construction (weighting newer messages over older turns in the active window),
 * so candidate scoring remains clean: pure semantic similarity * origin multiplier.
 *
 * @param {Array<{ id: string, text: string, vector?: number[], is_origin?: boolean }>} candidates
 * @param {number[]} queryVector
 * @returns {Array<{ item: any, score: number, length: number }>}
 */
export function score_and_rank_memories(candidates, queryVector) {
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
 * Two-Tier Sieve RAG Allocation in Pure Characters:
 * - Tier 1: Evaluates candidate items for a field/persona with RAG relevance and fills
 *   up to the guaranteed lean floor (FIELD_GUARANTEED_FLOORS).
 * - Tier 2: Any leftover candidates spill into the universal gravity-weighted overflow pool
 *   where they compete via RAG scoring until the total memory budget is filled.
 *
 * @param {object} params
 * @param {Array<any>} params.primary_memories - Memories / brackets belonging to main character
 * @param {Array<any>} params.lore_memories - World lore / fractal memories / other fields
 * @param {number[]} params.query_vector - 384-d semantic query vector
 * @param {number} [params.total_budget_characters=TOTAL_FIELD_FLOORS_CHARACTERS]
 * @param {number} [params.guaranteed_floor_characters=FIELD_FLOORS.PAST]
 * @returns {{ selected: any[], total_characters: number, tier1_count: number, tier2_count: number }}
 */
export function two_tier_sieve_rag({
  primary_memories = [],
  lore_memories = [],
  query_vector = null,
  total_budget_characters = TOTAL_FIELD_FLOORS_CHARACTERS,
  guaranteed_floor_characters = FIELD_FLOORS.PAST,
}) {
  const ranked_primary = score_and_rank_memories(primary_memories, query_vector);
  const ranked_lore = score_and_rank_memories(lore_memories, query_vector);

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
