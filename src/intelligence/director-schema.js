/**
 * src/intelligence/director-schema.js
 * 📐 DIRECTOR PAYLOAD NORMALIZATION
 * Pure, dependency-free defensive fallbacks for the expanded Director JSON
 * schema (Phase 2.3 of the director track): speaker delegation, keyword
 * selection, and story-status tracking. Kept separate from kernel.js so the
 * fallback logic is unit-testable in isolation.
 */

export const STORY_STATUS_VALUES = ["IN_PROGRESS", "CONCLUDED", "COLLAPSED"];

const SPEAKER_AI_ALIASES = ["ai", "ai_character", "character", "companion"];
const SPEAKER_FRACTAL_ALIASES = ["fractal", "world", "narrator", "environment", "scene"];
const SPEAKER_NPC_PATTERN = /^npc(?::[^\s]+)?$/i;

/**
 * Coerces a raw Director `speaker` value into the canonical delegation target.
 * Unknown/empty values always degrade to "ai" so a broken payload can never
 * strand a turn without an executor.
 * @param {any} raw
 * @returns {"ai" | "fractal" | "npc"}
 */
export function normalize_speaker(raw) {
  if (typeof raw !== "string") return "ai";
  const value = raw.trim().toLowerCase();
  if (SPEAKER_AI_ALIASES.includes(value)) return "ai";
  if (SPEAKER_FRACTAL_ALIASES.includes(value)) return "fractal";
  if (SPEAKER_NPC_PATTERN.test(value)) return "npc";
  return "ai";
}

/**
 * Normalizes an entire Director payload with defensive fallbacks for every
 * new schema field. Idempotent and safe on null/non-object input.
 * @param {any} payload
 * @returns {any}
 */
export function normalize_director_data(payload) {
  const base = payload && typeof payload === "object" ? payload : {};
  const keywords = Array.isArray(base.keywords)
    ? base.keywords
        .filter((k) => typeof k === "string" && k.trim())
        .map((k) => k.trim())
        .slice(0, 2)
    : [];
  const story_status = STORY_STATUS_VALUES.includes(base.story_status) ? base.story_status : "IN_PROGRESS";
  const speaker = normalize_speaker(base.speaker);
  // Preserve the delegated NPC's id (`npc:ben1` → `ben1`) so the kernel can
  // resolve the entity after speaker normalization collapses it to "npc".
  // Idempotent under re-normalization: a bare "npc" speaker (colon already
  // stripped) falls back to any previously-preserved npc_id instead of
  // clobbering it with the literal "npc" string.
  const raw_speaker = typeof base.speaker === "string" ? base.speaker : "";
  const npc_id =
    speaker === "npc" ? (raw_speaker.includes(":") ? strip_npc_id(raw_speaker) : base.npc_id || "") : "";
  return {
    ...base,
    speaker,
    npc_id,
    keywords,
    story_status,
    in_scene_change: normalize_in_scene_change(base.in_scene_change),
    promotions: normalize_promotions(base.promotions),
  };
}

/**
 * Maps a normalized speaker target onto the engine that executes the turn.
 * @param {"ai" | "fractal" | "npc"} [speaker]
 * @returns {"character" | "narrator" | "npc"}
 */
export function resolve_speaker_engine(speaker = "ai") {
  if (speaker === "fractal") return "narrator";
  if (speaker === "npc") return "npc";
  return "character";
}

/**
 * Strips the `npc:` prefix so a delegated speaker or cast id always resolves
 * to a bare entity id.
 * @param {any} id
 * @returns {string}
 */
export function strip_npc_id(id) {
  if (typeof id !== "string") return "";
  return id.replace(/^npc:/i, "").trim();
}

/**
 * Cleans an array of NPC ids (enter/exit lists).
 * @param {any} list
 * @returns {string[]}
 */
function clean_npc_list(list) {
  return (Array.isArray(list) ? list : []).map(strip_npc_id).filter(Boolean);
}

/**
 * Normalizes the Director's Stage Spotlight choreography.
 * @param {any} raw
 * @returns {{ enter: string[], exit: string[] }}
 */
export function normalize_in_scene_change(raw) {
  const base = raw && typeof raw === "object" ? raw : {};
  return { enter: clean_npc_list(base.enter), exit: clean_npc_list(base.exit) };
}

/**
 * Normalizes Director promotions (genesis tier bumps) to a canonical list of
 * `{ id, tier }` (tier clamped to 2|3 — tier 1 is the ephemeral default).
 * @param {any} raw
 * @returns {Array<{ id: string, tier: 2 | 3 }>}
 */
export function normalize_promotions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      if (typeof p === "string") return { id: strip_npc_id(p), tier: 2 };
      const id = strip_npc_id(p?.id ?? p?.npc_id);
      const tier = Number(p?.tier);
      // Clamp to the canonical 2|3 range: anything at-or-below tier 1 (the
      // ephemeral default) promotes to recurring; anything above 3 caps at major.
      const clamped = Number.isFinite(tier) ? Math.max(2, Math.min(3, Math.round(tier))) : 2;
      return { id, tier: /** @type {2 | 3} */ (clamped) };
    })
    .filter((p) => p.id);
}
