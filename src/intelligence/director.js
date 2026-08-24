import { detox_prose, SIGNATURE_COLORS } from "@data";
import { escape_unescaped_json_quotes, first_sentence, state_bridge } from "@utils";
import { extract_json_block, parse_think_block } from "./parser.js";

/**
 * src/intelligence/director.js
 * 📐 DIRECTOR PAYLOAD NORMALIZATION
 * Pure, dependency-free defensive fallbacks for the expanded Director JSON
 * schema (Phase 2.3 of the director track): speaker delegation, keyword
 * selection, and story-status tracking. Kept separate from kernel.js so the
 * fallback logic is unit-testable in isolation.
 */

export const STORY_STATUS_VALUES = ["IN_PROGRESS", "CONCLUDED", "COLLAPSED"];

export const NEXT_ACTION_VALUES = ["AI_CHARACTER", "FRACTAL", "GENESIS", "EPILOGUE_CONCLUDED", "EPILOGUE_COLLAPSED"];

const SPEAKER_AI_ALIASES = ["ai", "ai_character", "character", "companion"];
const SPEAKER_FRACTAL_ALIASES = ["fractal", "world", "narrator", "environment", "scene"];
const SPEAKER_NPC_PATTERN = /^npc(?::[^\s]+)?$/i;

/**
 * Normalizes a Director `next_action` into its canonical enum or NPC target.
 * Unknown values gracefully fall back to "AI_CHARACTER".
 * @param {any} raw
 * @returns {string}
 */
export function normalize_next_action(raw) {
  if (typeof raw !== "string") return "AI_CHARACTER";
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();

  if (SPEAKER_AI_ALIASES.includes(lower) || upper === "AI_CHARACTER") return "AI_CHARACTER";
  if (SPEAKER_FRACTAL_ALIASES.includes(lower) || upper === "FRACTAL") return "FRACTAL";
  if (upper === "GENESIS") return "GENESIS";
  if (upper === "EPILOGUE_CONCLUDED") return "EPILOGUE_CONCLUDED";
  if (upper === "EPILOGUE_COLLAPSED") return "EPILOGUE_COLLAPSED";
  if (SPEAKER_NPC_PATTERN.test(trimmed)) return trimmed;

  return "AI_CHARACTER";
}

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
 * Sanitizes director's note to 1-3 lines string.
 * @param {any} raw
 * @returns {string}
 */
export function normalize_directors_note(raw) {
  if (typeof raw !== "string") return "";
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);
  return lines.join("\n").slice(0, 300);
}

/**
 * Normalizes an entire Director payload with defensive fallbacks for every
 * schema field. Idempotent and safe on null/non-object input.
 * @param {any} payload
 * @returns {any}
 */
export function normalize_director_data(payload) {
  const base = payload && typeof payload === "object" ? payload : {};
  const keywords = Array.isArray(base.keywords)
    ? base.keywords
        .filter((k) => typeof k === "string" && k.trim())
        .map((k) => k.trim())
        .slice(0, 3)
    : [];

  const raw_action = base.next_action || base.speaker;
  const next_action = normalize_next_action(raw_action);
  const speaker = next_action.startsWith("npc") ? "npc" : next_action === "FRACTAL" ? "fractal" : "ai";
  const npc_id = speaker === "npc" ? strip_npc_id(next_action) : "";

  const story_status =
    next_action === "EPILOGUE_CONCLUDED"
      ? "CONCLUDED"
      : next_action === "EPILOGUE_COLLAPSED"
        ? "COLLAPSED"
        : STORY_STATUS_VALUES.includes(base.story_status)
          ? base.story_status
          : "IN_PROGRESS";

  const directors_note = normalize_directors_note(base.directors_note || base.directive);

  const result = {
    ...base,
    next_action,
    speaker,
    npc_id,
    keywords,
    directors_note,
    story_status,
    in_scene_change: normalize_in_scene_change(base.in_scene_change),
    dynamics_deltas: base.dynamics_deltas || {},
  };

  // Strip legacy fields from Track 1 schema output
  delete result.promotions;
  delete result.relationships;
  delete result.genesis;

  return result;
}

/**
 * Normalizes the Director's relational-web mutations — directed
 * `[Source] → [Target]: [Dynamic]` edges. Only string edges carrying a
 * direction marker survive; count and length are capped defensively so a
 * runaway payload can never bloat an entity's relationships array.
 * @param {any} raw
 * @returns {string[]}
 */
export function normalize_relationships(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const r of raw) {
    if (typeof r !== "string") continue;
    const clean = r.trim().replace(/\s+/g, " ");
    if (!clean || !/→|->|—\s*>/i.test(clean)) continue;
    out.push(clean.slice(0, 160));
    if (out.length >= 6) break;
  }
  return out;
}

/**
 * Normalizes Director genesis requests — brand-new recurring NPCs the kernel
 * should spawn. Ids are NEVER minted here (the kernel assigns them); names and
 * descriptions are sanitized and capped so the model cannot inject junk.
 * @param {any} raw
 * @returns {Array<{ name: string, description: string, role_tier: number, voice_register: string, signature_color: string }>}
 */
