/**
 * @file src/intelligence/vector-pool.js
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
