/**
 * src/intelligence/telemetry.js
 * 📡 KERNEL TELEMETRY PAYLOAD BUILDERS
 * Pure construction of the raw `updates` telemetry entries the kernel logs
 * after each turn (Director mutations → normalized display entries, retrieval
 * vectors scrubbed for the raw-meta dump). The message-feed UI renders these
 * via @ui/message/telemetry.js, which owns the display-side normalization.
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
 * CAPTURE DYNAMICS DELTA
 * Detects changes in entity dynamics and logs a telemetry entry to session_driver.
 * @param {any} bridge
 * @param {any} snapshot
 * @param {any} [meta]
 */
export async function capture_dynamics_delta(bridge, snapshot, meta = null) {
  const { compute_deltas } = await import("./physics.js");
  const deltas = [];
  const log_strings = [];

  if (snapshot.ai?.dynamics) {
    compute_deltas("ai", snapshot.ai.dynamics, bridge.runtime.ai, deltas, log_strings);
    if (bridge.runtime.active_ai?.id) {
      await bridge.runtime.update_entity("character", bridge.runtime.active_ai.id, {
        dynamics: { ...snapshot.ai.dynamics },
      });
    }
  }

  if (snapshot.fractal?.dynamics) {
    compute_deltas("fractal", snapshot.fractal.dynamics, bridge.runtime.fractal, deltas, log_strings);
    if (bridge.runtime.active_fractal?.id) {
      await bridge.runtime.update_entity("fractal", bridge.runtime.active_fractal.id, {
        dynamics: { ...snapshot.fractal.dynamics },
      });
    }
  }

  if (deltas.length > 0 || meta) {
    const mutations = meta?.mutations || {};
    const retrieval = build_retrieval(meta?.vectors);
    const dynamics_for = (target) =>
      deltas.filter((d) => d.target === target).map(({ axis, old_value, new_value, diff }) => ({ axis, old_value, new_value, diff }));

    const updates = {};

    const ai_entry = build_update_entry(snapshot.ai?.name || bridge.runtime.active_ai?.name, mutations.AI_CHARACTER, dynamics_for("ai"), retrieval);
    if (ai_entry) updates.AI_CHARACTER = ai_entry;

    const user_entry = build_update_entry(bridge.runtime.active_user?.name, mutations.USER_PERSONA, [], []);
    if (user_entry) updates.USER_PERSONA = user_entry;

    const fractal_entry = build_update_entry(
      snapshot.fractal?.name || bridge.runtime.active_fractal?.name,
      mutations.FRACTAL,
      dynamics_for("fractal"),
      [],
    );
    if (fractal_entry) updates.FRACTAL = fractal_entry;

    await bridge.session_driver.log_system_entry(log_strings.length > 0 ? log_strings.join(" | ") : "Simulation Telemetry Snapshot", "system", {
      type: "DYNAMICS_DELTA",
      trigger_image: meta?.trigger_image === true,
      ...(meta?.image_trigger ? { image_trigger: meta.image_trigger } : {}),
      ...(meta?.image_tier ? { image_tier: meta.image_tier } : {}),
      ...(meta?.image_source ? { image_source: meta.image_source } : {}),
      ...(meta?.image_signals ? { image_signals: meta.image_signals } : {}),
      ...(meta?.thoughts ? { thoughts: meta.thoughts } : {}),
      updates,
    });
  }
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

/**
 * Derives a punchy single-line header title from directive text.
 * @param {string} text - Raw directive text
 * @param {number} [maxLen=38] - Target maximum length
 * @returns {string}
 */
export function derive_vector_title(text, maxLen = 38) {
  if (!text || typeof text !== "string") return "";
  const cleaned = text
    .trim()
    .replace(/^["'“”«»]+|["'“”«»]+$/g, "")
    .replace(/\s+/g, " ");

  if (!cleaned) return "";

  if (cleaned.length <= maxLen) {
    return cleaned.replace(/[.,;:]+$/, "");
  }

  const sub = cleaned.slice(0, maxLen);
  const last_space = sub.lastIndexOf(" ");
  const truncated = last_space > 15 ? sub.slice(0, last_space) : sub;
  return truncated.replace(/[.,;:]+$/, "") + "…";
}
