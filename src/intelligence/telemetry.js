/**
 * Canonical telemetry normalization for the `{ type, updates }` event shape,
 * producing the `{ key, name, dynamics, physical, non_physical,
 * eternal_physical, eternal_non_physical, new_vectors, retrieval,
 * has_dynamics, has_mods }` blocks rendered by TelemetryCard.
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
 * Mirror of TelemetryCard's entity-name resolution.
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
 * Mirror of TelemetryCard's human-readable memory/vector type label.
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

/**
 * Builds one entity's normalized `updates` block for telemetry. Director fields
 * are aligned into the display shape: `present_mutations.{physical,non_physical}`
 * and `eternal_mutations.{physical,non_physical}` (from `state_append` and
 * `foundation_consolidated`), `vector_append` items keep `content`/`type`
 * but their `weight` becomes `emotional_weight`, `vector_resolve` → `vectors.resolved`,
 * `dynamics_deltas` is dropped (the computed `dynamics` array already carries old/new/diff per
 * axis). Returns null when the entity carries no content so the dump stays lean.
 * @param {string|null} name
 * @param {any} mutations
 * @param {any[]} dynamics
 * @param {any[]} retrieval
 * @returns {any}
 */
export function build_update_entry(name, mutations, dynamics, retrieval) {
  const entry = {};
  if (name) entry.name = name;

  const pres = mutations?.state_append || {};
  entry.present_mutations = {
    physical: pres.physical || "",
    non_physical: pres.non_physical || "",
  };

  const eternal = mutations?.foundation_consolidated || {};
  entry.eternal_mutations = {
    physical: eternal.physical || "",
    non_physical: eternal.non_physical || "",
  };

  const resolve_list = Array.isArray(mutations?.vector_resolve) ? mutations.vector_resolve : [];
  const new_list = Array.isArray(mutations?.vector_append) ? mutations.vector_append : [];

  entry.vectors = {
    resolved: resolve_list,
    new: new_list.map((v) => {
      const copy = { ...(v || {}) };
      copy.content = (copy.content || copy.directive || "").trim();
      delete copy.directive;
      copy.emotional_weight = copy.emotional_weight ?? copy.weight ?? 5;
      delete copy.weight;
      return copy;
    }),
  };
  if (retrieval?.length) entry.vectors.retrieval = retrieval;
  if (dynamics?.length) entry.dynamics = dynamics;

  const has_content =
    (dynamics?.length || 0) > 0 ||
    entry.present_mutations.physical.trim() ||
    entry.present_mutations.non_physical.trim() ||
    entry.eternal_mutations.physical.trim() ||
    entry.eternal_mutations.non_physical.trim() ||
    entry.vectors.resolved.length > 0 ||
    entry.vectors.new.length > 0 ||
    (entry.vectors.retrieval?.length || 0) > 0;
  return has_content ? entry : null;
}

/**
 * Normalizes scored retrieval vectors into the telemetry shape: single vectors
 * array, sorted by `_relevance` descending, internal embedding/scoring fields
 * stripped so the raw-meta dump stays readable (embeddings are 384-dim
 * Float32Arrays that JSON.stringify would expand into thousands of keys).
 * @param {any} vectors
 * @returns {any[]}
 */
export function build_retrieval(vectors) {
  const clean = (v) => {
    if (!v || typeof v !== "object") return null;
    const copy = { ...v };
    delete copy._embedding;
    delete copy._semantic_score;
    delete copy._recency_factor;
    copy.type = copy.type || "past";
    copy.content = (copy.content || copy.directive || "").trim();
    delete copy.directive;
    copy.emotional_weight = copy.emotional_weight ?? copy.weight ?? 5;
    delete copy.weight;
    return copy;
  };
  return (Array.isArray(vectors) ? vectors : [])
    .map(clean)
    .filter(Boolean)
    .sort((a, b) => (b._relevance ?? -Infinity) - (a._relevance ?? -Infinity));
}
