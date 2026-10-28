/**
 * src/ui/message/telemetry-format.js
 * 🔭 TELEMETRY FORMATTERS
 * Pure helpers that turn Director/continuum metadata (DYNAMICS_DELTA, telemetry
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
 * @param {{ active_ai?: any, active_user?: any, active_fractal?: any, active_npcs?: Record<string, any> }} [runtime]
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
  if (resolver) return resolver();
  if (runtime?.active_npcs?.[key]?.name) {
    return runtime.active_npcs[key].name;
  }
  return String(key ?? "");
}

/**
 * Derives the title label for a telemetry card based on event type and metadata.
 * @param {any} meta
 * @param {{ active_ai?: any, active_user?: any, active_fractal?: any, active_npcs?: Record<string, any> }} [runtime]
 * @returns {string}
 */
export function get_telemetry_label(meta, runtime) {
  if (meta?.type === "MEMORY_FORMATION" || meta?.type === "CONTINUUM_FORMATION") {
    const name = resolve_entity_name(meta.target, runtime);
    const turns = meta.turns_count ? ` from ${meta.turns_count} turns` : "";
    return `${name} — Back Shot${turns}`;
  }
  if (meta?.type === "VECTOR_RESOLUTION") {
    return "Past Vector Resolved";
  }
  return "Quick Shot";
}

export function vector_label(type, fallback = "past") {
  if (type == null) return fallback === "memory" || fallback === "past" ? "PAST" : fallback.toUpperCase();
  const t = String(type).toUpperCase();
  if (t === "PAST" || t === "MEMORY") return "PAST";
  if (t === "FUTURE" || t === "AGENDUM") return "FUTURE";
  if (t === "PRESENT") return "PRESENT";
  if (t === "ETERNAL") return "ETERNAL";
  return t;
}

/**
 * Cleans comma debris, double commas, and leading/trailing punctuation from prose strings.
 * @param {any} text
 * @returns {string}
 */
export function clean_text_debris(text) {
  if (text == null) return "";
  let s = String(text).trim();
  // Strip leading commas, semicolons and whitespace
  s = s.replace(/^[\s,;]+/g, "");
  // Replace multiple commas with a single comma
  s = s.replace(/,(\s*,)+/g, ",");
  // Strip trailing commas, semicolons and whitespace (preserve closing periods)
  s = s.replace(/[\s,;]+$/g, "");
  return s.trim();
}

/**
 * Parses a directed relationship edge string or object into a structured object.
 * Returns null if the edge is invalid, empty, or cannot be parsed.
 * @param {any} edge
 * @returns {{ source: string, target: string, dynamic: string } | null}
 */
export function parse_relationship_edge(edge) {
  if (!edge) return null;
  if (typeof edge === "object") {
    const source = String(edge.source || "").trim();
    const target = String(edge.target || "").trim();
    const dynamic = String(edge.dynamic ?? edge.content ?? "").trim();
    if (!source && !target && !dynamic) return null;
    return { source: source || "Entity", target: target || "Target", dynamic };
  }
  if (typeof edge === "string") {
    const match = String(edge).match(/^\s*(.+?)\s*(?:→|->|—>\s*)\s*(.+?)\s*:\s*(.+)$/);
    if (!match) return null;
    const [, source, target, dynamic] = match;
    const s = source.trim();
    const t = target.trim();
    const d = dynamic.trim();
    if (!s && !t && !d) return null;
    return { source: s || "Entity", target: t || "Target", dynamic: d };
  }
  return null;
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
      content: clean_text_debris(v.content),
    }));

    const retrieval = (Array.isArray(raw.vectors?.retrieval) ? raw.vectors.retrieval : []).map((v) => ({
      type: v.type,
      id: v.id,
      content: clean_text_debris(v.content),
      relevance: v._relevance,
    }));

    const physical = clean_text_debris(raw.present_mutations?.physical ?? "");
    const non_physical = clean_text_debris(raw.present_mutations?.non_physical ?? "");
    const eternal_physical = clean_text_debris(raw.eternal_mutations?.physical ?? "");
    const eternal_non_physical = clean_text_debris(raw.eternal_mutations?.non_physical ?? "");
    const has_mods = !!eternal_physical || !!eternal_non_physical;
    const raw_relationships = Array.isArray(raw.relationships)
      ? raw.relationships
      : Array.isArray(meta?.relationships) && ((meta.consolidated_entity ?? meta.forged_entity) === block_key || meta.target === key)
        ? meta.relationships
        : [];
    const relationships = raw_relationships
      .map(parse_relationship_edge)
      .filter((r) => r !== null && (r.source !== "Entity" || r.target !== "Target" || r.dynamic));

    if (
      !dynamics.length &&
      !new_vectors.length &&
      !retrieval.length &&
      !physical &&
      !non_physical &&
      !eternal_physical &&
      !eternal_non_physical &&
      !relationships.length
    ) {
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
      relationships,
      has_mods,
    });
  }
  return blocks;
}
