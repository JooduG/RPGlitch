/**
 * @file src/intelligence/vector-pool.js
 * 🧠 VECTOR POOL — Unified memory accessor.
 * Entities can carry memories in two shapes at once:
 *   - the legacy `vectors` array (written by the temporal engine and the
 *     profile editor's memory list), and
 *   - the new-layer `past` / `future` fields (written by normalization,
 *     enhancement, and imports).
 * `resolve_vector_pool` flattens both into one merged pool so no read path
 * ever sees an empty memory list just because the other shape was used.
 */

/**
 * Merges an entity's memories into a single normalized array.
 * Prefers the legacy `vectors` array when present, otherwise combines
 * `past` and `future`. String items are passed through untouched.
 * @param {any} entity
 * @returns {any[]}
 */
export function resolve_vector_pool(entity) {
  if (!entity || typeof entity !== "object") return [];
  const normalize_item = (v, type) => (v && typeof v === "object" ? { ...v, type, content: v.content || v.directive || v.text || "" } : v);
  if (Array.isArray(entity.vectors) && entity.vectors.length > 0) {
    return entity.vectors.map((v) => normalize_item(v, v?.type === "future" ? "future" : "past"));
  }
  const pool = [];
  if (Array.isArray(entity.past)) {
    for (const v of entity.past) pool.push(normalize_item(v, v?.type === "future" ? "future" : "past"));
  }
  if (Array.isArray(entity.future)) {
    for (const v of entity.future) pool.push(normalize_item(v, v?.type === "past" ? "past" : "future"));
  }
  return pool;
}