export function normalize_genesis(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const g of raw) {
    const base = g && typeof g === "object" ? g : {};
    const name = String(base.name || "")
      .trim()
      .slice(0, 60);
    if (!name) continue;
    const tier = Number(base.role_tier);
    const color = String(base.signature_color || "").trim();
    out.push({
      name,
      description: String(base.description || "")
        .trim()
        .slice(0, 240),
      role_tier: Number.isFinite(tier) ? Math.max(1, Math.min(3, Math.round(tier))) : 1,
      voice_register: String(base.voice_register || "")
        .trim()
        .slice(0, 40),
      // Registry-validated: the model must pick an exact signature color from
      // <AVAILABLE_SIGNATURE_COLORS>, never invent one.
      signature_color: SIGNATURE_COLORS.includes(color) ? color : "",
    });
    if (out.length >= 2) break;
  }
  return out;
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

/**
 * MINIMAL-MUTATION FALLBACK — when the Director JSON could not be parsed even
 * after a terse retry, synthesize just enough mutations that entity memory and
 * dynamics never freeze for a whole turn. Prevents the present/future stall that
 * occurred whenever the Director fell back to raw prose.
 * @param {any} prev_data - the failed parse result (may be undefined).
 * @param {string} input - the user's current input.
 * @param {any} bridge - the state bridge (for runtime entities).
 * @returns {any}
 */
export function synthesize_director_fallback(prev_data, input, bridge) {
  const monologue = String(prev_data?.internal_monologue || input || "").trim();
  const fallback = {
    _parse_error: true,
    internal_monologue: monologue || "The scene continues.",
    trigger_image: "false",
    speaker: "ai",
    keywords: [],
    story_status: "IN_PROGRESS",
  };
  const ai = bridge?.runtime?.active_ai;
  const user = bridge?.runtime?.active_user;
  const fractal = bridge?.runtime?.active_fractal;
  if (ai) {
    fallback.AI_CHARACTER = {
      state_append: { physical: "", non_physical: first_sentence(monologue) || "Reacts to the turn's events." },
      vector_append: [],
    };
  }
  if (user) {
    fallback.USER_PERSONA = {
      state_append: { physical: "", non_physical: first_sentence(input) || "" },
      vector_append: [],
    };
  }
  if (fractal) {
    fallback.FRACTAL = {
      state_append: { physical: "", non_physical: "" },
      vector_append: [{ content: `${fractal.name || "The environment"} shifts with the turn's events.`, type: "past", emotional_weight: 3 }],
    };
  }
  return fallback;
}

/**
 * Scrubs banned somatic idioms out of Director state mutations before they are
 * applied, so clichéd phrases never seed prompt history for future turns
 * (the "Director crutch echo" loop).
 * @param {any} mutations
 * @returns {any}
 */
export function scrub_state_mutations(mutations) {
  if (!mutations || typeof mutations !== "object") return mutations;
  for (const key of ["AI_CHARACTER", "USER_PERSONA", "FRACTAL"]) {
    const m = mutations[key];
    if (m?.state_append && typeof m.state_append === "object") {
      if (typeof m.state_append.physical === "string" && m.state_append.physical.trim()) {
        m.state_append.physical = detox_prose(m.state_append.physical, "plain");
      }
      if (typeof m.state_append.non_physical === "string" && m.state_append.non_physical.trim()) {
        m.state_append.non_physical = detox_prose(m.state_append.non_physical, "plain");
      }
    }
  }
  return mutations;
}

/**
 * Helper to extract Director's JSON from a raw string.
 * @param {string} raw_text
 * @returns {any}
 */
export function parse_director_json(raw_text) {
  if (!raw_text || !raw_text.trim()) return null;

  const json_string = extract_json_block(raw_text);
  if (!json_string) {
    const stripped = raw_text.replace(/```json\n?|```/g, "").trim();
    console.warn("[GameMaster] Director JSON missing brackets, falling back to raw prose.");
    state_bridge.app.log("[GameMaster] Director JSON missing brackets — using raw prose fallback", "warn");
    const extracted_think = parse_think_block(stripped).think;
    return normalize_director_data({ internal_monologue: extracted_think || stripped, _parse_error: true });
  }

  const cleaned_json = escape_unescaped_json_quotes(json_string);
  const sanitized_json = cleaned_json.replace(/:\s*\+([0-9]+(?:\.[0-9]+)?)/g, ": $1");

  try {
    const payload = JSON.parse(sanitized_json);
    if (payload.prose) {
      delete payload.prose;
    }
    return normalize_director_data(payload);
  } catch (parse_err) {
    console.warn("[GameMaster] Director JSON invalid, falling back to raw prose:", parse_err);
    const stripped = raw_text.replace(/```json\n?|```/g, "").trim();
    const extracted_think = parse_think_block(stripped).think;
    return normalize_director_data({ internal_monologue: extracted_think || stripped, _parse_error: true });
  }
}
