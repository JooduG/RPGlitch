/**
 * src/intelligence/telemetry.js
 * 📡 KERNEL TELEMETRY PAYLOAD BUILDERS
 *
 * Provides pure construction and formatting of telemetry entries logged after each turn:
 * 1. Telemetry Payload Formatters (build_update_entry, build_retrieval)
 * 2. Dynamics Delta Capture (capture_dynamics_delta)
 * 3. DevMode Turn Summary (build_turn_summary)
 */

import { compute_dynamics_deltas } from "./physics.js";

// ── 1. Telemetry Payload Formatters ───────────────────────────────────────────

/**
 * Builds one entity's normalized `updates` block for telemetry.
 *
 * @param {string|null} name - Entity display name
 * @param {any} mutations - Mutation object containing state_append, foundation_consolidated, vector_append
 * @param {any[]} [dynamics=[]] - Dynamics diffs array [{ axis, old_value, new_value, diff }]
 * @param {any[]} [retrieval=[]] - Cleaned retrieval vectors
 * @returns {Record<string, any>|null}
 */
export function build_update_entry(name, mutations, dynamics = [], retrieval = []) {
  const entry = {};
  if (name) entry.name = name;

  const pres = mutations?.state_append || {};
  entry.present_mutations = {
    physical: typeof pres === "string" ? pres : pres.physical || "",
    non_physical: typeof pres === "string" ? "" : pres.non_physical || "",
  };

  const eternal = mutations?.foundation_consolidated || mutations?.eternal || {};
  entry.eternal_mutations = {
    physical: typeof eternal === "string" ? eternal : eternal.physical || "",
    non_physical: typeof eternal === "string" ? "" : eternal.non_physical || "",
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
    Boolean(entry.present_mutations.physical.trim()) ||
    Boolean(entry.present_mutations.non_physical.trim()) ||
    Boolean(entry.eternal_mutations.physical.trim()) ||
    Boolean(entry.eternal_mutations.non_physical.trim()) ||
    entry.vectors.new.length > 0 ||
    (entry.vectors.retrieval?.length || 0) > 0;

  return has_content ? entry : null;
}

/**
 * Normalizes scored retrieval vectors into the telemetry shape:
 * sorted by `_relevance` descending with high-dimensional embedding arrays stripped.
 *
 * @param {any[]} [vectors=[]] - Array of scored vector records
 * @returns {any[]}
 */
export function build_retrieval(vectors = []) {
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

// ── 2. Dynamics Delta Capture ─────────────────────────────────────────────────

/**
 * Detects changes in entity dynamics, updates reactive state, and logs a telemetry snapshot.
 *
 * @param {any} bridge - Application state bridge
 * @param {any} snapshot - Current turn entity snapshots
 * @param {any} [meta=null] - Additional telemetry metadata
 */
export async function capture_dynamics_delta(bridge, snapshot, meta = null) {
  const deltas = [];
  const log_strings = [];

  if (snapshot.ai?.dynamics) {
    compute_dynamics_deltas("ai", snapshot.ai.dynamics, bridge.runtime.ai, deltas, log_strings);
    if (bridge.runtime.active_ai?.id) {
      await bridge.runtime.update_entity("character", bridge.runtime.active_ai.id, {
        dynamics: { ...snapshot.ai.dynamics },
      });
    }
  }

  if (snapshot.fractal?.dynamics) {
    compute_dynamics_deltas("fractal", snapshot.fractal.dynamics, bridge.runtime.fractal, deltas, log_strings);
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

// ── 3. DevMode Turn Summary ───────────────────────────────────────────────────

/**
 * Builds the per-turn DevMode summary line: which roles produced how many messages.
 *
 * @param {any[]} feed - Recent feed array
 * @param {number} round - Current round index
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
 * CHANGELOG
 * - 2026-08-28: Reconstructed telemetry.js with clean sectioning, top-level compute_dynamics_deltas import, and full JSDoc typings.
 */
