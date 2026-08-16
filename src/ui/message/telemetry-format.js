/**
 * src/ui/message/telemetry-format.js
 * 📊 TELEMETRY DISPLAY FORMATTING
 * Pure normalization/formatting for the per-turn telemetry feed
 * (TelemetryCard, TelemetryBlocks, TelemetryVector). Converts the kernel's
 * `{ type, updates }` payload (built by @intelligence/telemetry.js) into the
 * blocks the feed renders, resolves entity keys to display names, and formats
 * memory/vector type labels.
 */

/**
 * CANONICAL TELEMETRY META SHAPE
 * The `meta` prop TelemetryCard receives after each turn:
 * @typedef {Object} TelemetryMeta
 * @property {string} [type] - The type of telemetry event (STORY_START | DYNAMICS_DELTA | MEMORY_FORMATION | VECTOR_RESOLUTION | ...).
 * @property {Object} [updates] - Per-entity state updates ({ AI_CHARACTER | USER_PERSONA | FRACTAL: { name, present_mutations, eternal_mutations, vectors, dynamics } }).
 * @property {string} [thoughts] - Director think content (markdown; leading `##` headings stripped for display).
 * @property {boolean} [trigger_image] - Whether image generation was triggered this tick.
 * @property {boolean} [image_trigger] - Whether an image beat fired this tick (dynamics gate OR director).
 * @property {string} [image_tier] - The active 4-tier image target (story_entities | story_character | solo_entity | story_scene).
 * @property {string} [image_source] - Which source fired the trigger ("dynamics" | "director").
 * @property {Object} [image_signals] - Dynamics-gate signal details (band_entry, displacement).
 * @property {Object} [vectors] - Forged memory vectors for MEMORY_FORMATION events.
 * @property {string} [target] - Entity key targeted by a MEMORY_FORMATION event.
 * @property {string} [future] - Rewritten standing trajectory for MEMORY_FORMATION events.
 * @property {Object} [present] - Consolidated present conditions for MEMORY_FORMATION events.
 * @property {Object} [eternal] - Consolidated eternal attributes for MEMORY_FORMATION events.
 * @property {string} [thought_process] - Thought process for MEMORY_FORMATION events.
 * @property {number} [turns_count] - Turns consolidated by a MEMORY_FORMATION event.
 * @property {Object} [vector] - Resolved vector detail for VECTOR_RESOLUTION events.
 * @property {string} [resolution] - Resolution summary for VECTOR_RESOLUTION events.
 */

/** Maps the kernel's update keys to the block's canonical display key. */
const UPDATE_TARGETS = { ai: "AI_CHARACTER", fractal: "FRACTAL", user: "USER_PERSONA" };

/**
 * Normalizes one entity's raw update entry into the renderable block shape.
 * Returns null when the entry carries nothing to render (lean feed).
 * @param {string} key - canonical block key ('ai' | 'fractal' | 'user')
 * @param {any} upd - the raw entry under AI_CHARACTER / USER_PERSONA / FRACTAL
 * @returns {any | null}
 */
function build_entity_block(key, upd) {
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
  if (!has_dynamics && !has_mods) return null;
  return {
    key,
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
  };
}

/**
 * Canonical telemetry normalization for the `{ type, updates }` event shape,
 * producing the per-entity blocks rendered by TelemetryCard.
 * @param {any} meta
 * @returns {any[]}
 */
export function process_entity_blocks(meta = {}) {
  if (!meta.updates || typeof meta.updates !== "object") return [];
  const blocks = [];
  for (const [target, mutation_key] of Object.entries(UPDATE_TARGETS)) {
    const upd = meta.updates[mutation_key];
    if (!upd) continue;
    const block = build_entity_block(target, upd);
    if (block) blocks.push(block);
  }
  return blocks;
}

/**
 * Resolves a telemetry entity key to its display name from the runtime state.
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
 * Human-readable memory/vector type label (e.g. "future" → "FUTURE VECTOR").
 * @param {string} [type]
 * @param {string} [fallback]
 */
export function vector_label(type, fallback) {
  const t = type || fallback;
  if (t === "future") return "FUTURE VECTOR";
  if (t === "past") return "PAST MEMORY";
  return String(t).toUpperCase();
}
