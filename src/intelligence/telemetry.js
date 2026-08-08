/**
 * Mirror of DevTelemetryBlock's per-entity block normalization for the current
 * `{ type, updates }` telemetry shape, producing the identical
 * `{ key, name, dynamics, physical, non_physical, eternal_physical, eternal_non_physical, new_vectors, retrieval, has_dynamics, has_mods }`
 * block the component renders.
 * @param {any} meta
 */
export function process_entity_blocks(meta = {}) {
  const mutation_keys = { ai: "AI_CHARACTER", fractal: "FRACTAL", user: "USER_PERSONA" };
  if (!meta.updates || typeof meta.updates !== "object") return [];
  const blocks = [];
  for (const [target, mutation_key] of Object.entries(mutation_keys)) {
    const upd = meta.updates[mutation_key];
    if (!upd) continue;
    const dynamics = (Array.isArray(upd.dynamics) ? upd.dynamics : []).map((d) => ({
      axis: d.axis,
      value: d.new_value,
      old_value: d.old_value,
      new_value: d.new_value,
      diff: d.diff,
      has_delta: true,
    }));
    const new_vectors = (Array.isArray(upd.vectors?.new) ? upd.vectors.new : []).map((v) => ({
      type: v.type || "future",
      weight: v.emotional_weight ?? v.weight ?? 5,
      id: v.id,
      content: v.content || v.directive || "",
    }));
    const retrieval = (Array.isArray(upd.vectors?.retrieval) ? upd.vectors.retrieval : []).map((v) => ({
      type: v.type || "past",
      id: v.id,
      content: v.content || v.directive || "",
      relevance: v._relevance,
    }));
    const physical = upd.present_mutations?.physical || "";
    const non_physical = upd.present_mutations?.non_physical || "";
    const eternal_physical = upd.eternal_mutations?.physical || "";
    const eternal_non_physical = upd.eternal_mutations?.non_physical || "";
    const has_dynamics = dynamics.length > 0;
    const has_mods = !!(
      physical.trim() ||
      non_physical.trim() ||
      eternal_physical.trim() ||
      eternal_non_physical.trim() ||
      new_vectors.length > 0 ||
      retrieval.length > 0
    );
    if (has_dynamics || has_mods) {
      blocks.push({
        key: target,
        name: upd.name,
        dynamics,
        physical,
        non_physical,
        eternal_physical,
        eternal_non_physical,
        new_vectors,
        retrieval,
        has_dynamics,
        has_mods,
      });
    }
  }
  return blocks;
}

/**
 * Mirror of DevTelemetryBlock's entity-name resolution.
 * @param {string} key
 * @param {any} [runtime]
 */
export function resolve_entity_name(key, runtime = {}) {
  if (key === "ai" || key === "AI_CHARACTER") return runtime.active_ai?.name || "AI CHARACTER";
  if (key === "fractal" || key === "FRACTAL") return runtime.active_fractal?.name || "FRACTAL";
  if (key === "user" || key === "USER_PERSONA") return runtime.active_user?.name || "USER PERSONA";
  return key;
}

/**
 * Mirror of DevTelemetryBlock's human-readable memory/vector type label.
 * @param {string} [type]
 * @param {string} [fallback]
 */
export function vector_label(type, fallback) {
  const t = type || fallback;
  if (t === "future") return "FUTURE VECTOR";
  if (t === "past") return "PAST MEMORY";
  return String(t).toUpperCase();
}

/** @param {number} val */
export function get_pct(val) {
  return Math.max(0, Math.min(100, Math.round(val || 50)));
}
