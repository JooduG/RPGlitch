/**
 * src/intelligence/telemetry.js
 * 📡 PER-TURN TELEMETRY PAYLOAD BUILDERS
 * Pure construction of the raw `updates` telemetry entries the kernel logs
 * after each turn (Director mutations → normalized display entries, retrieval
 * vectors scrubbed for the raw-meta dump).
 *
 * FLOW: kernel builds the payload here → the message feed formats it for
 * display (@ui/message/telemetry-format.js) → TelemetryCard renders it. The
 * DevMode event log is a separate, simpler stream (@state/dev-log.svelte.js).
 */

/**
 * Builds one entity's normalized `updates` block for telemetry. Director fields
 * are aligned into the display shape: `present_mutations.{physical,non_physical}`
 * and `eternal_mutations.{physical,non_physical}` (from `state_append` and
 * `foundation_consolidated`), `vector_append` items keep `content`/`type`
 * but their `weight` becomes `emotional_weight`,
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

  const new_list = Array.isArray(mutations?.vector_append) ? mutations.vector_append : [];

  entry.vectors = {
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

/**
 * Builds the per-turn DevMode summary line: which roles produced how many
 * messages in the recent feed tail. An empty tail reports that nothing was
 * recorded so a silently-empty round is visible in the telemetry log.
 * @param {any[]} feed
 * @param {number} round
 * @returns {string}
 */
export function build_turn_summary(feed, round) {
  const tail = (feed || []).slice(-16);
  const counts = {};
  for (const m of tail) {
    if (!m || m.role === "system") continue;
    const role = m.role === "model" ? "ai" : m.role;
    counts[role] = (counts[role] || 0) + 1;
  }
  const parts = Object.entries(counts).map(([r, n]) => `${r}×${n}`);
  return `Turn ${round} complete — ${parts.length ? parts.join(", ") : "no messages recorded"}.`;
}
