/**
 * src/ui/message/telemetry-format.js
 * 🔭 TELEMETRY FORMATTERS
 * Pure helpers that turn Director/memory metadata (DYNAMICS_DELTA, telemetry
 * cards) into renderable per-entity blocks: name resolution, dynamics
 * compaction, vector labels, and update-shape projection.
 */

const ENTITY_KEYS = {
  AI_CHARACTER: "ai",
  USER_PERSONA: "user",
  FRACTAL: "fractal",
};

/**
 * Resolves a telemetry entity key to its display name — the runtime's active
 * entity when available, otherwise a static label. Unknown keys pass through.
 * @param {string} key
 * @param {{ active_ai?: any, active_user?: any, active_fractal?: any }} [runtime]
 * @returns {string}
 */
export function resolve_entity_name(key, runtime) {
  const map = {
    AI_CHARACTER: () => runtime?.active_ai?.name || "AI CHARACTER",
    USER_PERSONA: () => runtime?.active_user?.name || "USER PERSONA",
    FRACTAL: () => runtime?.active_fractal?.name || "FRACTAL",
    ai: () => runtime?.active_ai?.name || "AI CHARACTER",
    user: () => runtime?.active_user?.name || "USER PERSONA",
    fractal: () => runtime?.active_fractal?.name || "FRACTAL",
  };
  const resolver = map[key];
  return resolver ? resolver() : String(key ?? "");
}

/**
 * Human-readable label for a vector type, falling back on the pool kind when
 * the type is missing. Unknown types pass through uppercased.
 * @param {any} type
 * @param {"past" | "future"} fallback
 * @returns {string}
 */
export function vector_label(type, fallback) {
  if (type == null) return fallback === "future" ? "FUTURE VECTOR" : "PAST MEMORY";
  const t = String(type).toUpperCase();
  if (t === "FUTURE") return "FUTURE VECTOR";
  if (t === "PAST") return "PAST MEMORY";
  if (t === "PRESENT") return "PRESENT";
  return t;
}

/**
 * Projects a DYNAMICS_DELTA `updates` map into renderable per-entity blocks.
 * Entities with no content (no dynamics, vectors, or mutations) are omitted.
 * @param {any} meta
 * @returns {Array<any>}
 */
export function process_entity_blocks(meta) {
  const updates = meta?.updates && typeof meta.updates === "object" ? meta.updates : {};
  const blocks = [];
  for (const [key, raw] of Object.entries(updates)) {
    if (!raw || typeof raw !== "object") continue;
    const block_key = ENTITY_KEYS[key];
    if (!block_key) continue;

    const dynamics = (Array.isArray(raw.dynamics) ? raw.dynamics : []).map((d) => ({
      axis: d.axis,
      value: d.new_value,
      old_value: d.old_value,
      new_value: d.new_value,
      diff: d.diff,
      has_delta: true,
    }));

    const new_vectors = (Array.isArray(raw.vectors?.new) ? raw.vectors.new : []).map((v) => ({
      type: v.type,
      weight: v.emotional_weight,
      ...(v.id ? { id: v.id } : {}),
      content: v.content,
    }));

    const retrieval = (Array.isArray(raw.vectors?.retrieval) ? raw.vectors.retrieval : []).map((v) => ({
      type: v.type,
      id: v.id,
      content: v.content,
      relevance: v._relevance,
    }));

    const physical = raw.present_mutations?.physical ?? "";
    const non_physical = raw.present_mutations?.non_physical ?? "";
    const eternal_physical = raw.eternal_mutations?.physical ?? "";
    const eternal_non_physical = raw.eternal_mutations?.non_physical ?? "";
    const has_mods = !!eternal_physical || !!eternal_non_physical;

    if (!dynamics.length && !new_vectors.length && !retrieval.length && !physical && !non_physical && !eternal_physical && !eternal_non_physical) {
      continue;
    }

    blocks.push({
      key: block_key,
      name: raw.name || resolve_entity_name(key, {}),
      physical,
      non_physical,
      eternal_physical,
      eternal_non_physical,
      dynamics,
      new_vectors,
      retrieval,
      has_mods,
    });
  }
  return blocks;
}
